// Deterministic runtime biomechanical kinetics:
// 1. Scapulohumeral clavicle elevation/protraction coupling
// 2. Cervical spine gaze tracking & split-neck articulation
// 3. Support-leg shock cushion, hip-opening turn-out & metatarsal toe-hinge push-off
// 4. Dempster/Winter (1955) single-leg Center-of-Mass torso counter-balance
// 5. Soft AAOS + Capoeira athletic joint ROM clamping & Style-specific Ginga posture
//
// Uses exclusively fixedmath LUT/polynomial ops so sim & renderer stay 100% deterministic.
import { clamp, datan2, dsin, vlen } from '../core/fixedmath';
import { computeBodyCOM, softClampPoseROM } from '../data/biomechanics';
import { charById } from '../data/characters';
import { styleSpec } from '../data/fightingStyles';
import { BONE_INDEX, type ScaledBone } from '../data/skeleton';
import type { FighterState } from '../sim/state';
import { computeFK, newFK, type Pose } from './pose';

const I_SPINE = 6 + BONE_INDEX.spine * 3;
const I_CHEST = 6 + BONE_INDEX.chest * 3;
const I_NECK = 6 + BONE_INDEX.neck * 3;
const I_HEAD = 6 + BONE_INDEX.head * 3;
const I_CLAV_L = 6 + BONE_INDEX.clavicleL * 3;
const I_CLAV_R = 6 + BONE_INDEX.clavicleR * 3;
const I_UARM_L = 6 + BONE_INDEX.upperArmL * 3;
const I_UARM_R = 6 + BONE_INDEX.upperArmR * 3;
const I_THIGH_L = 6 + BONE_INDEX.thighL * 3;
const I_SHIN_L = 6 + BONE_INDEX.shinL * 3;
const I_FOOT_L = 6 + BONE_INDEX.footL * 3;
const I_TOE_L = 6 + BONE_INDEX.toeL * 3;
const I_THIGH_R = 6 + BONE_INDEX.thighR * 3;
const I_SHIN_R = 6 + BONE_INDEX.shinR * 3;
const I_FOOT_R = 6 + BONE_INDEX.footR * 3;
const I_TOE_R = 6 + BONE_INDEX.toeR * 3;

const B_FOOT_L = BONE_INDEX.footL * 3;
const B_FOOT_R = BONE_INDEX.footR * 3;
const B_CHEST = BONE_INDEX.chest * 3;

const scratchFK = newFK();
const ORIGIN: [number, number, number] = [0, 0, 0];

function coupleClavicle(pose: Pose, iClav: number, iArm: number, sideSign: number): void {
  // sideSign: +1 = Left (+X seg), -1 = Right (-X seg)
  const armRx = pose[iArm];
  const armRz = pose[iArm + 2];

  // Elevation when arm raises forward (-rx) or abducts outward (sideSign * rz)
  const forwardLift = Math.max(0, -armRx - 0.35);
  const sideLift = Math.max(0, sideSign * armRz - 0.3);
  const elev = clamp((forwardLift + sideLift) * 0.24, 0, 0.44);

  // Forward reach / guard protracts clavicle toward +Z
  const protract = clamp(-armRx * 0.14, -0.18, 0.26);

  if (Math.abs(pose[iClav + 2]) < 0.04) {
    pose[iClav + 2] += sideSign * elev;
  }
  if (Math.abs(pose[iClav + 1]) < 0.04) {
    pose[iClav + 1] += -sideSign * protract;
  }
}

function coupleToeHinge(pose: Pose, iFoot: number, iToe: number): void {
  // Only auto-articulate metatarsal hinge if track did not explicitly key toe angles
  if (
    Math.abs(pose[iToe]) > 0.03 ||
    Math.abs(pose[iToe + 1]) > 0.02 ||
    Math.abs(pose[iToe + 2]) > 0.02
  ) {
    return;
  }
  const footPitch = pose[iFoot];
  // When trailing heel lifts behind body (plantarflexion footPitch > 0.2), bend toes upward against ground
  if (footPitch > 0.2) {
    pose[iToe] = clamp(-(footPitch - 0.14) * 0.78, -0.92, 0);
  }
}

/**
 * Enrich a sampled keyframe pose in-place with secondary biomechanical realism:
 * scapular rhythm, split cervical neck gaze, metatarsal toe push-off,
 * support-knee cushion, and Dempster BSIP COM counter-balance.
 */
