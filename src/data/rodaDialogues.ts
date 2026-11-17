// Capoeira "Pergunta e Resposta" (Call & Answer) Choreography Catalog for Play / Show Mode.
import type { Style } from './characters';
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
  /** Capoeira lineage bias where this evasion feels most natural. */
  styles?: Style[];
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
  styles: Style[];
  steps: RodaSequenceStep[];
}

/** Curated HIGH-attack evasive answers (CRUSH_HIGH ducks, slips & low rolls). */
const HIGH_ANSWERS: DialogueAnswer[] = [
  { moveId: 'cocorinha', followUpId: 'queixada', minRange: 0.95, maxRange: 2.35, callout: 'COCORINHA!', styles: ['REGIONAL', 'MACULELE'] },
  { moveId: 'resistencia', followUpId: 'fuga', minRange: 0.95, maxRange: 2.35, callout: 'RESISTÊNCIA!', styles: ['REGIONAL', 'ANGOLA'] },
  { moveId: 'esquiva_lateral', followUpId: 'armada', minRange: 1.15, maxRange: 2.45, callout: 'ESQUIVA!', styles: ['REGIONAL', 'MACULELE'] },
  { moveId: 'esquiva_de_lado', followUpId: 'meia_lua_frente', minRange: 1.15, maxRange: 2.45, callout: 'ESQUIVA!', styles: ['REGIONAL', 'CONTEMPORANEA'] },
  { moveId: 'esquiva_de_frente', followUpId: 'bencao', minRange: 1.75, maxRange: 2.75, callout: 'ENTROU!', styles: ['REGIONAL'] },
  { moveId: 'esquiva_de_costas', followUpId: 'martelo', minRange: 0.85, maxRange: 2.25, callout: 'ESQUIVA!', styles: ['ANGOLA', 'REGIONAL'] },
  { moveId: 'ponte_para_tras', followUpId: 'meia_lua_compasso', minRange: 1.0, maxRange: 2.35, callout: 'PONTE!', styles: ['CONTEMPORANEA'] },
  { moveId: 'negativa', followUpId: 'role', minRange: 1.05, maxRange: 2.35, callout: 'NEGATIVA!', styles: ['REGIONAL', 'CONTEMPORANEA'] },
  { moveId: 'negativa_angola', followUpId: 'rasteira', minRange: 1.05, maxRange: 2.35, callout: 'ANGOLA!', styles: ['ANGOLA'] },
  { moveId: 'esquiva_baixa', followUpId: 'macaco', minRange: 1.0, maxRange: 2.35, callout: 'MALÍCIA!', styles: ['ANGOLA', 'CONTEMPORANEA'] },
  { moveId: 'troca_de_negativa', followUpId: 'corta_capim', minRange: 0.95, maxRange: 2.25, callout: 'TROCA!', styles: ['ANGOLA'] },
  { moveId: 'queda_de_rins', followUpId: 'role', minRange: 1.05, maxRange: 2.3, callout: 'QUEDA DE RINS!', styles: ['ANGOLA', 'CONTEMPORANEA'] },
  { moveId: 'role', followUpId: 'armada', minRange: 1.55, maxRange: 2.6, callout: 'ROLÊ!', styles: ['ANGOLA', 'REGIONAL'] },
  { moveId: 'fuga', followUpId: 'armada', minRange: 0.75, maxRange: 1.95, callout: 'FUGA!', styles: ['ANGOLA', 'CONTEMPORANEA'] },
];

/** Curated LOW-sweep evasive answers (CRUSH_LOW & INVULN cartwheels, handstands & flips). */
const LOW_ANSWERS: DialogueAnswer[] = [
  { moveId: 'au', followUpId: 'helicoptero', minRange: 0.9, maxRange: 2.6, callout: 'AÚ!', styles: ['REGIONAL', 'CONTEMPORANEA'] },
  { moveId: 'au_sem_mao', followUpId: 'armada', minRange: 1.0, maxRange: 2.7, callout: 'AÚ SEM MÃO!', styles: ['CONTEMPORANEA', 'REGIONAL'] },
  { moveId: 'au_fechado', followUpId: 'piao_mao', minRange: 0.9, maxRange: 2.5, callout: 'AÚ FECHADO!', styles: ['ANGOLA'] },
  { moveId: 'au_giratoria', followUpId: 'queixada', minRange: 1.0, maxRange: 2.6, callout: 'FLOREIO!', styles: ['CONTEMPORANEA', 'REGIONAL'] },
  { moveId: 'bananeira', followUpId: 'piao_mao', minRange: 0.8, maxRange: 2.3, callout: 'BANANEIRA!', styles: ['CONTEMPORANEA', 'ANGOLA'] },
  { moveId: 'mortal', minRange: 0.9, maxRange: 2.5, callout: 'SALTO MORTAL!', styles: ['CONTEMPORANEA'] },
  { moveId: 'macaco', followUpId: 'armada', minRange: 0.8, maxRange: 2.4, callout: 'MACACO!', styles: ['CONTEMPORANEA', 'ANGOLA'] },
  { moveId: 'macaquinho', followUpId: 'role', minRange: 0.7, maxRange: 2.3, callout: 'MACAQUINHO!', styles: ['CONTEMPORANEA', 'ANGOLA'] },
  { moveId: 'passagem_de_tesoura', followUpId: 'meia_lua_compasso', minRange: 0.8, maxRange: 2.3, callout: 'PASSAGEM!', styles: ['ANGOLA', 'REGIONAL'] },
  { moveId: 'helicoptero', minRange: 0.8, maxRange: 2.3, callout: 'HELICÓPTERO!', styles: ['CONTEMPORANEA'] },
  { moveId: 'piao_mao', minRange: 0.8, maxRange: 2.3, callout: 'PIÃO DE MÃO!', styles: ['CONTEMPORANEA'] },
];

