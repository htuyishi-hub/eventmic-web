import { AudioMeter } from '../lib/audioMeter.js';
import { getOrCreateAttendeeId } from '../lib/ids.js';
import { SocketClient } from './socketClient.js';
import { LiveKitSessionManager } from './livekitSessionManager.js';
import { ApiClient } from './apiClient.js';
import { attachSocketListeners } from './livekitSocketBridge.js';

export { computeQueueAndFloor, mapConnectionState } from './livekitMappers.js';
const HOST_STORAGE_KEY = 'eventmic_host_session';

export class LiveKitTransport {
  constructor(options = {}) {
    let raw = options.apiBase || import.meta.env?.VITE_API_BASE || '/api';
    this.apiBase = String(raw).trim().replace(/\/+$/, '').replace(/\/api\/?$/, '') + '/api';
    this.role = null; this.code = null; this.sessionName = null; this.myId = options.id || null;
    this.apiToken = null; this.connectionState = 'disconnected'; this.selfState = 'listening';
    this.audioMeter = new AudioMeter(); this.listeners = new Map();
    this.preWarmedStream = null; this._room = null;

    this.api = new ApiClient(this.apiBase, () => this._getAuthHeaders());
    this.socketClient = new SocketClient({ apiBase: this.apiBase });
    this.sessionManager = new LiveKitSessionManager({
      onTrackSubscribed: (stream, role, id) => {
        this.speakerStream = stream;
        this.emit('speakerStream', stream);
        this.emit('activeTrack', { stream, role, id });
      },
      onTrackUnsubscribed: () => { this.speakerStream = null; this.emit('speakerStream', null); },
      onAudioPlaybackChanged: (canPlay) => this.emit('audio_playback_status', canPlay)
    });

    attachSocketListeners(this, this.socketClient, this.sessionManager);
  }

