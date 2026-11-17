// Continuous 4-bone-weighted parametric SkinnedMesh generator for expressive Capoeira fighters.
// Builds seamless anatomical torso/neck/arms, bare ankles, and draped cotton abadá trousers
// in rest T-pose coordinates directly matching computeFK(emptyPose(), skel).
import * as THREE from 'three';
import type { FK } from '../anim/pose';
import type { CostumeId, Palette } from '../data/characters';
import { BONE_INDEX, type BodyScale, type BoneId, type ScaledBone } from '../data/skeleton';
import {
  getAbadaTextureSet,
  getKilomboPaintTextureSet,
  getOrbitalSuitTextureSet,
  getSkinTextureSet,
  getStreetJerseyTextureSet,
} from './textures';
import { addSkinnedOutline, toonMat } from './toon';

export interface SkinnedCharacterParts {
  skinMesh: THREE.SkinnedMesh;
  abadaMesh: THREE.SkinnedMesh;
  shirtMesh: THREE.SkinnedMesh | null;
  shirtOutline: THREE.SkinnedMesh | null;
  outlineMeshes: THREE.SkinnedMesh[];
  skeleton: THREE.Skeleton;
  disposables: { geometries: THREE.BufferGeometry[]; materials: THREE.Material[] };
}

interface RingSpec {
  center: THREE.Vector3;
  rx: number;
  rz: number;
  weights: [number, number][]; // [boneIdx, weight] pairs, max 4
  outlineWeight?: number; // 0 hides buried socket/cap rings so inverted outlines never punch through seams
}

class LoftBuilder {
  private pos: number[] = [];
  private uv: number[] = [];
  private skinIdx: number[] = [];
  private skinWt: number[] = [];
  private outlineWts: number[] = [];
  private idx: number[] = [];
  private seamPairs: [number, number][] = [];

  private pushVertex(
    p: THREE.Vector3,
    u: number,
    v: number,
    weights: [number, number][],
    outlineWeight = 1,
  ): number {
    const vi = this.pos.length / 3;
    this.pos.push(p.x, p.y, p.z);
    this.uv.push(u, v);
    this.outlineWts.push(outlineWeight);

    // Pack top 4 weights sorted & normalized
    const sorted = [...weights].sort((a, b) => b[1] - a[1]).slice(0, 4);
    let sum = 0;
    for (const w of sorted) sum += w[1];
    const inv = sum > 1e-6 ? 1 / sum : 1;

    for (let k = 0; k < 4; k++) {
      if (k < sorted.length && sorted[k][1] > 1e-5) {
        this.skinIdx.push(sorted[k][0]);
        this.skinWt.push(sorted[k][1] * inv);
      } else {
        this.skinIdx.push(0);
        this.skinWt.push(0);
      }
    }
    return vi;
  }

