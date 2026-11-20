import React, { useState, useEffect } from 'react';
import { QrCode, Copy, Check, Settings, LogOut, Users, MessageSquare, Activity, Megaphone } from 'lucide-react';
import { DMMark } from '../brand/DMLogo.jsx';
import { ConnectionBadge } from './ConnectionBadge.jsx';
import { Button } from '../ui/Button.jsx';
import { formatDuration } from '../../lib/time.js';

export function SessionBar({
  session,
  attendeeCount = 0,
  unreadMessages = 0,
  connectionState,
  onOpenQr,
  onOpenSettings,
  onOpenMessages,
  onEndSessionClick,
  onOpenDiagnostics,
  onOpenAnnounce,
  onAir = false
}) {
  const [copied, setCopied] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  useEffect(() => {
    if (!session?.createdAt) return;
    const update = () => {
      setSessionDuration(Math.max(0, Math.floor((Date.now() - session.createdAt) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [session?.createdAt]);

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${session?.code}`
    : `/join/${session?.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-surface border-b border-border flex items-center justify-between gap-4 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 flex-shrink-0 text-foreground" aria-label="DM">
          <DMMark size={30} recording={onAir} />
          <span className="font-extrabold tracking-wider text-base hidden sm:inline">DM</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black uppercase tracking-wider text-white truncate max-w-[200px] sm:max-w-xs">
              {session?.name || 'Live Session'}
            </h1>
            <ConnectionBadge state={connectionState} />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted font-mono">
            <span>Session time</span>
            <span className="tabular-nums">{formatDuration(sessionDuration)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div
          title={`${attendeeCount} Connected Attendees`}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-semibold text-muted font-mono"
        >
          <Users size={14} className="text-accent" />
          <span>{attendeeCount}</span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopyLink}
          className="gap-2 font-mono hidden sm:inline-flex"
          title="Copy join link"
          aria-label={`Session code ${session?.code}. Copy join link`}
        >
          <span className="tracking-[0.2em] font-bold text-foreground">{session?.code}</span>
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-muted" />}
        </Button>

        {onOpenAnnounce && (
          <button
            type="button"
            onClick={onOpenAnnounce}
            title="Venue Announcement (A)"
            aria-label="Announcement"
            className="min-w-[44px] min-h-[44px] grid place-items-center rounded-xl bg-background border border-border text-muted hover:text-white hover:border-accent transition-colors"
          >
            <Megaphone size={18} />
          </button>
        )}

        {onOpenDiagnostics && (
          <button
            type="button"
            onClick={onOpenDiagnostics}
            title="Diagnostics (D)"
            aria-label="Diagnostics"
            className="min-w-[44px] min-h-[44px] grid place-items-center rounded-xl bg-background border border-border text-muted hover:text-white hover:border-accent transition-colors"
          >
            <Activity size={18} />
          </button>
        )}

        {onOpenMessages && (
          <button
            type="button"
            onClick={onOpenMessages}
            title="Backstage Messages"
            className="relative min-w-[44px] min-h-[44px] grid place-items-center rounded-xl bg-background border border-border text-muted hover:text-white hover:border-accent transition-colors"
          >
            <MessageSquare size={17} />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white font-bold text-xs flex items-center justify-center animate-pulse">
                {unreadMessages}
              </span>
            )}
          </button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenQr}
          className="gap-1.5 text-xs py-1.5"
          title="Open Room QR (Q)"
        >
          <QrCode size={14} className="text-accent" />
          <span className="hidden sm:inline">Show QR (Q)</span>
        </Button>

        <button
          onClick={onOpenSettings}
          title="Audio & Stage Settings"
          aria-label="Settings"
          className="min-w-[44px] min-h-[44px] grid place-items-center rounded-xl bg-background border border-border text-muted hover:text-white hover:border-accent transition-colors"
        >
          <Settings size={18} />
        </button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onEndSessionClick}
          className="gap-1.5 text-xs py-1.5 text-live hover:text-white hover:bg-live hover:border-live"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">End Session</span>
        </Button>
      </div>
    </header>
  );
}
