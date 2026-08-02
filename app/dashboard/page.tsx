import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { DeletePlanetButton } from "@/components/dashboard/DeletePlanetButton";
import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: planets } = await supabase
    .from("planets")
    .select("id, slug, title, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">내 행성</h1>
        <Link
          href="/new"
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + 새 행성
        </Link>
      </div>

      {!planets || planets.length === 0 ? (
        <p className="text-sm text-neutral-500">
          아직 만든 행성이 없어요. 위 버튼으로 첫 행성을 만들어보세요.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {planets.map((planet) => (
            <li
              key={planet.id}
              className="rounded-lg border border-neutral-200 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Link
                  href={`/${encodeURIComponent(planet.slug)}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate font-medium">{planet.title}</p>
                </Link>
                <DeletePlanetButton planetId={planet.id} title={planet.title} />
              </div>

              <CopyLinkButton slug={planet.slug} />

              <p className="mt-2 text-xs text-neutral-400">
                이걸 인스타에 올려보세요! 링크를 연 사람은 로그인 없이 바로
                메시지를 남길 수 있어요.
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-10 text-center">
        <SignOutButton />
      </div>
    </main>
  );
}
