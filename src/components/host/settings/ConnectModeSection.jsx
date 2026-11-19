import React, { useState } from 'react';
import { Wifi, Zap } from 'lucide-react';
import { useSession } from '../../../context/SessionContext.jsx';

export function ConnectModeSection() {
  const { session, updateSettings } = useSession();
  const currentMode = session?.settings?.principalConnectMode || 'on_demand';
  const [mode, setMode] = useState(currentMode);
  const [saving, setSaving] = useState(false);

  const handleToggle = async (newMode) => {
    setMode(newMode);
    setSaving(true);
    try {
      await updateSettings({ principalConnectMode: newMode });
    } catch (err) {
      console.error('Failed to update connect mode:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Wifi size={16} className="text-accent" />
          <span>Principal LiveKit Connect Mode</span>
        </div>
        {saving && <span className="text-[10px] text-muted animate-pulse">Saving...</span>}
      </div>

      <p className="text-xs text-muted leading-relaxed">
        Choose whether stage speakers connect to LiveKit WebRTC continuously or on-demand when speaking.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleToggle('on_demand')}
          className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
            mode === 'on_demand'
              ? 'bg-accent/15 border-accent text-white shadow-md shadow-accent/20'
              : 'bg-background border-border text-muted hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <Zap size={14} className={mode === 'on_demand' ? 'text-accent' : 'text-muted'} />
            <span>On-Demand (Default)</span>
          </div>
          <p className="text-[10px] opacity-80 leading-normal">
            Connects to WebRTC only when taking floor or on-deck. Saves cloud minutes.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleToggle('always')}
          className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
            mode === 'always'
              ? 'bg-accent/15 border-accent text-white shadow-md shadow-accent/20'
              : 'bg-background border-border text-muted hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <Wifi size={14} className={mode === 'always' ? 'text-accent' : 'text-muted'} />
            <span>Always Connected</span>
          </div>
          <p className="text-[10px] opacity-80 leading-normal">
            Principals maintain active WebRTC connection for the whole session.
          </p>
        </button>
      </div>
    </div>
  );
}
