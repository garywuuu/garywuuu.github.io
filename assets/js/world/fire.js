import * as THREE from "three";

// Additive particle fire: billowing, cooling, rising embers. One draw call
// for every dragon's breath.

export function makeFire(scene, count = 900) {
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  const col0 = new Float32Array(count * 3);
  const col1 = new Float32Array(count * 3);
  const col2 = new Float32Array(count * 3);
  const color = new Float32Array(count * 3);
  const life = new Float32Array(count);
  const max = new Float32Array(count);
  const size = new Float32Array(count);
  const alpha = new Float32Array(count);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    pos[i * 3 + 1] = -9999;
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("pcolor", new THREE.BufferAttribute(color, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("psize", new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("palpha", new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("pseed", new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 500 } },
    vertexShader: `
attribute vec3 pcolor;
attribute float psize;
attribute float palpha;
attribute float pseed;
uniform float uScale;
varying vec3 vColor;
varying float vAlpha;
varying float vSeed;
void main() {
  vColor = pcolor;
  vAlpha = palpha;
  vSeed = pseed;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(140.0, psize * uScale / max(0.1, -mv.z));
  // Fade out particles right in front of the lens so they never white out.
  vAlpha *= smoothstep(0.6, 3.5, -mv.z);
}`,
    fragmentShader: `
varying vec3 vColor;
varying float vAlpha;
varying float vSeed;
void main() {
  // Chunky square puffs with a hot core, to match the voxel look.
  vec2 p = gl_PointCoord - 0.5;
  float r = max(abs(p.x), abs(p.y));
  if (r > 0.5) discard;
  float core = 1.0 - smoothstep(0.1, 0.5, r);
  gl_FragColor = vec4(vColor * (0.45 + core * 0.55), vAlpha * (0.18 + core * 0.32));
}`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 6;
  scene.add(points);
  let next = 0;
  let active = 0;

  function emit(origin, dir, palette, n = 6, speed = 9, spread = 0.18) {
    for (let k = 0; k < n; k += 1) {
      const i = next;
      next = (next + 1) % count;
      const j = i * 3;
      const sx = (Math.random() - 0.5) * spread;
      const sy = (Math.random() - 0.5) * spread;
      const sz = (Math.random() - 0.5) * spread;
      const v = speed * (0.75 + Math.random() * 0.5);
      vel[j] = (dir.x + sx) * v;
      vel[j + 1] = (dir.y + sy) * v;
      vel[j + 2] = (dir.z + sz) * v;
      pos[j] = origin.x + vel[j] * 0.01;
      pos[j + 1] = origin.y + vel[j + 1] * 0.01;
      pos[j + 2] = origin.z + vel[j + 2] * 0.01;
      for (let c = 0; c < 3; c += 1) {
        col0[j + c] = palette[0][c];
        col1[j + c] = palette[1][c];
        col2[j + c] = palette[2][c];
      }
      max[i] = 0.55 + Math.random() * 0.45;
      life[i] = max[i];
    }
    active = 1.2;
  }

  function update(dt) {
    if (active <= 0) return;
    active -= dt;
    for (let i = 0; i < count; i += 1) {
      if (life[i] <= 0) {
        if (alpha[i] !== 0) {
          alpha[i] = 0;
          size[i] = 0;
        }
        continue;
      }
      life[i] -= dt;
      const j = i * 3;
      const t = 1 - Math.max(0, life[i]) / max[i];
      const drag = Math.exp(-dt * 2.6);
      vel[j] *= drag;
      vel[j + 1] = vel[j + 1] * drag + dt * 3.2;
      vel[j + 2] *= drag;
      pos[j] += vel[j] * dt;
      pos[j + 1] += vel[j + 1] * dt;
      pos[j + 2] += vel[j + 2] * dt;
      // White-hot, then flame color, then a dim smoky ember.
      const a = Math.min(1, t * 3);
      const b = Math.max(0, t * 1.6 - 0.6);
      for (let c = 0; c < 3; c += 1) {
        const mid = col0[j + c] + (col1[j + c] - col0[j + c]) * a;
        color[j + c] = mid + (col2[j + c] - mid) * b;
      }
      size[i] = 0.18 + t * 0.85;
      alpha[i] = t < 0.1 ? t * 10 : 1 - Math.pow(t, 1.6);
      if (life[i] <= 0) pos[j + 1] = -9999;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.pcolor.needsUpdate = true;
    geo.attributes.psize.needsUpdate = true;
    geo.attributes.palpha.needsUpdate = true;
  }

  function setSize(h) {
    mat.uniforms.uScale.value = h * 0.7;
  }

  return { emit, update, setSize, points };
}
