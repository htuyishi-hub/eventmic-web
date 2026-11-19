import React, { useState } from 'react';
import { ShieldCheck, Zap, Clock } from 'lucide-react';
import { useSession } from '../../../context/SessionContext.jsx';

export function FloorRulesSection() {
  const { session, updateSettings } = useSession();
  const currentSettings = session?.settings || {};

  const [allowUrgent, setAllowUrgent] = useState(currentSettings.allowUrgent ?? true);
  const [turnCap, setTurnCap] = useState(currentSettings.attendeeTurnCapSeconds ? Math.round(currentSettings.attendeeTurnCapSeconds / 60) : 2);
  const [endTime, setEndTime] = useState(currentSettings.sessionEndTime ? new Date(currentSettings.sessionEndTime).toISOString().slice(11, 16) : '');

  const handleUrgentToggle = async (val) => {
    setAllowUrgent(val);
    await updateSettings?.({ allowUrgent: val });
  };

  const handleTurnCapChange = async (mins) => {
    setTurnCap(mins);
    await updateSettings?.({ attendeeTurnCapSeconds: mins * 60 });
  };

  const handleEndTimeChange = async (e) => {
    const val = e.target.value;
    setEndTime(val);
    if (!val) return;
    const [h, m] = val.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    await updateSettings?.({ sessionEndTime: d.getTime() });
  };

  return (
    <div className="space-y-4 pt-3 border-t border-border">
      <div className="flex items-center gap-2 text-white font-bold text-sm">
        <ShieldCheck size={16} className="text-accent" />
        <span>Floor Rules & Turn Limits</span>
      </div>

      {/* Urgent Interruptions */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Zap size={13} className="text-rose-400" />
            <span>Allow Urgent Blips</span>
          </div>
          <p className="text-[11px] text-muted">Audience can trigger a 5s clarification interruption</p>
        </div>
        <button
          type="button"
          onClick={() => handleUrgentToggle(!allowUrgent)}
          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
            allowUrgent ? 'bg-live/20 border-live text-live' : 'bg-background border-border text-muted'
          }`}
        >
          {allowUrgent ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {/* Attendee Turn Cap */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="font-bold text-white">Attendee Turn Cap</span>
          <span className="text-muted font-mono">{turnCap} min ({turnCap * 60}s)</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 5].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => handleTurnCapChange(mins)}
              className={`py-1.5 rounded-lg font-bold text-xs border transition-colors ${
                turnCap === mins
                  ? 'bg-accent border-accent text-white shadow-sm'
                  : 'bg-background border-border text-muted hover:text-white'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Session Scheduled End Time */}
      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="font-bold text-white flex items-center gap-1.5">
            <Clock size={13} className="text-accent" />
            <span>Scheduled End Time</span>
          </span>
          <p className="text-[11px] text-muted">Fair mode auto-triggers before this time</p>
        </div>
        <input
          type="time"
          value={endTime}
          onChange={handleEndTimeChange}
          className="bg-background border border-border rounded-lg px-2 py-1 text-white text-xs font-mono"
        />
      </div>
    </div>
  );
}
