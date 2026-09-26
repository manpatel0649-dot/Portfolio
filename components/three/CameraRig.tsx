"use client";

/**
 * CameraRig — drives the R3F camera each frame based on scene stage.
 *
 * Stage A/F : rest at [0,0,8] looking at origin (soft settle)
 * Stage B   : CatmullRomCurve3 dive toward target neuron
 * Stage C   : hold at approach point
 * Stage D   : lerp back from approach to rest
 * Stage E   : spherical orbit — keyframes scrubbed by stageProgress
 *             Desktop: FRONT → SIDE → TOP → BACK → FRONT (yaw 0→360°)
 *             Mobile:  FRONT → SIDE → TOP → FRONT
 *             Mouse parallax ±0.4/0.3wu offset on desktop
 */

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getSceneState } from "@/components/three/useSceneStore";
import { TARGET_NEURON_POS } from "@/lib/network";
import { setOrbitState } from "@/lib/orbitStore";

// ── Camera anchor constants ───────────────────────────────────────────────────

const REST_POS    = new THREE.Vector3(0, 0, 8);
const REST_LOOK   = new THREE.Vector3(0, 0, 0);
const NEURON_POS  = new THREE.Vector3(...TARGET_NEURON_POS);
const APPROACH_POS = new THREE.Vector3(
  TARGET_NEURON_POS[0],
  TARGET_NEURON_POS[1],
  TARGET_NEURON_POS[2] + 4.0,
);

const ORBIT_RADIUS = 8;

// ── Stage E orbit keyframes ───────────────────────────────────────────────────
// [stageProgress, yawDeg, pitchDeg] — smoothstep interpolated between frames

const KF_DESKTOP = [
  { sp: 0.000, yaw: 0,   pitch: 0  }, // FRONT
  { sp: 0.257, yaw: 90,  pitch: 0  }, // SIDE (right)
  { sp: 0.514, yaw: 135, pitch: 75 }, // TOP
  { sp: 0.771, yaw: 180, pitch: 0  }, // BACK
  { sp: 1.000, yaw: 360, pitch: 0  }, // FRONT (full circle)
] as const;

// Mobile skips BACK; orbit goes FRONT → SIDE → TOP → FRONT
const KF_MOBILE = [
  { sp: 0.000, yaw: 0,  pitch: 0  },
  { sp: 0.333, yaw: 90, pitch: 0  },
  { sp: 0.667, yaw: 90, pitch: 70 },
  { sp: 1.000, yaw: 0,  pitch: 0  },
] as const;

// View label switches at midpoints between keyframes
const VIEW_DESKTOP: { max: number; view: "FRONT" | "SIDE" | "TOP" | "BACK" }[] = [
  { max: 0.128, view: "FRONT" },
  { max: 0.385, view: "SIDE"  },
  { max: 0.643, view: "TOP"   },
  { max: 0.886, view: "BACK"  },
  { max: 1.000, view: "FRONT" },
];
const VIEW_MOBILE: { max: number; view: "FRONT" | "SIDE" | "TOP" | "BACK" }[] = [
  { max: 0.167, view: "FRONT" },
  { max: 0.500, view: "SIDE"  },
  { max: 0.834, view: "TOP"   },
  { max: 1.000, view: "FRONT" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

type KF = { sp: number; yaw: number; pitch: number };

function interpKF(kfs: readonly KF[], sp: number): { yaw: number; pitch: number } {
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i], b = kfs[i + 1];
    if (sp >= a.sp && sp <= b.sp) {
      const t = (sp - a.sp) / (b.sp - a.sp);
      const e = t * t * (3 - 2 * t); // smoothstep
      return { yaw: a.yaw + (b.yaw - a.yaw) * e, pitch: a.pitch + (b.pitch - a.pitch) * e };
    }
  }
  const last = kfs[kfs.length - 1];
  return { yaw: last.yaw, pitch: last.pitch };
}

