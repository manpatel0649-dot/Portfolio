"use client";

/**
 * NeuronInterior — Stage C scene with 5-tier typographic hierarchy.
 *
 * T1  Instrument Serif 56/30px  — equations z=Σ(w·x)+b  a=GELU(z)
 * T2  Courier Prime 700 32/20px — live z and a values (emerald)
 * T3  Courier Prime 20/15px     — weights wᵢ + bias b (pos emerald / neg amber)
 * T4  Courier Prime 16/13px     — inputs xᵢ (cream-2)
 * T5  Geist Mono 12/11px up     — caption + GELU axis labels (cream-3)
 *
 * Reveal order (opRef threshold): T1→T2→T3/T4 per-input staggered→T5
 * All labels carry a blurred dark backdrop for readability over WebGL.
 *
 * Desktop world positions (camera at z+4, viewport ≈ 5.3wu × 3.3wu):
 *   Inputs  x=-1.6,  y ±1.2 (n=5)
 *   Core    x=0,     y=0
 *   Output  x=+1.8,  y=0
 *   Panel   x=+0.52, y=+1.12
 *   Caption x=0,     y=-1.48
 *
 * Mobile world positions (viewport ≈ 1.53wu × 3.3wu):
 *   Inputs  x=-0.50, y ±0.70 (n=3)
 *   Core    x=0,     y=0
 *   Output  x=+0.60, y=0
 *   Eq1     x=0,     y=+0.95
 *   Eq2     x=+0.28, y=+0.50
 *   Panel   x=+0.22, y=+1.30
 *   Caption x=0,     y=-1.25
 */

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { getSceneState } from "@/components/three/useSceneStore";
import { TARGET_NEURON_POS } from "@/lib/network";

// ── Neuron math ───────────────────────────────────────────────────────────────

const W5   = [0.42, -0.17, 0.88, 0.05, -0.63] as const;
const W3   = [0.42, 0.88, -0.63] as const;
const BIAS = 0.12;

function gelu(x: number): number {
  const c = Math.sqrt(2 / Math.PI);
  return 0.5 * x * (1 + Math.tanh(c * (x + 0.044715 * x ** 3)));
}

// ── Layout constants ──────────────────────────────────────────────────────────

const INPUT_X     = -1.60;
const INPUT_X_MOB = -0.50;
const CORE_X      =  0.00;
const OUTPUT_X    = +1.80;
const OUTPUT_X_MOB = +0.60;
const Y_HALF      = 1.20;
const Y_HALF_MOB  = 0.70;

const EM_HDR    = new THREE.Color(0.8, 3.2, 1.4);
const EM_HEX    = "#34d399";
const AMBER_HEX = "#ffbd38"; // design-system amber for negative weights

// ── Shared style tokens ───────────────────────────────────────────────────────

// Dark blurred backdrop applied to every label container
const BD: React.CSSProperties = {
  background:          "rgba(4,28,28,0.78)",
  backdropFilter:      "blur(4px)",
  borderRadius:        "3px",
  padding:             "2px 8px",
  whiteSpace:          "nowrap",
  pointerEvents:       "none",
  userSelect:          "none",
  display:             "inline-block",
};

const SERIF  = "var(--font-serif, Georgia, serif)";
const TERM   = "var(--font-term, var(--font-courier-prime, 'Courier New', monospace))";
const MONO   = "var(--font-mono, monospace)";
const CREAM  = "rgba(255,230,203,0.92)";
const CREAM2 = "rgba(255,230,203,0.66)";
const CREAM3 = "rgba(255,230,203,0.38)";

// ── Component ─────────────────────────────────────────────────────────────────

