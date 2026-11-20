import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SpeakersPage } from '../components/admin/SpeakersPage.jsx';
import { useSession } from '../context/SessionContext.jsx';
import { PasscodeGate } from '../components/host/PasscodeGate.jsx';
import { CreateSession } from '../components/host/CreateSession.jsx';
import { Dashboard } from '../components/host/Dashboard.jsx';
import { SessionSummary } from '../components/host/SessionSummary.jsx';

const PASSCODE_STORAGE_KEY = 'eventmic_host_unlocked';

export function AdminPage() {
  const location = useLocation();
  const { session, createSession, connect } = useSession();

  const [isUnlocked, setIsUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(PASSCODE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [endedStats, setEndedStats] = useState(null);

  const handleStartSession = async ({ name, settings }) => {
    setEndedStats(null);
    const info = await createSession({ name, settings });
    if (info?.code) {
      await connect({
        role: 'admin',
        code: info.code,
        name: info.name || name
      });
    }
  };

  const handleResumeSession = async (savedSession) => {
    setEndedStats(null);
    await connect({
      role: 'admin',
      code: savedSession.code,
      name: savedSession.name
    });
  };

  const handleStartNewAfterSummary = () => {
    setEndedStats(null);
    window.location.reload();
  };

  if (!isUnlocked) {
    return <PasscodeGate onUnlocked={() => setIsUnlocked(true)} />;
  }

  if (endedStats) {
    return (
      <SessionSummary
        session={session}
        stats={endedStats}
        onStartNewSession={handleStartNewAfterSummary}
      />
    );
  }

  if (!session || session.status !== 'live') {
    return (
      <CreateSession
        onStartSession={handleStartSession}
        onResumeSession={handleResumeSession}
      />
    );
  }

  if (location.pathname === '/admin/speakers') {
    return <SpeakersPage />;
  }

  return (
    <Dashboard
      onSessionEndedWithStats={(stats) => {
        setEndedStats(stats);
      }}
    />
  );
}
