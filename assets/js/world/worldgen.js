import { VoxelGrid, computeBlockLight, meshChunk, CHUNK } from "./blocks.js?v=20261026-worker";
import { generateTerrain } from "./terrain.js?v=20261026-worker";
import { paintTiles } from "./textures.js?v=20261026-worker";
import { WORLD, plazaBlock } from "./plaza.js?v=20261026-worker";

// Everything the island needs before three.js is involved: terrain, plaza,
// block light, chunk meshes and tile pixels. worldgen-worker.js runs this off
// the main thread while three.js downloads; play.js runs it directly if the
// worker isn't available.
export function generateWorld() {
  const t0 = performance.now();
  const half = WORLD.size / 2;
  const grid = new VoxelGrid(-half, WORLD.yMin, -half, WORLD.size, WORLD.yMax - WORLD.yMin, WORLD.size);
  const { features, foliage } = generateTerrain(grid, { plaza: plazaBlock });
  const t1 = performance.now();

  computeBlockLight(grid);
  const chunks = [];
  for (let cx = grid.x0; cx < grid.x0 + grid.sx; cx += CHUNK) {
    for (let cz = grid.z0; cz < grid.z0 + grid.sz; cz += CHUNK) {
      const [opaque, trans] = meshChunk(grid, cx, cz);
      if (opaque || trans) chunks.push({ opaque, trans });
    }
  }
  const t2 = performance.now();

  const { x0, y0, z0, sx, sy, sz, data, top } = grid;
  return {
    grid: { x0, y0, z0, sx, sy, sz, data, top },
    features,
    foliage,
    chunks,
    tiles: paintTiles(),
    stats: { gen: Math.round(t1 - t0), mesh: Math.round(t2 - t1) },
  };
}

// The big buffers, so postMessage can move them instead of copying.
export function transferList(world) {
  const list = [world.grid.data.buffer, world.grid.top.buffer, world.tiles.buffer];
  for (const chunk of world.chunks) {
    for (const buf of [chunk.opaque, chunk.trans]) {
      if (!buf) continue;
      for (const key of ["pos", "nrm", "tuv", "tile", "col", "glow", "blk", "idx"]) list.push(buf[key].buffer);
    }
  }
  return list;
}
