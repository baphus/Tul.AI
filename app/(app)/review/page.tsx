import type { Metadata } from "next";

import { ReviewList } from "@/components/app/review-list";
import { parseCardId } from "@/lib/logic/routes";

export const metadata: Metadata = {
  title: "Browse scholarships",
  description:
    "Open scholarships matched to your profile, with a detail view for each published record.",
};

export default async function ReviewPage({ searchParams }: PageProps<"/review">) {
  const params = await searchParams;
  const cardId = parseCardId(params.card);

  return (
    <main id="main" className="flex-1">
      <div className="mx-auto w-full max-w-[88rem] px-5 sm:px-8">
        <ReviewList cardId={cardId} />
      </div>
    </main>
  );
}
