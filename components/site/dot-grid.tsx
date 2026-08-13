"use client";

import { gsap } from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { cn } from "@/lib/utils";

/**
 * DotGrid — the React Bits interactive dot field, adapted for this codebase.
 *
 * Deviations from the upstream source, all deliberate:
 *
 *  1. Root is an `aria-hidden` div, not a `<section>`. It is decoration sitting
 *     inside a real section; a nested landmark would put an empty, unlabelled
 *     region in the accessibility tree.
 *  2. No companion `.css` file. Three rules is not worth the first stylesheet
 *     import in a repo that has none — they are Tailwind classes below.
 *  3. `prefers-reduced-motion` renders one static frame and binds no pointer
 *     listeners. The global reduced-motion rule in globals.css only reaches CSS
 *     animation; a requestAnimationFrame loop ignores it entirely, so an
 *     unguarded canvas is the one thing on this site that would keep moving for
 *     a user who asked everything to stop.
 *  4. An IntersectionObserver stops the loop while the grid is off-screen.
 *     Upstream redraws every dot every frame for the life of the page — on the
 *     landing page that is a rAF loop burning through eleven sections the user
 *     has scrolled past.
 *  5. Colours default to the design system: `--hairline` dots that read as
 *     texture on the sage band, brightening to brand lime near the pointer.
 *
 * Judgment call worth recording (AGENTS.md §10): DESIGN.md reserves lime for
 * CTAs. Using it as the proximity colour here is decoration, not a second
 * accent and not a status signal — the palette stays at one accent. If that
 * reads as diluting the CTA, pass `activeColor="#454745"` and the field becomes
 * a purely tonal ripple.
 */

gsap.registerPlugin(InertiaPlugin);

interface Dot {
  cx: number;
  cy: number;
  xOffset: number;
  yOffset: number;
  _inertiaApplied: boolean;
}

export interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  speedTrigger?: number;
  shockRadius?: number;
  shockStrength?: number;
  maxSpeed?: number;
  resistance?: number;
  returnDuration?: number;
  className?: string;
}

function throttle(fn: (event: MouseEvent) => void, limit: number) {
  let last = 0;
  return (event: MouseEvent) => {
    const now = performance.now();
    if (now - last >= limit) {
      last = now;
      fn(event);
    }
  };
}

/*
 * The motion preference is an external store, so it is read through the hook
 * built for external stores rather than mirrored into state from an effect.
 * These live at module scope because useSyncExternalStore resubscribes whenever
 * `subscribe` changes identity.
 */
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getMotionSnapshot = () => window.matchMedia(MOTION_QUERY).matches;

/** The server has no way to know, so it renders the still grid. */
const getMotionServerSnapshot = () => true;

function hexToRgb(hex: string) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

