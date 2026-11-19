import React from 'react';

export function ChatBubble({ message, isFromAdmin = false, timestamp, authorName }) {
  const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className={`flex flex-col ${isFromAdmin ? 'items-start' : 'items-end'} space-y-1 text-xs my-1.5`}>
      <div className="flex items-center gap-1.5 text-[10px] text-muted px-1 font-mono">
        <span className="font-bold text-white">{authorName || (isFromAdmin ? 'Admin' : 'Speaker')}</span>
        {timeStr && <span>• {timeStr}</span>}
      </div>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-2xl break-words text-xs shadow-sm ${
          isFromAdmin
            ? 'bg-purple-600/30 border border-purple-500/30 text-white rounded-tl-sm'
            : 'bg-accent/25 border border-accent/35 text-white rounded-tr-sm'
        }`}
      >
        {message}
      </div>
    </div>
  );
}
