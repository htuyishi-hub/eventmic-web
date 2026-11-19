import React from 'react';

export function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div
      role="tablist"
      aria-label="Navigation Tabs"
      className={`flex items-center gap-1.5 p-1 bg-background border border-border rounded-xl overflow-x-auto ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-accent ${
              isActive
                ? 'bg-surface text-white border border-border shadow-sm'
                : 'text-muted hover:text-white hover:bg-surface/50'
            }`}
          >
            {Icon && <Icon size={14} className={isActive ? 'text-accent' : 'opacity-70'} aria-hidden="true" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                tab.badgeVariant === 'urgent'
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-accent text-white'
              }`}>
                {tab.badge}
              </span>
            )}
            {tab.shortcut && (
              <kbd className="hidden sm:inline-block ml-1 text-[9px] font-mono text-muted/60 opacity-60">
                {tab.shortcut}
              </kbd>
            )}
          </button>
        );
      })}
    </div>
  );
}
