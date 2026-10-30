import * as THREE from "three";
import { VoxPart, joint, attach, easeJoint, tuckedMaterial } from "./voxkit.js?v=20261030-zfight";

// Voxel cats: long bodies on long legs, small round heads with big glossy
// eyes, tall ears and a long tail. Every joint is one merged mesh.

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

// Leg geometry the poser uses to keep paws on the ground: hips sit hipY
// below the torso's center, with the paw pad upper + lower below the hip.
export const CAT_POSE = { standY: 0.325, hipY: -0.07, frontZ: 0.2, backZ: -0.19, upper: 0.14, lower: 0.14 };

// The head is modelled at chibi size and scaled down on its joint, so the
// face keeps its pixel detail; kittens scale it back up.
export const CAT_HEAD = 0.5;

// How fast cats live: scales their walking speeds, mood lengths and every
// idle animation. 1 is the old, rather frantic pace.
export const CAT_PACE = 0.6;

export function buildCat(root, look, material) {
  const body = look.body;
  const belly = look.belly || body;
  const muzzle = look.muzzle || belly;
  const sock = look.sock || body;

  // Long, low body with a gentle rise over the shoulders and haunches.
  const torso = joint(root, 0, CAT_POSE.standY, 0);
  const t = new VoxPart();
  // Deep chest, tucked waist, round rump. Each section is a full-width box
  // plus a narrower, taller one that chamfers its edges.
  t.box(0, 0.02, 0, 0.3, 0.2, 0.5, body);
  t.box(0, 0.02, 0, 0.26, 0.24, 0.5, body);
  t.box(0, 0, 0.17, 0.3, 0.26, 0.24, body);
  t.box(0, 0, 0.17, 0.26, 0.3, 0.22, body);
  t.box(0, 0.01, -0.17, 0.3, 0.26, 0.22, body);
  t.box(0, 0.01, -0.18, 0.26, 0.28, 0.24, body);
  t.box(0, 0.1, 0.26, 0.16, 0.15, 0.13, body);
  t.box(0, 0.06, 0.29, 0.18, 0.12, 0.08, body);
  t.box(0, -0.105, -0.01, 0.2, 0.02, 0.24, belly, { shade: 0.9 });
  t.box(0, -0.152, 0.17, 0.2, 0.01, 0.18, belly, { shade: 0.9 });
  t.box(0, -0.02, 0.292, 0.2, 0.18, 0.012, belly);
  if (look.chest) t.box(0, -0.01, 0.298, 0.14, 0.2, 0.012, C.white);
  const top = (z) => (Math.abs(z) > 0.06 ? 0.15 : 0.14);
  const flank = 0.153;
  if (look.stripes) {
    for (const z of [-0.22, -0.11, 0, 0.11]) {
      t.box(0, top(z) + 0.004, z, 0.2, 0.012, 0.045, look.stripes);
      for (const side of [-1, 1]) t.box(side * flank, 0.02, z, 0.012, 0.1, 0.04, look.stripes);
    }
  }
  for (const [color, side, y, z] of look.patches || []) {
    if (side === 0) t.box(0, top(z) + 0.004, z, 0.18, 0.012, 0.18, color);
    else t.box(side * flank, Math.min(y, 0.02), z, 0.012, 0.15, 0.2, color);
  }
  attach(torso, t, material);

  const head = joint(torso, 0, 0.16, 0.3);
  head.scale.setScalar(CAT_HEAD);
  const h = new VoxPart();
  // Rounded cranium over wide cheeks, with a short muzzle out front.
  h.box(0, 0.07, 0.06, 0.4, 0.3, 0.34, body);
  h.box(0, 0.08, 0.06, 0.34, 0.36, 0.3, body);
  h.box(0, -0.07, 0.1, 0.46, 0.14, 0.3, body);
  for (const side of [-1, 1]) h.box(side * 0.25, -0.07, 0.12, 0.05, 0.11, 0.2, body);
  h.box(0, -0.07, 0.27, 0.22, 0.12, 0.08, muzzle);
  h.box(0, -0.12, 0.29, 0.14, 0.06, 0.05, muzzle);
  if (look.mask) {
    h.box(0, -0.06, 0.252, 0.36, 0.15, 0.012, look.mask);
    h.box(0, 0.09, 0.236, 0.1, 0.12, 0.012, look.mask);
    h.box(0, -0.07, 0.312, 0.23, 0.12, 0.012, look.mask);
  }
  if (look.stripes) {
    h.box(0, 0.265, 0.1, 0.05, 0.012, 0.16, look.stripes);
    for (const side of [-1, 1]) h.box(side * 0.09, 0.265, 0.09, 0.04, 0.012, 0.13, look.stripes, { ry: side * 0.25 });
    for (const side of [-1, 1]) h.box(side * 0.206, 0.12, 0.1, 0.012, 0.035, 0.12, look.stripes);
  }
  if (look.spot) h.box(0.12, 0.2, 0.236, 0.13, 0.08, 0.012, look.spot);
  // Nose on the tip of the muzzle, ":3" mouth below, whiskers off the sides.
  const front = 0.316;
  h.box(0, -0.025, front, 0.075, 0.026, 0.012, C.nose, { shade: 1 });
  h.box(0, -0.045, front, 0.036, 0.018, 0.012, C.nose, { shade: 1 });
  h.box(0, -0.068, front - 0.002, 0.016, 0.03, 0.008, C.mouth, { shade: 1 });
  for (const side of [-1, 1]) {
    h.box(side * 0.022, -0.087, front - 0.002, 0.03, 0.014, 0.008, C.mouth, { shade: 1 });
    h.box(side * 0.044, -0.077, front - 0.002, 0.016, 0.02, 0.008, C.mouth, { shade: 1 });
    h.box(side * 0.165, -0.03, 0.253, 0.08, 0.04, 0.012, C.blush, { glow: 0.12, shade: 1 });
    for (const row of [-1, 1]) h.box(side * 0.2, -0.06 + row * 0.026, 0.27, 0.2, 0.01, 0.01, "#ffffff", { rz: side * row * 0.14, shade: 1 });
  }
  attach(head, h, material);

  // Big eyes with slit pupils.
  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = joint(head, side * 0.11, 0.08, 0.236);
    const e = new VoxPart();
    e.box(0, 0, 0, 0.12, 0.14, 0.016, look.eye, { shade: 1 });
    e.box(0, -0.004, 0.006, 0.042, 0.12, 0.012, "#151018", { shade: 1 });
    e.box(-0.026, 0.034, 0.013, 0.032, 0.032, 0.01, C.shine, { glow: 0.6, shade: 1 });
    e.box(0.028, -0.036, 0.013, 0.016, 0.016, 0.01, C.shine, { glow: 0.5, shade: 1 });
    attach(eye, e, material);
    eyes.push(eye);
  }

  // Tall, pointed ears that lean out a little.
  const ears = [];
  for (const side of [-1, 1]) {
    const ear = joint(head, side * 0.13, 0.22, 0.04);
    ear.rotation.z = -side * 0.12;
    const color = (side < 0 ? look.earL : look.earR) || look.ears || body;
    const inner = look.inner || C.pink;
    const e = new VoxPart();
    e.box(0, 0.04, 0, 0.16, 0.08, 0.06, color);
    e.box(side * 0.008, 0.11, 0, 0.12, 0.07, 0.055, color);
    e.box(side * 0.016, 0.17, 0, 0.075, 0.06, 0.05, color);
    e.box(side * 0.022, 0.215, 0, 0.035, 0.05, 0.045, color);
    e.box(side * 0.004, 0.08, 0.031, 0.09, 0.09, 0.008, inner, { shade: 1 });
    e.box(side * 0.014, 0.15, 0.028, 0.05, 0.06, 0.008, inner, { shade: 1 });
    attach(ear, e, material);
    ears.push(ear);
  }

  // Long legs in two segments (shoulder or hip, then elbow or hock) with a
  // paw joint that the poser keeps flat on the ground.
  const legs = [];
  const knees = [];
  const feet = [];
  const { upper, lower } = CAT_POSE;
  // Legs tuck into the body, so they lose any depth-test tie with it.
  const tucked = tuckedMaterial(material);
  const spots = [[-0.09, CAT_POSE.frontZ], [0.09, CAT_POSE.frontZ], [-0.09, CAT_POSE.backZ], [0.09, CAT_POSE.backZ]];
  for (const [i, [x, z]] of spots.entries()) {
    const hip = joint(torso, x, CAT_POSE.hipY, z);
    const u = new VoxPart();
    u.box(0, -upper / 2, 0, 0.09, upper + 0.03, 0.09, body);
    u.box(0, 0.005, 0, 0.1, 0.07, i >= 2 ? 0.16 : 0.12, body);
    if (i >= 2) u.box(Math.sign(x) * 0.02, -0.05, -0.005, 0.1, 0.14, 0.13, body);
    attach(hip, u, tucked);
    const knee = joint(hip, 0, -upper, 0);
    attach(knee, new VoxPart().box(0, -(lower - 0.025) / 2, 0, 0.075, lower + 0.005, 0.075, body), tucked);
    const foot = joint(knee, 0, -lower + 0.025, 0);
    const f = new VoxPart();
    f.box(0, 0, 0.012, 0.11, 0.05, 0.115, sock);
    f.box(0, -0.026, 0.05, 0.07, 0.006, 0.02, C.pink, { shade: 1 });
    attach(foot, f, tucked);
    legs.push(hip);
    knees.push(knee);
    feet.push(foot);
  }

  // A long tail in three segments, tapering a touch toward the tip.
  const tailColor = look.tail || body;
  const tail = joint(torso, 0, 0.08, -0.29);
  attach(tail, new VoxPart().box(0, 0, -0.11, 0.08, 0.08, 0.24, tailColor), material);
  const tailMid = joint(tail, 0, 0, -0.22);
  // The middle segment draws tucked, so neither joint of the bending tail
  // can z-fight.
  attach(tailMid, new VoxPart().box(0, 0, -0.11, 0.07, 0.07, 0.24, tailColor), tucked);
  const tailTip = joint(tailMid, 0, 0, -0.22);
  attach(tailTip, new VoxPart().box(0, 0, -0.1, 0.06, 0.06, 0.22, look.tailTip || tailColor), material);
  tail.rotation.x = 0.95;
  tailTip.rotation.x = 0.55;

  return { torso, head, eyes, ears, legs, knees, feet, tail, tailMid, tailTip };
}

