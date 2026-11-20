import { useEffect } from 'react';

export function useHostShortcuts({
  queue,
  floor,
  isMuted,
  isQrOpen,
  setIsQrOpen,
  isSettingsOpen,
  setIsSettingsOpen,
  isEndConfirmOpen,
  setIsEndConfirmOpen,
  grant,
  revoke,
  muteSpeaker,
  anyDrawerOpen = false,
  onToggleDiagnostics,
  onToggleMessages,
  onToggleSettings,
  onToggleAnnounce
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'g' || e.key === 'G') {
        if (queue.length > 0) { e.preventDefault(); grant(queue[0].id); }
      } else if (e.key === 'm' || e.key === 'M') {
        if (floor) { e.preventDefault(); muteSpeaker(!isMuted); }
      } else if (e.key === 'Escape') {
        // Esc only closes overlays. It never ends the floor: that needs the
        // two-step End floor button so a stray key cannot cut a speaker.
        if (anyDrawerOpen) return;
        if (isQrOpen) setIsQrOpen(false);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isEndConfirmOpen) setIsEndConfirmOpen(false);
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault(); onToggleDiagnostics?.();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault(); onToggleMessages?.();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault(); onToggleSettings?.();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault(); onToggleAnnounce?.();
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setIsQrOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [queue, floor, isMuted, isQrOpen, isSettingsOpen, isEndConfirmOpen, grant, revoke, muteSpeaker, setIsQrOpen, setIsSettingsOpen, setIsEndConfirmOpen, anyDrawerOpen, onToggleDiagnostics, onToggleMessages, onToggleSettings, onToggleAnnounce]);
}
