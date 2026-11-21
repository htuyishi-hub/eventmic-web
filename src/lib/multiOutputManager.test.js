import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MultiOutputManager, MAX_OUTPUTS } from './multiOutputManager.js';

function makeMockAudioContextClass(withSetSinkId = true) {
  const instances = [];
  class MockAudioContext {
    constructor() {
      this.state = 'running';
      this.currentTime = 1.0;
      this.outputLatency = 0.024;
      this.baseLatency = 0.01;
      this.destination = {};
      this.gains = [];
      if (withSetSinkId) {
        this.setSinkId = vi.fn().mockResolvedValue(undefined);
      }
      instances.push(this);
    }
    createMediaStreamSource() {
      return { connect: vi.fn(), disconnect: vi.fn() };
    }
    createDelay() {
      return { delayTime: { setValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() };
    }
    createGain() {
      const param = {
        value: 0,
        cancelScheduledValues: vi.fn(),
        setValueAtTime: vi.fn((v) => { param.value = v; }),
        linearRampToValueAtTime: vi.fn((v) => { param.value = v; })
      };
      const node = { gain: param, connect: vi.fn(), disconnect: vi.fn() };
      this.gains.push(node);
      return node;
    }
    createAnalyser() {
      return { fftSize: 256, frequencyBinCount: 128, getFloatTimeDomainData: vi.fn(), connect: vi.fn(), disconnect: vi.fn() };
    }
    createMediaStreamDestination() {
      return { stream: {} };
    }
    resume = vi.fn().mockResolvedValue(undefined);
    close = vi.fn().mockResolvedValue(undefined);
  }
  return { MockAudioContext, instances };
}

describe('MultiOutputManager', () => {
  let origAudioCtx;

  beforeEach(() => {
    origAudioCtx = window.AudioContext;
    localStorage.clear();
  });

  afterEach(() => {
    window.AudioContext = origAudioCtx;
  });

  it('creates one AudioContext per distinct deviceId and rejects a 5th output', async () => {
    const { MockAudioContext, instances } = makeMockAudioContextClass(true);
    window.AudioContext = MockAudioContext;

    const mgr = new MultiOutputManager({ initialPreset: { outputs: [], missingBehaviour: 'mute_warn' } });
    mgr.attachBusStream({});

    mgr.addOutput({ id: 'o1', name: 'Main PA', deviceId: 'dev-pa', volume: 0.9 });
    mgr.addOutput({ id: 'o2', name: 'Lobby BT', deviceId: 'dev-bt', volume: 0.7 });
    mgr.addOutput({ id: 'o3', name: 'Booth', deviceId: 'dev-pa', volume: 0.5 }); // shares dev-pa
    mgr.addOutput({ id: 'o4', name: 'Radio', deviceId: 'dev-rad', volume: 0.8 });

    await new Promise((r) => setTimeout(r, 10));
    expect(instances.length).toBe(3); // 3 distinct deviceIds
    expect(mgr.getOutputs().length).toBe(MAX_OUTPUTS);
    expect(() => mgr.addOutput({ name: 'Extra 5th', deviceId: 'dev-5' })).toThrow(/Maximum 4 outputs/);
  });

  it('enforces maxLevel cap, 500 ms soft start on unmute, and 10 ms ramp on gain changes', async () => {
    const { MockAudioContext } = makeMockAudioContextClass(true);
    window.AudioContext = MockAudioContext;

    const mgr = new MultiOutputManager({ initialPreset: { outputs: [], missingBehaviour: 'mute_warn' } });
    mgr.attachBusStream({});
    mgr.addOutput({ id: 'o1', name: 'PA', deviceId: 'dev-1', volume: 0.9, maxLevel: 0.6, muted: false });

    await new Promise((r) => setTimeout(r, 10));
    const node = mgr.nodes.get('o1');
    // Capped at maxLevel 0.6 with 500 ms soft start (1.0 + 0.5 = 1.5)
    expect(node.gain.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0.6, 1.5);

    // Volume change uses 10 ms ramp (1.0 + 0.01 = 1.01)
    mgr.updateOutput('o1', { volume: 0.4 });
    expect(node.gain.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0.4, 1.01);

    // Mute then unmute triggers 500 ms soft start
    mgr.updateOutput('o1', { muted: true });
    expect(node.gain.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 1.01);
    mgr.updateOutput('o1', { muted: false });
    expect(node.gain.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0.4, 1.5);
  });

  it('handles solo and muteAllOutputs panic correctly', async () => {
    const { MockAudioContext } = makeMockAudioContextClass(true);
    window.AudioContext = MockAudioContext;

    const mgr = new MultiOutputManager({ initialPreset: { outputs: [], missingBehaviour: 'mute_warn' } });
    mgr.attachBusStream({});
    mgr.addOutput({ id: 'o1', name: 'A', deviceId: 'd1', volume: 0.8 });
    mgr.addOutput({ id: 'o2', name: 'B', deviceId: 'd2', volume: 0.8 });

    await new Promise((r) => setTimeout(r, 10));
    mgr.updateOutput('o1', { solo: true });
    expect(mgr.nodes.get('o1').gain.gain.value).toBe(0.8);
    expect(mgr.nodes.get('o2').gain.gain.value).toBe(0);

    mgr.muteAllOutputs();
    expect(mgr.getOutputs().every((o) => o.muted)).toBe(true);
    expect(mgr.nodes.get('o1').gain.gain.value).toBe(0);
  });

  it('supports mute_warn and fallback missing-device behaviours plus auto-reconnect', async () => {
    const { MockAudioContext } = makeMockAudioContextClass(true);
    window.AudioContext = MockAudioContext;
    const onMissing = vi.fn();

    const mgr = new MultiOutputManager({
      initialPreset: { outputs: [], missingBehaviour: 'mute_warn' },
      onMissing
    });
    mgr.attachBusStream({});
    mgr.addOutput({ id: 'o1', name: 'BT', deviceId: 'dev-bt', volume: 0.7 });
    await new Promise((r) => setTimeout(r, 10));

    // Unplug dev-bt
    await mgr.onDeviceChange([{ deviceId: 'dev-wired', label: 'Wired' }]);
    expect(onMissing).toHaveBeenCalledTimes(1);
    expect(mgr.getOutputs()[0].status).toBe('missing');
    expect(mgr.nodes.get('o1').gain.gain.value).toBe(0);

    // Reconnect dev-bt -> status becomes connected and soft-starts
    await mgr.onDeviceChange([{ deviceId: 'dev-wired', label: 'Wired' }, { deviceId: 'dev-bt', label: 'BT' }]);
    expect(mgr.getOutputs()[0].status).toBe('connected');
    expect(mgr.nodes.get('o1').gain.gain.value).toBe(0.7);

    // Test fallback behaviour
    mgr.setMissingBehaviour('fallback');
    await mgr.onDeviceChange([{ deviceId: 'dev-wired', label: 'Wired' }]);
    expect(mgr.getOutputs()[0].status).toBe('missing');
    expect(mgr.getOutputs()[0].fallbackDeviceId).toBe('dev-wired');
  });

  it('exports and imports venue preset JSON with no secrets', () => {
    const mgr = new MultiOutputManager({ initialPreset: { outputs: [], missingBehaviour: 'mute_warn' } });
    mgr.addOutput({ id: 'o1', name: 'Main PA', deviceId: 'd1', volume: 0.85, maxLevel: 0.9, delayMs: 45 });

    const json = mgr.exportPresetJson();
    expect(json).not.toMatch(/token|secret|passcode|pin/i);

    const mgr2 = new MultiOutputManager({ initialPreset: { outputs: [], missingBehaviour: 'mute_warn' } });
    const imported = mgr2.importPresetJson(json);
    expect(imported).toHaveLength(1);
    expect(imported[0].name).toBe('Main PA');
    expect(imported[0].delayMs).toBe(45);
  });
});
