import React, { useState, useEffect } from 'react';
import { Mic, X } from 'lucide-react';
import { formatWait } from '../../lib/time.js';
import { Button } from '../ui/Button.jsx';
import { ReasonBadge } from '../admin/ReasonBadge.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { useResolvedAvatarSrc } from '../../lib/useAvatar.js';

export function QueueItem({
  item,
  index,
  onGrant,
  onDrop
}) {
  const [waitText, setWaitText] = useState(() => formatWait(item.raisedAt));
  const isFirst = index === 0;
  const avatarSrc = useResolvedAvatarSrc(item);

  useEffect(() => {
    const update = () => setWaitText(formatWait(item.raisedAt));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [item.raisedAt]);

  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
        isFirst
          ? 'bg-surface border-accent/60 shadow-md shadow-accent/10'
          : 'bg-surface/70 border-border hover:border-border/80'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
            isFirst ? 'bg-accent text-white' : 'bg-background text-muted border border-border'
          }`}
        >
          {index + 1}
        </div>

        <Avatar src={avatarSrc} name={item.name} size="sm" />

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-white truncate max-w-[130px]">
              {item.name}
            </span>
            <ReasonBadge reason={item.reason || 'question'} />
            {item.hasNotSpoken && (
              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-live/20 text-live border border-live/30">
                1st
              </span>
            )}
          </div>
          <div className="text-xs text-muted font-mono mt-0.5">
            {waitText}
            {item.speakCount !== undefined && ` • Spoke: ${item.speakCount}`}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <Button
          variant={isFirst ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onGrant(item.id)}
          className="gap-1 text-xs py-1 px-2.5"
          aria-label={`Grant floor to ${item.name}`}
        >
          <Mic size={13} />
          <span>Grant</span>
        </Button>

        <button
          onClick={() => onDrop(item.id)}
          aria-label={`Remove ${item.name} from queue`}
          title="Remove from queue"
          className="min-w-[44px] min-h-[44px] grid place-items-center rounded-lg text-muted hover:text-live hover:bg-live/10 transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
