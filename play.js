import * as THREE from "three";

const WORLD = {
  size: 160,
  spawn: { x: 0.5, y: 1.2, z: 14.5 },
};

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
  { id: "dota", title: "Dota 2", kicker: "Game", body: "One more ancient.", x: -10.5, z: 17.4, art: "assets/images/covers/dota.jpg" },
  { id: "valorant", title: "Valorant", kicker: "Game", body: "Aim, then aim again.", x: -9.5, z: 17.4, art: "assets/images/covers/valorant.png" },
  { id: "minecraft", title: "Minecraft", kicker: "Game", body: "The reason this lobby is made of blocks.", x: -8.5, z: 17.4, art: "assets/images/covers/minecraft.jpg" },
  { id: "inception", title: "Inception", kicker: "Movie", body: "A dream about building worlds.", x: -7.5, z: 17.4, art: "assets/images/covers/inception.jpg" },
  { id: "oppenheimer", title: "Oppenheimer", kicker: "Movie", body: "I am become death, destroyer of worlds.", x: -6.5, z: 17.4, art: "assets/images/covers/oppenheimer.jpg" },
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

function reserved(ix, iz) {
  return (
    inRect(ix, iz, -24, -24, 25, 26) ||
    boothAt(ix, iz) ||
    pageAt(ix, iz) ||
    inRect(ix, iz, -3, -20, 4, -13) ||
    inRect(ix, iz, -22, -12, -15, -5) ||
    inShelf(ix, iz)
  );
}

function groundH(ix, iz) {
  if (inRect(ix, iz, -22, -16, 23, 20)) return 0;
  const n =
    Math.sin(ix * 0.09) * 3.2 +
    Math.cos(iz * 0.07) * 2.8 +
    Math.sin((ix + iz) * 0.045) * 2.4 +
    Math.cos(ix * 0.021 - iz * 0.018) * 3.6 +
    hash(ix, iz) * 1.4;
  return Math.max(0, Math.min(14, Math.floor(n + 2)));
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

function treeHere(ix, iz) {
  if (reserved(ix, iz)) return false;
  return hash(ix, iz) > 0.955;
}

function pondAt(ix, iz) {
  return inRect(ix, iz, 16, -22, 24, -16);
}

function blockAt(x, y, z) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);

  if (iy < 0) return iy < -2 ? "stoneDark" : "stone";
  if (iy > 18) return null;

  if (iy >= 14 && iy <= 16 && !inRect(ix, iz, -16, -16, 17, 16)) {
    const cx = Math.floor(ix / 5);
    const cz = Math.floor(iz / 6);
    if (hash(cx, cz) > 0.72 && Math.abs(ix - cx * 5) < 2 + hash(cx + 3, cz) && Math.abs(iz - cz * 6) < 1 + hash(cx, cz + 2)) {
      return "cloud";
    }
  }

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

  const gh = groundH(ix, iz);

  if (iy <= gh) {
    if (iy === gh) {
      if (inRect(ix, iz, -20, -12, 24, 16)) {
        if (iz <= 2 && iz >= -12) return (ix + iz) % 2 === 0 ? "stone" : "cobble";
        if (Math.abs(ix) <= 1) return "cobble";
        if (iz >= 2 && iz <= 16 && Math.abs(ix) <= 2) return "cobble";
        if (iz >= 6 && iz <= 12 && (ix <= -13 || ix >= 13)) return "dirt";
      }
      if ((ix + iz) % 6 === 0 && inRect(ix, iz, -16, -12, 17, 3)) return "gold";
      return hash(ix, iz) > 0.82 ? "grassDark" : "grass";
    }
    if (iy === gh - 1) return "dirt";
    return "stone";
  }

  if (iy === 1 && ix % 6 === 0 && (ix + iz) % 6 === 0 && inRect(ix, iz, -16, -12, 17, 3) && !boothAt(ix, iz) && !pageAt(ix, iz)) {
    return "gold";
  }

  if (treeHere(ix, iz)) {
    if (iy > gh && iy <= gh + 4) return "wood";
  }

  if (iy >= gh + 3 && iy <= gh + 6) {
    for (let dx = -2; dx <= 2; dx += 1) {
      for (let dz = -2; dz <= 2; dz += 1) {
        if (!treeHere(ix + dx, iz + dz)) continue;
        const crown = Math.abs(dx) + Math.abs(dz);
        if (iy === gh + 6 && crown > 1) continue;
        if (iy === gh + 3 && crown > 2) continue;
        if (dx === 0 && dz === 0 && iy <= gh + 4) continue;
        return "leaf";
      }
    }
  }

  return null;
}

