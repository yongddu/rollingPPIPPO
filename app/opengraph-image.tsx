import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CAT_DATA_URI } from "@/components/share/catSvg";

export const alt = "행성 롤링페이퍼";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
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
            "radial-gradient(circle at 20% 20%, #43306b 0%, #191140 45%, #08061c 100%)",
          fontFamily: "Pretendard",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 88,
            top: 150,
            width: 330,
            height: 330,
            borderRadius: 330,
            background:
              "linear-gradient(150deg, #7fd7e8 0%, #a98fe0 48%, #f0a8c0 100%)",
            boxShadow: "0 0 90px 26px rgba(127, 220, 240, 0.4)",
            display: "flex",
          }}
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={CAT_DATA_URI}
          alt=""
          width={186}
          height={186}
          style={{ position: "absolute", left: 168, top: 62 }}
        />

        <div
          style={{
            position: "absolute",
            left: 500,
            top: 196,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: 78, color: "#ffffff" }}>행성 롤링페이퍼</div>
          <div
            style={{
              fontSize: 36,
              color: "#c9bff0",
              marginTop: 22,
              lineHeight: 1.4,
              maxWidth: 620,
            }}
          >
            친구들이 내 행성 위에 메시지를 남겨요.
          </div>
          <div style={{ fontSize: 36, color: "#ffd9a8", marginTop: 10 }}>
            메시지 하나마다 고양이 한 마리 🐈
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
