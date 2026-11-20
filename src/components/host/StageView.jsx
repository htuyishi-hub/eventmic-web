import React, { useState, useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Radio, Volume2, ShieldCheck, AlertOctagon } from 'lucide-react';
import { LevelMeter } from './LevelMeter.jsx';
import { Button } from '../ui/Button.jsx';
import { formatDuration } from '../../lib/time.js';
import { Avatar } from '../common/Avatar.jsx';
import { RoleBadge } from '../common/RoleBadge.jsx';
import { useResolvedAvatarSrc } from '../../lib/useAvatar.js';

export function StageView({
  floor,
  inputLevel = 0,
  outputLevel = 0,
  isMuted = false,
  volume = 1.0,
  onVolumeChange,
  isClipping = false,
  isLimiterActive = false,
  onEndSpeaker,
  onToggleMute,
  queueLength = 0,
  onGrantNext,
  nextAttendeeName,
  nextRaisedAt
}) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  useEffect(() => {
    if (!confirmEnd) return undefined;
    const t = setTimeout(() => setConfirmEnd(false), 3000);
    return () => clearTimeout(t);
  }, [confirmEnd]);
  useEffect(() => { setConfirmEnd(false); }, [floor?.id]);
  const [speakingSeconds, setSpeakingSeconds] = useState(0);
  const avatarSrc = useResolvedAvatarSrc(floor);

  useEffect(() => {
    if (!floor?.startedAt) {
      setSpeakingSeconds(0);
      return;
    }
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - floor.startedAt) / 1000);
      setSpeakingSeconds(Math.max(0, elapsed));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [floor?.startedAt]);

  const volumePercent = Math.round(volume * 100);

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-2xl overflow-hidden shadow-xl p-5 justify-between">
      {/* Top Stage Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className={`w-3 h-3 rounded-full ${floor ? 'bg-live animate-pulse shadow-md shadow-live/50' : 'bg-muted/40'}`} />
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Live Stage</h2>
        </div>

        {floor ? (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase ${
              isMuted ? 'bg-warning/20 border border-warning/40 text-warning' : 'bg-live/20 border border-live/40 text-live'
            }`}>
              <Radio size={14} className={isMuted ? '' : 'animate-pulse'} />
              <span>{isMuted ? 'Muted' : 'On-Air'}</span>
            </span>
            <span className="font-mono text-xs font-bold text-white bg-background border border-border px-2.5 py-1 rounded-full tabular-nums">
              {formatDuration(speakingSeconds)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted font-semibold">Stage Open</span>
        )}
      </div>

      {/* Center Stage Presentation Area */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
        {floor ? (
          <div className="w-full max-w-lg flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar src={avatarSrc} name={floor.name} size="lg" className="border-4 border-live shadow-2xl shadow-live/20" />
              <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-surface ${
                isMuted ? 'bg-warning text-black' : 'bg-live text-white animate-pulse'
              }`}>
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs uppercase tracking-widest text-muted font-bold">Current Speaker</span>
                <RoleBadge role={floor.role || floor.mode || 'attendee'} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-words">{floor.name}</h1>
            </div>

            {/* Live Dual Audio Meters & Output Volume */}
            <div className="w-full p-3.5 bg-background border border-border rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Input Meter */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-muted">
                    <span>MIC IN</span>
                    <span>{isMuted ? 'MUTED' : `${Math.round(inputLevel * 100)}%`}</span>
                  </div>
                  <LevelMeter level={inputLevel} isMuted={isMuted} barCount={14} className="h-9" />
                </div>

                {/* Output Meter with Clip and Limiter Lights */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted">OUTPUT</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1 py-0.2 rounded text-xs font-bold ${
                        isLimiterActive ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-muted/40'
                      }`}>
                        LIM
                      </span>
                      <span className={`px-1 py-0.2 rounded text-xs font-bold transition-all ${
                        isClipping ? 'bg-live text-white shadow-sm shadow-live animate-pulse' : 'text-muted/40'
                      }`}>
                        CLIP
                      </span>
                      <span className="text-muted">{isMuted ? '0%' : `${Math.round(outputLevel * 100)}%`}</span>
                    </div>
                  </div>
                  <LevelMeter level={outputLevel} isMuted={isMuted} barCount={14} className="h-9" />
                </div>
              </div>

              {/* Volume Slider with numeric percent */}
              <div className="flex items-center gap-3 pt-1 border-t border-border/50 text-xs">
                <Volume2 size={15} className="text-muted flex-shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={volume}
                  onChange={(e) => onVolumeChange?.(Number(e.target.value))}
                  className="w-full accent-accent h-1.5 bg-surface rounded-lg appearance-none cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-white w-12 text-right">{volumePercent}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-2 text-muted max-w-xs">
            <div className="w-16 h-16 rounded-3xl bg-background border border-border flex items-center justify-center text-muted mb-1">
              <Mic size={30} className="opacity-40" />
            </div>
            <h3 className="text-base font-bold text-white">Nobody has the floor</h3>
            <p className="text-xs leading-relaxed">
              When you grant a participant the floor, their name, timer, live dual meters, and volume controls appear here.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Stage Control Grid: Grant Next is the one primary action */}
      <div className="space-y-3 pt-3 border-t border-border">
        <Button
          variant="primary"
          size="lg"
          disabled={queueLength === 0}
          onClick={onGrantNext}
          className="w-full min-h-[64px] flex-col gap-0.5"
        >
          <span className="text-lg font-extrabold tracking-wide">Grant next <kbd className="ml-1 px-1.5 rounded bg-white/15 text-xs font-mono">G</kbd></span>
          <span className="text-xs font-normal opacity-90 truncate max-w-full tabular-nums">
            {queueLength === 0
              ? 'No hands raised'
              : `${nextAttendeeName ? `Next: ${nextAttendeeName}` : `${queueLength} waiting`}${nextRaisedAt ? ` · ${formatDuration((Date.now() - nextRaisedAt) / 1000)}` : ''}`}
          </span>
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={isMuted ? 'warning' : 'secondary'}
            size="lg"
            disabled={!floor}
            onClick={onToggleMute}
            className="gap-2 font-bold"
          >
            {isMuted ? <Mic size={18} /> : <MicOff size={18} />}
            <span>{isMuted ? 'Unmute' : 'Mute'} <kbd className="px-1 rounded bg-white/10 text-xs font-mono">M</kbd></span>
          </Button>

          {/* Destructive: two-step confirm so a stray click cannot cut a speaker */}
          <Button
            variant={confirmEnd ? 'live' : 'secondary'}
            size="lg"
            disabled={!floor}
            onClick={() => {
              if (confirmEnd) { setConfirmEnd(false); onEndSpeaker?.(); }
              else setConfirmEnd(true);
            }}
            className={`gap-2 font-bold ${confirmEnd ? '' : 'text-live'}`}
          >
            <PhoneOff size={18} />
            <span>{confirmEnd ? 'Confirm end' : 'End floor'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
