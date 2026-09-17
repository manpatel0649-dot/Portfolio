"use client";

/**
 * NeuralNetwork — the always-animating 3D network in Stage A (hero idle).
 * Runs entirely in useFrame: no React state updates, no per-frame allocations.
 */

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { nodes, edges, nodeOutEdges } from "@/lib/network";

// ── Constants ────────────────────────────────────────────────────────────────

const PULSE_COUNT    = 40;   // max alive pulses (reference: 40)
const MOBILE_PULSES  = 20;   // fewer pulses on mobile
const NODE_RADIUS    = 0.10; // world-unit sphere radius

// Reference colours (exact from portfolio-mockup-v2.html)
// toneMapped:false + values > 1 → Bloom picks these up as HDR
const CREAM    = new THREE.Color("#ffe6cb");
const EM_HDR   = new THREE.Color(0.8, 3.2, 1.4);  // HDR emerald → strong bloom
const EDGE_COL = new THREE.Color(160 / 255, 235 / 255, 205 / 255); // rgba(160,235,205)

// ── Scratch objects — allocated ONCE, reused every frame ──────────────────────

const _obj   = new THREE.Object3D();
const _col   = new THREE.Color();

// ── Pulse state ───────────────────────────────────────────────────────────────

interface Pulse { edgeIdx: number; progress: number; speed: number }

