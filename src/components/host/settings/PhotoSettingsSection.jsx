import React, { useState } from 'react';
import { Camera, Image, Eye, EyeOff } from 'lucide-react';
import { useSession } from '../../../context/SessionContext.jsx';

export function PhotoSettingsSection() {
  const { session, updateSettings } = useSession();
  const currentMode = session?.settings?.photos || 'speaker_only';
  const [photosMode, setPhotosMode] = useState(currentMode);
  const [saving, setSaving] = useState(false);

  const handleToggle = async (newMode) => {
    setPhotosMode(newMode);
    setSaving(true);
    try {
      await updateSettings({ photos: newMode });
    } catch (err) {
      console.error('Failed to update photo setting:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Camera size={16} className="text-accent" />
          <span>Temporary Profile Photos</span>
        </div>
        {saving && <span className="text-xs text-muted animate-pulse">Saving...</span>}
      </div>

      <p className="text-xs text-muted leading-relaxed">
        Control visibility and upload permissions for temporary profile photos during this session.
      </p>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => handleToggle('speaker_only')}
          className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
            photosMode === 'speaker_only'
              ? 'bg-accent/15 border-accent text-white shadow-md shadow-accent/20'
              : 'bg-background border-border text-muted hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <Eye size={13} className={photosMode === 'speaker_only' ? 'text-accent' : 'text-muted'} />
            <span>Speaker Only</span>
          </div>
          <p className="text-xs opacity-80 leading-normal">
            Attendees see only the live speaker's photo. Organizers see all.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleToggle('on')}
          className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
            photosMode === 'on'
              ? 'bg-accent/15 border-accent text-white shadow-md shadow-accent/20'
              : 'bg-background border-border text-muted hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <Image size={13} className={photosMode === 'on' ? 'text-accent' : 'text-muted'} />
            <span>All Visible</span>
          </div>
          <p className="text-xs opacity-80 leading-normal">
            All attendees and organizers see participant photos.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleToggle('off')}
          className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
            photosMode === 'off'
              ? 'bg-live/15 border-live text-white shadow-md shadow-live/20'
              : 'bg-background border-border text-muted hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <EyeOff size={13} className={photosMode === 'off' ? 'text-live' : 'text-muted'} />
            <span>Disabled</span>
          </div>
          <p className="text-xs opacity-80 leading-normal">
            Photos are disabled. Existing photos are hidden and uploads blocked.
          </p>
        </button>
      </div>
    </div>
  );
}
