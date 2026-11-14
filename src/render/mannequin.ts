// Procedural 3D Capoeira Mannequin Rig driven directly by sim FK.
// Includes default abadá/cordão outfit AND the unlockable Maculelê costume with dual machetes.
import * as THREE from 'three';
import { BONE_INDEX, BONES, scaleSkeleton, type BoneId } from '../data/skeleton';
import type { CharacterDef, CostumeId } from '../data/characters';
import type { FK } from '../anim/pose';
import { addOutline, toonMat } from './toon';

export interface MannequinRig {
  root: THREE.Group;
  bones: THREE.Group[]; // 16 bone groups positioned & oriented in world space from FK
  setCostume(costume: CostumeId): void;
  dispose(): void;
}

const UP = new THREE.Vector3(0, 1, 0);

function makeLimbMesh(seg: [number, number, number], radius: number, mat: THREE.Material, outline = true): THREE.Mesh {
  const v = new THREE.Vector3(seg[0], seg[1], seg[2]);
  const len = v.length();
  const geo = new THREE.CapsuleGeometry(radius, Math.max(0.01, len), 6, 12);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (len > 1e-5) {
    const dir = v.clone().normalize();
    mesh.quaternion.setFromUnitVectors(UP, dir);
    mesh.position.copy(v).multiplyScalar(0.5);
  }
  if (outline) addOutline(mesh, 1.065);
  return mesh;
}

function makeMacheteMesh(bladeMat: THREE.Material, gripMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  // Wooden handle
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.14, 8), gripMat);
  grip.position.set(0, -0.05, 0);
  addOutline(grip, 1.08);
  g.add(grip);

  // Broad curved facão blade extending forward/down from fist
  const bladeGeo = new THREE.BoxGeometry(0.012, 0.44, 0.058);
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.position.set(0, -0.32, 0.01);
  blade.castShadow = true;
  addOutline(blade, 1.08);
  g.add(blade);

  // Tapered tip
  const tipGeo = new THREE.ConeGeometry(0.032, 0.1, 4);
  const tip = new THREE.Mesh(tipGeo, bladeMat);
  tip.rotation.x = Math.PI;
  tip.rotation.y = Math.PI * 0.25;
  tip.scale.set(0.35, 1, 1);
  tip.position.set(0, -0.58, 0.01);
  g.add(tip);

  return g;
}

export function buildMannequin(def: CharacterDef, paletteIdx = 0, costume: CostumeId = 'default'): MannequinRig {
  const pal = def.palettes[paletteIdx % def.palettes.length] ?? def.palettes[0];
  const skel = scaleSkeleton(def.body);

  const skinMat = toonMat(pal.skin);
  const abadaMat = toonMat(pal.abada);
  const torsoMat = pal.shirt ? toonMat(pal.shirt) : skinMat;
  const cordaoMat = toonMat(pal.cordao);
  const hairMat = toonMat(pal.hair);
  const accentMat = toonMat(pal.accent);
  const sisalMat = toonMat('#d8b86a');
  const redSashMat = toonMat('#c8102e');
  const bladeMat = toonMat('#d6dde6');
  const gripMat = toonMat('#5c3820');

  const root = new THREE.Group();
  const boneGroups: THREE.Group[] = [];
  const maculeleProps: THREE.Object3D[] = [];
  const defaultProps: THREE.Object3D[] = [];

  for (let b = 0; b < BONES.length; b++) {
    const id: BoneId = BONES[b];
    const sb = skel[b];
    const bg = new THREE.Group();

    let mat: THREE.Material = skinMat;
    if (id === 'thighL' || id === 'thighR' || id === 'shinL' || id === 'shinR') {
      mat = abadaMat;
    } else if (id === 'pelvis') {
      mat = abadaMat;
    } else if (id === 'spine' || id === 'chest') {
      mat = torsoMat;
    }

    const rMul = id === 'thighL' || id === 'thighR' || id === 'shinL' || id === 'shinR' ? 1.15 : 1.0;
    const limb = makeLimbMesh(sb.seg, sb.radius * rMul, mat);
    bg.add(limb);

    // Joint sphere for clean silhouette
    const jointSphere = new THREE.Mesh(
      new THREE.SphereGeometry(sb.radius * (id === 'head' ? 1.05 : 0.92), 10, 8),
      mat,
    );
    bg.add(jointSphere);

    // Cordão belt around pelvis/waist
    if (id === 'pelvis') {
      const belt = new THREE.Mesh(new THREE.TorusGeometry(sb.radius * 1.12, 0.025, 8, 18), cordaoMat);
      belt.rotation.x = Math.PI / 2;
      belt.position.y = 0.08;
      bg.add(belt);
      defaultProps.push(belt);

      // Maculelê sisal skirt + red sash
      const sash = new THREE.Mesh(new THREE.TorusGeometry(sb.radius * 1.16, 0.032, 8, 18), redSashMat);
      sash.rotation.x = Math.PI / 2;
      sash.position.y = 0.08;
      bg.add(sash);
      maculeleProps.push(sash);

      const skirt = new THREE.Mesh(
        new THREE.CylinderGeometry(sb.radius * 1.15, sb.radius * 1.85, 0.34, 14, 1, true),
        sisalMat,
      );
      skirt.material = new THREE.MeshToonMaterial({
        color: '#d8b86a',
        gradientMap: sisalMat.gradientMap,
        side: THREE.DoubleSide,
      });
      skirt.position.y = -0.1;
      bg.add(skirt);
      maculeleProps.push(skirt);
    }

    // Maculelê chest paint stripe
    if (id === 'chest') {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(sb.radius * 1.75, 0.04, sb.radius * 1.45), redSashMat);
      stripe.position.y = 0.1;
      bg.add(stripe);
      maculeleProps.push(stripe);
    }

    // Head silhouette + hair/headgear
    if (id === 'head') {
      const faceVisor = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.035, 0.04), accentMat);
      faceVisor.position.set(0, 0.11, sb.radius * 0.92);
      bg.add(faceVisor);

      if (def.hair === 'mohawk') {
        const crest = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.13, 0.18), hairMat);
        crest.position.set(0, 0.22, -0.01);
        addOutline(crest, 1.08);
        bg.add(crest);
      } else if (def.hair === 'cap') {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(sb.radius * 1.12, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), accentMat);
        cap.position.set(0, 0.13, 0);
        bg.add(cap);
        const brim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.12), accentMat);
        brim.position.set(0, 0.16, 0.11);
        bg.add(brim);
      } else if (def.hair === 'bun') {
        const bun = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), hairMat);
        bun.position.set(0, 0.23, -0.07);
        bg.add(bun);
      } else if (def.hair === 'dreads') {
        for (let d = -2; d <= 2; d++) {
          const dr = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.18, 6), hairMat);
          dr.position.set(d * 0.035, 0.08, -0.1);
          dr.rotation.x = 0.3;
          bg.add(dr);
        }
      }
    }

    // Maculelê dual machetes (facões) in each hand!
    if (id === 'handL' || id === 'handR') {
      const machete = makeMacheteMesh(bladeMat, gripMat);
      machete.position.set(0, -0.04, 0);
      bg.add(machete);
      maculeleProps.push(machete);
    }

    boneGroups.push(bg);
    root.add(bg);
  }

  function setCostume(c: CostumeId): void {
    const isMac = c === 'maculele';
    for (const p of maculeleProps) p.visible = isMac;
    for (const p of defaultProps) p.visible = !isMac;
  }
  setCostume(costume);

  return {
    root,
    bones: boneGroups,
    setCostume,
    dispose() {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
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
