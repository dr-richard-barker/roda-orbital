// Lightweight 3D hit sparks, block sparks, and rhythm downbeat shockwaves.
import * as THREE from 'three';
import type { Vec3 } from '../core/fixedmath';

interface Spark {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface RingWave {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

export class VfxSystem {
  readonly group = new THREE.Group();
  private sparks: Spark[] = [];
  private rings: RingWave[] = [];
  private sparkGeo = new THREE.OctahedronGeometry(0.065, 0);
  private ringGeo = new THREE.RingGeometry(0.35, 0.48, 24);

  spawnBurst(pos: Vec3, color: number, count = 10): void {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(this.sparkGeo, mat.clone());
      m.position.set(pos[0], pos[1], pos[2]);
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const spd = 2.5 + Math.random() * 4.5;
      const vy = (Math.random() - 0.2) * 4.0;
      this.group.add(m);
      this.sparks.push({
        mesh: m,
        vel: new THREE.Vector3(Math.cos(a) * spd, vy, Math.sin(a) * spd),
        life: 0,
        maxLife: 0.26,
      });
    }
  }

  spawnBeatRing(pos: Vec3, color = 0xffd166): void {
    const mat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const m = new THREE.Mesh(this.ringGeo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(pos[0], Math.max(0.03, pos[1] + 0.05), pos[2]);
    this.group.add(m);
    this.rings.push({ mesh: m, life: 0, maxLife: 0.35 });
  }

  update(dt: number): void {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life += dt;
      if (s.life >= s.maxLife) {
        this.group.remove(s.mesh);
        (s.mesh.material as THREE.Material).dispose();
        this.sparks.splice(i, 1);
        continue;
      }
      s.mesh.position.addScaledVector(s.vel, dt);
      s.vel.y -= 9.8 * dt;
      const t = s.life / s.maxLife;
      s.mesh.scale.setScalar(1 - t * 0.7);
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - t;
    }

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life += dt;
      if (r.life >= r.maxLife) {
        this.group.remove(r.mesh);
        (r.mesh.material as THREE.Material).dispose();
        this.rings.splice(i, 1);
        continue;
      }
      const t = r.life / r.maxLife;
      r.mesh.scale.setScalar(1 + t * 2.4);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t);
    }
  }
}
