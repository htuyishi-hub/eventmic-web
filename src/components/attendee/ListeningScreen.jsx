import React, { useState } from 'react';
import { Hand, Radio, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

const REASONS = [
  { id: 'question', label: 'Question' },
  { id: 'comment', label: 'Comment' },
  { id: 'compliment', label: 'Compliment' },
  { id: 'clarification', label: 'Clarification' }
];

export function ListeningScreen({ session, attendeeName, onRaiseHand, onUrgent }) {
  const [selectedReason, setSelectedReason] = useState('question');

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 max-w-md mx-auto bg-background text-foreground">
      {/* Top Status */}
      <div className="pt-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/15 border border-success/30 text-success text-xs font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>You're Connected</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tight">
            {session?.name || 'Live Q&A'}
          </h1>
          <p className="text-xs text-muted font-mono">
            Attendee: <strong className="text-white">{attendeeName}</strong>
          </p>
        </div>

        {/* Listening Card */}
        <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl flex flex-col items-center space-y-4 my-6">
          <div className="w-20 h-20 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <Radio size={36} className="animate-pulse" />
          </div>

          <div className="space-y-1 text-center">
            <h3 className="text-base font-bold text-white">Stage Audio Reinforced</h3>
            <p className="text-xs text-muted leading-relaxed">
              Listen to the live presentation. Choose your reason and tap Raise Hand below to join the queue.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="space-y-3 pb-safe">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-muted text-center mb-2">
            Reason for Speaking
          </label>
          <div className="grid grid-cols-2 gap-2">
            {REASONS.map((r) => {
              const isSelected = selectedReason === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReason(r.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-accent border-accent text-white shadow-md shadow-accent/20'
                      : 'bg-surface border-border text-muted hover:text-white hover:bg-surface/80'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          size="huge"
          variant="primary"
          onClick={() => onRaiseHand({ reason: selectedReason })}
          className="w-full gap-3 text-lg font-black uppercase tracking-wider"
        >
          <Hand size={24} />
          <span>Raise Hand</span>
        </Button>

        {onUrgent && (
          <Button
            size="md"
            variant="secondary"
            onClick={onUrgent}
            className="w-full gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
          >
            <Zap size={14} className="text-amber-400" />
            <span>Urgent (5s Blip)</span>
          </Button>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted text-center">
          <ShieldCheck size={14} className="text-accent flex-shrink-0" />
          <span>Your microphone stays off until granted the floor.</span>
        </div>
      </div>
    </div>
  );
}
