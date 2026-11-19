/**
 * Manages per-source audio chains for principal, attendee, and urgent blip.
 */
import { computeRmsLevel } from './audioGraph.js';

export class SourceChainManager {
  constructor(ctx, volumeGain) {
    this.ctx = ctx;
    this.volumeGain = volumeGain;
    this.sources = new Map();
    this.mutes = { principal: false, attendee: false, urgent: false };
    this.isDucked = false;

    // Duck gain controls ducking of stage & attendee when urgent blip speaks
    this.duckGain = ctx.createGain();
    this.duckGain.gain.setValueAtTime(1.0, ctx.currentTime);
    this.duckGain.connect(volumeGain);

    // Urgent bypasses duck gain directly to volume gain
    this.urgentGain = ctx.createGain();
    this.urgentGain.gain.setValueAtTime(1.0, ctx.currentTime);
    this.urgentGain.connect(volumeGain);
  }

  createChain(role) {
    const ctx = this.ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    const muteGain = ctx.createGain();
    muteGain.gain.setValueAtTime(this.mutes[role] ? 0 : 1.0, ctx.currentTime);

    if (role === 'principal') {
      // Principal chain: HighPass 80Hz -> Limiter -> muteGain -> duckGain
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(80, ctx.currentTime);

      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-3, ctx.currentTime);
      limiter.ratio.setValueAtTime(20, ctx.currentTime);

      hp.connect(limiter);
      limiter.connect(muteGain);
      muteGain.connect(this.duckGain);

      return { inputNode: hp, analyser, muteGain, hp, limiter };
    }

    if (role === 'urgent') {
      // Urgent blip: Own gain -> muteGain -> urgentGain (bypasses ducking)
      const ownGain = ctx.createGain();
      ownGain.gain.setValueAtTime(1.0, ctx.currentTime);
      ownGain.connect(muteGain);
      muteGain.connect(this.urgentGain);
      return { inputNode: ownGain, analyser, muteGain, ownGain };
    }

    // Default Attendee: HighPass -> Gate -> Limiter -> muteGain -> duckGain
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(80, ctx.currentTime);

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-3, ctx.currentTime);
    limiter.ratio.setValueAtTime(20, ctx.currentTime);

    hp.connect(limiter);
    limiter.connect(muteGain);
    muteGain.connect(this.duckGain);

    return { inputNode: hp, analyser, muteGain, hp, limiter };
  }

  attach(role, stream) {
    const existing = this.sources.get(role);
    if (existing?.sourceNode) {
      try { existing.sourceNode.disconnect(); } catch {}
    }

    if (!stream) {
      this.sources.delete(role);
      return;
    }

    let chain = existing?.chain;
    if (!chain) {
      chain = this.createChain(role);
    }

    const sourceNode = this.ctx.createMediaStreamSource(stream);
    sourceNode.connect(chain.analyser);
    sourceNode.connect(chain.inputNode);

    this.sources.set(role, { stream, sourceNode, chain });
  }

  duckStage(duck, factor = 0.3) {
    this.isDucked = Boolean(duck);
    const now = this.ctx.currentTime;
    const target = this.isDucked ? Math.max(0.1, Math.min(1.0, factor)) : 1.0;
    this.duckGain.gain.cancelScheduledValues(now);
    this.duckGain.gain.setValueAtTime(this.duckGain.gain.value, now);
    this.duckGain.gain.linearRampToValueAtTime(target, now + 0.05);
  }

  muteSource(role, muted) {
    this.mutes[role] = Boolean(muted);
    const s = this.sources.get(role);
    if (s?.chain?.muteGain) {
      const now = this.ctx.currentTime;
      s.chain.muteGain.gain.cancelScheduledValues(now);
      s.chain.muteGain.gain.setValueAtTime(s.chain.muteGain.gain.value, now);
      s.chain.muteGain.gain.linearRampToValueAtTime(this.mutes[role] ? 0 : 1.0, now + 0.01);
    }
  }

  getLevels() {
    const res = {};
    for (const role of ['principal', 'attendee', 'urgent']) {
      const s = this.sources.get(role);
      const lvl = s?.stream && !this.mutes[role] ? computeRmsLevel(s.chain.analyser) : 0;
      res[role] = {
        in: Number(lvl.toFixed(3)),
        muted: Boolean(this.mutes[role]),
        active: Boolean(s?.stream)
      };
    }
    return res;
  }

  dispose() {
    for (const [role, s] of this.sources.entries()) {
      try { s.sourceNode.disconnect(); } catch {}
    }
    this.sources.clear();
  }
}
