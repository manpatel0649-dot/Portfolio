import { workCards, llmSpec } from "@/content/projects";
import Tag from "@/components/ui/Tag";
import TestCaseGenerator from "@/components/effects/TestCaseGenerator";
import LossChart from "@/components/effects/LossChart";

export default function Work() {
  return (
    <section className="section" id="work">
      <div className="wrap">
        {/* Section header */}
        <div className="shead">
          <div>
            <div className="section-label">
              <b>01</b> Selected work
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
              Things I&apos;ve{" "}
              <i style={{ color: "var(--em)" }}>built</i>
            </h2>
          </div>
        </div>

        {/* Top row: large cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "7fr 5fr",
            gap: 16,
            marginBottom: 16,
          }}
          className="work-top"
        >
          {/* Qeist.io card */}
          <div className="panel corner">
            <div className="bar">
              <span>Flagship · SaaS</span>
              <span className="idx">001</span>
            </div>
            <div style={{ padding: "24px 28px 8px" }}>
              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontWeight: 400,
                  fontSize: 32,
                  lineHeight: 1.1,
                  marginBottom: 12,
                }}
              >
                Qeist.io
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--cream-2)",
                  lineHeight: 1.65,
                  maxWidth: 480,
                  marginBottom: 18,
                }}
              >
                AI that turns product requirements into complete, ready-to-run
                test cases for QA teams.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {workCards[0].tags.map((t) => (
                  <Tag key={t.label} variant={t.variant}>
                    {t.label}
                  </Tag>
                ))}
              </div>
            </div>
            <TestCaseGenerator />
          </div>

          {/* LLM card */}
          <div className="panel corner">
            <div className="bar">
              <span>LLM Lab</span>
              <span className="idx">002</span>
            </div>
            <div style={{ padding: "24px 28px 8px" }}>
              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontWeight: 400,
                  fontSize: 32,
                  lineHeight: 1.1,
                  marginBottom: 12,
                }}
              >
                My own <i style={{ color: "var(--em)" }}>LLM</i>
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--cream-2)",
                  lineHeight: 1.65,
                  marginBottom: 18,
                }}
              >
                A decoder-only transformer trained from scratch. Tokenizer,
                pre-training and evals — all mine.
              </p>

              {/* Spec grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1px",
                  border: "1px solid var(--line)",
                  borderRadius: 4,
                  overflow: "hidden",
                  marginBottom: 8,
                }}
              >
                {llmSpec.map((s, i) => (
                  <div
                    key={s.label}
                    style={{
                      padding: "12px 14px",
                      background: "var(--panel-2)",
                      borderRight: i % 2 === 0 ? "1px solid var(--line)" : "none",
                      borderBottom: i < 2 ? "1px solid var(--line)" : "none",
                    }}
                  >
                    <small
                      style={{
                        display: "block",
                        fontFamily: "var(--font-mono)",
                        fontSize: 9.5,
                        letterSpacing: ".14em",
                        textTransform: "uppercase",
                        color: "var(--cream-3)",
                        marginBottom: 4,
                      }}
                    >
                      {s.label}
                    </small>
                    <span
                      style={{
                        fontFamily: "var(--font-term)",
                        fontSize: 15,
                        color: "var(--cream)",
                      }}
                    >
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <LossChart />
          </div>
        </div>

        {/* Bottom row: small cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
          className="work-bottom"
        >
          {workCards.slice(2).map((card) => (
            <div key={card.id} className="panel corner" style={{ padding: "24px 28px 28px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 14,
                }}
              >
                <span className="idx">{card.idx}</span>
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontWeight: 400,
                  fontSize: 22,
                  lineHeight: 1.2,
                  marginBottom: 10,
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--cream-2)",
                  lineHeight: 1.6,
                  marginBottom: 18,
                }}
              >
                {card.description}
              </p>

              {/* Flow */}
              {card.flow && (
                <div className="flow" style={{ marginBottom: 18 }}>
                  {card.flow.map((step, i) => (
                    <span key={step}>
                      {step}
                      {i < card.flow!.length - 1 && (
                        <em style={{ marginLeft: 8 }}>→</em>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* Tags */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {card.tags.map((t) => (
                  <Tag key={t.label} variant={t.variant}>
                    {t.label}
                  </Tag>
                ))}
              </div>

              {/* Links */}
              {card.links && (
                <div style={{ display: "flex", gap: 16 }}>
                  {card.links.map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      className="card-link"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .card-link {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--cream-2);
          transition: color .2s;
        }
        .card-link:hover { color: var(--em); }
        @media (max-width: 900px) {
          .work-top { grid-template-columns: 1fr !important; }
          .work-bottom { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
