/**
 * Pure audio helpers and DSP routines for /check ("Speakers and amplifiers").
 * All processing runs locally in the browser; no audio or results leave the device.
 */

export const START_LEVEL_DB = -30;
export const RAMP_SECONDS = 1.5;
export const DEFAULT_CAP_DB = -12;
export const CONFIRM_THRESHOLD_DB = -18;
export const FEEDBACK_CUT_RAMP_SECONDS = 0.02;

export function dbToGain(db) {
  return Math.pow(10, db / 20);
}

export function clampLevelDb(targetDb, capDb = DEFAULT_CAP_DB) {
  return Math.min(Number(targetDb), Number(capDb));
}

export function needsLevelConfirmation(targetDb, capDb = DEFAULT_CAP_DB) {
  return clampLevelDb(targetDb, capDb) > CONFIRM_THRESHOLD_DB;
}

/**
 * Schedules a safe level ramp on an AudioParam:
 * always starts at -30 dBFS and ramps linearly over 1.5 s to min(targetDb, capDb).
 */
export function scheduleSafeRamp(gainParam, now, targetDb, capDb = DEFAULT_CAP_DB) {
  const effectiveDb = clampLevelDb(targetDb, capDb);
  const startGain = dbToGain(START_LEVEL_DB);
  const targetGain = dbToGain(effectiveDb);

  gainParam.cancelScheduledValues(now);
  gainParam.setValueAtTime(startGain, now);
  gainParam.linearRampToValueAtTime(targetGain, now + RAMP_SECONDS);

  return { startDb: START_LEVEL_DB, effectiveDb, startGain, targetGain, rampSeconds: RAMP_SECONDS };
}

/**
 * Immediately cuts output with a 20 ms ramp (used by Feedback Guard and Stop).
 */
export function cutOutputWithRamp(gainParam, now) {
  const current = typeof gainParam.value === 'number' ? gainParam.value : 0;
  gainParam.cancelScheduledValues(now);
  gainParam.setValueAtTime(current, now);
  gainParam.linearRampToValueAtTime(0, now + FEEDBACK_CUT_RAMP_SECONDS);
}

/**
 * Generates a 3 ms windowed 1.5 kHz click template for delay cross-correlation.
 */
export function buildClickTemplate(sampleRate = 48000) {
  const len = Math.max(16, Math.round(sampleRate * 0.003));
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const win = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (len - 1)));
    out[i] = win * Math.sin((2 * Math.PI * 1500 * i) / sampleRate);
  }
  return out;
}

/**
 * Cross-correlates a recorded mono buffer against clickTemplate around each expected
 * click emission offset, returning detected delays in ms (median and min-max range).
 */
