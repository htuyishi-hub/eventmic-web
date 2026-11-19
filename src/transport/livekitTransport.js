import { Room, RoomEvent, DisconnectReason, AudioPresets, Track } from 'livekit-client';
import { getOrCreateAttendeeId } from '../lib/ids.js';
import { AudioMeter } from '../lib/audioMeter.js';

const HOST_STORAGE_KEY = 'eventmic_host_session';

/**
 * Pure mapping helper: computes queue, active floor, and attendee count from participant list/map.
 * @param {Map|Array|Object} remoteParticipants
 * @returns {{ attendeeCount: number, queue: Array<{ id: string, name: string, raisedAt: number, reason?: string }>, floor: { id: string, name: string, startedAt: number, role?: string, mode?: string } | null }}
 */
export function computeQueueAndFloor(remoteParticipants) {
  const participants = remoteParticipants instanceof Map
    ? Array.from(remoteParticipants.values())
    : Array.isArray(remoteParticipants)
    ? remoteParticipants
    : Object.values(remoteParticipants || {});

  const attendees = participants.filter(p => p.identity?.startsWith('att-'));

  let floor = null;
  const speaker = participants.find(p => p.attributes?.floor === 'granted');
  if (speaker) {
    floor = {
      id: speaker.identity,
      name: speaker.name || 'Speaker',
      startedAt: Number(speaker.attributes?.floorStartedAt) || Date.now()
    };
    if (speaker.attributes?.floorRole || speaker.identity?.startsWith('prin-')) {
      floor.role = speaker.attributes?.floorRole || (speaker.identity?.startsWith('prin-') ? 'principal' : 'attendee');
      floor.mode = speaker.attributes?.floorRole || (speaker.identity?.startsWith('prin-') ? 'principal' : 'attendee');
    }
  }

  const queue = attendees
    .filter(p => {
      const hand = p.attributes?.hand;
      return hand && String(hand).trim() !== '' && p.attributes?.floor !== 'granted';
    })
    .map(p => ({
      id: p.identity,
      name: p.name || 'Attendee',
      reason: p.attributes?.handReason || 'question',
      raisedAt: Number(p.attributes.hand) || Date.now()
    }))
    .sort((a, b) => a.raisedAt - b.raisedAt);

  return {
    attendeeCount: attendees.length,
    queue,
    floor
  };
}

/**
 * Pure mapping helper: maps LiveKit ConnectionState to EventMic connection state.
 * @param {string} lkState
 * @returns {'connecting' | 'connected' | 'reconnecting' | 'disconnected'}
 */
export function mapConnectionState(lkState) {
  switch (lkState) {
    case 'connecting':
      return 'connecting';
    case 'connected':
      return 'connected';
    case 'reconnecting':
    case 'signalReconnecting':
      return 'reconnecting';
    case 'disconnected':
    default:
      return 'disconnected';
  }
}

/**
 * Real WebRTC transport implementation using LiveKit Cloud and backend API.
 * Adheres strictly to TransportInterface in types.js.
 */
