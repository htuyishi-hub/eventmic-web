import React, { useState, useEffect } from 'react';
import { Volume2, AlertTriangle, X } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';
import { useTransport } from '../../context/TransportContext.jsx';
import { useHostAudio } from '../../lib/useHostAudio.js';
import { useHostShortcuts } from './useHostShortcuts.js';
import { useSessionStats } from './useSessionStats.js';
import { SessionBar } from './SessionBar.jsx';
import { AdminTabs } from '../admin/AdminTabs.jsx';
import { StageView } from './StageView.jsx';
import { RoomQrModal } from './RoomQrModal.jsx';
import { EndSessionConfirm } from './EndSessionConfirm.jsx';
import { SettingsDrawer } from './SettingsDrawer.jsx';
import { SessionMetricsBar } from '../admin/SessionMetricsBar.jsx';
import { SourceMetersCard } from '../admin/SourceMetersCard.jsx';
import { AnnouncementBox } from '../admin/AnnouncementBox.jsx';
import { UrgentBanner } from '../admin/UrgentBanner.jsx';
import { MessagesPanel } from '../admin/MessagesPanel.jsx';
import { Drawer } from '../ui/Drawer.jsx';
import { Toast } from '../ui/Toast.jsx';
import { Button } from '../ui/Button.jsx';

const DemoControls = import.meta.env.DEV
  ? React.lazy(() => import('../demo/DemoControls.jsx').then(m => ({ default: m.DemoControls })))
  : null;

