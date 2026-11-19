import React, { useState, useEffect, useRef } from 'react';
import { Mic, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

const INPUT_STORAGE_KEY = 'eventmic_speaker_input_device';

export function SpeakerAudioPanel({ transport, isOnFloor }) {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(() => localStorage.getItem(INPUT_STORAGE_KEY) || '');
  const [isTesting, setIsTesting] = useState(false);
  const [level, setLevel] = useState(0);
  const [batteryLow, setBatteryLow] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);

  const streamRef = useRef(null);
  const animRef = useRef(null);
  const wakeLockRef = useRef(null);

  useEffect(() => {
    async function loadInputs() {
      try {
        const devs = await navigator.mediaDevices?.enumerateDevices();
        const inputs = (devs || []).filter(d => d.kind === 'audioinput');
        setDevices(inputs);
        if (!selectedDevice && inputs[0]?.deviceId) setSelectedDevice(inputs[0].deviceId);
      } catch {}
    }
    loadInputs();
  }, [selectedDevice]);

  useEffect(() => {
    let active = true;
    async function acquireStream() {
      try {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        const constraints = {
          audio: {
            deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
            echoCancellation: true, noiseSuppression: true, autoGainControl: true
          }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        transport?.setPreWarmedStream?.(stream);
      } catch (err) { console.warn('Pre-warm mic error:', err); }
    }
    acquireStream();
    return () => { active = false; };
  }, [selectedDevice, transport]);

  useEffect(() => {
    if (!streamRef.current || (!isTesting && !isOnFloor)) { setLevel(0); return; }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const src = ctx.createMediaStreamSource(streamRef.current);
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

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      try { src.disconnect(); ctx.close(); } catch {}
    };
  }, [isTesting, isOnFloor]);

  useEffect(() => {
    async function requestWake() {
      try {
        if ('wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch {}
    }
    requestWake();
    return () => { wakeLockRef.current?.release?.(); };
  }, []);

  useEffect(() => {
    async function checkBattery() {
      try {
        if ('getBattery' in navigator) {
          const b = await navigator.getBattery();
          const update = () => {
            setBatteryLevel(Math.round(b.level * 100));
            setBatteryLow(b.level < 0.20 && !b.charging);
          };
          update();
          b.addEventListener('levelchange', update);
          b.addEventListener('chargingchange', update);
          return () => {
            b.removeEventListener('levelchange', update);
            b.removeEventListener('chargingchange', update);
          };
        }
      } catch {}
    }
    checkBattery();
  }, []);

  const handleDeviceChange = (e) => {
    const val = e.target.value;
    setSelectedDevice(val);
    localStorage.setItem(INPUT_STORAGE_KEY, val);
  };

  return (
    <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
        <ShieldAlert size={16} className="flex-shrink-0" />
        <span>This device stays silent. Keep it away from the speakers.</span>
      </div>

      {batteryLow && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-live/15 border border-live/30 text-live text-xs">
          <AlertTriangle size={16} />
          <span>Battery is low ({batteryLevel}%). Connect device to power.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <label className="text-[11px] font-bold uppercase text-muted tracking-wider block mb-1">
            Use headset or lapel mic
          </label>
          <select
            value={selectedDevice}
            onChange={handleDeviceChange}
            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-white"
          >
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Microphone (${d.deviceId.slice(0, 6)})`}
              </option>
            ))}
          </select>
        </div>

        <Button
          size="sm"
          variant={isTesting ? 'secondary' : 'primary'}
          onClick={() => setIsTesting(v => !v)}
          className="gap-1.5 text-xs py-1.5 px-3 self-end sm:self-auto"
        >
          <Mic size={14} />
          <span>{isTesting ? 'Stop Test' : 'Test my mic'}</span>
        </Button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-muted">
          <span>{isOnFloor ? 'Live Mic Level' : isTesting ? 'Testing Mic Level' : 'Mic Meter'}</span>
          <span className="font-mono">{level}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-background overflow-hidden border border-border/50">
          <div
            className={`h-full transition-all duration-75 rounded-full ${
              isOnFloor ? 'bg-live shadow-sm shadow-live' : 'bg-accent'
            }`}
            style={{ width: `${level}%` }}
          />
        </div>
      </div>
    </div>
  );
}
