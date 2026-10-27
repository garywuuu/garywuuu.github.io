import * as THREE from "three";
import { TILE, TILE_NAMES, TILE_SIZE } from "./textures.js?v=20261026-worker";

// three.js side of the voxel world: the tile texture array, the voxel
// material, and chunk meshes built from blocks.js buffers.

// Tile pixels (from paintTiles) packed into one mipmapped texture array.
export function buildTileArray(renderer, data) {
  const tex = new THREE.DataArrayTexture(data, TILE_SIZE, TILE_SIZE, TILE_NAMES.length);
  tex.format = THREE.RGBAFormat;
  tex.type = THREE.UnsignedByteType;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  tex.needsUpdate = true;
  return tex;
}

function toGeometry(buf) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(buf.pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(buf.nrm, 3, true));
  g.setAttribute("tuv", new THREE.BufferAttribute(buf.tuv, 2));
  g.setAttribute("tile", new THREE.BufferAttribute(buf.tile, 1));
  g.setAttribute("color", new THREE.BufferAttribute(buf.col, 3));
  g.setAttribute("glow", new THREE.BufferAttribute(buf.glow, 1));
  g.setAttribute("blight", new THREE.BufferAttribute(buf.blk, 1));
  g.setIndex(new THREE.BufferAttribute(buf.idx, 1));
  g.computeBoundingSphere();
  g.computeBoundingBox();
  return g;
}

// Lambert material that samples the tile array and adds per-vertex glow.
export function voxelMaterial(tiles, shared, { transparent = false } = {}) {
  const mat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    transparent,
    depthWrite: !transparent,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTiles = { value: tiles };
    shader.uniforms.uTime = shared.uTime;
    shader.uniforms.uGlowBoost = shared.uGlowBoost;
    shader.uniforms.uBlockLight = shared.uBlockLight;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute vec2 tuv;
attribute float tile;
attribute float glow;
attribute float blight;
varying vec2 vTuv;
varying float vTile;
varying float vGlow;
varying float vBlock;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vTuv = tuv;
vTile = tile;
vGlow = glow;
vBlock = blight;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
precision highp sampler2DArray;
uniform sampler2DArray uTiles;
uniform float uTime;
uniform float uGlowBoost;
uniform float uBlockLight;
varying vec2 vTuv;
varying float vTile;
varying float vGlow;
varying float vBlock;`
      )
      .replace(
        "#include <map_fragment>",
        `vec2 tileUv = vTuv;
float layer = floor(vTile + 0.5);
if (abs(layer - ${TILE.portal.toFixed(1)}) < 0.5) {
  tileUv += vec2(sin(uTime * 0.7 + vTuv.y * 3.0) * 0.08, uTime * 0.18);
}
vec4 texel = texture(uTiles, vec3(tileUv, layer));
${transparent ? "" : "if (texel.a < 0.5) discard;"}
diffuseColor *= texel;
float glowPulse = abs(layer - ${TILE.portal.toFixed(1)}) < 0.5 ? 0.75 + 0.25 * sin(uTime * 2.3 + vTuv.y * 6.0) : 1.0;
totalEmissiveRadiance += texel.rgb * vGlow * mix(1.0, uGlowBoost, step(0.5, vGlow)) * glowPulse;
// Warm lantern light pools, strongest at night.
float flicker = 0.94 + 0.06 * sin(uTime * 7.0 + vTuv.x * 3.0);
totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.68, 0.36) * pow(vBlock, 2.2) * uBlockLight * flicker;`
      );
  };
  mat.customProgramCacheKey = () => `voxel-${transparent}`;
  return mat;
}

// One mesh per meshed chunk (see meshChunk in blocks.js).
export function buildChunks(chunks, material, transMaterial, { shadows = true } = {}) {
  const group = new THREE.Group();
  group.name = "voxels";
  let faces = 0;
  for (const chunk of chunks) {
    if (chunk.opaque) {
      const mesh = new THREE.Mesh(toGeometry(chunk.opaque), material);
      mesh.castShadow = shadows;
      mesh.receiveShadow = shadows;
      group.add(mesh);
      faces += chunk.opaque.count / 4;
    }
    if (chunk.trans) {
      const mesh = new THREE.Mesh(toGeometry(chunk.trans), transMaterial);
      mesh.renderOrder = 2;
      group.add(mesh);
      faces += chunk.trans.count / 4;
    }
  }
  group.userData.faces = faces;
  return group;
}
