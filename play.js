import * as THREE from "three";
import { createCatBrain } from "/assets/js/cat-brain.js?v=20261015-handwired";
import { buildTileArray } from "/assets/js/world/textures.js?v=20261015-world";
import { VoxelGrid, voxelMaterial, buildChunks } from "/assets/js/world/voxels.js?v=20261015-world";
import { generateTerrain, SEA_Y } from "/assets/js/world/terrain.js?v=20261015-world";
import { createEnvironment } from "/assets/js/world/env.js?v=20261015-world";
import { makeHeightTexture, makeWaterMaterial, makeOcean } from "/assets/js/world/water.js?v=20261015-world";
import { makeFoliage } from "/assets/js/world/foliage.js?v=20261015-world";
import { voxMaterial } from "/assets/js/world/voxkit.js?v=20261015-world";
import { buildCat, CAT_LOOKS, CAT_POSE } from "/assets/js/world/cats.js?v=20261015-world";
import { makeEmotes } from "/assets/js/world/emotes.js?v=20261015-world";
import { buildDragon, DRAGON_LOOKS } from "/assets/js/world/dragons.js?v=20261015-world";
import { makeFire } from "/assets/js/world/fire.js?v=20261015-world";
import { makeAmbient } from "/assets/js/world/ambient.js?v=20261015-world";

const decideCatMood = createCatBrain();

const FONT_FAMILY = getComputedStyle(document.body).fontFamily;

const WORLD = {
  size: 288,
  yMin: -14,
  yMax: 64,
  spawn: { x: 0.5, y: 1.2, z: 14.5 },
};

// Scene-wide handles shared by the builders and the frame loop.
const world = {};

const PALETTE = {
  grass: 0x5d9c3d,
  grassDark: 0x3f7a28,
  dirt: 0x866043,
  stone: 0x7a7a7a,
  stoneDark: 0x4f4f4f,
  cobble: 0x6b6b6b,
  wood: 0x6b4f2a,
  plank: 0xc49a5a,
  sand: 0xdbcfa3,
  water: 0x3f76e4,
  leaf: 0x3a8f2e,
  magenta: 0xc43cff,
  magentaDark: 0x6d1f99,
  ink: 0x1a1520,
  cream: 0xf4efe6,
  gold: 0xf0c14b,
  red: 0xb02e26,
  white: 0xf2f2f2,
  black: 0x1b1b1b,
  glass: 0x8ec8e8,
  orange: 0xe67a22,
  cyan: 0x2ec4b6,
  blue: 0x3c6fd0,
  cloud: 0xf7fbff,
  obsidian: 0x15051a,
  portal: 0x7a2bff,
  pink: 0xf2a6b3,
  amber: 0xffb703,
  lime: 0x8bd14a,
  emberGlow: 0xff6a2a,
  frostGlow: 0x9ae7ff,
  nightGlow: 0xb388ff,
  jadeGlow: 0x7dff9a,
};

const GAMES = [
  {
    id: "d5dbd405",
    slug: "neon-reflex",
    title: "Neon Reflex",
    short: "NEON",
    blurb: "One-more-round neon arcade.",
    x: -16,
    z: -5,
    wall: "magenta",
    trim: "magentaDark",
  },
  {
    id: "e2228c08",
    slug: "third-rally",
    title: "Third Rally",
    short: "RALLY",
    blurb: "Featured Instaplay racer.",
    x: -8,
    z: -5,
    wall: "orange",
    trim: "gold",
  },
  {
    id: "5e941910",
    slug: "voxel-safari",
    title: "Voxel Safari",
    short: "SAFARI",
    blurb: "A voxel game in the voxel lobby.",
    x: 8,
    z: -5,
    wall: "leaf",
    trim: "gold",
  },
  {
    id: "e2cbd201",
    slug: "blockfront",
    title: "Blockfront",
    short: "BLOCK",
    blurb: "Instaplay Blockfront.",
    x: 16,
    z: -5,
    wall: "cyan",
    trim: "blue",
  },
];

const MYSTERY = {
  id: "create",
  slug: "make-a-game",
  title: "Make a Game",
  short: "MAKE",
  blurb: "Walk through the portal to make an Instaplay game.",
  href: "https://www.instaplay.ai/create?new=1",
  action: "create",
  x: 0,
  z: -5,
  wall: "obsidian",
  trim: "portal",
};

const STALLS = [GAMES[0], GAMES[1], MYSTERY, GAMES[2], GAMES[3]];

const BOOTHS = STALLS.map((game) => ({
  game,
  x0: game.x - 3,
  x1: game.x + 3,
  z0: game.z - 5,
  z1: game.z + 1,
  doorZ: game.z + 1,
}));

const PAGES = [
  { id: "about", title: "About", href: "/", x0: -21, x1: -14, z0: 6, z1: 13, wall: "plank", roof: "wood", door: "east" },
  { id: "research", title: "Research", href: "/research/", x0: 14, x1: 21, z0: 6, z1: 13, wall: "stone", roof: "stoneDark", door: "west" },
  { id: "experience", title: "Experience", href: "/experience/", x0: -5, x1: 6, z0: 18, z1: 24, wall: "ink", roof: "gold", door: "north" },
];

const POIS = [
  ...GAMES.map((game, gameIndex) => ({
    id: `game-${game.slug}`,
    title: game.title,
    kicker: "Instaplay",
    body: game.blurb,
    action: "embed",
    gameIndex,
    actionLabel: `Play ${game.title}`,
    x: game.x + 0.5,
    z: game.z - 1,
    r: 2.8,
  })),
  {
    id: "create",
    title: MYSTERY.title,
    kicker: "Instaplay",
    body: MYSTERY.blurb,
    href: MYSTERY.href,
    action: "create",
    actionLabel: "Make a game",
    x: MYSTERY.x + 0.5,
    z: MYSTERY.z - 1,
    r: 2.8,
  },
  {
    id: "tower",
    title: "Instaplay Tower",
    kicker: "More games",
    body: "The product. Walk a booth to play, or open the full arcade here.",
    action: "arcade",
    actionLabel: "Open arcade",
    x: 0.5,
    z: -14,
    r: 3,
  },
  {
    id: "about",
    title: "About",
    kicker: "Gary Wu",
    body: "SF. Harvard CS. Trying to solve fun.",
    href: "/",
    action: "page",
    actionLabel: "Open about",
    x: -14.2,
    z: 9.5,
    r: 2.4,
  },
  {
    id: "research",
    title: "Research",
    kicker: "Papers",
    body: "Fairness, federated learning, encrypted inference, LLM routing.",
    href: "/research/?from=game",
    action: "page",
    actionLabel: "Open research",
    x: 14.2,
    z: 9.5,
    r: 2.4,
  },
  {
    id: "experience",
    title: "Experience",
    kicker: "Work",
    body: "Instaplay, Salesforce, Verita, Teradata, Alpaca.",
    href: "/experience/?from=game",
    action: "page",
    actionLabel: "Open experience",
    x: 0.5,
    z: 18.4,
    r: 2.6,
  },
  {
    id: "court",
    title: "Tennis Court",
    kicker: "Outside of work",
    body: "Serve a gold ball because the about page mentioned tennis.",
    action: "serve",
    actionLabel: "Serve",
    x: -18,
    z: -8,
    r: 3,
  },
  {
    id: "shelf",
    title: "Favorites Shelf",
    kicker: "Movies & games",
    body: "Dota 2, Valorant, Minecraft, Inception, Oppenheimer.",
    action: "look",
    x: -8.5,
    z: 16.2,
    r: 2.4,
  },
];

const SHELF = { x0: -12, x1: -6, z0: 16, z1: 17 };

function inShelf(ix, iz) {
  return inRect(ix, iz, SHELF.x0, SHELF.z0, SHELF.x1, SHELF.z1);
}

const MEDIA = [
  { id: "dota", title: "Dota 2", kicker: "Game", body: "One more ancient.", x: -10.5, z: 17.4, art: "/assets/images/covers/dota.jpg" },
  { id: "valorant", title: "Valorant", kicker: "Game", body: "Aim, then aim again.", x: -9.5, z: 17.4, art: "/assets/images/covers/valorant.png" },
  { id: "minecraft", title: "Minecraft", kicker: "Game", body: "The reason this lobby is made of blocks.", x: -8.5, z: 17.4, art: "/assets/images/covers/minecraft.jpg" },
  { id: "inception", title: "Inception", kicker: "Movie", body: "A dream about building worlds.", x: -7.5, z: 17.4, art: "/assets/images/covers/inception.jpg" },
  { id: "oppenheimer", title: "Oppenheimer", kicker: "Movie", body: "I am become death, destroyer of worlds.", x: -6.5, z: 17.4, art: "/assets/images/covers/oppenheimer.jpg" },
];

const CRITTERS = [
  { id: "tuxedo", x: 5.4, z: 8.2 },
  { id: "tabby", x: -6.2, z: 7.1 },
  { id: "calico", x: 2.1, z: 10.2 },
  { id: "siamese", x: 8.1, z: 6.8 },
  { id: "void", x: -3.4, z: 5.6 },
  { id: "cream", x: -8.1, z: 8.8 },
  { id: "gray", x: 7.4, z: 3.6 },
  { id: "cow", x: -1.2, z: 11.4 },
  { id: "ginger", x: 3.8, z: 4.4 },
  { id: "spot", x: -5.6, z: 4.2 },
  { id: "kitten", kitten: "tabby", slot: -0.42, x: -6.6, z: 6.4 },
  { id: "kitten", kitten: "tabby", slot: 0.42, x: -5.8, z: 6.2 },
  { id: "kitten", kitten: "calico", slot: 0.3, x: 2.6, z: 9.4 },
  { id: "kitten", kitten: "void", slot: -0.35, x: -3.9, z: 4.8 },
  { id: "kitten", kitten: "siamese", slot: 0.38, x: 8.6, z: 6 },
  { id: "ember", x: -18, z: -6, sky: true },
  { id: "frost", x: 16, z: 4, sky: true },
  { id: "night", x: 4, z: -18, sky: true },
  { id: "jade", x: -10, z: 14, sky: true },
];

const CAT_TOYS = [
  { id: "postA", kind: "post", x: -8.6, z: 12.6 },
  { id: "postB", kind: "post", x: 8.4, z: 12.4 },
  { id: "tree", kind: "tree", x: 9.2, z: 8.2 },
  { id: "yarnA", kind: "yarn", x: 0.4, z: 7.4, color: "red" },
  { id: "yarnB", kind: "yarn", x: -4.6, z: 9.2, color: "cyan" },
  { id: "yarnC", kind: "yarn", x: 4.8, z: 5.2, color: "gold" },
  { id: "wand", kind: "wand", x: -9.2, z: 5.4 },
];

function $(sel) {
  return document.querySelector(sel);
}

