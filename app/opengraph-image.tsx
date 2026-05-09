import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Pokerpot — Settle the table.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background:
            "linear-gradient(135deg, #ecfdf5 0%, #fafaf9 50%, #fef3c7 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Chip mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              background: "#10b981",
              border: "8px solid #ffffff",
              boxShadow: "0 12px 32px -8px rgba(16, 185, 129, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              €
            </div>
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#18181b",
            }}
          >
            Pokerpot
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 110,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            color: "#0a0a0a",
          }}
        >
          Settle the table.
        </div>

        {/* Subhead */}
        <div
          style={{
            marginTop: 28,
            fontSize: 32,
            color: "#52525b",
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          Track buy-ins, collect cash-outs, and let Pokerpot calculate who pays
          whom — in the fewest transactions possible.
        </div>

        {/* Footer chip */}
        <div
          style={{
            position: "absolute",
            bottom: 64,
            left: 80,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 18px",
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.85)",
            border: "1px solid rgba(0,0,0,0.08)",
            color: "#047857",
            fontSize: 22,
            fontWeight: 500,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#10b981",
            }}
          />
          End-of-night chip math, solved
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
