"use client";

/**
 * NeuronInterior — Stage C. Volumetric 3D neuron with wandering input strands.
 *
 * Each input (x₁…x₅) arrives via a wide fan of individual wandering strands.
 * Strands are nearly invisible (opacity ~0.04); the light lives in HDR signal
 * particles (3 trail points) that travel along each strand's baked path.
 *
 * Fan: 5 inputs spread across 105°–255° (left hemisphere only).
 * Strand count ∝ |w|: ~7 + |w|×16 strands per input.
 * Seeded PRNG (1337) → identical geometry for every visitor.
 * Parallax: three sub-groups rotate at 0.4× / 1× / 1.8× → real depth.
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

// ── Seeded LCG PRNG — resetSeed() before each build → same shape every visit ─

let _seed = 1337;
function _R(a: number, b: number): number {
  _seed = (_seed * 1664525 + 1013904223) % 4294967296;
  return a + (_seed / 4294967296) * (b - a);
}
function resetSeed() { _seed = 1337; }

// ── Layout constants ──────────────────────────────────────────────────────────

const INPUT_X      = -1.60;
const INPUT_X_MOB  = -0.50;
const OUTPUT_X     = +1.80;
const OUTPUT_X_MOB = +0.60;

// Fan: A0 = π*(1−0.46*0.92) ≈ 1.812 rad (≈105°), A1 ≈ 4.471 rad (≈256°)
const FAN_A0 = Math.PI * (1 - 0.46 * 0.92);
const FAN_A1 = Math.PI * (1 + 0.46 * 0.92);

// Background neighbour neuron positions (local offset from core)
const BG_POS: [number, number, number][] = [
  [-2.4,  0.9, -3.0], [-1.9, -1.1, -3.6], [ 2.1,  0.7, -2.9],
  [ 1.6, -0.9, -4.1], [-2.9,  0.2, -3.8], [ 0.9,  1.6, -3.3],
  [-1.1,  1.9, -4.3], [ 2.7, -0.5, -3.7],
];

// ── Three.js constants ────────────────────────────────────────────────────────

const EM_HDR    = new THREE.Color(0.8, 3.2, 1.4);
const AMBER_HDR = new THREE.Color(1.0, 0.74, 0.22);
const EM_HEX    = "#34d399";
const AMBER_HEX = "#ffbd38";
const CREAM_COL = new THREE.Color("#ffe6cb");

// Pre-allocated — never new inside useFrame
const _tmpVec = new THREE.Vector3();
const _obj    = new THREE.Object3D();
const _col    = new THREE.Color();

// ── Strand types ──────────────────────────────────────────────────────────────

interface StrandData {
  path:       Float32Array; // N_SAMPLES * 3 baked XYZ
  phase:      number;
  speed:      number;
  isPositive: boolean;
}

interface StrandBuild {
  groups:     StrandData[][];
  nSamples:   number;
  trail:      number;
  sigPosBuf:  Float32Array;
  sigNegBuf:  Float32Array;
  sigPosAttr: THREE.BufferAttribute;
  sigNegAttr: THREE.BufferAttribute;
}

// ── Style tokens ──────────────────────────────────────────────────────────────

const BD: React.CSSProperties = {
  background: "rgba(4,28,28,0.78)", backdropFilter: "blur(4px)",
  borderRadius: "3px", padding: "2px 8px", whiteSpace: "nowrap",
  pointerEvents: "none", userSelect: "none", display: "inline-block",
};
const SERIF  = "var(--font-serif, Georgia, serif)";
const TERM   = "var(--font-term, var(--font-courier-prime,'Courier New',monospace))";
const MONO   = "var(--font-mono, monospace)";
const CREAM  = "rgba(255,230,203,0.92)";
const CREAM2 = "rgba(255,230,203,0.66)";
const CREAM3 = "rgba(255,230,203,0.38)";

// ── Component ─────────────────────────────────────────────────────────────────

export default function NeuronInterior() {
  const groupRef    = useRef<THREE.Group>(null);
  const bgGroupRef  = useRef<THREE.Group>(null);
  const midGroupRef = useRef<THREE.Group>(null);
  const fgGroupRef  = useRef<THREE.Group>(null);

  // Core
  const nucleusMesh  = useRef<THREE.Mesh>(null);
  const nucleusMtRef = useRef<THREE.MeshBasicMaterial>(null);
  const shell1MtRef  = useRef<THREE.MeshBasicMaterial>(null);
  const shell2MtRef  = useRef<THREE.MeshBasicMaterial>(null);
  const shell3MtRef  = useRef<THREE.MeshBasicMaterial>(null);

  // BG neurons
  const bgMeshRef = useRef<THREE.InstancedMesh>(null);
  const bgMtRef   = useRef<THREE.MeshBasicMaterial>(null);

  // Strand line segments (created imperatively in useEffect → no JSX <line>)
  const strandSegsRef = useRef<THREE.LineSegments[]>([]);
  const strandMatsRef = useRef<THREE.LineBasicMaterial[]>([]);

  // Signal particles
  const sigPosGeoRef = useRef<THREE.BufferGeometry>(null);
  const sigNegGeoRef = useRef<THREE.BufferGeometry>(null);
  const sigPosMtRef  = useRef<THREE.PointsMaterial>(null);
  const sigNegMtRef  = useRef<THREE.PointsMaterial>(null);

  // Axon
  const ptAxonRef  = useRef<THREE.PointsMaterial>(null);
  const axonMtRef  = useRef<THREE.MeshBasicMaterial>(null);
  const axonPhase  = useRef(0);
  const axonPosArr = useRef(new Float32Array(3));
  const axonAttr   = useRef<THREE.BufferAttribute | null>(null);

  // Foreground dust
  const ptDustRef = useRef<THREE.PointsMaterial>(null);

  // HTML tiers
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

  // Built strand data
  const strandBuildRef = useRef<StrandBuild | null>(null);

  const { size } = useThree();
  const isMobile = size.width < 900;
  const weights  = isMobile ? W3 : W5;
  const n        = weights.length;
  const inX      = isMobile ? INPUT_X_MOB : INPUT_X;
  const outX     = isMobile ? OUTPUT_X_MOB : OUTPUT_X;
  const yHalf    = isMobile ? 0.70 : 1.20;

  const inputYs = useMemo(
    () => Array.from({ length: n }, (_, i) =>
      n <= 1 ? 0 : yHalf - (i / (n - 1)) * yHalf * 2),
    [n, yHalf],
  );

  // ── Axon curve ────────────────────────────────────────────────────────────
  const axonCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,           0,     0),
    new THREE.Vector3(outX * 0.40, 0.12, -0.35),
    new THREE.Vector3(outX * 0.70, 0.05, -0.60),
    new THREE.Vector3(outX,        0,    -0.80),
  ]), [outX]);

  const axonPtGeo = useMemo(() => {
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
      pos[i*3]   = (Math.random() - 0.5) * 5.5;
      pos[i*3+1] = (Math.random() - 0.5) * 3.5;
      pos[i*3+2] = Math.random() * 0.8 + 1.2; // z +1.2→+2.0, in front of core
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [DUST]);

  // ── Mouse parallax ────────────────────────────────────────────────────────
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (isMobile) return;
    const fn = (e: MouseEvent) => {
      mouse.current.x = e.clientX / window.innerWidth  - 0.5;
      mouse.current.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", fn, { passive: true });
    return () => window.removeEventListener("mousemove", fn);
  }, [isMobile]);

  // ── Init BG neuron instances ───────────────────────────────────────────────
  useEffect(() => {
    const mesh = bgMeshRef.current;
    if (!mesh) return;
    for (let i = 0; i < BG_POS.length; i++) {
      _obj.position.set(...BG_POS[i]);
      _obj.scale.setScalar(1);
      _obj.updateMatrix();
      mesh.setMatrixAt(i, _obj.matrix);
      _col.setRGB(0.05, 0.20, 0.09);
      mesh.setColorAt(i, _col);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  // ── Build strand geometry (imperative — avoids JSX <line> type conflicts) ──
  useEffect(() => {
    const mid = midGroupRef.current;
    if (!mid) return;

    // Dispose previous strands
    strandSegsRef.current.forEach(seg => {
      mid.remove(seg);
      seg.geometry.dispose();
      (seg.material as THREE.Material).dispose();
    });
    strandSegsRef.current = [];
    strandMatsRef.current = [];
    strandBuildRef.current = null;

    resetSeed();

    const N  = isMobile ? 28 : 46;  // samples per strand
    const TR = isMobile ? 2  : 3;   // trail points per signal

    const angleStep = n > 1 ? (FAN_A1 - FAN_A0) / (n - 1) : 0;
    const D_base    = Math.abs(inX) * 1.05; // fan radius in world units

    const groups: StrandData[][] = [];
    let posCapacity = 0;
    let negCapacity = 0;

    for (let gi = 0; gi < n; gi++) {
      const w      = (weights as readonly number[])[gi];
      const isPos  = w >= 0;
      const baseAng = FAN_A0 + angleStep * gi;
      const nSt    = Math.round((7 + Math.abs(w) * 16) * (isMobile ? 0.40 : 1.0));
      const hw     = 0.12 + Math.abs(w) * 0.11; // angular half-width

      // LineSegments geometry: (N-1) segments × 2 verts per strand = (N-1)*2*nSt
      const geoVerts = nSt * (N - 1) * 2;
      const positions = new Float32Array(geoVerts * 3);
      let vOff = 0;

      const strands: StrandData[] = [];

      for (let k = 0; k < nSt; k++) {
        const ang = baseAng + _R(-hw, hw);
        const dk  = D_base * _R(0.62, 1.3);

        // Strand origin (left hemisphere, spread in Z for depth)
        const sx = Math.cos(ang) * dk;
        const sy = -Math.sin(ang) * dk; // flip Y (Three.js +Y = up)
        const sz = _R(-0.30, 0.30);

        // Dock near core
        const dockR = _R(0.20, 0.28);
        const ex    = Math.cos(ang) * dockR;
        const ey    = -Math.sin(ang) * dockR;
        const ez    = sz * 0.05;

        // Bow perpendicular to main direction
        const bw  = _R(-1, 1) * dk * _R(0.03, 0.09);
        const pnx = -Math.sin(ang); // perpendicular
        const pny = -Math.cos(ang);

        // Bezier control points
        const p0 = [sx, sy, sz];
        const p1 = [Math.min(sx*0.6+ex*0.4+pnx*bw, -0.28), sy*0.6+ey*0.4+pny*bw, sz*0.7];
        const p2 = [Math.min(sx*0.3+ex*0.7+pnx*bw*0.4, -0.10), sy*0.3+ey*0.7+pny*bw*0.4, sz*0.3];
        const p3 = [ex, ey, ez];

        // Wander params (world units; scaled from reference px values)
        const n1 = { a: _R(-0.14, 0.14), f: _R(1.0, 3.2), p: _R(0, Math.PI*2) };
        const n2 = { a: _R(-0.06, 0.06), f: _R(2.6, 6.5), p: _R(0, Math.PI*2) };
        const wph = _R(0, Math.PI*2);
        const wfr = _R(0.5, 1.5);
        const wam = _R(0.012, 0.035);

        // Bake N samples along the bezier + wander
        const path = new Float32Array(N * 3);
        for (let s = 0; s < N; s++) {
          const t = s / (N - 1);
          const u = 1 - t;

          // Cubic bezier position
          const bpx = u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0];
          const bpy = u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1];
          const bpz = u*u*u*p0[2] + 3*u*u*t*p1[2] + 3*u*t*t*p2[2] + t*t*t*p3[2];

          // Tangent → normal (perpendicular in XY)
          const dbx = 3*(u*u*(p1[0]-p0[0]) + 2*u*t*(p2[0]-p1[0]) + t*t*(p3[0]-p2[0]));
          const dby = 3*(u*u*(p1[1]-p0[1]) + 2*u*t*(p2[1]-p1[1]) + t*t*(p3[1]-p2[1]));
          const dbl = Math.sqrt(dbx*dbx + dby*dby) || 1;
          const tnx = -dby / dbl;
          const tny =  dbx / dbl;

          // Taper: full wander far out, zero at core
          const taper = Math.pow(Math.sin(t * Math.PI), 0.8) * 0.92 + 0.08 * (1 - t);
          const woff  = Math.sin(t*n1.f*3.1+n1.p)*n1.a + Math.sin(t*n2.f*3.1+n2.p)*n2.a;
          const wob   = Math.sin(wph + t*6) * wam;
          const offset = (woff + wob) * taper;

          path[s*3]   = bpx + tnx * offset;
          path[s*3+1] = bpy + tny * offset;
          path[s*3+2] = bpz + tnx * offset * 0.3;

          // Also write into LineSegments geometry (pairs of segment endpoints)
          if (s > 0) {
            // start of segment = previous point
            positions[vOff++] = path[(s-1)*3];
            positions[vOff++] = path[(s-1)*3+1];
            positions[vOff++] = path[(s-1)*3+2];
            // end of segment = current point
            positions[vOff++] = path[s*3];
            positions[vOff++] = path[s*3+1];
            positions[vOff++] = path[s*3+2];
          }
        }

        strands.push({
          path,
          phase:      _R(0, 1),
          speed:      0.07 + Math.abs(w) * 0.05 + _R(0, 0.04),
          isPositive: isPos,
        });
      }

      if (isPos) posCapacity += nSt * TR;
      else       negCapacity += nSt * TR;
      groups.push(strands);

      // Create Three.js LineSegments for this input
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions.subarray(0, vOff), 3));
      const mat = new THREE.LineBasicMaterial({
        color:       isPos ? EM_HEX : AMBER_HEX,
        transparent: true,
        opacity:     0,
        toneMapped:  false,
      });
      const seg = new THREE.LineSegments(geo, mat);
      mid.add(seg);
      strandSegsRef.current.push(seg);
      strandMatsRef.current.push(mat);
    }

    // Signal particle buffers
    const sigPosBuf  = new Float32Array(Math.max(posCapacity, 1) * 3).fill(1e6);
    const sigNegBuf  = new Float32Array(Math.max(negCapacity, 1) * 3).fill(1e6);
    const sigPosAttr = new THREE.BufferAttribute(sigPosBuf, 3);
    const sigNegAttr = new THREE.BufferAttribute(sigNegBuf, 3);
    sigPosAttr.setUsage(THREE.DynamicDrawUsage);
    sigNegAttr.setUsage(THREE.DynamicDrawUsage);

    if (sigPosGeoRef.current) sigPosGeoRef.current.setAttribute("position", sigPosAttr);
    if (sigNegGeoRef.current) sigNegGeoRef.current.setAttribute("position", sigNegAttr);

    strandBuildRef.current = { groups, nSamples: N, trail: TR, sigPosBuf, sigNegBuf, sigPosAttr, sigNegAttr };

    return () => {
      strandSegsRef.current.forEach(seg => {
        midGroupRef.current?.remove(seg);
        seg.geometry.dispose();
        (seg.material as THREE.Material).dispose();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // ── Main loop ─────────────────────────────────────────────────────────────
  const opRef = useRef(0);

  useFrame((state, delta) => {
    const { totalProgress: tp } = getSceneState();
    const g = groupRef.current;
    if (!g) return;

    // Smoothstep crossfade: fade in 0.30→0.37, hold 0.37→0.50, fade out 0.50→0.57
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

    // Parallax: each layer rotates at a different fraction — creates real depth
    const baseY = Math.sin(t * 0.09) * 0.18 + mx * 0.10;
    const baseX = Math.sin(t * 0.06) * 0.10 + my * -0.06;
    if (bgGroupRef.current)  { bgGroupRef.current.rotation.y  = baseY * 0.40; bgGroupRef.current.rotation.x  = baseX * 0.40; }
    if (midGroupRef.current) { midGroupRef.current.rotation.y = baseY;        midGroupRef.current.rotation.x = baseX; }
    if (fgGroupRef.current)  { fgGroupRef.current.rotation.y  = baseY * 1.80; fgGroupRef.current.rotation.x  = baseX * 1.80; }

    // Live neuron math
    const inputs = (weights as readonly number[]).map((_, i) =>
      0.5 + 0.35 * Math.sin(t * 0.22 + i * 1.5));
    const z   = (weights as readonly number[]).reduce((s, w, i) => s + w * inputs[i], BIAS);
    const out = gelu(z);
    const br  = Math.min(1, 0.3 + Math.abs(z) * 0.5);
    const pls = 1 + Math.sin(t * 2.5 + Math.abs(z)) * 0.18 * Math.abs(z);

    // Core
    if (nucleusMtRef.current) {
      nucleusMtRef.current.color.set(br*pls*0.8, br*pls*3.2, br*pls*1.4);
      nucleusMtRef.current.opacity = op;
    }
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

    // BG neurons: slow glow pulse
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

    // Strand signals
    const build = strandBuildRef.current;
    if (build) {
      const { groups, nSamples, trail, sigPosBuf, sigNegBuf, sigPosAttr, sigNegAttr } = build;
      let posOff = 0, negOff = 0;

      groups.forEach((strands, gi) => {
        // Strand lines nearly invisible — the light lives in the signal particles
        const mt = strandMatsRef.current[gi];
        if (mt) mt.opacity = op * 0.04;

        strands.forEach(strand => {
          strand.phase = (strand.phase + delta * strand.speed) % 1;
          for (let k = 0; k < trail; k++) {
            const ph  = (strand.phase + k * 0.05) % 1;
            const idx = ph * (nSamples - 1);
            const lo  = Math.floor(idx);
            const hi  = Math.min(lo + 1, nSamples - 1);
            const fr  = idx - lo;
            const b = lo * 3, c = hi * 3;
            const px = strand.path[b]   + (strand.path[c]   - strand.path[b])   * fr;
            const py = strand.path[b+1] + (strand.path[c+1] - strand.path[b+1]) * fr;
            const pz = strand.path[b+2] + (strand.path[c+2] - strand.path[b+2]) * fr;
            if (strand.isPositive) {
              sigPosBuf[posOff++] = px; sigPosBuf[posOff++] = py; sigPosBuf[posOff++] = pz;
            } else {
              sigNegBuf[negOff++] = px; sigNegBuf[negOff++] = py; sigNegBuf[negOff++] = pz;
            }
          }
        });
      });

      // Park unused slots far off-screen
      while (posOff < sigPosBuf.length) { sigPosBuf[posOff++] = 1e6; }
      while (negOff < sigNegBuf.length) { sigNegBuf[negOff++] = 1e6; }
      sigPosAttr.needsUpdate = true;
      sigNegAttr.needsUpdate = true;
      if (sigPosMtRef.current) sigPosMtRef.current.opacity = op * 0.85;
      if (sigNegMtRef.current) sigNegMtRef.current.opacity = op * 0.85;
    }

    // Axon signal
    axonPhase.current = (axonPhase.current + delta * 0.45) % 1;
    axonCurve.getPoint(axonPhase.current, _tmpVec);
    axonPosArr.current[0] = _tmpVec.x;
    axonPosArr.current[1] = _tmpVec.y;
    axonPosArr.current[2] = _tmpVec.z;
    if (axonAttr.current)  axonAttr.current.needsUpdate = true;
    if (ptAxonRef.current) ptAxonRef.current.opacity = op * 0.95;
    if (axonMtRef.current) axonMtRef.current.opacity = op * 0.55;

    if (ptDustRef.current) ptDustRef.current.opacity = op * 0.10;

    // HTML tier reveals: staggered by opacity threshold
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
        Math.max(1, Math.min(svgH-1, svgH/2 - gelu(cz)*svgH*0.35)).toFixed(1));
    }
  });

  // ── JSX ───────────────────────────────────────────────────────────────────
  const [wx, wy, wz] = TARGET_NEURON_POS;
  const d = <T,>(desktop: T, mobile: T): T => isMobile ? mobile : desktop;

  return (
    <group ref={groupRef} position={[wx, wy, wz]} visible={false}>

      {/* BG layer: neighbour neurons far behind (rotates 0.4× = less parallax) */}
      <group ref={bgGroupRef}>
        <instancedMesh ref={bgMeshRef} args={[undefined, undefined, BG_POS.length]}>
          <sphereGeometry args={[0.06, 6, 4]} />
          <meshBasicMaterial ref={bgMtRef} vertexColors transparent opacity={0} toneMapped={false} />
        </instancedMesh>
      </group>

      {/* MID layer: core + strands (imperative) + signals + axon + labels */}
      <group ref={midGroupRef}>

        {/* Layered BackSide shells: r=0.45/0.32/0.22 give volumetric rim glow */}
        <mesh>
          <sphereGeometry args={[0.45, 14, 10]} />
          <meshBasicMaterial ref={shell3MtRef} color={EM_HEX} transparent opacity={0} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.32, 16, 10]} />
          <meshBasicMaterial ref={shell2MtRef} color={EM_HEX} transparent opacity={0} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.22, 16, 12]} />
          <meshBasicMaterial ref={shell1MtRef} color={EM_HDR} transparent opacity={0} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
        </mesh>

        {/* Nucleus: bright breathing core; non-uniform scale = organic wobble */}
        <mesh ref={nucleusMesh}>
          <sphereGeometry args={[0.12, 20, 14]} />
          <meshBasicMaterial ref={nucleusMtRef} color={EM_HDR} transparent opacity={0} toneMapped={false} />
        </mesh>

        {/* Strand LineSegments are added imperatively in useEffect above */}

        {/* Signal particles — emerald (positive weights) */}
        <points>
          <bufferGeometry ref={sigPosGeoRef} />
          <pointsMaterial ref={sigPosMtRef} color={EM_HDR} size={d(0.040, 0.032)} sizeAttenuation transparent opacity={0} toneMapped={false} />
        </points>

        {/* Signal particles — amber (negative weights) */}
        <points>
          <bufferGeometry ref={sigNegGeoRef} />
          <pointsMaterial ref={sigNegMtRef} color={AMBER_HDR} size={d(0.040, 0.032)} sizeAttenuation transparent opacity={0} toneMapped={false} />
        </points>

        {/* Input labels — hang at fan entry point for each input */}
        {Array.from({ length: n }).map((_, i) => {
          const w     = (weights as readonly number[])[i];
          const col   = w < 0 ? AMBER_HEX : EM_HEX;
          const sub   = ["₁","₂","₃","₄","₅"][i] ?? String(i + 1);
          const wSign = w > 0 ? "+" : "";
          const ang   = FAN_A0 + ((n > 1 ? (FAN_A1 - FAN_A0) / (n - 1) : 0) * i);
          const D     = Math.abs(inX) * 0.78;
          const lx    = Math.cos(ang) * D;
          const ly    = -Math.sin(ang) * D;
          return (
            <Html key={i} position={[lx, ly, 0]} center>
              <div ref={el => { inputRefs.current[i] = el; }} style={{ opacity: 0, textAlign: "right" }}>
                <div style={{ ...BD, fontFamily: TERM, fontSize: d(16, 13), color: CREAM2, lineHeight: 1.3, marginBottom: 3 }}>
                  x{sub}
                </div>
                <div style={{ ...BD, fontFamily: TERM, fontSize: d(20, 15), color: col, lineHeight: 1.2 }}>
                  w = {wSign}{w.toFixed(2)}
                </div>
              </div>
            </Html>
          );
        })}

        {/* Axon tube: exits right and recedes (z → −0.80) */}
        <mesh>
          <tubeGeometry args={[axonCurve, 16, 0.022, 5, false]} />
          <meshBasicMaterial ref={axonMtRef} color={EM_HEX} transparent opacity={0} toneMapped={false} />
        </mesh>

        {/* Axon signal particle */}
        <points geometry={axonPtGeo}>
          <pointsMaterial ref={ptAxonRef} color={EM_HDR} size={d(0.062, 0.048)} sizeAttenuation transparent opacity={0} toneMapped={false} />
        </points>

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

        {/* T3 — bias value below core */}
        <Html position={[0, d(0.24, 0.28), 0]} center>
          <div ref={t3bRef} style={{ opacity: 0 }}>
            <div style={{ ...BD }}>
              <span style={{ fontFamily: TERM, fontSize: d(20, 15), color: CREAM2 }}>b = {BIAS}</span>
            </div>
          </div>
        </Html>

        {/* T2 — live z value below core */}
        <Html position={[0, d(-0.52, -0.52), 0]} center>
          <div ref={t2zRef} style={{ opacity: 0 }}>
            <div style={{ ...BD, padding: "4px 10px" }}>
              <span style={{ fontFamily: TERM, fontSize: d(32, 20), fontWeight: 700, color: EM_HEX, lineHeight: 1 }}>
                <em style={{ fontStyle: "italic" }}>z</em>{" = "}<span ref={zSpanRef}>···</span>
              </span>
            </div>
          </div>
        </Html>

        {/* GELU activation curve panel */}
        <Html position={[d(0.52, 0.58), d(1.12, 0.85), 0]} center>
          <GeluPanel dotRef={dotRef} isMobile={isMobile} />
        </Html>

        {/* T1 — a = GELU(z) near axon start */}
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

        {/* T2 — live a value + next layer label */}
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

      {/* FG layer: foreground dust (rotates 1.8× = most parallax = closest) */}
      <group ref={fgGroupRef}>
        <points geometry={dustGeo}>
          <pointsMaterial ref={ptDustRef} color={CREAM_COL} size={d(0.022, 0.018)} sizeAttenuation transparent opacity={0} toneMapped={false} />
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

  const curvePoints = useMemo(() => Array.from({ length: 60 }, (_, i) => {
    const x  = (i / 59) * 4 - 2;
    const y  = gelu(x);
    const px = (i / 59) * W;
    const py = H / 2 - y * H * 0.35;
    return `${px.toFixed(1)},${Math.max(1, Math.min(H - 1, py)).toFixed(1)}`;
  }).join(" "),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [W, H]);

  const axisLabel: React.CSSProperties = {
    fontFamily: "var(--font-mono,monospace)", fontSize: isMobile ? 7 : 8,
    fill: "rgba(255,230,203,0.28)" as string, letterSpacing: "0.08em",
  };

  return (
    <div style={{ background: "rgba(4,28,28,0.88)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,230,203,0.12)", borderRadius: 4, padding: "5px 7px 4px", pointerEvents: "none" }}>
      <div style={{ fontFamily: "var(--font-mono,monospace)", fontSize: isMobile ? 11 : 12, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "rgba(255,230,203,0.48)", marginBottom: 4, userSelect: "none" }}>
        GELU
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <line x1="0" y1={H/2} x2={W} y2={H/2} stroke="rgba(255,230,203,0.08)" strokeWidth="0.5" />
        <line x1={W/2} y1="0" x2={W/2} y2={H} stroke="rgba(255,230,203,0.08)" strokeWidth="0.5" />
        <text x={W-2} y={H/2-3} textAnchor="end" style={axisLabel}>x</text>
        <text x={W/2+3} y={9} style={axisLabel}>f(x)</text>
        <polyline points={curvePoints} fill="none" stroke={EM_HEX} strokeWidth="1.5" strokeLinejoin="round" />
        <circle ref={dotRef} cx={W/2} cy={H/2} r="2.8" fill={EM_HEX} opacity="0.9" />
      </svg>
    </div>
  );
}
