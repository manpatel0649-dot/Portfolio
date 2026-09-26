"use client";

/**
 * NeuronInterior — Stage C. Volumetric neuron interior.
 *
 * Key sizing (world units, camera at z = tnZ+4, fov = 45, 1wu ≈ 272 px):
 *   Nucleus sphere   0.07wu radius  (~19 px, matches reference)
 *   Halo sprite      0.55wu scale   (~75 px radius soft glow)
 *   Rim              0.133wu base radius
 *   Arcs             0.184 / 0.228 / 0.272wu
 *   Motes            0.213wu base
 *   Strand opacity   0.12 visible hairline on dark background
 *   Signal dots      circular canvas-gradient texture (not square GL_POINTS)
 *   Axon             thin THREE.Line, not TubeGeometry
 */

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { getSceneState } from "@/components/three/useSceneStore";
import { TARGET_NEURON_POS } from "@/lib/network";

// ── Neuron math ────────────────────────────────────────────────────────────────

const W5   = [0.42, -0.17, 0.88, 0.05, -0.63] as const;
const W3   = [0.42, 0.88, -0.63] as const;
const BIAS = 0.12;

function gelu(x: number): number {
  const c = Math.sqrt(2 / Math.PI);
  return 0.5 * x * (1 + Math.tanh(c * (x + 0.044715 * x ** 3)));
}

// ── Seeded LCG PRNG ────────────────────────────────────────────────────────────

let _seed = 1337;
function _R(a: number, b: number): number {
  _seed = (_seed * 1664525 + 1013904223) % 4294967296;
  return a + (_seed / 4294967296) * (b - a);
}
function resetSeed() { _seed = 1337; }

// ── Layout ─────────────────────────────────────────────────────────────────────

const INPUT_X      = -1.60;
const INPUT_X_MOB  = -0.50;
const OUTPUT_X_MOB = +0.60;

// Fan: A0 ≈ 105°, A1 ≈ 256° — left hemisphere only
const FAN_A0 = Math.PI * (1 - 0.46 * 0.92);
const FAN_A1 = Math.PI * (1 + 0.46 * 0.92);

const BG_POS: [number, number, number][] = [
  [-2.4,  0.9, -3.0], [-1.9, -1.1, -3.6], [ 2.1,  0.7, -2.9],
  [ 1.6, -0.9, -4.1], [-2.9,  0.2, -3.8], [ 0.9,  1.6, -3.3],
  [-1.1,  1.9, -4.3], [ 2.7, -0.5, -3.7],
];

// ── Core decoration constants — scaled to match reference pixel sizes at 272px/wu ─

const BASE_RIM   = 0.075;   // ~20 px — inside compact halo
const RIM_AMP1   = 0.006;
const RIM_AMP2   = 0.004;
const ARC_RADII  = [0.10, 0.13, 0.17] as const;   // 27/35/46 px — inside halo
const ARC_SPEEDS = [0.40,  0.65,  0.90]  as const;
const MOTE_R     = 0.14;    // 38 px
const MOTE_VAR   = 0.030;
const RIPPLE_R0  = 0.07;
const RIPPLE_DR  = 0.045;
const RIPPLE_DUR = 0.6;

// ── Three.js constants ─────────────────────────────────────────────────────────

// Nucleus HDR: G=1.4 → luminance ≈1.1 → moderate bloom radius (~80px), not wall-filling
const EM_HDR    = new THREE.Color(0.5, 1.4, 0.8);
const AMBER_HDR = new THREE.Color(1.0, 0.74, 0.22);
const EM_HEX    = "#34d399";
const AMBER_HEX = "#ffbd38";
const CREAM_COL = new THREE.Color("#ffe6cb");

const _tmpVec = new THREE.Vector3();
const _obj    = new THREE.Object3D();
const _col    = new THREE.Color();

// ── Types ──────────────────────────────────────────────────────────────────────

