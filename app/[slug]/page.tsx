import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PlanetScene } from "@/components/globe/PlanetScene";

export default async function PlanetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: planet } = await supabase
    .from("planets")
    .select("id, title, deadline, owner_id")
    .eq("slug", slug)
    .single();

  if (!planet) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === planet.owner_id;

  const { data: messages } = await supabase
    .from("messages")
    .select("id, nickname, body, pos_x, pos_y, pos_z, scale")
    .eq("planet_id", planet.id)
    .order("created_at", { ascending: true });

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#100e28]">
      <PlanetScene
        planetId={planet.id}
        slug={slug}
        title={planet.title}
        initialMessages={messages ?? []}
        isOwner={isOwner}
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1 px-6 pt-8 text-center text-white">
        <h1 className="text-xl font-semibold drop-shadow">{planet.title}</h1>
        {planet.deadline && (
          <p className="text-sm text-white/70">
            마감 {new Date(planet.deadline).toLocaleDateString("ko-KR")}
          </p>
        )}
      </header>

      <Link
        href={user ? "/dashboard" : "/"}
        className="absolute left-4 top-7 z-10 rounded-full bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur transition hover:bg-white/25"
      >
        {user ? "← 내 행성 목록" : "← 나도 만들기"}
      </Link>
    </main>
  );
}
