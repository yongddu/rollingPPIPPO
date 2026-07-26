import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createPlanet } from "./actions";

export default async function NewPlanetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold">내 행성 만들기</h1>

      {error && (
        <p className="text-sm text-red-500">
          {error === "title-required"
            ? "제목을 입력해주세요."
            : "행성을 만드는 중 문제가 생겼어요. 다시 시도해주세요."}
        </p>
      )}

      <form action={createPlanet} className="flex w-full max-w-sm flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          제목
          <input
            name="title"
            required
            maxLength={40}
            placeholder="OOO의 행성"
            className="rounded-lg border border-neutral-300 px-4 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          주소(선택, 비워두면 제목으로 자동 생성)
          <input
            name="slug"
            maxLength={40}
            placeholder="my-planet"
            className="rounded-lg border border-neutral-300 px-4 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          마감일(선택, 표시용)
          <input
            type="date"
            name="deadline"
            className="rounded-lg border border-neutral-300 px-4 py-2"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-full bg-black px-6 py-3 font-medium text-white hover:bg-neutral-800"
        >
          행성 만들기
        </button>
      </form>
    </main>
  );
}
