/**
 * Audio test tone generation and speech announcement helpers.
 */

import { connectRouting } from './audioRouting.js';

export function play1kHzTone(ctx, merger, channelCount, kind, currentRouting) {
  if (!ctx || !merger) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1000, now);

  // -18 dBFS amplitude ≈ 0.126 with 50ms smooth ramp in/out
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.126, now + 0.05);
  gain.gain.setValueAtTime(0.126, now + 1.45);
  gain.gain.linearRampToValueAtTime(0, now + 1.5);
  osc.connect(gain);

  let targetRouting = currentRouting || { mode: 'both' };
  if (kind === 'left') targetRouting = { mode: 'left' };
  else if (kind === 'right') targetRouting = { mode: 'right' };
  else if (kind === 'centre' || kind === 'both') targetRouting = { mode: 'both' };
  else if (typeof kind === 'number') targetRouting = { mode: 'channel', channel: kind };

  connectRouting(gain, merger, targetRouting, channelCount);
  osc.start(now);
  osc.stop(now + 1.5);

  setTimeout(() => {
    try {
      osc.disconnect();
      gain.disconnect();
    } catch {}
  }, 1600);
}

export function speakAnnouncement(text = 'Audio test') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.volume = 0.9;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
