import { CAT_SVG } from "@/components/share/catSvg";

const WIDTH = 1080;
const HEIGHT = 1920;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Composites the story card people actually post: the live planet, the
 * cat, and the link. 9:16 because that's the only shape Instagram
 * Stories shows without cropping.
 */
export async function buildStoryCard({
  snapshot,
  title,
  url,
  messageCount,
}: {
  snapshot: string;
  title: string;
  url: string;
  messageCount: number;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;

  const sky = ctx.createLinearGradient(0, 0, WIDTH * 0.4, HEIGHT);
  sky.addColorStop(0, "#241a52");
  sky.addColorStop(0.45, "#160f38");
  sky.addColorStop(1, "#0a0820");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 90; i++) {
    const x = Math.random() * WIDTH;
    const y = Math.random() * HEIGHT;
    ctx.globalAlpha = 0.25 + Math.random() * 0.6;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const planet = await loadImage(snapshot);

  // the WebGL canvas is wider than it is tall — take a square from the
  // middle, tight enough that the planet fills the frame rather than
  // sitting in a sea of background
  const side = Math.min(planet.width, planet.height) * 0.78;
  const sx = (planet.width - side) / 2;
  const sy = (planet.height - side) / 2;

  const size = 820;
  const dx = (WIDTH - size) / 2;
  const dy = 700;

  ctx.save();
  ctx.beginPath();
  ctx.arc(dx + size / 2, dy + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(planet, sx, sy, side, side, dx, dy, size, size);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = "rgba(140, 214, 240, 0.55)";
  ctx.shadowBlur = 90;
  ctx.strokeStyle = "rgba(160, 226, 245, 0.5)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(dx + size / 2, dy + size / 2, size / 2 - 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const cat = await loadImage(
    `data:image/svg+xml;base64,${window.btoa(
      unescape(encodeURIComponent(CAT_SVG)),
    )}`,
  );
  // perched on the planet's top-right rim, clear of the copy above
  ctx.drawImage(cat, WIDTH / 2 + 30, dy - 210, 250, 250);

  const font = `-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
  ctx.textAlign = "center";

  ctx.fillStyle = "#ffd9a8";
  ctx.font = `600 46px ${font}`;
  ctx.fillText(
    messageCount > 0 ? `메시지 ${messageCount}개가 도착했어요` : "행성 롤링페이퍼",
    WIDTH / 2,
    270,
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 90px ${font}`;
  ctx.fillText(title.slice(0, 14), WIDTH / 2, 380);

  ctx.fillStyle = "#e7dcff";
  ctx.font = `600 58px ${font}`;
  ctx.fillText("여기에 메시지를 남겨줘", WIDTH / 2, 470);

  const label = url.replace(/^https?:\/\//, "");
  ctx.font = `500 40px ${font}`;
  const pill = ctx.measureText(label).width + 72;
  ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
  roundedRect(ctx, (WIDTH - pill) / 2, 1650, pill, 96, 48);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, WIDTH / 2, 1710);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("no blob"))),
      "image/png",
    );
  });
}
