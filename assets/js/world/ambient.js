import * as THREE from "three";
import { VoxPart } from "./voxkit.js?v=20261015-world";

// Ambient life: fireflies at night, drifting cherry petals, butterflies by
// day, the lighthouse's sweeping beam, and the windmill's turning sails.

const rand = (() => {
  let s = 1234567;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
})();

// Particles that live in a box around the player and wrap at its edges, so
// a small pool fills the whole island.
function wrapAround(v, center, span) {
  return center + ((((v - center + span / 2) % span) + span) % span) - span / 2;
}

function pointsMaterial({ additive, square = true }) {
  return new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 500 }, uAlpha: { value: 1 } },
    vertexShader: `
attribute vec3 pcolor;
attribute float psize;
attribute float palpha;
uniform float uScale;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = pcolor;
  vAlpha = palpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(48.0, psize * uScale / max(0.1, -mv.z));
  vAlpha *= 1.0 - smoothstep(40.0, 60.0, -mv.z);
}`,
    fragmentShader: `
uniform float uAlpha;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float r = ${square ? "max(abs(p.x), abs(p.y))" : "length(p)"};
  if (r > 0.5) discard;
  float core = 1.0 - smoothstep(0.0, 0.5, r);
  ${additive ? "gl_FragColor = vec4(vColor * (0.5 + core), vAlpha * uAlpha * core);" : "gl_FragColor = vec4(vColor, vAlpha * uAlpha);"}
}`,
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

function particleCloud(count, additive, square) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const color = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const alpha = new Float32Array(count);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("pcolor", new THREE.BufferAttribute(color, 3));
  geo.setAttribute("psize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("palpha", new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
  const mat = pointsMaterial({ additive, square });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, geo, pos, color, size, alpha, mat };
}

function makeFireflies(count, groundH) {
  const c = particleCloud(count, true, false);
  const base = [];
  for (let i = 0; i < count; i += 1) {
    base.push({ x: (rand() - 0.5) * 70, z: (rand() - 0.5) * 70, h: 0.5 + rand() * 2.2, phase: rand() * 10, speed: 0.4 + rand() * 0.6 });
    const warm = rand() < 0.7;
    c.color.set(warm ? [1, 0.95, 0.45] : [0.6, 1, 0.55], i * 3);
    c.size[i] = 0.09 + rand() * 0.06;
  }
  c.points.renderOrder = 4;
  return {
    object: c.points,
    update(t, focus, night) {
      c.points.visible = night > 0.02;
      if (!c.points.visible) return;
      for (let i = 0; i < count; i += 1) {
        const b = base[i];
        const x = wrapAround(b.x + Math.sin(t * 0.3 * b.speed + b.phase) * 2.5, focus.x, 70);
        const z = wrapAround(b.z + Math.cos(t * 0.23 * b.speed + b.phase * 1.3) * 2.5, focus.z, 70);
        const g = groundH(Math.floor(x), Math.floor(z));
        c.pos[i * 3] = x;
        c.pos[i * 3 + 1] = Math.max(g, -0.3) + 1 + b.h + Math.sin(t * 0.9 + b.phase) * 0.35;
        c.pos[i * 3 + 2] = z;
        const blink = Math.max(0, Math.sin(t * 1.7 * b.speed + b.phase * 3));
        c.alpha[i] = night * (0.15 + blink * blink * 0.85);
      }
      c.geo.attributes.position.needsUpdate = true;
      c.geo.attributes.palpha.needsUpdate = true;
    },
  };
}

