import React, { useState } from 'react';
import { Users, Mic, LogOut, AlertTriangle } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';
import { useTransport } from '../../context/TransportContext.jsx';
import { ReasonBadge } from '../admin/ReasonBadge.jsx';
import { Button } from '../ui/Button.jsx';
import { ConnectionBadge } from '../host/ConnectionBadge.jsx';
import { SpeakerFloorCard } from './SpeakerFloorCard.jsx';
import { SpeakerAudioPanel } from './SpeakerAudioPanel.jsx';

export function SpeakerDashboard({ onExit }) {
  const {
    session, floor, queue, selfState, principalQueue,
    takeFloor, requestSpeak, allowPrincipal, grant, revoke, disconnect
  } = useSession();

  const { connectionState, transport } = useTransport();
  const [laterDismissed, setLaterDismissed] = useState({});
  const [actionError, setActionError] = useState('');

  const myId = transport?.myId;
  const isOnFloor = (floor && floor.id === myId) || selfState === 'on_air';
  const anotherPrincipalOnFloor = floor && floor.role === 'principal' && floor.id !== myId;
  const isRequested = principalQueue?.some(p => p.id === myId);
  const pendingHandovers = (principalQueue || []).filter(p => p.id !== myId && !laterDismissed[p.id]);

  const handleTakeFloor = async () => {
    setActionError('');
    try { await takeFloor(); } catch (err) { setActionError(err.message || 'Failed to take floor'); }
  };

  const handleRequestSpeak = async () => {
    setActionError('');
    try { await requestSpeak(); } catch (err) { setActionError(err.message || 'Failed to request speak'); }
  };

  const handleAllow = async (targetId) => {
    try { await allowPrincipal(targetId); } catch (err) { setActionError(err.message || 'Failed to allow handover'); }
  };

  const handleGrant = async (attId) => {
    setActionError('');
    try { await grant(attId); } catch (err) { setActionError(err.message || 'Failed to grant floor'); }
  };

  const handleExit = async () => {
    await disconnect();
    onExit();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
      <header className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-border text-accent font-bold">
              {session?.code}
            </span>
            <h1 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
              {session?.name || 'Live Event'}
            </h1>
          </div>
          <p className="text-[11px] text-muted mt-0.5">Speaker Control Station</p>
        </div>

        <div className="flex items-center gap-3">
          <ConnectionBadge state={connectionState} />
          <button
            onClick={handleExit}
            title="Disconnect"
            className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-surface transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {connectionState !== 'connected' && (
        <div className="p-3 rounded-xl bg-live/15 text-live text-xs border border-live/30 flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>Connection is {connectionState}. Trying to reconnect...</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-xl bg-live/15 text-live text-xs border border-live/30 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="font-bold underline text-xs">Dismiss</button>
        </div>
      )}

      <SpeakerAudioPanel transport={transport} isOnFloor={isOnFloor} />

      <SpeakerFloorCard
        floor={floor}
        isOnFloor={isOnFloor}
        anotherPrincipalOnFloor={anotherPrincipalOnFloor}
        isRequested={isRequested}
        pendingHandovers={pendingHandovers}
        onTakeFloor={handleTakeFloor}
        onReleaseFloor={() => revoke()}
        onRequestSpeak={handleRequestSpeak}
        onAllowHandover={handleAllow}
        onDismissHandover={(id) => setLaterDismissed(prev => ({ ...prev, [id]: true }))}
      />

      {/* Attendee Queue */}
      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex-1 min-h-[300px] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-accent" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Attendee Hands Queue ({queue.length})
            </h2>
          </div>
          <span className="text-[11px] text-muted">Grant audience members speaking turns</span>
        </div>

        {queue.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted text-center p-6">
            <Users size={32} className="opacity-30 mb-2" />
            <p className="text-xs font-semibold">No attendees in queue</p>
            <p className="text-[11px] text-muted mt-0.5">When attendees raise their hands, they appear here.</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
            {queue.map((att, idx) => (
              <div key={att.id} className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-surface text-muted text-xs font-mono font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">{att.name}</span>
                      <ReasonBadge reason={att.reason || 'question'} />
                      {att.hasNotSpoken && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-live/20 text-live border border-live/30">1st</span>
                      )}
                    </div>
                    {att.speakCount !== undefined && (
                      <span className="text-[10px] text-muted font-mono">Spoke: {att.speakCount}</span>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleGrant(att.id)}
                  className="gap-1 text-xs py-1 px-3"
                  title="Grant floor to this attendee"
                >
                  <Mic size={13} />
                  <span>Grant Floor</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
