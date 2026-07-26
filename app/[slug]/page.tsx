import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { GlobeCanvas } from "@/components/globe/GlobeCanvas";

export default async function PlanetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: planet } = await supabase
    .from("planets")
    .select("id, title, deadline")
    .eq("slug", slug)
    .single();

  if (!planet) {
    notFound();
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id, nickname, body, pos_x, pos_y, pos_z, scale")
    .eq("planet_id", planet.id)
    .order("created_at", { ascending: true });

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#100e28]">
      <div className="absolute inset-0">
        <GlobeCanvas messages={messages ?? []} />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1 px-6 pt-8 text-center text-white">
        <h1 className="text-xl font-semibold drop-shadow">{planet.title}</h1>
        {planet.deadline && (
          <p className="text-sm text-white/70">
            마감 {new Date(planet.deadline).toLocaleDateString("ko-KR")}
          </p>
        )}
      </header>

      <p className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-xs text-white/50">
        드래그하면 행성이 돌아가고, 두 손가락(또는 스크롤)으로 확대·축소할 수 있어요.
      </p>
    </main>
  );
}
