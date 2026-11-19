/**
 * Web Audio processing graph constructor for EventMic Host.
 */

import { setupMergerGraph, connectRouting } from './audioRouting.js';

export function buildAudioGraph(ctx, options = {}) {
  const inputAnalyser = ctx.createAnalyser();
  inputAnalyser.fftSize = 256;

  const highPassFilter = ctx.createBiquadFilter();
  highPassFilter.type = options.highPass?.enabled ? 'highpass' : 'allpass';
  highPassFilter.frequency.setValueAtTime(options.highPass?.hz || 80, ctx.currentTime);

  const gateNode = ctx.createScriptProcessor(512, 1, 1);
  let currentGateGain = 1.0;
  gateNode.onaudioprocess = (e) => {
    const input = e.inputBuffer.getChannelData(0);
    const output = e.outputBuffer.getChannelData(0);
    if (!options.gate?.enabled) { output.set(input); return; }
    let sum = 0;
    for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
    const db = 20 * Math.log10(Math.max(Math.sqrt(sum / input.length), 1e-5));
    const target = db >= (options.gate?.thresholdDb ?? -45) ? 1.0 : 0.0;
    const rate = target > currentGateGain ? 0.05 : 0.005;
    for (let i = 0; i < input.length; i++) {
      currentGateGain += (target - currentGateGain) * rate;
      output[i] = input[i] * currentGateGain;
    }
  };

  const limiterNode = ctx.createDynamicsCompressor();
  limiterNode.threshold.setValueAtTime(options.limiterEnabled ? -3 : 0, ctx.currentTime);
  limiterNode.ratio.setValueAtTime(options.limiterEnabled ? 20 : 1, ctx.currentTime);
  limiterNode.attack.setValueAtTime(0.001, ctx.currentTime);
  limiterNode.release.setValueAtTime(0.05, ctx.currentTime);
  limiterNode.knee.setValueAtTime(0, ctx.currentTime);

  const volumeGain = ctx.createGain();
  volumeGain.gain.setValueAtTime(options.volume ?? 1.0, ctx.currentTime);

  const muteGain = ctx.createGain();
  muteGain.gain.setValueAtTime(options.isMuted ? 0 : 1, ctx.currentTime);

  const outputAnalyser = ctx.createAnalyser();
  outputAnalyser.fftSize = 256;

  let dest = ctx.destination;
  let streamDestination = null;
  let outputAudioEl = null;

  const hasCtxSink = typeof ctx.setSinkId === 'function';
  const hasElSink = typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;

  if (!hasCtxSink && hasElSink && typeof ctx.createMediaStreamDestination === 'function') {
    streamDestination = ctx.createMediaStreamDestination();
    dest = streamDestination;
    if (typeof document !== 'undefined') {
      outputAudioEl = document.createElement('audio');
      outputAudioEl.autoplay = true;
      outputAudioEl.className = 'hidden';
      outputAudioEl.srcObject = streamDestination.stream;
      document.body.appendChild(outputAudioEl);
      outputAudioEl.play().catch(() => {});
    }
  }

  const { merger, channelCount } = setupMergerGraph(ctx, dest);

  highPassFilter.connect(gateNode);
  gateNode.connect(limiterNode);
  limiterNode.connect(volumeGain);
  volumeGain.connect(muteGain);
  muteGain.connect(outputAnalyser);
  connectRouting(muteGain, merger, options.routing, channelCount);

  return {
    inputAnalyser,
    highPassFilter,
    gateNode,
    limiterNode,
    volumeGain,
    muteGain,
    outputAnalyser,
    merger,
    channelCount,
    outputAudioEl,
    streamDestination
  };
}

export function computeRmsLevel(analyser) {
  if (!analyser) return 0;
  const buf = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = (buf[i] - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / buf.length) * 2.8);
}
