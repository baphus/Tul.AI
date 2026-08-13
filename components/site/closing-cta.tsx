import Link from "next/link";

import { Container } from "@/components/site/layout-primitives";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/logic/routes";

/**
 * The deep-teal closing band. DESIGN.md treats this as non-negotiable: every
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
    <section className="canvas-teal py-16 md:py-24 lg:py-32" aria-labelledby="closing-cta">
      <Container>
        <div className="flex flex-col gap-6 md:max-w-[42rem]">
          <h2 id="closing-cta" className="t-display-lg text-balance text-white">
            {title}
          </h2>
          <p className="t-body-lg max-w-[34rem] text-on-dark-mute text-pretty">{body}</p>
          <div>
            <Button
              className="h-12 rounded-md bg-white px-6 text-teal-deep hover:bg-white/90"
              render={<Link href={href} />}
            >
              {cta}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
