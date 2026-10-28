import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { makeSky, makeClouds } from "./sky.js?v=20261015-world";
import { AtmospherePass } from "./atmosphere.js?v=20261028-clamp";

// Day/night cycle: sky, sun and moon light, fog, shadows, light shafts,
// mist, and bloom.

const KEYS = [
  // elevation, zenith, horizon, sun color, sun intensity, hemi sky, hemi ground, hemi intensity, glow boost
  { e: -0.35, zenith: 0x060c22, horizon: 0x1a2a52, sun: 0x9ab4ff, sunI: 0.75, sky: 0x5a72b8, ground: 0x1c2232, hemiI: 1.05, glow: 2.4 },
  { e: -0.08, zenith: 0x1a2350, horizon: 0x6a4a7a, sun: 0x9a8aff, sunI: 0.45, sky: 0x5a62a0, ground: 0x2a2430, hemiI: 0.85, glow: 2.1 },
  { e: 0.02, zenith: 0x2f4c9a, horizon: 0xff9a62, sun: 0xff8a4a, sunI: 0.9, sky: 0x8a90c8, ground: 0x4a3a2a, hemiI: 0.62, glow: 1.6 },
  { e: 0.14, zenith: 0x3d6fd0, horizon: 0xffd2a0, sun: 0xffc27a, sunI: 2.2, sky: 0xa8c4f0, ground: 0x5a4a30, hemiI: 0.82, glow: 1.1 },
  { e: 0.4, zenith: 0x3a7ae0, horizon: 0xbfdcff, sun: 0xfff1d6, sunI: 2.7, sky: 0xbcd6ff, ground: 0x6a5a3c, hemiI: 0.95, glow: 1 },
  { e: 1, zenith: 0x2f6fe0, horizon: 0xb4d6ff, sun: 0xffffff, sunI: 2.9, sky: 0xc4dcff, ground: 0x6a5a3c, hemiI: 1, glow: 1 },
];

const tmpA = new THREE.Color();
const tmpB = new THREE.Color();

function lerpKey(e) {
  let i = 0;
  while (i < KEYS.length - 2 && e > KEYS[i + 1].e) i += 1;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = THREE.MathUtils.clamp((e - a.e) / (b.e - a.e), 0, 1);
  const col = (k) => tmpA.setHex(a[k]).lerp(tmpB.setHex(b[k]), t).clone();
  const num = (k) => a[k] + (b[k] - a[k]) * t;
  return {
    zenith: col("zenith"),
    horizon: col("horizon"),
    sun: col("sun"),
    sunI: num("sunI"),
    sky: col("sky"),
    ground: col("ground"),
    hemiI: num("hemiI"),
    glow: num("glow"),
  };
}

