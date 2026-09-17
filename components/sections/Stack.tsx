import { stackRows } from "@/content/skills";

export default function Stack() {
  const coreRows = stackRows.filter((r) => r.tier === "core");
  const supportingRows = stackRows.filter((r) => r.tier === "supporting");

  return (
    <section className="section" id="stack" style={{ background: "var(--bg2)" }}>
      <div className="wrap">
        <div className="shead">
          <div>
            <div className="section-label">
              <b>04</b> Stack
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
              Tools of the{" "}
              <i style={{ color: "var(--em)" }}>trade</i>
            </h2>
          </div>
        </div>

        <div
          style={{
            border: "1px solid var(--line)",
            borderRadius: "var(--r)",
            overflow: "hidden",
          }}
        >
          {/* Core rows */}
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9.5,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "var(--cream-3)",
              padding: "10px 24px",
              background: "var(--panel-2)",
              borderBottom: "1px solid var(--line)",
            }}
          >
            Core
          </div>
          {coreRows.map((row, i) => (
            <div
              key={row.category}
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr",
                gap: 0,
                borderBottom:
                  i < coreRows.length - 1 ? "1px solid var(--line)" : "none",
              }}
              className="stack-row"
            >
              <div
                style={{
                  padding: "18px 24px",
                  borderRight: "1px solid var(--line)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--cream-2)",
                  background: "var(--panel)",
                }}
              >
                {row.category}
              </div>
              <div
                style={{
                  padding: "18px 24px",
                  fontFamily: "var(--font-term)",
                  fontSize: 13.5,
                  color: "var(--cream-2)",
                  background: "var(--panel)",
                  lineHeight: 1.6,
                }}
              >
                {row.tools}
              </div>
            </div>
          ))}

          {/* Supporting rows */}
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9.5,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "var(--cream-3)",
              padding: "10px 24px",
              background: "var(--panel-2)",
              borderTop: "1px solid var(--line)",
              borderBottom: "1px solid var(--line)",
            }}
          >
            Supporting
          </div>
          {supportingRows.map((row) => (
            <div
              key={row.category}
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr",
                gap: 0,
              }}
              className="stack-row"
            >
              <div
                style={{
                  padding: "18px 24px",
                  borderRight: "1px solid var(--line)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--cream-3)",
                  background: "var(--panel)",
                }}
              >
                {row.category}
              </div>
              <div
                style={{
                  padding: "18px 24px",
                  fontFamily: "var(--font-term)",
                  fontSize: 13.5,
                  color: "var(--cream-3)",
                  background: "var(--panel)",
                  lineHeight: 1.6,
                }}
              >
                {row.tools}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .stack-row { grid-template-columns: 1fr !important; }
          .stack-row > div:first-child { border-right: none !important; border-bottom: 1px solid var(--line) !important; }
        }
      `}</style>
    </section>
  );
}