function hash(x, z) {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function hash3(x, y, z) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function inRect(x, z, x0, z0, x1, z1) {
  return x >= x0 && x <= x1 && z >= z0 && z <= z1;
}

function boothAt(ix, iz) {
  return BOOTHS.find((b) => inRect(ix, iz, b.x0, b.z0, b.x1, b.z1));
}

function pageAt(ix, iz) {
  return PAGES.find((p) => inRect(ix, iz, p.x0, p.z0, p.x1, p.z1));
}

function isDoor(ix, iy, iz, page) {
  if (iy < 1 || iy > 2) return false;
  if (page.door === "east" && ix === page.x1 && iz >= page.z0 + 2 && iz <= page.z1 - 2) return true;
  if (page.door === "west" && ix === page.x0 && iz >= page.z0 + 2 && iz <= page.z1 - 2) return true;
  if (page.door === "north" && iz === page.z0 && ix >= -1 && ix <= 2) return true;
  return false;
}

function pondAt(ix, iz) {
  return inRect(ix, iz, 16, -22, 24, -16);
}

// Plaza structures layered over the generated island. Returns a kind, null
// for carved air, or undefined to keep the terrain underneath.
function plazaBlock(ix, iy, iz) {
  if (iy < 0 || iy > 18) return undefined;

  if (inRect(ix, iz, -3, -20, 4, -13) && iy <= 10) {
    if (iy === 0) return "ink";
    if (ix === -3 || ix === 4 || iz === -20 || iz === -13) {
      if (iy <= 9) return (ix + iy + iz) % 2 === 0 ? "magenta" : "magentaDark";
    }
    if (iy === 10 && Math.abs(ix) <= 2 && iz >= -18 && iz <= -15) return "gold";
    if (iy === 9 && (ix === -2 || ix === 3) && (iz === -19 || iz === -14)) return "gold";
    if (iy >= 3 && iy <= 6 && ix === 0 && iz === -20) return "glass";
    if (iy >= 1 && iy <= 2 && Math.abs(ix) <= 1 && iz === -13) return null;
    if (iy > 0 && iy < 10 && ix > -3 && ix < 4 && iz > -20 && iz < -13) return null;
  }

  const booth = boothAt(ix, iz);
  if (booth && iy <= 6) {
    const { x0, x1, z0, z1, doorZ, game } = booth;
    const wall = ix === x0 || ix === x1 || iz === z0 || iz === z1;
    const midX = Math.floor((x0 + x1) / 2);
    if (game.action === "create") {
      const px0 = midX - 2;
      const px1 = midX + 2;
      if (iy === 0) {
        if (ix >= px0 && ix <= px1 && iz >= doorZ - 1 && iz <= doorZ + 1) return "obsidian";
        return (ix + iz) % 2 === 0 ? "stone" : "cobble";
      }
      if (iz !== doorZ || iy > 5) return null;
      if (ix === px0 || ix === px1) return "obsidian";
      if (iy === 5 && ix >= px0 && ix <= px1) return "obsidian";
      if (iy >= 1 && iy <= 4 && ix > px0 && ix < px1) return "portal";
      return null;
    }
    if (iy === 0) return iz === doorZ && ix !== x0 && ix !== x1 ? "gold" : "plank";
    if (iy === 6) {
      if (ix > x0 && ix < x1 && iz > z0 && iz < z1) return game.trim;
      return null;
    }
    if (iy === 5 && wall) return game.trim;
    if (wall) {
      if (iz === doorZ && ix > x0 + 1 && ix < x1 - 1 && iy <= 3) return null;
      if (iy >= 2 && iy <= 3 && iz === z0 && ix !== x0 && ix !== x1) return "glass";
      return (ix + iy + iz) % 2 === 0 ? game.wall : game.trim;
    }
    if (iy > 0 && iy < 5) return null;
  }

  const page = pageAt(ix, iz);
  if (page && iy <= 6) {
    const wall = ix === page.x0 || ix === page.x1 || iz === page.z0 || iz === page.z1;
    const midX = Math.floor((page.x0 + page.x1) / 2);
    const midZ = Math.floor((page.z0 + page.z1) / 2);
    if (iy === 0) return "plank";
    if (iy === 5 && wall) return page.roof;
    if (iy === 6 && ix > page.x0 && ix < page.x1 && iz > page.z0 && iz < page.z1) return page.roof;
    if (wall && iy <= 4) {
      if (isDoor(ix, iy, iz, page)) return null;
      return page.wall;
    }
    if (iy > 0 && iy < 5) return null;
  }

  if (inShelf(ix, iz) && iy <= 4) {
    if (iy === 0) return "plank";
    if (iz === SHELF.z1) {
      if (iy === 2 || iy === 4) return "wood";
      if (ix === SHELF.x0 || ix === SHELF.x1) return "wood";
      return null;
    }
    if ((ix === SHELF.x0 || ix === SHELF.x1) && iy <= 4) return "wood";
    return null;
  }

  if (inRect(ix, iz, -22, -12, -15, -5) && iy <= 1) {
    if (iy === 0) return (ix + iz) % 2 === 0 ? "sand" : "gold";
    if (ix === -22 || ix === -15 || iz === -12 || iz === -5) return "plank";
    return null;
  }

  if (pondAt(ix, iz) && iy <= 1) {
    if (iy === 0) return "water";
    if (ix === 16 || ix === 24 || iz === -22 || iz === -16) return "sand";
    return null;
  }

  if (iy === 0) {
    if (inRect(ix, iz, -20, -12, 24, 16)) {
      if (iz <= 2 && iz >= -12) return (ix + iz) % 2 === 0 ? "stone" : "cobble";
      if (Math.abs(ix) <= 1) return "cobble";
      if (iz >= 2 && iz <= 16 && Math.abs(ix) <= 2) return "cobble";
      if (iz >= 6 && iz <= 12 && (ix <= -13 || ix >= 13)) return "path";
    }
    if ((ix + iz) % 6 === 0 && inRect(ix, iz, -16, -12, 17, 3)) return "gold";
    if (inRect(ix, iz, 7, 17, 9, 26) || inRect(ix, iz, -1, -26, 2, -21)) return "path";
    return undefined;
  }

  if (iy === 1 && ix % 6 === 0 && (ix + iz) % 6 === 0 && inRect(ix, iz, -16, -12, 17, 3) && !boothAt(ix, iz) && !pageAt(ix, iz)) {
    return "gold";
  }

  return undefined;
}

let GRID = null;

function blockAt(x, y, z) {
  return GRID ? GRID.kind(Math.floor(x), Math.floor(y), Math.floor(z)) : null;
}

function solidAt(x, y, z) {
  if (!GRID) return false;
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  if (ix < GRID.x0 || iz < GRID.z0 || ix >= GRID.x0 + GRID.sx || iz >= GRID.z0 + GRID.sz) return false;
  return GRID.solid(ix, Math.floor(y), iz);
}

function groundH(ix, iz) {
  return GRID ? Math.max(GRID.surface(ix, iz), -12) : 0;
}

function colorFor(kind) {
  return PALETTE[kind] ?? PALETTE.stone;
}

function hexRgb(hex) {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

function shadeRgb(rgb, amount) {
  return rgb.map((c) => Math.max(0, Math.min(255, Math.round(c + amount))));
}

const TEX_CACHE = {};

function blockTexture(kind) {
  if (TEX_CACHE[kind]) return TEX_CACHE[kind];
  const size = 16;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const base = hexRgb(colorFor(kind));
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = hash3(x + 1, y + 3, kind.length + x * y);
      let rgb = base;
      if (kind === "grass" || kind === "grassDark") {
        rgb = shadeRgb(base, n > 0.55 ? 18 : n < 0.2 ? -22 : 0);
        if (y < 3) rgb = shadeRgb(rgb, 16);
        if (y > 12) rgb = shadeRgb(hexRgb(PALETTE.dirt), n > 0.5 ? 10 : -8);
      } else if (kind === "wood") {
        rgb = shadeRgb(base, x % 8 < 2 ? -28 : n > 0.7 ? 14 : -6);
      } else if (kind === "plank") {
        rgb = shadeRgb(base, y % 4 === 0 ? -30 : n > 0.6 ? 12 : 0);
      } else if (kind === "stone" || kind === "cobble" || kind === "stoneDark") {
        const crack = (x + y) % 7 === 0 || n > 0.86;
        rgb = shadeRgb(base, crack ? -28 : n > 0.5 ? 12 : -8);
      } else if (kind === "leaf") {
        rgb = shadeRgb(base, n > 0.65 ? 24 : n < 0.25 ? -20 : 0);
      } else if (kind === "sand") {
        rgb = shadeRgb(base, n > 0.7 ? 16 : n < 0.25 ? -14 : 0);
      } else if (kind === "dirt") {
        rgb = shadeRgb(base, n > 0.6 ? 14 : -10);
      } else if (kind === "cloud") {
        rgb = shadeRgb(base, n > 0.5 ? -8 : 0);
      } else if (kind === "glass" || kind === "water") {
        rgb = shadeRgb(base, (x + y) % 5 === 0 ? 30 : -10);
      } else if (kind === "obsidian") {
        rgb = shadeRgb(base, n > 0.8 ? 28 : n < 0.25 ? -18 : 0);
      } else if (kind === "portal") {
        rgb = shadeRgb(base, ((x + y * 3) % 6 === 0 ? 40 : n > 0.6 ? 18 : -24));
      } else {
        rgb = shadeRgb(base, n > 0.75 ? 22 : n < 0.2 ? -20 : 0);
      }
      if (x === 0 || y === 0) rgb = shadeRgb(rgb, 18);
      if (x === size - 1 || y === size - 1) rgb = shadeRgb(rgb, -22);
      const i = (y * size + x) * 4;
      image.data[i] = rgb[0];
      image.data[i + 1] = rgb[1];
      image.data[i + 2] = rgb[2];
      image.data[i + 3] = kind === "glass" ? 120 : kind === "water" ? 190 : kind === "portal" ? 170 : 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  TEX_CACHE[kind] = tex;
  return tex;
}

function signTexture(draw) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeSign(text, color, x, y, z, scaleX = 6.4, bg = "#3a2a18", rotY = 0) {
  const tex = signTexture((ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 128);
    if (bg === "#3a2a18") {
      ctx.fillStyle = "#2b2118";
      ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = "#c49a5a";
      ctx.fillRect(8, 8, 496, 112);
      ctx.fillStyle = bg;
      ctx.fillRect(16, 16, 480, 96);
    }
    ctx.fillStyle = color;
    ctx.font = `bold ${text.length > 12 ? 36 : 48}px ${FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 68);
  });
  const mat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(scaleX, scaleX * 0.28, 0.22), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  return mesh;
}

function coverFallback(item) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, 64, 96);
  ctx.fillStyle = "#f4efe6";
  ctx.font = `bold 8px ${FONT_FAMILY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(item.title.toUpperCase(), 32, 48);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function pixelateCover(image) {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 240;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const srcW = image.naturalWidth || image.width;
  const srcH = image.naturalHeight || image.height;
  const labelH = image.dataset.label ? 32 : 0;
  const boxW = canvas.width;
  const boxH = canvas.height - labelH;
  ctx.fillStyle = image.dataset.fitBg || "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const srcRatio = srcW / Math.max(1, srcH);
  const destRatio = boxW / boxH;
  if (image.dataset.fit === "contain") {
    let dw = boxW;
    let dh = boxH;
    let dx = 0;
    let dy = 0;
    if (srcRatio > destRatio) {
      dh = boxW / srcRatio;
      dy = (boxH - dh) / 2;
    } else {
      dw = boxH * srcRatio;
      dx = (boxW - dw) / 2;
    }
    ctx.drawImage(image, 0, 0, srcW, srcH, dx, dy, dw, dh);
  } else {
    let sx = 0;
    let sy = 0;
    let sw = srcW;
    let sh = srcH;
    if (srcRatio > destRatio) {
      sw = srcH * destRatio;
      sx = (srcW - sw) / 2;
    } else {
      sh = srcW / destRatio;
      sy = (srcH - sh) * 0.22;
    }
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, boxW, boxH);
  }
  if (image.dataset.label) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
    ctx.fillRect(0, boxH, canvas.width, labelH);
    ctx.fillStyle = image.dataset.labelColor || "#ffffff";
    ctx.font = `bold 16px ${FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(image.dataset.label, 80, boxH + labelH / 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeShelfPlaque() {
  const tex = signTexture((ctx) => {
    ctx.fillStyle = "#2b2118";
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = "#f0c14b";
    ctx.fillRect(8, 8, 496, 112);
    ctx.fillStyle = "#111111";
    ctx.font = `bold 54px ${FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FAVORITES", 256, 68);
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.7, 0.1), mat);
  mesh.position.set(-8.5, 4.5, SHELF.z1 - 0.06);
  return mesh;
}

function makeCover(item, x) {
  const mat = new THREE.MeshBasicMaterial({ map: coverFallback(item), side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.88, 0.12), mat);
  mesh.position.set(x, 3.5, SHELF.z1 + 0.2);
  const image = new Image();
  if (item.id === "valorant" || item.id === "minecraft" || item.id === "dota") {
    image.dataset.label = item.title.toUpperCase();
    image.dataset.labelColor = item.id === "valorant" ? "#ff4655" : item.id === "dota" ? "#f0c14b" : "#f4efe6";
    image.dataset.fit = "contain";
    image.dataset.fitBg = item.id === "minecraft" ? "#78a7ff" : "#050505";
  }
  image.onload = () => {
    mat.map = pixelateCover(image);
    mat.needsUpdate = true;
  };
  image.src = item.art;
  return mesh;
}

const BANNER = {
  x: 0.5,
  y: 11.4,
  z: -12.2,
  w: 11.6,
  h: 11.6 * 0.25,
  d: 0.9,
};

function bannerTop() {
  return BANNER.y + (BANNER.h + 0.28) * 0.5;
}

function hitsBanner(x, y, z, pad = 0.55) {
  return (
    Math.abs(x - BANNER.x) < BANNER.w * 0.5 + pad &&
    Math.abs(z - BANNER.z) < BANNER.d * 0.5 + pad &&
    y > BANNER.y - BANNER.h * 0.5 - 0.4 &&
    y < bannerTop() - 0.05
  );
}

function bannerPerch(slot = 0) {
  const spread = [-1.8, -0.6, 0.6, 1.8];
  return {
    x: BANNER.x + spread[slot % spread.length],
    y: bannerTop() + 0.62,
    z: BANNER.z + BANNER.d * 0.5 + 0.55,
  };
}

function makeInstaplaySign(x = BANNER.x, y = BANNER.y, z = BANNER.z, scaleX = BANNER.w) {
  const tex = signTexture((ctx) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = "#ff6600";
    ctx.fillRect(18, 38, 108, 52);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 24px ${FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("YC S26", 72, 65);
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.moveTo(148, 36);
    ctx.lineTo(196, 64);
    ctx.lineTo(148, 92);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(208, 36, 16, 56);
    ctx.fillStyle = "#111111";
    ctx.font = `bold 38px ${FONT_FAMILY}`;
    ctx.textAlign = "left";
    ctx.fillText("INSTAPLAY", 240, 66);
  });
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(scaleX + 0.28, scaleX * 0.25 + 0.28, BANNER.d),
    new THREE.MeshLambertMaterial({ map: blockTexture("stoneDark") })
  );
  const face = new THREE.Mesh(
    new THREE.BoxGeometry(scaleX, scaleX * 0.25, 0.18),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  face.position.z = BANNER.d * 0.5 + 0.02;
  group.add(frame);
  group.add(face);
  return group;
}

function buildWorld(scene, renderer, shared, quality) {
  const t0 = performance.now();
  const half = WORLD.size / 2;
  GRID = new VoxelGrid(-half, WORLD.yMin, -half, WORLD.size, WORLD.yMax - WORLD.yMin, WORLD.size);
  const { features, foliage } = generateTerrain(GRID, { plaza: plazaBlock });
  const t1 = performance.now();

  const tiles = buildTileArray(renderer);
  const voxelMat = voxelMaterial(tiles, shared);
  const glassMat = voxelMaterial(tiles, shared, { transparent: true });
  const voxels = buildChunks(GRID, voxelMat, glassMat, { shadows: quality.shadows });
  scene.add(voxels);
  const t2 = performance.now();

  const plants = makeFoliage(quality.lite ? foliage.filter((_, i) => i % 3 === 0) : foliage, tiles, shared);
  scene.add(plants);

  const heightTex = makeHeightTexture(GRID);
  world.stats = {
    gen: Math.round(t1 - t0),
    mesh: Math.round(t2 - t1),
    faces: voxels.userData.faces,
    plants: foliage.length,
  };
  world.features = features;
  world.tiles = tiles;
  world.heightTex = heightTex;

  scene.add(makeInstaplaySign());
  for (const booth of BOOTHS) {
    const title = booth.game.title.toUpperCase();
    const bg = booth.game.action === "create" ? "#15051a" : "#111111";
    const signW = booth.game.action === "create" ? 6.8 : 5.8;
    scene.add(makeSign(title, "#ffffff", booth.game.x + 0.5, 6.55, booth.z1 + 0.62, signW, bg));
  }
  for (const page of PAGES) {
    const doorLo = page.z0 + 2;
    const doorHi = page.z1 - 2;
    const doorZ = (doorLo + doorHi + 1) / 2;
    const width = 6.4;
    const pose =
      page.door === "east"
        ? { x: page.x1 + 1.22, y: 4.55, z: doorZ, rotY: Math.PI / 2 }
        : page.door === "west"
          ? { x: page.x0 - 0.22, y: 4.55, z: doorZ, rotY: -Math.PI / 2 }
          : { x: 1, y: 4.55, z: page.z0 - 0.22, rotY: Math.PI };
    scene.add(makeSign(page.title.toUpperCase(), "#ffffff", pose.x, pose.y, pose.z, width, "#111111", pose.rotY));
  }
  scene.add(makeShelfPlaque());
  for (const [idx, item] of MEDIA.entries()) scene.add(makeCover(item, -10.5 + idx));
}

function makeOrb(scene, index) {
  const game = GAMES[index];
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.42, 0.42),
    new THREE.MeshLambertMaterial({
      map: blockTexture(game.wall),
      emissive: colorFor(game.wall),
      emissiveIntensity: 0.35,
    })
  );
  mesh.position.set(game.x + 0.5, 1.45, game.z + 2.4);
  mesh.userData.baseY = 1.45;
  mesh.userData.phase = index;
  scene.add(mesh);
  return mesh;
}

function addBox(parent, kind, x, y, z, sx, sy, sz, extra = {}) {
  const layer = extra.layer || 0;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    new THREE.MeshLambertMaterial({
      map: extra.solid ? null : blockTexture(kind),
      color: extra.solid ? colorFor(kind) : 0xffffff,
      emissive: extra.emissive ?? 0x000000,
      emissiveIntensity: extra.glow ?? 0,
      polygonOffset: layer !== 0,
      polygonOffsetFactor: -layer,
      polygonOffsetUnits: -layer,
    })
  );
  mesh.position.set(x, y, z);
  if (extra.rx) mesh.rotation.x = extra.rx;
  if (extra.ry) mesh.rotation.y = extra.ry;
  if (extra.rz) mesh.rotation.z = extra.rz;
  parent.add(mesh);
  return mesh;
}