  /** Subdivide control rings with Catmull-Rom curve smoothing so lofted cel surfaces have zero hard kinks. */
  private upsampleRings(rings: RingSpec[], factor: number): RingSpec[] {
    if (factor <= 1 || rings.length < 3) return rings;
    const out: RingSpec[] = [];
    const n = rings.length;
    const catmull = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
      const t2 = t * t;
      const t3 = t2 * t;
      return (
        0.5 *
        (2 * p1 +
          (-p0 + p2) * t +
          (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
          (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
      );
    };
    const blendWeights = (w0: [number, number][], w1: [number, number][], t: number): [number, number][] => {
      const map = new Map<number, number>();
      for (const [b, w] of w0) map.set(b, (map.get(b) ?? 0) + w * (1 - t));
      for (const [b, w] of w1) map.set(b, (map.get(b) ?? 0) + w * t);
      return [...map.entries()];
    };

    for (let i = 0; i < n - 1; i++) {
      const r0 = rings[Math.max(0, i - 1)];
      const r1 = rings[i];
      const r2 = rings[i + 1];
      const r3 = rings[Math.min(n - 1, i + 2)];
      out.push(r1);
      for (let s = 1; s < factor; s++) {
        const t = s / factor;
        const ow1 = r1.outlineWeight ?? 1;
        const ow2 = r2.outlineWeight ?? 1;
        out.push({
          center: new THREE.Vector3(
            catmull(r0.center.x, r1.center.x, r2.center.x, r3.center.x, t),
            catmull(r0.center.y, r1.center.y, r2.center.y, r3.center.y, t),
            catmull(r0.center.z, r1.center.z, r2.center.z, r3.center.z, t),
          ),
          rx: Math.max(0.012, catmull(r0.rx, r1.rx, r2.rx, r3.rx, t)),
          rz: Math.max(0.012, catmull(r0.rz, r1.rz, r2.rz, r3.rz, t)),
          weights: blendWeights(r1.weights, r2.weights, t),
          outlineWeight: ow1 + (ow2 - ow1) * t,
        });
      }
    }
    out.push(rings[n - 1]);
    return out;
  }

  /** Add a continuous closed tube loft along a chain of RingSpecs (with optional bottom & top caps). */
  addLoft(rawRings: RingSpec[], segs = 24, capBottom = false, capTop = false, vScale = 1, smoothFactor = 2): void {
    if (rawRings.length < 2) return;
    const rings = this.upsampleRings(rawRings, smoothFactor);
    const grid: number[][] = [];
    const N = new THREE.Vector3(1, 0, 0);
    const B = new THREE.Vector3(0, 0, -1);
    const T = new THREE.Vector3();
    const tmp = new THREE.Vector3();

    // Seed initial tangent
    T.subVectors(rings[1].center, rings[0].center).normalize();
    if (Math.abs(T.x) < 0.85) {
      N.set(1, 0, 0).crossVectors(T, new THREE.Vector3(0, 0, 1));
      if (N.lengthSq() < 1e-4) N.set(1, 0, 0);
      N.normalize();
    } else {
      N.set(0, 1, 0).crossVectors(T, new THREE.Vector3(0, 0, 1)).normalize();
    }
    B.crossVectors(T, N).normalize();
    N.crossVectors(B, T).normalize(); // Enforce right-handed (N x B = T)

    for (let r = 0; r < rings.length; r++) {
      const ring = rings[r];
      const next = rings[Math.min(rings.length - 1, r + 1)].center;
      const prev = rings[Math.max(0, r - 1)].center;
      const newT = tmp.subVectors(next, prev);
      if (newT.lengthSq() > 1e-6) {
        newT.normalize();
        // Parallel transport N onto plane orthogonal to newT
        N.addScaledVector(newT, -N.dot(newT));
        if (N.lengthSq() < 1e-5) {
          N.set(Math.abs(newT.y) < 0.85 ? 0 : 1, Math.abs(newT.y) < 0.85 ? 1 : 0, 0);
          N.addScaledVector(newT, -N.dot(newT));
        }
        N.normalize();
        B.crossVectors(newT, N).normalize();
        N.crossVectors(B, newT).normalize();
      }

      const vCoord = (r / (rings.length - 1)) * vScale;
      const row: number[] = [];
      const rowOw = ring.outlineWeight ?? 1;
      for (let s = 0; s <= segs; s++) {
        const theta = (s / segs) * Math.PI * 2;
        const c = Math.cos(theta);
        const sn = Math.sin(theta);
        const p = ring.center
          .clone()
          .addScaledVector(N, c * ring.rx)
          .addScaledVector(B, sn * ring.rz);
        row.push(this.pushVertex(p, s / segs, vCoord, ring.weights, rowOw));
      }
      this.seamPairs.push([row[0], row[segs]]);
      grid.push(row);
    }

    for (let r = 0; r < rings.length - 1; r++) {
      const r0 = grid[r];
      const r1 = grid[r + 1];
      for (let s = 0; s < segs; s++) {
        const a = r0[s];
        const b = r0[s + 1];
        const c = r1[s + 1];
        const d = r1[s];
        this.idx.push(a, b, c, a, c, d);
      }
    }

    if (capBottom) {
      const r0 = rings[0];
      const centerIdx = this.pushVertex(r0.center, 0.5, 0, r0.weights, 0);
      for (let s = 0; s < segs; s++) {
        this.idx.push(centerIdx, grid[0][s + 1], grid[0][s]);
      }
    }

    if (capTop) {
      const last = rings[rings.length - 1];
      const row = grid[grid.length - 1];
      const centerIdx = this.pushVertex(last.center, 0.5, vScale, last.weights, 0);
      for (let s = 0; s < segs; s++) {
        this.idx.push(centerIdx, row[s], row[s + 1]);
      }
    }
  }

  build(): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.skinIdx, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.skinWt, 4));
    geo.setAttribute('aOutlineWeight', new THREE.Float32BufferAttribute(this.outlineWts, 1));
    geo.setIndex(this.idx);
    geo.computeVertexNormals();

