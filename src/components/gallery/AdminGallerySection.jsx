import React from 'react';
import { AdminPreviewCard } from './AdminPreviewCard.jsx';

export function AdminGallerySection() {
  const liveFloorAttendee = {
    id: 'att-101',
    name: 'Elena Rostova',
    role: 'attendee',
    startedAt: Date.now() - 48000,
    reason: 'question',
    mode: 'attendee'
  };

  const sampleQueue = [
    { id: 'att-102', name: 'Marcus Vance', reason: 'comment', raisedAt: Date.now() - 24000, timesSpoken: 0 },
    { id: 'att-103', name: 'Sophia Chen', reason: 'clarification', raisedAt: Date.now() - 15000, timesSpoken: 1 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Admin Dashboard States</h2>
        <p className="text-xs text-muted">
          6 key server and session states for the venue admin laptop dashboard (1366x768 responsive layout).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* State 1: Empty Session */}
        <AdminPreviewCard
          title="Empty Session"
          stateLabel="1. Idle"
          badgeColor="bg-slate-700"
          attendeeCount={0}
          floor={null}
          queue={[]}
          inputLevel={0}
          outputLevel={0}
          metrics={{ spokenCount: 0, avgSeconds: 0, fairMode: false }}
        />

        {/* State 2: Live Floor */}
        <AdminPreviewCard
          title="Live Floor"
          stateLabel="2. Live"
          badgeColor="bg-live"
          attendeeCount={38}
          floor={liveFloorAttendee}
          queue={sampleQueue}
          inputLevel={0.68}
          outputLevel={0.68}
          metrics={{ spokenCount: 5, avgSeconds: 52, fairMode: false }}
        />

        {/* State 3: Fair Mode Active */}
        <AdminPreviewCard
          title="Fair Mode Active"
          stateLabel="3. Fair Mode"
          badgeColor="bg-accent"
          attendeeCount={42}
          floor={{ ...liveFloorAttendee, name: 'Kenji Sato', reason: 'clarification' }}
          queue={sampleQueue}
          inputLevel={0.45}
          outputLevel={0.45}
          metrics={{ spokenCount: 9, avgSeconds: 40, fairMode: true }}
        />

        {/* State 4: Urgent Present */}
        <AdminPreviewCard
          title="Urgent Interruption Pending"
          stateLabel="4. Urgent Alert"
          badgeColor="bg-amber-500"
          attendeeCount={42}
          floor={liveFloorAttendee}
          queue={sampleQueue}
          warning="Urgent Interruption: Attendee reporting 'Can't hear stage' — check Urgent tab"
          inputLevel={0.3}
          outputLevel={0.3}
          metrics={{ spokenCount: 6, avgSeconds: 50, fairMode: false }}
        />

        {/* State 5: Connection Warning */}
        <AdminPreviewCard
          title="Connection Reconnecting"
          stateLabel="5. Reconnecting"
          badgeColor="bg-rose-600"
          connectionState="reconnecting"
          attendeeCount={38}
          floor={liveFloorAttendee}
          queue={sampleQueue}
          inputLevel={0}
          outputLevel={0}
          metrics={{ spokenCount: 6, avgSeconds: 50, fairMode: false }}
        />

        {/* State 6: Floor Holder Dropped */}
        <AdminPreviewCard
          title="Floor Holder Dropped"
          stateLabel="6. Disconnected"
          badgeColor="bg-rose-700"
          attendeeCount={37}
          floor={liveFloorAttendee}
          queue={sampleQueue}
          droppedNotice={true}
          inputLevel={0}
          outputLevel={0}
          metrics={{ spokenCount: 6, avgSeconds: 50, fairMode: false }}
        />
      </div>
    </div>
  );
}
