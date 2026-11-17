// Shared humanoid skeleton used by every fighter.
// Rest pose: standing upright, arms hanging, facing +Z, character's LEFT side at +X.
//
// Rotation conventions (Euler XYZ, radians) for authoring poses:
//   thigh.x  < 0  => hip flexion (leg swings forward)      thigh.x > 0 => leg back
//   shin.x   > 0  => knee bends (foot goes behind)
//   upperArm.x < 0 => arm raises forward                    upperArmL.z > 0 / upperArmR.z < 0 => arm out to the side
//   foreArm.x < 0 => elbow bends (forearm forward/up)
//   spine/chest/head .x > 0 => lean forward;  .y => twist;  .z => side bend
//   thighL.z > 0 / thighR.z < 0 => leg out to the side (abduction)
import type { Vec3 } from '../core/fixedmath';

export const BONES = [
  'pelvis', 'spine', 'chest', 'neck', 'head',
  'clavicleL', 'upperArmL', 'foreArmL', 'handL',
  'clavicleR', 'upperArmR', 'foreArmR', 'handR',
  'thighL', 'shinL', 'footL', 'toeL',
  'thighR', 'shinR', 'footR', 'toeR',
] as const;
export type BoneId = (typeof BONES)[number];
export const BONE_INDEX: Record<BoneId, number> = Object.fromEntries(BONES.map((b, i) => [b, i])) as Record<BoneId, number>;

export type LimbGroup = 'torso' | 'head' | 'arm' | 'leg';

export interface BoneDef {
  id: BoneId;
  parent: BoneId | null;
  offset: Vec3; // joint position in parent's local frame (rest)
  seg: Vec3;    // segment from this joint to its tip (rest, local frame)
  radius: number;
  group: LimbGroup;
}

export const SKELETON: BoneDef[] = [
  { id: 'pelvis', parent: null, offset: [0, 0, 0], seg: [0, 0.12, 0], radius: 0.13, group: 'torso' },
  { id: 'spine', parent: 'pelvis', offset: [0, 0.1, 0], seg: [0, 0.2, 0], radius: 0.12, group: 'torso' },
  { id: 'chest', parent: 'spine', offset: [0, 0.2, 0], seg: [0, 0.2, 0], radius: 0.15, group: 'torso' },
  { id: 'neck', parent: 'chest', offset: [0, 0.2, 0], seg: [0, 0.07, 0], radius: 0.056, group: 'head' },
  { id: 'head', parent: 'neck', offset: [0, 0.07, 0], seg: [0, 0.21, 0], radius: 0.11, group: 'head' },

  { id: 'clavicleL', parent: 'chest', offset: [0.05, 0.19, 0.01], seg: [0.15, 0.01, -0.01], radius: 0.048, group: 'torso' },
  { id: 'upperArmL', parent: 'clavicleL', offset: [0.15, 0.01, -0.01], seg: [0, -0.29, 0], radius: 0.055, group: 'arm' },
  { id: 'foreArmL', parent: 'upperArmL', offset: [0, -0.29, 0], seg: [0, -0.26, 0], radius: 0.045, group: 'arm' },
  { id: 'handL', parent: 'foreArmL', offset: [0, -0.26, 0], seg: [0, -0.09, 0], radius: 0.042, group: 'arm' },
  { id: 'clavicleR', parent: 'chest', offset: [-0.05, 0.19, 0.01], seg: [-0.15, 0.01, -0.01], radius: 0.048, group: 'torso' },
  { id: 'upperArmR', parent: 'clavicleR', offset: [-0.15, 0.01, -0.01], seg: [0, -0.29, 0], radius: 0.055, group: 'arm' },
  { id: 'foreArmR', parent: 'upperArmR', offset: [0, -0.29, 0], seg: [0, -0.26, 0], radius: 0.045, group: 'arm' },
  { id: 'handR', parent: 'foreArmR', offset: [0, -0.26, 0], seg: [0, -0.09, 0], radius: 0.042, group: 'arm' },

  { id: 'thighL', parent: 'pelvis', offset: [0.1, -0.02, 0], seg: [0, -0.44, 0], radius: 0.075, group: 'leg' },
  { id: 'shinL', parent: 'thighL', offset: [0, -0.44, 0], seg: [0, -0.44, 0], radius: 0.055, group: 'leg' },
  { id: 'footL', parent: 'shinL', offset: [0, -0.44, 0], seg: [0, -0.06, 0.11], radius: 0.042, group: 'leg' },
  { id: 'toeL', parent: 'footL', offset: [0, -0.06, 0.11], seg: [0, -0.005, 0.075], radius: 0.036, group: 'leg' },
  { id: 'thighR', parent: 'pelvis', offset: [-0.1, -0.02, 0], seg: [0, -0.44, 0], radius: 0.075, group: 'leg' },
  { id: 'shinR', parent: 'thighR', offset: [0, -0.44, 0], seg: [0, -0.44, 0], radius: 0.055, group: 'leg' },
  { id: 'footR', parent: 'shinR', offset: [0, -0.44, 0], seg: [0, -0.06, 0.11], radius: 0.042, group: 'leg' },
  { id: 'toeR', parent: 'footR', offset: [0, -0.06, 0.11], seg: [0, -0.005, 0.075], radius: 0.036, group: 'leg' },
];

/** Per-character proportions. All multipliers default to 1. */
export interface BodyScale {
  height: number;               // global scale
  torso: number; arm: number; leg: number; head: number;
  girth: number;                // capsule radius multiplier
}
export const DEFAULT_SCALE: BodyScale = { height: 1, torso: 1, arm: 1, leg: 1, head: 1, girth: 1 };

/** Resolved skeleton for a given body scale (lengths & radii in metres). */
export interface ScaledBone {
  parent: number;
  offset: Vec3;
  seg: Vec3;
  radius: number;
}

export function scaleSkeleton(s: BodyScale): ScaledBone[] {
  return SKELETON.map((b) => {
    const parentDef = b.parent ? SKELETON[BONE_INDEX[b.parent]] : null;
    const pg = parentDef ? s[parentDef.group] : 1;
    const g = s[b.group];
    // limbs attach to torso: horizontal shoulder/hip offsets follow girth, vertical follow parent group
    const off: Vec3 = [b.offset[0] * s.height * s.girth, b.offset[1] * s.height * pg, b.offset[2] * s.height * pg];
    const isClav = b.id === 'clavicleL' || b.id === 'clavicleR';
    return {
      parent: b.parent ? BONE_INDEX[b.parent] : -1,
      offset: off,
      seg: [
        b.seg[0] * s.height * (isClav ? s.girth : g),
        b.seg[1] * s.height * g,
        b.seg[2] * s.height * g,
      ],
      radius: b.radius * s.height * s.girth,
    };
  });
}
