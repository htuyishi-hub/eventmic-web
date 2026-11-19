import { vi } from 'vitest';

export function createMockAudioContext(options = {}) {
  const destination = {
    maxChannelCount: options.maxChannelCount ?? 2,
    channelCount: 2,
    channelCountMode: 'explicit',
    channelInterpretation: 'discrete'
  };

  const createGain = () => ({
    gain: {
      value: 1.0,
      setValueAtTime: vi.fn((val) => {}),
      linearRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn()
    },
    connect: vi.fn(),
    disconnect: vi.fn()
  });

  const ctx = {
    state: options.state || 'running',
    sampleRate: options.sampleRate || 48000,
    currentTime: 10.0,
    baseLatency: 0.005,
    outputLatency: 0.015,
    destination,
    createAnalyser: vi.fn(() => ({
      fftSize: 256,
      frequencyBinCount: 128,
      getByteTimeDomainData: vi.fn((arr) => arr.fill(128)),
      connect: vi.fn(),
      disconnect: vi.fn()
    })),
    createBiquadFilter: vi.fn(() => ({
      type: 'highpass',
      frequency: { value: 80, setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn()
    })),
    createScriptProcessor: vi.fn(() => ({
      onaudioprocess: null,
      connect: vi.fn(),
      disconnect: vi.fn()
    })),
    createDynamicsCompressor: vi.fn(() => ({
      threshold: { value: -3, setValueAtTime: vi.fn() },
      ratio: { value: 20, setValueAtTime: vi.fn() },
      attack: { value: 0.001, setValueAtTime: vi.fn() },
      release: { value: 0.05, setValueAtTime: vi.fn() },
      knee: { value: 0, setValueAtTime: vi.fn() },
      reduction: 0,
      connect: vi.fn(),
      disconnect: vi.fn()
    })),
    createGain: vi.fn(createGain),
    createChannelMerger: vi.fn((count) => ({
      numberOfInputs: count,
      connect: vi.fn(),
      disconnect: vi.fn()
    })),
    createOscillator: vi.fn(() => ({
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    })),
    createMediaStreamSource: vi.fn(() => ({
      connect: vi.fn(),
      disconnect: vi.fn()
    })),
    createMediaStreamDestination: vi.fn(() => ({
      stream: { id: 'mock-stream' }
    })),
    setSinkId: vi.fn().mockResolvedValue(),
    resume: vi.fn().mockResolvedValue(),
    close: vi.fn().mockResolvedValue()
  };

  if (options.hasSetSinkId === false) {
    delete ctx.setSinkId;
  }

  return ctx;
}
