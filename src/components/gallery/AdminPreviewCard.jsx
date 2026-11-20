import React from 'react';
import { LaptopFrame } from './LaptopFrame.jsx';
import { SessionBar } from '../host/SessionBar.jsx';
import { SessionMetricsBar } from '../admin/SessionMetricsBar.jsx';
import { SourceMetersCard } from '../admin/SourceMetersCard.jsx';
import { StageView } from '../host/StageView.jsx';
import { AdminTabs } from '../admin/AdminTabs.jsx';
import { AlertTriangle, WifiOff } from 'lucide-react';

export function AdminPreviewCard({
  title,
  stateLabel,
  badgeColor,
  session = { code: 'DEMO42', name: 'Town Hall 2026' },
  attendeeCount = 24,
  connectionState = 'connected',
  floor = null,
  queue = [],
  warning = null,
  droppedNotice = null,
  inputLevel = 0.5,
  outputLevel = 0.5,
  isMuted = false,
  metrics = { spokenCount: 4, avgSeconds: 48, fairMode: false }
}) {
  return (
    <LaptopFrame title={title} stateLabel={stateLabel} badgeColor={badgeColor}>
      <div className="flex flex-col h-full min-h-[520px]">
        {/* Session Top Bar */}
        <SessionBar
          session={session}
          attendeeCount={attendeeCount}
          connectionState={connectionState}
          unreadMessages={1}
          onOpenMessages={() => {}}
          onOpenQr={() => {}}
          onOpenSettings={() => {}}
          onEndSessionClick={() => {}}
        />

        {/* Warning notification bar if any */}
        {warning && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 px-4 py-2 flex items-center gap-2 text-xs font-bold">
            <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        {connectionState === 'reconnecting' && (
          <div className="bg-rose-500/20 border-b border-rose-500/40 text-rose-200 px-4 py-2 flex items-center gap-2 text-xs font-bold animate-pulse">
            <WifiOff size={15} className="text-rose-400 flex-shrink-0" />
            <span>Connection Warning: Reconnecting to LiveKit cloud router (attempt 2 of 5)...</span>
          </div>
        )}

        {/* Dropped Holder Banner */}
        {droppedNotice && (
          <div className="bg-rose-950/80 border-b border-rose-500/50 text-rose-300 px-4 py-2 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-rose-400 flex-shrink-0" />
              <span>Floor holder dropped! Remote attendee audio stream lost.</span>
            </div>
            <button className="px-2 py-0.5 rounded bg-rose-500 text-white text-xs font-bold uppercase">
              Revoke Floor
            </button>
          </div>
        )}

        {/* Main Grid */}
        <div className="flex-1 p-3 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
          <div className="col-span-5 flex flex-col gap-2 min-h-0 overflow-y-auto">
            <SessionMetricsBar
              cards={false}
              metrics={metrics}
              floor={floor}
              principalQueue={[]}
              onHandoverNext={() => {}}
            />
            <SourceMetersCard
              liveLevels={{ principal: 0, attendee: inputLevel, urgent: 0, limiterActive: false }}
              onMuteSource={() => {}}
            />
            <div className="flex-1 min-h-[220px]">
              <AdminTabs
                queue={queue}
                onGrant={() => {}}
                onDrop={() => {}}
                onOpenQr={() => {}}
              />
            </div>
          </div>

          <div className="col-span-7 h-full min-h-0">
            <StageView
              floor={floor}
              inputLevel={inputLevel}
              outputLevel={outputLevel}
              isMuted={isMuted}
              volume={1.0}
              onVolumeChange={() => {}}
              onEndSpeaker={() => {}}
              onToggleMute={() => {}}
              queueLength={queue.length}
              nextAttendeeName={queue[0]?.name}
              nextRaisedAt={queue[0]?.raisedAt}
            />
          </div>
        </div>
      </div>
    </LaptopFrame>
  );
}
