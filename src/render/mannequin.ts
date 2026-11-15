// Sculpted Street Fighter II stylized 3D Capoeira martial-artist rig.
// Uses anatomical tapered LatheGeometries, taped fighting fists, bare feet,
// fierce arcade face + headband, secondary spring cloth tails, and Maculelê machetes.
import * as THREE from 'three';
import { BONE_INDEX, BONES, scaleSkeleton, type BoneId } from '../data/skeleton';
import type { CharacterDef, CostumeId } from '../data/characters';
import type { FK } from '../anim/pose';
import { SpringRibbon } from './cloth';
import { addOutline, toonMat } from './toon';

export interface MannequinRig {
  root: THREE.Group;
  bones: THREE.Group[]; // 16 bone groups positioned & oriented from FK
  setCostume(costume: CostumeId): void;
  updateSecondary(gravityScale: number, dt: number): void;
  dispose(): void;
}

const UP = new THREE.Vector3(0, 1, 0);

/** Create a sculpted tapered limb geometry along `seg` (0,0,0 -> seg). */
function makeTaperedLimb(
  seg: [number, number, number],
  rStart: number,
  rMid: number,
  rEnd: number,
  mat: THREE.Material,
  outline = 1.065,
  radialSegs = 12,
): THREE.Mesh {
  const v = new THREE.Vector3(seg[0], seg[1], seg[2]);
  const len = Math.max(0.02, v.length());
  const pts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(rStart * 0.92, len * 0.04),
    new THREE.Vector2(rStart, len * 0.16),
    new THREE.Vector2(rMid, len * 0.45),
    new THREE.Vector2(rEnd * 1.04, len * 0.85),
    new THREE.Vector2(rEnd * 0.88, len * 0.97),
    new THREE.Vector2(0.001, len),
  ];
  const geo = new THREE.LatheGeometry(pts, radialSegs);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (v.lengthSq() > 1e-6) {
    mesh.quaternion.setFromUnitVectors(UP, v.clone().normalize());
  }
  addOutline(mesh, outline);
  return mesh;
}

/** Build heroic SF2-style clenched fighting fist with wrist tape. */
function makeFightingFist(skinMat: THREE.Material, wrapMat: THREE.Material, radius: number, isLeft: boolean): THREE.Group {
  const g = new THREE.Group();
  const sideSign = isLeft ? 1 : -1;

  // Wrist wrap cuff
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.92, radius * 0.98, 0.06, 10), wrapMat);
  wrist.position.y = -0.015;
  wrist.castShadow = true;
  addOutline(wrist, 1.07);
  g.add(wrist);

  // Taped fist block (broad knuckles like Ryu/Ken)
  const fist = new THREE.Mesh(new THREE.BoxGeometry(radius * 2.1, 0.095, radius * 2.2), wrapMat);
  fist.position.set(0, -0.07, 0.01);
  fist.castShadow = true;
  addOutline(fist, 1.07);
  g.add(fist);

  // Exposed skin fingertips / knuckle pad
  const knuckle = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.9, 0.035, radius * 1.1), skinMat);
  knuckle.position.set(0, -0.1, 0.032);
  g.add(knuckle);

  // Thumb tucked across front
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(radius * 0.42, 0.04, 4, 6), wrapMat);
  thumb.rotation.z = sideSign * 0.7;
  thumb.position.set(-sideSign * radius * 0.9, -0.065, 0.045);
  g.add(thumb);

  return g;
}

/** Build sculpted Capoeira bare foot (heel, arch, wide forefoot, big toe). */
function makeBareFoot(skinMat: THREE.Material, radius: number, isLeft: boolean): THREE.Group {
  const g = new THREE.Group();
  const s = isLeft ? -1 : 1; // big toe on medial side

  const heel = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.02, 10, 8), skinMat);
  heel.scale.set(0.95, 0.85, 1.1);
  heel.position.set(0, -0.035, -0.01);
  heel.castShadow = true;
  addOutline(heel, 1.07);
  g.add(heel);

  const arch = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.9, 0.055, 0.14), skinMat);
  arch.position.set(0, -0.05, 0.065);
  arch.castShadow = true;
  addOutline(arch, 1.07);
  g.add(arch);

  const forefoot = new THREE.Mesh(new THREE.BoxGeometry(radius * 2.25, 0.045, 0.085), skinMat);
  forefoot.position.set(0, -0.055, 0.155);
  forefoot.castShadow = true;
  addOutline(forefoot, 1.07);
  g.add(forefoot);

  const bigToe = new THREE.Mesh(new THREE.CapsuleGeometry(radius * 0.36, 0.03, 4, 6), skinMat);
  bigToe.rotation.x = Math.PI / 2;
  bigToe.position.set(s * radius * 0.65, -0.06, 0.205);
  g.add(bigToe);

  return g;
}

