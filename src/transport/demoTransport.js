import { createSeedData } from './demoSeedData.js';
import { emitAllSeed, addFakeAttendee, raiseFakeHand, sendFakeUrgent, makePrincipalRequest, grantUrgent } from './demoTransportActions.js';

export class DemoTransport {
  constructor(options = {}) {
    this.role = null;
    this.code = options.code || 'DEMO01';
    this.sessionName = 'Tech Summit Keynote & Q&A';
    this.myId = options.id || 'admin';
    this.connectionState = 'disconnected';
    this.selfState = 'listening';
    this.isMuted = false;
    this.listeners = new Map();
    this.seed = createSeedData();
    this.timeMultiplier = 1;
    this.isDemo = true;

    this.meterTimer = setInterval(() => {
      const lvl = this.seed.floor && !this.isMuted ? Number((0.25 + Math.random() * 0.45).toFixed(2)) : 0;
      this.emit('level', lvl);
    }, 100);
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }

  emit(event, data) { this.listeners.get(event)?.forEach(fn => { try { fn(data); } catch {} }); }
  setConnectionState(st) { this.connectionState = st; this.emit('connection', st); }
  setSelfState(st) { this.selfState = st; this.emit('self', st); }

  async connect({ role, code, pin }) {
    this.role = role === 'host' ? 'admin' : role;
    this.code = (code || 'DEMO01').toUpperCase();
    this.setConnectionState('connecting');
    await new Promise(r => setTimeout(r, 40));

    if (this.role === 'principal' && pin && pin !== '847291' && pin !== '121985') {
      this.setConnectionState('disconnected');
      this.emit('error', { code: 'UNAUTHORIZED', message: 'Invalid 6-digit speaker PIN' });
      throw new Error('Invalid 6-digit speaker PIN');
    }

    this.setConnectionState('connected');
    emitAllSeed(this);
    this.setSelfState(this.seed.floor?.id === this.myId ? 'on_air' : 'listening');
  }

  async createSession({ name }) {
    this.sessionName = name;
    this.code = 'DEMO01';
    const s = { code: this.code, name, status: 'live', createdAt: Date.now() };
    this.emit('session', s);
    return s;
  }

  async endSession() {
    this.seed.floor = null;
    this.emit('floor', null);
    this.emit('session', { code: this.code, name: this.sessionName, status: 'ended', createdAt: Date.now() });
  }

  async disconnect() { this.setConnectionState('disconnected'); }

  async raiseHand(options = {}) {
    const reason = options.reason || 'question';
    const item = { id: this.myId, name: 'You (Demo)', reason, raisedAt: Date.now(), speakCount: 0, hasNotSpoken: true };
    this.seed.queue.push(item);
    this.emit('queue', [...this.seed.queue]);
    this.setSelfState('hand_raised');
  }

  async lowerHand() {
    this.seed.queue = this.seed.queue.filter(q => q.id !== this.myId);
    this.emit('queue', [...this.seed.queue]);
    this.setSelfState('listening');
  }

  async urgentRequest() {
    const u = { id: 'urg-' + Date.now(), attendeeId: this.myId, name: 'You (Demo)', reason: 'cant_hear', requestedAt: Date.now() };
    this.seed.urgent.unshift(u);
    this.emit('urgent', [...this.seed.urgent]);
  }

  async grant(id) {
    const item = this.seed.queue.find(q => q.id === id) || { id, name: 'Attendee ' + id, reason: 'question' };
    this.seed.queue = this.seed.queue.filter(q => q.id !== id);
    this.seed.floor = { id, name: item.name, role: 'attendee', startedAt: Date.now(), mode: 'attendee', reason: item.reason };
    this.emit('queue', [...this.seed.queue]);
    this.emit('floor', this.seed.floor);
    if (this.myId === id) this.setSelfState('on_air');
  }

  async revoke() {
    if (this.seed.floor) {
      this.seed.spoken.unshift({
        id: 'sp-' + Date.now(), name: this.seed.floor.name, reason: this.seed.floor.reason || 'question',
        startedAt: this.seed.floor.startedAt, endedAt: Date.now(),
        durationSeconds: Math.floor((Date.now() - this.seed.floor.startedAt) / 1000), role: this.seed.floor.role || 'attendee'
      });
      this.emit('spoken', [...this.seed.spoken]);
    }
    this.seed.floor = null;
    this.emit('floor', null);
    if (this.selfState === 'on_air') this.setSelfState('listening');
  }

