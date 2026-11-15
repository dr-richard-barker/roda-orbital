// Street Fighter II inspired VFX: radial starbursts, guard shields, kinetic limb/blade smear arcs, and dust puffs.
import * as THREE from 'three';
import type { Vec3 } from '../core/fixedmath';

interface Spark {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  isDust?: boolean;
}

interface Burst {
  group: THREE.Group;
  life: number;
  maxLife: number;
}

interface RingWave {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

interface ArcSlice {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

export class VfxSystem {
  readonly group = new THREE.Group();
  private sparks: Spark[] = [];
  private bursts: Burst[] = [];
  private rings: RingWave[] = [];
  private arcs: ArcSlice[] = [];

  private sparkGeo = new THREE.OctahedronGeometry(0.065, 0);
  private dustGeo = new THREE.SphereGeometry(0.09, 6, 5);
  private ringGeo = new THREE.RingGeometry(0.35, 0.48, 24);
  private spikeGeo = new THREE.ConeGeometry(0.055, 0.34, 4);

  /** Classic SF2 multi-point radial starburst + flying sparks. */
  spawnBurst(pos: Vec3, color: number, count = 12, isBlock = false): void {
    // 1. Spiky radial arcade starburst facing the camera
    const burstGroup = new THREE.Group();
    burstGroup.position.set(pos[0], pos[1], pos[2]);

    const coreMat = new THREE.MeshBasicMaterial({
      color: isBlock ? 0xb8f8ff : 0xffffff,
      transparent: true,
      opacity: 0.95,
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(isBlock ? 0.16 : 0.19, 8, 8), coreMat);
    burstGroup.add(core);

    const rayCount = isBlock ? 6 : 8;
    const rayMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
    for (let i = 0; i < rayCount; i++) {
      const ang = (i / rayCount) * Math.PI * 2 + Math.random() * 0.25;
      const spike = new THREE.Mesh(this.spikeGeo, rayMat.clone());
      spike.position.set(Math.cos(ang) * 0.14, Math.sin(ang) * 0.14, 0);
      spike.rotation.z = ang - Math.PI / 2;
      spike.scale.set(isBlock ? 0.7 : 1.0, (i % 2 === 0 ? 1.25 : 0.8), 0.4);
      burstGroup.add(spike);
    }

    if (isBlock) {
      // Blue guard ring
      const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x48cae4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.3, 18), shieldMat);
      burstGroup.add(ring);
    }

    this.group.add(burstGroup);
    this.bursts.push({ group: burstGroup, life: 0, maxLife: 0.18 });

    // 2. Flying directional sparks
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(this.sparkGeo, mat.clone());
      m.position.set(pos[0], pos[1], pos[2]);
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const spd = 2.8 + Math.random() * 4.8;
      const vy = (Math.random() - 0.15) * 4.2;
      this.group.add(m);
      this.sparks.push({
        mesh: m,
        vel: new THREE.Vector3(Math.cos(a) * spd, vy, Math.sin(a) * spd),
        life: 0,
        maxLife: 0.24,
      });
    }
  }

  /** Kinetic smear segment connecting previous & current limb tip during an active strike. */
  spawnLimbArc(prev: THREE.Vector3, curr: THREE.Vector3, color: number): void {
    const diff = curr.clone().sub(prev);
    const len = diff.length();
    if (len < 0.025 || len > 1.2) return;

    const geo = new THREE.BoxGeometry(0.032, len * 1.15, 0.11);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.72,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(prev).add(curr).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diff.normalize());
    this.group.add(m);
    this.arcs.push({ mesh: m, life: 0, maxLife: 0.14 });
  }

  spawnDust(pos: Vec3, count = 4): void {
    const mat = new THREE.MeshBasicMaterial({ color: 0xe3b888, transparent: true, opacity: 0.65 });
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(this.dustGeo, mat.clone());
      m.position.set(pos[0] + (Math.random() - 0.5) * 0.25, 0.06, pos[2] + (Math.random() - 0.5) * 0.25);
      this.group.add(m);
      this.sparks.push({
        mesh: m,
        vel: new THREE.Vector3((Math.random() - 0.5) * 1.6, 0.6 + Math.random() * 0.8, (Math.random() - 0.5) * 1.6),
        life: 0,
        maxLife: 0.34,
        isDust: true,
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

  /** Celebratory turquoise-gold Axé ring + rising sparkles for Play / Show near-misses. */
  spawnHarmony(pos: Vec3): void {
    this.spawnBeatRing(pos, 0x48cae4);
    this.spawnBeatRing([pos[0], pos[1] + 0.16, pos[2]], 0xffd166);
    const mat = new THREE.MeshBasicMaterial({ color: 0x80ffdb, transparent: true, opacity: 1 });
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(this.sparkGeo, mat.clone());
      m.position.set(pos[0], pos[1], pos[2]);
      const a = (i / 6) * Math.PI * 2;
      this.group.add(m);
      this.sparks.push({
        mesh: m,
        vel: new THREE.Vector3(Math.cos(a) * 1.9, 2.2 + (i % 2) * 0.9, Math.sin(a) * 1.9),
        life: 0,
        maxLife: 0.28,
      });
    }
  }

  update(dt: number, cameraPos?: THREE.Vector3): void {
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.life += dt;
      if (b.life >= b.maxLife) {
        this.group.remove(b.group);
        b.group.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            if (o.geometry !== this.spikeGeo) o.geometry.dispose();
            (o.material as THREE.Material).dispose();
          }
        });
        this.bursts.splice(i, 1);
        continue;
      }
      if (cameraPos) b.group.lookAt(cameraPos);
      const t = b.life / b.maxLife;
      b.group.scale.setScalar(0.8 + t * 1.45);
      b.group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          (o.material as THREE.MeshBasicMaterial).opacity = 1 - t;
        }
      });
    }

    for (let i = this.arcs.length - 1; i >= 0; i--) {
      const a = this.arcs[i];
      a.life += dt;
      if (a.life >= a.maxLife) {
        this.group.remove(a.mesh);
        a.mesh.geometry.dispose();
        (a.mesh.material as THREE.Material).dispose();
        this.arcs.splice(i, 1);
        continue;
      }
      const t = a.life / a.maxLife;
      a.mesh.scale.set(1 - t * 0.6, 1, 1 - t * 0.4);
      (a.mesh.material as THREE.MeshBasicMaterial).opacity = 0.72 * (1 - t);
    }

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
      if (!s.isDust) s.vel.y -= 9.8 * dt;
      const t = s.life / s.maxLife;
      s.mesh.scale.setScalar(s.isDust ? 0.8 + t * 1.2 : 1 - t * 0.7);
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = (s.isDust ? 0.6 : 1) * (1 - t);
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
