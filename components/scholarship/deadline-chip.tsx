"use client";

import { CalendarClockIcon } from "lucide-react";

import { useToday } from "@/hooks/use-today";
import { daysUntil, deadlineLabel, deadlineTone } from "@/lib/logic/deadlines";
import { cn } from "@/lib/utils";

const TONE = {
  closed: "border-hairline bg-canvas-soft text-ink-mute",
  urgent: "border-attention/30 bg-attention/8 text-attention-ink",
  soon: "border-indigo/20 bg-indigo/6 text-indigo",
  open: "border-hairline bg-canvas-soft text-ink-mute",
} as const;

/**
 * A deadline countdown. The absolute date renders on the server; the relative
 * "17 days left" is added once the client knows today's date, so a prerendered
 * page can never ship a stale number.
 */
export function DeadlineChip({
  deadline,
  deadlineIso,
  className,
  withIcon = true,
}: {
  deadline: string;
  deadlineIso: string;
  className?: string;
  withIcon?: boolean;
}) {
  const today = useToday();
  const days = today ? daysUntil(deadlineIso, today) : Number.NaN;
  const tone = today ? deadlineTone(days) : "open";

  return (
    <span
      className={cn(
        "t-micro inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        TONE[tone],
        className
      )}
    >
      {withIcon && <CalendarClockIcon className="size-3" aria-hidden="true" />}
      <time dateTime={deadlineIso}>{deadline}</time>
      {today && <span aria-hidden="true">·</span>}
      {today && <span>{deadlineLabel(days)}</span>}
    </span>
  );
}

/** The countdown on its own, for tighter layouts. */
export function DeadlineCountdown({
  deadlineIso,
  className,
}: {
  deadlineIso: string;
  className?: string;
}) {
  const today = useToday();
  if (!today) return null;
  const days = daysUntil(deadlineIso, today);
  const tone = deadlineTone(days);

  return (
    <span
      className={cn(
        "t-micro",
        tone === "urgent" ? "text-attention-ink" : "text-ink-mute",
        className
      )}
    >
      {deadlineLabel(days)}
    </span>
  );
}
