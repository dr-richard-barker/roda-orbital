// Stylized HD Street Fighter II Capoeira 3D fighter rig:
// Pairs a seamless 4-bone-weighted SkinnedMesh body (torso, neck, deltoids, arms,
// draped cotton abadá trousers) with sculpted head/hair, taped open/closed fighting
// hands, articulated heel+toe bare feet, braided cordão, spring ribbons, and Maculelê props.
import * as THREE from 'three';
import { computeFK, emptyPose, newFK, type FK } from '../anim/pose';
import type { CharacterDef, CostumeId } from '../data/characters';
import { BONE_INDEX, BONES, scaleSkeleton, type BoneId } from '../data/skeleton';
import { SpringRibbon } from './cloth';
import { buildSkinnedFighterMeshes } from './skinnedCharacter';
import {
  getCordaoTextureSet,
  getKilomboPaintTextureSet,
  getOrbitalSuitTextureSet,
  getSkinTextureSet,
  getWoodTextureSet,
} from './textures';
import { addOutline, toonMat } from './toon';

export type ExpressionMood = 'calm' | 'fierce' | 'hit';

export interface MannequinRig {
  root: THREE.Group;
  bones: THREE.Group[]; // 21 bone groups positioned & oriented from FK
  setCostume(costume: CostumeId): void;
  setExpression(mood: ExpressionMood): void;
  updateSecondary(gravityScale: number, dt: number): void;
  dispose(): void;
}

/** Sculpted head cranium smoothly tapered into anatomical cheekbones & jaw without boxy seams. */
function buildSculptedHeadGeo(radius: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(radius * 1.05, 22, 16);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    // Elongate vertically into athletic cranium + slightly narrow temporal width
    x *= 0.90;
    y *= 1.15;
    z *= 0.98;
    // Lower half narrows gradually toward cheekbones & chin and juts forward slightly at mandible
    if (y < 0) {
      const t = Math.min(1, -y / (radius * 1.2));
      x *= 1 - t * 0.24;
      if (z > 0) {
        z += t * radius * 0.24;
      } else {
        z *= 1 - t * 0.14;
      }
      y -= t * radius * 0.12;
    }
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Sculpted fighting hand with wrist wrap tape, anatomical palm arch, curled fingers, and thumb. */
function makeFightingHand(
  skinMat: THREE.Material,
  wrapMat: THREE.Material,
  radius: number,
  isLeft: boolean,
): THREE.Group {
  const g = new THREE.Group();
  const sideSign = isLeft ? 1 : -1;

  // Athletic wrist wrap cuff
  const wrist = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.88, radius * 0.95, 0.048, 12),
    wrapMat,
  );
  wrist.position.y = -0.014;
  wrist.castShadow = true;
  addOutline(wrist, 1.065);
  g.add(wrist);

  // Cushioned anatomical palm metacarpal arch
  const palm = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.02, 12, 10), skinMat);
  palm.scale.set(1.02, 1.26, 0.64);
  palm.position.set(0, -0.056, 0.008);
  palm.castShadow = true;
  addOutline(palm, 1.065);
  g.add(palm);

  // Taped mid-hand martial-arts wrap band hugging the palm contour
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.98, radius * 0.94, 0.036, 12),
    wrapMat,
  );
  band.scale.set(1.05, 1.0, 0.68);
  band.position.set(0, -0.056, 0.008);
  g.add(band);

  // Sculpted curled knuckle / finger ridge
  const fingers = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius * 0.44, radius * 0.94, 5, 10),
    skinMat,
  );
  fingers.rotation.set(-0.24, 0, Math.PI / 2);
  fingers.position.set(0, -0.092, 0.022);
  fingers.castShadow = true;
  addOutline(fingers, 1.06);
  g.add(fingers);

  // Sculpted medial thumb
  const thumb = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius * 0.34, 0.036, 4, 8),
    skinMat,
  );
  thumb.rotation.set(-0.35, 0, sideSign * 0.65);
  thumb.position.set(-sideSign * radius * 0.9, -0.058, 0.032);
  addOutline(thumb, 1.055);
  g.add(thumb);

  return g;
}

/** Bare heel + rounded midfoot arch + ankle malleolus terminating cleanly at the metatarsal ball hinge. */
function makeBareFootArch(skinMat: THREE.Material, radius: number): THREE.Group {
  const g = new THREE.Group();

  // Calcaneus heel
  const heel = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.96, 12, 10), skinMat);
  heel.scale.set(0.9, 0.82, 1.15);
  heel.position.set(0, -0.036, -0.01);
  heel.castShadow = true;
  heel.receiveShadow = true;
  addOutline(heel, 1.065);
  g.add(heel);

  // Medial & lateral ankle malleolus knobs
  for (const side of [-1, 1]) {
    const malleolus = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.42, 8, 8), skinMat);
    malleolus.position.set(side * radius * 0.72, -0.008, 0.004);
    g.add(malleolus);
  }

  // Smooth anatomical plantar arch (ankle -> metatarsal ball hinge)
  const arch = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius * 0.72, 0.088, 5, 10),
    skinMat,
  );
  arch.scale.set(1.12, 1.0, 0.74);
  arch.position.set(0, -0.044, 0.048);
  arch.rotation.x = Math.PI / 2 + 0.24;
  arch.castShadow = true;
  arch.receiveShadow = true;
  addOutline(arch, 1.065);
  g.add(arch);

  return g;
}

