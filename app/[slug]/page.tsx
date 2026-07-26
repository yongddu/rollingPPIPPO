import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function PlanetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: planet } = await supabase
    .from("planets")
    .select("title, deadline, created_at")
    .eq("slug", slug)
    .single();

  if (!planet) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold">{planet.title}</h1>
      {planet.deadline && (
        <p className="text-sm text-neutral-500">
          마감: {new Date(planet.deadline).toLocaleDateString("ko-KR")}
        </p>
      )}
      <p className="mt-8 text-sm text-neutral-400">
        3D 행성 화면은 곧 추가될 예정이에요. (Phase 2 진행 중)
      </p>
    </main>
  );
}
