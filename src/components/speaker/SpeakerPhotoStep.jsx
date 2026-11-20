import React, { useState } from 'react';
import { ArrowRight, Camera } from 'lucide-react';
import { DMLogo } from '../brand/DMLogo.jsx';
import { Button } from '../ui/Button.jsx';
import { AvatarUploader } from '../common/AvatarUploader.jsx';
import { useSession } from '../../context/SessionContext.jsx';

/**
 * Shown to a Principal Speaker arriving via their unique invite link:
 * no password required — asks for an optional short profile photo, then enters stage.
 */
export function SpeakerPhotoStep({ speakerName, onContinue }) {
  const { uploadAvatar } = useSession();
  const [showUploader, setShowUploader] = useState(false);
  const [error, setError] = useState('');

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 max-w-md mx-auto bg-background text-foreground">
      <div className="pt-6 space-y-6">
        <div className="flex justify-center">
          <DMLogo size={28} />
        </div>

        <div className="text-center space-y-1.5">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-accent">
            Speaker Invite Verified
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Welcome{speakerName ? `, ${speakerName}` : ''}
          </h1>
          <p className="text-sm text-muted">
            Add a quick profile photo so the audience recognizes you, or skip to continue.
          </p>
        </div>

        {showUploader ? (
          <div className="p-5 rounded-2xl bg-surface border border-border">
            <AvatarUploader
              onSave={async (blob) => {
                try {
                  setError('');
                  await uploadAvatar(blob);
                  onContinue();
                } catch (err) {
                  setError(err.message || 'Could not upload photo');
                }
              }}
              onCancel={() => setShowUploader(false)}
            />
            {error && <p className="mt-2 text-xs text-red-400 text-center">{error}</p>}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-surface border border-border text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center text-muted mx-auto">
              <Camera size={26} />
            </div>
            <p className="text-xs text-muted">
              Your photo stays in memory only for this session and is deleted when it ends.
            </p>
            <Button variant="secondary" size="lg" onClick={() => setShowUploader(true)} className="w-full gap-2">
              <Camera size={16} />
              <span>Add Profile Photo (Optional)</span>
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3 pb-safe">
        <Button variant="primary" size="huge" onClick={onContinue} className="w-full gap-2">
          <span>Continue to Stage</span>
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}

export default SpeakerPhotoStep;
