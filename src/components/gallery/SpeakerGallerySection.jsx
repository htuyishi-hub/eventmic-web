import React from 'react';
import { PhoneFrame } from './PhoneFrame.jsx';
import { SpeakerJoinScreen } from '../speaker/SpeakerJoinScreen.jsx';
import { SpeakerMicCheckScreen } from '../speaker/SpeakerMicCheckScreen.jsx';
import { SpeakerDashboard } from '../speaker/SpeakerDashboard.jsx';

export function SpeakerGallerySection() {
  const urgentSample = [
    { id: 'u-101', name: 'Sound Desk', reason: 'cant_hear', requestedAt: Date.now() - 8000 }
  ];

  const handoverSample = [
    { id: 'pr-102', name: 'Dr. Emmett Brown', reason: 'Urgent stage handoff' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Speaker (Principal) States</h2>
        <p className="text-xs text-muted">
          9 mobile phone-width screens (375px) for stage presenters, panelists, and keynote speakers.
        </p>
      </div>

      <div className="flex flex-wrap gap-8 justify-start">
        {/* 1. Join Screen */}
        <PhoneFrame title="1. Speaker Join" description="PIN authentication and error states">
          <SpeakerJoinScreen initialCode="DEMO42" onJoin={() => {}} />
        </PhoneFrame>

        {/* 2. Mic Check */}
        <PhoneFrame title="2. Mic Check" description="Input selector & level pre-warm test">
          <SpeakerMicCheckScreen onContinue={() => {}} onBack={() => {}} />
        </PhoneFrame>

        {/* 3. Muted (Waiting off stage) */}
        <PhoneFrame title="3. Floor Muted" description="Silent mode, listener only">
          <SpeakerDashboard
            overrideState={{
              isOnFloor: false,
              isNextUp: false,
              floor: { name: 'Elena Rostova', role: 'attendee' }
            }}
          />
        </PhoneFrame>

        {/* 4. Next Up (On Deck) */}
        <PhoneFrame title="4. Next Up (On Deck)" description="Standby alert: you speak next">
          <SpeakerDashboard
            overrideState={{
              isOnFloor: false,
              isNextUp: true,
              floor: { name: 'Elena Rostova', role: 'attendee' }
            }}
          />
        </PhoneFrame>

        {/* 5. Live (On Air) */}
        <PhoneFrame title="5. Live (On Air)" description="Stage microphone hot & live meter">
          <SpeakerDashboard
            overrideState={{
              isOnFloor: true,
              isNextUp: false
            }}
          />
        </PhoneFrame>

        {/* 6. Questions Open & Closed */}
        <PhoneFrame title="6. Questions Closed" description="Audience hand raising paused">
          <SpeakerDashboard
            overrideState={{
              questionsOpen: false,
              isOnFloor: true
            }}
          />
        </PhoneFrame>

        {/* 7. Urgent List */}
        <PhoneFrame title="7. Urgent Alerts Present" description="Interruption notice badge">
          <SpeakerDashboard
            overrideState={{
              urgent: urgentSample,
              isOnFloor: true
            }}
          />
        </PhoneFrame>

        {/* 8. Principal Request Handover */}
        <PhoneFrame title="8. Principal Handover" description="Stage co-speaker requests mic">
          <SpeakerDashboard
            overrideState={{
              isOnFloor: true,
              pendingHandovers: handoverSample
            }}
          />
        </PhoneFrame>

        {/* 9. Offline / Disconnected */}
        <PhoneFrame title="9. Offline State" description="Connection dropped banner">
          <SpeakerDashboard
            overrideState={{
              connectionState: 'disconnected',
              isOnFloor: false
            }}
          />
        </PhoneFrame>
      </div>
    </div>
  );
}
