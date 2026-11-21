import { computeRmsLevel } from './audioGraph.js';
import { scheduleSafeRamp, DEFAULT_CAP_DB } from './soundCheckAudio.js';

export const MAX_OUTPUTS = 4;
export const PRESET_STORAGE_KEY = 'dm_venue_outputs_preset';
const SOFT_START_SEC = 0.5;
const GAIN_RAMP_SEC = 0.01;

function makeId() {
  return 'out-' + Math.random().toString(36).slice(2, 8);
}

export function normalizeOutput(raw = {}) {
  const maxLevel = Math.max(0.05, Math.min(1, Number(raw.maxLevel ?? 1)));
  const volume = Math.max(0, Math.min(1, Number(raw.volume ?? 0.8)));
  return {
    id: String(raw.id || makeId()),
    name: String(raw.name || 'Output').trim().slice(0, 48) || 'Output',
    deviceId: String(raw.deviceId ?? ''),
    enabled: raw.enabled !== undefined ? Boolean(raw.enabled) : true,
    volume,
    maxLevel,
    muted: Boolean(raw.muted),
    solo: Boolean(raw.solo),
    delayMs: Math.max(0, Math.min(2000, Number(raw.delayMs || 0))),
    status: raw.status || 'connected',
    outputLatency: raw.outputLatency ?? 'n/a',
    baseLatency: raw.baseLatency ?? 'n/a'
  };
}

export function loadVenuePreset() {
  try {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) return { outputs: [], missingBehaviour: 'mute_warn' };
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed?.outputs) ? parsed.outputs.slice(0, MAX_OUTPUTS).map(normalizeOutput) : [];
    const missingBehaviour = parsed?.missingBehaviour === 'fallback' ? 'fallback' : 'mute_warn';
    return { outputs: list, missingBehaviour };
  } catch {
    return { outputs: [], missingBehaviour: 'mute_warn' };
  }
}

export function saveVenuePreset(outputs, missingBehaviour = 'mute_warn') {
  try {
    const clean = outputs.slice(0, MAX_OUTPUTS).map((o) => ({
      id: o.id,
      name: o.name,
      deviceId: o.deviceId,
      enabled: o.enabled,
      volume: o.volume,
      maxLevel: o.maxLevel,
      muted: o.muted,
      solo: o.solo,
      delayMs: o.delayMs
    }));
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify({ version: 1, missingBehaviour, outputs: clean }));
  } catch {}
}

export class MultiOutputManager {
  constructor(options = {}) {
    const preset = options.initialPreset || loadVenuePreset();
    this.outputs = preset.outputs || [];
    this.missingBehaviour = preset.missingBehaviour || 'mute_warn';
    this.busStream = null;
    this.deviceContexts = new Map(); // deviceId -> { ctx, sinkAudioEl }
    this.nodes = new Map(); // outputId -> { source, delay, gain, analyser, deviceId }
    this.availableDevices = [];
    this.onChange = options.onChange || (() => {});
    this.onMissing = options.onMissing || (() => {});
  }

  getOutputs() {
    return this.outputs.map((o) => ({ ...o }));
  }

  setMissingBehaviour(behaviour) {
    this.missingBehaviour = behaviour === 'fallback' ? 'fallback' : 'mute_warn';
    saveVenuePreset(this.outputs, this.missingBehaviour);
    this.onChange(this.getOutputs());
  }

  addOutput(raw) {
    if (this.outputs.length >= MAX_OUTPUTS) {
      throw new Error(`Maximum ${MAX_OUTPUTS} outputs allowed`);
    }
    const item = normalizeOutput(raw);
    this.outputs.push(item);
    saveVenuePreset(this.outputs, this.missingBehaviour);
    if (this.busStream) this._attachOutputNode(item, true);
    this._syncAllGains(false);
    this.onChange(this.getOutputs());
    return { ...item };
  }

  removeOutput(id) {
    const idx = this.outputs.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    const [removed] = this.outputs.splice(idx, 1);
    this._detachOutputNode(removed.id);
    this._gcUnusedContexts();
    saveVenuePreset(this.outputs, this.missingBehaviour);
    this._syncAllGains(false);
    this.onChange(this.getOutputs());
    return true;
  }

