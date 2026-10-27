import { TILE } from "./textures.js?v=20261026-worker";
import { ihash, noise2 } from "./noise.js?v=20261015-world";

// Voxel data: the block registry, the grid, block light and chunk meshing.
// Meshes come out as plain typed arrays; voxels.js turns them into three.js
// geometry. No three.js here so the worker can run all of it.

// Block registry. Kinds keep the names the plaza code already uses.
// tiles: [top, side, bottom]; pass: which mesh the faces go to.
const DEFS = {
  grass: { tiles: ["grass_top", "grass_side", "dirt"], tint: "grass" },
  grassDark: { tiles: ["grass_top", "grass_side", "dirt"], tint: "grassDark" },
  dirt: { tiles: ["dirt"] },
  path: { tiles: ["path_top", "dirt", "dirt"] },
  stone: { tiles: ["stone"] },
  stoneDark: { tiles: ["stone_dark"] },
  cobble: { tiles: ["cobble"] },
  mossy: { tiles: ["mossy"] },
  gravel: { tiles: ["gravel"] },
  sand: { tiles: ["sand"] },
  snow: { tiles: ["snow", "snow_side", "stone"] },
  snowBlock: { tiles: ["snow"] },
  ice: { tiles: ["ice"] },
  wood: { tiles: ["oak_top", "oak_side", "oak_top"] },
  birchLog: { tiles: ["birch_top", "birch_side", "birch_top"] },
  spruceLog: { tiles: ["spruce_top", "spruce_side", "spruce_top"] },
  leaf: { tiles: ["leaves_oak"], tint: "leaf" },
  birchLeaf: { tiles: ["leaves_birch"], tint: "leaf" },
  cherryLeaf: { tiles: ["leaves_cherry"], tint: "blossom" },
  spruceLeaf: { tiles: ["leaves_spruce"], tint: "leaf" },
  plank: { tiles: ["plank"] },
  brick: { tiles: ["brick"] },
  gold: { tiles: ["gold"], glow: 0.08 },
  lantern: { tiles: ["lantern"], glow: 1.4, light: 13 },
  seaLantern: { tiles: ["sea_lantern"], glow: 1.1, light: 15 },
  obsidian: { tiles: ["obsidian"] },
  glass: { tiles: ["glass"], pass: "trans", solid: true },
  portal: { tiles: ["portal"], pass: "trans", solid: false, glow: 1.6, light: 9 },
  water: { tiles: ["glass"], pass: "none", solid: false },
  cloud: { tiles: ["snow"], pass: "none", solid: false },
};
for (const name of ["magenta", "magentaDark", "ink", "cream", "red", "white", "black", "orange", "cyan", "blue", "pink", "amber", "lime"]) {
  DEFS[name] = { tiles: [name] };
}
DEFS.magenta.glow = 0.05;
DEFS.cyan.glow = 0.04;

export const KINDS = [null, ...Object.keys(DEFS)];
export const ID = Object.fromEntries(KINDS.map((k, i) => [k, i]).filter(([k]) => k));

const N = KINDS.length;
const OPAQUE = new Uint8Array(N);
const SOLID = new Uint8Array(N);
const PASS = new Uint8Array(N); // 0 none, 1 opaque, 2 transparent
const TOP = new Int16Array(N);
const SIDE = new Int16Array(N);
const BOTTOM = new Int16Array(N);
const GLOW = new Float32Array(N);
const LIGHT = new Uint8Array(256);
const TINT = [];
for (let id = 1; id < N; id += 1) {
  const def = DEFS[KINDS[id]];
  const pass = def.pass || "opaque";
  PASS[id] = pass === "opaque" ? 1 : pass === "trans" ? 2 : 0;
  OPAQUE[id] = pass === "opaque" ? 1 : 0;
  SOLID[id] = (def.solid ?? pass === "opaque") ? 1 : 0;
  const [top, side = top, bottom = top] = def.tiles;
  TOP[id] = TILE[top];
  SIDE[id] = TILE[side];
  BOTTOM[id] = TILE[bottom];
  GLOW[id] = def.glow || 0;
  LIGHT[id] = def.light || 0;
  TINT[id] = def.tint || null;
}

export function isSolidId(id) {
  return SOLID[id] === 1;
}

export class VoxelGrid {
  // Pass data/top to wrap a grid generated elsewhere (the worker).
  constructor(x0, y0, z0, sx, sy, sz, data = null, top = null) {
    Object.assign(this, { x0, y0, z0, sx, sy, sz });
    this.data = data || new Uint8Array(sx * sy * sz);
    this.top = top || new Int16Array(sx * sz).fill(y0 - 1);
  }

