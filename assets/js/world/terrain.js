import { fbm, ridged, noise2, ihash, smoothstep } from "./noise.js?v=20261015-world";
import { ID } from "./voxels.js?v=20261015-world";

// The island: a flat plaza in the middle, snowy mountains to the north,
// cherry blossoms west, birch woods east, meadows and a lighthouse south.

export const SEA_Y = -0.35;
export const FLAT = { x0: -24, z0: -24, x1: 25, z1: 26 };

function distToRect(x, z, r) {
  const dx = Math.max(r.x0 - x, 0, x - r.x1);
  const dz = Math.max(r.z0 - z, 0, z - r.z1);
  return Math.hypot(dx, dz);
}

function segDist(px, pz, ax, az, bx, bz) {
  const vx = bx - ax;
  const vz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz)));
  return { d: Math.hypot(px - ax - vx * t, pz - az - vz * t), t };
}

export function mountainMask(x, z) {
  return smoothstep(-36, -84, z) * smoothstep(122, 70, Math.abs(x + 6));
}

export function coastRadius(x, z) {
  return 112 + noise2(x * 0.011, z * 0.011, 3) * 20 + noise2(x * 0.04, z * 0.04, 5) * 4;
}

// Smooth, un-rounded terrain height.
export function rawHeight(x, z) {
  const r = Math.hypot(x, z * 1.04);
  const shore = coastRadius(x, z);
  const coast = smoothstep(shore + 8, shore - 26, r);
  const hills = 3.2 + fbm(x * 0.017, z * 0.017, 4, 11) * 7.5 + fbm(x * 0.07, z * 0.07, 2, 12) * 1.2;
  const m = mountainMask(x, z);
  const peaks = m * (6 + ridged(x * 0.021, z * 0.021, 5, 21) * 42 + smoothstep(-60, -110, z) * 10);
  const land = Math.max(hills, 1.2) + peaks;
  const sea = -11 + fbm(x * 0.03, z * 0.03, 2, 31) * 3;
  let h = sea + (land - sea) * coast;
  const flat = smoothstep(0, 22, distToRect(x, z, FLAT));
  h = h * flat;
  return h;
}

export function biomeAt(x, z) {
  const wobble = noise2(x * 0.03, z * 0.03, 41) * 14;
  if (mountainMask(x, z) > 0.32) return "mountain";
  if (x + wobble < -44) return "cherry";
  if (x + wobble > 44) return "birch";
  return "meadow";
}

const GRASS_PLANTS = ["tall_grass", "tall_grass", "tall_grass", "fern"];
const MEADOW_FLOWERS = ["poppy", "dandelion", "cornflower", "daisy", "dandelion"];
const CHERRY_FLOWERS = ["tulip", "allium", "daisy", "tulip"];

