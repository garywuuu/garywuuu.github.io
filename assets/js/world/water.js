import * as THREE from "three";
import { SKY_FN } from "./sky.js?v=20261015-world";

// Ocean and pond surfaces. Depth comes from a terrain heightmap so shallows
// turn turquoise and the shoreline gets animated foam. The ocean can also
// mirror the island (see makeReflection); otherwise water reflects the sky
// gradient.

// Objects on this layer show up in the ocean's reflection.
export const REFLECT_LAYER = 1;

export function makeHeightTexture(grid) {
  const data = new Uint8Array(grid.sx * grid.sz);
  for (let x = 0; x < grid.sx; x += 1) {
    for (let z = 0; z < grid.sz; z += 1) {
      const top = grid.surface(grid.x0 + x, grid.z0 + z) + 1;
      data[z * grid.sx + x] = Math.max(0, Math.min(255, Math.round((top + 20) * 3)));
    }
  }
  const tex = new THREE.DataTexture(data, grid.sx, grid.sz, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// Planar mirror for the ocean: a second, third-resolution render of the
// REFLECT_LAYER objects from a camera flipped below the sea surface, with an
// oblique near plane so nothing under the water leaks in. Adapted from
// three's Reflector, which keeps the reflection camera right-handed.
//
// An occlusion query on the sea surface skips the mirror render whenever no
// water made it to the screen last time (most views from the plaza).
export function makeReflection({ renderer, scene, camera, y, surface }) {
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const virtual = new THREE.PerspectiveCamera();
  virtual.layers.set(REFLECT_LAYER);
  const matrix = new THREE.Matrix4();
  const normal = new THREE.Vector3(0, 1, 0);
  const origin = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const view = new THREE.Vector3();
  const look = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const rotation = new THREE.Matrix4();
  const plane = new THREE.Plane();
  const clip = new THREE.Vector4();
  const q = new THREE.Vector4();

  const gl = renderer.getContext();
  const queries = [];
  let query = null;
  let drawn = false;
  let seaVisible = true;
  surface.onBeforeRender = () => {
    drawn = true;
    if (queries.length > 3) return;
    query = gl.createQuery();
    gl.beginQuery(gl.ANY_SAMPLES_PASSED_CONSERVATIVE, query);
  };
  surface.onAfterRender = () => {
    if (!query) return;
    gl.endQuery(gl.ANY_SAMPLES_PASSED_CONSERVATIVE);
    queries.push(query);
    query = null;
  };

  function pollVisibility() {
    if (!drawn) seaVisible = false;
    drawn = false;
    while (queries.length && gl.getQueryParameter(queries[0], gl.QUERY_RESULT_AVAILABLE)) {
      const done = queries.shift();
      seaVisible = gl.getQueryParameter(done, gl.QUERY_RESULT) > 0;
      gl.deleteQuery(done);
    }
  }

  function setSize(width, height) {
    target.setSize(Math.max(1, Math.round(width / 3)), Math.max(1, Math.round(height / 3)));
  }

  // Returns false (and skips the render) when the camera is under the sea
  // or no sea is in view.
  function update() {
    pollVisibility();
    camera.updateMatrixWorld();
    camPos.setFromMatrixPosition(camera.matrixWorld);
    origin.set(camPos.x, y, camPos.z);
    if (camPos.y <= y || !seaVisible) return false;

    view.subVectors(origin, camPos).reflect(normal).negate().add(origin);
    rotation.extractRotation(camera.matrixWorld);
    look.set(0, 0, -1).applyMatrix4(rotation).add(camPos);
    lookAt.subVectors(origin, look).reflect(normal).negate().add(origin);
    virtual.position.copy(view);
    virtual.up.set(0, 1, 0).applyMatrix4(rotation).reflect(normal);
    virtual.lookAt(lookAt);
    virtual.far = camera.far;
    virtual.updateMatrixWorld();
    virtual.projectionMatrix.copy(camera.projectionMatrix);

    // World position -> reflection texture coordinates.
    matrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    matrix.multiply(virtual.projectionMatrix).multiply(virtual.matrixWorldInverse);

    // Oblique near plane at the water surface.
    plane.setFromNormalAndCoplanarPoint(normal, origin).applyMatrix4(virtual.matrixWorldInverse);
    clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    const e = virtual.projectionMatrix.elements;
    q.set((Math.sign(clip.x) + e[8]) / e[0], (Math.sign(clip.y) + e[9]) / e[5], -1, (1 + e[10]) / e[14]);
    clip.multiplyScalar(2 / clip.dot(q));
    e[2] = clip.x;
    e[6] = clip.y;
    e[10] = clip.z + 1 - 0.003;
    e[14] = clip.w;

    // Reuse this frame's shadow map rather than rendering it again.
    const autoShadows = renderer.shadowMap.autoUpdate;
    const previous = renderer.getRenderTarget();
    renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(target);
    renderer.render(scene, virtual);
    renderer.setRenderTarget(previous);
    renderer.shadowMap.autoUpdate = autoShadows;
    return true;
  }

  return { texture: target.texture, matrix, setSize, update };
}

export function makeWaterMaterial(skyUniforms, heightTex, grid, surfaceY) {
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  Object.assign(uniforms, skyUniforms, {
    uHeight: { value: heightTex },
    uOrigin: { value: new THREE.Vector2(grid.x0, grid.z0) },
    uSize: { value: new THREE.Vector2(grid.sx, grid.sz) },
    uSurface: { value: surfaceY },
    uLight: { value: 1 },
    uDeep: { value: new THREE.Color(0x0f3f7a) },
    uShallow: { value: new THREE.Color(0x3cc7c0) },
    uReflection: { value: null },
    uReflectMatrix: { value: new THREE.Matrix4() },
    uMirror: { value: 0 },
  });
  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    fog: true,
    vertexShader: `
#include <fog_pars_vertex>
uniform mat4 uReflectMatrix;
varying vec3 vWorld;
varying vec4 vMirrorUv;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vMirrorUv = uReflectMatrix * w;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: `${SKY_FN}
#include <fog_pars_fragment>
uniform sampler2D uHeight;
uniform vec2 uOrigin;
uniform vec2 uSize;
uniform float uSurface;
uniform float uLight;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform sampler2D uReflection;
uniform float uMirror;
varying vec3 vWorld;
varying vec4 vMirrorUv;

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + 1.0), f.x), f.y);
}

