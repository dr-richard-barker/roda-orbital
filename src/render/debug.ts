// Toggleable 3D hitbox (red) & hurtbox (cyan) capsule visualizer.
import * as THREE from 'three';
import type { FK } from '../anim/pose';
import { extractActiveHitboxes, extractHurtboxes, type WorldCapsule } from '../sim/collision';
import type { FighterState } from '../sim/state';

const UP = new THREE.Vector3(0, 1, 0);

export class DebugOverlay {
  readonly group = new THREE.Group();
  private pool: THREE.Mesh[] = [];
  private hitMat = new THREE.MeshBasicMaterial({ color: 0xff2a2a, wireframe: true, transparent: true, opacity: 0.85 });
  private hurtMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.35 });
  private unitGeo = new THREE.SphereGeometry(1, 8, 6);

  constructor() {
    this.group.visible = false;
  }

  setVisible(v: boolean): void {
    this.group.visible = v;
  }

  isVisible(): boolean {
    return this.group.visible;
  }

  update(fighters: FighterState[], fks: FK[]): void {
    if (!this.group.visible) return;
    let idx = 0;

    const placeCap = (c: WorldCapsule, mat: THREE.Material) => {
      let mesh = this.pool[idx];
      if (!mesh) {
        mesh = new THREE.Mesh(this.unitGeo, mat);
        this.pool.push(mesh);
        this.group.add(mesh);
      }
      idx++;
      mesh.visible = true;
      mesh.material = mat;
      const a = new THREE.Vector3(c.a[0], c.a[1], c.a[2]);
      const b = new THREE.Vector3(c.b[0], c.b[1], c.b[2]);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const diff = b.clone().sub(a);
      const len = diff.length();
      mesh.position.copy(mid);
      if (len > 1e-4) {
        mesh.quaternion.setFromUnitVectors(UP, diff.normalize());
      } else {
        mesh.quaternion.identity();
      }
      mesh.scale.set(c.radius, Math.max(c.radius, len * 0.5 + c.radius), c.radius);
    };

    for (let i = 0; i < fighters.length; i++) {
      const f = fighters[i];
      const fk = fks[i];
      if (!f || !fk) continue;
      for (const uc of extractHurtboxes(f, fk)) placeCap(uc, this.hurtMat);
      for (const win of extractActiveHitboxes(f, fk)) {
        for (const hc of win.capsules) placeCap(hc, this.hitMat);
      }
    }

    for (let i = idx; i < this.pool.length; i++) {
      this.pool[i].visible = false;
    }
  }
}
