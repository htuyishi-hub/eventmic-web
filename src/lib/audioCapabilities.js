/**
 * Audio capability and browser feature detection helper.
 */

export function detectBrowser() {
  if (typeof navigator === 'undefined') return 'Node/Unknown';
  const ua = navigator.userAgent;
  if (/edg/i.test(ua)) return 'Microsoft Edge';
  if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) return 'Google Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Mozilla Firefox';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Apple Safari';
  return 'Unknown';
}

export function getAudioCapabilities(ctx, activeDevice = null) {
  const browser = detectBrowser();
  const elementSinkIdSupported = typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;
  const audioContextSinkIdSupported = typeof AudioContext !== 'undefined' && 'setSinkId' in AudioContext.prototype;

  let maxChannelCount = 2;
  let sampleRate = 'n/a';
  let baseLatency = 'n/a';
  let outputLatency = 'n/a';
  let state = 'closed';

  if (ctx) {
    state = ctx.state || 'running';
    sampleRate = ctx.sampleRate || 48000;
    if (ctx.destination) {
      maxChannelCount = ctx.destination.maxChannelCount || 2;
    }
    if (typeof ctx.baseLatency === 'number') {
      baseLatency = `${(ctx.baseLatency * 1000).toFixed(1)} ms`;
    }
    if (typeof ctx.outputLatency === 'number') {
      outputLatency = `${(ctx.outputLatency * 1000).toFixed(1)} ms`;
    }
  }

  const multiChannelSupported = maxChannelCount > 2;

  let routingNote = '';
  if (!multiChannelSupported) {
    routingNote = 'Current audio destination reports stereo (2ch) only. Connect a multi-channel soundcard or USB mixer for >2 physical channel routing.';
  }

  let sinkIdNote = '';
  if (!audioContextSinkIdSupported && !elementSinkIdSupported) {
    sinkIdNote = 'Your browser uses the system default output; use Chrome or Edge for device selection.';
  } else if (!audioContextSinkIdSupported && elementSinkIdSupported) {
    sinkIdNote = 'AudioContext.setSinkId unavailable; routed via MediaStream destination element.';
  }

  return {
    browser,
    elementSinkIdSupported,
    audioContextSinkIdSupported,
    sinkIdSupported: audioContextSinkIdSupported || elementSinkIdSupported,
    activeDeviceId: activeDevice?.deviceId || 'default',
    activeDeviceLabel: activeDevice?.label || 'Default Audio Output',
    sampleRate: typeof sampleRate === 'number' ? `${sampleRate} Hz` : sampleRate,
    maxChannelCount,
    baseLatency,
    outputLatency,
    state,
    multiChannelSupported,
    routingNote,
    sinkIdNote
  };
}