export function generateTerrain(grid, { plaza }) {
  const features = {};
  const heights = new Int16Array(grid.sx * grid.sz);
  const H = (x, z) => heights[(x - grid.x0) * grid.sz + (z - grid.z0)];
  const inFlat = (x, z) => x >= FLAT.x0 && x <= FLAT.x1 && z >= FLAT.z0 && z <= FLAT.z1;

  for (let x = grid.x0; x < grid.x0 + grid.sx; x += 1) {
    for (let z = grid.z0; z < grid.z0 + grid.sz; z += 1) {
      heights[(x - grid.x0) * grid.sz + (z - grid.z0)] = inFlat(x, z) ? 0 : Math.round(rawHeight(x + 0.5, z + 0.5));
    }
  }

  // Landmarks are placed against the generated coastline.
  const south = findCoast(H, grid, 4, 1, 34);
  features.lighthouse = { x: 4, z: south - 5 };
  const peak = findPeak(H, grid);
  features.peak = peak;
  features.torii = { x: -64, z: 6 };
  features.windmill = { x: 66, z: -4 };

  const paths = [
    [[8.5, 26], [6, 46], [-3, 66], [2, 86], [features.lighthouse.x, features.lighthouse.z + 3]],
    [[-25, 1.5], [-40, 4], [-55, 6], [features.torii.x + 6, features.torii.z]],
    [[26, 1.5], [42, -1], [56, -3], [features.windmill.x - 5, features.windmill.z]],
    [[0.5, -24], [-6, -38], [-16, -50], [-24, -60]],
  ];
  features.paths = paths;

  const pathAt = (x, z) => {
    let best = 9;
    for (const pts of paths) {
      for (let i = 0; i < pts.length - 1; i += 1) {
        const { d } = segDist(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
        if (d < best) best = d;
      }
    }
    return best;
  };

  // Smooth heights along paths so they are walkable, then flatten landmark pads.
  const pathMask = new Uint8Array(grid.sx * grid.sz);
  for (let x = grid.x0; x < grid.x0 + grid.sx; x += 1) {
    for (let z = grid.z0; z < grid.z0 + grid.sz; z += 1) {
      if (inFlat(x, z)) continue;
      const d = pathAt(x + 0.5, z + 0.5);
      if (d < 3.2) {
        const i = (x - grid.x0) * grid.sz + (z - grid.z0);
        const soft = Math.round(rawHeight(x + 0.5, z + 0.5) * 0.85);
        heights[i] = Math.max(0, d < 1.7 ? soft : Math.round((soft + heights[i]) / 2));
        if (d < 1.7 + noise2(x * 0.3, z * 0.3, 77) * 0.4) pathMask[i] = 1;
      }
    }
  }
  for (const pad of [features.lighthouse, features.torii, features.windmill]) {
    const level = Math.max(1, H(Math.round(pad.x), Math.round(pad.z)));
    pad.y = level;
    for (let dx = -7; dx <= 7; dx += 1) {
      for (let dz = -7; dz <= 7; dz += 1) {
        const x = Math.round(pad.x) + dx;
        const z = Math.round(pad.z) + dz;
        if (!grid.inside(x, 0, z)) continue;
        const d = Math.hypot(dx, dz);
        const i = (x - grid.x0) * grid.sz + (z - grid.z0);
        if (d <= 5) heights[i] = level;
        else if (d <= 7) heights[i] = Math.round((heights[i] + level) / 2);
      }
    }
  }

  const foliage = [];
  for (let x = grid.x0; x < grid.x0 + grid.sx; x += 1) {
    for (let z = grid.z0; z < grid.z0 + grid.sz; z += 1) {
      const i = (x - grid.x0) * grid.sz + (z - grid.z0);
      const h = heights[i];
      const biome = biomeAt(x, z);
      const slope = Math.max(
        Math.abs(h - (H(Math.min(x + 1, grid.x0 + grid.sx - 1), z))),
        Math.abs(h - (H(Math.max(x - 1, grid.x0), z))),
        Math.abs(h - (H(x, Math.min(z + 1, grid.z0 + grid.sz - 1)))),
        Math.abs(h - (H(x, Math.max(z - 1, grid.z0))))
      );
      const r = Math.hypot(x, z * 1.04);
      const beach = !inFlat(x, z) && h <= 1 && r > coastRadius(x, z) - 30;
      let top = ID.grass;
      let under = ID.dirt;
      if (h <= -2) {
        top = h < -6 ? ID.gravel : ID.sand;
        under = ID.sand;
      } else if (beach) {
        top = ID.sand;
        under = ID.sand;
      } else if (biome === "mountain") {
        const snowLine = 27 + noise2(x * 0.08, z * 0.08, 51) * 4;
        if (h > snowLine) {
          top = ID.snow;
          under = ID.stone;
        } else if (slope >= 4 || (h > snowLine - 4 && slope >= 2)) {
          top = ihash(x, z, 3) > 0.6 ? ID.gravel : ID.stone;
          under = ID.stone;
        } else if (slope >= 2 && ihash(x, z, 4) > 0.5) {
          top = ID.mossy;
        }
      } else if (slope >= 4) {
        top = ID.stone;
        under = ID.stone;
      }
      if (pathMask[i]) top = h > 24 ? ID.gravel : ID.path;
      if (top === ID.grass && ihash(x, z, 6) > 0.86) top = ID.grassDark;

      const col = (x - grid.x0) * grid.sz + (z - grid.z0);
      const base = col * grid.sy;
      for (let y = grid.y0; y <= h; y += 1) {
        let id = ID.stone;
        if (y === h) id = top;
        else if (y >= h - 3) id = under;
        else if (y < h - 12) id = ID.stoneDark;
        grid.data[base + (y - grid.y0)] = id;
      }
      grid.top[col] = h;

      if (inFlat(x, z)) {
        for (let y = -3; y <= 18; y += 1) {
          const kind = plaza(x, y, z);
          if (kind === undefined) continue;
          grid.data[base + (y - grid.y0)] = kind ? ID[kind] : 0;
          if (kind && y > grid.top[col]) grid.top[col] = y;
        }
        continue;
      }

      // Ground cover: grass tufts and flowers on open grass.
      if ((top === ID.grass || top === ID.grassDark) && !pathMask[i]) {
        const roll = ihash(x, z, 91);
        const flowerZone = noise2(x * 0.06, z * 0.06, 61);
        let tile = null;
        if (biome === "cherry" && roll < 0.08 + Math.max(0, flowerZone) * 0.2) tile = CHERRY_FLOWERS[Math.floor(ihash(x, z, 7) * CHERRY_FLOWERS.length)];
        else if (biome === "meadow" && roll < Math.max(0, flowerZone) * 0.22) tile = MEADOW_FLOWERS[Math.floor(ihash(x, z, 7) * MEADOW_FLOWERS.length)];
        else if (roll < (biome === "birch" ? 0.42 : biome === "mountain" ? 0.18 : 0.34)) tile = biome === "birch" && ihash(x, z, 8) > 0.6 ? "fern" : GRASS_PLANTS[Math.floor(ihash(x, z, 9) * GRASS_PLANTS.length)];
        else if (roll < 0.37 && biome === "meadow") tile = "bush";
        if (tile) foliage.push({ x: x + 0.2 + ihash(x, z, 10) * 0.6, y: h + 1, z: z + 0.2 + ihash(x, z, 11) * 0.6, tile, s: 0.75 + ihash(x, z, 12) * 0.5 });
      }
    }
  }

  // Trees: one candidate per 5x5 cell, density by biome.
  const trees = [];
  for (let gx = grid.x0; gx < grid.x0 + grid.sx; gx += 5) {
    for (let gz = grid.z0; gz < grid.z0 + grid.sz; gz += 5) {
      const x = gx + Math.floor(ihash(gx, gz, 13) * 5);
      const z = gz + Math.floor(ihash(gx, gz, 14) * 5);
      if (!grid.inside(x, 0, z)) continue;
      if (distToRect(x, z, FLAT) < 4) continue;
      if (pathAt(x + 0.5, z + 0.5) < 3) continue;
      if ([features.lighthouse, features.torii, features.windmill].some((p) => Math.hypot(x - p.x, z - p.z) < 9)) continue;
      const h = H(x, z);
      const topId = grid.data[((x - grid.x0) * grid.sz + (z - grid.z0)) * grid.sy + (h - grid.y0)];
      if (topId !== ID.grass && topId !== ID.grassDark && topId !== ID.mossy) continue;
      const biome = biomeAt(x, z);
      const density = { meadow: 0.16 + Math.max(0, noise2(x * 0.02, z * 0.02, 71)) * 0.7, cherry: 0.36, birch: 0.6, mountain: h < 24 ? 0.7 : 0 }[biome];
      if (ihash(x, z, 15) > density) continue;
      const kind = biome === "mountain" ? "spruce" : biome === "birch" ? (ihash(x, z, 16) > 0.2 ? "birch" : "oak") : biome === "cherry" ? (ihash(x, z, 16) > 0.15 ? "cherry" : "oak") : ihash(x, z, 16) > 0.85 ? "birch" : "oak";
      trees.push({ x, y: h + 1, z, kind });
      stampTree(grid, x, h + 1, z, kind);
    }
  }
  features.trees = trees;

  placePathLanterns(grid, paths, H, features);
  buildLighthouse(grid, features.lighthouse);
  buildTorii(grid, features.torii);
  buildWindmillTower(grid, features.windmill);
  buildNest(grid, features.peak);

  grid.recomputeTops();
  return { features, foliage: foliage.filter((f) => !grid.solid(Math.floor(f.x), Math.floor(f.y), Math.floor(f.z))), heights };
}

// Lantern posts every ~11 blocks, alternating sides of each path.
function placePathLanterns(grid, paths, H, features) {
  const pads = [features.lighthouse, features.torii, features.windmill];
  let side = 1;
  for (const pts of paths) {
    let carry = 6;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const nx = -(bz - az) / len;
      const nz = (bx - ax) / len;
      for (let t = carry; t < len; t += 11) {
        const x = Math.floor(ax + ((bx - ax) * t) / len + nx * 2.6 * side);
        const z = Math.floor(az + ((bz - az) * t) / len + nz * 2.6 * side);
        side = -side;
        if (!grid.inside(x, 0, z) || pads.some((p) => Math.hypot(x - p.x, z - p.z) < 8)) continue;
        const y = H(x, z);
        if (y < 1) continue;
        grid.set(x, y + 1, z, ID.spruceLog);
        grid.set(x, y + 2, z, ID.spruceLog);
        grid.set(x, y + 3, z, ID.lantern);
        grid.set(x, y + 4, z, ID.stoneDark);
        carry = t + 11 - len;
      }
    }
  }
}