function solidAt(x, y, z) {
  const kind = blockAt(x, y, z);
  return Boolean(kind) && kind !== "water" && kind !== "cloud" && kind !== "glass" && kind !== "portal";
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
    ctx.font = `bold ${text.length > 12 ? 36 : 48}px ui-monospace, SFMono-Regular, Menlo, monospace`;
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
  ctx.font = "bold 8px ui-monospace, SFMono-Regular, Menlo, monospace";
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
    ctx.font = "bold 16px ui-monospace, SFMono-Regular, Menlo, monospace";
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
    ctx.font = "bold 54px ui-monospace, SFMono-Regular, Menlo, monospace";
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
    ctx.font = "bold 24px ui-monospace, SFMono-Regular, Menlo, monospace";
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
    ctx.font = "bold 38px ui-monospace, SFMono-Regular, Menlo, monospace";
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

function buildWorld(scene) {
  const groups = {};
  for (const key of Object.keys(PALETTE)) groups[key] = { positions: [] };

  const half = WORLD.size / 2;
  for (let x = -half; x < half; x += 1) {
    for (let z = -half; z < half; z += 1) {
      const gh = groundH(x + 0.5, z + 0.5);
      const yMax = Math.min(24, Math.max(gh + 7, 11));
      for (let y = 0; y <= yMax; y += 1) {
        const kind = blockAt(x + 0.5, y + 0.5, z + 0.5);
        if (!kind || !groups[kind]) continue;
        groups[kind].positions.push(x + 0.5, y + 0.5, z + 0.5);
      }
    }
  }

  const geo = new THREE.BoxGeometry(1, 1, 1);
  for (const [kind, data] of Object.entries(groups)) {
    const count = data.positions.length / 3;
    if (!count) continue;
    const mat = new THREE.MeshLambertMaterial({
      map: blockTexture(kind),
      transparent: kind === "glass" || kind === "water" || kind === "portal",
      opacity: kind === "glass" ? 0.55 : kind === "water" ? 0.78 : kind === "portal" ? 0.72 : 1,
      depthWrite: kind !== "glass" && kind !== "portal",
    });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.receiveShadow = true;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      dummy.position.set(data.positions[i * 3], data.positions[i * 3 + 1], data.positions[i * 3 + 2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    scene.add(mesh);
  }

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

function addPivot(parent, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

// Four-sided points keep ears, horns, and spines in the world's angular style.
function addSpike(parent, kind, start, end, radius, glow = 0) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(
    new THREE.ConeGeometry(radius, direction.length(), 4),
    new THREE.MeshLambertMaterial({ color: colorFor(kind), emissive: colorFor(kind), emissiveIntensity: glow })
  );
  mesh.position.copy(a.add(b).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  parent.add(mesh);
  return mesh;
}

function addCatLeg(parent, kind, sock, x, y, z) {
  const hip = addPivot(parent, x, y, z);
  addBox(hip, kind, 0, -0.055, 0, 0.13, 0.15, 0.13);
  addBox(hip, sock || kind, 0, -0.155, 0.025, 0.16, 0.09, 0.19);
  return hip;
}

function addCat(root, look) {
  const body = look.body;
  const trim = look.trim;
  const belly = look.belly;
  const muzzle = look.muzzle;
  const sock = look.sock || belly;
  const mark = look.mark || [];
  const torso = addPivot(root, 0, 0.32, 0);
  addBox(torso, body, 0, 0, 0, 0.4, 0.3, 0.58);
  addBox(torso, body, 0, 0.015, -0.08, 0.44, 0.22, 0.36);
  addBox(torso, belly, 0, -0.12, 0.03, 0.3, 0.09, 0.46);
  addBox(torso, belly, 0, 0.025, 0.28, 0.24, 0.25, 0.05);

  const head = addPivot(torso, 0, 0.12, 0.32);
  addBox(head, body, 0, 0.04, 0.06, 0.44, 0.36, 0.36);
  addBox(head, body, 0, 0, 0.08, 0.48, 0.23, 0.32);
  const eyes = [];
  const ears = [];
  for (const side of [-1, 1]) {
    addBox(head, muzzle, side * 0.062, -0.065, 0.252, 0.13, 0.095, 0.09);
    const eye = addPivot(head, side * 0.112, 0.068, 0.247);
    addBox(eye, look.eye || "lime", 0, 0, 0, 0.09, 0.105, 0.022, { solid: true });
    addBox(eye, "black", 0, 0, 0.015, 0.063, 0.085, 0.012, { solid: true });
    addBox(eye, "white", -0.015, 0.025, 0.024, 0.025, 0.025, 0.01, { solid: true, glow: 0.3, emissive: 0xffffff });
    eyes.push(eye);
    const ear = addPivot(head, side * 0.15, 0.2, 0.015);
    addSpike(ear, trim, [0, 0, 0], [side * 0.03, 0.22, -0.02], 0.105);
    addSpike(ear, look.inner || "pink", [0, 0.015, 0.054], [side * 0.02, 0.165, 0.018], 0.055);
    ears.push(ear);
    for (const row of [-1, 1]) {
      addBox(head, "cream", side * 0.205, -0.055 + row * 0.024, 0.29, 0.15, 0.009, 0.009, { rz: side * row * 0.14, solid: true });
    }
    addBox(head, "black", side * 0.02, -0.1, 0.303, 0.035, 0.012, 0.009, { rz: side * 0.3, solid: true });
  }
  addBox(head, look.nose || "pink", 0, -0.042, 0.31, 0.044, 0.03, 0.027, { solid: true });

  const legs = [
    addCatLeg(torso, look.leg || body, sock, -0.125, -0.1, 0.2),
    addCatLeg(torso, look.leg || body, sock, 0.125, -0.1, 0.2),
    addCatLeg(torso, look.leg || body, sock, -0.125, -0.1, -0.2),
    addCatLeg(torso, look.leg || body, sock, 0.125, -0.1, -0.2),
  ];

  const tail = addPivot(torso, 0, 0.075, -0.3);
  addBox(tail, look.tail || body, 0, 0, -0.14, 0.1, 0.1, 0.3);
  const tailMid = addPivot(tail, 0, 0, -0.28);
  addBox(tailMid, look.tail || body, 0, 0, -0.1, 0.09, 0.09, 0.22);
  const tailTip = addPivot(tailMid, 0, 0, -0.2);
  addBox(tailTip, look.tailTip || look.tail || body, 0, 0, -0.06, 0.085, 0.085, 0.14);
  tail.rotation.x = 0.95;
  tailTip.rotation.x = 0.6;

  for (const m of mark) {
    const side = Math.abs(m.x) > 0.04;
    addBox(
      torso,
      m.kind,
      side ? Math.sign(m.x) * 0.218 : m.x,
      side ? m.y : Math.max(m.y, 0.158),
      THREE.MathUtils.clamp(m.z, -0.22, 0.22),
      side ? Math.min(m.sx, 0.05) : m.sx,
      m.sy,
      m.sz,
      { layer: 1 }
    );
  }
  return { torso, head, eyes, ears, legs, tail, tailMid, tailTip };
}

function blackOr(look) {
  return look.pupil || "black";
}

function pinkOr(look) {
  return look.inner || "pink";
}

function whiteOr(look) {
  return look.shine || "white";
}

function addFire(root, glow) {
  const fire = new THREE.Group();
  fire.position.set(0, 0.02, 1.18);
  fire.visible = false;
  const kinds = [glow, "orange", "gold", glow];
  for (let i = 0; i < 5; i += 1) {
    const kind = kinds[i % kinds.length];
    const puff = addBox(fire, kind, 0, 0, 0.18 + i * 0.3, 0.1 + i * 0.05, 0.1 + i * 0.04, 0.22, {
      glow: 1.15 - i * 0.14,
      emissive: colorFor(kind),
    });
    puff.userData.phase = i;
  }
  root.add(fire);
  return fire;
}

function addDragonLeg(root, look, x, y, z, hind) {
  const hip = addPivot(root, x, y, z);
  addBox(hip, look.body, 0, -0.18, 0.02, hind ? 0.2 : 0.18, hind ? 0.42 : 0.36, hind ? 0.22 : 0.18);
  const knee = addPivot(hip, 0, hind ? -0.38 : -0.32, 0.02);
  addBox(knee, look.trim, 0, -0.22, 0.04, hind ? 0.16 : 0.14, hind ? 0.46 : 0.4, hind ? 0.16 : 0.14);
  const foot = addPivot(knee, 0, hind ? -0.44 : -0.38, 0.04);
  addBox(foot, look.trim, 0, -0.04, 0.14, hind ? 0.22 : 0.2, 0.08, hind ? 0.32 : 0.28);
  addBox(foot, look.glow, -0.07, -0.05, 0.28, 0.05, 0.04, 0.1, { glow: 0.55, emissive: colorFor(look.glow) });
  addBox(foot, look.glow, 0.07, -0.05, 0.28, 0.05, 0.04, 0.1, { glow: 0.55, emissive: colorFor(look.glow) });
  addBox(foot, look.glow, 0, -0.05, 0.32, 0.05, 0.04, 0.12, { glow: 0.7, emissive: colorFor(look.glow) });
  return { hip, knee, foot };
}

function addDragonWing(root, look, side) {
  const s = side < 0 ? -1 : 1;
  const wing = addPivot(root, 0.42 * s, 0.48, 0.35);
  // A swept leading edge and scalloped trailing edge read clearly from below.
  const outline = [[0, 0], [0.95, 0.58], [2.85, -0.16], [2.08, -0.55], [1.66, -1.42], [1.06, -0.96], [0.66, -1.5], [0.3, -0.88], [0, -0.65]];
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x * s, z)));
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(Math.PI / 2);
  const membrane = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
    color: colorFor(look.wing),
    emissive: colorFor(look.glow),
    emissiveIntensity: 0.14,
    side: THREE.DoubleSide,
  }));
  wing.add(membrane);
  const knuckle = [0.95 * s, 0.025, 0.58];
  for (const tip of [[0, 0, 0], [2.85 * s, 0, -0.16], [1.66 * s, 0, -1.42], [0.66 * s, 0, -1.5]]) {
    const a = new THREE.Vector3(...knuckle);
    const b = new THREE.Vector3(...tip);
    const direction = b.clone().sub(a);
    const rib = addBox(wing, look.body, 0, 0, 0, 0.075, direction.length(), 0.075, { solid: true });
    rib.position.copy(a.add(b).multiplyScalar(0.5));
    rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  }
  addSpike(wing, look.trim, knuckle, [1.02 * s, 0.16, 0.94], 0.12);
  addSpike(wing, look.glow, [2.4 * s, 0.015, 0.02], [3.02 * s, 0.015, -0.23], 0.065, 0.55);
  return wing;
}