    // Weld normals across UV wrap seam (s=0 & s=segs) for seamless silhouette & cel shading
    const normAttr = geo.getAttribute('normal') as THREE.BufferAttribute;
    for (const [a, b] of this.seamPairs) {
      const nx = normAttr.getX(a) + normAttr.getX(b);
      const ny = normAttr.getY(a) + normAttr.getY(b);
      const nz = normAttr.getZ(a) + normAttr.getZ(b);
      const len = Math.hypot(nx, ny, nz) || 1;
      normAttr.setXYZ(a, nx / len, ny / len, nz / len);
      normAttr.setXYZ(b, nx / len, ny / len, nz / len);
    }
    normAttr.needsUpdate = true;
    return geo;
  }
}

function fkJoint(fk: FK, b: BoneId): THREE.Vector3 {
  const i = BONE_INDEX[b] * 3;
  return new THREE.Vector3(fk.joints[i], fk.joints[i + 1], fk.joints[i + 2]);
}

function fkTip(fk: FK, b: BoneId): THREE.Vector3 {
  const i = BONE_INDEX[b] * 3;
  return new THREE.Vector3(fk.tips[i], fk.tips[i + 1], fk.tips[i + 2]);
}

function buildTorsoRings(
  restFK: FK,
  skel: ScaledBone[],
  bodyScale: BodyScale,
  radOffset = 0,
  startFraction = 0,
  endFraction = 1,
): RingSpec[] {
  const iPelvis = BONE_INDEX.pelvis;
  const iSpine = BONE_INDEX.spine;
  const iChest = BONE_INDEX.chest;
  const iNeck = BONE_INDEX.neck;
  const iHead = BONE_INDEX.head;

  const pPelvis = fkJoint(restFK, 'pelvis');
  const pSpine = fkJoint(restFK, 'spine');
  const pChest = fkJoint(restFK, 'chest');
  const pNeck = fkJoint(restFK, 'neck');
  const pHead = fkJoint(restFK, 'head');

  const hScale = bodyScale.height * bodyScale.torso;
  const g = bodyScale.height * bodyScale.girth;
  const y0 = pPelvis.y - 0.06 * hScale;
  const yTop = pHead.y + 0.03 * bodyScale.height;
  const span = yTop - y0;

  // Sculpted athletic V-taper + shoulder trapezius + neck cylinder
  const stations: {
    t: number;
    y: number;
    zBias: number;
    rx: number;
    rz: number;
    w: [number, number][];
    ow?: number;
  }[] = [
    { t: 0.0, y: pPelvis.y - 0.055 * hScale, zBias: 0, rx: skel[iPelvis].radius * 0.92, rz: skel[iPelvis].radius * 0.72, w: [[iPelvis, 1]], ow: 0 },
    { t: 0.14, y: pPelvis.y + 0.04 * hScale, zBias: 0.005 * g, rx: skel[iPelvis].radius * 1.12, rz: skel[iPelvis].radius * 0.84, w: [[iPelvis, 0.85], [iSpine, 0.15]], ow: 0.55 },
    { t: 0.28, y: pSpine.y + 0.06 * hScale, zBias: 0.008 * g, rx: skel[iSpine].radius * 1.04, rz: skel[iSpine].radius * 0.82, w: [[iPelvis, 0.35], [iSpine, 0.65]], ow: 1 },
    { t: 0.42, y: pSpine.y + 0.15 * hScale, zBias: 0.012 * g, rx: skel[iSpine].radius * 1.12, rz: skel[iSpine].radius * 0.88, w: [[iSpine, 0.72], [iChest, 0.28]], ow: 1 },
    { t: 0.56, y: pChest.y + 0.04 * hScale, zBias: 0.014 * g, rx: skel[iChest].radius * 1.12, rz: skel[iChest].radius * 0.85, w: [[iSpine, 0.25], [iChest, 0.75]], ow: 1 },
    { t: 0.7, y: pChest.y + 0.14 * hScale, zBias: 0.018 * g, rx: skel[iChest].radius * 1.24, rz: skel[iChest].radius * 0.9, w: [[iChest, 0.95], [iSpine, 0.05]], ow: 1 },
    { t: 0.79, y: pNeck.y - 0.015 * hScale, zBias: 0.006 * g, rx: skel[iChest].radius * 0.92, rz: skel[iChest].radius * 0.72, w: [[iChest, 0.82], [iNeck, 0.18]], ow: 0.75 },
    { t: 0.86, y: pNeck.y + 0.02 * hScale, zBias: 0, rx: skel[iNeck].radius * 1.04, rz: skel[iNeck].radius * 1.02, w: [[iChest, 0.35], [iNeck, 0.65]], ow: 0.95 },
    { t: 0.93, y: pHead.y - 0.01 * bodyScale.height, zBias: 0.004 * g, rx: skel[iNeck].radius * 0.95, rz: skel[iNeck].radius * 0.95, w: [[iNeck, 0.75], [iHead, 0.25]], ow: 0.55 },
    { t: 1.0, y: pHead.y + 0.03 * bodyScale.height, zBias: 0.008 * g, rx: skel[iNeck].radius * 0.9, rz: skel[iNeck].radius * 0.9, w: [[iNeck, 0.25], [iHead, 0.75]], ow: 0 },
  ];

  const out: RingSpec[] = [];
  for (const st of stations) {
    const frac = (st.y - y0) / Math.max(0.01, span);
    if (frac < startFraction - 0.05 || frac > endFraction + 0.05) continue;
    out.push({
      center: new THREE.Vector3(pPelvis.x, st.y, pPelvis.z + st.zBias),
      rx: Math.max(0.02, st.rx + radOffset),
      rz: Math.max(0.02, st.rz + radOffset),
      weights: st.w,
      outlineWeight: st.ow ?? 1,
    });
  }
  return out;
}

