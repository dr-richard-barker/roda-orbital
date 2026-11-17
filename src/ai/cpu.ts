// Style-aware, sequence-chaining deterministic Capoeira CPU AI.
// Uses per-character profiles and video-derived CancelRules so each fighter
// chains authentic Capoeira Angola, Regional, Contemporânea, and Maculelê combinations.
import { rngNext } from '../core/fixedmath';
import { charById } from '../data/characters';
import { characterProfile, styleSpec, type FlowCombo } from '../data/fightingStyles';
import { MOVE_BY_ID, type MoveDef } from '../data/moves';
import { fighterDistance } from '../sim/collision';
import {
  BTN_LH,
  BTN_LK,
  BTN_RH,
  BTN_RK,
  BTN_STANCE,
  type FighterState,
  type InputFrame,
  type MatchState,
} from '../sim/state';

export type AiDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface AiMemory {
  seed: number;
  cooldown: number;
  planMove: 'NONE' | 'QCF_RK' | 'QCF_LK' | 'JUGGLE_FOLLOW';
  planStep: number;
  blockHold: number;
  // Multi-frame directional buffer (e.g., 236+RK, 214+LK, 28+RK)
  motionDirs: number[];
  motionStep: number;
  motionBtn: number;
  // Active Capoeira combination chain
  queuedCombo: string[];
  comboCursor: number;
  patiencePause: number;
}

export function createAiMemory(seed = 0x51a7beef): AiMemory {
  return {
    seed,
    cooldown: 0,
    planMove: 'NONE',
    planStep: 0,
    blockHold: 0,
    motionDirs: [],
    motionStep: 0,
    motionBtn: 0,
    queuedCombo: [],
    comboCursor: 0,
    patiencePause: 0,
  };
}

function nextRand(mem: AiMemory): number {
  const [v, s] = rngNext(mem.seed);
  mem.seed = s;
  return v;
}

const BTN_MAP: Record<string, number> = {
  LH: BTN_LH,
  RH: BTN_RH,
  LK: BTN_LK,
  RK: BTN_RK,
};

interface ParsedToken {
  dirs: number[];
  buttons: number;
}

function parseInputToken(token: string): ParsedToken {
  if (token === 'STANCE') return { dirs: [5], buttons: BTN_STANCE };
  if (token === 'STANCE_HSP') return { dirs: [8], buttons: BTN_STANCE };
  if (token === 'STANCE_GINGA') return { dirs: [5], buttons: BTN_STANCE };

  const btnStart = token.search(/(LH|RH|LK|RK)/);
  if (btnStart < 0) return { dirs: [5], buttons: 0 };
  const dirPart = token.slice(0, btnStart);
  const btnPart = token.slice(btnStart);

  let buttons = 0;
  for (const p of btnPart.split('+')) {
    buttons |= BTN_MAP[p] ?? 0;
  }
  const dirs = dirPart.length === 0 ? [5] : dirPart.split('').map(Number);
  return { dirs, buttons };
}

function queueOrEmitToken(mem: AiMemory, token: string): InputFrame {
  const parsed = parseInputToken(token);
  if (parsed.dirs.length <= 1) {
    return { dir: parsed.dirs[0] ?? 5, buttons: parsed.buttons };
  }
  mem.motionDirs = parsed.dirs;
  mem.motionBtn = parsed.buttons;
  mem.motionStep = 1;
  return { dir: parsed.dirs[0], buttons: 0 };
}

function queueMove(mem: AiMemory, moveId: string, followUps: string[] = []): InputFrame | null {
  const m = MOVE_BY_ID[moveId];
  if (!m) return null;
  mem.queuedCombo = [moveId, ...followUps];
  mem.comboCursor = 1;
  return queueOrEmitToken(mem, m.input);
}

function pickFromMoves(mem: AiMemory, ids: string[], stance: FighterState['stance']): string | null {
  const valid = ids.filter((id) => MOVE_BY_ID[id]?.from.includes(stance));
  if (valid.length === 0) return null;
  return valid[Math.floor(nextRand(mem) * valid.length)];
}

function pickCharacterCombo(
  mem: AiMemory,
  combos: FlowCombo[],
  stance: FighterState['stance'],
  dist: number,
): FlowCombo | null {
  const fit = combos.filter(
    (c) => c.startStance === stance && dist >= c.minDist - 0.2 && dist <= c.maxDist + 0.25,
  );
  if (fit.length === 0) return null;
  let totalWeight = 0;
  for (const c of fit) totalWeight += c.weight;
  let roll = nextRand(mem) * totalWeight;
  for (const c of fit) {
    roll -= c.weight;
    if (roll <= 0) return c;
  }
  return fit[fit.length - 1];
}

