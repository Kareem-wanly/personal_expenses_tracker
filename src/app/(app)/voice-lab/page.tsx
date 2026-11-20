import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { VoiceLab } from "@/components/voice-lab";
import { getCategories } from "@/server/queries";

export const metadata: Metadata = { title: "مختبر الصوت" };

export default function VoiceLabPage() {
  return (
    <>
      <PageHeader title="مختبر الصوت" subtitle="جرّب Whisper على جهازك وصوتك قبل ما تعتمده" />
      <Suspense fallback={<Skeleton className="h-96 rounded-[22px]" />}>
        <Lab />
      </Suspense>
    </>
  );
}

async function Lab() {
  const categories = await getCategories();
  return <VoiceLab categories={categories} />;
}