  inside(x, y, z) {
    return x >= this.x0 && z >= this.z0 && y >= this.y0 && x < this.x0 + this.sx && z < this.z0 + this.sz && y < this.y0 + this.sy;
  }

  index(x, y, z) {
    return ((x - this.x0) * this.sz + (z - this.z0)) * this.sy + (y - this.y0);
  }

  get(x, y, z) {
    if (!this.inside(x, y, z)) return 0;
    return this.data[this.index(x, y, z)];
  }

  set(x, y, z, id) {
    if (!this.inside(x, y, z)) return;
    this.data[this.index(x, y, z)] = id;
    const col = (x - this.x0) * this.sz + (z - this.z0);
    if (id && y > this.top[col]) this.top[col] = y;
  }

  kind(x, y, z) {
    return KINDS[this.get(x, y, z)];
  }

  solid(x, y, z) {
    if (y < this.y0) return true;
    return SOLID[this.get(x, y, z)] === 1;
  }

  // Highest solid block in a column, or y0 - 1.
  surface(x, z) {
    if (x < this.x0 || z < this.z0 || x >= this.x0 + this.sx || z >= this.z0 + this.sz) return this.y0 - 1;
    for (let y = this.top[(x - this.x0) * this.sz + (z - this.z0)]; y >= this.y0; y -= 1) {
      if (SOLID[this.data[this.index(x, y, z)]]) return y;
    }
    return this.y0 - 1;
  }

  recomputeTops() {
    for (let x = 0; x < this.sx; x += 1) {
      for (let z = 0; z < this.sz; z += 1) {
        let y = this.sy - 1;
        const base = (x * this.sz + z) * this.sy;
        while (y >= 0 && !this.data[base + y]) y -= 1;
        this.top[x * this.sz + z] = this.y0 + y;
      }
    }
  }
}

// Face basis: u x v = normal; base corner is at (-u, -v).
const FACES = [
  { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0], base: [1, 0, 1], tile: SIDE },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], base: [0, 0, 0], tile: SIDE },
  { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1], base: [0, 1, 1], tile: TOP },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], base: [0, 0, 0], tile: BOTTOM },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], base: [0, 0, 1], tile: SIDE },
  { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0], base: [1, 0, 0], tile: SIDE },
];

const AO_CURVE = [0.42, 0.62, 0.8, 1];

// Writes the vertex tint for a face into TINT_RGB (reused to avoid garbage).
const TINT_RGB = new Float64Array(3);

function tintFor(kind, x, z, top) {
  const out = TINT_RGB;
  out[0] = 1;
  out[1] = 1;
  out[2] = 1;
  if (!kind || ((kind === "grass" || kind === "grassDark") && !top)) return out;
  const n = noise2(x * 0.045, z * 0.045, 9) * 0.5 + noise2(x * 0.17, z * 0.17, 4) * 0.25;
  if (kind === "grass" || kind === "grassDark") {
    const dark = kind === "grassDark" ? -0.1 : 0;
    // Drier, warmer greens near the coast; lush in the middle.
    const r = Math.hypot(x, z);
    const dry = Math.max(0, Math.min(1, (r - 70) / 50));
    out[0] = 0.92 + n * 0.12 + dry * 0.18 + dark;
    out[1] = 1.0 + n * 0.08 + dark;
    out[2] = 0.86 - n * 0.1 - dry * 0.12 + dark;
  } else if (kind === "leaf") {
    out[0] = 0.94 + n * 0.14;
    out[1] = 1 + n * 0.1;
    out[2] = 0.9 - n * 0.1;
  } else if (kind === "blossom") {
    out[1] = 0.94 + n * 0.08;
    out[2] = 1 - n * 0.04;
  }
  return out;
}

export const CHUNK = 32;

// Block light: breadth-first flood from lanterns through non-opaque cells,
// losing one level per block (like Minecraft). Stored 0..15 per cell.
export function computeBlockLight(grid) {
  const { data, sx, sy, sz } = grid;
  const light = new Uint8Array(data.length);
  let queue = new Int32Array(1 << 16);
  let head = 0;
  let tail = 0;
  const push = (i) => {
    if (tail >= queue.length) {
      const bigger = new Int32Array(queue.length * 2);
      bigger.set(queue.subarray(head, tail));
      tail -= head;
      head = 0;
      queue = bigger;
    }
    queue[tail++] = i;
  };
  for (let i = 0; i < data.length; i += 1) {
    const l = LIGHT[data[i]];
    if (l) {
      light[i] = l;
      push(i);
    }
  }
  const strideX = sz * sy;
  const strideZ = sy;
  while (head < tail) {
    const i = queue[head++];
    const l = light[i] - 1;
    if (l <= 0) continue;
    const y = i % sy;
    const z = Math.floor(i / sy) % sz;
    const x = Math.floor(i / strideX);
    const tryCell = (j) => {
      if (light[j] >= l || OPAQUE[data[j]]) return;
      light[j] = l;
      push(j);
    };
    if (x > 0) tryCell(i - strideX);
    if (x < sx - 1) tryCell(i + strideX);
    if (z > 0) tryCell(i - strideZ);
    if (z < sz - 1) tryCell(i + strideZ);
    if (y > 0) tryCell(i - 1);
    if (y < sy - 1) tryCell(i + 1);
  }
  grid.light = light;
  return light;
}

