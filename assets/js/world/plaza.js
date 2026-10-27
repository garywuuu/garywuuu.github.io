// Plaza layout shared by the page and the world generator: the booths, the
// walk-in houses, the shelf, and the blocks they stamp onto the island. No
// three.js here so the worker can import it.

export const WORLD = {
  size: 288,
  yMin: -14,
  yMax: 64,
  spawn: { x: 0.5, y: 1.2, z: 14.5 },
};

export const GAMES = [
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

export const MYSTERY = {
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

export const STALLS = [GAMES[0], GAMES[1], MYSTERY, GAMES[2], GAMES[3]];

export const BOOTHS = STALLS.map((game) => ({
  game,
  x0: game.x - 3,
  x1: game.x + 3,
  z0: game.z - 5,
  z1: game.z + 1,
  doorZ: game.z + 1,
}));

// Walk-in houses. Their exhibits live in world/rooms.js.
export const PAGES = [
  { id: "about", title: "About", href: "/", x0: -21, x1: -14, z0: 6, z1: 13, wall: "plank", roof: "wood", trim: "spruceLog", base: "cobble", rug: "red", door: "east", chimney: true },
  { id: "research", title: "Research", href: "/research/", x0: 14, x1: 21, z0: 6, z1: 13, wall: "stone", roof: "stoneDark", trim: "stoneDark", base: "mossy", rug: "blue", door: "west" },
  { id: "experience", title: "Experience", href: "/experience/", x0: -5, x1: 6, z0: 18, z1: 24, wall: "ink", roof: "gold", trim: "gold", base: "obsidian", rug: "magentaDark", door: "north" },
];

export const SHELF = { x0: -12, x1: -6, z0: 16, z1: 17 };

export function inShelf(ix, iz) {
  return inRect(ix, iz, SHELF.x0, SHELF.z0, SHELF.x1, SHELF.z1);
}

export function inRect(x, z, x0, z0, x1, z1) {
  return x >= x0 && x <= x1 && z >= z0 && z <= z1;
}

export function boothAt(ix, iz) {
  return BOOTHS.find((b) => inRect(ix, iz, b.x0, b.z0, b.x1, b.z1));
}

export function pageAt(ix, iz) {
  return PAGES.find((p) => inRect(ix, iz, p.x0, p.z0, p.x1, p.z1));
}

export function isDoor(ix, iy, iz, page, top = 3) {
  if (iy < 1 || iy > top) return false;
  if (page.door === "east" && ix === page.x1 && iz >= page.z0 + 2 && iz <= page.z1 - 2) return true;
  if (page.door === "west" && ix === page.x0 && iz >= page.z0 + 2 && iz <= page.z1 - 2) return true;
  if (page.door === "north" && iz === page.z0 && ix >= -1 && ix <= 2) return true;
  return false;
}

// A house: stone base course, log corners, clerestory windows, a lit door
// frame and a stepped hip roof that stays hollow so the room feels tall.
export function houseBlock(page, ix, iy, iz) {
  const { x0, x1, z0, z1 } = page;
  const wall = ix === x0 || ix === x1 || iz === z0 || iz === z1;
  const corner = (ix === x0 || ix === x1) && (iz === z0 || iz === z1);
  if (iy === 0) {
    if (wall) return page.base;
    const rug = ix > x0 + 1 && ix < x1 - 1 && iz > z0 + 1 && iz < z1 - 1;
    return rug ? page.rug : "plank";
  }
  if (iy <= 6) {
    if (!wall) {
      // Hanging lanterns light the room (one more in long rooms).
      const w = x1 - x0;
      const lx = w > 9 ? [x0 + Math.round(w * 0.3), x1 - Math.round(w * 0.3)] : [Math.floor((x0 + x1) / 2)];
      if (iy === 6 && lx.includes(ix) && iz === Math.floor((z0 + z1) / 2)) return "lantern";
      return null;
    }
    if (corner) return "spruceLog";
    if (isDoor(ix, iy, iz, page)) return null;
    if (iy === 6) return page.trim;
    if (isDoor(ix, iy - 1, iz, page) && iy === 4) return page.trim;
    // Door-side lanterns, one block out from the opening.
    if (iy === 3 && (isDoor(ix + 1, 1, iz, page) || isDoor(ix - 1, 1, iz, page) || isDoor(ix, 1, iz + 1, page) || isDoor(ix, 1, iz - 1, page))) return "lantern";
    if (iy === 1) return page.base;
    if (iy === 5) return (ix + iz) % 2 === 0 ? "glass" : page.trim;
    return page.wall;
  }
  if (page.chimney && ix === x0 + 1 && iz === z0 + 1) return iy === 12 ? null : "brick";
  const k = iy - 7;
  const rx0 = x0 + k;
  const rx1 = x1 - k;
  const rz0 = z0 + k;
  const rz1 = z1 - k;
  if (rx0 > rx1 || rz0 > rz1) return undefined;
  if (ix < rx0 || ix > rx1 || iz < rz0 || iz > rz1) return null;
  const rim = ix === rx0 || ix === rx1 || iz === rz0 || iz === rz1;
  const top = rx1 - rx0 <= 1 || rz1 - rz0 <= 1;
  return rim || top ? page.roof : null;
}

export function pondAt(ix, iz) {
  return inRect(ix, iz, 16, -22, 24, -16);
}

// Plaza structures layered over the generated island. Returns a kind, null
// for carved air, or undefined to keep the terrain underneath.
export function plazaBlock(ix, iy, iz) {
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
  if (page && iy <= 12) return houseBlock(page, ix, iy, iz);

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
