import { ProviderCrest } from "@/components/scholarship/provider-logo";
import { formatPeso } from "@/lib/logic/format";
import type { Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

/**
 * The pill that sits in the middle of the hero photograph — Wise's
 * "🇺🇸 Received · 500 USD" chip, with the institution's crest where the flag
 * goes and what that institution publishes where the currency goes.
 *
 * One pill, fixed in place. The crest and the amount are the only things that
 * move: each is a stack of faces that folds down from its top edge, holds, then
 * keeps folding down and out as the next one arrives — a flip-clock flap. The
 * two stacks share the same keyframes and the same per-slot delay, so the crest
 * and the amount always turn over together and can never show CHED's logo above
 * OWWA's figure. "Offers" is outside both stacks, so it stays still.
 *
 * SLOTS is fixed at six because the keyframe percentages in globals.css encode
 * it (100/6 per slot). The data set is cycled to fill exactly six faces, so a
 * data set of any size renders without gaps and the CSS cannot drift from it.
 *
 * `aria-hidden`, like DeckPreview and the marquee: decorative repetition of
 * amounts stated as text in the sections below and in full on each record's own
 * page. "Offers" describes what the provider publishes — never a claim that the
 * reader would receive it (AGENTS.md §3).
 */

/** Must match the slot percentages in `.flip-face`'s keyframes. */
const SLOTS = 6;
/** Seconds each face holds. SLOTS × this is the cycle length in globals.css. */
const SLOT_SECONDS = 3;

/**
 * The verb, per slot — it turns over with the crest and the figure.
 *
 * Every one of these describes what the *provider* published, never what the
 * reader will get: "Offers ₱20,000" is a fact about Inquirer Foundation's
 * notice. Nothing here may drift into "Gives you" or "You receive" — that would
 * be the promised-outcome copy AGENTS.md §3 rules out, in the most prominent
 * element on the page.
 */
const LABELS = ["Offers", "Grants", "Awards", "Publishes", "Provides", "Funds"];

export function OfferPills({
  cards,
  className,
}: {
  cards: readonly Scholarship[];
  className?: string;
}) {
  if (cards.length === 0) return null;

  /*
   * One record per institution. The data set holds several near-identical
   * records from the same body — three BFAR programmes at ₱7,000 sit
   * consecutively — and without this the pill spent half its rotation appearing
   * not to change.
   *
   * Exact provider strings are not enough: "…(BFAR) – Department of Agriculture
   * (DA)" and the same followed by "in partnership with NCIP" are different
   * strings but one institution, and this pill shows only a crest and a figure,
   * so a viewer cannot tell them apart. The key keeps the lead body and drops
   * the programme/partner qualifier after a dash or "in partnership with".
   */
  const institutions = new Map<string, { card: Scholarship; index: number }>();
  cards.forEach((card, index) => {
    const key = card.provider
      .toLowerCase()
      .split(/\s+[–-]\s+|\s+in partnership with\s+/)[0]
      .trim();
    const current = institutions.get(key);

    /* Several records can represent one provider. Keep its published crest
       when one exists; the first matching programme may not include a logo. */
    if (!current || (!current.card.logo && card.logo)) {
      institutions.set(key, { card, index });
    }
  });
  const distinct = [...institutions.values()];

  /*
   * Institutions that published a crest go first.
   *
   * Six of the 32 records carry no logo, and the data set happens to open with
   * one of them — so the pill's first face, the one on screen for the first
   * three seconds and the one the reduced-motion fallback freezes on, was
   * rendering as the monogram "IF" rather than a recognisable mark. There are
   * plenty of logo-bearing institutions to fill six slots; the monogram is a
   * fallback for records, not a thing to lead with.
   */
  const ordered = [
    ...distinct.filter(({ card }) => card.logo),
    ...distinct.filter(({ card }) => !card.logo),
  ];

  /* Six faces, cycling if fewer institutions are available. The index carried
     here is the record's position in the full data set, because ProviderCrest
     derives its tint from that and must not re-tint per slot. */
  const faces = Array.from({ length: SLOTS }, (_, slot) => {
    const { card, index } = ordered[slot % ordered.length];
    return { card, index, slot };
  });

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 grid place-items-center",
        className
      )}
    >
      <div className="flex w-80 items-center gap-3 rounded-full bg-canvas py-2 pr-5 pl-2 shadow-[0_12px_32px_-14px_rgba(14,15,12,0.5)] sm:w-96 sm:gap-4 sm:py-2.5 sm:pr-7 sm:pl-2.5">
        {/*
         * Crest well — a landscape plate, not the circle Wise uses for its
         * country flags. Five of the sixteen published crests are wide
         * wordmarks (aboitiz.png is 584×206, ayala.png 1681×669); in a circular
         * 36px well, `object-contain` scaled those to a ~13px-tall sliver.
         * Institution logos are mostly horizontal lockups, so the well is too.
         * Fixed size, so the pill never reflows mid-flip.
         */}
        <span
          className="relative block h-9 w-14 flex-none sm:h-10 sm:w-16"
          style={{ perspective: "600px" }}
        >
          {faces.map(({ card, index, slot }) => (
            <span
              key={`${slot}-${card.id}`}
              className="flip-face absolute inset-0 motion-reduce:hidden"
              style={{ animationDelay: `${slot * SLOT_SECONDS}s` }}
            >
              <ProviderCrest
                index={index}
                provider={card.provider}
                logo={card.logo}
                className="size-full rounded-lg"
              />
            </span>
          ))}
          {/* Reduced motion: one crest, held. The global reduced-motion rule
              collapses every animation to its end state, which for these faces
              is "folded away" — so without this the pill would render empty. */}
          <span className="absolute inset-0 hidden motion-reduce:block">
            <ProviderCrest
              index={faces[0].index}
              provider={faces[0].card.provider}
              logo={faces[0].card.logo}
              className="size-full rounded-lg"
            />
          </span>
        </span>

        {/* Label well. Fixed width so the amount never shifts as the verb
            changes length, and h-6 to match t-body-strong's line box. */}
        <span
          className="relative block h-6 w-20 flex-none sm:w-24"
          style={{ perspective: "600px" }}
        >
          {faces.map(({ card, slot }) => (
            <span
              key={`${slot}-${card.id}`}
              className="flip-face t-body-strong absolute inset-0 text-left text-ink motion-reduce:hidden"
              style={{ animationDelay: `${slot * SLOT_SECONDS}s` }}
            >
              {LABELS[slot % LABELS.length]}
            </span>
          ))}
          <span className="t-body-strong absolute inset-0 hidden text-left text-ink motion-reduce:block">
            {LABELS[0]}
          </span>
        </span>

        {/* Amount well. h-6 matches t-body-strong's 1.5rem line box, so the
            absolutely-stacked faces sit exactly where a static line would. */}
        <span
          className="relative block h-6 flex-1"
          style={{ perspective: "600px" }}
        >
          {faces.map(({ card, slot }) => (
            <span
              key={`${slot}-${card.id}`}
              className="flip-face t-body-strong t-num absolute inset-0 text-right text-ink motion-reduce:hidden"
              style={{ animationDelay: `${slot * SLOT_SECONDS}s` }}
            >
              {formatPeso(card.amount)}
            </span>
          ))}
          <span className="t-body-strong t-num absolute inset-0 hidden text-right text-ink motion-reduce:block">
            {formatPeso(faces[0].card.amount)}
          </span>
        </span>
      </div>
    </div>
  );
}
