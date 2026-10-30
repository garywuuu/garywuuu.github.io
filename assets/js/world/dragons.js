import * as THREE from "three";
import { VoxPart, joint, attach } from "./voxkit.js?v=20261030-zfight";

// Voxel dragons: a long neck, a hinged jaw for breathing fire, segmented
// wings that fold at the elbow, and a whip tail. +Z is forward.

export const DRAGON_LOOKS = {
  ember: {
    body: "#c8352a", dark: "#7e1d1a", trim: "#f2b33d", under: "#f6c86c", horn: "#3a2622",
    membrane: "#a8301f", edge: "#ffb347", glow: "#ff9a3a", eye: "#ffe27a",
    fire: [[1, 0.95, 0.55], [1, 0.55, 0.12], [0.85, 0.15, 0.05]],
  },
  frost: {
    body: "#6fc6e8", dark: "#357fb0", trim: "#eaf6ff", under: "#d8f2ff", horn: "#f2f8ff",
    membrane: "#4fa8d8", edge: "#e8fbff", glow: "#8ff0ff", eye: "#ffffff",
    fire: [[0.9, 1, 1], [0.45, 0.9, 1], [0.2, 0.45, 1]],
  },
  night: {
    body: "#2c2444", dark: "#16112a", trim: "#9a5cff", under: "#4a3a6a", horn: "#120e1e",
    membrane: "#3a1f6a", edge: "#d08cff", glow: "#c070ff", eye: "#ff6af0",
    fire: [[1, 0.75, 1], [0.8, 0.35, 1], [0.4, 0.1, 0.9]],
  },
  jade: {
    body: "#3a9a5a", dark: "#22603a", trim: "#f2c94c", under: "#cfe98e", horn: "#5a4426",
    membrane: "#2f7d4a", edge: "#e8ff9a", glow: "#9affb0", eye: "#ffd23f",
    fire: [[0.95, 1, 0.7], [0.5, 1, 0.45], [0.1, 0.7, 0.35]],
  },
};

// Clawed foot: a pad, three splayed toes with hooked claws, and a dewclaw.
function foot(part, look, w) {
  part.box(0, -0.035, 0.04, w, 0.08, w * 0.9, look.dark);
  for (const t of [-1, 0, 1]) {
    const ang = t * 0.32;
    const len = t ? 0.17 : 0.2;
    const cx = Math.sin(ang) * len * 0.5 + t * w * 0.3;
    const cz = 0.06 + Math.cos(ang) * len * 0.5 + w * 0.3;
    part.box(cx, -0.045, cz, 0.065, 0.06, len, look.dark, { ry: ang });
    const tx = cx + Math.sin(ang) * len * 0.5;
    const tz = cz + Math.cos(ang) * len * 0.5;
    part.spike([tx, -0.03, tz - 0.02], [tx + Math.sin(ang) * 0.09, -0.085, tz + Math.cos(ang) * 0.09], 0.03, look.horn);
  }
  part.spike([0, -0.03, -w * 0.4], [0, -0.07, -w * 0.4 - 0.12], 0.028, look.horn);
}

// Hind leg: a heavy haunch, a lean shin with a heel spur, then the foot.
function hindLeg(root, look, material, side) {
  const hip = joint(root, side * 0.44, 0.16, -0.48);
  const thigh = new VoxPart();
  thigh.box(0, -0.1, 0, 0.3, 0.38, 0.52, look.body);
  thigh.box(0, -0.34, 0.03, 0.22, 0.24, 0.3, look.body);
  thigh.box(side * 0.152, -0.02, -0.02, 0.012, 0.16, 0.3, look.dark, { rx: 0.25 });
  thigh.box(0, -0.47, 0.05, 0.18, 0.08, 0.2, look.dark);
  attach(hip, thigh, material);
  const knee = joint(hip, 0, -0.5, 0.05);
  const shin = new VoxPart();
  shin.box(0, -0.14, 0, 0.17, 0.3, 0.2, look.body);
  shin.box(0, -0.38, 0, 0.13, 0.24, 0.14, look.body);
  shin.box(0, -0.1, -0.11, 0.08, 0.16, 0.04, look.dark);
  shin.spike([0, -0.46, -0.06], [0, -0.38, -0.24], 0.04, look.horn);
  attach(knee, shin, material);
  const ankle = joint(knee, 0, -0.52, 0.0);
  const f = new VoxPart();
  foot(f, look, 0.22);
  attach(ankle, f, material);
  return { hip, knee, foot: ankle };
}

