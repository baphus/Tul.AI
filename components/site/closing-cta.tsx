import Link from "next/link";

import { Container } from "@/components/site/layout-primitives";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/logic/routes";

/**
 * DESIGN.md `hero-band-dark`: near-black surface, headline in brand lime. Every
 * marketing page resolves here, with one headline and exactly one CTA.
 */
export function ClosingCta({
  title = "Find the scholarships you can actually pursue.",
  body = "Answer five questions. See verified opportunities with the published requirements behind every match.",
  cta = "Find my scholarships",
  href = ROUTES.onboarding,
}: {
  title?: string;
  body?: string;
  cta?: string;
  href?: string;
}) {
  return (
    <section className="canvas-ink py-20 md:py-28 lg:py-36" aria-labelledby="closing-cta">
      <Container>
        <div className="flex flex-col gap-7 md:max-w-[46rem]">
          <h2 id="closing-cta" className="t-display-xl text-balance text-brand">
            {title}
          </h2>
          <p className="t-body-lg max-w-[36rem] text-on-dark-mute text-pretty">{body}</p>
          <div>
            <Button className="t-body-strong h-12 px-6 text-base" render={<Link href={href} />}>
              {cta}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