function makePetals(count, trees, groundH) {
  const c = particleCloud(count, false, true);
  const cherries = trees.filter((t) => t.kind === "cherry");
  const p = [];
  const spawn = (i, focus) => {
    // Petals fall from a cherry tree near the player.
    const near = cherries.filter((t) => Math.abs(t.x - focus.x) < 45 && Math.abs(t.z - focus.z) < 45);
    const tree = near.length ? near[Math.floor(rand() * near.length)] : null;
    if (!tree) {
      p[i].life = 0;
      c.alpha[i] = 0;
      return;
    }
    p[i].x = tree.x + 0.5 + (rand() - 0.5) * 6;
    p[i].y = tree.y + 4 + rand() * 3;
    p[i].z = tree.z + 0.5 + (rand() - 0.5) * 6;
    p[i].life = 1;
  };
  for (let i = 0; i < count; i += 1) {
    p.push({ x: 0, y: -99, z: 0, life: 0, phase: rand() * 10, fall: 0.5 + rand() * 0.5 });
    const shade = rand();
    c.color.set([1, 0.62 + shade * 0.22, 0.78 + shade * 0.14], i * 3);
    c.size[i] = 0.07 + rand() * 0.05;
  }
  let timer = 0;
  return {
    object: c.points,
    update(t, dt, focus, wind) {
      if (!cherries.length) return;
      timer -= dt;
      for (let i = 0; i < count; i += 1) {
        const q = p[i];
        if (q.life <= 0) {
          if (timer <= 0) {
            spawn(i, focus);
            timer = 0.03;
          }
          continue;
        }
        q.y -= q.fall * dt;
        q.x += (Math.sin(t * 1.3 + q.phase) * 0.6 + wind) * dt;
        q.z += Math.cos(t * 0.9 + q.phase) * 0.4 * dt;
        const g = Math.max(groundH(Math.floor(q.x), Math.floor(q.z)), -0.4) + 1.02;
        if (q.y <= g) {
          q.y = g;
          q.life -= dt * 0.25;
        }
        c.pos[i * 3] = q.x;
        c.pos[i * 3 + 1] = q.y;
        c.pos[i * 3 + 2] = q.z;
        c.alpha[i] = Math.min(1, q.life * 3);
      }
      c.geo.attributes.position.needsUpdate = true;
      c.geo.attributes.palpha.needsUpdate = true;
    },
  };
}

function makeButterflies(count, groundH, shared) {
  // Two hinged quads; the vertex shader flaps them.
  const g = new THREE.BufferGeometry();
  const pos = [
    0, 0, -0.1, 0.22, 0, -0.16, 0.24, 0, 0.12, 0, 0, 0.08,
    0, 0, -0.1, -0.22, 0, -0.16, -0.24, 0, 0.12, 0, 0, 0.08,
  ];
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(new Array(24).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6]);
  const mesh = new THREE.InstancedMesh(g, null, count);
  const palette = ["#ffb347", "#7ec8ff", "#ffffff", "#ff8fc8", "#ffe066", "#b48cff"];
  const phase = new Float32Array(count);
  const bugs = [];
  for (let i = 0; i < count; i += 1) {
    mesh.setColorAt(i, new THREE.Color(palette[i % palette.length]));
    phase[i] = rand() * 10;
    bugs.push({ x: (rand() - 0.5) * 50, z: (rand() - 0.5) * 50, phase: phase[i], r: 1.5 + rand() * 3 });
  }
  g.setAttribute("phase", new THREE.InstancedBufferAttribute(phase, 1));
  const mat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = shared.uTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float phase;\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
float flap = sin(uTime * 18.0 + phase * 7.0) * 1.1;
float ang = sign(position.x) * flap;
transformed = vec3(position.x * cos(ang), abs(position.x) * sin(flap), position.z);`
      );
  };
  mat.customProgramCacheKey = () => "butterfly";
  mesh.material = mat;
  mesh.frustumCulled = false;
  const m = new THREE.Object3D();
  return {
    object: mesh,
    update(t, focus, day) {
      mesh.visible = day > 0.25;
      if (!mesh.visible) return;
      for (let i = 0; i < count; i += 1) {
        const b = bugs[i];
        const cx = wrapAround(b.x, focus.x, 50);
        const cz = wrapAround(b.z, focus.z, 50);
        const a = t * 0.5 + b.phase;
        const x = cx + Math.cos(a) * b.r + Math.sin(a * 2.3) * 0.6;
        const z = cz + Math.sin(a * 0.8) * b.r;
        const gy = groundH(Math.floor(x), Math.floor(z));
        if (gy < -0.5) {
          m.position.set(0, -999, 0);
        } else {
          m.position.set(x, gy + 1.5 + Math.sin(t * 2.1 + b.phase) * 0.45, z);
        }
        m.rotation.set(0, a + Math.PI / 2, 0);
        m.updateMatrix();
        mesh.setMatrixAt(i, m.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

function makeBeam(lighthouse) {
  const group = new THREE.Group();
  group.position.set(lighthouse.x + 0.5, lighthouse.lampY, lighthouse.z + 0.5);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uAlpha: { value: 0 } },
    vertexShader: `varying float vT; varying vec3 vN; varying vec3 vV;
