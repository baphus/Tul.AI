import Link from "next/link";

import { BrandMark } from "@/components/site/brand";
import { Container } from "@/components/site/layout-primitives";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/logic/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-hairline">
        <Container className="flex h-16 items-center sm:h-18">
          <BrandMark />
        </Container>
      </header>

      <main id="main" className="flex flex-1 items-center py-20">
        <Container width="narrow">
          <h1 className="t-display-xl max-w-[20ch] text-balance">
            That page isn&apos;t here.
          </h1>
          <p className="t-body-lg mt-6 max-w-[62ch] text-ink-mute text-pretty">
            The link may be out of date, or the scholarship it pointed to may have been
            removed from our verified set. The directory is the best place to start again.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button className="h-12 rounded-md px-6" render={<Link href={ROUTES.scholarships} />}>
              Browse all scholarships
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-md border-hairline-dark px-6"
              render={<Link href={ROUTES.home} />}
            >
              Back to home
            </Button>
          </div>
        </Container>
      </main>
    </div>
  );
}
