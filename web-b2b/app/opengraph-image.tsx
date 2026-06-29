import { ImageResponse } from "next/og";

export const alt = "Butterfly Fashion Trading — B2B Wholesale Toronto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#166534",
          color: "white",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "0.05em", opacity: 0.85 }}>
          BUTTERFLY FASHION TRADING
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.05 }}>
            B2B Wholesale, Toronto
          </div>
          <div style={{ fontSize: 36, fontWeight: 500, opacity: 0.9, maxWidth: 900 }}>
            Winter accessories, novelty &amp; fidget toys, and trending variety goods. No minimum order — ships across Canada &amp; the USA.
          </div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, opacity: 0.85 }}>
          Register for wholesale pricing →
        </div>
      </div>
    ),
    size
  );
}