interface StrandData {
  path:       Float32Array;
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

// ── Style tokens ───────────────────────────────────────────────────────────────

const SERIF  = "var(--font-serif, Georgia, serif)";
const TERM   = "var(--font-term, var(--font-courier-prime,'Courier New',monospace))";
const MONO   = "var(--font-mono, monospace)";
const CREAM  = "rgba(255,230,203,0.92)";
const CREAM2 = "rgba(255,230,203,0.66)";
const CREAM3 = "rgba(255,230,203,0.38)";

// ── Canvas textures (created once, shared across all instances) ─────────────────

function makeCircleTex(
  innerColor: string, midColor: string, size = 32,
): THREE.CanvasTexture {
  const c   = document.createElement("canvas");
  c.width   = c.height = size;
  const ctx = c.getContext("2d")!;
  const grd = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  grd.addColorStop(0,    innerColor);
  grd.addColorStop(0.40, midColor);
  grd.addColorStop(1,    "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function makeHaloTex(size = 128): THREE.CanvasTexture {
  const c   = document.createElement("canvas");
  c.width   = c.height = size;
  const ctx = c.getContext("2d")!;
  const grd = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  grd.addColorStop(0,    "rgba(200,255,220,0.90)");
  grd.addColorStop(0.20, "rgba(52,211,153,0.55)");
  grd.addColorStop(0.55, "rgba(52,211,153,0.14)");
  grd.addColorStop(1,    "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function NeuronInterior() {
  const groupRef    = useRef<THREE.Group>(null);
  const bgGroupRef  = useRef<THREE.Group>(null);
  const midGroupRef = useRef<THREE.Group>(null);
  const fgGroupRef  = useRef<THREE.Group>(null);

  // Nucleus
  const nucleusMesh  = useRef<THREE.Mesh>(null);
  const nucleusMtRef = useRef<THREE.MeshBasicMaterial>(null);

  // Halo sprite (replaces three BackSide shells → no blowout)
  const haloSpriteMtRef = useRef<THREE.SpriteMaterial | null>(null);

  // Core decorations (imperative — avoids JSX <line> SVG conflict)
  const rimAttrRef     = useRef<THREE.BufferAttribute | null>(null);
  const rimBufRef      = useRef(new Float32Array(83 * 3));
  const rimMtRef       = useRef<THREE.LineBasicMaterial | null>(null);
  const arcGroupRefs   = useRef<THREE.Group[]>([]);
  const arcMtRefs      = useRef<THREE.LineBasicMaterial[]>([]);
  const moteBufRef     = useRef(new Float32Array(9 * 3));
  const moteAttrRef    = useRef<THREE.BufferAttribute | null>(null);
  const moteMtRef      = useRef<THREE.PointsMaterial | null>(null);
  const rippleAttrRefs = useRef<THREE.BufferAttribute[]>([]);
  const rippleMtRefs   = useRef<THREE.LineBasicMaterial[]>([]);
  const rippleStartRef = useRef([0, 1.1, 2.2, 3.3]);

  // BG neurons
  const bgMeshRef = useRef<THREE.InstancedMesh>(null);
  const bgMtRef   = useRef<THREE.MeshBasicMaterial>(null);

  // Strand geometry (imperative)
  const strandSegsRef = useRef<THREE.LineSegments[]>([]);
  const strandMatsRef = useRef<THREE.LineBasicMaterial[]>([]);

  // Signal particles
  const sigPosGeoRef = useRef<THREE.BufferGeometry>(null);
  const sigNegGeoRef = useRef<THREE.BufferGeometry>(null);
  const sigPosMtRef  = useRef<THREE.PointsMaterial>(null);
  const sigNegMtRef  = useRef<THREE.PointsMaterial>(null);

  // Axon thin line (replaces TubeGeometry) and its moving particle
  const axonLineMtRef = useRef<THREE.LineBasicMaterial | null>(null);
  const ptAxonRef     = useRef<THREE.PointsMaterial>(null);
  const axonPhase     = useRef(0);
  const axonPosArr    = useRef(new Float32Array(3));
  const axonAttr      = useRef<THREE.BufferAttribute | null>(null);

  // Foreground dust
  const ptDustRef = useRef<THREE.PointsMaterial>(null);

  // HTML refs
  const t1aRef       = useRef<HTMLDivElement>(null);
  const t1bRef       = useRef<HTMLDivElement>(null);
  const t2zRef       = useRef<HTMLDivElement>(null);
  const t2aRef       = useRef<HTMLDivElement>(null);
  const t3bRef       = useRef<HTMLDivElement>(null);
  const inputRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const inputValRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const t5Ref        = useRef<HTMLDivElement>(null);
  const zSpanRef     = useRef<HTMLSpanElement>(null);
  const outSpanRef   = useRef<HTMLSpanElement>(null);
  const dotRef       = useRef<SVGCircleElement>(null);

  const strandBuildRef = useRef<StrandBuild | null>(null);

  const { size } = useThree();
  const isMobile = size.width < 900;
  const weights  = isMobile ? W3 : W5;
  const n        = weights.length;
  const inX      = isMobile ? INPUT_X_MOB : INPUT_X;
  const outX     = isMobile ? OUTPUT_X_MOB : 1.80;

  // ── Canvas textures (client-side only) ────────────────────────────────────
  const dotTexEM  = useMemo(() => typeof document !== "undefined"
    ? makeCircleTex("rgba(200,255,220,1.0)", "rgba(52,211,153,0.7)") : null, []);
  const dotTexAmb = useMemo(() => typeof document !== "undefined"
    ? makeCircleTex("rgba(255,240,180,1.0)", "rgba(255,189,56,0.7)") : null, []);
  const haloTex   = useMemo(() => typeof document !== "undefined"
    ? makeHaloTex() : null, []);

  // ── Axon curve ─────────────────────────────────────────────────────────────
  const axonCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,           0,     0),
    new THREE.Vector3(outX * 0.40, 0.10, -0.20),
    new THREE.Vector3(outX * 0.75, 0.04, -0.35),
    new THREE.Vector3(outX,        0,    -0.50),
  ]), [outX]);

  const axonPtGeo = useMemo(() => {
    const geo  = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(axonPosArr.current, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", attr);
    axonAttr.current = attr;
    return geo;
  }, []);

  // ── Foreground dust ─────────────────────────────────────────────────────────
  const DUST    = isMobile ? 60 : 180;
  const dustGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 5.5;
      pos[i*3+1] = (Math.random() - 0.5) * 3.5;
      pos[i*3+2] = Math.random() * 0.8 + 1.2;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [DUST]);

  // ── Mouse parallax ──────────────────────────────────────────────────────────
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

  // ── BG neurons ──────────────────────────────────────────────────────────────
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

  // ── Halo sprite + axon thin line + core decorations (all imperative) ────────
  useEffect(() => {
    const mid = midGroupRef.current;
    if (!mid || !haloTex) return;

    const toRemove: THREE.Object3D[] = [];
    const toDispose: { geo?: THREE.BufferGeometry; mt: THREE.Material }[] = [];

    // 1. Soft halo sprite (billboarded, radial gradient texture)
    //    Scale 0.38wu → ~52px radius on screen. Opacity 0.35 keeps luminance below heavy-bloom threshold.
    const haloMt = new THREE.SpriteMaterial({
      map: haloTex, transparent: true, opacity: 0,
      toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const haloSprite = new THREE.Sprite(haloMt);
    haloSprite.scale.set(0.45, 0.45, 1);
    mid.add(haloSprite);
    haloSpriteMtRef.current = haloMt;
    toRemove.push(haloSprite);
    toDispose.push({ mt: haloMt });

    // 2. Noisy breathing rim
    const rimBuf  = rimBufRef.current;
    const rimGeo  = new THREE.BufferGeometry();
    const rimAttr = new THREE.BufferAttribute(rimBuf, 3);
    rimAttr.setUsage(THREE.DynamicDrawUsage);
    rimGeo.setAttribute("position", rimAttr);
    rimGeo.setDrawRange(0, 83);
    const rimMt   = new THREE.LineBasicMaterial({ color: EM_HEX, transparent: true, opacity: 0, toneMapped: false });
    mid.add(new THREE.Line(rimGeo, rimMt));
    rimAttrRef.current = rimAttr;
    rimMtRef.current   = rimMt;
    toDispose.push({ geo: rimGeo, mt: rimMt });

    // 3. Three rotating arcs
    const arcGroups: THREE.Group[] = [];
    const arcMts:    THREE.LineBasicMaterial[] = [];
    ARC_RADII.forEach(r => {
      const PTS = 36;
      const pos = new Float32Array((PTS + 1) * 3);
      for (let k = 0; k <= PTS; k++) {
        const th  = (k / PTS) * Math.PI * 1.5;
        pos[k*3]   = Math.cos(th) * r;
        pos[k*3+1] = Math.sin(th) * r;
        pos[k*3+2] = 0;
      }
      const geo  = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setDrawRange(0, PTS + 1);
      const mt   = new THREE.LineBasicMaterial({ color: EM_HEX, transparent: true, opacity: 0, toneMapped: false });
      const line = new THREE.Line(geo, mt);
      const grp  = new THREE.Group();
      grp.add(line);
      mid.add(grp);
      arcGroups.push(grp);
      arcMts.push(mt);
      toDispose.push({ geo, mt });
      toRemove.push(grp);
    });
    arcGroupRefs.current = arcGroups;
    arcMtRefs.current    = arcMts;

    // 4. Nine orbiting motes
    const moteBuf  = moteBufRef.current;
    const moteGeo  = new THREE.BufferGeometry();
    const moteAttr = new THREE.BufferAttribute(moteBuf, 3);
    moteAttr.setUsage(THREE.DynamicDrawUsage);
    moteGeo.setAttribute("position", moteAttr);
    const moteMt  = new THREE.PointsMaterial({
      color: EM_HDR, size: isMobile ? 0.012 : 0.016, sizeAttenuation: true,
      transparent: true, opacity: 0, toneMapped: false,
      map: dotTexEM ?? undefined, alphaTest: 0.01, depthWrite: false,
    });
    const motePts = new THREE.Points(moteGeo, moteMt);
    mid.add(motePts);
    moteAttrRef.current = moteAttr;
    moteMtRef.current   = moteMt;
    toDispose.push({ geo: moteGeo, mt: moteMt });
    toRemove.push(motePts);

    // 5. Ripple rings
    const rippleAttrs: THREE.BufferAttribute[] = [];
    const rippleMts:   THREE.LineBasicMaterial[] = [];
    for (let ri = 0; ri < 4; ri++) {
      const PTS  = 24;
      const buf  = new Float32Array((PTS + 1) * 3);
      const geo  = new THREE.BufferGeometry();
      const attr = new THREE.BufferAttribute(buf, 3);
      attr.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute("position", attr);
      geo.setDrawRange(0, PTS + 1);
      const mt   = new THREE.LineBasicMaterial({ color: EM_HEX, transparent: true, opacity: 0, toneMapped: false });
      const line = new THREE.Line(geo, mt);
      mid.add(line);
      rippleAttrs.push(attr);
      rippleMts.push(mt);
      toDispose.push({ geo, mt });
      toRemove.push(line);
    }
    rippleAttrRefs.current = rippleAttrs;
    rippleMtRefs.current   = rippleMts;

    // 6. Axon thin line (replaces TubeGeometry — same weight as strands)
    const axonPts = axonCurve.getPoints(32);
    const axonGeo = new THREE.BufferGeometry().setFromPoints(axonPts);
    const axonMt  = new THREE.LineBasicMaterial({ color: EM_HEX, transparent: true, opacity: 0, toneMapped: false });
    const axonLine = new THREE.Line(axonGeo, axonMt);
    mid.add(axonLine);
    axonLineMtRef.current = axonMt;
    toDispose.push({ geo: axonGeo, mt: axonMt });
    toRemove.push(axonLine);

    return () => {
      toRemove.forEach(o => mid.remove(o));
      toDispose.forEach(({ geo, mt }) => { geo?.dispose(); mt.dispose(); });
    };
  }, [isMobile, haloTex, dotTexEM, axonCurve]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Strand geometry ─────────────────────────────────────────────────────────
  useEffect(() => {
    const mid = midGroupRef.current;
    if (!mid) return;

    strandSegsRef.current.forEach(seg => {
      mid.remove(seg);
      seg.geometry.dispose();
      (seg.material as THREE.Material).dispose();
    });
    strandSegsRef.current = [];
    strandMatsRef.current = [];
    strandBuildRef.current = null;

    resetSeed();

    const N  = isMobile ? 28 : 46;
    const TR = isMobile ? 2  : 3;
    const angleStep = n > 1 ? (FAN_A1 - FAN_A0) / (n - 1) : 0;
    const D_base    = Math.abs(inX) * 1.05;

    const groups: StrandData[][] = [];
    let posCapacity = 0;
    let negCapacity = 0;

    for (let gi = 0; gi < n; gi++) {
      const w       = (weights as readonly number[])[gi];
      const isPos   = w >= 0;
      const baseAng = FAN_A0 + angleStep * gi;
      const nSt     = Math.round((7 + Math.abs(w) * 16) * (isMobile ? 0.40 : 1.0));
      const hw      = 0.12 + Math.abs(w) * 0.11;

      const nVerts    = nSt * (N - 1) * 2;
      const positions = new Float32Array(nVerts * 3);
      let   vOff      = 0;
      const strands: StrandData[] = [];

      for (let k = 0; k < nSt; k++) {
        const ang  = baseAng + _R(-hw, hw);
        const dk   = D_base * _R(0.62, 1.3);
        const sx   = Math.cos(ang) * dk;
        const sy   = -Math.sin(ang) * dk;
        const sz   = _R(-0.30, 0.30);
        const dockR = _R(0.20, 0.28);
        const ex   = Math.cos(ang) * dockR;
        const ey   = -Math.sin(ang) * dockR;
        const ez   = sz * 0.05;
        const bw   = _R(-1, 1) * dk * _R(0.03, 0.09);
        const pnx  = -Math.sin(ang);
        const pny  = -Math.cos(ang);
        const p0   = [sx, sy, sz];
        const p1   = [Math.min(sx*0.6+ex*0.4+pnx*bw, -0.28), sy*0.6+ey*0.4+pny*bw, sz*0.7];
        const p2   = [Math.min(sx*0.3+ex*0.7+pnx*bw*0.4, -0.10), sy*0.3+ey*0.7+pny*bw*0.4, sz*0.3];
        const p3   = [ex, ey, ez];

        const n1  = { a: _R(-0.14,0.14), f: _R(1.0,3.2), p: _R(0,Math.PI*2) };
        const n2  = { a: _R(-0.06,0.06), f: _R(2.6,6.5), p: _R(0,Math.PI*2) };
        const wph = _R(0, Math.PI*2);
        const wam = _R(0.012, 0.035);

        const path = new Float32Array(N * 3);
        for (let s = 0; s < N; s++) {
          const t = s / (N - 1);
          const u = 1 - t;
          const bpx = u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0];
          const bpy = u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1];
          const bpz = u*u*u*p0[2]+3*u*u*t*p1[2]+3*u*t*t*p2[2]+t*t*t*p3[2];
          const dbx = 3*(u*u*(p1[0]-p0[0])+2*u*t*(p2[0]-p1[0])+t*t*(p3[0]-p2[0]));
          const dby = 3*(u*u*(p1[1]-p0[1])+2*u*t*(p2[1]-p1[1])+t*t*(p3[1]-p2[1]));
          const dbl = Math.sqrt(dbx*dbx+dby*dby)||1;
          const tnx = -dby/dbl;
          const tny =  dbx/dbl;
          const taper  = Math.pow(Math.sin(t*Math.PI),0.8)*0.92+0.08*(1-t);
          const woff   = Math.sin(t*n1.f*3.1+n1.p)*n1.a+Math.sin(t*n2.f*3.1+n2.p)*n2.a;
          const wob    = Math.sin(wph+t*6)*wam;
          const offset = (woff+wob)*taper;
          path[s*3]   = bpx+tnx*offset;
          path[s*3+1] = bpy+tny*offset;
          path[s*3+2] = bpz+tnx*offset*0.3;

          if (s > 0) {
            positions[vOff++] = path[(s-1)*3];
            positions[vOff++] = path[(s-1)*3+1];
            positions[vOff++] = path[(s-1)*3+2];
            positions[vOff++] = path[s*3];
            positions[vOff++] = path[s*3+1];
            positions[vOff++] = path[s*3+2];
          }
        }

        strands.push({
          path, phase: _R(0,1), speed: 0.07+Math.abs(w)*0.05+_R(0,0.04),
          isPositive: isPos,
        });
      }

      if (isPos) posCapacity += nSt * TR;
      else       negCapacity += nSt * TR;
      groups.push(strands);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions.slice(0, vOff), 3));
      const mat = new THREE.LineBasicMaterial({
        color: isPos ? EM_HEX : AMBER_HEX, transparent: true, opacity: 0, toneMapped: false,
      });
      const seg = new THREE.LineSegments(geo, mat);
      mid.add(seg);
      strandSegsRef.current.push(seg);
      strandMatsRef.current.push(mat);
    }

    const sigPosBuf  = new Float32Array(Math.max(posCapacity,1)*3).fill(1e6);
    const sigNegBuf  = new Float32Array(Math.max(negCapacity,1)*3).fill(1e6);
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
  }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Main loop ───────────────────────────────────────────────────────────────
  const opRef = useRef(0);

  useFrame((state, delta) => {
    const { totalProgress: tp } = getSceneState();
    const g = groupRef.current;
    if (!g) return;

    let target = 0;
    if      (tp >= 0.30 && tp < 0.37) { const x=(tp-0.30)/0.07; target=x*x*(3-2*x); }
    else if (tp >= 0.37 && tp < 0.50) { target = 1.0; }
    else if (tp >= 0.50 && tp < 0.57) { const x=(tp-0.50)/0.07; target=1.0-x*x*(3-2*x); }
    opRef.current += (target - opRef.current) * 0.12;
    const op = opRef.current;
    g.visible = op > 0.01;
    if (!g.visible) return;

    const t  = state.clock.elapsedTime;
    const mx = mouse.current.x;
    const my = mouse.current.y;

    const baseY = Math.sin(t*0.09)*0.18+mx*0.10;
    const baseX = Math.sin(t*0.06)*0.10+my*-0.06;
    if (bgGroupRef.current)  { bgGroupRef.current.rotation.y  = baseY*0.40; bgGroupRef.current.rotation.x  = baseX*0.40; }
    if (midGroupRef.current) { midGroupRef.current.rotation.y = baseY;       midGroupRef.current.rotation.x = baseX; }
    if (fgGroupRef.current)  { fgGroupRef.current.rotation.y  = baseY*1.80; fgGroupRef.current.rotation.x  = baseX*1.80; }

    const inputs = (weights as readonly number[]).map((_,i) =>
      0.5+0.35*Math.sin(t*0.22+i*1.5));
    const z   = (weights as readonly number[]).reduce((s,w,i) => s+w*inputs[i], BIAS);
    const out = gelu(z);
    const br  = Math.min(1, 0.3+Math.abs(z)*0.5);
    const pls = 1+Math.sin(t*2.5+Math.abs(z))*0.18*Math.abs(z);

    // Nucleus: G=1.4 → luminance ≈1.1 → moderate bloom (~80px radius)
    if (nucleusMtRef.current) {
      nucleusMtRef.current.color.set(br*pls*0.5, br*pls*1.4, br*pls*0.8);
      nucleusMtRef.current.opacity = op;
    }
    if (nucleusMesh.current) {
      nucleusMesh.current.scale.set(
        1+0.04*Math.sin(t*1.30), 1+0.03*Math.sin(t*1.00+1.1), 1+0.05*Math.sin(t*1.60-0.7),
      );
    }

    // Halo sprite — 0.45 opacity gives visible glow without triggering heavy bloom from the sprite itself
    if (haloSpriteMtRef.current) {
      haloSpriteMtRef.current.opacity = op * 0.45;
    }

    // Rim
    const rimAttr = rimAttrRef.current;
    if (rimAttr && rimMtRef.current) {
      const buf = rimBufRef.current;
      for (let k = 0; k < 82; k++) {
        const th = (k/82)*Math.PI*2;
        const rr = BASE_RIM+Math.sin(th*3+t*1.3)*RIM_AMP1+Math.sin(th*7-t*0.9)*RIM_AMP2+pls*0.003;
        buf[k*3]=Math.cos(th)*rr; buf[k*3+1]=Math.sin(th)*rr; buf[k*3+2]=0;
      }
      buf[82*3]=buf[0]; buf[82*3+1]=buf[1]; buf[82*3+2]=0;
      rimAttr.needsUpdate = true;
      rimMtRef.current.opacity = op * 0.55;
    }

    // Arcs
    arcGroupRefs.current.forEach((grp,k) => {
      grp.rotation.z = t * ARC_SPEEDS[k];
      arcMtRefs.current[k].opacity = op * 0.28;
    });

    // Motes
    const moteAttr = moteAttrRef.current;
    if (moteAttr && moteMtRef.current) {
      const buf = moteBufRef.current;
      for (let k = 0; k < 9; k++) {
        const th = t*(0.5+k*0.08)+k*0.7;
        const rr = MOTE_R+Math.sin(t*1.1+k)*MOTE_VAR;
        buf[k*3]=Math.cos(th)*rr; buf[k*3+1]=Math.sin(th)*rr; buf[k*3+2]=Math.sin(t*0.7+k*1.3)*0.03;
      }
      moteAttr.needsUpdate = true;
      moteMtRef.current.opacity = op * 0.80;
    }

    // Ripples
    rippleAttrRefs.current.forEach((attr,ri) => {
      const period = RIPPLE_DUR * 4.5;
      const age    = ((t-rippleStartRef.current[ri])%period+period)%period;
      if (age < RIPPLE_DUR) {
        const phase = age/RIPPLE_DUR;
        const r     = RIPPLE_R0+phase*RIPPLE_DR;
        const buf   = attr.array as Float32Array;
        for (let k = 0; k <= 24; k++) {
          const th=k/24*Math.PI*2; buf[k*3]=Math.cos(th)*r; buf[k*3+1]=Math.sin(th)*r; buf[k*3+2]=0;
        }
        attr.needsUpdate = true;
        rippleMtRefs.current[ri].opacity = op*0.45*(1-phase);
      } else {
        rippleMtRefs.current[ri].opacity = 0;
      }
    });

    // BG neurons
    const bgMesh = bgMeshRef.current;
    if (bgMesh) {
      for (let i = 0; i < BG_POS.length; i++) {
        const p = 0.05+0.04*Math.sin(t*0.9+i*1.7);
        _col.setRGB(p*0.8,p*2.0,p*0.9); bgMesh.setColorAt(i,_col);
      }
      if (bgMesh.instanceColor) bgMesh.instanceColor.needsUpdate = true;
    }
    if (bgMtRef.current) bgMtRef.current.opacity = op * 0.15;

    // Strands: 0.12 base opacity — visible hairlines on dark bg (was 0.04, too dim)
    const build = strandBuildRef.current;
    if (build) {
      const { groups, nSamples, trail, sigPosBuf, sigNegBuf, sigPosAttr, sigNegAttr } = build;
      let posOff = 0, negOff = 0;

      groups.forEach((strands,gi) => {
        const mt = strandMatsRef.current[gi];
        if (mt) mt.opacity = op * 0.12; // 3× the old value → visible hairlines

        strands.forEach(strand => {
          strand.phase = (strand.phase+delta*strand.speed)%1;
          for (let k = 0; k < trail; k++) {
            const ph  = (strand.phase+k*0.05)%1;
            const idx = ph*(nSamples-1);
            const lo  = Math.floor(idx);
            const hi  = Math.min(lo+1,nSamples-1);
            const fr  = idx-lo;
            const b=lo*3, c=hi*3;
            const px=strand.path[b]+(strand.path[c]-strand.path[b])*fr;
            const py=strand.path[b+1]+(strand.path[c+1]-strand.path[b+1])*fr;
            const pz=strand.path[b+2]+(strand.path[c+2]-strand.path[b+2])*fr;
            if (strand.isPositive) { sigPosBuf[posOff++]=px; sigPosBuf[posOff++]=py; sigPosBuf[posOff++]=pz; }
            else                   { sigNegBuf[negOff++]=px; sigNegBuf[negOff++]=py; sigNegBuf[negOff++]=pz; }
          }
        });
      });

      while (posOff < sigPosBuf.length) sigPosBuf[posOff++] = 1e6;
      while (negOff < sigNegBuf.length) sigNegBuf[negOff++] = 1e6;
      sigPosAttr.needsUpdate = true;
      sigNegAttr.needsUpdate = true;
      if (sigPosMtRef.current) sigPosMtRef.current.opacity = op * 0.90;
      if (sigNegMtRef.current) sigNegMtRef.current.opacity = op * 0.90;
    }

    // Axon thin line
    if (axonLineMtRef.current) axonLineMtRef.current.opacity = op * 0.50;

    // Axon travelling particle
    axonPhase.current = (axonPhase.current+delta*0.45)%1;
    axonCurve.getPoint(axonPhase.current, _tmpVec);
    axonPosArr.current[0]=_tmpVec.x; axonPosArr.current[1]=_tmpVec.y; axonPosArr.current[2]=_tmpVec.z;
    if (axonAttr.current)  axonAttr.current.needsUpdate = true;
    if (ptAxonRef.current) ptAxonRef.current.opacity = op * 0.95;
    if (ptDustRef.current) ptDustRef.current.opacity = op * 0.08;

    // HTML reveal tiers
    const tierOp = (thresh: number) => Math.max(0,Math.min(1,(op-thresh)/0.20));
    if (t1aRef.current)  t1aRef.current.style.opacity  = String(tierOp(0.08));
    if (t1bRef.current)  t1bRef.current.style.opacity  = String(tierOp(0.08));
    if (t2zRef.current)  t2zRef.current.style.opacity  = String(tierOp(0.28));
    if (t2aRef.current)  t2aRef.current.style.opacity  = String(tierOp(0.28));
    if (t3bRef.current)  t3bRef.current.style.opacity  = String(tierOp(0.44));
    inputRefs.current.forEach((el,i) => {
      if (el) el.style.opacity = String(tierOp(0.46+i*0.06));
    });
    if (t5Ref.current) t5Ref.current.style.opacity = String(tierOp(0.80));

    if (zSpanRef.current)   zSpanRef.current.textContent   = z.toFixed(3);
    if (outSpanRef.current) outSpanRef.current.textContent = out.toFixed(3);
    inputValRefs.current.forEach((el,i) => { if (el) el.textContent = inputs[i].toFixed(2); });

    if (dotRef.current) {
      const svgW=isMobile?68:90, svgH=isMobile?38:46;
      const cz=Math.max(-2,Math.min(2,z));
      dotRef.current.setAttribute("cx",((cz+2)/4*svgW).toFixed(1));
      dotRef.current.setAttribute("cy",Math.max(1,Math.min(svgH-1,svgH/2-gelu(cz)*svgH*0.35)).toFixed(1));
    }
  });

  // ── JSX ─────────────────────────────────────────────────────────────────────
  const [wx, wy, wz] = TARGET_NEURON_POS;
  const d = <T,>(desktop: T, mobile: T): T => isMobile ? mobile : desktop;

  // Label anchors follow fan geometry
  const labelAnchors = useMemo(() => {
    const step = n > 1 ? (FAN_A1-FAN_A0)/(n-1) : 0;
    const D = Math.abs(inX) * 0.75;
    return Array.from({ length: n }, (_,i) => {
      const ang = FAN_A0 + step * i;
      return { x: Math.cos(ang)*D, y: -Math.sin(ang)*D };
    });
  }, [n, inX]);

  // Plain-text label style — no box, just a subtle text-shadow for legibility
  const labelStyle: React.CSSProperties = {
    fontFamily: TERM, fontSize: d(15, 14), color: CREAM2,
    lineHeight: 1.4, whiteSpace: "nowrap",
    pointerEvents: "none", userSelect: "none",
    textShadow: "0 0 10px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.8)",
  };

  const eqStyle: React.CSSProperties = {
    pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap",
    textShadow: "0 0 12px rgba(0,0,0,0.95)",
  };

  return (
    <group ref={groupRef} position={[wx, wy, wz]} visible={false}>

      {/* BG layer */}
      <group ref={bgGroupRef}>
        <instancedMesh ref={bgMeshRef} args={[undefined, undefined, BG_POS.length]}>
          <sphereGeometry args={[0.06, 6, 4]} />
          <meshBasicMaterial ref={bgMtRef} vertexColors transparent opacity={0} toneMapped={false} />
        </instancedMesh>
      </group>

      {/* MID layer */}
      <group ref={midGroupRef}>

        {/* Nucleus: tiny bright sphere — bloom provides compact glow ring */}
        <mesh ref={nucleusMesh}>
          <sphereGeometry args={[0.05, 20, 14]} />
          <meshBasicMaterial ref={nucleusMtRef} color={EM_HDR} transparent opacity={0} toneMapped={false} />
        </mesh>

        {/* Halo sprite, rim, arcs, motes, ripples, axon line
            added imperatively in useEffect above */}

        {/* Signal particles — emerald: round soft dots via canvas gradient texture */}
        <points>
          <bufferGeometry ref={sigPosGeoRef} />
          <pointsMaterial ref={sigPosMtRef}
            color="#ffffff"
            map={dotTexEM ?? undefined}
            alphaTest={0.01}
            size={d(0.028, 0.022)}
            sizeAttenuation transparent opacity={0}
            toneMapped={false} depthWrite={false}
          />
        </points>

        {/* Signal particles — amber: round soft dots */}
        <points>
          <bufferGeometry ref={sigNegGeoRef} />
          <pointsMaterial ref={sigNegMtRef}
            color="#ffffff"
            map={dotTexAmb ?? undefined}
            alphaTest={0.01}
            size={d(0.028, 0.022)}
            sizeAttenuation transparent opacity={0}
            toneMapped={false} depthWrite={false}
          />
        </points>

        {/* Axon travelling particle */}
        <points geometry={axonPtGeo}>
          <pointsMaterial ref={ptAxonRef}
            color="#ffffff"
            map={dotTexEM ?? undefined}
            alphaTest={0.01}
            size={d(0.032, 0.026)}
            sizeAttenuation transparent opacity={0}
            toneMapped={false} depthWrite={false}
          />
        </points>

        {/* Input labels — plain text: x₃  0.88   w +0.88
            Small coloured dot prefix, no background box */}
        {labelAnchors.map(({ x: lx, y: ly }, i) => {
          const w     = (weights as readonly number[])[i];
          const col   = w < 0 ? AMBER_HEX : EM_HEX;
          const sub   = ["₁","₂","₃","₄","₅"][i] ?? String(i+1);
          const wSign = w > 0 ? "+" : "";
          return (
            <Html key={i} position={[lx, ly, 0]} center>
              <div ref={el => { inputRefs.current[i] = el; }} style={{ opacity: 0 }}>
                <div style={labelStyle}>
                  {/* 4 px colour dot */}
                  <span style={{
                    display: "inline-block", width: 4, height: 4,
                    borderRadius: "50%", background: col,
                    marginRight: 5, verticalAlign: "middle",
                    boxShadow: `0 0 4px ${col}`,
                  }} />
                  x{sub}&ensp;
                  <span ref={el => { inputValRefs.current[i] = el; }} style={{ color: CREAM }}>0.50</span>
                  &ensp;w{" "}
                  <span style={{ color: col }}>{wSign}{w.toFixed(2)}</span>
                </div>
              </div>
            </Html>
          );
        })}

        {/* TOP-ZONE: z = Σ(w·x) + b — no box, just styled text */}
        <Html position={[d(0.50,0), d(1.10,0.92), 0]} center>
          <div ref={t1aRef} style={{ opacity: 0, textAlign: "center", ...eqStyle }}>
            <span style={{ fontFamily: SERIF, fontSize: d(42,26), color: CREAM, lineHeight: 1 }}>
              <em style={{ color: EM_HEX, fontStyle: "italic" }}>z</em>{" = Σ(w·x) + b"}
            </span>
          </div>
        </Html>

        {/* live z — no box */}
        <Html position={[d(0.50,0), d(0.82,0.64), 0]} center>
          <div ref={t2zRef} style={{ opacity: 0, ...eqStyle }}>
            <span style={{ fontFamily: TERM, fontSize: d(28,18), fontWeight: 700, color: EM_HEX, lineHeight: 1 }}>
              <em style={{ fontStyle: "italic" }}>z</em>{" = "}<span ref={zSpanRef}>···</span>
            </span>
          </div>
        </Html>

        {/* b chip */}
        <Html position={[d(0.22,0.18), d(-0.34,-0.28), 0]} center>
          <div ref={t3bRef} style={{ opacity: 0, ...eqStyle }}>
            <span style={{ fontFamily: TERM, fontSize: d(14,12), color: CREAM3 }}>b = {BIAS}</span>
          </div>
        </Html>

        {/* GELU panel */}
        <Html position={[d(1.55,0.30), d(0.52,0.28), 0]} center>
          <GeluPanel dotRef={dotRef} isMobile={isMobile} />
        </Html>

        {/* a = GELU(z) */}
        <Html position={[d(1.55,0.30), d(-0.08,-0.12), 0]} center>
          <div ref={t1bRef} style={{ opacity: 0, textAlign: "center", ...eqStyle }}>
            <span style={{ fontFamily: SERIF, fontSize: d(42,26), color: CREAM, lineHeight: 1 }}>
              <em style={{ color: EM_HEX, fontStyle: "italic" }}>a</em>
              {" = GELU("}<em style={{ color: EM_HEX, fontStyle: "italic" }}>z</em>{")"}
            </span>
          </div>
        </Html>

        {/* live a + → NEXT LAYER */}
        <Html position={[d(1.55,0.30), d(-0.42,-0.50), 0]} center>
          <div ref={t2aRef} style={{ opacity: 0, textAlign: "center", ...eqStyle }}>
            <span style={{ fontFamily: TERM, fontSize: d(28,18), fontWeight: 700, color: EM_HEX, lineHeight: 1, display: "block" }}>
              <em style={{ fontStyle: "italic" }}>a</em>{" = "}<span ref={outSpanRef}>···</span>
            </span>
            <span style={{ fontFamily: MONO, fontSize: d(11,10), letterSpacing: "0.14em",
              textTransform: "uppercase" as const, color: CREAM3, display: "block", marginTop: 4 }}>
              → NEXT LAYER
            </span>
          </div>
        </Html>

        {/* caption */}
        <Html position={[0, d(-1.38,-1.10), 0]} center>
          <div ref={t5Ref} style={{ opacity: 0, ...eqStyle }}>
            <span style={{ fontFamily: MONO, fontSize: d(11,10), letterSpacing: "0.14em",
              textTransform: "uppercase" as const, color: CREAM3 }}>
              INSIDE NEURON 2·07 — HIDDEN LAYER 2
            </span>
          </div>
        </Html>
      </group>

      {/* FG layer */}
      <group ref={fgGroupRef}>
        <points geometry={dustGeo}>
          <pointsMaterial ref={ptDustRef} color={CREAM_COL} size={d(0.018,0.015)}
            sizeAttenuation transparent opacity={0} toneMapped={false} />
        </points>
      </group>
    </group>
  );
}

