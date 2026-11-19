import React from 'react';

export function LaptopFrame({ title, stateLabel, badgeColor = 'bg-accent', children }) {
  return (
    <div className="flex flex-col flex-shrink-0 w-full xl:w-[780px] bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
      {/* Window title bar */}
      <div className="h-10 px-4 bg-slate-900 border-b border-border flex items-center justify-between text-xs flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="ml-3 font-mono text-[11px] text-muted truncate">https://eventmic.live/admin</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${badgeColor}`}>
            {stateLabel}
          </span>
          <span className="text-xs font-bold text-white">{title}</span>
        </div>
      </div>

      {/* Viewport container */}
      <div className="relative min-h-[480px] max-h-[580px] overflow-y-auto bg-background text-foreground flex flex-col">
        {children}
      </div>
    </div>
  );
}
