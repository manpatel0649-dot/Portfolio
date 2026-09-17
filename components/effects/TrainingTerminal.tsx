"use client";

import { useEffect, useRef, useState } from "react";

interface Stats {
  step: number;
  loss: number;
  tps: number;
}

export default function TrainingTerminal() {
  const [lines, setLines] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({ step: 1200, loss: 3.4, tps: 15000 });
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let step = 1200;
    let loss = 3.4;

    const push = (html: string) => {
      setLines((prev) => {
        const next = [...prev, html];
        return next.length > 10 ? next.slice(-10) : next;
      });
    };

    push('<span style="color:var(--cream-3)">$</span> python train.py --config llm-lab.yaml');
    push('<span style="color:var(--cream-3)">[init]</span> tokenizer: BPE · vocab <span style="color:var(--amber)">32k</span>');
    push('<span style="color:var(--cream-3)">[init]</span> model: decoder-only transformer');

    const tick = () => {
      step += 50;
      loss = Math.max(1.05, loss * (0.985 + Math.random() * 0.01));
      const tps = Math.floor(14800 + Math.random() * 1600);
      setStats({ step, loss, tps });

      push(
        `<span style="color:var(--em)">step ${step.toLocaleString()}</span> <span style="color:var(--cream-3)">|</span> loss ${loss.toFixed(4)} <span style="color:var(--cream-3)">|</span> lr 3e-4 <span style="color:var(--cream-3)">|</span> ${tps.toLocaleString()} tok/s`
      );
      if (step % 500 === 0) {
        push(
          `<span style="color:var(--amber)">[eval]</span> val_loss ${(loss + 0.08).toFixed(4)} <span style="color:var(--em)">✓ checkpoint saved</span>`
        );
      }
    };

    // Pre-fill with 6 ticks of history
    for (let i = 0; i < 6; i++) tick();

    const timer = setInterval(tick, 900);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="panel corner" style={{ height: "100%" }}>
      {/* Panel header bar */}
      <div className="bar">
        <span>~/llm-lab · train.py</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="avail-dot" style={{ width: 6, height: 6 }} />
          live
        </span>
      </div>

      {/* Scrolling log */}
      <div
        ref={logRef}
        style={{
          padding: "16px 18px",
          height: 258,
          overflow: "hidden",
          fontFamily: "var(--font-term)",
          fontSize: 13,
          lineHeight: 1.75,
          color: "var(--cream-2)",
          whiteSpace: "nowrap",
        }}
        dangerouslySetInnerHTML={{ __html: lines.join("<br>") }}
      />

      {/* Stats footer */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          borderTop: "1px solid var(--line)",
        }}
      >
        {[
          { label: "step", value: stats.step.toLocaleString() },
          { label: "loss", value: stats.loss.toFixed(3) },
          { label: "tok/s", value: stats.tps.toLocaleString() },
        ].map((s, i) => (
          <div
            key={s.label}
            style={{
              padding: "12px 16px",
              borderRight: i < 2 ? "1px solid var(--line)" : "none",
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
              }}
            >
              {s.label}
            </small>
            <span
              style={{
                fontFamily: "var(--font-term)",
                fontSize: 20,
                color: "var(--cream)",
              }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
