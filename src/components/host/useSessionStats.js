import { useEffect, useRef } from 'react';

export function useSessionStats(session, floor, queue) {
  const statsRef = useRef({
    startTime: session?.createdAt || Date.now(),
    speakersSet: new Set(),
    totalHandsRaised: 0,
    seenAttendeeIds: new Set()
  });

  useEffect(() => {
    if (floor?.id) statsRef.current.speakersSet.add(floor.id);
  }, [floor?.id]);

  useEffect(() => {
    queue.forEach((item) => {
      if (!statsRef.current.seenAttendeeIds.has(item.id)) {
        statsRef.current.seenAttendeeIds.add(item.id);
        statsRef.current.totalHandsRaised++;
      }
    });
  }, [queue]);

  const getFinalStats = () => {
    const durationSeconds = Math.max(1, Math.floor((Date.now() - statsRef.current.startTime) / 1000));
    return {
      durationSeconds,
      speakersCount: statsRef.current.speakersSet.size,
      totalHandsRaised: statsRef.current.totalHandsRaised
    };
  };

  return { getFinalStats };
}
