import React, { useState, useEffect } from 'react';
import { Users, History, Shield, ListOrdered, Scale, Zap } from 'lucide-react';
import { QueueList } from '../host/QueueList.jsx';
import { AttendeesTab } from './AttendeesTab.jsx';
import { SpokeHistoryTab } from './SpokeHistoryTab.jsx';
import { PrincipalsTab } from './PrincipalsTab.jsx';
import { UrgentTab } from './UrgentTab.jsx';
import { Tabs } from '../common/Tabs.jsx';
import { useSession } from '../../context/SessionContext.jsx';

export function AdminTabs({ queue = [], onGrant, onDrop, onOpenQr }) {
  const [activeTab, setActiveTab] = useState('queue');
  const { fairModeActive, attendeeCount, principals, urgent = [] } = useSession();

  const tabDefs = [
    { id: 'queue', label: 'Queue', icon: ListOrdered, badge: queue.length, shortcut: '1' },
    { id: 'urgent', label: 'Urgent', icon: Zap, badge: urgent.length, badgeVariant: 'urgent', shortcut: '2' },
    { id: 'attendees', label: 'Attendees', icon: Users, badge: attendeeCount, shortcut: '3' },
    { id: 'spoke', label: 'Spoke', icon: History, shortcut: '4' },
    { id: 'principals', label: 'Speakers', icon: Shield, badge: principals?.length, shortcut: '5' }
  ];

  // Tab number shortcuts (1-5)
  useEffect(() => {
    const handleKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= tabDefs.length) {
        setActiveTab(tabDefs[num - 1].id);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [tabDefs.length]);

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
      <div className="p-2 border-b border-border bg-surface/90 flex items-center justify-between gap-2 flex-shrink-0">
        <Tabs tabs={tabDefs} activeTab={activeTab} onChange={setActiveTab} className="flex-1" />
        {fairModeActive && (
          <span
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-live/15 text-live border border-live/30 flex-shrink-0"
            title="Fair Mode prioritizes attendees who haven't spoken yet"
          >
            <Scale size={11} />
            <span>Fair Mode</span>
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-hidden">
        {activeTab === 'queue' && <QueueList queue={queue} onGrant={onGrant} onDrop={onDrop} onOpenQr={onOpenQr} />}
        {activeTab === 'urgent' && <UrgentTab />}
        {activeTab === 'attendees' && <AttendeesTab />}
        {activeTab === 'spoke' && <SpokeHistoryTab />}
        {activeTab === 'principals' && <PrincipalsTab />}
      </div>
    </div>
  );
}