function findCoast(H, grid, x, dir, start) {
  let last = start;
  for (let z = start; z < grid.z0 + grid.sz - 1; z += 1) {
    if (H(x, z * dir) >= 1) last = z;
    else if (z > last + 3) break;
  }
  return last * dir;
}

function findPeak(H, grid) {
  let best = { x: 0, z: -90, y: 0 };
  for (let x = -70; x <= 60; x += 2) {
    for (let z = -120; z <= -50; z += 2) {
      if (!grid.inside(x, 0, z)) continue;
      const y = H(x, z);
      if (y > best.y) best = { x, z, y };
    }
  }
  return best;
}

function setIf(grid, x, y, z, id, replaceLeaves = false) {
  const cur = grid.get(x, y, z);
  if (!cur || (replaceLeaves && (cur === ID.leaf || cur === ID.birchLeaf || cur === ID.cherryLeaf || cur === ID.spruceLeaf))) grid.set(x, y, z, id);
}

function blob(grid, cx, cy, cz, rx, ry, rz, id, salt) {
  for (let x = -Math.ceil(rx); x <= Math.ceil(rx); x += 1) {
    for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y += 1) {
      for (let z = -Math.ceil(rz); z <= Math.ceil(rz); z += 1) {
        const d = (x / (rx + 0.5)) ** 2 + (y / (ry + 0.5)) ** 2 + (z / (rz + 0.5)) ** 2;
        if (d > 1) continue;
        if (d > 0.62 && ihash(cx + x * 7 + y, cz + z * 5, salt) > 0.55) continue;
        setIf(grid, cx + x, cy + y, cz + z, id);
      }
    }
  }
}

