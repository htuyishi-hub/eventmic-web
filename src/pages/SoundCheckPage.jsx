import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Volume2, Square, RefreshCw, Copy, Check, AlertTriangle,
  Bluetooth, Clock, ShieldAlert, ArrowLeft, Play
} from 'lucide-react';
import { DMLogo } from '../components/brand/DMLogo.jsx';
import { Button } from '../components/ui/Button.jsx';
import {
  DEFAULT_CAP_DB,
  CONFIRM_THRESHOLD_DB,
  clampLevelDb,
  needsLevelConfirmation,
  scheduleSafeRamp,
  cutOutputWithRamp,
  buildClickTemplate,
  findClicksByCrossCorrelation,
  detectFeedbackSqueal,
  createPinkNoiseBuffer,
  isBluetoothLabel,
  formatSoundCheckReport
} from '../lib/soundCheckAudio.js';

const STORAGE_OUTPUT_KEY = 'dm_soundcheck_output_id';

const SIGNALS = [
  { id: 'tone_1k', label: '1 kHz tone', desc: 'Mono reference sine' },
  { id: 'left', label: 'Left', desc: 'Left channel only' },
  { id: 'right', label: 'Right', desc: 'Right channel only' },
  { id: 'centre', label: 'Centre', desc: 'Both channels equal' },
  { id: 'sweep', label: '20 Hz–20 kHz sweep (5 s)', desc: 'Logarithmic frequency sweep' },
  { id: 'pink', label: 'Pink noise', desc: 'Equal energy per octave' },
  { id: 'speech', label: 'Spoken "left, right"', desc: 'Browser speechSynthesis' }
];