/** Curved steel Maculelê facão machete with gleaming edge highlight. */
function makeMacheteMesh(bladeMat: THREE.Material, edgeMat: THREE.Material, gripMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.024, 0.15, 8), gripMat);
  grip.position.set(0, -0.06, 0);
  addOutline(grip, 1.08);
  g.add(grip);

  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.022, 0.09), gripMat);
  guard.position.set(0, -0.13, 0.01);
  g.add(guard);

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.44, 0.064), bladeMat);
  blade.position.set(0, -0.35, 0.015);
  blade.castShadow = true;
  addOutline(blade, 1.08);
  g.add(blade);

  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.43, 0.014), edgeMat);
  edge.position.set(0, -0.35, 0.046);
  g.add(edge);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.11, 4), bladeMat);
  tip.rotation.x = Math.PI;
  tip.rotation.y = Math.PI * 0.25;
  tip.scale.set(0.32, 1, 1);
  tip.position.set(0, -0.61, 0.015);
  addOutline(tip, 1.08);
  g.add(tip);

  return g;
}

export function buildMannequin(def: CharacterDef, paletteIdx = 0, costume: CostumeId = 'default'): MannequinRig {
  const pal = def.palettes[paletteIdx % def.palettes.length] ?? def.palettes[0];
  const skel = scaleSkeleton(def.body);

  const skinMat = toonMat(pal.skin);
  const abadaMat = toonMat(pal.abada, { rimStrength: 0.24 });
  const abadaCuffMat = toonMat(pal.abada, { shadowTint: '#2b2440' });
  const torsoMat = pal.shirt ? toonMat(pal.shirt) : skinMat;
  const cordaoMat = toonMat(pal.cordao, { rimStrength: 0.45 });
  const hairMat = toonMat(pal.hair);
  const accentMat = toonMat(pal.accent, { rimStrength: 0.5 });
  const wrapMat = toonMat('#f2ede2', { shadowTint: '#59425c' });
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeDarkMat = new THREE.MeshBasicMaterial({ color: 0x110e16 });

  const sisalMat = toonMat('#d8b86a', { side: THREE.DoubleSide });
  const redSashMat = toonMat('#d61a3c', { rimStrength: 0.48 });
  const bladeMat = toonMat('#c8d4e3', { shadowTint: '#465878', rimColor: '#ffffff', rimStrength: 0.65 });
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xf4f9ff });
  const gripMat = toonMat('#5c3820');

  const root = new THREE.Group();
  const clothRoot = new THREE.Group();
  root.add(clothRoot);

  const boneGroups: THREE.Group[] = [];
  const maculeleProps: THREE.Object3D[] = [];
  const defaultProps: THREE.Object3D[] = [];

  // Anchor markers inside bone spaces for secondary cloth ribbons
  const headTailAnchorL = new THREE.Object3D();
  const headTailAnchorR = new THREE.Object3D();
  const beltTailAnchor = new THREE.Object3D();
  const headBonePos = new THREE.Vector3();
  const prevHeadPos = new THREE.Vector3();
  let hasPrevHead = false;

  const ribbonHeadL = new SpringRibbon(4, 0.085, 0.042, accentMat);
  const ribbonHeadR = new SpringRibbon(4, 0.075, 0.038, accentMat);
  const ribbonBelt = new SpringRibbon(4, 0.09, 0.045, cordaoMat);
  clothRoot.add(ribbonHeadL.group, ribbonHeadR.group, ribbonBelt.group);

  for (let b = 0; b < BONES.length; b++) {
    const id: BoneId = BONES[b];
    const sb = skel[b];
    const bg = new THREE.Group();

    if (id === 'pelvis') {
      const hips = makeTaperedLimb(sb.seg, sb.radius * 1.15, sb.radius * 1.24, sb.radius * 1.12, abadaMat, 1.06);
      bg.add(hips);

      // Cordão rope belt + side knot
      const belt = new THREE.Mesh(new THREE.TorusGeometry(sb.radius * 1.24, 0.026, 8, 20), cordaoMat);
      belt.rotation.x = Math.PI / 2;
      belt.position.y = 0.095;
      addOutline(belt, 1.08);
      bg.add(belt);
      defaultProps.push(belt);

      beltTailAnchor.position.set(sb.radius * 1.22, 0.09, 0.05);
      bg.add(beltTailAnchor);

      // Maculelê sisal skirt (layered strips for fuller silhouette) + red sash
      const sash = new THREE.Mesh(new THREE.TorusGeometry(sb.radius * 1.28, 0.034, 8, 20), redSashMat);
      sash.rotation.x = Math.PI / 2;
      sash.position.y = 0.095;
      bg.add(sash);
      maculeleProps.push(sash);

      const skirt = new THREE.Mesh(
        new THREE.CylinderGeometry(sb.radius * 1.32, sb.radius * 2.15, 0.36, 16, 1, true),
        sisalMat,
      );
      skirt.position.y = -0.11;
      bg.add(skirt);
      maculeleProps.push(skirt);
    } else if (id === 'spine') {
      // Sculpted heroic V-taper waist & abs
      const waist = makeTaperedLimb(sb.seg, sb.radius * 1.08, sb.radius * 1.18, sb.radius * 1.32, torsoMat, 1.06);
      waist.scale.set(1.15, 1, 0.85);
      bg.add(waist);
      if (!pal.shirt) {
        // Subtle sculpted ab blocks
        for (let row = 0; row < 2; row++) {
          for (const side of [-1, 1]) {
            const ab = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.065, 0.04), torsoMat);
            ab.position.set(side * 0.036, 0.06 + row * 0.08, sb.radius * 0.72);
            bg.add(ab);
          }
        }
      }
    } else if (id === 'chest') {
      // Broad SF2 martial-artist chest + pectoral blocks + shoulder trapezius
      const torso = makeTaperedLimb(sb.seg, sb.radius * 1.02, sb.radius * 1.34, sb.radius * 1.18, torsoMat, 1.065);
      torso.scale.set(1.24, 1.12, 0.82);
      bg.add(torso);

      // Pectoral planes
      for (const side of [-1, 1]) {
        const pec = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.095, 0.06), torsoMat);
        pec.position.set(side * 0.072, 0.14, sb.radius * 0.72);
        pec.rotation.y = side * -0.16;
        bg.add(pec);
      }

      // Maculelê red body-paint sash across chest
      for (const tilt of [0.52, -0.52]) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(sb.radius * 1.55, 0.036, sb.radius * 1.08), redSashMat);
        stripe.position.y = 0.11;
        stripe.rotation.z = tilt;
        bg.add(stripe);
        maculeleProps.push(stripe);
      }
    } else if (id === 'head') {
      // Sculpted heroic jaw/cranium + SF2 brow + fierce eyes + headband
      const cranium = new THREE.Mesh(new THREE.SphereGeometry(sb.radius * 1.04, 14, 12), skinMat);
      cranium.scale.set(0.92, 1.15, 1.02);
      cranium.position.set(0, 0.12, 0);
      cranium.castShadow = true;
      addOutline(cranium, 1.06);
      bg.add(cranium);

      const jaw = new THREE.Mesh(new THREE.BoxGeometry(sb.radius * 1.15, 0.085, sb.radius * 1.15), skinMat);
      jaw.position.set(0, 0.055, 0.015);
      addOutline(jaw, 1.055);
      bg.add(jaw);

      // Nose bridge
      const nose = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.05, 0.04), skinMat);
      nose.position.set(0, 0.105, sb.radius * 0.98);
      bg.add(nose);

      // Fierce arcade eyes + slanted eyebrows
      for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.018, 0.015), eyeWhiteMat);
        eye.position.set(side * 0.036, 0.128, sb.radius * 0.94);
        bg.add(eye);

        const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.016, 0.018), eyeDarkMat);
        pupil.position.set(side * 0.034, 0.128, sb.radius * 0.96);
        bg.add(pupil);

        const brow = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.014, 0.022), hairMat);
        brow.position.set(side * 0.036, 0.148, sb.radius * 0.95);
        brow.rotation.z = side * -0.22; // fierce SF2 scowl!
        bg.add(brow);
      }

      // Signature SF2 Hachimaki headband wrap
      const headband = new THREE.Mesh(new THREE.TorusGeometry(sb.radius * 0.99, 0.022, 8, 18), accentMat);
      headband.rotation.x = Math.PI / 2;
      headband.scale.set(0.95, 1.05, 1.0);
      headband.position.set(0, 0.168, 0);
      addOutline(headband, 1.06);
      bg.add(headband);

      headTailAnchorL.position.set(0.025, 0.165, -sb.radius * 1.05);
      headTailAnchorR.position.set(-0.025, 0.165, -sb.radius * 1.05);
      bg.add(headTailAnchorL, headTailAnchorR);

      // Hair silhouettes
      if (def.hair === 'mohawk') {
        for (let m = 0; m < 4; m++) {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.11 - m * 0.012, 6), hairMat);
          spike.position.set(0, 0.255 - m * 0.018, 0.05 - m * 0.055);
          spike.rotation.x = -0.35 - m * 0.22;
          addOutline(spike, 1.08);
          bg.add(spike);
        }
      } else if (def.hair === 'cap') {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(sb.radius * 1.12, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), accentMat);
        cap.position.set(0, 0.14, 0);
        bg.add(cap);
        const brim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.12), accentMat);
        brim.position.set(0, 0.17, 0.11);
        bg.add(brim);
      } else if (def.hair === 'bun') {
        const bun = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), hairMat);
        bun.position.set(0, 0.24, -0.075);
        addOutline(bun, 1.07);
        bg.add(bun);
      } else if (def.hair === 'dreads') {
        for (let d = -2; d <= 2; d++) {
          const dr = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.016, 0.2, 6), hairMat);
          dr.position.set(d * 0.035, 0.09, -0.1);
          dr.rotation.x = 0.35;
          bg.add(dr);
        }
      } else if (def.hair === 'short') {
        const crop = new THREE.Mesh(new THREE.SphereGeometry(sb.radius * 1.07, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.56), hairMat);
        crop.position.set(0, 0.135, -0.01);
        addOutline(crop, 1.06);
        bg.add(crop);
      } else if (def.hair === 'braids') {
        const crown = new THREE.Mesh(new THREE.SphereGeometry(sb.radius * 1.06, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat);
        crown.position.set(0, 0.138, 0);
        bg.add(crown);
        for (const side of [-1, 1]) {
          const braid = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.014, 0.22, 6), hairMat);
          braid.position.set(side * 0.085, 0.06, -0.065);
          braid.rotation.set(0.28, 0, side * 0.18);
          addOutline(braid, 1.06);
          bg.add(braid);
        }
      } else if (def.hair === 'helmet') {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(sb.radius * 1.18, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), accentMat);
        dome.position.set(0, 0.145, 0);
        addOutline(dome, 1.05);
        bg.add(dome);
        const visor = new THREE.Mesh(
          new THREE.BoxGeometry(0.19, 0.055, 0.11),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
        );
        visor.position.set(0, 0.135, 0.095);
        bg.add(visor);
      }
    } else if (id === 'upperArmL' || id === 'upperArmR') {
      // Sculpted deltoid shoulder pauldron + bicep taper
      const deltoid = new THREE.Mesh(new THREE.SphereGeometry(sb.radius * 1.48, 10, 10), skinMat);
      deltoid.scale.set(1.05, 1.15, 1.05);
      addOutline(deltoid, 1.06);
      bg.add(deltoid);

      const bicep = makeTaperedLimb(sb.seg, sb.radius * 1.32, sb.radius * 1.42, sb.radius * 1.05, skinMat, 1.065);
      bg.add(bicep);
    } else if (id === 'foreArmL' || id === 'foreArmR') {
      const elbow = new THREE.Mesh(new THREE.SphereGeometry(sb.radius * 1.08, 8, 8), skinMat);
      bg.add(elbow);
      // Thick Popeye/SF2 martial-artist forearm tapering into wrist
      const forearm = makeTaperedLimb(sb.seg, sb.radius * 1.28, sb.radius * 1.38, sb.radius * 0.92, skinMat, 1.065);
      bg.add(forearm);
    } else if (id === 'handL' || id === 'handR') {
      const fist = makeFightingFist(skinMat, wrapMat, sb.radius, id === 'handL');
      bg.add(fist);

      const machete = makeMacheteMesh(bladeMat, edgeMat, gripMat);
      machete.position.set(0, -0.04, 0);
      bg.add(machete);
      maculeleProps.push(machete);
    } else if (id === 'thighL' || id === 'thighR') {
      // Flowing Capoeira abadá trouser leg
      const thigh = makeTaperedLimb(sb.seg, sb.radius * 1.38, sb.radius * 1.44, sb.radius * 1.18, abadaMat, 1.065);
      bg.add(thigh);
    } else if (id === 'shinL' || id === 'shinR') {
      const knee = new THREE.Mesh(new THREE.SphereGeometry(sb.radius * 1.22, 10, 8), abadaMat);
      bg.add(knee);
      const shin = makeTaperedLimb(sb.seg, sb.radius * 1.25, sb.radius * 1.34, sb.radius * 1.22, abadaMat, 1.065);
      bg.add(shin);
      // Rolled ankle trouser cuff
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(sb.radius * 1.22, 0.022, 6, 14), abadaCuffMat);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.set(0, sb.seg[1] * 0.92, 0);
      bg.add(cuff);
    } else if (id === 'footL' || id === 'footR') {
      const foot = makeBareFoot(skinMat, sb.radius, id === 'footL');
      bg.add(foot);
    }

    boneGroups.push(bg);
    root.add(bg);
  }

  function setCostume(c: CostumeId): void {
    const isMac = c === 'maculele';
    for (const p of maculeleProps) p.visible = isMac;
    for (const p of defaultProps) p.visible = !isMac;
    ribbonBelt.group.visible = !isMac;
  }
  setCostume(costume);

  const tmpAnchor = new THREE.Vector3();
  const tmpWind = new THREE.Vector3();

  function updateSecondary(gravityScale: number, dt: number): void {
    root.updateMatrixWorld(true);
    headTailAnchorL.getWorldPosition(headBonePos);
    if (!hasPrevHead) {
      prevHeadPos.copy(headBonePos);
      hasPrevHead = true;
    }
    const vx = (prevHeadPos.x - headBonePos.x) / Math.max(0.004, dt);
    const vy = (prevHeadPos.y - headBonePos.y) / Math.max(0.004, dt);
    const vz = (prevHeadPos.z - headBonePos.z) / Math.max(0.004, dt);
    prevHeadPos.copy(headBonePos);

    // Subtle trailing breeze behind character facing + reactive inertia from movement
    const headBg = boneGroups[BONE_INDEX.head];
    const backDir = new THREE.Vector3(0, 0, -1).applyQuaternion(headBg.quaternion);

    tmpWind.set(
      backDir.x * 0.65 + THREE.MathUtils.clamp(vx * 0.35, -3, 3),
      0.15 + THREE.MathUtils.clamp(vy * 0.25, -2, 2),
      backDir.z * 0.65 + THREE.MathUtils.clamp(vz * 0.35, -3, 3),
    );
    ribbonHeadL.update(headBonePos, tmpWind, 9.81 * gravityScale, dt);

    headTailAnchorR.getWorldPosition(tmpAnchor);
    tmpWind.x += 0.12;
    ribbonHeadR.update(tmpAnchor, tmpWind, 9.81 * gravityScale, dt);

    if (ribbonBelt.group.visible) {
      beltTailAnchor.getWorldPosition(tmpAnchor);
      tmpWind.set(backDir.x * 0.35 + vx * 0.25, -0.2 + vy * 0.15, backDir.z * 0.35 + vz * 0.25);
      ribbonBelt.update(tmpAnchor, tmpWind, 9.81 * gravityScale, dt);
    }
  }

  return {
    root,
    bones: boneGroups,
    setCostume,
    updateSecondary,
    dispose() {
      ribbonHeadL.dispose();
      ribbonHeadR.dispose();
      ribbonBelt.dispose();
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) obj.geometry.dispose();
      });
    },
  };
}

const tmpMat = new THREE.Matrix4();

/** Sync a MannequinRig's world transforms directly from a computed FK object. */
export function applyFKToRig(rig: MannequinRig, fk: FK): void {
  for (let b = 0; b < BONES.length; b++) {
    const bg = rig.bones[b];
    const i3 = b * 3;
    const i9 = b * 9;
    bg.position.set(fk.joints[i3], fk.joints[i3 + 1], fk.joints[i3 + 2]);
    const r = fk.rots;
    tmpMat.set(
      r[i9], r[i9 + 1], r[i9 + 2], 0,
      r[i9 + 3], r[i9 + 4], r[i9 + 5], 0,
      r[i9 + 6], r[i9 + 7], r[i9 + 8], 0,
      0, 0, 0, 1,
    );
    bg.quaternion.setFromRotationMatrix(tmpMat);
  }
}

export function getHeadWorldPos(fk: FK): THREE.Vector3 {
  const i = BONE_INDEX.head * 3;
  return new THREE.Vector3(fk.tips[i], fk.tips[i + 1], fk.tips[i + 2]);
}
