import { mulberry32, hashString } from "./noise.js?v=20261015-world";

// Procedural 16px block tiles, painted into the layers of one texture array
// (built in voxels.js). Every face samples its own layer, so tiles repeat
// cleanly with no bleed. No three.js here so the worker can paint them.

const S = 16;

function rgb(hex) {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

function clamp255(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function shade(c, amt) {
  return [clamp255(c[0] + amt), clamp255(c[1] + amt), clamp255(c[2] + amt)];
}

function mix(a, b, t) {
  return [clamp255(a[0] + (b[0] - a[0]) * t), clamp255(a[1] + (b[1] - a[1]) * t), clamp255(a[2] + (b[2] - a[2]) * t)];
}

function makeTile() {
  return { px: new Uint8ClampedArray(S * S * 4) };
}

function put(tile, x, y, c, a = 255) {
  if (x < 0 || y < 0 || x >= S || y >= S) return;
  const i = (y * S + x) * 4;
  tile.px[i] = c[0];
  tile.px[i + 1] = c[1];
  tile.px[i + 2] = c[2];
  tile.px[i + 3] = a;
}

function get(tile, x, y) {
  const i = (y * S + x) * 4;
  return [tile.px[i], tile.px[i + 1], tile.px[i + 2]];
}

// Speckled base: three-tone noise that reads as Minecraft-like texture.
function speckle(tile, rand, base, spread, bias = 0) {
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      const r = rand();
      const amt = r < 0.18 ? -spread : r > 0.82 ? spread : (rand() - 0.5) * spread * 0.6;
      put(tile, x, y, shade(base, amt + bias));
    }
  }
}

function blobs(tile, rand, count, color, rMin, rMax, alpha = 255) {
  for (let i = 0; i < count; i += 1) {
    const cx = rand() * S;
    const cy = rand() * S;
    const r = rMin + rand() * (rMax - rMin);
    for (let y = Math.floor(cy - r); y <= cy + r; y += 1) {
      for (let x = Math.floor(cx - r); x <= cx + r; x += 1) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
        const wx = (x + S) % S;
        const wy = (y + S) % S;
        put(tile, wx, wy, shade(color, (rand() - 0.5) * 14), alpha);
      }
    }
  }
}

// Voronoi-ish stones with dark mortar, used for cobble and gravel.
function stones(tile, rand, palette, mortar, cells = 7) {
  const pts = [];
  for (let i = 0; i < cells; i += 1) pts.push([rand() * S, rand() * S, palette[Math.floor(rand() * palette.length)]]);
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      let best = 1e9;
      let second = 1e9;
      let col = palette[0];
      for (const [px, py, c] of pts) {
        for (const ox of [-S, 0, S]) {
          for (const oy of [-S, 0, S]) {
            const d = (x - px - ox) ** 2 + (y - py - oy) ** 2;
            if (d < best) {
              second = best;
              best = d;
              col = c;
            } else if (d < second) second = d;
          }
        }
      }
      const edge = Math.sqrt(second) - Math.sqrt(best);
      if (edge < 0.9) put(tile, x, y, shade(mortar, (rand() - 0.5) * 10));
      else put(tile, x, y, shade(col, (rand() - 0.5) * 18 + (edge < 1.8 ? -8 : 6)));
    }
  }
}

function bevel(tile, light = 14, dark = -20) {
  for (let i = 0; i < S; i += 1) {
    put(tile, i, 0, shade(get(tile, i, 0), light));
    put(tile, 0, i, shade(get(tile, 0, i), light));
    put(tile, i, S - 1, shade(get(tile, i, S - 1), dark));
    put(tile, S - 1, i, shade(get(tile, S - 1, i), dark));
  }
}

function clear(tile) {
  tile.px.fill(0);
}

const GRASS = rgb(0x6aa84a);
const DIRT = rgb(0x8a6142);

