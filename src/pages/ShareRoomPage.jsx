import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { DMLogo } from '../components/brand/DMLogo.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useSession } from '../context/SessionContext.jsx';

export function ShareRoomPage() {
  const { code: paramCode } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const [copied, setCopied] = useState(false);

  const code = (paramCode || session?.code || '').trim().toUpperCase();
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${code}`
    : `/join/${code}`;

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6 max-w-md mx-auto">
      <header className="flex items-center justify-between">
        <DMLogo size={24} />
        <button
          type="button"
          onClick={() => navigate(`/join/${code}`)}
          className="min-h-[44px] px-3.5 rounded-full bg-surface border border-border text-xs font-bold text-white inline-flex items-center gap-1.5 hover:border-accent"
        >
          <ArrowLeft size={14} />
          <span>Back to Event</span>
        </button>
      </header>

      <main className="my-auto py-6 text-center space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tight">Share Room</h1>
          <p className="text-xs text-muted">
            Let the person next to you scan this QR code to join {session?.name || 'this session'}.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-surface border border-border inline-flex flex-col items-center space-y-4">
          <div className="p-4 rounded-2xl bg-white">
            <QRCodeCanvas value={joinUrl} size={220} level="M" includeMargin={false} />
          </div>

          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-widest text-muted block">Room Code</span>
            <span className="text-2xl font-mono font-black tracking-[0.25em] text-white">{code}</span>
          </div>
        </div>
      </main>

      <footer className="pb-safe">
        <Button variant="primary" size="huge" onClick={handleCopy} className="w-full gap-2">
          {copied ? <Check size={18} /> : <Copy size={18} />}
          <span>{copied ? 'Join Link Copied' : 'Copy Join Link'}</span>
        </Button>
      </footer>
    </div>
  );
}

export default ShareRoomPage;
