import { useEffect, useState } from 'react';
import { SKELETON_MAX_MS } from '../services/api';

/**
 * Guarantees loading skeletons never persist longer than 15 seconds.
 */
export function useSkeletonCap(isLoading: boolean, maxMs = SKELETON_MAX_MS): boolean {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }
    setTimedOut(false);
    const id = window.setTimeout(() => setTimedOut(true), maxMs);
    return () => window.clearTimeout(id);
  }, [isLoading, maxMs]);

  return isLoading && !timedOut;
}
