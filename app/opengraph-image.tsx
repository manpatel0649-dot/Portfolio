import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#041c1c",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "serif",
          padding: "0 80px",
        }}
      >
        {/* Emerald accent bar */}
        <div
          style={{
            width: 60,
            height: 3,
            background: "#34d399",
            marginBottom: 40,
          }}
        />
        <div
          style={{
            fontSize: 68,
            color: "#ffe6cb",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Man Panchotiya
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#34d399",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "monospace",
            marginBottom: 20,
          }}
        >
          AI/ML Engineer · Data Scientist · Founder
        </div>
        <div
          style={{
            fontSize: 18,
            color: "rgba(255,230,203,0.5)",
            fontFamily: "monospace",
            letterSpacing: "0.08em",
          }}
        >
          Qeist.io · Aoneq Labs
        </div>
      </div>
    ),
    { ...size }
  );
}
