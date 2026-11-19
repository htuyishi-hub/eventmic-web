/**
 * Pure mapping functions for LiveKit participants and connection states.
 */

export function computeQueueAndFloor(remoteParticipants) {
  const parts = remoteParticipants instanceof Map
    ? Array.from(remoteParticipants.values())
    : Array.isArray(remoteParticipants) ? remoteParticipants : Object.values(remoteParticipants || {});
  const attendees = parts.filter(p => p.identity?.startsWith('att-'));

  let floor = null;
  const speaker = parts.find(p => p.attributes?.floor === 'granted');
  if (speaker) {
    floor = { id: speaker.identity, name: speaker.name || 'Speaker', startedAt: Number(speaker.attributes?.floorStartedAt) || Date.now() };
    if (speaker.attributes?.floorRole || speaker.identity?.startsWith('prin-')) {
      floor.role = speaker.attributes?.floorRole || (speaker.identity?.startsWith('prin-') ? 'principal' : 'attendee');
      floor.mode = speaker.attributes?.floorRole || 'principal';
    }
  }

  const queue = attendees
    .filter(p => p.attributes?.hand && String(p.attributes.hand).trim() !== '' && p.attributes?.floor !== 'granted')
    .map(p => ({
      id: p.identity,
      name: p.name || 'Attendee',
      reason: p.attributes?.handReason || 'question',
      raisedAt: Number(p.attributes.hand) || Date.now()
    }))
    .sort((a, b) => a.raisedAt - b.raisedAt);

  return { attendeeCount: attendees.length, queue, floor };
}

export function mapConnectionState(lkState) {
  switch (lkState) {
    case 'connecting': return 'connecting';
    case 'connected': return 'connected';
    case 'reconnecting': case 'signalReconnecting': return 'reconnecting';
    default: return 'disconnected';
  }
}
