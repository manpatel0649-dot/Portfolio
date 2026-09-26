"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { nodes, edges, nodeOutEdges, TARGET_NEURON_IDX, TARGET_NEURON_POS } from "@/lib/network";
import { getSceneState } from "@/components/three/useSceneStore";
import { setOrbitState } from "@/lib/orbitStore";
import StageELabels from "@/components/three/stages/StageELabels";

// Desktop: 60 during Stage E, 40 otherwise. Mobile: always 24.
const PULSE_COUNT   = 60; // max — buffer sized to this
const NORMAL_PULSES = 40; // standard desktop
const MOBILE_PULSES = 24;

const NODE_RADIUS = 0.14;

const CREAM    = new THREE.Color("#ffe6cb");
const EM_HDR   = new THREE.Color(0.8, 3.2, 1.4);
const EDGE_COL = new THREE.Color(160 / 255, 235 / 255, 205 / 255);

const _obj = new THREE.Object3D();
const _col = new THREE.Color();

interface Pulse { edgeIdx: number; progress: number; speed: number }

function makePulses(count: number): Pulse[] {
  return Array.from({ length: count }, () => ({
    edgeIdx:  Math.floor(Math.random() * edges.length),
    progress: Math.random(),
    speed:    (0.006 + Math.random() * 0.01) * 60,
  }));
}

function smoothstepFn(lo: number, hi: number, t: number): number {
  const x = Math.max(0, Math.min(1, (t - lo) / (hi - lo)));
  return x * x * (3 - 2 * x);
}

function computeNetworkAlpha(tp: number): number {
  if (tp <= 0.08) return 1.0;
  if (tp <= 0.27) return lerp(1.0, 0.22, smoothstepFn(0.08, 0.27, tp));
  if (tp <= 0.37) return lerp(0.22, 0.15, smoothstepFn(0.27, 0.37, tp));
  if (tp <= 0.50) return 0.15;
  if (tp <= 0.60) return lerp(0.15, 0.85, smoothstepFn(0.50, 0.60, tp));
  if (tp <= 0.95) return 0.85;
  return lerp(0.85, 0.38, smoothstepFn(0.95, 1.00, tp));
}

