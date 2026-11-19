import React from 'react';
import { Activity, Radio, Clock, Zap, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export function SessionMetricsBar({ metrics, floor, principalQueue, onHandoverNext }) {
  const m = metrics || {};
  const openSockets = m.openSockets ?? 0;
  const peakLivekit = m.peakLivekitConnections ?? 0;
  const currentLivekit = m.currentLivekitConnections ?? 0;
  const webrtcMins = m.estimatedWebRtcMinutes ?? (m.totalWebRtcSeconds ? (m.totalWebRtcSeconds / 60).toFixed(1) : '0.0');
  const latencyMs = m.avgGrantToAudioMs ? Math.round(m.avgGrantToAudioMs) : (m.grantToAudioTimes?.[m.grantToAudioTimes.length - 1] || '< 100');

  const floorHolderDropped = floor && floor.disconnected;

  return (
    <div className="space-y-2">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-surface border border-border rounded-xl p-2.5 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-accent/15 text-accent flex-shrink-0">
            <Radio size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-muted truncate">LiveKit Conns</div>
            <div className="text-xs font-mono font-bold text-white">
              {currentLivekit} <span className="text-muted text-[10px] font-normal">(pk {peakLivekit})</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-2.5 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 flex-shrink-0">
            <Clock size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-muted truncate">WebRTC Usage</div>
            <div className="text-xs font-mono font-bold text-white">{webrtcMins} min</div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-2.5 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400 flex-shrink-0">
            <Activity size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-muted truncate">Active Sockets</div>
            <div className="text-xs font-mono font-bold text-white">{openSockets} online</div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-2.5 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 flex-shrink-0">
            <Zap size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-muted truncate">Turn Latency</div>
            <div className="text-xs font-mono font-bold text-white">{latencyMs} ms</div>
          </div>
        </div>
      </div>

      {/* Stage Audio Health Drop Warning */}
      {floorHolderDropped && (
        <div className="p-3 rounded-xl bg-live/20 border border-live/40 flex items-center justify-between text-xs text-live">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>Speaker dropped connection. Stage is silent!</span>
          </div>
          {principalQueue?.length > 0 && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => onHandoverNext?.(principalQueue[0].id)}
              className="gap-1 py-1 px-2.5 text-xs"
            >
              <span>Hand floor to {principalQueue[0].name}</span>
              <ArrowRight size={13} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
