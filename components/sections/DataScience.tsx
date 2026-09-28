"use client";

import { useEffect, useRef, useState } from "react";
import { dsSection, confusionMatrix } from "@/content/datascience";

// Count-up hook: animates 0 → target over 900ms when ref enters viewport
function useCountUp(target: number | null, ref: React.RefObject<HTMLElement | null>) {
  const [value, setValue] = useState<number>(0);
  useEffect(() => {
    if (target === null) return;
    const el = ref.current;
    if (!el) return;
    let raf: number;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        const start = performance.now();
        const duration = 900;
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
          setValue(Math.round(eased * target));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => { obs.disconnect(); cancelAnimationFrame(raf); };
  }, [target, ref]);
  return value;
}

// Parse "5k" → 5000, else null (placeholder strings stay static)
function parseKpiNumeric(val: string): number | null {
  const m = val.match(/^(\d+)k$/i);
  return m ? parseInt(m[1], 10) * 1000 : null;
}

function formatKpiNumeric(raw: number | null, animVal: number): string {
  if (raw === null) return "";
  return `${Math.round(animVal / 1000)}k`;
}

function KpiCard({ kpi }: { kpi: typeof dsSection.kpis[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const numeric = parseKpiNumeric(kpi.value);
  const animated = useCountUp(numeric, ref as React.RefObject<HTMLElement | null>);
  const display = numeric !== null ? formatKpiNumeric(numeric, animated) : kpi.value;

  return (
    <div ref={ref} className="panel" style={{ padding: "20px 22px 16px" }}>
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
          {display}
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
      <p style={{ fontSize: 12.5, color: "var(--cream-3)", marginBottom: 12 }}>
        {kpi.description}
      </p>
      <svg viewBox="0 0 200 44" preserveAspectRatio="none" style={{ width: "100%", height: 36 }}>
        <polyline
          fill="none"
          stroke={kpi.sparkColor}
          strokeWidth="1.5"
          points={kpi.sparkPoints}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

// Confusion matrix with cells fading in ordered by intensity (highest first)
function ConfusionMatrix() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleSet, setVisibleSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const sorted = [...confusionMatrix.cells].sort((a, b) => b.intensity - a.intensity);
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        sorted.forEach((cell, i) => {
          setTimeout(() => {
            setVisibleSet(prev => new Set([...prev, cell.label]));
          }, i * 120);
        });
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="panel" style={{ padding: "28px 28px 32px" }}>
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
        {confusionMatrix.title}
      </div>
      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 4, marginBottom: 4 }}>
        <div />
        {confusionMatrix.cols.map(c => (
          <div
            key={c}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "var(--cream-3)",
              textAlign: "center",
            }}
          >
            {c}
          </div>
        ))}
      </div>
      {/* Rows */}
      {confusionMatrix.rows.map((row, ri) => (
        <div
          key={row}
          style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 4, marginBottom: 4 }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "var(--cream-3)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {row}
          </div>
          {confusionMatrix.cells.slice(ri * 2, ri * 2 + 2).map(cell => {
            const visible = visibleSet.has(cell.label);
            return (
              <div
                key={cell.label}
                style={{
                  padding: "14px 10px",
                  border: "1px solid var(--line)",
                  borderRadius: 4,
                  textAlign: "center",
                  background: cell.good ? "rgba(52,211,153,.06)" : "transparent",
                  opacity: visible ? 1 : 0,
                  transition: "opacity .45s cubic-bezier(.16,1,.3,1)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    color: cell.good ? "var(--em)" : "var(--cream-3)",
                    marginBottom: 4,
                  }}
                >
                  {cell.label}
                </div>
                <div style={{ fontFamily: "var(--font-term)", fontSize: 18, color: "var(--cream)" }}>
                  {cell.value}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

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
            <KpiCard key={kpi.title} kpi={kpi} />
          ))}
        </div>

        {/* Feature importance + confusion matrix + pipeline */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
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

          {/* Confusion matrix */}
          <ConfusionMatrix />

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
