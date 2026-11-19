import React, { useState } from 'react';
import { useSession } from '../context/SessionContext.jsx';
import { SpeakerLogin } from '../components/speaker/SpeakerLogin.jsx';
import { SpeakerDashboard } from '../components/speaker/SpeakerDashboard.jsx';

export function SpeakerPage() {
  const { session, connect } = useSession();
  const [isConnected, setIsConnected] = useState(Boolean(session && session.status === 'live'));

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
    return <SpeakerLogin onLogin={handleLogin} initialCode={session?.code || ''} />;
  }

  return <SpeakerDashboard onExit={() => setIsConnected(false)} />;
}
