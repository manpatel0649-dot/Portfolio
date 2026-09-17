/**
 * Scene state for the 3D scroll story.
 *
 * Stage mapping:
 *   A  (totalProgress 0–0.08)    — idle network, hero text visible
 *   B  (totalProgress 0.08–0.35) — camera dives toward target neuron
 *   C  (totalProgress 0.35–0.50) — inside the neuron, interior view
 *   D  (totalProgress 0.50–0.60) — camera pulls back, network reappears
 *   E  (totalProgress 0.60–0.95) — orbit + HUD (next task, holds centered now)
 *   F  (totalProgress 0.95–1.00) — unpin, network drifts right and dims
 */

export type Stage = "A" | "B" | "C" | "D" | "E" | "F";

export interface SceneState {
  stage:         Stage;
  stageProgress: number;  // 0–1 within the current stage
  totalProgress: number;  // 0–1 across the full hero pin
  cameraTarget:  readonly [number, number, number];
}

// ── Module-level store (no external deps) ─────────────────────────────────────

let _state: SceneState = {
  stage:         "A",
  stageProgress: 0,
  totalProgress: 0,
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

/** Returns an unsubscribe fn — compatible with React.useSyncExternalStore */
export function subscribeSceneState(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// ── Optional React hooks ──────────────────────────────────────────────────────

import { useSyncExternalStore } from "react";

export function useStage(): Stage {
  return useSyncExternalStore(
    subscribeSceneState,
    () => _state.stage,
    () => "A" as Stage,
  );
}

export function useSceneStateReactive(): SceneState {
  return useSyncExternalStore(
    subscribeSceneState,
    () => _state,
    () => _state,
  );
}