export function Dashboard({ onSessionEndedWithStats }) {
  const {
    session, queue, floor, level, attendeeCount, isMuted,
    grant, revoke, muteSpeaker, endSession, principalQueue,
    allowPrincipal, metrics, messages = []
  } = useSession();

  const { connectionState, transport } = useTransport();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isDiagOpen, setIsDiagOpen] = useState(false);
  const [isAnnounceOpen, setIsAnnounceOpen] = useState(false);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const {
    audioEngine, audioDevices, activeDeviceId, activeDeviceLabel,
    unpluggedWarning, dismissUnpluggedWarning, selectOutputDevice,
    refreshDevices, attachMicStream, muteSource, volume, setVolume,
    liveLevels, isClipping, isContextSuspended, resumeAudio
  } = useHostAudio(transport, floor, isMuted, setToastMessage);

  const { getFinalStats } = useSessionStats(session, floor, queue);

  useHostShortcuts({
    queue, floor, isMuted, isQrOpen, setIsQrOpen, isSettingsOpen,
    setIsSettingsOpen, isEndConfirmOpen, setIsEndConfirmOpen,
    grant, revoke, muteSpeaker,
    anyDrawerOpen: isDiagOpen || isMessagesOpen || isAnnounceOpen,
    onToggleDiagnostics: () => setIsDiagOpen((v) => !v),
    onToggleMessages: () => setIsMessagesOpen((v) => !v),
    onToggleSettings: () => setIsSettingsOpen((v) => !v),
    onToggleAnnounce: () => setIsAnnounceOpen((v) => !v)
  });

  const handleEndSessionConfirmed = async () => {
    setIsEndConfirmOpen(false);
    const stats = getFinalStats();
    await endSession();
    onSessionEndedWithStats(stats);
  };

  const inputMeterLevel = liveLevels.in > 0 ? liveLevels.in : level;
  const outputMeterLevel = liveLevels.out > 0 ? liveLevels.out : (isMuted ? 0 : inputMeterLevel * volume);

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      <SessionBar
        session={session} attendeeCount={attendeeCount} connectionState={connectionState}
        unreadMessages={messages.length} onOpenMessages={() => setIsMessagesOpen(true)}
        onOpenQr={() => setIsQrOpen(true)} onOpenSettings={() => setIsSettingsOpen(true)}
        onEndSessionClick={() => setIsEndConfirmOpen(true)}
        onOpenDiagnostics={() => setIsDiagOpen(true)}
        onOpenAnnounce={() => setIsAnnounceOpen(true)}
        onAir={!!floor && !isMuted}
      />

      <UrgentBanner />

      {unpluggedWarning && (
        <div className="bg-amber-500 text-black px-4 py-2 flex items-center justify-between text-xs font-bold shadow-md flex-shrink-0 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-black flex-shrink-0" />
            <span>{unpluggedWarning}</span>
          </div>
          <button type="button" onClick={dismissUnpluggedWarning} className="p-1 hover:bg-black/10 rounded-md">
            <X size={14} />
          </button>
        </div>
      )}

      {isContextSuspended && (
        <div className="bg-warning text-black px-4 py-2 flex items-center justify-between text-xs font-bold shadow-md flex-shrink-0">
          <span>Audio output requires a user gesture in this browser.</span>
          <Button variant="primary" size="sm" onClick={resumeAudio} className="bg-black text-white hover:bg-neutral-800 text-xs py-1 px-3">
            Start Audio
          </Button>
        </div>
      )}

      <main className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4 p-4 sm:p-5 overflow-hidden">
        <section className="md:col-span-5 lg:col-span-4 h-full min-h-0 flex flex-col gap-3 overflow-y-auto pr-1">
          <SessionMetricsBar
            cards={false}
            metrics={metrics || session?.metrics} floor={floor}
            principalQueue={principalQueue} onHandoverNext={(id) => allowPrincipal(id)}
          />
          <SourceMetersCard liveLevels={liveLevels} onMuteSource={muteSource} />
          <div className="flex-1 min-h-[300px]">
            <AdminTabs queue={queue} onGrant={grant} onDrop={revoke} onOpenQr={() => setIsQrOpen(true)} />
          </div>
        </section>

        <section className="md:col-span-7 lg:col-span-8 h-full min-h-0">
          <StageView
            floor={floor} inputLevel={inputMeterLevel} outputLevel={outputMeterLevel}
            isMuted={isMuted} volume={volume} onVolumeChange={setVolume}
            isClipping={isClipping} isLimiterActive={liveLevels.limiterActive}
            onEndSpeaker={() => revoke(floor?.id)} onToggleMute={() => muteSpeaker(!isMuted)}
            queueLength={queue.length} onGrantNext={() => queue[0] && grant(queue[0].id)}
            nextAttendeeName={queue[0]?.name} nextRaisedAt={queue[0]?.raisedAt}
          />
        </section>
      </main>

      <footer className="h-8 px-6 bg-surface/80 border-t border-border flex items-center justify-between text-xs text-muted flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-bold uppercase tracking-wider text-xs">Keys:</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-xs text-white">1-5</kbd> Tabs</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-xs text-white">G</kbd> Grant</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-xs text-white">M</kbd> Mute</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-xs text-white">D</kbd> Diagnostics</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-xs text-white">C</kbd> Messages</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-xs text-white">A</kbd> Announce</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-xs text-white">S</kbd> Settings</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-xs text-white">Q</kbd> QR</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted/70">v{__APP_VERSION__}</span>
          <div onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-1.5 font-mono text-xs cursor-pointer hover:text-white transition-colors">
            <Volume2 size={12} className="text-accent" />
            <span className="truncate max-w-[220px]">Output: {activeDeviceLabel}</span>
          </div>
        </div>
      </footer>

      <RoomQrModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} code={session?.code} sessionName={session?.name} />
      <SettingsDrawer
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
        audioEngine={audioEngine} liveLevels={liveLevels} audioDevices={audioDevices}
        activeDeviceId={activeDeviceId} onSelectDevice={selectOutputDevice}
        onRefreshDevices={refreshDevices} onAttachMicStream={attachMicStream}
      />
      <Drawer isOpen={isAnnounceOpen} onClose={() => setIsAnnounceOpen(false)} title="Venue Announcement">
        <div className="p-6">
          <AnnouncementBox />
        </div>
      </Drawer>

      <Drawer isOpen={isDiagOpen} onClose={() => setIsDiagOpen(false)} title="Diagnostics">
        <div className="p-6">
          <SessionMetricsBar cards alerts={false} metrics={metrics || session?.metrics} floor={floor} principalQueue={principalQueue} />
        </div>
      </Drawer>

      <Drawer isOpen={isMessagesOpen} onClose={() => setIsMessagesOpen(false)} title="Backstage Messages">
        <MessagesPanel onClose={() => setIsMessagesOpen(false)} />
      </Drawer>
      <EndSessionConfirm isOpen={isEndConfirmOpen} onClose={() => setIsEndConfirmOpen(false)} onConfirm={handleEndSessionConfirmed} sessionName={session?.name} />
      {toastMessage && <Toast message={toastMessage} type="warning" onClose={() => setToastMessage('')} />}
      {import.meta.env.DEV && DemoControls && (
        <React.Suspense fallback={null}>
          <DemoControls />
        </React.Suspense>
      )}
    </div>
  );
}
