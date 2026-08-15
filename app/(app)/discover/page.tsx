import type { Metadata } from "next";

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
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
      <main id="main" className="flex flex-1 flex-col lg:min-h-0">
        <DiscoverScreen cardId={cardId} />
      </main>
    </div>
  );
}
