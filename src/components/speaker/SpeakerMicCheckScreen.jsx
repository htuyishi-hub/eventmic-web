import React, { useState, useEffect, useRef } from 'react';
import { Mic, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export function SpeakerMicCheckScreen({ onContinue }) {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [level, setLevel] = useState(0);

  const streamRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    async function loadDevices() {
      try {
        const devs = await navigator.mediaDevices?.enumerateDevices();
        const inputs = (devs || []).filter(d => d.kind === 'audioinput');
        setDevices(inputs);
        if (inputs[0]?.deviceId) setSelectedDevice(inputs[0].deviceId);
      } catch {}
    }
    loadDevices();
  }, []);

  const toggleTest = async () => {
    if (isTesting) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setIsTesting(false);
      setLevel(0);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedDevice ? { exact: selectedDevice } : undefined }
      });
      streamRef.current = stream;
      setIsTesting(true);

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);

      const buf = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        setLevel(Math.min(100, Math.round(Math.sqrt(sum / buf.length) * 300)));
        animRef.current = requestAnimationFrame(update);
      };
      update();
    } catch {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <ShieldAlert size={16} className="flex-shrink-0" />
          <span>This device stays silent. Keep it away from speakers.</span>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-lg font-black text-white uppercase tracking-wider">
            Stage Microphone Check
          </h2>
          <p className="text-xs text-muted">
            Verify your headset, lapel, or device microphone before entering the live stage.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
              Audio Input Device
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-white"
            >
              {devices.length === 0 ? (
                <option value="">Default Microphone</option>
              ) : (
                devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone (${d.deviceId.slice(0, 6)})`}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1.5 p-3 rounded-xl bg-background border border-border">
            <div className="flex justify-between text-xs text-muted font-mono">
              <span>Test Mic Level</span>
              <span className={level > 10 ? 'text-accent font-bold' : ''}>{level}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-surface overflow-hidden border border-border">
              <div
                className="h-full bg-accent transition-all duration-75 rounded-full"
                style={{ width: `${level}%` }}
              />
            </div>
          </div>

          <Button
            size="md"
            variant={isTesting ? 'secondary' : 'primary'}
            onClick={toggleTest}
            className="w-full gap-2 text-xs py-2"
          >
            <Mic size={14} />
            <span>{isTesting ? 'Stop Test' : 'Test My Mic'}</span>
          </Button>
        </div>

        <Button
          size="huge"
          variant="primary"
          onClick={() => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            onContinue?.();
          }}
          className="w-full gap-2"
        >
          <CheckCircle2 size={16} />
          <span>Continue to Stage</span>
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
