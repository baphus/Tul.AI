"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-media-query";

const PIECES = [
  [5, 18, "#9fe870"], [12, 5, "#0e0f0c"], [19, 24, "#e8ebe6"], [27, 10, "#9fe870"],
  [34, 19, "#0e0f0c"], [42, 7, "#e8ebe6"], [49, 23, "#9fe870"], [57, 12, "#0e0f0c"],
  [64, 4, "#e8ebe6"], [71, 22, "#9fe870"], [78, 9, "#0e0f0c"], [85, 17, "#e8ebe6"],
  [92, 6, "#9fe870"], [96, 25, "#0e0f0c"],
] as const;

/** One celebratory arrival after a completed matching run, never on a revisit. */
export function MatchCelebration() {
  const reduced = usePrefersReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem("tul-ai:match-celebration") !== "1") return;
    if (reduced) {
      window.sessionStorage.removeItem("tul-ai:match-celebration");
      return;
    }

    // Delay to the next task so Strict Mode can clean up the first effect pass
    // without consuming the one-time celebration token.
    const start = window.setTimeout(() => {
      window.sessionStorage.removeItem("tul-ai:match-celebration");
      setShow(true);
    }, 0);
    return () => window.clearTimeout(start);
  }, [reduced]);

  useEffect(() => {
    if (!show) return;
    const timer = window.setTimeout(() => setShow(false), 2_200);
    return () => window.clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-60 overflow-hidden" aria-hidden="true">
      {PIECES.map(([left, delay, color], index) => (
        <span
          key={index}
          className="match-confetti-piece absolute top-[-1.5rem] block size-2 rounded-xs"
          style={{
            left: `${left}%`,
            backgroundColor: color,
            animationDelay: `${delay * 9}ms`,
            "--confetti-drift": `${(index % 2 === 0 ? -1 : 1) * (18 + (index % 4) * 9)}px`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
