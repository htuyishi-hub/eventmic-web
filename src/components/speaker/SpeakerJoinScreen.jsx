import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, Mic } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Spinner } from '../ui/Spinner.jsx';

export function SpeakerJoinScreen({ onLogin, onJoin, initialCode = '' }) {
  const [code, setCode] = useState(initialCode);
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const cleanPin = pin.trim();

    if (cleanCode.length !== 6) {
      setError('Session code must be 6 characters');
      return;
    }
    if (!/^\d{6}$/.test(cleanPin)) {
      setError('Speaker PIN must be exactly 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const loginFn = onLogin || onJoin;
      if (loginFn) {
        await loginFn({ code: cleanCode, pin: cleanPin, name: name.trim() });
      }
    } catch (err) {
      // Real PIN attempt rate limiting and lockout is enforced authoritative on the server.
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (err.message) {
        setError(err.message);
      } else if (attempts >= 3) {
        setError('Multiple failed attempts. If you need your PIN regenerated, please check with your event admin.');
      } else {
        setError('Invalid PIN. Please check with your event admin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const hasMultipleFailures = failedAttempts >= 3;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm bg-surface border border-border rounded-3xl p-7 shadow-2xl space-y-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-inner ${
          hasMultipleFailures ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-accent/20 text-accent border border-accent/40'
        }`}>
          {hasMultipleFailures ? <Lock className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-lg font-black text-white uppercase tracking-wider">
            Speaker Check-in
          </h1>
          <p className="text-xs text-muted">
            {hasMultipleFailures
              ? 'Multiple invalid attempts. Ask event host to verify or regenerate your 6-digit PIN.'
              : 'Enter session code and your 6-digit speaker PIN to take the floor.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
              Room Code
            </label>
            <input
              type="text"
              value={code}
              disabled={loading}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. DEMO01"
              maxLength={6}
              required
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-white font-mono uppercase tracking-widest text-center text-sm disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
              6-Digit Speaker PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              disabled={loading}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              maxLength={6}
              required
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-white font-mono tracking-widest text-center text-sm disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
              Your Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              disabled={loading}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Connor"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-white text-xs disabled:opacity-50"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-rose-300 font-semibold p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30">
              {error}
            </p>
          )}

          <Button type="submit" size="huge" disabled={loading} className="w-full gap-2">
            {loading ? <Spinner size="sm" /> : <Mic size={16} />}
            <span>Enter Station</span>
            <ArrowRight size={16} />
          </Button>
        </form>
      </div>
    </div>
  );
}
