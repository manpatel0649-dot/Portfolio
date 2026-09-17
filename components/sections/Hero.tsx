import { profile } from "@/content/profile";
import Btn from "@/components/ui/Btn";
import TrainingTerminal from "@/components/effects/TrainingTerminal";

export default function Hero() {
  return (
    <header
      style={{
        padding: "88px 0 0",
        minHeight: "calc(100vh - 100px)",
      }}
    >
      <div className="wrap">
        {/* Two-column grid: headline left, terminal right */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr .8fr",
            gap: 48,
            alignItems: "end",
          }}
          className="hero-grid"
        >
          {/* Left: headline, lead, CTAs */}
          <div>
            <div className="section-label" style={{ marginBottom: 0 }}>
              <b>●</b> {profile.role}
            </div>

            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 400,
                fontSize: 112,
                lineHeight: 0.92,
                letterSpacing: "-.03em",
                margin: "26px 0 30px",
              }}
            >
              I build <i style={{ color: "var(--em)" }}>LLMs</i>,
              <br />
              AI agents &amp;
              <br />
              intelligent{" "}
              <span style={{ whiteSpace: "nowrap" }}>
                software
                <span
                  style={{
                    display: "inline-block",
                    width: ".06em",
                    height: ".78em",
                    background: "var(--em)",
                    marginLeft: ".08em",
                    verticalAlign: "-.04em",
                    animation: "blink 1s steps(1) infinite",
                  }}
                />
              </span>
            </h1>

            <p
              style={{
                fontSize: 18,
                color: "var(--cream-2)",
                maxWidth: 540,
                lineHeight: 1.65,
              }}
            >
              Founder of <strong style={{ color: "var(--cream)" }}>Qeist.io</strong> and{" "}
              <strong style={{ color: "var(--cream)" }}>Aoneq Labs</strong>. I train
              language models, design agents that do real work, and turn data into
              decisions.
            </p>

            <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
              <Btn href="#work" variant="pri">
                View selected work <span style={{ fontFamily: "var(--font-sans)" }}>↓</span>
              </Btn>
              <Btn href="#contact" variant="ghost">
                Book a call
              </Btn>
            </div>
          </div>

          {/* Right: training terminal (client) */}
          <TrainingTerminal />
        </div>

        {/* Proof strip */}
        <div
          style={{
            marginTop: 84,
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            borderTop: "1px solid var(--line)",
            borderBottom: "1px solid var(--line)",
          }}
          className="proof-strip"
        >
          {profile.proof.map((item, i) => (
            <div
              key={i}
              style={{
                padding: "22px 24px",
                borderRight:
                  i < profile.proof.length - 1 ? "1px solid var(--line)" : "none",
                ...(i === 0 ? { paddingLeft: 0 } : {}),
              }}
            >
              <small
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  color: "var(--cream-3)",
                }}
              >
                {item.label}
              </small>
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 28,
                  lineHeight: 1.15,
                  marginTop: 6,
                }}
              >
                {item.value}
                <i style={{ color: "var(--em)" }}>{item.suffix}</i>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Hero responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; align-items: start !important; }
          header h1 { font-size: 58px !important; }
          header p  { font-size: 16px !important; }
          .proof-strip { grid-template-columns: 1fr 1fr !important; margin-top: 48px !important; }
          .proof-strip > div { padding: 16px 12px !important; border-bottom: 1px solid var(--line) !important; }
          .proof-strip > div p { font-size: 21px !important; }
        }
      `}</style>
    </header>
  );
}
