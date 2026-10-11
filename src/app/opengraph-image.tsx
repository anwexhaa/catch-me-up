import { ImageResponse } from "next/og";

export const alt = "Catch Me Up: an AI companion for fans who can't watch every ball";
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
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #070b14 0%, #161e33 100%)",
          color: "#eaf0fb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #ff5a3c, #ffc94a)",
            }}
          />
          <div style={{ fontSize: 40, fontWeight: 700 }}>Catch Me Up</div>
          <div
            style={{
              marginLeft: 12,
              padding: "6px 16px",
              borderRadius: 999,
              background: "rgba(255,90,60,0.18)",
              color: "#ff5a3c",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            LIVE
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1 }}>Can&apos;t watch every ball?</div>
          <div style={{ fontSize: 34, color: "#8b96b2", lineHeight: 1.35 }}>
            Personal &ldquo;what did I miss?&rdquo; recaps in your language, live win chance and an ask-the-match chat.
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 26 }}>
          <div style={{ padding: "8px 18px", borderRadius: 10, background: "#2f7bff", fontWeight: 700 }}>IND</div>
          <div style={{ padding: "8px 18px", borderRadius: 10, background: "#12b76a", fontWeight: 700 }}>SA</div>
          <div style={{ display: "flex", alignItems: "center", color: "#8b96b2" }}>T20 World Cup 2024 final, replayed live</div>
        </div>
      </div>
    ),
    size,
  );
}
