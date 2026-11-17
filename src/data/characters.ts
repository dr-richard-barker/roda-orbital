// Roster definitions. Gameplay numbers live here; visuals (palette/hair/costume) too.
import { DEFAULT_SCALE, type BodyScale } from './skeleton';

export type Style = 'ANGOLA' | 'REGIONAL' | 'CONTEMPORANEA' | 'MACULELE';
export type HairStyle = 'short' | 'bun' | 'dreads' | 'bald' | 'cap' | 'mohawk' | 'braids' | 'helmet';
export type CostumeId = 'default' | 'maculele' | 'mestre' | 'rua' | 'orbital' | 'kilombo' | 'xray';

export const COSTUME_LIST: readonly { id: CostumeId; label: string }[] = [
  { id: 'default', label: 'Roda Classic' },
  { id: 'maculele', label: 'Maculelê' },
  { id: 'mestre', label: 'Mestre Angola' },
  { id: 'rua', label: 'Street Roda' },
  { id: 'orbital', label: 'Orbital EVA' },
  { id: 'kilombo', label: 'Kilombo Paint' },
  { id: 'xray', label: 'X-Ray Bones' },
];

export interface Palette {
  skin: string;
  abada: string;   // capoeira trousers
  shirt: string | null; // null = shirtless
  cordao: string;  // belt (rank colour)
  accent: string;
  hair: string;
}

export interface CharacterDef {
  id: string;
  name: string;
  apelido: string;
  archetype: string;
  style: Style;
  playable: boolean;      // available in this build
  body: BodyScale;
  mass: number;           // kg
  health: number;
  walkSpeed: number;      // m/s forward walk in ginga
  backSpeed: number;
  stanceShift: number;    // frames for a stance transition
  damageMul: number;
  gingaPeriod: number;    // frames per full ginga cycle
  hair: HairStyle;
  palettes: Palette[];    // alt colours for mirror matches
  blurb: string;
}

const S = (o: Partial<BodyScale>): BodyScale => ({ ...DEFAULT_SCALE, ...o });