  get room() { return this._room || this.sessionManager?.room; }
  set room(r) { this._room = r; }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }
  emit(event, data) { this.listeners.get(event)?.forEach(fn => { try { fn(data); } catch {} }); }
  setConnectionState(st) { if (this.connectionState !== st) { this.connectionState = st; this.emit('connection', st); } }
  setSelfState(st) { if (this.selfState !== st) { this.selfState = st; this.emit('self', st); } }
  setPreWarmedStream(stream) { this.preWarmedStream = stream; }
  _getHostPasscode() { return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('eventmic_host_passcode') || '1234' : '1234'; }
  _getAuthHeaders() {
    const h = { 'Content-Type': 'application/json' };
    if (this.apiToken) h['Authorization'] = `Bearer ${this.apiToken}`;
    if (this.role === 'admin' || this.role === 'host') h['x-host-passcode'] = this._getHostPasscode();
    return h;
  }

  async createSession({ name, settings }) {
    this.pendingSettings = settings || null;
    const data = await this.api.createSession(name, this._getHostPasscode());
    const info = { code: data.code, name: data.name, status: 'live', createdAt: data.createdAt };
    localStorage.setItem(HOST_STORAGE_KEY, JSON.stringify(info));
    this.code = data.code;
    this.sessionName = data.name;
    this.emit('session', info);
    return info;
  }

  async endSession() {
    try {
      if (this.code) await this.api.endSession(this.code);
    } finally {
      localStorage.removeItem(HOST_STORAGE_KEY);
      await this.disconnect();
      this.emit('session', { code: this.code, name: this.sessionName, status: 'ended', createdAt: Date.now() });
    }
  }

  async connect({ role, code, name, pin, inviteToken, passcode }) {
    this.role = role === 'host' ? 'admin' : role;
    this.code = (code || '').trim().toUpperCase();
    this.sessionName = name || '';
    this.setConnectionState('connecting');

    const body = { role: this.role, code: this.code, name: name || 'Participant', pin, ...(inviteToken ? { inviteToken } : {}), passcode: passcode || this._getHostPasscode() };
    if (this.role === 'attendee') { this.myId = getOrCreateAttendeeId(); body.identity = this.myId; }

    let res;
    try {
      let adminToken = '';
      try { adminToken = localStorage.getItem('dm_admin_token') || ''; } catch {}
      const authHeaders = { 'Content-Type': 'application/json' };
      if ((this.role === 'admin' || this.role === 'host') && adminToken) {
        authHeaders['Authorization'] = `Bearer ${adminToken}`;
      }
      res = await fetch(`${this.apiBase}/auth`, { method: 'POST', headers: authHeaders, body: JSON.stringify(body) });
      if (res.status === 404) res = await fetch(`${this.apiBase}/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } catch {
      this.setConnectionState('disconnected');
      this.emit('error', { code: 'UNKNOWN', message: 'Network connection failed' });
      throw new Error('Network connection failed');
    }

    if (!res.ok) {
      this.setConnectionState('disconnected');
      const err = await res.json().catch(() => ({}));
      const codeMap = { 401: 'UNAUTHORIZED', 404: 'INVALID_CODE', 409: 'FULL', 410: 'SESSION_ENDED' };
      const errPayload = { code: err.code || codeMap[res.status] || 'UNKNOWN', message: err.error || 'Failed to authenticate' };
      this.emit('error', errPayload);
      throw new Error(errPayload.message);
    }

    const { token, url, apiToken, identity, name: authName } = await res.json();
    if (authName) this.myName = authName;
    this.apiToken = apiToken || null;
    if (this.pendingSettings && (role === 'host' || role === 'admin')) {
      const s = this.pendingSettings;
      this.pendingSettings = null;
      this.updateSettings(s).catch(() => {});
    }
    if (identity) this.myId = identity;

    this.emit('session', { code: this.code, name: this.sessionName || this.code, status: 'live', createdAt: Date.now() });
    this.socketClient.connect(this.apiToken);
    if (this.role === 'admin') {
      this.sessionManager.connectRoom(url, token, 'admin')
        .then(() => this.setConnectionState('connected'))
        .catch(() => this.setConnectionState('disconnected'));
    } else {
      this.setConnectionState('connected');
    }
    this.setSelfState('listening');
    return { identity: this.myId, name: this.myName || name || '', code: this.code };
  }

  async raiseHand(options = {}) {
    const reason = options.reason || 'question';
    if (this.room?.localParticipant) {
      await this.room.localParticipant.setAttributes({ hand: String(Date.now()), handReason: reason });
    }
    this.socketClient.send('raise_hand', { reason });
    this.setSelfState('hand_raised');
  }

  async lowerHand() {
    if (this.room?.localParticipant) await this.room.localParticipant.setAttributes({ hand: '' });
    this.socketClient.send('lower_hand', {});
    await this.sessionManager.disconnect();
    this.setSelfState('listening');
  }

  async urgentRequest() { this.socketClient.send('urgent_request', {}); }
  async takeFloor() {
    await this.api.postFloorAction('take', { code: this.code });
    this.socketClient.send('take_floor', {});
  }

  async requestSpeak() {
    await this.api.postFloorAction('request-speak', { code: this.code });
    this.socketClient.send('request_speak', {});
  }

  async allowPrincipal(id) {
    await this.api.postFloorAction('allow', { code: this.code, targetPrincipalId: id });
    this.socketClient.send('allow_principal', { targetPrincipalId: id });
  }

  async grant(id) {
    await this.api.postFloorAction('grant', { code: this.code, identity: id });
    this.socketClient.send('grant_floor', { attendeeId: id });
  }
  async revoke(id) {
    await this.api.postFloorAction('revoke', { code: this.code, identity: id });
    this.socketClient.send('revoke_floor', { attendeeId: id });
  }
  async muteSpeaker(muted) {
    if (this.audioElement) this.audioElement.muted = Boolean(muted);
    let identity = null;
    if (this.room?.remoteParticipants) {
      for (const p of this.room.remoteParticipants.values()) {
        if (p.attributes?.floor === 'granted') { identity = p.identity; break; }
      }
    }
    const body = identity ? { code: this.code, identity, muted: Boolean(muted) } : { code: this.code, muted: Boolean(muted) };
    await this.api.postFloorAction('mute', body).catch(() => {});
  }

  async createPrincipal(name) {
    const created = await this.api.managePrincipal(this.code, 'create', null, name);
    const list = await this.api.managePrincipal(this.code, 'list').catch(() => null);
    if (Array.isArray(list)) this.emit('principals', list);
    return created;
  }
  async getPrincipals() {
    const list = await this.api.managePrincipal(this.code, 'list');
    if (Array.isArray(list)) this.emit('principals', list);
    return list;
  }
  async revokePrincipal(id) {
    const res = await this.api.managePrincipal(this.code, 'revoke', id);
    const list = await this.api.managePrincipal(this.code, 'list').catch(() => null);
    if (Array.isArray(list)) this.emit('principals', list);
    return res;
  }
  async regeneratePrincipalPin(id) {
    const pin = await this.api.managePrincipal(this.code, 'regenerate', id);
    const list = await this.api.managePrincipal(this.code, 'list').catch(() => null);
    if (Array.isArray(list)) this.emit('principals', list);
    return pin;
  }
  async updateSettings(settings) { return this.api.updateSettings(this.code, settings); }
  async sendMessage(text, to = 'all', voice = null) {
    this.socketClient.send('chat_message', {
      text: text || '',
      to,
      ...(voice?.audioDataUrl ? { audioDataUrl: voice.audioDataUrl, durationMs: voice.durationMs || 0 } : {})
    });
  }
  async uploadAvatar(blob, targetId) {
    const res = await this.api.uploadAvatar(blob, targetId, this.code);
    this.emit('avatar', { identity: res.identity || targetId || this.myId, hasAvatar: true, avatarVersion: res.version });
    return res;
  }
  async deleteAvatar(targetId) {
    const res = await this.api.deleteAvatar(targetId, this.code);
    this.emit('avatar', { identity: targetId || this.myId, hasAvatar: false, avatarVersion: 0 });
    return res;
  }
  async fetchSessionState() {
    const data = await this.api.fetchState(this.code);
    if (data.metrics) this.emit('metrics', data.metrics);
    if (Array.isArray(data.queue)) this.emit('queue', data.queue);
    if (data.floor !== undefined) this.emit('floor', data.floor);
    if (data.attendeeCount !== undefined || Array.isArray(data.attendees)) {
      this.emit('attendees', { count: data.attendeeCount ?? data.attendees?.length ?? 0, list: data.attendees || [] });
    }
    return data;
  }

  async disconnect() {
    this.audioMeter.stop();
    this.socketClient.disconnect();
    await this.sessionManager.disconnect();
    this.setConnectionState('disconnected');
  }
  async setOutputDevice(id) { this.outputDeviceId = id; }
  get canPlaybackAudio() { return true; }
  async startAudio() { return Promise.resolve(); }
  async sendLevel() { return Promise.resolve(); }
}
