export type VisualStyleId = 'sf2' | 'crosshatch' | 'sumie' | 'noturna' | 'lunar';
export type VisualFilterId = 'none' | 'crt' | 'halftone' | 'vhs' | 'noir' | 'afterimage';

export interface StylePreset {
  id: VisualStyleId;
  label: string;
  bgHex: number;
  fogHex: number;
  fogNear: number;
  fogFar: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  sunColor: number;
  sunIntensity: number;
  sunPos: [number, number, number];
  rimColor: number;
  rimIntensity: number;
  lanternColor: number;
  lanternIntensity: number;
  exposure: number;
  hatchStrength: number;
  rimBoost: number;
  sumieMix: number;
  outlineScale: number;
  outlineColor: number;
  skyZenith: number;
  skyMid: number;
  skyHorizon: number;
  sunDiscColor: number;
  starStrength: number;
  earthRise: number;
}

export interface FilterPreset {
  id: VisualFilterId;
  label: string;
  description: string;
}

export const STYLE_PRESETS: readonly StylePreset[] = [
  {
    id: 'sf2',
    label: 'Bahia Sunset Cel',
    bgHex: 0x3b2458,
    fogHex: 0xe68452,
    fogNear: 18,
    fogFar: 46,
    hemiSky: 0xffd7a8,
    hemiGround: 0x6b3a24,
    hemiIntensity: 1.05,
    sunColor: 0xffd2a0,
    sunIntensity: 2.3,
    sunPos: [4.5, 9.5, 6.5],
    rimColor: 0x52c7ff,
    rimIntensity: 0.65,
    lanternColor: 0xffb35c,
    lanternIntensity: 0.0,
    exposure: 1.08,
    hatchStrength: 0.0,
    rimBoost: 0.0,
    sumieMix: 0.0,
    outlineScale: 1.0,
    outlineColor: 0x120e12,
    skyZenith: 0x261a47,
    skyMid: 0xb64b68,
    skyHorizon: 0xff9a52,
    sunDiscColor: 0xfff0c2,
    starStrength: 0.0,
    earthRise: 0.0,
  },
  {
    id: 'crosshatch',
    label: 'Comic Crosshatch',
    bgHex: 0x2b2340,
    fogHex: 0xdf9e6c,
    fogNear: 20,
    fogFar: 48,
    hemiSky: 0xfff2dc,
    hemiGround: 0x3c2c3e,
    hemiIntensity: 0.92,
    sunColor: 0xfff6e5,
    sunIntensity: 2.6,
    sunPos: [5.5, 10.0, 5.5],
    rimColor: 0x38e5ff,
    rimIntensity: 1.15,
    lanternColor: 0xffb35c,
    lanternIntensity: 0.0,
    exposure: 1.12,
    hatchStrength: 0.9,
    rimBoost: 0.45,
    sumieMix: 0.0,
    outlineScale: 1.45,
    outlineColor: 0x0b090e,
    skyZenith: 0x1e254d,
    skyMid: 0x8f4e78,
    skyHorizon: 0xffbc78,
    sunDiscColor: 0xfff8dc,
    starStrength: 0.0,
    earthRise: 0.0,
  },
  {
    id: 'sumie',
    label: 'Bamboo Sumi-e',
    bgHex: 0xe6dac3,
    fogHex: 0xe7dcc6,
    fogNear: 15,
    fogFar: 38,
    hemiSky: 0xf7efe0,
    hemiGround: 0xa2937b,
    hemiIntensity: 1.18,
    sunColor: 0xfff8eb,
    sunIntensity: 1.95,
    sunPos: [3.5, 10.5, 6.0],
    rimColor: 0xd9c5a3,
    rimIntensity: 0.45,
    lanternColor: 0xffcc88,
    lanternIntensity: 0.0,
    exposure: 1.02,
    hatchStrength: 0.35,
    rimBoost: 0.08,
    sumieMix: 0.88,
    outlineScale: 1.65,
    outlineColor: 0x17110c,
    skyZenith: 0xd9cbb1,
    skyMid: 0xe9dfc9,
    skyHorizon: 0xf4ecdc,
    sunDiscColor: 0xb33b24,
    starStrength: 0.0,
    earthRise: 0.0,
  },
  {
    id: 'noturna',
    label: 'Roda Noturna',
    bgHex: 0x090e1d,
    fogHex: 0x111933,
    fogNear: 14,
    fogFar: 38,
    hemiSky: 0x6280c8,
    hemiGround: 0x261b18,
    hemiIntensity: 0.72,
    sunColor: 0xa8c6ff,
    sunIntensity: 1.45,
    sunPos: [-4.0, 10.0, 5.5],
    rimColor: 0x70a8ff,
    rimIntensity: 1.1,
    lanternColor: 0xff9b3d,
    lanternIntensity: 3.2,
    exposure: 1.15,
    hatchStrength: 0.0,
    rimBoost: 0.32,
    sumieMix: 0.0,
    outlineScale: 1.1,
    outlineColor: 0x050812,
    skyZenith: 0x040712,
    skyMid: 0x0d1734,
    skyHorizon: 0x28274d,
    sunDiscColor: 0xe6efff,
    starStrength: 0.9,
    earthRise: 0.0,
  },
  {
    id: 'lunar',
    label: 'Lunar Crater',
    bgHex: 0x04070f,
    fogHex: 0x0a101e,
    fogNear: 20,
    fogFar: 52,
    hemiSky: 0x8fb8ff,
    hemiGround: 0x3b4252,
    hemiIntensity: 0.78,
    sunColor: 0xf2f7ff,
    sunIntensity: 2.65,
    sunPos: [6.0, 8.5, 4.5],
    rimColor: 0x3ce8ff,
    rimIntensity: 1.25,
    lanternColor: 0x45e8ff,
    lanternIntensity: 1.4,
    exposure: 1.12,
    hatchStrength: 0.0,
    rimBoost: 0.38,
    sumieMix: 0.0,
    outlineScale: 0.95,
    outlineColor: 0x071220,
    skyZenith: 0x010205,
    skyMid: 0x040814,
    skyHorizon: 0x11203a,
    sunDiscColor: 0xe6f4ff,
    starStrength: 1.0,
    earthRise: 1.0,
  },
];

export const FILTER_PRESETS: readonly FilterPreset[] = [
  { id: 'none', label: 'HD Crisp', description: 'Clean MSAA cel shading with ACES tone mapping' },
  { id: 'crt', label: 'CPS-1 Arcade CRT', description: 'Curved arcade scanlines, RGB phosphor grille, quantized shading' },
  { id: 'halftone', label: 'Manga Halftone', description: 'CMYK rotated screen dots & crisp comic bloom' },
  { id: 'vhs', label: '90s Roda VHS', description: 'Analog tape grain, tracking shimmer, hit-coupled chroma split' },
  { id: 'noir', label: 'Ink & Ouro', description: 'Dramatic monochrome slate isolating warm golds, reds & cyans' },
  { id: 'afterimage', label: 'Kinetic Ghost', description: 'Motion echo trails & bloom emphasizing fast kicks and acrobatics' },
];

export function stylePreset(id: string | null | undefined): StylePreset {
  return STYLE_PRESETS.find((s) => s.id === id) ?? STYLE_PRESETS[0];
}

export function filterPreset(id: string | null | undefined): FilterPreset {
  return FILTER_PRESETS.find((f) => f.id === id) ?? FILTER_PRESETS[0];
}