export default function NeuralNetwork() {
  const meshRef        = useRef<THREE.InstancedMesh>(null);
  const nodeMatRef     = useRef<THREE.MeshBasicMaterial>(null);
  const edgeMatRef     = useRef<THREE.LineBasicMaterial>(null);
  const pulseMatRef    = useRef<THREE.PointsMaterial>(null);
  const ringRef        = useRef<THREE.Mesh>(null);
  const ringMatRef     = useRef<THREE.MeshBasicMaterial>(null);
  const membraneMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const groupRef       = useRef<THREE.Group>(null);

  const { size } = useThree();
  const isMobile  = size.width < 900;

  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // Always allocate max pulses on desktop so we can ramp up during Stage E
  const pulsePoolSize = isMobile ? MOBILE_PULSES : PULSE_COUNT;
  const pulses = useMemo(() => makePulses(pulsePoolSize), [pulsePoolSize]);

  const nodeGlow = useMemo(() => new Float32Array(nodes.length), []);
  const pulsePos = useMemo(() => new Float32Array(PULSE_COUNT * 3), []);

  const pulseGeo = useMemo(() => {
    const geo  = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(pulsePos, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", attr);
    return geo;
  }, [pulsePos]);

  const edgeGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(edges.length * 6);
    edges.forEach((e, i) => {
      arr[i * 6 + 0] = e.fromPos[0]; arr[i * 6 + 1] = e.fromPos[1]; arr[i * 6 + 2] = e.fromPos[2];
      arr[i * 6 + 3] = e.toPos[0];  arr[i * 6 + 4] = e.toPos[1];  arr[i * 6 + 5] = e.toPos[2];
    });
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return geo;
  }, []);

  const mouse = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

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

  useEffect(() => {
    if (isMobile || reducedMotion) return;
    const onMove = (e: MouseEvent) => {
      const m = mouse.current;
      m.tx = e.clientX / window.innerWidth  - 0.5;
      m.ty = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [isMobile, reducedMotion]);

  useFrame((state, delta) => {
    const mesh  = meshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;

    const { stage, stageProgress: sp, totalProgress } = getSceneState();
    const t = state.clock.elapsedTime;

    const m = mouse.current;
    m.x += (m.tx - m.x) * 0.04;
    m.y += (m.ty - m.y) * 0.04;

    let targetX = 0, targetY = 0, scale = 1;
    let rotY = 0, rotX = 0;

    const idleRotY = t * 0.12 + m.x * 0.8;
    const idleRotX = -0.25 + m.y * 0.5 + Math.sin(t * 0.2) * 0.08;

    // During Stage E, use more pulses to fill the fully-visible network
    const activePulseCount = isMobile
      ? MOBILE_PULSES
      : (stage === "E" ? PULSE_COUNT : NORMAL_PULSES);

    switch (stage) {
      case "A":
        targetX = isMobile ? 0 : 2.3;
        targetY = isMobile ? 0.5 : 0.1;
        scale   = isMobile ? 0.65 : 1.15;
        rotY    = reducedMotion ? 0 : idleRotY;
        rotX    = reducedMotion ? 0 : idleRotX;
        break;

      case "B": {
        targetX = isMobile ? 0 : lerp(2.3, 0, easeOut(sp));
        targetY = isMobile ? 0.2 : lerp(0.1, 0, easeOut(sp));
        scale   = isMobile ? lerp(0.65, 0.55, sp) : lerp(1.15, 1.05, sp);
        const damp = 1 - easeOut(sp);
        rotY = idleRotY * damp;
        rotX = idleRotX * damp;

        nodeGlow[TARGET_NEURON_IDX] = Math.max(
          nodeGlow[TARGET_NEURON_IDX],
          easeOut(sp) * 0.85 + 0.15,
        );
        break;
      }

      case "C":
        targetX = 0; targetY = 0; scale = 1.0;
        rotY = 0; rotX = 0;
        break;

      case "D":
        targetX = 0; targetY = 0; scale = 1.0;
        rotY = 0; rotX = 0;
        break;

      case "E":
        // Group stays centred; CameraRig handles the orbit.
        // Idle rotation is paused so the camera movement provides all the motion.
        targetX = 0; targetY = 0; scale = 1.0;
        rotY = 0; rotX = 0;
        break;

      case "F":
      default: {
        targetX = isMobile ? 0 : lerp(0, 2.3, easeOut(sp));
        targetY = isMobile ? 0.5 : lerp(0, 0.1, sp);
        scale   = lerp(1.0, isMobile ? 0.55 : 0.9, sp);
        const slowRot = sp * 0.3;
        rotY = idleRotY * slowRot;
        rotX = idleRotX * slowRot;
        break;
      }
    }

    let alpha = computeNetworkAlpha(totalProgress);
    if (stage === "A" && isMobile) alpha = 0.55;

    const memMat = membraneMatRef.current;
    if (memMat) {
      const tp = totalProgress;
      let memOp = 0;
      if (tp >= 0.22 && tp < 0.37) memOp = smoothstepFn(0.22, 0.37, tp) * 0.22;
      else if (tp >= 0.37 && tp < 0.50) memOp = 0.22;
      else if (tp >= 0.50 && tp < 0.60) memOp = 0.22 * (1 - smoothstepFn(0.50, 0.60, tp));
      memMat.opacity = memOp;
    }

    {
      const ring    = ringRef.current;
      const ringMat = ringMatRef.current;
      if (ring && ringMat) {
        const tp = totalProgress;
        let ringOp = 0;
        if (tp >= 0.08 && tp < 0.35) {
          ringOp = easeOut((tp - 0.08) / 0.27) * 0.6;
        } else if (tp >= 0.35 && tp < 0.42) {
          const x = (tp - 0.35) / 0.07;
          ringOp = (1 - x * x * (3 - 2 * x)) * 0.6;
        }
        ring.visible = ringOp > 0.005;
        if (ring.visible) {
          const pulse  = 1 + Math.sin(t * 4) * 0.08;
          const scaleT = tp < 0.35 ? easeOut((tp - 0.08) / 0.27) : 1.0;
          ring.scale.setScalar((0.8 + scaleT * 0.6) * pulse);
          ringMat.opacity = ringOp;
        }
      }
    }

    const lt = Math.min(1, 6 * delta);
    group.position.x += (targetX - group.position.x) * lt;
    group.position.y += (targetY - group.position.y) * lt;
    group.rotation.y = rotY;
    group.rotation.x = rotX;
    group.scale.setScalar(scale);

    const nodeMat  = nodeMatRef.current;
    const edgeMat  = edgeMatRef.current;
    const pulseMat = pulseMatRef.current;
    if (nodeMat)  nodeMat.opacity  = alpha;
    if (edgeMat)  edgeMat.opacity  = 0.085 * alpha;
    if (pulseMat) pulseMat.opacity = 0.85 * alpha;

    if (alpha < 0.01 || reducedMotion) return;

    let livePulses = 0;
    for (let pi = 0; pi < activePulseCount; pi++) {
      const pulse = pulses[pi];
      pulse.progress += delta * pulse.speed;

      if (pulse.progress >= 1) {
        const destIdx = edges[pulse.edgeIdx].toIdx;
        nodeGlow[destIdx] = 1.0;

        const outs = nodeOutEdges.get(destIdx);
        if (outs && outs.length > 0 && Math.random() < 0.8) {
          pulse.edgeIdx = outs[Math.floor(Math.random() * outs.length)];
        } else {
          pulse.edgeIdx = Math.floor(Math.random() * edges.length);
        }
        pulse.progress = 0;
        pulse.speed    = (0.006 + Math.random() * 0.01) * 60;
      }

      const e = edges[pulse.edgeIdx];
      const p = pulse.progress;
      const b = pi * 3;
      pulsePos[b]     = e.fromPos[0] + (e.toPos[0] - e.fromPos[0]) * p;
      pulsePos[b + 1] = e.fromPos[1] + (e.toPos[1] - e.fromPos[1]) * p;
      pulsePos[b + 2] = e.fromPos[2] + (e.toPos[2] - e.fromPos[2]) * p;
      livePulses++;
    }
    // Park unused pulse slots far off-screen
    for (let pi = activePulseCount; pi < PULSE_COUNT; pi++) {
      pulsePos[pi * 3] = pulsePos[pi * 3 + 1] = pulsePos[pi * 3 + 2] = 1e6;
    }
    (pulseGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    // Publish active pulse count to HUDPanel (during Stage E only)
    if (stage === "E") setOrbitState({ activePulses: livePulses });

    let anyChanged = false;
    for (let ni = 0; ni < nodes.length; ni++) {
      const g = nodeGlow[ni];
      if (g > 0.001) {
        nodeGlow[ni] = g * Math.pow(0.96, 60 * delta);
        _col.copy(CREAM).lerp(EM_HDR, easeOut(nodeGlow[ni]));
        mesh.setColorAt(ni, _col);
        anyChanged = true;
      } else if (g > 0) {
        nodeGlow[ni] = 0;
        mesh.setColorAt(ni, CREAM);
        anyChanged = true;
      }
    }
    if (anyChanged && mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  const [tnX, tnY, tnZ] = TARGET_NEURON_POS;

  return (
    <group
      ref={groupRef}
      position={[isMobile ? 0 : 2.3, isMobile ? 0.5 : 0.1, 0]}
      rotation={[reducedMotion ? 0 : -0.25, 0, 0]}
    >
      {/* 60 node spheres — one instanced draw call */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
        <sphereGeometry args={[NODE_RADIUS, 10, 8]} />
        <meshBasicMaterial ref={nodeMatRef} vertexColors transparent toneMapped={false} />
      </instancedMesh>

      {/* ~250 edges */}
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial
          ref={edgeMatRef}
          color={EDGE_COL}
          transparent
          opacity={0.085}
          toneMapped={false}
        />
      </lineSegments>

      {/* Signal pulses */}
      <points geometry={pulseGeo}>
        <pointsMaterial
          ref={pulseMatRef}
          color={EM_HDR}
          size={isMobile ? 0.055 : 0.075}
          sizeAttenuation
          transparent
          opacity={0.85}
          toneMapped={false}
        />
      </points>

      {/* Target-neuron glow ring (Stage B only) */}
      <mesh ref={ringRef} position={[tnX, tnY, tnZ]} visible={false}>
        <torusGeometry args={[0.26, 0.018, 10, 36]} />
        <meshBasicMaterial
          ref={ringMatRef}
          color={EM_HDR}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>

      {/* Membrane: back-face sphere — soft emerald veil as camera enters neuron */}
      <mesh position={[tnX, tnY, tnZ]}>
        <sphereGeometry args={[0.22, 20, 14]} />
        <meshBasicMaterial
          ref={membraneMatRef}
          color={EM_HDR}
          transparent
          opacity={0}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Stage E: layer name labels floating above each layer */}
      <StageELabels isMobile={isMobile} />
    </group>
  );
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function easeOut(t: number): number {
  return 1 - (1 - Math.max(0, Math.min(1, t))) ** 2;
}
