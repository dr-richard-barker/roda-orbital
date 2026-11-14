// Capsule-based hit/hurt detection, pushboxes, and arena boundary resolution.
import { jointOf, tipOf, type FK } from '../anim/pose';
import { segSegDist2, vlen, vnorm, vscale, vsub, type Vec3 } from '../core/fixedmath';
import { BONES, BONE_INDEX, type BoneId } from '../data/skeleton';
import { MOVE_BY_ID, type HitWindow, type HurtboxProfile } from '../data/moves';
import type { FighterState } from './state';

export interface WorldCapsule {
  a: Vec3;
  b: Vec3;
  radius: number;
  bone: BoneId;
}

const HEAD_CHEST_BONES = new Set<BoneId>(['head', 'chest', 'upperArmL', 'upperArmR', 'foreArmL', 'foreArmR', 'handL', 'handR']);
const LOW_BONES = new Set<BoneId>(['thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR']);

export function getHurtboxProfile(f: FighterState): HurtboxProfile {
  if (f.mode === 'ATTACK' && f.moveId) {
    const move = MOVE_BY_ID[f.moveId];
    if (move?.hurtboxOverrides) {
      for (const ov of move.hurtboxOverrides) {
        if (f.moveFrame >= ov.frames[0] && f.moveFrame <= ov.frames[1]) {
          return ov.profile;
        }
      }
    }
  }
  if (f.stance === 'RLX' && f.mode !== 'HITSTUN' && f.mode !== 'JUGGLE') return 'CRUSH_HIGH';
  if (f.stance === 'HSP' && f.mode !== 'HITSTUN' && f.mode !== 'JUGGLE') return 'CRUSH_LOW';
  if (f.mode === 'WAKEUP') return 'INVULN';
  return 'NORMAL';
}

export function extractHurtboxes(f: FighterState, fk: FK): WorldCapsule[] {
  const profile = getHurtboxProfile(f);
  if (profile === 'INVULN') return [];

  const out: WorldCapsule[] = [];
  for (let b = 0; b < BONES.length; b++) {
    const id = BONES[b];
    if (profile === 'CRUSH_HIGH' && HEAD_CHEST_BONES.has(id)) {
      // High-crushing moves/stances still have torso, just skip head/arms from high-crush check
      if (id === 'head') continue;
    }
    if (profile === 'CRUSH_LOW' && LOW_BONES.has(id) && f.stance !== 'HSP') continue;
    const i3 = b * 3;
    out.push({
      bone: id,
      a: [fk.joints[i3], fk.joints[i3 + 1], fk.joints[i3 + 2]],
      b: [fk.tips[i3], fk.tips[i3 + 1], fk.tips[i3 + 2]],
      radius: fk.radii[b] * 1.15,
    });
  }
  return out;
}

export function extractActiveHitboxes(f: FighterState, fk: FK): { winIdx: number; win: HitWindow; capsules: WorldCapsule[] }[] {
  if (f.mode !== 'ATTACK' || !f.moveId) return [];
  const move = MOVE_BY_ID[f.moveId];
  if (!move) return [];

  const out: { winIdx: number; win: HitWindow; capsules: WorldCapsule[] }[] = [];
  for (let w = 0; w < move.hits.length; w++) {
    if (f.moveHitMask & (1 << w)) continue;
    const win = move.hits[w];
    if (f.moveFrame >= win.frames[0] && f.moveFrame <= win.frames[1]) {
      const caps: WorldCapsule[] = win.capsules.map((c) => {
        const bi = BONE_INDEX[c.bone];
        return {
          bone: c.bone,
          a: jointOf(fk, c.bone),
          b: tipOf(fk, c.bone),
          radius: Math.max(c.radius, fk.radii[bi]),
        };
      });
      out.push({ winIdx: w, win, capsules: caps });
    }
  }
  return out;
}

export function capsulesOverlap(a: WorldCapsule, b: WorldCapsule): boolean {
  const r = a.radius + b.radius;
  return segSegDist2(a.a, a.b, b.a, b.b) <= r * r;
}

export function resolvePushboxes(a: FighterState, b: FighterState, arenaRadius: number): void {
  const minSep = 0.62;
  const dx = b.pos[0] - a.pos[0];
  const dz = b.pos[2] - a.pos[2];
  const dy = Math.abs(b.pos[1] - a.pos[1]);
  if (dy > 1.2) return; // pass over/under if airborne high

  const d2 = dx * dx + dz * dz;
  if (d2 < minSep * minSep) {
    const d = Math.sqrt(d2);
    let nx = 1, nz = 0;
    if (d > 1e-5) {
      nx = dx / d;
      nz = dz / d;
    } else {
      nx = a.facing[0];
      nz = a.facing[1];
    }
    const push = (minSep - d) * 0.5;
    a.pos[0] -= nx * push;
    a.pos[2] -= nz * push;
    b.pos[0] += nx * push;
    b.pos[2] += nz * push;
  }

  // Clamp both inside the circular Roda
  for (const f of [a, b]) {
    const r2 = f.pos[0] * f.pos[0] + f.pos[2] * f.pos[2];
    const maxR = arenaRadius - 0.45;
    if (r2 > maxR * maxR) {
      const n = vnorm([f.pos[0], 0, f.pos[2]]);
      f.pos[0] = n[0] * maxR;
      f.pos[2] = n[2] * maxR;
    }
  }
}

export function fighterDistance(a: FighterState, b: FighterState): number {
  return vlen(vsub([a.pos[0], 0, a.pos[2]], [b.pos[0], 0, b.pos[2]]));
}

/** Rotate a fighter-local [forward, up, side] vector into world space. */
export function localToWorld(f: FighterState, local: Vec3): Vec3 {
  const fx = f.facing[0], fz = f.facing[1];
  // side vector (character left = +X in local rest, which is +Z rotated -90° = (-fz, 0, fx)? Wait:
  // In rest pose facing +Z: forward = (0,0,1), left = (+1,0,0).
  // For facing (fx, fz): forward = (fx, 0, fz), left = (fz, 0, -fx).
  return [
    fx * local[0] + fz * local[2],
    local[1],
    fz * local[0] - fx * local[2],
  ];
}

export function worldMidpoint(a: WorldCapsule, b: WorldCapsule): Vec3 {
  const ma = vscale([a.a[0] + a.b[0], a.a[1] + a.b[1], a.a[2] + a.b[2]], 0.5);
  const mb = vscale([b.a[0] + b.b[0], b.a[1] + b.b[1], b.a[2] + b.b[2]], 0.5);
  return vscale([ma[0] + mb[0], ma[1] + mb[1], ma[2] + mb[2]], 0.5);
}