// Soft vignette and a touch of warmth after tone mapping.
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uVignette: { value: 0.28 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
uniform sampler2D tDiffuse;
uniform float uVignette;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(tDiffuse, vUv);
  vec2 d = vUv - 0.5;
  float v = 1.0 - dot(d, d) * uVignette * 2.2;
  c.rgb *= v;
  float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  c.rgb = mix(vec3(l), c.rgb, 1.14);
  c.rgb = mix(c.rgb, c.rgb * vec3(1.03, 1.0, 0.97), 0.6);
  gl_FragColor = c;
}`,
};

export function createEnvironment({ scene, renderer, camera, quality, startTime = 0.16, dayLength = 720 }) {
  const shared = {
    uTime: { value: 0 },
    uGlowBoost: { value: 1 },
    uBlockLight: { value: 0.2 },
  };

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = quality.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const sky = makeSky();
  scene.add(sky.mesh);
  sky.uniforms.uTime = shared.uTime;
  const clouds = makeClouds();
  scene.add(clouds.mesh);

  scene.fog = new THREE.Fog(0xbfdcff, 110, 430);

  const hemi = new THREE.HemisphereLight(0xbcd6ff, 0x6a5a3c, 1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.castShadow = quality.shadows;
  if (quality.shadows) {
    const size = quality.shadowSize;
    sun.shadow.mapSize.set(size, size);
    const cam = sun.shadow.camera;
    cam.left = -56;
    cam.right = 56;
    cam.top = 56;
    cam.bottom = -56;
    cam.near = 1;
    cam.far = 260;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.045;
  }
  scene.add(sun);
  scene.add(sun.target);

  let composer = null;
  let bloom = null;
  let atmosphere = null;
  let output = null;
  let grade = null;
  if (quality.bloom) {
    composer = new EffectComposer(renderer);
    // The atmosphere pass reads scene depth; the scene renders into either
    // buffer depending on the frame.
    for (const target of [composer.renderTarget1, composer.renderTarget2]) {
      target.depthTexture = new THREE.DepthTexture(target.width, target.height);
    }
    composer.addPass(new RenderPass(scene, camera));
    atmosphere = new AtmospherePass(camera);
    composer.addPass(atmosphere);
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.55, 1.15);
    composer.addPass(bloom);
    output = new OutputPass();
    composer.addPass(output);
    grade = new ShaderPass(GradeShader);
    composer.addPass(grade);
  }

  const state = {
    time: startTime,
    dayLength,
    frozen: false,
    sunDir: new THREE.Vector3(),
    night: 0,
    light: 1,
    underwater: false,
  };

  function setSize(w, h) {
    composer?.setSize(w, h);
    bloom?.resolution.set(Math.max(1, w / 2), Math.max(1, h / 2));
  }

  function update(dt, focus) {
    shared.uTime.value += dt;
    if (!state.frozen) state.time = (state.time + dt / state.dayLength) % 1;
    // time 0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight.
    const ang = state.time * Math.PI * 2;
    const dir = state.sunDir.set(Math.cos(ang) * 0.82, Math.sin(ang), 0.42).normalize();
    const e = dir.y;
    const k = lerpKey(e);
    state.night = THREE.MathUtils.clamp((-e + 0.02) / 0.22, 0, 1);
    state.light = THREE.MathUtils.clamp(0.28 + (e + 0.1) * 2.4, 0.22, 1);

    sky.uniforms.uSunDir.value.copy(dir);
    sky.uniforms.uZenith.value.copy(k.zenith);
    sky.uniforms.uHorizon.value.copy(k.horizon);
    sky.uniforms.uSunColor.value.copy(k.sun).multiplyScalar(e > -0.1 ? 1 : 0.4);
    sky.uniforms.uNight.value = state.night;
    clouds.uniforms.uWind.value.set(shared.uTime.value * 1.8, shared.uTime.value * 0.6);
    clouds.material.emissive.copy(k.horizon).lerp(k.zenith, 0.4);
    clouds.material.emissiveIntensity = 0.25 + state.light * 0.25;

    scene.fog.color.copy(k.horizon).lerp(k.zenith, 0.25);
    renderer.setClearColor(scene.fog.color, 1);

    hemi.color.copy(k.sky);
    hemi.groundColor.copy(k.ground);
    hemi.intensity = k.hemiI;
    sun.color.copy(k.sun);
    sun.intensity = k.sunI;
    shared.uGlowBoost.value = k.glow;
    shared.uBlockLight.value = 0.15 + state.night * 2.2;

    // Light comes from the moon once the sun is down.
    const lightDir = e > -0.06 ? dir : dir.clone().negate();
    const fx = focus.x;
    const fz = focus.z;
    if (quality.shadows) {
      // Snap the shadow frustum to texels so edges don't shimmer.
      const texel = 112 / quality.shadowSize;
      sun.target.position.set(Math.round(fx / texel) * texel, 0, Math.round(fz / texel) * texel);
    } else {
      sun.target.position.set(fx, 0, fz);
    }
    sun.position.copy(sun.target.position).addScaledVector(lightDir, 120);

    if (atmosphere) {
      // Rays are strongest with the sun low; morning and evening are mistier.
      const up = THREE.MathUtils.smoothstep(e, -0.03, 0.05);
      const low = 1 - THREE.MathUtils.smoothstep(e, 0.12, 0.55);
      atmosphere.update({
        sunDir: dir,
        sunColor: k.sun,
        mistColor: scene.fog.color,
        shafts: up * (0.7 + 1.5 * low),
        mist: state.underwater ? 0 : 0.0028 * (1 + 2 * (1 - THREE.MathUtils.smoothstep(e, 0.05, 0.4))),
      });
    }

    sky.mesh.position.copy(camera.position);
  }

  // Build every shader before the first frame, including ones for things off
  // screen, so turning around never stalls. Programs depend on the render
  // target (the composer's buffer skips tone mapping), so compile against the
  // one the scene really draws into. With KHR_parallel_shader_compile the GPU
  // links them in the background instead of freezing the page.
  function compile() {
    renderer.setRenderTarget(composer ? composer.readBuffer : null);
    const ready = [renderer.compileAsync(scene, camera)];
    if (composer) {
      // The composer's own passes aren't in the scene, so link them here too
      // rather than all at once on the first frame. OutputPass picks its
      // defines on first render; it will pick these same ones.
      output.material.defines = { SRGB_TRANSFER: "", ACES_FILMIC_TONE_MAPPING: "" };
      const passes = [bloom.materialHighPassFilter, ...bloom.separableBlurMaterials, bloom.compositeMaterial, bloom.blendMaterial, output.material];
      ready.push(...passes.map(compileQuad));
      // The grade pass is last, so it draws straight to the canvas.
      renderer.setRenderTarget(null);
      ready.push(compileQuad(grade.material));
      ready.push(atmosphere.compile(renderer));
    }
    renderer.setRenderTarget(null);
    return Promise.all(ready);
  }

  function compileQuad(material) {
    return renderer.compileAsync(new THREE.Mesh(new THREE.PlaneGeometry(), material), camera);
  }

  function render() {
    if (composer) composer.render();
    else renderer.render(scene, camera);
  }

  return { shared, state, sky, clouds, sun, hemi, update, compile, render, setSize };
}
