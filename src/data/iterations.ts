// Canonical chronicle of Roda Orbital's 5 development iterations, deep-link presets,
// and exact move-by-iteration provenance across all 116 Capoeira techniques.
import { MOVE_BY_ID, MOVES } from './moves';

export type IterationId = 'v1' | 'v2' | 'v3' | 'v4' | 'v5';

export interface IterationPreset {
  mode: 'VS_CPU' | 'SHOW' | 'TRAINING' | 'VS_2P';
  p1: string;
  p2: string;
  p1Skin: string;
  p2Skin: string;
  p1Pal: number;
  p2Pal: number;
  gravity: number;
  style: string;
  filter: string;
  toque: string;
  hitboxes: boolean;
}

export interface IterationDef {
  id: IterationId;
  number: 1 | 2 | 3 | 4 | 5;
  commit: string;
  title: string;
  subtitle: string;
  eraBadge: string;
  story: string;
  highlights: string[];
  featuredMoves: string[];
  preset: IterationPreset;
  arenaQuery: string;
  embedUrl: string;
  fullscreenUrl: string;
  showcaseUrl?: string;
}

export const CORE_V1_MOVE_IDS = new Set<string>([
  'ponteira',
  'galopante',
  'bencao',
  'martelo',
  'queixada',
  'armada',
  'meia_lua_compasso',
  'au_batido',
  'parafuso',
  'au',
  'vingativa',
  'helicoptero',
  'piao_mao',
  'rasteira',
  'chapa',
  'cabecada',
  'role',
]);

export const RITUAL_V5_MOVE_IDS = new Set<string>(['chamada', 'volta_ao_mundo']);

export function getMoveIteration(moveId: string): 1 | 3 | 5 {
  if (CORE_V1_MOVE_IDS.has(moveId)) return 1;
  if (RITUAL_V5_MOVE_IDS.has(moveId)) return 5;
  return 3;
}

export const ITERATION_PRESETS: Record<IterationId, IterationPreset> = {
  v1: {
    mode: 'VS_CPU',
    p1: 'faisca',
    p2: 'touro',
    p1Skin: 'default',
    p2Skin: 'default',
    p1Pal: 0,
    p2Pal: 0,
    gravity: 0.165,
    style: 'lunar',
    filter: 'none',
    toque: 'sao_bento',
    hitboxes: true,
  },
  v2: {
    mode: 'VS_CPU',
    p1: 'faisca',
    p2: 'morcego',
    p1Skin: 'default',
    p2Skin: 'default',
    p1Pal: 0,
    p2Pal: 0,
    gravity: 1.0,
    style: 'sf2',
    filter: 'crt',
    toque: 'sao_bento',
    hitboxes: false,
  },
  v3: {
    mode: 'TRAINING',
    p1: 'faisca',
    p2: 'ciclone',
    p1Skin: 'default',
    p2Skin: 'default',
    p1Pal: 0,
    p2Pal: 0,
    gravity: 1.0,
    style: 'sf2',
    filter: 'none',
    toque: 'sao_bento',
    hitboxes: true,
  },
  v4: {
    mode: 'SHOW',
    p1: 'faisca',
    p2: 'jacare',
    p1Skin: 'default',
    p2Skin: 'mestre',
    p1Pal: 0,
    p2Pal: 0,
    gravity: 1.0,
    style: 'sf2',
    filter: 'none',
    toque: 'angola',
    hitboxes: false,
  },
  v5: {
    mode: 'SHOW',
    p1: 'grima',
    p2: 'orbita',
    p1Skin: 'maculele',
    p2Skin: 'orbital',
    p1Pal: 0,
    p2Pal: 0,
    gravity: 0.165,
    style: 'lunar',
    filter: 'none',
    toque: 'iuna',
    hitboxes: false,
  },
};

