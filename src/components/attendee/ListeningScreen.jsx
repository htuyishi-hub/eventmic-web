import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Hand, ShieldCheck, Zap, Camera, X, QrCode } from 'lucide-react';
import { DMRecordingWave, DMLogo } from '../brand/DMLogo.jsx';
import { Button } from '../ui/Button.jsx';
import { UrgentConfirmSheet } from './UrgentConfirmSheet.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { AvatarUploader } from '../common/AvatarUploader.jsx';
import { useResolvedAvatarSrc } from '../../lib/useAvatar.js';

const REASONS = [
  { id: 'question', label: 'Question' },
  { id: 'comment', label: 'Comment' },
  { id: 'compliment', label: 'Compliment' },
  { id: 'clarification', label: 'Clarification' }
];

export function ListeningScreen({ session, attendeeName, onRaiseHand, onUrgent }) {
  const { floor, uploadAvatar, deleteAvatar } = useSession();
  const [selectedReason, setSelectedReason] = useState('question');
  const [isUrgentOpen, setIsUrgentOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  const photosSetting = session?.settings?.photos || 'speaker_only';
  const showPhotos = photosSetting !== 'off';

  const currentSpeaker = floor?.holderId ? {
    id: floor.holderId,
    name: floor.holderName || floor.name || 'Current Speaker',
    hasAvatar: floor.hasAvatar,
    avatarVersion: floor.avatarVersion
  } : null;

  const speakerAvatarSrc = useResolvedAvatarSrc(currentSpeaker);

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 max-w-md mx-auto bg-background text-foreground">
      {/* Top Status */}
      <div className="pt-6 text-center space-y-3">
        <div className="flex items-center justify-between gap-2">
          <DMLogo size={24} />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Live</span>
          </div>

          <div className="flex items-center gap-1.5">
            {session?.code && (
              <Link
                to={`/join/${session.code}/share`}
                aria-label="Share Room QR"
                className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-full bg-surface border border-border text-xs text-muted hover:text-white transition-colors"
              >
                <QrCode size={13} />
                <span>Share</span>
              </Link>
            )}
            {showPhotos && (
              <button
                type="button"
                onClick={() => setIsPhotoOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-full bg-surface border border-border text-xs text-muted hover:text-white transition-colors"
              >
                <Camera size={13} />
                <span>Photo</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tight">
            {session?.name || 'Live Q&A'}
          </h1>
          <p className="text-xs text-muted font-mono">
            Attendee: <strong className="text-white">{attendeeName}</strong>
          </p>
        </div>

        {/* Live Speaker or Reinforced Audio Card */}
        {currentSpeaker && showPhotos ? (
          <div className="p-6 bg-surface border border-accent/40 rounded-2xl shadow-xl flex flex-col items-center space-y-3 my-4">
            <Avatar
              src={speakerAvatarSrc}
              name={currentSpeaker.name}
              size="lg"
              className="ring-4 ring-accent/30"
            />
            <div className="space-y-0.5 text-center">
              <span className="text-xs font-mono uppercase tracking-widest text-accent font-bold">
                {floor.holderRole === 'principal' ? 'Stage Speaker' : 'Attendee on the Floor'}
              </span>
              <h3 className="text-base font-bold text-white">{currentSpeaker.name}</h3>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-surface border border-border rounded-2xl flex flex-col items-center space-y-4 my-4">
            <div className="w-28 h-28 rounded-full bg-background border-2 border-border flex items-center justify-center text-foreground">
              <DMRecordingWave size={56} />
            </div>
            <div className="space-y-1 text-center">
              <h3 className="text-base font-bold text-white">Stage Audio Reinforced</h3>
              <p className="text-xs text-muted leading-relaxed">
                Choose your reason and tap Raise Hand below to join the queue.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Area */}
      <div className="space-y-3 pb-safe">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted text-center mb-2">
            Reason for Speaking
          </label>
          <div className="grid grid-cols-2 gap-2">
            {REASONS.map((r) => {
              const isSelected = selectedReason === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReason(r.id)}
                  className={`min-h-[44px] px-3 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-surface border-border text-muted hover:text-white hover:bg-surface-hover'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          size="huge"
          variant="primary"
          onClick={() => onRaiseHand({ reason: selectedReason })}
          className="w-full gap-3 text-lg font-black uppercase tracking-wider min-h-[56px]"
        >
          <Hand size={24} />
          <span>Raise Hand</span>
        </Button>

        {onUrgent && (
          <Button
            size="md"
            variant="secondary"
            onClick={() => setIsUrgentOpen(true)}
            className="w-full gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 border-amber-500/30 hover:bg-amber-500/10 min-h-[44px]"
          >
            <Zap size={14} className="text-amber-400" />
            <span>Urgent (5s Blip)</span>
          </Button>
        )}

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted text-center">
          <ShieldCheck size={14} className="text-accent flex-shrink-0" />
          <span>Your microphone stays off until granted the floor.</span>
        </div>
      </div>

      {/* Urgent Sheet */}
      <UrgentConfirmSheet
        isOpen={isUrgentOpen}
        onClose={() => setIsUrgentOpen(false)}
        onConfirm={(reason) => onUrgent?.(reason)}
      />

      {/* Photo Modal */}
      {isPhotoOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-5 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Your Profile Photo</h3>
              <button
                type="button"
                onClick={() => setIsPhotoOpen(false)}
                className="min-w-[44px] min-h-[44px] grid place-items-center rounded-lg text-muted hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <AvatarUploader
              onSave={async (blob) => {
                await uploadAvatar(blob);
                setIsPhotoOpen(false);
              }}
              onRemove={async () => {
                await deleteAvatar();
                setIsPhotoOpen(false);
              }}
              onCancel={() => setIsPhotoOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