export function DotGrid({
  dotSize = 5,
  gap = 28,
  baseColor = "#d3d8cf",
  activeColor = "#9fe870",
  proximity = 130,
  speedTrigger = 100,
  shockRadius = 250,
  shockStrength = 5,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.5,
  className,
}: DotGridProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const pointerRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0,
  });

  const reduced = useSyncExternalStore(
    subscribeMotion,
    getMotionSnapshot,
    getMotionServerSnapshot
  );
  const [inView, setInView] = useState(false);
  /* Starts still, both server-side and on the first client frame. Motion begins
     only once we know the user accepts it and the grid is actually on screen. */
  const animate = inView && !reduced;

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === "undefined" || !window.Path2D) return null;
    const p = new Path2D();
    p.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    return p;
  }, [dotSize]);

  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;

    const startX = (width - (cell * cols - gap)) / 2 + dotSize / 2;
    const startY = (height - (cell * rows - gap)) / 2 + dotSize / 2;

    const dots: Dot[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        dots.push({
          cx: startX + x * cell,
          cy: startY + y * cell,
          xOffset: 0,
          yOffset: 0,
          _inertiaApplied: false,
        });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  /** One frame. Called by the loop, and on its own for the static cases. */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !circlePath) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const proxSq = proximity * proximity;
    const { x: px, y: py } = pointerRef.current;

    for (const dot of dotsRef.current) {
      const dx = dot.cx - px;
      const dy = dot.cy - py;
      const dsq = dx * dx + dy * dy;

      let fill = baseColor;
      if (dsq <= proxSq) {
        const t = 1 - Math.sqrt(dsq) / proximity;
        const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
        const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
        const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
        fill = `rgb(${r},${g},${b})`;
      }

      ctx.save();
      ctx.translate(dot.cx + dot.xOffset, dot.cy + dot.yOffset);
      ctx.fillStyle = fill;
      ctx.fill(circlePath);
      ctx.restore();
    }
  }, [activeRgb, baseColor, baseRgb, circlePath, proximity]);

  /* On screen or not. */
  useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "120px" }
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  /* Grid geometry, rebuilt on resize. Redraws immediately so the static cases
     survive a resize without waiting for a frame that never comes. */
  useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    const rebuild = () => {
      buildGrid();
      draw();
    };
    rebuild();
    const ro = new ResizeObserver(rebuild);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [buildGrid, draw]);

  /* The loop. */
  useEffect(() => {
    if (!animate) {
      draw();
      return;
    }
    let rafId = 0;
    const frame = () => {
      draw();
      rafId = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(rafId);
  }, [animate, draw]);

  /* Pointer inertia and the click shockwave. Bound only while animating, so a
     reduced-motion visitor never triggers either. */
  useEffect(() => {
    if (!animate) return;

    const nudge = (dot: Dot, pushX: number, pushY: number) => {
      dot._inertiaApplied = true;
      gsap.killTweensOf(dot);
      gsap.to(dot, {
        inertia: { xOffset: pushX, yOffset: pushY, resistance },
        onComplete: () => {
          gsap.to(dot, {
            xOffset: 0,
            yOffset: 0,
            duration: returnDuration,
            ease: "elastic.out(1,0.75)",
          });
          dot._inertiaApplied = false;
        },
      });
    };

    const onMove = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const now = performance.now();
      const pr = pointerRef.current;
      const dt = pr.lastTime ? now - pr.lastTime : 16;
      let vx = ((event.clientX - pr.lastX) / dt) * 1000;
      let vy = ((event.clientY - pr.lastY) / dt) * 1000;
      let speed = Math.hypot(vx, vy);
      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        speed = maxSpeed;
      }
      pr.lastTime = now;
      pr.lastX = event.clientX;
      pr.lastY = event.clientY;
      pr.vx = vx;
      pr.vy = vy;
      pr.speed = speed;

      const rect = canvas.getBoundingClientRect();
      pr.x = event.clientX - rect.left;
      pr.y = event.clientY - rect.top;

      if (speed <= speedTrigger) return;
      for (const dot of dotsRef.current) {
        if (dot._inertiaApplied) continue;
        if (Math.hypot(dot.cx - pr.x, dot.cy - pr.y) >= proximity) continue;
        nudge(dot, dot.cx - pr.x + vx * 0.005, dot.cy - pr.y + vy * 0.005);
      }
    };

    const onClick = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = event.clientX - rect.left;
      const cy = event.clientY - rect.top;

      for (const dot of dotsRef.current) {
        if (dot._inertiaApplied) continue;
        const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
        if (dist >= shockRadius) continue;
        const falloff = Math.max(0, 1 - dist / shockRadius);
        nudge(
          dot,
          (dot.cx - cx) * shockStrength * falloff,
          (dot.cy - cy) * shockStrength * falloff
        );
      }
    };

    const throttledMove = throttle(onMove, 50);
    window.addEventListener("mousemove", throttledMove, { passive: true });
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("mousemove", throttledMove);
      window.removeEventListener("click", onClick);
    };
  }, [
    animate,
    maxSpeed,
    proximity,
    resistance,
    returnDuration,
    shockRadius,
    shockStrength,
    speedTrigger,
  ]);

  return (
    <div
      aria-hidden="true"
      ref={wrapperRef}
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
