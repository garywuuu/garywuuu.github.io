import { VoxPart, joint, attach } from "./voxkit.js?v=20261015-world";

// Chibi cats: oversized heads, big glossy eyes, blush, stubby legs, and a
// thick curling tail. Every joint is one merged mesh.

const C = {
  black: "#2b2b36",
  ink: "#1f1f29",
  white: "#f7f4ee",
  cream: "#f6e2bf",
  orange: "#f0943f",
  orangeDark: "#c8662a",
  ginger: "#f7b54a",
  gray: "#9aa1ab",
  grayDark: "#6c737e",
  brown: "#6b4a3a",
  siamese: "#efe0c6",
  pink: "#ff8fa8",
  nose: "#ff7096",
  blush: "#ff9db5",
  mouth: "#3a2a2a",
  green: "#8fe36a",
  yellow: "#ffd23f",
  blue: "#6ab8ff",
  amber: "#ffb347",
  shine: "#ffffff",
};

export const CAT_LOOKS = {
  tuxedo: { body: C.black, belly: C.white, muzzle: C.white, sock: C.white, eye: C.green, tailTip: C.white, chest: true },
  tabby: { body: C.orange, belly: C.cream, muzzle: C.cream, sock: C.cream, eye: C.green, stripes: C.orangeDark },
  calico: { body: C.white, belly: C.white, muzzle: C.white, eye: C.amber, patches: [[C.orange, 1, 0.06, 0.08], [C.black, -1, 0.02, -0.12], [C.orange, 0, 0.14, -0.04]], earL: C.orange, earR: C.black },
  siamese: { body: C.siamese, belly: C.white, muzzle: "#8a6650", sock: C.brown, eye: C.blue, tail: C.brown, ears: C.brown, mask: "#a8846a" },
  void: { body: C.ink, belly: C.ink, muzzle: C.ink, eye: C.yellow, inner: "#5a3a4a" },
  cream: { body: C.cream, belly: C.white, muzzle: C.white, sock: C.white, eye: C.amber, stripes: "#e6c48e" },
  gray: { body: C.gray, belly: C.white, muzzle: C.white, sock: C.white, eye: C.amber, stripes: C.grayDark },
  cow: { body: C.white, belly: C.white, muzzle: C.white, eye: C.green, tailTip: C.black, patches: [[C.black, -1, 0.04, 0.06], [C.black, 1, 0.02, -0.14]], earL: C.black, spot: C.black },
  ginger: { body: C.ginger, belly: C.cream, muzzle: C.cream, sock: C.cream, eye: C.green, stripes: "#e0892e" },
  spot: { body: C.white, belly: C.white, muzzle: C.white, eye: C.blue, patches: [[C.black, 1, 0.08, -0.02]], earR: C.black, tail: C.black },
  // Kittens reuse a parent's coat at a smaller scale.
};

export const CAT_POSE = { standY: 0.27, sitY: 0.23, loafY: 0.15 };

