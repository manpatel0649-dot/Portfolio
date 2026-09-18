"use client";

/**
 * NeuronInterior — Stage C. Volumetric 3D neuron with parallax depth layers.
 *
 * Camera sits at TARGET_NEURON_POS + (0,0,+4), fov=45.
 * Positive local Z = closer to camera; negative Z = farther.
 *
 * Depth layers (all sub-groups rotate at different speeds → true parallax):
 *   BG   z −2.5→−4.5  8 neighbour neurons, very faint
 *   MID  z −1.1→+0.9  Dendrite tubes + core shells + nucleus + axon
 *   FG   z +1.2→+2.0  Foreground cream dust (rotates 1.8× faster)
 *
 * Core: bright nucleus (r=0.12) + 3 translucent BackSide shells (0.22, 0.32, 0.45).
 *   Nucleus gets non-uniform scale animation → organic "breathing" distortion.
 *   Pulse amplitude tracks |z| so it visually responds to net input.
 *
 * Dendrites: CatmullRomCurve3 with 4 control points spanning different z depths.
 *   TubeGeometry radius = 0.012 + |w| × 0.022 (thicker = stronger weight).
 *   Particles travel along curve.getPoint(t) — no per-frame Vector3 allocation.
 *
 * Axon: single tube curving right + away (z → −0.80) with a travelling signal.
 *
 * Typography 5-tier (unchanged from previous iteration):
 *   T1  Instrument Serif 56/30px — equations z=Σ(w·x)+b  a=GELU(z)
 *   T2  Courier Prime 700 32/20px — live z and a values (emerald)
 *   T3  Courier Prime 20/15px     — weights wᵢ + bias b (pos emerald / neg amber)
 *   T4  Courier Prime 16/13px     — inputs xᵢ (cream-2)
 *   T5  Geist Mono 12/11px up     — caption + GELU axis labels (cream-3)
 */

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
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

// ── Layout / depth constants ──────────────────────────────────────────────────

const INPUT_X      = -1.60;
const INPUT_X_MOB  = -0.50;
const OUTPUT_X     = +1.80;
const OUTPUT_X_MOB = +0.60;
const Y_HALF       = 1.20;
const Y_HALF_MOB   = 0.70;

// Z depth offset per input dendrite (positive = closer to camera)
const Z_DEPTHS_5: number[] = [-0.80, +0.65, -0.45, +0.85, -1.10];
const Z_DEPTHS_3: number[] = [-0.50, +0.40, -0.70];

// Background neighbour neurons: local [x, y, z] offsets from core
const BG_POS: [number, number, number][] = [
  [-2.4,  0.9, -3.0], [-1.9, -1.1, -3.6], [ 2.1,  0.7, -2.9],
  [ 1.6, -0.9, -4.1], [-2.9,  0.2, -3.8], [ 0.9,  1.6, -3.3],
  [-1.1,  1.9, -4.3], [ 2.7, -0.5, -3.7],
];

// ── Three.js constants ────────────────────────────────────────────────────────

const EM_HDR    = new THREE.Color(0.8, 3.2, 1.4);
const EM_HEX    = "#34d399";
const AMBER_HEX = "#ffbd38";
const CREAM_COL = new THREE.Color("#ffe6cb");

// Pre-allocated helpers — never create these inside useFrame
const _tmpVec = new THREE.Vector3();
const _obj    = new THREE.Object3D();
const _col    = new THREE.Color();

// ── Style tokens ──────────────────────────────────────────────────────────────

const BD: React.CSSProperties = {
  background:     "rgba(4,28,28,0.78)",
  backdropFilter: "blur(4px)",
  borderRadius:   "3px",
  padding:        "2px 8px",
  whiteSpace:     "nowrap",
  pointerEvents:  "none",
  userSelect:     "none",
  display:        "inline-block",
};

const SERIF  = "var(--font-serif, Georgia, serif)";
const TERM   = "var(--font-term, var(--font-courier-prime, 'Courier New', monospace))";
const MONO   = "var(--font-mono, monospace)";
const CREAM  = "rgba(255,230,203,0.92)";
const CREAM2 = "rgba(255,230,203,0.66)";
const CREAM3 = "rgba(255,230,203,0.38)";

// ── Component ─────────────────────────────────────────────────────────────────

