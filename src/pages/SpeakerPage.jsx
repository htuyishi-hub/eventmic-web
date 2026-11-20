import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext.jsx';
import { SpeakerJoinScreen } from '../components/speaker/SpeakerJoinScreen.jsx';
import { SpeakerPhotoStep } from '../components/speaker/SpeakerPhotoStep.jsx';
import { SpeakerMicCheckScreen } from '../components/speaker/SpeakerMicCheckScreen.jsx';
import { SpeakerDashboard } from '../components/speaker/SpeakerDashboard.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { Button } from '../components/ui/Button.jsx';

export function SpeakerPage() {
  const { session, connect } = useSession();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code') || '';
  const inviteToken = searchParams.get('invite') || '';

  const [isConnected, setIsConnected] = useState(Boolean(session && session.status === 'live'));
  const [inviteConnecting, setInviteConnecting] = useState(Boolean(inviteCode && inviteToken));
  const [inviteError, setInviteError] = useState('');
  const [needsPhotoStep, setNeedsPhotoStep] = useState(Boolean(inviteCode && inviteToken));
  const [speakerName, setSpeakerName] = useState('');
  const [isMicChecked, setIsMicChecked] = useState(false);

  // Auto-authenticate passwordless invite links (?code=...&invite=...)
  useEffect(() => {
    if (!inviteCode || !inviteToken || isConnected) return undefined;
    let cancelled = false;
    setInviteConnecting(true);
    setInviteError('');

    connect({
      role: 'principal',
      code: inviteCode,
      inviteToken
    })
      .then((res) => {
        if (cancelled) return;
        if (res?.name) setSpeakerName(res.name);
        setIsConnected(true);
        setNeedsPhotoStep(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setInviteError(err.message || 'This speaker invite link is invalid or has expired.');
        setNeedsPhotoStep(false);
      })
      .finally(() => {
        if (!cancelled) setInviteConnecting(false);
      });

    return () => { cancelled = true; };
  }, [inviteCode, inviteToken, isConnected, connect]);

  const handleLogin = async ({ code, pin, name }) => {
    await connect({
      role: 'principal',
      code,
      pin,
      name
    });
    setSpeakerName(name || '');
    setNeedsPhotoStep(false);
    setIsConnected(true);
  };

  if (inviteConnecting) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 p-6">
        <Spinner size="lg" />
        <p className="text-sm text-muted">Opening your speaker stage...</p>
      </div>
    );
  }

  if (inviteError && !isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
        <h1 className="text-xl font-black text-white">Invite Link Unavailable</h1>
        <p className="text-sm text-red-400">{inviteError}</p>
        <Button variant="primary" size="md" onClick={() => setInviteError('')}>
          Sign In With Name &amp; PIN
        </Button>
      </div>
    );
  }

  if (!isConnected || !session || session.status !== 'live') {
    return <SpeakerJoinScreen onLogin={handleLogin} initialCode={inviteCode || session?.code || ''} />;
  }

  if (needsPhotoStep) {
    return (
      <SpeakerPhotoStep
        speakerName={speakerName}
        onContinue={() => setNeedsPhotoStep(false)}
      />
    );
  }

  if (!isMicChecked) {
    return <SpeakerMicCheckScreen onContinue={() => setIsMicChecked(true)} />;
  }

  return (
    <SpeakerDashboard
      onExit={() => {
        setIsConnected(false);
        setIsMicChecked(false);
        setNeedsPhotoStep(false);
      }}
    />
  );
}
