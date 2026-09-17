"use client";

/**
 * CanvasRoot — the single fixed full-screen <Canvas> behind the entire page.
 *
 * Responsibilities:
 *   - Mount WebGL context (alpha, transparent — CSS glows / grain show through)
 *   - Cap DPR at 1.5 for performance
 *   - Pause rendering when the browser tab is hidden
 *   - Skip entirely when prefers-reduced-motion is set (CSS glows act as fallback)
 *   - Render NeuralNetwork (Stage A) + Bloom post-processing
 *
 * Future stages (B–F) will be added here as <SceneManager> reads GSAP ScrollTrigger
 * progress and calls setSceneState(), switching which components are mounted.
 */

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import NeuralNetwork from "./NeuralNetwork";
import Effects from "./Effects";

export default function CanvasRoot() {
  // Pause when tab is hidden — saves GPU + battery
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Skip canvas for prefers-reduced-motion — CSS glows in BackgroundLayers cover it
  // Safe to call window.matchMedia here because CanvasRoot is loaded ssr:false
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) return null;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 900;

  return (
    // Fixed, full-screen, below all content (z-index 0), non-interactive
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        frameloop={paused ? "never" : "always"} // stop render loop when tab hidden
        dpr={[1, 1.5]}                           // cap at 1.5× — perf guard for retina
        gl={{
          alpha: true,             // transparent background so CSS glows show through
          antialias: true,
          powerPreference: "high-performance",
        }}
        // Camera matches the reference projection feel:
        // fov 45°, z=8 → visible height ≈ 6.6 world units at origin
        camera={{ position: [0, 0, 8], fov: 45, near: 0.1, far: 100 }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          {/* Stage A: idle network — always visible */}
          <NeuralNetwork />
          {/* Bloom post-processing */}
          <Effects isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  );
}
