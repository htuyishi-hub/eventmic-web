/**
 * Channel routing helpers for EventMic host audio.
 * Manages discrete mono-to-multichannel routing via ChannelMerger.
 */

export const ROUTING_STORAGE_KEY = 'eventmic_audio_routing';

export const ROUTING_PRESETS = [
  { id: 'both', label: 'Both (Centre)', description: 'Outputs to Left and Right channels' },
  { id: 'left', label: 'Left Only', description: 'Outputs to Channel 1 (Left)' },
  { id: 'right', label: 'Right Only', description: 'Outputs to Channel 2 (Right)' }
];

export function loadSavedRouting() {
  if (typeof localStorage === 'undefined') return { mode: 'both' };
  try {
    const raw = localStorage.getItem(ROUTING_STORAGE_KEY);
    if (!raw) return { mode: 'both' };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.mode) {
      return parsed;
    }
  } catch {}
  return { mode: 'both' };
}

export function saveRouting(config) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(ROUTING_STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

/**
 * Configure destination channel count and create a ChannelMerger for routing.
 * @param {AudioContext} ctx
 * @param {AudioNode} targetDestination
 * @returns {{ merger: ChannelMergerNode, channelCount: number }}
 */
export function setupMergerGraph(ctx, targetDestination) {
  const maxChannels = ctx.destination?.maxChannelCount || 2;
  const channelCount = Math.max(2, maxChannels);

  if (channelCount > 2 && targetDestination) {
    try {
      targetDestination.channelCount = channelCount;
      targetDestination.channelCountMode = 'explicit';
      targetDestination.channelInterpretation = 'discrete';
    } catch (err) {
      console.warn('[AudioRouting] Discrete channel count unsupported:', err);
    }
  }

  const merger = ctx.createChannelMerger(channelCount);
  merger.connect(targetDestination);
  return { merger, channelCount };
}

/**
 * Connects an audio source (mono output) into the merger based on routing config.
 * @param {AudioNode} sourceNode
 * @param {ChannelMergerNode} mergerNode
 * @param {{ mode: 'both' | 'left' | 'right' | 'channel', channel?: number }} config
 * @param {number} totalChannels
 */
export function connectRouting(sourceNode, mergerNode, config, totalChannels = 2) {
  if (!sourceNode || !mergerNode) return;

  try {
    sourceNode.disconnect(mergerNode);
  } catch {}

  const mode = config?.mode || 'both';

  if (mode === 'left') {
    sourceNode.connect(mergerNode, 0, 0);
  } else if (mode === 'right') {
    sourceNode.connect(mergerNode, 0, 1);
  } else if (mode === 'channel') {
    const ch = Number(config.channel) || 1;
    const targetIndex = Math.max(0, Math.min(totalChannels - 1, ch - 1));
    sourceNode.connect(mergerNode, 0, targetIndex);
  } else {
    // 'both' (centre)
    sourceNode.connect(mergerNode, 0, 0);
    sourceNode.connect(mergerNode, 0, 1);
  }
}