function addArmToLoft(
  builder: LoftBuilder,
  restFK: FK,
  skel: ScaledBone[],
  side: 'L' | 'R',
): void {
  const bClav: BoneId = side === 'L' ? 'clavicleL' : 'clavicleR';
  const bUpper: BoneId = side === 'L' ? 'upperArmL' : 'upperArmR';
  const bFore: BoneId = side === 'L' ? 'foreArmL' : 'foreArmR';
  const bHand: BoneId = side === 'L' ? 'handL' : 'handR';

  const iChest = BONE_INDEX.chest;
  const iClav = BONE_INDEX[bClav];
  const iUpper = BONE_INDEX[bUpper];
  const iFore = BONE_INDEX[bFore];
  const iHand = BONE_INDEX[bHand];

  const pShoulder = fkJoint(restFK, bUpper);
  const pElbow = fkJoint(restFK, bFore);
  const pWrist = fkTip(restFK, bFore);

  const ru = skel[iUpper].radius;
  const rf = skel[iFore].radius;

  // Continuous seamless arm tube originating inside the chest/clavicle socket with sculpted deltoid crest
  const lerpVec = (a: THREE.Vector3, b: THREE.Vector3, t: number) =>
    new THREE.Vector3().lerpVectors(a, b, t);

  const armRings: RingSpec[] = [
    // Deep shoulder socket rings keep outlineWeight=0 so inverted-hull outline never punches dark dots through deltoids
    { center: lerpVec(pShoulder, pElbow, -0.15), rx: ru * 0.42, rz: ru * 0.46, weights: [[iChest, 0.72], [iClav, 0.28]], outlineWeight: 0 },
    { center: lerpVec(pShoulder, pElbow, -0.04), rx: ru * 1.06, rz: ru * 1.04, weights: [[iChest, 0.28], [iClav, 0.46], [iUpper, 0.26]], outlineWeight: 0 },
    { center: lerpVec(pShoulder, pElbow, 0.08), rx: ru * 1.24, rz: ru * 1.22, weights: [[iClav, 0.22], [iUpper, 0.78]], outlineWeight: 0.78 }, // deltoid dome
    { center: lerpVec(pShoulder, pElbow, 0.28), rx: ru * 1.1, rz: ru * 1.14, weights: [[iUpper, 0.94], [iClav, 0.06]], outlineWeight: 1 },
    { center: lerpVec(pShoulder, pElbow, 0.52), rx: ru * 1.05, rz: ru * 1.1, weights: [[iUpper, 1]], outlineWeight: 1 }, // bicep swell
    { center: lerpVec(pShoulder, pElbow, 0.8), rx: ru * 0.88, rz: ru * 0.9, weights: [[iUpper, 0.86], [iFore, 0.14]], outlineWeight: 1 },
    { center: pElbow.clone(), rx: (ru + rf) * 0.48, rz: (ru + rf) * 0.48, weights: [[iUpper, 0.5], [iFore, 0.5]], outlineWeight: 1 },
    { center: lerpVec(pElbow, pWrist, 0.22), rx: rf * 1.12, rz: rf * 1.16, weights: [[iUpper, 0.14], [iFore, 0.86]], outlineWeight: 1 }, // brachioradialis
    { center: lerpVec(pElbow, pWrist, 0.62), rx: rf * 0.92, rz: rf * 0.92, weights: [[iFore, 0.95], [iHand, 0.05]], outlineWeight: 1 },
    { center: pWrist.clone(), rx: rf * 0.78, rz: rf * 0.72, weights: [[iFore, 0.82], [iHand, 0.18]], outlineWeight: 0.3 },
  ];
  builder.addLoft(armRings, 20, true, true, 1.5, 2);
}