const PAINTERS = {
  grass_top(t, r) {
    speckle(t, r, GRASS, 10);
    for (let i = 0; i < 22; i += 1) put(t, Math.floor(r() * S), Math.floor(r() * S), shade(GRASS, 18));
    for (let i = 0; i < 10; i += 1) put(t, Math.floor(r() * S), Math.floor(r() * S), shade(GRASS, -18));
  },
  grass_side(t, r) {
    PAINTERS.dirt(t, r);
    for (let x = 0; x < S; x += 1) {
      const depth = 3 + Math.floor(r() * 3) + (r() > 0.8 ? 2 : 0);
      for (let y = 0; y < depth; y += 1) put(t, x, y, shade(GRASS, (y === depth - 1 ? -22 : 0) + (r() - 0.5) * 22));
    }
  },
  snow_side(t, r) {
    PAINTERS.stone(t, r);
    for (let x = 0; x < S; x += 1) {
      const depth = 3 + Math.floor(r() * 3);
      for (let y = 0; y < depth; y += 1) put(t, x, y, shade(rgb(0xf2f6fb), (y === depth - 1 ? -26 : 0) + (r() - 0.5) * 8));
    }
  },
  dirt(t, r) {
    speckle(t, r, DIRT, 18);
    blobs(t, r, 5, shade(DIRT, -26), 0.6, 1.2);
    for (let i = 0; i < 6; i += 1) put(t, Math.floor(r() * S), Math.floor(r() * S), rgb(0xa9a39a));
  },
  path_top(t, r) {
    speckle(t, r, rgb(0x9c7c4c), 14);
    blobs(t, r, 6, rgb(0x806238), 0.6, 1.3);
    for (let i = 0; i < 8; i += 1) put(t, Math.floor(r() * S), Math.floor(r() * S), rgb(0xb8a27a));
  },
  stone(t, r) {
    speckle(t, r, rgb(0x8a8a8a), 14);
    for (let i = 0; i < 5; i += 1) {
      let x = Math.floor(r() * S);
      let y = Math.floor(r() * S);
      const len = 2 + Math.floor(r() * 4);
      for (let k = 0; k < len; k += 1) {
        put(t, x, y, rgb(0x6c6c6c));
        x += r() > 0.5 ? 1 : 0;
        y += r() > 0.4 ? 0 : 1;
      }
    }
  },
  stone_dark(t, r) {
    speckle(t, r, rgb(0x4e4e55), 10);
    for (let y = 0; y < S; y += 4) for (let x = 0; x < S; x += 1) if (r() > 0.35) put(t, x, y + Math.floor(r() * 2), rgb(0x3a3a40));
  },
  cobble(t, r) {
    stones(t, r, [rgb(0x7f7f7f), rgb(0x737373), rgb(0x868686), rgb(0x6b6b6b)], rgb(0x4f4f4f), 9);
  },
  mossy(t, r) {
    stones(t, r, [rgb(0x8f8f8f), rgb(0x7d7d7d), rgb(0x6f8a52)], rgb(0x4a4a4a), 8);
    blobs(t, r, 4, rgb(0x5e8a3a), 1, 2.2);
  },
  gravel(t, r) {
    stones(t, r, [rgb(0x8c8580), rgb(0x9e9893), rgb(0x76706b), rgb(0x847a6e)], rgb(0x5e5853), 14);
  },
  sand(t, r) {
    speckle(t, r, rgb(0xe3d5a6), 10);
    for (let i = 0; i < 14; i += 1) put(t, Math.floor(r() * S), Math.floor(r() * S), rgb(0xcbbb88));
  },
  snow(t, r) {
    speckle(t, r, rgb(0xf3f7fc), 5);
    for (let i = 0; i < 10; i += 1) put(t, Math.floor(r() * S), Math.floor(r() * S), rgb(0xdde7f2));
  },
  ice(t, r) {
    speckle(t, r, rgb(0x9cc4f0), 8);
    for (let i = 0; i < 4; i += 1) {
      const y = Math.floor(r() * S);
      for (let x = 0; x < S; x += 1) if (r() > 0.3) put(t, x, (y + Math.floor(x * 0.4)) % S, rgb(0xd6ecff));
    }
  },
  oak_side(t, r) {
    for (let x = 0; x < S; x += 1) {
      const col = x % 4 === 0 ? -26 : x % 4 === 2 ? 10 : 0;
      for (let y = 0; y < S; y += 1) put(t, x, y, shade(rgb(0x6b4f2a), col + (r() - 0.5) * 16));
    }
  },
  oak_top(t, r) {
    for (let y = 0; y < S; y += 1) {
      for (let x = 0; x < S; x += 1) {
        const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
        const ring = Math.floor(d) % 2 === 0 ? 10 : -6;
        put(t, x, y, d > 6.6 ? shade(rgb(0x6b4f2a), (r() - 0.5) * 14) : shade(rgb(0xb8945a), ring + (r() - 0.5) * 10));
      }
    }
  },
  birch_side(t, r) {
    speckle(t, r, rgb(0xe8e4d8), 8);
    for (let i = 0; i < 9; i += 1) {
      const y = Math.floor(r() * S);
      const x = Math.floor(r() * S);
      const len = 2 + Math.floor(r() * 4);
      for (let k = 0; k < len; k += 1) put(t, (x + k) % S, y, rgb(0x2b2b2b));
    }
  },
  birch_top(t, r) {
    PAINTERS.oak_top(t, r);
    for (let i = 0; i < S; i += 1) {
      put(t, i, 0, rgb(0xe8e4d8));
      put(t, 0, i, rgb(0xe8e4d8));
      put(t, i, S - 1, rgb(0xe8e4d8));
      put(t, S - 1, i, rgb(0xe8e4d8));
    }
  },
  spruce_side(t, r) {
    for (let x = 0; x < S; x += 1) {
      const col = x % 3 === 0 ? -20 : 4;
      for (let y = 0; y < S; y += 1) put(t, x, y, shade(rgb(0x4a3420), col + (r() - 0.5) * 14));
    }
  },
  spruce_top(t, r) {
    PAINTERS.oak_top(t, r);
  },
  leaves_oak(t, r) {
    speckle(t, r, rgb(0x3f8a2e), 20);
    blobs(t, r, 9, rgb(0x2a6420), 0.7, 1.4);
    blobs(t, r, 6, rgb(0x5aa83c), 0.5, 1);
  },
  leaves_birch(t, r) {
    speckle(t, r, rgb(0x7fae45), 18);
    blobs(t, r, 8, rgb(0x5b8a32), 0.7, 1.3);
    blobs(t, r, 6, rgb(0xa6c95a), 0.5, 1);
  },
  leaves_cherry(t, r) {
    speckle(t, r, rgb(0xf3a6c4), 16);
    blobs(t, r, 8, rgb(0xd97aa6), 0.7, 1.4);
    blobs(t, r, 7, rgb(0xffd2e4), 0.5, 1);
  },
  leaves_spruce(t, r) {
    speckle(t, r, rgb(0x2e5a3a), 16);
    blobs(t, r, 9, rgb(0x1e4028), 0.7, 1.3);
    blobs(t, r, 5, rgb(0x447a4e), 0.5, 0.9);
  },
  plank(t, r) {
    const base = rgb(0xc49a5a);
    for (let y = 0; y < S; y += 1) {
      const board = Math.floor(y / 4);
      const seam = y % 4 === 3;
      const off = (board * 7) % S;
      for (let x = 0; x < S; x += 1) {
        let c = shade(base, (board % 2 ? -8 : 4) + (r() - 0.5) * 14);
        if (seam) c = shade(base, -46);
        if ((x + off) % S === 0 && !seam) c = shade(base, -34);
        put(t, x, y, c);
      }
    }
  },
  glass(t) {
    clear(t);
    for (let i = 0; i < S; i += 1) {
      for (const [x, y] of [[i, 0], [0, i], [i, S - 1], [S - 1, i]]) put(t, x, y, rgb(0xdcefff), 255);
    }
    for (let i = 3; i < 7; i += 1) put(t, i, i - 1, rgb(0xffffff), 200);
    for (let i = 9; i < 11; i += 1) put(t, i, i - 6, rgb(0xffffff), 200);
    for (let y = 1; y < S - 1; y += 1) for (let x = 1; x < S - 1; x += 1) if (!get(t, x, y)[0]) put(t, x, y, rgb(0xb8dcf5), 46);
  },
  portal(t, r) {
    for (let y = 0; y < S; y += 1) {
      for (let x = 0; x < S; x += 1) {
        const w = Math.sin((x + y * 0.6) * 0.9) + Math.sin((x * 0.5 - y) * 0.7);
        put(t, x, y, mix(rgb(0x5a1ec8), rgb(0xd29bff), (w + 2) / 4 + (r() - 0.5) * 0.2), 200);
      }
    }
  },
  obsidian(t, r) {
    speckle(t, r, rgb(0x170a22), 8);
    blobs(t, r, 4, rgb(0x2f1650), 0.6, 1.2);
    for (let i = 0; i < 5; i += 1) put(t, Math.floor(r() * S), Math.floor(r() * S), rgb(0x6a3fa8));
  },
  gold(t, r) {
    speckle(t, r, rgb(0xf0c14b), 10);
    bevel(t, 34, -40);
    for (let i = 2; i < 7; i += 1) put(t, i, 2, rgb(0xfff2b0));
    put(t, 2, 3, rgb(0xfff2b0));
  },
  lantern(t, r) {
    for (let y = 0; y < S; y += 1) {
      for (let x = 0; x < S; x += 1) {
        const frame = x < 2 || y < 2 || x > 13 || y > 13 || x === 7 || x === 8;
        put(t, x, y, frame ? shade(rgb(0x3b3b40), (r() - 0.5) * 12) : mix(rgb(0xffb347), rgb(0xfff1b8), r() * 0.5));
      }
    }
  },
  brick(t, r) {
    for (let y = 0; y < S; y += 1) {
      for (let x = 0; x < S; x += 1) {
        const row = Math.floor(y / 4);
        const mortar = y % 4 === 3 || (x + (row % 2) * 4) % 8 === 7;
        put(t, x, y, mortar ? shade(rgb(0xc9c1b4), (r() - 0.5) * 10) : shade(rgb(0xa5503c), (r() - 0.5) * 22));
      }
    }
  },
  sea_lantern(t, r) {
    speckle(t, r, rgb(0xcfeef0), 10);
    for (let y = 0; y < S; y += 1) for (let x = 0; x < S; x += 1) if ((x + y) % 5 === 0) put(t, x, y, rgb(0xffffff));
  },
};

