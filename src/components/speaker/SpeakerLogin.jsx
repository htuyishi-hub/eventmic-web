import React, { useState } from 'react';
import { Mic, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Spinner } from '../ui/Spinner.jsx';

export function SpeakerLogin({ onLogin, initialCode = '' }) {
  const [code, setCode] = useState(initialCode);
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const cleanPin = pin.trim();
    if (cleanCode.length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }
    if (!/^\d{6}$/.test(cleanPin)) {
      setError('Speaker PIN must be exactly 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onLogin({ code: cleanCode, pin: cleanPin, name: name.trim() });
    } catch (err) {
      setError(err.message || 'Failed to authenticate speaker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-7 shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent mb-5 shadow-inner mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-black text-center text-white uppercase tracking-wider mb-1">
          Speaker Portal
        </h1>
        <p className="text-xs text-center text-muted mb-6">
          Enter session code and your 6-digit speaker PIN to take the floor.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Room Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7M4K9Q"
              maxLength={6}
              required
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-white font-mono uppercase tracking-widest text-center text-sm focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              6-Digit Speaker PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              maxLength={6}
              required
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-white font-mono tracking-widest text-center text-sm focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Your Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Jane Smith"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-white text-xs focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-live font-medium p-2 rounded bg-live/15 border border-live/30">
              {error}
            </p>
          )}

          <Button type="submit" size="huge" disabled={loading} className="w-full gap-2">
            {loading ? <Spinner size="sm" /> : <Mic size={16} />}
            <span>Join as Speaker</span>
            <ArrowRight size={16} />
          </Button>
        </form>
      </div>
    </div>
  );
}
