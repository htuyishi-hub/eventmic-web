import React, { useState, useEffect } from 'react';
import { Shield, Plus, RefreshCw, Trash2, Key, Eye, EyeOff } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';
import { StatusPill } from '../common/StatusPill.jsx';
import { Button } from '../ui/Button.jsx';

export function PrincipalsTab() {
  const { principals = [], createPrincipal, getPrincipals, revokePrincipal, regeneratePrincipalPin } = useSession();
  const [localPrincipals, setLocalPrincipals] = useState(principals || []);
  const [revealedPins, setRevealedPins] = useState({});
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (principals && principals.length > 0) {
      setLocalPrincipals(principals);
      return;
    }
    let mounted = true;
    getPrincipals().then(list => {
      if (mounted && Array.isArray(list)) setLocalPrincipals(list);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [getPrincipals, principals]);

  const handleAddPrincipal = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const created = await createPrincipal(newName.trim());
      setLocalPrincipals(prev => [...prev, created]);
      setNewName('');
      setIsAdding(false);
    } catch (err) {
      setError(err.message || 'Failed to add speaker');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (id) => {
    try {
      const newPin = await regeneratePrincipalPin(id);
      setLocalPrincipals(prev => prev.map(p => p.id === id ? { ...p, pin: newPin } : p));
      setRevealedPins(prev => ({ ...prev, [id]: true }));
    } catch (err) {
      setError(err.message || 'Failed to regenerate PIN');
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Revoke this speaker? They will no longer be able to speak.')) return;
    try {
      await revokePrincipal(id);
      setLocalPrincipals(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to revoke speaker');
    }
  };

  return (
    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Stage Speakers</h3>
          <p className="text-[11px] text-muted">6-digit PIN required for /speaker sign-in</p>
        </div>
        {!isAdding && (
          <Button size="sm" variant="secondary" onClick={() => setIsAdding(true)} className="gap-1 text-xs py-1">
            <Plus size={13} />
            <span>Add Speaker</span>
          </Button>
        )}
      </div>

      {error && <div className="p-2 rounded bg-live/15 text-live text-xs border border-live/30">{error}</div>}

      {isAdding && (
        <form onSubmit={handleAddPrincipal} className="p-3 rounded-xl bg-background border border-accent/40 space-y-2">
          <label className="block text-xs font-semibold text-white">Speaker Display Name</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Dr. Jane Smith"
              required
              autoFocus
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-white"
            />
            <Button size="sm" variant="primary" type="submit" disabled={loading} className="text-xs py-1.5 px-3">Create</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setIsAdding(false)} className="text-xs py-1.5 px-2">Cancel</Button>
          </div>
        </form>
      )}

      {localPrincipals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-36 text-muted text-center p-4">
          <Shield size={28} className="mb-2 opacity-40" />
          <p className="text-xs font-semibold">No speakers added yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {localPrincipals.map((p) => {
            const isRevealed = Boolean(revealedPins[p.id]);
            return (
              <div key={p.id} className="p-3 rounded-xl border border-border bg-background/80 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate max-w-[130px]">{p.name}</span>
                    <StatusPill status={p.status || 'idle'} size="xs" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Key size={11} className="text-accent" />
                    <span className="font-mono text-xs font-bold text-accent tracking-widest">
                      {isRevealed && p.pin ? p.pin : '••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRevealedPins(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      className="p-0.5 text-muted hover:text-white"
                      title={isRevealed ? 'Hide PIN' : 'Reveal PIN'}
                    >
                      {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleRegenerate(p.id)}
                    title="Regenerate 6-digit PIN"
                    className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-surface transition-colors"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevoke(p.id)}
                    title="Revoke Speaker"
                    className="p-1.5 rounded-lg text-muted hover:text-live hover:bg-live/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
