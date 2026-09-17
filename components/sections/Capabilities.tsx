import { capabilities } from "@/content/focus";

export default function Capabilities() {
  return (
    <section className="section" id="capabilities" style={{ background: "var(--bg2)" }}>
      <div className="wrap">
        <div className="shead">
          <div>
            <div className="section-label">
              <b>02</b> Capabilities
            </div>
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 400,
                fontSize: 56,
                lineHeight: 1.05,
                letterSpacing: "-.02em",
                marginTop: 18,
              }}
            >
              What I{" "}
              <i style={{ color: "var(--em)" }}>actually</i> do
            </h2>
          </div>
          <p
            style={{
              fontSize: 15,
              color: "var(--cream-2)",
              maxWidth: 340,
              lineHeight: 1.65,
              flexShrink: 0,
            }}
            className="shead-sub"
          >
            Six areas, end-to-end. From raw math to shipped product.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            border: "1px solid var(--line)",
            borderRadius: "var(--r)",
            overflow: "hidden",
          }}
          className="cap-grid"
        >
          {capabilities.map((cap, i) => (
            <div
              key={cap.idx}
              style={{
                padding: "32px 28px",
                background: "var(--panel)",
                borderRight:
                  (i + 1) % 3 !== 0 ? "1px solid var(--line)" : "none",
                borderBottom: i < 3 ? "1px solid var(--line)" : "none",
                transition: "background .3s",
              }}
              className="cap-cell"
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  color: "var(--em)",
                  marginBottom: 18,
                }}
              >
                {cap.idx}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontWeight: 400,
                  fontSize: 24,
                  lineHeight: 1.2,
                  marginBottom: 14,
                }}
              >
                {cap.title}
                {cap.titleItalic && (
                  <i style={{ color: "var(--em)" }}>{cap.titleItalic}</i>
                )}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--cream-2)",
                  lineHeight: 1.65,
                  marginBottom: 20,
                }}
              >
                {cap.description}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: ".08em",
                  color: "var(--cream-3)",
                  lineHeight: 1.8,
                }}
              >
                {cap.tools}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .cap-grid { grid-template-columns: 1fr !important; }
          .cap-cell { border-right: none !important; }
          .shead-sub { display: none; }
        }
      `}</style>
    </section>
  );
}