  updateOutput(id, patch = {}) {
    const out = this.outputs.find((o) => o.id === id);
    if (!out) return null;
    const wasSilent = !out.enabled || out.muted;
    const prevDeviceId = out.deviceId;

    if (patch.name !== undefined) out.name = String(patch.name).trim().slice(0, 48) || out.name;
    if (patch.deviceId !== undefined) out.deviceId = String(patch.deviceId);
    if (patch.enabled !== undefined) out.enabled = Boolean(patch.enabled);
    if (patch.volume !== undefined) out.volume = Math.max(0, Math.min(1, Number(patch.volume)));
    if (patch.maxLevel !== undefined) out.maxLevel = Math.max(0.05, Math.min(1, Number(patch.maxLevel)));
    if (patch.muted !== undefined) out.muted = Boolean(patch.muted);
    if (patch.solo !== undefined) out.solo = Boolean(patch.solo);
    if (patch.delayMs !== undefined) out.delayMs = Math.max(0, Math.min(2000, Number(patch.delayMs)));

    if (this.busStream && prevDeviceId !== out.deviceId) {
      this._detachOutputNode(out.id);
      this._gcUnusedContexts();
      this._attachOutputNode(out, true);
    } else {
      const n = this.nodes.get(out.id);
      if (n?.delay && n.ctx) {
        n.delay.delayTime.setValueAtTime(out.delayMs / 1000, n.ctx.currentTime);
      }
    }

    const becameActive = wasSilent && out.enabled && !out.muted;
    this._syncSingleOrAll(out.id, becameActive);
    saveVenuePreset(this.outputs, this.missingBehaviour);
    this.onChange(this.getOutputs());
    return { ...out };
  }

  muteAllOutputs() {
    for (const out of this.outputs) out.muted = true;
    this._syncAllGains(false);
    saveVenuePreset(this.outputs, this.missingBehaviour);
    this.onChange(this.getOutputs());
  }

  attachBusStream(stream) {
    this.busStream = stream;
    for (const id of Array.from(this.nodes.keys())) this._detachOutputNode(id);
    if (!stream) return;
    for (const out of this.outputs) {
      this._attachOutputNode(out, out.enabled && !out.muted);
    }
    this._syncAllGains(false);
  }

  async _getOrCreateDeviceContext(deviceId) {
    const key = deviceId || '';
    if (this.deviceContexts.has(key)) return this.deviceContexts.get(key);
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) throw new Error('Web Audio API not supported');

    const ctx = new AudioCtx();
    let sinkAudioEl = null;
    if (typeof ctx.setSinkId !== 'function' && typeof document !== 'undefined') {
      sinkAudioEl = document.createElement('audio');
      sinkAudioEl.autoplay = true;
      sinkAudioEl.className = 'hidden';
      document.body.appendChild(sinkAudioEl);
    }
    const entry = { ctx, sinkAudioEl };
    this.deviceContexts.set(key, entry);

