import React, { useState } from 'react';
import { Volume2, VolumeX, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { LevelMeter } from '../host/LevelMeter.jsx';
import { en } from '../../i18n/en.js';

const STATUS_DOT = {
  connected: 'bg-emerald-400',
  missing: 'bg-red-500',
  suspended: 'bg-amber-400'
};

export function OutputsPanel({
  outputs = [],
  outputLevels = {},
  onUpdateOutput,
  onMuteAll,
  onResumeOutputs
}) {
  const [expanded, setExpanded] = useState(false);
  const missingOutputs = outputs.filter((o) => o.status === 'missing');

  if (outputs.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden flex-shrink-0">
      {missingOutputs.length > 0 && (
        <div role="alert" className="px-3 py-2 bg-red-950/80 border-b border-red-700 text-xs font-bold text-red-200 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
          <span className="truncate">
            {en.outputs.missingBanner} ({missingOutputs.map((o) => o.name).join(', ')})
          </span>
        </div>
      )}

      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="min-h-[40px] flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white hover:text-accent"
        >
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          <Volume2 size={14} className="text-accent" />
          <span>{en.outputs.title} ({outputs.length})</span>
        </button>

        <button
          type="button"
          onClick={onMuteAll}
          className="min-h-[40px] px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
        >
          <VolumeX size={13} />
          <span>{en.outputs.muteAll}</span>
        </button>
      </div>

      {expanded && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-border space-y-2.5">
          {outputs.map((out) => {
            const lvl = outputLevels[out.id] || 0;
            const latencyLabel = out.outputLatency !== 'n/a'
              ? `${out.outputLatency}ms`
              : out.delayMs > 0
                ? `+${out.delayMs}ms`
                : 'n/a';

            return (
              <div key={out.id} className="p-2.5 rounded-xl bg-background border border-border space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => out.status === 'suspended' && onResumeOutputs?.()}
                      title={`Status: ${out.status}`}
                      aria-label={`${out.name} status ${out.status}`}
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[out.status] || STATUS_DOT.connected}`}
                    />
                    <span className="text-xs font-bold text-white truncate">{out.name}</span>
                    <span className="text-xs font-mono text-muted flex-shrink-0">{latencyLabel}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateOutput(out.id, { muted: !out.muted })}
                      aria-pressed={out.muted}
                      aria-label={`Mute ${out.name}`}
                      className={`min-h-[32px] px-2 rounded text-xs font-bold border ${
                        out.muted ? 'bg-red-600 border-red-600 text-white' : 'bg-surface border-border text-muted hover:text-white'
                      }`}
                    >
                      M
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateOutput(out.id, { solo: !out.solo })}
                      aria-pressed={out.solo}
                      aria-label={`Solo ${out.name}`}
                      className={`min-h-[32px] px-2 rounded text-xs font-bold border ${
                        out.solo ? 'bg-amber-500 border-amber-500 text-black' : 'bg-surface border-border text-muted hover:text-white'
                      }`}
                    >
                      S
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-24 flex-shrink-0">
                    <LevelMeter level={lvl} isMuted={out.muted || !out.enabled} barCount={10} className="h-4" />
                  </div>
                  <label className="sr-only" htmlFor={`live-vol-${out.id}`}>{out.name} volume</label>
                  <input
                    id={`live-vol-${out.id}`}
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={out.volume}
                    onChange={(e) => onUpdateOutput(out.id, { volume: Number(e.target.value) })}
                    className="flex-1 accent-blue-600"
                  />
                  <span className="text-xs font-mono text-white w-10 text-right tabular-nums">
                    {Math.round(Math.min(out.volume, out.maxLevel) * 100)}%
                  </span>
                </div>
              </div>
            );
          })}

          <p className="text-xs text-muted">{en.outputs.meterNote}</p>
        </div>
      )}
    </div>
  );
}

export default OutputsPanel;