function canCancelInto(me: FighterState, move: MoveDef, opp: FighterState): string | null {
  const prof = characterProfile(me.charId);
  const available = move.cancels.filter((c) => {
    if (me.moveFrame < c.window[0] || me.moveFrame > c.window[1]) return false;
    if (c.on === 'HIT' && !me.hitConnected) return false;
    if (c.on === 'BLOCK' && !me.hitBlocked) return false;
    return true;
  });
  if (available.length === 0) return null;

  // Prefer continuing active juggle launchers!
  if (opp.mode === 'JUGGLE') {
    const jug = available.find((c) => c.into === 'parafuso' || MOVE_BY_ID[c.into]?.hits.some((h) => Boolean(h.launch)));
    if (jug) return jug.input ?? 'LK';
  }

  // Score opportunistic cancels by character fighting affinity (spin/throw/acrobatics)
  let best = available[0];
  let bestScore = -1;
  for (const c of available) {
    const target = MOVE_BY_ID[c.into];
    let score = c.into === 'GINGA' || c.into === 'RLX' || c.into === 'HSP' ? 0.1 : 1.0;
    if (target?.tags?.includes('SPIN')) score += prof.spinBias;
    if (target?.tags?.includes('THROW')) score += prof.throwBias;
    if (target?.tags?.includes('FLOREIO')) score += prof.acroBias * 0.6;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best?.input ?? null;
}

export function stepAi(
  state: MatchState,
  slot: 0 | 1,
  mem: AiMemory,
  diff: AiDifficulty = 'MEDIUM',
): InputFrame {
  const me = state.fighters[slot];
  const opp = state.fighters[slot === 0 ? 1 : 0];
  const dist = fighterDistance(me, opp);
  const def = charById(me.charId);
  const spec = styleSpec(def.style);
  const prof = characterProfile(me.charId);

  if (state.roundPhase !== 'FIGHT' || me.mode === 'KO') {
    return { dir: 5, buttons: 0 };
  }

  // 1. Continue multi-frame motion plans (e.g., 2 -> 3 -> 6 + RK, 6 -> 3 -> 2 -> 1 -> 4 + LK)
  if (mem.motionDirs.length > 0) {
    const idx = Math.min(mem.motionStep, mem.motionDirs.length - 1);
    const d = mem.motionDirs[idx];
    const atEnd = mem.motionStep >= mem.motionDirs.length - 1;
    const btn = atEnd ? mem.motionBtn : 0;
    mem.motionStep += 1;
    if (atEnd) {
      mem.motionDirs = [];
      mem.motionStep = 0;
      mem.motionBtn = 0;
    }
    return { dir: d, buttons: btn };
  }

  // Legacy QCF plan support
  if (mem.planMove === 'QCF_RK' || mem.planMove === 'QCF_LK') {
    const seq = [2, 3, 6];
    const d = seq[Math.min(mem.planStep, seq.length - 1)];
    const btn = mem.planStep >= 2 ? (mem.planMove === 'QCF_RK' ? BTN_RK : BTN_LK) : 0;
    mem.planStep += 1;
    if (mem.planStep > 3) {
      mem.planMove = 'NONE';
      mem.planStep = 0;
    }
    return { dir: d, buttons: btn };
  }

  // 2. Active Cancel-Rule combo chaining during ATTACK!
  if (me.mode === 'ATTACK' && me.moveId) {
    const curMove = MOVE_BY_ID[me.moveId];
    if (curMove) {
      const chainChance = diff === 'HARD' ? 0.92 : diff === 'MEDIUM' ? 0.68 : 0.28;
      // Continue queued signature combo step when cancel window opens
      const targetId = mem.queuedCombo[mem.comboCursor];
      if (targetId) {
        const match = curMove.cancels.find((c) => {
          if (c.into !== targetId) return false;
          if (me.moveFrame < c.window[0] || me.moveFrame > c.window[1]) return false;
          if (c.on === 'HIT' && !me.hitConnected) return false;
          if (c.on === 'BLOCK' && !me.hitBlocked) return false;
          return true;
        });
        if (match && match.input && nextRand(mem) < chainChance) {
          mem.comboCursor += 1;
          return queueOrEmitToken(mem, match.input);
        }
      }

      // Opportunistic launch follow-up or rhythmic counter cancel
      if (opp.mode === 'JUGGLE' || (me.hitConnected && nextRand(mem) < chainChance * 0.45)) {
        const nextTok = canCancelInto(me, curMove, opp);
        if (nextTok && dist < 2.6) {
          mem.queuedCombo = [];
          mem.comboCursor = 0;
          return queueOrEmitToken(mem, nextTok);
        }
      }
    }
    return { dir: 5, buttons: 0 };
  }

  // 3. Defense: block OR style-native Capoeira evasion (Negativa, Cocorinha, Aú, Esquiva)
  const reactionChance = diff === 'HARD' ? 0.78 : diff === 'MEDIUM' ? 0.48 : 0.22;
  if (opp.mode === 'ATTACK' && dist < 2.35 && mem.blockHold <= 0) {
    if (nextRand(mem) < reactionChance) {
      // Capoeira evasion chance scaled by character trap/acro bias
      const evadeProb = Math.min(0.68, 0.28 + prof.trapBias * 0.25 + prof.acroBias * 0.18);
      if ((me.mode === 'IDLE' || me.mode === 'WALK') && nextRand(mem) < evadeProb) {
        const evadeId = pickFromMoves(mem, spec.evasionPool, me.stance);
        if (evadeId) {
          mem.cooldown = 16;
          const evMove = MOVE_BY_ID[evadeId];
          const counterTarget = evMove?.cancels.find((c) => c.into !== 'GINGA' && c.into !== 'RLX')?.into;
          const inp = queueMove(mem, evadeId, counterTarget ? [counterTarget] : []);
          if (inp) return inp;
        }
      }
      mem.blockHold = diff === 'HARD' ? 14 : 10;
    }
  }
  if (mem.blockHold > 0) {
    mem.blockHold -= 1;
    const lowBlock = opp.stance === 'RLX' || opp.moveId === 'rasteira' || opp.moveId === 'corta_capim';
    return { dir: lowBlock ? 1 : 4, buttons: 0 };
  }

  // 4. Cooldown & stylistic patient footwork (Angola baiting vs Regional pursuit)
  if (mem.cooldown > 0) {
    mem.cooldown -= 1;
    const [minR, maxR] = spec.idealRange;
    if (dist > maxR + 0.35) return { dir: 6, buttons: 0 };
    if (dist < minR - 0.15) return { dir: 4, buttons: 0 };
    if (def.style === 'ANGOLA' && mem.cooldown % 18 < 6) {
      return { dir: mem.cooldown % 2 === 0 ? 8 : 2, buttons: 0 }; // circling ginga probe
    }
    return { dir: 5, buttons: 0 };
  }

  if (mem.patiencePause > 0) {
    mem.patiencePause -= 1;
    if (opp.mode === 'ATTACK') {
      mem.patiencePause = 0; // wake up immediately on partner commit
    } else {
      return { dir: 5, buttons: 0 };
    }
  }

  const basePace = diff === 'HARD' ? 7 : diff === 'MEDIUM' ? 13 : 22;
  const pace = Math.max(5, Math.round(basePace * prof.tempoMul));
  const r = nextRand(mem);

  // Maculelê Grima loves attacking crisp on beat anchors
  const nearBeat = Math.min(state.beatPhase, state.framesPerBeat - state.beatPhase) <= 4;
  if (def.style === 'ANGOLA' && r < spec.patienceBias && dist < 2.4 && me.stance === 'GINGA') {
    mem.patiencePause = 14 + Math.floor(nextRand(mem) * 16);
    if (nextRand(mem) < 0.45 && dist >= 1.0 && dist <= 2.2) {
      mem.cooldown = pace + 10;
      const bait = queueMove(mem, nextRand(mem) < 0.55 ? 'chamada' : 'balanca', ['cabecada', 'rasteira']);
      if (bait) return bait;
    }
    return { dir: 5, buttons: 0 };
  }

  // 5. Try selecting an authentic character FlowCombo first!
  const comboBoost = def.style === 'MACULELE' && nearBeat ? 0.92 : 0.72;
  if (nextRand(mem) < comboBoost) {
    const combo = pickCharacterCombo(mem, prof.combos, me.stance, dist);
    if (combo && combo.steps.length > 0) {
      mem.cooldown = pace + 6;
      const inp = queueMove(mem, combo.steps[0], combo.steps.slice(1));
      if (inp) return inp;
    }
  }

  // 6. Stance-specific decisions tailored to style weights
  if (me.stance === 'HSP') {
    mem.cooldown = pace;
    if (dist < 2.55) {
      const hspOptions = prof.acroBias > 0.7
        ? ['helicoptero', 'piao_mao', 'au_sem_mao', 'au_queda_de_rins', 'xango', 'xango_de_frente', 'giro_de_cabeca', 'au_de_frente']
        : ['helicoptero', 'piao_mao', 'au_de_frente', 'au_uma_mao', 'au_fechado'];
      const id = pickFromMoves(mem, hspOptions, 'HSP');
      if (id) {
        const m = MOVE_BY_ID[id];
        const follow = m?.cancels.find((c) => c.into !== 'GINGA' && c.into !== 'RLX')?.into;
        const inp = queueMove(mem, id, follow ? [follow] : []);
        if (inp) return inp;
      }
    }
    return { dir: 5, buttons: BTN_STANCE };
  }

  if (me.stance === 'RLX') {
    mem.cooldown = pace;
    if (dist < 2.25) {
      const rlxPool = def.style === 'ANGOLA'
        ? ['negativa_angola', 'rasteira_de_mao', 'tesoura_de_frente', 'cabecada', 'boca_de_calca', 'rasteira', 'queda_de_rins']
        : prof.spinBias > 0.65
          ? ['corta_capim', 'corrupio', 'relogio', 's_dobrado', 'chapa', 'macaco']
          : ['rasteira', 'chapa', 'cabecada', 'corta_capim', 'tesoura_de_frente', 'macaco', 'macaquinho'];
      const id = pickFromMoves(mem, rlxPool, 'RLX');
      if (id) {
        const follow = id === 'negativa_angola' ? ['rasteira_de_mao'] : id === 'rasteira' ? ['role'] : [];
        const inp = queueMove(mem, id, follow);
        if (inp) return inp;
      }
    }
    return { dir: 5, buttons: BTN_STANCE };
  }

  // 7. GINGA stance approach & stance-entry decisions
  if (dist > spec.idealRange[1] + 0.55) {
    if (r < 0.28 * prof.acroBias + 0.12) {
      mem.cooldown = 18;
      const gapId = def.style === 'ANGOLA' ? 'au_fechado' : prof.acroBias > 0.75 ? 'voo_do_morcego' : 'au';
      const inp = queueMove(mem, gapId);
      if (inp) return inp;
    }
    return { dir: 6, buttons: 0 };
  }

  // Periodic intentional stance shift aligned with Angola RLX vs Morcego HSP affinities
  if (r < spec.rlxAffinity * 0.25 && dist < 2.3) {
    mem.cooldown = pace + 4;
    if (def.style === 'ANGOLA' && nextRand(mem) < 0.55) {
      const inp = queueMove(mem, 'negativa_angola', ['troca_de_negativa']);
      if (inp) return inp;
    }
    return { dir: 2, buttons: BTN_STANCE };
  }
  if (r > 1 - spec.hspAffinity * 0.35 && dist < 2.5) {
    mem.cooldown = pace + 4;
    if (prof.acroBias > 0.75 && nextRand(mem) < 0.6) {
      const inp = queueMove(mem, 'bananeira', ['helicoptero']);
      if (inp) return inp;
    }
    return { dir: 8, buttons: BTN_STANCE };
  }

  // Pick from standing style pool or character specialty
  mem.cooldown = pace;
  if (prof.throwBias > 0.7 && dist < 1.55 && nextRand(mem) < 0.42) {
    const throwId = pickFromMoves(mem, ['vingativa', 'arrastao', 'cruz', 'banda_de_costas'], 'GINGA');
    if (throwId) {
      const inp = queueMove(mem, throwId);
      if (inp) return inp;
    }
  }

  const pickId = pickFromMoves(mem, spec.standingPool, 'GINGA');
  if (pickId) {
    const m = MOVE_BY_ID[pickId];
    const follow = m?.cancels.find((c) => c.into !== 'GINGA' && c.into !== 'RLX')?.into;
    const inp = queueMove(mem, pickId, follow ? [follow] : []);
    if (inp) return inp;
  }
  return { dir: 5, buttons: BTN_LK };
}
