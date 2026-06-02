/**
 * @file OTP countdown timer hook — React 19 safe, zero setState-in-effect
 *
 * PURPOSE:
 *   Manages the cooldown timer shown after sending an OTP.
 *   The user must wait N seconds before they can request a new OTP.
 *
 * WHY NOT A SIMPLE useEffect?
 *   React 19 strict-mode flags `setState` inside useEffect as a potential
 *   cascading-render hazard. This hook avoids that ENTIRELY by:
 *   1. Using a `useRef` to store the countdown value (no re-render on tick)
 *   2. Using a `useRef` for the interval ID (no cleanup dependency)
 *   3. Only calling `setState` from inside the interval callback (async, not
 *      synchronous inside the effect body)
 *   4. The `isRunning` flag is a ref, not derived state — no effect dep cycle
 *
 * API:
 *   - start()  → resets the countdown to `initialSeconds` and begins ticking
 *   - secondsLeft → reactive state that updates every second (for UI display)
 *   - isRunning   → true while the timer is actively counting down
 *   - canResend   → true when the timer has finished (user can request again)
 */

import { useState, useRef, useCallback } from "react";

export function useOtpTimer(initialSeconds: number = 30) {
  /** Reactive seconds value — only updated by the interval callback */
  const [secondsLeft, setSecondsLeft] = useState(0);

  /** Ref that mirrors secondsLeft without triggering re-renders */
  const countRef = useRef(0);

  /** Ref for the setInterval ID so we can clear it */
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Whether the timer is currently running (derived from secondsLeft > 0) */
  const isRunning = secondsLeft > 0;

  /** Whether the user can request a new OTP (timer has finished) */
  const canResend = secondsLeft === 0;

  /** Stop the interval and reset internal ref */
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    countRef.current = 0;
  }, []);

  /**
   * Start (or restart) the countdown.
   *
   * HOW IT WORKS:
   *   1. Clears any existing interval (prevents double-tick bugs)
   *   2. Sets the reactive state to `initialSeconds` (triggers re-render → UI shows countdown)
   *   3. Stores the same value in countRef (for interval to read without closure issues)
   *   4. Starts a 1-second interval that:
   *      - Decrements countRef
   *      - If countRef > 0: updates reactive state (triggers UI re-render)
   *      - If countRef <= 0: stops the interval + sets state to 0 (timer done)
   *
   * IMPORTANT: `setSecondsLeft` is called INSIDE the interval callback,
   * which is asynchronous — NOT synchronous inside a useEffect body.
   * This is why it doesn't trigger the `react-hooks/set-state-in-effect` rule.
   */
  const start = useCallback(() => {
    stop();
    setSecondsLeft(initialSeconds);
    countRef.current = initialSeconds;

    intervalRef.current = setInterval(() => {
      countRef.current -= 1;

      if (countRef.current > 0) {
        setSecondsLeft(countRef.current);
      } else {
        /* Timer finished — clean up everything */
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setSecondsLeft(0);
      }
    }, 1000);
  }, [initialSeconds, stop]);

  return { secondsLeft, isRunning, start, canResend };
}
