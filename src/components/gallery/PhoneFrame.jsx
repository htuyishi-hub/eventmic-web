import React from 'react';

export function PhoneFrame({ title, description, children, width = 'w-[375px]', height = 'h-[667px]' }) {
  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="mb-2 text-center max-w-[375px]">
        <div className="text-xs font-bold text-white uppercase tracking-wider">{title}</div>
        {description && <div className="text-xs text-muted truncate">{description}</div>}
      </div>

      <div
        className={`relative ${width} ${height} rounded-[32px] border-4 border-slate-800 bg-background shadow-2xl overflow-hidden flex flex-col`}
      >
        {/* Fake phone status bar */}
        <div className="h-6 w-full bg-slate-950/80 flex items-center justify-between px-6 text-xs text-muted flex-shrink-0 z-20 border-b border-border/20">
          <span>9:41</span>
          <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto" />
          <span>5G • 100%</span>
        </div>

        {/* Screen content area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {children}
        </div>

        {/* Fake home indicator bar */}
        <div className="h-4 w-full bg-background flex items-center justify-center flex-shrink-0 z-20">
          <div className="w-28 h-1 bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}
