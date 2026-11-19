import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, UserPlus, Hand, Zap, Mic, MessageSquare, Scale, FastForward, AlertTriangle } from 'lucide-react';
import { useTransport } from '../../context/TransportContext.jsx';

export function DemoControls() {
  const { transport } = useTransport();
  const [isOpen, setIsOpen] = useState(false);
  const [handReason, setHandReason] = useState('question');
  const [speed, setSpeed] = useState(1);

  if (!transport?.isDemo) return null;

  const handleSpeed = (mult) => {
    setSpeed(mult);
    transport.speedUpClock(mult);
  };

  return (
    <aside aria-label="Demo simulation controls" className="fixed bottom-3 right-3 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-2 w-72 bg-surface border-2 border-accent/40 rounded-2xl shadow-2xl p-3.5 space-y-3 backdrop-blur-md animate-in slide-in-from-bottom-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-1.5 font-bold text-accent">
              <Sparkles size={14} />
              <span>Demo Scenario Simulator</span>
            </div>
            <span className="text-[10px] font-mono bg-accent/20 text-accent px-1.5 py-0.5 rounded">DEMO MODE</span>
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => transport.addFakeAttendee('Guest ' + (Math.floor(Math.random() * 899) + 100))}
              className="w-full flex items-center gap-2 p-1.5 rounded-lg bg-background hover:bg-surface/80 border border-border text-white text-left font-medium transition-colors"
            >
              <UserPlus size={14} className="text-emerald-400" />
              <span>Add Fake Attendee</span>
            </button>

            <div className="flex items-center gap-1.5">
              <select
                value={handReason}
                onChange={(e) => setHandReason(e.target.value)}
                className="bg-background border border-border text-white text-[11px] rounded-lg px-2 py-1.5 flex-1"
              >
                <option value="question">Question</option>
                <option value="comment">Comment</option>
                <option value="compliment">Compliment</option>
                <option value="clarification">Clarification</option>
              </select>
              <button
                type="button"
                onClick={() => transport.raiseFakeHand(handReason)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-white font-bold hover:bg-accent/80 transition-colors"
                title="Raise hand with chosen reason"
              >
                <Hand size={13} />
                <span>Raise</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => transport.sendFakeUrgent("cant_hear")}
              className="w-full flex items-center gap-2 p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-left font-medium transition-colors"
            >
              <Zap size={14} className="text-rose-400" />
              <span>Send Urgent Request</span>
            </button>

            <button
              type="button"
              onClick={() => transport.makePrincipalRequest()}
              className="w-full flex items-center gap-2 p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-left font-medium transition-colors"
            >
              <Mic size={14} className="text-amber-400" />
              <span>Principal Request to Speak</span>
            </button>

            <button
              type="button"
              onClick={() => transport.sendMessage('Wrap up in 2 minutes please.', 'principal')}
              className="w-full flex items-center gap-2 p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-left font-medium transition-colors"
            >
              <MessageSquare size={14} className="text-purple-400" />
              <span>Send Admin Message</span>
            </button>

            <button
              type="button"
              onClick={() => transport.updateSettings({ fairMode: transport.seed?.settings?.fairMode === 'off' ? 'on' : 'off' })}
              className="w-full flex items-center gap-2 p-1.5 rounded-lg bg-background hover:bg-surface/80 border border-border text-white text-left font-medium transition-colors"
            >
              <Scale size={14} className="text-accent" />
              <span>Toggle Fair Mode ({transport.seed?.settings?.fairMode === 'off' ? 'Enable' : 'Disable'})</span>
            </button>

            <button
              type="button"
              onClick={() => transport.setFloorHolderDropped(!transport.seed?.floor?.disconnected)}
              className="w-full flex items-center gap-2 p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-left font-medium transition-colors"
            >
              <AlertTriangle size={14} className="text-amber-400" />
              <span>Toggle Floor Holder Drop</span>
            </button>
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center justify-between">
            <span className="text-[10px] text-muted flex items-center gap-1">
              <FastForward size={12} /> Speed
            </span>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              {[1, 2, 5, 10].map(m => (
                <button
                  key={m}
                  onClick={() => handleSpeed(m)}
                  className={`px-1.5 py-0.5 rounded border ${
                    speed === m ? 'bg-accent border-accent text-white font-bold' : 'bg-background border-border text-muted hover:text-white'
                  }`}
                >
                  {m}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-white font-bold text-xs shadow-lg shadow-accent/30 hover:bg-accent/90 transition-all border border-accent-light focus-visible:ring-2 focus-visible:ring-white"
        aria-expanded={isOpen}
      >
        <Sparkles size={14} />
        <span>Demo Controls</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
    </aside>
  );
}