/** Articulated metatarsal forefoot pad & tapered 5-toe silhouette driven by toeL/toeR. */
function makeArticulatedToes(
  skinMat: THREE.Material,
  radius: number,
  isLeft: boolean,
): THREE.Group {
  const g = new THREE.Group();
  const s = isLeft ? -1 : 1; // big toe on medial side (-X on Left, +X on Right)

  // Metatarsal ball cushion centered smoothly at joint [0,0,0]
  const ball = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.98, 12, 8), skinMat);
  ball.scale.set(1.22, 0.62, 0.88);
  ball.position.set(0, 0.0, 0.012);
  ball.castShadow = true;
  addOutline(ball, 1.06);
  g.add(ball);

  // Rounded lesser-toes cluster
  const lesser = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius * 0.42, radius * 0.92, 5, 10),
    skinMat,
  );
  lesser.scale.set(0.86, 1.0, 0.68);
  lesser.rotation.set(0.14, s * -0.14, Math.PI / 2);
  lesser.position.set(-s * radius * 0.22, -0.006, 0.044);
  lesser.castShadow = true;
  addOutline(lesser, 1.06);
  g.add(lesser);

  // Distinct big toe (hallux) for crisp barefoot planted silhouette
  const bigToe = new THREE.Mesh(new THREE.CapsuleGeometry(radius * 0.38, 0.032, 4, 8), skinMat);
  bigToe.rotation.x = Math.PI / 2;
  bigToe.position.set(s * radius * 0.72, -0.004, 0.055);
  bigToe.castShadow = true;
  addOutline(bigToe, 1.06);
  g.add(bigToe);

  return g;
}

/** Curved steel Maculelê facão machete with hardwood handle & bright gleam edge. */
function makeMacheteMesh(
  bladeMat: THREE.Material,
  edgeMat: THREE.Material,
  gripMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.024, 0.15, 10), gripMat);
  grip.position.set(0, -0.06, 0);
  addOutline(grip, 1.08);
  g.add(grip);

  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.022, 0.092), gripMat);
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

