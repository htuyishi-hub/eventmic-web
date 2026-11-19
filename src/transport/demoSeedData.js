/**
 * Pre-seeded realistic demo data for 3-role EventMic testing.
 */

export function createSeedData() {
  const now = Date.now();

  const attendees = [
    { id: 'att-1', name: 'Alex Rivera', status: 'hand_raised', handReason: 'question', raisedAt: now - 120000, speakCount: 0, hasNotSpoken: true, joinedAt: now - 600000 },
    { id: 'att-2', name: 'Brenda Zhao', status: 'spoken', handReason: null, raisedAt: null, speakCount: 1, hasNotSpoken: false, joinedAt: now - 550000 },
    { id: 'att-3', name: 'Carlos Ortiz', status: 'hand_raised', handReason: 'comment', raisedAt: now - 95000, speakCount: 0, hasNotSpoken: true, joinedAt: now - 500000 },
    { id: 'att-4', name: 'Diana Prince', status: 'listening', handReason: null, raisedAt: null, speakCount: 2, hasNotSpoken: false, joinedAt: now - 480000 },
    { id: 'att-5', name: 'Evan MacIntyre', status: 'listening', handReason: null, raisedAt: null, speakCount: 0, hasNotSpoken: true, joinedAt: now - 450000 },
    { id: 'att-6', name: 'Fiona Gallagher', status: 'hand_raised', handReason: 'clarification', raisedAt: now - 60000, speakCount: 1, hasNotSpoken: false, joinedAt: now - 400000 },
    { id: 'att-7', name: 'George Vance', status: 'listening', handReason: null, raisedAt: null, speakCount: 0, hasNotSpoken: true, joinedAt: now - 350000 },
    { id: 'att-8', name: 'Hana Tanaka', status: 'spoken', handReason: null, raisedAt: null, speakCount: 3, hasNotSpoken: false, joinedAt: now - 300000 },
    { id: 'att-9', name: 'Ian Malcolm', status: 'listening', handReason: null, raisedAt: null, speakCount: 0, hasNotSpoken: true, joinedAt: now - 250000 },
    { id: 'att-10', name: 'Julia Roberts', status: 'spoken', handReason: null, raisedAt: null, speakCount: 1, hasNotSpoken: false, joinedAt: now - 200000 },
    { id: 'att-11', name: 'Kevin Flynn', status: 'hand_raised', handReason: 'compliment', raisedAt: now - 25000, speakCount: 0, hasNotSpoken: true, joinedAt: now - 180000 },
    { id: 'att-12', name: 'Maya Lin', status: 'listening', handReason: null, raisedAt: null, speakCount: 0, hasNotSpoken: true, joinedAt: now - 120000 }
  ];

  const principals = [
    { id: 'pr-1', name: 'Sarah Connor', pin: '847291', createdAt: now - 3600000, status: 'live' },
    { id: 'pr-2', name: 'Dr. Emmett Brown', pin: '121985', createdAt: now - 3600000, status: 'on_deck' }
  ];

  const queue = [
    { id: 'att-1', name: 'Alex Rivera', reason: 'question', raisedAt: now - 120000, speakCount: 0, hasNotSpoken: true },
    { id: 'att-3', name: 'Carlos Ortiz', reason: 'comment', raisedAt: now - 95000, speakCount: 0, hasNotSpoken: true },
    { id: 'att-6', name: 'Fiona Gallagher', reason: 'clarification', raisedAt: now - 60000, speakCount: 1, hasNotSpoken: false },
    { id: 'att-11', name: 'Kevin Flynn', reason: 'compliment', raisedAt: now - 25000, speakCount: 0, hasNotSpoken: true }
  ];

  const urgent = [
    { id: 'urg-1', attendeeId: 'att-4', name: 'Diana Prince', reason: "cant_hear", requestedAt: now - 15000 }
  ];

  const spoken = [
    { id: 'sp-1', name: 'Brenda Zhao', reason: 'question', startedAt: now - 450000, endedAt: now - 382000, durationSeconds: 68, role: 'attendee' },
    { id: 'sp-2', name: 'Hana Tanaka', reason: 'comment', startedAt: now - 350000, endedAt: now - 240000, durationSeconds: 110, role: 'attendee' },
    { id: 'sp-3', name: 'Julia Roberts', reason: 'clarification', startedAt: now - 210000, endedAt: now - 165000, durationSeconds: 45, role: 'attendee' },
    { id: 'sp-4', name: 'Hana Tanaka', reason: 'question', startedAt: now - 150000, endedAt: now - 60000, durationSeconds: 90, role: 'attendee' },
    { id: 'sp-5', name: 'Hana Tanaka', reason: 'compliment', startedAt: now - 50000, endedAt: now - 18000, durationSeconds: 32, role: 'attendee' }
  ];

  const messages = [
    { id: 'msg-1', senderId: 'admin', senderName: 'Admin Console', senderRole: 'admin', text: 'Welcome to keynote stage. Floor is open.', timestamp: now - 600000 },
    { id: 'msg-2', senderId: 'pr-1', senderName: 'Sarah Connor', senderRole: 'principal', text: 'Audio check complete. Ready for audience Q&A.', timestamp: now - 300000 },
    { id: 'msg-3', senderId: 'admin', senderName: 'Admin Console', senderRole: 'admin', text: 'Queue has 4 questions queued up.', timestamp: now - 60000 }
  ];

  const floor = {
    id: 'pr-1',
    name: 'Sarah Connor',
    role: 'principal',
    startedAt: now - 180000,
    mode: 'principal'
  };

  const settings = {
    fairMode: 'auto',
    fairFromMinutes: 10,
    sessionEndTime: now + 3600000,
    allowUrgent: true,
    attendeeTurnCapSeconds: 120,
    principalConnectMode: 'on_demand'
  };

  const announcement = {
    id: 'ann-1',
    type: 'info',
    text: 'Audience Q&A is now open. Tap Raise Hand to submit your question.',
    createdAt: now - 120000,
    expiresAt: now + 120000
  };

  return {
    attendees,
    principals,
    queue,
    urgent,
    spoken,
    messages,
    floor,
    settings,
    announcement
  };
}
