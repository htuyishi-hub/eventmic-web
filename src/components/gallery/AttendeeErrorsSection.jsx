import React from 'react';
import { PhoneFrame } from './PhoneFrame.jsx';
import { ErrorScreen } from '../attendee/ErrorScreen.jsx';

export function AttendeeErrorsSection() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-white tracking-tight">Attendee Error & Edge States</h3>
        <p className="text-xs text-muted">
          Standardized fallback, permission, and connection drop screens for attendees.
        </p>
      </div>

      <div className="flex flex-wrap gap-8 justify-start">
        {/* Error 1: Invalid Code */}
        <PhoneFrame title="Error: Invalid Code" description="Unknown room code scanned or entered">
          <ErrorScreen variant="INVALID_CODE" onBack={() => {}} />
        </PhoneFrame>

        {/* Error 2: Session Full */}
        <PhoneFrame title="Error: Session Full" description="Room hit 200 participant capacity limit">
          <ErrorScreen variant="FULL" onRetry={() => {}} onBack={() => {}} />
        </PhoneFrame>

        {/* Error 3: Mic Denied */}
        <PhoneFrame title="Error: Mic Denied" description="Browser microphone permission blocked">
          <ErrorScreen variant="MIC_DENIED" onRetry={() => {}} onBack={() => {}} />
        </PhoneFrame>

        {/* Error 4: Connection Lost */}
        <PhoneFrame title="Error: Connection Lost" description="WebSocket / WebRTC connection dropped">
          <ErrorScreen variant="CONNECTION_LOST" onRetry={() => {}} onBack={() => {}} />
        </PhoneFrame>
      </div>
    </div>
  );
}
