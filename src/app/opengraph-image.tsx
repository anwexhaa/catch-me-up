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
          background: "#f3ede1",
          color: "#1d2733",
          border: "18px solid #183f30",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#7b1e2f", border: "3px solid #a87b23" }} />
          <div style={{ fontSize: 42, fontWeight: 700 }}>Catch Me Up</div>
          <div
            style={{
              marginLeft: 12,
              padding: "6px 16px",
              borderRadius: 999,
              background: "#7b1e2f",
              color: "#fbf8f1",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            LIVE
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 70, fontWeight: 800, lineHeight: 1.1 }}>Can&apos;t watch every ball?</div>
          <div style={{ fontSize: 34, color: "#6f6a5d", lineHeight: 1.35 }}>
            Personal &ldquo;what did I miss?&rdquo; recaps in your language, live win chance and an ask-the-match chat.
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 26 }}>
          <div style={{ padding: "8px 18px", borderRadius: 10, background: "#1f4f9c", color: "#fff", fontWeight: 700 }}>IND</div>
          <div style={{ padding: "8px 18px", borderRadius: 10, background: "#23805a", color: "#fff", fontWeight: 700 }}>SA</div>
          <div style={{ display: "flex", alignItems: "center", color: "#a87b23" }}>T20 World Cup 2024 final, replayed live</div>
        </div>
      </div>
    ),
    size,
  );
}
