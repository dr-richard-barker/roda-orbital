// Authoritative external move-list comparison catalog mapping 100% of:
//   1) mudroljub/list-of-capoeira-moves (90 active + 3 commented HTML moves)
//   2) minhoquinho.com/capoeira-movement-library (52 video movements)
//   3) Roda Orbital moves & original signature moves.
import { MOVE_BY_ID, MOVES, type MoveDef } from './moves';

export interface MudroljubEntry {
  slug: string;
  label: string;
  group: string;
  moveId: string;
  commented?: boolean;
}

export interface MinhoquinhoEntry {
  slug: string;
  title: string;
  section: 'Cartwheels' | 'Escapes' | 'Kicks' | 'Movements' | 'Foundation';
  moveId: string;
}

export interface ComparisonRow {
  move: MoveDef;
  mudroljub: MudroljubEntry[];
  minhoquinho: MinhoquinhoEntry[];
}

export const MUDROJUB_URL = 'https://mudroljub.github.io/list-of-capoeira-moves/';
export const MINHOQUINHO_URL = 'https://www.minhoquinho.com/capoeira-movement-library';

export const MUDROJUB_MOVES: MudroljubEntry[] = [
  // Base movements
  { slug: 'ginga', label: 'Ginga (the sway)', group: 'Base movements', moveId: 'ginga' },
  { slug: 'balanca', label: 'Balança (the swing)', group: 'Base movements', moveId: 'balanca' },

  // Cartwheels (aú)
  { slug: 'au', label: 'Aú (basic cartwheel)', group: 'Cartwheels', moveId: 'au' },
  { slug: 'au-de-cabeca', label: 'Aú de cabeça (head cartwheel)', group: 'Cartwheels', moveId: 'au_de_cabeca' },
  { slug: 'au-queda-de-rins', label: 'Aú queda de rins (bent-arm cartwheel)', group: 'Cartwheels', moveId: 'au_queda_de_rins' },
  { slug: 'au-de-coluna', label: 'Aú de coluna (backbend cartwheel)', group: 'Cartwheels', moveId: 'au_de_coluna' },
  { slug: 'au-reversao', label: 'Aú reversão (walkover)', group: 'Cartwheels', moveId: 'au_reversao' },
  { slug: 'au-de-frente', label: 'Aú de frente (handspring)', group: 'Cartwheels', moveId: 'au_de_frente' },
  { slug: 'au-giratoria', label: 'Aú giratória (rotating cartwheel)', group: 'Cartwheels', moveId: 'au_giratoria' },
  { slug: 'au-uma-mao', label: 'Aú uma mão (one-handed cartwheel)', group: 'Cartwheels', moveId: 'au_uma_mao' },
  { slug: 'au-sem-mao', label: 'Aú sem mão (aerial cartwheel)', group: 'Cartwheels', moveId: 'au_sem_mao' },

  // Cartwheel kicks
  { slug: 'au-batido', label: 'Aú batido (L-kick)', group: 'Cartwheel kicks', moveId: 'au_batido' },
  { slug: 'au-batendo', label: 'Aú batendo', group: 'Cartwheel kicks', moveId: 'au_batendo' },
  { slug: 'helicoptero', label: 'Helicóptero (helicopter)', group: 'Cartwheel kicks', moveId: 'helicoptero' },
  { slug: 'au-chibata', label: 'Aú chibata (whip cartwheel)', group: 'Cartwheel kicks', moveId: 'au_chibata' },

  // Pushing kicks (chapa)
  { slug: 'chapa-de-frente', label: 'Bênção (Chapa de frente)', group: 'Pushing kicks', moveId: 'bencao' },
  { slug: 'chapa-lateral', label: 'Chapa lateral (Pisão)', group: 'Pushing kicks', moveId: 'chapa_lateral' },
  { slug: 'chapa-de-costas', label: 'Chapa de costas (coice)', group: 'Pushing kicks', moveId: 'chapa_de_costas' },
  { slug: 'chapa-giratoria', label: 'Chapa giratória (turning side kick)', group: 'Pushing kicks', moveId: 'chapa_giratoria' },
  { slug: 'voo-do-morcego', label: 'Vôo do morcego (flight of the bat)', group: 'Pushing kicks', moveId: 'voo_do_morcego' },

  // Half-moon kicks (meia lua)
  { slug: 'meia-lua-de-frente', label: 'Meia lua de frente (front half-moon)', group: 'Half-moon kicks', moveId: 'meia_lua_frente' },
  { slug: 'armada', label: 'Armada (spinning half-moon)', group: 'Half-moon kicks', moveId: 'armada' },
  { slug: 'armada-dupla', label: 'Armada dupla (flying scissor kick)', group: 'Half-moon kicks', moveId: 'armada_dupla' },
  { slug: 'queixada-de-frente', label: 'Queixada de frente (jawbreaker)', group: 'Half-moon kicks', moveId: 'queixada' },
  { slug: 'queixada-de-lado', label: 'Queixada de lado', group: 'Half-moon kicks', moveId: 'queixada_de_lado' },

  // Compass kicks (compasso)
  { slug: 'meia-lua-de-compasso', label: 'Meia lua de compasso (basic compass)', group: 'Compass kicks', moveId: 'meia_lua_compasso' },
  { slug: 'meia-lua-presa', label: 'Meia lua presa', group: 'Compass kicks', moveId: 'meia_lua_presa' },
  { slug: 'meia-lua-solta', label: 'Meia lua solta (no-hands compass)', group: 'Compass kicks', moveId: 'meia_lua_solta' },
  { slug: 'meia-lua-dupla', label: 'Meia lua dupla (double compass)', group: 'Compass kicks', moveId: 'meia_lua_dupla' },
  { slug: 'meia-lua-queda-de-rins', label: 'Meia lua queda de rins', group: 'Compass kicks', moveId: 'meia_lua_queda_de_rins' },
  { slug: 'meia-lua-reversao', label: 'Meia lua reversão', group: 'Compass kicks', moveId: 'meia_lua_reversao' },
  { slug: 'meia-lua-de-compasso-pulando', label: 'Meia lua de compasso pulando', group: 'Compass kicks', moveId: 'meia_lua_pulada' },
  { slug: 'meia-lua-de-compasso-pulando-sem-mao', label: 'Meia lua pulando sem mão (butterfly)', group: 'Compass kicks', moveId: 'meia_lua_pulada_sem_mao' },

  // Scorpion kicks
  { slug: 'escorpiao', label: 'Escorpião (scorpion kick)', group: 'Scorpion kicks', moveId: 'escorpiao' },
  { slug: 'escorpiao-duplo', label: 'Escorpião duplo (double scorpion)', group: 'Scorpion kicks', moveId: 'escorpiao_duplo' },
  { slug: 'escorpiao-em-pe', label: 'Escorpião em pé (standing scorpion)', group: 'Scorpion kicks', moveId: 'escorpiao_em_pe' },
  { slug: 'escorpiao-quda-de-rins', label: 'Escorpião queda de rins', group: 'Scorpion kicks', moveId: 'escorpiao_queda_de_rins' },

  // Hammer kicks (martelo)
  { slug: 'martelo', label: 'Martelo (roundhouse hammer kick)', group: 'Hammer kicks', moveId: 'martelo' },
  { slug: 'martelo-do-chao', label: 'Martelo do chão (martelo from ground)', group: 'Hammer kicks', moveId: 'martelo_do_chao' },
  { slug: 'chapeu-de-couro', label: 'Chapéu de couro (leather hat)', group: 'Hammer kicks', moveId: 'chapeu_de_couro' },
  { slug: 'armada-com-martelo', label: 'Armada com martelo', group: 'Hammer kicks', moveId: 'armada_com_martelo' },

  // Other kicks
  { slug: 'ponteira', label: 'Ponteira (snap toe kick)', group: 'Other kicks', moveId: 'ponteira' },
  { slug: 'gancho', label: 'Gancho (hook kick)', group: 'Other kicks', moveId: 'gancho' },
  { slug: 'joelhada', label: 'Joelhada (knee strike)', group: 'Other kicks', moveId: 'joelhada' },

  // Headbutts
  { slug: 'cabecada', label: 'Cabeçada (headbutt)', group: 'Headbutts', moveId: 'cabecada' },
  { slug: 'cabecada-baixa', label: 'Cabeçada baixa (stomach headbutt)', group: 'Headbutts', moveId: 'cabecada_baixa' },
  { slug: 'cocada', label: 'Cocada (coconut strike)', group: 'Headbutts', moveId: 'cocada' },

  // Esquiva (dodging)
  { slug: 'cocorinha', label: 'Cocorinha (squat dodge)', group: 'Dodging', moveId: 'cocorinha' },
  { slug: 'resistencia', label: 'Resistência (low dodge)', group: 'Dodging', moveId: 'resistencia' },
  { slug: 'esquiva-lateral', label: 'Esquiva lateral (standing side dodge)', group: 'Dodging', moveId: 'esquiva_lateral' },
  { slug: 'esquiva-de-lado', label: 'Esquiva de lado (side dodge)', group: 'Dodging', moveId: 'esquiva_de_lado' },
  { slug: 'esquiva-de-frente', label: 'Esquiva de frente (diagonal lunge)', group: 'Dodging', moveId: 'esquiva_de_frente' },
  { slug: 'ponte-para-tras', label: 'Ponte para trás (backbend dodge)', group: 'Dodging', moveId: 'ponte_para_tras' },
  { slug: 'escala', label: 'Escala (split escape)', group: 'Dodging', moveId: 'escala' },
  { slug: 'esquiva-na-paralela', label: 'Esquiva na paralela (parallel dodge)', group: 'Dodging', moveId: 'esquiva_paralela', commented: true },
  { slug: 'esquiva-queda-de-rins', label: 'Esquiva queda de rins (bent-arm dodge)', group: 'Dodging', moveId: 'queda_de_rins', commented: true },

  // Negativa
  { slug: 'negativa', label: 'Negativa (the negative)', group: 'Negativa', moveId: 'negativa' },
  { slug: 'negativa-angola', label: 'Negativa de Angola', group: 'Negativa', moveId: 'negativa_angola' },
  { slug: 'negativa-derrubando', label: 'Negativa derrubando (sweeping)', group: 'Negativa', moveId: 'negativa_derrubando' },
  { slug: 'troca-de-negativa', label: 'Troca de negativa (switching)', group: 'Negativa', moveId: 'troca_de_negativa' },

  // Rolê
  { slug: 'role', label: 'Rolê (the roll)', group: 'Rolê', moveId: 'role' },
  { slug: 'role-de-ponte', label: 'Rolê de ponte (bridge roll)', group: 'Rolê', moveId: 'role_de_ponte' },
  { slug: 'volta-por-cima', label: 'Volta por cima (S-curved rolê)', group: 'Rolê', moveId: 'volta_por_cima' },

  // Queda
  { slug: 'queda-de-tres', label: 'Queda de três (three-point fall)', group: 'Queda', moveId: 'queda_de_tres' },
  { slug: 'queda-de-quatro', label: 'Queda de quatro (four-point fall)', group: 'Queda', moveId: 'queda_de_quatro' },
  { slug: 'queda-de-rins', label: 'Queda de rins (kidney fall)', group: 'Queda', moveId: 'queda_de_rins' },
  { slug: 'relogio', label: 'Relógio (clockwork QDR spin)', group: 'Queda', moveId: 'relogio' },

  // Rasteira (sweeps)
  { slug: 'rasteira', label: 'Rasteira (ankle sweep)', group: 'Sweeps', moveId: 'rasteira' },
  { slug: 'rasteira-de-costas', label: 'Rasteira de costas (back sweep)', group: 'Sweeps', moveId: 'rasteira_de_costas' },
  { slug: 'corta-capim', label: 'Corta capim (grass-cutter)', group: 'Sweeps', moveId: 'corta_capim' },

  // Banda (tripping)
  { slug: 'banda-de-frente', label: 'Banda de frente (front trip)', group: 'Tripping', moveId: 'banda_de_frente' },
  { slug: 'banda-de-costas', label: 'Banda de costas (back trip)', group: 'Tripping', moveId: 'banda_de_costas' },
  { slug: 'vingativa', label: 'Vingativa (the vengeful)', group: 'Tripping', moveId: 'vingativa' },

  // Tesoura (scissors)
  { slug: 'tesoura-de-frente', label: 'Tesoura de frente (front scissors)', group: 'Scissors', moveId: 'tesoura_de_frente' },
  { slug: 'tesoura-de-costas', label: 'Tesoura de costas (back scissors)', group: 'Scissors', moveId: 'tesoura_de_costas' },
  { slug: 'passagem-da-tesoura', label: 'Passagem de tesoura (scissor escape)', group: 'Scissors', moveId: 'passagem_de_tesoura', commented: true },

  // Com mãos (hand takedowns)
  { slug: 'rasteira-de-mao', label: 'Rasteira de mão (hand sweep)', group: 'Hand takedowns', moveId: 'rasteira_de_mao' },
  { slug: 'arrastao', label: 'Arrastão (double-leg drag)', group: 'Hand takedowns', moveId: 'arrastao' },
  { slug: 'boca-de-calca', label: 'Boca de calça (pants pull)', group: 'Hand takedowns', moveId: 'boca_de_calca' },
  { slug: 'cruz', label: 'Cruz (cross throw)', group: 'Hand takedowns', moveId: 'cruz' },

  // Bananeira
  { slug: 'bananeira-de-cabeca', label: 'Bananeira de cabeça (headstand)', group: 'Handstands', moveId: 'bananeira_de_cabeca' },
  { slug: 'bananeira', label: 'Bananeira (handstand)', group: 'Handstands', moveId: 'bananeira' },

  // Macaco
  { slug: 'macaquinho', label: 'Macaquinho (little monkey)', group: 'Back handsprings', moveId: 'macaquinho' },
  { slug: 'macaco', label: 'Macaco (monkey flip)', group: 'Back handsprings', moveId: 'macaco' },
  { slug: 's-dobrado', label: 'S-dobrado (double S-curve)', group: 'Back handsprings', moveId: 's_dobrado' },
  { slug: 'macaco-em-pe', label: 'Macaco em pé (standing macaco)', group: 'Back handsprings', moveId: 'macaco_em_pe' },

  // Salto mortal
  { slug: 'xango', label: 'Xangô (windmill handspring)', group: 'Somersaults', moveId: 'xango' },
  { slug: 'xango-de-frente', label: 'Xangô de frente (jumping split)', group: 'Somersaults', moveId: 'xango_de_frente' },
  { slug: 'mortal-de-costas', label: 'Mortal de costas (backflip)', group: 'Somersaults', moveId: 'mortal' },
  { slug: 'mortal-de-frente', label: 'Mortal de frente (frontflip)', group: 'Somersaults', moveId: 'mortal_de_frente' },

  // Other acrobatics
  { slug: 'mola', label: 'Mola (head-spring kip-up)', group: 'Other acrobatics', moveId: 'mola' },
  { slug: 'mariposa', label: 'Mariposa (butterfly twist)', group: 'Other acrobatics', moveId: 'mariposa' },
  { slug: 'folha-seca', label: 'Folha seca (falling leaf)', group: 'Other acrobatics', moveId: 'folha_seca' },
];

