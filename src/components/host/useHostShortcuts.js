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
  muteSpeaker
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
        if (isQrOpen) setIsQrOpen(false);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isEndConfirmOpen) setIsEndConfirmOpen(false);
        else if (floor) revoke(floor.id);
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setIsQrOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [queue, floor, isMuted, isQrOpen, isSettingsOpen, isEndConfirmOpen, grant, revoke, muteSpeaker, setIsQrOpen, setIsSettingsOpen, setIsEndConfirmOpen]);
}
