// Capoeira "Pergunta e Resposta" (Call & Answer) Choreography Catalog for Play / Show Mode.
import { MOVE_BY_ID, type HitLevel, type MoveDef, type Stance } from './moves';

export interface DialogueAnswer {
  /** Move ID of the supportive dodging / vaulting answer. */
  moveId: string;
  /** Optional follow-up move ID to launch smoothly into the next phrase after dodging. */
  followUpId?: string;
  /** Acceptable distance window (meters) where this dodge looks best without colliding. */
  minRange: number;
  maxRange: number;
  /** Optional display label on HUD when this answer succeeds (e.g. "ESQUIVA!", "AÚ!"). */
  callout: string;
}

export interface RodaSequenceStep {
  /** Move launched by caller; partner automatically looks up a timed DialogueAnswer. */
  callMoveId: string;
  /** Preferred response override for this specific beat in the curated sequence. */
  preferredAnswerId?: string;
}

export interface RodaSequence {
  id: string;
  name: string;
  steps: RodaSequenceStep[];
}

/** Curated HIGH-attack evasive answers (CRUSH_HIGH ducks, slips & low rolls). */
const HIGH_ANSWERS: DialogueAnswer[] = [
  { moveId: 'cocorinha', followUpId: 'queixada', minRange: 0.95, maxRange: 2.35, callout: 'COCORINHA!' },
  { moveId: 'resistencia', followUpId: 'fuga', minRange: 0.95, maxRange: 2.35, callout: 'RESISTÊNCIA!' },
  { moveId: 'esquiva_lateral', followUpId: 'armada', minRange: 1.15, maxRange: 2.45, callout: 'ESQUIVA!' },
  { moveId: 'esquiva_de_lado', followUpId: 'meia_lua_frente', minRange: 1.15, maxRange: 2.45, callout: 'ESQUIVA!' },
  { moveId: 'esquiva_de_frente', followUpId: 'bencao', minRange: 1.75, maxRange: 2.75, callout: 'ENTROU!' },
  { moveId: 'esquiva_de_costas', followUpId: 'martelo', minRange: 0.85, maxRange: 2.25, callout: 'ESQUIVA!' },
  { moveId: 'ponte_para_tras', followUpId: 'meia_lua_compasso', minRange: 1.0, maxRange: 2.35, callout: 'PONTE!' },
  { moveId: 'negativa', followUpId: 'role', minRange: 1.05, maxRange: 2.35, callout: 'NEGATIVA!' },
  { moveId: 'negativa_angola', followUpId: 'rasteira', minRange: 1.05, maxRange: 2.35, callout: 'ANGOLA!' },
  { moveId: 'esquiva_baixa', followUpId: 'macaco', minRange: 1.0, maxRange: 2.35, callout: 'MALÍCIA!' },
  { moveId: 'troca_de_negativa', followUpId: 'corta_capim', minRange: 0.95, maxRange: 2.25, callout: 'TROCA!' },
  { moveId: 'queda_de_rins', followUpId: 'role', minRange: 1.05, maxRange: 2.3, callout: 'QUEDA DE RINS!' },
  { moveId: 'role', followUpId: 'armada', minRange: 1.55, maxRange: 2.6, callout: 'ROLÊ!' },
  { moveId: 'fuga', followUpId: 'armada', minRange: 0.75, maxRange: 1.95, callout: 'FUGA!' },
];

/** Curated LOW-sweep evasive answers (CRUSH_LOW & INVULN cartwheels, handstands & flips). */
const LOW_ANSWERS: DialogueAnswer[] = [
  { moveId: 'au', followUpId: 'helicoptero', minRange: 0.9, maxRange: 2.6, callout: 'AÚ!' },
  { moveId: 'au_sem_mao', followUpId: 'armada', minRange: 1.0, maxRange: 2.7, callout: 'AÚ SEM MÃO!' },
  { moveId: 'au_fechado', followUpId: 'piao_mao', minRange: 0.9, maxRange: 2.5, callout: 'AÚ FECHADO!' },
  { moveId: 'au_giratoria', followUpId: 'queixada', minRange: 1.0, maxRange: 2.6, callout: 'FLOREIO!' },
  { moveId: 'bananeira', followUpId: 'piao_mao', minRange: 0.8, maxRange: 2.3, callout: 'BANANEIRA!' },
  { moveId: 'mortal', minRange: 0.9, maxRange: 2.5, callout: 'SALTO MORTAL!' },
  { moveId: 'macaco', followUpId: 'armada', minRange: 0.8, maxRange: 2.4, callout: 'MACACO!' },
  { moveId: 'macaquinho', followUpId: 'role', minRange: 0.7, maxRange: 2.3, callout: 'MACAQUINHO!' },
  { moveId: 'passagem_de_tesoura', followUpId: 'meia_lua_compasso', minRange: 0.8, maxRange: 2.3, callout: 'PASSAGEM!' },
  { moveId: 'helicoptero', minRange: 0.8, maxRange: 2.3, callout: 'HELICÓPTERO!' },
  { moveId: 'piao_mao', minRange: 0.8, maxRange: 2.3, callout: 'PIÃO DE MÃO!' },
];