export const ROSTER: CharacterDef[] = [
  {
    id: 'faisca', name: 'Faísca', apelido: '"The Spark"', archetype: 'Regional Acrobat', style: 'REGIONAL',
    playable: true, body: S({ height: 1.0, leg: 1.04 }), mass: 64, health: 170,
    walkSpeed: 1.9, backSpeed: 1.5, stanceShift: 10, damageMul: 1, gingaPeriod: 64, hair: 'mohawk',
    palettes: [
      { skin: '#a86b45', abada: '#f2f0e8', shirt: null, cordao: '#2a7de1', accent: '#ffb000', hair: '#1a1210' },
      { skin: '#d9a37a', abada: '#22252b', shirt: null, cordao: '#e03a3a', accent: '#40e0ff', hair: '#e8c060' },
      { skin: '#6b4026', abada: '#3fa34d', shirt: null, cordao: '#ffd400', accent: '#ffffff', hair: '#0d0d0d' },
    ],
    blurb: 'Explosive Regional-style acrobat. Fast ginga, Aú Batido launcher, huge aerial juggles.',
  },
  {
    id: 'jacare', name: 'Velho Jacaré', apelido: '"Old Alligator"', archetype: 'Angola Traditionalist', style: 'ANGOLA',
    playable: true, body: S({ height: 0.96, torso: 1.02, girth: 1.08 }), mass: 72, health: 175,
    walkSpeed: 1.4, backSpeed: 1.2, stanceShift: 12, damageMul: 1.08, gingaPeriod: 84, hair: 'cap',
    palettes: [
      { skin: '#5c3a24', abada: '#f5f1e6', shirt: '#e9e2cf', cordao: '#7b5a2a', accent: '#c8102e', hair: '#d8d8d8' },
      { skin: '#6b4228', abada: '#1c2430', shirt: '#d8b24c', cordao: '#f5f1e6', accent: '#00a896', hair: '#e8e8e8' },
      { skin: '#4b2d1b', abada: '#6b2222', shirt: '#f0ead8', cordao: '#e6b800', accent: '#f5f1e6', hair: '#c8c8c8' },
    ],
    blurb: 'Slow, deceptive malícia. Ultra-low Negativa, devastating Rasteira and Cabeçada.',
  },
  {
    id: 'morcego', name: 'Morcego', apelido: '"The Bat"', archetype: 'Handstand Specialist', style: 'CONTEMPORANEA',
    playable: true, body: S({ height: 0.97, arm: 1.08, girth: 0.92 }), mass: 60, health: 165,
    walkSpeed: 1.7, backSpeed: 1.4, stanceShift: 4, damageMul: 0.97, gingaPeriod: 60, hair: 'braids',
    palettes: [
      { skin: '#8a5a3b', abada: '#2b2440', shirt: null, cordao: '#8f4fd8', accent: '#bfa6ff', hair: '#120c16' },
      { skin: '#c48a64', abada: '#192a36', shirt: null, cordao: '#38d399', accent: '#a8ffd8', hair: '#21152b' },
      { skin: '#6a4128', abada: '#4a1b2d', shirt: null, cordao: '#ff70a6', accent: '#ffd6e6', hair: '#0d090f' },
    ],
    blurb: 'Lives upside down. Instant Bananeira, Helicóptero and ceiling drops.',
  },
  {
    id: 'touro', name: 'Touro', apelido: '"The Bull"', archetype: 'Heavyweight Contragolpe', style: 'REGIONAL',
    playable: true, body: S({ height: 1.08, girth: 1.3, arm: 1.02 }), mass: 98, health: 190,
    walkSpeed: 1.3, backSpeed: 1.0, stanceShift: 14, damageMul: 1.15, gingaPeriod: 80, hair: 'bald',
    palettes: [
      { skin: '#7a4a2c', abada: '#ececec', shirt: null, cordao: '#7a2d1a', accent: '#d64000', hair: '#000' },
      { skin: '#9d623e', abada: '#262322', shirt: null, cordao: '#e65c00', accent: '#ffb703', hair: '#111' },
      { skin: '#58321c', abada: '#3b4a3f', shirt: null, cordao: '#d9d9d9', accent: '#e63946', hair: '#000' },
    ],
    blurb: 'Armoured counters, Vingativa and Banda. Barely drifts in zero-G.',
  },
  {
    id: 'quebra', name: 'Quebra', apelido: '"Breaker"', archetype: 'Street Break-Capoeirista', style: 'CONTEMPORANEA',
    playable: true, body: S({ height: 0.98 }), mass: 68, health: 170,
    walkSpeed: 1.8, backSpeed: 1.5, stanceShift: 8, damageMul: 1, gingaPeriod: 56, hair: 'cap',
    palettes: [
      { skin: '#c48a60', abada: '#1e3a5f', shirt: '#ff5a1f', cordao: '#ff5a1f', accent: '#ffd23f', hair: '#222' },
      { skin: '#8d5b3c', abada: '#202024', shirt: '#00b4d8', cordao: '#90e0ef', accent: '#ffbe0b', hair: '#181818' },
      { skin: '#dfb18d', abada: '#4b2040', shirt: '#f72585', cordao: '#4cc9f0', accent: '#ffffff', hair: '#302016' },
    ],
    blurb: 'Toprock ginga, windmill sweeps and freeze-frame mixups.',
  },
  {
    id: 'grima', name: 'Grima', apelido: '"The Stick"', archetype: 'Maculelê Rhythm Fighter', style: 'MACULELE',
    playable: true, body: S({ height: 1.02 }), mass: 75, health: 172,
    walkSpeed: 1.6, backSpeed: 1.3, stanceShift: 10, damageMul: 1.02, gingaPeriod: 64, hair: 'dreads',
    palettes: [
      { skin: '#4e2f1c', abada: '#f3e3b3', shirt: null, cordao: '#c8102e', accent: '#c8102e', hair: '#1a1008' },
      { skin: '#74482c', abada: '#e5d4a6', shirt: null, cordao: '#1d6f42', accent: '#f4a261', hair: '#2b1b0e' },
      { skin: '#3b2112', abada: '#22201d', shirt: null, cordao: '#e76f51', accent: '#ffd166', hair: '#120b05' },
    ],
    blurb: 'Dual grimas with disjointed reach. Parries double on the downbeat.',
  },
  {
    id: 'orbita', name: 'Órbita', apelido: '"Orbit"', archetype: 'Zero-G Orbital Engineer', style: 'CONTEMPORANEA',
    playable: true, body: S({ height: 1.0 }), mass: 70, health: 170,
    walkSpeed: 1.6, backSpeed: 1.4, stanceShift: 10, damageMul: 1, gingaPeriod: 64, hair: 'helmet',
    palettes: [
      { skin: '#b07850', abada: '#dfe6ee', shirt: '#2f6fd6', cordao: '#2f6fd6', accent: '#ff8a00', hair: '#ccd' },
      { skin: '#7c5136', abada: '#2b303a', shirt: '#e67e22', cordao: '#40e0ff', accent: '#40e0ff', hair: '#dfe6ee' },
      { skin: '#d7a983', abada: '#e8ecef', shirt: '#7b2cbf', cordao: '#ffbe0b', accent: '#00f5d4', hair: '#bbc6d6' },
    ],
    blurb: 'Mag-boots snap to any surface — or float free and thruster-dash.',
  },
  {
    id: 'sombra', name: 'Sombra', apelido: '"Shadow"', archetype: 'Defensive Counter-Mestre', style: 'ANGOLA',
    playable: true, body: S({ height: 1.01, arm: 1.03 }), mass: 70, health: 170,
    walkSpeed: 1.6, backSpeed: 1.6, stanceShift: 9, damageMul: 1, gingaPeriod: 72, hair: 'short',
    palettes: [
      { skin: '#3e2617', abada: '#141414', shirt: null, cordao: '#e6e6e6', accent: '#9ad', hair: '#000' },
      { skin: '#6b442b', abada: '#1e1c2e', shirt: null, cordao: '#f4d35e', accent: '#ee964b', hair: '#12101a' },
      { skin: '#9a6847', abada: '#f0f0f0', shirt: null, cordao: '#1d3557', accent: '#a8dadc', hair: '#0d0d0d' },
    ],
    blurb: 'Esquivas that auto-parry and turn your momentum into throws.',
  },
  {
    id: 'ciclone', name: 'Ciclone', apelido: '"Cyclone"', archetype: 'Whirling Pião Striker', style: 'REGIONAL',
    playable: true, body: S({ height: 1.04, leg: 1.1 }), mass: 74, health: 170,
    walkSpeed: 1.7, backSpeed: 1.4, stanceShift: 10, damageMul: 1, gingaPeriod: 60, hair: 'bun',
    palettes: [
      { skin: '#d0a07a', abada: '#0f6e6e', shirt: null, cordao: '#00c2a8', accent: '#e0fffa', hair: '#3b1f12' },
      { skin: '#8d5a38', abada: '#1d3557', shirt: null, cordao: '#ffd166', accent: '#4ecdc4', hair: '#1a0e08' },
      { skin: '#e0b896', abada: '#f4f1de', shirt: null, cordao: '#e07a5f', accent: '#3d405b', hair: '#5a2d1b' },
    ],
    blurb: 'Every consecutive spin gains frame advantage. Armada Dupla, Parafuso.',
  },
  {
    id: 'pipoca', name: 'Pipoca', apelido: '"Popcorn"', archetype: 'Agile Youth Prodigy', style: 'CONTEMPORANEA',
    playable: true, body: S({ height: 0.84, head: 1.08 }), mass: 50, health: 160,
    walkSpeed: 2.1, backSpeed: 1.8, stanceShift: 7, damageMul: 0.88, gingaPeriod: 52, hair: 'short',
    palettes: [
      { skin: '#9c6644', abada: '#ffe14d', shirt: '#2fbf71', cordao: '#2fbf71', accent: '#fff', hair: '#1b1b1b' },
      { skin: '#cb8d64', abada: '#ff6b6b', shirt: '#f8f9fa', cordao: '#4ecdc4', accent: '#ffe66d', hair: '#2a1a12' },
      { skin: '#593722', abada: '#4ea8de', shirt: '#ffd166', cordao: '#ef476f', accent: '#ffffff', hair: '#101010' },
    ],
    blurb: 'Tiny hurtbox, lightning Rolê, highest combo counts.',
  },
];

export function charById(id: string): CharacterDef {
  return ROSTER.find((c) => c.id === id) ?? ROSTER[0];
}