/** Curated MID-strike evasive answers (lateral/retreating slips & acrobatic clears). */
const MID_ANSWERS: DialogueAnswer[] = [
  { moveId: 'esquiva_de_costas', followUpId: 'queixada', minRange: 0.7, maxRange: 2.4, callout: 'ESQUIVA!', styles: ['ANGOLA', 'REGIONAL'] },
  { moveId: 'esquiva_de_lado', followUpId: 'armada', minRange: 0.9, maxRange: 2.4, callout: 'GINGOU!', styles: ['REGIONAL', 'MACULELE'] },
  { moveId: 'esquiva_lateral', followUpId: 'meia_lua_frente', minRange: 0.9, maxRange: 2.4, callout: 'ESQUIVA!', styles: ['REGIONAL', 'MACULELE'] },
  { moveId: 'giro', followUpId: 'rasteira', minRange: 1.1, maxRange: 2.4, callout: 'GIRO!', styles: ['MACULELE', 'CONTEMPORANEA'] },
  { moveId: 'volta_de_lado', followUpId: 'martelo', minRange: 0.9, maxRange: 2.4, callout: 'VOLTA!', styles: ['CONTEMPORANEA', 'ANGOLA'] },
  { moveId: 'fuga', followUpId: 'negativa', minRange: 0.6, maxRange: 2.0, callout: 'FUGA!', styles: ['ANGOLA', 'CONTEMPORANEA'] },
  { moveId: 'mortal', minRange: 1.0, maxRange: 2.5, callout: 'VOOU!', styles: ['CONTEMPORANEA'] },
  { moveId: 'au', followUpId: 'helicoptero', minRange: 1.2, maxRange: 2.6, callout: 'AÚ!', styles: ['REGIONAL', 'ANGOLA'] },
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
    { moveId: 'bananeira', followUpId: 'piao_mao', minRange: 0.8, maxRange: 2.4, callout: 'BANANEIRA!', styles: ['CONTEMPORANEA'] },
    { moveId: 'au_fechado', followUpId: 'helicoptero', minRange: 0.9, maxRange: 2.5, callout: 'AÚ!', styles: ['ANGOLA'] },
    { moveId: 'mortal', minRange: 0.9, maxRange: 2.5, callout: 'VOOU!', styles: ['CONTEMPORANEA'] },
  ],
  chamada: [
    { moveId: 'esquiva_de_frente', followUpId: 'rasteira', minRange: 0.7, maxRange: 2.5, callout: 'CHAMADA!', styles: ['ANGOLA'] },
    { moveId: 'balanca', followUpId: 'cabecada', minRange: 0.7, maxRange: 2.5, callout: 'MALÍCIA!', styles: ['ANGOLA', 'REGIONAL'] },
    { moveId: 'volta_ao_mundo', followUpId: 'meia_lua_frente', minRange: 0.8, maxRange: 2.6, callout: 'VOLTA AO MUNDO!', styles: ['ANGOLA'] },
  ],
  volta_ao_mundo: [
    { moveId: 'balanca', followUpId: 'queixada', minRange: 0.8, maxRange: 2.8, callout: 'RODA!', styles: ['ANGOLA', 'REGIONAL'] },
    { moveId: 'au_fechado', followUpId: 'negativa_angola', minRange: 0.8, maxRange: 2.8, callout: 'AÚ!', styles: ['ANGOLA'] },
  ],
};

/** Playable Pergunta moves ranked for readable, photogenic Show Mode dialogue calls. */
export const SHOW_CALL_MOVES: {
  close: string[];
  mid: string[];
  advance: string[];
} = {
  close: ['galopante', 'ponteira', 'bencao', 'rasteira', 'esquiva_lateral', 'chamada'],
  mid: ['armada', 'queixada', 'meia_lua_frente', 'martelo', 'rasteira', 'meia_lua_compasso', 'corta_capim', 'chapa_lateral'],
  advance: ['au', 'macaco', 'au_sem_mao', 'role', 'balanca', 'volta_ao_mundo'],
};

