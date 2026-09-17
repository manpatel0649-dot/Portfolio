"use client";

/**
 * ScrollProvider — wraps the app in Lenis smooth scroll + GSAP ScrollTrigger.
 *
 * Responsibilities:
 *   1. ReactLenis root with autoRaf:false (GSAP ticker drives Lenis)
 *   2. Single RAF loop: gsap.ticker → lenis.raf → lenis.scroll event → ScrollTrigger.update
 *   3. Pin the hero for 400vh (desktop) / 220vh (mobile)
 *   4. Scrub progress 0→1 → setSceneState (stage + stageProgress)
 *   5. GSAP timeline: hero content fades out during Stage B
 *   6. ?progress=N URL param: jumps scroll to that position for screenshots
 *   7. ?debug URL param: shows progress/stage overlay
 */

import { useEffect, useRef, useState } from "react";
import { ReactLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { setSceneState, type Stage } from "@/components/three/useSceneStore";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// ── Stage boundary constants (totalProgress) ────────────────────────────────
const BOUNDS = {
  A: [0,    0.08],
  B: [0.08, 0.35],
  C: [0.35, 0.50],
  D: [0.50, 0.60],
  E: [0.60, 0.95],
  F: [0.95, 1.00],
} as const;

function classifyProgress(p: number): { stage: Stage; stageProgress: number } {
  for (const [s, [lo, hi]] of Object.entries(BOUNDS) as [Stage, [number, number]][]) {
    if (p <= hi) {
      return { stage: s, stageProgress: (p - lo) / (hi - lo) };
    }
  }
  return { stage: "F", stageProgress: 1 };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ScrollProvider({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lenisRef  = useRef<any>(null);
  const stRef     = useRef<ScrollTrigger | null>(null);
  const fadeTlRef = useRef<gsap.core.Timeline | null>(null);

  // ── 1. Lenis + GSAP single RAF loop ──────────────────────────────────────
  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    // Bind lenis scroll events to ScrollTrigger after Lenis is initialised
    const tid = window.setTimeout(() => {
      lenisRef.current?.lenis?.on("scroll", ScrollTrigger.update);
    }, 0);

    return () => {
      clearTimeout(tid);
      gsap.ticker.remove(update);
      lenisRef.current?.lenis?.off("scroll", ScrollTrigger.update);
    };
  }, []);

  // ── 2. ScrollTrigger pin + scrub ─────────────────────────────────────────
  useGSAP(() => {
    const isMobile = window.innerWidth < 900;
    const pinVH    = isMobile ? 220 : 400;

    // Pin the hero section for pinVH of scroll distance
    const st = ScrollTrigger.create({
      trigger:           "#hero",
      start:             "top top",
      end:               `+=${pinVH}vh`,
      pin:               true,
      scrub:             1,
      anticipatePin:     1,
      invalidateOnRefresh: true,
      onUpdate(self) {
        const p = Math.max(0, Math.min(1, self.progress));
        const { stage, stageProgress } = classifyProgress(p);
        setSceneState({ stage, stageProgress, totalProgress: p });
      },
    });
    stRef.current = st;

    // Hero content & proof strip fade out during Stage B (totalProgress 0.08 → 0.30)
    // Expressed as fractions of the total pin timeline (0 → 1)
    const fadeTl = gsap.timeline({
      scrollTrigger: {
        trigger:           "#hero",
        start:             "top top",
        end:               `+=${pinVH}vh`,
        scrub:             1,
        invalidateOnRefresh: true,
      },
    });
    // Tweens are positioned as fractions of a 1.0-second total timeline.
    // ScrollTrigger maps 0→1 scroll progress to 0→1s playhead → correct timing.
    fadeTl
      .to("#hero-content", {
        y:         -56,
        autoAlpha: 0,
        ease:      "power2.inOut",
        duration:  0.22,  // 0.08→0.30 of total 1.0s = scroll 8%→30%
      }, 0.08)
      .to("#hero-proof", {
        y:         -32,
        autoAlpha: 0,
        ease:      "power2.inOut",
        duration:  0.15,  // 0.10→0.25 of total 1.0s
      }, 0.10)
      .to({}, {}, 1.0);   // pad total duration to exactly 1.0s
    fadeTlRef.current = fadeTl;

    // ── ?progress param: set scene state + CSS directly for screenshots ───
    // Bypasses scroll so Playwright can capture any stage at precise progress.
    const params  = new URLSearchParams(window.location.search);
    const pParam  = params.get("progress");
    if (pParam !== null) {
      const p = Math.max(0, Math.min(1, parseFloat(pParam)));
      window.setTimeout(() => {
        // 3D: update scene store (NeuralNetwork & CameraRig read this in useFrame)
        const { stage, stageProgress } = classifyProgress(p);
        setSceneState({ stage, stageProgress, totalProgress: p });

        // HTML: directly set hero content opacity — bypass scrub lag
        if (p >= 0.08) {
          const f = Math.max(0, Math.min(1, (p - 0.08) / 0.22));
          gsap.set("#hero-content", { autoAlpha: 1 - f, y: -56 * f });
        }
        if (p >= 0.10) {
          const f2 = Math.max(0, Math.min(1, (p - 0.10) / 0.15));
          gsap.set("#hero-proof",   { autoAlpha: 1 - f2, y: -32 * f2 });
        }
      }, 150);
    }
  });

  // ── ?debug overlay — client-only to avoid hydration mismatch ─────────────
  const [showDebug, setShowDebug] = useState(false);
  useEffect(() => {
    setShowDebug(new URLSearchParams(window.location.search).has("debug"));
  }, []);

  return (
    <ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>
      {children}
      {showDebug && <DebugOverlay />}
    </ReactLenis>
  );
}

// ── Debug overlay (only mounted when ?debug is in URL) ────────────────────────

import { useSyncExternalStore } from "react";
import { subscribeSceneState, getSceneState } from "@/components/three/useSceneStore";

function DebugOverlay() {
  const state = useSyncExternalStore(
    subscribeSceneState,
    getSceneState,
    getSceneState,
  );
  return (
    <div
      style={{
        position:   "fixed",
        top:        8,
        right:      8,
        zIndex:     9999,
        fontFamily: "monospace",
        fontSize:   11,
        color:      "#34d399",
        background: "rgba(4,28,28,0.92)",
        padding:    "8px 12px",
        border:     "1px solid #34d399",
        borderRadius: 4,
        lineHeight: 1.8,
        pointerEvents: "none",
      }}
    >
      <div>stage: <b>{state.stage}</b></div>
      <div>stageProgress: {state.stageProgress.toFixed(3)}</div>
      <div>totalProgress: {state.totalProgress.toFixed(3)}</div>
    </div>
  );
}