function addDragon(root, look) {
  const body = look.body;
  const trim = look.trim;
  const glow = look.glow;
  const under = bellyOr(look);
  addBox(root, body, 0, 0.28, 0.34, 0.94, 0.62, 1.16);
  addBox(root, body, 0, 0.25, -0.48, 0.68, 0.48, 0.94);
  for (let i = 0; i < 5; i += 1) {
    addBox(root, under, 0, -0.015, 0.73 - i * 0.3, 0.55 - i * 0.035, 0.13, 0.24);
    addSpike(root, i % 2 ? trim : glow, [0, 0.57 - i * 0.02, 0.65 - i * 0.34], [0, 1.02 - i * 0.07, 0.43 - i * 0.34], 0.13 - i * 0.012, i % 2 ? 0 : 0.4);
  }
  addBox(root, glow, 0.4, 0.22, 0.22, 0.08, 0.08, 0.7, { glow: 0.35, emissive: colorFor(glow) });
  addBox(root, glow, -0.4, 0.22, 0.22, 0.08, 0.08, 0.7, { glow: 0.35, emissive: colorFor(glow) });

  const head = addPivot(root, 0, 0.38, 1.08);
  addBox(head, body, 0, 0.08, 0.18, 0.42, 0.34, 0.58);
  addBox(head, body, 0, 0.16, 0.61, 0.58, 0.36, 0.58);
  addBox(head, body, 0, 0.06, 0.98, 0.38, 0.19, 0.48);
  addBox(head, look.jaw || trim, 0, -0.105, 0.93, 0.34, 0.09, 0.5);
  addBox(head, glow, 0, -0.044, 1.07, 0.28, 0.035, 0.28, { solid: true, glow: 0.85, emissive: colorFor(glow) });
  for (const side of [-1, 1]) {
    addBox(head, amberOr(look), side * 0.21, 0.205, 0.914, 0.13, 0.065, 0.03, { solid: true, glow: 1, emissive: colorFor(glow) });
    addBox(head, blackOr(look), side * 0.21, 0.205, 0.936, 0.025, 0.062, 0.014, { solid: true });
    addBox(head, trim, side * 0.21, 0.26, 0.895, 0.21, 0.055, 0.12, { rz: side * 0.2 });
    addBox(head, "black", side * 0.105, 0.125, 1.22, 0.065, 0.03, 0.018, { solid: true });
    addSpike(head, trim, [side * 0.22, 0.28, 0.45], [side * 0.44, 0.85, -0.15], 0.16);
    addSpike(head, glow, [side * 0.39, 0.72, -0.02], [side * 0.5, 0.98, -0.32], 0.065, 0.65);
    addSpike(head, trim, [side * 0.27, 0.05, 0.54], [side * 0.52, 0.14, 0.12], 0.13);
    for (const z of [0.85, 1.12]) addSpike(head, whiteOr(look), [side * 0.15, -0.015, z], [side * 0.15, -0.14, z + 0.025], 0.035);
  }

  const legs = [
    addDragonLeg(root, look, -0.34, 0.08, 0.52, false),
    addDragonLeg(root, look, 0.34, 0.08, 0.52, false),
    addDragonLeg(root, look, -0.32, 0.1, -0.52, true),
    addDragonLeg(root, look, 0.32, 0.1, -0.52, true),
  ];

  const tail = addPivot(root, 0, 0.28, -0.96);
  addBox(tail, body, 0, 0.02, -0.32, 0.28, 0.22, 0.7);
  addSpike(tail, trim, [0, 0.12, -0.2], [0, 0.43, -0.42], 0.1);
  const tailMid = addPivot(tail, 0, 0.02, -0.68);
  addBox(tailMid, body, 0, 0, -0.28, 0.2, 0.16, 0.56);
  addSpike(tailMid, trim, [0, 0.08, -0.2], [0, 0.31, -0.38], 0.08);
  const tailTip = addPivot(tailMid, 0, 0, -0.56);
  addBox(tailTip, trim, 0, 0.02, -0.22, 0.16, 0.12, 0.46);
  addSpike(tailTip, glow, [0, 0.02, -0.38], [0, 0.02, -0.95], 0.22, 0.65);

  const left = addDragonWing(root, look, -1);
  const right = addDragonWing(root, look, 1);
  return {
    wings: [left, right],
    head,
    tail,
    tailMid,
    tailTip,
    legs: legs.map((leg) => leg.hip),
    knees: legs.map((leg) => leg.knee),
    feet: legs.map((leg) => leg.foot),
    fire: addFire(head, glow),
  };
}

