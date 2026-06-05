/**
 * Purpose: Mobile viewport hook
 * Responsibility: Report whether the current viewport is below the mobile breakpoint
 * Important Notes:
 *   - Uses useSyncExternalStore so viewport changes are subscription-driven
 *   - Server snapshot is false to keep hydration deterministic
 */

import * as React from "react"

const MOBILE_BREAKPOINT = 768

function getIsMobile() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerIsMobile() {
  return false
}

function subscribeToMobile(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobile,
    getIsMobile,
    getServerIsMobile
  )
}
