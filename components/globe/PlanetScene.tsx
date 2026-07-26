"use client";

import { useCallback, useEffect, useState } from "react";
import { Vector3 } from "three";
import { createClient } from "@/lib/supabase/client";
import { GlobeCanvas } from "./GlobeCanvas";
import { MessageComposer } from "./MessageComposer";
import type { PlanetMessage } from "./types";

type Pending = { normal: Vector3; scale: number };

export function PlanetScene({
  planetId,
  initialMessages,
}: {
  planetId: string;
  initialMessages: PlanetMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [pending, setPending] = useState<Pending | null>(null);

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

  return (
    <>
      <div className="absolute inset-0">
        <GlobeCanvas
          messages={messages}
          pendingNormal={pending?.normal ?? null}
          onPick={(normal, scale) => setPending({ normal, scale })}
        />
      </div>

      {!pending && (
        <p className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-xs text-white/60">
          행성을 돌려서 원하는 자리를 눌러보세요. 확대할수록 글씨가 작게 남아요.
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
    </>
  );
}
