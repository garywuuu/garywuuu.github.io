// Every module worldgen needs, listed here so they all download at once
// instead of one import level at a time.
import "./noise.js?v=20261015-world";
import "./textures.js?v=20261026-worker";
import "./blocks.js?v=20261026-worker";
import "./terrain.js?v=20261026-worker";
import "./plaza.js?v=20261026-worker";
import { generateWorld, transferList } from "./worldgen.js?v=20261026-worker";

// Started from play/index.html before three.js has loaded.
const world = generateWorld();
postMessage(world, transferList(world));
