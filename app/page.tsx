import Link from "next/link";
import { CAT_SVG } from "@/components/share/catSvg";
import { DEMO_SLUG } from "@/lib/site";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#08061c] px-6 py-20 text-center">
      {/* the planet, as flat CSS — the landing page has to open instantly
          on a phone, so the real WebGL scene waits until you're inside */}
      <div className="pointer-events-none absolute -left-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_30%_30%,#7fd7e8,#a98fe0_45%,#f0a8c0)] opacity-70 blur-[2px] sm:left-1/2 sm:top-auto sm:bottom-[-220px] sm:h-[520px] sm:w-[520px] sm:-translate-x-1/2 sm:translate-y-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(120,80,180,0.35),transparent_60%)]" />

      <div className="relative flex flex-col items-center gap-6">
        <div
          className="h-28 w-28 drop-shadow-[0_0_25px_rgba(160,220,255,0.35)]"
          dangerouslySetInnerHTML={{ __html: CAT_SVG }}
        />

        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          행성 롤링페이퍼
        </h1>

        <p className="max-w-xs text-sm leading-relaxed text-white/70 sm:max-w-md sm:text-base">
          내 행성을 만들어 링크를 뿌리면, 친구들이 로그인 없이 원하는 자리에
          메시지를 남겨요. 메시지 하나마다 고양이 한 마리가 찾아와 그 옆에
          살아요.
        </p>

        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-full bg-white px-7 py-3.5 font-medium text-neutral-900 transition hover:bg-white/90"
          >
            내 행성 만들기
          </Link>
          <Link
            href={`/${encodeURIComponent(DEMO_SLUG)}`}
            className="rounded-full border border-white/25 px-7 py-3.5 font-medium text-white transition hover:bg-white/10"
          >
            먼저 구경해보기
          </Link>
        </div>

        <p className="text-xs text-white/40">
          카카오 · 구글 로그인 · 만드는 데 10초
        </p>
      </div>
    </main>
  );
}
