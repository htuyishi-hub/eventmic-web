import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Repeat, Plus, Play, Trash2, Copy, Check } from 'lucide-react';
import { DMLogo } from '../brand/DMLogo.jsx';
import { Button } from '../ui/Button.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { useTransport } from '../../context/TransportContext.jsx';

const RECURRENCE_LABELS = {
  none: 'One-time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly'
};

function getApiBase(transport) {
  if (transport?.apiBase) return transport.apiBase;
  const raw = import.meta.env?.VITE_API_BASE || '/api';
  return String(raw).trim().replace(/\/+$/, '').replace(/\/api\/?$/, '') + '/api';
}

function getHostPasscode() {
  try {
    return sessionStorage.getItem('eventmic_host_passcode_val') || import.meta.env?.VITE_HOST_PASSCODE || '';
  } catch {
    return import.meta.env?.VITE_HOST_PASSCODE || '';
  }
}

export function SchedulePage() {
  const navigate = useNavigate();
  const { connect } = useSession();
  const { transport } = useTransport();
  const apiBase = getApiBase(transport);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const todayStr = new Date(Date.now() + 3600000).toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [recurrence, setRecurrence] = useState('none');
  const [fairMode, setFairMode] = useState('on');
  const [photos, setPhotos] = useState('speaker_only');

  const headers = useCallback(() => {
    let adminToken = '';
    try { adminToken = localStorage.getItem('dm_admin_token') || ''; } catch {}
    const h = { 'Content-Type': 'application/json' };
    if (adminToken) h['Authorization'] = `Bearer ${adminToken}`;
    else h['x-host-passcode'] = getHostPasscode();
    return h;
  }, []);

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/schedules`, { headers: headers() });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not load calendar');
      setItems(await res.json());
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load scheduled sessions');
    } finally {
      setLoading(false);
    }
  }, [apiBase, headers]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const startAt = new Date(`${date}T${time}:00`).toISOString();
      const res = await fetch(`${apiBase}/schedules`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          title: title.trim(),
          startAt,
          durationMinutes,
          recurrence,
          settings: { fairMode, photos }
        })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to schedule session');
      setTitle('');
      await loadSchedules();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${apiBase}/schedules/${id}`, { method: 'DELETE', headers: headers() });
      await loadSchedules();
    } catch {}
  };

  const handleStartNow = async (item) => {
    try {
      setError('');
      const res = await fetch(`${apiBase}/schedules/${item.id}/start`, {
        method: 'POST',
        headers: headers()
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to start session');
      const data = await res.json();
      await connect({
        role: 'admin',
        code: data.code,
        name: data.name
      });
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopyJoin = (item) => {
    const url = `${window.location.origin}/join/${item.code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-16 px-4 sm:px-6 bg-surface border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <DMLogo size={28} />
          <span className="text-sm font-bold text-muted hidden sm:inline">Session Calendar</span>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/admin')} className="gap-2">
          <ArrowLeft size={15} />
          <span>Back to Admin</span>
        </Button>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tight">Schedule &amp; Recurring Sessions</h1>
          <p className="text-sm text-muted">
            Plan events in advance or set up daily, weekly, or monthly recurring rooms with reserved codes.
          </p>
        </div>

        {/* Plan New Session Form */}
        <form onSubmit={handleCreate} className="p-5 rounded-2xl bg-surface border border-border space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Event Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setError(''); }}
                placeholder="e.g. Weekly All-Hands Q&A"
                maxLength={60}
                className="w-full min-h-[44px] px-4 rounded-xl bg-background border border-border text-sm text-white placeholder-muted focus:border-accent focus:outline-none"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-background border border-border text-sm text-white"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Start Time</span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-background border border-border text-sm text-white"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Duration</span>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-background border border-border text-sm text-white"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>2 hours</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Repeat</span>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-background border border-border text-sm text-white"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Fair Mode</span>
              <select
                value={fairMode}
                onChange={(e) => setFairMode(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-background border border-border text-sm text-white"
              >
                <option value="on">On (1st-time speakers first)</option>
                <option value="off">Off (FIFO)</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Photos</span>
              <select
                value={photos}
                onChange={(e) => setPhotos(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-background border border-border text-sm text-white"
              >
                <option value="speaker_only">Speaker Only</option>
                <option value="on">All Avatars</option>
                <option value="off">Off</option>
              </select>
            </label>
          </div>

          <Button type="submit" variant="primary" size="lg" loading={saving} className="w-full gap-2">
            <Plus size={18} />
            <span>Schedule Session</span>
          </Button>
        </form>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs font-semibold text-red-200">
            {error}
          </div>
        )}

        {/* Upcoming Sessions */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Upcoming Sessions</h2>
          {loading ? (
            <div className="p-8 rounded-xl bg-surface border border-border text-center text-sm text-muted">
              Loading calendar...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 rounded-xl bg-surface border border-border text-center text-sm text-muted">
              No scheduled sessions yet. Plan one above to reserve a room code.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-white truncate">{item.title}</span>
                    <span className="px-2 py-0.5 rounded bg-background border border-border font-mono text-xs font-bold text-white tracking-widest">
                      {item.code}
                    </span>
                    {item.recurrence !== 'none' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600/20 border border-blue-600/40 text-blue-300 text-xs font-semibold">
                        <Repeat size={11} />
                        {RECURRENCE_LABELS[item.recurrence]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted font-mono">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(item.startAt).toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {item.durationMinutes}m
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <Button variant="secondary" size="sm" onClick={() => handleCopyJoin(item)} className="gap-1.5">
                    {copiedId === item.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedId === item.id ? 'Copied' : 'Copy Link'}</span>
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleStartNow(item)} className="gap-1.5">
                    <Play size={14} />
                    <span>Start</span>
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Delete ${item.title}`}
                    className="min-w-[44px] min-h-[44px] grid place-items-center rounded-xl bg-background border border-border text-muted hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default SchedulePage;
