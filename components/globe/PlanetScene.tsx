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
  const [focus, setFocus] = useState<Vector3 | null>(null);

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
          focusNormal={focus}
          selectedId={selected?.id ?? null}
          onPick={(normal, scale) => {
            setSelected(null);
            setPending({ normal, scale });
          }}
          onSelectMessage={(message) => {
            setPending(null);
            setDeleteError(null);
            setSelected(message);
          }}
          onCloseMessage={() => setSelected(null)}
          canDelete={isOwner}
          deleting={deleting}
          deleteError={deleteError}
          onDeleteMessage={deleteSelected}
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
        <div className="pointer-events-none absolute inset-x-0 bottom-8 px-6 text-center">
          {messages.length === 0 ? (
            <>
              <p className="text-base font-medium text-white">
                아직 아무도 다녀가지 않았어요
              </p>
              <p className="mt-1 text-xs text-white/60">
                행성을 눌러 첫 메시지를 남겨주세요. 메시지마다 고양이 한 마리가
                찾아와요.
              </p>
            </>
          ) : (
            <p className="text-xs text-white/60">
              고양이를 누르면 메시지를 읽을 수 있어요. 빈 자리를 누르면 나도
              남길 수 있어요.
            </p>
          )}
        </div>
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
            // swing round to the new message and open its cat, so writing
            // ends with something happening rather than a silent dismissal
            const normal = new Vector3(
              message.pos_x,
              message.pos_y,
              message.pos_z,
            );
            setFocus(normal);
            setSelected(message);
          }}
        />
      )}
    </>
  );
}
