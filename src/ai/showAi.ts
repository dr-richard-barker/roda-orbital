// Cooperative, beat-synchronized, style-aware Capoeira Partner AI for "Play / Show" Mode (Jogar na Roda).
// Coordinates Pergunta e Resposta (call & answer) tailored to Angola, Regional, Contemporânea, & Maculelê.
import { rngNext } from '../core/fixedmath';
import { charById, type Style } from '../data/characters';
import { characterProfile, styleSpec } from '../data/fightingStyles';
import { MOVE_BY_ID } from '../data/moves';
import {
  RODA_SEQUENCES,
  selectDialogueAnswer,
  SHOW_CALL_MOVES,
  type DialogueAnswer,
} from '../data/rodaDialogues';
import { fighterDistance } from '../sim/collision';
import { EMPTY_INPUT, type FighterState, type InputFrame, type MatchState } from '../sim/state';

export interface ShowAiMemory {
  seed: number;
  cooldown: number;
  seqIdx: number;
  stepIdx: number;
  orbitDir: 4 | 6;
  orbitTimer: number;
  answeredAttackKey: string;
  queuedFollowUp: string | null;
  followUpDelay: number;
}

export function createShowAiMemory(seed = 0x70da5401): ShowAiMemory {
  return {
    seed: (seed >>> 0) || 0x2468ace1,
    cooldown: 16,
    seqIdx: 0,
    stepIdx: 0,
    orbitDir: 6,
    orbitTimer: 90,
    answeredAttackKey: '',
    queuedFollowUp: null,
    followUpDelay: 0,
  };
}

function nextRand(mem: ShowAiMemory): number {
  const [v, s] = rngNext(mem.seed);
  mem.seed = s;
  return v;
}

function moveMidHitFrame(moveId: string): number {
  const m = MOVE_BY_ID[moveId];
  const w = m?.hits[0];
  if (!w) return 10;
  return Math.round((w.frames[0] + w.frames[1]) * 0.5);
}

function answerMidCrushFrame(moveId: string): number {
  const m = MOVE_BY_ID[moveId];
  if (!m) return 10;
  const ov = m.hurtboxOverrides?.[0];
  if (ov) return Math.round((ov.frames[0] + ov.frames[1]) * 0.5);
  return Math.round(m.totalFrames * 0.45);
}

/** Check whether this fighter can immediately launch a cooperative move or evasive cancel in Show Mode. */
function canActNow(me: FighterState): boolean {
  if (me.mode === 'IDLE' || me.mode === 'WALK' || me.mode === 'SHIFT') return true;
  if (me.mode === 'ATTACK' && me.moveId) {
    const cur = MOVE_BY_ID[me.moveId];
    // Allow feints / ginga / finished attacks near end of recovery to flow seamlessly into an answer
    if (cur && cur.hits.length === 0 && me.moveFrame >= 6) return true;
    if (cur && me.moveFrame >= cur.totalFrames - 3) return true;
  }
  return false;
}

/** Choose Ginga orbiting directional input scaled to the fighter's Capoeira style spacing. */
function chooseRodaOrbitDir(me: FighterState, _opp: FighterState, dist: number, mem: ShowAiMemory, style: Style): number {
  mem.orbitTimer -= 1;
  if (mem.orbitTimer <= 0) {
    mem.orbitTimer = 70 + Math.floor(nextRand(mem) * 60);
    mem.orbitDir = nextRand(mem) < 0.5 ? 4 : 6;
  }

  const [idealMin, idealMax] = styleSpec(style).idealRange;
  // Softly bias back toward center of Roda if near perimeter
  const centerDist = Math.hypot(me.pos[0], me.pos[2]);
  const approach = dist > idealMax ? 6 : dist < idealMin + 0.2 ? 4 : 5;
  const tangent = mem.orbitDir === 6 ? 8 : 2; // relative sidestep (8 = up/left, 2 = down/right)

  if (centerDist > 3.8) {
    // Steer back inward while keeping opponent framed
    const dotTowardCenter = -me.pos[0] * me.facing[0] - me.pos[2] * me.facing[1];
    return dotTowardCenter >= 0 ? 6 : 4;
  }
  if (approach === 6) return tangent === 8 ? 9 : 3;
  if (approach === 4) return tangent === 8 ? 7 : 1;
  return tangent === 8 ? 8 : 2;
}