// Two-bone leg IK. A pose gives the torso height and pitch and, per leg,
// where the paw should be: forward of the hip along the ground (`reach`)
// and how high it lifts. Every joint sits behind the line from hip to paw:
// the elbow on a foreleg, the hock on a hind leg, which is what makes a
// cat's back legs look like they bend backward. Joint angles use
// rotation.x: 0 points straight down, positive swings back.
function solveLeg(i, y, pitch, reach, lift) {
  const P = CAT_POSE;
  const z = i < 2 ? P.frontZ : P.backZ;
  const hy = y + P.hipY * Math.cos(pitch) - z * Math.sin(pitch);
  const dz = reach;
  const dy = lift - hy;
  const len = THREE.MathUtils.clamp(Math.hypot(dz, dy), 0.02, P.upper + P.lower - 0.002);
  const aim = Math.atan2(-dz, -dy);
  const bend = Math.acos(THREE.MathUtils.clamp((P.upper ** 2 + len ** 2 - P.lower ** 2) / (2 * P.upper * len), -1, 1));
  const upper = aim + bend;
  const kz = -Math.sin(upper) * P.upper;
  const ky = -Math.cos(upper) * P.upper;
  const ex = Math.hypot(dz, dy) > len ? len / Math.hypot(dz, dy) : 1;
  const lower = Math.atan2(-(dz * ex - kz), -(dy * ex - ky));
  return { hip: upper - pitch, knee: lower - upper, paw: -lower };
}