/** Curated MID-strike evasive answers (lateral/retreating slips & acrobatic clears). */
const MID_ANSWERS: DialogueAnswer[] = [
  { moveId: 'esquiva_de_costas', followUpId: 'queixada', minRange: 0.7, maxRange: 2.4, callout: 'ESQUIVA!' },
  { moveId: 'esquiva_de_lado', followUpId: 'armada', minRange: 0.9, maxRange: 2.4, callout: 'GINGOU!' },
  { moveId: 'esquiva_lateral', followUpId: 'meia_lua_frente', minRange: 0.9, maxRange: 2.4, callout: 'ESQUIVA!' },
  { moveId: 'giro', followUpId: 'rasteira', minRange: 1.1, maxRange: 2.4, callout: 'GIRO!' },
  { moveId: 'volta_de_lado', followUpId: 'martelo', minRange: 0.9, maxRange: 2.4, callout: 'VOLTA!' },
  { moveId: 'fuga', followUpId: 'negativa', minRange: 0.6, maxRange: 2.0, callout: 'FUGA!' },
  { moveId: 'mortal', minRange: 1.0, maxRange: 2.5, callout: 'VOOU!' },
  { moveId: 'au', followUpId: 'helicoptero', minRange: 1.2, maxRange: 2.6, callout: 'AÚ!' },
];

/** Specific move-by-move paired callouts so iconic Capoeira calls draw signature replies. */
export const MOVE_SPECIFIC_ANSWERS: Record<string, DialogueAnswer[]> = {
  armada: [
    { moveId: 'cocorinha', followUpId: 'queixada', minRange: 0.7, maxRange: 2.4, callout: 'COCORINHA!' },
    { moveId: 'resistencia', followUpId: 'role', minRange: 0.8, maxRange: 2.4, callout: 'RESISTÊNCIA!' },
    { moveId: 'ponte_para_tras', followUpId: 'au', minRange: 0.9, maxRange: 2.4, callout: 'PONTE!' },
  ],
  queixada: [
    { moveId: 'esquiva_de_costas', followUpId: 'armada', minRange: 0.7, maxRange: 2.4, callout: 'ESQUIVA!' },
    { moveId: 'esquiva_de_lado', followUpId: 'rasteira', minRange: 0.9, maxRange: 2.4, callout: 'ESQUIVA!' },
    { moveId: 'mortal', minRange: 1.0, maxRange: 2.5, callout: 'SALTO MORTAL!' },
  ],
  meia_lua_compasso: [
    { moveId: 'esquiva_de_costas', followUpId: 'meia_lua_frente', minRange: 0.8, maxRange: 2.4, callout: 'ESQUIVOU!' },
    { moveId: 'mortal', minRange: 1.0, maxRange: 2.5, callout: 'VOOU POR CIMA!' },
    { moveId: 'fuga', followUpId: 'au', minRange: 0.7, maxRange: 2.2, callout: 'MALÍCIA!' },
  ],
  bencao: [
    { moveId: 'esquiva_de_lado', followUpId: 'queixada', minRange: 0.8, maxRange: 2.4, callout: 'SAIU DE LADO!' },
    { moveId: 'esquiva_de_costas', followUpId: 'martelo', minRange: 0.7, maxRange: 2.3, callout: 'ESQUIVA!' },
    { moveId: 'giro', followUpId: 'armada', minRange: 1.1, maxRange: 2.4, callout: 'GIRO!' },
  ],
  rasteira: [
    { moveId: 'au', followUpId: 'helicoptero', minRange: 0.9, maxRange: 2.5, callout: 'AÚ NO TEMPO!' },
    { moveId: 'au_sem_mao', followUpId: 'armada', minRange: 1.0, maxRange: 2.6, callout: 'AÚ SEM MÃO!' },
    { moveId: 'macaco', followUpId: 'queixada', minRange: 0.8, maxRange: 2.4, callout: 'MACACO!' },
  ],
  corta_capim: [
    { moveId: 'bananeira', followUpId: 'piao_mao', minRange: 0.8, maxRange: 2.4, callout: 'BANANEIRA!' },
    { moveId: 'au_fechado', followUpId: 'helicoptero', minRange: 0.9, maxRange: 2.5, callout: 'AÚ!' },
    { moveId: 'mortal', minRange: 0.9, maxRange: 2.5, callout: 'VOOU!' },
  ],
};

/** Playable Pergunta moves ranked for readable, photogenic Show Mode dialogue calls. */
export const SHOW_CALL_MOVES: {
  close: string[];
  mid: string[];
  advance: string[];
} = {
  close: ['galopante', 'ponteira', 'bencao', 'rasteira', 'esquiva_lateral'],
  mid: ['armada', 'queixada', 'meia_lua_frente', 'martelo', 'rasteira', 'meia_lua_compasso', 'corta_capim', 'chapa_lateral'],
  advance: ['au', 'macaco', 'au_sem_mao', 'role', 'balanca'],
};

