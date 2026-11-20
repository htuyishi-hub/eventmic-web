import React, { useState } from 'react';
import { Volume2, Mic, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/Button.jsx';
import { hasDeviceLabels, requestDeviceLabelsPermission } from '../../../lib/audioDevices.js';

export function OutputDeviceSection({
  audioDevices = [],
  activeDeviceId = '',
  onSelectDevice,
  sinkIdSupported = true,
  onDevicesRefreshed
}) {
  const [requestingPerms, setRequestingPerms] = useState(false);
  const labelsAvailable = hasDeviceLabels(audioDevices);

  const handleAllowDeviceNames = async () => {
    setRequestingPerms(true);
    try {
      const refreshed = await requestDeviceLabelsPermission();
      if (typeof onDevicesRefreshed === 'function') {
        onDevicesRefreshed(refreshed);
      }
    } finally {
      setRequestingPerms(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Volume2 size={16} className="text-accent" />
          <span>Audio Output Device</span>
        </div>
        {sinkIdSupported && (
          <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-surface border border-border text-muted">
            Routing Active
          </span>
        )}
      </div>

      <p className="text-xs text-muted leading-relaxed">
        Route attendee speaker audio to your venue mixing console, soundcard, or monitoring headphones.
      </p>

      {/* Permission request button for device labels */}
      {!labelsAvailable && audioDevices.length > 0 && (
        <div className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted">
            <Mic size={14} className="text-accent" />
            <span>Browser requires audio permission to display device brand names.</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAllowDeviceNames}
            disabled={requestingPerms}
            className="text-xs whitespace-nowrap py-1 px-2.5 h-auto"
          >
            {requestingPerms ? 'Checking...' : 'Allow device names'}
          </Button>
        </div>
      )}

      {sinkIdSupported ? (
        <div className="space-y-2">
          {audioDevices.length > 0 ? (
            <select
              value={activeDeviceId}
              onChange={(e) => onSelectDevice(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-white text-xs focus:border-accent focus:outline-none"
            >
              {audioDevices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Output Device ${i + 1} (${d.deviceId.slice(0, 8)}...)`}
                </option>
              ))}
            </select>
          ) : (
            <div className="p-3 bg-background border border-border rounded-xl text-xs text-muted flex items-center gap-2">
              <CheckCircle2 size={14} className="text-success" />
              <span>Default System Audio Output</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-surface border border-warning/30 rounded-xl text-xs text-warning flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Your browser uses the system default output; use Chrome or Edge for device selection.
          </p>
        </div>
      )}
    </div>
  );
}