// Foreleg: shoulder plate, upper arm, a forearm with an elbow spike, paw.
function foreLeg(root, look, material, side) {
  const hip = joint(root, side * 0.44, 0.08, 0.6);
  const arm = new VoxPart();
  arm.box(0, -0.06, 0, 0.26, 0.3, 0.34, look.body);
  arm.box(0, -0.3, -0.02, 0.19, 0.26, 0.22, look.body);
  arm.box(side * 0.132, 0.0, -0.02, 0.012, 0.12, 0.22, look.dark, { rx: 0.25 });
  arm.spike([0, -0.4, -0.1], [0, -0.36, -0.28], 0.045, look.horn);
  attach(hip, arm, material);
  const knee = joint(hip, 0, -0.44, -0.02);
  const fore = new VoxPart();
  fore.box(0, -0.12, 0, 0.15, 0.26, 0.17, look.body);
  fore.box(0, -0.33, 0.01, 0.12, 0.2, 0.13, look.body);
  fore.box(0, -0.42, 0.02, 0.14, 0.05, 0.15, look.dark);
  attach(knee, fore, material);
  const wrist = joint(knee, 0, -0.46, 0.02);
  const f = new VoxPart();
  foot(f, look, 0.19);
  attach(wrist, f, material);
  return { hip, knee, foot: wrist };
}

function wing(root, look, material, side) {
  const s = side;
  const shoulder = joint(root, 0.4 * s, 0.6, 0.42);
  const arm = new VoxPart();
  // Upper arm bone, leading edge thickening, and the inner membrane.
  arm.box(0.55 * s, 0.02, 0.12, 1.1, 0.11, 0.12, look.body, { ry: s * 0.12 });
  arm.box(0.2 * s, 0.03, 0.06, 0.4, 0.16, 0.2, look.dark);
  arm.polygon([[0, 0.12], [1.1 * s, 0.16], [1.1 * s, -0.95], [0.55 * s, -1.0], [0.1 * s, -1.05], [0, -0.8]], 0, look.membrane, {
    edge: look.edge, glow: 0.35, z0: 0.2, zSpan: 1.0,
  });
  attach(shoulder, arm, material);

  const elbow = joint(shoulder, 1.1 * s, 0.02, 0.16);
  const fore = new VoxPart();
  const tips = [[1.85 * s, 0.32], [1.6 * s, -0.55], [1.05 * s, -1.12], [0.35 * s, -1.12]];
  for (const [tx, tz] of tips) {
    const len = Math.hypot(tx, tz);
    const ang = Math.atan2(tx, tz);
    fore.box(tx / 2, 0, tz / 2, 0.065, 0.065, len, look.body, { ry: ang });
  }
  fore.spike([0, 0.04, 0], [0.12 * s, 0.32, 0.18], 0.07, look.horn);
  fore.spike([1.75 * s, 0, 0.3], [2.15 * s, 0, 0.42], 0.05, look.trim, { glow: 0.4 });
  // Scalloped trailing edge between the finger tips.
  fore.polygon([
    [0, 0.02], [1.85 * s, 0.32], [1.45 * s, -0.1], [1.6 * s, -0.55], [1.12 * s, -0.62],
    [1.05 * s, -1.12], [0.62 * s, -0.86], [0.35 * s, -1.12], [0, -1.12],
  ], 0, look.membrane, { edge: look.edge, glow: 0.45, z0: -0.15, zSpan: 1.2 });
  attach(elbow, fore, material);
  shoulder.userData.elbow = elbow;
  return shoulder;
}

