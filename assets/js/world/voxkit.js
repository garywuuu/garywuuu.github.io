import * as THREE from "three";

// Builds a character joint from many colored boxes as one mesh, so a whole
// cat or dragon is a dozen draw calls instead of a hundred.

const BOX_FACES = [
  { n: [1, 0, 0], c: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]] },
  { n: [-1, 0, 0], c: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
  { n: [0, 1, 0], c: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
  { n: [0, -1, 0], c: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
  { n: [0, 0, 1], c: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
  { n: [0, 0, -1], c: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
];

const tmpColor = new THREE.Color();
const tmpMat = new THREE.Matrix4();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpVec = new THREE.Vector3();
const tmpNrm = new THREE.Vector3();
const tmpScale = new THREE.Vector3(1, 1, 1);

export class VoxPart {
  constructor() {
    this.pos = [];
    this.nrm = [];
    this.col = [];
    this.emit = [];
    this.idx = [];
  }

  // Centered box; opts: rx/ry/rz rotation, glow (emissive strength), shade
  // (darkens the bottom faces for a soft fake occlusion).
  box(x, y, z, sx, sy, sz, color, opts = {}) {
    tmpColor.set(color);
    tmpEuler.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
    tmpQuat.setFromEuler(tmpEuler);
    tmpMat.compose(tmpVec.set(x, y, z), tmpQuat, tmpScale);
    const glow = opts.glow || 0;
    const under = opts.shade ?? 0.82;
    for (const face of BOX_FACES) {
      const start = this.pos.length / 3;
      tmpNrm.set(...face.n).applyQuaternion(tmpQuat);
      const dim = face.n[1] < 0 ? under : face.n[1] > 0 ? 1.06 : 1;
      for (const [cx, cy, cz] of face.c) {
        tmpVec.set((cx * sx) / 2, (cy * sy) / 2, (cz * sz) / 2).applyMatrix4(tmpMat);
        this.pos.push(tmpVec.x, tmpVec.y, tmpVec.z);
        this.nrm.push(tmpNrm.x, tmpNrm.y, tmpNrm.z);
        // Slight vertical gradient on side faces reads as rounded fur.
        const grad = face.n[1] === 0 ? (cy > 0 ? 1.04 : 0.9) : 1;
        this.col.push(tmpColor.r * dim * grad, tmpColor.g * dim * grad, tmpColor.b * dim * grad);
        this.emit.push(glow);
      }
      this.idx.push(start, start + 1, start + 2, start, start + 2, start + 3);
    }
    return this;
  }

  // Four-sided spike from a to b, for horns, claws and spines.
  spike(a, b, radius, color, opts = {}) {
    const from = new THREE.Vector3(...a);
    const to = new THREE.Vector3(...b);
    const dir = to.clone().sub(from);
    const len = dir.length();
    const geo = new THREE.ConeGeometry(radius, len, 4, 1);
    geo.translate(0, len / 2, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    geo.applyMatrix4(new THREE.Matrix4().compose(from, q, new THREE.Vector3(1, 1, 1)));
    const nonIndexed = geo.toNonIndexed();
    nonIndexed.computeVertexNormals();
    const p = nonIndexed.attributes.position;
    const n = nonIndexed.attributes.normal;
    tmpColor.set(color);
    const start = this.pos.length / 3;
    for (let i = 0; i < p.count; i += 1) {
      this.pos.push(p.getX(i), p.getY(i), p.getZ(i));
      this.nrm.push(n.getX(i), n.getY(i), n.getZ(i));
      this.col.push(tmpColor.r, tmpColor.g, tmpColor.b);
      this.emit.push(opts.glow || 0);
      this.idx.push(start + i);
    }
    return this;
  }

  // Flat polygon (in the XZ plane) for wing membranes.
  polygon(points, y, color, opts = {}) {
    const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, z)));
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(Math.PI / 2);
    geo.translate(0, y, 0);
    const p = geo.attributes.position;
    const index = geo.index.array;
    tmpColor.set(color);
    const colorB = new THREE.Color(opts.edge ?? color);
    for (const side of [1, -1]) {
      const start = this.pos.length / 3;
      for (let i = 0; i < p.count; i += 1) {
        this.pos.push(p.getX(i), p.getY(i) + side * 0.004, p.getZ(i));
        this.nrm.push(0, side, 0);
        // Fade toward the trailing edge color along z.
        const t = Math.min(1, Math.max(0, (-p.getZ(i) - (opts.z0 ?? 0)) / (opts.zSpan ?? 1)));
        this.col.push(
          tmpColor.r + (colorB.r - tmpColor.r) * t,
          tmpColor.g + (colorB.g - tmpColor.g) * t,
          tmpColor.b + (colorB.b - tmpColor.b) * t
        );
        this.emit.push((opts.glow || 0) * t);
      }
      for (let i = 0; i < index.length; i += 3) {
        if (side > 0) this.idx.push(start + index[i], start + index[i + 2], start + index[i + 1]);
        else this.idx.push(start + index[i], start + index[i + 1], start + index[i + 2]);
      }
    }
    return this;
  }

  build(material) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute("emit", new THREE.Float32BufferAttribute(this.emit, 1));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    const mesh = new THREE.Mesh(g, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}

export function voxMaterial(shared) {
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uGlowBoost = shared.uGlowBoost;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float emit;\nvarying float vEmit;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvEmit = emit;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uGlowBoost;\nvarying float vEmit;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * vEmit * mix(1.0, uGlowBoost, 0.6);");
  };
  mat.customProgramCacheKey = () => "voxkit";
  return mat;
}

// A joint: an empty pivot group plus one merged mesh hanging off it.
export function joint(parent, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

export function attach(pivot, part, material) {
  if (!part.pos.length) return null;
  const mesh = part.build(material);
  pivot.add(mesh);
  return mesh;
}
