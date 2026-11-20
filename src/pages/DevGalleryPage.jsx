import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Monitor, Mic, Smartphone, AlertCircle, LayoutGrid, Camera } from 'lucide-react';
import { AdminGallerySection } from '../components/gallery/AdminGallerySection.jsx';
import { SpeakerGallerySection } from '../components/gallery/SpeakerGallerySection.jsx';
import { AttendeeGallerySection } from '../components/gallery/AttendeeGallerySection.jsx';
import { AttendeeErrorsSection } from '../components/gallery/AttendeeErrorsSection.jsx';
import { AvatarGallerySection } from '../components/gallery/AvatarGallerySection.jsx';

export function DevGalleryPage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All States', count: 32, icon: LayoutGrid },
    { id: 'admin', label: 'Admin', count: 6, icon: Monitor },
    { id: 'speaker', label: 'Speaker', count: 9, icon: Mic },
    { id: 'attendee', label: 'Attendee', count: 10, icon: Smartphone },
    { id: 'avatars', label: 'Avatars', count: 3, icon: Camera },
    { id: 'errors', label: 'Errors', count: 4, icon: AlertCircle }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-foreground">
      {/* Top sticky navigation bar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-border/80 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-1.5 rounded-lg bg-surface border border-border text-muted hover:text-white transition-colors"
            title="Return to Admin"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent/20 border border-accent/40 text-accent-light font-bold">
                DEV
              </span>
              <h1 className="text-base font-black text-white tracking-tight">DM Design Gallery</h1>
            </div>
            <p className="text-xs text-muted">Static preview of all roles & edge states side-by-side</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-surface/80 p-1 rounded-xl border border-border">
          {filters.map((f) => {
            const Icon = f.icon;
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-accent text-white shadow-md shadow-accent/20'
                    : 'text-muted hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon size={13} />
                <span>{f.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-muted'}`}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 sm:p-8 space-y-12 max-w-[1700px] mx-auto">
        {(activeFilter === 'all' || activeFilter === 'admin') && (
          <section id="admin-states">
            <AdminGallerySection />
          </section>
        )}

        {(activeFilter === 'all' || activeFilter === 'speaker') && (
          <section id="speaker-states">
            <SpeakerGallerySection />
          </section>
        )}

        {(activeFilter === 'all' || activeFilter === 'attendee') && (
          <section id="attendee-states">
            <AttendeeGallerySection />
          </section>
        )}

        {(activeFilter === 'all' || activeFilter === 'avatars') && (
          <section id="avatar-states">
            <AvatarGallerySection />
          </section>
        )}

        {(activeFilter === 'all' || activeFilter === 'errors') && (
          <section id="error-states">
            <AttendeeErrorsSection />
          </section>
        )}
      </main>
    </div>
  );
}
