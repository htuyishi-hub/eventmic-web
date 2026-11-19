import React from 'react';
import { PhoneFrame } from './PhoneFrame.jsx';
import { JoinScreen } from '../attendee/JoinScreen.jsx';
import { ListeningScreen } from '../attendee/ListeningScreen.jsx';
import { HandRaisedScreen } from '../attendee/HandRaisedScreen.jsx';
import { OnAirScreen } from '../attendee/OnAirScreen.jsx';
import { EndedScreen } from '../attendee/EndedScreen.jsx';
import { UrgentConfirmSheet } from '../attendee/UrgentConfirmSheet.jsx';
import { Banner } from '../common/Banner.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { Toast } from '../ui/Toast.jsx';

export function AttendeeGallerySection() {
  const sampleSession = { code: 'DEMO42', name: 'Annual Keynote Q&A' };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Attendee Lifecycle States</h2>
        <p className="text-xs text-muted">
          10 participant mobile screens (375px) from initial entry through speaking and session conclusion.
        </p>
      </div>

      <div className="flex flex-wrap gap-8 justify-start">
        {/* 1. Join Screen */}
        <PhoneFrame title="1. Join Screen" description="Name entry and room code confirmation">
          <JoinScreen session={sampleSession} initialCode="DEMO42" onJoin={() => {}} />
        </PhoneFrame>

        {/* 2. Listening Screen */}
        <PhoneFrame title="2. Listening" description="4 reason chips, 56px touch target">
          <ListeningScreen session={sampleSession} attendeeName="Alex Morgan" onRaiseHand={() => {}} onUrgent={() => {}} />
        </PhoneFrame>

        {/* 3. Hand Raised */}
        <PhoneFrame title="3. Hand Raised" description="Queue position #3 with reason badge">
          <HandRaisedScreen session={sampleSession} queuePosition={3} reason="question" onLowerHand={() => {}} />
        </PhoneFrame>

        {/* 4. Urgent Confirm Sheet */}
        <PhoneFrame title="4. Urgent Confirm Sheet" description="2-step confirmation with ducking notice">
          <div className="relative min-h-screen bg-background">
            <ListeningScreen session={sampleSession} attendeeName="Alex Morgan" onRaiseHand={() => {}} />
            <UrgentConfirmSheet isOpen={true} onClose={() => {}} onConfirm={() => {}} />
          </div>
        </PhoneFrame>

        {/* 5. Preparing Mic */}
        <PhoneFrame title="5. Preparing Mic" description="Turn transition & audio route lock">
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-background">
            <Spinner size="lg" className="border-t-accent" />
            <h2 className="text-xl font-bold text-white">Preparing your microphone...</h2>
            <p className="text-xs text-muted max-w-xs">Connecting to venue audio. You will be live in a moment.</p>
          </div>
        </PhoneFrame>

        {/* 6. On Air (Countdown) */}
        <PhoneFrame title="6. On Air" description="Active speaking timer & live VU meter">
          <OnAirScreen
            session={sampleSession}
            previewMode={true}
            overrideSpeakingSeconds={24}
            overrideLevel={0.65}
            capSeconds={120}
            onStopSpeaking={() => {}}
          />
        </PhoneFrame>

        {/* 7. On Air (15s Warning) */}
        <PhoneFrame title="7. On Air (15s Warning)" description="Bouncing alert & wrap-up cue">
          <OnAirScreen
            session={sampleSession}
            previewMode={true}
            overrideSpeakingSeconds={108}
            overrideLevel={0.78}
            capSeconds={120}
            onStopSpeaking={() => {}}
          />
        </PhoneFrame>

        {/* 8. Turn Ended */}
        <PhoneFrame title="8. Turn Ended" description="Toast feedback after mic revoke">
          <div className="relative min-h-screen bg-background">
            <ListeningScreen session={sampleSession} attendeeName="Alex Morgan" onRaiseHand={() => {}} />
            <Toast message="Your turn ended." type="info" onClose={() => {}} />
          </div>
        </PhoneFrame>

        {/* 9. Session Ended */}
        <PhoneFrame title="9. Session Ended" description="Concluded room confirmation">
          <EndedScreen session={sampleSession} />
        </PhoneFrame>

        {/* 10. Announcement Banner */}
        <PhoneFrame title="10. Announcement" description="Host broadcast banner banner visible">
          <div className="relative min-h-screen bg-background">
            <div className="p-3 bg-background/80 backdrop-blur">
              <Banner type="warning" message="Session ends in 5 minutes. Wrap up final questions." />
            </div>
            <ListeningScreen session={sampleSession} attendeeName="Alex Morgan" onRaiseHand={() => {}} />
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}
