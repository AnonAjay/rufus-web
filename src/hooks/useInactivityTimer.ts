import { useEffect, useRef, useCallback } from "react";

export interface UseInactivityTimerOptions {
  timeoutMs?: number;
  enabled?: boolean;
  onTimeout: () => void;
  onActivity?: () => void;
}

/**
 * Custom hook to monitor user & agent inactivity.
 * Automatically triggers onTimeout after `timeoutMs` without user interaction or agent activity.
 */
export const useInactivityTimer = ({
  timeoutMs = 15000,
  enabled = true,
  onTimeout,
  onActivity,
}: UseInactivityTimerOptions) => {
  const timerRef = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!enabled) return;

    onActivity?.();

    timerRef.current = window.setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  }, [enabled, timeoutMs, onTimeout, onActivity]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    resetTimer();

    const handleUserActivity = () => {
      resetTimer();
    };

    // Attach passive listeners for mouse and keyboard interactions
    window.addEventListener("mousemove", handleUserActivity, { passive: true });
    window.addEventListener("mousedown", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });
    window.addEventListener("touchstart", handleUserActivity, { passive: true });

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("mousedown", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
    };
  }, [enabled, resetTimer]);

  return { resetTimer };
};