function pickBestCallMove(
  me: FighterState,
  dist: number,
  mem: ShowAiMemory,
): { callMoveId: string; preferredAnswerId?: string } {
  const style = charById(me.charId).style;
  const spec = styleSpec(style);
  const styleSeqs = RODA_SEQUENCES.filter((s) => s.styles.includes(style));
  const seqPool = styleSeqs.length > 0 ? styleSeqs : RODA_SEQUENCES;

  // 70% follow curated Capoeira lineage duet motifs matching fighter style, 30% expressive style calls
  if (dist >= 1.0 && dist <= 2.25 && nextRand(mem) < 0.7) {
    const seq = seqPool[mem.seqIdx % seqPool.length];
    const stepDef = seq.steps[mem.stepIdx % seq.steps.length];
    mem.stepIdx += 1;
    if (mem.stepIdx >= seq.steps.length) {
      mem.stepIdx = 0;
      mem.seqIdx = (mem.seqIdx + 1) % seqPool.length;
    }
    return stepDef;
  }

  const pool =
    dist < 1.2
      ? SHOW_CALL_MOVES.close
      : dist <= 2.15
        ? spec.standingPool.filter((id) => MOVE_BY_ID[id]?.hits.length > 0).length > 0
          ? spec.standingPool.filter((id) => MOVE_BY_ID[id]?.hits.length > 0)
          : SHOW_CALL_MOVES.mid
        : SHOW_CALL_MOVES.advance;
  const idx = Math.floor(nextRand(mem) * pool.length);
  return { callMoveId: pool[idx] };
}

/**
 * Deterministic supportive partner / Show Duet AI for MatchConfig.playMode === 'SHOW'.
 * Reads opponent attack startup and answers with timed crushes, vaults & esquivas aligned to each character's style.
 */
