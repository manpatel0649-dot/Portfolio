"use client";

/**
 * StageELabels — layer name + neuron count labels floating above each layer.
 * Rendered as drei Html overlays; mounted inside NeuralNetwork's group so they
 * track the group's world position.
 *
 * Desktop: "INPUT · 6", "HIDDEN 1 · 10" etc. with a thin leader line below.
 * Mobile:  just the count ("6", "10" …) — less visual clutter on small screens.
 *
 * Opacity is driven by useFrame (not React state) to avoid per-frame re-renders.
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { getSceneState } from "@/components/three/useSceneStore";

// Layer X positions match lib/network.ts: (li - 2.5) * 1.4
const LAYER_X = [-3.5, -2.1, -0.7, 0.7, 2.1, 3.5];
const LABEL_Y = 2.6; // world-units above layer centre

const LAYERS = [
  { name: "INPUT",    count: 6  },
  { name: "HIDDEN 1", count: 10 },
  { name: "HIDDEN 2", count: 14 },
  { name: "HIDDEN 3", count: 14 },
  { name: "HIDDEN 4", count: 10 },
  { name: "OUTPUT",   count: 6  },
];

interface Props { isMobile: boolean; }

export default function StageELabels({ isMobile }: Props) {
  const opRef  = useRef(0);
  const divs   = useRef<(HTMLDivElement | null)[]>(Array(LAYERS.length).fill(null));

  useFrame((_, delta) => {
    const { stage } = getSceneState();
    const target = stage === "E" ? 1 : 0;
    opRef.current += (target - opRef.current) * Math.min(1, 6 * delta);
    const op = opRef.current;
    divs.current.forEach(el => { if (el) el.style.opacity = String(op); });
  });

  return (
    <>
      {LAYERS.map((layer, i) => (
        <Html
          key={i}
          position={[LAYER_X[i], LABEL_Y, 0]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div
            ref={el => { divs.current[i] = el; }}
            style={{
              opacity:       0,
              textAlign:     "center",
              whiteSpace:    "nowrap",
              fontFamily:    "var(--font-mono, monospace)",
              letterSpacing: ".10em",
              textTransform: "uppercase" as const,
              userSelect:    "none",
            }}
          >
            {isMobile ? (
              /* Mobile: count only */
              <span style={{
                fontSize:  "11px",
                color:     "#34d399",
                fontWeight: 500,
              }}>
                {layer.count}
              </span>
            ) : (
              /* Desktop: full name + count + leader line */
              <>
                <div style={{
                  fontSize:  "9px",
                  color:     "rgba(255,230,203,.55)",
                  lineHeight: 1.3,
                }}>
                  {layer.name}
                </div>
                <div style={{
                  fontSize:  "11px",
                  color:     "#34d399",
                  lineHeight: 1.3,
                }}>
                  · {layer.count}
                </div>
                {/* Leader line drops toward the network */}
                <div style={{
                  width:      "1px",
                  height:     "18px",
                  background: "rgba(52,211,153,.35)",
                  margin:     "4px auto 0",
                }} />
              </>
            )}
          </div>
        </Html>
      ))}
    </>
  );
}
