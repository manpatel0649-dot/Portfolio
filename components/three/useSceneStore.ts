/**
 * Scene state for the 3D scroll story.
 * Only Stage A (idle network) is implemented now.
 *
 * Future stages — plug-in guide for subsequent tasks:
 *   B  (progress 0.08–0.35): GSAP ScrollTrigger pin drives setSceneState({ stage:"B", stageProgress:p })
 *      → camera dives toward a chosen neuron; NeuralNetwork fades; NeuronInterior mounts
 *   C  (0.35–0.50): Inside neuron — input signals, Σ node, activation curve, output arrow
 *   D  (0.50–0.60): Camera pulls back; NeuronInterior unmounts; full network reappears centred
 *   E  (0.60–0.95): Camera orbits (front→side→top→back); HUDPanel shows live topology values
 *   F  (0.95–1.00): Unpin; network drifts right, scales to ~40 % opacity (Stage A resumes)
 *
 * Implementation pattern for each new stage:
 *   1. Add any extra SceneState fields (e.g. targetNeuronIdx for Stage B)
 *   2. In SceneManager.tsx, watch GSAP ScrollTrigger progress and call setSceneState()
 *   3. In CanvasRoot / NeuralNetwork, branch on `getSceneState().stage`
 */

export type Stage = "A" | "B" | "C" | "D" | "E" | "F";

export interface SceneState {
  stage:         Stage;
  stageProgress: number;                        // 0–1 within the current stage
  cameraTarget:  readonly [number, number, number];
}

// ── Module-level store with a minimal pub/sub (no external dependency) ────────

let _state: SceneState = {
  stage:         "A",
  stageProgress: 0,
  cameraTarget:  [0, 0, 0],
};

const _listeners = new Set<() => void>();

export function getSceneState(): SceneState {
  return _state;
}

export function setSceneState(patch: Partial<SceneState>): void {
  _state = { ..._state, ...patch };
  _listeners.forEach((fn) => fn());
}

/** Returns an unsubscribe function — compatible with React.useSyncExternalStore */
export function subscribeSceneState(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// ── Optional React hook ───────────────────────────────────────────────────────

import { useSyncExternalStore } from "react";

export function useStage(): Stage {
  return useSyncExternalStore(
    subscribeSceneState,
    () => _state.stage,
    () => "A" as Stage, // server snapshot
  );
}
