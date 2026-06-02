/**
 * Purpose: OTP countdown timer hook — React 19 safe
 * Responsibility: Manage OTP resend cooldown without setState in effect
 * Important Notes:
 *   - Uses useRef for interval — NO setState inside useEffect body
 *   - Derives `isRunning` from secondsLeft > 0 (no separate state)
 *   - Cleans up interval on unmount or when timer reaches 0
 */

import { useState, useRef, useCallback, useEffect } from "react";

export function useOtpTimer(initialSeconds: number = 30) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRunning = secondsLeft > 0;
  const canResend = secondsLeft === 0;

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    setSecondsLeft(initialSeconds);
  }, [initialSeconds, stop]);

  // Single effect: sets up interval when isRunning becomes true
  // The interval callback decrements and auto-stops at 0
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]); // Only depends on isRunning — no setState inside effect body

  return { secondsLeft, isRunning, start, canResend };
}
