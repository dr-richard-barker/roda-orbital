// Combat hit resolution, blocking, counter-hits, juggle decay, and KO handling.
import type { FK } from '../anim/pose';
import { clamp, vscale } from '../core/fixedmath';
import { charById } from '../data/characters';
import { MOVE_BY_ID, type HitWindow } from '../data/moves';
import {
  capsulesOverlap,
  extractActiveHitboxes,
  extractHurtboxes,
  getHurtboxProfile,
  worldMidpoint,
} from './collision';
import type { FighterState, InputFrame, MatchState } from './state';

function canBlock(defender: FighterState, defInput: InputFrame, level: HitWindow['level']): boolean {
  if (level === 'THROW') return false;
  if (defender.pos[1] > 0.08) return false;
  if (defender.mode !== 'IDLE' && defender.mode !== 'WALK' && defender.mode !== 'BLOCKSTUN') {
    return false;
  }
  const holdingBack = defInput.dir === 4 || defInput.dir === 1 || defInput.dir === 7;
  const holdingDownBack = defInput.dir === 1;
  if (!holdingBack) return false;
  if (level === 'LOW') return holdingDownBack || defender.stance === 'RLX';
  if (level === 'HIGH') return !holdingDownBack && defender.stance !== 'RLX';
  return true; // MID blocked by either 4 or 1
}

function crushesLevel(profile: ReturnType<typeof getHurtboxProfile>, level: HitWindow['level']): boolean {
  if (profile === 'CRUSH_HIGH' && level === 'HIGH') return true;
  if (profile === 'CRUSH_LOW' && level === 'LOW') return true;
  return false;
}

