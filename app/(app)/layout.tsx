import type { Metadata } from "next";

import { TulAiProvider } from "@/hooks/use-tul-ai";
import { getScholarships } from "@/lib/scholarships";

/** Personalised flows must not be indexed or appear in search results. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * The product shell. `getScholarships()` is the swap seam — today the verified
 * demo set, later an API read — so no client component changes when the data
 * moves. Headers are per page, so the onboarding conversation can stay calm
 * while the app screens get full navigation.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const cards = await getScholarships();

  return (
    <TulAiProvider cards={cards}>
      <div className="flex min-h-dvh flex-col bg-canvas">
        <a
          href="#main"
          className="ring-brand sr-only rounded-md bg-ink px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100"
        >
          Skip to content
        </a>
        {children}
      </div>
    </TulAiProvider>
  );
}
