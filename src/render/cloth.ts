// Lightweight Verlet spring ribbons for fluttering SF2 headband tails & cordão belt ends.
import * as THREE from 'three';
import { addOutline } from './toon';

export class SpringRibbon {
  readonly group = new THREE.Group();
  private pts: THREE.Vector3[];
  private prev: THREE.Vector3[];
  private segLen: number;
  private segMeshes: THREE.Mesh[] = [];
  private up = new THREE.Vector3(0, 1, 0);
  private tmpDir = new THREE.Vector3();
  private initialized = false;

  constructor(segments: number, segLen: number, width: number, mat: THREE.Material) {
    this.segLen = segLen;
    this.pts = Array.from({ length: segments + 1 }, () => new THREE.Vector3());
    this.prev = Array.from({ length: segments + 1 }, () => new THREE.Vector3());

    for (let i = 0; i < segments; i++) {
      const taper = 1 - (i / segments) * 0.35;
      const geo = new THREE.BoxGeometry(width * taper, segLen * 1.06, width * 0.25);
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      addOutline(m, 1.08);
      this.segMeshes.push(m);
      this.group.add(m);
    }
  }

  update(anchorWorld: THREE.Vector3, windDir: THREE.Vector3, gravity: number, dt: number): void {
    if (!this.initialized) {
      for (let i = 0; i < this.pts.length; i++) {
        this.pts[i].copy(anchorWorld).addScaledVector(windDir, i * this.segLen);
        this.pts[i].y -= i * this.segLen * 0.35;
        this.prev[i].copy(this.pts[i]);
      }
      this.initialized = true;
    }

    this.pts[0].copy(anchorWorld);
    this.prev[0].copy(anchorWorld);

    const stepDt = Math.min(dt, 0.033);
    const drag = 0.89;
    const g = gravity * 0.55;

    for (let i = 1; i < this.pts.length; i++) {
      const cur = this.pts[i];
      const prv = this.prev[i];
      const vx = (cur.x - prv.x) * drag;
      const vy = (cur.y - prv.y) * drag;
      const vz = (cur.z - prv.z) * drag;
      prv.copy(cur);
      cur.x += vx + windDir.x * stepDt * 0.55;
      cur.y += vy - g * stepDt * stepDt + windDir.y * stepDt * 0.3;
      cur.z += vz + windDir.z * stepDt * 0.55;
      if (cur.y < 0.04) cur.y = 0.04;
    }

    // Distance constraint relaxation
    for (let iter = 0; iter < 3; iter++) {
      this.pts[0].copy(anchorWorld);
      for (let i = 0; i < this.pts.length - 1; i++) {
        const a = this.pts[i];
        const b = this.pts[i + 1];
        this.tmpDir.subVectors(b, a);
        const d = this.tmpDir.length();
        if (d > 1e-5) {
          const diff = (d - this.segLen) / d;
          if (i === 0) {
            b.addScaledVector(this.tmpDir, -diff);
          } else {
            a.addScaledVector(this.tmpDir, diff * 0.45);
            b.addScaledVector(this.tmpDir, -diff * 0.55);
          }
        }
      }
    }

    for (let i = 0; i < this.segMeshes.length; i++) {
      const a = this.pts[i];
      const b = this.pts[i + 1];
      const m = this.segMeshes[i];
      m.position.copy(a).add(b).multiplyScalar(0.5);
      this.tmpDir.subVectors(b, a);
      const len = this.tmpDir.length();
      if (len > 1e-5) {
        this.tmpDir.multiplyScalar(1 / len);
        m.quaternion.setFromUnitVectors(this.up, this.tmpDir);
      }
    }
  }

  dispose(): void {
    for (const m of this.segMeshes) m.geometry.dispose();
  }
}