// ── GELU curve SVG panel ───────────────────────────────────────────────────────

function GeluPanel({
  dotRef, isMobile,
}: {
  dotRef: React.RefObject<SVGCircleElement | null>;
  isMobile: boolean;
}) {
  const W = isMobile ? 68 : 90;
  const H = isMobile ? 38 : 46;

  const curvePoints = useMemo(() => Array.from({ length: 60 }, (_, i) => {
    const x  = (i/59)*4-2;
    const y  = gelu(x);
    const px = (i/59)*W;
    const py = H/2-y*H*0.35;
    return `${px.toFixed(1)},${Math.max(1,Math.min(H-1,py)).toFixed(1)}`;
  }).join(" "), [W, H]); // eslint-disable-line react-hooks/exhaustive-deps

  const axL: React.CSSProperties = {
    fontFamily: "var(--font-mono,monospace)", fontSize: isMobile?7:8,
    fill: "rgba(255,230,203,0.28)" as string, letterSpacing: "0.08em",
  };

  return (
    <div style={{
      background: "rgba(4,28,28,0.85)", backdropFilter: "blur(4px)",
      border: "1px solid rgba(255,230,203,0.12)", borderRadius: 4,
      padding: "5px 7px 4px", pointerEvents: "none",
    }}>
      <div style={{ fontFamily: "var(--font-mono,monospace)", fontSize: isMobile?11:12,
        letterSpacing:"0.14em", textTransform:"uppercase" as const,
        color:"rgba(255,230,203,0.48)", marginBottom:4, userSelect:"none" }}>GELU</div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}>
        <line x1="0" y1={H/2} x2={W} y2={H/2} stroke="rgba(255,230,203,0.08)" strokeWidth="0.5" />
        <line x1={W/2} y1="0" x2={W/2} y2={H} stroke="rgba(255,230,203,0.08)" strokeWidth="0.5" />
        <text x={W-2} y={H/2-3} textAnchor="end" style={axL}>x</text>
        <text x={W/2+3} y={9} style={axL}>f(x)</text>
        <polyline points={curvePoints} fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinejoin="round" />
        <circle ref={dotRef} cx={W/2} cy={H/2} r="2.8" fill="#34d399" opacity="0.9" />
      </svg>
    </div>
  );
}
