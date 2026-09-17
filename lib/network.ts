/**
 * Pure TypeScript network topology — no React, loaded once and shared.
 * Replicates the exact node-position formula from reference/portfolio-mockup-v2.html.
 */

// ── Topology ────────────────────────────────────────────────────────────────

const LAYERS_DATA = [6, 10, 14, 14, 10, 6] as const;

// Reference used 120 px as layer spacing; WORLD_SCALE maps that to 3D world units.
// 1.4 world-unit layer spacing gives a good fill in a 45° FOV camera at z = 8.
const LAYER_SPACING_PX = 120;
const LAYER_SPACING_WU = 1.4;
const WORLD_SCALE = LAYER_SPACING_WU / LAYER_SPACING_PX; // ≈ 0.01167

// ── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────
// Same edge set every page load — deterministic, no hydration mismatch.
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NetworkNode {
  layerIdx:  number;
  nodeIdx:   number;   // index within the layer
  globalIdx: number;   // index in flat nodes[]
  position:  readonly [number, number, number]; // world units
}

export interface NetworkEdge {
  fromIdx: number; // global node index
  toIdx:   number;
  fromPos: readonly [number, number, number];
  toPos:   readonly [number, number, number];
}

// ── Build nodes ───────────────────────────────────────────────────────────────

function buildNodes(): NetworkNode[] {
  const result: NetworkNode[] = [];
  let globalIdx = 0;

  for (let li = 0; li < LAYERS_DATA.length; li++) {
    const n = LAYERS_DATA[li];
    const x = (li - (LAYERS_DATA.length - 1) / 2) * LAYER_SPACING_WU;

    for (let j = 0; j < n; j++) {
      // Exact formula from reference — li*0.6 staggers rotation per layer
      const ang = (j / n) * Math.PI * 2 + li * 0.6;
      // Non-uniform ring: nodes at midpoint of arc have larger radius → organic look
      const rad = 70 + Math.sin((j / n) * Math.PI) * 60 + n * 5;
      const y = Math.cos(ang) * rad * WORLD_SCALE;
      const z = Math.sin(ang) * rad * WORLD_SCALE;

      result.push({ layerIdx: li, nodeIdx: j, globalIdx, position: [x, y, z] });
      globalIdx++;
    }
  }
  return result;
}

// ── Build edges ───────────────────────────────────────────────────────────────

function buildEdges(
  allNodes: readonly NetworkNode[],
  rng: () => number,
): NetworkEdge[] {
  const offsets: number[] = [0];
  for (const count of LAYERS_DATA.slice(0, -1)) {
    offsets.push(offsets[offsets.length - 1] + count);
  }

  const result: NetworkEdge[] = [];
  for (let li = 0; li < LAYERS_DATA.length - 1; li++) {
    for (let fi = 0; fi < LAYERS_DATA[li]; fi++) {
      for (let ti = 0; ti < LAYERS_DATA[li + 1]; ti++) {
        if (rng() < 0.42) { // same 42% threshold as reference
          const from = allNodes[offsets[li] + fi];
          const to   = allNodes[offsets[li + 1] + ti];
          result.push({
            fromIdx: from.globalIdx,
            toIdx:   to.globalIdx,
            fromPos: from.position,
            toPos:   to.position,
          });
        }
      }
    }
  }
  return result;
}

// ── Exported data ─────────────────────────────────────────────────────────────

export const NETWORK_LAYERS: readonly number[] = LAYERS_DATA;

export const nodes: readonly NetworkNode[] = buildNodes();
export const edges: readonly NetworkEdge[] = buildEdges(nodes, mulberry32(42));

/** For pulse routing: globalNodeIdx → [edgeIdx, ...] leaving that node */
export const nodeOutEdges: ReadonlyMap<number, readonly number[]> = (() => {
  const map = new Map<number, number[]>();
  edges.forEach((e, ei) => {
    if (!map.has(e.fromIdx)) map.set(e.fromIdx, []);
    (map.get(e.fromIdx) as number[]).push(ei);
  });
  return map;
})();

// ── Network stats ─────────────────────────────────────────────────────────────
// "full" = every possible connection (EDGE_KEEP = 1.0)

const fullWeights = LAYERS_DATA.slice(0, -1).reduce(
  (s, c, i) => s + c * LAYERS_DATA[i + 1], 0,
);
const fullBiases = LAYERS_DATA.slice(1).reduce((s, c) => s + c, 0);
const fullParams = fullWeights + fullBiases;

// Verify the topology maths (runs once at module load, caught in dev/CI)
console.assert(fullWeights === 596, `weights ${fullWeights} ≠ 596`);
console.assert(fullBiases  === 54,  `biases  ${fullBiases}  ≠ 54`);
console.assert(fullParams  === 650, `params  ${fullParams}  ≠ 650`);

export const NETWORK_STATS = {
  layers:        LAYERS_DATA.length, // 6
  neurons:       nodes.length,       // 60
  fullWeights,                       // 596
  fullBiases,                        // 54
  fullParams,                        // 650
  renderedEdges: edges.length,       // ≈ 42% × 596 ≈ 250
} as const;
