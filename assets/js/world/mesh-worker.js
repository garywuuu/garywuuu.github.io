// Flat imports, as in worldgen-worker.js.
import "./noise.js?v=20261015-world";
import "./textures.js?v=20261026-worker";
import "./blocks.js?v=20261026-worker";
import "./terrain.js?v=20261026-worker";
import "./plaza.js?v=20261026-worker";
import { meshShare, shareTransfers } from "./worldgen.js?v=20261027-split";

// Meshes one share of the island's chunks from a grid sent by
// worldgen-worker.js over the port play/index.html hands over.
onmessage = ({ data: { port } }) => {
  port.onmessage = ({ data: { grid, part, parts } }) => {
    const share = meshShare(grid, part, parts);
    postMessage(share, shareTransfers(share));
    close();
  };
};
