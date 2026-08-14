import type { Metadata } from "next";
import Link from "next/link";

import { ScholarshipDirectory } from "@/components/scholarship/scholarship-directory";
import { ClosingCta } from "@/components/site/closing-cta";
import { Container, Section } from "@/components/site/layout-primitives";
import { SiteHeader } from "@/components/site/site-header";
import { ROUTES } from "@/lib/logic/routes";
import { getScholarships } from "@/lib/scholarships";

export const metadata: Metadata = {
  title: "All scholarships",
  description:
    "Browse every scholarship in Tul.AI: benefit, deadline, published requirements, official source and verification state.",
};

export default async function ScholarshipsPage() {
  const cards = await getScholarships();

  return (
    <>
      <SiteHeader />

      <main id="main" className="flex-1">
        <Section size="tight" labelledBy="page-title">
          <Container>
            <h1 id="page-title" className="t-display-xl max-w-[24ch] text-balance">
              Every scholarship we&apos;ve verified.
            </h1>
            <p className="t-body-lg mt-6 max-w-[66ch] text-ink-mute text-pretty">
              Browse the whole set without telling us anything about yourself. To see which
              requirements you personally meet,{" "}
              <Link
                href={ROUTES.onboarding}
                className="ring-brand rounded-xs text-ink underline decoration-ink/25 underline-offset-4"
              >
                answer five questions
              </Link>{" "}
              and we&apos;ll match you against each one.
            </p>

            <div className="mt-10">
              <ScholarshipDirectory cards={cards} />
            </div>
          </Container>
        </Section>

        <ClosingCta
          title="See which of these you qualify for."
          body="Five questions, and every programme above gains a requirement-by-requirement breakdown for your situation."
        />
      </main>
    </>
  );
}
