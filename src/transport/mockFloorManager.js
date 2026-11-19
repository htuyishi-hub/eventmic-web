/**
 * Floor rules, principal management, and queue sorting helpers for MockTransport.
 */

export const VALID_REASONS = ['question', 'comment', 'compliment', 'clarification'];

export function generate6DigitPin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isFairModeActive(settings) {
  if (!settings) return false;
  if (settings.fairMode === 'on') return true;
  if (settings.fairMode === 'auto' && settings.sessionEndsAt) {
    const minutesLeft = (settings.sessionEndsAt - Date.now()) / (60 * 1000);
    return minutesLeft <= (settings.fairFromMinutesBeforeEnd || 15);
  }
  return false;
}

export function sortQueue(queue, speakHistory, fairActive) {
  const enriched = queue.map((item) => {
    const history = speakHistory?.get(item.id);
    const speakCount = history?.count || 0;
    return {
      ...item,
      speakCount,
      hasNotSpoken: speakCount === 0,
      reason: item.reason || 'question'
    };
  });

  if (fairActive) {
    enriched.sort((a, b) => {
      if (a.speakCount !== b.speakCount) {
        return a.speakCount - b.speakCount;
      }
      return a.raisedAt - b.raisedAt;
    });
  } else {
    enriched.sort((a, b) => a.raisedAt - b.raisedAt);
  }

  return enriched;
}

export function recordSpeakHistoryEnd(speakHistory, id, name, startedAt, reason) {
  if (!id || !startedAt) return;
  const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  const record = speakHistory.get(id) || {
    id,
    name: name || 'Attendee',
    count: 0,
    totalSeconds: 0,
    lastSpokeAt: 0,
    history: []
  };

  record.count += 1;
  record.totalSeconds += durationSeconds;
  record.lastSpokeAt = Date.now();
  record.history.push({
    startedAt,
    endedAt: Date.now(),
    durationSeconds,
    reason: reason || 'question'
  });

  speakHistory.set(id, record);
}
