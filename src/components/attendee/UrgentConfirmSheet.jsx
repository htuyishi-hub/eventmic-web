import React, { useState } from 'react';
import { AlertTriangle, Zap, VolumeX, Sparkles, Info } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet.jsx';
import { Button } from '../ui/Button.jsx';

const URGENT_REASONS = [
  { id: 'cant_hear', label: "Can't hear", icon: VolumeX },
  { id: 'clarification', label: 'Clarification', icon: Info },
  { id: 'other', label: 'Other', icon: Sparkles }
];

export function UrgentConfirmSheet({ isOpen, onClose, onConfirm }) {
  const [selectedReason, setSelectedReason] = useState('cant_hear');

  const handleConfirm = () => {
    onConfirm?.(selectedReason);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Urgent Interruption">
      <div className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 text-rose-400" />
          <div className="space-y-0.5">
            <span className="font-bold block">Interrupt Speaker (5 Seconds Max)</span>
            <span className="text-xs opacity-90 leading-relaxed block">
              Urgent blips duck the stage speaker's microphone to alert the room of sound issues or critical questions.
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
            Select Urgent Issue
          </label>
          <div className="grid grid-cols-3 gap-2">
            {URGENT_REASONS.map(r => {
              const Icon = r.icon;
              const isSelected = selectedReason === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReason(r.id)}
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all min-h-[44px] ${
                    isSelected
                      ? 'bg-rose-500/25 border-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'bg-background border-border text-muted hover:text-white'
                  }`}
                >
                  <Icon size={16} className={isSelected ? 'text-rose-400' : 'text-muted'} />
                  <span className="text-xs font-bold">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Button
            size="huge"
            variant="live"
            onClick={handleConfirm}
            className="w-full min-h-[56px] text-sm font-black uppercase tracking-wider shadow-lg shadow-rose-500/25"
          >
            <Zap size={18} />
            <span>Confirm Urgent Blip (5s)</span>
          </Button>

          <Button
            size="md"
            variant="ghost"
            onClick={onClose}
            className="w-full text-xs text-muted hover:text-white min-h-[44px]"
          >
            Cancel
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
