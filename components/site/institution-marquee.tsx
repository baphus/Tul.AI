import { ShieldCheckIcon, ShieldQuestionMarkIcon } from "lucide-react";

import { ProviderCrest } from "@/components/scholarship/provider-logo";
import { formatPeso } from "@/lib/logic/format";
import type { Scholarship } from "@/lib/scholarships";

/**
 * The coverage marquee — three lanes of institutions and what each of them
 * publishes, drifting downward at different speeds.
 *
 * Wise puts a wall of country flags here, because its coverage claim is scale.
 * Ours is the opposite claim: the whole data set fits on the screen, so the
 * marquee shows every record we hold rather than a sample of a larger index,
 * and the caption beside it says so. Each lane carries all of them in a
 * different rotation, which is what keeps three lanes from reading as clones.
 *
 * `aria-hidden` for the same reason DeckPreview is: this is decorative
 * repetition. Every record here is reachable in full from the directory link
 * that sits beside it, and each record's verification state is stated on its
 * own page — nothing here is the only place a claim appears.
 */

/** Each lane starts at a different record and runs at its own speed. */
const LANES: { offset: number; duration: string; className: string }[] = [
  { offset: 0, duration: "46s", className: "" },
  { offset: 2, duration: "61s", className: "hidden sm:block" },
  { offset: 4, duration: "52s", className: "hidden lg:block" },
];

/** Rotate so lane 2 doesn't start on the same record as lane 1. */
function rotate<T>(items: readonly T[], by: number): T[] {
  return items.map((_, i) => items[(i + by) % items.length]);
}

function Row({ card, index }: { card: Scholarship; index: number }) {
  const confirmed = card.verification === "Verified";
  const Icon = confirmed ? ShieldCheckIcon : ShieldQuestionMarkIcon;

  return (
    /* Margin, not gap: the track is two identical copies and the animation
       translates it by exactly half its height, so every row — including the
       last of a copy — has to carry the same trailing space or the loop
       visibly steps. */
    <div className="mb-3.5 rounded-xl bg-canvas p-4">
      <div className="flex items-center gap-3">
        <ProviderCrest index={index} provider={card.provider} className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="t-micro truncate text-ink-mute">{card.provider}</p>
          <p className="t-caption-strong truncate text-ink">{card.title}</p>
        </div>
      </div>

      <div className="mt-3.5 flex items-baseline justify-between gap-3 border-t border-hairline pt-3">
        <p className="t-caption-strong t-num text-ink">
          {formatPeso(card.amount)}{" "}
          <span className="t-micro text-ink-mute">{card.amountNote}</span>
        </p>
        <p
          className={`t-micro inline-flex flex-none items-center gap-1 ${
            confirmed ? "text-met" : "text-attention-ink"
          }`}
        >
          <Icon className="size-3" />
          {confirmed ? "Verified" : "Needs check"}
        </p>
      </div>
    </div>
  );
}

export function InstitutionMarquee({ cards }: { cards: readonly Scholarship[] }) {
  /* Carry the original index with each record: ProviderCrest derives its tint
     from position in the data set, so rotating a lane must not re-tint. */
  const indexed = cards.map((card, index) => ({ card, index }));

  return (
    <div
      aria-hidden="true"
      className="marquee grid h-88 grid-cols-1 gap-3.5 overflow-hidden motion-reduce:hidden sm:h-104 sm:grid-cols-2 md:h-120 lg:grid-cols-3"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, #000 13%, #000 87%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, #000 13%, #000 87%, transparent 100%)",
      }}
    >
      {LANES.map((lane) => {
        const rows = rotate(indexed, lane.offset);
        return (
          <div key={lane.offset} className={lane.className}>
            <div
              className="marquee-lane flex flex-col"
              style={{ animationDuration: lane.duration }}
            >
              {/* Two copies: the animation translates a full copy's height,
                  so the second one is always covering the gap the first
                  leaves as it exits. */}
              {[0, 1].map((copy) =>
                rows.map(({ card, index }) => (
                  <Row key={`${copy}-${card.id}`} card={card} index={index} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The reduced-motion branch. The global `prefers-reduced-motion` rule in
 * globals.css already stops the lanes, but a stopped lane is still a masked,
 * clipped column — an accident that happens to look acceptable rather than a
 * designed state. This is the designed state: the same records, all of them,
 * as a plain grid. Exactly one of the two branches is ever displayed.
 */
export function InstitutionList({ cards }: { cards: readonly Scholarship[] }) {
  return (
    <ul className="hidden gap-3.5 motion-reduce:grid sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <li key={card.id}>
          <Row card={card} index={index} />
        </li>
      ))}
    </ul>
  );
}