export function meshChunk(grid, cx, cz) {
  const out = [newBuffers(), newBuffers()];
  const x1 = Math.min(cx + CHUNK, grid.x0 + grid.sx);
  const z1 = Math.min(cz + CHUNK, grid.z0 + grid.sz);
  const { data, sy, sz, y0 } = grid;
  const strideX = sz * sy;

  const op = (x, y, z) => {
    if (y < y0) return 1;
    if (y >= y0 + sy) return 0;
    if (x < grid.x0 || z < grid.z0 || x >= grid.x0 + grid.sx || z >= grid.z0 + grid.sz) return 1;
    return OPAQUE[data[((x - grid.x0) * sz + (z - grid.z0)) * sy + (y - y0)]];
  };
  const light = grid.light;
  const lt = (x, y, z) => {
    if (!light || y < y0 || y >= y0 + sy || x < grid.x0 || z < grid.z0 || x >= grid.x0 + grid.sx || z >= grid.z0 + grid.sz) return 0;
    return light[((x - grid.x0) * sz + (z - grid.z0)) * sy + (y - y0)];
  };
  const idAt = (x, y, z) => {
    if (y < y0) return ID.stone;
    if (y >= y0 + sy) return 0;
    if (x < grid.x0 || z < grid.z0 || x >= grid.x0 + grid.sx || z >= grid.z0 + grid.sz) return ID.stone;
    return data[((x - grid.x0) * sz + (z - grid.z0)) * sy + (y - y0)];
  };

  for (let x = cx; x < x1; x += 1) {
    for (let z = cz; z < z1; z += 1) {
      const col = ((x - grid.x0) * sz + (z - grid.z0)) * sy;
      const yTop = grid.top[(x - grid.x0) * sz + (z - grid.z0)];
      const interior = x > grid.x0 && x < grid.x0 + grid.sx - 1 && z > grid.z0 && z < grid.z0 + grid.sz - 1;
      for (let y = y0; y <= yTop; y += 1) {
        const i = col + (y - y0);
        const id = data[i];
        if (!id) continue;
        const pass = PASS[id];
        if (!pass) continue;
        // Most terrain is buried: skip the six neighbor lookups when every
        // neighbor is opaque, since no face could show anyway.
        if (
          interior &&
          y > y0 &&
          y < y0 + sy - 1 &&
          OPAQUE[data[i - 1]] &&
          OPAQUE[data[i + 1]] &&
          OPAQUE[data[i - sy]] &&
          OPAQUE[data[i + sy]] &&
          OPAQUE[data[i - strideX]] &&
          OPAQUE[data[i + strideX]]
        ) {
          continue;
        }
        const buf = out[pass - 1];
        for (let f = 0; f < 6; f += 1) {
          const face = FACES[f];
          const nx = x + face.n[0];
          const ny = y + face.n[1];
          const nz = z + face.n[2];
          const nid = idAt(nx, ny, nz);
          if (OPAQUE[nid]) continue;
          if (pass === 2 && nid === id) continue;
          emitFace(buf, face, x, y, z, id, op, lt);
        }
      }
    }
  }
  return out.map((buf) => (buf.count ? pack(buf) : null));
}

// Growable typed arrays, written in place so meshing makes no garbage.
// count is vertices (four per face).
function newBuffers(faces = 2048) {
  return {
    count: 0,
    faces,
    pos: new Float32Array(faces * 12),
    nrm: new Int8Array(faces * 12),
    tuv: new Float32Array(faces * 8),
    tile: new Float32Array(faces * 4),
    col: new Float32Array(faces * 12),
    glow: new Float32Array(faces * 4),
    blk: new Float32Array(faces * 4),
    idx: new Uint32Array(faces * 6),
  };
}

