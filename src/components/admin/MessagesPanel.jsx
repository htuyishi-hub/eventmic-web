import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';
import { ChatBubble } from '../common/ChatBubble.jsx';
import { Button } from '../ui/Button.jsx';

export function MessagesPanel({ onClose }) {
  const { messages = [], sendMessage } = useSession();
  const [inputText, setInputText] = useState('');

  const quickReplies = ['OK', 'Wrap up please', '1 minute remaining'];

  const handleSend = async (text) => {
    const trimmed = (text || inputText).trim();
    if (!trimmed) return;
    await sendMessage?.(trimmed, 'principal');
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-2xl overflow-hidden shadow-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Speaker Backstage Chat</h3>
        </div>
        <span className="text-[10px] text-muted font-mono">{messages.length} messages</span>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-[180px] max-h-[320px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted text-center p-4">
            <Sparkles size={24} className="opacity-40 mb-1" />
            <p className="text-xs">No backstage messages yet</p>
          </div>
        ) : (
          messages.map(m => (
            <ChatBubble
              key={m.id}
              message={m.text}
              isFromAdmin={m.senderRole === 'admin'}
              authorName={m.senderName}
              timestamp={m.timestamp}
            />
          ))
        )}
      </div>

      {/* Quick Replies */}
      <div className="pt-2 border-t border-border/50 space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {quickReplies.map((qr) => (
            <button
              key={qr}
              type="button"
              onClick={() => handleSend(qr)}
              className="px-2.5 py-1 rounded-lg bg-background hover:bg-surface border border-border text-[11px] font-bold text-accent whitespace-nowrap transition-colors"
            >
              {qr}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type message to speaker..."
            className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-white placeholder-muted focus:outline-none focus:border-accent"
          />
          <Button size="sm" variant="primary" type="submit" disabled={!inputText.trim()} className="p-2 rounded-xl">
            <Send size={13} />
          </Button>
        </form>
      </div>
    </div>
  );
}
