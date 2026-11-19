import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext.jsx';
import { useTransport } from '../context/TransportContext.jsx';
import { isValidSessionCode, getOrCreateAttendeeId } from '../lib/ids.js';
import { JoinScreen } from '../components/attendee/JoinScreen.jsx';
import { ListeningScreen } from '../components/attendee/ListeningScreen.jsx';
import { HandRaisedScreen } from '../components/attendee/HandRaisedScreen.jsx';
import { OnAirScreen } from '../components/attendee/OnAirScreen.jsx';
import { EndedScreen } from '../components/attendee/EndedScreen.jsx';
import { ErrorScreen } from '../components/attendee/ErrorScreen.jsx';
import { Toast } from '../components/ui/Toast.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';

const NAME_STORAGE_KEY = 'eventmic_attendee_name';

export function JoinPage() {
  const { code: rawCode } = useParams();
  const navigate = useNavigate();
  const code = (rawCode || '').trim().toUpperCase();

  const {
    session, queue, floor, selfState, error, preemptedMessage,
    clearPreempted, connect, raiseHand, lowerHand, urgentRequest,
    sendLevel, clearError
  } = useSession();

  const { connectionState } = useTransport();
  const [hasJoined, setHasJoined] = useState(false);
  const [attendeeName, setAttendeeName] = useState(() => {
    try { return localStorage.getItem(NAME_STORAGE_KEY) || ''; } catch { return ''; }
  });

  const [toastMessage, setToastMessage] = useState('');
  const [micDeniedError, setMicDeniedError] = useState(false);
  const prevSelfStateRef = useRef(selfState);
  const myId = getOrCreateAttendeeId();

  const isCodeFormatValid = isValidSessionCode(code);

  useEffect(() => {
    if (!isCodeFormatValid) return;
    connect({ role: 'attendee', code, name: attendeeName || 'Attendee' });
  }, [code, isCodeFormatValid, connect]);

  useEffect(() => {
    if (preemptedMessage) {
      setToastMessage(preemptedMessage);
      clearPreempted();
    } else if (prevSelfStateRef.current === 'on_air' && selfState !== 'on_air') {
      setToastMessage('Your turn ended.');
    }
    prevSelfStateRef.current = selfState;
  }, [selfState, preemptedMessage, clearPreempted]);

  const handleJoinSubmit = async (enteredName) => {
    setAttendeeName(enteredName);
    setHasJoined(true);
    await connect({ role: 'attendee', code, name: enteredName });
  };

  const handleRetry = () => {
    clearError();
    setMicDeniedError(false);
    connect({ role: 'attendee', code, name: attendeeName || 'Attendee' });
  };

  if (!isCodeFormatValid) return <ErrorScreen variant="INVALID_CODE" onBack={() => navigate('/')} />;

  if (micDeniedError) {
    return (
      <ErrorScreen
        variant="MIC_DENIED"
        onRetry={() => { setMicDeniedError(false); lowerHand(); }}
        onBack={() => navigate('/')}
      />
    );
  }

  if (error) {
    return (
      <ErrorScreen
        variant={error.code || 'UNKNOWN'}
        message={error.message}
        onRetry={handleRetry}
        onBack={() => navigate('/')}
      />
    );
  }

  if (session?.status === 'ended') return <EndedScreen session={session} />;
  if (!hasJoined) return <JoinScreen session={session} initialCode={code} onJoin={handleJoinSubmit} />;

  const queuedItem = queue.find(item => item.id === myId);
  const queueIndex = queue.findIndex(item => item.id === myId);
  const queuePosition = queueIndex !== -1 ? queueIndex + 1 : 1;
  const myReason = queuedItem?.reason || 'question';

  return (
    <div className="relative min-h-screen bg-background">
      {connectionState === 'reconnecting' && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 px-4 py-2 bg-warning text-black text-xs font-bold shadow-md">
          <Spinner size="sm" className="border-t-black border-r-black/20" />
          <span>Reconnecting to host...</span>
        </div>
      )}

      {selfState === 'preparing' ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Spinner size="lg" className="border-t-accent" />
          <h2 className="text-xl font-bold text-white">Preparing your microphone...</h2>
          <p className="text-xs text-muted max-w-xs">Connecting to venue audio. You will be live in a moment.</p>
        </div>
      ) : selfState === 'on_air' ? (
        <OnAirScreen
          session={session}
          onStopSpeaking={() => lowerHand()}
          onMicError={() => setMicDeniedError(true)}
          sendLevel={sendLevel}
        />
      ) : selfState === 'hand_raised' ? (
        <HandRaisedScreen
          session={session}
          queuePosition={queuePosition}
          reason={myReason}
          onLowerHand={() => lowerHand()}
        />
      ) : (
        <ListeningScreen
          session={session}
          attendeeName={attendeeName}
          onRaiseHand={raiseHand}
          onUrgent={urgentRequest}
        />
      )}

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="info"
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
}
