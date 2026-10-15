import * as THREE from "three";
import { TILE } from "./textures.js?v=20261015-world";
import { ihash, noise2 } from "./noise.js?v=20261015-world";

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
  constructor(x0, y0, z0, sx, sy, sz) {
    Object.assign(this, { x0, y0, z0, sx, sy, sz });
    this.data = new Uint8Array(sx * sy * sz);
    this.top = new Int16Array(sx * sz).fill(y0 - 1);
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

function tintFor(kind, x, z, top) {
  if (!kind) return [1, 1, 1];
  const n = noise2(x * 0.045, z * 0.045, 9) * 0.5 + noise2(x * 0.17, z * 0.17, 4) * 0.25;
  if (kind === "grass" || kind === "grassDark") {
    if (!top) return [1, 1, 1];
    const dark = kind === "grassDark" ? -0.1 : 0;
    // Drier, warmer greens near the coast; lush in the middle.
    const r = Math.hypot(x, z);
    const dry = Math.max(0, Math.min(1, (r - 70) / 50));
    return [0.92 + n * 0.12 + dry * 0.18 + dark, 1.0 + n * 0.08 + dark, 0.86 - n * 0.1 - dry * 0.12 + dark];
  }
  if (kind === "leaf") return [0.94 + n * 0.14, 1 + n * 0.1, 0.9 - n * 0.1];
  if (kind === "blossom") return [1, 0.94 + n * 0.08, 1 - n * 0.04];
  return [1, 1, 1];
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
      for (let y = y0; y <= yTop; y += 1) {
        const id = data[col + (y - y0)];
        if (!id) continue;
        const pass = PASS[id];
        if (!pass) continue;
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
  return out.map((buf) => (buf.count ? toGeometry(buf) : null));
}

function newBuffers() {
  return { pos: [], nrm: [], tuv: [], tile: [], col: [], glow: [], blk: [], idx: [], count: 0 };
}

function emitFace(buf, face, x, y, z, id, op, lt) {
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
  const ao = [0, 0, 0, 0];
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const start = buf.count;
  for (let i = 0; i < 4; i += 1) {
    const [du, dv] = corners[i];
    const s1 = op(cx + ux * du, cy + uy * du, cz + uz * du);
    const s2 = op(cx + vx * dv, cy + vy * dv, cz + vz * dv);
    const c = op(cx + ux * du + vx * dv, cy + uy * du + vy * dv, cz + uz * du + vz * dv);
    ao[i] = s1 && s2 ? 0 : 3 - (s1 + s2 + c);
    // Smooth block light: average the open cells around this corner.
    const l0 = lt(cx, cy, cz);
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
    buf.blk.push(lsum / ln / 15);
    const pu = du > 0 ? 1 : 0;
    const pv = dv > 0 ? 1 : 0;
    buf.pos.push(bx + ux * pu + vx * pv, by + uy * pu + vy * pv, bz + uz * pu + vz * pv);
    buf.nrm.push(nx, ny, nz);
    buf.tuv.push(pu, pv);
    buf.tile.push(tile);
    const a = AO_CURVE[ao[i]];
    buf.col.push(tint[0] * a, tint[1] * a, tint[2] * a);
    buf.glow.push(glow);
  }
  // Flip the diagonal so AO gradients interpolate without seams.
  if (ao[0] + ao[2] < ao[1] + ao[3]) buf.idx.push(start, start + 1, start + 3, start + 1, start + 2, start + 3);
  else buf.idx.push(start, start + 1, start + 2, start, start + 2, start + 3);
  buf.count += 4;
}

function toGeometry(buf) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(buf.pos, 3));
  g.setAttribute("normal", new THREE.Int8BufferAttribute(buf.nrm, 3, true));
  g.setAttribute("tuv", new THREE.Float32BufferAttribute(buf.tuv, 2));
  g.setAttribute("tile", new THREE.Float32BufferAttribute(buf.tile, 1));
  g.setAttribute("color", new THREE.Float32BufferAttribute(buf.col, 3));
  g.setAttribute("glow", new THREE.Float32BufferAttribute(buf.glow, 1));
  g.setAttribute("blight", new THREE.Float32BufferAttribute(buf.blk, 1));
  g.setIndex(buf.count > 65535 ? new THREE.Uint32BufferAttribute(buf.idx, 1) : new THREE.Uint16BufferAttribute(buf.idx, 1));
  g.computeBoundingSphere();
  g.computeBoundingBox();
  return g;
}

