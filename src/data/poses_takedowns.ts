// Capoeira sweeps, trips, scissors, and takedown pose tracks.
import { makePose, type Track } from '../anim/pose';
import { POSE_COCORINHA_HOLD, POSE_GINGA_L, POSE_GINGA_MID, POSE_GINGA_R, POSE_NEUTRAL, POSE_RLX_A } from './poses_helpers';

/** Rasteira: dropped-weight low sweeping leg hook (mudroljub M66). */
export const TRACK_RASTEIRA: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    {
      f: 7,
      easing: 'coil',
      pose: makePose(POSE_RLX_A, {
        root: { ry: -35, rx: 14 },
        bones: { thighR: [-110, -20, -28], shinR: [120, 0, 0] },
      }),
    },
    {
      f: 15,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 32, ry: 70, rz: 14 },
        bones: {
          spine: [18, 20, -10],
          chest: [14, 24, -12],
          head: [-24, -55, 0],
          upperArmL: [-130, 0, 32],
          foreArmL: [-12, 0, 0],
          handL: [70, 0, 0], // left palm braced on floor
          upperArmR: [-55, 25, -45],
          foreArmR: [-65, 0, 0],
          thighL: [-110, 0, 12],
          shinL: [115, 0, 0],
          thighR: [-82, -25, -30], // sweeping foot hooks ankle
          shinR: [14, 0, 0],
          footR: [0, 35, 20],
        },
      }),
    },
    {
      f: 21,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 30, ry: 118, rz: 14 },
        bones: {
          spine: [16, 25, -10],
          head: [-24, -85, 0],
          upperArmL: [-130, 0, 32],
          foreArmL: [-12, 0, 0],
          handL: [70, 0, 0],
          thighL: [-110, 0, 12],
          shinL: [115, 0, 0],
          thighR: [-76, -32, -28],
          shinR: [22, 0, 0],
          footR: [0, 42, 22],
        },
      }),
    },
    { f: 34, pose: POSE_RLX_A },
  ],
};

/** Rasteira de Costas / Meia-Lua-Sweep: spinning low sweep from behind (mudroljub M67). */
export const TRACK_RASTEIRA_DE_COSTAS: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 8, easing: 'coil', pose: makePose(POSE_RLX_A, { root: { ry: -120 } }) },
    {
      f: 18,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 36, ry: -260, rz: -12 },
        bones: {
          upperArmL: [-135, 0, 26],
          foreArmL: [-10, 0, 0],
          handL: [70, 0, 0],
          upperArmR: [-135, 0, -26],
          foreArmR: [-10, 0, 0],
          handR: [70, 0, 0],
          thighL: [-110, 0, 10],
          shinL: [120, 0, 0],
          thighR: [-84, -22, -30],
          shinR: [12, 0, 0],
          footR: [0, 30, 0],
        },
      }),
    },
    { f: 30, pose: makePose(POSE_GINGA_MID, { root: { ry: -360 } }) },
  ],
};

/** Corta Capim (Grass-cutter helicopter low sweep on one hand — mudroljub M68 / minho N37). */
export const TRACK_CORTA_CAPIM: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    { f: 8, easing: 'coil', pose: makePose(POSE_RLX_A, { root: { ry: -60 } }) },
    {
      f: 16,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 52, ry: 120, rz: 22 },
        bones: {
          upperArmL: [-135, 0, 22],
          foreArmL: [-10, 0, 0],
          handL: [72, 0, 0],
          thighL: [-105, 0, 14],
          shinL: [115, 0, 0],
          thighR: [-80, 0, -52], // extended sweeping leg skims floor
          shinR: [6, 0, 0],
        },
      }),
    },
    {
      f: 26,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 52, ry: 300, rz: 22 },
        bones: {
          upperArmL: [-135, 0, 22],
          foreArmL: [-10, 0, 0],
          handL: [72, 0, 0],
          thighL: [-105, 0, 14],
          shinL: [115, 0, 0],
          thighR: [-80, 0, -56],
          shinR: [6, 0, 0],
        },
      }),
    },
    { f: 36, pose: makePose(POSE_GINGA_MID, { root: { ry: 360 } }) },
  ],
};

