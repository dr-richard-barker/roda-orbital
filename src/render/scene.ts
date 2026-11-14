// Main Three.js scene, lighting, Tekken-style fighting camera, and interpolated rendering.
import * as THREE from 'three';
import { blendPose, computeFK, emptyPose, newFK, type FK } from '../anim/pose';
import { lerp } from '../core/fixedmath';
import { charById, type CostumeId } from '../data/characters';
import { scaleSkeleton } from '../data/skeleton';
import { evaluateFighterPose } from '../sim/step';
import type { MatchState } from '../sim/state';
import { buildEarthRoda, type ArenaHandle } from './arena';
import { DebugOverlay } from './debug';
import { applyFKToRig, buildMannequin, type MannequinRig } from './mannequin';
import { VfxSystem } from './vfx';

export class GameRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly vfx = new VfxSystem();
  readonly debug = new DebugOverlay();

  private arena: ArenaHandle;
  private rigs: [MannequinRig, MannequinRig];
  private fks: [FK, FK] = [newFK(), newFK()];
  private posePrev = emptyPose();
  private poseCurr = emptyPose();
  private poseBlend = emptyPose();
  private camRight = new THREE.Vector3(1, 0, 0);
  private camShake = 0;

  constructor(container: HTMLElement, initialState: MatchState) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 120);
    this.camera.position.set(0, 2.0, 5.4);

    // Warm sunset directional + hemisphere fill
    const hemi = new THREE.HemisphereLight(0xffeedd, 0x4e3524, 1.15);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
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
    this.renderer.setSize(w, h);
  }

  rebuildFighter(slot: 0 | 1, charId: string, paletteIdx: number, costume: CostumeId): void {
    this.scene.remove(this.rigs[slot].root);
    this.rigs[slot].dispose();
    this.rigs[slot] = buildMannequin(charById(charId), paletteIdx, costume);
    this.scene.add(this.rigs[slot].root);
  }

  setCostume(slot: 0 | 1, costume: CostumeId): void {
    this.rigs[slot].setCostume(costume);
  }

  getCamRight(): [number, number] {
    this.camRight.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const l = Math.hypot(this.camRight.x, this.camRight.z) || 1;
    return [this.camRight.x / l, this.camRight.z / l];
  }

  triggerShake(amount = 0.08): void {
    this.camShake = Math.max(this.camShake, amount);
  }

  draw(prev: MatchState, curr: MatchState, alpha: number, dtReal: number): void {
    // Interpolate fighter positions & poses between prev and curr sim frames
    for (let i = 0; i < 2; i++) {
      const pf = prev.fighters[i];
      const cf = curr.fighters[i];
      const def = charById(cf.charId);
      const skel = scaleSkeleton(def.body);

      evaluateFighterPose(pf, this.posePrev, prev.frame);
      evaluateFighterPose(cf, this.poseCurr, curr.frame);
      blendPose(this.posePrev, this.poseCurr, alpha, this.poseBlend);

      const pos: [number, number, number] = [
        lerp(pf.pos[0], cf.pos[0], alpha),
        lerp(pf.pos[1], cf.pos[1], alpha),
        lerp(pf.pos[2], cf.pos[2], alpha),
      ];
      const fx = lerp(pf.facing[0], cf.facing[0], alpha);
      const fz = lerp(pf.facing[1], cf.facing[1], alpha);
      const fl = Math.hypot(fx, fz) || 1;

      computeFK(this.poseBlend, skel, pos, fx / fl, fz / fl, this.fks[i]);
      applyFKToRig(this.rigs[i], this.fks[i]);
    }

    // Dynamic fighting camera perpendicular to the line between the two fighters
    const p0 = curr.fighters[0].pos;
    const p1 = curr.fighters[1].pos;
    const midX = (p0[0] + p1[0]) * 0.5;
    const midY = (p0[1] + p1[1]) * 0.5 + 0.95;
    const midZ = (p0[2] + p1[2]) * 0.5;

    const dx = p1[0] - p0[0];
    const dz = p1[2] - p0[2];
    const sep = Math.hypot(dx, dz);
    const camDist = Math.max(3.9, Math.min(7.2, 2.7 + sep * 0.88));

    // Line direction unit vector
    const lx = sep > 0.05 ? dx / sep : 1;
    const lz = sep > 0.05 ? dz / sep : 0;
    // Perpendicular vector pointing toward +Z side initially
    let px = -lz;
    let pz = lx;
    if (pz < 0) {
      // Keep camera smoothly on the front hemisphere when possible
      px = -px;
      pz = -pz;
    }

    const shakeX = (Math.random() - 0.5) * this.camShake;
    const shakeY = (Math.random() - 0.5) * this.camShake;
    this.camShake *= 0.82;

    const targetCamPos = new THREE.Vector3(
      midX + px * camDist + shakeX,
      midY + 0.65 + shakeY,
      midZ + pz * camDist,
    );
    this.camera.position.lerp(targetCamPos, 0.16);
    this.camera.lookAt(midX, midY, midZ);

    this.arena.updateBeat(curr.beatPhase / curr.framesPerBeat);
    this.vfx.update(dtReal);
    this.debug.update(curr.fighters, this.fks);

    this.renderer.render(this.scene, this.camera);
  }
}
