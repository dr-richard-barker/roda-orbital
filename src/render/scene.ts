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
import { FilterPipeline } from './filters';
import { applyFKToRig, buildMannequin, type ExpressionMood, type MannequinRig } from './mannequin';
import { stylePreset, type VisualFilterId, type VisualStyleId } from './presets';
import { PoseSmoother } from './renderPose';
import { applyToonStyleUniforms } from './toon';
import { VfxSystem, type ContactAOAnchor } from './vfx';

export class GameRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly vfx = new VfxSystem();
  readonly debug = new DebugOverlay();

  private container: HTMLElement;
  private arena: ArenaHandle;
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private rim: THREE.DirectionalLight;
  private filters: FilterPipeline;
  private rigs: [MannequinRig, MannequinRig];
  private slotMeta: [
    { charId: string; paletteIdx: number; costume: CostumeId },
    { charId: string; paletteIdx: number; costume: CostumeId },
  ];
  private smoothers: [PoseSmoother, PoseSmoother] = [new PoseSmoother(), new PoseSmoother()];
  private fks: [FK, FK] = [newFK(), newFK()];
  private posePrev = emptyPose();
  private poseCurr = emptyPose();
  private poseBlend = emptyPose();
  private camRight = new THREE.Vector3(1, 0, 0);
  private camShake = 0;
  private elapsedSec = 0;
  private styleId: VisualStyleId = 'sf2';
  private filterId: VisualFilterId = 'none';
  private retroMode = false;
  private prevAirborne: [boolean, boolean] = [false, false];
  private finisherTimer = 0;
  private finisherMax = 0.5;
  private finisherZoom = 0;
  private finisherPos = new THREE.Vector3();

  // Previous frame world positions of attacking limbs for SF2 smear trails
  private prevTrailPos = new Map<string, THREE.Vector3>();
  private aoContacts: ContactAOAnchor[] = [];

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
    this.hemi = hemi;

    const sun = new THREE.DirectionalLight(0xfff1d6, 2.38);
    sun.position.set(5, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.014;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 26;
    sun.shadow.camera.left = -5.5;
    sun.shadow.camera.right = 5.5;
    sun.shadow.camera.top = 5.5;
    sun.shadow.camera.bottom = -5.5;
    this.scene.add(sun);
    this.scene.add(sun.target);
    this.sun = sun;

    // Subtle cool back-rim directional for crisp SF2 silhouette separation
    const rim = new THREE.DirectionalLight(0x88b4ff, 0.75);
    rim.position.set(-4, 4, -6);
    this.scene.add(rim);
    this.rim = rim;

    this.arena = buildEarthRoda(initialState.config.arenaRadius);
    this.scene.add(this.arena.group);
    this.scene.add(this.vfx.group);
    this.scene.add(this.debug.group);

    this.slotMeta = [
      {
        charId: initialState.fighters[0].charId,
        paletteIdx: initialState.fighters[0].paletteIdx,
        costume: initialState.fighters[0].costume,
      },
      {
        charId: initialState.fighters[1].charId,
        paletteIdx: initialState.fighters[1].paletteIdx,
        costume: initialState.fighters[1].costume,
      },
    ];
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

    this.filters = new FilterPipeline(
      this.renderer,
      this.scene,
      this.camera,
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight,
    );
    this.setStyle('sf2');

    window.addEventListener('resize', () => this.resize(container));
  }

  resize(container: HTMLElement): void {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const pr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h);
    this.filters.setSize(w, h, pr);
  }

  setStyle(styleId: VisualStyleId): void {
    this.styleId = styleId;
    const p = stylePreset(styleId);
    this.scene.background = new THREE.Color(p.bgHex);
    this.scene.fog = new THREE.Fog(p.fogHex, p.fogNear, p.fogFar);
    this.hemi.color.setHex(p.hemiSky);
    this.hemi.groundColor.setHex(p.hemiGround);
    this.hemi.intensity = p.hemiIntensity;
    this.sun.color.setHex(p.sunColor);
    this.sun.intensity = p.sunIntensity;
    this.rim.color.setHex(p.rimColor);
    this.rim.intensity = p.rimIntensity;
    this.renderer.toneMappingExposure = p.exposure;
    applyToonStyleUniforms(p);
    this.arena.applyStyle(styleId);
  }

  getStyle(): VisualStyleId {
    return this.styleId;
  }

  setFilter(filterId: VisualFilterId): void {
    this.filterId = filterId;
    this.retroMode = filterId === 'crt';
    this.filters.setFilter(filterId);
    this.renderer.domElement.classList.toggle('retro-canvas', false);
    document.body.classList.toggle('crt-scanlines', false);
    this.resize(this.container);
  }

  getFilter(): VisualFilterId {
    return this.filterId;
  }

  setRetroMode(enabled: boolean): void {
    this.setFilter(enabled ? 'crt' : 'none');
  }

  isRetroMode(): boolean {
    return this.retroMode;
  }

  rebuildFighter(slot: 0 | 1, charId: string, paletteIdx: number, costume: CostumeId): void {
    const wasVisible = this.rigs[slot].root.visible;
    this.scene.remove(this.rigs[slot].root);
    this.rigs[slot].dispose();
    this.slotMeta[slot] = { charId, paletteIdx, costume };
    this.rigs[slot] = buildMannequin(charById(charId), paletteIdx, costume);
    this.rigs[slot].root.visible = wasVisible;
    this.scene.add(this.rigs[slot].root);
  }

  setCostume(slot: 0 | 1, costume: CostumeId): void {
    const prev = this.slotMeta[slot];
    const quickSwap =
      (prev.costume === 'default' || prev.costume === 'maculele') &&
      (costume === 'default' || costume === 'maculele');
    prev.costume = costume;
    if (quickSwap) {
      this.rigs[slot].setCostume(costume);
    } else {
      this.rebuildFighter(slot, prev.charId, prev.paletteIdx, costume);
    }
  }

  setPalette(slot: 0 | 1, paletteIdx: number): void {
    const cur = this.slotMeta[slot];
    if (cur.paletteIdx === paletteIdx) return;
    this.rebuildFighter(slot, cur.charId, paletteIdx, cur.costume);
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

  /** Trigger KO or harmony milestone micro-zoom, VFX ring, and brief Kinetic Ghost echo flare. */
  triggerFinisherPolish(pos: [number, number, number], intensity: 'KO' | 'MILESTONE'): void {
    const dur = intensity === 'KO' ? 0.56 : 0.34;
    this.finisherTimer = Math.max(this.finisherTimer, dur);
    this.finisherMax = dur;
    this.finisherZoom = intensity === 'KO' ? 0.72 : 0.42;
    this.finisherPos.set(pos[0], pos[1], pos[2]);
    this.vfx.spawnBeatRing(pos, intensity === 'KO' ? 0xff4d6d : 0x80ffdb);
    this.filters.triggerPeakFlare(dur);
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
    this.aoContacts.length = 0;

    for (let i = 0; i < 2; i++) {
      const pf = prev.fighters[i];
      const cf = curr.fighters[i];
      if (!this.rigs[i].root.visible) continue;
      const def = charById(cf.charId);
      const skel = scaleSkeleton(def.body);

      evaluateFighterPose(pf, this.posePrev, prev.frame, prev.fighters[1 - i]);
      evaluateFighterPose(cf, this.poseCurr, curr.frame, curr.fighters[1 - i]);
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

      const fk = this.fks[i];
      computeFK(finalPose, skel, pos, fx / fl, fz / fl, fk);
      applyGroundPinning(fk, skel, cf);
      applyFKToRig(this.rigs[i], fk);

      // Record planted foot & palm contact AO puddles for near-floor limbs
      for (const [fBone, tBone] of [
        ['footL', 'toeL'],
        ['footR', 'toeR'],
      ] as [BoneId, BoneId][]) {
        const fi = BONE_INDEX[fBone] * 3;
        const ti = BONE_INDEX[tBone] * 3;
        const fClr = fk.joints[fi + 1] - fk.radii[BONE_INDEX[fBone]] - 0.025;
        const tClr = Math.min(fk.joints[ti + 1], fk.tips[ti + 1]) - fk.radii[BONE_INDEX[tBone]];
        const clearance = Math.min(fClr, tClr);
        if (clearance < 0.2) {
          this.aoContacts.push({
            x: (fk.joints[fi] + fk.tips[ti]) * 0.5,
            z: (fk.joints[fi + 2] + fk.tips[ti + 2]) * 0.5,
            clearance: Math.max(0, clearance),
            radius: 0.145,
          });
        }
      }
      for (const hBone of ['handL', 'handR'] as BoneId[]) {
        const hi = BONE_INDEX[hBone] * 3;
        const hRad = fk.radii[BONE_INDEX[hBone]];
        const clearance = Math.min(fk.joints[hi + 1], fk.tips[hi + 1]) - hRad;
        if (clearance < 0.18) {
          this.aoContacts.push({
            x: (fk.joints[hi] + fk.tips[hi]) * 0.5,
            z: (fk.joints[hi + 2] + fk.tips[hi + 2]) * 0.5,
            clearance: Math.max(0, clearance),
            radius: 0.115,
          });
        }
      }

      let mood: ExpressionMood = 'calm';
      if (
        cf.mode === 'HITSTUN' ||
        cf.mode === 'BLOCKSTUN' ||
        cf.mode === 'JUGGLE' ||
        cf.mode === 'KNOCKDOWN' ||
        cf.mode === 'KO'
      ) {
        mood = 'hit';
      } else if (cf.mode === 'ATTACK') {
        mood = 'fierce';
      }
      this.rigs[i].setExpression(mood);

      this.rigs[i].updateSecondary(curr.config.gravityScale, dtReal);
      this.emitAttackTrails(i as 0 | 1, cf, fk);

      const airborne = cf.pos[1] > 0.08;
      if (this.prevAirborne[i] && !airborne) {
        this.vfx.spawnDust(cf.pos, 5);
      }
      this.prevAirborne[i] = airborne;
    }

    // Dynamic fighting camera perpendicular to the line between the two fighters
    const p0 = curr.fighters[0].pos;
    const p1 = curr.fighters[1].pos;
    const focusSingle = cameraOrbit?.focusSlot === 0;
    const maxApex = focusSingle ? p0[1] : Math.max(p0[1], p1[1]);
    let midX = focusSingle ? p0[0] : (p0[0] + p1[0]) * 0.5;
    let midY = focusSingle ? p0[1] + 0.92 : (p0[1] + p1[1]) * 0.44 + 0.90;
    let midZ = focusSingle ? p0[2] : (p0[2] + p1[2]) * 0.5;

    // Track crisp 2K sun shadow frustum onto active fighters
    const sp = stylePreset(this.styleId).sunPos;
    this.sun.target.position.set(midX, 0, midZ);
    this.sun.position.set(midX + sp[0], sp[1], midZ + sp[2]);
    this.sun.target.updateMatrixWorld();

    const dx = p1[0] - p0[0];
    const dz = p1[2] - p0[2];
    const sep = Math.hypot(dx, dz);
    let camDist = Math.max(4.35, Math.min(8.8, 2.95 + sep * 0.88 + maxApex * 0.52));

    let finisherEnv = 0;
    if (this.finisherTimer > 0) {
      this.finisherTimer = Math.max(0, this.finisherTimer - dtReal);
      const u = this.finisherMax > 0 ? this.finisherTimer / this.finisherMax : 0;
      finisherEnv = Math.sin(u * Math.PI);
      if (!focusSingle) {
        midX = lerp(midX, this.finisherPos.x, finisherEnv * 0.36);
        midY = lerp(midY, Math.max(0.75, this.finisherPos.y), finisherEnv * 0.32);
        midZ = lerp(midZ, this.finisherPos.z, finisherEnv * 0.36);
        camDist = Math.max(3.6, camDist - this.finisherZoom * finisherEnv);
      }
    }

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
      const focusP = cameraOrbit.focusSlot === 0 ? p0 : [midX, midY - 0.92, midZ];
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
        midY + 0.56 + maxApex * 0.12 - finisherEnv * 0.14 + shakeY,
        midZ + pz * camDist,
      );
      this.camera.position.lerp(targetCamPos, 0.16);
      this.camera.lookAt(midX, midY, midZ);
    }

    this.arena.updateBeat(curr.beatPhase / curr.framesPerBeat);
    this.arena.updateCameraVisibility(this.camera.position, new THREE.Vector3(midX, midY, midZ));
    this.vfx.updateContactAO(this.aoContacts);
    this.vfx.update(dtReal, this.camera.position);
    this.debug.update(
      this.rigs[1].root.visible ? curr.fighters : [curr.fighters[0]],
      this.rigs[1].root.visible ? this.fks : [this.fks[0]],
    );

    this.filters.render(dtReal, this.camShake);
  }
}