/** Banda de Frente: stepping outside hook-reap behind opponent's lead calf (mudroljub M69). */
export const TRACK_BANDA_DE_FRENTE: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 6,
      easing: 'coil',
      pose: makePose(POSE_NEUTRAL, {
        root: { dx: 0.16, ry: -20 },
        bones: { thighL: [-32, 0, 12], shinL: [44, 0, 0], thighR: [-52, 0, -14], shinR: [78, 0, 0] },
      }),
    },
    {
      f: 13,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { dx: 0.24, ry: 22 },
        bones: {
          spine: [12, 18, 8],
          upperArmL: [-48, 12, 24],
          foreArmL: [-82, 0, 0],
          upperArmR: [-56, -24, -22],
          foreArmR: [-72, 0, 0],
          thighL: [-28, 0, 10],
          shinL: [38, 0, 0],
          thighR: [-72, 28, 18], // crosses across to reap ankle
          shinR: [28, 0, 0],
          footR: [0, -25, 0],
        },
      }),
    },
    { f: 18, linear: true, pose: makePose(POSE_NEUTRAL, { root: { dx: 0.22, ry: 36 }, bones: { thighR: [-66, 36, 26], shinR: [32, 0, 0] } }) },
    { f: 28, pose: POSE_GINGA_L },
  ],
};

/** Banda de Costas: back-step behind opponent + leg bump/sweep takedown (mudroljub M70). */
export const TRACK_BANDA_DE_COSTAS: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 8,
      easing: 'coil',
      pose: makePose(POSE_NEUTRAL, { root: { dx: -0.22, ry: 125 }, bones: { thighL: [-36, 0, 12], shinL: [52, 0, 0] } }),
    },
    {
      f: 16,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { dx: -0.22, ry: 180 },
        bones: {
          spine: [20, 0, 0],
          head: [-16, -55, 0],
          upperArmR: [-65, 0, -35],
          foreArmR: [-65, 0, 0],
          thighR: [32, 0, -24], // back leg hooks behind opponent knee
          shinR: [42, 0, 0],
          thighL: [-38, 0, 12],
          shinL: [54, 0, 0],
        },
      }),
    },
    { f: 28, pose: makePose(POSE_GINGA_MID, { root: { ry: 360 } }) },
  ],
};

/** Vingativa: low rib-chest tackle with leg hooked behind opponent's calf (mudroljub M71). */
export const TRACK_VINGATIVA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 8,
      easing: 'coil',
      pose: makePose(POSE_COCORINHA_HOLD, { root: { rx: 22, ry: 35 } }),
    },
    {
      f: 17,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { dx: 0.14, rx: 38, ry: 72 },
        bones: {
          spine: [26, 12, -16],
          chest: [22, 16, -18],
          head: [-20, -45, -14],
          upperArmR: [-85, 18, -32], // pressing arm into opponent chest
          foreArmR: [-75, 0, 28],
          upperArmL: [-52, 22, 32],
          foreArmL: [-95, 0, 0],
          thighR: [-52, 14, -22], // planted behind opponent leg
          shinR: [68, 0, 0],
          thighL: [18, 0, 16],
          shinL: [28, 0, 0],
        },
      }),
    },
    { f: 24, linear: true, pose: makePose(POSE_NEUTRAL, { root: { dx: 0.14, rx: 46, ry: 78 }, bones: { spine: [32, 18, -18], upperArmR: [-95, 22, -25] } }) },
    { f: 34, pose: POSE_GINGA_MID },
  ],
};

/** Tesoura de Frente: jumping forward scissor-leg takedown (mudroljub M72 / minho N27). */
export const TRACK_TESOURA_DE_FRENTE: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    { f: 8, easing: 'coil', pose: makePose(POSE_RLX_A, { root: { rx: 28, ry: 25 } }) },
    {
      f: 18,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.24, rx: 48, ry: 85, rz: 68 },
        bones: {
          spine: [18, 12, 0],
          upperArmL: [-130, 0, 28],
          foreArmL: [-12, 0, 0],
          handL: [70, 0, 0],
          upperArmR: [-120, 0, -28],
          foreArmR: [-25, 0, 0],
          thighR: [-85, 0, -18], // front leg in front of waist
          shinR: [12, 0, 0],
          thighL: [-28, 0, 26], // rear leg behind knees (scissor clamp!)
          shinL: [18, 0, 0],
        },
      }),
    },
    {
      f: 26,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.1, rx: 60, ry: 120, rz: 74 },
        bones: {
          upperArmL: [-130, 0, 28],
          handL: [70, 0, 0],
          thighR: [-72, 22, 12],
          thighL: [-42, -22, -12],
        },
      }),
    },
    { f: 36, pose: POSE_RLX_A },
  ],
};

/** Tesoura de Costas: flying back scissor takedown (mudroljub M73). */
export const TRACK_TESOURA_DE_COSTAS: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 8, easing: 'coil', pose: makePose(POSE_NEUTRAL, { root: { ry: -115, rx: 32 } }) },
    {
      f: 19,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.2, rx: 72, ry: -195, rz: -55 },
        bones: {
          upperArmL: [-135, 0, 25],
          upperArmR: [-135, 0, -25],
          thighL: [-82, 0, 18],
          shinL: [12, 0, 0],
          thighR: [-22, 0, -26],
          shinR: [24, 0, 0],
        },
      }),
    },
    { f: 34, pose: makePose(POSE_RLX_A, { root: { ry: -360 } }) },
  ],
};