function stampTree(grid, x, y, z, kind) {
  const r = ihash(x, z, 17);
  if (kind === "oak") {
    const h = 4 + Math.floor(r * 3);
    blob(grid, x, y + h - 1, z, 2.4, 1.8, 2.4, ID.leaf, 1);
    for (let i = 0; i < h; i += 1) grid.set(x, y + i, z, ID.wood);
  } else if (kind === "birch") {
    const h = 5 + Math.floor(r * 3);
    blob(grid, x, y + h - 1, z, 1.6, 2.4, 1.6, ID.birchLeaf, 2);
    for (let i = 0; i < h; i += 1) grid.set(x, y + i, z, ID.birchLog);
  } else if (kind === "cherry") {
    const h = 4 + Math.floor(r * 2);
    const lean = r > 0.5 ? 1 : -1;
    for (let i = 0; i < h; i += 1) grid.set(x + (i >= h - 1 ? lean : 0), y + i, z, ID.wood);
    grid.set(x - lean, y + h - 1, z, ID.wood);
    blob(grid, x, y + h, z, 3.4, 1.4, 3.4, ID.cherryLeaf, 3);
    // Drooping blossom curtains at the canopy rim.
    for (let a = 0; a < 10; a += 1) {
      const ang = (a / 10) * Math.PI * 2 + r;
      const dx = Math.round(Math.cos(ang) * 3.3);
      const dz = Math.round(Math.sin(ang) * 3.3);
      if (ihash(x + dx, z + dz, 18) > 0.5) setIf(grid, x + dx, y + h - 1, z + dz, ID.cherryLeaf);
    }
  } else if (kind === "spruce") {
    const h = 7 + Math.floor(r * 5);
    for (let i = 0; i < h; i += 1) grid.set(x, y + i, z, ID.spruceLog);
    for (let layer = 2; layer <= h + 1; layer += 1) {
      const fromTop = h + 1 - layer;
      const rad = fromTop === 0 ? 0 : (fromTop % 2 === 0 ? 1 : 2) + (fromTop > 4 ? 1 : 0);
      for (let dx = -rad; dx <= rad; dx += 1) {
        for (let dz = -rad; dz <= rad; dz += 1) {
          if (Math.abs(dx) + Math.abs(dz) > rad + (rad > 1 ? 1 : 0)) continue;
          setIf(grid, x + dx, y + layer, z + dz, ID.spruceLeaf);
        }
      }
    }
    setIf(grid, x, y + h + 1, z, ID.spruceLeaf);
    if (y + h > 22) for (let dx = -1; dx <= 1; dx += 1) for (let dz = -1; dz <= 1; dz += 1) if (Math.abs(dx) + Math.abs(dz) <= 1) setIf(grid, x + dx, y + h + 2, z + dz, ID.snowBlock);
  }
}

