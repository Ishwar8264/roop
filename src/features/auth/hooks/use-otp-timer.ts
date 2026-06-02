/**
 * Purpose: Shared OTP countdown timer hook
 * Responsibility: Manage OTP resend cooldown state
 * Important Notes:
 *   - Used by both login-form and register-form
 *   - Returns secondsLeft, isRunning, start(), canResend
 *   - Cleans up interval on unmount
 */

import { useState, useEffect, useCallback } from "react";

export function useOtpTimer(initialSeconds: number = 30) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const start = useCallback(() => {
    setSecondsLeft(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) {
      setIsRunning(false);
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  return { secondsLeft, isRunning, start, canResend: !isRunning && secondsLeft === 0 };
}
