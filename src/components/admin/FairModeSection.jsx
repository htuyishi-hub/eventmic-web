import React, { useState } from 'react';
import { Scale } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';

export function FairModeSection() {
  const { fairModeActive, updateSettings } = useSession();
  const [mode, setMode] = useState(fairModeActive ? 'on' : 'off');
  const [minutes, setMinutes] = useState(15);
  const [saving, setSaving] = useState(false);

  const handleModeChange = async (newMode) => {
    setMode(newMode);
    setSaving(true);
    try {
      await updateSettings({
        fairMode: newMode,
        fairFromMinutesBeforeEnd: minutes
      });
    } catch (e) {
      console.warn('Failed to update fair mode:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-accent" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Fair Mode (Queue Fairness)
          </span>
        </div>
        {fairModeActive && (
          <span className="text-[10px] font-bold text-live bg-live/15 px-2 py-0.5 rounded border border-live/30">
            ACTIVE
          </span>
        )}
      </div>

      <p className="text-[11px] text-muted">
        Prioritizes attendees who have not spoken before repeat speakers.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {['off', 'auto', 'on'].map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={saving}
            onClick={() => handleModeChange(opt)}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold uppercase transition-all ${
              mode === opt
                ? 'bg-accent text-white shadow-sm'
                : 'bg-background border border-border text-muted hover:text-white'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {mode === 'auto' && (
        <div className="flex items-center justify-between pt-1 text-xs text-muted">
          <span>Activate minutes before end:</span>
          <input
            type="number"
            min="1"
            max="60"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value) || 15)}
            className="w-16 bg-background border border-border rounded px-2 py-1 text-right text-white text-xs font-mono"
          />
        </div>
      )}
    </div>
  );
}
