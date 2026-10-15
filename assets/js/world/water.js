import * as THREE from "three";
import { SKY_FN } from "./sky.js?v=20261015-world";

// Ocean and pond surfaces. Depth comes from a terrain heightmap so shallows
// turn turquoise and the shoreline gets animated foam.

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
  });
  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    fog: true,
    vertexShader: `
#include <fog_pars_vertex>
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
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
varying vec3 vWorld;

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