export const ITERATIONS: readonly IterationDef[] = [
  {
    id: 'v1',
    number: 1,
    commit: '9096342',
    title: 'Iteration 1 · Gravity Engine & Core Roda',
    subtitle: 'Deterministic 60 FPS skeleton physics, iPad arcade pad, and lunar orbit combat',
    eraBadge: 'Foundation · 17 Core Moves',
    story:
      'Roda Orbital began as a pure fixed-point deterministic Capoeira fighting engine built around three combat stances (Ginga, Bananeira/HSP, Negativa/RLX), high/low/throw crush rules, and selectable gravity scaling down to 0.165g Moon orbit where aerial launchers float.',
    highlights: [
      '21-bone skeletal rig with 3D forward kinematics and capsule-sphere collision (src/sim/collision.ts).',
      '17 foundational Capoeira techniques from Ginga, Ponteira, and Meia-Lua de Compasso to Aú Batido, Rasteira, and Pião de Mão.',
      'Dual-input desktop keyboard + full mobile/iPad virtual joystick & 5-button arcade touch controls.',
      'Pushbox separation, beat-window timing bonus, and live F3 wireframe hitbox/hurtbox inspector.',
    ],
    featuredMoves: ['ginga', 'ponteira', 'bencao', 'meia_lua_compasso', 'au_batido', 'rasteira'],
    preset: ITERATION_PRESETS.v1,
    arenaQuery: './index.html?era=v1',
    embedUrl: './index.html?era=v1&embed=1',
    fullscreenUrl: './index.html?era=v1',
  },
  {
    id: 'v2',
    number: 2,
    commit: '94e729d',
    title: 'Iteration 2 · SF2 Cel-Shading, 2-Bone IK & Skinning',
    subtitle: 'Arcade CRT phosphor glow, plum shadow bands, continuous lofted bodies, and cloth',
    eraBadge: 'Visual Rigging · 10 Fighters',
    story:
      'To replace capsule puppets with expressive Street Fighter II arcade craft, Iteration 2 introduced custom 4-band toon materials, inverted-hull ink outlines, 2-bone analytical IK pinning planted feet and hands cleanly onto the floor, and a full 10-fighter roster.',
    highlights: [
      'Catmull-Rom continuous 4-bone skinned torso, deltoids, arms, and draped cotton abadá trousers (skinnedCharacter.ts).',
      '2-bone analytical IK ground pinning locking planted heels, balls of feet, and palms flush with y = 0.',
      'Verlet spring cloth simulation for headbands & rank cordões plus starburst hit VFX and limb smear trails.',
      'CPS-1 Arcade CRT raster scanline & phosphor shader with frame-accurate hitstop vibration.',
    ],
    featuredMoves: ['armada', 'queixada', 'martelo', 'parafuso', 'helicoptero', 'cabecada'],
    preset: ITERATION_PRESETS.v2,
    arenaQuery: './index.html?era=v2',
    embedUrl: './index.html?era=v2&embed=1',
    fullscreenUrl: './index.html?era=v2',
  },
  {
    id: 'v3',
    number: 3,
    commit: '413561c',
    title: 'Iteration 3 · 3D Move Showcase & 114-Technique Encyclopedia',
    subtitle: 'Full 1-to-1 parity with Mudroljub & Minhoquinho movement libraries',
    eraBadge: 'Library Expansion · +97 Moves',
    story:
      'Next came an encyclopedic expansion integrating 97 additional Capoeira techniques into 3D keyframes and hitbox timelines—covering every Aú cartwheel variant, Escorpião kick, Queda de Rins transition, Tesoura takedown, and acrobatic butterfly/mortal.',
    highlights: [
      'Dedicated 3D Move Animator page (moves.html) with 360° camera orbit, frame scrubber, speed selector, and auto-tour.',
      '100% coverage audit against Mudroljub (90 active / 93 total entries) and Minhoquinho (52/52 reference videos).',
      'Expanded modular pose tracks (poses_cartwheels, poses_kicks, poses_evasions, poses_takedowns, poses_acrobatics).',
      'Synchronized Training Lab mode where players can test any of the 114+ cancel trees live against hitboxes.',
    ],
    featuredMoves: ['au_sem_mao', 'escorpiao', 'queda_de_rins', 'macaco', 's_dobrado', 'tesoura_de_frente'],
    preset: ITERATION_PRESETS.v3,
    arenaQuery: './index.html?era=v3',
    embedUrl: './moves.html?move=meia_lua_compasso&dummy=1',
    fullscreenUrl: './index.html?era=v3',
    showcaseUrl: './moves.html?move=meia_lua_compasso&dummy=1',
  },
  {
    id: 'v4',
    number: 4,
    commit: 'db8f50d',
    title: 'Iteration 4 · Jogar na Roda (Play / Show) & Cultural Archive',
    subtitle: 'Cooperative Pergunta & Resposta dialogue, Axé meter, and editorial guides',
    eraBadge: 'Heritage & Duet · Zero-KO Roda',
    story:
      'Capoeira is traditionally played as a rhythmic dialogue rather than a brawl. Iteration 4 added Play / Show Mode—where partners exchange synchronized attacks and escapes at zero damage—paired with adaptive Tutorial and History pages.',
    highlights: [
      'Show AI choreographer pairing every call move with a stylized spatial dodge, floor sweep, or acrobatic reply (rodaDialogues.ts).',
      'Axé Flow meter, Streak counter, turquoise-gold harmony rings, and instant F1 Jump In for human improvisation.',
      'Pair Reply mode inside the 3D Showcase for studying synchronized evasion windows frame by frame.',
      'Accessible multi-page editorial manual (tutorial.html) and Afro-Brazilian heritage archive (history.html).',
    ],
    featuredMoves: ['cocorinha', 'negativa_angola', 'role', 'banda_de_costas', 'volta_por_cima', 'bananeira'],
    preset: ITERATION_PRESETS.v4,
    arenaQuery: './index.html?era=v4',
    embedUrl: './index.html?era=v4&embed=1',
    fullscreenUrl: './index.html?era=v4',
  },
  {
    id: 'v5',
    number: 5,
    commit: 'main (latest)',
    title: 'Iteration 5 · Biomechanics, Style Flow, Skins & 3D Graphics Overhaul',
    subtitle: 'Angola vs Regional AI flow, 5 stage styles, 7 skins, 6 GPU filters & sculpted rigs',
    eraBadge: 'Latest Release · 116 Moves',
    story:
      'The latest chapter deepens martial authenticity and visual polish: anatomical torque & kinetic balance (kinetics.ts), distinct Angola/Regional/Contemporânea/Maculelê flow trees (+ Chamada & Volta ao Mundo rituals), 5 stage aesthetics, 7 skins, and a 3-tier graphics overhaul.',
    highlights: [
      'Integrated Angola rituals Chamada & Volta ao Mundo (+2 moves = 116 total) alongside 36 style-tuned flow chains.',
      'Selectable Berimbau Toques (Angola, São Bento Grande, Iúna), 0.165g Lunar gravity selector in main Play Mode, and P2/Partner customization.',
      '5 Stage Styles (Bahia Sunset, Crosshatch, Sumi-e, Noturna, Lunar Crater), 7 Skins (Maculelê Verlet skirt, Mestre Angola, Kilombo Paint, Orbital EVA, Street Roda, X-Ray), & 6 Filters.',
      '3-Tier Render Upgrade: weighted socket outlines, custom halftone/noir shaders, 3D Lunar Earthrise, Pelourinho skyline, sculpted anatomy, and limb contact AO.',
    ],
    featuredMoves: ['chamada', 'volta_ao_mundo', 'au_chibata', 'meia_lua_solta', 'relogio', 'armada_dupla'],
    preset: ITERATION_PRESETS.v5,
    arenaQuery: './index.html?era=v5',
    embedUrl: './index.html?era=v5&embed=1',
    fullscreenUrl: './index.html?era=v5',
  },
];

export function countMovesByIteration(): Record<1 | 3 | 5, number> {
  const counts: Record<1 | 3 | 5, number> = { 1: 0, 3: 0, 5: 0 };
  for (const m of MOVES) {
    counts[getMoveIteration(m.id)]++;
  }
  return counts;
}

export function verifyIterationsIntegrity(): boolean {
  const c = countMovesByIteration();
  if (c[1] + c[3] + c[5] !== MOVES.length) return false;
  for (const it of ITERATIONS) {
    for (const mid of it.featuredMoves) {
      if (!MOVE_BY_ID[mid]) return false;
    }
  }
  return true;
}