void main() { vT = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uAlpha; varying float vT; varying vec3 vN; varying vec3 vV;
void main() { float edge = pow(abs(dot(vN, vV)), 1.5); gl_FragColor = vec4(vec3(1.0, 0.92, 0.7), uAlpha * edge * pow(vT, 1.6) * 0.5); }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  for (const dir of [1, -1]) {
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 7, 70, 20, 1, true), mat);
    cone.rotation.z = (dir * Math.PI) / 2;
    cone.position.x = dir * 35.6;
    group.add(cone);
  }
  return {
    object: group,
    update(t, night) {
      group.rotation.y = t * 0.45;
      group.rotation.z = -0.05;
      mat.uniforms.uAlpha.value = THREE.MathUtils.smoothstep(night, 0.05, 0.6);
      group.visible = night > 0.02;
    },
  };
}

function makeSails(windmill, material) {
  const hub = new THREE.Group();
  hub.position.set(windmill.hubX + 0.6, windmill.hubY, windmill.z + 0.5);
  const part = new VoxPart();
  part.box(0, 0, 0, 0.6, 0.8, 0.8, "#5a3a22");
  for (let k = 0; k < 4; k += 1) {
    const a = (k * Math.PI) / 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    // Spar plus a canvas sail offset to its trailing side, with a frame.
    part.box(0.1, sa * 3.4, ca * 3.4, 0.16, 0.22 + Math.abs(sa) * 6.4, 0.22 + Math.abs(ca) * 6.4, "#6b4a2e");
    const sy = sa * 3.9 + ca * 0.75;
    const sz = ca * 3.9 - sa * 0.75;
    const long = 5;
    const wide = 1.3;
    part.box(0.16, sy, sz, 0.05, Math.abs(sa) * long + Math.abs(ca) * wide, Math.abs(ca) * long + Math.abs(sa) * wide, "#f3ead8");
    part.box(0.19, sa * 3.9 + ca * 1.42, ca * 3.9 - sa * 1.42, 0.07, Math.abs(sa) * long + Math.abs(ca) * 0.08, Math.abs(ca) * long + Math.abs(sa) * 0.08, "#6b4a2e");
  }
  const mesh = part.build(material);
  hub.add(mesh);
  return {
    object: hub,
    update(t, wind) {
      hub.rotation.x = t * (0.6 + wind * 0.4);
    },
  };
}

export function makeAmbient({ scene, features, groundH, shared, material, quality }) {
  const fireflies = makeFireflies(quality.lite ? 90 : 220, groundH);
  const petals = makePetals(quality.lite ? 60 : 160, features.trees || [], groundH);
  const butterflies = makeButterflies(quality.lite ? 10 : 24, groundH, shared);
  const parts = [fireflies, petals, butterflies];
  const beam = features.lighthouse?.lampY ? makeBeam(features.lighthouse) : null;
  const sails = features.windmill?.hubY ? makeSails(features.windmill, material) : null;
  for (const p of [...parts, beam, sails]) if (p) scene.add(p.object);

  return {
    update(dt, focus, env) {
      const t = shared.uTime.value;
      const night = env.state.night;
      const wind = 0.5 + Math.sin(t * 0.07) * 0.5;
      fireflies.update(t, focus, night);
      petals.update(t, dt, focus, wind * 0.4);
      butterflies.update(t, focus, 1 - night);
      beam?.update(t, night);
      sails?.update(t, wind);
    },
    setSize(h) {
      for (const p of [fireflies, petals]) p.object.material.uniforms.uScale.value = h * 0.7;
    },
  };
}
