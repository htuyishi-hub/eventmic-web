import React, { useState, useEffect } from 'react';
import { DMLogo } from '../brand/DMLogo.jsx';
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
import { Avatar } from '../common/Avatar.jsx';
import { useResolvedAvatarSrc } from '../../lib/useAvatar.js';

const DemoControls = import.meta.env.DEV
  ? React.lazy(() => import('../demo/DemoControls.jsx').then(m => ({ default: m.DemoControls })))
  : null;

function SpeakerQueueRow({ att, idx, onGrant }) {
  const avatarSrc = useResolvedAvatarSrc(att);
  return (
    <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-6 h-6 rounded-md bg-surface text-muted text-xs font-mono font-bold flex items-center justify-center flex-shrink-0">
          {idx + 1}
        </span>
        <Avatar src={avatarSrc} name={att.name} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-white truncate max-w-[120px]">{att.name}</span>
            <ReasonBadge reason={att.reason || 'question'} size="xs" />
          </div>
        </div>
      </div>
      <Button size="sm" variant="secondary" onClick={() => onGrant(att.id)} className="gap-1 text-xs py-1 px-3">
        <Mic size={13} />
        <span>Grant Floor</span>
      </Button>
    </div>
  );
}

function SpeakerUrgentRow({ u }) {
  const avatarSrc = useResolvedAvatarSrc(u);
  return (
    <div className="p-2.5 rounded-xl bg-background border border-rose-500/20 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <Avatar src={avatarSrc} name={u.name} size="xs" />
        <span className="text-white truncate"><strong>{u.name}</strong>: {u.reason}</span>
      </div>
      <ReasonBadge reason={u.reason || 'urgent'} size="xs" />
    </div>
  );
}

export function SpeakerDashboard({ onExit, overrideState }) {
  const sc = useSession();
  const tc = useTransport();

  const floor = overrideState?.floor !== undefined ? overrideState.floor : sc.floor;
  const queue = overrideState?.queue !== undefined ? overrideState.queue : sc.queue;
  const urgent = overrideState?.urgent !== undefined ? overrideState.urgent : sc.urgent;
  const messages = overrideState?.messages !== undefined ? overrideState.messages : sc.messages;
  const connectionState = overrideState?.connectionState || tc.connectionState;

  const [laterDismissed, setLaterDismissed] = useState({});
  const [actionError, setActionError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(overrideState?.questionsOpen ?? true);

  const myId = sc.transport?.myId || 'pr-1';
  const floorHolderId = floor?.holderId || floor?.id;
  const floorHolderRole = floor?.holderRole || floor?.role;
  const isOnFloor = overrideState?.isOnFloor ?? ((floor && floorHolderId === myId) || sc.selfState === 'on_air');
  const isNextUp = overrideState?.isNextUp ?? (sc.principalQueue?.some(p => p.id === myId && p.status === 'on_deck'));

  useEffect(() => {
    if (isNextUp && !overrideState) {
      try { navigator.vibrate?.([100, 50, 100]); } catch {}
    }
  }, [isNextUp, overrideState]);
  const anotherPrincipalOnFloor = floor && floorHolderRole === 'principal' && floorHolderId !== myId;
  const isRequested = sc.principalQueue?.some(p => p.id === myId);
  const pendingHandovers = overrideState?.pendingHandovers || (sc.principalQueue || []).filter(p => p.id !== myId && !laterDismissed[p.id]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
      <header className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <DMLogo size={24} loop={isOnFloor} />
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-border text-accent font-bold">
              {sc.session?.code || 'DEMO01'}
            </span>
            <h1 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
              {sc.session?.name || 'Speaker Stage'}
            </h1>
          </div>
          <p className="text-xs text-muted mt-0.5">Speaker Control Station</p>
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
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent text-xs font-bold text-white flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>
          <ConnectionBadge state={connectionState} />
          <button
            onClick={async () => { await sc.disconnect?.(); onExit?.(); }}
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

      <SpeakerAudioPanel transport={sc.transport} isOnFloor={isOnFloor} />

      <SpeakerFloorCard
        floor={floor} isOnFloor={isOnFloor} isNextUp={isNextUp}
        anotherPrincipalOnFloor={anotherPrincipalOnFloor} isRequested={isRequested}
        pendingHandovers={pendingHandovers}
        onTakeFloor={async () => { try { await sc.takeFloor?.(); } catch (e) { setActionError(e.message); } }}
        onReleaseFloor={() => sc.revoke?.(myId)}
        onRequestSpeak={async () => { try { await sc.requestSpeak?.(); } catch (e) { setActionError(e.message); } }}
        onAllowHandover={(id) => sc.allowPrincipal?.(id)}
        onDismissHandover={(id) => setLaterDismissed(prev => ({ ...prev, [id]: true }))}
      />

      {urgent?.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
            <Zap size={14} className="animate-pulse" />
            <span>Audience Urgent Interruption Pending</span>
          </div>
          {urgent.map(u => <SpeakerUrgentRow key={u.id} u={u} />)}
        </div>
      )}

      <section className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex-1 min-h-[260px] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-accent" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Attendee Queue ({queue?.length || 0})</h2>
          </div>
          <button
            type="button"
            onClick={() => setQuestionsOpen(v => !v)}
            className="flex items-center gap-1 text-xs font-bold text-muted hover:text-white"
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
              <SpeakerQueueRow key={att.id} att={att} idx={idx} onGrant={(id) => sc.grant?.(id)} />
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

      <footer className="pt-2 text-center text-xs text-muted/60 font-mono">
        DM Speaker v{__APP_VERSION__}
      </footer>
    </div>
  );
}