/** Traditional Capoeira multi-beat duet motifs performed continuously in Show Mode. */
export const RODA_SEQUENCES: RodaSequence[] = [
  {
    id: 'regional_classic',
    name: 'Sequência Regional',
    steps: [
      { callMoveId: 'queixada', preferredAnswerId: 'esquiva_de_costas' },
      { callMoveId: 'armada', preferredAnswerId: 'cocorinha' },
      { callMoveId: 'rasteira', preferredAnswerId: 'au' },
      { callMoveId: 'meia_lua_frente', preferredAnswerId: 'resistencia' },
    ],
  },
  {
    id: 'angola_malicia',
    name: 'Diálogo de Angola',
    steps: [
      { callMoveId: 'meia_lua_compasso', preferredAnswerId: 'esquiva_de_costas' },
      { callMoveId: 'martelo', preferredAnswerId: 'negativa_angola' },
      { callMoveId: 'corta_capim', preferredAnswerId: 'macaco' },
      { callMoveId: 'chapa_lateral', preferredAnswerId: 'volta_de_lado' },
    ],
  },
  {
    id: 'floreio_duet',
    name: 'Jogo de Floreio',
    steps: [
      { callMoveId: 'armada', preferredAnswerId: 'ponte_para_tras' },
      { callMoveId: 'rasteira', preferredAnswerId: 'au_sem_mao' },
      { callMoveId: 'bencao', preferredAnswerId: 'esquiva_de_lado' },
      { callMoveId: 'chicote', preferredAnswerId: 'esquiva_baixa' },
    ],
  },
];

function poolForLevel(level: HitLevel): DialogueAnswer[] {
  if (level === 'HIGH') return HIGH_ANSWERS;
  if (level === 'LOW') return LOW_ANSWERS;
  return MID_ANSWERS;
}

/** Pick the best supportive dodge/vault move for an incoming attack move at a given distance and stance. */
export function selectDialogueAnswer(
  attMove: MoveDef,
  defStance: Stance,
  dist: number,
  rngIndex: number,
  preferredId?: string,
): DialogueAnswer {
  const firstHit = attMove.hits[0];
  const level: HitLevel = firstHit?.level ?? 'MID';

  if (preferredId && MOVE_BY_ID[preferredId]) {
    const specific = (MOVE_SPECIFIC_ANSWERS[attMove.id] ?? []).concat(poolForLevel(level));
    const found = specific.find((a) => a.moveId === preferredId);
    if (found && dist >= found.minRange - 0.25 && dist <= found.maxRange + 0.35) {
      return found;
    }
  }

  const specific = MOVE_SPECIFIC_ANSWERS[attMove.id] ?? [];
  const general = poolForLevel(level);
  const candidates = [...specific, ...general].filter((a) => MOVE_BY_ID[a.moveId]);

  // Prefer stance-native answers in ideal distance window so transitions look physically fluid.
  const stanceAndRange = candidates.filter((a) => {
    const m = MOVE_BY_ID[a.moveId]!;
    return m.from.includes(defStance) && dist >= a.minRange && dist <= a.maxRange;
  });
  if (stanceAndRange.length > 0) {
    return stanceAndRange[rngIndex % stanceAndRange.length];
  }

  const inRange = candidates.filter((a) => dist >= a.minRange && dist <= a.maxRange);
  if (inRange.length > 0) {
    return inRange[rngIndex % inRange.length];
  }

  const stanceNative = candidates.filter((a) => MOVE_BY_ID[a.moveId]!.from.includes(defStance));
  if (stanceNative.length > 0) {
    return stanceNative[rngIndex % stanceNative.length];
  }

  return candidates[rngIndex % candidates.length] ?? { moveId: 'cocorinha', minRange: 0, maxRange: 4, callout: 'ESQUIVA!' };
}

/** Used by Showcase ("Pair Reply" toggle) and HUD hints to pick an automatic partner reply for any move. */
export function getShowcasePairReply(moveId: string): DialogueAnswer | null {
  const m = MOVE_BY_ID[moveId];
  if (!m) return null;
  if (m.hits.length === 0) {
    // If inspecting an evasion/floreio itself, have dummy throw the iconic kick it counters!
    const crush = m.hurtboxOverrides?.[0]?.profile;
    if (crush === 'CRUSH_LOW' || crush === 'INVULN') {
      return { moveId: 'rasteira', minRange: 0, maxRange: 4, callout: 'RASTEIRA UNDERNEATH' };
    }
    return { moveId: 'armada', minRange: 0, maxRange: 4, callout: 'ARMADA OVERHEAD' };
  }
  return selectDialogueAnswer(m, 'GINGA', 1.65, 0);
}
