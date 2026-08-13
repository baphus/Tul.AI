import type { Metadata } from "next";

import { AppHeader } from "@/components/app/app-header";
import { DiscoverScreen } from "@/components/app/discover-screen";
import { parseCardId } from "@/lib/logic/routes";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Sort your matched scholarships one card at a time, and open the full published record beside the deck.",
};

export default async function DiscoverPage({ searchParams }: PageProps<"/discover">) {
  const params = await searchParams;
  const cardId = parseCardId(params.card);

  return (
    <>
      <AppHeader />
      <main id="main" className="flex min-h-0 flex-1 flex-col">
        <DiscoverScreen cardId={cardId} />
      </main>
    </>
  );
}
