import { VoxelGrid, computeBlockLight, meshChunk, CHUNK } from "./blocks.js?v=20261026-worker";
import { generateTerrain } from "./terrain.js?v=20261026-worker";
import { paintTiles } from "./textures.js?v=20261026-worker";
import { WORLD, plazaBlock } from "./plaza.js?v=20261026-worker";

// Everything the island needs before three.js is involved: terrain, plaza,
// block light, chunk meshes and tile pixels. play.js runs this directly if the
// workers aren't available; normally worldgen-worker.js and mesh-worker.js
// build the same thing in pieces while three.js downloads.
export function generateWorld() {
  const t0 = performance.now();
  const { grid, features, foliage } = generateGrid();
  const t1 = performance.now();
  const chunks = mergeShares([meshShare(grid)]);
  const t2 = performance.now();
  return {
    grid: gridData(grid),
    features,
    foliage,
    chunks,
    tiles: paintTiles(),
    stats: { gen: Math.round(t1 - t0), mesh: Math.round(t2 - t1) },
  };
}

// Terrain, plaza and block light: everything meshing reads.
export function generateGrid() {
  const half = WORLD.size / 2;
  const grid = new VoxelGrid(-half, WORLD.yMin, -half, WORLD.size, WORLD.yMax - WORLD.yMin, WORLD.size);
  const { features, foliage } = generateTerrain(grid, { plaza: plazaBlock });
  computeBlockLight(grid);
  return { grid, features, foliage };
}

export function gridData(grid) {
  const { x0, y0, z0, sx, sy, sz, data, top, light } = grid;
  return { x0, y0, z0, sx, sy, sz, data, top, light };
}

// Meshes every parts-th chunk starting at part, so several workers can split
// the island. Returns [index, opaque, trans] for each chunk with any faces.
export function meshShare(grid, part = 0, parts = 1) {
  const out = [];
  let index = 0;
  for (let cx = grid.x0; cx < grid.x0 + grid.sx; cx += CHUNK) {
    for (let cz = grid.z0; cz < grid.z0 + grid.sz; cz += CHUNK, index += 1) {
      if (index % parts !== part) continue;
      const [opaque, trans] = meshChunk(grid, cx, cz);
      if (opaque || trans) out.push([index, opaque, trans]);
    }
  }
  return out;
}

// Puts the shares back in chunk order, as generateWorld would have.
export function mergeShares(shares) {
  return shares
    .flat()
    .sort((a, b) => a[0] - b[0])
    .map(([, opaque, trans]) => ({ opaque, trans }));
}

// The big buffers, so postMessage can move them instead of copying.
export function transferList(world) {
  const { grid, tiles, chunks } = world;
  return [grid.data.buffer, grid.top.buffer, grid.light.buffer, tiles.buffer, ...meshBuffers(chunks.flatMap((c) => [c.opaque, c.trans]))];
}

export function shareTransfers(share) {
  return meshBuffers(share.flatMap(([, opaque, trans]) => [opaque, trans]));
}

function meshBuffers(meshes) {
  const list = [];
  for (const buf of meshes) {
    if (!buf) continue;
    for (const key of ["pos", "nrm", "tuv", "tile", "col", "glow", "blk", "idx"]) list.push(buf[key].buffer);
  }
  return list;
}
