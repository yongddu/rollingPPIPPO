"use client";

import { useEffect, useState } from "react";
import type { Vector3 } from "three";
import { createClient } from "@/lib/supabase/client";
import type { PlanetMessage } from "./types";

const NICKNAME_KEY = "rolling-planet:nickname";
const MAX_NICKNAME = 20;
const MAX_BODY = 300;

export function MessageComposer({
  planetId,
  normal,
  scale,
  onCancel,
  onCreated,
}: {
  planetId: string;
  normal: Vector3;
  scale: number;
  onCancel: () => void;
  onCreated: (message: PlanetMessage) => void;
}) {
  const [nickname, setNickname] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // most people write on several friends' planets — remember their name
  useEffect(() => {
    setNickname(window.localStorage.getItem(NICKNAME_KEY) ?? "");
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    const trimmedNickname = nickname.trim();
    const trimmedBody = body.trim();
    if (!trimmedNickname || !trimmedBody) {
      setError("닉네임과 메시지를 모두 입력해주세요.");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({
        planet_id: planetId,
        nickname: trimmedNickname,
        body: trimmedBody,
        pos_x: normal.x,
        pos_y: normal.y,
        pos_z: normal.z,
        scale,
      })
      .select("id, nickname, body, pos_x, pos_y, pos_z, scale")
      .single();

    setSaving(false);

    if (insertError || !data) {
      setError(
        insertError?.message.includes("too many messages")
          ? "지금 메시지가 몰리고 있어요. 잠시 후 다시 시도해주세요."
          : "메시지를 남기지 못했어요. 다시 시도해주세요.",
      );
      return;
    }

    window.localStorage.setItem(NICKNAME_KEY, trimmedNickname);
    onCreated(data as PlanetMessage);
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur"
      >
        <p className="mb-2 text-sm font-medium text-neutral-700">
          이 자리에 메시지를 남겨요
        </p>

        {/* the rules still have to be visible at the moment of writing,
            but folded away so they don't greet you first */}
        <details className="mb-3 text-xs text-neutral-400">
          <summary className="cursor-pointer list-none">
            욕설·비방은 주인이 지울 수 있어요 · 자세히
          </summary>
          <p className="mt-1.5 rounded-lg bg-amber-50 px-3 py-2 leading-relaxed text-amber-800">
            욕설·음란물·비방·개인정보가 담긴 메시지는 행성 주인이 바로 지울 수
            있어요. 심한 경우 작성이 제한되거나 신고 대상이 될 수 있으니 서로
            기분 좋은 말만 남겨주세요.
          </p>
        </details>

        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={MAX_NICKNAME}
          placeholder="닉네임"
          className="mb-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={MAX_BODY}
          rows={3}
          placeholder="하고 싶은 말을 적어주세요"
          className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />

        <div className="mt-1 text-right text-xs text-neutral-400">
          {body.length}/{MAX_BODY}
        </div>

        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "남기는 중..." : "남기기"}
          </button>
        </div>
      </form>
    </div>
  );
}
