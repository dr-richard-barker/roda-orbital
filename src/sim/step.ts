// Main 60 Hz deterministic simulation step.
import { blendPose, computeFK, emptyPose, newFK, sampleTrack, type FK, type Pose } from '../anim/pose';
import { clamp, vnorm } from '../core/fixedmath';
import { charById } from '../data/characters';
import { MOVE_BY_ID, MOVES, type MoveDef, type Stance } from '../data/moves';
import { POSE_TRACKS } from '../data/poses';
import { scaleSkeleton } from '../data/skeleton';
import { localToWorld, resolvePushboxes } from './collision';
import { resolveCombat } from './combat';
import {
  BTN_LH,
  BTN_LK,
  BTN_RH,
  BTN_RK,
  BTN_STANCE,
  resetRound,
  type BufferedInput,
  type FighterState,
  type InputFrame,
  type MatchState,
} from './state';

const DT = 1 / 60;
const BASE_GRAVITY = 9.81;
const STANCE_CYCLE: Record<Stance, Stance> = {
  GINGA: 'HSP',
  HSP: 'RLX',
  RLX: 'GINGA',
};

const scratchPoseA = emptyPose();
const scratchPoseB = emptyPose();

/** Evaluate the current Pose for a fighter (shared by sim FK and Three.js renderer). */
export function evaluateFighterPose(f: FighterState, out: Pose, globalFrame: number): Pose {
  if (f.mode === 'ATTACK' && f.moveId) {
    const move = MOVE_BY_ID[f.moveId];
    if (move) {
      const tr = POSE_TRACKS[move.poseId];
      if (tr) return sampleTrack(tr, f.moveFrame, out);
    }
  }
  if (f.mode === 'SHIFT' && f.shiftTo) {
    const fromTr = POSE_TRACKS[f.stance];
    const toTr = POSE_TRACKS[f.shiftTo];
    sampleTrack(fromTr, globalFrame, scratchPoseA);
    sampleTrack(toTr, globalFrame, scratchPoseB);
    const w = clamp(f.modeFrame / Math.max(1, f.shiftDuration), 0, 1);
    return blendPose(scratchPoseA, scratchPoseB, w, out);
  }
  if (f.mode === 'BLOCKSTUN') {
    return sampleTrack(f.stance === 'RLX' ? POSE_TRACKS.GUARD_LOW : POSE_TRACKS.GUARD_HIGH, f.modeFrame, out);
  }
  if (f.mode === 'HITSTUN') {
    return sampleTrack(POSE_TRACKS.HITSTUN, f.modeFrame, out);
  }
  if (f.mode === 'JUGGLE') {
    return sampleTrack(POSE_TRACKS.AIR, f.modeFrame, out);
  }
  if (f.mode === 'KNOCKDOWN' || f.mode === 'KO') {
    return sampleTrack(POSE_TRACKS.KNOCKDOWN, f.modeFrame, out);
  }
  if (f.mode === 'WALK') {
    return sampleTrack(POSE_TRACKS.WALK_FWD, f.modeFrame, out);
  }
  const stanceTr = POSE_TRACKS[f.stance] ?? POSE_TRACKS.GINGA;
  return sampleTrack(stanceTr, globalFrame, out);
}

// ---------------------------------------------------------------------------
// Input Buffering & Motion Detection
// ---------------------------------------------------------------------------

function pushInput(f: FighterState, inp: InputFrame): void {
  const pressed = inp.buttons & ~f.prevButtons;
  f.prevButtons = inp.buttons;
  f.inputBuf.unshift({ dir: inp.dir, pressed, held: inp.buttons });
  if (f.inputBuf.length > 16) f.inputBuf.length = 16;
}

function hasRecentMotion(buf: BufferedInput[], seq: number[], maxWindow = 12): boolean {
  let idx = seq.length - 1;
  const lim = Math.min(buf.length, maxWindow);
  for (let i = 0; i < lim; i++) {
    if (buf[i].dir === seq[idx]) {
      idx--;
      if (idx < 0) return true;
    }
  }
  return false;
}