export class LiveKitTransport {
  constructor(options = {}) {
    let rawBase = options.apiBase || import.meta.env?.VITE_API_BASE || '/api';
    rawBase = String(rawBase).trim().replace(/\/+$/, '');
    if (!rawBase.endsWith('/api') && !rawBase.includes('/api')) {
      rawBase = `${rawBase}/api`;
    }
    this.apiBase = rawBase;
    this.room = null;
    this.role = null; // 'admin' | 'principal' | 'attendee' | 'host'
    this.code = null;
    this.sessionName = null;
    this.myId = options.id || null;
    this.apiToken = null;
    this.connectionState = 'disconnected';
    this.selfState = 'listening';
    this.outputDeviceId = '';
    this.audioElement = null;
    this.audioMeter = new AudioMeter();

    // Event listeners
    this.listeners = new Map();
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
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(fn => {
        try { fn(data); } catch (e) { console.error(`Error in listener for ${event}:`, e); }
      });
    }
  }

  get canPlaybackAudio() {
    return this.room ? this.room.canPlaybackAudio : true;
  }

  async startAudio() {
    if (this.room) {
      await this.room.startAudio();
    }
  }

  async setOutputDevice(deviceId) {
    this.outputDeviceId = deviceId;
    if (this.audioElement && typeof this.audioElement.setSinkId === 'function') {
      try {
        await this.audioElement.setSinkId(deviceId);
      } catch (err) {
        console.warn('[LiveKitTransport] Failed to set sinkId on audio element:', err);
      }
    }
  }

  _getOrCreateAudioElement() {
    if (!this.audioElement && typeof document !== 'undefined') {
      this.audioElement = document.createElement('audio');
      this.audioElement.autoplay = true;
      this.audioElement.className = 'hidden';
      this.audioElement.setAttribute('aria-hidden', 'true');
      document.body.appendChild(this.audioElement);
    }
    return this.audioElement;
  }

  _getHostPasscode() {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('eventmic_host_passcode') || '1234';
    }
    return '1234';
  }

  _getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`;
    }
    if (this.role === 'admin' || this.role === 'host') {
      headers['x-host-passcode'] = this._getHostPasscode();
    }
    return headers;
  }

  async createSession({ name }) {
    const passcode = this._getHostPasscode();
    const res = await fetch(`${this.apiBase}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-host-passcode': passcode
      },
      body: JSON.stringify({ name })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      this.emit('error', {
        code: err.code || 'UNKNOWN',
        message: err.error || 'Failed to create session'
      });
      throw new Error(err.error || 'Failed to create session');
    }

    const data = await res.json();
    const sessionInfo = {
      code: data.code,
      name: data.name,
      status: 'live',
      createdAt: data.createdAt
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HOST_STORAGE_KEY, JSON.stringify(sessionInfo));
    }

    this.code = data.code;
    this.sessionName = data.name;
    this.emit('session', sessionInfo);
    return sessionInfo;
  }

  async endSession() {
    if (!this.code) return;
    try {
      await fetch(`${this.apiBase}/sessions/${this.code}/end`, {
        method: 'POST',
        headers: this._getAuthHeaders()
      });
    } catch {}

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(HOST_STORAGE_KEY);
    }

    await this.disconnect();

    this.emit('session', {
      code: this.code,
      name: this.sessionName || 'Session',
      status: 'ended',
      createdAt: Date.now()
    });
  }

  async connect({ role, code, name, pin, passcode }) {
    this.role = role === 'host' ? 'admin' : role;
    this.code = code ? code.trim().toUpperCase() : '';
    this.sessionName = name || '';

    this.connectionState = 'connecting';
    this.emit('connection', 'connecting');

    const tokenReqBody = {
      role: this.role,
      code: this.code,
      name: name || (this.role === 'admin' ? 'Admin' : this.role === 'principal' ? 'Speaker' : 'Attendee'),
      pin,
      passcode: passcode || this._getHostPasscode()
    };

    const headers = { 'Content-Type': 'application/json' };
    if (this.role === 'admin') {
      headers['x-host-passcode'] = tokenReqBody.passcode;
    } else if (this.role === 'attendee') {
      this.myId = getOrCreateAttendeeId();
      tokenReqBody.identity = this.myId;
    }

    let tokenRes;
    try {
      tokenRes = await fetch(`${this.apiBase}/auth`, {
        method: 'POST',
        headers,
        body: JSON.stringify(tokenReqBody)
      });
      // Fallback to /token if /auth returned 404 (legacy endpoint)
      if (tokenRes.status === 404) {
        tokenRes = await fetch(`${this.apiBase}/token`, {
          method: 'POST',
          headers,
          body: JSON.stringify(tokenReqBody)
        });
      }
    } catch {
      this.connectionState = 'disconnected';
      this.emit('connection', 'disconnected');
      this.emit('error', { code: 'UNKNOWN', message: 'Network connection failed' });
      throw new Error('Network connection failed');
    }

    if (!tokenRes.ok) {
      this.connectionState = 'disconnected';
      this.emit('connection', 'disconnected');

      const err = await tokenRes.json().catch(() => ({}));
      let errCode = 'UNKNOWN';
      if (tokenRes.status === 404) errCode = 'INVALID_CODE';
      else if (tokenRes.status === 410) errCode = 'SESSION_ENDED';
      else if (tokenRes.status === 409) errCode = 'FULL';
      else if (tokenRes.status === 401) errCode = 'UNAUTHORIZED';
      else if (tokenRes.status === 403) errCode = 'FORBIDDEN';

      const errorPayload = {
        code: err.code || errCode,
        message: err.error || 'Failed to acquire session token'
      };
      this.emit('error', errorPayload);
      throw new Error(errorPayload.message);
    }

    const { token, url, apiToken, identity, name: confirmedName } = await tokenRes.json();
    this.apiToken = apiToken || null;
    if (identity) this.myId = identity;
    if (confirmedName) this.name = confirmedName;

    this.room = new Room({
      adaptiveStream: false,
      dynacast: false,
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
        channelCount: 1
      },
      publishDefaults: {
        audioPreset: AudioPresets.speech,
        dtx: true,
        red: false
      }
    });

    this._setupRoomEvents();

    try {
      await this.room.connect(url, token);
      this.connectionState = 'connected';
      this.emit('connection', 'connected');

      // Sync initial session info
      const sRes = await fetch(`${this.apiBase}/sessions/${this.code}`).catch(() => null);
      if (sRes && sRes.ok) {
        const sData = await sRes.json();
        this.sessionName = sData.name;
        this.emit('session', {
          code: sData.code,
          name: sData.name,
          status: sData.status,
          createdAt: Date.now()
        });
      }

      if (this.role === 'admin') {
        this._syncHostState();
        this.fetchSessionState().catch(() => {});
      } else if (this.role === 'principal') {
        this.fetchSessionState().catch(() => {});
      } else {
        this.selfState = 'listening';
        this.emit('self', 'listening');
      }
    } catch (err) {
      this.connectionState = 'disconnected';
      this.emit('connection', 'disconnected');
      this.emit('error', { code: 'UNKNOWN', message: err.message || 'Room connection failed' });
      throw err;
    }
  }

  _setupRoomEvents() {
    if (!this.room) return;

    this.room.on(RoomEvent.ConnectionStateChanged, (state) => {
      const mapped = mapConnectionState(state);
      this.connectionState = mapped;
      this.emit('connection', mapped);
    });

    this.room.on(RoomEvent.Disconnected, (reason) => {
      this.connectionState = 'disconnected';
      this.emit('connection', 'disconnected');
      if (reason === DisconnectReason.ROOM_DELETED) {
        this.emit('session', {
          code: this.code,
          name: this.sessionName || 'Session',
          status: 'ended',
          createdAt: Date.now()
        });
      }
    });

    this.room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      this.emit('audio_playback_status', this.room.canPlaybackAudio);
    });

    // Track audio subscription for admin and principal
    if (this.role === 'admin' || this.role === 'principal') {
      const handleParticipantsChange = () => {
        if (this.role === 'admin') this._syncHostState();
      };
      this.room.on(RoomEvent.ParticipantConnected, handleParticipantsChange);
      this.room.on(RoomEvent.ParticipantDisconnected, handleParticipantsChange);
      this.room.on(RoomEvent.ParticipantAttributesChanged, handleParticipantsChange);

      this.room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio || track.kind === 'audio') {
          if (track.mediaStreamTrack) {
            const stream = new MediaStream([track.mediaStreamTrack]);
            this.speakerStream = stream;
            this.emit('speakerStream', stream);
          }
        }
      });

      this.room.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === Track.Kind.Audio || track.kind === 'audio') {
          this.speakerStream = null;
          this.emit('speakerStream', null);
        }
      });
    }

    // Role-specific floor handling for participant
    if (this.role === 'attendee' || this.role === 'principal') {
      this.room.on(RoomEvent.ParticipantPermissionsChanged, (p) => {
        if (p === this.room.localParticipant) {
          this._checkSpeakingFloor();
        }
      });

      this.room.on(RoomEvent.ParticipantAttributesChanged, (attrs, p) => {
        if (p === this.room.localParticipant) {
          this._checkSpeakingFloor();
        } else if (this.role === 'attendee') {
          this._syncAttendeeQueue();
        }
      });
    }

    // Listen for broadcast data
    this.room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
      if (topic === 'queue') {
        try {
          const decoded = new TextDecoder().decode(payload);
          const data = JSON.parse(decoded);
          if (data.type === 'queue' && Array.isArray(data.queue)) {
            this.emit('queue', data.queue);
          }
        } catch {}
      }
    });
  }

  _syncHostState() {
    if (!this.room || (this.role !== 'admin' && this.role !== 'host')) return;

    const { attendeeCount, queue, floor } = computeQueueAndFloor(this.room.remoteParticipants);
    this.emit('attendees', { count: attendeeCount });
    this.emit('queue', queue);
    this.emit('floor', floor);

    if (this.room.localParticipant?.permissions?.canPublishData) {
      try {
        const payload = new TextEncoder().encode(JSON.stringify({ type: 'queue', queue }));
        this.room.localParticipant.publishData(payload, { topic: 'queue', reliable: true }).catch(() => {});
      } catch {}
    }
  }

  _syncAttendeeQueue() {
    if (!this.room || this.role !== 'attendee') return;

    const participants = Array.from(this.room.remoteParticipants.values());
    if (this.room.localParticipant) {
      participants.push(this.room.localParticipant);
    }

    const { queue } = computeQueueAndFloor(participants);
    if (queue.length > 0) {
      this.emit('queue', queue);
    }
  }

  async _checkSpeakingFloor() {
    if (!this.room?.localParticipant) return;
    const local = this.room.localParticipant;
    const canPublish = Boolean(local.permissions?.canPublish || local.attributes?.floor === 'granted');

    if (local.attributes?.floorRevokedReason) {
      this.emit('preempted', local.attributes.floorRevokedReason);
    }

    if (canPublish) {
      if (this.selfState !== 'on_air') {
        this.selfState = 'on_air';
        this.emit('self', 'on_air');

        try {
          await local.setMicrophoneEnabled(true);
        } catch (err) {
          console.warn('[LiveKitTransport] Microphone enable failed:', err);
          this.emit('error', { code: 'MIC_DENIED', message: 'Microphone permission denied' });
        }
      }
    } else {
      if (this.selfState === 'on_air') {
        try {
          await local.setMicrophoneEnabled(false);
        } catch {}
      }

      if (this.role === 'attendee') {
        if (local.attributes?.hand && String(local.attributes.hand).trim() !== '') {
          this.selfState = 'hand_raised';
          this.emit('self', 'hand_raised');
        } else {
          this.selfState = 'listening';
          this.emit('self', 'listening');
        }
      } else {
        this.selfState = 'listening';
        this.emit('self', 'listening');
      }
    }
  }

  async disconnect() {
    this.audioMeter.stop();

    if (this.audioElement) {
      this.audioElement.srcObject = null;
    }

    if (this.room) {
      if (this.room.localParticipant) {
        try {
          await this.room.localParticipant.setMicrophoneEnabled(false);
        } catch {}
      }
      try {
        await this.room.disconnect();
      } catch {}
      this.room = null;
    }

    this.connectionState = 'disconnected';
    this.emit('connection', 'disconnected');
  }

  async raiseHand(options = {}) {
    const reason = options.reason || 'question';
    if (this.room?.localParticipant) {
      await this.room.localParticipant.setAttributes({
        hand: String(Date.now()),
        handReason: reason
      });
      this.selfState = 'hand_raised';
      this.emit('self', 'hand_raised');
    }
    if (this.apiToken) {
      await fetch(`${this.apiBase}/floor/raise-hand`, {
        method: 'POST',
        headers: this._getAuthHeaders(),
        body: JSON.stringify({ code: this.code, reason })
      }).catch(() => {});
    }
  }

  async lowerHand() {
    if (this.room?.localParticipant) {
      await this.room.localParticipant.setAttributes({ hand: '' });
      this.selfState = 'listening';
      this.emit('self', 'listening');
    }
    if (this.apiToken) {
      await fetch(`${this.apiBase}/floor/lower-hand`, {
        method: 'POST',
        headers: this._getAuthHeaders(),
        body: JSON.stringify({ code: this.code })
      }).catch(() => {});
    }
  }

  async takeFloor() {
    const res = await fetch(`${this.apiBase}/floor/take`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ code: this.code })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to take floor');
    }
    return res.json();
  }

  async requestSpeak() {
    const res = await fetch(`${this.apiBase}/floor/request-speak`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ code: this.code })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to request speak');
    }
    return res.json();
  }

  async allowPrincipal(principalId) {
    const res = await fetch(`${this.apiBase}/floor/allow`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ code: this.code, targetPrincipalId: principalId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to allow speaker handover');
    }
    return res.json();
  }

  async grant(attendeeId) {
    const res = await fetch(`${this.apiBase}/floor/grant`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ code: this.code, identity: attendeeId })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to grant floor');
    }
  }

  async revoke(attendeeId) {
    const res = await fetch(`${this.apiBase}/floor/revoke`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ code: this.code, identity: attendeeId })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to revoke floor');
    }
  }

  async createPrincipal(name) {
    const res = await fetch(`${this.apiBase}/sessions/${this.code}/principals`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create principal');
    }
    return res.json();
  }

  async getPrincipals() {
    const res = await fetch(`${this.apiBase}/sessions/${this.code}/principals`, {
      headers: this._getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to get principals');
    }
    return res.json();
  }

  async revokePrincipal(id) {
    const res = await fetch(`${this.apiBase}/sessions/${this.code}/principals/${id}`, {
      method: 'DELETE',
      headers: this._getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to revoke principal');
    }
    return res.json();
  }

  async regeneratePrincipalPin(id) {
    const res = await fetch(`${this.apiBase}/sessions/${this.code}/principals/${id}/regenerate`, {
      method: 'POST',
      headers: this._getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to regenerate PIN');
    }
    const data = await res.json();
    return data.pin;
  }

  async updateSettings(settings) {
    const res = await fetch(`${this.apiBase}/sessions/${this.code}/settings`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update settings');
    }
    return res.json();
  }

  async fetchSessionState() {
    const res = await fetch(`${this.apiBase}/sessions/${this.code}/state`, {
      headers: this._getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch session state');
    }
    const data = await res.json();
    if (data.queue) this.emit('queue', data.queue);
    if (data.floor !== undefined) this.emit('floor', data.floor);
    if (data.principals) this.emit('principals', data.principals);
    if (data.principalQueue) this.emit('principalQueue', data.principalQueue);
    if (data.fairModeActive !== undefined) this.emit('fairMode', data.fairModeActive);
    return data;
  }

  async muteSpeaker(muted) {
    if (this.audioElement) {
      this.audioElement.muted = Boolean(muted);
    }

    if (!this.room) return;
    const { floor } = computeQueueAndFloor(this.room.remoteParticipants);
    if (!floor) return;

    try {
      await fetch(`${this.apiBase}/floor/mute`, {
        method: 'POST',
        headers: this._getAuthHeaders(),
        body: JSON.stringify({ code: this.code, identity: floor.id, muted: Boolean(muted) })
      });
    } catch (err) {
      console.warn('[LiveKitTransport] Failed to mute speaker on server:', err);
    }
  }

  async sendLevel(level) {
    return Promise.resolve();
  }
}
