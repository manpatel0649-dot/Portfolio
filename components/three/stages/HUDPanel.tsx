"use client";

/**
 * HUDPanel — "Model Inspector · Live" overlay for Stage E.
 *
 * DOM overlay (not drei Html) fixed to viewport:
 *   Desktop: left-centre panel (~200px wide)
 *   Mobile:  bottom strip
 *
 * Performance strategy:
 *   - React state: `counts` (animated once on first Stage E entry) + `opacity`
 *   - DOM refs: yaw / pitch / view / activePulses (updated by orbitStore subscriber,
 *     bypasses React re-renders on every frame)
 */

import { useEffect, useRef, useState } from "react";
import { subscribeOrbitState, getOrbitState } from "@/lib/orbitStore";
import { subscribeSceneState, getSceneState } from "@/components/three/useSceneStore";
import { NETWORK_STATS } from "@/lib/network";

// ── Count-up helper ────────────────────────────────────────────────────────────

interface Counts { layers: number; neurons: number; weights: number; biases: number; params: number; }

function countUp(
  targets: Counts,
  duration: number,
  setFn: (v: Counts) => void,
): () => void {
  const start = Date.now();
  const id = setInterval(() => {
    const t  = Math.min(1, (Date.now() - start) / duration);
    const e  = t * t * (3 - 2 * t); // smoothstep
    setFn({
      layers:  Math.round(e * targets.layers),
      neurons: Math.round(e * targets.neurons),
      weights: Math.round(e * targets.weights),
      biases:  Math.round(e * targets.biases),
      params:  Math.round(e * targets.params),
    });
    if (t >= 1) clearInterval(id);
  }, 16);
  return () => clearInterval(id);
}

const FINAL: Counts = {
  layers:  NETWORK_STATS.layers,
  neurons: NETWORK_STATS.neurons,
  weights: NETWORK_STATS.fullWeights,
  biases:  NETWORK_STATS.fullBiases,
  params:  NETWORK_STATS.fullParams,
};

const ZERO: Counts = { layers: 0, neurons: 0, weights: 0, biases: 0, params: 0 };

