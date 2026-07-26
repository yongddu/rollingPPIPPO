import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@/lib/supabase/server";
import { CAT_DATA_URI } from "@/components/share/catSvg";

export const alt = "행성 롤링페이퍼";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: planet } = await supabase
    .from("planets")
    .select("id, title")
    .eq("slug", slug)
    .single();

  const { count } = planet
    ? await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("planet_id", planet.id)
    : { count: 0 };

  const font = await readFile(
    join(process.cwd(), "public/fonts/Pretendard-SemiBold.subset.woff"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 22% 18%, #472f6b 0%, #1b1140 45%, #0a0820 100%)",
          fontFamily: "Pretendard",
          position: "relative",
        }}
      >
        {/* planet */}
        <div
          style={{
            position: "absolute",
            left: 78,
            top: 132,
            width: 366,
            height: 366,
            borderRadius: 366,
            background:
              "linear-gradient(150deg, #7fd7e8 0%, #a98fe0 45%, #f0a8c0 100%)",
            boxShadow: "0 0 90px 26px rgba(127, 220, 240, 0.42)",
            display: "flex",
          }}
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={CAT_DATA_URI}
          alt=""
          width={190}
          height={190}
          style={{ position: "absolute", left: 166, top: 42 }}
        />

        <div
          style={{
            position: "absolute",
            left: 520,
            top: 190,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: 34, color: "#c9bff0" }}>
            {count ? `메시지 ${count}개가 도착했어요` : "아직 비어 있는 행성"}
          </div>
          <div
            style={{
              fontSize: 76,
              color: "#ffffff",
              marginTop: 12,
              lineHeight: 1.15,
            }}
          >
            {planet?.title ?? "행성 롤링페이퍼"}
          </div>
          <div style={{ fontSize: 40, color: "#ffd9a8", marginTop: 24 }}>
            여기에 메시지를 남겨줘 🐈
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Pretendard", data: font, style: "normal", weight: 600 }],
    },
  );
}
