import { requirementMetric } from "@/lib/logic/format";
import type { Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

/**
 * The requirement metric: one segment per published requirement, filled for the
 * ones this profile satisfies, with the count and its plain percentage spelled
 * out. Arithmetic over structured data — never a model confidence score
 * (AGENTS.md §3, PRD §19).
 */
export function MatchMetric({
  card,
  className,
  showLabel = true,
}: {
  card: Pick<Scholarship, "met" | "total" | "tone" | "match">;
  className?: string;
  showLabel?: boolean;
}) {
  const { met, total, pct, tone } = requirementMetric(card);
  const fill = tone === "strong" ? "bg-met" : "bg-attention";
  const label = `${met} of ${total} requirements met · ${pct}%`;

  return (
    <div className={className}>
      <div className="flex gap-1" role="img" aria-label={`${card.match}. ${label}`}>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < met ? fill : "bg-hairline"
            )}
          />
        ))}
      </div>
      {showLabel && (
        <p className="t-micro t-num mt-2 text-ink-mute" aria-hidden="true">
          {label}
        </p>
      )}
    </div>
  );
}

/** The bucketed match label. Only these four categories exist (PRD §19). */
export function MatchBadge({
  card,
  className,
}: {
  card: Pick<Scholarship, "match" | "tone">;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "t-micro inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        card.tone === "strong"
          ? "border-met/25 bg-met/8 text-met"
          : "border-attention/25 bg-attention/8 text-attention-ink",
        className
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          card.tone === "strong" ? "bg-met" : "bg-attention"
        )}
        aria-hidden="true"
      />
      {card.match}
    </span>
  );
}
