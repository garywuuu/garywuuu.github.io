import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {generateWorld} from '../assets/js/world/worldgen.js';

// Pins the generated island byte for byte (blocks, meshes, lighting, tints,
// foliage, landmarks). Speedups to terrain or meshing must keep this hash;
// change it only when the world is meant to look different.
test('world generation output is unchanged', () => {
  const world = generateWorld();
  const hash = createHash('sha256');
  const add = (array) => hash.update(new Uint8Array(array.buffer, array.byteOffset, array.byteLength));
  add(world.grid.data);
  add(world.grid.top);
  add(world.tiles);
  let faces = 0;
  for (const chunk of world.chunks) {
    for (const buf of [chunk.opaque, chunk.trans]) {
      if (!buf) {
        hash.update('none');
        continue;
      }
      faces += buf.count / 4;
      for (const key of ['pos', 'nrm', 'tuv', 'tile', 'col', 'glow', 'blk', 'idx']) add(buf[key]);
    }
  }
  hash.update(JSON.stringify([world.features, world.foliage]));
  assert.equal(faces, 180201);
  assert.equal(hash.digest('hex'), '0f62ba2afd7f652fdc03783ca788e382fe659b3c5254e65e7961f7302d0161ee');
});
