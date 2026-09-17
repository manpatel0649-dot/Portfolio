/**
 * Post-processing effects wrapper.
 * Bloom is tuned so:
 *   - Cream nodes (luminance ≈ 0.9)  → very subtle glow
 *   - HDR emerald pulses (luminance ≈ 5+) → strong bloom halo
 *   - Edges (dim, 8.5 % opacity)     → no bloom
 */

import { EffectComposer, Bloom } from "@react-three/postprocessing";

interface EffectsProps {
  isMobile: boolean;
}

export default function Effects({ isMobile }: EffectsProps) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.65}  // cream ≈ 0.90 luminance → just above threshold
        luminanceSmoothing={0.85}
        intensity={isMobile ? 0.65 : 1.1}
        mipmapBlur               // softer, more natural glow (recommended for v9)
      />
    </EffectComposer>
  );
}
