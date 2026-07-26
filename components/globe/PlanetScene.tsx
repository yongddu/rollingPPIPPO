"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import { createClient } from "@/lib/supabase/client";
import { ShareCardButton } from "@/components/share/ShareCardButton";
import { GlobeCanvas } from "./GlobeCanvas";
import { MessageComposer } from "./MessageComposer";
import type { PlanetMessage } from "./types";

type Pending = { normal: Vector3; scale: number };

export function PlanetScene({
  planetId,
  slug,
  title,
  initialMessages,
  isOwner = false,
}: {
  planetId: string;
  slug: string;
  title: string;
  initialMessages: PlanetMessage[];
  isOwner?: boolean;
}) {
  const snapshot = useRef<(() => string) | null>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [pending, setPending] = useState<Pending | null>(null);
  const [selected, setSelected] = useState<PlanetMessage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const handleSnapshotReady = useCallback((take: () => string) => {
    snapshot.current = take;
  }, []);

  const addMessage = useCallback((message: PlanetMessage) => {
    setMessages((current) =>
      current.some((m) => m.id === message.id) ? current : [...current, message],
    );
  }, []);

  // messages other visitors leave while this page is open
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`planet:${planetId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `planet_id=eq.${planetId}`,
        },
        (payload) => addMessage(payload.new as PlanetMessage),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [planetId, addMessage]);

  async function deleteSelected() {
    if (!selected || deleting) return;

    setDeleting(true);
    setDeleteError(null);

    const supabase = createClient();
    // select() so a delete that RLS silently filtered to zero rows is
    // reported instead of looking like it worked until the next reload
    const { data, error } = await supabase
      .from("messages")
      .delete()
      .eq("id", selected.id)
      .select("id");

    setDeleting(false);

    if (error || !data || data.length === 0) {
      setDeleteError("메시지를 지우지 못했어요. 다시 시도해주세요.");
      return;
    }

    setMessages((current) => current.filter((m) => m.id !== selected.id));
    setSelected(null);
  }

  return (
    <>
      <div className="absolute inset-0">
        <GlobeCanvas
          messages={messages}
          pendingNormal={pending?.normal ?? null}
          onPick={(normal, scale) => {
            setSelected(null);
            setPending({ normal, scale });
          }}
          onSelectMessage={
            isOwner
              ? (message) => {
                  setPending(null);
                  setDeleteError(null);
                  setSelected(message);
                }
              : undefined
          }
          onContextLost={() => setContextLost(true)}
          onSnapshotReady={handleSnapshotReady}
        />
      </div>

      <div className="absolute right-4 top-7 z-10">
        <ShareCardButton
          slug={slug}
          title={title}
          messageCount={messages.length}
          takeSnapshot={() => snapshot.current?.() ?? null}
        />
      </div>

      {contextLost && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#100e28] px-6 text-center">
          <p className="text-sm text-white/80">
            화면을 그리는 데 문제가 생겼어요.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-900"
          >
            다시 불러오기
          </button>
        </div>
      )}

      {!pending && !selected && (
        <p className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-xs text-white/60">
          {isOwner
            ? "메시지를 누르면 지울 수 있어요. 빈 자리를 누르면 나도 남길 수 있어요."
            : "행성을 돌려서 원하는 자리를 눌러보세요. 확대할수록 글씨가 작게 남아요."}
        </p>
      )}

      {pending && (
        <MessageComposer
          planetId={planetId}
          normal={pending.normal}
          scale={pending.scale}
          onCancel={() => setPending(null)}
          onCreated={(message) => {
            addMessage(message);
            setPending(null);
          }}
        />
      )}

      {selected && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
            <p className="text-sm text-neutral-800">{selected.body}</p>
            <p className="mt-1 text-xs text-neutral-500">
              — {selected.nickname}
            </p>

            {deleteError && (
              <p className="mt-2 text-xs text-red-500">{deleteError}</p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={deleteSelected}
                disabled={deleting}
                className="flex-1 rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {deleting ? "지우는 중..." : "이 메시지 지우기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