export function buildMannequin(
  def: CharacterDef,
  paletteIdx = 0,
  costume: CostumeId = 'default',
): MannequinRig {
  const pal = def.palettes[paletteIdx % def.palettes.length] ?? def.palettes[0];
  const skel = scaleSkeleton(def.body);

  const skinTex = getSkinTextureSet();
  const cordaoTex = getCordaoTextureSet();
  const woodTex = getWoodTextureSet();

  const isXray = costume === 'xray';
  const isOrbital = costume === 'orbital';
  const isKilombo = costume === 'kilombo';

  let skinMat: THREE.Material;
  if (isXray) {
    skinMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
  } else if (isKilombo) {
    const kp = getKilomboPaintTextureSet(pal.skin, pal.accent);
    skinMat = toonMat('#ffffff', {
      map: kp.map,
      bumpMap: kp.bumpMap,
      bumpScale: 0.004,
      rimStrength: 0.36,
      subsurfaceStrength: 0.16,
    });
  } else {
    skinMat = toonMat(pal.skin, {
      map: skinTex.map,
      bumpMap: skinTex.bumpMap,
      bumpScale: 0.002,
      rimStrength: 0.36,
      subsurfaceStrength: 0.22,
    });
  }
  const abadaCuffMat = isXray
    ? new THREE.MeshBasicMaterial({ color: 0x67e8f9, wireframe: true, transparent: true, opacity: 0.25 })
    : isOrbital
      ? (() => {
          const os = getOrbitalSuitTextureSet(pal.abada, pal.accent);
          return toonMat('#ffffff', { map: os.map, bumpMap: os.bumpMap, bumpScale: 0.015, rimStrength: 0.5 });
        })()
      : toonMat(pal.abada, { shadowTint: '#2b2440' });
  const cordaoMat = toonMat(pal.cordao, {
    map: cordaoTex.map,
    bumpMap: cordaoTex.bumpMap,
    bumpScale: 0.014,
    rimStrength: 0.45,
  });
  const hairMat = toonMat(pal.hair);
  const accentMat = toonMat(pal.accent, { rimStrength: 0.5 });
  const wrapMat = isOrbital
    ? abadaCuffMat
    : isXray
      ? skinMat
      : toonMat('#f2ede2', { shadowTint: '#59425c' });
  const eyeWhiteMat = toonMat('#f6f2ea', { shadowTint: '#cbbba6', rimStrength: 0 });
  const pembaPaintMat = new THREE.MeshBasicMaterial({ color: 0xf8f3e4 });
  const eyeDarkMat = new THREE.MeshBasicMaterial({ color: 0x110e16 });
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x2b1218 });
  const xJointMat = new THREE.MeshBasicMaterial({ color: 0xe0f8ff });
  const xBoneMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
  const glowCyanMat = new THREE.MeshBasicMaterial({ color: 0x38e5ff });
  const panamaHatMat = toonMat('#f4ead2', { shadowTint: '#9c8664', rimStrength: 0.3 });
  const hatRibbonMat = toonMat(pal.cordao, { rimStrength: 0.4 });
  const sneakerMat = toonMat('#f6f7f9', { shadowTint: '#7a8499', rimStrength: 0.35 });

  const sisalMat = toonMat('#d8b86a', { side: THREE.DoubleSide });
  const redSashMat = toonMat('#d61a3c', { rimStrength: 0.48 });
  const bladeMat = toonMat('#c8d4e3', {
    shadowTint: '#465878',
    rimColor: '#ffffff',
    rimStrength: 0.65,
  });
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xf4f9ff });
  const gripMat = toonMat('#7a4b2a', {
    map: woodTex.map,
    bumpMap: woodTex.bumpMap,
    bumpScale: 0.015,
  });

  const localMaterials: THREE.Material[] = [
    skinMat,
    abadaCuffMat,
    cordaoMat,
    hairMat,
    accentMat,
    wrapMat,
    eyeWhiteMat,
    pembaPaintMat,
    eyeDarkMat,
    mouthMat,
    xJointMat,
    xBoneMat,
    glowCyanMat,
    panamaHatMat,
    hatRibbonMat,
    sneakerMat,
    sisalMat,
    redSashMat,
    bladeMat,
    edgeMat,
    gripMat,
  ];

  const root = new THREE.Group();
  const clothRoot = new THREE.Group();
  root.add(clothRoot);

  const boneGroups: THREE.Group[] = [];
  const skBones: THREE.Bone[] = [];
  const maculeleProps: THREE.Object3D[] = [];
  const defaultProps: THREE.Object3D[] = [];
  let browL: THREE.Mesh | null = null;
  let browR: THREE.Mesh | null = null;
  let mouthMesh: THREE.Mesh | null = null;

  // Rest T-pose FK so every THREE.Bone captures exact rest world inverse matrices
  const restFK = computeFK(emptyPose(), skel, [0, 0, 0], 0, 1, newFK());

  // Secondary cloth anchors inside bone spaces
  const headTailAnchorL = new THREE.Object3D();
  const headTailAnchorR = new THREE.Object3D();
  const beltTailAnchor = new THREE.Object3D();
  const headBonePos = new THREE.Vector3();
  const prevHeadPos = new THREE.Vector3();
  let hasPrevHead = false;
  const pelvisCenterPos = new THREE.Vector3();
  const prevPelvisPos = new THREE.Vector3();
  let hasPrevPelvis = false;

  const ribbonHeadL = new SpringRibbon(5, 0.06, 0.034, accentMat);
  const ribbonHeadR = new SpringRibbon(5, 0.054, 0.03, accentMat);
  const ribbonBelt = new SpringRibbon(5, 0.06, 0.034, cordaoMat);
  clothRoot.add(ribbonHeadL.group, ribbonHeadR.group, ribbonBelt.group);

  // Flexible multi-strip Verlet sisal skirt replaces rigid frustum so strips drape downward in inversions
  const grassCount = 16;
  const grassAnchors: THREE.Object3D[] = [];
  const grassStrips: SpringRibbon[] = [];
  for (let s = 0; s < grassCount; s++) {
    grassAnchors.push(new THREE.Object3D());
    const strip = new SpringRibbon(4, 0.078, 0.046, sisalMat, -0.18);
    grassStrips.push(strip);
    clothRoot.add(strip.group);
  }

  for (let b = 0; b < BONES.length; b++) {
    const id: BoneId = BONES[b];
    const sb = skel[b];
    const bg = new THREE.Group();
    bg.position.set(restFK.joints[b * 3], restFK.joints[b * 3 + 1], restFK.joints[b * 3 + 2]);

    const skBone = new THREE.Bone();
    bg.add(skBone);
    skBones.push(skBone);

    if (isXray) {
      const jointSphere = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(0.014, sb.radius * 0.42), 10, 8),
        xJointMat,
      );
      bg.add(jointSphere);
      const segVec = new THREE.Vector3(sb.seg[0], sb.seg[1], sb.seg[2]);
      const segLen = segVec.length();
      if (segLen > 0.015) {
        const boneRod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.011, 0.011, segLen, 8),
          xBoneMat,
        );
        boneRod.position.copy(segVec).multiplyScalar(0.5);
        boneRod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), segVec.clone().normalize());
        bg.add(boneRod);
      }
    }

    if (id === 'pelvis') {
      // Braided Cordão rank belt hugging pelvic waistband + hanging tail knot
      const belt = new THREE.Mesh(
        new THREE.TorusGeometry(sb.radius * 1.16, 0.021, 10, 24),
        cordaoMat,
      );
      belt.rotation.x = Math.PI / 2;
      belt.scale.set(1.04, 0.84, 1.0);
      belt.position.y = 0.068;
      belt.castShadow = true;
      addOutline(belt, 1.07);
      bg.add(belt);
      defaultProps.push(belt);

      beltTailAnchor.position.set(sb.radius * 1.18, 0.064, 0.02);
      bg.add(beltTailAnchor);

      // Maculelê crimson sash + radial anchors for 12 flexible Verlet sisal grass strips
      const sash = new THREE.Mesh(
        new THREE.TorusGeometry(sb.radius * 1.2, 0.03, 10, 24),
        redSashMat,
      );
      sash.rotation.x = Math.PI / 2;
      sash.scale.set(1.04, 0.84, 1.0);
      sash.position.y = 0.068;
      addOutline(sash, 1.055);
      bg.add(sash);
      maculeleProps.push(sash);

      for (let f = 0; f < grassCount; f++) {
        const ang = (f / grassCount) * Math.PI * 2;
        const anc = grassAnchors[f];
        anc.position.set(Math.sin(ang) * sb.radius * 1.24, 0.055, Math.cos(ang) * sb.radius * 1.02);
        bg.add(anc);
      }
    } else if (id === 'chest') {
      // Subtle character-specific chest detail for instant silhouette personality
      if (def.id === 'jacare') {
        const cordBadge = new THREE.Mesh(
          new THREE.TorusGeometry(sb.radius * 0.94, 0.014, 6, 18),
          accentMat,
        );
        cordBadge.rotation.set(0.75, 0.35, 0.45);
        cordBadge.position.set(0, 0.08, 0.01);
        bg.add(cordBadge);
        defaultProps.push(cordBadge);
      }

      // Maculelê body-paint diagonal bands hugging pectoral-sternum contour
      for (const tilt of [0.52, -0.52]) {
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(sb.radius * 1.15, 0.026, sb.radius * 0.94),
          redSashMat,
        );
        stripe.position.set(0, 0.08, 0.018);
        stripe.rotation.z = tilt;
        bg.add(stripe);
        maculeleProps.push(stripe);
      }

      if (costume === 'mestre') {
        // Silk neck scarf draped casually across upper chest under open Angola vest
        const scarfRing = new THREE.Mesh(
          new THREE.TorusGeometry(sb.radius * 0.72, 0.028, 10, 20),
          hatRibbonMat,
        );
        scarfRing.rotation.x = Math.PI * 0.56;
        scarfRing.position.set(0, sb.seg[1] * 0.96, 0.018);
        addOutline(scarfRing, 1.06);
        bg.add(scarfRing);

        const scarfTail = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.02, 0.12, 4, 8),
          hatRibbonMat,
        );
        scarfTail.position.set(0.04, sb.seg[1] * 0.74, sb.radius * 0.85);
        scarfTail.rotation.z = -0.18;
        addOutline(scarfTail, 1.055);
        bg.add(scarfTail);
      } else if (costume === 'orbital') {
        // Compact EVA suit neck locking collar + sculpted twin-cylinder dorsal thruster pack
        const collar = new THREE.Mesh(
          new THREE.TorusGeometry(sb.radius * 0.76, 0.03, 10, 20),
          glowCyanMat,
        );
        collar.rotation.x = Math.PI * 0.5;
        collar.position.set(0, sb.seg[1] * 0.98, 0.01);
        bg.add(collar);

        const packGroup = new THREE.Group();
        packGroup.position.set(0, 0.14, -sb.radius * 0.96);
        const coreHousing = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.068, 0.14, 6, 10),
          abadaCuffMat,
        );
        coreHousing.scale.set(1.45, 1.0, 0.72);
        coreHousing.castShadow = true;
        addOutline(coreHousing, 1.05);
        packGroup.add(coreHousing);

        for (const side of [-1, 1]) {
          const tank = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.036, 0.16, 6, 10),
            abadaCuffMat,
          );
          tank.position.set(side * 0.068, -0.01, -0.012);
          tank.castShadow = true;
          addOutline(tank, 1.05);
          packGroup.add(tank);

          const nozzle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.03, 0.038, 10),
            glowCyanMat,
          );
          nozzle.position.set(side * 0.068, -0.13, -0.012);
          packGroup.add(nozzle);
        }
        bg.add(packGroup);
      }
    } else if (id === 'head') {
      // Sculpted heroic cranium+jaw hull + nose bridge + almond eyes + curved brows & mouth
      const cranium = new THREE.Mesh(buildSculptedHeadGeo(sb.radius), skinMat);
      cranium.position.set(0, 0.125, 0);
      cranium.castShadow = true;
      addOutline(cranium, 1.058);
      bg.add(cranium);

      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.042, 6), skinMat);
      nose.rotation.x = 0.24;
      nose.position.set(0, 0.106, sb.radius * 1.015);
      bg.add(nose);

      for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), eyeWhiteMat);
        eye.scale.set(1.16, 0.52, 0.42);
        eye.position.set(side * 0.036, 0.130, sb.radius * 0.94);
        eye.rotation.y = side * 0.24;
        bg.add(eye);

        const pupil = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.006, 10), eyeDarkMat);
        pupil.rotation.x = Math.PI / 2;
        pupil.position.set(side * 0.035, 0.130, sb.radius * 0.975);
        pupil.rotation.y = side * 0.24;
        bg.add(pupil);

        const browGeo = new THREE.CapsuleGeometry(0.0065, 0.032, 4, 8);
        browGeo.rotateZ(Math.PI / 2);
        const brow = new THREE.Mesh(browGeo, hairMat);
        brow.position.set(side * 0.036, 0.148, sb.radius * 0.975);
        brow.rotation.set(0, side * 0.2, side * -0.22);
        bg.add(brow);
        if (side < 0) browL = brow;
        else browR = brow;
      }

      const mouthGeo = new THREE.CapsuleGeometry(0.0052, 0.032, 4, 8);
      mouthGeo.rotateZ(Math.PI / 2);
      mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
      mouthMesh.position.set(0, 0.072, sb.radius * 0.985);
      bg.add(mouthMesh);

      if (isKilombo) {
        // Sacred pemba white forehead paint chevron
        const faceMark = new THREE.Mesh(new THREE.CapsuleGeometry(0.006, 0.075, 4, 8), pembaPaintMat);
        faceMark.rotation.z = Math.PI / 2;
        faceMark.position.set(0, 0.16, sb.radius * 0.98);
        bg.add(faceMark);
      }

      if (costume === 'mestre') {
        // Woven Panama *chapéu* hat with dark ribbon band (replaces baseball cap / mohawk)
        const brim = new THREE.Mesh(
          new THREE.CylinderGeometry(sb.radius * 1.95, sb.radius * 2.02, 0.014, 24),
          panamaHatMat,
        );
        brim.position.set(0, 0.205, 0.01);
        brim.rotation.x = -0.06;
        addOutline(brim, 1.05);
        bg.add(brim);

        const crown = new THREE.Mesh(
          new THREE.CylinderGeometry(sb.radius * 1.02, sb.radius * 1.12, 0.105, 20),
          panamaHatMat,
        );
        crown.position.set(0, 0.258, 0.005);
        crown.rotation.x = -0.06;
        addOutline(crown, 1.05);
        bg.add(crown);

        const band = new THREE.Mesh(
          new THREE.CylinderGeometry(sb.radius * 1.13, sb.radius * 1.14, 0.024, 20),
          hatRibbonMat,
        );
        band.position.set(0, 0.218, 0.008);
        band.rotation.x = -0.06;
        bg.add(band);
      }

      if (!isOrbital) {
        const headband = new THREE.Mesh(
          new THREE.TorusGeometry(sb.radius * 0.99, 0.022, 10, 22),
          accentMat,
        );
        headband.rotation.x = Math.PI / 2;
        headband.scale.set(0.95, 1.05, 1.0);
        headband.position.set(0, 0.168, 0);
        addOutline(headband, 1.06);
        bg.add(headband);

        headTailAnchorL.position.set(0.025, 0.165, -sb.radius * 1.05);
        headTailAnchorR.position.set(-0.025, 0.165, -sb.radius * 1.05);
        bg.add(headTailAnchorL, headTailAnchorR);
      }

      if (isOrbital) {
        // Full pressurized orbital EVA bubble helmet + sleek front polycarbonate visor
        const helmetShell = new THREE.Mesh(
          new THREE.SphereGeometry(sb.radius * 1.42, 18, 14),
          abadaCuffMat,
        );
        helmetShell.position.set(0, 0.132, -0.004);
        addOutline(helmetShell, 1.045);
        bg.add(helmetShell);

        const visorMat = new THREE.MeshBasicMaterial({
          color: 0x0ea5e9,
          transparent: true,
          opacity: 0.78,
        });
        localMaterials.push(visorMat);
        const evaVisor = new THREE.Mesh(
          new THREE.SphereGeometry(sb.radius * 1.32, 16, 12, -Math.PI * 0.36, Math.PI * 0.72, Math.PI * 0.25, Math.PI * 0.44),
          visorMat,
        );
        evaVisor.rotation.y = Math.PI * 0.5;
        evaVisor.position.set(0, 0.132, 0.024);
        bg.add(evaVisor);
      } else if (def.hair === 'mohawk' && costume !== 'mestre') {
        for (let m = 0; m < 4; m++) {
          const spike = new THREE.Mesh(
            new THREE.ConeGeometry(0.035, 0.11 - m * 0.012, 6),
            hairMat,
          );
          spike.position.set(0, 0.255 - m * 0.018, 0.05 - m * 0.055);
          spike.rotation.x = -0.35 - m * 0.22;
          addOutline(spike, 1.08);
          bg.add(spike);
        }
      } else if (def.hair === 'cap' && costume !== 'mestre') {
        const cap = new THREE.Mesh(
          new THREE.SphereGeometry(sb.radius * 1.12, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
          accentMat,
        );
        cap.position.set(0, 0.14, 0);
        addOutline(cap, 1.055);
        bg.add(cap);
        const brim = new THREE.Mesh(
          new THREE.CylinderGeometry(sb.radius * 1.1, sb.radius * 1.18, 0.016, 14, 1, false, -Math.PI * 0.42, Math.PI * 0.84),
          accentMat,
        );
        brim.scale.set(0.92, 1.0, 1.35);
        brim.position.set(0, 0.168, 0.045);
        addOutline(brim, 1.05);
        bg.add(brim);
      } else if (def.hair === 'bun') {
        const bun = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), hairMat);
        bun.position.set(0, 0.24, -0.075);
        addOutline(bun, 1.07);
        bg.add(bun);
      } else if (def.hair === 'dreads') {
        for (let d = -2; d <= 2; d++) {
          const dr = new THREE.Mesh(new THREE.CapsuleGeometry(0.017, 0.17, 4, 8), hairMat);
          dr.position.set(d * 0.036, 0.095, -0.095);
          dr.rotation.set(0.36, 0, d * 0.06);
          addOutline(dr, 1.055);
          bg.add(dr);
        }
      } else if (def.hair === 'short') {
        const crop = new THREE.Mesh(
          new THREE.SphereGeometry(sb.radius * 1.07, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
          hairMat,
        );
        crop.position.set(0, 0.135, -0.01);
        addOutline(crop, 1.06);
        bg.add(crop);
      } else if (def.hair === 'braids') {
        const crown = new THREE.Mesh(
          new THREE.SphereGeometry(sb.radius * 1.06, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
          hairMat,
        );
        crown.position.set(0, 0.138, 0);
        bg.add(crown);
        for (const side of [-1, 1]) {
          const braid = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.18, 4, 8), hairMat);
          braid.position.set(side * 0.085, 0.06, -0.065);
          braid.rotation.set(0.28, 0, side * 0.18);
          addOutline(braid, 1.06);
          bg.add(braid);
        }
      } else if (def.hair === 'helmet') {
        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(sb.radius * 1.18, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
          accentMat,
        );
        dome.position.set(0, 0.145, 0);
        addOutline(dome, 1.05);
        bg.add(dome);
        const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        localMaterials.push(visorMat);
        const visor = new THREE.Mesh(
          new THREE.CylinderGeometry(sb.radius * 1.19, sb.radius * 1.19, 0.056, 16, 1, false, -Math.PI * 0.36, Math.PI * 0.72),
          visorMat,
        );
        visor.position.set(0, 0.134, 0.018);
        bg.add(visor);
      }
    } else if (id === 'handL' || id === 'handR') {
      const hand = makeFightingHand(skinMat, wrapMat, sb.radius, id === 'handL');
      bg.add(hand);

      const machete = makeMacheteMesh(bladeMat, edgeMat, gripMat);
      machete.position.set(0, -0.04, 0);
      bg.add(machete);
      maculeleProps.push(machete);
    } else if (id === 'foreArmL' || id === 'foreArmR') {
      if (costume === 'rua' || def.id === 'touro' || def.id === 'morcego') {
        const cuffMat = costume === 'rua' ? accentMat : wrapMat;
        const sweatband = new THREE.Mesh(
          new THREE.CylinderGeometry(sb.radius * 1.14, sb.radius * 1.14, def.id === 'touro' ? 0.085 : 0.055, 14),
          cuffMat,
        );
        sweatband.position.set(0, -sb.seg[1] * 0.25, 0);
        addOutline(sweatband, 1.05);
        bg.add(sweatband);
      } else if (isKilombo) {
        const beadRing = new THREE.Mesh(
          new THREE.TorusGeometry(sb.radius * 1.18, 0.015, 8, 16),
          accentMat,
        );
        beadRing.rotation.x = Math.PI / 2;
        beadRing.position.set(0, -sb.seg[1] * 0.22, 0);
        bg.add(beadRing);
      }
    } else if (id === 'shinL' || id === 'shinR') {
      // Rolled abadá hem cuff aligned cleanly around lower shin emergence
      const cuff = new THREE.Mesh(
        new THREE.TorusGeometry(sb.radius * 1.38, 0.024, 8, 18),
        abadaCuffMat,
      );
      cuff.rotation.x = Math.PI / 2;
      cuff.position.set(0, sb.seg[1] * 0.84, 0);
      addOutline(cuff, 1.06);
      bg.add(cuff);
      if (isKilombo) {
        const anklet = new THREE.Mesh(
          new THREE.TorusGeometry(sb.radius * 1.16, 0.016, 8, 16),
          accentMat,
        );
        anklet.rotation.x = Math.PI / 2;
        anklet.position.set(0, sb.seg[1] * 0.94, 0);
        bg.add(anklet);
      }
    } else if (id === 'footL' || id === 'footR') {
      if (costume === 'rua') {
        // Sculpted athletic trainer sneaker upper + vulcanized midsole & rounded toe cap
        const upper = new THREE.Mesh(
          new THREE.CapsuleGeometry(sb.radius * 0.98, 0.115, 6, 12),
          cordaoMat,
        );
        upper.scale.set(1.06, 1.0, 0.78);
        upper.rotation.x = Math.PI / 2;
        upper.position.set(0, -0.02, 0.048);
        upper.castShadow = true;
        addOutline(upper, 1.06);
        bg.add(upper);

        const sole = new THREE.Mesh(
          new THREE.CapsuleGeometry(sb.radius * 1.04, 0.12, 6, 12),
          sneakerMat,
        );
        sole.scale.set(1.08, 1.0, 0.42);
        sole.rotation.x = Math.PI / 2;
        sole.position.set(0, -0.048, 0.05);
        addOutline(sole, 1.045);
        bg.add(sole);
      } else if (costume === 'orbital') {
        // Sculpted EVA pressure boot shell + glowing cyan magnetic outsole cushion
        const boot = new THREE.Mesh(
          new THREE.CapsuleGeometry(sb.radius * 1.08, 0.12, 6, 12),
          abadaCuffMat,
        );
        boot.scale.set(1.1, 1.0, 0.82);
        boot.rotation.x = Math.PI / 2;
        boot.position.set(0, -0.022, 0.052);
        boot.castShadow = true;
        addOutline(boot, 1.055);
        bg.add(boot);

        const magSole = new THREE.Mesh(
          new THREE.CapsuleGeometry(sb.radius * 1.12, 0.125, 6, 12),
          glowCyanMat,
        );
        magSole.scale.set(1.12, 1.0, 0.36);
        magSole.rotation.x = Math.PI / 2;
        magSole.position.set(0, -0.056, 0.052);
        bg.add(magSole);
      } else {
        bg.add(makeBareFootArch(skinMat, sb.radius));
      }
    } else if (id === 'toeL' || id === 'toeR') {
      if (costume !== 'rua' && costume !== 'orbital') {
        bg.add(makeArticulatedToes(skinMat, sb.radius, id === 'toeL'));
      }
    }

    boneGroups.push(bg);
    root.add(bg);
  }

  // Bind seamless continuous 4-bone skinned torso, arms, and draped trousers to skBones!
  const skinned = buildSkinnedFighterMeshes(
    root,
    skBones,
    skel,
    restFK,
    pal,
    def.body,
    costume,
  );

  function setCostume(c: CostumeId): void {
    const isMac = c === 'maculele';
    for (const p of maculeleProps) p.visible = isMac;
    for (const s of grassStrips) s.group.visible = isMac;
    for (const p of defaultProps) p.visible = !isMac && c !== 'orbital' && c !== 'xray';
    ribbonBelt.group.visible = !isMac && c !== 'orbital' && c !== 'xray';
    if (c === 'xray' || c === 'orbital') {
      ribbonHeadL.group.visible = false;
      ribbonHeadR.group.visible = false;
    }
    if (skinned.shirtMesh) {
      const showShirt = c === 'default' || c === 'mestre' || c === 'rua';
      skinned.shirtMesh.visible = showShirt;
      if (skinned.shirtOutline) skinned.shirtOutline.visible = showShirt;
    }
  }
  setCostume(costume);

  if (isXray) {
    root.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh &&
        obj.material instanceof THREE.MeshBasicMaterial &&
        obj.material.side === THREE.BackSide
      ) {
        obj.visible = false;
      }
    });
  }

  let currentMood: ExpressionMood = 'calm';
  function setExpression(mood: ExpressionMood): void {
    if (mood === currentMood || isOrbital) return;
    currentMood = mood;
    if (!browL || !browR || !mouthMesh) return;
    if (mood === 'fierce') {
      browL.rotation.z = 0.44;
      browR.rotation.z = -0.44;
      browL.position.y = 0.144;
      browR.position.y = 0.144;
      mouthMesh.scale.set(1.3, 2.2, 1);
      mouthMesh.position.y = 0.068;
    } else if (mood === 'hit') {
      browL.rotation.z = -0.26;
      browR.rotation.z = 0.26;
      browL.position.y = 0.156;
      browR.position.y = 0.156;
      mouthMesh.scale.set(1.5, 1.7, 1);
      mouthMesh.position.y = 0.068;
    } else {
      browL.rotation.z = 0.22;
      browR.rotation.z = -0.22;
      browL.position.y = 0.148;
      browR.position.y = 0.148;
      mouthMesh.scale.set(1, 0.85, 1);
      mouthMesh.position.y = 0.072;
    }
  }

  const tmpAnchor = new THREE.Vector3();
  const tmpWind = new THREE.Vector3();
  const tmpRadial = new THREE.Vector3();

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

    const headBg = boneGroups[BONE_INDEX.head];
    const backDir = new THREE.Vector3(0, 0, -1).applyQuaternion(headBg.quaternion);

    tmpWind.set(
      backDir.x * 0.22 + THREE.MathUtils.clamp(vx * 0.24, -2.5, 2.5),
      -0.68 + THREE.MathUtils.clamp(vy * 0.16, -1.8, 1.8),
      backDir.z * 0.22 + THREE.MathUtils.clamp(vz * 0.24, -2.5, 2.5),
    );
    ribbonHeadL.update(headBonePos, tmpWind, 9.81 * gravityScale, dt);

    headTailAnchorR.getWorldPosition(tmpAnchor);
    tmpWind.x += 0.06;
    ribbonHeadR.update(tmpAnchor, tmpWind, 9.81 * gravityScale, dt);

    if (ribbonBelt.group.visible) {
      beltTailAnchor.getWorldPosition(tmpAnchor);
      tmpWind.set(backDir.x * 0.12 + vx * 0.16, -0.88 + vy * 0.12, backDir.z * 0.12 + vz * 0.16);
      ribbonBelt.update(tmpAnchor, tmpWind, 9.81 * gravityScale, dt);
    }

    if (grassStrips[0]?.group.visible) {
      const pelvisBg = boneGroups[BONE_INDEX.pelvis];
      pelvisBg.getWorldPosition(pelvisCenterPos);
      if (!hasPrevPelvis) {
        prevPelvisPos.copy(pelvisCenterPos);
        hasPrevPelvis = true;
      }
      const pvx = (prevPelvisPos.x - pelvisCenterPos.x) / Math.max(0.004, dt);
      const pvy = (prevPelvisPos.y - pelvisCenterPos.y) / Math.max(0.004, dt);
      const pvz = (prevPelvisPos.z - pelvisCenterPos.z) / Math.max(0.004, dt);
      prevPelvisPos.copy(pelvisCenterPos);

      for (let f = 0; f < grassCount; f++) {
        grassAnchors[f].getWorldPosition(tmpAnchor);
        tmpRadial.subVectors(tmpAnchor, pelvisCenterPos);
        tmpRadial.y *= 0.2;
        if (tmpRadial.lengthSq() > 1e-5) tmpRadial.normalize();
        tmpWind.set(
          tmpRadial.x * 1.15 + THREE.MathUtils.clamp(pvx * 0.22, -2.8, 2.8),
          -0.95 + THREE.MathUtils.clamp(pvy * 0.18, -1.8, 1.8),
          tmpRadial.z * 1.15 + THREE.MathUtils.clamp(pvz * 0.22, -2.8, 2.8),
        );
        grassStrips[f].update(tmpAnchor, tmpWind, 9.81 * gravityScale, dt, tmpRadial);
      }
    }
  }

  return {
    root,
    bones: boneGroups,
    setCostume,
    setExpression,
    updateSecondary,
    dispose() {
      ribbonHeadL.dispose();
      ribbonHeadR.dispose();
      ribbonBelt.dispose();
      for (const s of grassStrips) s.dispose();
      for (const g of skinned.disposables.geometries) g.dispose();
      for (const m of skinned.disposables.materials) m.dispose();
      for (const m of localMaterials) m.dispose();
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh && !(obj instanceof THREE.SkinnedMesh)) {
          obj.geometry.dispose();
        }
      });
    },
  };
}

const tmpMat = new THREE.Matrix4();

/** Sync a MannequinRig's world transforms (including GPU Skeleton bones) directly from FK. */
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
