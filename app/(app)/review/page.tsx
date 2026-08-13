import type { Metadata } from "next";

import { AppHeader } from "@/components/app/app-header";
import { ReviewList } from "@/components/app/review-list";

export const metadata: Metadata = {
  title: "Review",
  description:
    "Your shortlist before you apply — with overlapping documents and clustered deadlines called out.",
};

export default function ReviewPage() {
  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto w-full max-w-[56rem] px-5 sm:px-8">
          <ReviewList />
        </div>
      </main>
    </>
  );
}