// Colored concrete-like blocks share one painter.
const SOLIDS = {
  magenta: 0xc43cff, magentaDark: 0x6d1f99, ink: 0x1a1520, cream: 0xf4efe6, red: 0xb02e26, white: 0xf2f2f2,
  black: 0x1b1b1b, orange: 0xe67a22, cyan: 0x2ec4b6, blue: 0x3c6fd0, pink: 0xf2a6b3, amber: 0xffb703, lime: 0x8bd14a,
};
for (const [name, hex] of Object.entries(SOLIDS)) {
  PAINTERS[name] = (t, r) => {
    speckle(t, r, rgb(hex), name === "black" || name === "ink" ? 6 : 12);
    bevel(t, 12, -18);
  };
}

// Cutout plant sprites, drawn bottom-up.
function blade(t, r, x, h, color, lean = 0) {
  for (let k = 0; k < h; k += 1) {
    const y = S - 1 - k;
    const xx = Math.round(x + lean * (k / h) * (k / h) * 3);
    put(t, xx, y, shade(color, (k / h) * 26 - 10 + (r() - 0.5) * 10));
  }
}

function stem(t, r, x, h) {
  blade(t, r, x, h, rgb(0x3f7f2a));
  put(t, x - 1, S - 4, rgb(0x4c9a34));
  put(t, x + 1, S - 6, rgb(0x4c9a34));
}

