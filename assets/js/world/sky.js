import * as THREE from "three";

// Gradient sky with a square Minecraft-style sun and moon, stars at night,
// and a drifting layer of blocky clouds.

const SKY_FN = `
uniform vec3 uSunDir;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSunColor;
uniform float uNight;
uniform float uTime;

float h21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 skyGradient(vec3 dir) {
  float h = dir.y;
  vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.5));
  col = mix(col, uHorizon * 0.82, smoothstep(0.0, -0.25, h));
  float sd = max(dot(dir, uSunDir), 0.0);
  // Warm halo around the sun, stronger near the horizon at dawn and dusk.
  col += uSunColor * (pow(sd, 6.0) * 0.32 + pow(sd, 48.0) * 0.5) * (1.0 - 0.6 * clamp(h, 0.0, 1.0));
  return col;
}
`;

export function makeSky() {
  const uniforms = {
    uSunDir: { value: new THREE.Vector3(0.4, 0.6, 0.2).normalize() },
    uZenith: { value: new THREE.Color(0x3d7ee0) },
    uHorizon: { value: new THREE.Color(0xbfdcff) },
    uSunColor: { value: new THREE.Color(0xfff1c9) },
    uNight: { value: 0 },
    uTime: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    vertexShader: `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`,
    fragmentShader: `${SKY_FN}
varying vec3 vDir;

float squareDisk(vec3 dir, vec3 c, float size) {
  vec3 up = abs(c.y) > 0.95 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 a = normalize(cross(up, c));
  vec3 b = cross(c, a);
  float along = dot(dir, c);
  if (along <= 0.0) return 0.0;
  vec2 q = vec2(dot(dir, a), dot(dir, b)) / along;
  return step(max(abs(q.x), abs(q.y)), size);
}

void main() {
  vec3 dir = normalize(vDir);
  vec3 col = skyGradient(dir);
  float sun = squareDisk(dir, uSunDir, 0.055);
  col = mix(col, uSunColor * 7.0, sun * smoothstep(-0.12, 0.02, uSunDir.y));
  float moon = squareDisk(dir, -uSunDir, 0.04);
  float crater = step(0.5, h21(floor(vec2(dot(dir, vec3(1.0, 0.0, 0.0)), dir.y) * 120.0)));
  col = mix(col, vec3(0.9, 0.93, 1.0) * (1.6 - crater * 0.25), moon * uNight);
  if (uNight > 0.01 && dir.y > 0.0) {
    vec3 sp = dir * 260.0;
    vec2 cell = floor(sp.xz / (sp.y * 0.004 + 1.0));
    float star = step(0.9965, h21(cell + floor(sp.y)));
    float twinkle = 0.6 + 0.4 * sin(uTime * 3.0 + h21(cell) * 40.0);
    col += vec3(1.0, 0.96, 0.9) * star * twinkle * uNight * smoothstep(0.0, 0.25, dir.y) * 1.6;
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return { mesh, uniforms };
}

// Chunky Minecraft "fancy" clouds: lit boxes on a periodic field that wraps
// around the camera and drifts with the wind.
const CLOUD_CELL = 12;
const CLOUD_N = 125;
const CLOUD_SPAN = CLOUD_CELL * CLOUD_N;

function periodicHash(x, z) {
  const xi = ((x % CLOUD_N) + CLOUD_N) % CLOUD_N;
  const zi = ((z % CLOUD_N) + CLOUD_N) % CLOUD_N;
  let h = Math.imul(xi, 374761393) + Math.imul(zi, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function periodicNoise(x, z, scale) {
  const fx = x / scale;
  const fz = z / scale;
  const x0 = Math.floor(fx);
  const z0 = Math.floor(fz);
  const tx = fx - x0;
  const tz = fz - z0;
  const sx = tx * tx * (3 - 2 * tx);
  const sz = tz * tz * (3 - 2 * tz);
  const period = Math.round(CLOUD_N / scale);
  const h = (a, b) => periodicHash(((a % period) + period) % period * 7919, ((b % period) + period) % period * 104729);
  const a = h(x0, z0) + (h(x0 + 1, z0) - h(x0, z0)) * sx;
  const b = h(x0, z0 + 1) + (h(x0 + 1, z0 + 1) - h(x0, z0 + 1)) * sx;
  return a + (b - a) * sz;
}

export function makeClouds() {
  const cells = [];
  for (let x = 0; x < CLOUD_N; x += 1) {
    for (let z = 0; z < CLOUD_N; z += 1) {
      const n = periodicNoise(x, z, 12.5) * 0.65 + periodicNoise(x, z, 5) * 0.35;
      cells.push(n > 0.58);
    }
  }
  // Merge runs along x into single boxes.
  const boxes = [];
  for (let z = 0; z < CLOUD_N; z += 1) {
    let x = 0;
    while (x < CLOUD_N) {
      if (!cells[x * CLOUD_N + z]) {
        x += 1;
        continue;
      }
      let len = 1;
      while (x + len < CLOUD_N && cells[(x + len) * CLOUD_N + z]) len += 1;
      boxes.push(x * CLOUD_CELL - CLOUD_SPAN / 2, z * CLOUD_CELL - CLOUD_SPAN / 2, len * CLOUD_CELL, CLOUD_CELL);
      x += len;
    }
  }
  const box = new THREE.BoxGeometry(1, 1, 1);
  box.translate(0.5, 0.5, 0.5);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = box.index;
  geo.attributes.position = box.attributes.position;
  geo.attributes.normal = box.attributes.normal;
  geo.setAttribute("cbox", new THREE.InstancedBufferAttribute(new Float32Array(boxes), 4));
  geo.instanceCount = boxes.length / 4;
  const uniforms = { uWind: { value: new THREE.Vector2() } };
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.32, transparent: true, opacity: 0.9 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = uniforms.uWind;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>
attribute vec4 cbox;
uniform vec2 uWind;`)
      .replace("#include <begin_vertex>", `vec2 origin = cbox.xy + uWind;
origin = mod(origin - cameraPosition.xz + ${(CLOUD_SPAN / 2).toFixed(1)}, ${CLOUD_SPAN.toFixed(1)}) - ${(CLOUD_SPAN / 2).toFixed(1)} + cameraPosition.xz;
vec3 transformed = vec3(position.x * cbox.z + origin.x, position.y * 4.0, position.z * cbox.w + origin.y);`);
  };
  mat.customProgramCacheKey = () => "clouds";
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 118;
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  return { mesh, uniforms, material: mat };
}

export { SKY_FN };