    if (typeof ctx.setSinkId === 'function') {
      if (key) await ctx.setSinkId(key).catch(() => {});
    } else if (sinkAudioEl && key && typeof sinkAudioEl.setSinkId === 'function') {
      await sinkAudioEl.setSinkId(key).catch(() => {});
    }
    ctx.onstatechange = () => {
      for (const o of this.outputs) {
        if ((o.deviceId || '') === key && o.status !== 'missing') {
          o.status = ctx.state === 'suspended' ? 'suspended' : 'connected';
        }
      }
      this.onChange(this.getOutputs());
    };
    return entry;
  }

  async _attachOutputNode(out, softStart = false) {
    if (!this.busStream) return;
    const effectiveDevice = out.fallbackDeviceId ?? out.deviceId;
    const entry = await this._getOrCreateDeviceContext(effectiveDevice);
    const { ctx, sinkAudioEl } = entry;

    out.outputLatency = typeof ctx.outputLatency === 'number' ? Math.round(ctx.outputLatency * 1000) : 'n/a';
    out.baseLatency = typeof ctx.baseLatency === 'number' ? Math.round(ctx.baseLatency * 1000) : 'n/a';
    if (out.status !== 'missing') {
      out.status = ctx.state === 'suspended' ? 'suspended' : 'connected';
    }

    const source = ctx.createMediaStreamSource(this.busStream);
    const delay = ctx.createDelay(2.0);
    delay.delayTime.setValueAtTime(out.delayMs / 1000, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    source.connect(delay);
    delay.connect(gain);
    gain.connect(analyser);

    if (sinkAudioEl && typeof ctx.createMediaStreamDestination === 'function') {
      const dest = ctx.createMediaStreamDestination();
      analyser.connect(dest);
      sinkAudioEl.srcObject = dest.stream;
      sinkAudioEl.play?.().catch(() => {});
    } else {
      analyser.connect(ctx.destination);
    }

    this.nodes.set(out.id, { ctx, source, delay, gain, analyser, deviceId: effectiveDevice });
    this._applyGainForOutput(out, softStart);
    this.onChange(this.getOutputs());
  }

  _detachOutputNode(id) {
    const n = this.nodes.get(id);
    if (!n) return;
    try { n.source?.disconnect(); } catch {}
    try { n.delay?.disconnect(); } catch {}
    try { n.gain?.disconnect(); } catch {}
    try { n.analyser?.disconnect(); } catch {}
    this.nodes.delete(id);
  }

  _gcUnusedContexts() {
    const activeKeys = new Set(this.outputs.map((o) => o.fallbackDeviceId ?? o.deviceId ?? ''));
    for (const [key, entry] of this.deviceContexts.entries()) {
      if (!activeKeys.has(key)) {
        entry.sinkAudioEl?.remove();
        if (entry.ctx && entry.ctx.state !== 'closed') entry.ctx.close().catch(() => {});
        this.deviceContexts.delete(key);
      }
    }
  }

  _computeTargetGain(out) {
    const anySolo = this.outputs.some((o) => o.solo);
    if (!out.enabled || out.muted || out.status === 'missing') return 0;
    if (anySolo && !out.solo) return 0;
    return Math.min(out.volume, out.maxLevel);
  }

  _applyGainForOutput(out, softStart = false) {
    const n = this.nodes.get(out.id);
    if (!n?.gain || !n?.ctx) return;
    const target = this._computeTargetGain(out);
    const now = n.ctx.currentTime;
    const rampSec = softStart && target > 0 ? SOFT_START_SEC : GAIN_RAMP_SEC;
    n.gain.gain.cancelScheduledValues(now);
    n.gain.gain.setValueAtTime(softStart ? 0 : (n.gain.gain.value ?? 0), now);
    n.gain.gain.linearRampToValueAtTime(target, now + rampSec);
  }

  _syncSingleOrAll(changedId, softStartChanged) {
    const anySolo = this.outputs.some((o) => o.solo);
    for (const out of this.outputs) {
      this._applyGainForOutput(out, out.id === changedId && softStartChanged && !anySolo);
    }
  }

  _syncAllGains(softStart = false) {
    for (const out of this.outputs) this._applyGainForOutput(out, softStart);
  }

  async onDeviceChange(devices = []) {
    this.availableDevices = devices;
    const ids = new Set(devices.map((d) => d.deviceId));
    const firstConnected = devices.find((d) => d.deviceId)?.deviceId ?? '';

    for (const out of this.outputs) {
      if (!out.deviceId) {
        out.status = 'connected';
        continue;
      }
      const present = ids.has(out.deviceId);
      if (!present && out.status !== 'missing') {
        out.status = 'missing';
        if (this.missingBehaviour === 'fallback' && firstConnected) {
          out.fallbackDeviceId = firstConnected;
          if (this.busStream) {
            this._detachOutputNode(out.id);
            await this._attachOutputNode(out, true);
          }
        } else {
          this._applyGainForOutput(out, false);
        }
        this.onMissing(out);
      } else if (present && out.status === 'missing') {
        delete out.fallbackDeviceId;
        out.status = 'connected';
        if (this.busStream) {
          this._detachOutputNode(out.id);
          await this._attachOutputNode(out, true);
        } else {
          this._applyGainForOutput(out, true);
        }
      }
    }
    this.onChange(this.getOutputs());
  }

  async resumeAll() {
    for (const entry of this.deviceContexts.values()) {
      if (entry.ctx.state === 'suspended') {
        await entry.ctx.resume().catch(() => {});
      }
    }
    for (const o of this.outputs) {
      if (o.status === 'suspended') o.status = 'connected';
    }
    this.onChange(this.getOutputs());
  }

  async playTestTone(id, targetDb = -20, capDb = DEFAULT_CAP_DB) {
    const out = this.outputs.find((o) => o.id === id);
    if (!out) return;
    const entry = await this._getOrCreateDeviceContext(out.deviceId);
    const { ctx } = entry;
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    scheduleSafeRamp(g.gain, now, targetDb, capDb);
    g.gain.linearRampToValueAtTime(0, now + 2.5);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 2.55);
  }

  getOutputLevels() {
    const map = {};
    for (const out of this.outputs) {
      const n = this.nodes.get(out.id);
      map[out.id] = this._computeTargetGain(out) === 0 ? 0 : computeRmsLevel(n?.analyser);
    }
    return map;
  }

  exportPresetJson() {
    const clean = this.outputs.map(({ id, name, deviceId, enabled, volume, maxLevel, muted, solo, delayMs }) => ({
      id, name, deviceId, enabled, volume, maxLevel, muted, solo, delayMs
    }));
    return JSON.stringify({ version: 1, missingBehaviour: this.missingBehaviour, outputs: clean }, null, 2);
  }

  importPresetJson(jsonText) {
    const parsed = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;
    if (!parsed || !Array.isArray(parsed.outputs)) throw new Error('Invalid preset format');
    if (parsed.outputs.length > MAX_OUTPUTS) throw new Error(`Maximum ${MAX_OUTPUTS} outputs allowed`);
    for (const id of Array.from(this.nodes.keys())) this._detachOutputNode(id);
    this.outputs = parsed.outputs.map(normalizeOutput);
    this.missingBehaviour = parsed.missingBehaviour === 'fallback' ? 'fallback' : 'mute_warn';
    this._gcUnusedContexts();
    saveVenuePreset(this.outputs, this.missingBehaviour);
    if (this.busStream) this.attachBusStream(this.busStream);
    this.onChange(this.getOutputs());
    return this.getOutputs();
  }

  dispose() {
    for (const id of Array.from(this.nodes.keys())) this._detachOutputNode(id);
    for (const entry of this.deviceContexts.values()) {
      entry.sinkAudioEl?.remove();
      if (entry.ctx && entry.ctx.state !== 'closed') entry.ctx.close().catch(() => {});
    }
    this.deviceContexts.clear();
  }
}