function matchMoveInput(buf: BufferedInput[], token: string): boolean {
  if (buf.length === 0) return false;
  // Check newly pressed buttons in last 4 frames (buffer window)
  const checkWindow = Math.min(4, buf.length);
  const hasPress = (mask: number): boolean => {
    for (let i = 0; i < checkWindow; i++) {
      if ((buf[i].pressed & mask) === mask) return true;
    }
    return false;
  };
  const hasComboPress = (mask: number): boolean => {
    for (let i = 0; i < checkWindow; i++) {
      if ((buf[i].held & mask) === mask && (buf[i].pressed & mask) !== 0) return true;
    }
    return false;
  };

  const curDir = buf[0].dir;
  switch (token) {
    case 'LH+RH': return hasComboPress(BTN_LH | BTN_RH);
    case '236RK': return hasPress(BTN_RK) && hasRecentMotion(buf, [2, 3, 6], 14);
    case '236LK': return hasPress(BTN_LK) && hasRecentMotion(buf, [2, 3, 6], 14);
    case '6RK': return hasPress(BTN_RK) && (curDir === 6 || curDir === 3 || curDir === 9);
    case '6LK': return hasPress(BTN_LK) && (curDir === 6 || curDir === 3 || curDir === 9);
    case '2RK': return hasPress(BTN_RK) && (curDir === 2 || curDir === 1 || curDir === 3);
    case 'LH': return hasPress(BTN_LH);
    case 'RH': return hasPress(BTN_RH);
    case 'LK': return hasPress(BTN_LK);
    case 'RK': return hasPress(BTN_RK);
    case 'STANCE': return hasPress(BTN_STANCE);
    case 'STANCE_HSP': return hasPress(BTN_STANCE) && (curDir === 6 || curDir === 8 || curDir === 5);
    case 'STANCE_GINGA': return hasPress(BTN_STANCE);
    default: return false;
  }
}

// Order moves so more specific motions (236RK, 6RK, 2RK, LH+RH) are checked before plain buttons (RK, LK).
const MOVE_PRIORITY: MoveDef[] = [...MOVES].sort((a, b) => b.input.length - a.input.length);

function pickMoveForFighter(f: FighterState): MoveDef | null {
  for (const m of MOVE_PRIORITY) {
    if (!m.from.includes(f.stance)) continue;
    if (matchMoveInput(f.inputBuf, m.input)) return m;
  }
  return null;
}

function isOnDownbeat(state: MatchState): boolean {
  if (!state.config.rhythmSyncEnabled) return false;
  const dist = Math.min(state.beatPhase, state.framesPerBeat - state.beatPhase);
  return dist <= 4;
}

function startMove(state: MatchState, f: FighterState, move: MoveDef, beatBonus = 0): void {
  f.mode = 'ATTACK';
  f.modeFrame = 0;
  f.moveId = move.id;
  f.moveFrame = beatBonus;
  f.moveHitMask = 0;
  f.hitConnected = false;
  f.hitBlocked = false;
  f.shiftTo = null;
  if (beatBonus > 0) {
    f.malicia = clamp(f.malicia + 5, 0, 100);
    state.events.push({ type: 'BEAT_BONUS', slot: f.slot, pos: [...f.pos], label: move.name });
  }
}

function startStanceShift(state: MatchState, f: FighterState, target: Stance): void {
  const def = charById(f.charId);
  const onBeat = isOnDownbeat(state);
  let dur = def.stanceShift;
  if (onBeat) {
    dur = Math.max(4, dur - 2);
    f.malicia = clamp(f.malicia + 5, 0, 100);
    state.events.push({ type: 'BEAT_BONUS', slot: f.slot, pos: [...f.pos], label: target });
  }
  f.mode = 'SHIFT';
  f.modeFrame = 0;
  f.moveId = null;
  f.shiftTo = target;
  f.shiftDuration = dur;
  state.events.push({ type: 'STANCE', slot: f.slot, pos: [...f.pos], label: target });
}

function updateFacing(f: FighterState, opp: FighterState): void {
  if (f.mode === 'ATTACK' || f.mode === 'JUGGLE' || f.mode === 'KNOCKDOWN' || f.mode === 'KO') return;
  const dx = opp.pos[0] - f.pos[0];
  const dz = opp.pos[2] - f.pos[2];
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len > 0.05) {
    f.facing[0] = dx / len;
    f.facing[1] = dz / len;
  }
}

