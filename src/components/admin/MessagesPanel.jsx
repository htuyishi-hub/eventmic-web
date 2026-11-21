import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Mic, Square } from 'lucide-react';
import { useSession } from '../../context/SessionContext.jsx';
import { useTransport } from '../../context/TransportContext.jsx';
import { Button } from '../ui/Button.jsx';

export function MessagesPanel() {
  const { messages = [], sendMessage } = useSession();
  const { transport } = useTransport();
  const [inputText, setInputText] = useState('');
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [error, setError] = useState('');

  const bottomRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startMsRef = useRef(0);

  const quickReplies = ['OK', 'Wrap up please', '1 min left', 'Ready'];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      try { recorderRef.current?.stop(); } catch {}
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleSend = async (text) => {
    const trimmed = (text ?? inputText).trim();
    if (!trimmed) return;
    setError('');
    try {
      await sendMessage?.(trimmed, 'all');
      if (text === undefined) setInputText('');
    } catch (err) {
      setError(err?.message || 'Could not send message');
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    setRecording(false);
    try {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
    } catch {}
  };

  const startRecording = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Voice recording is not supported in this browser.');
      return;
    }
    try {
      let stream = null;
      const existing = transport?.preWarmedStream;
      if (existing && existing.getAudioTracks?.().some((t) => t.readyState === 'live')) {
        stream = new MediaStream(existing.getAudioTracks().map((t) => t.clone()));
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 24000
      });
      recorderRef.current = recorder;
      const chunks = [];
      startMsRef.current = Date.now();
      setRecSeconds(0);
      setRecording(true);

      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startMsRef.current) / 1000);
        setRecSeconds(secs);
        if (secs >= 15) stopRecording();
      }, 250);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const durationMs = Date.now() - startMsRef.current;
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size === 0) return;
        const reader = new FileReader();
        reader.onloadend = async () => {
          const audioDataUrl = reader.result;
          if (typeof audioDataUrl === 'string') {
            try {
              await sendMessage?.('', 'all', { audioDataUrl, durationMs });
            } catch (err) {
              setError(err?.message || 'Voice message failed to send');
            }
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
    } catch (err) {
      setRecording(false);
      if (err?.name === 'NotAllowedError' || /denied|permission/i.test(err?.message || '')) {
        setError('Microphone blocked. Click the lock/settings icon in your browser address bar, allow Microphone, and try again.');
      } else if (err?.name === 'NotFoundError') {
        setError('No microphone detected on this device.');
      } else {
        setError(err?.message || 'Could not access microphone');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-2xl overflow-hidden p-3.5 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Backstage Chat</h3>
        </div>
        <span className="text-xs text-muted font-mono tabular-nums">{messages.length}</span>
      </div>

      {/* Messages List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted py-8">
            <MessageSquare size={24} className="opacity-30 mb-1.5" />
            <p className="text-xs">No backstage messages yet</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="p-3 rounded-xl bg-background border border-border space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-white truncate">{m.from || 'Participant'}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    m.fromRole === 'admin' ? 'bg-blue-600/20 text-blue-300' : 'bg-emerald-600/20 text-emerald-300'
                  }`}>
                    {m.fromRole === 'admin' ? 'Admin' : 'Speaker'}
                  </span>
                </div>
                <span className="text-muted font-mono flex-shrink-0">
                  {m.ts ? new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>

              {m.text && <p className="text-sm text-foreground break-words">{m.text}</p>}

              {m.audioDataUrl && (
                <div className="pt-1">
                  <audio controls src={m.audioDataUrl} className="w-full h-9" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-400 font-semibold">{error}</p>
      )}

      {/* Quick Replies */}
      <div className="flex flex-wrap gap-1.5">
        {quickReplies.map((qr) => (
          <button
            key={qr}
            type="button"
            onClick={() => handleSend(qr)}
            className="min-h-[32px] px-2.5 rounded-lg bg-background border border-border text-xs font-semibold text-muted hover:text-white hover:border-accent transition-colors"
          >
            {qr}
          </button>
        ))}
      </div>

      {/* Text + Voice Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="flex items-center gap-2 pt-1 border-t border-border"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={recording ? `Recording voice... ${recSeconds}s / 15s` : 'Message backstage...'}
          disabled={recording}
          className="flex-1 min-h-[44px] px-3 rounded-xl bg-background border border-border text-sm text-white placeholder-muted focus:border-accent focus:outline-none disabled:opacity-60"
        />

        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          aria-label={recording ? 'Stop voice message' : 'Record voice message'}
          title={recording ? 'Stop & send voice note' : 'Record voice note (max 15s)'}
          className={`min-w-[44px] min-h-[44px] grid place-items-center rounded-xl border transition-colors ${
            recording
              ? 'bg-red-600 border-red-600 text-white animate-pulse'
              : 'bg-background border-border text-muted hover:text-white hover:border-accent'
          }`}
        >
          {recording ? <Square size={16} className="fill-current" /> : <Mic size={16} />}
        </button>

        <Button type="submit" variant="primary" size="sm" disabled={!inputText.trim() || recording} aria-label="Send message">
          <Send size={15} />
        </Button>
      </form>
    </div>
  );
}

export default MessagesPanel;
