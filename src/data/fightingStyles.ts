// Style grammar and per-character fighting profiles derived from Capoeira Angola,
// Capoeira Regional (Mestre Bimba's 8 Sequências & Cintura Desprezada), and Floreio sequences.
import type { Style } from './characters';
import type { Stance } from './moves';

export interface FlowCombo {
  id: string;
  name: string;
  steps: string[];
  minDist: number;
  maxDist: number;
  startStance: Stance;
  weight: number;
}

export interface StyleFlowSpec {
  id: Style;
  label: string;
  summary: string;
  idealRange: [number, number];
  /** Probability of patient waiting / baiting cadence in neutral pause windows. */
  patienceBias: number;
  /** Probability weights when picking next stance transition out of GINGA. */
  rlxAffinity: number;
  hspAffinity: number;
  /** Deterministic biomechanical posture modifiers applied in GINGA / WALK. */
  crouchFlexRad: number; // + bends thighs/knees lower (Angola low base)
  torsoLeanRad: number;  // + leans chest forward/crouched, - lifts upright (Regional verticality)
  guardSpreadRad: number; // outward abduction on arms
  swayBounceAmp: number; // idle vertical/knee bounce expression
  standingPool: string[];
  evasionPool: string[];
}

export interface CharacterFlowProfile {
  charId: string;
  archetypeTag: string;
  specialty: string;
  preferredShowStyle?: Style;
  /** Optional subtle tempo scaling over style defaults (1.0 = style default cadence). */
  tempoMul: number;
  /** Affinity biases toward throws, spins, aerials, or traps. */
  spinBias: number;
  throwBias: number;
  trapBias: number;
  acroBias: number;
  combos: FlowCombo[];
}

export const STYLE_FLOW_SPECS: Record<Style, StyleFlowSpec> = {
  ANGOLA: {
    id: 'ANGOLA',
    label: 'Capoeira Angola',
    summary: 'Low center-of-gravity malícia, Chamada traps, Cabeçada, and floor Negativa ↔ Rolê ↔ Tesoura dialogue.',
    idealRange: [1.0, 1.9],
    patienceBias: 0.28,
    rlxAffinity: 0.56,
    hspAffinity: 0.14,
    crouchFlexRad: 0.16,
    torsoLeanRad: 0.1,
    guardSpreadRad: 0.08,
    swayBounceAmp: 0.03,
    standingPool: [
      'balanca',
      'chamada',
      'meia_lua_compasso',
      'meia_lua_frente',
      'bencao',
      'au_fechado',
      'volta_ao_mundo',
      'esquiva_lateral',
    ],
    evasionPool: [
      'negativa_angola',
      'esquiva_baixa',
      'queda_de_tres',
      'cocorinha',
      'resistencia',
      'chamada',
    ],
  },
  REGIONAL: {
    id: 'REGIONAL',
    label: 'Capoeira Regional',
    summary: 'Upright, explosive Mestre Bimba Sequências chaining Queixada, Armada, Martelo, Bênção & Aú → Rolê.',
    idealRange: [1.35, 2.35],
    patienceBias: 0.06,
    rlxAffinity: 0.22,
    hspAffinity: 0.2,
    crouchFlexRad: -0.05,
    torsoLeanRad: -0.08,
    guardSpreadRad: 0.02,
    swayBounceAmp: 0.05,
    standingPool: [
      'ponteira',
      'galopante',
      'bencao',
      'martelo',
      'queixada',
      'armada',
      'meia_lua_frente',
      'meia_lua_compasso',
      'au_batido',
      'chapa_lateral',
      'vingativa',
    ],
    evasionPool: [
      'cocorinha',
      'esquiva_lateral',
      'esquiva_de_frente',
      'resistencia',
      'au',
    ],
  },
  CONTEMPORANEA: {
    id: 'CONTEMPORANEA',
    label: 'Contemporânea / Floreio',
    summary: 'Athletic ground-to-air loops merging Benguela floor work, Bananeira handstands, Macaco & aerial flips.',
    idealRange: [1.4, 2.55],
    patienceBias: 0.12,
    rlxAffinity: 0.36,
    hspAffinity: 0.42,
    crouchFlexRad: 0.04,
    torsoLeanRad: 0.0,
    guardSpreadRad: 0.05,
    swayBounceAmp: 0.07,
    standingPool: [
      'armada',
      'queixada',
      'meia_lua_compasso',
      'au',
      'bananeira',
      'bananeira_de_cabeca',
      'armada_dupla',
      'mariposa',
      'folha_seca',
      'chapeu_de_couro',
    ],
    evasionPool: [
      'esquiva_de_lado',
      'ponte_para_tras',
      'escala',
      'au_sem_mao',
      'mortal',
      'negativa',
    ],
  },
  MACULELE: {
    id: 'MACULELE',
    label: 'Maculelê Rhythm',
    summary: 'Downbeat-synced sweeping slashes, leaping cuts & wide lateral turns following Atabaque percussive pulse.',
    idealRange: [1.25, 2.15],
    patienceBias: 0.08,
    rlxAffinity: 0.18,
    hspAffinity: 0.24,
    crouchFlexRad: 0.02,
    torsoLeanRad: -0.04,
    guardSpreadRad: 0.14,
    swayBounceAmp: 0.06,
    standingPool: [
      'galopante',
      'armada',
      'meia_lua_frente',
      'martelo',
      'queixada',
      'chapa_giratoria',
      'giro',
      'au_chibata',
    ],
    evasionPool: [
      'esquiva_lateral',
      'giro',
      'cocorinha',
      'esquiva_de_costas',
    ],
  },
};