export function resolveCombat(
  state: MatchState,
  fks: [FK, FK],
  inputs: [InputFrame, InputFrame],
): void {
  const [f0, f1] = state.fighters;
  const pairs: [FighterState, FighterState, FK, FK, InputFrame][] = [
    [f0, f1, fks[0], fks[1], inputs[1]],
    [f1, f0, fks[1], fks[0], inputs[0]],
  ];

  // Collect hits before mutating stun so simultaneous trades resolve fairly.
  interface PendingHit {
    att: FighterState;
    def: FighterState;
    defInput: InputFrame;
    winIdx: number;
    win: HitWindow;
    contact: [number, number, number];
  }
  const pending: PendingHit[] = [];

  for (const [att, def, attFK, defFK, defInput] of pairs) {
    if (def.mode === 'KO' || def.mode === 'KNOCKDOWN' || def.mode === 'WAKEUP') continue;
    const active = extractActiveHitboxes(att, attFK);
    if (active.length === 0) continue;

    const defProfile = getHurtboxProfile(def);
    const hurtboxes = extractHurtboxes(def, defFK);
    if (hurtboxes.length === 0) continue;

    for (const { winIdx, win, capsules } of active) {
      if (crushesLevel(defProfile, win.level)) continue;
      let hitCap: typeof capsules[number] | null = null;
      let hurtCap: typeof hurtboxes[number] | null = null;
      for (const hc of capsules) {
        for (const uc of hurtboxes) {
          if (capsulesOverlap(hc, uc)) {
            hitCap = hc;
            hurtCap = uc;
            break;
          }
        }
        if (hitCap) break;
      }
      if (hitCap && hurtCap) {
        pending.push({
          att,
          def,
          defInput,
          winIdx,
          win,
          contact: worldMidpoint(hitCap, hurtCap),
        });
      }
    }
  }

  for (const h of pending) {
    const { att, def, defInput, winIdx, win, contact } = h;
    att.moveHitMask |= 1 << winIdx;
    const attDef = charById(att.charId);
    const blocked = canBlock(def, defInput, win.level);
    const move = att.moveId ? MOVE_BY_ID[att.moveId] : null;
    const remRecovery = move ? Math.max(0, move.totalFrames - att.moveFrame) : 12;

    if (blocked) {
      att.hitBlocked = true;
      def.mode = 'BLOCKSTUN';
      def.modeFrame = 0;
      def.stunFrames = win.onBlock.stun;
      def.moveId = null;
      def.vel[0] = att.facing[0] * win.onBlock.pushback * 3.0;
      def.vel[2] = att.facing[1] * win.onBlock.pushback * 3.0;
      const chip = Math.max(1, Math.round(win.damage * 0.12));
      def.health = Math.max(1, def.health - chip);
      att.lastFrameAdv = win.onBlock.stun - remRecovery;
      state.hitstop = Math.max(state.hitstop, Math.max(2, Math.floor(win.hitstop * 0.7)));
      state.events.push({ type: 'BLOCK', slot: def.slot, pos: contact, value: chip });
      continue;
    }

    // Clean Hit!
    const isCounter = def.mode === 'ATTACK' || def.mode === 'SHIFT';
    const isJuggle = def.pos[1] > 0.08 || def.mode === 'JUGGLE';
    const res = isCounter && win.onCounter ? win.onCounter : win.onHit;

    att.hitConnected = true;
    def.comboCount += 1;
    const comboScale = Math.max(0.4, 1 - 0.08 * (def.comboCount - 1));
    const counterMul = isCounter ? 1.2 : 1.0;
    const dmg = Math.max(1, Math.round(win.damage * attDef.damageMul * comboScale * counterMul));

    def.health = Math.max(0, def.health - dmg);
    def.comboDamage += dmg;
    def.moveId = null;
    def.shiftTo = null;
    att.malicia = clamp(att.malicia + (isCounter ? 10 : 6), 0, 100);
    def.malicia = clamp(def.malicia + 3, 0, 100);

    att.lastFrameAdv = res.stun - remRecovery;
    state.hitstop = Math.max(state.hitstop, win.hitstop + (isCounter ? 2 : 0));

    if (def.health <= 0) {
      def.mode = 'KO';
      def.modeFrame = 0;
      def.vel[0] = att.facing[0] * 3.8;
      def.vel[1] = 4.2;
      def.vel[2] = att.facing[1] * 3.8;
      state.events.push({ type: 'KO', slot: def.slot, pos: contact, value: dmg });
      continue;
    }

    if (win.launch || isJuggle) {
      const n = def.juggleHits;
      def.juggleHits += 1;
      const decayV = Math.pow(0.85, n);
      const decayStun = Math.pow(0.9, n);
      const baseL = win.launch ?? [1.8, 4.2, 0];
      // Gravity-scaled vertical apex: sqrt(1 / gScale)^0.5 -> v0 scaled so apex grows reasonably
      const g = state.config.gravityScale;
      const gFactor = Math.pow(g, 0.25); // v0 = sqrt(2 g h), h ~ g^-0.5 => v0 ~ g^0.25
      def.mode = 'JUGGLE';
      def.modeFrame = 0;
      def.stunFrames = Math.max(10, Math.round(res.stun * decayStun));
      def.vel[0] = att.facing[0] * baseL[0] * decayV;
      def.vel[1] = Math.max(1.8, baseL[1] * decayV * gFactor);
      def.vel[2] = att.facing[1] * baseL[0] * decayV;
    } else if (res.knockdown) {
      def.mode = 'KNOCKDOWN';
      def.modeFrame = 0;
      def.stunFrames = 32;
      def.vel[0] = att.facing[0] * res.pushback * 3.2;
      def.vel[2] = att.facing[1] * res.pushback * 3.2;
    } else {
      def.mode = 'HITSTUN';
      def.modeFrame = 0;
      def.stunFrames = res.stun;
      const pb = vscale([att.facing[0], 0, att.facing[1]], res.pushback * 3.4);
      def.vel[0] = pb[0];
      def.vel[2] = pb[2];
    }

    state.events.push({
      type: isCounter ? 'COUNTER' : 'HIT',
      slot: def.slot,
      pos: contact,
      value: dmg,
      label: move?.name,
    });
  }
}
