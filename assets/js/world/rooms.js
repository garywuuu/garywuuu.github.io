import * as THREE from "three";

// Walk-in rooms for the About, Research and Experience houses. Each house is
// lined with framed exhibits painted onto canvas textures; look at one and
// press E to open it in the reader.

const ABOUT = [
  {
    slot: "back",
    icon: "wave",
    kicker: "About",
    title: "Hey! I'm Gary",
    lines: ["Living in SF.", "Building General", "Context Labs."],
    body: [
      "I'm currently living in SF and building General Context Labs, with our first consumer product, Instaplay.",
      "Before this, I was an Associate Product Manager at Salesforce, where I spearheaded RL Environments and was Product Lead for Agentforce Tableau's agentic data analysis platform.",
    ],
    links: [["Instaplay", "https://www.instaplay.ai/"], ["General Context Labs", "https://generalcontextlabs.com/"]],
  },
  {
    slot: "north0",
    icon: "cap",
    kicker: "School",
    title: "Harvard AB/SM",
    lines: ["CS, concurrent", "bachelor's + master's"],
    body: [
      "I received my Bachelor's and Master's degrees in Computer Science concurrently from Harvard University through the AB/SM program.",
      "I focused on ML Fairness and Distributed Systems, learning from Jim Waldo, Stephen Chong, Yiling Chen, and Cynthia Dwork.",
    ],
    links: [["Read the research", "/research/"]],
  },
  {
    slot: "north1",
    icon: "controller",
    kicker: "Now",
    title: "Instaplay",
    lines: ["Our first consumer", "product. Games you", "can make + play."],
    body: [
      "Instaplay is the first consumer product from General Context Labs. The booths out in the plaza are Instaplay games you can play right here.",
    ],
    links: [["Open Instaplay", "https://www.instaplay.ai/"]],
  },
  {
    slot: "south0",
    icon: "racket",
    kicker: "Outside of work",
    title: "Tennis, Sichuan, DJ",
    lines: ["Tennis. Spicy", "Sichuan food.", "Decks."],
    body: ["Outside of work, I play tennis, eat spicy Sichuan food, and DJ.", "There's a court out back if you want to serve a few."],
    links: [],
  },
  {
    slot: "south1",
    icon: "letter",
    kicker: "Contact",
    title: "Say hi",
    lines: ["GitHub · LinkedIn · X"],
    body: ["Always happy to talk games, AI products, or Sichuan food recommendations."],
    links: [["GitHub", "https://github.com/garywuuu"], ["LinkedIn", "https://www.linkedin.com/in/garywu23/"], ["X", "https://x.com/gary_wu23"]],
  },
];

const NOW_JOB = {
  title: "Founder",
  org: "General Context Labs",
  location: "San Francisco",
  start: "2026-02",
  end: null,
  dates: "Now",
  bullets: ["Building General Context Labs, starting with our first consumer product, Instaplay."],
  technologies: [],
  link: ["Open Instaplay", "https://www.instaplay.ai/"],
};

// Wall slots per house, in world coordinates. rotY turns the exhibit's front
// (+z) to face into the room.
const SLOTS = {
  about: {
    back: { x: -19.93, y: 3.25, z: 10, rotY: Math.PI / 2, w: 2.7, h: 2.5 },
    north0: { x: -18.4, y: 3.05, z: 7.07, rotY: 0, w: 1.7, h: 1.9 },
    north1: { x: -15.9, y: 3.05, z: 7.07, rotY: 0, w: 1.7, h: 1.9 },
    south0: { x: -15.9, y: 3.05, z: 12.93, rotY: Math.PI, w: 1.7, h: 1.9 },
    south1: { x: -18.4, y: 3.05, z: 12.93, rotY: Math.PI, w: 1.7, h: 1.9 },
  },
  // Left to right as you walk in through the west door.
  research: [
    { x: 16.5, z: 7.07, rotY: 0 },
    { x: 19.5, z: 7.07, rotY: 0 },
    { x: 20.93, z: 8.5, rotY: -Math.PI / 2 },
    { x: 20.93, z: 11.5, rotY: -Math.PI / 2 },
    { x: 19.5, z: 12.93, rotY: Math.PI },
    { x: 16.5, z: 12.93, rotY: Math.PI },
  ],
  // Oldest on the left wall, around the back, newest on the right wall.
  experience: [
    { x: 5.93, z: 21.5, rotY: -Math.PI / 2 },
    { x: 3.8, z: 23.93, rotY: Math.PI },
    { x: 1.0, z: 23.93, rotY: Math.PI },
    { x: -1.8, z: 23.93, rotY: Math.PI },
    { x: -3.93, z: 21.5, rotY: Math.PI / 2 },
  ],
};

