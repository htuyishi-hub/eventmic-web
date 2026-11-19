import React from 'react';

const REASON_STYLES = {
  question: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  comment: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  compliment: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  clarification: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
};

export function ReasonBadge({ reason = 'question' }) {
  const norm = String(reason).toLowerCase();
  const style = REASON_STYLES[norm] || REASON_STYLES.question;

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase border ${style}`}>
      {norm}
    </span>
  );
}