function buildLighthouse(grid, p) {
  const cx = Math.round(p.x);
  const cz = Math.round(p.z);
  const y0 = p.y + 1;
  const tall = 17;
  for (let y = 0; y < tall; y += 1) {
    const radius = 3.2 - y * 0.07;
    const stripe = Math.floor(y / 3) % 2 === 0 ? ID.white : ID.red;
    for (let dx = -4; dx <= 4; dx += 1) {
      for (let dz = -4; dz <= 4; dz += 1) {
        const d = Math.hypot(dx, dz);
        if (d > radius + 0.5) continue;
        const wall = d > radius - 0.9;
        const isDoor = dz > 0 && Math.abs(dx) <= 0 && y >= 0 && y <= 1;
        const isWindow = y % 6 === 4 && Math.abs(dx) <= 0 && wall;
        grid.set(cx + dx, y0 + y, cz + dz, wall ? (isDoor ? 0 : isWindow ? ID.glass : stripe) : 0);
      }
    }
  }
  // Gallery deck, lantern room, and cap.
  const top = y0 + tall;
  for (let dx = -4; dx <= 4; dx += 1) {
    for (let dz = -4; dz <= 4; dz += 1) {
      const d = Math.hypot(dx, dz);
      if (d <= 4.3) grid.set(cx + dx, top, cz + dz, ID.stoneDark);
      if (d > 3.6 && d <= 4.3) grid.set(cx + dx, top + 1, cz + dz, ID.black);
      if (d <= 2.3) {
        grid.set(cx + dx, top + 1, cz + dz, d < 1.2 ? ID.seaLantern : 0);
        grid.set(cx + dx, top + 2, cz + dz, d < 1.2 ? ID.seaLantern : d > 1.5 ? ID.glass : 0);
        grid.set(cx + dx, top + 3, cz + dz, d > 1.5 ? ID.glass : 0);
        grid.set(cx + dx, top + 4, cz + dz, ID.red);
      }
      if (d <= 1.3) grid.set(cx + dx, top + 5, cz + dz, ID.red);
    }
  }
  grid.set(cx, top + 6, cz, ID.gold);
  p.lampY = top + 2.5;
  p.topY = top;
}