function stepFighter(state: MatchState, f: FighterState, opp: FighterState, inp: InputFrame): void {
  const def = charById(f.charId);
  pushInput(f, inp);
  updateFacing(f, opp);

  // Clear combo count once defender has recovered
  if (f.mode === 'IDLE' || f.mode === 'WALK' || f.mode === 'SHIFT') {
    f.comboCount = 0;
    f.comboDamage = 0;
    f.juggleHits = 0;
  }

  f.modeFrame += 1;

  // Handle stun / knockdown / KO states
  if (f.mode === 'KO') {
    // stay down
  } else if (f.mode === 'HITSTUN' || f.mode === 'BLOCKSTUN') {
    f.stunFrames -= 1;
    if (f.stunFrames <= 0) {
      f.mode = 'IDLE';
      f.modeFrame = 0;
    }
  } else if (f.mode === 'JUGGLE') {
    f.stunFrames -= 1;
    if (f.pos[1] <= 0.001 && f.vel[1] <= 0) {
      f.pos[1] = 0;
      f.vel[1] = 0;
      f.mode = 'KNOCKDOWN';
      f.modeFrame = 0;
      f.stunFrames = 24;
    }
  } else if (f.mode === 'KNOCKDOWN') {
    f.stunFrames -= 1;
    if (f.stunFrames <= 0) {
      f.mode = 'WAKEUP';
      f.modeFrame = 0;
      f.stunFrames = 10;
    }
  } else if (f.mode === 'WAKEUP') {
    f.stunFrames -= 1;
    if (f.stunFrames <= 0) {
      f.mode = 'IDLE';
      f.modeFrame = 0;
      f.stance = 'GINGA';
    }
  } else if (f.mode === 'SHIFT') {
    if (f.modeFrame >= f.shiftDuration && f.shiftTo) {
      f.stance = f.shiftTo;
      f.shiftTo = null;
      f.mode = 'IDLE';
      f.modeFrame = 0;
    }
  } else if (f.mode === 'ATTACK' && f.moveId) {
    const move = MOVE_BY_ID[f.moveId];
    if (!move) {
      f.mode = 'IDLE';
      f.moveId = null;
    } else {
      f.moveFrame += 1;

      // Apply root motion
      if (move.rootMotion) {
        for (const rm of move.rootMotion) {
          if (f.moveFrame >= rm.frames[0] && f.moveFrame <= rm.frames[1]) {
            const wv = localToWorld(f, rm.vel);
            f.vel[0] = wv[0];
            f.vel[2] = wv[2];
            if (rm.vel[1] !== 0) f.vel[1] = rm.vel[1];
          }
        }
      }

      // Check cancels
      let canceled = false;
      for (const c of move.cancels) {
        if (f.moveFrame < c.window[0] || f.moveFrame > c.window[1]) continue;
        if (c.on === 'HIT' && !f.hitConnected) continue;
        if (c.on === 'BLOCK' && !f.hitBlocked) continue;
        if (c.input && !matchMoveInput(f.inputBuf, c.input)) continue;

        if (c.into === 'GINGA' || c.into === 'HSP' || c.into === 'RLX') {
          startStanceShift(state, f, c.into);
          canceled = true;
          break;
        }
        const nextMove = MOVE_BY_ID[c.into];
        if (nextMove) {
          const bonus = c.beatBonus && isOnDownbeat(state) ? c.beatBonus : 0;
          startMove(state, f, nextMove, bonus);
          canceled = true;
          break;
        }
      }

      if (!canceled && f.moveFrame >= move.totalFrames) {
        f.stance = move.endStance;
        f.mode = 'IDLE';
        f.modeFrame = 0;
        f.moveId = null;
      }
    }
  }

  // Free action from IDLE / WALK
  if ((f.mode === 'IDLE' || f.mode === 'WALK') && state.roundPhase === 'FIGHT') {
    const move = pickMoveForFighter(f);
    if (move) {
      startMove(state, f, move, isOnDownbeat(state) ? 1 : 0);
    } else if (f.inputBuf[0]?.pressed & BTN_STANCE) {
      const dir = f.inputBuf[0].dir;
      let target: Stance = STANCE_CYCLE[f.stance];
      if (dir === 2 || dir === 1 || dir === 3) target = 'RLX';
      else if (dir === 8 || dir === 7 || dir === 9) target = 'HSP';
      if (target !== f.stance) {
        startStanceShift(state, f, target);
      }
    } else {
      // Movement & Sidestep
      const dir = inp.dir;
      const forward = dir === 6 || dir === 3 || dir === 9 ? 1 : dir === 4 || dir === 1 || dir === 7 ? -1 : 0;
      const side = dir === 8 || dir === 7 || dir === 9 ? 1 : dir === 2 || dir === 1 || dir === 3 ? -1 : 0;

      if (f.stance === 'GINGA' && (forward !== 0 || side !== 0)) {
        f.mode = 'WALK';
        const spd = forward >= 0 ? def.walkSpeed : def.backSpeed;
        const moveVec = vnorm([
          f.facing[0] * forward + f.facing[1] * side,
          0,
          f.facing[1] * forward - f.facing[0] * side,
        ]);
        f.vel[0] = moveVec[0] * spd;
        f.vel[2] = moveVec[2] * spd;
      } else {
        f.mode = 'IDLE';
      }
    }
  }

  // Integrate velocity & gravity
  const gScale = state.config.gravityScale;
  const juggleMul = f.mode === 'JUGGLE' ? 1 + (0.25 + 0.5 * (1 - gScale)) * f.juggleHits : 1;
  if (f.pos[1] > 0 || f.vel[1] > 0) {
    f.vel[1] -= BASE_GRAVITY * gScale * juggleMul * DT;
  }

  f.pos[0] += f.vel[0] * DT;
  f.pos[1] += f.vel[1] * DT;
  f.pos[2] += f.vel[2] * DT;

  if (f.pos[1] <= 0) {
    f.pos[1] = 0;
    if (f.vel[1] < 0) f.vel[1] = 0;
  }

  // Ground friction
  if (f.pos[1] === 0 && f.mode !== 'WALK') {
    const damp = f.mode === 'ATTACK' ? 0.86 : 0.78;
    f.vel[0] *= damp;
    f.vel[2] *= damp;
  }
}

