"use client";

import { SparklesIcon } from "lucide-react";

import { TulAiChat } from "@/components/app/tul-ai-chat";
import { ScholarshipSummaryCard } from "@/components/scholarship/scholarship-summary-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { useTulAi } from "@/hooks/use-tul-ai";
import { advisory, type Decision } from "@/lib/logic/advisory";
import { rankScholarships } from "@/lib/logic/matching";
import { ROUTES } from "@/lib/logic/routes";
import type { Scholarship } from "@/lib/scholarships";

/**
 * Review before applying. The dashboard focuses on the scholarships a student
 * has prioritized, while the complete public directory remains one click away.
 */
export function ReviewList() {
  const { state, dispatch, cards, ready } = useTulAi();

  const group = (want: Decision) =>
    cards
      .map((card, index) => ({ card, index }))
      .filter((row) => state.decisions[row.index] === want);

  const saved = group("yes");
  const passed = group("no");
  const advice = advisory(state.decisions);
  const recommendedMatches = rankScholarships(cards, state.profile).filter((match) => match.tone !== "none");
  const recommendedCards = recommendedMatches
    .map((match) => cards.find((card) => card.id === match.id))
    .filter((card): card is Scholarship => Boolean(card));

  if (ready && cards.length === 0) {
    return (
      <div className="mx-auto max-w-[34rem] py-16 text-center">
        <h1 className="t-display-lg text-balance">You haven&apos;t sorted anything yet.</h1>
        <p className="t-body mt-4 text-ink-mute text-pretty">
          Go through the deck once and this becomes your shortlist — with the deadlines,
          overlapping documents and anything worth knowing before you apply.
        </p>
        <ButtonLink className="mt-8 h-12 rounded-md px-6" href={ROUTES.discover}>
          Open the deck
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="py-10">
      <h1 className="t-display-xl text-balance">Your scholarship dashboard.</h1>
      <p className="hidden">
        You put {saved.length} of {cards.length} near the top. Nothing was discarded — the
        rest sit below and can move up at any time.
      </p>
      <p className="t-body-lg mt-4 max-w-[36rem] text-ink-mute text-pretty">
        {saved.length + passed.length > 0
          ? `You put ${saved.length} of ${cards.length} near the top. Nothing was discarded — the rest can move up at any time.`
          : "You’ve explored your matched scholarships. Review their published details, keep the ones that matter most, and return whenever your profile changes."}
      </p>

      {advice && (
        <div className="mt-8 flex gap-3.5 rounded-lg border border-hairline bg-canvas-soft p-5">
          <span
            className="grid size-7 flex-none place-items-center rounded-md bg-ink text-white"
            aria-hidden="true"
          >
            <SparklesIcon className="size-3.5" />
          </span>
          <div>
            <p className="t-body-strong">{advice.title}</p>
            <p className="t-caption mt-1.5 text-ink-mute text-pretty">{advice.text}</p>
          </div>
        </div>
      )}

      <TulAiChat
        complete
        placement="dashboard"
        matches={recommendedMatches}
        matchedCards={recommendedCards}
      />

      <div className="mt-12 flex flex-col gap-12">
        <Group
          title="Top of your list"
          count={saved.length}
          empty="Nothing here yet. Anything you move up from below appears in this list."
          rows={saved}
          moveLabel="Move to lower priority"
          onMove={(index) => dispatch({ type: "MOVE", index })}
        />

        <Group
          title="Lower priority"
          count={passed.length}
          empty="Everything is at the top of your list."
          rows={passed}
          moveLabel="Move up"
          onMove={(index) => dispatch({ type: "MOVE", index })}
          muted
        />
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-3 border-t border-hairline pt-8">
        <ButtonLink className="h-12 rounded-md px-6" href={ROUTES.scholarships}>
          Browse all scholarships
        </ButtonLink>
        <ButtonLink
          variant="outline"
          className="h-12 rounded-md border-hairline-dark px-5"
          href={ROUTES.discover}
        >
          Back to the deck
        </ButtonLink>
      </div>
      <p className="t-micro mt-4 text-ink-mute">
        Meeting published requirements does not guarantee selection. Each provider makes
        its own decision.
      </p>
    </div>
  );
}

function Group({
  title,
  count,
  empty,
  rows,
  moveLabel,
  onMove,
  muted = false,
}: {
  title: string;
  count: number;
  empty: string;
  rows: { card: Scholarship; index: number }[];
  moveLabel: string;
  onMove: (index: number) => void;
  muted?: boolean;
}) {
  return (
    <section aria-labelledby={`group-${title.replace(/\s+/g, "-").toLowerCase()}`}>
      <div className="flex items-baseline gap-3">
        <h2
          id={`group-${title.replace(/\s+/g, "-").toLowerCase()}`}
          className="t-display-md"
        >
          {title}
        </h2>
        <span className="t-micro t-num text-ink-mute">{count}</span>
      </div>

      {rows.length === 0 ? (
        empty && (
          <p className="t-caption mt-4 rounded-lg border border-dashed border-hairline-dark/25 p-5 text-ink-mute">
            {empty}
          </p>
        )
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {rows.map(({ card, index }) => (
            <li key={card.id}>
              <ScholarshipSummaryCard
                card={card}
                index={index}
                muted={muted}
                actions={
                  <>
                    <ButtonLink
                      variant="outline"
                      className="h-10 rounded-md border-hairline"
                      href={ROUTES.scholarship(card.id)}
                    >
                      View full record
                    </ButtonLink>
                    <Button
                      variant="secondary"
                      className="h-10 rounded-md"
                      onClick={() => onMove(index)}
                    >
                      {moveLabel}
                    </Button>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