  async takeFloor() {
    this.seed.floor = { id: this.myId, name: 'Sarah Connor', role: 'principal', startedAt: Date.now(), mode: 'principal' };
    this.emit('floor', this.seed.floor);
    this.setSelfState('on_air');
  }

  async requestSpeak() {
    this.seed.principals = this.seed.principals.map(p => p.id === this.myId ? { ...p, status: 'on_deck' } : p);
    this.emit('principals', [...this.seed.principals]);
    this.emit('principalQueue', this.seed.principals.filter(p => p.status === 'on_deck'));
  }

  async allowPrincipal(id) {
    const p = this.seed.principals.find(pr => pr.id === id);
    if (p) {
      this.seed.floor = { id: p.id, name: p.name, role: 'principal', startedAt: Date.now(), mode: 'principal' };
      this.emit('floor', this.seed.floor);
    }
  }

  async muteSpeaker(muted) { this.isMuted = Boolean(muted); this.emit('muted', this.isMuted); }
  async updateSettings(s) {
    this.seed.settings = { ...this.seed.settings, ...s };
    this.emit('settings', this.seed.settings);
    if (s.fairMode !== undefined) this.emit('fairMode', s.fairMode !== 'off');
  }

  async sendMessage(text) {
    const msg = { id: 'msg-' + Date.now(), senderId: this.myId, senderName: this.role === 'admin' ? 'Admin' : 'Speaker', senderRole: this.role, text, timestamp: Date.now() };
    this.seed.messages.push(msg);
    this.emit('messages', [...this.seed.messages]);
  }

  async broadcastAnnouncement(text, type = 'info', durationMs = 10000) {
    this.seed.announcement = { id: 'ann-' + Date.now(), type, text, createdAt: Date.now(), expiresAt: Date.now() + durationMs };
    this.emit('announcement', this.seed.announcement);
    setTimeout(() => { this.seed.announcement = null; this.emit('announcement', null); }, durationMs);
  }

  async createPrincipal(name) {
    const p = { id: 'pr-' + Date.now(), name, pin: String(Math.floor(100000 + Math.random() * 900000)), createdAt: Date.now(), status: 'idle' };
    this.seed.principals.push(p);
    this.emit('principals', [...this.seed.principals]);
    return p;
  }

  async getPrincipals() { return [...this.seed.principals]; }
  async revokePrincipal(id) {
    this.seed.principals = this.seed.principals.filter(p => p.id !== id);
    this.emit('principals', [...this.seed.principals]);
  }
  async regeneratePrincipalPin(id) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    this.seed.principals = this.seed.principals.map(p => p.id === id ? { ...p, pin } : p);
    this.emit('principals', [...this.seed.principals]);
    return pin;
  }

  async dismissUrgent(id) {
    this.seed.urgent = this.seed.urgent.filter(u => u.id !== id);
    this.emit('urgent', [...this.seed.urgent]);
  }
  async grantUrgent(id) { grantUrgent(this, id); }
  async uploadAvatar(blob, targetId) {
    const id = targetId || this.myId;
    this.emit('avatar', { identity: id, hasAvatar: true, avatarVersion: 1 });
    return { ok: true, identity: id, version: 1 };
  }
  async deleteAvatar(targetId) {
    const id = targetId || this.myId;
    this.emit('avatar', { identity: id, hasAvatar: false, avatarVersion: 0 });
    return { ok: true };
  }

  addFakeAttendee(name) { addFakeAttendee(this, name); }
  raiseFakeHand(reason) { raiseFakeHand(this, reason); }
  sendFakeUrgent(reason) { sendFakeUrgent(this, reason); }
  makePrincipalRequest() { makePrincipalRequest(this); }
  speedUpClock(mult = 2) { this.timeMultiplier = mult; }
  setFloorHolderDropped(dropped) {
    if (this.seed.floor) {
      this.seed.floor.disconnected = dropped;
      this.emit('floor', { ...this.seed.floor });
    }
  }

  dispose() {
    if (this.meterTimer) clearInterval(this.meterTimer);
    this.listeners.clear();
  }
}
