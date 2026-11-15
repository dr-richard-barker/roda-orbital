// Utility-based Capoeira CPU AI.
// Reads MatchState and emits InputFrame so it can drive either the opponent OR
// any player slot with Autopilot enabled (deterministic, netplay-safe).
import { rngNext } from '../core/fixedmath';
import { fighterDistance } from '../sim/collision';
import { BTN_LH, BTN_LK, BTN_RH, BTN_RK, BTN_STANCE, type InputFrame, type MatchState } from '../sim/state';

export type AiDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface AiMemory {
  seed: number;
  cooldown: number;
  planMove: 'NONE' | 'QCF_RK' | 'QCF_LK' | 'JUGGLE_FOLLOW';
  planStep: number;
  blockHold: number;
}

export function createAiMemory(seed = 0x51a7beef): AiMemory {
  return { seed, cooldown: 0, planMove: 'NONE', planStep: 0, blockHold: 0 };
}

function nextRand(mem: AiMemory): number {
  const [v, s] = rngNext(mem.seed);
  mem.seed = s;
  return v;
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

  if (state.roundPhase !== 'FIGHT' || me.mode === 'KO') {
    return { dir: 5, buttons: 0 };
  }

  // Continue multi-frame motion plans (e.g., 2 -> 3 -> 6 + RK for Meia-Lua de Compasso)
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

  // Follow up launcher hits with Parafuso!
  if (opp.mode === 'JUGGLE' && me.mode === 'ATTACK' && me.moveId === 'au_batido' && me.moveFrame >= 15) {
    return { dir: 5, buttons: BTN_LK };
  }

  // Reaction & block check
  const reactionChance = diff === 'HARD' ? 0.78 : diff === 'MEDIUM' ? 0.48 : 0.22;
  if (opp.mode === 'ATTACK' && dist < 2.2 && mem.blockHold <= 0) {
    if (nextRand(mem) < reactionChance) {
      mem.blockHold = diff === 'HARD' ? 14 : 10;
    }
  }
  if (mem.blockHold > 0) {
    mem.blockHold -= 1;
    const lowBlock = opp.stance === 'RLX' || opp.moveId === 'rasteira';
    return { dir: lowBlock ? 1 : 4, buttons: 0 };
  }

  if (mem.cooldown > 0) {
    mem.cooldown -= 1;
    // Footwork while waiting
    if (dist > 2.3) return { dir: 6, buttons: 0 };
    if (dist < 1.05) return { dir: 4, buttons: 0 };
    return { dir: 5, buttons: 0 };
  }

  const r = nextRand(mem);
  const pace = diff === 'HARD' ? 8 : diff === 'MEDIUM' ? 14 : 24;

  // Stance-specific decisions
  if (me.stance === 'HSP') {
    mem.cooldown = pace;
    if (dist < 2.2) {
      if (r < 0.35) return { dir: 5, buttons: BTN_RK }; // Helicóptero
      if (r < 0.65) return { dir: 5, buttons: BTN_LK }; // Pião de Mão
      if (r < 0.82) return { dir: 6, buttons: BTN_RH }; // Aú de Frente
      return { dir: 4, buttons: BTN_LK }; // Aú de Uma Mão
    }
    return { dir: 5, buttons: BTN_STANCE };
  }

  if (me.stance === 'RLX') {
    mem.cooldown = pace;
    if (dist < 2.0) {
      if (r < 0.25) return { dir: 5, buttons: BTN_RK }; // Rasteira
      if (r < 0.45) return { dir: 5, buttons: BTN_LK }; // Chapa
      if (r < 0.6) return { dir: 5, buttons: BTN_LH }; // Cabeçada
      if (r < 0.72) return { dir: 3, buttons: BTN_RK }; // Corta Capim
      if (r < 0.84) return { dir: 5, buttons: BTN_LH | BTN_RH }; // Tesoura de Frente
      return { dir: 8, buttons: BTN_LK }; // Macaco escape
    }
    return { dir: 5, buttons: BTN_STANCE }; // Rolê / shift back
  }

  // GINGA stance offense & spacing
  if (dist > 2.6) {
    if (r < 0.24) {
      mem.cooldown = 18;
      return { dir: 6, buttons: BTN_STANCE }; // Aú forward!
    }
    if (r < 0.36) {
      mem.cooldown = 20;
      return { dir: 8, buttons: BTN_LK }; // Vôo do Morcego leap!
    }
    return { dir: 6, buttons: 0 };
  }

  if (dist > 1.75) {
    mem.cooldown = pace + 6;
    if (r < 0.22) {
      mem.planMove = 'QCF_RK';
      mem.planStep = 0;
      return { dir: 2, buttons: 0 };
    }
    if (r < 0.44) return { dir: 6, buttons: BTN_RK }; // Armada
    if (r < 0.62) return { dir: 6, buttons: BTN_LK }; // Queixada
    if (r < 0.76) return { dir: 4, buttons: BTN_LK }; // Meia-Lua de Frente
    if (r < 0.88) return { dir: 3, buttons: BTN_RK }; // Chapa Lateral
    return { dir: 6, buttons: 0 };
  }

  // Close range (< 1.75m)
  mem.cooldown = pace;
  if (r < 0.16) return { dir: 5, buttons: BTN_LK }; // Ponteira
  if (r < 0.28) return { dir: 5, buttons: BTN_RH }; // Galopante
  if (r < 0.4) return { dir: 5, buttons: BTN_LH }; // Bênção
  if (r < 0.52) return { dir: 2, buttons: BTN_RK }; // Aú Batido launcher!
  if (r < 0.64) return { dir: 5, buttons: BTN_RK }; // Martelo
  if (r < 0.74) return { dir: 5, buttons: BTN_LH | BTN_RH }; // Vingativa throw
  if (r < 0.82) return { dir: 6, buttons: BTN_LH }; // Joelhada knee!
  if (r < 0.89) return { dir: 1, buttons: BTN_RH }; // Cocorinha dodge
  if (r < 0.95) return { dir: 2, buttons: BTN_STANCE }; // Negativa
  return { dir: 8, buttons: BTN_STANCE }; // Bananeira
}
