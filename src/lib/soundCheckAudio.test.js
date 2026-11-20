import { describe, it, expect, vi } from 'vitest';
import {
  START_LEVEL_DB,
  RAMP_SECONDS,
  dbToGain,
  clampLevelDb,
  needsLevelConfirmation,
  scheduleSafeRamp,
  cutOutputWithRamp,
  buildClickTemplate,
  findClicksByCrossCorrelation,
  detectFeedbackSqueal
} from './soundCheckAudio.js';

function createMockGainParam(initial = 0) {
  return {
    value: initial,
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn()
  };
}

describe('soundCheckAudio ramp, cap, and confirmation rules', () => {
  it('starts at -30 dBFS and ramps over 1.5 s to the chosen level', () => {
    const gain = createMockGainParam();
    const res = scheduleSafeRamp(gain, 2.0, -20, -12);

    expect(res.startDb).toBe(START_LEVEL_DB);
    expect(res.effectiveDb).toBe(-20);
    expect(gain.cancelScheduledValues).toHaveBeenCalledWith(2.0);
    expect(gain.setValueAtTime).toHaveBeenCalledWith(dbToGain(-30), 2.0);
    expect(gain.linearRampToValueAtTime).toHaveBeenCalledWith(dbToGain(-20), 2.0 + RAMP_SECONDS);
  });

  it('never exceeds the user-set cap (default -12 dBFS)', () => {
    const gain = createMockGainParam();
    const res = scheduleSafeRamp(gain, 0, -3, -12);

    expect(clampLevelDb(-3, -12)).toBe(-12);
    expect(res.effectiveDb).toBe(-12);
    expect(gain.linearRampToValueAtTime).toHaveBeenCalledWith(dbToGain(-12), 1.5);
  });

  it('requires confirmation whenever level is above -18 dBFS', () => {
    expect(needsLevelConfirmation(-20, -12)).toBe(false);
    expect(needsLevelConfirmation(-18, -12)).toBe(false);
    expect(needsLevelConfirmation(-17, -12)).toBe(true);
    expect(needsLevelConfirmation(-10, -12)).toBe(true);
  });

  it('cuts output with a 20 ms ramp on feedback guard trigger', () => {
    const gain = createMockGainParam(0.25);
    cutOutputWithRamp(gain, 5.0);
    expect(gain.cancelScheduledValues).toHaveBeenCalledWith(5.0);
    expect(gain.setValueAtTime).toHaveBeenCalledWith(0.25, 5.0);
    expect(gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 5.02);
  });
});

describe('findClicksByCrossCorrelation with synthetic signals', () => {
  it('detects 5 synthetic clicks at known delays and computes median and range in ms', () => {
    const sampleRate = 48000;
    const template = buildClickTemplate(sampleRate);
    const totalSamples = sampleRate * 3; // 3 seconds
    const recorded = new Float32Array(totalSamples);

    // Emit 5 clicks at 0.4s, 0.8s, 1.2s, 1.6s, 2.0s
    const expectedOffsets = [0.4, 0.8, 1.2, 1.6, 2.0].map((s) => Math.round(s * sampleRate));
    // Synthetic delays in ms: [120, 125, 122, 130, 121] -> median 122, range 120..130
    const trueDelaysMs = [120, 125, 122, 130, 121];

    expectedOffsets.forEach((offset, idx) => {
      const delaySamples = Math.round((trueDelaysMs[idx] / 1000) * sampleRate);
      const pos = offset + delaySamples;
      for (let k = 0; k < template.length; k++) {
        recorded[pos + k] += template[k] * 0.5;
      }
    });

    const result = findClicksByCrossCorrelation(recorded, template, expectedOffsets, sampleRate);
    expect(result.detectedCount).toBe(5);
    expect(result.medianMs).toBe(122);
    expect(result.minMs).toBe(120);
    expect(result.maxMs).toBe(130);
  });

  it('returns 0 detected clicks on silent or low-level noise buffer', () => {
    const sampleRate = 48000;
    const template = buildClickTemplate(sampleRate);
    const recorded = new Float32Array(sampleRate * 2);
    const expectedOffsets = [0.4, 0.8, 1.2].map((s) => Math.round(s * sampleRate));

    const result = findClicksByCrossCorrelation(recorded, template, expectedOffsets, sampleRate);
    expect(result.detectedCount).toBe(0);
    expect(result.medianMs).toBeNull();
  });
});

describe('detectFeedbackSqueal', () => {
  it('triggers after sustained rising narrow-band energy', () => {
    const bins = new Float32Array(64).fill(-85);
    let state = { streak: 0, lastPeakDb: -120 };

    bins[20] = -38;
    state = detectFeedbackSqueal(bins, state);
    expect(state.triggered).toBe(false);

    bins[20] = -32;
    state = detectFeedbackSqueal(bins, state);
    expect(state.triggered).toBe(false);

    bins[20] = -26;
    state = detectFeedbackSqueal(bins, state);
    expect(state.triggered).toBe(true);
    expect(state.peakBin).toBe(20);
  });
});
