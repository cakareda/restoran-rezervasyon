import { ImageResponse } from "next/og";
import { SITE_ADI, SITE_SLOGAN } from "@/lib/config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f1ea",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "#7a1f2b",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <div style={{ fontSize: 64, color: "#ffffff" }}>🍽️</div>
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, color: "#2a211c", display: "flex" }}>
          {SITE_ADI}
        </div>
        <div style={{ fontSize: 32, color: "#6b5f52", marginTop: 16, display: "flex" }}>
          {SITE_SLOGAN}
        </div>
      </div>
    ),
    { ...size }
  );
}