export function findClicksByCrossCorrelation(
  recorded,
  clickTemplate,
  expectedOffsetsSamples,
  sampleRate = 48000,
  options = {}
) {
  const maxDelaySamples = Math.round(((options.maxDelayMs ?? 600) / 1000) * sampleRate);
  const minPeakRatio = options.minPeakRatio ?? 4.0;
  const minAbsPeak = options.minAbsPeak ?? 1e-4;

  let templateEnergy = 0;
  for (let k = 0; k < clickTemplate.length; k++) {
    templateEnergy += clickTemplate[k] * clickTemplate[k];
  }
  if (templateEnergy === 0) {
    return { detectedDelaysMs: [], medianMs: null, minMs: null, maxMs: null, detectedCount: 0 };
  }

  const delaysMs = [];

  for (const startSample of expectedOffsetsSamples) {
    const searchStart = Math.max(0, startSample);
    const searchEnd = Math.min(recorded.length - clickTemplate.length, startSample + maxDelaySamples);
    if (searchEnd <= searchStart) continue;

    let bestIdx = -1;
    let bestScore = 0;
    let sumAbs = 0;
    let count = 0;

    for (let i = searchStart; i <= searchEnd; i++) {
      let dot = 0;
      for (let k = 0; k < clickTemplate.length; k++) {
        dot += recorded[i + k] * clickTemplate[k];
      }
      const absScore = Math.abs(dot) / templateEnergy;
      sumAbs += absScore;
      count++;
      if (absScore > bestScore) {
        bestScore = absScore;
        bestIdx = i;
      }
    }

    const avgScore = count > 0 ? sumAbs / count : 0;
    if (bestIdx >= 0 && bestScore >= minAbsPeak && (avgScore === 0 || bestScore / avgScore >= minPeakRatio)) {
      const delayMs = ((bestIdx - startSample) / sampleRate) * 1000;
      delaysMs.push(Math.round(delayMs * 10) / 10);
    }
  }

  if (delaysMs.length === 0) {
    return { detectedDelaysMs: [], medianMs: null, minMs: null, maxMs: null, detectedCount: 0 };
  }

  const sorted = [...delaysMs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianMs = sorted.length % 2 === 1
    ? sorted[mid]
    : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;

  return {
    detectedDelaysMs: delaysMs,
    medianMs,
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
    detectedCount: delaysMs.length
  };
}

/**
 * Detects sustained narrow-band feedback squeal from FFT magnitude bins (in dBFS).
 * Triggers when a narrow peak rises quickly above the spectrum median across consecutive frames.
 */
export function detectFeedbackSqueal(binsDb, prevState = { streak: 0, lastPeakDb: -120 }) {
  if (!binsDb || binsDb.length < 8) {
    return { triggered: false, streak: 0, lastPeakDb: -120, prominenceDb: 0, peakBin: -1 };
  }

  let peakBin = 0;
  let peakDb = -Infinity;
  const copy = new Float32Array(binsDb.length);
  for (let i = 0; i < binsDb.length; i++) {
    copy[i] = binsDb[i];
    if (i >= 2 && binsDb[i] > peakDb) {
      peakDb = binsDb[i];
      peakBin = i;
    }
  }

  copy.sort();
  const medianDb = copy[Math.floor(copy.length / 2)];
  const prominenceDb = peakDb - medianDb;

  const isNarrowPeak = prominenceDb >= 24 && peakDb >= -42;
  const isRisingOrSustained = peakDb >= prevState.lastPeakDb - 1.5;

  const nextStreak = isNarrowPeak && isRisingOrSustained ? prevState.streak + 1 : 0;
  const triggered = nextStreak >= 3;

  return {
    triggered,
    streak: nextStreak,
    lastPeakDb: peakDb,
    prominenceDb: Math.round(prominenceDb * 10) / 10,
    peakBin
  };
}

export function createPinkNoiseBuffer(ctx, durationSec = 5) {
  const sampleRate = ctx.sampleRate || 48000;
  const length = Math.floor(sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
    b6 = white * 0.115926;
  }
  return buffer;
}

export function isBluetoothLabel(label) {
  return typeof label === 'string' && label.toLowerCase().includes('bluetooth');
}

export function formatSoundCheckReport({
  outputLabel,
  targetDb,
  capDb,
  delayResult,
  feedbackTriggered,
  sinkIdSupported
}) {
  const lines = [
    'DM Sound Check — Speakers and amplifiers',
    `Output: ${outputLabel || 'System default'}`,
    `Target level: ${targetDb} dBFS (cap: ${capDb} dBFS)`,
    `Per-device output routing (setSinkId): ${sinkIdSupported ? 'supported' : 'not supported in this browser'}`
  ];

  if (isBluetoothLabel(outputLabel)) {
    lines.push('Bluetooth output detected: wireless audio delay is expected.');
  }

  if (delayResult) {
    if (delayResult.detectedCount > 0) {
      lines.push(
        `Measured delay: median ${delayResult.medianMs} ms (range ${delayResult.minMs}–${delayResult.maxMs} ms, ${delayResult.detectedCount}/5 clicks). Includes laptop audio stack and any Bluetooth.`
      );
    } else {
      lines.push('Measured delay: no clicks detected (move mic closer or raise level).');
    }
  } else {
    lines.push('Measured delay: not run');
  }

  lines.push(`Feedback guard: ${feedbackTriggered ? 'TRIGGERED (output cut with 20 ms ramp)' : 'OK (no squeal detected)'}`);
  return lines.join('\n');
}
