import React from 'react';
import { Mic, MicOff, Radio, Clock } from 'lucide-react';
import { ReasonBadge } from '../admin/ReasonBadge.jsx';
import { Button } from '../ui/Button.jsx';

export function SpeakerFloorCard({
  floor,
  isOnFloor,
  anotherPrincipalOnFloor,
  isRequested,
  pendingHandovers,
  onTakeFloor,
  onReleaseFloor,
  onRequestSpeak,
  onAllowHandover,
  onDismissHandover
}) {
  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isOnFloor
        ? 'bg-live/10 border-live/50 shadow-lg shadow-live/10'
        : 'bg-surface border-border'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isOnFloor ? (
              <span className="flex items-center gap-1.5 text-live text-xs font-black uppercase tracking-wider">
                <Radio size={16} className="animate-pulse" />
                You Have The Floor (On Air)
              </span>
            ) : (
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Current Speaker
              </span>
            )}
          </div>

          <div className="text-base sm:text-lg font-black text-white">
            {isOnFloor
              ? 'Your microphone is broadcast live to the venue'
              : floor
              ? `${floor.name} (${floor.role === 'principal' ? 'Speaker' : 'Attendee'})`
              : 'Floor is open'}
          </div>
          {floor?.reason && (
            <div className="mt-1">
              <ReasonBadge reason={floor.reason} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOnFloor ? (
            <Button variant="danger" size="md" onClick={onReleaseFloor} className="gap-2">
              <MicOff size={16} />
              <span>Release Floor</span>
            </Button>
          ) : anotherPrincipalOnFloor ? (
            <Button
              variant={isRequested ? 'secondary' : 'primary'}
              size="md"
              onClick={onRequestSpeak}
              disabled={isRequested}
              className="gap-2"
            >
              <Clock size={16} />
              <span>{isRequested ? 'Requested (Waiting)' : 'Request to Speak'}</span>
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={onTakeFloor} className="gap-2">
              <Mic size={16} />
              <span>Take the Floor</span>
            </Button>
          )}
        </div>
      </div>

      {isOnFloor && pendingHandovers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          {pendingHandovers.map(req => (
            <div key={req.id} className="p-3 rounded-xl bg-background/80 border border-accent/40 flex items-center justify-between">
              <span className="text-xs text-white">
                <strong>{req.name}</strong> requested to speak.
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="primary" onClick={() => onAllowHandover(req.id)} className="text-xs py-1 px-3">
                  Allow (60s)
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDismissHandover(req.id)} className="text-xs py-1 px-2">
                  Later
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
