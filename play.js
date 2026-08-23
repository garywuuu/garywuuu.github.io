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
  { id: "about", title: "About", href: "/about/", x0: -21, x1: -14, z0: 6, z1: 13, wall: "plank", roof: "wood", door: "east" },
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
    href: "/about/",
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

function makeInstaplaySign(x, y, z, scaleX = 11.4) {
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
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(scaleX, scaleX * 0.25, 0.18), mat);
  mesh.position.set(x, y, z);
  return mesh;
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

  scene.add(makeInstaplaySign(0.5, 11.4, -12.2, 11.6));
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
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    new THREE.MeshLambertMaterial({
      map: blockTexture(kind),
      emissive: extra.emissive ?? 0x000000,
      emissiveIntensity: extra.glow ?? 0,
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

function addLimb(parent, kind, x, y, z) {
  const hip = addPivot(parent, x, y, z);
  addBox(hip, kind, 0, -0.055, 0, 0.07, 0.12, 0.07);
  const knee = addPivot(hip, 0, -0.11, 0);
  addBox(knee, kind, 0, -0.05, 0, 0.06, 0.1, 0.06);
  const paw = addPivot(knee, 0, -0.1, 0);
  addBox(paw, kind, 0, -0.02, 0.015, 0.07, 0.04, 0.08);
  return { hip, knee, paw };
}

function addCat(root, look) {
  const body = look.body;
  const trim = look.trim;
  const belly = look.belly;
  const muzzle = look.muzzle;
  const mark = look.mark || [];
  const torso = addPivot(root, 0, 0.22, 0);
  addBox(torso, body, 0, 0.08, 0, 0.28, 0.18, 0.56);
  addBox(torso, belly, 0, -0.02, 0.02, 0.16, 0.08, 0.36);

  const head = addPivot(torso, 0, 0.1, 0.3);
  addBox(head, body, 0, 0.08, 0.08, 0.24, 0.2, 0.22);
  addBox(head, muzzle, 0, 0.02, 0.2, 0.13, 0.08, 0.08);
  addBox(head, look.nose || "pink", 0, 0.04, 0.25, 0.04, 0.03, 0.03);
  addBox(head, look.eye || "lime", -0.055, 0.12, 0.18, 0.05, 0.05, 0.03);
  addBox(head, look.eye || "lime", 0.055, 0.12, 0.18, 0.05, 0.05, 0.03);
  addBox(head, "white", -0.07, 0.135, 0.195, 0.02, 0.02, 0.02);
  addBox(head, "white", 0.04, 0.135, 0.195, 0.02, 0.02, 0.02);
  addBox(head, trim, -0.075, 0.2, 0.02, 0.07, 0.1, 0.05);
  addBox(head, trim, 0.075, 0.2, 0.02, 0.07, 0.1, 0.05);
  addBox(head, "pink", -0.075, 0.18, 0.05, 0.04, 0.05, 0.02);
  addBox(head, "pink", 0.075, 0.18, 0.05, 0.04, 0.05, 0.02);

  const legs = [
    addLimb(torso, look.leg || body, -0.09, 0, 0.18),
    addLimb(torso, look.leg || body, 0.09, 0, 0.18),
    addLimb(torso, look.leg || body, -0.09, 0, -0.2),
    addLimb(torso, look.leg || body, 0.09, 0, -0.2),
  ];

  const tail = addPivot(torso, 0, 0.1, -0.28);
  addBox(tail, look.tail || body, 0, 0.08, 0, 0.05, 0.16, 0.05);
  const tailMid = addPivot(tail, 0, 0.16, 0);
  addBox(tailMid, look.tail || body, 0, 0.07, 0, 0.045, 0.14, 0.045);
  const tailTip = addPivot(tailMid, 0, 0.14, 0);
  addBox(tailTip, look.tailTip || look.tail || body, 0, 0.07, 0, 0.04, 0.14, 0.04);

  for (const m of mark) addBox(torso, m.kind, m.x, m.y - 0.22, m.z, m.sx, m.sy, m.sz);
  return { torso, head, legs, tail, tailMid, tailTip };
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
  fire.position.set(0, 0.22, 1.96);
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

function addDragon(root, look) {
  const body = look.body;
  const trim = look.trim;
  const wing = look.wing;
  const glow = look.glow;
  const membrane = look.membrane || wing;
  addBox(root, body, 0, 0.18, 0.08, 0.78, 0.46, 1.7);
  addBox(root, bellyOr(look), 0, 0.02, 0.1, 0.5, 0.18, 1.35);
  addBox(root, trim, 0, 0.46, 0.16, 0.16, 0.18, 1.28);
  addBox(root, trim, 0, 0.62, 0.42, 0.1, 0.2, 0.12);
  addBox(root, trim, 0, 0.6, 0.08, 0.1, 0.18, 0.1);
  addBox(root, trim, 0, 0.56, -0.28, 0.08, 0.16, 0.1);
  addBox(root, trim, 0, 0.52, -0.62, 0.08, 0.14, 0.08);
  addBox(root, body, 0, 0.32, 1.02, 0.36, 0.3, 0.56);
  addBox(root, body, 0, 0.42, 1.42, 0.5, 0.38, 0.46);
  addBox(root, trim, 0, 0.32, 1.7, 0.28, 0.16, 0.28);
  addBox(root, look.jaw || trim, 0, 0.18, 1.66, 0.22, 0.12, 0.26);
  addBox(root, whiteOr(look), -0.08, 0.22, 1.8, 0.05, 0.05, 0.06);
  addBox(root, whiteOr(look), 0.08, 0.22, 1.8, 0.05, 0.05, 0.06);
  addBox(root, amberOr(look), -0.14, 0.5, 1.58, 0.1, 0.1, 0.07, { glow: 1, emissive: colorFor(glow) });
  addBox(root, amberOr(look), 0.14, 0.5, 1.58, 0.1, 0.1, 0.07, { glow: 1, emissive: colorFor(glow) });
  addBox(root, blackOr(look), -0.14, 0.5, 1.62, 0.04, 0.06, 0.03);
  addBox(root, blackOr(look), 0.14, 0.5, 1.62, 0.04, 0.06, 0.03);
  addBox(root, trim, -0.2, 0.7, 1.32, 0.1, 0.28, 0.1, { rz: 0.32 });
  addBox(root, trim, 0.2, 0.7, 1.32, 0.1, 0.28, 0.1, { rz: -0.32 });
  addBox(root, glow, 0, 0.28, 1.86, 0.1, 0.1, 0.16, { glow: 0.95, emissive: colorFor(glow) });
  addBox(root, glow, 0, 0.18, 2.02, 0.08, 0.08, 0.16, { glow: 0.7, emissive: colorFor(glow) });

  const legs = [
    addPivot(root, -0.3, 0.02, 0.48),
    addPivot(root, 0.3, 0.02, 0.48),
    addPivot(root, -0.28, 0.02, -0.48),
    addPivot(root, 0.28, 0.02, -0.48),
  ];
  for (const [i, leg] of legs.entries()) {
    addBox(leg, body, 0, -0.1, 0, 0.16, 0.24, 0.16);
    addBox(leg, trim, 0, -0.24, 0.08, 0.18, 0.08, 0.22);
    addBox(leg, glow, (i < 2 ? -0.04 : 0.04), -0.26, 0.18, 0.04, 0.04, 0.08, { glow: 0.4, emissive: colorFor(glow) });
  }

  const tail = addPivot(root, 0, 0.2, -0.9);
  addBox(tail, body, 0, 0.02, -0.28, 0.24, 0.2, 0.62);
  addBox(tail, trim, 0, 0.16, -0.18, 0.08, 0.12, 0.18);
  addBox(tail, trim, 0, 0.12, -0.72, 0.16, 0.14, 0.4);
  addBox(tail, glow, 0, 0.14, -1.02, 0.22, 0.1, 0.24, { glow: 0.7, emissive: colorFor(glow) });

  const left = addPivot(root, -0.4, 0.32, 0.16);
  const right = addPivot(root, 0.4, 0.32, 0.16);
  addBox(left, trim, -0.22, 0.08, 0, 0.5, 0.08, 0.12);
  addBox(left, membrane, -0.78, -0.02, 0.12, 1.02, 0.04, 0.82);
  addBox(left, membrane, -1.32, -0.12, 0.02, 0.72, 0.03, 0.5);
  addBox(left, trim, -0.72, 0.04, -0.18, 0.08, 0.06, 0.42, { rz: 0.2 });
  addBox(left, trim, -1.12, -0.02, -0.08, 0.06, 0.05, 0.32, { rz: 0.28 });
  addBox(right, trim, 0.22, 0.08, 0, 0.5, 0.08, 0.12);
  addBox(right, membrane, 0.78, -0.02, 0.12, 1.02, 0.04, 0.82);
  addBox(right, membrane, 1.32, -0.12, 0.02, 0.72, 0.03, 0.5);
  addBox(right, trim, 0.72, 0.04, -0.18, 0.08, 0.06, 0.42, { rz: -0.2 });
  addBox(right, trim, 1.12, -0.02, -0.08, 0.06, 0.05, 0.32, { rz: -0.28 });
  return { wings: [left, right], tail, legs, fire: addFire(root, glow) };
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
      body: "black", trim: "black", belly: "white", muzzle: "white", eye: "lime",
      mark: [{ kind: "white", x: 0, y: 0.155, z: 0.04, sx: 0.14, sy: 0.05, sz: 0.24 }],
    },
    tabby: {
      body: "orange", trim: "wood", belly: "cream", muzzle: "cream", eye: "lime", tail: "orange",
      mark: [
        { kind: "wood", x: 0, y: 0.405, z: 0.02, sx: 0.06, sy: 0.03, sz: 0.36 },
        { kind: "wood", x: 0, y: 0.5, z: 0.44, sx: 0.1, sy: 0.03, sz: 0.08 },
      ],
    },
    calico: {
      body: "cream", trim: "orange", belly: "white", muzzle: "white", eye: "lime",
      mark: [
        { kind: "orange", x: -0.12, y: 0.32, z: 0.08, sx: 0.08, sy: 0.1, sz: 0.14 },
        { kind: "black", x: 0.12, y: 0.3, z: -0.12, sx: 0.08, sy: 0.08, sz: 0.12 },
        { kind: "orange", x: 0.08, y: 0.48, z: 0.44, sx: 0.08, sy: 0.06, sz: 0.08 },
      ],
    },
    siamese: {
      body: "cream", trim: "wood", belly: "white", muzzle: "wood", eye: "blue", tail: "wood", tailTip: "wood", leg: "wood",
    },
    void: {
      body: "black", trim: "black", belly: "ink", muzzle: "black", eye: "lime",
    },
    cream: {
      body: "cream", trim: "gold", belly: "white", muzzle: "white", eye: "lime",
    },
    gray: {
      body: "stone", trim: "stoneDark", belly: "cream", muzzle: "cream", eye: "lime",
    },
    cow: {
      body: "white", trim: "black", belly: "white", muzzle: "white", eye: "lime", tailTip: "black",
      mark: [
        { kind: "black", x: -0.08, y: 0.32, z: 0.08, sx: 0.12, sy: 0.1, sz: 0.16 },
        { kind: "black", x: 0.1, y: 0.3, z: -0.16, sx: 0.12, sy: 0.1, sz: 0.14 },
      ],
    },
    ginger: {
      body: "gold", trim: "orange", belly: "cream", muzzle: "cream", eye: "lime",
    },
    spot: {
      body: "white", trim: "black", belly: "white", muzzle: "white", eye: "lime",
      mark: [
        { kind: "black", x: -0.08, y: 0.32, z: 0.04, sx: 0.1, sy: 0.08, sz: 0.12 },
        { kind: "black", x: 0.1, y: 0.3, z: -0.12, sx: 0.08, sy: 0.08, sz: 0.1 },
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
    gait: hash(spec.x, spec.z) * Math.PI * 2,
    walkSpeed: sky ? 3.8 : 0.95,
    wings: parts.wings || null,
    torso: parts.torso || null,
    head: parts.head || null,
    tail: parts.tail || null,
    tailMid: parts.tailMid || null,
    tailTip: parts.tailTip || null,
    legs: parts.legs || [],
    fire: parts.fire || null,
  };
  scene.add(root);
  return root;
}

function roamOk(x, z, mode = "walk") {
  if (mode === "sky") return x > -42 && x < 42 && z > -32 && z < 32;
  if (x < -11 || x > 11 || z < 2 || z > 15) return false;
  if (inShelf(Math.floor(x), Math.floor(z))) return false;
  if (pageAt(Math.floor(x), Math.floor(z))) return false;
  if (boothAt(Math.floor(x), Math.floor(z))) return false;
  if (solidAt(x, 1.4, z)) return false;
  if (!solidAt(x, 0.4, z)) return false;
  return true;
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
  if (roamOk(nx, nz, mode)) {
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
  data.swatLeg = extra.swatLeg ?? (hash(critter.position.x, critter.position.z) > 0.5 ? 0 : 1);
}

function groundY(x, z) {
  return groundH(Math.floor(x), Math.floor(z)) + 1.02;
}

function easeJoint(node, rx, ry, rz, t) {
  if (!node) return;
  node.rotation.x += (rx - node.rotation.x) * t;
  node.rotation.y += (ry - node.rotation.y) * t;
  node.rotation.z += (rz - node.rotation.z) * t;
}

function poseCat(critter, now, dt) {
  const data = critter.userData;
  const moving = data.mood === "wander" || data.mood === "chase" || data.mood === "yarn" || data.mood === "scratch" || (data.mood === "pounce" && data.moodT <= 0.7);
  const pace = data.mood === "chase" ? 11 : data.mood === "yarn" ? 10 : 8;
  if (moving) data.gait += dt * pace;
  const walk = Math.sin(data.gait);
  const walkB = Math.sin(data.gait + Math.PI);
  const lift = Math.max(0, Math.sin(data.gait));
  const liftB = Math.max(0, Math.sin(data.gait + Math.PI));
  const blend = Math.min(1, dt * 8);
  let torsoX = moving ? Math.sin(data.gait * 2) * 0.05 : 0;
  let torsoZ = moving ? Math.sin(data.gait) * 0.04 : 0;
  let torsoY = 0;
  let headX = moving ? -0.08 : 0.04;
  let headY = Math.sin(now / 900 + data.baseY) * 0.12;
  let headZ = 0;
  const hips = [
    { x: 0, z: 0, kx: 0, px: 0, pz: 0 },
    { x: 0, z: 0, kx: 0, px: 0, pz: 0 },
    { x: 0, z: 0, kx: 0, px: 0, pz: 0 },
    { x: 0, z: 0, kx: 0, px: 0, pz: 0 },
  ];
  let tail = [
    { x: -0.2, z: 0 },
    { x: 0.15, z: 0 },
    { x: 0.2, z: 0 },
  ];

  if (data.mood === "sit" || data.mood === "regal") {
    torsoX = data.mood === "regal" ? -0.12 : -0.06;
    hips[0] = { x: 0.18, z: 0, kx: 0.55, px: 0.15, pz: 0 };
    hips[1] = { x: 0.18, z: 0, kx: 0.55, px: 0.15, pz: 0 };
    hips[2] = { x: -1.05, z: 0.18, kx: 1.35, px: 0.2, pz: 0 };
    hips[3] = { x: -1.05, z: -0.18, kx: 1.35, px: 0.2, pz: 0 };
    tail = data.mood === "regal"
      ? [{ x: 0.15, z: 0.7 }, { x: 0.25, z: 0.35 }, { x: 0.1, z: 0.15 }]
      : [{ x: 0.35, z: 0.15 }, { x: 0.4, z: 0.2 }, { x: 0.2, z: 0.1 }];
    headX = data.mood === "regal" ? -0.05 : 0.08;
  } else if (data.mood === "loaf") {
    torsoX = 0.06;
    hips[0] = { x: 0.7, z: 0.08, kx: 1.1, px: 0.2, pz: 0 };
    hips[1] = { x: 0.7, z: -0.08, kx: 1.1, px: 0.2, pz: 0 };
    hips[2] = { x: 0.55, z: 0.1, kx: 1.05, px: 0.15, pz: 0 };
    hips[3] = { x: 0.55, z: -0.1, kx: 1.05, px: 0.15, pz: 0 };
    tail = [{ x: 0.7, z: 0 }, { x: 0.5, z: 0.1 }, { x: 0.2, z: 0 }];
  } else if (data.mood === "knead") {
    const a = (Math.sin(now / 110) + 1) * 0.5;
    torsoX = -0.04;
    hips[0] = { x: 0.15 + a * 0.7, z: 0, kx: 0.2 + (1 - a) * 0.5, px: 0.1, pz: 0 };
    hips[1] = { x: 0.15 + (1 - a) * 0.7, z: 0, kx: 0.2 + a * 0.5, px: 0.1, pz: 0 };
    hips[2] = { x: -0.85, z: 0.12, kx: 1.2, px: 0.15, pz: 0 };
    hips[3] = { x: -0.85, z: -0.12, kx: 1.2, px: 0.15, pz: 0 };
    tail = [{ x: 0.1, z: Math.sin(now / 180) * 0.15 }, { x: 0.2, z: 0.1 }, { x: 0.15, z: 0 }];
  } else if (data.mood === "swat") {
    const bat = Math.max(0, Math.sin(now / 90));
    const i = data.swatLeg || 0;
    const j = i === 1 ? 0 : 1;
    torsoZ = (i ? 1 : -1) * 0.05;
    hips[i] = { x: 0.15 + bat * 1.05, z: (i ? 0.35 : -0.35) * bat, kx: -0.2, px: 0.4 * bat, pz: (i ? 0.2 : -0.2) * bat };
    hips[j] = { x: 0.25, z: 0, kx: 0.35, px: 0.1, pz: 0 };
    hips[2] = { x: -0.35, z: 0.08, kx: 0.55, px: 0.1, pz: 0 };
    hips[3] = { x: -0.35, z: -0.08, kx: 0.55, px: 0.1, pz: 0 };
    headY = (i ? 0.18 : -0.18);
    tail = [{ x: -0.1, z: Math.sin(now / 80) * 0.45 }, { x: 0.2, z: Math.sin(now / 70) * 0.4 }, { x: 0.25, z: Math.sin(now / 60) * 0.35 }];
  } else if (data.mood === "stretch") {
    torsoX = 0.28;
    hips[0] = { x: 0.95, z: 0, kx: 0.15, px: 0.1, pz: 0 };
    hips[1] = { x: 0.95, z: 0, kx: 0.15, px: 0.1, pz: 0 };
    hips[2] = { x: -0.85, z: 0.08, kx: 0.9, px: 0.15, pz: 0 };
    hips[3] = { x: -0.85, z: -0.08, kx: 0.9, px: 0.15, pz: 0 };
    headX = 0.2;
    tail = [{ x: -0.45, z: 0 }, { x: -0.25, z: 0 }, { x: -0.1, z: 0 }];
  } else if (data.mood === "roll") {
    torsoX = 0.12;
    torsoZ = Math.sin(now / 360) * 0.55;
    hips[0] = { x: 0.7, z: 0.25, kx: 0.6, px: 0.2, pz: 0 };
    hips[1] = { x: 0.55, z: -0.35, kx: 0.7, px: 0.2, pz: 0 };
    hips[2] = { x: 0.65, z: 0.2, kx: 0.55, px: 0.15, pz: 0 };
    hips[3] = { x: 0.45, z: -0.3, kx: 0.6, px: 0.15, pz: 0 };
    tail = [{ x: 0.2, z: 0.4 }, { x: 0.25, z: 0.3 }, { x: 0.2, z: 0.2 }];
  } else if (data.mood === "pounce") {
    const crouch = data.moodT > 0.7;
    torsoX = crouch ? 0.22 : -0.12;
    hips[0] = { x: crouch ? 0.7 : 0.35, z: 0, kx: crouch ? 0.9 : 0.25, px: 0.1, pz: 0 };
    hips[1] = { x: crouch ? 0.7 : 0.35, z: 0, kx: crouch ? 0.9 : 0.25, px: 0.1, pz: 0 };
    hips[2] = { x: crouch ? -0.15 : -0.45, z: 0, kx: crouch ? 0.8 : 0.4, px: 0.1, pz: 0 };
    hips[3] = { x: crouch ? -0.15 : -0.45, z: 0, kx: crouch ? 0.8 : 0.4, px: 0.1, pz: 0 };
    tail = [{ x: crouch ? 0.35 : -0.25, z: 0 }, { x: 0.2, z: 0 }, { x: 0.15, z: 0 }];
  } else if (data.mood === "groom") {
    torsoZ = Math.sin(now / 180) * 0.08;
    headX = 0.45;
    headZ = 0.35 + Math.sin(now / 140) * 0.12;
    hips[0] = { x: 0.85 + Math.sin(now / 140) * 0.25, z: -0.15, kx: 0.4, px: 0.2, pz: 0 };
    hips[1] = { x: 0.2, z: 0, kx: 0.3, px: 0.1, pz: 0 };
    hips[2] = { x: -0.4, z: 0.1, kx: 0.55, px: 0.1, pz: 0 };
    hips[3] = { x: -0.4, z: -0.1, kx: 0.55, px: 0.1, pz: 0 };
  } else if (data.mood === "nuzzle") {
    torsoX = -0.04;
    headX = 0.12;
    headY = Math.sin(now / 200) * 0.18;
    hips[0] = { x: 0.2, z: 0, kx: 0.25, px: 0.1, pz: 0 };
    hips[1] = { x: 0.2, z: 0, kx: 0.25, px: 0.1, pz: 0 };
    hips[2] = { x: -0.25, z: 0.08, kx: 0.4, px: 0.1, pz: 0 };
    hips[3] = { x: -0.25, z: -0.08, kx: 0.4, px: 0.1, pz: 0 };
    tail = [{ x: -0.05, z: Math.sin(now / 120) * 0.35 }, { x: 0.2, z: Math.sin(now / 100) * 0.3 }, { x: 0.25, z: Math.sin(now / 80) * 0.28 }];
  } else if (data.mood === "scratch") {
    hips[0] = { x: 0.15 + Math.sin(now / 70) * 0.7, z: 0, kx: 0.2, px: 0.15, pz: 0 };
    hips[1] = { x: 0.15 + Math.sin(now / 70 + 1) * 0.7, z: 0, kx: 0.2, px: 0.15, pz: 0 };
    hips[2] = { x: -0.15, z: 0, kx: 0.25, px: 0.1, pz: 0 };
    hips[3] = { x: -0.15, z: 0, kx: 0.25, px: 0.1, pz: 0 };
    torsoX = -0.08;
  } else if (moving) {
    hips[0] = { x: walk * 0.55, z: 0, kx: lift * 0.7, px: -lift * 0.15, pz: 0 };
    hips[1] = { x: walkB * 0.55, z: 0, kx: liftB * 0.7, px: -liftB * 0.15, pz: 0 };
    hips[2] = { x: walkB * 0.5, z: 0, kx: liftB * 0.55, px: -liftB * 0.12, pz: 0 };
    hips[3] = { x: walk * 0.5, z: 0, kx: lift * 0.55, px: -lift * 0.12, pz: 0 };
    const wag = data.mood === "chase" || data.mood === "yarn" ? 0.55 : 0.28;
    tail = [
      { x: -0.18 + Math.sin(now / 180) * 0.08, z: Math.sin(now / 140 + data.gait) * wag },
      { x: 0.18, z: Math.sin(now / 120 + data.gait + 0.6) * wag },
      { x: 0.22, z: Math.sin(now / 90 + data.gait + 1.1) * wag * 1.1 },
    ];
  } else {
    tail = [
      { x: -0.12, z: Math.sin(now / 240) * 0.12 },
      { x: 0.16, z: Math.sin(now / 200) * 0.14 },
      { x: 0.18, z: Math.sin(now / 160) * 0.16 },
    ];
  }

  easeJoint(data.torso, torsoX, torsoY, torsoZ, blend);
  easeJoint(data.head, headX, headY, headZ, blend);
  for (const [i, leg] of data.legs.entries()) {
    const pose = hips[i];
    if (!leg?.hip) continue;
    easeJoint(leg.hip, pose.x, 0, pose.z, blend);
    easeJoint(leg.knee, pose.kx, 0, 0, blend);
    easeJoint(leg.paw, pose.px, 0, pose.pz, blend);
  }
  easeJoint(data.tail, tail[0].x, 0, tail[0].z, blend);
  easeJoint(data.tailMid, tail[1].x, 0, tail[1].z, blend);
  easeJoint(data.tailTip, tail[2].x, 0, tail[2].z, blend);
}

function pickCatMood(critter, cats, toys) {
  const roll = hash(critter.position.x * 7 + critter.userData.timer, critter.position.z * 3);
  const yarn = toys.filter((item) => item.userData.kind === "yarn");
  const posts = toys.filter((item) => item.userData.kind === "post" || item.userData.kind === "tree" || item.userData.kind === "wand");
  if (roll < 0.1 && cats.length > 1) {
    const pal = nearestOther(critter, cats);
    if (pal) {
      setCatMood(critter, "chase", { playWith: pal, moodT: 3.4 + roll * 2, speed: 2.15 });
      return;
    }
  }
  if (roll < 0.2 && yarn.length) {
    setCatMood(critter, "yarn", {
      target: yarn[Math.floor(roll * yarn.length * 8) % yarn.length],
      moodT: 4 + roll * 2,
      speed: 1.7,
    });
    return;
  }
  if (roll < 0.3 && posts.length) {
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

function pickDragonMood(critter, dragons) {
  const roll = hash(critter.position.x * 5, critter.position.z + critter.userData.timer);
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
  const touch = { forward: false, back: false, left: false, right: false, look: false };
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
      <button type="button" data-dir="forward">↑</button>
      <div class="playPadRow">
        <button type="button" data-dir="left">←</button>
        <button type="button" data-dir="use">E</button>
        <button type="button" data-dir="right">→</button>
      </div>
      <button type="button" data-dir="back">↓</button>
    `;
    document.body.append(pad);
    const setDir = (dir, on) => {
      if (dir === "use") {
        if (on) useNearby();
        return;
      }
      if (dir in touch) touch[dir] = on;
    };
    pad.addEventListener("pointerdown", (e) => {
      const dir = e.target?.dataset?.dir;
      if (!dir) return;
      e.preventDefault();
      setDir(dir, true);
    });
    pad.addEventListener("pointerup", (e) => {
      const dir = e.target?.dataset?.dir;
      if (!dir) return;
      setDir(dir, false);
    });
    pad.addEventListener("pointerleave", () => {
      touch.forward = touch.back = touch.left = touch.right = false;
    });
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
    renderPicks();
    renderMap(activeGame);
    if (promptEl) promptEl.textContent = `Playing ${game.title}`;
    if (orbCount) orbCount.textContent = game.title;
  }

  function closeArcade() {
    arcadeOpen = false;
    if (overlay) overlay.hidden = true;
    document.querySelector(".playPad")?.removeAttribute("hidden");
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

  document.addEventListener("pointerlockchange", () => {
    locked = document.pointerLockElement === canvas;
    if (locked) dismissIntro();
  });

  canvas.addEventListener("click", () => {
    dismissIntro();
    if (arcadeOpen) return;
    if (!coarse) tryLock();
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
    }
    const len = Math.hypot(wishX, wishZ) || 1;
    wishX /= len;
    wishZ /= len;
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
      } else if ((data.mood === "yarn" || data.mood === "scratch") && toy) {
        const reach = data.mood === "yarn" ? 0.35 : 0.55;
        const dist = Math.hypot(toy.position.x - critter.position.x, toy.position.z - critter.position.z);
        if (dist > reach) stepToward(critter, toy.position.x, toy.position.z, dt, mode);
        else faceToward(critter, toy.position.x, toy.position.z);
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
        if (roamOk(nx, nz, mode)) {
          critter.position.x = nx;
          critter.position.z = nz;
        } else {
          data.heading += Math.PI * 0.7;
        }
      }
      critter.rotation.y = data.heading;

      if (data.sky) {
        const swoop = data.mood === "chase" || data.mood === "circle";
        critter.position.y = data.baseY + Math.sin(now / 520 + data.heading) * (swoop ? 1.1 : 0.7);
        critter.rotation.x = Math.sin(now / 640 + data.heading) * 0.08;
        if (data.wings) {
          const flap = Math.sin(now / (data.mood === "breath" ? 90 : 120) + data.heading) * 0.55;
          data.wings[0].rotation.z = flap;
          data.wings[1].rotation.z = -flap;
        }
        if (data.tail) data.tail.rotation.y = Math.sin(now / 260 + data.heading) * 0.35;
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
    separateGroup(dragons, 4.6);

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
      if (poi && poi.id !== lastPoi) {
        lastPoi = poi.id;
        promptEl.textContent =
          poi.action === "embed" || poi.action === "page" || poi.action === "create"
            ? `Walk in · ${poi.title}`
            : `E · ${poi.title}`;
      } else if (!poi && lastPoi) {
        lastPoi = null;
        promptEl.textContent = "Walk into a colored booth · or press 1–5";
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