function getView(
  views: { max: number; view: "FRONT" | "SIDE" | "TOP" | "BACK" }[],
  sp: number,
): "FRONT" | "SIDE" | "TOP" | "BACK" {
  for (const { max, view } of views) if (sp <= max) return view;
  return "FRONT";
}

// yaw = clockwise from +Z; pitch = elevation above XZ plane
function spherical(yawDeg: number, pitchDeg: number, r: number): THREE.Vector3 {
  const y = (yawDeg   * Math.PI) / 180;
  const p = (pitchDeg * Math.PI) / 180;
  return new THREE.Vector3(
    r * Math.cos(p) * Math.sin(y),
    r * Math.sin(p),
    r * Math.cos(p) * Math.cos(y),
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CameraRig() {
  const { camera, size } = useThree();
  const isMobile = size.width < 900;

  const diveCurve = useMemo(() => new THREE.CatmullRomCurve3([
    REST_POS.clone(),
    new THREE.Vector3(TARGET_NEURON_POS[0] * 0.25, TARGET_NEURON_POS[1] * 0.25, 5.0),
    new THREE.Vector3(TARGET_NEURON_POS[0] * 0.6,  TARGET_NEURON_POS[1] * 0.6,  2.8),
    APPROACH_POS.clone(),
  ]), []);

  const camPos  = useRef(REST_POS.clone());
  const camLook = useRef(REST_LOOK.clone());
  const mouse   = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isMobile) return;
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX / window.innerWidth  - 0.5;
      mouse.current.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [isMobile]);

  useFrame((_, delta) => {
    const { stage, stageProgress: sp } = getSceneState();

    let desiredPos:  THREE.Vector3 = REST_POS;
    let desiredLook: THREE.Vector3 = REST_LOOK;
    let scrubbed = false;

    switch (stage) {
      case "B":
        desiredPos  = diveCurve.getPoint(easeOutCubic(sp));
        desiredLook = NEURON_POS;
        scrubbed    = true;
        break;

      case "C":
        desiredPos  = APPROACH_POS;
        desiredLook = NEURON_POS;
        scrubbed    = true;
        break;

      case "D":
        desiredPos  = new THREE.Vector3().lerpVectors(APPROACH_POS, REST_POS, easeOut(sp));
        desiredLook = new THREE.Vector3().lerpVectors(NEURON_POS, REST_LOOK, easeOut(sp));
        scrubbed    = true;
        break;

      case "E": {
        const kfs   = isMobile ? KF_MOBILE   : KF_DESKTOP;
        const views = isMobile ? VIEW_MOBILE  : VIEW_DESKTOP;
        const { yaw, pitch } = interpKF(kfs, sp);
        desiredPos  = spherical(yaw, pitch, ORBIT_RADIUS);
        desiredLook = REST_LOOK;
        // Subtle mouse parallax on desktop — shifts camera slightly, not look-at target
        if (!isMobile) {
          desiredPos.x += mouse.current.x  * 0.4;
          desiredPos.y -= mouse.current.y  * 0.3;
        }
        scrubbed = true;
        const view = getView(views, sp);
        // Publish to HUDPanel (no React re-render — panel reads via DOM refs)
        setOrbitState({ yawDeg: ((yaw % 360) + 360) % 360, pitchDeg: pitch, view });
        break;
      }

      // A, F: soft settle to rest (no orbit state updates needed)
      default:
        break;
    }

    const speed = scrubbed ? 1 : Math.min(1, 4 * delta);
    camPos.current.lerp(desiredPos, speed);
    camLook.current.lerp(desiredLook, speed);
    camera.position.copy(camPos.current);
    camera.lookAt(camLook.current);
  });

  return null;
}

// ── Easing ────────────────────────────────────────────────────────────────────

function easeOut(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return 1 - (1 - c) ** 2;
}

function easeOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return 1 - (1 - c) ** 3;
}
