/**
 * EventMic Host Audio Engine.
 * Manages Web Audio processing graph, filtering, gate, limiter, routing, and meters.
 */

import { getAudioCapabilities } from './audioCapabilities.js';
import { connectRouting, loadSavedRouting, saveRouting } from './audioRouting.js';
import {
  enumerateOutputDevices,
  saveActiveDevice,
  isDeviceUnplugged,
  listenDeviceChanges
} from './audioDevices.js';
import { play1kHzTone } from './audioTone.js';
import { buildAudioGraph, computeRmsLevel } from './audioGraph.js';

export class HostAudioEngine {
  constructor() {
    this.ctx = null;
    this.sourceNode = null;
    this.currentStream = null;
    this.chromeWorkaroundAudio = null;
    this.g = null;

    this.volume = 1.0;
    this.isMuted = false;
    this.highPassConfig = { enabled: true, hz: 80 };
    this.gateConfig = { enabled: false, thresholdDb: -45, releaseMs: 150 };
    this.limiterEnabled = true;
    this.routingConfig = loadSavedRouting();
    this.activeDeviceId = '';
    this.activeDeviceLabel = 'Default Audio Output';
    this.listeners = new Map();
    this._handleDeviceChange = async () => {
      this.emit('devicechange');
      const devs = await enumerateOutputDevices();
      if (isDeviceUnplugged(this.activeDeviceId, devs)) {
        const missing = this.activeDeviceLabel;
        await this.setOutputDevice('');
        this.emit('device_unplugged', { disconnectedDevice: missing });
      }
    };
    this._unsubDeviceChange = listenDeviceChanges(this._handleDeviceChange);
  }

  ensureContext() {
    if (this.ctx) return this.ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) throw new Error('Web Audio API not supported');
    this.ctx = new AudioCtx();
    this.ctx.onstatechange = () => this.emit('stateChange', this.ctx.state);
    if (typeof document !== 'undefined') {
      this.chromeWorkaroundAudio = document.createElement('audio');
      this.chromeWorkaroundAudio.muted = true;
      this.chromeWorkaroundAudio.autoplay = true;
      this.chromeWorkaroundAudio.className = 'hidden';
      this.chromeWorkaroundAudio.setAttribute('aria-hidden', 'true');
      document.body.appendChild(this.chromeWorkaroundAudio);
    }
    this.g = buildAudioGraph(this.ctx, {
      highPass: this.highPassConfig,
      gate: this.gateConfig,
      limiterEnabled: this.limiterEnabled,
      volume: this.volume,
      isMuted: this.isMuted,
      routing: this.routingConfig
    });
    return this.ctx;
  }

  attachStream(stream) {
    if (!stream) {
      if (this.sourceNode) { try { this.sourceNode.disconnect(); } catch {} this.sourceNode = null; }
      if (this.chromeWorkaroundAudio) this.chromeWorkaroundAudio.srcObject = null;
      this.currentStream = null;
      return;
    }
    this.ensureContext();
    this.currentStream = stream;
    if (this.chromeWorkaroundAudio) {
      this.chromeWorkaroundAudio.srcObject = stream;
      this.chromeWorkaroundAudio.play().catch(() => {});
    }
    if (this.sourceNode) { try { this.sourceNode.disconnect(); } catch {} }
    this.sourceNode = this.ctx.createMediaStreamSource(stream);
    this.sourceNode.connect(this.g.inputAnalyser);
    this.sourceNode.connect(this.g.highPassFilter);
  }

  async setOutputDevice(id) {
    this.activeDeviceId = id || '';
    if (this.ctx && typeof this.ctx.setSinkId === 'function') {
      await this.ctx.setSinkId(this.activeDeviceId);
    } else if (this.g?.outputAudioEl && typeof this.g.outputAudioEl.setSinkId === 'function') {
      await this.g.outputAudioEl.setSinkId(this.activeDeviceId);
    }
    saveActiveDevice(this.activeDeviceId, this.activeDeviceLabel);
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(2, Number(vol) || 0));
    if (this.g?.volumeGain && this.ctx) {
      this.g.volumeGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (this.g?.muteGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.g.muteGain.gain.cancelScheduledValues(now);
      this.g.muteGain.gain.setValueAtTime(this.g.muteGain.gain.value, now);
      this.g.muteGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 1, now + 0.01);
    }
  }

  setHighPass({ enabled, hz }) {
    this.highPassConfig = { enabled: Boolean(enabled), hz: Number(hz) || 80 };
    if (this.g?.highPassFilter && this.ctx) {
      this.g.highPassFilter.type = this.highPassConfig.enabled ? 'highpass' : 'allpass';
      if (this.highPassConfig.enabled) {
        this.g.highPassFilter.frequency.setValueAtTime(this.highPassConfig.hz, this.ctx.currentTime);
      }
    }
  }

  setGate({ enabled, thresholdDb, releaseMs }) {
    this.gateConfig = {
      enabled: enabled !== undefined ? Boolean(enabled) : this.gateConfig.enabled,
      thresholdDb: thresholdDb !== undefined ? Number(thresholdDb) : this.gateConfig.thresholdDb,
      releaseMs: releaseMs !== undefined ? Number(releaseMs) : this.gateConfig.releaseMs
    };
  }

  setLimiter(enabled) {
    this.limiterEnabled = Boolean(enabled);
    if (this.g?.limiterNode && this.ctx) {
      this.g.limiterNode.threshold.setValueAtTime(this.limiterEnabled ? -3 : 0, this.ctx.currentTime);
      this.g.limiterNode.ratio.setValueAtTime(this.limiterEnabled ? 20 : 1, this.ctx.currentTime);
    }
  }

  setRouting(config) {
    this.routingConfig = config || { mode: 'both' };
    saveRouting(this.routingConfig);
    if (this.g?.muteGain && this.g?.merger) {
      connectRouting(this.g.muteGain, this.g.merger, this.routingConfig, this.g.channelCount);
    }
  }

  playTestTone(kind) {
    this.ensureContext();
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    play1kHzTone(this.ctx, this.g.merger, this.g.channelCount, kind, this.routingConfig);
  }

  getLevels() {
    const inLvl = this.currentStream ? computeRmsLevel(this.g?.inputAnalyser) : 0;
    const outLvl = this.isMuted ? 0 : computeRmsLevel(this.g?.outputAnalyser);
    const reduction = this.g?.limiterNode?.reduction || 0;
    return {
      in: Number(inLvl.toFixed(3)),
      out: Number(outLvl.toFixed(3)),
      clipping: outLvl >= 0.89,
      limiterActive: typeof reduction === 'number' && reduction < -0.5
    };
  }

  getCapabilities() {
    return getAudioCapabilities(this.ctx, { deviceId: this.activeDeviceId, label: this.activeDeviceLabel });
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach(fn => { try { fn(data); } catch (e) { console.error(e); } });
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
      this.emit('stateChange', this.ctx.state);
    }
  }

  dispose() {
    this._unsubDeviceChange?.();
    this.attachStream(null);
    this.chromeWorkaroundAudio?.remove();
    this.g?.outputAudioEl?.remove();
    if (this.ctx && this.ctx.state !== 'closed') this.ctx.close().catch(() => {});
    this.listeners.clear();
  }
}
