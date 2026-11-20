import React from 'react';
import { Cpu, Activity } from 'lucide-react';
import { LevelMeter } from '../LevelMeter.jsx';

export function CapabilitiesSection({
  capabilities = {},
  liveLevels = { in: 0, out: 0, clipping: false, limiterActive: false }
}) {
  const items = [
    { label: 'Host Browser', value: capabilities.browser || 'Unknown' },
    { label: 'AudioContext State', value: capabilities.state || 'closed' },
    { label: 'AudioContext.setSinkId', value: capabilities.audioContextSinkIdSupported ? 'Supported' : 'Unavailable' },
    { label: 'MediaElement.setSinkId', value: capabilities.elementSinkIdSupported ? 'Supported' : 'Unavailable' },
    { label: 'Active Output Device', value: capabilities.activeDeviceLabel || 'Default' },
    { label: 'Destination Channels', value: `${capabilities.maxChannelCount || 2} channels` },
    { label: 'Audio Sample Rate', value: capabilities.sampleRate || 'n/a' },
    { label: 'Base DSP Latency', value: capabilities.baseLatency || 'n/a' },
    { label: 'Hardware Output Latency', value: capabilities.outputLatency || 'n/a' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white font-bold text-sm">
        <Cpu size={16} className="text-accent" />
        <span>Hardware & Web Audio Capabilities</span>
      </div>

      {/* Live Level Meters in Drawer */}
      <div className="p-3 rounded-xl bg-surface border border-border space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-white">
          <div className="flex items-center gap-1.5">
            <Activity size={14} className="text-accent" />
            <span>Real-Time Graph Metering</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            {liveLevels.limiterActive && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
                LIM
              </span>
            )}
            {liveLevels.clipping && (
              <span className="px-1.5 py-0.5 rounded bg-live text-white font-bold animate-pulse">
                CLIP
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs font-mono text-muted mb-1">
              <span>INPUT (PRE-PROCESSING)</span>
              <span>{Math.round((liveLevels.in || 0) * 100)}%</span>
            </div>
            <LevelMeter level={liveLevels.in || 0} barCount={20} className="h-8" />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-muted mb-1">
              <span>OUTPUT (POST-LIMITER / VOLUME)</span>
              <span>{Math.round((liveLevels.out || 0) * 100)}%</span>
            </div>
            <LevelMeter level={liveLevels.out || 0} barCount={20} className="h-8" />
          </div>
        </div>
      </div>

      {/* Capabilities Specification Table */}
      <div className="bg-background border border-border rounded-xl overflow-hidden divide-y divide-border text-xs">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between p-2.5 px-3">
            <span className="text-muted">{it.label}</span>
            <span className="font-mono text-white text-xs font-semibold text-right max-w-[200px] truncate">
              {it.value}
            </span>
          </div>
        ))}
      </div>

      {capabilities.routingNote && (
        <p className="text-xs text-muted leading-relaxed px-1">
          {capabilities.routingNote}
        </p>
      )}
    </div>
  );
}