function petals(t, cx, cy, color, center, size = 1) {
  for (let y = -size - 1; y <= size + 1; y += 1) {
    for (let x = -size - 1; x <= size + 1; x += 1) {
      const d = Math.abs(x) + Math.abs(y);
      if (d > size + 1) continue;
      put(t, cx + x, cy + y, d === 0 ? center : shade(color, d === size + 1 ? -24 : 0));
    }
  }
}

const PLANTS = {
  tall_grass(t, r) {
    clear(t);
    for (let i = 0; i < 11; i += 1) blade(t, r, 1 + Math.floor(r() * 14), 5 + Math.floor(r() * 10), rgb(0x5f9c3c), (r() - 0.5) * 1.4);
  },
  fern(t, r) {
    clear(t);
    for (let i = 0; i < 6; i += 1) {
      const x = 2 + i * 2.2;
      blade(t, r, Math.round(x), 8 + Math.floor(r() * 7), rgb(0x3f7f34), (x - 8) * 0.25);
      for (let k = 4; k < 12; k += 3) put(t, Math.round(x + (x < 8 ? -1 : 1)), S - k, rgb(0x4f9a40));
    }
  },
  poppy(t, r) {
    clear(t);
    stem(t, r, 7, 9);
    petals(t, 7, 5, rgb(0xd8262e), rgb(0x2a1a14), 1);
  },
  dandelion(t, r) {
    clear(t);
    stem(t, r, 8, 8);
    petals(t, 8, 6, rgb(0xffd23f), rgb(0xffaa00), 1);
  },
  cornflower(t, r) {
    clear(t);
    stem(t, r, 7, 9);
    petals(t, 7, 5, rgb(0x4d6fe0), rgb(0x2a3fa0), 1);
  },
  daisy(t, r) {
    clear(t);
    stem(t, r, 8, 8);
    petals(t, 8, 6, rgb(0xfafafa), rgb(0xf5c518), 1);
  },
  tulip(t, r) {
    clear(t);
    stem(t, r, 7, 8);
    for (let y = 3; y < 8; y += 1) for (let x = 6; x < 9; x += 1) put(t, x, y, shade(rgb(0xf27aa8), (y - 5) * -6));
    put(t, 5, 4, rgb(0xf27aa8));
    put(t, 9, 4, rgb(0xf27aa8));
  },
  allium(t, r) {
    clear(t);
    stem(t, r, 8, 10);
    for (let y = 1; y < 6; y += 1) for (let x = 6; x < 11; x += 1) if ((x - 8) ** 2 + (y - 3.5) ** 2 < 6.5) put(t, x, y, shade(rgb(0xb36ae0), (r() - 0.5) * 30));
  },
  bush(t, r) {
    clear(t);
    for (let y = 4; y < S; y += 1) for (let x = 1; x < S - 1; x += 1) if ((x - 7.5) ** 2 / 50 + (y - 10) ** 2 / 36 < 1 && r() > 0.12) put(t, x, y, shade(rgb(0x3b7a2c), (r() - 0.5) * 34));
    for (let i = 0; i < 4; i += 1) put(t, 3 + Math.floor(r() * 10), 6 + Math.floor(r() * 7), rgb(0xd8262e));
  },
};

