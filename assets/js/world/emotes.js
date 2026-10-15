import * as THREE from "three";

// Pixel-art speech-bubble emotes: hearts when petted, Zs when napping,
// sparkles for happy moments. Pooled sprites that float up and fade.

const ART = {
  heart: {
    colors: { o: "#7a1f3d", p: "#ff5c8a", l: "#ffb3c8" },
    rows: [
      ".oo..oo.",
      "ollooppo",
      "olpppppo",
      "oppppppo",
      ".oppppo.",
      "..oppo..",
      "...oo...",
      "........",
    ],
  },
  z: {
    colors: { o: "#1d2a5a", w: "#eaf2ff" },
    rows: [
      "oooooooo",
      "owwwwwwo",
      "ooooowwo",
      "...owwo.",
      "..owwo..",
      ".owwoooo",
      "owwwwwwo",
      "oooooooo",
    ],
  },
  sparkle: {
    colors: { y: "#ffe066", w: "#ffffff" },
    rows: [
      "...y....",
      "...y....",
      "..ywy...",
      "yywwwyy.",
      "..ywy...",
      "...y....",
      "...y....",
      "........",
    ],
  },
  note: {
    colors: { o: "#2a1a4a", p: "#c58bff" },
    rows: [
      "...oooo.",
      "...oppo.",
      "...o..o.",
      "...o..o.",
      ".ooo.ooo",
      "oppoopp.",
      "oppoopp.",
      ".oo..oo.",
    ],
  },
};

function artTexture(art) {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 8;
  const g = c.getContext("2d");
  art.rows.forEach((row, y) => {
    for (let x = 0; x < 8; x += 1) {
      const color = art.colors[row[x]];
      if (!color) continue;
      g.fillStyle = color;
      g.fillRect(x, y, 1, 1);
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeEmotes(scene, size = 48) {
  const textures = Object.fromEntries(Object.entries(ART).map(([k, art]) => [k, artTexture(art)]));
  const pool = [];
  for (let i = 0; i < size; i += 1) {
    const mat = new THREE.SpriteMaterial({ map: textures.heart, transparent: true, depthWrite: false, fog: true });
    const s = new THREE.Sprite(mat);
    s.visible = false;
    s.renderOrder = 5;
    s.userData = { life: 0, max: 1, vx: 0, vy: 0, vz: 0, base: 0.2, wobble: 0 };
    scene.add(s);
    pool.push(s);
  }
  let next = 0;

  function spawn(kind, x, y, z, opts = {}) {
    const s = pool[next];
    next = (next + 1) % pool.length;
    s.material.map = textures[kind] || textures.heart;
    s.material.opacity = 1;
    s.position.set(x, y, z);
    const d = s.userData;
    d.max = opts.life ?? 1.6;
    d.life = d.max;
    d.vx = opts.vx ?? (Math.random() - 0.5) * 0.25;
    d.vy = opts.vy ?? 0.45;
    d.vz = opts.vz ?? (Math.random() - 0.5) * 0.25;
    d.base = opts.size ?? 0.2;
    d.wobble = Math.random() * 6;
    d.drift = kind === "z" ? 0.35 : 0;
    s.scale.setScalar(0.01);
    s.visible = true;
  }

  function update(dt) {
    for (const s of pool) {
      if (!s.visible) continue;
      const d = s.userData;
      d.life -= dt;
      if (d.life <= 0) {
        s.visible = false;
        continue;
      }
      const age = 1 - d.life / d.max;
      d.wobble += dt * 5;
      s.position.x += (d.vx + Math.sin(d.wobble) * 0.12 + d.drift) * dt;
      s.position.y += d.vy * dt * (1 - age * 0.5);
      s.position.z += d.vz * dt;
      // Pop in, hold, then shrink and fade.
      const pop = age < 0.15 ? THREE.MathUtils.smoothstep(age, 0, 0.15) * 1.25 : 1.25 - Math.min(0.25, (age - 0.15) * 1.5);
      const grow = d.drift ? 0.7 + age * 0.8 : 1;
      s.scale.setScalar(d.base * pop * grow);
      s.material.opacity = age > 0.7 ? 1 - (age - 0.7) / 0.3 : 1;
    }
  }

  return { spawn, update };
}
