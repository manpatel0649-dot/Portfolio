"use client";

/**
 * CanvasRoot — single fixed full-screen <Canvas> behind the entire page.
 *
 * Responsibilities:
 *   - Mount WebGL context (alpha, transparent)
 *   - Cap DPR at 1.5 for performance
 *   - Pause rendering when the browser tab is hidden
 *   - Skip entirely when prefers-reduced-motion is set
 *   - Render: NeuralNetwork + CameraRig + NeuronInterior + Bloom post-processing
 */

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import NeuralNetwork from "./NeuralNetwork";
import Effects from "./Effects";
import CameraRig from "./CameraRig";
import NeuronInterior from "./stages/NeuronInterior";

export default function CanvasRoot() {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Safe to call window here — CanvasRoot is loaded ssr:false
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) return null;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 900;

  return (
    <div
      style={{
        position: "fixed",
        inset:    0,
        zIndex:   0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        frameloop={paused ? "never" : "always"}
        dpr={[1, 1.5]}
        gl={{
          alpha:           true,
          antialias:       true,
          powerPreference: "high-performance",
        }}
        // CameraRig overrides this position each frame; these are the defaults
        camera={{ position: [0, 0, 8], fov: 45, near: 0.05, far: 100 }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          {/* Stage A / B / D / E / F: the animated neural network */}
          <NeuralNetwork />

          {/* Stage C: inside-neuron interior view */}
          <NeuronInterior />

          {/* Drives camera each frame based on scene state — renders nothing */}
          <CameraRig />

          {/* Bloom post-processing */}
          <Effects isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  );
}