float waves(vec2 p, float t) {
  float h = 0.0;
  h += sin(dot(p, vec2(0.38, 0.21)) + t * 1.1) * 0.5;
  h += sin(dot(p, vec2(-0.27, 0.45)) + t * 1.4) * 0.35;
  h += sin(dot(p, vec2(0.71, -0.53)) + t * 2.1) * 0.18;
  h += vnoise(p * 0.9 + t * 0.6) * 0.35;
  return h;
}

void main() {
  vec2 uv = (vWorld.xz - uOrigin) / uSize;
  float ground = -20.0;
  if (uv.x > 0.0 && uv.y > 0.0 && uv.x < 1.0 && uv.y < 1.0) ground = texture2D(uHeight, uv).r * 255.0 / 3.0 - 20.0;
  float depth = uSurface - ground;
  float t = uTime;
  vec2 p = vWorld.xz;
  // Pixel-snapped normals keep the water in the blocky style.
  vec2 q = floor(p * 4.0) / 4.0;
  float e = 0.25;
  float hC = waves(q, t);
  vec3 n = normalize(vec3(hC - waves(q + vec2(e, 0.0), t), 1.6, hC - waves(q + vec2(0.0, e), t)));
  vec3 v = normalize(cameraPosition - vWorld);
  float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  vec3 r = reflect(-v, n);
  r.y = abs(r.y);
  vec3 refl = skyGradient(r);
  if (uMirror > 0.0) {
    // The mirrored island, wobbled by the same blocky wave normals.
    vec2 mirrorUv = vMirrorUv.xy / vMirrorUv.w + n.xz * 0.045;
    refl = mix(refl, texture2D(uReflection, mirrorUv).rgb, uMirror);
  }
  float shallow = smoothstep(0.0, 5.0, depth);
  vec3 body = mix(uShallow, uDeep, shallow) * uLight;
  vec3 col = mix(body, refl, clamp(fres * 0.85, 0.0, 1.0));
  float spec = pow(max(dot(r, uSunDir), 0.0), 220.0) * smoothstep(-0.05, 0.1, uSunDir.y);
  col += uSunColor * spec * 3.5;
  // Foam bands lap at the shore.
  float shore = 1.0 - smoothstep(0.0, 0.9, depth);
  float band = step(0.55, fract(depth * 1.6 - t * 0.35 + vnoise(q * 0.7) * 0.6));
  float foam = clamp(shore * (0.55 + 0.45 * band) + step(0.82, vnoise(q * 1.7 + t * 0.4)) * 0.08, 0.0, 1.0);
  col = mix(col, vec3(0.95, 0.98, 1.0) * max(uLight, 0.25), foam * 0.85);
  float alpha = mix(0.45, 0.94, smoothstep(0.0, 3.5, depth));
  alpha = max(alpha, foam * 0.9);
  alpha = max(alpha, fres);
  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`,
  });
}

export function makeOcean(material, y) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.renderOrder = 1;
  return mesh;
}
