/**
 * Orbit telemetry for Stage E — updated by CameraRig + NeuralNetwork each frame.
 * Pattern mirrors useSceneStore: subscribe/get/set, no React dependency.
 * HUDPanel reads via subscribeOrbitState + DOM refs to avoid per-frame React re-renders.
 */

export interface OrbitState {
  yawDeg:       number;
  pitchDeg:     number;
  view:         "FRONT" | "SIDE" | "TOP" | "BACK";
  activePulses: number;
}

const DEFAULT: OrbitState = { yawDeg: 0, pitchDeg: 0, view: "FRONT", activePulses: 0 };
let _state: OrbitState = { ...DEFAULT };
const _listeners = new Set<() => void>();

export function getOrbitState(): OrbitState { return _state; }

export function subscribeOrbitState(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function setOrbitState(partial: Partial<OrbitState>): void {
  _state = { ..._state, ...partial };
  _listeners.forEach(fn => fn());
}