/** Traditional Capoeira multi-beat duet motifs performed continuously in Show Mode. */
export const RODA_SEQUENCES: RodaSequence[] = [
  {
    id: 'regional_classic',
    name: 'Sequência Regional 1 (Bimba)',
    styles: ['REGIONAL'],
    steps: [
      { callMoveId: 'meia_lua_frente', preferredAnswerId: 'cocorinha' },
      { callMoveId: 'armada', preferredAnswerId: 'cocorinha' },
      { callMoveId: 'queixada', preferredAnswerId: 'esquiva_de_costas' },
      { callMoveId: 'bencao', preferredAnswerId: 'esquiva_de_lado' },
    ],
  },
  {
    id: 'regional_sequencia_2',
    name: 'Sequência Regional 2 & 3 (Bimba)',
    styles: ['REGIONAL'],
    steps: [
      { callMoveId: 'queixada', preferredAnswerId: 'esquiva_de_costas' },
      { callMoveId: 'martelo', preferredAnswerId: 'resistencia' },
      { callMoveId: 'rasteira', preferredAnswerId: 'au' },
      { callMoveId: 'galopante', preferredAnswerId: 'esquiva_lateral' },
    ],
  },
  {
    id: 'angola_malicia',
    name: 'Diálogo de Angola (Jogo de Dentro)',
    styles: ['ANGOLA'],
    steps: [
      { callMoveId: 'meia_lua_compasso', preferredAnswerId: 'negativa_angola' },
      { callMoveId: 'rasteira', preferredAnswerId: 'au_fechado' },
      { callMoveId: 'martelo', preferredAnswerId: 'esquiva_baixa' },
      { callMoveId: 'corta_capim', preferredAnswerId: 'macaco' },
    ],
  },
  {
    id: 'angola_chamada_ritual',
    name: 'Chamada e Malícia de Angola',
    styles: ['ANGOLA'],
    steps: [
      { callMoveId: 'chamada', preferredAnswerId: 'esquiva_de_frente' },
      { callMoveId: 'chapa_lateral', preferredAnswerId: 'negativa_angola' },
      { callMoveId: 'rasteira', preferredAnswerId: 'queda_de_rins' },
      { callMoveId: 'meia_lua_compasso', preferredAnswerId: 'fuga' },
    ],
  },
  {
    id: 'floreio_duet',
    name: 'Minhoquinho & Floreio Contemporâneo',
    styles: ['CONTEMPORANEA'],
    steps: [
      { callMoveId: 'armada', preferredAnswerId: 'ponte_para_tras' },
      { callMoveId: 'corta_capim', preferredAnswerId: 'au_sem_mao' },
      { callMoveId: 'bencao', preferredAnswerId: 'esquiva_de_lado' },
      { callMoveId: 'chicote', preferredAnswerId: 'esquiva_baixa' },
    ],
  },
  {
    id: 'maculele_rhythm_duet',
    name: 'Maculelê Cadence Duet',
    styles: ['MACULELE'],
    steps: [
      { callMoveId: 'galopante', preferredAnswerId: 'esquiva_lateral' },
      { callMoveId: 'armada', preferredAnswerId: 'cocorinha' },
      { callMoveId: 'meia_lua_frente', preferredAnswerId: 'giro' },
      { callMoveId: 'chapa_lateral', preferredAnswerId: 'esquiva_de_costas' },
    ],
  },
];

function poolForLevel(level: HitLevel): DialogueAnswer[] {
  if (level === 'HIGH') return HIGH_ANSWERS;
  if (level === 'LOW') return LOW_ANSWERS;
  return MID_ANSWERS;
}

/** Pick the best supportive dodge/vault move for an incoming attack move at a given distance, stance, and Style. */
export function selectDialogueAnswer(
  attMove: MoveDef,
  defStance: Stance,
  dist: number,
  rngIndex: number,
  preferredId?: string,
  defStyle?: Style,
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

  // Highest match: Style + Stance + Range so Angola answers low & Regional answers crisp!
  if (defStyle) {
    const styleStanceRange = candidates.filter((a) => {
      const m = MOVE_BY_ID[a.moveId]!;
      return (!a.styles || a.styles.includes(defStyle)) && m.from.includes(defStance) && dist >= a.minRange && dist <= a.maxRange;
    });
    if (styleStanceRange.length > 0) {
      return styleStanceRange[rngIndex % styleStanceRange.length];
    }

    const styleRange = candidates.filter(
      (a) => (!a.styles || a.styles.includes(defStyle)) && dist >= a.minRange && dist <= a.maxRange,
    );
    if (styleRange.length > 0) {
      return styleRange[rngIndex % styleRange.length];
    }
  }

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
