// Capoeira Move Library & Frame Data.
// Every move references a PoseTrack in poses.ts and attaches hit capsules to bones.
import type { BoneId } from './skeleton';
import type { Vec3 } from '../core/fixedmath';

export type Stance = 'GINGA' | 'HSP' | 'RLX';
export type HitLevel = 'HIGH' | 'MID' | 'LOW' | 'THROW';

export interface HitCapsule {
  bone: BoneId;
  radius: number;
}

export interface HitResult {
  stun: number;
  advantage: number; // reference frame advantage (actual = hitstun - remaining recovery)
  pushback: number;
  knockdown?: boolean;
}

export interface HitWindow {
  frames: [start: number, end: number];
  capsules: HitCapsule[];
  level: HitLevel;
  damage: number;
  hitstop: number;
  onHit: HitResult;
  onBlock: HitResult;
  onCounter?: HitResult;
  launch?: Vec3; // [vx_away, vy_up, vz] in m/s @ 1g
  wallSplat?: boolean;
  groundBounce?: boolean;
}

export interface CancelRule {
  into: string | Stance;
  window: [number, number];
  on: 'ALWAYS' | 'HIT' | 'BLOCK' | 'WHIFF';
  input?: string; // button/motion token e.g. 'LH', 'RH', 'LK', 'RK', 'STANCE'
  beatBonus?: number;
}

export type HurtboxProfile = 'NORMAL' | 'CRUSH_HIGH' | 'CRUSH_LOW' | 'INVULN';
export type MoveCategory =
  | 'Base & Stances'
  | 'Cartwheels'
  | 'Kicks'
  | 'Evasions & Floor'
  | 'Sweeps & Takedowns'
  | 'Acrobatics';

export interface MoveDef {
  id: string;
  name: string;
  english?: string;
  description?: string;
  category?: MoveCategory;
  input: string; // display & parser token (e.g. 'LK', '6RK', '236RK', 'STANCE')
  from: Stance[];
  totalFrames: number;
  poseId: string;
  hurtboxOverrides?: { frames: [number, number]; profile: HurtboxProfile }[];
  hits: HitWindow[];
  cancels: CancelRule[];
  endStance: Stance;
  rootMotion?: { frames: [number, number]; vel: Vec3 }[]; // [forward, up, side] m/s
  tags?: ('LAUNCHER' | 'SPIN' | 'FLOREIO' | 'THROW')[];
}

