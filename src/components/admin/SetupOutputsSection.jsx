import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Plus, Trash2, ChevronDown, ChevronRight, Download, Upload, Play } from 'lucide-react';
import { MultiOutputManager, MAX_OUTPUTS } from '../../lib/multiOutputManager.js';
import { enumerateOutputDevices } from '../../lib/audioDevices.js';
import { en } from '../../i18n/en.js';

export function SetupOutputsSection() {
  const mgrRef = useRef(null);
  if (!mgrRef.current) mgrRef.current = new MultiOutputManager();
  const mgr = mgrRef.current;

  const [outputs, setOutputs] = useState(() => mgr.getOutputs());
  const [devices, setDevices] = useState([]);
  const [open, setOpen] = useState(false);
  const [advOpen, setAdvOpen] = useState({});
  const [missingBehaviour, setMissingBehaviour] = useState(() => mgr.missingBehaviour);
  const [error, setError] = useState('');
  const [testingId, setTestingId] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    mgr.onChange = (list) => setOutputs(list);
    enumerateOutputDevices().then(setDevices).catch(() => {});
    return () => mgr.dispose();
  }, [mgr]);

  const handleAdd = () => {
    setError('');
    try {
      const firstDev = devices[0]?.deviceId || '';
      mgr.addOutput({ name: `Output ${outputs.length + 1}`, deviceId: firstDev, volume: 0.8, maxLevel: 1 });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTest = async (out) => {
    setError('');
    const targetDb = Math.round(20 * Math.log10(Math.max(0.03, Math.min(out.volume, out.maxLevel))));
    if (targetDb > -18 && typeof window !== 'undefined' && !window.confirm(`Test tone at ${targetDb} dBFS (above -18 dBFS)?`)) {
      return;
    }
    setTestingId(out.id);
    try {
      await mgr.playTestTone(out.id, targetDb, -12);
    } catch (err) {
      setError(err.message || 'Could not play test tone');
    } finally {
      setTimeout(() => setTestingId(null), 2500);
    }
  };

  const handleExport = () => {
    const blob = new Blob([mgr.exportPresetJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dm-venue-outputs.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError('');
      mgr.importPresetJson(await file.text());
      setMissingBehaviour(mgr.missingBehaviour);
    } catch (err) {
      setError(err.message || 'Invalid preset file');
    }
    e.target.value = '';
  };

  return (
    <div className="pt-3 border-t border-border space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full min-h-[44px] flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted hover:text-white"
      >
        <span className="inline-flex items-center gap-2">
          <Volume2 size={14} className="text-accent" />
          <span>{en.outputs.title} ({outputs.length}/{MAX_OUTPUTS})</span>
        </span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="space-y-3">
          {outputs.map((out) => (
            <div key={out.id} className="p-3 rounded-xl bg-background border border-border space-y-2.5">
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`out-name-${out.id}`}>Output name</label>
                <input
                  id={`out-name-${out.id}`}
                  type="text"
                  value={out.name}
                  onChange={(e) => mgr.updateOutput(out.id, { name: e.target.value })}
                  className="flex-1 min-h-[40px] px-2.5 rounded-lg bg-surface border border-border text-xs font-bold text-white"
                  placeholder="Output name"
                />
                <button
                  type="button"
                  onClick={() => handleTest(out)}
                  aria-label={`Test ${out.name}`}
                  className="min-h-[40px] px-2.5 rounded-lg bg-surface border border-border text-xs font-bold text-white hover:border-accent inline-flex items-center gap-1"
                >
                  <Play size={12} />
                  <span>{testingId === out.id ? 'Testing' : 'Test'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => mgr.removeOutput(out.id)}
                  aria-label={`Remove ${out.name}`}
                  className="min-w-[40px] min-h-[40px] grid place-items-center rounded-lg text-muted hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <label className="block space-y-1">
                <span className="text-xs text-muted">Device</span>
                <select
                  value={out.deviceId}
                  onChange={(e) => mgr.updateOutput(out.id, { deviceId: e.target.value })}
                  className="w-full min-h-[40px] px-2.5 rounded-lg bg-surface border border-border text-xs text-white"
                >
                  <option value="">System default</option>
                  {devices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Audio Output ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="block space-y-1">
                  <span className="text-muted">Volume ({Math.round(out.volume * 100)}%)</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={out.volume}
                    onChange={(e) => mgr.updateOutput(out.id, { volume: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-muted">Max level ({Math.round(out.maxLevel * 100)}%)</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={out.maxLevel}
                    onChange={(e) => mgr.updateOutput(out.id, { maxLevel: Number(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => setAdvOpen((prev) => ({ ...prev, [out.id]: !prev[out.id] }))}
                className="text-xs font-semibold text-muted hover:text-white inline-flex items-center gap-1"
              >
                {advOpen[out.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <span>Advanced</span>
              </button>

              {advOpen[out.id] && (
                <div className="pt-1 space-y-1.5">
                  <label className="flex items-center justify-between text-xs gap-2">
                    <span className="text-muted">Delay (ms)</span>
                    <input
                      type="number"
                      min="0"
                      max="2000"
                      value={out.delayMs}
                      onChange={(e) => mgr.updateOutput(out.id, { delayMs: Number(e.target.value) })}
                      className="w-24 min-h-[36px] px-2 rounded-lg bg-surface border border-border text-xs font-mono text-white"
                    />
                  </label>
                  <p className="text-xs text-muted">{en.outputs.delayNote}</p>
                </div>
              )}
            </div>
          ))}

          {error && <p role="alert" className="text-xs text-red-400 font-semibold">{error}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={outputs.length >= MAX_OUTPUTS}
              className="min-h-[40px] px-3 rounded-lg bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              <Plus size={14} />
              <span>{en.outputs.addOutput}</span>
            </button>
            <button type="button" onClick={handleExport} className="min-h-[40px] px-3 rounded-lg bg-background border border-border text-xs text-muted hover:text-white inline-flex items-center gap-1.5">
              <Download size={13} />
              <span>{en.outputs.exportPreset}</span>
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="min-h-[40px] px-3 rounded-lg bg-background border border-border text-xs text-muted hover:text-white inline-flex items-center gap-1.5">
              <Upload size={13} />
              <span>{en.outputs.importPreset}</span>
            </button>
            <input ref={fileRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
          </div>

          <label className="block space-y-1 text-xs">
            <span className="text-muted">When an output disconnects</span>
            <select
              value={missingBehaviour}
              onChange={(e) => { setMissingBehaviour(e.target.value); mgr.setMissingBehaviour(e.target.value); }}
              className="w-full min-h-[40px] px-2.5 rounded-lg bg-background border border-border text-xs text-white"
            >
              <option value="mute_warn">Mute and warn (default)</option>
              <option value="fallback">Fall back to first connected output</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}

export default SetupOutputsSection;