export function SoundCheckPage() {
  const [outputs, setOutputs] = useState([]);
  const [selectedOutputId, setSelectedOutputId] = useState(() => {
    try { return localStorage.getItem(STORAGE_OUTPUT_KEY) || 'default'; } catch { return 'default'; }
  });
  const [capDb, setCapDb] = useState(DEFAULT_CAP_DB);
  const [targetDb, setTargetDb] = useState(-20);
  const [activeSignal, setActiveSignal] = useState(null);
  const [pendingConfirmSignal, setPendingConfirmSignal] = useState(null);

  const [measuring, setMeasuring] = useState(false);
  const [delayResult, setDelayResult] = useState(null);
  const [feedbackWarning, setFeedbackWarning] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const ctxRef = useRef(null);
  const masterGainRef = useRef(null);
  const activeNodesRef = useRef([]);
  const stopTimerRef = useRef(null);
  const micStreamRef = useRef(null);
  const feedbackRafRef = useRef(null);

  const sinkIdSupported = typeof window !== 'undefined' &&
    typeof window.AudioContext !== 'undefined' &&
    typeof window.AudioContext.prototype?.setSinkId === 'function';

  const refreshOutputs = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const outs = all.filter((d) => d.kind === 'audiooutput');
      setOutputs(outs);
    } catch {}
  }, []);

  useEffect(() => {
    refreshOutputs();
    const md = navigator.mediaDevices;
    md?.addEventListener?.('devicechange', refreshOutputs);
    return () => md?.removeEventListener?.('devicechange', refreshOutputs);
  }, [refreshOutputs]);

  const handleOutputChange = (id) => {
    setSelectedOutputId(id);
    try { localStorage.setItem(STORAGE_OUTPUT_KEY, id); } catch {}
  };

  const stopAll = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (feedbackRafRef.current) {
      cancelAnimationFrame(feedbackRafRef.current);
      feedbackRafRef.current = null;
    }
    try { window.speechSynthesis?.cancel(); } catch {}

    const ctx = ctxRef.current;
    const gain = masterGainRef.current;
    if (ctx && gain) {
      try { cutOutputWithRamp(gain.gain, ctx.currentTime); } catch {}
    }

    for (const node of activeNodesRef.current) {
      try { node.stop?.(); } catch {}
      try { node.disconnect?.(); } catch {}
    }
    activeNodesRef.current = [];

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    setActiveSignal(null);
    setMeasuring(false);
  }, []);

  // Always stop playback on page close or unmount
  useEffect(() => {
    const onClose = () => stopAll();
    window.addEventListener('beforeunload', onClose);
    window.addEventListener('pagehide', onClose);
    return () => {
      window.removeEventListener('beforeunload', onClose);
      window.removeEventListener('pagehide', onClose);
      stopAll();
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
    };
  }, [stopAll]);

  const ensureContext = useCallback(async () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!ctxRef.current) {
      ctxRef.current = new AudioCtx();
    }
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    if (sinkIdSupported && selectedOutputId && selectedOutputId !== 'default') {
      try { await ctx.setSinkId(selectedOutputId); } catch {}
    }
    if (!masterGainRef.current) {
      masterGainRef.current = ctx.createGain();
      masterGainRef.current.gain.value = 0;
      masterGainRef.current.connect(ctx.destination);
    }
    return ctx;
  }, [selectedOutputId, sinkIdSupported]);

  const startSignal = async (signalId, bypassConfirm = false) => {
    setError('');
    setFeedbackWarning('');

    if (signalId !== 'speech' && !bypassConfirm && needsLevelConfirmation(targetDb, capDb)) {
      setPendingConfirmSignal(signalId);
      return;
    }

    stopAll();

    if (signalId === 'speech') {
      if (!('speechSynthesis' in window)) {
        setError('speechSynthesis is not supported in this browser.');
        return;
      }
      setActiveSignal('speech');
      const utter = new SpeechSynthesisUtterance('left, right');
      utter.onend = () => setActiveSignal(null);
      utter.onerror = () => setActiveSignal(null);
      window.speechSynthesis.speak(utter);
      return;
    }

    try {
      const ctx = await ensureContext();
      const master = masterGainRef.current;
      const now = ctx.currentTime;
      scheduleSafeRamp(master.gain, now, targetDb, capDb);

      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const dest = panner || master;
      if (panner) panner.connect(master);

      if (signalId === 'tone_1k' || signalId === 'left' || signalId === 'right' || signalId === 'centre') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        if (panner) {
          panner.pan.setValueAtTime(signalId === 'left' ? -1 : signalId === 'right' ? 1 : 0, now);
        }
        osc.connect(dest);
        osc.start(now);
        activeNodesRef.current.push(osc);
      } else if (signalId === 'sweep') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(20, now);
        osc.frequency.exponentialRampToValueAtTime(20000, now + 5);
        osc.connect(dest);
        osc.start(now);
        osc.stop(now + 5.05);
        activeNodesRef.current.push(osc);
        stopTimerRef.current = setTimeout(() => setActiveSignal(null), 5100);
      } else if (signalId === 'pink') {
        const buf = createPinkNoiseBuffer(ctx, 5);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        src.connect(dest);
        src.start(now);
        activeNodesRef.current.push(src);
      }

      if (panner) activeNodesRef.current.push(panner);
      setActiveSignal(signalId);
    } catch (err) {
      setError(err.message || 'Could not start audio output');
    }
  };

  const handleMeasureDelay = async () => {
    setError('');
    setFeedbackWarning('');
    setDelayResult(null);
    stopAll();

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone access is not available in this browser.');
      return;
    }

    setMeasuring(true);
    let stream;
    try {
      // Echo cancellation & noise suppression MUST be OFF for accurate acoustic delay
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1
        }
      });
      micStreamRef.current = stream;

      const ctx = await ensureContext();
      const sampleRate = ctx.sampleRate;
      const master = masterGainRef.current;

      // Capture mic audio via ScriptProcessor/Analyser while emitting 5 clicks
      const micSrc = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      micSrc.connect(analyser);

      // Feedback guard monitor while mic is open
      const freqBins = new Float32Array(analyser.frequencyBinCount);
      let fbState = { streak: 0, lastPeakDb: -120 };
      let feedbackCut = false;

      const monitorFeedback = () => {
        if (!micStreamRef.current) return;
        analyser.getFloatFrequencyData(freqBins);
        fbState = detectFeedbackSqueal(freqBins, fbState);
        if (fbState.triggered && !feedbackCut) {
          feedbackCut = true;
          cutOutputWithRamp(master.gain, ctx.currentTime);
          setFeedbackWarning('Feedback squeal detected! Output cut with a 20 ms ramp.');
          stopAll();
          return;
        }
        feedbackRafRef.current = requestAnimationFrame(monitorFeedback);
      };
      feedbackRafRef.current = requestAnimationFrame(monitorFeedback);

      // Record raw PCM samples for 2.8 seconds while playing 5 clicks
      const totalSeconds = 2.8;
      const recordedChunks = [];
      const proc = ctx.createScriptProcessor(2048, 1, 1);
      const zeroGain = ctx.createGain();
      zeroGain.gain.value = 0;
      micSrc.connect(proc);
      proc.connect(zeroGain);
      zeroGain.connect(ctx.destination);

      let capturedSamples = 0;
      const recordStartTime = ctx.currentTime + 0.05;
      proc.onaudioprocess = (ev) => {
        const input = ev.inputBuffer.getChannelData(0);
        recordedChunks.push(new Float32Array(input));
        capturedSamples += input.length;
      };

      const clickTemplate = buildClickTemplate(sampleRate);
      const clickBuf = ctx.createBuffer(1, clickTemplate.length, sampleRate);
      clickBuf.getChannelData(0).set(clickTemplate);

      const clickGainVal = Math.min(dbToGainSafe(clampLevelDb(targetDb, capDb)), dbToGainSafe(capDb));
      master.gain.cancelScheduledValues(recordStartTime);
      master.gain.setValueAtTime(clickGainVal, recordStartTime);

      const clickTimesSec = [0.35, 0.80, 1.25, 1.70, 2.15];
      const expectedOffsetsSamples = clickTimesSec.map((t) => Math.round(t * sampleRate));

      for (const offsetSec of clickTimesSec) {
        const src = ctx.createBufferSource();
        src.buffer = clickBuf;
        src.connect(master);
        src.start(recordStartTime + offsetSec);
        activeNodesRef.current.push(src);
      }

      await new Promise((resolve) => {
        stopTimerRef.current = setTimeout(resolve, totalSeconds * 1000);
      });

      proc.disconnect();
      zeroGain.disconnect();
      micSrc.disconnect();

      if (feedbackCut) return;

      const merged = new Float32Array(capturedSamples);
      let pos = 0;
      for (const c of recordedChunks) {
        merged.set(c, pos);
        pos += c.length;
      }

      const result = findClicksByCrossCorrelation(merged, clickTemplate, expectedOffsetsSamples, sampleRate);
      setDelayResult(result);
    } catch (err) {
      setError(err.message || 'Delay measurement failed');
    } finally {
      stopAll();
    }
  };

  const selectedOutput = outputs.find((o) => o.deviceId === selectedOutputId);
  const selectedLabel = selectedOutput?.label || (selectedOutputId === 'default' ? 'System default' : 'Hidden by browser (grant mic permission to reveal names)');
  const hasHiddenLabels = outputs.length > 0 && outputs.every((o) => !o.label);
  const isBluetooth = isBluetoothLabel(selectedLabel);

  const handleCopyResults = () => {
    const text = formatSoundCheckReport({
      outputLabel: selectedLabel,
      targetDb: clampLevelDb(targetDb, capDb),
      capDb,
      delayResult,
      feedbackTriggered: Boolean(feedbackWarning),
      sinkIdSupported
    });
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-16 px-4 sm:px-6 bg-surface border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <DMLogo size={28} />
          <span className="text-sm font-bold text-muted hidden sm:inline">Sound Check</span>
        </div>
        <Link
          to="/admin"
          className="min-h-[44px] px-4 rounded-xl bg-background border border-border text-sm font-bold text-white inline-flex items-center gap-2 hover:border-accent"
        >
          <ArrowLeft size={15} />
          <span>Back</span>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Speakers and amplifiers</h1>
            <p className="text-sm text-muted">
              Local hardware check with 1.5 s soft ramp and safety cap. No data leaves this device.
            </p>
          </div>
          <Button variant="secondary" size="md" onClick={handleCopyResults} className="gap-2 flex-shrink-0">
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            <span>{copied ? 'Copied Results' : 'Copy results'}</span>
          </Button>
        </div>

        {/* Big Stop Button */}
        <Button
          variant="live"
          size="huge"
          onClick={stopAll}
          disabled={!activeSignal && !measuring}
          className="w-full min-h-[64px] gap-3 text-lg font-black uppercase tracking-wider"
        >
          <Square size={22} className="fill-current" />
          <span>{activeSignal || measuring ? 'STOP ALL AUDIO' : 'STOP (IDLE)'}</span>
        </Button>

        {feedbackWarning && (
          <div role="alert" className="p-4 rounded-xl bg-red-950/80 border border-red-600 text-red-100 flex items-center gap-3 text-sm font-bold">
            <ShieldAlert size={20} className="text-red-400 flex-shrink-0" />
            <span>{feedbackWarning}</span>
          </div>
        )}

        {error && (
          <div role="alert" className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Output Picker & Safety Cap */}
        <section className="p-5 rounded-2xl bg-surface border border-border space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <Volume2 size={14} className="text-accent" />
              <span>Output Device &amp; Safety Cap</span>
            </h2>
            <button
              type="button"
              onClick={refreshOutputs}
              className="min-h-[44px] px-3 rounded-xl bg-background border border-border text-xs font-bold text-muted hover:text-white inline-flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>

          <select
            aria-label="Output device"
            value={selectedOutputId}
            onChange={(e) => handleOutputChange(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-xl bg-background border border-border text-sm text-white"
          >
            <option value="default">System default output</option>
            {outputs.map((o, i) => (
              <option key={o.deviceId || i} value={o.deviceId}>
                {o.label || `Audio Output ${i + 1} (name hidden by browser)`}
              </option>
            ))}
          </select>

          {!sinkIdSupported && (
            <p className="text-xs text-amber-300">
              This browser does not support per-output routing (setSinkId). Audio plays through the system default output.
            </p>
          )}
          {hasHiddenLabels && (
            <p className="text-xs text-muted">
              Browser hid output device names. Run &ldquo;Measure delay&rdquo; once to grant mic permission and reveal names.
            </p>
          )}

          {isBluetooth && (
            <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-700/50 text-xs text-blue-200 flex items-start gap-2.5">
              <Bluetooth size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Bluetooth output detected:</strong> wireless audio delay is expected.
                {delayResult?.detectedCount > 0 && (
                  <span className="block mt-1 font-mono text-white">
                    Measured delay: {delayResult.medianMs} ms (range {delayResult.minMs}–{delayResult.maxMs} ms)
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <label className="block space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-muted">Target Level</span>
                <span className="font-mono font-bold text-white">
                  {targetDb} dBFS {targetDb > capDb ? `(capped at ${capDb})` : ''}
                </span>
              </div>
              <input
                type="range"
                min={-30}
                max={-6}
                step={1}
                value={targetDb}
                onChange={(e) => setTargetDb(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted block">Safety Cap (Max Level)</span>
              <select
                value={capDb}
                onChange={(e) => setCapDb(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-background border border-border text-sm text-white font-mono"
              >
                <option value={-24}>-24 dBFS (very quiet)</option>
                <option value={-18}>-18 dBFS (safe)</option>
                <option value={-12}>-12 dBFS (default cap)</option>
                <option value={-6}>-6 dBFS (loud)</option>
              </select>
            </label>
          </div>
        </section>

        {/* Confirmation Modal for > -18 dBFS */}
        {pendingConfirmSignal && (
          <div role="dialog" aria-modal="true" className="p-4 rounded-xl bg-amber-950/70 border border-amber-600 space-y-3">
            <div className="flex items-start gap-2.5 text-sm text-amber-100">
              <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                Level <strong>{clampLevelDb(targetDb, capDb)} dBFS</strong> is above {CONFIRM_THRESHOLD_DB} dBFS. Confirm your amplifier volume is safe before ramping up.
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="warning"
                size="sm"
                onClick={() => {
                  const sig = pendingConfirmSignal;
                  setPendingConfirmSignal(null);
                  startSignal(sig, true);
                }}
              >
                Confirm &amp; Play
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPendingConfirmSignal(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Test Signals */}
        <section className="p-5 rounded-2xl bg-surface border border-border space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
            Test Signals (starts at -30 dBFS, 1.5 s ramp)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SIGNALS.map((sig) => {
              const isPlaying = activeSignal === sig.id;
              return (
                <button
                  key={sig.id}
                  type="button"
                  onClick={() => (isPlaying ? stopAll() : startSignal(sig.id))}
                  className={`min-h-[52px] px-4 py-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                    isPlaying
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-background border-border text-white hover:border-accent'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold">{sig.label}</div>
                    <div className={`text-xs ${isPlaying ? 'text-blue-100' : 'text-muted'}`}>{sig.desc}</div>
                  </div>
                  <Play size={16} className={isPlaying ? 'animate-pulse' : 'text-muted'} />
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted">
            Note: Spoken &ldquo;left, right&rdquo; uses browser speechSynthesis and always plays on the system default output.
          </p>
        </section>

        {/* Delay Measurement */}
        <section className="p-5 rounded-2xl bg-surface border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-accent" />
                <span>Acoustic Delay Measurement</span>
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Plays 5 clicks and records mic (echo cancellation &amp; noise suppression OFF) to measure total delay.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              loading={measuring}
              onClick={handleMeasureDelay}
              className="flex-shrink-0"
            >
              Measure delay
            </Button>
          </div>

          {delayResult && (
            <div className="p-4 rounded-xl bg-background border border-border text-sm space-y-1">
              {delayResult.detectedCount > 0 ? (
                <>
                  <div className="font-mono text-white font-bold text-base">
                    Median: {delayResult.medianMs} ms{' '}
                    <span className="text-muted text-xs font-normal">
                      (range {delayResult.minMs}–{delayResult.maxMs} ms · {delayResult.detectedCount}/5 clicks)
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    Result includes the laptop&apos;s audio stack and any Bluetooth or wireless link.
                  </p>
                </>
              ) : (
                <p className="text-xs text-amber-300 font-semibold">
                  No click was detected. Try moving the microphone closer to the speaker or raising the level.
                </p>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function dbToGainSafe(db) {
  return Math.pow(10, db / 20);
}

export default SoundCheckPage;
