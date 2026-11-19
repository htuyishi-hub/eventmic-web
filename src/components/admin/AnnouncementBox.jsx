import React, { useState } from 'react';
import { Megaphone, AlertTriangle, Send, Eye } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';
import { Banner } from '../common/Banner.jsx';
import { Button } from '../ui/Button.jsx';

export function AnnouncementBox() {
  const { announcement, broadcastAnnouncement } = useSession();
  const [text, setText] = useState('');
  const [type, setType] = useState('info'); // 'info' | 'warning'
  const [previewing, setPreviewing] = useState(false);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await broadcastAnnouncement?.(text.trim(), type, 10000);
    setText('');
    setPreviewing(false);
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
        <div className="flex items-center gap-1.5 font-bold text-white text-xs uppercase tracking-wider">
          <Megaphone size={14} className="text-accent" />
          <span>Venue Announcement Banner</span>
        </div>
        <span className="text-[10px] text-muted">Broadcasts to all devices</span>
      </div>

      {/* Active Broadcast or Preview */}
      {(announcement || previewing) && (
        <Banner
          type={announcement?.type || type}
          message={announcement?.text || text || 'Sample announcement preview for audience'}
          onDismiss={previewing ? () => setPreviewing(false) : undefined}
        />
      )}

      <form onSubmit={handleBroadcast} className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type announcement for attendee screens..."
            className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-muted focus:outline-none focus:border-accent"
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setType('info')}
              className={`p-1.5 rounded-lg border text-[11px] font-bold ${
                type === 'info' ? 'bg-accent/20 border-accent text-accent' : 'bg-background border-border text-muted'
              }`}
              title="Informational announcement"
            >
              Info
            </button>
            <button
              type="button"
              onClick={() => setType('warning')}
              className={`p-1.5 rounded-lg border text-[11px] font-bold ${
                type === 'warning' ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-background border-border text-muted'
              }`}
              title="Urgent warning announcement"
            >
              <AlertTriangle size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setPreviewing(v => !v)}
            disabled={!text.trim()}
            className="text-xs py-1 px-2.5 gap-1"
          >
            <Eye size={12} />
            <span>{previewing ? 'Hide Preview' : 'Preview (10s)'}</span>
          </Button>

          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!text.trim()}
            className="text-xs py-1 px-3 gap-1"
          >
            <Send size={12} />
            <span>Broadcast (10s)</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