export function buildDragon(root, look, material) {
  const b = new VoxPart();
  // Chest, belly and haunches.
  b.box(0, 0.32, 0.38, 0.92, 0.72, 1.0, look.body);
  b.box(0, 0.3, -0.42, 0.78, 0.62, 0.9, look.body);
  b.box(0, 0.62, 0.1, 0.6, 0.12, 1.4, look.dark);
  for (let i = 0; i < 6; i += 1) {
    const z = 0.78 - i * 0.28;
    b.box(0, -0.05, z, 0.62 - i * 0.03, 0.1, 0.22, look.under, { shade: 0.95 });
    b.spike([0, 0.66, z], [0, 1.02 - i * 0.04, z - 0.18], 0.1 - i * 0.008, i % 2 ? look.trim : look.horn);
  }
  for (const s of [-1, 1]) {
    b.box(s * 0.465, 0.36, 0.1, 0.02, 0.08, 1.2, look.glow, { glow: 0.9 });
    b.box(s * 0.4, 0.26, -0.46, 0.04, 0.42, 0.62, look.dark);
  }
  attach(root, b, material);

  // Neck curves up and forward; head sits at the end of it.
  const neck = joint(root, 0, 0.56, 0.86);
  const n = new VoxPart();
  n.box(0, 0.08, 0.18, 0.46, 0.46, 0.5, look.body, { rx: -0.35 });
  n.box(0, 0.26, 0.48, 0.38, 0.38, 0.42, look.body, { rx: -0.55 });
  n.box(0, 0.02, 0.32, 0.3, 0.12, 0.6, look.under, { rx: -0.45 });
  n.spike([0, 0.36, 0.22], [0, 0.66, 0.02], 0.08, look.trim);
  n.spike([0, 0.52, 0.48], [0, 0.82, 0.3], 0.07, look.horn);
  attach(neck, n, material);

  const head = joint(neck, 0, 0.42, 0.66);
  const h = new VoxPart();
  h.box(0, 0.08, 0.12, 0.54, 0.42, 0.56, look.body);
  h.box(0, 0.02, 0.54, 0.4, 0.26, 0.5, look.body);
  h.box(0, 0.16, 0.5, 0.32, 0.06, 0.44, look.dark);
  for (const s of [-1, 1]) {
    // Glowing eyes with a slit pupil, heavy brow, swept horns, cheek frills.
    h.box(s * 0.275, 0.13, 0.28, 0.02, 0.1, 0.16, look.eye, { glow: 1.4, shade: 1 });
    h.box(s * 0.287, 0.13, 0.28, 0.012, 0.1, 0.035, "#120a08", { shade: 1 });
    h.box(s * 0.25, 0.235, 0.28, 0.1, 0.07, 0.26, look.dark, { rz: s * -0.25 });
    h.spike([s * 0.2, 0.28, 0.08], [s * 0.42, 0.72, -0.5], 0.11, look.horn);
    h.spike([s * 0.27, 0.18, 0.0], [s * 0.5, 0.36, -0.38], 0.07, look.trim);
    h.spike([s * 0.28, -0.04, 0.1], [s * 0.56, 0.04, -0.12], 0.08, look.trim);
    h.spike([s * 0.27, -0.1, 0.04], [s * 0.5, -0.16, -0.16], 0.06, look.dark);
    h.box(s * 0.09, 0.07, 0.8, 0.06, 0.04, 0.02, look.glow, { glow: 1.2, shade: 1 });
    h.spike([s * 0.15, -0.1, 0.72], [s * 0.15, -0.2, 0.74], 0.03, "#fff6e0");
  }
  attach(head, h, material);

  const jaw = joint(head, 0, -0.1, 0.18);
  const j = new VoxPart();
  j.box(0, -0.04, 0.34, 0.36, 0.1, 0.56, look.dark);
  j.box(0, 0.015, 0.34, 0.26, 0.02, 0.44, look.glow, { glow: 0.9, shade: 1 });
  for (const s of [-1, 1]) j.spike([s * 0.14, 0.01, 0.52], [s * 0.14, 0.1, 0.54], 0.028, "#fff6e0");
  attach(jaw, j, material);

  const legs = [
    foreLeg(root, look, material, -1),
    foreLeg(root, look, material, 1),
    hindLeg(root, look, material, -1),
    hindLeg(root, look, material, 1),
  ];

  const tail = joint(root, 0, 0.32, -0.86);
  attach(tail, new VoxPart()
    .box(0, 0, -0.36, 0.5, 0.42, 0.76, look.body)
    .box(0, -0.2, -0.36, 0.36, 0.06, 0.66, look.under)
    .spike([0, 0.2, -0.24], [0, 0.48, -0.5], 0.09, look.trim), material);
  const tailMid = joint(tail, 0, 0, -0.72);
  attach(tailMid, new VoxPart()
    .box(0, 0, -0.34, 0.34, 0.3, 0.72, look.body)
    .spike([0, 0.14, -0.24], [0, 0.38, -0.46], 0.075, look.horn), material);
  const tailTip = joint(tailMid, 0, 0, -0.7);
  const tt = new VoxPart()
    .box(0, 0, -0.32, 0.22, 0.2, 0.66, look.body)
    .box(0, 0, -0.75, 0.14, 0.14, 0.3, look.dark);
  // Glowing spade on the tip.
  tt.polygon([[0, -0.8], [0.26, -1.0], [0, -1.35], [-0.26, -1.0]], 0, look.trim, { edge: look.glow, glow: 1.1, z0: 0.8, zSpan: 0.5 });
  attach(tailTip, tt, material);

  const left = wing(root, look, material, -1);
  const right = wing(root, look, material, 1);
  // Mouth sits at the front of the snout; fire particles are emitted here.
  const mouth = joint(head, 0, -0.06, 0.86);

  return {
    wings: [left, right],
    neck,
    head,
    jaw,
    mouth,
    tail,
    tailMid,
    tailTip,
    legs: legs.map((l) => l.hip),
    knees: legs.map((l) => l.knee),
    feet: legs.map((l) => l.foot),
  };
}