function addLegToLoft(
  pantsBuilder: LoftBuilder,
  skinBuilder: LoftBuilder,
  restFK: FK,
  skel: ScaledBone[],
  side: 'L' | 'R',
): void {
  const bThigh: BoneId = side === 'L' ? 'thighL' : 'thighR';
  const bShin: BoneId = side === 'L' ? 'shinL' : 'shinR';
  const bFoot: BoneId = side === 'L' ? 'footL' : 'footR';

  const iPelvis = BONE_INDEX.pelvis;
  const iThigh = BONE_INDEX[bThigh];
  const iShin = BONE_INDEX[bShin];
  const iFoot = BONE_INDEX[bFoot];

  const pHip = fkJoint(restFK, bThigh);
  const pKnee = fkJoint(restFK, bShin);
  const pAnkle = fkJoint(restFK, bFoot);

  const rt = skel[iThigh].radius;
  const rs = skel[iShin].radius;
  const lerpVec = (a: THREE.Vector3, b: THREE.Vector3, t: number) =>
    new THREE.Vector3().lerpVectors(a, b, t);

  // Draped athletic Capoeira abadá trouser leg (wider fabric drape + knee fold rings)
  const pantRings: RingSpec[] = [
    { center: lerpVec(pHip, pKnee, -0.04), rx: rt * 1.38, rz: rt * 1.42, weights: [[iPelvis, 0.45], [iThigh, 0.55]], outlineWeight: 0 },
    { center: lerpVec(pHip, pKnee, 0.25), rx: rt * 1.36, rz: rt * 1.4, weights: [[iPelvis, 0.1], [iThigh, 0.9]], outlineWeight: 0.88 },
    { center: lerpVec(pHip, pKnee, 0.65), rx: rt * 1.26, rz: rt * 1.28, weights: [[iThigh, 0.92], [iShin, 0.08]], outlineWeight: 1 },
    { center: lerpVec(pHip, pKnee, 0.88), rx: rt * 1.18, rz: rt * 1.2, weights: [[iThigh, 0.72], [iShin, 0.28]], outlineWeight: 1 },
    { center: pKnee.clone(), rx: rs * 1.32, rz: rs * 1.34, weights: [[iThigh, 0.48], [iShin, 0.52]], outlineWeight: 1 },
    { center: lerpVec(pKnee, pAnkle, 0.16), rx: rs * 1.34, rz: rs * 1.36, weights: [[iThigh, 0.2], [iShin, 0.8]], outlineWeight: 1 },
    { center: lerpVec(pKnee, pAnkle, 0.55), rx: rs * 1.44, rz: rs * 1.44, weights: [[iShin, 0.98], [iFoot, 0.02]], outlineWeight: 1 },
    { center: lerpVec(pKnee, pAnkle, 0.84), rx: rs * 1.38, rz: rs * 1.38, weights: [[iShin, 0.95], [iFoot, 0.05]], outlineWeight: 0.82 }, // wide hem cuff above ankle
  ];
  pantsBuilder.addLoft(pantRings, 24, true, true, 2, 2);

  // Solid bare ankle / lower shin emerging from abadá trouser cuff down into ankle joint
  const ankleRings: RingSpec[] = [
    { center: lerpVec(pKnee, pAnkle, 0.72), rx: rs * 0.92, rz: rs * 0.94, weights: [[iShin, 1]], outlineWeight: 0 },
    { center: pAnkle.clone(), rx: rs * 0.74, rz: rs * 0.76, weights: [[iShin, 0.7], [iFoot, 0.3]], outlineWeight: 0.85 },
    { center: lerpVec(pKnee, pAnkle, 1.05), rx: rs * 0.68, rz: rs * 0.7, weights: [[iShin, 0.35], [iFoot, 0.65]], outlineWeight: 0 },
  ];
  skinBuilder.addLoft(ankleRings, 18, false, false, 0.5, 2);
}