const fks: [FK, FK] = [newFK(), newFK()];
const poses: [Pose, Pose] = [emptyPose(), emptyPose()];
const cachedSkeletons: Record<string, ReturnType<typeof scaleSkeleton>> = {};

function getSkel(charId: string) {
  let sk = cachedSkeletons[charId];
  if (!sk) {
    sk = scaleSkeleton(charById(charId).body);
    cachedSkeletons[charId] = sk;
  }
  return sk;
}

export function step(state: MatchState, inputs: [InputFrame, InputFrame]): MatchState {
  state.events.length = 0;
  state.frame += 1;

  // Advance rhythm beat clock
  state.beatPhase += 1;
  if (state.beatPhase >= state.framesPerBeat) {
    state.beatPhase = 0;
    state.barBeat = (state.barBeat + 1) % 4;
  }

  // Training mode passive health regen when idle
  if (state.config.trainingMode) {
    for (const f of state.fighters) {
      if (f.mode === 'IDLE' && f.health < f.maxHealth) {
        f.health = Math.min(f.maxHealth, f.health + 2);
      }
    }
  }

  // Round phase management
  if (state.roundPhase === 'INTRO') {
    state.phaseTimer -= 1;
    if (state.phaseTimer <= 0) {
      state.roundPhase = 'FIGHT';
      state.events.push({ type: 'ROUND_START', slot: 0, pos: [0, 1, 0], value: state.round });
    }
  } else if (state.roundPhase === 'KO') {
    state.phaseTimer -= 1;
    if (state.phaseTimer <= 0) {
      if (state.wins[0] >= 2 || state.wins[1] >= 2) {
        state.roundPhase = 'MATCH_OVER';
        state.winner = state.wins[0] >= 2 ? 0 : 1;
      } else {
        state.round += 1;
        resetRound(state);
      }
    }
  }

  // Hitstop freezes combat simulation while keeping rhythm clock running
  if (state.hitstop > 0) {
    state.hitstop -= 1;
    return state;
  }

  // Step both fighters
  stepFighter(state, state.fighters[0], state.fighters[1], inputs[0]);
  stepFighter(state, state.fighters[1], state.fighters[0], inputs[1]);

  // Pushboxes & arena clamp
  resolvePushboxes(state.fighters[0], state.fighters[1], state.config.arenaRadius);

  // Compute FK for both fighters using exact same poses as renderer
  for (let i = 0; i < 2; i++) {
    const f = state.fighters[i];
    evaluateFighterPose(f, poses[i], state.frame);
    computeFK(poses[i], getSkel(f.charId), f.pos, f.facing[0], f.facing[1], fks[i]);
  }

  // Resolve combat hits
  if (state.roundPhase === 'FIGHT') {
    resolveCombat(state, fks, inputs);

    // Round timer & KO check
    if (!state.config.trainingMode) {
      state.roundTimerFrames = Math.max(0, state.roundTimerFrames - 1);
      const ko0 = state.fighters[0].health <= 0;
      const ko1 = state.fighters[1].health <= 0;
      if (ko0 || ko1 || state.roundTimerFrames === 0) {
        if (ko0 && !ko1) state.wins[1] += 1;
        else if (ko1 && !ko0) state.wins[0] += 1;
        else if (state.fighters[0].health >= state.fighters[1].health) state.wins[0] += 1;
        else state.wins[1] += 1;
        state.roundPhase = 'KO';
        state.phaseTimer = 110;
      }
    }
  }

  return state;
}

/** Expose last computed FK for debug hitbox rendering without duplicating FK work. */
export function computeFighterFK(f: FighterState, globalFrame: number, outFK: FK): FK {
  const p = emptyPose();
  evaluateFighterPose(f, p, globalFrame);
  return computeFK(p, getSkel(f.charId), f.pos, f.facing[0], f.facing[1], outFK);
}