export const CORE_MOVES: MoveDef[] = [
  // ---- GINGA (Neutral) Moves ----
  {
    id: 'ponteira',
    name: 'Ponteira',
    input: 'LK',
    from: ['GINGA'],
    totalFrames: 18,
    poseId: 'ponteira',
    hits: [
      {
        frames: [6, 8],
        capsules: [{ bone: 'footL', radius: 0.16 }, { bone: 'shinL', radius: 0.11 }],
        level: 'HIGH',
        damage: 11,
        hitstop: 4,
        onHit: { stun: 15, advantage: 3, pushback: 0.35 },
        onBlock: { stun: 11, advantage: -1, pushback: 0.25 },
      },
    ],
    cancels: [
      { into: 'galopante', window: [7, 15], on: 'ALWAYS', input: 'RH' },
      { into: 'martelo', window: [8, 16], on: 'ALWAYS', input: 'RK' },
      { into: 'au_batido', window: [8, 16], on: 'HIT', input: '2RK' },
    ],
    endStance: 'GINGA',
    rootMotion: [{ frames: [2, 8], vel: [1.4, 0, 0] }],
  },
  {
    id: 'galopante',
    name: 'Galopante',
    input: 'RH',
    from: ['GINGA'],
    totalFrames: 22,
    poseId: 'galopante',
    hits: [
      {
        frames: [8, 11],
        capsules: [{ bone: 'handR', radius: 0.16 }, { bone: 'foreArmR', radius: 0.11 }],
        level: 'HIGH',
        damage: 14,
        hitstop: 5,
        onHit: { stun: 17, advantage: 3, pushback: 0.45 },
        onBlock: { stun: 12, advantage: -2, pushback: 0.3 },
      },
    ],
    cancels: [
      { into: 'armada', window: [9, 19], on: 'ALWAYS', input: 'RK' },
      { into: 'RLX', window: [12, 20], on: 'ALWAYS', input: 'STANCE', beatBonus: 2 },
    ],
    endStance: 'GINGA',
    rootMotion: [{ frames: [3, 10], vel: [1.8, 0, 0] }],
  },
  {
    id: 'bencao',
    name: 'Bênção',
    input: 'LH',
    from: ['GINGA'],
    totalFrames: 26,
    poseId: 'bencao',
    hits: [
      {
        frames: [9, 13],
        capsules: [{ bone: 'footR', radius: 0.18 }, { bone: 'shinR', radius: 0.12 }],
        level: 'MID',
        damage: 18,
        hitstop: 6,
        onHit: { stun: 20, advantage: 4, pushback: 1.1 },
        onBlock: { stun: 14, advantage: -3, pushback: 0.65 },
        wallSplat: true,
      },
    ],
    cancels: [
      { into: 'HSP', window: [15, 24], on: 'ALWAYS', input: 'STANCE', beatBonus: 2 },
    ],
    endStance: 'GINGA',
    rootMotion: [{ frames: [4, 12], vel: [1.5, 0, 0] }],
  },
  {
    id: 'martelo',
    name: 'Martelo',
    input: 'RK',
    from: ['GINGA'],
    totalFrames: 28,
    poseId: 'martelo',
    hits: [
      {
        frames: [10, 14],
        capsules: [{ bone: 'footR', radius: 0.18 }, { bone: 'shinR', radius: 0.13 }],
        level: 'HIGH',
        damage: 20,
        hitstop: 7,
        onHit: { stun: 22, advantage: 4, pushback: 0.7 },
        onBlock: { stun: 15, advantage: -2, pushback: 0.45 },
        onCounter: { stun: 28, advantage: 10, pushback: 0.8 },
        wallSplat: true,
      },
    ],
    cancels: [
      { into: 'meia_lua_compasso', window: [13, 24], on: 'HIT', input: 'RK' },
      { into: 'au_batido', window: [12, 24], on: 'HIT', input: '2RK' },
    ],
    endStance: 'GINGA',
    rootMotion: [{ frames: [4, 12], vel: [1.6, 0, 0] }],
  },
  {
    id: 'queixada',
    name: 'Queixada',
    input: '6LK',
    from: ['GINGA'],
    totalFrames: 26,
    poseId: 'queixada',
    hits: [
      {
        frames: [10, 14],
        capsules: [{ bone: 'footR', radius: 0.18 }, { bone: 'shinR', radius: 0.13 }],
        level: 'MID',
        damage: 17,
        hitstop: 6,
        onHit: { stun: 20, advantage: 4, pushback: 0.55 },
        onBlock: { stun: 14, advantage: -2, pushback: 0.35 },
      },
    ],
    cancels: [
      { into: 'armada', window: [12, 22], on: 'ALWAYS', input: 'RK' },
    ],
    endStance: 'GINGA',
    rootMotion: [{ frames: [4, 13], vel: [2.2, 0, 0] }],
    tags: ['SPIN'],
  },
  {
    id: 'armada',
    name: 'Armada',
    input: '6RK',
    from: ['GINGA'],
    totalFrames: 32,
    poseId: 'armada',
    hits: [
      {
        frames: [12, 17],
        capsules: [{ bone: 'footR', radius: 0.19 }, { bone: 'shinR', radius: 0.14 }],
        level: 'HIGH',
        damage: 24,
        hitstop: 8,
        onHit: { stun: 24, advantage: 5, pushback: 0.9 },
        onBlock: { stun: 16, advantage: -3, pushback: 0.5 },
        launch: [2.6, 4.4, 0],
        wallSplat: true,
      },
    ],
    cancels: [
      { into: 'RLX', window: [18, 28], on: 'ALWAYS', input: 'STANCE', beatBonus: 2 },
    ],
    endStance: 'GINGA',
    rootMotion: [{ frames: [4, 16], vel: [2.4, 0, 0] }],
    tags: ['SPIN'],
  },
  {
    id: 'meia_lua_compasso',
    name: 'Meia-Lua de Compasso',
    input: '236RK',
    from: ['GINGA', 'RLX'],
    totalFrames: 36,
    poseId: 'meia_lua_compasso',
    hurtboxOverrides: [{ frames: [6, 20], profile: 'CRUSH_HIGH' }],
    hits: [
      {
        frames: [13, 19],
        capsules: [{ bone: 'footR', radius: 0.21 }, { bone: 'shinR', radius: 0.15 }],
        level: 'MID',
        damage: 28,
        hitstop: 9,
        onHit: { stun: 26, advantage: 6, pushback: 1.2, knockdown: true },
        onBlock: { stun: 18, advantage: -5, pushback: 0.7 },
        launch: [3.2, 3.6, 0],
        wallSplat: true,
      },
    ],
    cancels: [
      { into: 'RLX', window: [20, 32], on: 'ALWAYS', input: 'STANCE', beatBonus: 2 },
    ],
    endStance: 'GINGA',
    rootMotion: [{ frames: [5, 18], vel: [2.6, 0, 0] }],
    tags: ['SPIN', 'FLOREIO'],
  },
  {
    id: 'au_batido',
    name: 'Aú Batido',
    input: '2RK',
    from: ['GINGA'],
    totalFrames: 30,
    poseId: 'au_batido',
    hurtboxOverrides: [{ frames: [6, 18], profile: 'CRUSH_LOW' }],
    hits: [
      {
        frames: [10, 15],
        capsules: [{ bone: 'footR', radius: 0.24 }, { bone: 'shinR', radius: 0.18 }, { bone: 'thighR', radius: 0.16 }],
        level: 'MID',
        damage: 22,
        hitstop: 8,
        onHit: { stun: 34, advantage: 12, pushback: 0.4 },
        onBlock: { stun: 16, advantage: -6, pushback: 0.45 },
        launch: [1.4, 6.8, 0],
      },
    ],
    cancels: [
      { into: 'parafuso', window: [14, 24], on: 'HIT', input: 'LK' },
      { into: 'HSP', window: [16, 26], on: 'ALWAYS', input: 'STANCE', beatBonus: 2 },
    ],
    endStance: 'GINGA',
    rootMotion: [
      { frames: [3, 14], vel: [2.4, 2.2, 0] },
      { frames: [15, 26], vel: [1.0, -2.5, 0] },
    ],
    tags: ['LAUNCHER', 'FLOREIO'],
  },
  {
    id: 'parafuso',
    name: 'Parafuso',
    input: '236LK',
    from: ['GINGA', 'HSP'],
    totalFrames: 28,
    poseId: 'parafuso',
    hurtboxOverrides: [{ frames: [5, 19], profile: 'CRUSH_LOW' }],
    hits: [
      {
        frames: [12, 18],
        capsules: [{ bone: 'footR', radius: 0.2 }, { bone: 'shinR', radius: 0.14 }],
        level: 'MID',
        damage: 25,
        hitstop: 8,
        onHit: { stun: 24, advantage: 4, pushback: 1.0, knockdown: true },
        onBlock: { stun: 16, advantage: -4, pushback: 0.6 },
        launch: [3.6, 3.8, 0],
        wallSplat: true,
      },
    ],
    cancels: [],
    endStance: 'GINGA',
    rootMotion: [
      { frames: [3, 14], vel: [2.8, 3.4, 0] },
      { frames: [15, 25], vel: [1.5, -3.2, 0] },
    ],
    tags: ['SPIN', 'FLOREIO'],
  },
  {
    id: 'au',
    name: 'Aú (Cartwheel)',
    input: 'STANCE_HSP',
    from: ['GINGA'],
    totalFrames: 22,
    poseId: 'au',
    hurtboxOverrides: [{ frames: [5, 16], profile: 'CRUSH_LOW' }],
    hits: [],
    cancels: [
      { into: 'helicoptero', window: [12, 20], on: 'ALWAYS', input: 'RK' },
      { into: 'piao_mao', window: [12, 20], on: 'ALWAYS', input: 'LK' },
    ],
    endStance: 'HSP',
    rootMotion: [{ frames: [3, 15], vel: [2.4, 0.8, 0] }],
    tags: ['FLOREIO'],
  },
  {
    id: 'vingativa',
    name: 'Vingativa (Takedown)',
    input: 'LH+RH',
    from: ['GINGA'],
    totalFrames: 28,
    poseId: 'vingativa',
    hits: [
      {
        frames: [9, 12],
        capsules: [{ bone: 'handL', radius: 0.22 }, { bone: 'handR', radius: 0.22 }],
        level: 'THROW',
        damage: 28,
        hitstop: 8,
        onHit: { stun: 34, advantage: 12, pushback: 1.5, knockdown: true },
        onBlock: { stun: 34, advantage: 12, pushback: 1.5, knockdown: true },
        launch: [2.4, 3.2, 0],
      },
    ],
    cancels: [],
    endStance: 'GINGA',
    rootMotion: [{ frames: [3, 10], vel: [2.4, 0, 0] }],
    tags: ['THROW'],
  },

  // ---- BANANEIRA (HSP - Handstand) Moves ----
  {
    id: 'helicoptero',
    name: 'Helicóptero',
    input: 'RK',
    from: ['HSP'],
    totalFrames: 30,
    poseId: 'helicoptero',
    hurtboxOverrides: [{ frames: [1, 28], profile: 'CRUSH_LOW' }],
    hits: [
      {
        frames: [7, 11],
        capsules: [{ bone: 'footL', radius: 0.19 }, { bone: 'footR', radius: 0.19 }],
        level: 'MID',
        damage: 14,
        hitstop: 5,
        onHit: { stun: 20, advantage: 2, pushback: 0.45 },
        onBlock: { stun: 14, advantage: -2, pushback: 0.35 },
      },
      {
        frames: [15, 20],
        capsules: [{ bone: 'footL', radius: 0.2 }, { bone: 'footR', radius: 0.2 }],
        level: 'MID',
        damage: 16,
        hitstop: 7,
        onHit: { stun: 24, advantage: 6, pushback: 0.8 },
        onBlock: { stun: 15, advantage: -4, pushback: 0.5 },
        launch: [2.4, 4.6, 0],
      },
    ],
    cancels: [
      { into: 'RLX', window: [20, 28], on: 'ALWAYS', input: 'STANCE', beatBonus: 2 },
    ],
    endStance: 'HSP',
    rootMotion: [{ frames: [4, 18], vel: [1.5, 0, 0] }],
    tags: ['SPIN', 'FLOREIO'],
  },
  {
    id: 'piao_mao',
    name: 'Pião de Mão',
    input: 'LK',
    from: ['HSP'],
    totalFrames: 24,
    poseId: 'piao_mao',
    hurtboxOverrides: [{ frames: [1, 22], profile: 'CRUSH_LOW' }],
    hits: [
      {
        frames: [7, 13],
        capsules: [{ bone: 'footR', radius: 0.19 }, { bone: 'shinR', radius: 0.14 }],
        level: 'MID',
        damage: 19,
        hitstop: 6,
        onHit: { stun: 22, advantage: 5, pushback: 0.65 },
        onBlock: { stun: 14, advantage: -2, pushback: 0.4 },
      },
    ],
    cancels: [
      { into: 'helicoptero', window: [12, 20], on: 'ALWAYS', input: 'RK' },
      { into: 'GINGA', window: [14, 22], on: 'ALWAYS', input: 'STANCE' },
    ],
    endStance: 'HSP',
    rootMotion: [{ frames: [3, 12], vel: [1.6, 0, 0] }],
    tags: ['SPIN', 'FLOREIO'],
  },

  // ---- NEGATIVA (RLX - Ground) Moves ----
  {
    id: 'rasteira',
    name: 'Rasteira (Sweep)',
    input: 'RK',
    from: ['RLX'],
    totalFrames: 28,
    poseId: 'rasteira',
    hurtboxOverrides: [{ frames: [3, 20], profile: 'CRUSH_HIGH' }],
    hits: [
      {
        frames: [10, 14],
        capsules: [{ bone: 'footR', radius: 0.18 }, { bone: 'shinR', radius: 0.14 }],
        level: 'LOW',
        damage: 19,
        hitstop: 6,
        onHit: { stun: 30, advantage: 12, pushback: 0.6, knockdown: true },
        onBlock: { stun: 16, advantage: -7, pushback: 0.4 },
        launch: [1.2, 3.2, 0],
      },
    ],
    cancels: [
      { into: 'role', window: [15, 25], on: 'ALWAYS', input: 'LK' },
    ],
    endStance: 'RLX',
    rootMotion: [{ frames: [4, 13], vel: [2.2, 0, 0] }],
  },
  {
    id: 'chapa',
    name: 'Chapa de Frente',
    input: 'LK',
    from: ['RLX'],
    totalFrames: 28,
    poseId: 'chapa',
    hurtboxOverrides: [{ frames: [1, 18], profile: 'CRUSH_HIGH' }],
    hits: [
      {
        frames: [10, 14],
        capsules: [{ bone: 'footR', radius: 0.19 }, { bone: 'shinR', radius: 0.13 }],
        level: 'MID',
        damage: 22,
        hitstop: 7,
        onHit: { stun: 24, advantage: 5, pushback: 1.0 },
        onBlock: { stun: 15, advantage: -4, pushback: 0.6 },
        launch: [1.8, 5.2, 0],
        wallSplat: true,
      },
    ],
    cancels: [
      { into: 'GINGA', window: [16, 26], on: 'ALWAYS', input: 'STANCE', beatBonus: 2 },
    ],
    endStance: 'RLX',
    rootMotion: [{ frames: [5, 13], vel: [1.4, 0, 0] }],
    tags: ['LAUNCHER'],
  },
  {
    id: 'cabecada',
    name: 'Cabeçada',
    input: 'LH',
    from: ['RLX'],
    totalFrames: 26,
    poseId: 'cabecada',
    hurtboxOverrides: [{ frames: [4, 15], profile: 'CRUSH_HIGH' }],
    hits: [
      {
        frames: [9, 12],
        capsules: [{ bone: 'head', radius: 0.19 }, { bone: 'chest', radius: 0.16 }],
        level: 'MID',
        damage: 21,
        hitstop: 7,
        onHit: { stun: 24, advantage: 5, pushback: 0.9 },
        onBlock: { stun: 15, advantage: -4, pushback: 0.5 },
        wallSplat: true,
      },
    ],
    cancels: [
      { into: 'GINGA', window: [15, 24], on: 'ALWAYS', input: 'STANCE' },
    ],
    endStance: 'GINGA',
    rootMotion: [{ frames: [4, 12], vel: [3.4, 0, 0] }],
  },
  {
    id: 'role',
    name: 'Rolê',
    input: 'STANCE_GINGA',
    from: ['RLX'],
    totalFrames: 24,
    poseId: 'role',
    hurtboxOverrides: [{ frames: [3, 18], profile: 'CRUSH_HIGH' }],
    hits: [],
    cancels: [
      { into: 'martelo', window: [12, 22], on: 'ALWAYS', input: 'RK' },
      { into: 'au_batido', window: [12, 22], on: 'ALWAYS', input: '2RK' },
    ],
    endStance: 'GINGA',
    rootMotion: [{ frames: [2, 18], vel: [3.2, 0, 0] }],
    tags: ['FLOREIO'],
  },
];