export const MINHOQUINHO_MOVES: MinhoquinhoEntry[] = [
  // Foundation (1)
  { slug: 'ginga', title: 'Ginga', section: 'Foundation', moveId: 'ginga' },

  // Cartwheels (16)
  { slug: 'au-basico', title: 'Au Basico', section: 'Cartwheels', moveId: 'au' },
  { slug: 'au-fechado', title: 'Au Fechado', section: 'Cartwheels', moveId: 'au_fechado' },
  { slug: 'au-pesado', title: 'Au Pesado', section: 'Cartwheels', moveId: 'au_pesado' },
  { slug: 'au-de-cabea', title: 'Au de Cabeça', section: 'Cartwheels', moveId: 'au_de_cabeca' },
  { slug: 'au-queda-de-rins', title: 'Au Queda de Rins', section: 'Cartwheels', moveId: 'au_queda_de_rins' },
  { slug: 'au-cordo-de-ouro-au-cdo-', title: 'Au Cordão de Ouro (Au CDO)', section: 'Cartwheels', moveId: 'au_cdo' },
  { slug: 'au-batido', title: 'Au Batido', section: 'Cartwheels', moveId: 'au_batido' },
  { slug: 'au-tranado', title: 'Au Trançado', section: 'Cartwheels', moveId: 'au_trancado' },
  { slug: 'au-zinho', title: 'Au-Zinho', section: 'Cartwheels', moveId: 'au_zinho' },
  { slug: 'au-navalha', title: 'Au Navalha', section: 'Cartwheels', moveId: 'au_navalha' },
  { slug: 'au-macaco-em-p', title: 'Au Macaco em Pé', section: 'Cartwheels', moveId: 'macaco_em_pe' },
  { slug: 'au-reverso', title: 'Au Reversão', section: 'Cartwheels', moveId: 'au_reversao' },
  { slug: 'au-de-frente', title: 'Au de Frente', section: 'Cartwheels', moveId: 'au_de_frente' },
  { slug: 'au-chibata', title: 'Au Chibata', section: 'Cartwheels', moveId: 'au_chibata' },
  { slug: 'au-amazonas', title: 'Au Amazonas', section: 'Cartwheels', moveId: 'au_amazonas' },
  { slug: 'au-de-costas', title: 'Au de Costas', section: 'Cartwheels', moveId: 'au_de_coluna' },

  // Escapes (9)
  { slug: 'cocorinha', title: 'Cocorinha', section: 'Escapes', moveId: 'cocorinha' },
  { slug: 'resistencia', title: 'Resistencia', section: 'Escapes', moveId: 'resistencia' },
  { slug: 'negativa', title: 'Negativa', section: 'Escapes', moveId: 'negativa' },
  { slug: 'esquiva-baixa', title: 'Esquiva Baixa', section: 'Escapes', moveId: 'esquiva_baixa' },
  { slug: 'esquiva-paralela', title: 'Esquiva Paralela', section: 'Escapes', moveId: 'esquiva_paralela' },
  { slug: 'esquiva-de-costas', title: 'Esquiva de Costas', section: 'Escapes', moveId: 'esquiva_de_costas' },
  { slug: 'esquiva-escala', title: 'Esquiva Escala', section: 'Escapes', moveId: 'escala' },
  { slug: 'aranha', title: 'Aranha', section: 'Escapes', moveId: 'aranha' },
  { slug: 'ponte', title: 'Ponte', section: 'Escapes', moveId: 'ponte_para_tras' },

  // Kicks (11)
  { slug: 'bencao', title: 'Benção', section: 'Kicks', moveId: 'bencao' },
  { slug: 'chapa', title: 'Chapa', section: 'Kicks', moveId: 'chapa' },
  { slug: 'meia-lua-de-frente', title: 'Meia Lua De Frente', section: 'Kicks', moveId: 'meia_lua_frente' },
  { slug: 'queixada', title: 'Queixada', section: 'Kicks', moveId: 'queixada' },
  { slug: 'armada', title: 'Armada', section: 'Kicks', moveId: 'armada' },
  { slug: 'meia-lua-de-compasso', title: 'Meia Lua de Compasso', section: 'Kicks', moveId: 'meia_lua_compasso' },
  { slug: 'martelo', title: 'Martelo', section: 'Kicks', moveId: 'martelo' },
  { slug: 'chapeu-de-couro', title: 'Chapeu de Couro', section: 'Kicks', moveId: 'chapeu_de_couro' },
  { slug: 'chicote', title: 'Chicote', section: 'Kicks', moveId: 'chicote' },
  { slug: 'esporo', title: 'Esporão', section: 'Kicks', moveId: 'esporao' },
  { slug: 'escorpio', title: 'Escorpião', section: 'Kicks', moveId: 'escorpiao' },

  // Movements / Floor & Acrobatics (15)
  { slug: 'role', title: 'Rolê', section: 'Movements', moveId: 'role' },
  { slug: 'volta-de-lado', title: 'Volta de Lado', section: 'Movements', moveId: 'volta_de_lado' },
  { slug: 'volta-por-cima', title: 'Volta Por Cima', section: 'Movements', moveId: 'volta_por_cima' },
  { slug: 'fuga', title: 'Fuga', section: 'Movements', moveId: 'fuga' },
  { slug: 'giro', title: 'Giro', section: 'Movements', moveId: 'giro' },
  { slug: 'corrupio', title: 'Corrupio', section: 'Movements', moveId: 'corrupio' },
  { slug: 'gorila', title: 'Gorila', section: 'Movements', moveId: 'gorila' },
  { slug: 'queda-de-rins', title: 'Queda de Rins', section: 'Movements', moveId: 'queda_de_rins' },
  { slug: 'bananeira', title: 'Bananeira', section: 'Movements', moveId: 'bananeira' },
  { slug: 'parada-de-cabea', title: 'Parada de Cabeça', section: 'Movements', moveId: 'bananeira_de_cabeca' },
  { slug: 'giro-de-cabea', title: 'Giro de Cabeça', section: 'Movements', moveId: 'giro_de_cabeca' },
  { slug: 'macaquinho', title: 'Macaquinho', section: 'Movements', moveId: 'macaquinho' },
  { slug: 'macaco', title: 'Macaco', section: 'Movements', moveId: 'macaco' },
  { slug: 'corta-capim', title: 'Corta Capim', section: 'Movements', moveId: 'corta_capim' },
  { slug: 'tesoura-de-angola', title: 'Tesoura de Angola', section: 'Movements', moveId: 'tesoura_de_frente' },
];

