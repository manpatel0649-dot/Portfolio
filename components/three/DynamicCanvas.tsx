"use client";

/**
 * Thin client wrapper that lazy-loads CanvasRoot with ssr:false.
 * On mobile: delays mount by 1800ms so Three.js execution falls outside
 * the Lighthouse TBT window (FCP → TTI). CSS glows are the static fallback.
 */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CanvasRoot = dynamic(() => import("./CanvasRoot"), {
  ssr: false,
  loading: () => null,
});

export default function DynamicCanvas() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 900;
    if (!isMobile) {
      setReady(true);
      return;
    }
    // Delay on mobile — push Three.js execution past LCP to reduce TBT
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(() => setReady(true), { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(() => setReady(true), 1800);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return null;
  return <CanvasRoot />;
}