// Lambert material that samples the tile array and adds per-vertex glow.
export function voxelMaterial(tiles, shared, { transparent = false } = {}) {
  const mat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    transparent,
    depthWrite: !transparent,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTiles = { value: tiles };
    shader.uniforms.uTime = shared.uTime;
    shader.uniforms.uGlowBoost = shared.uGlowBoost;
    shader.uniforms.uBlockLight = shared.uBlockLight;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute vec2 tuv;
attribute float tile;
attribute float glow;
attribute float blight;
varying vec2 vTuv;
varying float vTile;
varying float vGlow;
varying float vBlock;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vTuv = tuv;
vTile = tile;
vGlow = glow;
vBlock = blight;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
precision highp sampler2DArray;
uniform sampler2DArray uTiles;
uniform float uTime;
uniform float uGlowBoost;
uniform float uBlockLight;
varying vec2 vTuv;
varying float vTile;
varying float vGlow;
varying float vBlock;`
      )
      .replace(
        "#include <map_fragment>",
        `vec2 tileUv = vTuv;
float layer = floor(vTile + 0.5);
if (abs(layer - ${TILE.portal.toFixed(1)}) < 0.5) {
  tileUv += vec2(sin(uTime * 0.7 + vTuv.y * 3.0) * 0.08, uTime * 0.18);
}
vec4 texel = texture(uTiles, vec3(tileUv, layer));
${transparent ? "" : "if (texel.a < 0.5) discard;"}
diffuseColor *= texel;
float glowPulse = abs(layer - ${TILE.portal.toFixed(1)}) < 0.5 ? 0.75 + 0.25 * sin(uTime * 2.3 + vTuv.y * 6.0) : 1.0;
totalEmissiveRadiance += texel.rgb * vGlow * mix(1.0, uGlowBoost, step(0.5, vGlow)) * glowPulse;
// Warm lantern light pools, strongest at night.
float flicker = 0.94 + 0.06 * sin(uTime * 7.0 + vTuv.x * 3.0);
totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.68, 0.36) * pow(vBlock, 2.2) * uBlockLight * flicker;`
      );
  };
  mat.customProgramCacheKey = () => `voxel-${transparent}`;
  return mat;
}

export function buildChunks(grid, material, transMaterial, { shadows = true } = {}) {
  if (!grid.light) computeBlockLight(grid);
  const group = new THREE.Group();
  group.name = "voxels";
  let faces = 0;
  for (let cx = grid.x0; cx < grid.x0 + grid.sx; cx += CHUNK) {
    for (let cz = grid.z0; cz < grid.z0 + grid.sz; cz += CHUNK) {
      const [opaque, trans] = meshChunk(grid, cx, cz);
      if (opaque) {
        const mesh = new THREE.Mesh(opaque, material);
        mesh.castShadow = shadows;
        mesh.receiveShadow = shadows;
        group.add(mesh);
        faces += opaque.attributes.position.count / 4;
      }
      if (trans) {
        const mesh = new THREE.Mesh(trans, transMaterial);
        mesh.renderOrder = 2;
        group.add(mesh);
        faces += trans.attributes.position.count / 4;
      }
    }
  }
  group.userData.faces = faces;
  return group;
}

export function columnRand(x, z, salt = 0) {
  return ihash(x, z, salt);
}