export const CHAR_FIGHTING_PROFILES: Record<string, CharacterFlowProfile> = {
  faisca: {
    charId: 'faisca',
    archetypeTag: 'REGIONAL · BIMBA SEQUÊNCIAS',
    specialty: 'Chains Queixada → Armada → Meia-Lua de Compasso & Aú Batido → Parafuso launch combos.',
    tempoMul: 0.88,
    spinBias: 0.72,
    throwBias: 0.25,
    trapBias: 0.15,
    acroBias: 0.65,
    combos: [
      {
        id: 'bimba_seq1',
        name: 'Sequência 1 (Meia-Lua → Armada → Aú)',
        steps: ['meia_lua_frente', 'armada', 'au', 'bananeira'],
        minDist: 1.25,
        maxDist: 2.5,
        startStance: 'GINGA',
        weight: 1.35,
      },
      {
        id: 'bimba_seq2',
        name: 'Sequência 2 (Queixada → Armada → Compasso)',
        steps: ['queixada', 'armada', 'meia_lua_compasso'],
        minDist: 1.3,
        maxDist: 2.45,
        startStance: 'GINGA',
        weight: 1.3,
      },
      {
        id: 'spark_launch',
        name: 'Aú Batido → Parafuso Launcher',
        steps: ['ponteira', 'au_batido', 'parafuso'],
        minDist: 0.9,
        maxDist: 1.9,
        startStance: 'GINGA',
        weight: 1.2,
      },
      {
        id: 'dodging_counter',
        name: 'Cocorinha → Bênção → Aú',
        steps: ['cocorinha', 'bencao', 'au'],
        minDist: 1.1,
        maxDist: 2.2,
        startStance: 'GINGA',
        weight: 1.0,
      },
    ],
  },
  jacare: {
    charId: 'jacare',
    archetypeTag: 'ANGOLA · MALÍCIA & CHAMADA',
    specialty: 'Patient ultra-low Ginga, Chamada trap openings, Negativa de Angola → Cabeçada & Rasteira de Mão.',
    tempoMul: 1.28,
    spinBias: 0.35,
    throwBias: 0.65,
    trapBias: 0.92,
    acroBias: 0.15,
    combos: [
      {
        id: 'angola_chamada_trap',
        name: 'Chamada → Cabeçada → Tesoura',
        steps: ['chamada', 'cabecada', 'tesoura_de_frente'],
        minDist: 0.9,
        maxDist: 2.0,
        startStance: 'GINGA',
        weight: 1.5,
      },
      {
        id: 'angola_spiderweb',
        name: 'Negativa de Angola → Troca → Rasteira de Mão',
        steps: ['negativa_angola', 'troca_de_negativa', 'rasteira_de_mao'],
        minDist: 0.85,
        maxDist: 2.0,
        startStance: 'RLX',
        weight: 1.45,
      },
      {
        id: 'rabo_de_arraia_flow',
        name: 'Compasso → Negativa de Angola → Boca de Calça',
        steps: ['meia_lua_compasso', 'negativa_angola', 'boca_de_calca'],
        minDist: 1.05,
        maxDist: 2.2,
        startStance: 'GINGA',
        weight: 1.2,
      },
      {
        id: 'volta_reset',
        name: 'Volta ao Mundo → Balança → Chamada',
        steps: ['volta_ao_mundo', 'balanca', 'chamada'],
        minDist: 1.4,
        maxDist: 2.8,
        startStance: 'GINGA',
        weight: 0.95,
      },
    ],
  },
  morcego: {
    charId: 'morcego',
    archetypeTag: 'CONTEMPORÂNEA · BANANEIRA',
    specialty: 'Inverts immediately into Bananeira, Queda de Rins, Helicóptero, Pião de Mão & Xangô.',
    tempoMul: 0.92,
    spinBias: 0.55,
    throwBias: 0.18,
    trapBias: 0.25,
    acroBias: 0.95,
    combos: [
      {
        id: 'morcego_inverted_web',
        name: 'Aú → Bananeira → Helicóptero',
        steps: ['au', 'bananeira', 'helicoptero'],
        minDist: 1.15,
        maxDist: 2.55,
        startStance: 'GINGA',
        weight: 1.55,
      },
      {
        id: 'morcego_hsp_chain',
        name: 'Pião de Mão → Helicóptero → Queda de Rins',
        steps: ['piao_mao', 'helicoptero'],
        minDist: 0.85,
        maxDist: 2.1,
        startStance: 'HSP',
        weight: 1.4,
      },
      {
        id: 'morcego_qdr_floreio',
        name: 'Queda de Rins → Pião de Mão',
        steps: ['queda_de_rins', 'piao_mao'],
        minDist: 0.9,
        maxDist: 2.0,
        startStance: 'RLX',
        weight: 1.25,
      },
      {
        id: 'morcego_scorp',
        name: 'Bananeira → Escorpião',
        steps: ['bananeira', 'escorpiao'],
        minDist: 0.95,
        maxDist: 2.25,
        startStance: 'GINGA',
        weight: 1.15,
      },
    ],
  },
  touro: {
    charId: 'touro',
    archetypeTag: 'REGIONAL · CINTURA DESPREZADA',
    specialty: 'Heavyweight advance behind Galopante & Bênção into Vingativa, Arrastão, Cruz & Banda throws.',
    tempoMul: 1.18,
    spinBias: 0.3,
    throwBias: 0.95,
    trapBias: 0.4,
    acroBias: 0.18,
    combos: [
      {
        id: 'touro_bimba4',
        name: 'Sequência 4 (Galopante → Joelhada → Arrastão)',
        steps: ['galopante', 'joelhada', 'arrastao'],
        minDist: 0.85,
        maxDist: 2.1,
        startStance: 'GINGA',
        weight: 1.5,
      },
      {
        id: 'touro_bencao_vingativa',
        name: 'Bênção → Vingativa Takedown',
        steps: ['bencao', 'vingativa'],
        minDist: 0.95,
        maxDist: 2.0,
        startStance: 'GINGA',
        weight: 1.4,
      },
      {
        id: 'touro_cruz',
        name: 'Esquiva de Frente → Vingativa',
        steps: ['esquiva_de_frente', 'vingativa'],
        minDist: 0.9,
        maxDist: 1.95,
        startStance: 'GINGA',
        weight: 1.2,
      },
      {
        id: 'touro_sweep',
        name: 'Negativa → Cabeçada → Tesoura de Frente',
        steps: ['negativa', 'cabecada', 'tesoura_de_frente'],
        minDist: 0.85,
        maxDist: 1.95,
        startStance: 'GINGA',
        weight: 1.1,
      },
    ],
  },
  quebra: {
    charId: 'quebra',
    archetypeTag: 'CONTEMPORÂNEA · BREAK-CAPOEIRA',
    specialty: 'Fuses freezes and spins: Corrupio → Corta Capim → Macaquinho → S-Dobrado & Mola.',
    tempoMul: 0.86,
    spinBias: 0.78,
    throwBias: 0.35,
    trapBias: 0.45,
    acroBias: 0.85,
    combos: [
      {
        id: 'quebra_freeze_spin',
        name: 'Queda de Rins → Relógio → S-Dobrado',
        steps: ['queda_de_rins', 'relogio'],
        minDist: 0.9,
        maxDist: 2.1,
        startStance: 'RLX',
        weight: 1.45,
      },
      {
        id: 'quebra_corrupio',
        name: 'Corrupio → Corta Capim → Aú Queda de Rins',
        steps: ['corrupio', 'corta_capim', 'au_queda_de_rins'],
        minDist: 0.95,
        maxDist: 2.25,
        startStance: 'RLX',
        weight: 1.4,
      },
      {
        id: 'quebra_kip',
        name: 'Mola → S-Dobrado',
        steps: ['mola', 's_dobrado'],
        minDist: 1.1,
        maxDist: 2.35,
        startStance: 'RLX',
        weight: 1.25,
      },
      {
        id: 'quebra_toprock',
        name: 'Aú Queda de Rins → Volta por Cima',
        steps: ['au_queda_de_rins', 'volta_por_cima'],
        minDist: 1.2,
        maxDist: 2.6,
        startStance: 'HSP',
        weight: 1.15,
      },
    ],
  },
  grima: {
    charId: 'grima',
    archetypeTag: 'MACULELÊ · RHYTHM DUALIST',
    specialty: 'Time-locked twin-grima slashes & leaping Aú Chibata chains empowered on downbeats.',
    tempoMul: 0.96,
    spinBias: 0.65,
    throwBias: 0.3,
    trapBias: 0.3,
    acroBias: 0.6,
    combos: [
      {
        id: 'grima_chibata',
        name: 'Aú Queda de Rins → Aú Chibata → Aú Trançado',
        steps: ['au_queda_de_rins', 'au_chibata', 'au_trancado'],
        minDist: 1.2,
        maxDist: 2.6,
        startStance: 'HSP',
        weight: 1.45,
      },
      {
        id: 'grima_slash_rush',
        name: 'Galopante → Armada → Meia-Lua de Compasso',
        steps: ['galopante', 'armada', 'meia_lua_compasso'],
        minDist: 1.0,
        maxDist: 2.2,
        startStance: 'GINGA',
        weight: 1.4,
      },
      {
        id: 'grima_sidestep_cut',
        name: 'Esquiva Lateral → Armada → Aú',
        steps: ['esquiva_lateral', 'armada', 'au'],
        minDist: 1.1,
        maxDist: 2.3,
        startStance: 'GINGA',
        weight: 1.2,
      },
    ],
  },
  orbita: {
    charId: 'orbita',
    archetypeTag: 'CONTEMPORÂNEA · ZERO-G ACROBAT',
    specialty: 'Aerial arcs & high-elevation juggles chaining Aú sem Mão → Armada Dupla → Folha Seca & Mariposa.',
    tempoMul: 0.95,
    spinBias: 0.74,
    throwBias: 0.2,
    trapBias: 0.25,
    acroBias: 0.98,
    combos: [
      {
        id: 'orbita_zero_g',
        name: 'Aú sem Mão → Armada Dupla → Folha Seca',
        steps: ['au_sem_mao', 'armada_dupla', 'folha_seca'],
        minDist: 1.35,
        maxDist: 2.75,
        startStance: 'HSP',
        weight: 1.5,
      },
      {
        id: 'orbita_floreio_drop',
        name: 'Armada → Aú → Bananeira',
        steps: ['armada', 'au', 'bananeira'],
        minDist: 1.2,
        maxDist: 2.5,
        startStance: 'GINGA',
        weight: 1.25,
      },
      {
        id: 'orbita_kip_air',
        name: 'Macaco → Armada → Compasso',
        steps: ['macaco', 'armada', 'meia_lua_compasso'],
        minDist: 1.15,
        maxDist: 2.45,
        startStance: 'RLX',
        weight: 1.3,
      },
    ],
  },
  sombra: {
    charId: 'sombra',
    archetypeTag: 'ANGOLA · JOGO DE DENTRO COUNTER',
    specialty: 'Micro-pocket evasions (Esquiva de Costas / Baixa / Cocorinha) into Rasteira, Tesoura & Banda.',
    tempoMul: 1.12,
    spinBias: 0.45,
    throwBias: 0.75,
    trapBias: 0.85,
    acroBias: 0.28,
    combos: [
      {
        id: 'sombra_slip_counter',
        name: 'Esquiva de Costas → Queixada → Compasso',
        steps: ['esquiva_de_costas', 'queixada', 'meia_lua_compasso'],
        minDist: 0.95,
        maxDist: 2.15,
        startStance: 'GINGA',
        weight: 1.45,
      },
      {
        id: 'sombra_low_trap',
        name: 'Esquiva Baixa → Boca de Calça',
        steps: ['esquiva_baixa', 'boca_de_calca'],
        minDist: 0.85,
        maxDist: 1.95,
        startStance: 'RLX',
        weight: 1.4,
      },
      {
        id: 'sombra_angola_call',
        name: 'Chamada → Rasteira → Cabeçada',
        steps: ['chamada', 'rasteira', 'cabecada'],
        minDist: 0.9,
        maxDist: 2.0,
        startStance: 'GINGA',
        weight: 1.3,
      },
      {
        id: 'sombra_roll_counter',
        name: 'Resistência → Rasteira → Rolê',
        steps: ['resistencia', 'rasteira', 'role'],
        minDist: 0.95,
        maxDist: 2.1,
        startStance: 'GINGA',
        weight: 1.25,
      },
    ],
  },
  ciclone: {
    charId: 'ciclone',
    archetypeTag: 'REGIONAL · SPINNING VORTEX',
    specialty: 'Never stops turning: Queixada → Armada → Armada com Martelo → Meia-Lua Solta → Chapa Giratória.',
    tempoMul: 0.85,
    spinBias: 0.98,
    throwBias: 0.2,
    trapBias: 0.2,
    acroBias: 0.7,
    combos: [
      {
        id: 'ciclone_tornado',
        name: 'Queixada → Armada → Armada com Martelo',
        steps: ['queixada', 'armada', 'armada_com_martelo'],
        minDist: 1.2,
        maxDist: 2.45,
        startStance: 'GINGA',
        weight: 1.55,
      },
      {
        id: 'ciclone_chapeu',
        name: 'Chapéu de Couro → Corta Capim → Aú Queda de Rins',
        steps: ['chapeu_de_couro', 'corta_capim', 'au_queda_de_rins'],
        minDist: 1.15,
        maxDist: 2.4,
        startStance: 'GINGA',
        weight: 1.35,
      },
      {
        id: 'ciclone_solta',
        name: 'Meia-Lua Solta → Chapa Giratória → Parafuso',
        steps: ['meia_lua_solta', 'chapa_giratoria', 'parafuso'],
        minDist: 1.2,
        maxDist: 2.5,
        startStance: 'GINGA',
        weight: 1.35,
      },
    ],
  },
  pipoca: {
    charId: 'pipoca',
    archetypeTag: 'CONTEMPORÂNEA · AGILE PRODIGY',
    specialty: 'Hyper-mobile weaves weaving Fuga → Volta de Lado → Macaquinho → Rolê → Martelo combos.',
    tempoMul: 0.8,
    spinBias: 0.6,
    throwBias: 0.25,
    trapBias: 0.4,
    acroBias: 0.82,
    combos: [
      {
        id: 'pipoca_weave',
        name: 'Fuga → Volta de Lado → Macaquinho → Aú',
        steps: ['fuga', 'volta_de_lado', 'macaquinho', 'au'],
        minDist: 0.9,
        maxDist: 2.35,
        startStance: 'RLX',
        weight: 1.5,
      },
      {
        id: 'pipoca_bridge',
        name: 'Ponte para Trás → Rolê de Ponte',
        steps: ['ponte_para_tras', 'role_de_ponte'],
        minDist: 1.0,
        maxDist: 2.3,
        startStance: 'GINGA',
        weight: 1.3,
      },
      {
        id: 'pipoca_rush',
        name: 'Ponteira → Galopante → Martelo → Rasteira',
        steps: ['ponteira', 'galopante', 'martelo', 'rasteira'],
        minDist: 0.85,
        maxDist: 1.95,
        startStance: 'GINGA',
        weight: 1.35,
      },
    ],
  },
};

export function characterProfile(charId: string): CharacterFlowProfile {
  return CHAR_FIGHTING_PROFILES[charId] ?? CHAR_FIGHTING_PROFILES.faisca;
}

export function styleSpec(style: Style): StyleFlowSpec {
  return STYLE_FLOW_SPECS[style];
}