/**
 * Construct continuous 4-bone skinned humanoid meshes bound cleanly to `skBones`.
 * Caller must ensure `skBones` are currently positioned at `restFK.joints` with identity rotations!
 */
export function buildSkinnedFighterMeshes(
  root: THREE.Group,
  skBones: THREE.Bone[],
  skel: ScaledBone[],
  restFK: FK,
  pal: Palette,
  bodyScale: BodyScale,
  costume: CostumeId,
): SkinnedCharacterParts {
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(skBones);
  skeleton.calculateInverses();

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const outlineMeshes: THREE.SkinnedMesh[] = [];

  const skinTex = getSkinTextureSet();
  const abadaTex = getAbadaTextureSet();
  const isXray = costume === 'xray';
  const isOrbital = costume === 'orbital';
  const isKilombo = costume === 'kilombo';

  let skinMat: THREE.Material;
  let abadaMat: THREE.Material;
  if (isXray) {
    skinMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    abadaMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
  } else {
    if (isKilombo) {
      const kp = getKilomboPaintTextureSet(pal.skin, pal.accent);
      skinMat = toonMat('#ffffff', {
        map: kp.map,
        bumpMap: kp.bumpMap,
        bumpScale: 0.004,
        rimStrength: 0.38,
        subsurfaceStrength: 0.16,
      });
    } else if (isOrbital) {
      const os = getOrbitalSuitTextureSet(pal.abada, pal.accent);
      skinMat = toonMat('#ffffff', {
        map: os.map,
        bumpMap: os.bumpMap,
        bumpScale: 0.018,
        rimStrength: 0.55,
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

    if (isOrbital) {
      const os = getOrbitalSuitTextureSet(pal.abada, pal.accent);
      abadaMat = toonMat('#ffffff', {
        map: os.map,
        bumpMap: os.bumpMap,
        bumpScale: 0.018,
        rimStrength: 0.45,
      });
    } else {
      abadaMat = toonMat(pal.abada, {
        map: abadaTex.map,
        bumpMap: abadaTex.bumpMap,
        bumpScale: 0.012,
        rimStrength: 0.28,
      });
    }
  }
  materials.push(skinMat, abadaMat);

  // 1. Continuous Torso + Neck + Arms + Bare Ankles SkinnedMesh
  const skinBuilder = new LoftBuilder();
  const torsoRings = buildTorsoRings(restFK, skel, bodyScale, 0, 0, 1);
  skinBuilder.addLoft(torsoRings, 28, false, false, 1.5, 3);
  addArmToLoft(skinBuilder, restFK, skel, 'L');
  addArmToLoft(skinBuilder, restFK, skel, 'R');

  // Pelvis-hip saddle & leg trouser loft
  const pantsBuilder = new LoftBuilder();
  const pPelvis = fkJoint(restFK, 'pelvis');
  const iPelvis = BONE_INDEX.pelvis;
  const iSpine = BONE_INDEX.spine;
  const rp = skel[iPelvis].radius;
  const hScale = bodyScale.height * bodyScale.torso;
  pantsBuilder.addLoft(
    [
      { center: new THREE.Vector3(pPelvis.x, pPelvis.y - 0.08 * hScale, pPelvis.z), rx: rp * 1.24, rz: rp * 0.94, weights: [[iPelvis, 1]], outlineWeight: 0.7 },
      { center: new THREE.Vector3(pPelvis.x, pPelvis.y + 0.01 * hScale, pPelvis.z + 0.004), rx: rp * 1.28, rz: rp * 0.98, weights: [[iPelvis, 0.92], [iSpine, 0.08]], outlineWeight: 0.85 },
      { center: new THREE.Vector3(pPelvis.x, pPelvis.y + 0.085 * hScale, pPelvis.z + 0.005), rx: rp * 1.15, rz: rp * 0.88, weights: [[iPelvis, 0.72], [iSpine, 0.28]], outlineWeight: 0.2 },
    ],
    28,
    true,
    false,
    0.6,
    2,
  );
  addLegToLoft(pantsBuilder, skinBuilder, restFK, skel, 'L');
  addLegToLoft(pantsBuilder, skinBuilder, restFK, skel, 'R');

  const skinGeo = skinBuilder.build();
  const abadaGeo = pantsBuilder.build();
  geometries.push(skinGeo, abadaGeo);

  const skinMesh = new THREE.SkinnedMesh(skinGeo, skinMat);
  skinMesh.bind(skeleton);
  skinMesh.frustumCulled = false;
  skinMesh.castShadow = !isXray;
  skinMesh.receiveShadow = !isXray;
  root.add(skinMesh);
  const skinOut = addSkinnedOutline(skinMesh, root, 0.01);
  skinOut.visible = !isXray;
  outlineMeshes.push(skinOut);

  const abadaMesh = new THREE.SkinnedMesh(abadaGeo, abadaMat);
  abadaMesh.bind(skeleton);
  abadaMesh.frustumCulled = false;
  abadaMesh.castShadow = !isXray;
  abadaMesh.receiveShadow = !isXray;
  root.add(abadaMesh);
  const abadaOut = addSkinnedOutline(abadaMesh, root, 0.011);
  abadaOut.visible = !isXray;
  outlineMeshes.push(abadaOut);

  // 2. Fitted Camiseta / Angola Vest / Street Jersey according to CostumeId
  let shirtMesh: THREE.SkinnedMesh | null = null;
  let shirtOutline: THREE.SkinnedMesh | null = null;
  const wantShirt =
    costume === 'mestre' ||
    costume === 'rua' ||
    (Boolean(pal.shirt) && (costume === 'default' || costume === 'maculele'));
  if (wantShirt) {
    const shirtBuilder = new LoftBuilder();
    const tMax = costume === 'mestre' ? 0.85 : 0.77;
    const tMin = costume === 'mestre' ? 0.05 : 0.08;
    const shirtRings = buildTorsoRings(restFK, skel, bodyScale, 0.007 * bodyScale.height, tMin, tMax);
    if (shirtRings.length >= 2) {
      shirtRings[0].outlineWeight = 0.35;
      shirtRings[shirtRings.length - 1].outlineWeight = 0.25;
    }
    shirtBuilder.addLoft(shirtRings, 28, false, false, 1.2, 2);
    const shirtGeo = shirtBuilder.build();
    let shirtMat: THREE.Material;
    if (costume === 'rua') {
      const sj = getStreetJerseyTextureSet(pal.shirt ?? pal.accent, pal.cordao);
      shirtMat = toonMat('#ffffff', {
        map: sj.map,
        bumpMap: sj.bumpMap,
        bumpScale: 0.012,
        rimStrength: 0.42,
      });
    } else if (costume === 'mestre') {
      shirtMat = toonMat(pal.shirt ?? '#1c2432', {
        map: abadaTex.map,
        bumpMap: abadaTex.bumpMap,
        bumpScale: 0.014,
        rimStrength: 0.36,
      });
    } else {
      shirtMat = toonMat(pal.shirt!, {
        map: abadaTex.map,
        bumpMap: abadaTex.bumpMap,
        bumpScale: 0.012,
        rimStrength: 0.34,
      });
    }
    geometries.push(shirtGeo);
    materials.push(shirtMat);

    const shirtVisible = costume === 'default' || costume === 'mestre' || costume === 'rua';
    shirtMesh = new THREE.SkinnedMesh(shirtGeo, shirtMat);
    shirtMesh.bind(skeleton);
    shirtMesh.frustumCulled = false;
    shirtMesh.castShadow = true;
    shirtMesh.receiveShadow = true;
    shirtMesh.visible = shirtVisible;
    root.add(shirtMesh);

    shirtOutline = addSkinnedOutline(shirtMesh, root, 0.01);
    shirtOutline.visible = shirtVisible;
    outlineMeshes.push(shirtOutline);
  }

  return {
    skinMesh,
    abadaMesh,
    shirtMesh,
    shirtOutline,
    outlineMeshes,
    skeleton,
    disposables: { geometries, materials },
  };
}
