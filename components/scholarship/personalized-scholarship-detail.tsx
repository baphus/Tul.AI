"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AiMatchSummary } from "@/components/scholarship/ai-match-summary";
import { ScholarshipDetail } from "@/components/scholarship/scholarship-detail";
import { loadPersisted } from "@/lib/logic/storage";
import { matchScholarship } from "@/lib/logic/matching";
import { ROUTES } from "@/lib/logic/routes";
import type { Profile } from "@/lib/logic/state";
import type { Scholarship } from "@/lib/scholarships";

/**
 * The public URL stays shareable, while its browser view uses the same locally
 * persisted profile as the app. No profile is sent to the server to render it.
 */
export function PersonalizedScholarshipDetail({
  card,
  index,
}: {
  card: Scholarship;
  index: number;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    setProfile(loadPersisted()?.profile ?? null);
  }, []);

  const result = profile ? matchScholarship(card, profile) : undefined;

  return (
    <ScholarshipDetail
      card={card}
      index={index}
      result={result}
      matchExplanation={<AiMatchSummary result={result} />}
      topSlot={
        <Link
          href={ROUTES.scholarships}
          className="ring-brand t-caption inline-flex items-center gap-2 rounded-xs text-ink-mute hover:text-ink"
        >
          <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
          All scholarships
        </Link>
      }
    />
  );
}
