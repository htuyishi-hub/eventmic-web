import { generateSessionCode, getOrCreateAttendeeId } from '../lib/ids.js';
import {
  generate6DigitPin,
  sortQueue,
  recordSpeakHistoryEnd,
  isFairModeActive,
  VALID_REASONS
} from './mockFloorManager.js';

const HOST_STORAGE_KEY = 'eventmic_host_session';
const DEFAULT_CHANNEL = 'eventmic';
const HEARTBEAT_INTERVAL_MS = 3000;
const HEARTBEAT_TIMEOUT_MS = 8000;
const DISCONNECT_TIMEOUT_MS = 30000;
const MAX_ATTENDEES = 200;

export class MockTransport {
  constructor(options = {}) {
    this.channelName = options.channelName || DEFAULT_CHANNEL;
    this.channel = null;
    this.role = null; // 'admin' | 'principal' | 'attendee' | 'host'
    this.code = null;
    this.name = null;
    this.myId = options.id || getOrCreateAttendeeId();
    this.broadcastDelay = options.broadcastDelay !== undefined ? options.broadcastDelay : null;

    // Event listeners: Map<eventName, Set<Function>>
    this.listeners = new Map();

    // State
    this.connectionState = 'disconnected';
    this.session = null;
    this.queue = [];
    this.floor = null;
    this.isMuted = false;
    this.selfState = 'listening';

    // Part A state
    this.principals = new Map(); // id -> { id, name, pin, createdAt }
    this.principalQueue = []; // [{ id, name, requestedAt }]
    this.floorAllow = null; // { principalId, expiresAt }
    this.speakHistory = new Map(); // id -> { id, name, count, totalSeconds, lastSpokeAt, history: [] }
    this.settings = { fairMode: 'off', fairFromMinutesBeforeEnd: 15, sessionEndsAt: null };

    // Host/Admin-specific state
    this.attendees = new Map(); // id -> { id, name, lastSeen }
    this.heartbeatTimer = null;
    this.cleanerTimer = null;

    // Attendee/Principal watcher state
    this.lastHostSeen = 0;
    this.hostWatchTimer = null;
    this.attendeeHeartbeatTimer = null;
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
    return () => {
      const set = this.listeners.get(event);
      if (set) set.delete(handler);
    };
  }