/** Passagem de Tesoura: gymnastic counter leap escaping over a scissor clamp (mudroljub commented C03). */
export const TRACK_PASSAGEM_DE_TESOURA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    { f: 7, easing: 'coil', pose: POSE_COCORINHA_HOLD },
    {
      f: 15,
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.45, rx: 145, rz: 20 },
        bones: {
          upperArmL: [-165, 0, 18],
          foreArmL: [-10, 0, 0],
          upperArmR: [-165, 0, -18],
          foreArmR: [-10, 0, 0],
          thighL: [-95, 0, 22],
          shinL: [115, 0, 0],
          thighR: [-95, 0, -22],
          shinR: [115, 0, 0],
        },
      }),
    },
    { f: 28, pose: POSE_GINGA_L },
  ],
};

/** Rasteira de Mão: low palm ankle-snatch sweep from Negativa (mudroljub M74). */
export const TRACK_RASTEIRA_DE_MAO: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    { f: 7, easing: 'coil', pose: makePose(POSE_RLX_A, { root: { ry: 22 } }) },
    {
      f: 15,
      easing: 'snap',
      pose: makePose(POSE_RLX_A, {
        root: { rx: 32, ry: -28 },
        bones: {
          spine: [32, -20, 0],
          chest: [28, -24, 0],
          upperArmR: [-95, -20, -10], // snatching arm hooks ankle
          foreArmR: [-18, 0, 0],
          upperArmL: [-125, 0, 28],
          handL: [72, 0, 0],
        },
      }),
    },
    { f: 28, pose: POSE_RLX_A },
  ],
};

/** Arrastão: double-leg scoop takedown drive (mudroljub M75). */
export const TRACK_ARRASTAO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 8, easing: 'coil', pose: makePose(POSE_COCORINHA_HOLD, { root: { rx: 22 } }) },
    {
      f: 18,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 46 },
        bones: {
          spine: [36, 0, 0],
          chest: [26, 0, 0],
          head: [-45, 0, 0],
          upperArmL: [-110, 24, 20], // hugging behind both knees
          foreArmL: [-55, 0, -35],
          upperArmR: [-110, -24, -20],
          foreArmR: [-55, 0, 35],
          thighL: [-58, 0, 12],
          shinL: [78, 0, 0],
          thighR: [20, 0, -12],
          shinR: [32, 0, 0],
        },
      }),
    },
    {
      f: 26,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 14 },
        bones: {
          spine: [10, 0, 0],
          upperArmL: [-105, 18, 12],
          foreArmL: [-68, 0, -25],
          upperArmR: [-105, -18, -12],
          foreArmR: [-68, 0, 25],
          thighL: [-38, 0, 10],
          shinL: [55, 0, 0],
        },
      }),
    },
    { f: 36, pose: POSE_GINGA_MID },
  ],
};

/** Boca de Calça: crouching double cuff-pull takedown (mudroljub M76). */
export const TRACK_BOCA_DE_CALCA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    { f: 8, easing: 'coil', pose: makePose(POSE_COCORINHA_HOLD, { root: { rx: 28 } }) },
    {
      f: 17,
      easing: 'snap',
      pose: makePose(POSE_COCORINHA_HOLD, {
        root: { rx: 36 },
        bones: {
          spine: [38, 0, 0],
          upperArmL: [-95, 12, 10],
          foreArmL: [-28, 0, 0],
          upperArmR: [-95, -12, -10],
          foreArmR: [-28, 0, 0],
        },
      }),
    },
    {
      f: 25,
      linear: true,
      pose: makePose(POSE_COCORINHA_HOLD, {
        root: { rx: 16 },
        bones: {
          upperArmL: [-65, 18, 22],
          foreArmL: [-85, 0, 0],
          upperArmR: [-65, -18, -22],
          foreArmR: [-85, 0, 0],
        },
      }),
    },
    { f: 34, pose: POSE_GINGA_MID },
  ],
};

/** Cruz: ducking double-ankle shoulder scoop throw (mudroljub M77). */
export const TRACK_CRUZ: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 9, easing: 'coil', pose: makePose(POSE_COCORINHA_HOLD, { root: { rx: 42, ry: 20 } }) },
    {
      f: 18,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 18, ry: 12 },
        bones: {
          spine: [18, 0, 12],
          upperArmL: [-82, 10, 18],
          foreArmL: [-90, 0, -15],
          upperArmR: [-82, -10, -18],
          foreArmR: [-90, 0, 15],
          thighL: [-34, 0, 12],
          shinL: [50, 0, 0],
          thighR: [-34, 0, -12],
          shinR: [50, 0, 0],
        },
      }),
    },
    { f: 32, pose: POSE_GINGA_MID },
  ],
};
