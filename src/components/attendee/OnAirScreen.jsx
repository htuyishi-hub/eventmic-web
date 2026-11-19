import React, { useState, useEffect, useRef } from 'react';
import { Mic, Radio, Square, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { LevelMeter } from '../host/LevelMeter.jsx';
import { AudioMeter } from '../../lib/audioMeter.js';
import { formatDuration } from '../../lib/time.js';

export function OnAirScreen({
  session,
  onStopSpeaking,
  onMicError,
  sendLevel,
  capSeconds = 120,
  previewMode = false,
  overrideSpeakingSeconds,
  overrideLevel = 0.65
}) {
  const [level, setLevel] = useState(overrideLevel);
  const [speakingSeconds, setSpeakingSeconds] = useState(overrideSpeakingSeconds || 0);

  const streamRef = useRef(null);
  const audioMeterRef = useRef(null);
  const wakeLockRef = useRef(null);

  useEffect(() => {
    if (previewMode) return;
    let isCancelled = false;

    async function initMic() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1
          }
        });

        if (isCancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        const meter = new AudioMeter();
        audioMeterRef.current = meter;
        meter.start(stream, (lvl) => {
          setLevel(lvl);
          if (sendLevel) sendLevel(lvl);
        });
      } catch (err) {
        console.error('[OnAir] Mic error:', err);
        if (onMicError) onMicError(err);
      }
    }

    initMic();

    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(lock => { wakeLockRef.current = lock; }).catch(() => {});
    }

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setSpeakingSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      isCancelled = true;
      clearInterval(timerInterval);
      if (audioMeterRef.current) audioMeterRef.current.stop();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (wakeLockRef.current) wakeLockRef.current.release().catch(() => {});
    };
  }, [sendLevel, onMicError]);

  const remainingSeconds = Math.max(0, capSeconds - speakingSeconds);
  const isWarning = remainingSeconds <= 15;

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 max-w-md mx-auto bg-background text-foreground">
      {/* Top Status */}
      <div className="pt-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-live/20 border border-live text-live text-xs font-black uppercase tracking-widest shadow-lg shadow-live/25 animate-pulse">
            <Radio size={16} />
            <span>You're Live</span>
          </div>

          {isWarning && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500 text-amber-300 text-xs font-black uppercase tracking-wider animate-bounce">
              <AlertTriangle size={14} />
              <span>{remainingSeconds}s left</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white tracking-tight">
            {session?.name || 'Live Stage'}
          </h1>
          <div className="flex items-center justify-center gap-3 font-mono text-white tabular-nums">
            <span className="text-3xl font-black">{formatDuration(speakingSeconds)}</span>
            <span className="text-xs text-muted">/ {formatDuration(capSeconds)} max</span>
          </div>
        </div>

        {/* Big Pulsing Mic Avatar */}
        <div className="p-8 bg-surface border-2 border-live rounded-3xl shadow-2xl flex flex-col items-center space-y-6 my-6 shadow-live/20">
          <div className="w-28 h-28 rounded-full bg-live/20 border-2 border-live flex items-center justify-center text-live animate-pulse shadow-lg shadow-live/40">
            <Mic size={52} />
          </div>

          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs text-muted font-mono px-1">
              <span>Mic Live Input</span>
              <span>{Math.round(level * 100)}%</span>
            </div>
            <LevelMeter level={level} isMuted={false} barCount={24} />
          </div>

          <p className="text-xs text-muted text-center max-w-xs">
            Speak clearly into your phone's microphone. The entire venue is listening.
          </p>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="space-y-3 pb-safe">
        <Button
          size="huge"
          variant="live"
          onClick={onStopSpeaking}
          className="w-full gap-2 text-base font-black uppercase tracking-wider"
        >
          <Square size={20} className="fill-current" />
          <span>Stop Speaking</span>
        </Button>
      </div>
    </div>
  );
}