export function stepShowAi(state: MatchState, slot: 0 | 1, mem: ShowAiMemory): InputFrame {
  if (state.roundPhase !== 'FIGHT') return EMPTY_INPUT;

  const me = state.fighters[slot];
  const opp = state.fighters[slot === 0 ? 1 : 0];
  const dist = fighterDistance(me, opp);
  const myDef = charById(me.charId);
  const myProf = characterProfile(me.charId);

  if (mem.cooldown > 0) mem.cooldown -= 1;

  // 1. PRIORITY: Supportive synchronization when partner throws an active kick, sweep, or Angola Chamada!
  if (opp.mode === 'ATTACK' && opp.moveId) {
    const oppMove = MOVE_BY_ID[opp.moveId];
    if (oppMove && (oppMove.hits.length > 0 || oppMove.id === 'chamada') && dist <= 2.85) {
      const atkKey = `${opp.slot}:${opp.moveId}:${state.frame - opp.moveFrame}`;
      if (mem.answeredAttackKey !== atkKey) {
        const idx = Math.floor(nextRand(mem) * 97);
        const answer: DialogueAnswer = selectDialogueAnswer(oppMove, me.stance, dist, idx, undefined, myDef.style);
        const midHit = oppMove.hits.length > 0 ? moveMidHitFrame(oppMove.id) : 12;
        const midCrush = answerMidCrushFrame(answer.moveId);
        // Align midpoint of evasion crush window over midpoint of incoming strike's active window
        const triggerAtOppFrame = Math.max(1, midHit - midCrush);

        const winEnd = oppMove.hits[0]?.frames[1] ?? oppMove.totalFrames - 6;
        if (opp.moveFrame >= triggerAtOppFrame && opp.moveFrame <= winEnd && canActNow(me)) {
          mem.answeredAttackKey = atkKey;
          mem.cooldown = MOVE_BY_ID[answer.moveId]?.totalFrames ?? 26;
          if (answer.followUpId && nextRand(mem) < 0.72) {
            mem.queuedFollowUp = answer.followUpId;
            mem.followUpDelay = 4;
          }
          return {
            dir: 5,
            buttons: 0,
            showMoveId: answer.moveId,
          };
        }
        // Wait smoothly in Ginga framing opponent until trigger frame arrives
        return { dir: dist < 1.1 ? 4 : 5, buttons: 0 };
      }
    }
  }

  // Reset answer key once opponent is no longer attacking
  if (opp.mode !== 'ATTACK') {
    mem.answeredAttackKey = '';
  }

  // Keep graceful Ginga recovery while cooling down or non-idle
  if (me.mode !== 'IDLE' && me.mode !== 'WALK') {
    return { dir: 5, buttons: 0 };
  }

  // 2. Queued natural counter-flow Pergunta right after executing an esquiva / role
  if (mem.queuedFollowUp) {
    if (mem.followUpDelay > 0) {
      mem.followUpDelay -= 1;
    } else if (opp.mode !== 'ATTACK' && dist >= 1.25 && dist <= 2.45) {
      const nextCall = mem.queuedFollowUp;
      mem.queuedFollowUp = null;
      mem.cooldown = (MOVE_BY_ID[nextCall]?.totalFrames ?? 28) + 12;
      return { dir: 5, buttons: 0, showMoveId: nextCall };
    } else if (dist > 2.65 || dist < 1.15) {
      mem.queuedFollowUp = null;
    }
  }

  // 3. Musical Beat-Synced Call ("Pergunta") when it's this partner's turn (or after long neutral pause)
  const isMyTurn = state.harmony.callerSlot === slot;
  const nearBeat = state.beatPhase <= 5 || state.beatPhase >= state.framesPerBeat - 3;
  const beatAnchor = (state.barBeat === 0 || state.barBeat === 2) && nearBeat;

  // Step back gracefully via Fuga (or Volta ao Mundo in Angola) if too close before calling the next kick
  if (mem.cooldown === 0 && opp.mode !== 'ATTACK' && dist < 1.18 && isMyTurn) {
    mem.cooldown = 28;
    const resetMove = myDef.style === 'ANGOLA' && nextRand(mem) < 0.45 ? 'volta_ao_mundo' : 'fuga';
    return { dir: 4, buttons: 0, showMoveId: resetMove };
  }

  if (
    mem.cooldown === 0 &&
    opp.mode !== 'ATTACK' &&
    dist >= 1.18 &&
    dist <= 2.65 &&
    ((isMyTurn && beatAnchor) || (isMyTurn && state.frame % 90 === 0))
  ) {
    const pick = pickBestCallMove(me, dist, mem);
    const callMove = MOVE_BY_ID[pick.callMoveId];
    if (callMove) {
      mem.cooldown = Math.max(24, Math.round((callMove.totalFrames + 16) * Math.min(1.18, myProf.tempoMul)));
      return {
        dir: 5,
        buttons: 0,
        showMoveId: callMove.id,
      };
    }
  }

  // 4. Expressive Roda footwork (Angola tight circling vs Regional rhythmic bounce vs Contemporânea arcs)
  const dir = chooseRodaOrbitDir(me, opp, dist, mem, myDef.style);
  if (mem.cooldown === 0 && dist >= 1.3 && dist <= 2.15 && nextRand(mem) < 0.02 && nearBeat) {
    mem.cooldown = 38;
    const flairMove =
      myDef.style === 'ANGOLA'
        ? nextRand(mem) < 0.5
          ? 'chamada'
          : 'balanca'
        : myDef.style === 'CONTEMPORANEA' && myProf.acroBias > 0.8
          ? 'bananeira'
          : nextRand(mem) < 0.5
            ? 'balanca'
            : 'ginga';
    return { dir: 5, buttons: 0, showMoveId: flairMove };
  }

  return { dir, buttons: 0 };
}