export const TILE_NAMES = [...Object.keys(PAINTERS), ...Object.keys(PLANTS)];
export const PLANT_TILES = Object.keys(PLANTS);
export const TILE = Object.fromEntries(TILE_NAMES.map((name, i) => [name, i]));

export const TILE_SIZE = S;

// RGBA pixels for every tile, one 16x16 layer after another.
export function paintTiles() {
  const data = new Uint8Array(S * S * 4 * TILE_NAMES.length);
  for (const [layer, name] of TILE_NAMES.entries()) {
    const tile = makeTile();
    const painter = PAINTERS[name] || PLANTS[name];
    painter(tile, mulberry32(hashString(name)));
    // Canvas-style rows (y down) become texture rows (v up).
    for (let y = 0; y < S; y += 1) {
      const src = y * S * 4;
      const dst = layer * S * S * 4 + (S - 1 - y) * S * 4;
      data.set(tile.px.subarray(src, src + S * 4), dst);
    }
  }
  return data;
}

// Flat preview canvas for a tile; handy for UI swatches or debugging.
export function tileCanvas(name) {
  const tile = makeTile();
  (PAINTERS[name] || PLANTS[name])(tile, mulberry32(hashString(name)));
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  canvas.getContext("2d").putImageData(new ImageData(tile.px, S, S), 0, 0);
  return canvas;
}