function buildTorii(grid, p) {
  const cx = Math.round(p.x);
  const cz = Math.round(p.z);
  const y0 = p.y + 1;
  for (const side of [-3, 3]) {
    for (let y = 0; y < 6; y += 1) grid.set(cx, y0 + y, cz + side, ID.red);
    grid.set(cx, y0, cz + side, ID.black);
  }
  for (let dz = -4; dz <= 4; dz += 1) {
    grid.set(cx, y0 + 6, cz + dz, ID.black);
    grid.set(cx, y0 + 7, cz + dz, Math.abs(dz) === 4 ? ID.black : ID.red);
    if (Math.abs(dz) <= 3) grid.set(cx, y0 + 4, cz + dz, ID.red);
  }
  grid.set(cx, y0 + 5, cz, ID.gold);
  // Stone lanterns flanking the gate.
  for (const side of [-5, 5]) {
    grid.set(cx + 2, y0, cz + side, ID.cobble);
    grid.set(cx + 2, y0 + 1, cz + side, ID.lantern);
    grid.set(cx + 2, y0 + 2, cz + side, ID.stoneDark);
  }
}

function buildWindmillTower(grid, p) {
  const cx = Math.round(p.x);
  const cz = Math.round(p.z);
  const y0 = p.y + 1;
  const tall = 11;
  for (let y = 0; y < tall; y += 1) {
    const rad = 3 - Math.floor(y / 5);
    for (let dx = -rad; dx <= rad; dx += 1) {
      for (let dz = -rad; dz <= rad; dz += 1) {
        const wall = Math.abs(dx) === rad || Math.abs(dz) === rad;
        if (!wall) {
          grid.set(cx + dx, y0 + y, cz + dz, 0);
          continue;
        }
        const door = dx === -rad && dz === 0 && y <= 1;
        const window = y === 6 && (dx === 0 || dz === 0);
        grid.set(cx + dx, y0 + y, cz + dz, door ? 0 : window ? ID.glass : y < 4 ? ID.cobble : ID.plank);
      }
    }
  }
  for (let y = 0; y < 3; y += 1) {
    const rad = 2 - y;
    for (let dx = -rad - 1; dx <= rad + 1; dx += 1) for (let dz = -rad - 1; dz <= rad + 1; dz += 1) grid.set(cx + dx, y0 + tall + y, cz + dz, ID.red);
  }
  p.hubY = y0 + tall - 2.5;
  p.hubX = cx + 3.6;
}

function buildNest(grid, p) {
  const cy = p.y + 1;
  for (let a = 0; a < 18; a += 1) {
    const ang = (a / 18) * Math.PI * 2;
    const x = Math.round(p.x + Math.cos(ang) * 3);
    const z = Math.round(p.z + Math.sin(ang) * 3);
    grid.set(x, cy, z, ID.wood);
    if (a % 2) grid.set(x, cy + 1, z, ID.spruceLog);
  }
  for (let dx = -2; dx <= 2; dx += 1) for (let dz = -2; dz <= 2; dz += 1) if (dx * dx + dz * dz <= 5) grid.set(p.x + dx, cy, p.z + dz, ID.gold);
  grid.set(p.x, cy + 1, p.z, ID.obsidian);
  p.perchY = cy + 1;
}
