"use client";

import { Vector3 } from "three";
import { Cat } from "./Cat";
import { SpeechBubble } from "./SpeechBubble";
import type { PlanetMessage } from "./types";

/**
 * One cat per message, but capped: each cat is a dozen or so draw calls,
 * and phones already sit close to the limit that costs us the WebGL
 * context. A popular planet gets a full crowd, not an unbounded one.
 */
const MAX_CATS = 12;

export function Cats({
  messages,
  selectedId,
  onSelect,
  canDelete,
  deleting,
  deleteError,
  onDelete,
  onClose,
}: {
  messages: PlanetMessage[];
  selectedId: string | null;
  onSelect: (message: PlanetMessage) => void;
  canDelete: boolean;
  deleting: boolean;
  deleteError: string | null;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <>
      {messages.slice(0, MAX_CATS).map((message) => {
        const selected = message.id === selectedId;

        return (
          <Cat
            key={message.id}
            seed={message.id}
            anchor={new Vector3(message.pos_x, message.pos_y, message.pos_z)}
            sitting={selected}
            onTap={() => onSelect(message)}
          >
            {selected && (
              <SpeechBubble
                body={message.body}
                nickname={message.nickname}
                canDelete={canDelete}
                deleting={deleting}
                error={deleteError}
                onDelete={onDelete}
                onClose={onClose}
              />
            )}
          </Cat>
        );
      })}
    </>
  );
}

/** The cat that keeps an empty planet company. */
export function WaitingCat() {
  return <Cat seed="waiting" anchor={new Vector3(0.15, 0.25, 1)} />;
}