export default function NeuronInterior() {
  const groupRef  = useRef<THREE.Group>(null);
  const coreMtRef = useRef<THREE.MeshBasicMaterial>(null);
  const ptMtRef   = useRef<THREE.PointsMaterial>(null);

  // Live-value spans — mutated in useFrame, never cause re-renders
  const zSpanRef   = useRef<HTMLSpanElement>(null);
  const outSpanRef = useRef<HTMLSpanElement>(null);
  const dotRef     = useRef<SVGCircleElement>(null);

  // Tier reveal wrappers — opacity updated in useFrame
  const t1aRef  = useRef<HTMLDivElement>(null);   // T1 z equation
  const t1bRef  = useRef<HTMLDivElement>(null);   // T1 a equation
  const t2zRef  = useRef<HTMLDivElement>(null);   // T2 live z
  const t2aRef  = useRef<HTMLDivElement>(null);   // T2 live a
  const t3bRef  = useRef<HTMLDivElement>(null);   // T3 bias
  const inputRefs = useRef<(HTMLDivElement | null)[]>([]); // T3+T4 per input
  const t5Ref   = useRef<HTMLDivElement>(null);   // T5 caption

  const { size } = useThree();
  const isMobile = size.width < 900;
  const weights  = isMobile ? W3 : W5;
  const n        = weights.length;

  const inX   = isMobile ? INPUT_X_MOB : INPUT_X;
  const outX  = isMobile ? OUTPUT_X_MOB : OUTPUT_X;
  const yHalf = isMobile ? Y_HALF_MOB : Y_HALF;

  const inputYs = useMemo(() =>
    Array.from({ length: n }, (_, i) =>
      n <= 1 ? 0 : yHalf - (i / (n - 1)) * yHalf * 2,
    ),
  [n, yHalf]);

  // ── Particle stream ───────────────────────────────────────────────────────

  const PPS   = 4;
  const total = n * PPS;

  const phasesRef = useRef(
    new Float32Array(Array.from({ length: total }, (_, i) => i / PPS)),
  );
  const posArr = useRef(new Float32Array(total * 3));
  const ptAttr = useRef<THREE.BufferAttribute | null>(null);

  const ptGeo = useMemo(() => {
    const geo  = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(posArr.current, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", attr);
    ptAttr.current = attr;
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Main loop ─────────────────────────────────────────────────────────────

  const opRef = useRef(0);

  useFrame((state, delta) => {
    const { stage, stageProgress, totalProgress: tp } = getSceneState();
    const g = groupRef.current;
    if (!g) return;

    // Smoothstep crossfade on totalProgress — no hard stage-boundary resets
    let target = 0;
    if (tp >= 0.30 && tp < 0.37) {
      const x = (tp - 0.30) / 0.07;
      target = x * x * (3 - 2 * x);
    } else if (tp >= 0.37 && tp < 0.50) {
      target = 1.0;
    } else if (tp >= 0.50 && tp < 0.57) {
      const x = (tp - 0.50) / 0.07;
      target = 1.0 - x * x * (3 - 2 * x);
    }
    void stage; void stageProgress;

    opRef.current += (target - opRef.current) * 0.12;
    const op = opRef.current;
    g.visible = op > 0.01;
    if (!g.visible) return;

    // Staggered tier reveal: each tier fades in as op crosses its threshold.
    // Order: T1 (equations) → T2 (values) → T3/T4 (weights/inputs) → T5 (caption)
    const tierOp = (thresh: number) =>
      Math.max(0, Math.min(1, (op - thresh) / 0.20));

    if (t1aRef.current)  t1aRef.current.style.opacity  = String(tierOp(0.08));
    if (t1bRef.current)  t1bRef.current.style.opacity  = String(tierOp(0.08));
    if (t2zRef.current)  t2zRef.current.style.opacity  = String(tierOp(0.28));
    if (t2aRef.current)  t2aRef.current.style.opacity  = String(tierOp(0.28));
    if (t3bRef.current)  t3bRef.current.style.opacity  = String(tierOp(0.44));
    inputRefs.current.forEach((el, i) => {
      if (el) el.style.opacity = String(tierOp(0.46 + i * 0.07));
    });
    if (t5Ref.current)   t5Ref.current.style.opacity   = String(tierOp(0.80));

    const t = state.clock.elapsedTime;

    // Live math
    const inputs = (weights as readonly number[]).map(
      (_, i) => 0.5 + 0.35 * Math.sin(t * 0.22 + i * 1.5),
    );
    const z   = (weights as readonly number[]).reduce((s, w, i) => s + w * inputs[i], BIAS);
    const out = gelu(z);

    // Core brightness follows |z|
    if (coreMtRef.current) {
      const br = Math.min(1, 0.3 + Math.abs(z) * 0.5);
      coreMtRef.current.color.set(br * 0.8, br * 3.2, br * 1.4);
      coreMtRef.current.opacity = op;
    }
    if (ptMtRef.current) ptMtRef.current.opacity = op * 0.85;

    // Push live values to DOM
    if (zSpanRef.current)   zSpanRef.current.textContent   = z.toFixed(3);
    if (outSpanRef.current) outSpanRef.current.textContent = out.toFixed(3);

    // Move dot on GELU SVG
    if (dotRef.current) {
      const svgW  = isMobile ? 68 : 90;
      const svgH  = isMobile ? 38 : 46;
      const cz    = Math.max(-2, Math.min(2, z));
      const svgX  = ((cz + 2) / 4 * svgW).toFixed(1);
      const geluY = gelu(cz);
      const svgY  = Math.max(1, Math.min(svgH - 1, svgH / 2 - geluY * svgH * 0.35)).toFixed(1);
      dotRef.current.setAttribute("cx", svgX);
      dotRef.current.setAttribute("cy", svgY);
    }

    // Advance particles
    const phases = phasesRef.current;
    const pos    = posArr.current;
    for (let i = 0; i < n; i++) {
      const iy    = inputYs[i];
      const speed = 0.18 + Math.abs((weights as readonly number[])[i]) * 0.28;
      for (let p = 0; p < PPS; p++) {
        const idx = i * PPS + p;
        phases[idx] = (phases[idx] + delta * speed) % 1;
        const ph  = phases[idx];
        const b   = idx * 3;
        pos[b]     = inX + (CORE_X - inX) * ph;
        pos[b + 1] = iy * (1 - ph * ph);
        pos[b + 2] = 0;
      }
    }
    if (ptAttr.current) ptAttr.current.needsUpdate = true;
  });

  // ── JSX ───────────────────────────────────────────────────────────────────

  const [wx, wy, wz] = TARGET_NEURON_POS;

  // Pick between desktop and mobile values
  const d = <T,>(desktop: T, mobile: T): T => isMobile ? mobile : desktop;

  return (
    <group ref={groupRef} position={[wx, wy, wz]} visible={false}>

      {/* ── Input streams: line + T4 (xᵢ) + T3 (wᵢ) ─────────────── */}
      {(weights as readonly number[]).map((w, i) => {
        const iy    = inputYs[i];
        const isNeg = w < 0;
        const col   = isNeg ? AMBER_HEX : EM_HEX;
        const lw    = 1.0 + Math.abs(w) * 2.0;
        const wSign = w > 0 ? "+" : "";
        const sub   = ["₁", "₂", "₃", "₄", "₅"][i] ?? String(i + 1);
        return (
          <group key={i}>
            <Line
              points={[[inX, iy, 0], [CORE_X, 0, 0]]}
              color={col}
              lineWidth={lw}
              transparent
              opacity={0.4 + Math.abs(w) * 0.35}
            />
            <Html position={[inX - 0.06, iy, 0]} center>
              <div
                ref={el => { inputRefs.current[i] = el; }}
                style={{ opacity: 0, textAlign: "right" }}
              >
                {/* T4 — input label */}
                <div style={{
                  ...BD,
                  fontFamily:  TERM,
                  fontSize:    d(16, 13),
                  color:       CREAM2,
                  lineHeight:  1.3,
                  marginBottom: 3,
                }}>
                  x{sub}
                </div>
                {/* T3 — weight value */}
                <div style={{
                  ...BD,
                  fontFamily: TERM,
                  fontSize:   d(20, 15),
                  color:      col,
                  lineHeight: 1.2,
                }}>
                  w = {wSign}{w.toFixed(2)}
                </div>
              </div>
            </Html>
          </group>
        );
      })}

      {/* ── Particles ──────────────────────────────────────────────── */}
      <points geometry={ptGeo}>
        <pointsMaterial
          ref={ptMtRef}
          color={EM_HDR}
          size={0.04}
          sizeAttenuation
          transparent
          opacity={0}
          toneMapped={false}
        />
      </points>

      {/* ── Core sphere ────────────────────────────────────────────── */}
      <mesh position={[CORE_X, 0, 0]}>
        <sphereGeometry args={[0.20, 20, 14]} />
        <meshBasicMaterial
          ref={coreMtRef}
          color={EM_HDR}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>

      {/* T1 — z equation above core ───────────────────────────────── */}
      <Html position={[CORE_X, d(0.58, 0.95), 0]} center>
        <div ref={t1aRef} style={{ opacity: 0, textAlign: "center" }}>
          <div style={{ ...BD, padding: "4px 12px" }}>
            <span style={{
              fontFamily: SERIF,
              fontSize:   d(56, 30),
              color:      CREAM,
              lineHeight: 1,
            }}>
              <em style={{ color: EM_HEX, fontStyle: "italic" }}>z</em>
              <span style={{ fontStyle: "normal" }}>{" = Σ(w·x) + b"}</span>
            </span>
          </div>
        </div>
      </Html>

      {/* T3 — bias below equation ─────────────────────────────────── */}
      <Html position={[CORE_X, d(0.24, 0.28), 0]} center>
        <div ref={t3bRef} style={{ opacity: 0 }}>
          <div style={{ ...BD }}>
            <span style={{
              fontFamily: TERM,
              fontSize:   d(20, 15),
              color:      CREAM2,
            }}>
              b = {BIAS}
            </span>
          </div>
        </div>
      </Html>

      {/* T2 — live z below core ───────────────────────────────────── */}
      <Html position={[CORE_X, d(-0.52, -0.52), 0]} center>
        <div ref={t2zRef} style={{ opacity: 0 }}>
          <div style={{ ...BD, padding: "4px 10px" }}>
            <span style={{
              fontFamily: TERM,
              fontSize:   d(32, 20),
              fontWeight: 700,
              color:      EM_HEX,
              lineHeight: 1,
            }}>
              <em style={{ fontStyle: "italic" }}>z</em>
              {" = "}
              <span ref={zSpanRef}>···</span>
            </span>
          </div>
        </div>
      </Html>

      {/* ── GELU panel ─────────────────────────────────────────────── */}
      <Html position={[d(0.52, 0.58), d(1.12, 0.85), 0]} center>
        <GeluPanel dotRef={dotRef} isMobile={isMobile} />
      </Html>

      {/* ── Output line ────────────────────────────────────────────── */}
      <Line
        points={[[CORE_X, 0, 0], [outX, 0, 0]]}
        color={EM_HEX}
        lineWidth={2}
        transparent
        opacity={0.6}
      />

      {/* T1 — a = GELU(z) equation near output ───────────────────── */}
      <Html position={[d(OUTPUT_X, 0.28), d(0.40, 0.50), 0]} center>
        <div ref={t1bRef} style={{ opacity: 0, textAlign: "center" }}>
          <div style={{ ...BD, padding: "4px 12px" }}>
            <span style={{
              fontFamily: SERIF,
              fontSize:   d(56, 30),
              color:      CREAM,
              lineHeight: 1,
            }}>
              <em style={{ color: EM_HEX, fontStyle: "italic" }}>a</em>
              {" = GELU("}
              <em style={{ color: EM_HEX, fontStyle: "italic" }}>z</em>
              {")"}
            </span>
          </div>
        </div>
      </Html>

      {/* T2 — live a value ────────────────────────────────────────── */}
      <Html position={[d(OUTPUT_X, 0.28), d(-0.40, -0.72), 0]} center>
        <div ref={t2aRef} style={{ opacity: 0, textAlign: "center" }}>
          <div style={{ ...BD, padding: "4px 10px" }}>
            <span style={{
              fontFamily: TERM,
              fontSize:   d(32, 20),
              fontWeight: 700,
              color:      EM_HEX,
              lineHeight: 1,
              display:    "block",
            }}>
              <em style={{ fontStyle: "italic" }}>a</em>
              {" = "}
              <span ref={outSpanRef}>···</span>
            </span>
            <span style={{
              fontFamily:    MONO,
              fontSize:      d(12, 11),
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
              color:         CREAM3,
              display:       "block",
              marginTop:     4,
            }}>
              → NEXT LAYER
            </span>
          </div>
        </div>
      </Html>

      {/* T5 — caption ─────────────────────────────────────────────── */}
      <Html position={[0, d(-1.48, -1.25), 0]} center>
        <div ref={t5Ref} style={{ opacity: 0 }}>
          <div style={{ ...BD }}>
            <span style={{
              fontFamily:    MONO,
              fontSize:      d(12, 11),
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
              color:         CREAM3,
            }}>
              INSIDE NEURON 2·07 — HIDDEN LAYER 2
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}

// ── GELU curve SVG panel ──────────────────────────────────────────────────────

function GeluPanel({
  dotRef,
  isMobile,
}: {
  dotRef:   React.RefObject<SVGCircleElement | null>;
  isMobile: boolean;
}) {
  const W = isMobile ? 68 : 90;
  const H = isMobile ? 38 : 46;

  const curvePoints = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const x  = (i / 59) * 4 - 2;
      const y  = gelu(x);
      const px = (i / 59) * W;
      const py = H / 2 - y * H * 0.35;
      return `${px.toFixed(1)},${Math.max(1, Math.min(H - 1, py)).toFixed(1)}`;
    }).join(" ");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, H]);

  const axisLabel: React.CSSProperties = {
    fontFamily:    `var(--font-mono, monospace)`,
    fontSize:      isMobile ? 7 : 8,
    fill:          "rgba(255,230,203,0.28)" as string,
    letterSpacing: "0.08em",
  };

  return (
    <div style={{
      background:     "rgba(4,28,28,0.88)",
      backdropFilter: "blur(4px)",
      border:         "1px solid rgba(255,230,203,0.12)",
      borderRadius:   4,
      padding:        "5px 7px 4px",
      pointerEvents:  "none",
    }}>
      {/* T5 — GELU label */}
      <div style={{
        fontFamily:    `var(--font-mono, monospace)`,
        fontSize:      isMobile ? 11 : 12,
        letterSpacing: "0.14em",
        textTransform: "uppercase" as const,
        color:         "rgba(255,230,203,0.48)",
        marginBottom:  4,
        userSelect:    "none",
      }}>
        GELU
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        {/* Axes */}
        <line x1="0"     y1={H / 2} x2={W}     y2={H / 2}
          stroke="rgba(255,230,203,0.08)" strokeWidth="0.5" />
        <line x1={W / 2} y1="0"     x2={W / 2} y2={H}
          stroke="rgba(255,230,203,0.08)" strokeWidth="0.5" />
        {/* T5 axis labels */}
        <text x={W - 2} y={H / 2 - 3} textAnchor="end" style={axisLabel}>x</text>
        <text x={W / 2 + 3} y={9}       style={axisLabel}>f(x)</text>
        {/* Curve */}
        <polyline
          points={curvePoints}
          fill="none"
          stroke={EM_HEX}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Live dot */}
        <circle ref={dotRef} cx={W / 2} cy={H / 2} r="2.8"
          fill={EM_HEX} opacity="0.9" />
      </svg>
    </div>
  );
}