// ── Scramble helper ────────────────────────────────────────────────────────────

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ·—";
function scramble(
  target: string,
  steps: number,
  onTick: (s: string) => void,
  onDone: () => void,
): () => void {
  let step = 0;
  const id = setInterval(() => {
    if (step >= steps) { onDone(); clearInterval(id); return; }
    const rand = Array.from({ length: target.length }, () =>
      SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)],
    ).join("");
    onTick(rand);
    step++;
  }, 45);
  return () => clearInterval(id);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HUDPanel() {
  const [visible,  setVisible]  = useState(false);
  const [opacity,  setOpacity]  = useState(0);
  const [counts,   setCounts]   = useState(ZERO);
  const [viewDisp, setViewDisp] = useState<string>("FRONT");

  const hasAnimated = useRef(false);
  const lastView    = useRef<string>("FRONT");
  const scrambleRef = useRef<(() => void) | null>(null);

  // DOM refs for live telemetry (updated imperatively, never causes React re-render)
  const yawRef     = useRef<HTMLSpanElement>(null);
  const pitchRef   = useRef<HTMLSpanElement>(null);
  const pulsesRef  = useRef<HTMLSpanElement>(null);
  const dotRef     = useRef<SVGCircleElement>(null);

  // Subscribe to sceneStore for stage changes
  useEffect(() => {
    function update() {
      const { stage } = getSceneState();
      const inE = stage === "E";
      setVisible(inE);
      setOpacity(inE ? 1 : 0);
      if (inE && !hasAnimated.current) {
        hasAnimated.current = true;
        const cancel = countUp(FINAL, 800, setCounts);
        return cancel;
      }
    }
    const unsub = subscribeSceneState(update);
    update(); // run once on mount
    return unsub;
  }, []);

  // Subscribe to orbitStore — update DOM refs directly for live values
  useEffect(() => {
    function update() {
      const s = getOrbitState();

      // Live numeric readouts via DOM (no React re-render)
      if (yawRef.current)
        yawRef.current.textContent    = `${Math.round(s.yawDeg).toString().padStart(3, "0")}°`;
      if (pitchRef.current)
        pitchRef.current.textContent  = `${Math.round(s.pitchDeg).toString().padStart(2, "0")}°`;
      if (pulsesRef.current)
        pulsesRef.current.textContent = `${s.activePulses}`;

      // Orbit dial dot
      if (dotRef.current) {
        const angle = ((s.yawDeg - 90) * Math.PI) / 180;
        const x = (22 + 16 * Math.cos(angle)).toFixed(1);
        const y = (22 + 16 * Math.sin(angle)).toFixed(1);
        dotRef.current.setAttribute("cx", x);
        dotRef.current.setAttribute("cy", y);
      }

      // View label: scramble on change (React state — infrequent)
      if (s.view !== lastView.current) {
        const next = s.view;
        lastView.current = next;
        scrambleRef.current?.();
        const cancel = scramble(next, 5, setViewDisp, () => setViewDisp(next));
        scrambleRef.current = cancel;
      }
    }

    const unsub = subscribeOrbitState(update);
    update();
    return () => { unsub(); scrambleRef.current?.(); };
  }, []);

  if (!visible && opacity === 0) return null;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 900;

  // ── Styles ─────────────────────────────────────────────────────────────────

  const panelStyle: React.CSSProperties = {
    position:        "fixed",
    zIndex:          10,
    pointerEvents:   "none",
    opacity,
    transition:      "opacity .5s ease",
    background:      "rgba(4,28,28,.82)",
    border:          "1px solid rgba(255,230,203,.12)",
    backdropFilter:  "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderRadius:    "4px",
    fontFamily:      "var(--font-mono, monospace)",
    fontSize:        "10px",
    letterSpacing:   ".12em",
    textTransform:   "uppercase",
    color:           "rgba(255,230,203,.55)",
    ...(isMobile ? {
      bottom: "16px",
      left:   "10px",
      right:  "10px",
      padding: "10px 14px",
    } : {
      left:      "20px",
      top:       "50%",
      transform: "translateY(-50%)",
      width:     "196px",
    }),
  };

  const headerStyle: React.CSSProperties = {
    padding:       "10px 14px",
    borderBottom:  "1px solid rgba(255,230,203,.10)",
    color:         "rgba(255,230,203,.45)",
    letterSpacing: ".14em",
    whiteSpace:    "nowrap",
  };

  const sectionStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderBottom: "1px solid rgba(255,230,203,.08)",
  };

  const rowStyle: React.CSSProperties = {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    lineHeight:     2,
  };

  const valStyle: React.CSSProperties = {
    fontFamily:    "var(--font-term, 'Courier Prime', monospace)",
    fontSize:      "12px",
    color:         "rgba(255,230,203,.85)",
    letterSpacing: ".04em",
  };

  const emStyle: React.CSSProperties = {
    ...valStyle,
    color: "#34d399",
  };

  // ── Mobile layout ───────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <div style={panelStyle}>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" as const, alignItems: "center" }}>
          <span>LAYERS <span style={valStyle}>{counts.layers}</span></span>
          <span>PARAMS <span style={valStyle}>{counts.params}</span></span>
          <span>VIEW <span style={emStyle}>{viewDisp}</span></span>
          <span>YAW <span ref={yawRef} style={valStyle}>000°</span></span>
        </div>
      </div>
    );
  }

  // ── Desktop layout ──────────────────────────────────────────────────────────

  return (
    <div style={panelStyle} className="corner">
      {/* Header */}
      <div style={headerStyle}>Model Inspector · Live</div>

      {/* Static topology */}
      <div style={sectionStyle}>
        <div style={{ ...rowStyle, marginBottom: "4px" }}>
          <span>Architecture</span>
        </div>
        <div style={{
          fontFamily:    "var(--font-term, monospace)",
          fontSize:      "11px",
          color:         "#34d399",
          letterSpacing: ".04em",
          marginBottom:  "8px",
        }}>
          6→10→14→14→10→6
        </div>
        <div style={rowStyle}>
          <span>Layers</span>
          <span style={valStyle}>{counts.layers}</span>
        </div>
        <div style={rowStyle}>
          <span>Neurons</span>
          <span style={valStyle}>{counts.neurons}</span>
        </div>
        <div style={rowStyle}>
          <span>Weights</span>
          <span style={valStyle}>{counts.weights}</span>
        </div>
        <div style={rowStyle}>
          <span>Biases</span>
          <span style={valStyle}>{counts.biases}</span>
        </div>
        <div style={rowStyle}>
          <span>Params</span>
          <span style={valStyle}>{counts.params}</span>
        </div>
        <div style={rowStyle}>
          <span>Activation</span>
          <span style={emStyle}>GELU</span>
        </div>
      </div>

      {/* Live telemetry */}
      <div style={sectionStyle}>
        <div style={rowStyle}>
          <span>View</span>
          <span style={emStyle}>{viewDisp}</span>
        </div>
        <div style={rowStyle}>
          <span>Yaw</span>
          <span ref={yawRef} style={valStyle}>000°</span>
        </div>
        <div style={rowStyle}>
          <span>Pitch</span>
          <span ref={pitchRef} style={valStyle}>00°</span>
        </div>
        <div style={rowStyle}>
          <span>Signals</span>
          <span ref={pulsesRef} style={valStyle}>—</span>
        </div>
      </div>

      {/* Orbit dial */}
      <div style={{
        display:        "flex",
        justifyContent: "center",
        alignItems:     "center",
        padding:        "10px 14px",
        gap:            "10px",
      }}>
        <svg width="44" height="44" viewBox="0 0 44 44" style={{ overflow: "visible" }}>
          {/* Orbit ring */}
          <circle cx="22" cy="22" r="16"
            stroke="rgba(255,230,203,.12)" strokeWidth="1" fill="none" />
          {/* Cardinal ticks: top=FRONT, right=SIDE, bottom=BACK */}
          <line x1="22" y1="6"  x2="22" y2="9"  stroke="rgba(255,230,203,.30)" strokeWidth="1" />
          <line x1="38" y1="22" x2="35" y2="22" stroke="rgba(255,230,203,.30)" strokeWidth="1" />
          <line x1="22" y1="38" x2="22" y2="35" stroke="rgba(255,230,203,.30)" strokeWidth="1" />
          <line x1="6"  y1="22" x2="9"  y2="22" stroke="rgba(255,230,203,.30)" strokeWidth="1" />
          {/* Cardinal micro-labels */}
          <text x="22" y="4" textAnchor="middle" fontSize="5"
            fill="rgba(255,230,203,.35)" fontFamily="monospace">F</text>
          <text x="41" y="23" textAnchor="middle" fontSize="5"
            fill="rgba(255,230,203,.35)" fontFamily="monospace">S</text>
          <text x="22" y="42" textAnchor="middle" fontSize="5"
            fill="rgba(255,230,203,.35)" fontFamily="monospace">B</text>
          {/* Dot: starts at top (FRONT). Updated imperatively via ref. */}
          <circle ref={dotRef} cx="22" cy="6" r="3" fill="#34d399" />
        </svg>
        <span style={{ fontSize: "9px", color: "rgba(255,230,203,.35)", lineHeight: 1.6 }}>
          ORBIT<br />DIAL
        </span>
      </div>
    </div>
  );
}
