import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Mic, AlertTriangle, Radio } from 'lucide-react';
import { Button } from '../../ui/Button.jsx';
import { speakAnnouncement } from '../../../lib/audioTone.js';

export function TestToolsSection({
  onPlayTone,
  maxChannelCount = 2,
  onAttachMicStream,
  isTestingMic = false,
  setIsTestingMic
}) {
  const [playingToneKind, setPlayingToneKind] = useState(null);
  const [micCountdown, setMicCountdown] = useState(5);
  const micStreamRef = useRef(null);
  const timerRef = useRef(null);

  const speechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const handlePlayTone = (kind) => {
    setPlayingToneKind(kind);
    onPlayTone(kind);
    setTimeout(() => setPlayingToneKind(null), 1600);
  };

  const handleStartMicLoopback = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setIsTestingMic(true);
      setMicCountdown(5);
      onAttachMicStream(stream);

      timerRef.current = setInterval(() => {
        setMicCountdown((prev) => {
          if (prev <= 1) {
            handleStopMicLoopback();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Failed to start mic test:', err);
      handleStopMicLoopback();
    }
  };

  const handleStopMicLoopback = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setIsTestingMic(false);
    onAttachMicStream(null);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white font-bold text-sm">
        <Volume2 size={16} className="text-accent" />
        <span>Hardware Test Tools</span>
      </div>

      {/* 1. Test Tone Buttons */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white font-semibold">1 kHz Sine Tone (-18 dBFS, 1.5s)</span>
          <span className="text-xs font-mono text-muted">A440 Calibration</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {['centre', 'left', 'right'].map((k) => (
            <Button
              key={k}
              variant="secondary"
              size="sm"
              onClick={() => handlePlayTone(k)}
              disabled={Boolean(playingToneKind)}
              className="capitalize text-xs gap-1 py-1.5"
            >
              <Play size={12} className={playingToneKind === k ? 'animate-pulse text-accent' : ''} />
              <span>{k}</span>
            </Button>
          ))}
        </div>

        {maxChannelCount > 2 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {Array.from({ length: maxChannelCount - 2 }, (_, i) => i + 3).map((ch) => (
              <Button
                key={ch}
                variant="secondary"
                size="sm"
                onClick={() => handlePlayTone(ch)}
                disabled={Boolean(playingToneKind)}
                className="text-xs font-mono py-1 px-2.5"
              >
                Ch {ch}
              </Button>
            ))}
          </div>
        )}

        {speechAvailable && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => speakAnnouncement('DM audio check. Channel output verified.')}
            className="w-full text-xs gap-2 py-1.5 mt-1 text-muted hover:text-white"
          >
            <Radio size={14} />
            <span>Speak Voice Announcement</span>
          </Button>
        )}
      </div>

      {/* 2. Mic Loopback Check */}
      <div className="p-3 rounded-xl bg-surface border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Mic size={14} className="text-accent" />
            <span>Test with My Mic (5s Loopback)</span>
          </div>
          {isTestingMic && (
            <span className="text-xs font-mono font-bold text-live animate-pulse">
              {micCountdown}s remaining
            </span>
          )}
        </div>

        <p className="text-xs text-muted leading-relaxed">
          Feeds host laptop mic through the full graph (filter, gate, limiter) to test speaker sound before the show.
        </p>

        <div className="p-2.5 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-2 text-warning text-xs">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <span>Warning: Wear headphones or turn down venue PA speakers to prevent acoustic feedback.</span>
        </div>

        <Button
          variant={isTestingMic ? 'live' : 'secondary'}
          size="sm"
          onClick={isTestingMic ? handleStopMicLoopback : handleStartMicLoopback}
          className="w-full text-xs gap-2 py-2"
        >
          <Mic size={14} className={isTestingMic ? 'animate-pulse' : ''} />
          <span>{isTestingMic ? `Stop Mic Test (${micCountdown}s)` : 'Start 5s Mic Loopback'}</span>
        </Button>
      </div>
    </div>
  );
}