export function buildCat(root, look, material) {
  const body = look.body;
  const belly = look.belly || body;
  const muzzle = look.muzzle || belly;
  const sock = look.sock || body;

  const torso = joint(root, 0, CAT_POSE.standY, 0);
  const t = new VoxPart();
  t.box(0, 0, 0, 0.36, 0.28, 0.5, body);
  t.box(0, 0.02, 0.17, 0.34, 0.27, 0.16, body);
  t.box(0, -0.125, 0.02, 0.28, 0.04, 0.4, belly, { shade: 0.9 });
  t.box(0, -0.03, 0.245, 0.24, 0.2, 0.02, belly);
  if (look.chest) t.box(0, -0.02, 0.252, 0.18, 0.22, 0.02, C.white);
  if (look.stripes) {
    for (const z of [-0.17, -0.07, 0.03, 0.13]) {
      t.box(0, 0.142, z, 0.3, 0.012, 0.045, look.stripes);
      for (const side of [-1, 1]) t.box(side * 0.182, 0.06, z, 0.012, 0.1, 0.04, look.stripes);
    }
  }
  for (const [color, side, y, z] of look.patches || []) {
    if (side === 0) t.box(0, 0.142, z, 0.22, 0.012, 0.18, color);
    else t.box(side * 0.182, y, z, 0.012, 0.16, 0.2, color);
  }
  attach(torso, t, material);

  // Head sits forward and high: chibi proportions.
  const head = joint(torso, 0, 0.17, 0.25);
  const h = new VoxPart();
  // Three overlapping boxes chamfer the corners so the head reads as round.
  h.box(0, 0.05, 0.08, 0.52, 0.34, 0.36, body);
  h.box(0, 0.06, 0.08, 0.44, 0.42, 0.34, body);
  h.box(0, 0.05, 0.08, 0.46, 0.36, 0.42, body);
  for (const side of [-1, 1]) h.box(side * 0.265, -0.07, 0.12, 0.06, 0.13, 0.24, body);
  h.box(0, -0.075, 0.29, 0.24, 0.11, 0.04, muzzle);
  if (look.mask) {
    h.box(0, -0.05, 0.296, 0.3, 0.17, 0.012, look.mask);
    h.box(0, 0.06, 0.296, 0.1, 0.1, 0.012, look.mask);
  }
  if (look.stripes) {
    h.box(0, 0.27, 0.16, 0.05, 0.012, 0.16, look.stripes);
    for (const side of [-1, 1]) h.box(side * 0.1, 0.27, 0.15, 0.04, 0.012, 0.13, look.stripes, { ry: side * 0.25 });
    for (const side of [-1, 1]) h.box(side * 0.212, 0.12, 0.2, 0.012, 0.035, 0.12, look.stripes);
  }
  if (look.spot) h.box(0.13, 0.17, 0.294, 0.14, 0.11, 0.012, look.spot);
  // Little inverted-triangle nose and a ":3" mouth, all flush pixels.
  h.box(0, -0.04, 0.314, 0.075, 0.026, 0.012, C.nose, { shade: 1 });
  h.box(0, -0.06, 0.314, 0.036, 0.018, 0.012, C.nose, { shade: 1 });
  h.box(0, -0.083, 0.312, 0.016, 0.03, 0.008, C.mouth, { shade: 1 });
  for (const side of [-1, 1]) {
    h.box(side * 0.022, -0.102, 0.312, 0.03, 0.014, 0.008, C.mouth, { shade: 1 });
    h.box(side * 0.044, -0.092, 0.312, 0.016, 0.02, 0.008, C.mouth, { shade: 1 });
    h.box(side * 0.18, -0.045, 0.293, 0.09, 0.045, 0.012, C.blush, { glow: 0.12, shade: 1 });
    for (const row of [-1, 1]) h.box(side * 0.3, -0.07 + row * 0.028, 0.24, 0.16, 0.008, 0.008, "#ffffff", { rz: side * row * 0.12, shade: 1 });
  }
  attach(head, h, material);

  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = joint(head, side * 0.12, 0.05, 0.296);
    const e = new VoxPart();
    e.box(0, 0, 0, 0.11, 0.135, 0.016, look.eye, { shade: 1 });
    e.box(side * 0.008, -0.005, 0.006, 0.07, 0.115, 0.012, "#151018", { shade: 1 });
    e.box(-0.022, 0.03, 0.013, 0.038, 0.038, 0.01, C.shine, { glow: 0.6, shade: 1 });
    e.box(0.024, -0.035, 0.013, 0.018, 0.018, 0.01, C.shine, { glow: 0.5, shade: 1 });
    attach(eye, e, material);
    eyes.push(eye);
  }

  const ears = [];
  for (const side of [-1, 1]) {
    const ear = joint(head, side * 0.16, 0.26, 0.06);
    ear.rotation.z = -side * 0.12;
    const color = (side < 0 ? look.earL : look.earR) || look.ears || body;
    const e = new VoxPart();
    e.box(0, 0.03, 0, 0.17, 0.07, 0.07, color);
    e.box(side * 0.01, 0.09, 0, 0.12, 0.06, 0.06, color);
    e.box(side * 0.02, 0.14, 0, 0.06, 0.05, 0.05, color);
    e.box(side * 0.006, 0.065, 0.036, 0.09, 0.07, 0.008, look.inner || C.pink, { shade: 1 });
    e.box(side * 0.014, 0.11, 0.031, 0.05, 0.04, 0.008, look.inner || C.pink, { shade: 1 });
    attach(ear, e, material);
    ears.push(ear);
  }

  const legs = [];
  for (const [x, z] of [[-0.105, 0.16], [0.105, 0.16], [-0.105, -0.16], [0.105, -0.16]]) {
    const hip = joint(torso, x, -0.1, z);
    const l = new VoxPart();
    l.box(0, -0.06, 0, 0.12, 0.12, 0.12, body);
    l.box(0, -0.135, 0.012, 0.13, 0.055, 0.145, sock);
    l.box(0, -0.161, 0.07, 0.1, 0.008, 0.02, C.pink, { shade: 1 });
    attach(hip, l, material);
    legs.push(hip);
  }

  const tailColor = look.tail || body;
  const tail = joint(torso, 0, 0.07, -0.24);
  attach(tail, new VoxPart().box(0, 0, -0.09, 0.11, 0.11, 0.2, tailColor), material);
  const tailMid = joint(tail, 0, 0, -0.18);
  attach(tailMid, new VoxPart().box(0, 0, -0.09, 0.115, 0.115, 0.19, tailColor), material);
  const tailTip = joint(tailMid, 0, 0, -0.18);
  attach(tailTip, new VoxPart().box(0, 0, -0.08, 0.125, 0.125, 0.17, look.tailTip || tailColor), material);
  tail.rotation.x = 0.95;
  tailTip.rotation.x = 0.6;

  return { torso, head, eyes, ears, legs, tail, tailMid, tailTip };
}
