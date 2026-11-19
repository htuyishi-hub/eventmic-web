import React, { useState } from 'react';
import { Users, History, Shield, ListOrdered, Scale } from 'lucide-react';
import { QueueList } from '../host/QueueList.jsx';
import { AttendeesTab } from './AttendeesTab.jsx';
import { SpokeHistoryTab } from './SpokeHistoryTab.jsx';
import { PrincipalsTab } from './PrincipalsTab.jsx';
import { useSession } from '../../context/SessionContext.jsx';

export function AdminTabs({ queue, onGrant, onDrop, onOpenQr }) {
  const [activeTab, setActiveTab] = useState('queue');
  const { fairModeActive, attendeeCount, principals } = useSession();

  const tabs = [
    { id: 'queue', label: `Queue (${queue.length})`, icon: ListOrdered },
    { id: 'attendees', label: `Attendees (${attendeeCount || 0})`, icon: Users },
    { id: 'spoke', label: 'Spoke', icon: History },
    { id: 'principals', label: `Speakers (${principals?.length || 0})`, icon: Shield }
  ];

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-border bg-surface/90 flex-shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-muted hover:text-white hover:bg-surface'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {fairModeActive && (
          <span
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-live/15 text-live border border-live/30"
            title="Fair Mode prioritizes attendees who have not spoken"
          >
            <Scale size={11} />
            <span>Fair Mode</span>
          </span>
        )}
      </div>

      {/* Tab Body */}
      <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-hidden">
        {activeTab === 'queue' && (
          <QueueList
            queue={queue}
            onGrant={onGrant}
            onDrop={onDrop}
            onOpenQr={onOpenQr}
          />
        )}
        {activeTab === 'attendees' && <AttendeesTab />}
        {activeTab === 'spoke' && <SpokeHistoryTab />}
        {activeTab === 'principals' && <PrincipalsTab />}
      </div>
    </div>
  );
}
