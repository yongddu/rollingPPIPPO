import { CanvasTexture, SRGBColorSpace } from "three";

/** Coat colours, loosely based on how real cats actually come. */
const COATS = [
  { base: "#f0a05c", mark: "#d2793a", belly: "#ffe6cd" }, // ginger
  { base: "#c6c1b9", mark: "#8b857c", belly: "#f2efe9" }, // grey tabby
  { base: "#fff1de", mark: "#e6cda9", belly: "#fffaf2" }, // cream
  { base: "#8b7263", mark: "#5d4a3e", belly: "#e8d8c8" }, // brown
  { base: "#5d5668", mark: "#3a3543", belly: "#cfc7d6" }, // charcoal
  { base: "#fbfbfb", mark: "#e0d8cf", belly: "#ffffff" }, // white
  { base: "#3f3a44", mark: "#2a2630", belly: "#6b6472" }, // black
];

const PATTERNS = ["solid", "tabby", "spots", "tuxedo"] as const;
export type Pattern = (typeof PATTERNS)[number];

const SIZE = 128;

/**
 * Paints a cat's coat into a canvas texture. Doing the markings in a
 * texture rather than extra geometry keeps each cat to a handful of
 * draw calls, which matters once there is one per message.
 */
export function createFurTexture(random: () => number) {
  const coat = COATS[Math.floor(random() * COATS.length)];
  const pattern = PATTERNS[Math.floor(random() * PATTERNS.length)];

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = coat.base;
  ctx.fillRect(0, 0, SIZE, SIZE);

  if (pattern === "tabby") {
    ctx.fillStyle = coat.mark;
    // vertical stripes in UV become rings around the body
    const count = 5 + Math.floor(random() * 4);
    for (let i = 0; i < count; i++) {
      const x = (i / count) * SIZE + random() * 6;
      const width = 4 + random() * 6;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.quadraticCurveTo(x + 10 - random() * 20, SIZE / 2, x, SIZE);
      ctx.lineTo(x + width, SIZE);
      ctx.quadraticCurveTo(
        x + width + 10 - random() * 20,
        SIZE / 2,
        x + width,
        0,
      );
      ctx.closePath();
      ctx.fill();
    }
  }

  if (pattern === "spots") {
    ctx.fillStyle = coat.mark;
    const count = 14 + Math.floor(random() * 12);
    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      ctx.ellipse(
        random() * SIZE,
        random() * SIZE,
        3 + random() * 6,
        3 + random() * 5,
        random() * Math.PI,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  if (pattern === "tuxedo") {
    ctx.fillStyle = coat.belly;
    ctx.beginPath();
    ctx.ellipse(SIZE / 2, SIZE, SIZE * 0.42, SIZE * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { texture, coat, pattern };
}