let critterMaterial = null;

function makeCritter(scene, spec) {
  const root = new THREE.Group();
  let parts = { wings: null, tail: null, legs: [] };
  if (spec.kitten) {
    // Kittens: mom's coat, smaller, with an even bigger head.
    parts = buildCat(root, CAT_LOOKS[spec.kitten], critterMaterial);
    root.scale.setScalar(0.56);
    parts.head.scale.setScalar(1.2);
  } else if (CAT_LOOKS[spec.id]) {
    parts = buildCat(root, CAT_LOOKS[spec.id], critterMaterial);
  } else if (DRAGON_LOOKS[spec.id]) {
    parts = buildDragon(root, DRAGON_LOOKS[spec.id], critterMaterial);
    root.rotation.order = "YXZ";
  } else {
    parts = buildCat(root, CAT_LOOKS.void, critterMaterial);
  }
  const sky = Boolean(spec.sky);
  const baseY = sky ? 15 + hash(spec.x, spec.z) * 7 : 1.02;
  root.position.set(spec.x, baseY, spec.z);
  root.userData = {
    id: spec.kitten ? `${spec.kitten} kitten` : spec.id,
    kitten: spec.kitten || null,
    slot: spec.slot || 0,
    kittenOf: null,
    emoteT: hash(spec.z, spec.x) * 1.5,
    heading: hash(spec.x, spec.z) * Math.PI * 2,
    speed: sky ? 7 : 0.95,
    timer: 1 + hash(spec.z, spec.x) * 2,
    sky,
    hop: !sky && (spec.id === "spot" || spec.id === "cream"),
    baseY,
    mood: "wander",
    moodT: 1.1 + hash(spec.x, spec.z) * 2.4,
    target: null,
    playWith: null,
    breath: 0,
    cool: 0,
    attention: 0,
    gait: hash(spec.x, spec.z) * Math.PI * 2,
    blinkOffset: hash(spec.x, spec.z) * 4.8,
    walkSpeed: sky ? 7 : 0.95,
    look: DRAGON_LOOKS[spec.id] || null,
    neck: parts.neck || null,
    jaw: parts.jaw || null,
    mouth: parts.mouth || null,
    bank: 0,
    prevHeading: null,
    climb: 0,
    wings: parts.wings || null,
    torso: parts.torso || null,
    head: parts.head || null,
    eyes: parts.eyes || [],
    ears: parts.ears || [],
    tail: parts.tail || null,
    tailMid: parts.tailMid || null,
    tailTip: parts.tailTip || null,
    legs: parts.legs || [],
    knees: parts.knees || [],
    feet: parts.feet || [],
  };
  scene.add(root);
  return root;
}

function roamOk(x, z, mode = "walk", y = null, allowBanner = false) {
  if (mode === "sky") {
    if (Math.hypot(x, z - 4) > 112) return false;
    if (!allowBanner && y != null && hitsBanner(x, y, z)) return false;
    return true;
  }
  if (x < -20 || x > 20 || z < -3.6 || z > 16.4) return false;
  if (inShelf(Math.floor(x), Math.floor(z))) return false;
  if (pageAt(Math.floor(x), Math.floor(z))) return false;
  if (boothAt(Math.floor(x), Math.floor(z))) return false;
  if (solidAt(x, 1.4, z)) return false;
  if (!solidAt(x, 0.4, z)) return false;
  return true;
}

function makeSpot(x, z, lookX, lookZ) {
  return { position: { x, z }, look: { x: lookX, z: lookZ } };
}

function catStands() {
  const spots = STALLS.map((stall) => makeSpot(stall.x + 0.5, stall.z + 2.35, stall.x + 0.5, stall.z - 1));
  spots.push(makeSpot(-12.7, 9.5, -16, 9.5));
  spots.push(makeSpot(12.7, 9.5, 16, 9.5));
  spots.push(makeSpot(0.5, 16.2, 0.5, 20));
  return spots.filter((spot) => roamOk(spot.position.x, spot.position.z));
}

function makeCatToys(scene) {
  const toys = [];
  for (const spec of CAT_TOYS) {
    const root = new THREE.Group();
    root.position.set(spec.x, 1.02, spec.z);
    if (spec.kind === "post") {
      addBox(root, "wood", 0, 0.08, 0, 0.42, 0.08, 0.42);
      addBox(root, "plank", 0, 0.7, 0, 0.22, 1.18, 0.22);
      addBox(root, "cream", 0, 0.7, 0, 0.26, 1.02, 0.08);
      addBox(root, "cream", 0, 0.7, 0, 0.08, 1.02, 0.26);
      addBox(root, "plank", 0, 1.36, 0, 0.5, 0.08, 0.5);
      addBox(root, "cream", 0, 1.44, 0, 0.36, 0.08, 0.36);
    } else if (spec.kind === "tree") {
      addBox(root, "wood", 0, 0.08, 0, 0.7, 0.08, 0.7);
      addBox(root, "plank", 0, 0.82, 0, 0.2, 1.5, 0.2);
      addBox(root, "cream", 0, 0.7, 0, 0.32, 0.7, 0.32);
      addBox(root, "cream", 0, 1.18, 0, 0.28, 0.5, 0.28);
      addBox(root, "plank", 0, 1.42, 0.28, 0.7, 0.08, 0.28);
      addBox(root, "cream", 0, 1.5, 0.28, 0.42, 0.08, 0.22);
      addBox(root, "gold", 0, 1.72, 0, 0.16, 0.16, 0.16, { glow: 0.2, emissive: colorFor("gold") });
    } else if (spec.kind === "yarn") {
      addBox(root, spec.color || "red", 0, 0.1, 0, 0.2, 0.2, 0.2);
      addBox(root, "cream", 0, 0.1, 0, 0.22, 0.04, 0.08);
      addBox(root, spec.color || "red", 0.12, 0.04, 0.1, 0.08, 0.04, 0.16);
    } else if (spec.kind === "wand") {
      addBox(root, "wood", 0, 0.42, 0, 0.05, 0.84, 0.05);
      addBox(root, "gold", 0, 0.9, 0, 0.08, 0.08, 0.08);
      addBox(root, "pink", 0.16, 0.96, 0, 0.22, 0.05, 0.05);
      addBox(root, "cyan", -0.12, 1.02, 0.08, 0.18, 0.05, 0.05);
      addBox(root, "gold", 0.04, 1.08, -0.1, 0.16, 0.05, 0.05);
    }
    root.userData = { ...spec, phase: hash(spec.x, spec.z) * 6, bounce: 0 };
    scene.add(root);
    toys.push(root);
  }
  return toys;
}

function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function steerToward(critter, x, z, turn) {
  const want = Math.atan2(x - critter.position.x, z - critter.position.z);
  const delta = wrapAngle(want - critter.userData.heading);
  const max = turn ?? 0.12;
  critter.userData.heading += THREE.MathUtils.clamp(delta, -max, max);
}

function faceToward(critter, x, z) {
  steerToward(critter, x, z, 0.18);
}

function stepToward(critter, x, z, dt, mode) {
  steerToward(critter, x, z, critter.userData.sky ? 0.08 : 0.14);
  const step = critter.userData.speed * dt;
  const nx = critter.position.x + Math.sin(critter.userData.heading) * step;
  const nz = critter.position.z + Math.cos(critter.userData.heading) * step;
  const ny = critter.userData.sky ? critter.position.y : null;
  const allowBanner = critter.userData.mood === "perch";
  if (roamOk(nx, nz, mode, ny, allowBanner)) {
    critter.position.x = nx;
    critter.position.z = nz;
    return true;
  }
  critter.userData.heading += 0.35;
  return false;
}

function playPoint(pal, side, gap) {
  const h = pal.userData.heading;
  const behind = gap;
  return {
    x: pal.position.x - Math.sin(h) * behind + Math.cos(h) * side,
    z: pal.position.z - Math.cos(h) * behind - Math.sin(h) * side,
  };
}

function bumpApart(a, b, minDist) {
  const dx = a.position.x - b.position.x;
  const dz = a.position.z - b.position.z;
  const d = Math.hypot(dx, dz) || 0.0001;
  if (d >= minDist) return d;
  const push = (minDist - d) * 0.45;
  const ux = dx / d;
  const uz = dz / d;
  const modeA = a.userData.sky ? "sky" : "walk";
  const modeB = b.userData.sky ? "sky" : "walk";
  const ax = a.position.x + ux * push;
  const az = a.position.z + uz * push;
  const bx = b.position.x - ux * push;
  const bz = b.position.z - uz * push;
  if (roamOk(ax, az, modeA)) {
    a.position.x = ax;
    a.position.z = az;
  }
  if (roamOk(bx, bz, modeB)) {
    b.position.x = bx;
    b.position.z = bz;
  }
  return d;
}

function separateGroup(list, minDist) {
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      bumpApart(list[i], list[j], minDist);
    }
  }
}

