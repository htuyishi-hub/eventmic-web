/**
 * Action handlers and simulation emitters for DemoTransport.
 */

export function emitAllSeed(t) {
  t.emit('session', { code: t.code, name: t.sessionName, status: 'live', createdAt: Date.now() - 3600000 });
  t.emit('queue', [...t.seed.queue]);
  t.emit('floor', t.seed.floor);
  t.emit('principals', [...t.seed.principals]);
  t.emit('principalQueue', t.seed.principals.filter(p => p.status === 'on_deck'));
  t.emit('attendees', { count: t.seed.attendees.length, list: [...t.seed.attendees] });
  t.emit('spoken', [...t.seed.spoken]);
  t.emit('urgent', [...t.seed.urgent]);
  t.emit('messages', [...t.seed.messages]);
  t.emit('settings', t.seed.settings);
  t.emit('announcement', t.seed.announcement);
  t.emit('fairMode', t.seed.settings.fairMode !== 'off');
  t.emit('metrics', {
    openSockets: t.seed.attendees.length + 2,
    peakSockets: 18,
    currentLivekitConnections: t.seed.floor ? 2 : 1,
    peakLivekitConnections: 3,
    totalWebRtcSeconds: 420,
    estimatedWebRtcMinutes: 7.0,
    avgGrantToAudioMs: 82
  });
}

export function addFakeAttendee(t, name = 'New Attendee') {
  const att = { id: 'att-' + Date.now(), name, status: 'listening', speakCount: 0, hasNotSpoken: true, joinedAt: Date.now() };
  t.seed.attendees.push(att);
  t.emit('attendees', { count: t.seed.attendees.length, list: [...t.seed.attendees] });
}

export function raiseFakeHand(t, reason = 'question') {
  const avail = t.seed.attendees.filter(a => !t.seed.queue.some(q => q.id === a.id));
  const att = avail[0] || { id: 'att-' + Date.now(), name: 'Guest ' + Math.floor(Math.random() * 100), speakCount: 0, hasNotSpoken: true };
  t.seed.queue.push({ id: att.id, name: att.name, reason, raisedAt: Date.now(), speakCount: att.speakCount, hasNotSpoken: att.hasNotSpoken });
  t.emit('queue', [...t.seed.queue]);
}

export function sendFakeUrgent(t, reason = 'cant_hear') {
  const u = { id: 'urg-' + Date.now(), attendeeId: 'att-rand', name: 'Random Attendee', reason, requestedAt: Date.now() };
  t.seed.urgent.unshift(u);
  t.emit('urgent', [...t.seed.urgent]);
}

export function makePrincipalRequest(t) {
  t.seed.principals = t.seed.principals.map((p, idx) => idx === 1 ? { ...p, status: 'on_deck' } : p);
  t.emit('principals', [...t.seed.principals]);
  t.emit('principalQueue', t.seed.principals.filter(p => p.status === 'on_deck'));
}

export function grantUrgent(t, id) {
  const u = t.seed.urgent.find(urg => urg.id === id);
  t.seed.urgent = t.seed.urgent.filter(urg => urg.id !== id);
  t.emit('urgent', [...t.seed.urgent]);
  if (u) {
    t.seed.floor = { id: u.attendeeId, name: u.name, role: 'attendee', startedAt: Date.now(), mode: 'urgent', reason: u.reason };
    t.emit('floor', t.seed.floor);
  }
}
