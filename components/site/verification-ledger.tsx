import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";

import { benefitSummary } from "@/lib/logic/format";
import { ROUTES } from "@/lib/logic/routes";
import type { Scholarship } from "@/lib/scholarships";
import { cn } from "@/lib/utils";

/**
 * The whole data set, in public.
 *
 * Most scholarship sites claim coverage and show you a search box. Ours is small
 * enough to print in full, so we print every programme and its verification
 * state. Source links on each record provide the useful path to confirmation.
 */
export function VerificationLedger({ cards }: { cards: Scholarship[] }) {
  const stateTone = (card: Scholarship) =>
    card.verification === "Verified" ? "text-met" : "text-attention-ink";

  return (
    <div>
      {/* Desktop: a real table, so the figures line up as columns. */}
      <table className="hidden w-full border-collapse text-left md:table">
        <caption className="sr-only">
          Every scholarship in Tul.AI, with its verification state.
        </caption>
        <thead>
          <tr className="border-b border-hairline-dark/25">
            {["Provider", "Programme", "Support", "Closes", "State"].map(
              (heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="t-micro pb-3 font-normal text-ink-mute"
                >
                  {heading}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {cards.map((card) => (
            <tr key={card.id} className="group border-b border-hairline">
              <td className="t-caption py-5 pr-6 align-top whitespace-nowrap text-ink-mute">
                {card.provider}
              </td>
              <td className="py-5 pr-6 align-top">
                <Link
                  href={ROUTES.scholarship(card.id)}
                  className="ring-brand t-body-strong inline-flex items-center gap-1.5 rounded-xs text-ink group-hover:underline group-hover:decoration-hairline-dark group-hover:underline-offset-4"
                >
                  {card.title}
                  <ArrowUpRightIcon
                    className="size-3.5 text-ink-mute opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </Link>
              </td>
              <td className="t-caption t-num py-5 pr-6 align-top whitespace-nowrap">
                {benefitSummary(card)}
              </td>
              <td className="t-caption t-num py-5 pr-6 align-top whitespace-nowrap text-ink-mute">
                <time dateTime={card.deadlineIso}>{card.deadline}</time>
              </td>
              <td className={cn("t-caption py-5 pr-6 align-top whitespace-nowrap", stateTone(card))}>
                {card.verification}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: the same records, stacked. */}
      <ul className="md:hidden">
        {cards.map((card) => (
          <li key={card.id} className="border-b border-hairline py-5 first:border-t">
            <p className="t-caption text-ink-mute">{card.provider}</p>
            <h3 className="t-display-md mt-1">
              <Link
                href={ROUTES.scholarship(card.id)}
                className="ring-brand rounded-xs hover:underline hover:decoration-hairline-dark hover:underline-offset-4"
              >
                {card.title}
              </Link>
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5">
              <div>
                <dt className="t-micro text-ink-mute">Support</dt>
                <dd className="t-caption">{benefitSummary(card)}</dd>
              </div>
              <div>
                <dt className="t-micro text-ink-mute">Closes</dt>
                <dd className="t-caption t-num">
                  <time dateTime={card.deadlineIso}>{card.deadline}</time>
                </dd>
              </div>
              <div>
                <dt className="t-micro text-ink-mute">State</dt>
                <dd className={cn("t-caption", stateTone(card))}>{card.verification}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