function startTag(chaser, pal, now) {
  const roll = hash(chaser.position.x + now * 0.001, pal.position.z);
  chaser.userData.cool = 1.6;
  pal.userData.cool = 1.2;
  if (chaser.userData.sky) {
    chaser.userData.mood = "circle";
    chaser.userData.playWith = pal;
    chaser.userData.moodT = 3.2;
    chaser.userData.speed = 4.4;
    chaser.userData.heading += (roll > 0.5 ? 1 : -1) * 1.1;
    pal.userData.mood = "chase";
    pal.userData.playWith = chaser;
    pal.userData.moodT = 3.4;
    pal.userData.speed = 5.0;
    return;
  }
  if (roll < 0.34) {
    setCatMood(chaser, "nuzzle", { playWith: pal, moodT: 1.8 });
    setCatMood(pal, "nuzzle", { playWith: chaser, moodT: 1.8 });
  } else if (roll < 0.67) {
    setCatMood(chaser, "swat", { playWith: pal, moodT: 1.6, swatLeg: 0 });
    setCatMood(pal, roll > 0.5 ? "pounce" : "stretch", { moodT: 1.4, speed: 0.2 });
  } else {
    setCatMood(chaser, "sit", { moodT: 1.5 });
    pal.userData.mood = "chase";
    pal.userData.playWith = chaser;
    pal.userData.moodT = 2.8;
    pal.userData.speed = 2.0;
    pal.userData.heading += Math.PI * 0.55;
  }
}

function nearestOther(critter, list) {
  let best = null;
  let bestD = Infinity;
  for (const other of list) {
    if (other === critter) continue;
    const d = Math.hypot(other.position.x - critter.position.x, other.position.z - critter.position.z);
    if (d < bestD) {
      best = other;
      bestD = d;
    }
  }
  return best;
}

function setCatMood(critter, mood, extra = {}) {
  const data = critter.userData;
  data.mood = mood;
  data.moodT = extra.moodT ?? 2.6;
  data.speed = extra.speed ?? 0;
  data.target = extra.target ?? null;
  data.playWith = extra.playWith ?? null;
  data.attention = extra.attention ?? (mood === "pet" ? data.moodT : 0);
  data.swatLeg = extra.swatLeg ?? (hash(critter.position.x, critter.position.z) > 0.5 ? 0 : 1);
}

function groundY(x, z) {
  return groundH(Math.floor(x), Math.floor(z)) + 1.02;
}

function poseDragon(critter, now, dt, sit) {
  const data = critter.userData;
  const blend = Math.min(1, dt * 5);
  const legs = data.legs || [];
  const knees = data.knees || [];
  const feet = data.feet || [];
  const flap = Math.sin(now / 180 + data.heading);
  // +Z faces the head; positive hip pitch tucks the legs back toward the tail.
  const flyHipX = [1.25 + flap * 0.08, 1.25 + flap * 0.08, 1.4 + flap * 0.06, 1.4 + flap * 0.06];
  const sitHipX = [0.22, 0.22, 0.98, 0.98];
  const flyHipZ = [-0.08, 0.08, -0.1, 0.1];
  const sitHipZ = [-0.06, 0.06, -0.18, 0.18];
  const flyKneeX = [-0.6, -0.6, -0.9, -0.9];
  const sitKneeX = [0.28, 0.28, -0.78, -0.78];
  for (const [i, leg] of legs.entries()) {
    if (!leg) continue;
    easeJoint(leg, THREE.MathUtils.lerp(flyHipX[i], sitHipX[i], sit), 0, THREE.MathUtils.lerp(flyHipZ[i], sitHipZ[i], sit), blend);
    if (knees[i]) easeJoint(knees[i], THREE.MathUtils.lerp(flyKneeX[i], sitKneeX[i], sit), 0, 0, blend);
    if (feet[i] && knees[i]) {
      // Compensate for the current joints, including during landing, so the
      // claws face forward instead of rotating along with the folded legs.
      const toePitch = THREE.MathUtils.lerp(0.1, 0.2, sit);
      feet[i].rotation.x = toePitch - leg.rotation.x - knees[i].rotation.x;
    }
  }
  if (data.neck) {
    // Neck stretches forward in flight and rises proudly when perched.
    const neckX = THREE.MathUtils.lerp(0.42 + Math.sin(now / 700 + data.heading) * 0.05, -0.12 + Math.sin(now / 1500 + data.baseY) * 0.06, sit);
    data.neck.rotation.x += (neckX - data.neck.rotation.x) * blend;
    data.neck.rotation.y += ((sit ? Math.sin(now / 1900 + data.baseY) * 0.25 : 0) - data.neck.rotation.y) * blend;
  }
  if (data.head) {
    const lookY = sit ? Math.sin(now / 1100 + data.baseY) * 0.32 + Math.sin(now / 2400 + data.heading) * 0.12 : 0;
    const lookX = sit ? 0.18 + Math.sin(now / 900 + data.baseY) * 0.1 : -0.3 + Math.sin(now / 640 + data.heading) * 0.05;
    data.head.rotation.x += (lookX - data.head.rotation.x) * blend;
    data.head.rotation.y += (lookY - data.head.rotation.y) * blend;
  }
  if (data.tail) {
    data.tail.rotation.x += ((sit ? 0.22 + Math.sin(now / 520) * 0.06 : 0) - data.tail.rotation.x) * blend;
    data.tail.rotation.y += ((1 - sit) * Math.sin(now / 260 + data.heading) * 0.28 + sit * Math.sin(now / 380 + data.baseY) * 0.22 - data.tail.rotation.y) * blend;
  }
  if (data.tailMid) data.tailMid.rotation.y += (((1 - sit) * Math.sin(now / 220 + data.heading) * 0.18 + sit * Math.sin(now / 300) * 0.16) - data.tailMid.rotation.y) * blend;
  if (data.tailTip) data.tailTip.rotation.y += (((1 - sit) * Math.sin(now / 180 + data.heading) * 0.22 + sit * Math.sin(now / 240) * 0.2) - data.tailTip.rotation.y) * blend;
}

function easeJoint(node, rx, ry, rz, t) {
  if (!node) return;
  node.rotation.x += (rx - node.rotation.x) * t;
  node.rotation.y += (ry - node.rotation.y) * t;
  node.rotation.z += (rz - node.rotation.z) * t;
}

function poseCat(critter, now, dt) {
  const data = critter.userData;
  const stand = data.target && (data.mood === "browse" || data.mood === "guard");
  const atStand = stand && Math.hypot(data.target.position.x - critter.position.x, data.target.position.z - critter.position.z) < 0.55;
  const moving = data.mood === "wander" || data.mood === "chase" || data.mood === "yarn" || data.mood === "scratch" || (stand && !atStand) || (data.mood === "pounce" && data.moodT <= 0.7);
  const pace = data.mood === "chase" ? 10 : data.mood === "yarn" ? 9 : 7.2;
  if (moving) data.gait += dt * pace;
  const walk = Math.sin(data.gait);
  const walkB = Math.sin(data.gait + Math.PI);
  const blend = Math.min(1, dt * 9);
  let torsoX = 0;
  let torsoZ = 0;
  let headX = 0;
  let headY = Math.sin(now / 1400 + data.baseY) * 0.06;
  let headZ = 0;
  const hips = [0, 0, 0, 0];
  const hipZ = [0, 0, 0, 0];
  let tail = [
    { x: 0.08, y: Math.sin(now / 420) * 0.08 },
    { x: 0.04, y: Math.sin(now / 360) * 0.1 },
    { x: 0.02, y: Math.sin(now / 300) * 0.08 },
  ];

  if (data.mood === "sit" || data.mood === "regal") {
    // Upright sit: chest raised, front legs straight, haunches folded.
    torsoX = data.mood === "regal" ? -0.42 : -0.34;
    hips[0] = -torsoX;
    hips[1] = -torsoX;
    hips[2] = -1.25;
    hips[3] = -1.25;
    tail = data.mood === "regal"
      ? [{ x: 0.55, y: 0.15 }, { x: 0.35, y: 0.1 }, { x: 0.2, y: 0.05 }]
      : [{ x: 0.18, y: 0.08 }, { x: 0.12, y: 0.06 }, { x: 0.08, y: 0.04 }];
    headX = (data.mood === "regal" ? 0.3 : 0.38) + Math.sin(now / 2200 + data.blinkOffset) * 0.06;
    headZ = Math.sin(now / 3100 + data.blinkOffset * 2) * 0.12;
  } else if (data.mood === "loaf") {
    // Paws tucked away, chin down: a sleepy bread loaf.
    hips[0] = 1.35;
    hips[1] = 1.35;
    hips[2] = -1.35;
    hips[3] = -1.35;
    headX = 0.12 + Math.sin(now / 1600) * 0.03;
    tail = [{ x: 0.15, y: 0 }, { x: 0.1, y: 0 }, { x: 0.05, y: 0 }];
  } else if (data.mood === "knead") {
    const a = (Math.sin(now / 120) + 1) * 0.5;
    hips[0] = 0.2 + a * 0.45;
    hips[1] = 0.2 + (1 - a) * 0.45;
    hips[2] = -1.12;
    hips[3] = -1.12;
  } else if (data.mood === "browse" && atStand) {
    torsoX = 0.04;
    headX = -0.08;
    headY = Math.sin(now / 700) * 0.1;
    hips[0] = 0.18;
    hips[1] = 0.18;
    hips[2] = -1.08;
    hips[3] = -1.08;
    tail = [{ x: 0.22, y: 0.06 }, { x: 0.14, y: 0.04 }, { x: 0.08, y: 0.02 }];
  } else if (data.mood === "guard" && atStand) {
    torsoX = -0.02;
    headX = -0.06;
    hips[0] = 0.12;
    hips[1] = 0.12;
    hips[2] = -1.18;
    hips[3] = -1.18;
    tail = [{ x: 0.55, y: 0.12 }, { x: 0.32, y: 0.08 }, { x: 0.18, y: 0.04 }];
  } else if (data.mood === "pet") {
    torsoX = 0.03;
    headX = 0.16 + Math.sin(now / 160) * 0.08;
    headY = Math.sin(now / 280) * 0.14;
    hips[0] = 0.18 + Math.abs(Math.sin(now / 130)) * 0.22;
    hips[1] = 0.12;
    hips[2] = -1.08;
    hips[3] = -1.08;
    tail = [
      { x: 0.12, y: Math.sin(now / 140) * 0.22 },
      { x: 0.1, y: Math.sin(now / 120) * 0.2 },
      { x: 0.08, y: Math.sin(now / 100) * 0.16 },
    ];
  } else if (data.mood === "swat") {
    const bat = Math.max(0, Math.sin(now / 100));
    const i = data.swatLeg || 0;
    hips[i] = 0.15 + bat * 0.85;
    hipZ[i] = (i ? 0.25 : -0.25) * bat;
    hips[i === 1 ? 0 : 1] = 0.2;
    hips[2] = -0.25;
    hips[3] = -0.25;
    headY = (i ? 0.1 : -0.1);
    tail = [{ x: 0.05, y: Math.sin(now / 90) * 0.2 }, { x: 0.05, y: Math.sin(now / 80) * 0.18 }, { x: 0.04, y: Math.sin(now / 70) * 0.16 }];
  } else if (data.mood === "stretch") {
    torsoX = 0.16;
    hips[0] = 0.7;
    hips[1] = 0.7;
    hips[2] = -0.45;
    hips[3] = -0.45;
    tail = [{ x: -0.12, y: 0 }, { x: -0.08, y: 0 }, { x: -0.04, y: 0 }];
  } else if (data.mood === "roll") {
    torsoZ = Math.sin(now / 420) * 0.28;
    hips[0] = 0.45;
    hips[1] = 0.35;
    hips[2] = 0.4;
    hips[3] = 0.3;
  } else if (data.mood === "pounce") {
    const crouch = data.moodT > 0.7;
    torsoX = crouch ? 0.14 : -0.06;
    hips[0] = crouch ? 0.45 : 0.25;
    hips[1] = crouch ? 0.45 : 0.25;
    hips[2] = crouch ? 0.15 : -0.25;
    hips[3] = crouch ? 0.15 : -0.25;
  } else if (data.mood === "groom") {
    headX = 0.28;
    headZ = 0.22;
    hips[0] = 0.55 + Math.sin(now / 150) * 0.2;
    hips[1] = 0.15;
    hips[2] = -0.2;
    hips[3] = -0.2;
  } else if (data.mood === "nuzzle") {
    headX = 0.08;
    headY = Math.sin(now / 240) * 0.1;
    hips[0] = 0.12;
    hips[1] = 0.12;
    hips[2] = -0.12;
    hips[3] = -0.12;
    tail = [{ x: 0.05, y: Math.sin(now / 140) * 0.18 }, { x: 0.06, y: Math.sin(now / 120) * 0.16 }, { x: 0.05, y: Math.sin(now / 100) * 0.14 }];
  } else if (data.mood === "scratch") {
    hips[0] = Math.sin(now / 80) * 0.55;
    hips[1] = Math.sin(now / 80 + 1) * 0.55;
    hips[2] = -0.1;
    hips[3] = -0.1;
  } else if (moving) {
    hips[0] = walk * 0.42;
    hips[1] = walkB * 0.42;
    hips[2] = walkB * 0.38;
    hips[3] = walk * 0.38;
    const wag = data.mood === "chase" || data.mood === "yarn" ? 0.22 : 0.12;
    tail = [
      { x: 0.06, y: Math.sin(now / 180 + data.gait) * wag },
      { x: 0.05, y: Math.sin(now / 150 + data.gait + 0.4) * wag },
      { x: 0.04, y: Math.sin(now / 120 + data.gait + 0.8) * wag },
    ];
  }

  easeJoint(data.torso, torsoX, 0, torsoZ, blend);
  if (data.torso) {
    const sitLow = data.mood === "sit" || data.mood === "regal" || data.mood === "knead" || data.mood === "loaf" || data.mood === "pet" || data.mood === "browse" || data.mood === "guard";
    const wantY = data.mood === "loaf" ? CAT_POSE.loafY : sitLow ? CAT_POSE.sitY : CAT_POSE.standY;
    data.torso.position.y += (wantY - data.torso.position.y) * blend;
  }
  easeJoint(data.head, headX, headY, headZ, blend);
  const blinkPhase = (now / 1000 + data.blinkOffset) % 4.8;
  const eyeOpen = blinkPhase < 0.16 ? 0.08 : data.mood === "loaf" ? 0.1 : data.mood === "pet" || data.mood === "nuzzle" ? 0.3 : 1;
  for (const eye of data.eyes) eye.scale.y += (eyeOpen - eye.scale.y) * Math.min(1, dt * 24);
  for (const [i, ear] of data.ears.entries()) {
    const twitch = Math.max(0, Math.sin(now / 680 + data.gait + i * 2)) ** 12;
    easeJoint(ear, twitch * 0.12, 0, (i ? 1 : -1) * (twitch * 0.18 - 0.12), blend);
  }
  for (const [i, leg] of data.legs.entries()) {
    if (!leg) continue;
    easeJoint(leg, hips[i], 0, hipZ[i], blend);
  }
  const tailLift = data.mood === "loaf" || data.mood === "sit" ? 0.25 : 0.9;
  easeJoint(data.tail, tail[0].x + tailLift, tail[0].y, 0, blend);
  easeJoint(data.tailMid, tail[1].x, tail[1].y, 0, blend);
  easeJoint(data.tailTip, tail[2].x + 0.6, tail[2].y, 0, blend);
}

