import React from 'react';
import { GitFork, Info } from 'lucide-react';
import { ROUTING_PRESETS } from '../../../lib/audioRouting.js';

export function ChannelRoutingSection({
  routingConfig = { mode: 'both' },
  onChangeRouting,
  maxChannelCount = 2,
  multiChannelSupported = false
}) {
  const isPresetSelected = (id) => routingConfig.mode === id;
  const isChannelMode = routingConfig.mode === 'channel';

  const channelsList = Array.from(
    { length: Math.max(0, maxChannelCount) },
    (_, i) => i + 1
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <GitFork size={16} className="text-accent" />
          <span>Channel Routing (Mono to Output)</span>
        </div>
        <span className="text-xs font-mono text-muted">
          {maxChannelCount} Destination {maxChannelCount === 1 ? 'Ch' : 'Chs'}
        </span>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        Send attendee speech to both stereo speakers or isolate to a designated audio desk bus.
      </p>

      {/* Preset Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {ROUTING_PRESETS.map((p) => {
          const selected = isPresetSelected(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChangeRouting({ mode: p.id })}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selected
                  ? 'bg-accent/15 border-accent text-white shadow-sm'
                  : 'bg-background border-border text-muted hover:text-white hover:border-border/80'
              }`}
            >
              <div className="text-xs font-bold">{p.label}</div>
              <div className="text-xs opacity-70 mt-0.5 truncate">{p.description}</div>
            </button>
          );
        })}
      </div>

      {/* Advanced Multichannel Section (shown only if >2 channels) */}
      {multiChannelSupported ? (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="text-xs font-bold text-white flex items-center justify-between">
            <span>Discrete Hardware Channel</span>
            <span className="text-xs text-accent font-normal">Advanced Output</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {channelsList.map((ch) => {
              const active = isChannelMode && Number(routingConfig.channel) === ch;
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => onChangeRouting({ mode: 'channel', channel: ch })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors border ${
                    active
                      ? 'bg-accent border-accent text-white shadow-sm'
                      : 'bg-background border-border text-muted hover:text-white'
                  }`}
                >
                  Ch {ch}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-surface/50 border border-border/60 text-xs text-muted flex items-start gap-2">
          <Info size={14} className="flex-shrink-0 mt-0.5 text-muted" />
          <span>Stereo destination active. Multichannel routing (Ch 3+) requires a multichannel audio interface.</span>
        </div>
      )}
    </div>
  );
}
