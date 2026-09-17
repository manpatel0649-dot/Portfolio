"use client";

/**
 * NeuronInterior — Stage C scene: how a single neuron computes.
 *
 * Camera during C sits at APPROACH_POS (z = neuron.z + 4) looking at neuron center.
 * At fov=45, distance 4 → viewport ≈ 3.3h × 5.9w world units.
 *
 * Layout (group-local, group centred at target neuron world pos):
 *   Inputs  x = -1.6,  y spread -1.2 … +1.2  (5 inputs, 3 on mobile)
 *   Core    x =  0,    y = 0
 *   Output  x = +1.8,  y = 0
 *   Panel   x = +0.2,  y = +1.1
 *   Caption x =  0,    y = -1.5
 *
 * Live math runs in useFrame (no React state ↔ no re-renders).
 * DOM refs are mutated directly for z / output values and the curve dot.
 */

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { getSceneState } from "@/components/three/useSceneStore";
import { TARGET_NEURON_POS } from "@/lib/network";

// ── Neuron weights & GELU ──────────────────────────────────────────────────────

const W5   = [0.42, -0.17, 0.88, 0.05, -0.63] as const;
const W3   = [0.42, 0.88, -0.63] as const;
const BIAS = 0.12;

function gelu(x: number): number {
  const c = Math.sqrt(2 / Math.PI);
  return 0.5 * x * (1 + Math.tanh(c * (x + 0.044715 * x ** 3)));
}

// ── Layout constants ────────────────────────────────────────────────────────────

const INPUT_X  = -1.6;
const CORE_X   =  0.0;
const OUTPUT_X = +1.8;
const Y_HALF   = 1.2;   // half-height for n=5 spread

const EM_HDR   = new THREE.Color(0.8, 3.2, 1.4);
const EM_HEX   = "#34d399";
const AMBER_HEX = "#c09050"; // negative-weight tint — muted warm

// ── Component ──────────────────────────────────────────────────────────────────