export function buildComparisonRows(): ComparisonRow[] {
  const mMap = new Map<string, MudroljubEntry[]>();
  for (const e of MUDROJUB_MOVES) {
    const arr = mMap.get(e.moveId) ?? [];
    arr.push(e);
    mMap.set(e.moveId, arr);
  }
  const nMap = new Map<string, MinhoquinhoEntry[]>();
  for (const e of MINHOQUINHO_MOVES) {
    const arr = nMap.get(e.moveId) ?? [];
    arr.push(e);
    nMap.set(e.moveId, arr);
  }
  return MOVES.map((move) => ({
    move,
    mudroljub: mMap.get(move.id) ?? [],
    minhoquinho: nMap.get(move.id) ?? [],
  }));
}

export function getCoverageSummary(): {
  totalPlayable: number;
  mudroljubActiveTotal: number;
  mudroljubActiveCovered: number;
  mudroljubAllTotal: number;
  mudroljubAllCovered: number;
  minhoquinhoTotal: number;
  minhoquinhoCovered: number;
} {
  const mActive = MUDROJUB_MOVES.filter((e) => !e.commented);
  return {
    totalPlayable: MOVES.length,
    mudroljubActiveTotal: mActive.length,
    mudroljubActiveCovered: mActive.filter((e) => Boolean(MOVE_BY_ID[e.moveId])).length,
    mudroljubAllTotal: MUDROJUB_MOVES.length,
    mudroljubAllCovered: MUDROJUB_MOVES.filter((e) => Boolean(MOVE_BY_ID[e.moveId])).length,
    minhoquinhoTotal: MINHOQUINHO_MOVES.length,
    minhoquinhoCovered: MINHOQUINHO_MOVES.filter((e) => Boolean(MOVE_BY_ID[e.moveId])).length,
  };
}
