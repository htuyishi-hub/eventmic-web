import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HostAudioEngine } from './hostAudio.js';
import { createMockAudioContext } from './mockAudioContext.js';
import { loadSavedDevice } from './audioDevices.js';
import { getAudioCapabilities } from './audioCapabilities.js';

describe('HostAudioEngine and Audio Output Subsystem', () => {
  let mockCtx;
  let engine;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    mockCtx = createMockAudioContext({ maxChannelCount: 2 });
    window.AudioContext = vi.fn(() => mockCtx);
    window.webkitAudioContext = window.AudioContext;
    engine = new HostAudioEngine();
  });

  afterEach(() => {
    engine.dispose();
  });

  describe('1. Volume Clamps', () => {
    it('clamps volume to range [0, 2]', () => {
      engine.ensureContext();
      engine.setVolume(-0.5);
      expect(engine.volume).toBe(0);
      expect(engine.g.volumeGain.gain.setValueAtTime).toHaveBeenCalledWith(0, 10.0);

      engine.setVolume(1.4);
      expect(engine.volume).toBe(1.4);
      expect(engine.g.volumeGain.gain.setValueAtTime).toHaveBeenCalledWith(1.4, 10.0);

      engine.setVolume(2.8);
      expect(engine.volume).toBe(2);
      expect(engine.g.volumeGain.gain.setValueAtTime).toHaveBeenCalledWith(2, 10.0);
    });
  });

  describe('2. Click-Free Mute Ramp', () => {
    it('schedules a 10 ms linear gain ramp on mute and unmute', () => {
      engine.ensureContext();
      engine.setMuted(true);
      expect(engine.isMuted).toBe(true);
      expect(engine.g.muteGain.gain.cancelScheduledValues).toHaveBeenCalledWith(10.0);
      expect(engine.g.muteGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 10.01);

      engine.setMuted(false);
      expect(engine.isMuted).toBe(false);
      expect(engine.g.muteGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, 10.01);
    });
  });

  describe('3. Channel Routing Graph Construction', () => {
    it('routes Left to channel 0 and Right to channel 1', () => {
      engine.ensureContext();
      const merger = engine.g.merger;
      const muteGain = engine.g.muteGain;

      engine.setRouting({ mode: 'left' });
      expect(muteGain.connect).toHaveBeenCalledWith(merger, 0, 0);

      engine.setRouting({ mode: 'right' });
      expect(muteGain.connect).toHaveBeenCalledWith(merger, 0, 1);
    });

    it('routes Both (centre) to channels 0 and 1', () => {
      engine.ensureContext();
      const merger = engine.g.merger;
      const muteGain = engine.g.muteGain;

      engine.setRouting({ mode: 'both' });
      expect(muteGain.connect).toHaveBeenCalledWith(merger, 0, 0);
      expect(muteGain.connect).toHaveBeenCalledWith(merger, 0, 1);
    });

    it('configures discrete destination for advanced multi-channel routing', () => {
      const multiCtx = createMockAudioContext({ maxChannelCount: 8 });
      window.AudioContext = vi.fn(() => multiCtx);
      const multiEngine = new HostAudioEngine();
      multiEngine.ensureContext();

      expect(multiCtx.destination.channelCount).toBe(8);
      expect(multiCtx.destination.channelInterpretation).toBe('discrete');

      multiEngine.setRouting({ mode: 'channel', channel: 4 });
      expect(multiEngine.g.muteGain.connect).toHaveBeenCalledWith(multiEngine.g.merger, 0, 3);
      multiEngine.dispose();
    });
  });

  describe('4. Saved Device Persistence & Missing Device Fallback', () => {
    it('falls back to default and identifies missing device if saved device is unplugged', () => {
      localStorage.setItem('eventmic_output_device_id', 'focusrite-scarlett-2i2');
      localStorage.setItem('eventmic_output_device_label', 'Focusrite Scarlett (USB)');

      const currentDevices = [
        { deviceId: 'default', label: 'MacBook Pro Speakers' },
        { deviceId: 'headphones', label: 'Built-in Output' }
      ];

      const res = loadSavedDevice(currentDevices);
      expect(res.activeDeviceId).toBe('default');
      expect(res.missingDevice).toEqual({
        id: 'focusrite-scarlett-2i2',
        label: 'Focusrite Scarlett (USB)'
      });
      // Cleans up missing device from storage
      expect(localStorage.getItem('eventmic_output_device_id')).toBeNull();
    });

    it('restores saved device when still connected', () => {
      localStorage.setItem('eventmic_output_device_id', 'headphones');
      localStorage.setItem('eventmic_output_device_label', 'Headphones');

      const currentDevices = [
        { deviceId: 'default', label: 'Default' },
        { deviceId: 'headphones', label: 'Headphones' }
      ];

      const res = loadSavedDevice(currentDevices);
      expect(res.activeDeviceId).toBe('headphones');
      expect(res.missingDevice).toBeNull();
    });
  });

  describe('5. Device Change & Unplugged Handling', () => {
    it('redirects to default and emits device_unplugged when active device vanishes', async () => {
      engine.activeDeviceId = 'external-usb-dac';
      engine.activeDeviceLabel = 'USB DAC 8ch';

      const unplugHandler = vi.fn();
      engine.on('device_unplugged', unplugHandler);

      // Simulate devicechange event when device was unplugged
      navigator.mediaDevices = {
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: 'audiooutput', deviceId: 'default', label: 'Built-in' }
        ]),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };

      await engine._handleDeviceChange();
      expect(unplugHandler).toHaveBeenCalledWith({
        disconnectedDevice: 'USB DAC 8ch'
      });
      expect(engine.activeDeviceId).toBe('');
    });
  });

  describe('6. Capabilities Detection with Missing APIs', () => {
    it('gracefully handles missing setSinkId and latency APIs', () => {
      const originalSetSinkId = HTMLMediaElement.prototype.setSinkId;
      delete HTMLMediaElement.prototype.setSinkId;

      try {
        const minimalCtx = {
          state: 'running',
          sampleRate: 44100,
          destination: { maxChannelCount: 2 }
        };

        const caps = getAudioCapabilities(minimalCtx, {
          deviceId: 'default',
          label: 'Default Output'
        });

        expect(caps.sampleRate).toBe('44100 Hz');
        expect(caps.baseLatency).toBe('n/a');
        expect(caps.outputLatency).toBe('n/a');
        expect(caps.audioContextSinkIdSupported).toBe(false);
        expect(caps.elementSinkIdSupported).toBe(false);
        expect(caps.multiChannelSupported).toBe(false);
        expect(caps.sinkIdNote).toContain('Chrome or Edge');
      } finally {
        if (originalSetSinkId) {
          HTMLMediaElement.prototype.setSinkId = originalSetSinkId;
        }
      }
    });
  });
});
