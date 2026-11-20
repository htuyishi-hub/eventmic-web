import React, { useState } from 'react';
import { Lock, UserPlus, LogIn, ArrowRight, KeyRound } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { DMLogo } from '../brand/DMLogo.jsx';

const PASSCODE_STORAGE_KEY = 'eventmic_host_unlocked';
const PASSCODE_VALUE_KEY = 'eventmic_host_passcode_val';
export const ADMIN_TOKEN_KEY = 'dm_admin_token';
export const ADMIN_PROFILE_KEY = 'dm_admin_profile';

function getApiBase() {
  const raw = import.meta.env?.VITE_API_BASE || '/api';
  return String(raw).trim().replace(/\/+$/, '').replace(/\/api\/?$/, '') + '/api';
}

export function PasscodeGate({ onUnlocked }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'passcode'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'register' ? 'admins/register' : 'admins/login';
      const body = mode === 'register' ? { name, email, password } : { email, password };
      const res = await fetch(`${getApiBase()}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, data.adminToken);
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(data.admin));
      sessionStorage.setItem(PASSCODE_STORAGE_KEY, 'true');
      onUnlocked();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasscodeSubmit = async (e) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Enter the host passcode.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/admins/me`, {
        headers: { 'x-host-passcode': passcode.trim() }
      });
      if (!res.ok) {
        throw new Error('Incorrect host passcode.');
      }
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_PROFILE_KEY);
      sessionStorage.setItem(PASSCODE_STORAGE_KEY, 'true');
      sessionStorage.setItem(PASSCODE_VALUE_KEY, passcode.trim());
      onUnlocked();
    } catch (err) {
      setError(err.message || 'Incorrect host passcode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8">
        <div className="flex justify-center mb-5">
          <DMLogo size={32} />
        </div>

        <h1 className="text-2xl font-black text-center text-white tracking-tight mb-1">
          Admin Console
        </h1>
        <p className="text-sm text-center text-muted mb-6">
          Sign in or create an organizer account to manage your own sessions and calendar.
        </p>

        {mode !== 'passcode' ? (
          <>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-background border border-border mb-5">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`min-h-[44px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  mode === 'login' ? 'bg-blue-600 text-white' : 'text-muted hover:text-white'
                }`}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`min-h-[44px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  mode === 'register' ? 'bg-blue-600 text-white' : 'text-muted hover:text-white'
                }`}
              >
                <UserPlus size={14} />
                <span>Create Account</span>
              </button>
            </div>

            <form onSubmit={handleAccountSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    placeholder="e.g. Honore Tuyishi"
                    required
                    className="w-full min-h-[44px] px-4 bg-background border border-border rounded-xl text-white text-sm placeholder-muted focus:border-accent focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  required
                  className="w-full min-h-[44px] px-4 bg-background border border-border rounded-xl text-white text-sm placeholder-muted focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full min-h-[44px] px-4 bg-background border border-border rounded-xl text-white text-sm placeholder-muted focus:border-accent focus:outline-none"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs text-red-400 font-semibold text-center">
                  {error}
                </p>
              )}

              <Button type="submit" size="huge" loading={loading} className="w-full gap-2">
                <span>{mode === 'register' ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight size={18} />
              </Button>
            </form>

            <button
              type="button"
              onClick={() => { setMode('passcode'); setError(''); }}
              className="mt-5 w-full min-h-[44px] text-xs font-semibold text-muted hover:text-white flex items-center justify-center gap-1.5"
            >
              <KeyRound size={13} />
              <span>Use shared host passcode instead</span>
            </button>
          </>
        ) : (
          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                Host Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setError(''); }}
                placeholder="••••"
                autoFocus
                className="w-full min-h-[48px] px-4 bg-background border border-border rounded-xl text-white text-center text-xl tracking-[0.4em] font-mono focus:border-accent focus:outline-none"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs text-red-400 font-semibold text-center">
                {error}
              </p>
            )}

            <Button type="submit" size="huge" loading={loading} className="w-full gap-2">
              <Lock size={16} />
              <span>Unlock with Passcode</span>
            </Button>

            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className="w-full min-h-[44px] text-xs font-semibold text-muted hover:text-white"
            >
              Back to organizer Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
