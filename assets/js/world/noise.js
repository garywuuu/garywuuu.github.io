// Small deterministic noise helpers for terrain and texture painting.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Integer lattice hash in [0, 1).
export function ihash(x, z, seed = 0) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) + Math.imul(seed | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function ihash3(x, y, z, seed = 0) {
  return ihash(Math.imul(x | 0, 31) + (y | 0), z, seed + 17);
}

function smooth(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function gradient(out, i, ix, iz, seed) {
  const a = ihash(ix, iz, seed) * Math.PI * 2;
  out[i] = Math.cos(a);
  out[i + 1] = Math.sin(a);
}

// Corner gradients of the last lattice cell each seed sampled. Neighboring
// samples nearly always share a cell, so this skips most of the trig.
const CELLS = new Map();

function cellFor(x0, z0, seed) {
  let cell = CELLS.get(seed);
  if (!cell) {
    cell = { x0: NaN, z0: NaN, g: new Float64Array(8) };
    CELLS.set(seed, cell);
  }
  if (cell.x0 !== x0 || cell.z0 !== z0) {
    cell.x0 = x0;
    cell.z0 = z0;
    gradient(cell.g, 0, x0, z0, seed);
    gradient(cell.g, 2, x0 + 1, z0, seed);
    gradient(cell.g, 4, x0, z0 + 1, seed);
    gradient(cell.g, 6, x0 + 1, z0 + 1, seed);
  }
  return cell.g;
}

// Gradient noise in roughly [-1, 1].
export function noise2(x, z, seed = 0) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fz = z - z0;
  const g = cellFor(x0, z0, seed);
  const u = smooth(fx);
  const v = smooth(fz);
  const a = g[0] * fx + g[1] * fz;
  const b = g[2] * (fx - 1) + g[3] * fz;
  const c = g[4] * fx + g[5] * (fz - 1);
  const d = g[6] * (fx - 1) + g[7] * (fz - 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 1.414;
}

export function fbm(x, z, octaves = 4, seed = 0) {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum += noise2(x * freq, z * freq, seed + i * 101) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

// Sharp crests for mountain ranges, in [0, 1].
export function ridged(x, z, octaves = 4, seed = 0) {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  let weight = 1;
  for (let i = 0; i < octaves; i += 1) {
    let n = 1 - Math.abs(noise2(x * freq, z * freq, seed + i * 57));
    n *= n;
    n *= weight;
    weight = Math.min(1, n * 1.6);
    sum += n * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return sum / norm;
}

export function smoothstep(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
