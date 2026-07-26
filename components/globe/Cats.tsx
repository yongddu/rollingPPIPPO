"use client";

import { Cat } from "./Cat";
import type { PlanetMessage } from "./types";

/**
 * One cat per message, but capped: each cat is a dozen or so draw calls,
 * and phones already sit close to the limit that costs us the WebGL
 * context. A popular planet gets a full crowd, not an unbounded one.
 */
const MAX_CATS = 10;

export function Cats({ messages }: { messages: PlanetMessage[] }) {
  return (
    <>
      {messages.slice(0, MAX_CATS).map((message) => (
        <Cat key={message.id} seed={message.id} />
      ))}
    </>
  );
}
