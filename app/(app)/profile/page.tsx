import type { Metadata } from "next";

import { AppHeader } from "@/components/app/app-header";
import { ProfileEditor } from "@/components/app/profile-editor";

export const metadata: Metadata = {
  title: "Your profile",
  description:
    "View, change or delete everything Tul.AI holds about you. Every field exists because it changes which programmes can match.",
};

export default function ProfilePage() {
  return (
    <>
      <AppHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto w-full max-w-[64rem] px-5 sm:px-8">
          <ProfileEditor />
        </div>
      </main>
    </>
  );
}
