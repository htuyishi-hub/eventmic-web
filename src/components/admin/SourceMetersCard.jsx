import React from 'react';
import { Mic, MicOff, AlertCircle, UserCheck } from 'lucide-react';
import { LevelMeter } from '../host/LevelMeter.jsx';
import { Button } from '../ui/Button.jsx';

export function SourceMetersCard({ liveLevels, onMuteSource }) {
  const sources = liveLevels?.sources || {};

  const sourceList = [
    { key: 'principal', label: 'Principal', icon: UserCheck, color: 'text-accent' },
    { key: 'attendee', label: 'Attendee', icon: Mic, color: 'text-emerald-400' },
    { key: 'urgent', label: 'Urgent Blip', icon: AlertCircle, color: 'text-amber-400' }
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
        <span className="text-xs font-bold uppercase tracking-wider text-white">Source Audio Chains</span>
        <span className="text-xs text-muted font-mono">Multi-source Web Audio</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {sourceList.map(({ key, label, icon: Icon, color }) => {
          const s = sources[key] || { in: 0, muted: false, active: false };
          return (
            <div key={key} className="p-2 rounded-lg bg-background border border-border/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon size={13} className={color} />
                  <span className="text-xs font-bold text-white">{label}</span>
                </div>
                <Button
                  size="sm"
                  variant={s.muted ? 'danger' : 'ghost'}
                  onClick={() => onMuteSource?.(key, !s.muted)}
                  className="py-0.5 px-2 text-xs h-6"
                  title={`${s.muted ? 'Unmute' : 'Instant Mute'} ${label}`}
                >
                  {s.muted ? <MicOff size={11} /> : <Mic size={11} />}
                  <span>{s.muted ? 'Muted' : 'Mute'}</span>
                </Button>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-xs font-mono text-muted">
                  <span>LEVEL</span>
                  <span>{s.muted ? 'MUTED' : `${Math.round(s.in * 100)}%`}</span>
                </div>
                <LevelMeter level={s.in} isMuted={s.muted} barCount={10} className="h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
