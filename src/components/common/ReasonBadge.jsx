import React from 'react';
import { HelpCircle, MessageSquare, ThumbsUp, Info, AlertTriangle, VolumeX, Sparkles } from 'lucide-react';

export const REASON_CONFIG = {
  question: {
    label: 'Question',
    icon: HelpCircle,
    color: 'text-sky-400',
    style: 'bg-sky-500/15 text-sky-400 border-sky-500/30'
  },
  comment: {
    label: 'Comment',
    icon: MessageSquare,
    color: 'text-purple-400',
    style: 'bg-purple-500/15 text-purple-400 border-purple-500/30'
  },
  compliment: {
    label: 'Compliment',
    icon: ThumbsUp,
    color: 'text-emerald-400',
    style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  },
  clarification: {
    label: 'Clarification',
    icon: Info,
    color: 'text-amber-400',
    style: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  },
  urgent: {
    label: 'Urgent',
    icon: AlertTriangle,
    color: 'text-rose-400',
    style: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
  },
  cant_hear: {
    label: "Can't hear",
    icon: VolumeX,
    color: 'text-rose-400',
    style: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  },
  other: {
    label: 'Other',
    icon: Sparkles,
    color: 'text-neutral-400',
    style: 'bg-neutral-500/15 text-neutral-300 border-neutral-500/30'
  }
};

export function ReasonBadge({ reason = 'question', className = '', showIcon = true, size = 'sm' }) {
  const norm = String(reason).toLowerCase();
  const config = REASON_CONFIG[norm] || REASON_CONFIG.question;
  const Icon = config.icon;
  const iconSize = size === 'xs' ? 10 : size === 'lg' ? 14 : 11;
  const textClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : size === 'lg' ? 'text-xs px-2.5 py-1' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-md border ${config.style} ${textClass} ${className}`}
      aria-label={`Reason: ${config.label}`}
    >
      {showIcon && <Icon size={iconSize} className="flex-shrink-0" aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
}
