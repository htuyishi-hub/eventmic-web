import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, RefreshCw, Trash2, Calendar, LogOut } from 'lucide-react';
import { DMLogo } from '../brand/DMLogo.jsx';
import { SetupOutputsSection } from '../admin/SetupOutputsSection.jsx';
import { Button } from '../ui/Button.jsx';

const HOST_STORAGE_KEY = 'eventmic_host_session';

export function CreateSession({ onStartSession, onResumeSession }) {
  const [sessionName, setSessionName] = useState('');
  const [fairMode, setFairMode] = useState(true);
  const [turnCap, setTurnCap] = useState(120);
  const [photos, setPhotos] = useState('speaker_only');
  let adminProfile = null;
  try { adminProfile = JSON.parse(localStorage.getItem('dm_admin_profile') || 'null'); } catch {}
  const handleSignOut = () => {
    try {
      localStorage.removeItem('dm_admin_token');
      localStorage.removeItem('dm_admin_profile');
      sessionStorage.removeItem('eventmic_host_unlocked');
      sessionStorage.removeItem('eventmic_host_passcode_val');
    } catch {}
    window.location.reload();
  };
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [resumeTick, setResumeTick] = useState(0);
  const [expiredNotice, setExpiredNotice] = useState('');

  // Check if a saved live session exists
  let savedSession = null;
  try {
    const raw = localStorage.getItem(HOST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.session?.status === 'live') {
        savedSession = parsed.session;
      } else if (parsed?.status === 'live' || (parsed?.code && parsed?.name)) {
        savedSession = parsed;
      }
    }
  } catch {}

  useEffect(() => {
    if (!savedSession?.code) return undefined;
    let cancelled = false;
    const raw = import.meta.env?.VITE_API_BASE || '/api';
    const base = String(raw).trim().replace(/\/+$/, '').replace(/\/api\/?$/, '') + '/api';
    fetch(`${base}/sessions/${savedSession.code}`)
      .then(async (res) => {
        if (cancelled) return;
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.status === 'ended') {
          try { localStorage.removeItem(HOST_STORAGE_KEY); } catch {}
          setResumeTick((n) => n + 1);
          setExpiredNotice('Previous session ended on server. Create a new session below on your account.');
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [savedSession?.code]);

  const handleStartNew = async (e) => {
    e.preventDefault();
    const trimmed = sessionName.trim();
    if (trimmed.length < 3 || trimmed.length > 60) {
      setError('Session name must be between 3 and 60 characters.');
      return;
    }

    try {
      setLoading(true);
      await onStartSession({ name: trimmed, settings: { fairMode: fairMode ? 'on' : 'off', turnCapSeconds: turnCap, photos } });
    } catch (err) {
      setError(err.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    try {
      localStorage.removeItem(HOST_STORAGE_KEY);
    } catch {}
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-5">
          <DMLogo size={32} />
        </div>

        <h1 className="text-2xl font-black text-center text-white uppercase tracking-wider mb-2">
          Session Setup
        </h1>
        {adminProfile?.name && (
          <div className="flex items-center justify-center gap-2 mb-3 text-xs text-muted">
            <span>Signed in as <strong className="text-white">{adminProfile.name}</strong></span>
            <button type="button" onClick={handleSignOut} className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold">
              <LogOut size={12} />
              <span>Sign out</span>
            </button>
          </div>
        )}
        <p className="text-sm text-center text-muted mb-8">
          Launch a live Q&amp;A microphone room for your audience.
        </p>

        {expiredNotice && (
          <div role="status" className="mb-6 p-4 rounded-xl bg-amber-950/50 border border-amber-700 text-xs font-semibold text-amber-200">
            {expiredNotice}
          </div>
        )}

        {savedSession && (
          <div className="mb-8 p-5 bg-background border border-accent/40 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-accent">
                Active Session Found
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-surface border border-border text-white">
                {savedSession.code}
              </span>
            </div>
            <p className="text-base font-bold text-white mb-4">
              {savedSession.name}
            </p>
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="md"
                loading={resuming}
                className="flex-1 gap-2"
                onClick={async () => {
                  setResuming(true);
                  setError('');
                  try {
                    await onResumeSession(savedSession);
                  } catch (err) {
                    const msg = err?.message || 'Could not resume session';
                    if (/not found|ended/i.test(msg)) {
                      try { localStorage.removeItem(HOST_STORAGE_KEY); } catch {}
                      setResumeTick((n) => n + 1);
                      setError('Previous session expired on server. Start a new one below.');
                    } else {
                      setError(msg);
                    }
                  } finally {
                    setResuming(false);
                  }
                }}
              >
                <RefreshCw size={16} />
                <span>Resume Session</span>
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="gap-2 text-live hover:text-red-400"
                onClick={handleDiscard}
              >
                <Trash2 size={16} />
                <span>Discard</span>
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleStartNew} className="space-y-4">
          <div>
            <label htmlFor="session-name-input" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              New Session Title
            </label>
            <input
              id="session-name-input"
              type="text"
              value={sessionName}
              onChange={(e) => {
                setSessionName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Keynote Q&A or All-Hands Town Hall"
              maxLength={60}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-muted/60 text-sm focus:border-accent focus:outline-none transition-colors"
            />
            {error && (
              <p role="alert" className="mt-2 text-xs text-live font-medium">
                {error}
              </p>
            )}
          </div>

          {/* Pre-event defaults so admin doesn't configure during live Q&A */}
          <div className="pt-3 space-y-3 border-t border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Fair Mode (1st-time speakers first)</span>
              <button
                type="button"
                onClick={() => setFairMode((v) => !v)}
                className={`min-h-[44px] px-3.5 rounded-lg font-bold border transition-colors ${
                  fairMode ? 'bg-blue-600 border-blue-600 text-white' : 'bg-background border-border text-muted'
                }`}
              >
                {fairMode ? 'On' : 'Off'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Turn Cap</span>
                <select
                  value={turnCap}
                  onChange={(e) => setTurnCap(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-background border border-border text-sm text-white"
                >
                  <option value={60}>60s</option>
                  <option value={120}>2 min</option>
                  <option value={180}>3 min</option>
                  <option value={300}>5 min</option>
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
          </div>

          <SetupOutputsSection />

          <Button
            type="submit"
            size="huge"
            loading={loading}
            className="w-full gap-2"
          >
            <Play size={18} />
            <span>Start Session</span>
          </Button>

          <Link
            to="/check"
            className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background text-xs font-bold text-muted hover:text-white transition-colors"
          >
            <span>Sound Check (Speakers &amp; Amplifiers)</span>
          </Link>

          <Link
            to="/admin/schedule"
            className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background text-xs font-bold text-muted hover:text-white transition-colors"
          >
            <Calendar size={15} />
            <span>Schedule &amp; Recurring Calendar</span>
          </Link>
        </form>
      </div>
    </div>
  );
}
