"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeletePlanetButton({
  planetId,
  title,
}: {
  planetId: string;
  title: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (deleting) return;

    setDeleting(true);
    setError(null);

    const supabase = createClient();
    // select() so a delete that RLS silently filtered to zero rows is
    // reported instead of looking like it worked until the next reload
    const { data, error: deleteError } = await supabase
      .from("planets")
      .delete()
      .eq("id", planetId)
      .select("id");

    setDeleting(false);

    if (deleteError || !data || data.length === 0) {
      setError("삭제하지 못했어요. 다시 시도해주세요.");
      return;
    }

    setConfirming(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        삭제
      </button>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-base font-semibold text-neutral-900">
              정말 삭제하시겠습니까?
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              &lsquo;{title}&rsquo; 행성과 여기에 남겨진 메시지가 모두 사라져요.
              되돌릴 수 없어요.
            </p>

            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm"
              >
                취소
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={deleting}
                className="flex-1 rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
