import React, { useState } from 'react';
import { Users, Clock, ArrowUpDown, Trash2 } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';
import { StatusPill } from '../common/StatusPill.jsx';
import { formatWait } from '../../lib/time.js';
import { Avatar } from '../common/Avatar.jsx';
import { useResolvedAvatarSrc } from '../../lib/useAvatar.js';

function AttendeeRow({ att, onDeleteAvatar }) {
  const avatarSrc = useResolvedAvatarSrc(att);

  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-background/80 text-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar src={avatarSrc} name={att.name} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white truncate max-w-[140px]">{att.name}</span>
            <StatusPill status={att.isQueued ? 'queued' : att.speakCount > 0 ? 'spoken' : 'idle'} size="xs" />
            {att.hasNotSpoken && (
              <span className="px-1.5 py-0.2 rounded text-xs font-bold bg-live/15 text-live border border-live/30">
                1st time
              </span>
            )}
          </div>
          <div className="text-xs text-muted font-mono mt-0.5 flex items-center gap-2">
            <span>Spoke: {att.speakCount} {att.speakCount === 1 ? 'time' : 'times'}</span>
            {att.joinedAt && (
              <span className="flex items-center gap-0.5">
                <Clock size={10} /> {formatWait(att.joinedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {att.hasAvatar && (
        <button
          type="button"
          onClick={() => onDeleteAvatar(att.id)}
          title="Remove photo"
          className="p-1 rounded text-muted hover:text-red-400 hover:bg-surface transition-colors"
          aria-label={`Remove photo for ${att.name}`}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

export function AttendeesTab() {
  const { attendeeList = [], queue = [], deleteAvatar } = useSession();
  const [filter, setFilter] = useState('all');
  const [sortDesc, setSortDesc] = useState(true);

  const list = (attendeeList || []).map(att => {
    const isQueued = queue.some(q => q.id === att.id);
    return {
      ...att,
      isQueued,
      speakCount: att.speakCount ?? att.timesSpoken ?? 0,
      hasNotSpoken: (att.speakCount ?? att.timesSpoken ?? 0) === 0
    };
  });

  const filtered = list.filter(att => {
    if (filter === 'hand_raised') return att.isQueued || att.status === 'hand_raised';
    if (filter === 'not_spoken') return att.hasNotSpoken;
    return true;
  });

  filtered.sort((a, b) => sortDesc ? (b.speakCount - a.speakCount) : (a.speakCount - b.speakCount));

  return (
    <div className="h-full flex flex-col space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/50 text-xs">
        <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border">
          {[
            { id: 'all', label: `All (${list.length})` },
            { id: 'hand_raised', label: 'In Queue' },
            { id: 'not_spoken', label: '1st Time' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                filter === f.id ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSortDesc(v => !v)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-background border border-border text-muted hover:text-white text-xs font-bold"
          title="Toggle sort direction"
        >
          <ArrowUpDown size={12} />
          <span>Spoke: {sortDesc ? 'High to Low' : 'Low to High'}</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted text-center p-6">
          <Users size={28} className="opacity-40 mb-1" />
          <p className="text-xs font-semibold">No attendees match this filter</p>
        </div>
      ) : (
        <div className="space-y-1.5 overflow-y-auto max-h-[380px] pr-1">
          {filtered.map(att => (
            <AttendeeRow
              key={att.id}
              att={att}
              onDeleteAvatar={(id) => deleteAvatar?.(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
