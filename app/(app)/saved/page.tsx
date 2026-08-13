import type { Metadata } from "next";

import { AppHeader } from "@/components/app/app-header";
import { SavedList } from "@/components/app/saved-list";

export const metadata: Metadata = {
  title: "Saved & deadlines",
  description:
    "Your saved scholarships ordered by deadline, each with an application checklist you can work through.",
};

export default function SavedPage() {
  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto w-full max-w-[56rem] px-5 sm:px-8">
          <SavedList />
        </div>
      </main>
    </>
  );
}
