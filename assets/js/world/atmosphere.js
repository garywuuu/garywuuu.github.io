import * as THREE from "three";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";

// Light shafts and low-lying mist from the scene's color and depth (no
// second scene render). Sky pixels near the sun are the light source, so
// rays break through leaf gaps, cloud holes and booth doorways: a quarter-res
// mask marks them, a half-res pass marches toward the sun over that mask, and
// the full-res composite adds the rays and the mist. Mist is exponential
// height fog: thin near the camera, pooling over the sea and valleys,
// glowing toward the sun.

const SHAFT_STEPS = 32;

const FULLSCREEN_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Open sky near the sun, weighted by distance from it.
const MaskShader = {
  uniforms: {
    tDepth: { value: null },
    uSunUv: { value: new THREE.Vector2(0.5, 0.5) },
    uAspect: { value: 1 },
  },
  fragmentShader: `
uniform sampler2D tDepth;
uniform vec2 uSunUv;
uniform float uAspect;
varying vec2 vUv;
void main() {
  float open = step(1.0, texture2D(tDepth, vUv).x);
  vec2 off = (vUv - uSunUv) * vec2(uAspect, 1.0);
  gl_FragColor = vec4(open * exp(-dot(off, off) * 14.0), 0.0, 0.0, 1.0);
}`,
};

// March from each pixel toward the sun, summing the mask along the way.
const ShaftShader = {
  uniforms: {
    tMask: { value: null },
    uSunUv: { value: new THREE.Vector2(0.5, 0.5) },
  },
  fragmentShader: `
uniform sampler2D tMask;
uniform vec2 uSunUv;
varying vec2 vUv;

// Interleaved gradient noise: jitters the march so few steps don't band.
float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

void main() {
  vec2 stepUv = (uSunUv - vUv) * 0.92 / float(${SHAFT_STEPS});
  vec2 uv = vUv + stepUv * ign(gl_FragCoord.xy);
  float light = 0.0;
  float decay = 1.0;
  for (int i = 0; i < ${SHAFT_STEPS}; i++) {
    light += texture2D(tMask, uv).r * decay;
    decay *= 0.96;
    uv += stepUv;
  }
  gl_FragColor = vec4(light / float(${SHAFT_STEPS}), 0.0, 0.0, 1.0);
}`,
};

const CompositeShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    tShafts: { value: null },
    uProjInv: { value: new THREE.Matrix4() },
    uCamWorld: { value: new THREE.Matrix4() },
    uCamPos: { value: new THREE.Vector3() },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Color() },
    uShafts: { value: 0 },
    uMist: { value: 0 },
    uMistColor: { value: new THREE.Color() },
    uMistBase: { value: -1 },
    uMistFalloff: { value: 0.11 },
    uSkyDist: { value: 520 },
  },
  fragmentShader: `
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform sampler2D tShafts;
uniform mat4 uProjInv;
uniform mat4 uCamWorld;
uniform vec3 uCamPos;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uShafts;
uniform float uMist;
uniform vec3 uMistColor;
uniform float uMistBase;
uniform float uMistFalloff;
uniform float uSkyDist;
varying vec2 vUv;

vec3 worldAt(vec2 uv, float depth) {
  vec4 view = uProjInv * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  return (uCamWorld * vec4(view.xyz / view.w, 1.0)).xyz;
}

void main() {
  // A single NaN, infinite or negative pixel from the scene would be smeared
  // across a third of the screen by bloom and come out black for a frame.
  // Clamping here, before bloom, keeps it to that one pixel.
  vec3 col = clamp(texture2D(tDiffuse, vUv).rgb, 0.0, 256.0);
  float depth = texture2D(tDepth, vUv).x;
  bool sky = depth >= 1.0;

  if (uMist > 0.0) {
    vec3 ray = worldAt(vUv, min(depth, 0.99999)) - uCamPos;
    vec3 rd = normalize(ray);
    float dist = sky ? uSkyDist : length(ray);
    // Exponential height fog integrated along the view ray.
    float b = uMistFalloff;
    float along = abs(rd.y) > 1e-4 ? (1.0 - exp(-dist * rd.y * b)) / (rd.y * b) : dist;
    float fog = uMist * exp(-(uCamPos.y - uMistBase) * b) * along;
    float amount = clamp(1.0 - exp(-fog), 0.0, 0.88);
    float glow = pow(max(dot(rd, uSunDir), 0.0), 6.0);
    col = mix(col, uMistColor + uSunColor * glow * 0.55, amount);
  }

  if (uShafts > 0.0) col += uSunColor * texture2D(tShafts, vUv).r * uShafts;

  gl_FragColor = vec4(col, 1.0);
}`,
};

