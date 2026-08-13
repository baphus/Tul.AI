import { CheckIcon, HelpCircleIcon, TriangleAlertIcon } from "lucide-react";

import type { RequirementState } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

const ICON = {
  ok: CheckIcon,
  warn: TriangleAlertIcon,
  none: HelpCircleIcon,
} as const;

const TONE: Record<RequirementState, string> = {
  ok: "bg-met text-white",
  warn: "bg-attention text-white",
  none: "border border-hairline-dark/35 bg-canvas text-ink-mute",
};

/**
 * Requirement met / needs attention / unknown.
 *
 * `none` is deliberately its own state with its own words: an unknown
 * requirement is never rendered as a failed one (AGENTS.md §3). Colour is never
 * the only signal — each mark carries a drawn icon and a screen-reader label.
 */
const LABEL: Record<RequirementState, string> = {
  ok: "Requirement met",
  warn: "Needs attention",
  none: "Not published — unknown",
};

export function RequirementMark({
  state,
  className,
  size = "md",
}: {
  state: RequirementState;
  className?: string;
  size?: "sm" | "md";
}) {
  const Icon = ICON[state];

  return (
    <span
      className={cn(
        "flex flex-none items-center justify-center rounded-full",
        size === "sm" ? "size-4" : "size-5",
        TONE[state],
        className
      )}
    >
      <Icon
        className={size === "sm" ? "size-2.5" : "size-3"}
        strokeWidth={state === "ok" ? 3 : 2.25}
        aria-hidden="true"
      />
      <span className="sr-only">{LABEL[state]}</span>
    </span>
  );
}

export function requirementLabel(state: RequirementState): string {
  return LABEL[state];
}
