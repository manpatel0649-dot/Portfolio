"use client";

/**
 * Thin client wrapper that lazy-loads CanvasRoot with ssr:false.
 * This keeps the WebGL context out of the server bundle entirely.
 * Imported by BackgroundLayers (server component) — Next.js handles the boundary.
 */

import dynamic from "next/dynamic";

const CanvasRoot = dynamic(() => import("./CanvasRoot"), {
  ssr: false,
  loading: () => null, // CSS glows in BackgroundLayers act as static fallback
});

export default function DynamicCanvas() {
  return <CanvasRoot />;
}