// Roles shown on the website but left out of the room.
const HIDDEN_ORGS = new Set(["Verita"]);

const PAPER_TONES = ["#2f5d8a", "#8a3b2f", "#2f7a5a", "#6a3f8a", "#8a6a2f", "#2f6f80", "#7a2f5d"];

const ICONS = {
  wave: { c: { o: "#3a2414", s: "#f2c79a" }, r: ["...o.o....", "..os.so...", "..os.so.o.", "..osososo.", ".ossssss o", ".osssssso.", ".osssssso.", "..ossssso.", "...osssso.", "....oooo.."] },
  cap: { c: { o: "#14141c", k: "#26263a", g: "#f0c14b" }, r: [".........", "....o....", "..ookoo..", "ookkkkkoo", "..ookoog.", "...okko.g", "...okko.g", "....oo..g", "........."] },
  controller: { c: { o: "#1b1b1b", b: "#c43cff", w: "#ffffff", y: "#ffd23f" }, r: ["..........", ".oooooooo.", "obbbbbbbbo", "obwbbbbybo", "owwwbbyby o", "obwbbbbybo", "obbboobbbo", ".obo..obo.", "..o....o.."] },
  racket: { c: { o: "#2a2a2a", g: "#c8f03c", w: "#f4efe6", b: "#8a5a2a" }, r: ["..ooo.....", ".owwwo....", "owowowo...", "owwwwwo...", "owowowo.gg", ".owwwo.ggg", "..ooo..gg.", "...b......", "....b.....", ".....b...."] },
  letter: { c: { o: "#3a2414", p: "#f4efe6", r: "#d0453a" }, r: ["..........", "oooooooooo", "oopppppppoo", "opoppppopo", "oppopropppo", "opppoopppo", "oppppppppo", "oooooooooo"] },
};

function drawIcon(ctx, icon, x, y, px) {
  icon.r.forEach((row, j) => {
    for (let i = 0; i < row.length; i += 1) {
      const color = icon.c[row[i]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + i * px, y + j * px, px, px);
    }
  });
}

function wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fillLines(ctx, lines, x, y, lh, max = Infinity) {
  lines.slice(0, max).forEach((l, i) => {
    const last = i === max - 1 && lines.length > max;
    ctx.fillText(last ? `${l.replace(/[\s,.;:]+\S*$/, "")}…` : l, x, y + i * lh);
  });
  return y + Math.min(lines.length, max) * lh;
}

function canvasFor(w, h, px = 300) {
  const c = document.createElement("canvas");
  c.width = Math.round(w * px);
  c.height = Math.round(h * px);
  return c;
}