import { EXTRA_MOVES } from './moves_extra';

const CORE_META: Record<string, { category: MoveCategory; english: string; description: string }> = {
  ponteira: {
    category: 'Kicks',
    english: 'Fast Front Snap Kick',
    description: 'Whip-fast upright snap thrust with ball of foot designed to interrupt startup frames.',
  },
  galopante: {
    category: 'Kicks',
    english: 'Open-Palm Ridge Slap',
    description: 'Traditional Capoeira upright palm slap rushing forward along guard height.',
  },
  bencao: {
    category: 'Kicks',
    english: 'Blessing Front Push Kick',
    description: 'Drive-forward sole push kick slamming chest/sternum away across the Roda.',
  },
  martelo: {
    category: 'Kicks',
    english: 'Hammer Roundhouse Kick',
    description: 'Snap roundhouse chambered across waist height striking ribs or temple with instep.',
  },
  queixada: {
    category: 'Kicks',
    english: 'Jawbone Outside Crescent',
    description: 'Cross-stepped outside-to-inside sweeping arc targeting jaw and high guard.',
  },
  armada: {
    category: 'Kicks',
    english: 'Spinning Heel Crescent',
    description: 'Full 360-degree back-pivot whip sweeping the trailing heel wide across head height.',
  },
  meia_lua_compasso: {
    category: 'Kicks',
    english: 'Half-Moon Compass Sweep',
    description: 'Iconic Capoeira signature: plant both hands low and whip a straight heel in a deadly 360° arc.',
  },
  au_batido: {
    category: 'Cartwheels',
    english: 'Cartwheel Thrust Launcher',
    description: 'Inverted one-hand cartwheel kicking the top leg skyward as an anti-air / tag launcher.',
  },
  parafuso: {
    category: 'Acrobatics',
    english: 'Corkscrew Spiral Double Kick',
    description: 'Rising double-kick aerial spiral launching defenders into lunar/zero-G juggle height.',
  },
  au: {
    category: 'Cartwheels',
    english: 'Capoeira Side Cartwheel',
    description: 'Classic inverted wheel passing between palms while keeping eyes on opponent through the gap.',
  },
  vingativa: {
    category: 'Sweeps & Takedowns',
    english: 'Vindictive Chest-and-Leg Takedown',
    description: 'Close-range forearm smash jamming ribs while behind leg locks opponent ankle.',
  },
  helicoptero: {
    category: 'Acrobatics',
    english: 'Inverted Rotor Blade Kick',
    description: 'Propeller-like double leg windmill spun horizontally atop planted Bananeira hands.',
  },
  piao_mao: {
    category: 'Cartwheels',
    english: 'Handstand Pirouette Spin',
    description: 'Spins 360 degrees vertically balanced on hands while clipping high guards.',
  },
  rasteira: {
    category: 'Sweeps & Takedowns',
    english: 'Low Ankle Hook Sweep',
    description: 'Drops hip weight completely onto one braced palm while the outstretched foot yanks the planted ankle.',
  },
  chapa: {
    category: 'Kicks',
    english: 'Floor Piston Push Kick',
    description: 'High-crushing upward sole thrust fired violently out of crouched Negativa.',
  },
  cabecada: {
    category: 'Kicks',
    english: 'Charging Torso Headbutt',
    description: 'Explosive close-range crown charge driving upward through high punches from low guard.',
  },
  role: {
    category: 'Evasions & Floor',
    english: 'Low Ground Pivot Roll',
    description: 'Smooth low circular pivot keeping eyes fixed on opponent while recovering cleanly into Ginga.',
  },
};

export const MOVES: MoveDef[] = [
  ...CORE_MOVES.map((m) => ({
    ...m,
    category: CORE_META[m.id]?.category ?? 'Base & Stances',
    english: CORE_META[m.id]?.english ?? m.name,
    description: CORE_META[m.id]?.description ?? '',
  })),
  ...EXTRA_MOVES,
];

export const MOVE_BY_ID: Record<string, MoveDef> = Object.fromEntries(MOVES.map((m) => [m.id, m]));
