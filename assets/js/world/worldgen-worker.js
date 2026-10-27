// Every module worldgen needs, listed here so they all download at once
// instead of one import level at a time.
import "./noise.js?v=20261015-world";
import "./textures.js?v=20261026-worker";
import "./blocks.js?v=20261026-worker";
import "./terrain.js?v=20261026-worker";
import "./plaza.js?v=20261026-worker";
import { generateGrid, gridData, meshShare, shareTransfers } from "./worldgen.js?v=20261027-split";
import { paintTiles } from "./textures.js?v=20261026-worker";

// Started from play/index.html before three.js has loaded, along with a
// mesh-worker.js per port. Builds the grid, hands a copy to each mesh worker,
// meshes its own share of the chunks, and posts the rest of the world.
onmessage = ({ data: { ports } }) => {
  const t0 = performance.now();
  const { grid, features, foliage } = generateGrid();
  const t1 = performance.now();
  const parts = ports.length + 1;
  const data = gridData(grid);
  ports.forEach((port, i) => port.postMessage({ grid: data, part: i + 1, parts }));
  const share = meshShare(grid, 0, parts);
  const t2 = performance.now();
  const tiles = paintTiles();
  postMessage(
    { grid: data, features, foliage, tiles, share, stats: { gen: Math.round(t1 - t0), mesh: Math.round(t2 - t1), parts } },
    [data.data.buffer, data.top.buffer, data.light.buffer, tiles.buffer, ...shareTransfers(share)]
  );
};
