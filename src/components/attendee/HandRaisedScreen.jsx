import React from 'react';
import { Hand } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { ReasonBadge } from '../admin/ReasonBadge.jsx';
import { DMLogo } from '../brand/DMLogo.jsx';

export function HandRaisedScreen({
  session,
  queuePosition = 1,
  reason = 'question',
  onLowerHand
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between p-6 max-w-md mx-auto bg-background text-foreground">
      {/* Top Status */}
      <div className="pt-4 text-center space-y-4">
        <div className="flex items-center justify-between">
          <DMLogo size={24} />
          <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold tabular-nums">
            #{queuePosition} in queue
          </span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/40 text-accent text-xs font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span>Hand Raised</span>
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight">
          {session?.name || 'Live Q&A'}
        </h1>

        {/* Central Queue Card with Position Number */}
        <div className="p-8 bg-surface border border-border rounded-3xl flex flex-col items-center space-y-4 my-6">
          <div className="w-24 h-24 rounded-full bg-background border-2 border-amber-500 flex items-center justify-center text-amber-400">
            <Hand size={44} />
          </div>

          <div className="space-y-2 text-center">
            <span className="text-xs uppercase tracking-widest text-muted font-bold">
              Queue Position
            </span>
            <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
              #{queuePosition}
            </div>
            <p className="text-sm font-semibold text-accent">
              You are #{queuePosition} in line
            </p>
            <div className="pt-1">
              <ReasonBadge reason={reason} />
            </div>
          </div>

          <p className="text-xs text-muted text-center max-w-xs pt-2">
            The speaker or admin will grant your floor when it is your turn. Please keep your device unlocked.
          </p>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="space-y-3 pb-safe">
        <Button
          size="huge"
          variant="secondary"
          onClick={onLowerHand}
          className="w-full gap-2 text-base font-bold uppercase tracking-wider text-muted hover:text-white"
        >
          <span>Lower Hand</span>
        </Button>
      </div>
    </div>
  );
}