function fullscreen(shader) {
  const uniforms = THREE.UniformsUtils.clone(shader.uniforms);
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: shader.fragmentShader,
    depthTest: false,
    depthWrite: false,
  });
  return { uniforms, material, quad: new FullScreenQuad(material) };
}

export class AtmospherePass extends Pass {
  constructor(camera) {
    super();
    this.camera = camera;
    this.mask = fullscreen(MaskShader);
    this.march = fullscreen(ShaftShader);
    this.composite = fullscreen(CompositeShader);
    this.uniforms = this.composite.uniforms;
    const opts = { type: THREE.HalfFloatType, depthBuffer: false };
    this.maskTarget = new THREE.WebGLRenderTarget(1, 1, opts);
    this.shaftTarget = new THREE.WebGLRenderTarget(1, 1, opts);
    this.uniforms.tShafts.value = this.shaftTarget.texture;
    this.march.uniforms.tMask.value = this.maskTarget.texture;
    this.sunPoint = new THREE.Vector3();
    this.forward = new THREE.Vector3();
  }

  setSize(width, height) {
    this.maskTarget.setSize(Math.max(1, Math.round(width / 4)), Math.max(1, Math.round(height / 4)));
    this.shaftTarget.setSize(Math.max(1, Math.round(width / 2)), Math.max(1, Math.round(height / 2)));
  }

  // Build all three programs up front so the rays don't stall the frame the
  // first time the sun comes into view.
  compile(renderer) {
    const target = renderer.getRenderTarget();
    renderer.setRenderTarget(this.maskTarget);
    const ready = Promise.all(
      [this.mask, this.march, this.composite].map(({ material }) =>
        renderer.compileAsync(new THREE.Mesh(new THREE.PlaneGeometry(), material), this.camera)
      )
    );
    renderer.setRenderTarget(target);
    return ready;
  }

  // shafts and mist are intensities (0 turns each off).
  update({ sunDir, sunColor, mistColor, shafts, mist }) {
    const u = this.uniforms;
    const cam = this.camera;
    u.uSunDir.value.copy(sunDir);
    u.uSunColor.value.copy(sunColor);
    u.uMistColor.value.copy(mistColor);
    u.uMist.value = mist;
    // Fade the rays out as the sun leaves the view, so they never smear in
    // from behind the camera.
    cam.getWorldDirection(this.forward);
    const facing = THREE.MathUtils.smoothstep(this.forward.dot(sunDir), 0.05, 0.45);
    u.uShafts.value = shafts * facing;
    if (u.uShafts.value > 0) {
      this.sunPoint.copy(cam.position).addScaledVector(sunDir, 500).project(cam);
      const x = this.sunPoint.x * 0.5 + 0.5;
      const y = this.sunPoint.y * 0.5 + 0.5;
      this.mask.uniforms.uSunUv.value.set(x, y);
      this.march.uniforms.uSunUv.value.set(x, y);
    }
  }

  render(renderer, writeBuffer, readBuffer) {
    const u = this.uniforms;
    const cam = this.camera;
    if (u.uShafts.value > 0) {
      this.mask.uniforms.tDepth.value = readBuffer.depthTexture;
      this.mask.uniforms.uAspect.value = cam.aspect;
      renderer.setRenderTarget(this.maskTarget);
      this.mask.quad.render(renderer);
      renderer.setRenderTarget(this.shaftTarget);
      this.march.quad.render(renderer);
    }
    u.tDiffuse.value = readBuffer.texture;
    u.tDepth.value = readBuffer.depthTexture;
    u.uProjInv.value.copy(cam.projectionMatrixInverse);
    u.uCamWorld.value.copy(cam.matrixWorld);
    u.uCamPos.value.setFromMatrixPosition(cam.matrixWorld);
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.composite.quad.render(renderer);
  }

  dispose() {
    for (const part of [this.mask, this.march, this.composite]) {
      part.material.dispose();
      part.quad.dispose();
    }
    this.maskTarget.dispose();
    this.shaftTarget.dispose();
  }
}