function pickCatMood(critter, cats, toys) {
  const roll = hash(critter.position.x * 7 + critter.userData.timer, critter.position.z * 3);
  const yarn = toys.filter((item) => item.userData.kind === "yarn");
  const posts = toys.filter((item) => item.userData.kind === "post" || item.userData.kind === "tree" || item.userData.kind === "wand");
  const stands = catStands();
  const pal = nearestOther(critter, cats);
  const decision = decideCatMood({
    roll,
    stand: stands.length > 0,
    friend: Boolean(pal),
    yarn: yarn.length > 0,
    post: posts.length > 0,
    walkSpeed: critter.userData.walkSpeed,
  });
  // Handwired chooses the behavior; the host resolves scene references.
  const candidates = { stand: stands, yarn, post: posts }[decision.target];
  const factor = { stand: 11, yarn: 8, post: 9 }[decision.target];
  const target = candidates?.length
    ? candidates[Math.floor(roll * candidates.length * factor) % candidates.length]
    : null;
  setCatMood(critter, decision.mood, {
    target,
    playWith: decision.target === "friend" ? pal : null,
    moodT: decision.moodT,
    speed: decision.speed,
    ...(decision.mood === "swat" ? { swatLeg: decision.swatLeg } : {}),
  });
}

function nestPerch() {
  const nest = world.features?.peak;
  if (!nest?.perchY) return null;
  return { x: nest.x + 0.5, y: nest.perchY + 0.86, z: nest.z + 2.1, nest: true };
}

const DRAGON_TOUR = () => {
  const f = world.features || {};
  const spots = [{ x: 0, z: 6 }, { x: 0, z: 40 }, { x: -30, z: -10 }, { x: 30, z: 20 }];
  for (const k of ["lighthouse", "torii", "windmill", "peak"]) if (f[k]) spots.push({ x: f[k].x, z: f[k].z });
  return spots;
};

function sendToPerch(critter, slot = 0, hold = 10, spot = null) {
  const perch = spot || bannerPerch(slot);
  critter.userData.mood = "perch";
  critter.userData.playWith = null;
  critter.userData.target = perch;
  critter.userData.moodT = hold;
  critter.userData.speed = 7.2;
}

function greetPerch(dragons) {
  if (!dragons.length) return;
  const already = dragons.find((d) => d.userData.mood === "perch");
  if (already) return;
  let best = dragons[0];
  let bestD = Infinity;
  for (const dragon of dragons) {
    const d = Math.hypot(BANNER.x - dragon.position.x, BANNER.z - dragon.position.z);
    if (d < bestD) {
      best = dragon;
      bestD = d;
    }
  }
  sendToPerch(best, 1, 12);
}

function pickDragonMood(critter, dragons) {
  const roll = hash(critter.position.x * 5, critter.position.z + critter.userData.timer);
  const perched = dragons.filter((other) => other !== critter && other.userData.mood === "perch");
  const nest = nestPerch();
  const nestTaken = dragons.some((other) => other !== critter && other.userData.mood === "perch" && other.userData.target?.nest);
  if (roll < 0.1 && nest && !nestTaken) {
    sendToPerch(critter, 0, 12 + roll * 30, nest);
    return;
  }
  if (roll < 0.22 && perched.length === 0) {
    sendToPerch(critter, Math.floor(roll * 20), 8.5 + roll * 4);
    return;
  }
  if (roll < 0.42 && dragons.length > 1) {
    const pal = nearestOther(critter, dragons);
    if (pal) {
      critter.userData.mood = roll < 0.22 ? "chase" : "circle";
      critter.userData.playWith = pal;
      critter.userData.moodT = 4.5 + roll * 3;
      critter.userData.speed = roll < 0.22 ? 5.4 : 4.2;
      return;
    }
  }
  if (roll < 0.72) {
    critter.userData.mood = "breath";
    critter.userData.moodT = 1.6 + roll;
    critter.userData.breath = critter.userData.moodT;
    critter.userData.speed = 2.4;
    return;
  }
  if (roll < 0.88) {
    // Sightseeing: glide out to a landmark and circle back.
    const spots = DRAGON_TOUR();
    const spot = spots[Math.floor(hash(roll * 31, critter.userData.baseY) * spots.length) % spots.length];
    critter.userData.mood = "tour";
    critter.userData.playWith = null;
    critter.userData.target = { x: spot.x + (roll - 0.8) * 20, z: spot.z };
    critter.userData.moodT = 22;
    critter.userData.speed = 9;
    return;
  }
  critter.userData.mood = "wander";
  critter.userData.playWith = null;
  critter.userData.moodT = 3 + roll * 3;
  critter.userData.speed = critter.userData.walkSpeed;
}

function makeBall(scene) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.32, 0.32),
    new THREE.MeshLambertMaterial({
      map: blockTexture("gold"),
      emissive: PALETTE.gold,
      emissiveIntensity: 0.25,
    })
  );
  mesh.position.set(-18, 1.4, -8);
  mesh.visible = false;
  scene.add(mesh);
  return mesh;
}

