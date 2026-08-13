"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribe to a media query. Returns `false` on the server and for the first
 * client paint, so anything gated on this must degrade to the mobile layout —
 * which is the layout the design is authored at anyway.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

/** The `lg` breakpoint — where the desktop surfaces take over from the phone UI. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

/** OS-level motion preference. The in-app toggle is ORed on top of this. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
