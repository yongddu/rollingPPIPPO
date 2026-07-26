"use client";

import { useState } from "react";
import { buildStoryCard } from "@/lib/shareCard";
import { planetUrl } from "@/lib/site";

export function ShareCardButton({
  slug,
  title,
  messageCount,
  takeSnapshot,
}: {
  slug: string;
  title: string;
  messageCount: number;
  takeSnapshot: () => string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function share() {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const snapshot = takeSnapshot();
      if (!snapshot) throw new Error("no snapshot");

      const blob = await buildStoryCard({
        snapshot,
        title,
        url: planetUrl(slug),
        messageCount,
      });
      const file = new File([blob], `${slug}-story.png`, { type: "image/png" });

      // on iOS this opens the share sheet with Instagram in it, which is
      // the whole point — falling back to a download elsewhere
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const href = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = href;
        link.download = file.name;
        link.click();
        // revoking straight away can cancel the download before the
        // browser has read the blob
        setTimeout(() => URL.revokeObjectURL(href), 60_000);
      }
    } catch (shareError) {
      // the user dismissing the share sheet lands here too, and isn't worth
      // an error message
      if ((shareError as Error)?.name !== "AbortError") {
        setError("카드를 만들지 못했어요. 다시 시도해주세요.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={share}
        disabled={busy}
        className="rounded-full bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur transition hover:bg-white/25 disabled:opacity-50"
      >
        {busy ? "만드는 중..." : "공유 카드 🐈"}
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
