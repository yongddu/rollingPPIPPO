"use client";

import { Html } from "@react-three/drei";

/**
 * The message, rendered as DOM and billboarded by drei. Text painted onto
 * the sphere is unreadable at most angles — this is where a message is
 * actually meant to be read.
 */
export function SpeechBubble({
  body,
  nickname,
  canDelete,
  deleting,
  error,
  onDelete,
  onClose,
}: {
  body: string;
  nickname: string;
  canDelete: boolean;
  deleting: boolean;
  error: string | null;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <Html center distanceFactor={2.6} position={[0, 0.4, 0]} zIndexRange={[20, 0]}>
      <div className="w-52 -translate-y-1/2 select-none rounded-2xl bg-white/95 px-4 py-3 text-center shadow-xl backdrop-blur">
        <p className="whitespace-pre-wrap break-words text-[13px] leading-snug text-neutral-800">
          {body}
        </p>
        <p className="mt-1.5 text-[11px] text-neutral-500">— {nickname}</p>

        {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}

        <div className="mt-2.5 flex gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-neutral-300 px-2 py-1 text-[11px]"
          >
            닫기
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="flex-1 rounded-full bg-red-500 px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
            >
              {deleting ? "지우는 중" : "지우기"}
            </button>
          )}
        </div>

        {/* tail of the bubble */}
        <div className="mx-auto h-0 w-0 -translate-y-[-6px] border-x-8 border-t-8 border-x-transparent border-t-white/95" />
      </div>
    </Html>
  );
}
