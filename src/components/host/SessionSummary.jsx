import React from 'react';
import { Award, Clock, Users, Mic, Plus, Download } from 'lucide-react';
import { DMLogo } from '../brand/DMLogo.jsx';
import { Button } from '../ui/Button.jsx';
import { formatDuration } from '../../lib/time.js';

export function SessionSummary({
  session,
  stats = { durationSeconds: 0, speakersCount: 0, totalHandsRaised: 0 },
  onStartNewSession
}) {
  const handleExportCsv = () => {
    const rows = [
      ['Session Name', 'Session Code', 'Duration (s)', 'Total Speakers', 'Hands Raised'],
      [session?.name || 'Live Session', session?.code || '', stats.durationSeconds || 0, stats.speakersCount || 0, stats.totalHandsRaised || 0]
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dm-session-${session?.code || 'audit'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="flex justify-center">
          <DMLogo size={28} />
        </div>
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
          <Award size={28} />
        </div>

        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-muted">
            Session Complete
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            {session?.name || 'Live Q&A Session'}
          </h1>
          <p className="text-xs font-mono text-accent mt-1">
            Session Code: {session?.code}
          </p>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-background border border-border">
            <Clock size={18} className="text-accent mx-auto mb-1.5" />
            <div className="text-xl font-black text-white font-mono tabular-nums">
              {formatDuration(stats.durationSeconds)}
            </div>
            <div className="text-xs text-muted uppercase font-bold tracking-wider mt-1">
              Duration
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border">
            <Mic size={18} className="text-live mx-auto mb-1.5" />
            <div className="text-xl font-black text-white font-mono tabular-nums">
              {stats.speakersCount}
            </div>
            <div className="text-xs text-muted uppercase font-bold tracking-wider mt-1">
              Speakers
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border">
            <Users size={18} className="text-warning mx-auto mb-1.5" />
            <div className="text-xl font-black text-white font-mono tabular-nums">
              {stats.totalHandsRaised}
            </div>
            <div className="text-xs text-muted uppercase font-bold tracking-wider mt-1">
              Hands Raised
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleExportCsv}
            className="w-full gap-2"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onStartNewSession}
            className="w-full gap-2"
          >
            <Plus size={18} />
            <span>New Session</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
