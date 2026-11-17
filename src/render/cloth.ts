// Continuous tapered Verlet cloth ribbons for SF2 headband tails, cordão belt ends & Maculelê sisal skirt strips.
import * as THREE from 'three';
import { toonMat } from './toon';

export class SpringRibbon {
  readonly group = new THREE.Group();
  private pts: THREE.Vector3[];
  private prev: THREE.Vector3[];
  private segLen: number;
  private width: number;
  private posAttr: THREE.BufferAttribute;
  private mesh: THREE.Mesh;
  private geo: THREE.BufferGeometry;
  private mat: THREE.Material;
  private tmpDir = new THREE.Vector3();
  private sideVec = new THREE.Vector3();
  private initialized = false;
  private taperAmount: number;

  constructor(segments: number, segLen: number, width: number, srcMat: THREE.Material, taperAmount = 0.55) {
    this.segLen = segLen;
    this.width = width;
    this.taperAmount = taperAmount;
    const nPts = segments + 1;
    this.pts = Array.from({ length: nPts }, () => new THREE.Vector3());
    this.prev = Array.from({ length: nPts }, () => new THREE.Vector3());

    // Extract base color cleanly from source material and shade with cel-lit double-sided toon material
    const baseColor =
      srcMat instanceof THREE.MeshToonMaterial || srcMat instanceof THREE.MeshBasicMaterial
        ? srcMat.color.clone()
        : new THREE.Color(0xf4a261);

    this.mat = toonMat(baseColor.getHex(), {
      side: THREE.DoubleSide,
      rimStrength: 0.36,
    });

    const positions = new Float32Array(nPts * 2 * 3);
    const uvs = new Float32Array(nPts * 2 * 2);
    const indices: number[] = [];
    for (let i = 0; i < nPts; i++) {
      const v = i / segments;
      uvs[i * 4] = 0;
      uvs[i * 4 + 1] = v;
      uvs[i * 4 + 2] = 1;
      uvs[i * 4 + 3] = v;
    }
    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, b, c, b, d, c);
    }

    this.geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(positions, 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('position', this.posAttr);
    this.geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    this.geo.setIndex(indices);

    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
    this.group.add(this.mesh);
  }

  update(
    anchorWorld: THREE.Vector3,
    windDir: THREE.Vector3,
    gravity: number,
    dt: number,
    ribbonAxis?: THREE.Vector3,
  ): void {
    // Re-seed smoothly if uninitialized or after abrupt fighter reset / scrub jump
    if (!this.initialized || this.pts[0].distanceToSquared(anchorWorld) > 0.16) {
      const wLen = windDir.length() || 1;
      for (let i = 0; i < this.pts.length; i++) {
        this.pts[i]
          .copy(anchorWorld)
          .addScaledVector(windDir, (i * this.segLen * 0.7) / wLen);
        this.pts[i].y -= i * this.segLen * 0.45;
        this.prev[i].copy(this.pts[i]);
      }
      this.initialized = true;
    }

    this.pts[0].copy(anchorWorld);
    this.prev[0].copy(anchorWorld);

    const stepDt = Math.min(Math.max(dt, 0.008), 0.032);
    const drag = 0.86;
    const gForce = gravity * 0.85;

    for (let i = 1; i < this.pts.length; i++) {
      const cur = this.pts[i];
      const prv = this.prev[i];
      const vx = THREE.MathUtils.clamp((cur.x - prv.x) * drag, -0.05, 0.05);
      const vy = THREE.MathUtils.clamp((cur.y - prv.y) * drag, -0.05, 0.05);
      const vz = THREE.MathUtils.clamp((cur.z - prv.z) * drag, -0.05, 0.05);
      prv.copy(cur);
      cur.x += vx + windDir.x * stepDt * 0.35;
      cur.y += vy - gForce * stepDt * stepDt + windDir.y * stepDt * 0.25;
      cur.z += vz + windDir.z * stepDt * 0.35;
      if (cur.y < 0.03) cur.y = 0.03;
    }

    // Rigid sequential distance solve from anchor outward prevents separation gaps
    for (let iter = 0; iter < 4; iter++) {
      this.pts[0].copy(anchorWorld);
      for (let i = 0; i < this.pts.length - 1; i++) {
        const a = this.pts[i];
        const b = this.pts[i + 1];
        this.tmpDir.subVectors(b, a);
        const d = this.tmpDir.length();
        if (d > 1e-5) {
          const diff = (d - this.segLen) / d;
          b.addScaledVector(this.tmpDir, -diff);
        }
      }
    }

    const nPts = this.pts.length;
    const arr = this.posAttr.array as Float32Array;
    for (let i = 0; i < nPts; i++) {
      const p = this.pts[i];
      const next = this.pts[Math.min(nPts - 1, i + 1)];
      const prev = this.pts[Math.max(0, i - 1)];
      this.tmpDir.subVectors(next, prev);
      if (this.tmpDir.lengthSq() < 1e-6) this.tmpDir.set(0, -1, 0);
      this.tmpDir.normalize();

      if (ribbonAxis) {
        this.sideVec.crossVectors(this.tmpDir, ribbonAxis);
      } else {
        this.sideVec.crossVectors(this.tmpDir, new THREE.Vector3(0, 1, 0));
        if (this.sideVec.lengthSq() < 1e-4) {
          this.sideVec.crossVectors(this.tmpDir, new THREE.Vector3(0, 0, 1));
        }
      }
      if (this.sideVec.lengthSq() < 1e-5) this.sideVec.set(1, 0, 0);
      this.sideVec.normalize();

      const taper = 1 - (i / (nPts - 1)) * this.taperAmount;
      const hw = this.width * 0.5 * taper;
      const base = i * 6;
      arr[base] = p.x - this.sideVec.x * hw;
      arr[base + 1] = p.y - this.sideVec.y * hw;
      arr[base + 2] = p.z - this.sideVec.z * hw;
      arr[base + 3] = p.x + this.sideVec.x * hw;
      arr[base + 4] = p.y + this.sideVec.y * hw;
      arr[base + 5] = p.z + this.sideVec.z * hw;
    }
    this.posAttr.needsUpdate = true;
    this.geo.computeVertexNormals();
  }

  dispose(): void {
    this.geo.dispose();
    this.mat.dispose();
  }
}