function seeded(n) {
  let s = n * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// A tiny procedural "figure" so every poster looks like a real paper.
function drawFigure(ctx, x, y, w, h, kind, tone, seed) {
  const rnd = seeded(seed);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#1b1b1b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 10);
  ctx.lineTo(x + 14, y + h - 14);
  ctx.lineTo(x + w - 10, y + h - 14);
  ctx.stroke();
  const ix = x + 22;
  const iw = w - 40;
  const iy = y + 14;
  const ih = h - 34;
  if (kind === 0) {
    const n = 7;
    for (let i = 0; i < n; i += 1) {
      const bh = ih * (0.25 + rnd() * 0.7);
      ctx.fillStyle = i % 2 ? tone : "#c9c2b4";
      ctx.fillRect(ix + (i * iw) / n, iy + ih - bh, iw / n - 6, bh);
    }
  } else if (kind === 1) {
    for (let k = 0; k < 2; k += 1) {
      ctx.strokeStyle = k ? tone : "#9a9284";
      ctx.lineWidth = 5;
      ctx.beginPath();
      let v = 0.8;
      for (let i = 0; i <= 12; i += 1) {
        v = Math.max(0.08, v - rnd() * (k ? 0.12 : 0.06));
        const px = ix + (i / 12) * iw;
        const py = iy + ih * (1 - v);
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
  } else if (kind === 2) {
    const centers = [[0.25, 0.3], [0.7, 0.35], [0.45, 0.75]];
    centers.forEach(([cx, cy], k) => {
      ctx.fillStyle = [tone, "#c9822b", "#5a5a5a"][k];
      for (let i = 0; i < 14; i += 1) {
        const px = ix + (cx + (rnd() - 0.5) * 0.28) * iw;
        const py = iy + (cy + (rnd() - 0.5) * 0.3) * ih;
        ctx.fillRect(px - 5, py - 5, 10, 10);
      }
    });
  } else {
    const n = 6;
    for (let j = 0; j < n; j += 1) {
      for (let i = 0; i < n; i += 1) {
        ctx.globalAlpha = 0.15 + rnd() * 0.85;
        ctx.fillStyle = tone;
        ctx.fillRect(ix + (i * iw) / n, iy + (j * ih) / n, iw / n - 3, ih / n - 3);
      }
    }
    ctx.globalAlpha = 1;
  }
}

function paintPaper(paper, index, font) {
  const w = 1.8;
  const h = 2.3;
  const c = canvasFor(w, h);
  const ctx = c.getContext("2d");
  const W = c.width;
  const H = c.height;
  const tone = PAPER_TONES[index % PAPER_TONES.length];
  const pad = 30;
  ctx.fillStyle = "#f6f1e6";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = tone;
  ctx.fillRect(0, 0, W, 64);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 26px ${font}`;
  ctx.textBaseline = "middle";
  const course = paper.venue.split(":")[0];
  ctx.fillText(course.toUpperCase(), pad, 33);
  ctx.textAlign = "right";
  ctx.fillText(String(paper.year), W - pad, 33);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#14110d";
  ctx.font = `bold 40px ${font}`;
  let y = fillLines(ctx, wrap(ctx, paper.title, W - pad * 2), pad, 90, 46, 4) + 10;
  ctx.fillStyle = tone;
  ctx.fillRect(pad, y, 90, 5);
  y += 22;
  const figH = 190;
  drawFigure(ctx, pad, y, W - pad * 2, figH, index % 4, tone, index + 3);
  y += figH + 22;
  ctx.fillStyle = "#3a352c";
  ctx.font = `22px ${font}`;
  fillLines(ctx, wrap(ctx, paper.summary, W - pad * 2), pad, y, 28, Math.floor((H - y - 50) / 28));
  ctx.fillStyle = tone;
  ctx.font = `bold 20px ${font}`;
  ctx.textBaseline = "bottom";
  ctx.fillText("E · READ", pad, H - 16);
  return { canvas: c, w, h, frame: "#3b2a1c" };
}

function fmtMonth(ym) {
  if (!ym) return "Now";
  const [y, m] = ym.split("-").map(Number);
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}`;
}

function paintPlaque(job, font) {
  const w = 2.0;
  const h = 1.55;
  const c = canvasFor(w, h);
  const ctx = c.getContext("2d");
  const W = c.width;
  const H = c.height;
  const pad = 34;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1d1a2e");
  g.addColorStop(1, "#0f0d18");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#f0c14b";
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, W - 28, H - 28);
  ctx.textBaseline = "top";
  ctx.fillStyle = "#f0c14b";
  ctx.font = `bold 22px ${font}`;
  ctx.fillText((job.dates || `${fmtMonth(job.start)} — ${fmtMonth(job.end)}`).toUpperCase(), pad, 36);
  ctx.font = `bold ${job.org.length > 14 ? 50 : 62}px ${font}`;
  ctx.fillStyle = "#ffffff";
  let y = fillLines(ctx, wrap(ctx, job.org, W - pad * 2), pad, 70, 64, 2);
  ctx.font = `italic 28px ${font}`;
  ctx.fillStyle = "#e9dcc0";
  y = fillLines(ctx, wrap(ctx, job.title, W - pad * 2), pad, y + 6, 34, 2) + 12;
  ctx.font = `20px ${font}`;
  ctx.fillStyle = "#b9b2c8";
  fillLines(ctx, wrap(ctx, job.bullets[0] || "", W - pad * 2), pad, y, 26, Math.max(0, Math.floor((H - y - 48) / 26)));
  ctx.fillStyle = "#f0c14b";
  ctx.font = `bold 18px ${font}`;
  ctx.textBaseline = "bottom";
  ctx.fillText("E · READ", pad, H - 26);
  return { canvas: c, w, h, frame: "#f0c14b" };
}

function paintNote(note, slot, font) {
  const { w, h } = slot;
  const c = canvasFor(w, h);
  const ctx = c.getContext("2d");
  const W = c.width;
  const H = c.height;
  const pad = 30;
  ctx.fillStyle = "#f4ead2";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#e8dab8";
  for (let y = 120; y < H; y += 44) ctx.fillRect(pad, y, W - pad * 2, 2);
  const big = note.slot === "back";
  const px = big ? 22 : 12;
  drawIcon(ctx, ICONS[note.icon], pad, pad, px);
  ctx.textBaseline = "top";
  ctx.fillStyle = "#8a5a2a";
  ctx.font = `bold ${big ? 32 : 22}px ${font}`;
  ctx.fillText(note.kicker.toUpperCase(), pad + px * 11 + 10, pad + 6);
  ctx.fillStyle = "#1b140c";
  ctx.font = `bold ${big ? 96 : 46}px ${font}`;
  let y = fillLines(ctx, wrap(ctx, note.title, W - pad * 2), pad, pad + px * 10 + 22, big ? 100 : 52, 2) + 14;
  ctx.font = `${big ? 56 : 30}px ${font}`;
  ctx.fillStyle = "#3a2a18";
  for (const line of note.lines) {
    y = fillLines(ctx, wrap(ctx, line, W - pad * 2), pad, y, big ? 66 : 38, 2);
  }
  ctx.fillStyle = "#8a5a2a";
  ctx.font = `bold 20px ${font}`;
  ctx.textBaseline = "bottom";
  ctx.fillText("E · READ", pad, H - 18);
  return { canvas: c, w, h, frame: "#5a3a1c" };
}

function exhibitMesh(art, slot, renderer) {
  const group = new THREE.Group();
  const tex = new THREE.CanvasTexture(art.canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer?.capabilities?.getMaxAnisotropy?.() || 4;
  const face = new THREE.MeshBasicMaterial({ map: tex });
  const frameMat = new THREE.MeshBasicMaterial({ color: art.frame });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(art.w + 0.12, art.h + 0.12, 0.06), frameMat);
  frame.position.z = 0.03;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(art.w, art.h), face);
  panel.position.z = 0.062;
  group.add(frame, panel);
  group.position.set(slot.x, slot.y ?? 3.05, slot.z);
  group.rotation.y = slot.rotY;
  group.userData.mats = [face, frameMat];
  return group;
}

export async function loadRoomContent() {
  const get = (url) => fetch(url).then((r) => (r.ok ? r.json() : [])).catch(() => []);
  const [papers, jobs] = await Promise.all([get("/data/papers.json"), get("/data/experience.json")]);
  return { papers, jobs };
}

export function buildRooms(scene, { papers, jobs }, { font, renderer }) {
  const exhibits = [];
  const add = (art, slot, reader) => {
    const mesh = exhibitMesh(art, slot, renderer);
    mesh.userData.reader = reader;
    scene.add(mesh);
    exhibits.push(mesh);
  };

  for (const note of ABOUT) {
    const slot = SLOTS.about[note.slot];
    add(paintNote(note, slot, font), slot, {
      theme: "about",
      kicker: note.kicker,
      title: note.title,
      body: note.body,
      links: note.links,
      page: ["Full about page", "/"],
    });
  }

  [...papers]
    .sort((a, b) => b.year - a.year)
    .slice(0, SLOTS.research.length)
    .forEach((paper, i) => {
      const slot = { ...SLOTS.research[i], y: 3.15 };
      add(paintPaper(paper, i, font), slot, {
        theme: "research",
        kicker: `${paper.venue} · ${paper.year}`,
        title: paper.title,
        body: [paper.summary],
        doc: paper.pdf ? encodeURI(paper.pdf) : null,
        links: [],
        page: ["All research", "/research/"],
      });
    });

  const timeline = [...jobs.filter((j) => j.org && !HIDDEN_ORGS.has(j.org)), NOW_JOB]
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(-SLOTS.experience.length);
  timeline.forEach((job, i) => {
    const slot = { ...SLOTS.experience[i], y: 3.05 };
    add(paintPlaque(job, font), slot, {
      theme: "experience",
      kicker: `${job.org} · ${job.dates || `${fmtMonth(job.start)} – ${fmtMonth(job.end)}`}`,
      title: job.title,
      bullets: job.bullets,
      tags: job.technologies,
      links: job.link ? [job.link] : [],
      page: ["Full experience", "/experience/"],
    });
  });

  // A gold rail runs under the plaques around the experience room.
  const rail = new THREE.MeshBasicMaterial({ color: "#f0c14b" });
  const railY = 2.05;
  for (const [x, z, sx, sz] of [[0.97, 23.96, 9.9, 0.04], [-3.96, 21.5, 0.04, 4.9], [5.96, 21.5, 0.04, 4.9]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.06, sz), rail);
    m.position.set(x, railY, z);
    scene.add(m);
  }

  const warm = new THREE.Color();
  function update(light) {
    // Rooms are lantern-lit: never fully dark, warmer at night.
    const k = 0.62 + light * 0.38;
    warm.setRGB(k, k * (0.9 + light * 0.1), k * (0.8 + light * 0.2));
    for (const ex of exhibits) ex.userData.mats[0].color.copy(warm);
  }

  return { exhibits, update };
}
