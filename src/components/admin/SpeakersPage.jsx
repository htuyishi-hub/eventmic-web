import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Copy, Check, Key, RefreshCw, Trash2, Link2 } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';
import { DMLogo } from '../brand/DMLogo.jsx';
import { Button } from '../ui/Button.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { StatusPill } from '../common/StatusPill.jsx';
import { useResolvedAvatarSrc } from '../../lib/useAvatar.js';

function SpeakerDirectoryRow({ p, sessionCode, onRegenerate, onRevoke }) {
  const avatarSrc = useResolvedAvatarSrc(p);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const inviteUrl =
    typeof window !== 'undefined' && p.inviteToken && sessionCode
      ? `${window.location.origin}/speaker?code=${encodeURIComponent(sessionCode)}&invite=${encodeURIComponent(p.inviteToken)}`
      : '';

  const copyText = (text, setter) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    });
  };

  return (
    <div className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar src={avatarSrc} name={p.name} size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-white truncate">{p.name}</span>
            <StatusPill status={p.status || 'idle'} size="xs" />
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted font-mono">
            <span className="inline-flex items-center gap-1.5 text-white">
              <Key size={13} className="text-accent" />
              Password (PIN): <strong className="tracking-widest text-sm">{p.pin || '------'}</strong>
            </span>
            {p.pin && (
              <button
                type="button"
                onClick={() => copyText(p.pin, setCopiedPin)}
                className="min-h-[32px] px-2 rounded bg-background border border-border text-muted hover:text-white inline-flex items-center gap-1"
              >
                {copiedPin ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedPin ? 'Copied' : 'Copy PIN'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {inviteUrl && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => copyText(inviteUrl, setCopiedLink)}
            className="gap-1.5"
          >
            {copiedLink ? <Check size={14} /> : <Link2 size={14} />}
            <span>{copiedLink ? 'Link Copied' : 'Copy Invite Link'}</span>
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onRegenerate(p.id)}
          title="Regenerate Password (PIN)"
          className="gap-1.5"
        >
          <RefreshCw size={14} />
          <span>New PIN</span>
        </Button>

        <button
          type="button"
          onClick={() => onRevoke(p.id)}
          aria-label={`Remove ${p.name}`}
          title="Remove speaker"
          className="min-w-[44px] min-h-[44px] grid place-items-center rounded-xl bg-background border border-border text-muted hover:text-red-400 hover:border-red-500/40 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * Dedicated Admin Page: Speakers Names, Passwords (PINs), and Unique Invite Links.
 */
export function SpeakersPage() {
  const navigate = useNavigate();
  const {
    session,
    principals = [],
    getPrincipals,
    createPrincipal,
    regeneratePrincipalPin,
    revokePrincipal
  } = useSession();

  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getPrincipals?.().catch(() => {});
  }, [getPrincipals]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Enter a speaker name (at least 2 characters).');
      return;
    }
    try {
      setCreating(true);
      setError('');
      await createPrincipal(trimmed);
      setName('');
    } catch (err) {
      setError(err.message || 'Failed to add speaker');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-16 px-4 sm:px-6 bg-surface border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <DMLogo size={28} />
          <span className="text-sm font-bold text-muted hidden sm:inline">
            Speakers &amp; Passwords
          </span>
        </div>

        <Button variant="secondary" size="sm" onClick={() => navigate('/admin')} className="gap-2">
          <ArrowLeft size={15} />
          <span>Back to Live Stage</span>
        </Button>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Principal Speakers</h1>
            {session?.code && (
              <span className="px-2.5 py-0.5 rounded bg-surface border border-border font-mono text-xs font-bold text-white tracking-widest">
                {session.code}
              </span>
            )}
          </div>
          <p className="text-sm text-muted">
            Add a speaker to generate their unique passwordless link. If they open the app button instead, give them their name and password (PIN) below.
          </p>
        </div>

        {/* Add Speaker Form */}
        <form onSubmit={handleAdd} className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="Speaker full name (e.g. Honore Tuyishi)"
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-background border border-border text-sm text-white placeholder-muted focus:border-accent focus:outline-none"
          />
          <Button type="submit" variant="primary" size="md" loading={creating} className="gap-2">
            <Plus size={16} />
            <span>Add Speaker</span>
          </Button>
        </form>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs font-semibold text-red-200">
            {error}
          </div>
        )}

        {/* Speakers List */}
        <div className="space-y-3">
          {principals.length === 0 ? (
            <div className="p-10 rounded-xl bg-surface border border-border text-center text-sm text-muted">
              No principal speakers added yet. Add one above to generate their invite link and password.
            </div>
          ) : (
            principals.map((p) => (
              <SpeakerDirectoryRow
                key={p.id}
                p={p}
                sessionCode={session?.code}
                onRegenerate={(id) => regeneratePrincipalPin?.(id)}
                onRevoke={(id) => revokePrincipal?.(id)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default SpeakersPage;