export function applyBiomechanicalKinetics(
  pose: Pose,
  bones: ScaledBone[],
  f: FighterState,
  opp?: FighterState,
): Pose {
  const knockedOut = f.mode === 'KNOCKDOWN' || f.mode === 'KO' || f.mode === 'JUGGLE';

  // 1. Scapulohumeral clavicle elevation & protraction
  coupleClavicle(pose, I_CLAV_L, I_UARM_L, 1);
  coupleClavicle(pose, I_CLAV_R, I_UARM_R, -1);

  // 2. Cervical spine share + partner gaze tracking ("olho no olho")
  const hasExplicitNeck =
    Math.abs(pose[I_NECK]) > 0.03 ||
    Math.abs(pose[I_NECK + 1]) > 0.03 ||
    Math.abs(pose[I_NECK + 2]) > 0.03;
  if (!hasExplicitNeck) {
    // Share ~28% of head rotation cleanly into cervical vertebrae
    pose[I_NECK] += pose[I_HEAD] * 0.28;
    pose[I_NECK + 1] += pose[I_HEAD + 1] * 0.3;
    pose[I_NECK + 2] += pose[I_HEAD + 2] * 0.28;
    pose[I_HEAD] *= 0.72;
    pose[I_HEAD + 1] *= 0.7;
    pose[I_HEAD + 2] *= 0.72;

    if (!knockedOut && f.mode !== 'HITSTUN') {
      // Counter-pitch neck during deep crouch/evasion bends so eyes keep tracking horizon
      const trunkPitch = pose[3] + pose[I_SPINE] + pose[I_CHEST];
      if (Math.abs(trunkPitch) > 0.35 && Math.abs(pose[3]) < 1.35) {
        pose[I_NECK] += clamp(-trunkPitch * 0.24, -0.34, 0.34);
      }
      // Subtle partner gaze azimuth tracking in local chest frame when facing/spinning
      if (opp) {
        const dx = opp.pos[0] - f.pos[0];
        const dz = opp.pos[2] - f.pos[2];
        const dist = vlen([dx, 0, dz]);
        if (dist > 0.25) {
          // Local lateral offset relative to fighter facing [fx, fz]
          const fx = f.facing[0], fz = f.facing[1];
          const localSide = (fz * dx - fx * dz) / dist;
          const localFwd = (fx * dx + fz * dz) / dist;
          const relYaw = datan2(localSide, localFwd);
          pose[I_NECK + 1] += clamp(relYaw * 0.22, -0.32, 0.32);
        }
      }
    }
  }

  // 3. Foot / toe metatarsal articulation & single-leg support mechanics
  coupleToeHinge(pose, I_FOOT_L, I_TOE_L);
  coupleToeHinge(pose, I_FOOT_R, I_TOE_R);

  // Skip upright bipedal balance when airborne, knocked down, inverted, or low crouched
  const isUprightGrounded =
    !knockedOut &&
    f.pos[1] <= 0.02 &&
    f.stance !== 'HSP' &&
    f.stance !== 'RLX' &&
    Math.abs(pose[3]) < 0.85 &&
    Math.abs(pose[5]) < 0.85;

  if (isUprightGrounded) {
    // Evaluate provisional FK in fighter local facing (+Z)
    computeFK(pose, bones, ORIGIN, 0, 1, scratchFK);

    // Make sure chest is still above pelvis (not an acrobatic inversion mid-move)
    if (scratchFK.tips[B_CHEST + 1] > scratchFK.joints[1] + 0.15) {
      const footLY = scratchFK.joints[B_FOOT_L + 1];
      const footRY = scratchFK.joints[B_FOOT_R + 1];
      const liftDiff = footLY - footRY;

      if (Math.abs(liftDiff) > 0.28) {
        const leftIsKicking = liftDiff > 0;
        const supFootIdx = leftIsKicking ? B_FOOT_R : B_FOOT_L;
        const supThighI = leftIsKicking ? I_THIGH_R : I_THIGH_L;
        const supShinI = leftIsKicking ? I_SHIN_R : I_SHIN_L;
        const supToeI = leftIsKicking ? I_TOE_R : I_TOE_L;
        const supSideSign = leftIsKicking ? -1 : 1; // R=-1, L=+1

        // Prevent locked-knee stiffness during high kicks: ~6-8° shock-absorber bend
        if (pose[supShinI] < 0.1) {
          pose[supShinI] = 0.12;
          pose[supThighI] -= 0.06;
        }
        // Subtle external hip turn-out on support leg opens pelvis for whip/round kicks
        if (Math.abs(pose[supThighI + 1]) < 0.06) {
          pose[supThighI + 1] += -supSideSign * 0.14;
        }
        // Plantar ball-pivot articulation under torque
        if (Math.abs(pose[supToeI]) < 0.03) {
          pose[supToeI] = -0.18;
        }

        // 4. Dempster BSIP Center-of-Mass counter-lean toward standing ankle
        const com = computeBodyCOM(scratchFK, bones);
        const supX = scratchFK.joints[supFootIdx];
        const supZ = scratchFK.joints[supFootIdx + 2];
        const dx = com[0] - supX; // + = COM too far Left (+X) -> lean torso Right (+rz)
        const dz = com[2] - supZ; // + = COM too far Forward (+Z) -> lean torso Back (-rx)

        pose[I_SPINE + 2] += clamp(dx * 0.24, -0.14, 0.14);
        pose[I_CHEST + 2] += clamp(dx * 0.18, -0.1, 0.1);
        pose[I_SPINE] += clamp(-dz * 0.22, -0.14, 0.14);
        pose[I_CHEST] += clamp(-dz * 0.16, -0.1, 0.1);
      }
    }
  }

  // 5. Style-specific Ginga / Walk biomechanical posture (Angola crouch vs Regional lift)
  if (!knockedOut && f.stance === 'GINGA' && (f.mode === 'IDLE' || f.mode === 'WALK')) {
    const spec = styleSpec(charById(f.charId).style);
    const bounce = dsin(f.modeFrame * 0.22 + f.slot * 1.4) * spec.swayBounceAmp;
    const flex = spec.crouchFlexRad + Math.max(0, bounce);
    pose[I_THIGH_L] -= flex;
    pose[I_THIGH_R] -= flex;
    pose[I_SHIN_L] += flex * 1.85;
    pose[I_SHIN_R] += flex * 1.85;
    pose[I_FOOT_L] -= flex * 0.72;
    pose[I_FOOT_R] -= flex * 0.72;
    pose[I_SPINE] += spec.torsoLeanRad;
    pose[I_NECK] -= spec.torsoLeanRad * 0.45; // keep eyes forward ("olho no olho")
    pose[I_UARM_L + 2] += spec.guardSpreadRad;
    pose[I_UARM_R + 2] -= spec.guardSpreadRad;
  }

  // 6. Anatomical joint ROM envelope
  softClampPoseROM(pose);
  return pose;
}
