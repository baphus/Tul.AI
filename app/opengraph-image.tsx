import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "flex-start",
          background: "#9fe870",
          color: "#102313",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: "-0.04em" }}>
          Tul.AI
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "940px" }}>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1 }}>
            Bridge to your next opportunity.
          </div>
          <div style={{ display: "flex", fontSize: 32, lineHeight: 1.3, marginTop: "28px" }}>
            Verified scholarships and financial aid for Filipino students.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 600 }}>
          AI assists. Verified information decides.
        </div>
      </div>
    ),
    size
  );
}
