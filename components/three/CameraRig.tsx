"use client";

/**
 * CameraRig — drives the R3F camera each frame based on scene stage.
 * Reads getSceneState() directly in useFrame (never triggers React re-renders).
 *
 * Camera positions (world space, network group centred at origin during B–E):
 *   A  — rest: [0, 0, 8], lookAt origin
 *   B  — CatmullRomCurve3 from rest → approach neuron (z+1.2 in front of it)
 *   C  — hold at approach point, keep looking at neuron center
 *   D  — lerp back to rest
 *   E  — hold at rest (orbit added in next task)
 *   F  — hold at rest (network drifts right visually via NeuralNetwork group)
 */

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getSceneState } from "@/components/three/useSceneStore";
import { TARGET_NEURON_POS } from "@/lib/network";

// ── Camera anchor positions ───────────────────────────────────────────────────

const REST_POS   = new THREE.Vector3(0, 0, 8);
const REST_LOOK  = new THREE.Vector3(0, 0, 0);

// Target neuron world position (when network group is centred at origin)
const NEURON_POS = new THREE.Vector3(...TARGET_NEURON_POS);

// Camera approach point: 4 world-units in front of the neuron.
// At fov=45 and distance 4, viewport ≈ 3.3 × 5.9 wu — enough for the interior layout.
const APPROACH_POS = new THREE.Vector3(
  TARGET_NEURON_POS[0],
  TARGET_NEURON_POS[1],
  TARGET_NEURON_POS[2] + 4.0,
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function CameraRig() {
  const { camera } = useThree();

  // CatmullRomCurve3 for Stage B dive — computed once
  const diveCurve = useMemo(() => new THREE.CatmullRomCurve3([
    REST_POS.clone(),
    // Pull toward target neuron's x,y as we zoom in
    new THREE.Vector3(
      TARGET_NEURON_POS[0] * 0.25,
      TARGET_NEURON_POS[1] * 0.25,
      5.0,
    ),
    new THREE.Vector3(
      TARGET_NEURON_POS[0] * 0.6,
      TARGET_NEURON_POS[1] * 0.6,
      2.8,
    ),
    APPROACH_POS.clone(),
  ]), []);

  // Current smoothed camera state (refs → no React re-render)
  const camPos  = useRef(REST_POS.clone());
  const camLook = useRef(REST_LOOK.clone());

  useFrame((_, delta) => {
    const { stage, stageProgress: sp } = getSceneState();

    let desiredPos:  THREE.Vector3;
    let desiredLook: THREE.Vector3;

    switch (stage) {
      case "B": {
        // Sample curve directly — scrub:1 already smooths sp, so no extra lerp
        const t = easeInOut(sp);
        desiredPos  = diveCurve.getPoint(t);
        desiredLook = NEURON_POS;
        break;
      }

      case "C":
        desiredPos  = APPROACH_POS;
        desiredLook = NEURON_POS;
        break;

      case "D":
        // Pull back from approach to rest
        desiredPos  = new THREE.Vector3().lerpVectors(APPROACH_POS, REST_POS, easeOut(sp));
        desiredLook = new THREE.Vector3().lerpVectors(NEURON_POS, REST_LOOK, easeOut(sp));
        break;

      case "A":
      case "E":
      case "F":
      default:
        desiredPos  = REST_POS;
        desiredLook = REST_LOOK;
        break;
    }

    // For B/C/D: drive camera directly (scrub handles smoothness)
    // For A/E/F: gently settle to rest position
    const speed = (stage === "A" || stage === "E" || stage === "F")
      ? Math.min(1, 4 * delta)  // soft settle
      : 1;                       // immediate (scrub is smooth)

    camPos.current.lerp(desiredPos, speed);
    camLook.current.lerp(desiredLook, speed);

    camera.position.copy(camPos.current);
    camera.lookAt(camLook.current);
  });

  return null; // no JSX — pure camera side-effect
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function easeOut(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return 1 - (1 - c) ** 2;
}

function easeInOut(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 2 * c * c : 1 - (-2 * c + 2) ** 2 / 2;
}