function amberOr(look) {
  return look.eye || "amber";
}

function bellyOr(look) {
  return look.under || look.trim;
}

function makeCritter(scene, spec) {
  const root = new THREE.Group();
  let parts = { wings: null, tail: null, legs: [] };
  const cats = {
    tuxedo: {
      body: "black", trim: "black", belly: "white", muzzle: "white", sock: "white", eye: "lime", tailTip: "white",
      mark: [
        { kind: "white", x: -0.07, y: 0.12, z: 0.08, sx: 0.08, sy: 0.04, sz: 0.08 },
        { kind: "white", x: 0.07, y: 0.12, z: 0.02, sx: 0.08, sy: 0.04, sz: 0.08 },
      ],
    },
    tabby: {
      body: "orange", trim: "wood", belly: "cream", muzzle: "cream", sock: "cream", eye: "lime", tail: "orange",
      mark: [
        { kind: "wood", x: 0, y: 0.12, z: 0.04, sx: 0.06, sy: 0.03, sz: 0.4 },
        { kind: "wood", x: 0, y: 0.14, z: 0.42, sx: 0.1, sy: 0.03, sz: 0.08 },
      ],
    },
    calico: {
      body: "cream", trim: "orange", belly: "white", muzzle: "white", sock: "white", eye: "lime",
      mark: [
        { kind: "orange", x: -0.1, y: 0.04, z: 0.1, sx: 0.1, sy: 0.1, sz: 0.16 },
        { kind: "black", x: 0.1, y: 0.02, z: -0.14, sx: 0.1, sy: 0.1, sz: 0.14 },
      ],
    },
    siamese: {
      body: "cream", trim: "wood", belly: "white", muzzle: "wood", sock: "wood", eye: "blue", tail: "wood", tailTip: "wood", leg: "cream",
    },
    void: {
      body: "black", trim: "black", belly: "ink", muzzle: "black", sock: "ink", eye: "lime",
    },
    cream: {
      body: "cream", trim: "gold", belly: "white", muzzle: "white", sock: "white", eye: "lime",
    },
    gray: {
      body: "stone", trim: "stoneDark", belly: "cream", muzzle: "cream", sock: "cream", eye: "lime",
    },
    cow: {
      body: "white", trim: "black", belly: "white", muzzle: "white", sock: "white", eye: "lime", tailTip: "black",
      mark: [
        { kind: "black", x: -0.08, y: 0.04, z: 0.1, sx: 0.12, sy: 0.1, sz: 0.16 },
        { kind: "black", x: 0.1, y: 0.02, z: -0.16, sx: 0.12, sy: 0.1, sz: 0.14 },
      ],
    },
    ginger: {
      body: "gold", trim: "orange", belly: "cream", muzzle: "cream", sock: "cream", eye: "lime",
    },
    spot: {
      body: "white", trim: "black", belly: "white", muzzle: "white", sock: "white", eye: "lime",
      mark: [
        { kind: "black", x: -0.08, y: 0.04, z: 0.04, sx: 0.1, sy: 0.08, sz: 0.12 },
        { kind: "black", x: 0.1, y: 0.02, z: -0.12, sx: 0.08, sy: 0.08, sz: 0.1 },
      ],
    },
  };
  const dragons = {
    ember: { body: "red", trim: "gold", wing: "orange", membrane: "emberGlow", glow: "emberGlow", eye: "amber", jaw: "ink", under: "gold" },
    frost: { body: "cyan", trim: "white", wing: "cloud", membrane: "frostGlow", glow: "frostGlow", eye: "white", jaw: "blue", under: "cloud" },
    night: { body: "obsidian", trim: "portal", wing: "ink", membrane: "nightGlow", glow: "nightGlow", eye: "portal", jaw: "black", under: "ink" },
    jade: { body: "leaf", trim: "gold", wing: "grassDark", membrane: "jadeGlow", glow: "jadeGlow", eye: "amber", jaw: "wood", under: "gold" },
  };
  if (cats[spec.id]) {
    parts = addCat(root, cats[spec.id]);
  } else if (dragons[spec.id]) {
    parts = addDragon(root, dragons[spec.id]);
  } else {
    parts = addCat(root, cats.void);
  }
  const sky = Boolean(spec.sky);
  const baseY = sky ? 10.6 + hash(spec.x, spec.z) * 2.8 : 1.02;
  root.position.set(spec.x, baseY, spec.z);
  root.userData = {
    id: spec.id,
    heading: hash(spec.x, spec.z) * Math.PI * 2,
    speed: sky ? 3.8 : 0.95,
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
    walkSpeed: sky ? 3.8 : 0.95,
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
    fire: parts.fire || null,
  };
  scene.add(root);
  return root;
}

