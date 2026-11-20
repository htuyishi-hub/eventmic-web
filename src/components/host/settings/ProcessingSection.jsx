import React from 'react';
import { Sliders, ShieldCheck, Activity } from 'lucide-react';

export function ProcessingSection({
  highPass = { enabled: true, hz: 80 },
  onChangeHighPass,
  gate = { enabled: false, thresholdDb: -45, releaseMs: 150 },
  onChangeGate,
  limiterEnabled = true,
  onChangeLimiter
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white font-bold text-sm">
        <Sliders size={16} className="text-accent" />
        <span>Audio DSP & Processing</span>
      </div>

      {/* 1. High-Pass Filter */}
      <div className="p-3 rounded-xl bg-surface border border-border space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white">High-Pass Filter (Low-Cut)</div>
            <div className="text-xs text-muted">Eliminates stage rumble and mic handling noise</div>
          </div>
          <button
            type="button"
            onClick={() => onChangeHighPass({ enabled: !highPass.enabled, hz: highPass.hz })}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
              highPass.enabled ? 'bg-accent text-white' : 'bg-background border border-border text-muted'
            }`}
          >
            {highPass.enabled ? 'Active' : 'Off'}
          </button>
        </div>

        {highPass.enabled && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs font-mono text-muted">
              <span>Cutoff Frequency</span>
              <span className="text-white font-bold">{highPass.hz} Hz</span>
            </div>
            <input
              type="range"
              min="40"
              max="240"
              step="5"
              value={highPass.hz}
              onChange={(e) => onChangeHighPass({ enabled: true, hz: Number(e.target.value) })}
              className="w-full accent-accent h-1.5 bg-background rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* 2. Noise Gate */}
      <div className="p-3 rounded-xl bg-surface border border-border space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white">RMS Noise Gate</div>
            <div className="text-xs text-muted">Mutes room ambience when attendee is not speaking</div>
          </div>
          <button
            type="button"
            onClick={() => onChangeGate({ enabled: !gate.enabled })}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
              gate.enabled ? 'bg-accent text-white' : 'bg-background border border-border text-muted'
            }`}
          >
            {gate.enabled ? 'Active' : 'Off'}
          </button>
        </div>

        {gate.enabled && (
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-muted">
                <span>Threshold</span>
                <span className="text-white font-bold">{gate.thresholdDb} dB</span>
              </div>
              <input
                type="range"
                min="-60"
                max="-20"
                step="1"
                value={gate.thresholdDb}
                onChange={(e) => onChangeGate({ thresholdDb: Number(e.target.value) })}
                className="w-full accent-accent h-1.5 bg-background rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-muted">
                <span>Release Time</span>
                <span className="text-white font-bold">{gate.releaseMs} ms</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="25"
                value={gate.releaseMs}
                onChange={(e) => onChangeGate({ releaseMs: Number(e.target.value) })}
                className="w-full accent-accent h-1.5 bg-background rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Output Limiter */}
      <div className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-success" />
            <span>Brickwall Limiter (-3 dBFS)</span>
          </div>
          <div className="text-xs text-muted">20:1 fast compression prevents PA distortion & clipping</div>
        </div>
        <button
          type="button"
          onClick={() => onChangeLimiter(!limiterEnabled)}
          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
            limiterEnabled ? 'bg-success text-white shadow-sm' : 'bg-background border border-border text-muted'
          }`}
        >
          {limiterEnabled ? 'Active' : 'Bypass'}
        </button>
      </div>
    </div>
  );
}
