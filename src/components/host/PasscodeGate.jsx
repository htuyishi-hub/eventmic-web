import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

const PASSCODE_STORAGE_KEY = 'eventmic_host_unlocked';

export function PasscodeGate({ onUnlocked }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = passcode.trim();
    if (!clean) {
      setError('Please enter the admin passcode.');
      return;
    }
    try {
      sessionStorage.setItem(PASSCODE_STORAGE_KEY, 'true');
      sessionStorage.setItem('eventmic_host_passcode', clean);
    } catch {}
    onUnlocked();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mb-6 shadow-inner mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-black text-center text-white uppercase tracking-wider mb-2">
          Admin Authentication
        </h1>
        <p className="text-xs text-center text-muted mb-6">
          Enter the admin security passcode to manage live stage audio and Floor queue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="passcode-input" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Passcode
            </label>
            <input
              id="passcode-input"
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter admin passcode"
              autoFocus
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-muted/60 text-sm focus:border-accent focus:outline-none transition-colors"
            />
            {error && (
              <p role="alert" className="mt-2 text-xs text-live font-medium">
                {error}
              </p>
            )}
          </div>

          <Button type="submit" size="huge" className="w-full gap-2">
            <span>Unlock Console</span>
            <ArrowRight size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