function roamOk(x, z, mode = "walk", y = null, allowBanner = false) {
  if (mode === "sky") {
    if (x <= -42 || x >= 42 || z <= -32 || z >= 32) return false;
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
  const flyHipX = [1.05 + flap * 0.08, 1.05 + flap * 0.08, 1.28 + flap * 0.06, 1.28 + flap * 0.06];
  const sitHipX = [0.22, 0.22, 0.98, 0.98];
  const flyHipZ = [-0.08, 0.08, -0.1, 0.1];
  const sitHipZ = [-0.06, 0.06, -0.18, 0.18];
  const flyKneeX = [-0.85, -0.85, -1.02, -1.02];
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
  if (data.head) {
    const lookY = sit ? Math.sin(now / 1100 + data.baseY) * 0.32 + Math.sin(now / 2400 + data.heading) * 0.12 : 0;
    const lookX = sit ? -0.06 + Math.sin(now / 900 + data.baseY) * 0.1 : Math.sin(now / 640 + data.heading) * 0.05;
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
    torsoX = data.mood === "regal" ? -0.02 : 0.02;
    hips[0] = 0.12;
    hips[1] = 0.12;
    hips[2] = -1.18;
    hips[3] = -1.18;
    tail = data.mood === "regal"
      ? [{ x: 0.55, y: 0.15 }, { x: 0.35, y: 0.1 }, { x: 0.2, y: 0.05 }]
      : [{ x: 0.18, y: 0.08 }, { x: 0.12, y: 0.06 }, { x: 0.08, y: 0.04 }];
    headX = data.mood === "regal" ? -0.04 : 0.02;
  } else if (data.mood === "loaf") {
    hips[0] = 0.55;
    hips[1] = 0.55;
    hips[2] = -0.95;
    hips[3] = -0.95;
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
    const wantY = sitLow ? 0.23 : 0.32;
    data.torso.position.y += (wantY - data.torso.position.y) * blend;
  }
  easeJoint(data.head, headX, headY, headZ, blend);
  const blinkPhase = (now / 1000 + data.blinkOffset) % 4.8;
  const eyeOpen = blinkPhase < 0.16 ? 0.08 : data.mood === "pet" || data.mood === "nuzzle" ? 0.3 : 1;
  for (const eye of data.eyes) eye.scale.y += (eyeOpen - eye.scale.y) * Math.min(1, dt * 24);
  for (const [i, ear] of data.ears.entries()) {
    const twitch = Math.max(0, Math.sin(now / 680 + data.gait + i * 2)) ** 12;
    easeJoint(ear, twitch * 0.12, 0, (i ? 1 : -1) * twitch * 0.18, blend);
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
  if (roll < 0.18 && stands.length) {
    const stand = stands[Math.floor(roll * stands.length * 11) % stands.length];
    const mood = roll < 0.06 ? "scratch" : roll < 0.12 ? "browse" : "guard";
    setCatMood(critter, mood, {
      target: stand,
      moodT: 5.4 + roll * 3,
      speed: mood === "scratch" ? 1.35 : 1.15,
    });
    return;
  }
  if (roll < 0.26 && cats.length > 1) {
    const pal = nearestOther(critter, cats);
    if (pal) {
      setCatMood(critter, "chase", { playWith: pal, moodT: 3.4 + roll * 2, speed: 2.15 });
      return;
    }
  }
  if (roll < 0.34 && yarn.length) {
    setCatMood(critter, "yarn", {
      target: yarn[Math.floor(roll * yarn.length * 8) % yarn.length],
      moodT: 4 + roll * 2,
      speed: 1.7,
    });
    return;
  }
  if (roll < 0.42 && posts.length) {
    setCatMood(critter, "scratch", {
      target: posts[Math.floor(roll * posts.length * 9) % posts.length],
      moodT: 3.2 + roll,
      speed: 1.25,
    });
    return;
  }
  if (roll < 0.4) {
    setCatMood(critter, "knead", { moodT: 3.4 + roll * 2 });
    return;
  }
  if (roll < 0.5) {
    setCatMood(critter, "regal", { moodT: 3.8 + roll * 2 });
    return;
  }
  if (roll < 0.58) {
    setCatMood(critter, "swat", { moodT: 2.4 + roll, swatLeg: roll > 0.54 ? 1 : 0 });
    return;
  }
  if (roll < 0.66) {
    setCatMood(critter, "stretch", { moodT: 2.2 + roll });
    return;
  }
  if (roll < 0.73) {
    setCatMood(critter, "roll", { moodT: 2.6 + roll });
    return;
  }
  if (roll < 0.8) {
    setCatMood(critter, "pounce", { moodT: 2.1 + roll, speed: 0.4 });
    return;
  }
  if (roll < 0.86) {
    setCatMood(critter, "sit", { moodT: 2.6 + roll * 2 });
    return;
  }
  if (roll < 0.91) {
    setCatMood(critter, "loaf", { moodT: 2.8 + roll });
    return;
  }
  if (roll < 0.96) {
    setCatMood(critter, "groom", { moodT: 2.2 + roll });
    return;
  }
  setCatMood(critter, "wander", { moodT: 2.4 + roll * 2.2, speed: critter.userData.walkSpeed });
}

function sendToPerch(critter, slot = 0, hold = 10) {
  const perch = bannerPerch(slot);
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

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
  const stage = canvas.parentElement;
  renderer.setClearColor(0x78a7ff, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x78a7ff, 90, 210);

  const camera = new THREE.PerspectiveCamera(70, 1, 0.08, 260);
  camera.position.set(WORLD.spawn.x, WORLD.spawn.y, WORLD.spawn.z);

  scene.add(new THREE.HemisphereLight(0x9ec8ff, 0x4a6b32, 0.95));
  const sun = new THREE.DirectionalLight(0xfff3c4, 1.05);
  sun.position.set(22, 34, 12);
  scene.add(sun);

  buildWorld(scene);

  const orbs = GAMES.map((_, i) => makeOrb(scene, i));
  const ball = makeBall(scene);
  const catToys = makeCatToys(scene);
  const critters = CRITTERS.map((spec) => makeCritter(scene, spec));
  const cats = critters.filter((c) => !c.userData.sky);
  const dragons = critters.filter((c) => c.userData.sky);
  greetPerch(dragons);
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
    player.vy -= 22 * dt;
    if (!arcadeOpen && keys.has("Space") && player.grounded) {
      player.vy = 8.2;
      player.grounded = false;
    }

    const next = { x: player.x + player.vx * dt, y: player.y + player.vy * dt, z: player.z + player.vz * dt };
    player.grounded = false;
    if (blockedAt(next.x, player.y, player.z)) next.x = player.x;
    if (blockedAt(next.x, player.y, next.z)) next.z = player.z;
    resolveFloor(next);
    player.x = THREE.MathUtils.clamp(next.x, -WORLD.size / 2 + 1, WORLD.size / 2 - 1);
    player.y = Math.max(0.2, next.y);
    player.z = THREE.MathUtils.clamp(next.z, -WORLD.size / 2 + 1, WORLD.size / 2 - 1);
    if (player.vy <= 0 && feetSolid(player.x, player.y - 0.08, player.z)) player.grounded = true;

    camera.position.set(player.x, player.y + 1.55, player.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;

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
      if (data.mood === "chase" && pal) {
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
        let wantY = data.baseY + Math.sin(now / 520 + data.heading) * (swoop ? 1.1 : 0.7);
        if (perch) wantY = THREE.MathUtils.lerp(data.target.y + 3.2, data.target.y, sit);
        critter.position.y += (wantY - critter.position.y) * Math.min(1, dt * (2.2 + sit * 3));
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
        const flyTilt = Math.sin(now / 640 + data.heading) * 0.08;
        const perchBob = landed ? Math.sin(now / 700 + data.baseY) * 0.03 : 0;
        critter.rotation.x += ((landed ? -0.2 + perchBob : THREE.MathUtils.lerp(flyTilt, -0.16, sit)) - critter.rotation.x) * Math.min(1, dt * 5);
        if (data.wings) {
          const perchFlap = 1.02 + Math.sin(now / 750 + data.baseY) * 0.05;
          const flyFlap = 0.12 + Math.sin(now / (data.mood === "breath" ? 160 : 260) + data.heading) * 0.48;
          const flap = landed ? perchFlap : THREE.MathUtils.lerp(flyFlap, perchFlap, sit);
          data.wings[0].rotation.z += (flap - data.wings[0].rotation.z) * Math.min(1, dt * 5);
          data.wings[1].rotation.z += (-flap - data.wings[1].rotation.z) * Math.min(1, dt * 5);
        }
        poseDragon(critter, now, dt, sit);
        if (data.fire) {
          const blasting = data.mood === "breath" || (data.mood === "chase" && data.moodT < 1.2);
          data.fire.visible = blasting;
          if (blasting) {
            for (const puff of data.fire.children) {
              const wave = Math.sin(now / 70 + puff.userData.phase) * 0.08;
              puff.position.x = wave;
              puff.position.y = Math.cos(now / 90 + puff.userData.phase) * 0.06;
              puff.scale.setScalar(0.85 + Math.abs(Math.sin(now / 80 + puff.userData.phase)) * 0.45);
            }
          }
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

    separateGroup(cats, 0.82);
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

    renderer.render(scene, camera);
    if (running) requestAnimationFrame(tick);
  }

  if (reduced) {
    camera.position.set(0.5, 8, 20);
    camera.lookAt(0.5, 3, -6);
    renderer.render(scene, camera);
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
