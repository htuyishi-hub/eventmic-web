import React, { useState } from 'react';
import { useSession } from '../context/SessionContext.jsx';
import { SpeakerJoinScreen } from '../components/speaker/SpeakerJoinScreen.jsx';
import { SpeakerMicCheckScreen } from '../components/speaker/SpeakerMicCheckScreen.jsx';
import { SpeakerDashboard } from '../components/speaker/SpeakerDashboard.jsx';

export function SpeakerPage() {
  const { session, connect } = useSession();
  const [isConnected, setIsConnected] = useState(Boolean(session && session.status === 'live'));
  const [isMicChecked, setIsMicChecked] = useState(false);

  const handleLogin = async ({ code, pin, name }) => {
    await connect({
      role: 'principal',
      code,
      pin,
      name
    });
    setIsConnected(true);
  };

  if (!isConnected || !session || session.status !== 'live') {
    return <SpeakerJoinScreen onLogin={handleLogin} initialCode={session?.code || ''} />;
  }

  if (!isMicChecked) {
    return <SpeakerMicCheckScreen onContinue={() => setIsMicChecked(true)} />;
  }

  return (
    <SpeakerDashboard
      onExit={() => {
        setIsConnected(false);
        setIsMicChecked(false);
      }}
    />
  );
}