function makePulses(count: number): Pulse[] {
  return Array.from({ length: count }, () => ({
    edgeIdx:  Math.floor(Math.random() * edges.length),
    progress: Math.random(), // stagger so they don't all fire at once
    speed:    (0.006 + Math.random() * 0.01) * 60, // ref v * 60fps → per-second
  }));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NeuralNetwork() {
  const meshRef    = useRef<THREE.InstancedMesh>(null);
  const nodeMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const edgeMatRef = useRef<THREE.LineBasicMaterial>(null);
  const pulseMatRef= useRef<THREE.PointsMaterial>(null);
  const groupRef   = useRef<THREE.Group>(null);

  const { size } = useThree();
  const isMobile = size.width < 900;

  // Detect reduced-motion once (safe inside a client component)
  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // Pulse data — mutable plain objects, never trigger React re-renders
  const activePulseCount = isMobile ? MOBILE_PULSES : PULSE_COUNT;
  const pulses = useMemo(() => makePulses(activePulseCount), [activePulseCount]);

  // Per-node glow strength 0→1, decayed each frame (matches `act` in reference)
  const nodeGlow = useMemo(() => new Float32Array(nodes.length), []);

  // Pre-allocated Float32Array for pulse GPU positions — never reallocated
  const pulsePos = useMemo(() => new Float32Array(PULSE_COUNT * 3), []);

  // Pulse BufferGeometry — created once, position attribute updated in useFrame
  const pulseGeo = useMemo(() => {
    const geo  = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(pulsePos, 3);
    attr.setUsage(THREE.DynamicDrawUsage); // hint to GPU: data changes every frame
    geo.setAttribute("position", attr);
    return geo;
  }, [pulsePos]);

  // Edge BufferGeometry — fully static, built once from network topology
  const edgeGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(edges.length * 6); // 2 verts × 3 components
    edges.forEach((e, i) => {
      arr[i * 6 + 0] = e.fromPos[0]; arr[i * 6 + 1] = e.fromPos[1]; arr[i * 6 + 2] = e.fromPos[2];
      arr[i * 6 + 3] = e.toPos[0];  arr[i * 6 + 4] = e.toPos[1];  arr[i * 6 + 5] = e.toPos[2];
    });
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return geo;
  }, []);

  // Mouse smoothed target (not React state — just a ref)
  const mouse         = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const scrollProgress = useRef(0);

  // ── Initialise node instance matrices + base colours ──────────────────────
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      _obj.position.set(n.position[0], n.position[1], n.position[2]);
      _obj.scale.setScalar(1);
      _obj.updateMatrix();
      mesh.setMatrixAt(i, _obj.matrix);
      mesh.setColorAt(i, CREAM);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  // ── Event listeners (passive, clean up on unmount) ────────────────────────

  useEffect(() => {
    if (isMobile || reducedMotion) return;
    const onMove = (e: MouseEvent) => {
      const m = mouse.current;
      // tx/ty in -0.5..+0.5 range (matching reference)
      m.tx = e.clientX / window.innerWidth  - 0.5;
      m.ty = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [isMobile, reducedMotion]);

  useEffect(() => {
    const onScroll = () => {
      // Normalised scroll progress through the hero (~1 × viewport height)
      scrollProgress.current = Math.min(1, window.scrollY / (window.innerHeight * 1.2));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Per-frame animation ───────────────────────────────────────────────────

  useFrame((state, delta) => {
    const mesh  = meshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;

    const t  = state.clock.elapsedTime;
    const sp = scrollProgress.current;

    // — Smooth mouse (expo-out, matching reference .04 coefficient)
    const m = mouse.current;
    m.x += (m.tx - m.x) * 0.04;
    m.y += (m.ty - m.y) * 0.04;

    // — Group position
    // Reference: cx = W*(0.72 + sp*0.12) at 1440px maps to ~2.3→3.6 world units right
    // Reference: cy = H*(0.46 + sp*0.06) ≈ centred, drifts slightly down
    const targetX = isMobile ? 0    : lerp(2.3, 3.7, sp);
    const targetY = isMobile ? 0.5  : lerp(0.1, -0.2, sp);
    group.position.x += (targetX - group.position.x) * 0.05;
    group.position.y += (targetY - group.position.y) * 0.05;

    // — Rotation (exact reference formula, converted to radians)
    // ry = t*0.12 + mx*0.8  (reference)
    // rx = -0.25 + my*0.5 + sin(t*0.2)*0.08  (reference, -0.25 = initial tilt back)
    if (!reducedMotion) {
      group.rotation.y = t * 0.12 + m.x * 0.8;
      group.rotation.x = -0.25 + m.y * 0.5 + Math.sin(t * 0.2) * 0.08;
    }

    // — Scale: reference (W/1440)*1.15 * (1 - sp*0.13) — adapt to fixed world units
    const baseScale = isMobile
      ? lerp(0.60, 0.50, sp)
      : lerp(1.15, 1.00, sp);
    group.scale.setScalar(baseScale);

    // — Global opacity (desktop fades to 38% after hero, matches reference alpha)
    const alpha = isMobile
      ? Math.max(0.3, 0.55 - sp * 0.25)
      : Math.max(0.38, 1 - sp * 0.62);

    const nodeMat  = nodeMatRef.current;
    const edgeMat  = edgeMatRef.current;
    const pulseMat = pulseMatRef.current;
    if (nodeMat)  nodeMat.opacity  = alpha;
    // Edges: 0.085 * alpha (reference uses d*d factor; approximate here)
    if (edgeMat)  edgeMat.opacity  = 0.085 * alpha;
    if (pulseMat) pulseMat.opacity = 0.85 * alpha;

    // — Advance pulses (skip if reduced-motion)
    if (!reducedMotion) {
      for (let pi = 0; pi < activePulseCount; pi++) {
        const pulse = pulses[pi];
        pulse.progress += delta * pulse.speed;

        if (pulse.progress >= 1) {
          // Arrived at destination node — light it up
          const destIdx = edges[pulse.edgeIdx].toIdx;
          nodeGlow[destIdx] = 1.0;

          // Route to an outgoing edge (matches reference: 80% continue, 20% spawn fresh)
          const outs = nodeOutEdges.get(destIdx);
          if (outs && outs.length > 0 && Math.random() < 0.8) {
            pulse.edgeIdx = outs[Math.floor(Math.random() * outs.length)];
          } else {
            // Output layer or 20% chance: restart from a random edge
            pulse.edgeIdx = Math.floor(Math.random() * edges.length);
          }
          pulse.progress = 0;
          pulse.speed    = (0.006 + Math.random() * 0.01) * 60;
        }

        // Interpolate pulse world position along edge
        const e = edges[pulse.edgeIdx];
        const p = pulse.progress;
        const b = pi * 3;
        pulsePos[b]     = e.fromPos[0] + (e.toPos[0] - e.fromPos[0]) * p;
        pulsePos[b + 1] = e.fromPos[1] + (e.toPos[1] - e.fromPos[1]) * p;
        pulsePos[b + 2] = e.fromPos[2] + (e.toPos[2] - e.fromPos[2]) * p;
      }

      // Push unused slots (mobile) off-screen so they're invisible
      for (let pi = activePulseCount; pi < PULSE_COUNT; pi++) {
        pulsePos[pi * 3] = pulsePos[pi * 3 + 1] = pulsePos[pi * 3 + 2] = 1e6;
      }

      // Mark the buffer dirty so the GPU uploads new positions
      (pulseGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }

    // — Update node glow colours
    // Reference: `act *= 0.96` per frame at 60 fps → frame-rate independent version
    let anyChanged = false;
    for (let ni = 0; ni < nodes.length; ni++) {
      const g = nodeGlow[ni];
      if (g > 0.001) {
        // Frame-rate-independent exponential decay matching reference 0.96^60fps
        nodeGlow[ni] = g * Math.pow(0.96, 60 * delta);
        // Lerp from cream → HDR emerald
        _col.copy(CREAM).lerp(EM_HDR, easeOut(nodeGlow[ni]));
        mesh.setColorAt(ni, _col);
        anyChanged = true;
      } else if (g > 0) {
        nodeGlow[ni] = 0;
        mesh.setColorAt(ni, CREAM);
        anyChanged = true;
      }
    }
    // Only mark instanceColor dirty when something actually changed (saves bandwidth)
    if (anyChanged && mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  // ── JSX ───────────────────────────────────────────────────────────────────

  // Initial group position matches reference desktop default (cx=72% of 1440px)
  return (
    <group
      ref={groupRef}
      position={[isMobile ? 0 : 2.3, isMobile ? 0.5 : 0.1, 0]}
      rotation={[reducedMotion ? 0 : -0.25, 0, 0]} // initial tilt from reference
    >
      {/* ── Nodes: one instanced draw call for all 60 spheres ── */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
        <sphereGeometry args={[NODE_RADIUS, 8, 6]} />
        <meshBasicMaterial
          ref={nodeMatRef}
          vertexColors
          transparent
          toneMapped={false} // bypass tone-mapping → Bloom can detect HDR emissives
        />
      </instancedMesh>

      {/* ── Edges: one LineSegments draw call for all ~250 connections ── */}
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial
          ref={edgeMatRef}
          color={EDGE_COL}
          transparent
          opacity={0.085}
          toneMapped={false}
        />
      </lineSegments>

      {/* ── Signal pulses: Points with pre-allocated dynamic buffer ── */}
      <points geometry={pulseGeo}>
        <pointsMaterial
          ref={pulseMatRef}
          color={EM_HDR}
          size={isMobile ? 0.045 : 0.06}
          sizeAttenuation
          transparent
          opacity={0.85}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

// ── Utilities (module-level, not hooks) ───────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}
