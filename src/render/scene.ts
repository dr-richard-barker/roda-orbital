// Main Three.js scene, lighting, Tekken-style fighting camera, IK ground pinning, and SF2 VFX.
import * as THREE from 'three';
import { applyGroundPinning } from '../anim/ik';
import { blendPose, computeFK, emptyPose, newFK, type FK } from '../anim/pose';
import { lerp } from '../core/fixedmath';
import { charById, type CostumeId } from '../data/characters';
import { MOVE_BY_ID } from '../data/moves';
import { BONE_INDEX, scaleSkeleton, type BoneId } from '../data/skeleton';
import { evaluateFighterPose } from '../sim/step';
import type { MatchState } from '../sim/state';
import { buildEarthRoda, type ArenaHandle } from './arena';
import { DebugOverlay } from './debug';
import { applyFKToRig, buildMannequin, type MannequinRig } from './mannequin';
import { PoseSmoother } from './renderPose';
import { VfxSystem } from './vfx';

export class GameRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly vfx = new VfxSystem();
  readonly debug = new DebugOverlay();

  private container: HTMLElement;
  private arena: ArenaHandle;
  private rigs: [MannequinRig, MannequinRig];
  private smoothers: [PoseSmoother, PoseSmoother] = [new PoseSmoother(), new PoseSmoother()];
  private fks: [FK, FK] = [newFK(), newFK()];
  private posePrev = emptyPose();
  private poseCurr = emptyPose();
  private poseBlend = emptyPose();
  private camRight = new THREE.Vector3(1, 0, 0);
  private camShake = 0;
  private elapsedSec = 0;
  private retroMode = false;

  // Previous frame world positions of attacking limbs for SF2 smear trails
  private prevTrailPos = new Map<string, THREE.Vector3>();

  constructor(container: HTMLElement, initialState: MatchState) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 120);
    this.camera.position.set(0, 2.0, 5.4);

    // Warm arcade sunset key light + cool rim bounce
    const hemi = new THREE.HemisphereLight(0xffe6cc, 0x3b2442, 1.15);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff1d6, 2.35);
    sun.position.set(5, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 30;
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    this.scene.add(sun);

    // Subtle cool back-rim directional for crisp SF2 silhouette separation
    const rim = new THREE.DirectionalLight(0x88b4ff, 0.75);
    rim.position.set(-4, 4, -6);
    this.scene.add(rim);

    this.arena = buildEarthRoda(initialState.config.arenaRadius);
    this.scene.add(this.arena.group);
    this.scene.add(this.vfx.group);
    this.scene.add(this.debug.group);

    this.rigs = [
      buildMannequin(
        charById(initialState.fighters[0].charId),
        initialState.fighters[0].paletteIdx,
        initialState.fighters[0].costume,
      ),
      buildMannequin(
        charById(initialState.fighters[1].charId),
        initialState.fighters[1].paletteIdx,
        initialState.fighters[1].costume,
      ),
    ];
    this.scene.add(this.rigs[0].root);
    this.scene.add(this.rigs[1].root);

    window.addEventListener('resize', () => this.resize(container));
  }

  resize(container: HTMLElement): void {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.retroMode) {
      // CPS-1 arcade crispness (~384p vertical internal buffer scaled cleanly)
      this.renderer.setPixelRatio(1);
      const scale = Math.min(1, 360 / Math.max(1, h));
      this.renderer.setSize(Math.round(w * scale), Math.round(h * scale), false);
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(w, h);
    }
  }

  setRetroMode(enabled: boolean): void {
    this.retroMode = enabled;
    this.renderer.domElement.classList.toggle('retro-canvas', enabled);
    document.body.classList.toggle('crt-scanlines', enabled);
    this.resize(this.container);
  }

  isRetroMode(): boolean {
    return this.retroMode;
  }

  rebuildFighter(slot: 0 | 1, charId: string, paletteIdx: number, costume: CostumeId): void {
    const wasVisible = this.rigs[slot].root.visible;
    this.scene.remove(this.rigs[slot].root);
    this.rigs[slot].dispose();
    this.rigs[slot] = buildMannequin(charById(charId), paletteIdx, costume);
    this.rigs[slot].root.visible = wasVisible;
    this.scene.add(this.rigs[slot].root);
  }

  setCostume(slot: 0 | 1, costume: CostumeId): void {
    this.rigs[slot].setCostume(costume);
  }

  setFighterVisible(slot: 0 | 1, visible: boolean): void {
    this.rigs[slot].root.visible = visible;
  }

  getCamRight(): [number, number] {
    this.camRight.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const l = Math.hypot(this.camRight.x, this.camRight.z) || 1;
    return [this.camRight.x / l, this.camRight.z / l];
  }

  triggerShake(amount = 0.08): void {
    this.camShake = Math.max(this.camShake, amount);
  }

  private emitAttackTrails(slot: 0 | 1, f: MatchState['fighters'][0], fk: FK): void {
    if (f.mode !== 'ATTACK' || !f.moveId) {
      // Clear cached trail positions when not attacking
      for (const k of [...this.prevTrailPos.keys()]) {
        if (k.startsWith(`${slot}:`)) this.prevTrailPos.delete(k);
      }
      return;
    }
    const move = MOVE_BY_ID[f.moveId];
    if (!move) return;

    const activeBones = new Set<BoneId>();
    for (const hw of move.hits) {
      if (f.moveFrame >= Math.max(1, hw.frames[0] - 2) && f.moveFrame <= hw.frames[1] + 2) {
        for (const c of hw.capsules) activeBones.add(c.bone);
      }
    }
    if (activeBones.size === 0) return;

    const isSpecial = Boolean(move.tags?.length);
    const color =
      f.costume === 'maculele' && (activeBones.has('handL') || activeBones.has('handR'))
        ? 0xa8e8ff
        : isSpecial
          ? 0xffb703
          : 0xfff3d6;

    for (const bone of activeBones) {
      const i = BONE_INDEX[bone] * 3;
      const cur = new THREE.Vector3(fk.tips[i], fk.tips[i + 1], fk.tips[i + 2]);
      const key = `${slot}:${bone}`;
      const prev = this.prevTrailPos.get(key);
      if (prev) {
        this.vfx.spawnLimbArc(prev, cur, color);
        prev.copy(cur);
      } else {
        this.prevTrailPos.set(key, cur);
      }
    }
  }

  draw(
    prev: MatchState,
    curr: MatchState,
    alpha: number,
    dtReal: number,
    cameraOrbit?: { yaw: number; pitch: number; dist: number; focusSlot?: 0 | 'mid' },
  ): void {
    this.elapsedSec += dtReal;

    for (let i = 0; i < 2; i++) {
      const pf = prev.fighters[i];
      const cf = curr.fighters[i];
      if (!this.rigs[i].root.visible) continue;
      const def = charById(cf.charId);
      const skel = scaleSkeleton(def.body);

      evaluateFighterPose(pf, this.posePrev, prev.frame);
      evaluateFighterPose(cf, this.poseCurr, curr.frame);
      blendPose(this.posePrev, this.poseCurr, alpha, this.poseBlend);

      // Renderer-only smooth transition cross-fade + living breath
      const finalPose = this.smoothers[i].smooth(cf, this.poseBlend, this.elapsedSec);

      // SF2-style hit-freeze vibration on the stunned victim during hitstop
      let hitJitterX = 0;
      if (curr.hitstop > 0 && (cf.mode === 'HITSTUN' || cf.mode === 'BLOCKSTUN' || cf.mode === 'JUGGLE')) {
        hitJitterX = (curr.hitstop % 2 === 0 ? 1 : -1) * 0.032;
      }

      const pos: [number, number, number] = [
        lerp(pf.pos[0], cf.pos[0], alpha) + hitJitterX,
        lerp(pf.pos[1], cf.pos[1], alpha),
        lerp(pf.pos[2], cf.pos[2], alpha),
      ];
      const fx = lerp(pf.facing[0], cf.facing[0], alpha);
      const fz = lerp(pf.facing[1], cf.facing[1], alpha);
      const fl = Math.hypot(fx, fz) || 1;

      computeFK(finalPose, skel, pos, fx / fl, fz / fl, this.fks[i]);
      applyGroundPinning(this.fks[i], skel, cf);
      applyFKToRig(this.rigs[i], this.fks[i]);
      this.rigs[i].updateSecondary(curr.config.gravityScale, dtReal);
      this.emitAttackTrails(i as 0 | 1, cf, this.fks[i]);
    }

    // Dynamic fighting camera perpendicular to the line between the two fighters
    const p0 = curr.fighters[0].pos;
    const p1 = curr.fighters[1].pos;
    const midX = (p0[0] + p1[0]) * 0.5;
    const midY = (p0[1] + p1[1]) * 0.5 + 0.96;
    const midZ = (p0[2] + p1[2]) * 0.5;

    const dx = p1[0] - p0[0];
    const dz = p1[2] - p0[2];
    const sep = Math.hypot(dx, dz);
    const camDist = Math.max(3.8, Math.min(7.0, 2.6 + sep * 0.88));

    const lx = sep > 0.05 ? dx / sep : 1;
    const lz = sep > 0.05 ? dz / sep : 0;
    let px = -lz;
    let pz = lx;
    if (pz < 0) {
      px = -px;
      pz = -pz;
    }

    const shakeX = (Math.random() - 0.5) * this.camShake;
    const shakeY = (Math.random() - 0.5) * this.camShake;
    this.camShake *= 0.82;

    if (cameraOrbit) {
      const focusP = cameraOrbit.focusSlot === 0 ? p0 : [midX, midY - 0.96, midZ];
      const fx = focusP[0];
      const fy = focusP[1] + 0.92;
      const fz = focusP[2];
      const cosP = Math.cos(cameraOrbit.pitch);
      const target = new THREE.Vector3(
        fx + Math.sin(cameraOrbit.yaw) * cosP * cameraOrbit.dist + shakeX,
        fy + Math.sin(cameraOrbit.pitch) * cameraOrbit.dist + shakeY,
        fz + Math.cos(cameraOrbit.yaw) * cosP * cameraOrbit.dist,
      );
      this.camera.position.lerp(target, 0.28);
      this.camera.lookAt(fx, fy, fz);
    } else {
      const targetCamPos = new THREE.Vector3(
        midX + px * camDist + shakeX,
        midY + 0.58 + shakeY,
        midZ + pz * camDist,
      );
      this.camera.position.lerp(targetCamPos, 0.16);
      this.camera.lookAt(midX, midY, midZ);
    }

    this.arena.updateBeat(curr.beatPhase / curr.framesPerBeat);
    this.vfx.update(dtReal, this.camera.position);
    this.debug.update(
      this.rigs[1].root.visible ? curr.fighters : [curr.fighters[0]],
      this.rigs[1].root.visible ? this.fks : [this.fks[0]],
    );

    this.renderer.render(this.scene, this.camera);
  }
}
