import * as THREE from "three";
import { TILE } from "./textures.js?v=20261026-worker";

// Crossed-quad grass and flowers, instanced, swaying in the wind.

function crossGeometry() {
  const g = new THREE.BufferGeometry();
  const pos = [];
  const uv = [];
  const idx = [];
  const quads = [
    [[-0.5, -0.5], [0.5, 0.5]],
    [[-0.5, 0.5], [0.5, -0.5]],
  ];
  for (const [[ax, az], [bx, bz]] of quads) {
    const s = pos.length / 3;
    pos.push(ax * 0.9, 0, az * 0.9, bx * 0.9, 0, bz * 0.9, bx * 0.9, 1, bz * 0.9, ax * 0.9, 1, az * 0.9);
    uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    idx.push(s, s + 1, s + 2, s, s + 2, s + 3);
  }
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(new Array(pos.length).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setAttribute("tuv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

export function makeFoliage(items, tiles, shared) {
  const geo = crossGeometry();
  const count = items.length;
  const layer = new Float32Array(count);
  const mesh = new THREE.InstancedMesh(geo, null, count);
  const m = new THREE.Object3D();
  items.forEach((it, i) => {
    m.position.set(it.x, it.y, it.z);
    m.rotation.set(0, (it.x * 13.7 + it.z * 7.1) % Math.PI, 0);
    const tall = it.tile === "tall_grass" || it.tile === "fern" ? 1 : it.tile === "bush" ? 1.1 : 0.85;
    m.scale.set(it.s, it.s * tall, it.s);
    m.updateMatrix();
    mesh.setMatrixAt(i, m.matrix);
    layer[i] = TILE[it.tile];
  });
  geo.setAttribute("ptile", new THREE.InstancedBufferAttribute(layer, 1));
  const mat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTiles = { value: tiles };
    shader.uniforms.uTime = shared.uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute vec2 tuv;
attribute float ptile;
uniform float uTime;
varying vec2 vTuv;
varying float vTile;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vTuv = tuv;
vTile = ptile;
vec3 root = instanceMatrix[3].xyz;
float camD = distance(root, cameraPosition);
transformed *= 1.0 - smoothstep(42.0, 64.0, camD);
float sway = sin(uTime * 1.6 + root.x * 0.35 + root.z * 0.22) + 0.5 * sin(uTime * 2.7 + root.x * 0.9);
transformed.x += sway * 0.09 * position.y * position.y;
transformed.z += cos(uTime * 1.3 + root.z * 0.4) * 0.06 * position.y * position.y;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
precision highp sampler2DArray;
uniform sampler2DArray uTiles;
varying vec2 vTuv;
varying float vTile;`
      )
      .replace(
        "#include <map_fragment>",
        `vec4 texel = texture(uTiles, vec3(vTuv, floor(vTile + 0.5)));
if (texel.a < 0.5) discard;
diffuseColor *= texel;
diffuseColor.rgb *= 0.86 + 0.24 * vTuv.y;`
      );
  };
  mat.customProgramCacheKey = () => "foliage";
  mesh.material = mat;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  mesh.computeBoundingSphere();
  return mesh;
}