export default function NeuronInterior() {
  // Outer group: position only, visibility gate
  const groupRef    = useRef<THREE.Group>(null);
  // Sub-groups get different rotation speeds → parallax
  const bgGroupRef  = useRef<THREE.Group>(null);
  const midGroupRef = useRef<THREE.Group>(null);
  const fgGroupRef  = useRef<THREE.Group>(null);

  // Core materials / mesh
  const nucleusMesh  = useRef<THREE.Mesh>(null);
  const nucleusMtRef = useRef<THREE.MeshBasicMaterial>(null);
  const shell1MtRef  = useRef<THREE.MeshBasicMaterial>(null);
  const shell2MtRef  = useRef<THREE.MeshBasicMaterial>(null);
  const shell3MtRef  = useRef<THREE.MeshBasicMaterial>(null);

  // Background instanced mesh
  const bgMeshRef = useRef<THREE.InstancedMesh>(null);
  const bgMtRef   = useRef<THREE.MeshBasicMaterial>(null);

  // Particle materials
  const ptDendRef = useRef<THREE.PointsMaterial>(null);
  const ptDustRef = useRef<THREE.PointsMaterial>(null);
  const ptAxonRef = useRef<THREE.PointsMaterial>(null);

  // Dendrite tube + axon materials (opacity updated per-frame)
  const dendMtRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const axonMtRef  = useRef<THREE.MeshBasicMaterial>(null);

  // HTML tier refs
  const t1aRef     = useRef<HTMLDivElement>(null);
  const t1bRef     = useRef<HTMLDivElement>(null);
  const t2zRef     = useRef<HTMLDivElement>(null);
  const t2aRef     = useRef<HTMLDivElement>(null);
  const t3bRef     = useRef<HTMLDivElement>(null);
  const inputRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const t5Ref      = useRef<HTMLDivElement>(null);
  const zSpanRef   = useRef<HTMLSpanElement>(null);
  const outSpanRef = useRef<HTMLSpanElement>(null);
  const dotRef     = useRef<SVGCircleElement>(null);

  const { size } = useThree();
  const isMobile = size.width < 900;
  const weights  = isMobile ? W3 : W5;
  const n        = weights.length;
  const inX      = isMobile ? INPUT_X_MOB : INPUT_X;
  const outX     = isMobile ? OUTPUT_X_MOB : OUTPUT_X;
  const yHalf    = isMobile ? Y_HALF_MOB  : Y_HALF;
  const zDepths  = isMobile ? Z_DEPTHS_3  : Z_DEPTHS_5;

  const inputYs = useMemo(() =>
    Array.from({ length: n }, (_, i) =>
      n <= 1 ? 0 : yHalf - (i / (n - 1)) * yHalf * 2),
  [n, yHalf]);

  // ── Dendrite curves (CatmullRom through z-space) ──────────────────────────
  // Each input arrives from a unique z-depth so no two dendrites share a plane.
  const dendriteCurves = useMemo(() =>
    (weights as readonly number[]).map((_, i) => {
      const iy = inputYs[i];
      const iz = zDepths[i];
      return new THREE.CatmullRomCurve3([
        new THREE.Vector3(inX - 0.20, iy * 1.35, iz),
        new THREE.Vector3(inX * 0.70, iy * 1.00, iz * 0.70),
        new THREE.Vector3(inX * 0.30, iy * 0.40, iz * 0.30),
        new THREE.Vector3(0, 0, 0),
      ])
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [n, inX, yHalf, isMobile]);

  // ── Axon curve — exits right and recedes from camera ──────────────────────
  const axonCurve = useMemo(() =>
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,           0,     0),
      new THREE.Vector3(outX * 0.40, 0.12, -0.35),
      new THREE.Vector3(outX * 0.70, 0.05, -0.60),
      new THREE.Vector3(outX,        0,    -0.80),
    ]),
  [outX]);

  // ── Dendrite particles ────────────────────────────────────────────────────
  const PPS         = 5; // particles per strand
  const dendPtCount = n * PPS;
  const dendPhases  = useRef(
    new Float32Array(Array.from({ length: dendPtCount }, (_, i) => i / PPS)),
  );
  const dendPosArr = useRef(new Float32Array(dendPtCount * 3));
  const dendAttr   = useRef<THREE.BufferAttribute | null>(null);
  const dendPtGeo  = useMemo(() => {
    const geo  = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(dendPosArr.current, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", attr);
    dendAttr.current = attr;
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Axon signal particle ──────────────────────────────────────────────────
  const axonPhase  = useRef(0);
  const axonPosArr = useRef(new Float32Array(3));
  const axonAttr   = useRef<THREE.BufferAttribute | null>(null);
  const axonPtGeo  = useMemo(() => {
    const geo  = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(axonPosArr.current, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", attr);
    axonAttr.current = attr;
    return geo;
  }, []);

  // ── Foreground dust ───────────────────────────────────────────────────────
  const DUST   = isMobile ? 60 : 180;
  const dustGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 5.5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
      pos[i * 3 + 2] = Math.random() * 0.8 + 1.2; // z +1.2→+2.0, in front of core
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [DUST]);

  // ── Mouse parallax ────────────────────────────────────────────────────────
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX / window.innerWidth  - 0.5;
      mouse.current.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ── Init background neuron instances ──────────────────────────────────────
  useEffect(() => {
    const mesh = bgMeshRef.current;
    if (!mesh) return;
    for (let i = 0; i < BG_POS.length; i++) {
      const [bx, by, bz] = BG_POS[i];
      _obj.position.set(bx, by, bz);
      _obj.scale.setScalar(1);
      _obj.updateMatrix();
      mesh.setMatrixAt(i, _obj.matrix);
      _col.setRGB(0.05, 0.20, 0.09);
      mesh.setColorAt(i, _col);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  // ── Main loop ─────────────────────────────────────────────────────────────

  const opRef = useRef(0);

  useFrame((state, delta) => {
    const { totalProgress: tp } = getSceneState();
    const g = groupRef.current;
    if (!g) return;

    // Smoothstep crossfade on totalProgress
    let target = 0;
    if (tp >= 0.30 && tp < 0.37) {
      const x = (tp - 0.30) / 0.07; target = x * x * (3 - 2 * x);
    } else if (tp >= 0.37 && tp < 0.50) {
      target = 1.0;
    } else if (tp >= 0.50 && tp < 0.57) {
      const x = (tp - 0.50) / 0.07; target = 1.0 - x * x * (3 - 2 * x);
    }

    opRef.current += (target - opRef.current) * 0.12;
    const op = opRef.current;
    g.visible = op > 0.01;
    if (!g.visible) return;

    const t  = state.clock.elapsedTime;
    const mx = mouse.current.x;
    const my = mouse.current.y;

    // Parallax: each layer rotates at a different fraction of baseY/baseX.
    // bgGroup (0.40×) < midGroup (1×) < fgGroup (1.8×) → convincing depth.
    const baseY = Math.sin(t * 0.09) * 0.18 + mx * 0.10;
    const baseX = Math.sin(t * 0.06) * 0.10 + my * -0.06;
    if (bgGroupRef.current)  { bgGroupRef.current.rotation.y  = baseY * 0.40; bgGroupRef.current.rotation.x  = baseX * 0.40; }
    if (midGroupRef.current) { midGroupRef.current.rotation.y = baseY;        midGroupRef.current.rotation.x = baseX; }
    if (fgGroupRef.current)  { fgGroupRef.current.rotation.y  = baseY * 1.80; fgGroupRef.current.rotation.x  = baseX * 1.80; }

    // ── Live math ──────────────────────────────────────────────────────────
    const inputs = (weights as readonly number[]).map(
      (_, i) => 0.5 + 0.35 * Math.sin(t * 0.22 + i * 1.5));
    const z   = (weights as readonly number[]).reduce((s, w, i) => s + w * inputs[i], BIAS);
    const out = gelu(z);
    const br  = Math.min(1, 0.3 + Math.abs(z) * 0.5);
    // Pulse amplitude driven by |z| so bright activity = strong pulsing
    const pls = 1 + Math.sin(t * 2.5 + Math.abs(z)) * 0.18 * Math.abs(z);

    // ── Core: nucleus + shells ─────────────────────────────────────────────
    if (nucleusMtRef.current) {
      nucleusMtRef.current.color.set(br * pls * 0.8, br * pls * 3.2, br * pls * 1.4);
      nucleusMtRef.current.opacity = op;
    }
    // Non-uniform scale animation = organic vertex-distortion proxy
    if (nucleusMesh.current) {
      nucleusMesh.current.scale.set(
        1 + 0.05 * Math.sin(t * 1.30),
        1 + 0.04 * Math.sin(t * 1.00 + 1.1),
        1 + 0.06 * Math.sin(t * 1.60 - 0.7),
      );
    }
    if (shell1MtRef.current) shell1MtRef.current.opacity = op * 0.20;
    if (shell2MtRef.current) shell2MtRef.current.opacity = op * 0.10;
    if (shell3MtRef.current) shell3MtRef.current.opacity = op * 0.05;

    // ── Background neurons: slow pulse ─────────────────────────────────────
    const bgMesh = bgMeshRef.current;
    if (bgMesh) {
      for (let i = 0; i < BG_POS.length; i++) {
        const pulse = 0.06 + 0.05 * Math.sin(t * 0.9 + i * 1.7);
        _col.setRGB(pulse * 0.8, pulse * 3.2, pulse * 1.4);
        bgMesh.setColorAt(i, _col);
      }
      if (bgMesh.instanceColor) bgMesh.instanceColor.needsUpdate = true;
    }
    if (bgMtRef.current) bgMtRef.current.opacity = op * 0.18;

    // ── Dendrite tube opacity ──────────────────────────────────────────────
    dendMtRefs.current.forEach((mt, i) => {
      if (mt) mt.opacity = op * (0.50 + Math.abs((weights as readonly number[])[i]) * 0.35);
    });

    // ── Dendrite particles: travel along CatmullRom paths ─────────────────
    const phases = dendPhases.current;
    const pos    = dendPosArr.current;
    for (let i = 0; i < n; i++) {
      const speed = 0.20 + Math.abs((weights as readonly number[])[i]) * 0.35;
      for (let p = 0; p < PPS; p++) {
        const idx = i * PPS + p;
        phases[idx] = (phases[idx] + delta * speed) % 1;
        dendriteCurves[i].getPoint(phases[idx], _tmpVec); // no allocation
        const b = idx * 3;
        pos[b] = _tmpVec.x; pos[b + 1] = _tmpVec.y; pos[b + 2] = _tmpVec.z;
      }
    }
    if (dendAttr.current) dendAttr.current.needsUpdate = true;
    if (ptDendRef.current) ptDendRef.current.opacity = op * 0.90;

    // ── Axon: single bright signal particle ───────────────────────────────
    axonPhase.current = (axonPhase.current + delta * 0.45) % 1;
    axonCurve.getPoint(axonPhase.current, _tmpVec);
    axonPosArr.current[0] = _tmpVec.x;
    axonPosArr.current[1] = _tmpVec.y;
    axonPosArr.current[2] = _tmpVec.z;
    if (axonAttr.current) axonAttr.current.needsUpdate = true;
    if (ptAxonRef.current) ptAxonRef.current.opacity = op * 0.95;
    if (axonMtRef.current) axonMtRef.current.opacity = op * 0.55;

    // ── Foreground dust ────────────────────────────────────────────────────
    if (ptDustRef.current) ptDustRef.current.opacity = op * 0.10;

    // ── HTML tier reveals ──────────────────────────────────────────────────
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
    if (t5Ref.current) t5Ref.current.style.opacity = String(tierOp(0.80));

    if (zSpanRef.current)   zSpanRef.current.textContent   = z.toFixed(3);
    if (outSpanRef.current) outSpanRef.current.textContent = out.toFixed(3);

    if (dotRef.current) {
      const svgW = isMobile ? 68 : 90;
      const svgH = isMobile ? 38 : 46;
      const cz   = Math.max(-2, Math.min(2, z));
      dotRef.current.setAttribute("cx", ((cz + 2) / 4 * svgW).toFixed(1));
      dotRef.current.setAttribute("cy",
        Math.max(1, Math.min(svgH - 1, svgH / 2 - gelu(cz) * svgH * 0.35)).toFixed(1));
    }
  });

  // ── JSX ───────────────────────────────────────────────────────────────────

  const [wx, wy, wz] = TARGET_NEURON_POS;
  const d = <T,>(desktop: T, mobile: T): T => isMobile ? mobile : desktop;

  return (
    <group ref={groupRef} position={[wx, wy, wz]} visible={false}>

      {/* ── BG layer: neighbour neurons far behind core ──────────────── */}
      {/* Rotates at 0.40× speed — appears to move less than foreground */}
      <group ref={bgGroupRef}>
        <instancedMesh ref={bgMeshRef} args={[undefined, undefined, BG_POS.length]}>
          <sphereGeometry args={[0.06, 6, 4]} />
          <meshBasicMaterial
            ref={bgMtRef}
            vertexColors
            transparent
            opacity={0}
            toneMapped={false}
          />
        </instancedMesh>
      </group>

      {/* ── MID layer: core + dendrites + axon + labels ──────────────── */}
      {/* Rotates at 1× speed — the reference layer */}
      <group ref={midGroupRef}>

        {/* Layered shells — BackSide produces rim/fresnel-style limb glow.
            Successive shells at r=0.22, 0.32, 0.45 give volumetric depth. */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.45, 14, 10]} />
          <meshBasicMaterial ref={shell3MtRef} color={EM_HEX} transparent opacity={0} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.32, 16, 10]} />
          <meshBasicMaterial ref={shell2MtRef} color={EM_HEX} transparent opacity={0} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.22, 16, 12]} />
          <meshBasicMaterial ref={shell1MtRef} color={EM_HDR} transparent opacity={0} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
        </mesh>

        {/* Nucleus: bright inner core. Non-uniform scale = organic wobble. */}
        <mesh ref={nucleusMesh} position={[0, 0, 0]}>
          <sphereGeometry args={[0.12, 20, 14]} />
          <meshBasicMaterial ref={nucleusMtRef} color={EM_HDR} transparent opacity={0} toneMapped={false} />
        </mesh>

        {/* Dendrite tubes: one per input, each at unique z-depth.
            Radius proportional to |w| — thick = strong weight. */}
        {dendriteCurves.map((curve, i) => {
          const w      = (weights as readonly number[])[i];
          const isNeg  = w < 0;
          const col    = isNeg ? AMBER_HEX : EM_HEX;
          const radius = 0.012 + Math.abs(w) * 0.022;
          const sub    = ["₁","₂","₃","₄","₅"][i] ?? String(i + 1);
          const wSign  = w > 0 ? "+" : "";
          const iy     = inputYs[i];
          const iz     = zDepths[i];
          return (
            <group key={i}>
              <mesh>
                <tubeGeometry args={[curve, 14, radius, 5, false]} />
                <meshBasicMaterial
                  ref={(el: THREE.MeshBasicMaterial | null) => { dendMtRefs.current[i] = el; }}
                  color={col}
                  transparent
                  opacity={0}
                  toneMapped={false}
                />
              </mesh>

              {/* Labels anchored at the dendrite start — different z per input */}
              <Html position={[inX - 0.08, iy, iz]} center>
                <div
                  ref={el => { inputRefs.current[i] = el; }}
                  style={{ opacity: 0, textAlign: "right" }}
                >
                  <div style={{ ...BD, fontFamily: TERM, fontSize: d(16, 13), color: CREAM2, lineHeight: 1.3, marginBottom: 3 }}>
                    x{sub}
                  </div>
                  <div style={{ ...BD, fontFamily: TERM, fontSize: d(20, 15), color: col, lineHeight: 1.2 }}>
                    w = {wSign}{w.toFixed(2)}
                  </div>
                </div>
              </Html>
            </group>
          );
        })}

        {/* Dendrite signal particles — flow along curve.getPoint(t) paths */}
        <points geometry={dendPtGeo}>
          <pointsMaterial
            ref={ptDendRef}
            color={EM_HDR}
            size={d(0.035, 0.028)}
            sizeAttenuation
            transparent
            opacity={0}
            toneMapped={false}
          />
        </points>

        {/* Axon tube: exits right and recedes (z → −0.80) */}
        <mesh>
          <tubeGeometry args={[axonCurve, 16, 0.022, 5, false]} />
          <meshBasicMaterial ref={axonMtRef} color={EM_HEX} transparent opacity={0} toneMapped={false} />
        </mesh>

        {/* Axon signal: single bright particle travelling the length */}
        <points geometry={axonPtGeo}>
          <pointsMaterial
            ref={ptAxonRef}
            color={EM_HDR}
            size={d(0.062, 0.048)}
            sizeAttenuation
            transparent
            opacity={0}
            toneMapped={false}
          />
        </points>

        {/* ── HTML labels ── */}

        {/* T1 — z equation above core */}
        <Html position={[0, d(0.58, 0.95), 0]} center>
          <div ref={t1aRef} style={{ opacity: 0, textAlign: "center" }}>
            <div style={{ ...BD, padding: "4px 12px" }}>
              <span style={{ fontFamily: SERIF, fontSize: d(56, 30), color: CREAM, lineHeight: 1 }}>
                <em style={{ color: EM_HEX, fontStyle: "italic" }}>z</em>
                <span style={{ fontStyle: "normal" }}>{" = Σ(w·x) + b"}</span>
              </span>
            </div>
          </div>
        </Html>

        {/* T3 — bias */}
        <Html position={[0, d(0.24, 0.28), 0]} center>
          <div ref={t3bRef} style={{ opacity: 0 }}>
            <div style={{ ...BD }}>
              <span style={{ fontFamily: TERM, fontSize: d(20, 15), color: CREAM2 }}>
                b = {BIAS}
              </span>
            </div>
          </div>
        </Html>

        {/* T2 — live z */}
        <Html position={[0, d(-0.52, -0.52), 0]} center>
          <div ref={t2zRef} style={{ opacity: 0 }}>
            <div style={{ ...BD, padding: "4px 10px" }}>
              <span style={{ fontFamily: TERM, fontSize: d(32, 20), fontWeight: 700, color: EM_HEX, lineHeight: 1 }}>
                <em style={{ fontStyle: "italic" }}>z</em>{" = "}<span ref={zSpanRef}>···</span>
              </span>
            </div>
          </div>
        </Html>

        {/* GELU activation panel */}
        <Html position={[d(0.52, 0.58), d(1.12, 0.85), 0]} center>
          <GeluPanel dotRef={dotRef} isMobile={isMobile} />
        </Html>

        {/* T1 — a = GELU(z) equation near axon start; slight z-offset matches axon recession */}
        <Html position={[d(OUTPUT_X, 0.28), d(0.40, 0.50), d(-0.28, -0.18)]} center>
          <div ref={t1bRef} style={{ opacity: 0, textAlign: "center" }}>
            <div style={{ ...BD, padding: "4px 12px" }}>
              <span style={{ fontFamily: SERIF, fontSize: d(56, 30), color: CREAM, lineHeight: 1 }}>
                <em style={{ color: EM_HEX, fontStyle: "italic" }}>a</em>
                {" = GELU("}
                <em style={{ color: EM_HEX, fontStyle: "italic" }}>z</em>
                {")"}
              </span>
            </div>
          </div>
        </Html>

        {/* T2 — live a value */}
        <Html position={[d(OUTPUT_X, 0.28), d(-0.40, -0.72), d(-0.28, -0.18)]} center>
          <div ref={t2aRef} style={{ opacity: 0, textAlign: "center" }}>
            <div style={{ ...BD, padding: "4px 10px" }}>
              <span style={{ fontFamily: TERM, fontSize: d(32, 20), fontWeight: 700, color: EM_HEX, lineHeight: 1, display: "block" }}>
                <em style={{ fontStyle: "italic" }}>a</em>{" = "}<span ref={outSpanRef}>···</span>
              </span>
              <span style={{ fontFamily: MONO, fontSize: d(12, 11), letterSpacing: "0.14em", textTransform: "uppercase" as const, color: CREAM3, display: "block", marginTop: 4 }}>
                → NEXT LAYER
              </span>
            </div>
          </div>
        </Html>

        {/* T5 — caption */}
        <Html position={[0, d(-1.48, -1.25), 0]} center>
          <div ref={t5Ref} style={{ opacity: 0 }}>
            <div style={{ ...BD }}>
              <span style={{ fontFamily: MONO, fontSize: d(12, 11), letterSpacing: "0.14em", textTransform: "uppercase" as const, color: CREAM3 }}>
                INSIDE NEURON 2·07 — HIDDEN LAYER 2
              </span>
            </div>
          </div>
        </Html>
      </group>

      {/* ── FG layer: foreground cream dust ──────────────────────────── */}
      {/* Rotates at 1.8× speed — nearest to camera, most parallax */}
      <group ref={fgGroupRef}>
        <points geometry={dustGeo}>
          <pointsMaterial
            ref={ptDustRef}
            color={CREAM_COL}
            size={d(0.022, 0.018)}
            sizeAttenuation
            transparent
            opacity={0}
            toneMapped={false}
          />
        </points>
      </group>
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
    fontFamily:    "var(--font-mono, monospace)",
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
      <div style={{
        fontFamily:    "var(--font-mono, monospace)",
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
        <line x1="0" y1={H / 2} x2={W} y2={H / 2}
          stroke="rgba(255,230,203,0.08)" strokeWidth="0.5" />
        <line x1={W / 2} y1="0" x2={W / 2} y2={H}
          stroke="rgba(255,230,203,0.08)" strokeWidth="0.5" />
        <text x={W - 2} y={H / 2 - 3} textAnchor="end" style={axisLabel}>x</text>
        <text x={W / 2 + 3} y={9} style={axisLabel}>f(x)</text>
        <polyline
          points={curvePoints}
          fill="none"
          stroke={EM_HEX}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle ref={dotRef} cx={W / 2} cy={H / 2} r="2.8" fill={EM_HEX} opacity="0.9" />
      </svg>
    </div>
  );
}
