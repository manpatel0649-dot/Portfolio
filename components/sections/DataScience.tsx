import { dsSection } from "@/content/datascience";

export default function DataScience() {
  return (
    <section className="section" id="data">
      <div className="wrap">
        <div className="shead">
          <div>
            <div className="section-label">
              <b>{dsSection.label}</b> {dsSection.labelText}
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
              {dsSection.headline.before}
              <i style={{ color: "var(--em)" }}>{dsSection.headline.italic}</i>
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
            className="ds-sub"
          >
            {dsSection.description}
          </p>
        </div>

        {/* KPI cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 48,
          }}
          className="kpi-grid"
        >
          {dsSection.kpis.map((kpi) => (
            <div key={kpi.title} className="panel" style={{ padding: "20px 22px 16px" }}>
              <small
                style={{
                  display: "block",
                  fontFamily: "var(--font-mono)",
                  fontSize: 9.5,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "var(--cream-3)",
                  marginBottom: 8,
                }}
              >
                {kpi.title}
              </small>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 32,
                    lineHeight: 1,
                    color: "var(--cream)",
                  }}
                >
                  {kpi.value}
                </span>
                {kpi.unit && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: "var(--cream-3)",
                    }}
                  >
                    {kpi.unit}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--cream-3)",
                  marginBottom: 12,
                }}
              >
                {kpi.description}
              </p>
              {/* Sparkline */}
              <svg
                viewBox="0 0 200 44"
                preserveAspectRatio="none"
                style={{ width: "100%", height: 36 }}
              >
                <polyline
                  fill="none"
                  stroke={kpi.sparkColor}
                  strokeWidth="1.5"
                  points={kpi.sparkPoints}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          ))}
        </div>

        {/* Feature importance + pipeline */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
          className="ds-bottom"
        >
          {/* Feature importance */}
          <div className="panel corner" style={{ padding: "28px 28px 32px" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                color: "var(--cream-3)",
                marginBottom: 24,
              }}
            >
              Feature importance · churn model
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {dsSection.featureImportance.map((f) => (
                <div key={f.label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-term)",
                        fontSize: 12.5,
                        color: "var(--cream-2)",
                      }}
                    >
                      {f.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-term)",
                        fontSize: 12.5,
                        color: "var(--em)",
                      }}
                    >
                      {f.value}
                    </span>
                  </div>
                  <span
                    className="importance-bar"
                    style={{
                      width: `${f.width}%`,
                      animationDelay: f.delay ?? "0s",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline steps */}
          <div className="panel" style={{ padding: "28px 28px 32px" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                color: "var(--cream-3)",
                marginBottom: 24,
              }}
            >
              My data pipeline
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {dsSection.pipeline.map((step, i) => (
                <div
                  key={step.idx}
                  style={{
                    display: "flex",
                    gap: 20,
                    paddingBottom: i < dsSection.pipeline.length - 1 ? 22 : 0,
                    paddingTop: i > 0 ? 22 : 0,
                    borderBottom:
                      i < dsSection.pipeline.length - 1
                        ? "1px solid var(--line)"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: ".12em",
                      color: "var(--em)",
                      flexShrink: 0,
                      paddingTop: 2,
                    }}
                  >
                    {step.idx}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 18,
                        marginBottom: 4,
                      }}
                    >
                      {step.title}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--cream-2)",
                        lineHeight: 1.5,
                      }}
                    >
                      {step.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .ds-bottom { grid-template-columns: 1fr !important; }
          .ds-sub { display: none; }
        }
      `}</style>
    </section>
  );
}