function grow(buf) {
  const next = newBuffers(buf.faces * 2);
  for (const key of ["pos", "nrm", "tuv", "tile", "col", "glow", "blk", "idx"]) next[key].set(buf[key]);
  next.count = buf.count;
  return Object.assign(buf, next);
}

// Trimmed copies sized for BufferAttributes (and for transferring out of the
// worker without copying again).
function pack(buf) {
  const n = buf.count;
  return {
    count: n,
    pos: buf.pos.slice(0, n * 3),
    nrm: buf.nrm.slice(0, n * 3),
    tuv: buf.tuv.slice(0, n * 2),
    tile: buf.tile.slice(0, n),
    col: buf.col.slice(0, n * 3),
    glow: buf.glow.slice(0, n),
    blk: buf.blk.slice(0, n),
    idx: n > 65535 ? buf.idx.slice(0, (n / 4) * 6) : Uint16Array.from(buf.idx.subarray(0, (n / 4) * 6)),
  };
}

const CORNERS = [-1, -1, 1, -1, 1, 1, -1, 1];
const AO = new Int8Array(4);

function emitFace(buf, face, x, y, z, id, op, lt) {
  if ((buf.count + 4) * 3 > buf.pos.length) grow(buf);
  const tile = face.tile[id];
  const [nx, ny, nz] = face.n;
  const [ux, uy, uz] = face.u;
  const [vx, vy, vz] = face.v;
  const bx = x + face.base[0];
  const by = y + face.base[1];
  const bz = z + face.base[2];
  // Neighbor layer in front of the face for ambient occlusion.
  const cx = x + nx;
  const cy = y + ny;
  const cz = z + nz;
  const tint = tintFor(TINT[id], x, z, ny === 1);
  const glow = GLOW[id];
  const l0 = lt(cx, cy, cz);
  const start = buf.count;
  for (let i = 0; i < 4; i += 1) {
    const du = CORNERS[i * 2];
    const dv = CORNERS[i * 2 + 1];
    const s1 = op(cx + ux * du, cy + uy * du, cz + uz * du);
    const s2 = op(cx + vx * dv, cy + vy * dv, cz + vz * dv);
    const c = op(cx + ux * du + vx * dv, cy + uy * du + vy * dv, cz + uz * du + vz * dv);
    const ao = s1 && s2 ? 0 : 3 - (s1 + s2 + c);
    AO[i] = ao;
    // Smooth block light: average the open cells around this corner.
    let lsum = l0;
    let ln = 1;
    if (!s1) {
      lsum += lt(cx + ux * du, cy + uy * du, cz + uz * du);
      ln += 1;
    }
    if (!s2) {
      lsum += lt(cx + vx * dv, cy + vy * dv, cz + vz * dv);
      ln += 1;
    }
    if (!c && !(s1 && s2)) {
      lsum += lt(cx + ux * du + vx * dv, cy + uy * du + vy * dv, cz + uz * du + vz * dv);
      ln += 1;
    }
    const v = start + i;
    const pu = du > 0 ? 1 : 0;
    const pv = dv > 0 ? 1 : 0;
    const a = AO_CURVE[ao];
    buf.blk[v] = lsum / ln / 15;
    buf.pos[v * 3] = bx + ux * pu + vx * pv;
    buf.pos[v * 3 + 1] = by + uy * pu + vy * pv;
    buf.pos[v * 3 + 2] = bz + uz * pu + vz * pv;
    buf.nrm[v * 3] = nx;
    buf.nrm[v * 3 + 1] = ny;
    buf.nrm[v * 3 + 2] = nz;
    buf.tuv[v * 2] = pu;
    buf.tuv[v * 2 + 1] = pv;
    buf.tile[v] = tile;
    buf.col[v * 3] = tint[0] * a;
    buf.col[v * 3 + 1] = tint[1] * a;
    buf.col[v * 3 + 2] = tint[2] * a;
    buf.glow[v] = glow;
  }
  // Flip the diagonal so AO gradients interpolate without seams.
  const k = (start / 4) * 6;
  const idx = buf.idx;
  if (AO[0] + AO[2] < AO[1] + AO[3]) {
    idx[k] = start;
    idx[k + 1] = start + 1;
    idx[k + 2] = start + 3;
    idx[k + 3] = start + 1;
    idx[k + 4] = start + 2;
    idx[k + 5] = start + 3;
  } else {
    idx[k] = start;
    idx[k + 1] = start + 1;
    idx[k + 2] = start + 2;
    idx[k + 3] = start;
    idx[k + 4] = start + 2;
    idx[k + 5] = start + 3;
  }
  buf.count += 4;
}

export function columnRand(x, z, salt = 0) {
  return ihash(x, z, salt);
}
