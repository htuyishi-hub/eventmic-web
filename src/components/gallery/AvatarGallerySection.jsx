import React from 'react';
import { Avatar } from '../common/Avatar.jsx';
import { AvatarUploader } from '../common/AvatarUploader.jsx';

export function AvatarGallerySection() {
  const sampleNames = [
    'Dr. Jane Smith',
    'Alex Rivera',
    'Sarah Chen',
    'Marcus Johnson',
    'Elena Rostova',
    'David Kim'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Avatar & Profile Photo System</h2>
        <p className="text-xs text-muted">
          Variants, deterministic color hash initials, sizes (sm 32px, md 48px, lg 96px, xl 160px), and uploader.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Size scale */}
        <div className="p-5 rounded-2xl bg-surface border border-border space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Size Scale</h3>
          <div className="flex items-end gap-4 py-2">
            <div className="flex flex-col items-center gap-1.5">
              <Avatar name="Dr. Jane Smith" size="sm" />
              <span className="text-[10px] text-muted font-mono">sm (32)</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Avatar name="Dr. Jane Smith" size="md" />
              <span className="text-[10px] text-muted font-mono">md (48)</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Avatar name="Dr. Jane Smith" size="lg" />
              <span className="text-[10px] text-muted font-mono">lg (96)</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Avatar name="Dr. Jane Smith" size="xl" />
              <span className="text-[10px] text-muted font-mono">xl (160)</span>
            </div>
          </div>
        </div>

        {/* Initials & Color Hashes */}
        <div className="p-5 rounded-2xl bg-surface border border-border space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Initials &amp; Color Hashes</h3>
          <div className="grid grid-cols-3 gap-3 py-1">
            {sampleNames.map((name) => (
              <div key={name} className="flex flex-col items-center gap-1 text-center">
                <Avatar name={name} size="md" />
                <span className="text-[11px] font-semibold text-white truncate max-w-[90px]">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Uploader Preview */}
        <div className="p-5 rounded-2xl bg-surface border border-border space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Avatar Uploader Component</h3>
          <div className="bg-background rounded-xl p-3 border border-border/60">
            <AvatarUploader
              onSave={() => {}}
              onCancel={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