const SIT_MOODS = new Set(["sit", "regal", "knead", "groom", "swat"]);
const PARK_MOODS = new Set(["browse", "guard", "sunbathe", "scratch"]);
const TAIL_Y = 0.08;
const TAIL_Z = -0.29;
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const wrapQ = new THREE.Quaternion();
const stepQ = new THREE.Quaternion();
const wrapE = new THREE.Euler();

// Poses a cat for its current mood each frame. critter.userData carries the
// joints from buildCat plus mood state from the game.
export function poseCat(critter, now, dt) {
  const data = critter.userData;
  now *= CAT_PACE;
  // A cat that has reached its ball of yarn bats at it.
  const mood = data.mood === "yarn" && data.arrived ? "swat" : data.mood;
  const spot = data.target?.position;
  const parked = PARK_MOODS.has(mood) && (!spot || data.arrived || Math.hypot(spot.x - critter.position.x, spot.z - critter.position.z) < (mood === "scratch" ? 0.62 : 0.55));
  const moving =
    mood === "wander" || mood === "chase" || mood === "yarn" || mood === "zoom" || (PARK_MOODS.has(mood) && !parked) || (mood === "pounce" && data.moodT <= 0.7);
  // Step rate follows ground speed so planted paws don't skate: each paw
  // sweeps 2 * stride (in cat units) per half cycle.
  const stride = mood === "zoom" ? 0.15 : mood === "chase" || mood === "yarn" ? 0.12 : 0.1;
  const speed = data.speed || 0;
  const pace = speed > 0.05 ? Math.min(18, (Math.PI * speed) / (2 * stride * (critter.scale.x || 1))) : 7;
  if (moving) data.gait += dt * pace;
  const sway = (amp, period, phase = 0) => Math.sin(now / period + phase) * amp;
  const side = data.blinkOffset > 2.4 ? 1 : -1;
  const breathe = sway(0.004, 700, data.blinkOffset);

  // Torso and head.
  let y = 0.325;
  let torsoX = 0;
  let torsoY = 0;
  let torsoZ = 0;
  let wiggle = 0;
  let gaitKind = null;
  let headX = 0;
  let headY = sway(0.06, 1400, data.baseY);
  let headZ = 0;
  let eyes = 1;
  let earsBack = 0;
  let puff = 1;
  // Legs: IK targets by default; `raw` legs take joint angles directly.
  const reach = [0.02, 0.02, -0.02, -0.02];
  const lift = [0, 0, 0, 0];
  const raw = [null, null, null, null];
  const hipZ = [0, 0, 0, 0];
  let tuck = false;
  // Tail per segment. Relaxed: carried up in a soft curve.
  let tail = [
    { x: 0.6 + sway(0.06, 900), y: sway(0.08, 1300) },
    { x: 0.3, y: sway(0.1, 1100) },
    { x: 0.35, y: sway(0.12, 800) },
  ];
  let wrap = false;
  const question = [
    { x: 1.45, y: sway(0.04, 45) },
    { x: 0.1, y: 0 },
    { x: 1.0, y: sway(0.1, 320) },
  ];
  const bonk = Math.max(0, Math.sin(now / 280 + data.blinkOffset)) ** 6;

  if (SIT_MOODS.has(mood) || (parked && (mood === "browse" || mood === "guard"))) {
    // Upright on the haunches: forelegs straight, hind paws tucked forward.
    torsoX = mood === "regal" ? -0.8 : mood === "sit" || mood === "groom" ? -0.7 : -0.6;
    y = mood === "regal" ? 0.205 : mood === "sit" || mood === "groom" ? 0.2 : 0.215;
    reach[0] = reach[1] = 0.03;
    reach[2] = reach[3] = 0.13;
    wrap = true;
    headX = -torsoX - 0.08 + sway(0.05, 2200, data.blinkOffset);
    headZ = sway(0.1, 3100, data.blinkOffset * 2);
    if (mood === "regal") headX -= 0.1;
    if (mood === "knead") {
      // Paws pump up and down in turn, eyes half shut.
      const a = (Math.sin(now / 170) + 1) * 0.5;
      lift[0] = a * 0.05;
      lift[1] = (1 - a) * 0.05;
      eyes = 0.35;
    } else if (mood === "groom") {
      // One paw up to the mouth, licking.
      raw[0] = { hip: -torsoX - 1.3 + sway(0.12, 150), knee: -1.6 + sway(0.15, 150, 0.6) };
      headX += 0.35;
      headZ = 0.3;
      eyes = 0.3;
    } else if (mood === "swat") {
      const bat = Math.max(0, Math.sin(now / 100));
      const i = data.swatLeg || 0;
      raw[i] = { hip: -torsoX - 0.5 - bat * 0.9, knee: -1.1 + bat * 0.8 };
      hipZ[i] = (i ? 0.25 : -0.25) * bat;
      headY = i ? 0.1 : -0.1;
      wrap = false;
      tail = [{ x: 0.2, y: sway(0.3, 90) }, { x: 0.05, y: sway(0.25, 80) }, { x: 0.2, y: sway(0.3, 70) }];
    } else if (mood === "browse") {
      headX -= 0.12;
      headY = sway(0.12, 700);
    } else if (mood === "guard") {
      wrap = false;
      tail = [{ x: 0.3, y: 0.1 }, { x: 0.5, y: 0.08 }, { x: 0.3, y: sway(0.15, 260) }];
    }
  } else if (mood === "loaf") {
    // Paws folded away under the chest, tail wrapped, chin down.
    y = 0.135;
    tuck = true;
    raw[0] = raw[1] = { hip: 1.4, knee: -2.6 };
    raw[2] = raw[3] = { hip: -1.3, knee: 2.5 };
    headX = 0.12 + sway(0.03, 1600);
    wrap = true;
    eyes = 0.1;
  } else if (mood === "sunbathe" && parked) {
    // Flopped on one side in the sun, legs loose.
    torsoZ = side * 1.4;
    y = 0.16;
    tuck = true;
    raw[0] = { hip: -0.5, knee: 0.5 };
    raw[1] = { hip: -0.3, knee: 0.8 };
    raw[2] = { hip: 0.35, knee: 0.4 };
    raw[3] = { hip: 0.55, knee: 0.3 };
    headX = 0.15;
    headZ = -side * 0.3;
    eyes = 0.06;
    tail = [{ x: 0.05, y: side * 0.3 }, { x: 0, y: side * 0.35 }, { x: 0, y: side * 0.3 }];
  } else if (mood === "pet" || mood === "nuzzle") {
    // Lean in and head-bonk, rubbing a cheek, tail up.
    y = 0.315;
    headX = (mood === "pet" ? -0.3 : 0.05) + bonk * 0.4;
    headZ = sway(0.3, 520);
    torsoZ = sway(0.05, 520);
    eyes = mood === "pet" ? 0.3 : 0.6;
    tail = question;
  } else if (mood === "stretch") {
    // Play bow: chest down, forelegs reaching out, rump in the air.
    torsoX = 0.4;
    y = 0.24;
    reach[0] = reach[1] = 0.24;
    reach[2] = reach[3] = -0.02;
    headX = -0.55;
    tail = [{ x: 1.0, y: 0 }, { x: 0.1, y: 0 }, { x: 0.3, y: 0 }];
    eyes = 0.2;
  } else if (mood === "roll") {
    torsoZ = sway(0.28, 420);
    y = 0.3;
    raw[0] = { hip: -0.4, knee: 0.9 };
    raw[1] = { hip: -0.3, knee: 0.8 };
    raw[2] = { hip: 0.3, knee: 0.6 };
    raw[3] = { hip: 0.2, knee: 0.7 };
  } else if (mood === "pounce" && data.moodT > 0.7) {
    // Stalking crouch: belly low, hind paws drawn under, rump wiggling.
    torsoX = 0.06;
    y = 0.19;
    reach[0] = reach[1] = 0.1;
    reach[2] = reach[3] = 0.06;
    wiggle = sway(0.07, 70);
    headY = -wiggle;
    headX = -0.25;
    tail = [{ x: 0.12, y: sway(0.4, 170) }, { x: 0.02, y: sway(0.35, 170, -0.7) }, { x: 0.15, y: sway(0.5, 170, -1.4) }];
  } else if (mood === "scratch" && parked) {
    // Up on the hind legs, claws raking down the post.
    torsoX = -0.95;
    y = 0.27;
    reach[2] = reach[3] = 0.08;
    const rake = (k) => (now / 260 + k) % 1;
    raw[0] = { hip: 0.5 + rake(0) * 0.9, knee: -0.9 + rake(0) * 0.5 };
    raw[1] = { hip: 0.5 + rake(0.5) * 0.9, knee: -0.9 + rake(0.5) * 0.5 };
    headX = 0.8;
  } else if (mood === "pounce") {
    // The leap: stretched long, forelegs reaching.
    torsoX = -0.15;
    y = 0.34;
    raw[0] = raw[1] = { hip: -0.9, knee: -0.2 };
    raw[2] = raw[3] = { hip: 0.75, knee: 0.15 };
    tail = [{ x: 0.3, y: 0 }, { x: 0, y: 0 }, { x: 0.1, y: 0 }];
  } else if (mood === "zoom") {
    y = 0.29;
    gaitKind = "gallop";
    earsBack = 1;
    puff = 1.6;
    tail = [{ x: 0.35, y: sway(0.12, 90) }, { x: 0.1, y: 0 }, { x: 0.1, y: 0 }];
  } else if (moving) {
    gaitKind = "walk";
    const wag = mood === "chase" || mood === "yarn" ? 0.2 : 0.1;
    const g = data.gait;
    tail = [
      { x: 0.55, y: Math.sin(g * 0.5) * wag },
      { x: 0.3, y: Math.sin(g * 0.5 - 0.6) * wag },
      { x: 0.35, y: Math.sin(g * 0.5 - 1.2) * wag },
    ];
  }

  // The gait fades in and out rather than switching on, so a cat eases
  // from standing into its stride and back.
  data.walkMix = (data.walkMix ?? 0) + ((gaitKind ? 1 : 0) - (data.walkMix ?? 0)) * Math.min(1, dt * 5);
  if (gaitKind) data.gaitKind = gaitKind;
  const mix = data.walkMix;
  const gaitReach = [0, 0, 0, 0];
  const gaitLift = [0, 0, 0, 0];
  let gaitX = 0;
  let gaitY = 0;
  let gaitZ = 0;
  let gaitDip = 0;
  if (mix > 0.001) {
    const g = data.gait;
    if (data.gaitKind === "gallop") {
      // Rotary gallop: forelegs land together, then the hind pair; the
      // back flexes and the body rocks.
      for (let i = 0; i < 4; i += 1) {
        const p = g + (i < 2 ? 0 : Math.PI * 0.85) + (i % 2) * 0.3;
        gaitReach[i] = -Math.sin(p) * stride;
        gaitLift[i] = Math.max(0, -Math.cos(p)) * 0.09;
      }
      gaitX = Math.sin(g) * 0.12;
    } else {
      // Walk: diagonal pairs with a slight lead, each paw rolling back
      // along the ground then lifting and swinging through. The body dips a
      // touch twice per stride and the shoulders roll.
      for (let i = 0; i < 4; i += 1) {
        const p = g + (i === 0 || i === 3 ? 0 : Math.PI) + (i >= 2 ? 0.6 : 0);
        gaitReach[i] = -Math.sin(p) * stride;
        gaitLift[i] = Math.max(0, -Math.cos(p)) ** 1.5 * 0.06;
      }
      gaitDip = -Math.abs(Math.cos(g)) * 0.006;
      gaitZ = Math.sin(g) * 0.035;
      gaitY = Math.sin(g) * 0.03;
      headX += Math.cos(g * 2) * 0.03 * mix;
    }
    headY -= gaitY * mix;
    headZ -= gaitZ * mix;
  }

  // Sitting and lying cats wrap the tail down to the ground and around
  // their paws, the tip flicking now and then.
  if (wrap) {
    const h = y + TAIL_Y * Math.cos(torsoX) - TAIL_Z * Math.sin(torsoX);
    const down = -Math.asin(THREE.MathUtils.clamp((h - 0.03) / 0.22, 0, 1));
    const flick = Math.max(0, Math.sin(now / 900 + data.blinkOffset)) ** 8 * 0.6;
    // The base levels out the torso's pitch, turns to one side, then
    // dips to the ground, so the rest of the tail curls flat along it.
    wrapQ.setFromAxisAngle(X_AXIS, -torsoX);
    wrapQ.multiply(stepQ.setFromAxisAngle(Y_AXIS, side * 0.9));
    wrapQ.multiply(stepQ.setFromAxisAngle(X_AXIS, down));
    wrapE.setFromQuaternion(wrapQ, "XYZ");
    tail = [
      { x: wrapE.x, y: wrapE.y, z: wrapE.z },
      { x: -down, y: side * 1.0 },
      { x: 0, y: side * (1.1 - flick) },
    ];
  }

  // Attention: greet the player, track them, and stare (and chatter) at
  // dragons. A dragon swooping low startles the cat.
  const idle = !moving && !tuck && mood !== "roll";
  if (data.greet && (moving || mood === "browse" || mood === "guard") && mood !== "zoom" && mood !== "pounce") tail = question;
  let earYaw = 0;
  const watch = data.watch;
  if (watch && idle && mood !== "pet") {
    headY = THREE.MathUtils.clamp(watch.yaw, -1.1, 1.1);
    headX = -torsoX + THREE.MathUtils.clamp(-watch.pitch, -1.1, 0.3);
    earYaw = THREE.MathUtils.clamp(watch.yaw - headY, -0.6, 0.6);
    if (watch.dist < 18) {
      headX += sway(0.02, 40);
      tail[2] = { x: tail[2].x, y: sway(0.35, 110) };
    }
  } else if (data.playerD < 5 && Math.abs(data.playerYaw) < 2.4) {
    if (idle && mood !== "pet" && mood !== "groom") headY = THREE.MathUtils.clamp(data.playerYaw, -1, 1);
    earYaw = THREE.MathUtils.clamp(data.playerYaw - (idle ? headY : 0), -0.7, 0.7);
  }
  if (data.spook > 0) {
    tail = [{ x: 1.4, y: 0 }, { x: 0.15, y: 0 }, { x: -0.2, y: 0 }];
    puff = 1.75;
    earsBack = 1;
    eyes = 1.15;
  }

  // Posture (height, pitch, where each paw rests) eases toward the mood's
  // target; the legs then solve against the eased body, so paws stay
  // planted while a cat sits down, stands up or settles.
  const ease = Math.min(1, dt * 4);
  const pose = (data.pose ||= { y, x: torsoX, ty: torsoY, tz: torsoZ, reach: [...reach], lift: [...lift], hipZ: [0, 0, 0, 0] });
  pose.y += (y - pose.y) * ease;
  pose.x += (torsoX - pose.x) * ease;
  pose.ty += (torsoY - pose.ty) * ease;
  pose.tz += (torsoZ - pose.tz) * ease;
  for (let i = 0; i < 4; i += 1) {
    pose.reach[i] += (reach[i] - pose.reach[i]) * ease;
    pose.lift[i] += (lift[i] - pose.lift[i]) * ease;
    pose.hipZ[i] += (hipZ[i] - pose.hipZ[i]) * ease;
  }
  const bodyY = pose.y + gaitDip * mix;
  const pitch = pose.x + gaitX * mix;
  if (data.torso) {
    data.torso.rotation.set(pitch, pose.ty + gaitY * mix + wiggle, pose.tz + gaitZ * mix);
    data.torso.position.y = bodyY + breathe;
  }
  easeJoint(data.head, headX, headY, headZ, Math.min(1, dt * 5));

  // Blinks, plus a long slow blink back at a player who holds their gaze.
  const blinkPhase = (now / 1000 + data.blinkOffset) % 4.8;
  let eyeOpen = blinkPhase < 0.16 ? 0.08 : eyes;
  if (data.slowBlink > 0) {
    const t = 1.8 - data.slowBlink;
    eyeOpen = t < 0.5 ? 1 - (t / 0.5) * 0.92 : t < 0.95 ? 0.08 : 0.08 + Math.min(1, (t - 0.95) / 0.7) * 0.92;
  }
  for (const eye of data.eyes) eye.scale.y += (eyeOpen - eye.scale.y) * Math.min(1, dt * (data.slowBlink > 0 ? 8 : 24));

  for (const [i, ear] of data.ears.entries()) {
    const s = i ? 1 : -1;
    const twitch = Math.max(0, Math.sin(now / 680 + data.gait + i * 2)) ** 12;
    // Flat back like an airplane when startled or racing.
    const rx = THREE.MathUtils.lerp(twitch * 0.12, 0.45, earsBack);
    const rz = THREE.MathUtils.lerp(s * (twitch * 0.18 - 0.12), -s * 1.05, earsBack);
    easeJoint(ear, rx, earYaw * (1 - earsBack), rz, Math.min(1, dt * (earsBack ? 16 : 9)));
  }

  // Legs: IK against the eased body, cross-faded with any directly posed
  // (tucked, raised or sprawled) legs.
  const rawW = (data.rawW ||= [0, 0, 0, 0]);
  const rawLast = (data.rawLast ||= [null, null, null, null]);
  for (const [i, leg] of data.legs.entries()) {
    if (!leg) continue;
    const ik = solveLeg(i, bodyY, pitch, pose.reach[i] + gaitReach[i] * mix, pose.lift[i] + gaitLift[i] * mix);
    rawW[i] += ((raw[i] ? 1 : 0) - rawW[i]) * Math.min(1, dt * 5);
    const last = (rawLast[i] ||= { hip: ik.hip, knee: ik.knee });
    if (raw[i]) {
      const k = Math.min(1, dt * 8);
      last.hip += (raw[i].hip - last.hip) * k;
      last.knee += (raw[i].knee - last.knee) * k;
    }
    const w = rawW[i];
    const hip = THREE.MathUtils.lerp(ik.hip, last.hip, w);
    const knee = THREE.MathUtils.lerp(ik.knee, last.knee, w);
    // A lifted paw curls under a little; a tucked one folds with the leg.
    const lifted = pose.lift[i] + gaitLift[i] * mix;
    const curl = lifted > 0.005 ? Math.min(0.8, lifted * 10) : 0;
    const paw = THREE.MathUtils.lerp(ik.paw + curl, tuck ? 0 : -(pitch + last.hip + last.knee), w);
    leg.rotation.set(hip, 0, pose.hipZ[i]);
    data.knees[i]?.rotation.set(knee, 0, 0);
    data.feet[i]?.rotation.set(THREE.MathUtils.clamp(paw, -1.4, 1.4), 0, 0);
  }
  const segs = [data.tail, data.tailMid, data.tailTip];
  for (const [i, seg] of segs.entries()) {
    if (!seg) continue;
    easeJoint(seg, tail[i].x, tail[i].y, tail[i].z || 0, Math.min(1, dt * 3.5));
    const fur = seg.children[0];
    if (fur?.isMesh) {
      const p = fur.scale.x + (puff - fur.scale.x) * Math.min(1, dt * (puff > fur.scale.x ? 18 : 3));
      fur.scale.set(p, p, 1);
    }
  }
}
