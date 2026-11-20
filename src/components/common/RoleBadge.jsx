import React from 'react';
import { Shield, Mic, User } from 'lucide-react';

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    icon: Shield,
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
  },
  host: {
    label: 'Admin',
    icon: Shield,
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
  },
  principal: {
    label: 'Speaker',
    icon: Mic,
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  },
  attendee: {
    label: 'Attendee',
    icon: User,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  }
};

export function RoleBadge({ role = 'attendee', className = '', size = 'sm' }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.attendee;
  const Icon = config.icon;
  const iconSize = size === 'xs' ? 10 : size === 'lg' ? 14 : 12;
  const textClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : size === 'lg' ? 'text-xs px-2.5 py-1' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-full border ${config.badgeClass} ${textClass} ${className}`}
      aria-label={`Role: ${config.label}`}
    >
      <Icon size={iconSize} className="flex-shrink-0" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
