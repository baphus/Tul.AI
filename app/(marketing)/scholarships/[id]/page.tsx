import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ScholarshipDetail } from "@/components/scholarship/scholarship-detail";
import { ScholarshipSummaryCard } from "@/components/scholarship/scholarship-summary-card";
import { ClosingCta } from "@/components/site/closing-cta";
import { Container, Section, SectionHead } from "@/components/site/layout-primitives";
import { SiteHeader } from "@/components/site/site-header";
import { formatPeso } from "@/lib/logic/format";
import { ROUTES } from "@/lib/logic/routes";
import { DATA, getScholarships } from "@/lib/scholarships";

/** Every record is known at build time, so every page is prerendered. */
export function generateStaticParams() {
  return DATA.map((card) => ({ id: card.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/scholarships/[id]">): Promise<Metadata> {
  const { id } = await params;
  const card = DATA.find((c) => c.id === id);
  if (!card) return { title: "Scholarship not found" };

  return {
    title: `${card.title} · ${card.provider}`,
    description: `${card.provider} — up to ${formatPeso(card.amount)} ${card.amountNote}. Deadline ${card.deadline}. Published requirements, documents and official source, last verified ${card.lastVerified}.`,
    openGraph: {
      title: `${card.title} — ${card.provider}`,
      description: card.back.about,
    },
  };
}

export default async function ScholarshipPage({ params }: PageProps<"/scholarships/[id]">) {
  const { id } = await params;
  const cards = await getScholarships();
  const index = cards.findIndex((c) => c.id === id);
  if (index === -1) notFound();

  const card = cards[index];
  const related = cards
    .map((c, i) => ({ card: c, index: i }))
    .filter((entry) => entry.card.id !== card.id && entry.card.kind === card.kind)
    .slice(0, 2);

  return (
    <>
      <SiteHeader />

      <main id="main" className="flex-1">
        <Container width="narrow" className="px-0 sm:px-0">
          <ScholarshipDetail
            card={card}
            index={index}
            topSlot={
              <Link
                href={ROUTES.scholarships}
                className="ring-brand t-caption inline-flex items-center gap-2 rounded-xs text-ink-mute hover:text-ink"
              >
                <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
                All scholarships
              </Link>
            }
          />
        </Container>

        {related.length > 0 && (
          <Section tone="soft" labelledBy="related-heading">
            <Container width="narrow">
              <SectionHead id="related-heading" title="Other programmes of the same kind" />
              <ul className="mt-8 flex flex-col gap-4">
                {related.map((entry) => (
                  <li key={entry.card.id}>
                    <ScholarshipSummaryCard card={entry.card} index={entry.index} />
                  </li>
                ))}
              </ul>
            </Container>
          </Section>
        )}

        <ClosingCta
          title="Find out where you stand on this one."
          body="Answer five questions and this page gains a requirement-by-requirement breakdown for your situation."
        />
      </main>
    </>
  );
}
