import React, { useState, useEffect } from 'react';
import { Shield, Plus, RefreshCw, Trash2, Key } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';
import { Button } from '../ui/Button.jsx';

export function PrincipalsTab() {
  const {
    principals,
    createPrincipal,
    getPrincipals,
    revokePrincipal,
    regeneratePrincipalPin
  } = useSession();

  const [localPrincipals, setLocalPrincipals] = useState(principals || []);
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
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
    <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Speakers / Principals
          </h3>
          <p className="text-[11px] text-muted">Share 6-digit PIN for /speaker access</p>
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
        <form onSubmit={handleAddPrincipal} className="p-3 rounded-xl bg-surface border border-accent/40 space-y-2">
          <label className="block text-xs font-semibold text-white">Speaker Name</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Dr. Jane Smith"
              required
              autoFocus
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-white placeholder-muted focus:outline-none focus:border-accent"
            />
            <Button size="sm" variant="primary" type="submit" disabled={loading} className="text-xs py-1.5 px-3">
              Create
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setIsAdding(false)} className="text-xs py-1.5 px-2">
              Cancel
            </Button>
          </div>
        </form>
      )}

      {localPrincipals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-36 text-muted text-center p-4">
          <Shield size={28} className="mb-2 opacity-40" />
          <p className="text-xs font-semibold">No speakers added yet</p>
          <p className="text-[11px] text-muted mt-0.5">Add speakers so they can join on /speaker.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {localPrincipals.map((p) => (
            <div key={p.id} className="p-3 rounded-xl border border-border bg-surface/70 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate max-w-[130px]">{p.name}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Key size={11} className="text-accent" />
                  <span className="font-mono text-xs font-bold text-accent tracking-widest">
                    {p.pin || '••••••'}
                  </span>
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
          ))}
        </div>
      )}
    </div>
  );
}