export default function NeuronInterior() {
  const groupRef  = useRef<THREE.Group>(null);
  const coreMtRef = useRef<THREE.MeshBasicMaterial>(null);
  const ptMtRef   = useRef<THREE.PointsMaterial>(null);

  // DOM refs for live values — mutated in useFrame, never cause re-renders
  const zSpanRef   = useRef<HTMLSpanElement>(null);
  const outSpanRef = useRef<HTMLSpanElement>(null);
  const dotRef     = useRef<SVGCircleElement>(null);

  const { size } = useThree();
  const isMobile = size.width < 900;
  const weights  = isMobile ? W3 : W5;
  const n        = weights.length;

  // Y positions evenly spread between -Y_HALF and +Y_HALF
  const inputYs = useMemo(() =>
    Array.from({ length: n }, (_, i) =>
      n <= 1 ? 0 : Y_HALF - (i / (n - 1)) * Y_HALF * 2,
    ),
  [n]);

  // ── Particle stream ───────────────────────────────────────────────────────────

  const PPS   = 4; // particles per stream
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

  // ── Main loop ─────────────────────────────────────────────────────────────────

  const opRef = useRef(0);

  useFrame((state, delta) => {
    const { stage, stageProgress } = getSceneState();
    const g = groupRef.current;
    if (!g) return;

    // Fade in fast at C start; fade out fast at D start
    let target = 0;
    if (stage === "C") target = Math.min(1, stageProgress * 5);
    if (stage === "D") target = Math.max(0, 1 - stageProgress * 5);

    opRef.current += (target - opRef.current) * 0.12;
    const op = opRef.current;
    g.visible = op > 0.01;
    if (!g.visible) return;

    const t = state.clock.elapsedTime;

    // Compute live math
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

    // Push text to DOM without re-render
    if (zSpanRef.current)   zSpanRef.current.textContent   = z.toFixed(3);
    if (outSpanRef.current) outSpanRef.current.textContent = out.toFixed(3);

    // Move dot on GELU curve SVG
    if (dotRef.current) {
      const cz   = Math.max(-2, Math.min(2, z));
      const svgX = ((cz + 2) / 4 * 100).toFixed(1);
      const geluY = gelu(cz);
      const svgY  = Math.max(1, Math.min(44, 22 - geluY * 16)).toFixed(1);
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
        const idx  = i * PPS + p;
        phases[idx] = (phases[idx] + delta * speed) % 1;
        const tp    = phases[idx];
        const b     = idx * 3;
        pos[b]     = INPUT_X + (CORE_X - INPUT_X) * tp;
        pos[b + 1] = iy * (1 - tp * tp); // converge toward y=0 quadratically
        pos[b + 2] = 0;
      }
    }
    if (ptAttr.current) ptAttr.current.needsUpdate = true;
  });

  // ── JSX ───────────────────────────────────────────────────────────────────────

  const [wx, wy, wz] = TARGET_NEURON_POS;

  const baseLbl = {
    fontFamily:    "var(--font-courier-prime, 'Courier New', monospace)",
    fontSize:      isMobile ? 9 : 10,
    color:         "rgba(255,230,203,0.65)",
    whiteSpace:    "nowrap" as const,
    pointerEvents: "none" as const,
    userSelect:    "none" as const,
    lineHeight:    1.5,
  };
  const emLbl = { ...baseLbl, color: "#34d399" };

  return (
    <group ref={groupRef} position={[wx, wy, wz]} visible={false}>

      {/* ── Input streams ──────────────────────────────────────── */}
      {(weights as readonly number[]).map((w, i) => {
        const iy    = inputYs[i];
        const isNeg = w < 0;
        const col   = isNeg ? AMBER_HEX : EM_HEX;
        const lw    = 1.0 + Math.abs(w) * 2.0;
        return (
          <group key={i}>
            <Line
              points={[[INPUT_X, iy, 0], [CORE_X, 0, 0]]}
              color={col}
              lineWidth={lw}
              transparent
              opacity={0.4 + Math.abs(w) * 0.35}
            />
            <Html position={[INPUT_X - 0.08, iy, 0]} center>
              <div style={{ ...baseLbl, textAlign: "right" }}>
                <div style={{ fontSize: isMobile ? 8 : 9, opacity: 0.7 }}>
                  x<sub style={{ fontSize: 7 }}>{i + 1}</sub>
                </div>
                <div style={{ color: col, fontSize: isMobile ? 7 : 8 }}>
                  w={w > 0 ? "+" : ""}{w.toFixed(2)}
                </div>
              </div>
            </Html>
          </group>
        );
      })}

      {/* ── Particles ──────────────────────────────────────────── */}
      <points geometry={ptGeo}>
        <pointsMaterial
          ref={ptMtRef}
          color={EM_HDR}
          size={0.04}
          sizeAttenuation
          transparent
          opacity={0.8}
          toneMapped={false}
        />
      </points>

      {/* ── Core sphere ────────────────────────────────────────── */}
      <mesh position={[CORE_X, 0, 0]}>
        <sphereGeometry args={[0.20, 20, 14]} />
        <meshBasicMaterial
          ref={coreMtRef}
          color={EM_HDR}
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </mesh>

      {/* Core label */}
      <Html position={[CORE_X, 0.40, 0]} center>
        <div style={{ ...emLbl, textAlign: "center", fontSize: isMobile ? 8 : 9 }}>
          Σ(w·x) + b
        </div>
        <div style={{ ...baseLbl, textAlign: "center", fontSize: 7, opacity: 0.5 }}>
          b = {BIAS}
        </div>
      </Html>

      {/* Live z value */}
      <Html position={[CORE_X, -0.38, 0]} center>
        <div style={{ ...baseLbl, fontSize: 8, textAlign: "center", opacity: 0.6 }}>
          z = <span ref={zSpanRef}>···</span>
        </div>
      </Html>

      {/* ── GELU panel ─────────────────────────────────────────── */}
      <Html position={[0.3, 1.05, 0]} center>
        <GeluPanel dotRef={dotRef} isMobile={isMobile} />
      </Html>

      {/* ── Output line ────────────────────────────────────────── */}
      <Line
        points={[[CORE_X, 0, 0], [OUTPUT_X, 0, 0]]}
        color={EM_HEX}
        lineWidth={2}
        transparent
        opacity={0.6}
      />
      <Html position={[OUTPUT_X + 0.1, 0.24, 0]}>
        <div style={emLbl}>a = GELU(z)</div>
        <div style={{ ...baseLbl, fontSize: 8, opacity: 0.55 }}>
          = <span ref={outSpanRef}>···</span> → next layer
        </div>
      </Html>

      {/* ── Caption ────────────────────────────────────────────── */}
      <Html position={[0, -1.45, 0]} center>
        <div style={{
          ...baseLbl,
          fontSize:      8,
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          opacity:       0.38,
        }}>
          INSIDE NEURON 2·07 — HIDDEN LAYER 2
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
  const W = isMobile ? 78 : 96;
  const H = isMobile ? 34 : 42;

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

  return (
    <div style={{
      background:    "rgba(4,28,28,0.88)",
      border:        "1px solid rgba(255,230,203,0.14)",
      borderRadius:  3,
      padding:       "3px 5px 2px",
      pointerEvents: "none",
    }}>
      <div style={{
        fontFamily:    "monospace",
        fontSize:      7,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color:         "rgba(255,230,203,0.35)",
        marginBottom:  2,
      }}>
        GELU
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <line x1="0" y1={H / 2} x2={W} y2={H / 2}
          stroke="rgba(255,230,203,0.08)" strokeWidth="0.5" />
        <line x1={W / 2} y1="0" x2={W / 2} y2={H}
          stroke="rgba(255,230,203,0.08)" strokeWidth="0.5" />
        <polyline
          points={curvePoints}
          fill="none"
          stroke="#34d399"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <circle ref={dotRef} cx={W / 2} cy={H / 2} r="2.5"
          fill="#34d399" opacity="0.9" />
      </svg>
    </div>
  );
}