  emit(event, data) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((handler) => {
        try {
          handler(data);
        } catch (err) {
          console.error(`[MockTransport] Handler error on '${event}':`, err);
        }
      });
    }
  }

  setConnectionState(state) {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.emit('connection', state);
    }
  }

  delayedDispatch(fn, customDelay) {
    let delay = customDelay;
    if (this.broadcastDelay !== null) {
      delay = this.broadcastDelay;
    } else if (delay === undefined) {
      delay = Math.floor(Math.random() * 100) + 50;
    }
    setTimeout(fn, delay);
  }

  ensureChannel() {
    if (!this.channel) {
      this.channel = new BroadcastChannel(this.channelName);
      this.channel.onmessage = (event) => this.handleMessage(event.data);
    }
  }

  async createSession({ name }) {
    this.role = 'admin';
    this.ensureChannel();

    const code = generateSessionCode();
    const session = {
      code,
      name: name.trim(),
      status: 'live',
      createdAt: Date.now()
    };

    this.session = session;
    this.code = code;
    this.queue = [];
    this.floor = null;
    this.principals.clear();
    this.principalQueue = [];
    this.floorAllow = null;
    this.speakHistory.clear();
    this.settings = { fairMode: 'off', fairFromMinutesBeforeEnd: 15, sessionEndsAt: null };
    this.attendees.clear();
    this.isMuted = false;

    this.saveHostSession();
    this.setConnectionState('connected');
    this.startHostTimers();

    this.broadcastState();
    this.emit('session', session);
    this.emit('queue', this.queue);
    this.emit('floor', this.floor);
    this.emit('principals', []);
    this.emit('principalQueue', []);
    this.emit('attendees', { count: 0 });

    return session;
  }

  restoreHostSession() {
    try {
      const saved = localStorage.getItem(HOST_STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && parsed.session && parsed.session.status === 'live') {
        return parsed;
      }
    } catch {}
    return null;
  }

  async connect({ role, code, name, pin, passcode }) {
    let normalizedRole = role === 'host' ? 'admin' : role;
    this.role = normalizedRole;
    this.code = code ? code.trim().toUpperCase() : '';
    this.name = name ? name.trim() : '';
    this.ensureChannel();
    this.setConnectionState('connecting');

    if (this.role === 'admin') {
      const saved = this.restoreHostSession();
      if (saved && saved.session.code === this.code) {
        this.session = saved.session;
        this.queue = saved.queue || [];
        this.floor = saved.floor || null;
        if (Array.isArray(saved.principals)) {
          this.principals = new Map(saved.principals.map(p => [p.id, p]));
        }
        if (saved.settings) this.settings = saved.settings;
      } else {
        this.session = {
          code: this.code,
          name: this.name || 'Live Event',
          status: 'live',
          createdAt: Date.now()
        };
        this.queue = [];
        this.floor = null;
      }
      this.saveHostSession();
      this.setConnectionState('connected');
      this.startHostTimers();
      this.broadcastState();
      this.emit('session', this.session);
      this.emit('queue', sortQueue(this.queue, this.speakHistory, isFairModeActive(this.settings)));
      this.emit('floor', this.floor);
      this.emit('principals', Array.from(this.principals.values()));
      this.emit('principalQueue', this.principalQueue);
      this.emit('attendees', { count: this.attendees.size });
      return;
    }

    if (this.role === 'principal') {
      if (!this.myId || !this.myId.startsWith('prin-')) {
        this.myId = 'prin-' + Math.random().toString(36).substring(2, 9);
      }
      this.lastHostSeen = Date.now();
      this.startAttendeeWatchers();

      this.delayedDispatch(() => {
        this.postToChannel({
          type: 'principal_hello',
          code: this.code,
          id: this.myId,
          name: this.name,
          pin
        });
      }, 50);
      return;
    }

    // Attendee connection
    this.lastHostSeen = Date.now();
    this.startAttendeeWatchers();

    this.delayedDispatch(() => {
      this.postToChannel({
        type: 'attendee_hello',
        code: this.code,
        id: this.myId,
        name: this.name
      });
    }, 50);
  }

  async disconnect() {
    if (this.code) {
      if (this.role === 'attendee') {
        this.postToChannel({ type: 'attendee_bye', code: this.code, id: this.myId });
      } else if (this.role === 'principal') {
        this.postToChannel({ type: 'principal_bye', code: this.code, id: this.myId });
      }
    }

    this.stopTimers();
    if (this.channel) {
      try { this.channel.close(); } catch {}
      this.channel = null;
    }

    this.setConnectionState('disconnected');
  }

  async endSession() {
    if ((this.role !== 'admin' && this.role !== 'host') || !this.session) return;

    this.session.status = 'ended';
    this.floor = null;
    this.queue = [];
    this.saveHostSession();

    this.postToChannel({
      type: 'session_ended',
      code: this.code,
      session: this.session
    });

    this.emit('session', this.session);
    this.emit('floor', null);
    this.emit('queue', []);
    this.stopTimers();
  }

  async raiseHand(options = {}) {
    if (this.role !== 'attendee' || !this.code) return;
    const reason = options.reason || 'question';
    this.postToChannel({
      type: 'attendee_raise',
      code: this.code,
      id: this.myId,
      name: this.name,
      reason
    });
  }

  async lowerHand() {
    if (this.role !== 'attendee' || !this.code) return;
    this.postToChannel({
      type: 'attendee_lower',
      code: this.code,
      id: this.myId
    });
  }

  async takeFloor() {
    if (this.role !== 'admin' && this.role !== 'host' && this.role !== 'principal') {
      throw new Error('Only admin or principal can take floor');
    }

    if (this.isAdmin) {
      this._executeTakeFloor('admin', this.myId, this.name || 'Admin');
    } else {
      this.postToChannel({
        type: 'take_floor',
        code: this.code,
        callerRole: this.role,
        callerId: this.myId,
        callerName: this.name || 'Speaker'
      });
    }
  }

  async requestSpeak() {
    if (this.role !== 'principal' || !this.code) return;
    this.postToChannel({
      type: 'request_speak',
      code: this.code,
      callerId: this.myId,
      callerName: this.name || 'Speaker'
    });
  }

  async allowPrincipal(principalId) {
    if (this.isAdmin) {
      this._executeAllowPrincipal(principalId);
    } else {
      this.postToChannel({
        type: 'allow_principal',
        code: this.code,
        callerId: this.myId,
        callerRole: this.role,
        targetPrincipalId: principalId
      });
    }
  }

  async grant(attendeeId) {
    if (!attendeeId) return;
    if (this.isAdmin) {
      this._executeGrant(attendeeId, this.role, this.myId);
    } else {
      this.postToChannel({
        type: 'grant_floor',
        code: this.code,
        callerId: this.myId,
        callerRole: this.role,
        attendeeId
      });
    }
  }

  async revoke(attendeeId) {
    if (this.isAdmin) {
      this._executeRevoke(attendeeId);
    } else {
      this.postToChannel({
        type: 'revoke_floor',
        code: this.code,
        callerId: this.myId,
        callerRole: this.role,
        attendeeId
      });
    }
  }

  async muteSpeaker(muted) {
    this.isMuted = !!muted;
    this.postToChannel({
      type: 'speaker_muted',
      code: this.code,
      muted: this.isMuted
    });
  }

  async sendLevel(level) {
    if (!this.code) return;
    const clamped = Math.min(1, Math.max(0, level));
    this.postToChannel({
      type: 'attendee_level',
      code: this.code,
      id: this.myId,
      level: clamped
    });
  }

  async createPrincipal(name) {
    const pin = generate6DigitPin();
    const id = 'prin-' + Math.random().toString(36).substring(2, 9);
    const principal = { id, name: name.trim(), pin, createdAt: Date.now() };

    this.principals.set(id, principal);
    this.saveHostSession();
    this.broadcastState();
    this.emit('principals', Array.from(this.principals.values()));
    return principal;
  }

  async getPrincipals() {
    return Array.from(this.principals.values());
  }

  async revokePrincipal(id) {
    this.principals.delete(id);
    this.saveHostSession();
    this.broadcastState();
    this.emit('principals', Array.from(this.principals.values()));
  }

  async regeneratePrincipalPin(id) {
    const p = this.principals.get(id);
    if (!p) throw new Error('Principal not found');
    p.pin = generate6DigitPin();
    this.saveHostSession();
    this.broadcastState();
    this.emit('principals', Array.from(this.principals.values()));
    return p.pin;
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveHostSession();
    this.broadcastState();
    const sorted = sortQueue(this.queue, this.speakHistory, isFairModeActive(this.settings));
    this.emit('queue', sorted);
    this.emit('fairMode', isFairModeActive(this.settings));
  }

  async fetchSessionState() {
    const sortedQueue = sortQueue(this.queue, this.speakHistory, isFairModeActive(this.settings));
    const allAttendees = Array.from(this.attendees.values()).map(a => {
      const hist = this.speakHistory.get(a.id);
      let state = 'listening';
      if (this.floor?.id === a.id) state = 'speaking';
      else if (this.queue.some(q => q.id === a.id)) state = 'hand_raised';
      return {
        id: a.id,
        name: a.name,
        state,
        timesSpoken: hist?.count || 0,
        lastSpokeAt: hist?.lastSpokeAt || null
      };
    });

    const spokeHistory = Array.from(this.speakHistory.values()).flatMap(s =>
      (s.history || []).map(h => ({
        id: s.id,
        name: s.name,
        startedAt: h.startedAt,
        durationSeconds: h.durationSeconds,
        reason: h.reason
      }))
    ).sort((a, b) => b.startedAt - a.startedAt);

    return {
      code: this.code,
      name: this.session?.name,
      status: this.session?.status,
      floor: this.floor,
      principalQueue: this.principalQueue || [],
      queue: sortedQueue,
      allAttendees,
      spokeHistory,
      principals: Array.from(this.principals.values()),
      settings: this.settings,
      fairModeActive: isFairModeActive(this.settings),
      floorAllow: this.floorAllow
    };
  }

  get isAdmin() {
    return this.role === 'admin' || this.role === 'host';
  }

  // -------------------------------------------------------------
  // Internal Floor Execution (Authoritative on Host/Admin)
  // -------------------------------------------------------------

  _executeTakeFloor(role, callerId, callerName) {
    const current = this.floor;
    if (current && current.id === callerId) return;

    if (current) {
      recordSpeakHistoryEnd(this.speakHistory, current.id, current.name, current.startedAt, current.reason);
      if (current.role === 'attendee') {
        this.postToChannel({
          type: 'floor_preempted',
          targetId: current.id,
          reason: 'The speaker is taking the floor'
        });
      }
    }

    this.floor = {
      id: callerId,
      name: callerName,
      role: role === 'admin' || role === 'host' ? 'admin' : 'principal',
      startedAt: Date.now(),
      mode: 'principal'
    };

    this.principalQueue = this.principalQueue.filter(p => p.id !== callerId);
    this.saveHostSession();
    this.broadcastState();
    this.emit('floor', this.floor);
    this.emit('principalQueue', this.principalQueue);
  }

  _executeAllowPrincipal(targetPrincipalId) {
    this.floorAllow = {
      principalId: targetPrincipalId,
      expiresAt: Date.now() + 60000
    };
    this.principalQueue = this.principalQueue.filter(p => p.id !== targetPrincipalId);
    this.saveHostSession();
    this.broadcastState();
    this.emit('principalQueue', this.principalQueue);
  }

  _executeGrant(attendeeId, callerRole, callerId) {
    if (callerRole === 'principal' && this.floor?.id !== callerId) {
      throw new Error('Only the current speaker holding the floor or admin may grant floor');
    }

    const queuedIdx = this.queue.findIndex(item => item.id === attendeeId);
    let targetAttendee = null;

    if (queuedIdx !== -1) {
      targetAttendee = this.queue[queuedIdx];
      this.queue.splice(queuedIdx, 1);
    } else if (this.attendees.has(attendeeId)) {
      targetAttendee = this.attendees.get(attendeeId);
    }

    if (!targetAttendee) return;

    if (this.floor) {
      recordSpeakHistoryEnd(this.speakHistory, this.floor.id, this.floor.name, this.floor.startedAt, this.floor.reason);
    }

    this.floor = {
      id: targetAttendee.id,
      name: targetAttendee.name,
      role: 'attendee',
      startedAt: Date.now(),
      mode: 'attendee',
      reason: targetAttendee.reason || 'question'
    };

    this.saveHostSession();
    this.broadcastState();
    this.emit('floor', this.floor);
    const sorted = sortQueue(this.queue, this.speakHistory, isFairModeActive(this.settings));
    this.emit('queue', sorted);
  }

  _executeRevoke(attendeeId) {
    if (!this.floor) return;
    if (!attendeeId || this.floor.id === attendeeId) {
      recordSpeakHistoryEnd(this.speakHistory, this.floor.id, this.floor.name, this.floor.startedAt, this.floor.reason);
      this.floor = null;
      this.saveHostSession();
      this.broadcastState();
      this.emit('floor', null);
    }
  }

  // -------------------------------------------------------------
  // Channel Messaging
  // -------------------------------------------------------------

  postToChannel(msg) {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (err) {
        console.error('[MockTransport] Failed to post message:', err);
      }
    }
  }

  handleMessage(msg) {
    if (!msg || typeof msg !== 'object') return;

    if (this.isAdmin) {
      this.handleHostMessage(msg);
    } else {
      this.handleClientMessage(msg);
    }
  }

  handleHostMessage(msg) {
    if (msg.code && this.session && msg.code !== this.session.code) {
      if (msg.type === 'attendee_hello' || msg.type === 'principal_hello') {
        this.postToChannel({
          type: 'host_error',
          targetId: msg.id,
          code: 'INVALID_CODE',
          message: `Session code ${msg.code} does not exist.`
        });
      }
      return;
    }

    const now = Date.now();

    switch (msg.type) {
      case 'principal_hello': {
        const principal = Array.from(this.principals.values()).find(p => p.pin === msg.pin);
        if (!principal) {
          this.postToChannel({
            type: 'host_error',
            targetId: msg.id,
            code: 'UNAUTHORIZED',
            message: 'Invalid principal PIN'
          });
          return;
        }

        this.delayedDispatch(() => {
          this.postToChannel({
            type: 'host_sync_target',
            targetId: msg.id,
            session: this.session,
            queue: sortQueue(this.queue, this.speakHistory, isFairModeActive(this.settings)),
            floor: this.floor,
            isMuted: this.isMuted,
            principals: Array.from(this.principals.values()),
            principalQueue: this.principalQueue,
            settings: this.settings,
            fairModeActive: isFairModeActive(this.settings)
          });
        });
        break;
      }

      case 'attendee_hello': {
        if (!this.session || this.session.status === 'ended') {
          this.postToChannel({
            type: 'host_error',
            targetId: msg.id,
            code: 'SESSION_ENDED',
            message: 'This session has already ended.'
          });
          return;
        }

        if (this.attendees.size >= MAX_ATTENDEES && !this.attendees.has(msg.id)) {
          this.postToChannel({
            type: 'host_error',
            targetId: msg.id,
            code: 'FULL',
            message: 'Session is full (maximum 200 attendees reached).'
          });
          return;
        }

        this.attendees.set(msg.id, {
          id: msg.id,
          name: msg.name || 'Anonymous',
          lastSeen: now
        });

        this.emit('attendees', { count: this.attendees.size });

        this.delayedDispatch(() => {
          this.postToChannel({
            type: 'host_sync_target',
            targetId: msg.id,
            session: this.session,
            queue: sortQueue(this.queue, this.speakHistory, isFairModeActive(this.settings)),
            floor: this.floor,
            isMuted: this.isMuted,
            principals: Array.from(this.principals.values()),
            principalQueue: this.principalQueue,
            settings: this.settings,
            fairModeActive: isFairModeActive(this.settings)
          });
        });
        break;
      }

      case 'attendee_heartbeat': {
        if (this.attendees.has(msg.id)) {
          this.attendees.get(msg.id).lastSeen = now;
        }
        break;
      }

      case 'attendee_bye': {
        this.removeAttendee(msg.id);
        break;
      }

      case 'principal_bye': {
        this.principalQueue = this.principalQueue.filter(p => p.id !== msg.id);
        if (this.floor && this.floor.id === msg.id) {
          this._executeRevoke(msg.id);
        }
        this.broadcastState();
        break;
      }

      case 'attendee_raise': {
        if (this.session && this.session.status === 'live') {
          const alreadyQueued = this.queue.some(item => item.id === msg.id);
          const isCurrentSpeaker = this.floor && this.floor.id === msg.id;

          if (!alreadyQueued && !isCurrentSpeaker) {
            this.queue.push({
              id: msg.id,
              name: msg.name || (this.attendees.get(msg.id)?.name || 'Attendee'),
              reason: msg.reason || 'question',
              raisedAt: now
            });
            this.saveHostSession();
            this.broadcastState();
            const sorted = sortQueue(this.queue, this.speakHistory, isFairModeActive(this.settings));
            this.emit('queue', sorted);
          }
        }
        break;
      }

      case 'attendee_lower': {
        const initialLen = this.queue.length;
        this.queue = this.queue.filter(item => item.id !== msg.id);

        let floorChanged = false;
        if (this.floor && this.floor.id === msg.id) {
          recordSpeakHistoryEnd(this.speakHistory, this.floor.id, this.floor.name, this.floor.startedAt, this.floor.reason);
          this.floor = null;
          floorChanged = true;
        }

        if (this.queue.length !== initialLen || floorChanged) {
          this.saveHostSession();
          this.broadcastState();
          if (this.queue.length !== initialLen) {
            const sorted = sortQueue(this.queue, this.speakHistory, isFairModeActive(this.settings));
            this.emit('queue', sorted);
          }
          if (floorChanged) this.emit('floor', null);
        }
        break;
      }

      case 'take_floor': {
        if (msg.callerRole === 'principal') {
          if (this.floor && this.floor.role === 'principal' && this.floor.id !== msg.callerId) {
            const allowed = this.floorAllow && this.floorAllow.principalId === msg.callerId && Date.now() < this.floorAllow.expiresAt;
            if (!allowed) {
              this.postToChannel({
                type: 'host_error',
                targetId: msg.callerId,
                code: 'FORBIDDEN',
                message: 'Floor is held by another speaker. Request to speak instead.'
              });
              return;
            }
            this.floorAllow = null;
          }
        }
        this._executeTakeFloor(msg.callerRole, msg.callerId, msg.callerName);
        break;
      }

      case 'request_speak': {
        if (!this.principalQueue.some(p => p.id === msg.callerId)) {
          this.principalQueue.push({ id: msg.callerId, name: msg.callerName, requestedAt: now });
          this.saveHostSession();
          this.broadcastState();
          this.emit('principalQueue', this.principalQueue);
        }
        break;
      }

      case 'allow_principal': {
        this._executeAllowPrincipal(msg.targetPrincipalId);
        break;
      }

      case 'grant_floor': {
        try {
          this._executeGrant(msg.attendeeId, msg.callerRole, msg.callerId);
        } catch (err) {
          this.postToChannel({
            type: 'host_error',
            targetId: msg.callerId,
            code: 'FORBIDDEN',
            message: err.message
          });
        }
        break;
      }

      case 'revoke_floor': {
        this._executeRevoke(msg.attendeeId);
        break;
      }

      case 'attendee_level': {
        if (this.floor && this.floor.id === msg.id) {
          this.emit('level', this.isMuted ? 0 : msg.level);
        }
        break;
      }
    }
  }

  handleClientMessage(msg) {
    switch (msg.type) {
      case 'host_error': {
        if (msg.targetId === this.myId) {
          this.emit('error', { code: msg.code, message: msg.message });
          this.setConnectionState('disconnected');
        }
        break;
      }

      case 'floor_preempted': {
        if (msg.targetId === this.myId) {
          this.emit('preempted', msg.reason || 'The speaker is taking the floor');
          this.selfState = 'listening';
          this.emit('self', 'listening');
        }
        break;
      }

      case 'host_sync_target': {
        if (msg.targetId === this.myId) {
          this.lastHostSeen = Date.now();
          this.setConnectionState('connected');
          this.session = msg.session;
          this.queue = msg.queue || [];
          this.floor = msg.floor || null;
          this.isMuted = !!msg.isMuted;
          this.principals = new Map((msg.principals || []).map(p => [p.id, p]));
          this.principalQueue = msg.principalQueue || [];
          this.settings = msg.settings || this.settings;
          this.emit('session', this.session);
          this.emit('queue', this.queue);
          this.emit('floor', this.floor);
          this.emit('principals', Array.from(this.principals.values()));
          this.emit('principalQueue', this.principalQueue);
          this.emit('fairMode', !!msg.fairModeActive);
          this.updateSelfState();
        }
        break;
      }

      case 'host_state':
      case 'host_heartbeat': {
        if (msg.session && msg.session.code === this.code) {
          this.lastHostSeen = Date.now();
          if (this.connectionState !== 'connected') {
            this.setConnectionState('connected');
          }

          this.session = msg.session;
          this.queue = msg.queue || [];
          this.floor = msg.floor || null;
          this.isMuted = !!msg.isMuted;
          if (msg.principals) {
            this.principals = new Map(msg.principals.map(p => [p.id, p]));
          }
          if (msg.principalQueue) {
            this.principalQueue = msg.principalQueue;
          }
          if (msg.settings) {
            this.settings = msg.settings;
          }

          this.emit('session', this.session);
          this.emit('queue', this.queue);
          this.emit('floor', this.floor);
          this.emit('principals', Array.from(this.principals.values()));
          this.emit('principalQueue', this.principalQueue);
          this.emit('fairMode', !!msg.fairModeActive);
          this.updateSelfState();
        }
        break;
      }

      case 'session_ended': {
        if (msg.code === this.code) {
          this.session = msg.session;
          this.floor = null;
          this.queue = [];
          this.emit('session', this.session);
          this.emit('floor', null);
          this.emit('queue', []);
          this.updateSelfState();
        }
        break;
      }
    }
  }

  updateSelfState() {
    let nextState = 'listening';
    if (this.floor && this.floor.id === this.myId) {
      nextState = 'on_air';
    } else if (this.queue.some(item => item.id === this.myId)) {
      nextState = 'hand_raised';
    }

    if (this.selfState !== nextState) {
      this.selfState = nextState;
      this.emit('self', nextState);
    }
  }

  removeAttendee(id) {
    this.attendees.delete(id);
    this.emit('attendees', { count: this.attendees.size });

    const qLen = this.queue.length;
    this.queue = this.queue.filter(item => item.id !== id);

    let floorChanged = false;
    if (this.floor && this.floor.id === id) {
      recordSpeakHistoryEnd(this.speakHistory, this.floor.id, this.floor.name, this.floor.startedAt, this.floor.reason);
      this.floor = null;
      floorChanged = true;
    }

    if (this.queue.length !== qLen || floorChanged) {
      this.saveHostSession();
      this.broadcastState();
      if (this.queue.length !== qLen) {
        const sorted = sortQueue(this.queue, this.speakHistory, isFairModeActive(this.settings));
        this.emit('queue', sorted);
      }
      if (floorChanged) this.emit('floor', null);
    }
  }

  broadcastState() {
    this.delayedDispatch(() => {
      const sortedQueue = sortQueue(this.queue, this.speakHistory, isFairModeActive(this.settings));
      this.postToChannel({
        type: 'host_state',
        session: this.session,
        queue: sortedQueue,
        floor: this.floor,
        isMuted: this.isMuted,
        attendeeCount: this.attendees.size,
        principals: Array.from(this.principals.values()),
        principalQueue: this.principalQueue,
        settings: this.settings,
        fairModeActive: isFairModeActive(this.settings),
        floorAllow: this.floorAllow
      });
    });
  }

  startHostTimers() {
    this.stopTimers();

    this.heartbeatTimer = setInterval(() => {
      const sortedQueue = sortQueue(this.queue, this.speakHistory, isFairModeActive(this.settings));
      this.postToChannel({
        type: 'host_heartbeat',
        session: this.session,
        queue: sortedQueue,
        floor: this.floor,
        isMuted: this.isMuted,
        attendeeCount: this.attendees.size,
        principals: Array.from(this.principals.values()),
        principalQueue: this.principalQueue,
        settings: this.settings,
        fairModeActive: isFairModeActive(this.settings)
      });
    }, HEARTBEAT_INTERVAL_MS);

    this.cleanerTimer = setInterval(() => {
      const now = Date.now();
      let changed = false;

      this.attendees.forEach((item, id) => {
        if (now - item.lastSeen > HEARTBEAT_TIMEOUT_MS) {
          this.attendees.delete(id);
          changed = true;
          this.queue = this.queue.filter(q => q.id !== id);
          if (this.floor && this.floor.id === id) {
            recordSpeakHistoryEnd(this.speakHistory, this.floor.id, this.floor.name, this.floor.startedAt, this.floor.reason);
            this.floor = null;
          }
        }
      });

      if (changed) {
        this.saveHostSession();
        this.broadcastState();
        this.emit('attendees', { count: this.attendees.size });
        const sorted = sortQueue(this.queue, this.speakHistory, isFairModeActive(this.settings));
        this.emit('queue', sorted);
        this.emit('floor', this.floor);
      }
    }, 2000);
  }

  startAttendeeWatchers() {
    this.stopTimers();

    this.attendeeHeartbeatTimer = setInterval(() => {
      this.postToChannel({
        type: 'attendee_heartbeat',
        code: this.code,
        id: this.myId
      });
    }, HEARTBEAT_INTERVAL_MS);

    this.hostWatchTimer = setInterval(() => {
      const elapsed = Date.now() - this.lastHostSeen;
      if (elapsed > DISCONNECT_TIMEOUT_MS) {
        this.setConnectionState('disconnected');
      } else if (elapsed > HEARTBEAT_TIMEOUT_MS) {
        this.setConnectionState('reconnecting');
      }
    }, 2000);
  }

  stopTimers() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.cleanerTimer) clearInterval(this.cleanerTimer);
    if (this.attendeeHeartbeatTimer) clearInterval(this.attendeeHeartbeatTimer);
    if (this.hostWatchTimer) clearInterval(this.hostWatchTimer);

    this.heartbeatTimer = null;
    this.cleanerTimer = null;
    this.attendeeHeartbeatTimer = null;
    this.hostWatchTimer = null;
  }

  saveHostSession() {
    if (!this.session) return;
    try {
      localStorage.setItem(
        HOST_STORAGE_KEY,
        JSON.stringify({
          session: this.session,
          queue: this.queue,
          floor: this.floor,
          principals: Array.from(this.principals.values()),
          settings: this.settings
        })
      );
    } catch {}
  }

  async setOutputDevice(deviceId) {
    this.outputDeviceId = deviceId;
  }

  get canPlaybackAudio() {
    return true;
  }

  async startAudio() {
    return Promise.resolve();
  }
}
