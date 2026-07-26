"use client";

import { useEffect, useState } from "react";
import { planetUrl } from "@/lib/site";

export function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = planetUrl(slug);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // older iOS Safari in particular can refuse the clipboard API
      window.prompt("이 링크를 복사해서 공유하세요", url);
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <p className="min-w-0 flex-1 truncate rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-500">
        {url}
      </p>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-full bg-black px-3 py-2 text-xs font-medium text-white transition hover:bg-neutral-800"
      >
        {copied ? "복사됐어요!" : "링크 복사"}
      </button>
    </div>
  );
}
