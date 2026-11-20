import React from 'react';
import { Radio, MicOff, Clock, UserCheck, AlertTriangle, WifiOff } from 'lucide-react';

const STATUS_CONFIG = {
  live: { label: 'Live', icon: Radio, style: 'bg-live/20 text-live border-live/40 animate-pulse' },
  on_air: { label: 'On Air', icon: Radio, style: 'bg-live/20 text-live border-live/40 animate-pulse' },
  on_deck: { label: 'Next Up', icon: Clock, style: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  muted: { label: 'Muted', icon: MicOff, style: 'bg-warning/20 text-warning border-warning/40' },
  queued: { label: 'In Queue', icon: Clock, style: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  spoken: { label: 'Spoke', icon: UserCheck, style: 'bg-surface text-muted border-border' },
  idle: { label: 'Idle', icon: UserCheck, style: 'bg-surface text-muted border-border' },
  dropped: { label: 'Dropped', icon: AlertTriangle, style: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  offline: { label: 'Offline', icon: WifiOff, style: 'bg-neutral-800 text-neutral-400 border-neutral-700' }
};

export function StatusPill({ status = 'idle', className = '', size = 'sm' }) {
  const norm = String(status).toLowerCase();
  const config = STATUS_CONFIG[norm] || STATUS_CONFIG.idle;
  const Icon = config.icon;
  const iconSize = size === 'xs' ? 9 : 11;
  const textClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-full border ${config.style} ${textClass} ${className}`}
      aria-label={`Status: ${config.label}`}
    >
      <Icon size={iconSize} className="flex-shrink-0" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
