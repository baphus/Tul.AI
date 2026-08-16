"use client";

import { ShieldCheckIcon } from "lucide-react";
import Link from "next/link";

import { DeadlineCountdown } from "@/components/scholarship/deadline-chip";
import { ProviderCrest } from "@/components/scholarship/provider-logo";
import { ButtonLink } from "@/components/ui/button";
import { useTulAi } from "@/hooks/use-tul-ai";
import { benefitSummary } from "@/lib/logic/format";
import { ROUTES } from "@/lib/logic/routes";
import { passedCount, savedIndexes, unsortedCount } from "@/lib/logic/state";

/**
 * The desktop companion column while sorting: what's on the shortlist so far.
 * Replaced by the full record when a card is opened.
 */
export function ShortlistPanel() {
  const { state, cards } = useTulAi();

  const saved = savedIndexes(state);
  const passed = passedCount(state);
  const left = unsortedCount(state);

  return (
    <div className="px-6 py-8">
      <h2 className="t-display-md">Your shortlist</h2>
      <p className="t-caption mt-2 text-ink-mute text-pretty">
        Sorting never removes anything — a programme you pass stays reachable from the
        review screen.
      </p>

      <dl className="mt-6 grid grid-cols-3 gap-2.5 text-center">
        {[
          ["Interested", saved.length],
          ["Lower", passed],
          ["Left", left],
        ].map(([label, value]) => (
          <div
            key={label as string}
            className="rounded-lg border border-hairline bg-canvas-soft p-3.5"
          >
            <dt className="t-micro text-ink-mute">{label}</dt>
            <dd className="t-display-md t-num mt-0.5">{value}</dd>
          </div>
        ))}
      </dl>

      {saved.length === 0 ? (
        <p className="t-caption mt-6 rounded-lg border border-dashed border-hairline-dark/25 p-5 text-ink-mute text-pretty">
          Nothing marked yet. Anything you mark as interesting appears here with its
          deadline, so you can see the timing at a glance.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2.5">
          {saved.map((i) => {
            const card = cards[i];
            return (
              <li key={card.id}>
                <Link
                  href={ROUTES.discoverCard(card.id)}
                  scroll={false}
                  className="ring-brand flex items-center gap-3 rounded-lg border border-hairline bg-canvas p-3 transition-colors hover:border-hairline-dark/30"
                >
                  <ProviderCrest
                    index={i}
                    provider={card.provider}
                    logo={card.logo}
                    className="size-9"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="t-body-strong block truncate">{card.title}</span>
                    <span className="t-micro block text-ink-mute">
                      {card.deadline} ·{" "}
                      <DeadlineCountdown deadlineIso={card.deadlineIso} />
                    </span>
                  </span>
                  <span className="t-micro t-num flex-none">
                    {benefitSummary(card)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {saved.length > 0 && (
        <ButtonLink
          variant="outline"
          className="mt-5 h-11 w-full rounded-md border-hairline-dark"
          href={ROUTES.review}
        >
          Review before applying
        </ButtonLink>
      )}

      <p className="t-micro mt-8 flex items-start gap-2 border-t border-hairline pt-6 text-ink-mute">
        <ShieldCheckIcon className="mt-px size-3.5 flex-none" aria-hidden="true" />
        Tul.AI explains and compares published information. The provider decides who
        receives an award.
      </p>
    </div>
  );
}