function poiNear(px, pz) {
  let best = null;
  let bestD = Infinity;
  const spots = [
    ...POIS,
    ...MEDIA.map((item) => ({ ...item, action: "look", r: 1.4 })),
  ];
  for (const s of spots) {
    const d = Math.hypot(px - s.x, pz - s.z);
    if (d < s.r && d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

let cardTimer = 0;

function showCard(poi, onAction) {
  const card = $("#playCard");
  if (!card) return;
  $("#playCardKicker").textContent = poi.kicker;
  $("#playCardTitle").textContent = poi.title;
  $("#playCardBody").textContent = poi.body;
  const actions = $("#playCardActions");
  actions.innerHTML = "";
  if (poi.actionLabel) {
    const btn = document.createElement(poi.href ? "a" : "button");
    btn.className = "playCta small";
    btn.textContent = poi.actionLabel;
    if (poi.href) {
      btn.href = poi.href;
    } else {
      btn.type = "button";
      btn.addEventListener("click", () => onAction(poi));
    }
    actions.append(btn);
  }
  card.hidden = false;
  card.classList.remove("isLeaving");
  window.clearTimeout(cardTimer);
  cardTimer = window.setTimeout(() => hideCard(), 2600);
}

function hideCard() {
  const card = $("#playCard");
  if (!card || card.hidden) return;
  window.clearTimeout(cardTimer);
  card.classList.add("isLeaving");
  cardTimer = window.setTimeout(() => {
    card.hidden = true;
    card.classList.remove("isLeaving");
  }, 280);
}

function failWorld(err) {
  console.error(err);
  const intro = $("#playIntro");
  if (!intro) return;
  intro.hidden = false;
  const hi = intro.querySelector(".playIntroHi");
  const lead = intro.querySelector(".playIntroLead");
  if (hi) hi.textContent = "oops";
  if (lead) lead.textContent = "the world failed to load. hard refresh.";
}

function startWorld() {
  const canvas = $("#world");
  if (!canvas) return;
  try {

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const params = new URLSearchParams(window.location.search);
  const lite = coarse || params.has("lite");
  const quality = {
    lite,
    shadows: !lite,
    shadowSize: 2048,
    bloom: !lite,
  };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1 : 1.25));
  const stage = canvas.parentElement;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(70, 1, 0.08, 1200);
  camera.position.set(WORLD.spawn.x, WORLD.spawn.y, WORLD.spawn.z);

  const timeParam = params.get("time");
  const env = createEnvironment({
    scene,
    renderer,
    camera,
    quality,
    startTime: timeParam != null ? Number(timeParam) : 0.14,
  });
  if (timeParam != null && params.has("freeze")) env.state.frozen = true;

  buildWorld(scene, renderer, env.shared, quality);

  const ocean = makeOcean(makeWaterMaterial(env.sky.uniforms, world.heightTex, GRID, SEA_Y), SEA_Y);
  scene.add(ocean);
  const pondMat = makeWaterMaterial(env.sky.uniforms, world.heightTex, GRID, 0.86);
  const pond = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), pondMat);
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(20.5, 0.86, -18.5);
  scene.add(pond);
  const waters = [ocean.material, pondMat];

  const orbs = GAMES.map((_, i) => makeOrb(scene, i));
  const ball = makeBall(scene);
  const catToys = makeCatToys(scene);
  critterMaterial = voxMaterial(env.shared);
  const critters = CRITTERS.map((spec) => makeCritter(scene, spec));
  const cats = critters.filter((c) => !c.userData.sky);
  const dragons = critters.filter((c) => c.userData.sky);
  greetPerch(dragons);
  for (const kit of cats) {
    if (kit.userData.kitten) kit.userData.kittenOf = cats.find((c) => c.userData.id === kit.userData.kitten) || null;
  }
  const emotes = makeEmotes(scene);
  const fire = makeFire(scene, quality.lite ? 400 : 900);
  fire.setSize(window.innerHeight * renderer.getPixelRatio());
  const ambient = makeAmbient({ scene, features: world.features, groundH, shared: env.shared, material: critterMaterial, quality });
  ambient.setSize(window.innerHeight * renderer.getPixelRatio());
  const firePos = new THREE.Vector3();
  const fireDir = new THREE.Vector3();
  const adultCats = cats.filter((c) => !c.userData.kitten);
  const kittens = cats.filter((c) => c.userData.kitten);
  const KITTEN_PLAY = ["sit", "swat", "groom", "sit", "pounce", "roll", "loaf"];
  const MOM_MOVING = new Set(["wander", "chase", "yarn", "scratch", "pounce", "circle", "nuzzle"]);
  function updateKitten(kit, now, dt) {
    const data = kit.userData;
    const mom = data.kittenOf;
    data.timer -= dt;
    data.moodT -= dt;
    if (data.mood === "pet" && data.moodT > 0) {
      faceToward(kit, player.x, player.z);
      if (Math.hypot(player.x - kit.position.x, player.z - kit.position.z) > 2.8) data.moodT = 0;
    } else {
      const aim = playPoint(mom, data.slot, 0.62);
      const dist = Math.hypot(aim.x - kit.position.x, aim.z - kit.position.z);
      if (dist > 5) {
        kit.position.x = aim.x;
        kit.position.z = aim.z;
      } else if (dist > (MOM_MOVING.has(mom.userData.mood) ? 0.2 : 0.45)) {
        data.mood = dist > 1.4 ? "chase" : "wander";
        data.speed = Math.min(2.8, 0.7 + dist * 1.1);
        stepToward(kit, aim.x, aim.z, dt, "walk");
      } else {
        if (data.timer <= 0 || data.mood === "wander" || data.mood === "chase") {
          const napping = mom.userData.mood === "loaf" || mom.userData.mood === "sit";
          const pick = napping && Math.random() < 0.5 ? "loaf" : KITTEN_PLAY[Math.floor(Math.random() * KITTEN_PLAY.length)];
          data.mood = pick;
          data.moodT = 3;
          data.swatLeg = Math.random() < 0.5 ? 0 : 1;
          data.timer = 2 + Math.random() * 3.5;
        }
        if (data.mood === "pounce" && data.moodT < 0.7) data.moodT = 3;
        if (data.mood !== "loaf") faceToward(kit, mom.position.x, mom.position.z);
      }
    }
    kit.rotation.y = data.heading;
    const floor = groundY(kit.position.x, kit.position.z);
    const hop = data.mood === "chase" || data.mood === "wander" ? Math.abs(Math.sin(data.gait)) * 0.05 : 0;
    kit.position.y = floor + hop;
    poseCat(kit, now, dt);
  }
  const headPos = new THREE.Vector3();
  function emoteAbove(cat, kind, lift = 0.32, opts = {}) {
    (cat.userData.head || cat).getWorldPosition(headPos);
    emotes.spawn(kind, headPos.x, headPos.y + lift * cat.scale.y, headPos.z, opts);
  }
  if (params.has("dragondemo")) {
    // Screenshot lineup: hovering, banking, fire-breathing and perched.
    const spots = [
      { x: -4, y: 6.5, z: 2, mood: "tour", heading: 0.6 },
      { x: 4.5, y: 5.5, z: 3, mood: "breath", heading: -0.9 },
      { x: 0, y: 1.9, z: -1, mood: "perch", heading: 0.15 },
      { x: -1, y: 9.5, z: -6, mood: "tour", heading: 2.2, turn: 0.9 },
    ];
    dragons.forEach((d, i) => {
      const spot = spots[i % spots.length];
      d.position.set(spot.x, spot.y, spot.z);
      d.userData.baseY = spot.y;
      d.userData.heading = spot.heading;
      d.userData.demo = spot.mood;
      d.userData.demoTurn = spot.turn || 0;
      d.userData.target = spot.mood === "perch" ? { x: spot.x, y: spot.y, z: spot.z } : null;
    });
  }
  if (params.has("catdemo")) {
    // Screenshot lineup: every coat in a different mood, facing the camera.
    const moods = ["sit", "wander", "loaf", "pet", "regal", "knead", "sit", "groom", "wander", "stretch"];
    const adults = cats.filter((c) => !c.userData.kitten);
    const kits = cats.filter((c) => c.userData.kitten);
    adults.forEach((cat, i) => {
      cat.position.x = -1.75 + (i % 5) * 0.88;
      cat.position.z = 10.2 - Math.floor(i / 5) * 1.1;
      cat.userData.demo = moods[i % moods.length];
      cat.userData.heading = 0;
    });
    const kitMoods = ["sit", "loaf", "pet", "wander", "swat"];
    kits.forEach((cat, i) => {
      cat.position.x = -1.3 + i * 0.68;
      cat.position.z = 11.2;
      cat.userData.demo = kitMoods[i % kitMoods.length];
      cat.userData.kittenOf = null;
      cat.userData.heading = 0;
    });
  }
  let ballVel = new THREE.Vector3();
  let ballLive = false;

  const player = {
    x: WORLD.spawn.x,
    y: WORLD.spawn.y,
    z: WORLD.spawn.z,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: 0,
    pitch: -0.08,
    grounded: false,
  };

  const keys = new Set();
  const touch = { forward: false, back: false, left: false, right: false, look: false, jx: 0, jz: 0 };
  let locked = false;
  let lastPoi = null;
  let lastAutoGame = null;
  let pointerDx = 0;
  let pointerDy = 0;
  let running = true;
  let last = performance.now();
  let arcadeOpen = false;
  let activeGame = 0;

  // ?cam=x,y,z,yaw,pitch pins the camera for screenshots.
  const camParam = new URLSearchParams(window.location.search).get("cam");
  const debugCam = camParam ? camParam.split(",").map(Number) : null;

  const intro = $("#playIntro");
  const promptEl = $("#playPrompt");
  const statsEl = $("#playStats");
  const helpEl = $("#playHelp");
  const crosshair = $("#crosshair");
  const orbCount = $("#orbCount");
  const mapEl = $("#gameMap");
  const overlay = $("#arcadeOverlay");
  const frame = $("#arcadeFrame");
  const arcadeTitle = $("#arcadeTitle");
  const arcadeExternal = $("#arcadeExternal");
  const arcadePicks = $("#arcadePicks");

  frame?.addEventListener("load", () => {
    if (!arcadeOpen || !frame?.src) return;
    const game = GAMES[activeGame];
    if (promptEl && game) promptEl.textContent = `Playing ${game.title}`;
  });
  frame?.addEventListener("error", () => {
    if (promptEl) promptEl.textContent = "Embed blocked. Use Open on Instaplay.";
  });

  function resize() {
    const w = stage?.clientWidth || window.innerWidth;
    const h = stage?.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    env.setSize(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    fire.setSize(h * renderer.getPixelRatio());
    ambient.setSize(h * renderer.getPixelRatio());
  }
  window.addEventListener("resize", resize);
  resize();

  function tryLock() {
    canvas.requestPointerLock();
  }

  function bindPad() {
    if (document.querySelector(".playPad")) return;
    const pad = document.createElement("div");
    pad.className = "playPad";
    pad.innerHTML = `
      <div class="playStick">
        <div class="playStickBase" aria-label="Move stick">
          <div class="playStickKnob"></div>
        </div>
      </div>
      <button type="button" class="playUseBtn" data-dir="use" aria-label="Use">E</button>
    `;
    document.body.append(pad);

    const base = pad.querySelector(".playStickBase");
    const knob = pad.querySelector(".playStickKnob");
    const maxR = 44;
    let stickId = null;

    function setJoy(x, z) {
      touch.jx = Math.max(-1, Math.min(1, x / maxR));
      touch.jz = Math.max(-1, Math.min(1, z / maxR));
      if (knob) knob.style.transform = `translate(${Math.round(touch.jx * maxR)}px, ${Math.round(touch.jz * maxR)}px)`;
    }
    function releaseJoy() {
      touch.jx = 0;
      touch.jz = 0;
      if (knob) knob.style.transform = "translate(0, 0)";
      stickId = null;
    }
    function stickMove(e) {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const r = Math.hypot(dx, dy);
      const clamped = Math.min(r, maxR);
      const ang = Math.atan2(dy, dx);
      setJoy(Math.cos(ang) * clamped, Math.sin(ang) * clamped);
    }
    base?.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      base.setPointerCapture(e.pointerId);
      stickId = e.pointerId;
      stickMove(e);
    });
    base?.addEventListener("pointermove", (e) => {
      if (stickId !== e.pointerId) return;
      e.preventDefault();
      stickMove(e);
    });
    base?.addEventListener("pointerup", (e) => {
      if (stickId !== e.pointerId) return;
      e.preventDefault();
      releaseJoy();
    });
    base?.addEventListener("pointercancel", (e) => {
      if (stickId !== e.pointerId) return;
      e.preventDefault();
      releaseJoy();
    });
    base?.addEventListener("pointerleave", (e) => {
      if (stickId !== e.pointerId) return;
      e.preventDefault();
      releaseJoy();
    });

    const useBtn = pad.querySelector("[data-dir=\"use\"]");
    useBtn?.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      useNearby();
    });

    if (document.querySelector(".playLook")) return;
    const look = document.createElement("div");
    look.className = "playLook";
    document.body.append(look);
    let lookId = null;
    let lastX = 0;
    let lastY = 0;
    look.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      look.setPointerCapture(e.pointerId);
      lookId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    look.addEventListener("pointermove", (e) => {
      if (lookId !== e.pointerId) return;
      e.preventDefault();
      pointerDx += (e.clientX - lastX) * 0.55;
      pointerDy += (e.clientY - lastY) * 0.55;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    const endLook = (e) => {
      if (lookId !== e.pointerId) return;
      e.preventDefault();
      lookId = null;
    };
    look.addEventListener("pointerup", endLook);
    look.addEventListener("pointercancel", endLook);
    look.addEventListener("pointerleave", endLook);
  }

  function openCreate() {
    hideCard();
    if (document.pointerLockElement) document.exitPointerLock();
    window.location.href = MYSTERY.href;
  }

  function warpToStall(idx) {
    const stall = STALLS[idx];
    if (!stall) return;
    if (stall.action === "create") {
      openCreate();
      return;
    }
    const gameIndex = GAMES.indexOf(stall);
    player.x = stall.x + 0.5;
    player.y = 1.05;
    player.z = stall.z + 3.2;
    player.yaw = 0;
    player.vx = player.vy = player.vz = 0;
    lastAutoGame = null;
    openArcade(gameIndex);
  }

  function renderMap(activeIndex = -1) {
    if (!mapEl) return;
    mapEl.innerHTML = "";
    for (const [idx, stall] of STALLS.entries()) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gameMapBtn";
      btn.dataset.tone = stall.wall;
      btn.innerHTML = `<span>${idx + 1}</span>${stall.title}`;
      if (stall.action !== "create" && GAMES.indexOf(stall) === activeIndex) {
        btn.setAttribute("aria-current", "true");
      }
      btn.addEventListener("click", () => warpToStall(idx));
      mapEl.append(btn);
    }
    mapEl.hidden = false;
  }

  function embedUrl(game) {
    return `https://www.instaplay.ai/embed/g/${game.id}`;
  }

  function playUrl(game) {
    return `https://www.instaplay.ai/play/${game.slug}/${game.id}`;
  }

  function renderPicks() {
    if (!arcadePicks) return;
    arcadePicks.innerHTML = "";
    for (const [idx, game] of GAMES.entries()) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "playCta small";
      btn.textContent = game.title;
      if (idx === activeGame) btn.setAttribute("aria-current", "true");
      btn.addEventListener("click", () => openArcade(idx));
      arcadePicks.append(btn);
    }
  }

  function openArcade(index = 0) {
    const game = GAMES[index] || GAMES[0];
    activeGame = GAMES.indexOf(game);
    hideCard();
    if (document.pointerLockElement) document.exitPointerLock();
    arcadeOpen = true;
    if (arcadeTitle) arcadeTitle.textContent = game.title;
    if (arcadeExternal) arcadeExternal.href = playUrl(game);
    if (frame && frame.dataset.gameId !== game.id) {
      frame.dataset.gameId = game.id;
      frame.src = embedUrl(game);
    }
    if (overlay) overlay.hidden = false;
    document.querySelector(".playPad")?.setAttribute("hidden", "true");
    document.querySelector(".playLook")?.setAttribute("hidden", "true");
    renderPicks();
    renderMap(activeGame);
    if (promptEl) promptEl.textContent = `Playing ${game.title}`;
    if (orbCount) orbCount.textContent = game.title;
  }

  function closeArcade() {
    arcadeOpen = false;
    if (overlay) overlay.hidden = true;
    document.querySelector(".playPad")?.removeAttribute("hidden");
    document.querySelector(".playLook")?.removeAttribute("hidden");
    if (frame) {
      frame.removeAttribute("src");
      delete frame.dataset.gameId;
    }
    lastAutoGame = poiNear(player.x, player.z)?.id ?? "closed";
    if (!coarse) tryLock();
  }

  function serveBall() {
    ball.visible = true;
    ball.position.set(player.x, player.y + 1.1, player.z);
    const dir = new THREE.Vector3(-Math.sin(player.yaw), 0.18, -Math.cos(player.yaw)).normalize();
    ballVel.copy(dir).multiplyScalar(11);
    ballLive = true;
  }

  function useNearby() {
    const poi = poiNear(player.x, player.z);
    if (!poi) return;
    if (poi.action === "serve") {
      serveBall();
      showCard(poi, serveBall);
      return;
    }
    if (poi.action === "arcade") {
      openArcade(0);
      return;
    }
    if (poi.action === "create") {
      openCreate();
      return;
    }
    if (poi.action === "embed") {
      openArcade(poi.gameIndex ?? 0);
      return;
    }
    if (poi.action === "page" && poi.href) {
      window.location.href = poi.href;
      return;
    }
    showCard(poi, () => {});
  }

  function enterWorld() {
    if (promptEl) promptEl.hidden = false;
    if (statsEl) statsEl.hidden = false;
    if (helpEl) helpEl.hidden = false;
    if (crosshair) crosshair.hidden = false;
    renderMap();
    if (coarse) {
      if (helpEl) helpEl.textContent = "Walk into a booth · or tap a game";
      bindPad();
    }
  }

  function dismissIntro() {
    if (intro) intro.hidden = true;
  }

  enterWorld();
  window.setTimeout(dismissIntro, 3500);
  intro?.addEventListener("click", dismissIntro);
  intro?.addEventListener("pointerdown", dismissIntro);
  canvas?.addEventListener("pointerdown", dismissIntro, { once: true });

  document.addEventListener("pointerlockchange", () => {
    locked = document.pointerLockElement === canvas;
    if (locked) dismissIntro();
  });

  const raycaster = new THREE.Raycaster();
  const lookNdc = new THREE.Vector2(0, 0);
  const catSet = new Set(cats);

  function catFromObject(obj) {
    let node = obj;
    while (node) {
      if (catSet.has(node)) return node;
      node = node.parent;
    }
    return null;
  }

  function lookCatAt(maxDist = 2.6) {
    raycaster.setFromCamera(lookNdc, camera);
    const hits = raycaster.intersectObjects(cats, true);
    for (const hit of hits) {
      const cat = catFromObject(hit.object);
      if (!cat) continue;
      const dist = Math.hypot(cat.position.x - player.x, cat.position.z - player.z);
      if (dist <= maxDist) return cat;
    }
    return null;
  }

  function petCat(cat) {
    if (!cat || cat.userData.sky) return false;
    const extra = cat.userData.mood === "pet" ? 2.8 : 0;
    setCatMood(cat, "pet", { moodT: 6.4 + extra, attention: 6.4 + extra });
    faceToward(cat, player.x, player.z);
    for (let i = 0; i < 3; i += 1) emoteAbove(cat, "heart", 0.3 + i * 0.08, { vy: 0.5 + i * 0.15, size: 0.22 });
    if (promptEl) promptEl.textContent = `petting ${cat.userData.id}`;
    return true;
  }

  function tryPet(clientX, clientY) {
    if (!locked && Number.isFinite(clientX) && Number.isFinite(clientY)) {
      const rect = canvas.getBoundingClientRect();
      lookNdc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
    } else {
      lookNdc.set(0, 0);
    }
    const cat = lookCatAt();
    lookNdc.set(0, 0);
    return cat ? petCat(cat) : false;
  }

  canvas.addEventListener("click", (e) => {
    dismissIntro();
    if (arcadeOpen) return;
    const petted = tryPet(e.clientX, e.clientY);
    if (!coarse) tryLock();
    if (petted) return;
  });

  canvas.addEventListener("pointerdown", (e) => {
    if (!coarse || arcadeOpen) return;
    touch.look = true;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointerup", () => {
    touch.look = false;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!coarse || !touch.look) return;
    pointerDx += e.movementX || 0;
    pointerDy += e.movementY || 0;
  });

  document.addEventListener("visibilitychange", () => {
    running = document.visibilityState === "visible";
    if (running) {
      last = performance.now();
      requestAnimationFrame(tick);
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (!locked || arcadeOpen) return;
    pointerDx += e.movementX;
    pointerDy += e.movementY;
  });

  document.addEventListener("keydown", (e) => {
    if (arcadeOpen) {
      if (e.code === "Escape") {
        e.preventDefault();
        closeArcade();
      }
      return;
    }
    if (["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].includes(e.code)) {
      warpToStall(Number(e.code.slice(-1)) - 1);
      return;
    }
    if (["KeyW", "KeyA", "KeyS", "KeyD", "Space"].includes(e.code)) e.preventDefault();
    keys.add(e.code);
    if (e.code === "KeyE") useNearby();
    if (e.code === "Escape") hideCard();
  });
  document.addEventListener("keyup", (e) => keys.delete(e.code));

  $("#playCardClose")?.addEventListener("click", hideCard);
  $("#arcadeClose")?.addEventListener("click", closeArcade);

  function feetSolid(px, py, pz) {
    const r = 0.28;
    return (
      solidAt(px - r, py, pz - r) ||
      solidAt(px + r, py, pz - r) ||
      solidAt(px - r, py, pz + r) ||
      solidAt(px + r, py, pz + r)
    );
  }

  function blockedAt(px, py, pz) {
    const r = 0.28;
    const knees = py + 0.4;
    const chest = py + 1.05;
    const head = py + 1.65;
    return (
      solidAt(px - r, knees, pz - r) ||
      solidAt(px + r, knees, pz - r) ||
      solidAt(px - r, knees, pz + r) ||
      solidAt(px + r, knees, pz + r) ||
      solidAt(px - r, chest, pz - r) ||
      solidAt(px + r, chest, pz + r) ||
      solidAt(px - r, head, pz - r) ||
      solidAt(px + r, head, pz + r)
    );
  }

  function resolveFloor(next) {
    if (player.vy > 0) {
      if (blockedAt(next.x, next.y, next.z)) {
        next.y = player.y;
        player.vy = 0;
      }
      return;
    }
    if (feetSolid(next.x, next.y - 0.02, next.z)) {
      next.y = Math.floor(next.y - 0.02) + 1;
      player.vy = 0;
      player.grounded = true;
      return;
    }
    if (feetSolid(next.x, next.y - 0.2, next.z)) {
      next.y = Math.floor(next.y - 0.2) + 1;
      player.vy = 0;
      player.grounded = true;
    }
  }

  let camLag = 0;
  let fpsFrames = 0;
  let fpsStart = performance.now();
  renderer.info.autoReset = false;
  function frameStats(now) {
    fpsFrames += 1;
    if (now - fpsStart < 1000) return;
    window.__playStats = {
      ...world.stats,
      fps: Math.round((fpsFrames * 1000) / (now - fpsStart)),
      calls: renderer.info.render.calls,
      tris: renderer.info.render.triangles,
      time: Number(env.state.time.toFixed(3)),
      x: Math.round(player.x),
      z: Math.round(player.z),
      y: Number(player.y.toFixed(2)),
    };
    fpsFrames = 0;
    fpsStart = now;
  }

  function tick(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;

    if (!arcadeOpen) {
      player.yaw -= pointerDx * 0.0022;
      player.pitch -= pointerDy * 0.0022;
    }
    player.pitch = Math.max(-1.4, Math.min(1.4, player.pitch));
    pointerDx = 0;
    pointerDy = 0;

    const speed = arcadeOpen ? 0 : keys.has("ShiftLeft") ? 9.5 : 6.4;
    let wishX = 0;
    let wishZ = 0;
    if (!arcadeOpen) {
      if (keys.has("KeyW")) wishZ -= 1;
      if (keys.has("KeyS")) wishZ += 1;
      if (keys.has("KeyA")) wishX -= 1;
      if (keys.has("KeyD")) wishX += 1;
      if (touch.forward) wishZ -= 1;
      if (touch.left) wishX -= 1;
      if (touch.right) wishX += 1;
      if (touch.back) wishZ += 1;
      if (touch.jx !== 0 || touch.jz !== 0) {
        wishX += touch.jx;
        wishZ += touch.jz;
      }
    }
    const len = Math.hypot(wishX, wishZ) || 1;
    if (len > 1) {
      wishX /= len;
      wishZ /= len;
    }
    const sin = Math.sin(player.yaw);
    const cos = Math.cos(player.yaw);
    player.vx = (wishX * cos + wishZ * sin) * speed;
    player.vz = (-wishX * sin + wishZ * cos) * speed;
    // Swimming: buoyant, slower, and Space paddles up.
    const swimming = player.y < SEA_Y - 0.45;
    if (swimming) {
      player.vx *= 0.6;
      player.vz *= 0.6;
      // Float with eyes just above the surface; Space paddles up, C dives.
      const lift = keys.has("Space") || touch.jump ? 6 : keys.has("KeyC") ? -6 : player.y < SEA_Y - 1.25 ? 3 : -1.5;
      player.vy += lift * dt;
      player.vy *= Math.exp(-dt * 2.5);
      player.vy = Math.min(player.vy, 3.2);
    } else {
      player.vy -= 22 * dt;
    }
    if (!arcadeOpen && keys.has("Space") && player.grounded) {
      player.vy = 8.2;
      player.grounded = false;
    }

    const wasGrounded = player.grounded || swimming;
    const next = { x: player.x + player.vx * dt, y: player.y + player.vy * dt, z: player.z + player.vz * dt };
    player.grounded = false;
    // Walk up single blocks without jumping, like stairs.
    const stepUp = (nx, nz) => {
      if (!wasGrounded) return false;
      const up = Math.floor(player.y + 0.05) + 1;
      if (up - player.y > 1.1 || blockedAt(nx, up, nz) || !feetSolid(nx, up - 0.05, nz)) return false;
      camLag -= up - player.y;
      player.y = up;
      next.y = Math.max(next.y, up);
      return true;
    };
    if (blockedAt(next.x, player.y, player.z) && !stepUp(next.x, player.z)) next.x = player.x;
    if (blockedAt(next.x, player.y, next.z) && !stepUp(next.x, next.z)) next.z = player.z;
    resolveFloor(next);
    player.x = THREE.MathUtils.clamp(next.x, -WORLD.size / 2 + 1, WORLD.size / 2 - 1);
    player.y = Math.max(WORLD.yMin + 2, next.y);
    player.z = THREE.MathUtils.clamp(next.z, -WORLD.size / 2 + 1, WORLD.size / 2 - 1);
    if (player.vy <= 0 && feetSolid(player.x, player.y - 0.08, player.z)) player.grounded = true;
    camLag *= Math.exp(-dt * 14);

    const bob = swimming ? Math.sin(now / 420) * 0.06 : 0;
    camera.position.set(player.x, player.y + 1.55 + camLag + bob, player.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
    if (debugCam) {
      camera.position.set(debugCam[0], debugCam[1], debugCam[2]);
      camera.rotation.y = debugCam[3];
      camera.rotation.x = debugCam[4];
    }

    for (const orb of orbs) {
      orb.position.y = orb.userData.baseY + Math.sin(now / 420 + orb.userData.phase) * 0.12;
      orb.rotation.y += dt * 1.4;
      orb.rotation.x += dt * 0.7;
    }

    for (const toy of catToys) {
      const spec = toy.userData;
      if (spec.kind === "yarn") {
        spec.bounce += dt;
        toy.position.y = 1.08 + Math.abs(Math.sin(now / 280 + spec.phase)) * 0.08;
        toy.rotation.y += dt * 1.8;
        toy.position.x = spec.x + Math.sin(now / 900 + spec.phase) * 0.55;
        toy.position.z = spec.z + Math.cos(now / 1100 + spec.phase) * 0.55;
      } else if (spec.kind === "wand") {
        toy.rotation.z = Math.sin(now / 420 + spec.phase) * 0.18;
      }
    }

    for (const critter of critters) {
      const data = critter.userData;
      if (!data.sky) {
        // Floating emotes: hearts while petted, Zs while napping.
        data.emoteT -= dt;
        if (data.emoteT <= 0) {
          if (data.mood === "pet") {
            emoteAbove(critter, "heart");
            data.emoteT = 0.55 + Math.random() * 0.3;
          } else if (data.mood === "loaf") {
            emoteAbove(critter, "z", 0.26, { vy: 0.28, vx: 0.05, size: 0.16, life: 2.4 });
            data.emoteT = 1.3;
          } else if (data.mood === "knead" || data.mood === "nuzzle") {
            emoteAbove(critter, "heart", 0.3, { size: 0.15 });
            data.emoteT = 1.6;
          } else if (data.mood === "yarn" || data.mood === "pounce") {
            emoteAbove(critter, "sparkle", 0.26, { size: 0.16, life: 0.9 });
            data.emoteT = 1.1;
          } else data.emoteT = 0.5;
        }
      }
      if (data.demo && !data.sky) {
        data.mood = data.demo;
        data.moodT = 99;
        critter.rotation.y = data.heading;
        critter.position.y = groundY(critter.position.x, critter.position.z);
        poseCat(critter, now, dt);
        continue;
      }
      if (data.kittenOf) {
        updateKitten(critter, now, dt);
        continue;
      }
      data.timer -= dt;
      data.moodT -= dt;
      if (data.moodT <= 0) {
        if (data.sky) pickDragonMood(critter, dragons);
        else pickCatMood(critter, cats, catToys);
      }

      const mode = data.sky ? "sky" : "walk";
      const pal = data.playWith;
      const toy = data.target;
      if (data.cool > 0) data.cool -= dt;
      if (data.demo) {
        data.mood = data.demo;
        data.moodT = 99;
        data.heading += (data.demoTurn || 0) * dt;
      } else if (data.mood === "chase" && pal) {
        const gap = data.sky ? 5.4 : 1.35;
        const side = data.sky ? 1.8 : 0.55;
        const aim = playPoint(pal, side, gap);
        const dist = Math.hypot(pal.position.x - critter.position.x, pal.position.z - critter.position.z);
        if (dist < (data.sky ? 3.4 : 0.95) && data.cool <= 0) startTag(critter, pal, now);
        else stepToward(critter, aim.x, aim.z, dt, mode);
      } else if (data.mood === "circle" && pal) {
        const radius = data.sky ? 7.2 : 1.8;
        const ang = now / 520 + data.heading;
        stepToward(critter, pal.position.x + Math.cos(ang) * radius, pal.position.z + Math.sin(ang) * radius, dt, mode);
      } else if (data.mood === "nuzzle" && pal) {
        const aim = playPoint(pal, 0.35, 0.85);
        const dist = Math.hypot(pal.position.x - critter.position.x, pal.position.z - critter.position.z);
        if (dist > 0.9) stepToward(critter, aim.x, aim.z, dt, mode);
        else faceToward(critter, pal.position.x, pal.position.z);
      } else if ((data.mood === "yarn" || data.mood === "scratch" || data.mood === "browse" || data.mood === "guard") && toy) {
        const reach = data.mood === "yarn" ? 0.35 : data.mood === "scratch" ? 0.55 : 0.42;
        const dist = Math.hypot(toy.position.x - critter.position.x, toy.position.z - critter.position.z);
        if (dist > reach) stepToward(critter, toy.position.x, toy.position.z, dt, mode);
        else {
          const look = toy.look || toy.position;
          faceToward(critter, look.x, look.z);
          if (data.mood === "browse" || data.mood === "guard") data.speed = 0;
        }
      } else if (data.mood === "tour" && toy) {
        stepToward(critter, toy.x, toy.z, dt, mode);
        if (Math.hypot(toy.x - critter.position.x, toy.z - critter.position.z) < 6) data.moodT = Math.min(data.moodT, 2.5);
      } else if (data.mood === "perch" && toy) {
        const dist = Math.hypot(toy.x - critter.position.x, toy.z - critter.position.z, toy.y - critter.position.y);
        const pull = Math.min(1, dt * (dist > 6 ? 1.6 : 3.4));
        critter.position.x += (toy.x - critter.position.x) * pull;
        critter.position.z += (toy.z - critter.position.z) * pull;
        data.speed = 0;
        if (dist < 1.8) faceToward(critter, player.x, player.z);
        else steerToward(critter, toy.x, toy.z, 0.16);
      } else if (data.mood === "breath") {
        data.heading += Math.sin(now / 260) * 0.01;
      } else if (data.mood === "pounce") {
        const crouch = data.moodT > 0.7;
        if (!crouch) {
          data.speed = 2.4;
          const nx = critter.position.x + Math.sin(data.heading) * data.speed * dt;
          const nz = critter.position.z + Math.cos(data.heading) * data.speed * dt;
          if (roamOk(nx, nz, mode)) {
            critter.position.x = nx;
            critter.position.z = nz;
          }
        }
      } else if (data.mood === "pet") {
        faceToward(critter, player.x, player.z);
        const near = Math.hypot(player.x - critter.position.x, player.z - critter.position.z) < 2.8;
        if (!near) data.moodT = Math.min(data.moodT, 0.35);
      } else if (
        data.mood === "sit" ||
        data.mood === "loaf" ||
        data.mood === "groom" ||
        data.mood === "knead" ||
        data.mood === "regal" ||
        data.mood === "swat" ||
        data.mood === "stretch" ||
        data.mood === "roll" ||
        data.mood === "nuzzle"
      ) {
        data.heading += Math.sin(now / 900 + data.baseY) * (data.mood === "regal" ? 0.01 : 0.004);
      } else {
        if (data.timer <= 0) {
          data.heading += (hash(critter.position.x * 10, critter.position.z * 10) - 0.5) * Math.PI;
          data.timer = 1.4 + hash(critter.position.z, now) * 2.2;
        }
        const step = data.speed * dt;
        const nx = critter.position.x + Math.sin(data.heading) * step;
        const nz = critter.position.z + Math.cos(data.heading) * step;
        if (roamOk(nx, nz, mode, data.sky ? critter.position.y : null)) {
          critter.position.x = nx;
          critter.position.z = nz;
        } else {
          data.heading += Math.PI * 0.7;
        }
      }
      critter.rotation.y = data.heading;

      if (data.sky) {
        const perch = data.mood === "perch" && data.target;
        const dist = perch ? Math.hypot(data.target.x - critter.position.x, data.target.z - critter.position.z, data.target.y - critter.position.y) : 99;
        const sit = perch ? THREE.MathUtils.clamp(1 - dist / 5.5, 0, 1) : 0;
        const landed = perch && dist < 0.55;
        const swoop = data.mood === "chase" || data.mood === "circle";
        // Stay well above whatever terrain is underneath (and just ahead).
        const ahead = groundH(Math.floor(critter.position.x + Math.sin(data.heading) * 6), Math.floor(critter.position.z + Math.cos(data.heading) * 6));
        const below = groundH(Math.floor(critter.position.x), Math.floor(critter.position.z));
        const clearance = data.demo ? -99 : Math.max(ahead, below) + 7;
        let wantY = Math.max(data.baseY, clearance) + Math.sin(now / 520 + data.heading) * (swoop ? 1.1 : 0.7);
        if (perch) wantY = THREE.MathUtils.lerp(Math.max(data.target.y + 3.2, clearance), data.target.y, sit);
        const prevY = critter.position.y;
        critter.position.y += (wantY - critter.position.y) * Math.min(1, dt * (1.6 + sit * 3));
        data.climb += ((critter.position.y - prevY) / Math.max(dt, 1e-3) - data.climb) * Math.min(1, dt * 4);
        if (landed) {
          critter.position.x += (data.target.x - critter.position.x) * Math.min(1, dt * 8);
          critter.position.y += (data.target.y - critter.position.y) * Math.min(1, dt * 8);
          critter.position.z += (data.target.z - critter.position.z) * Math.min(1, dt * 8);
        } else if (!perch && hitsBanner(critter.position.x, critter.position.y, critter.position.z)) {
          critter.position.y = Math.max(critter.position.y, bannerTop() + 1.1);
          if (Math.abs(critter.position.z - BANNER.z) < BANNER.d * 0.5 + 0.6) {
            critter.position.z += critter.position.z >= BANNER.z ? 1.6 : -1.6;
            data.heading += Math.PI * 0.55;
          }
        }
        // Bank into turns and pitch with the climb.
        if (data.prevHeading == null) data.prevHeading = data.heading;
        let turn = data.heading - data.prevHeading;
        turn = Math.atan2(Math.sin(turn), Math.cos(turn)) / Math.max(dt, 1e-3);
        data.prevHeading = data.heading;
        const bankWant = landed ? 0 : THREE.MathUtils.clamp(-turn * 0.45, -0.75, 0.75) * (1 - sit);
        data.bank += (bankWant - data.bank) * Math.min(1, dt * 3);
        critter.rotation.z = data.bank;
        const flyTilt = THREE.MathUtils.clamp(-data.climb * 0.07, -0.4, 0.4) + Math.sin(now / 640 + data.heading) * 0.05;
        const perchBob = landed ? Math.sin(now / 700 + data.baseY) * 0.03 : 0;
        critter.rotation.x += ((landed ? -0.12 + perchBob : THREE.MathUtils.lerp(flyTilt, -0.16, sit)) - critter.rotation.x) * Math.min(1, dt * 5);
        if (data.wings) {
          // Shoulder flaps; the elbow lags behind so the tip whips through.
          const slow = data.mood === "breath" ? 150 : data.mood === "tour" && data.climb < 0.5 ? 340 : 230;
          const glide = data.mood === "tour" && data.climb < 0.3 ? 0.45 + Math.sin(now / 2600 + data.baseY) * 0.35 : 1;
          const p = now / slow + data.baseY;
          const flyShoulder = 0.05 + Math.sin(p) * 0.6 * glide;
          const flyElbow = Math.sin(p - 1.1) * 0.5 * glide - 0.05;
          const k = Math.min(1, dt * 8);
          for (const [i, w] of data.wings.entries()) {
            const s = i ? -1 : 1;
            const elbow = w.userData.elbow;
            const shZ = THREE.MathUtils.lerp(flyShoulder, -0.55, sit);
            const shY = THREE.MathUtils.lerp(0, -0.55, sit);
            const elZ = THREE.MathUtils.lerp(flyElbow, 1.35 + Math.sin(now / 900 + data.baseY) * 0.05, sit);
            const elY = THREE.MathUtils.lerp(0, -0.9, sit);
            w.rotation.z += (s * shZ - w.rotation.z) * k;
            w.rotation.y += (s * shY - w.rotation.y) * k;
            if (elbow) {
              elbow.rotation.z += (s * elZ - elbow.rotation.z) * k;
              elbow.rotation.y += (s * elY - elbow.rotation.y) * k;
            }
          }
        }
        poseDragon(critter, now, dt, sit);
        const blasting = data.mood === "breath" || (data.mood === "chase" && data.moodT < 1.2);
        if (data.jaw) data.jaw.rotation.x += ((blasting ? 0.55 : 0.04) - data.jaw.rotation.x) * Math.min(1, dt * 10);
        if (blasting && data.mouth && fire) {
          data.mouth.getWorldPosition(firePos);
          data.mouth.getWorldDirection(fireDir);
          fireDir.y -= 0.12;
          fire.emit(firePos, fireDir.normalize(), data.look.fire, 4, 9, 0.34);
        }
      } else {
        critter.rotation.x = 0;
        critter.rotation.z = 0;
        const floor = groundY(critter.position.x, critter.position.z);
        let bob = 0;
        if (data.mood === "pounce" && data.moodT <= 0.7) bob = Math.abs(Math.sin(now / 90)) * 0.1;
        else if (data.mood === "yarn" && toy && Math.hypot(toy.position.x - critter.position.x, toy.position.z - critter.position.z) < 0.5) bob = Math.abs(Math.sin(now / 140)) * 0.06;
        else if (data.mood === "wander" || data.mood === "chase") bob = Math.abs(Math.sin(data.gait * 2)) * 0.03;
        critter.position.y = Math.max(floor, floor + bob);
        poseCat(critter, now, dt);
      }
    }

    separateGroup(adultCats, 0.82);
    separateGroup(kittens, 0.34);
    emotes.update(dt);
    fire.update(dt);
    ambient.update(dt, player, env);
    separateGroup(dragons.filter((d) => d.userData.mood !== "perch"), 4.6);

    if (ballLive) {
      ballVel.y -= 14 * dt;
      ball.position.addScaledVector(ballVel, dt);
      if (ball.position.y < 1.2) {
        ball.position.y = 1.2;
        ballVel.y *= -0.62;
        ballVel.x *= 0.86;
        ballVel.z *= 0.86;
      }
      if (ball.position.distanceTo(new THREE.Vector3(-18, 1.4, -8)) > 18) {
        ballLive = false;
        ball.visible = false;
      }
    }

    const poi = poiNear(player.x, player.z);
    if (!arcadeOpen && poi?.action === "embed" && poi.id !== lastAutoGame) {
      lastAutoGame = poi.id;
      openArcade(poi.gameIndex ?? 0);
    } else if (!arcadeOpen && poi?.action === "create" && poi.id !== lastAutoGame) {
      lastAutoGame = poi.id;
      openCreate();
    } else if (!arcadeOpen && poi?.action === "page" && poi.href && poi.id !== lastAutoGame) {
      lastAutoGame = poi.id;
      window.location.href = poi.href;
    } else if (!poi || (poi.action !== "embed" && poi.action !== "page" && poi.action !== "create")) {
      if (lastAutoGame && !arcadeOpen) lastAutoGame = null;
    }

    if (!arcadeOpen && promptEl) {
      const lookCat = lookCatAt();
      if (lookCat) {
        lastPoi = `cat:${lookCat.userData.id}`;
        promptEl.textContent = lookCat.userData.mood === "pet"
          ? `Click · keep petting ${lookCat.userData.id}`
          : `Click · pet ${lookCat.userData.id}`;
      } else if (poi && poi.id !== lastPoi) {
        lastPoi = poi.id;
        promptEl.textContent =
          poi.action === "embed" || poi.action === "page" || poi.action === "create"
            ? `Walk in · ${poi.title}`
            : `E · ${poi.title}`;
      } else if (!poi && lastPoi) {
        lastPoi = null;
        promptEl.textContent = "Walk into a colored booth · or click a cat";
      }
    }

    env.update(dt, player);
    if (camera.position.y < SEA_Y - 0.05) {
      // Underwater: thick blue-green murk.
      scene.fog.color.setRGB(0.08, 0.32, 0.42).multiplyScalar(0.4 + env.state.light * 0.6);
      scene.fog.near = 0.5;
      scene.fog.far = 26;
      renderer.setClearColor(scene.fog.color, 1);
    } else {
      scene.fog.near = 110;
      scene.fog.far = 430;
    }
    ocean.position.x = Math.round(camera.position.x / 8) * 8;
    ocean.position.z = Math.round(camera.position.z / 8) * 8;
    for (const mat of waters) mat.uniforms.uLight.value = env.state.light;
    renderer.info.reset();
    env.render();
    frameStats(now, dt);
    if (running) requestAnimationFrame(tick);
  }

  if (reduced) {
    camera.position.set(0.5, 8, 20);
    camera.lookAt(0.5, 3, -6);
    env.update(0, player);
    env.render();
    renderMap();
    if (intro) {
      const lead = intro.querySelector(".playIntroLead");
      if (lead) lead.textContent = "Motion is reduced. Use the game buttons or the tabs.";
    }
    return;
  }

  requestAnimationFrame(tick);
  } catch (err) {
    failWorld(err);
  }
}

document.addEventListener("DOMContentLoaded", startWorld);
