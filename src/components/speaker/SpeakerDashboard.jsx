import React, { useState } from 'react';
import { Users, Mic, LogOut, AlertTriangle, MessageSquare, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';
import { useTransport } from '../../context/TransportContext.jsx';
import { ReasonBadge } from '../common/ReasonBadge.jsx';
import { Button } from '../ui/Button.jsx';
import { ConnectionBadge } from '../host/ConnectionBadge.jsx';
import { SpeakerFloorCard } from './SpeakerFloorCard.jsx';
import { SpeakerAudioPanel } from './SpeakerAudioPanel.jsx';
import { Drawer } from '../ui/Drawer.jsx';
import { MessagesPanel } from '../admin/MessagesPanel.jsx';

const DemoControls = import.meta.env.DEV
  ? React.lazy(() => import('../demo/DemoControls.jsx').then(m => ({ default: m.DemoControls })))
  : null;

export function SpeakerDashboard({ onExit, overrideState }) {
  const sessionContext = useSession();
  const transportContext = useTransport();

  const floor = overrideState?.floor !== undefined ? overrideState.floor : sessionContext.floor;
  const queue = overrideState?.queue !== undefined ? overrideState.queue : sessionContext.queue;
  const urgent = overrideState?.urgent !== undefined ? overrideState.urgent : sessionContext.urgent;
  const messages = overrideState?.messages !== undefined ? overrideState.messages : sessionContext.messages;
  const connectionState = overrideState?.connectionState || transportContext.connectionState;

  const [laterDismissed, setLaterDismissed] = useState({});
  const [actionError, setActionError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(overrideState?.questionsOpen ?? true);

  const myId = sessionContext.transport?.myId || 'pr-1';
  const isOnFloor = overrideState?.isOnFloor ?? ((floor && floor.id === myId) || sessionContext.selfState === 'on_air');
  const isNextUp = overrideState?.isNextUp ?? (sessionContext.principalQueue?.some(p => p.id === myId && p.status === 'on_deck'));
  const anotherPrincipalOnFloor = floor && floor.role === 'principal' && floor.id !== myId;
  const isRequested = sessionContext.principalQueue?.some(p => p.id === myId);
  const pendingHandovers = overrideState?.pendingHandovers || (sessionContext.principalQueue || []).filter(p => p.id !== myId && !laterDismissed[p.id]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
      <header className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-border text-accent font-bold">
              {sessionContext.session?.code || 'DEMO01'}
            </span>
            <h1 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
              {sessionContext.session?.name || 'Speaker Stage'}
            </h1>
          </div>
          <p className="text-[11px] text-muted mt-0.5">Speaker Control Station</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="relative p-1.5 rounded-lg text-muted hover:text-white bg-surface border border-border"
            title="Chat with Admin"
          >
            <MessageSquare size={16} />
            {messages?.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent text-[9px] font-bold text-white flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>
          <ConnectionBadge state={connectionState} />
          <button
            onClick={async () => { await sessionContext.disconnect?.(); onExit?.(); }}
            title="Disconnect"
            className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-surface transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {connectionState !== 'connected' && (
        <div className="p-3 rounded-xl bg-live/15 text-live text-xs border border-live/30 flex items-center gap-2 font-bold">
          <AlertTriangle size={16} />
          <span>Stage audio offline. Connection is {connectionState}...</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-xl bg-live/15 text-live text-xs border border-live/30 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="font-bold underline text-xs">Dismiss</button>
        </div>
      )}

      <SpeakerAudioPanel transport={sessionContext.transport} isOnFloor={isOnFloor} />

      <SpeakerFloorCard
        floor={floor} isOnFloor={isOnFloor} isNextUp={isNextUp}
        anotherPrincipalOnFloor={anotherPrincipalOnFloor} isRequested={isRequested}
        pendingHandovers={pendingHandovers}
        onTakeFloor={async () => { try { await sessionContext.takeFloor?.(); } catch (e) { setActionError(e.message); } }}
        onReleaseFloor={() => sessionContext.revoke?.()}
        onRequestSpeak={async () => { try { await sessionContext.requestSpeak?.(); } catch (e) { setActionError(e.message); } }}
        onAllowHandover={(id) => sessionContext.allowPrincipal?.(id)}
        onDismissHandover={(id) => setLaterDismissed(prev => ({ ...prev, [id]: true }))}
      />

      {/* Urgent Interruptions on Stage */}
      {urgent?.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
            <Zap size={14} className="animate-pulse" />
            <span>Audience Urgent Interruption Pending</span>
          </div>
          {urgent.map(u => (
            <div key={u.id} className="p-2.5 rounded-xl bg-background border border-rose-500/20 flex items-center justify-between text-xs">
              <span className="text-white"><strong>{u.name}</strong>: {u.reason}</span>
              <ReasonBadge reason={u.reason || 'urgent'} size="xs" />
            </div>
          ))}
        </div>
      )}

      {/* Attendee Queue */}
      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex-1 min-h-[260px] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-accent" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Attendee Queue ({queue?.length || 0})</h2>
          </div>
          <button
            type="button"
            onClick={() => setQuestionsOpen(v => !v)}
            className="flex items-center gap-1 text-[11px] font-bold text-muted hover:text-white"
          >
            {questionsOpen ? <CheckCircle2 size={13} className="text-emerald-400" /> : <XCircle size={13} className="text-muted" />}
            <span>{questionsOpen ? 'Q&A Active' : 'Q&A Closed'}</span>
          </button>
        </div>

        {queue?.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted text-center p-6">
            <Users size={32} className="opacity-30 mb-2" />
            <p className="text-xs font-semibold">No attendees in queue</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
            {queue?.map((att, idx) => (
              <div key={att.id} className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-surface text-muted text-xs font-mono font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">{att.name}</span>
                      <ReasonBadge reason={att.reason || 'question'} size="xs" />
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => sessionContext.grant?.(att.id)} className="gap-1 text-xs py-1 px-3">
                  <Mic size={13} />
                  <span>Grant Floor</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Drawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} title="Backstage Messages">
        <MessagesPanel onClose={() => setIsChatOpen(false)} />
      </Drawer>
      {import.meta.env.DEV && DemoControls && (
        <React.Suspense fallback={null}>
          <DemoControls />
        </React.Suspense>
      )}
    </div>
  );
}
