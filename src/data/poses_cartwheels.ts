// Capoeira Base sway (Balança) + full Aú Cartwheel & Cartwheel-Kick pose tracks.
import { makePose, type Track } from '../anim/pose';
import {
  buildSpinTrack,
  POSE_GINGA_L,
  POSE_GINGA_MID,
  POSE_GINGA_R,
  POSE_HEADSTAND_BASE,
  POSE_HSP_A,
  POSE_HSP_B,
  POSE_NEUTRAL,
  POSE_QDR_BASE,
} from './poses_helpers';

/** Balança (rhythmic shoulder-drop weight fake left <-> right in guard). */
export const TRACK_BALANCA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 6,
      easing: 'snap',
      pose: makePose(POSE_GINGA_MID, {
        root: { dx: 0.12, ry: 22, rz: 10 },
        bones: {
          spine: [18, 12, 10],
          upperArmL: [-72, 20, 22],
          foreArmL: [-110, 0, -25],
          thighL: [-54, 10, 14],
          shinL: [74, 0, 0],
        },
      }),
    },
    {
      f: 14,
      easing: 'snap',
      pose: makePose(POSE_GINGA_MID, {
        root: { dx: -0.12, ry: -22, rz: -10 },
        bones: {
          spine: [18, -12, -10],
          upperArmR: [-72, -20, -22],
          foreArmR: [-110, 0, 25],
          thighR: [-54, -10, -14],
          shinR: [74, 0, 0],
        },
      }),
    },
    { f: 22, pose: POSE_GINGA_MID },
  ],
};

/** Aú (Standard cartwheel entering inverted Bananeira/HSP). */
export const TRACK_AU: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 7,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 40, rz: 85, dy: 0.08 },
        bones: {
          upperArmL: [-165, 0, 15],
          upperArmR: [-155, 0, -20],
          thighL: [10, 0, 45],
          thighR: [-10, 0, -55],
        },
      }),
    },
    {
      f: 14,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 175, rz: 0, dy: 0.04 },
        bones: { thighL: [0, 0, 48], shinL: [10, 0, 0], thighR: [0, 0, -48], shinR: [10, 0, 0] },
      }),
    },
    { f: 22, pose: POSE_HSP_A },
  ],
};

/** Aú Fechado (Closed tight tucked-leg defensive cartwheel). */
export const TRACK_AU_FECHADO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 8,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 105, rz: 70 },
        bones: {
          upperArmL: [-160, 0, 10],
          upperArmR: [-160, 0, -10],
          thighL: [-78, 0, 12],
          shinL: [108, 0, 0],
          thighR: [-78, 0, -12],
          shinR: [108, 0, 0],
        },
      }),
    },
    {
      f: 15,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 172, ry: 20, rz: -10 },
        bones: { thighL: [-70, 0, 14], shinL: [115, 0, 0], thighR: [-70, 0, -14], shinR: [115, 0, 0] },
      }),
    },
    { f: 24, pose: POSE_GINGA_L },
  ],
};

/** Aú Pesado (Heavy dual-foot landing cartwheel into deep cadeira). */
export const TRACK_AU_PESADO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 8,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 168, rz: 20 },
        bones: { thighL: [-20, 0, 35], thighR: [10, 0, -45] },
      }),
    },
    {
      f: 16,
      easing: 'snap',
      pose: makePose(POSE_GINGA_MID, {
        root: { dx: 0.14 },
        bones: {
          spine: [24, 0, 0],
          thighL: [-82, 16, 18],
          shinL: [105, 0, 0],
          thighR: [-82, -16, -18],
          shinR: [105, 0, 0],
          upperArmL: [-55, 18, 25],
          foreArmL: [-95, 0, -25],
          upperArmR: [-55, -18, -25],
          foreArmR: [-95, 0, 25],
        },
      }),
    },
    { f: 26, pose: POSE_GINGA_MID },
  ],
};

/** Aú de Cabeça (Cartwheel pausing smoothly through a tripod headstand). */
export const TRACK_AU_DE_CABECA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 9,
      pose: makePose(POSE_HEADSTAND_BASE, {
        root: { rx: 150, rz: 45 },
        bones: { thighL: [0, 0, 42], thighR: [0, 0, -42], shinL: [18, 0, 0], shinR: [18, 0, 0] },
      }),
    },
    {
      f: 18,
      pose: makePose(POSE_HEADSTAND_BASE, {
        root: { rx: 178, ry: 15 },
        bones: { thighL: [-15, 0, 52], thighR: [15, 0, -52] },
      }),
    },
    { f: 28, pose: POSE_GINGA_L },
  ],
};

/** Aú Queda de Rins (Cartwheel pausing laterally balanced on bent elbow). */
export const TRACK_AU_QUEDA_DE_RINS: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 8,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 145, rz: 48 },
        bones: { thighL: [-15, 0, 50], thighR: [10, 0, -55] },
      }),
    },
    { f: 16, pose: POSE_QDR_BASE },
    { f: 22, linear: true, pose: POSE_QDR_BASE },
    { f: 30, pose: POSE_GINGA_R },
  ],
};

/** Aú de Coluna / Aú de Costas (Deep backward-arch spine cartwheel). */
export const TRACK_AU_DE_COLUNA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 9,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 155, rz: 15 },
        bones: {
          pelvis: [-20, 0, 0],
          spine: [-26, 0, 0],
          chest: [-28, 0, 0],
          head: [-25, 0, 0],
          thighL: [32, 0, 20],
          shinL: [45, 0, 0],
          thighR: [20, 0, -25],
          shinR: [35, 0, 0],
        },
      }),
    },
    { f: 26, pose: POSE_GINGA_R },
  ],
};

/** Aú Reversão (Compass kick momentum reversing into inverted walkover). */
export const TRACK_AU_REVERSAO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 7,
      easing: 'coil',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 78, ry: 120 },
        bones: { upperArmL: [-150, 0, 18], upperArmR: [-150, 0, -18], thighR: [-10, 0, -85] },
      }),
    },
    {
      f: 15,
      easing: 'snap',
      pose: makePose(POSE_HSP_A, {
        root: { rx: 175, ry: 220 },
        bones: { thighR: [-45, 0, -15], thighL: [35, 0, 25] },
      }),
    },
    { f: 28, pose: POSE_GINGA_L },
  ],
};

/** Aú de Frente (Forward walkover / cartwheel toward opponent). */
export const TRACK_AU_DE_FRENTE: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 8,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 125, dz: 0.2 },
        bones: {
          upperArmL: [-172, 0, 12],
          upperArmR: [-172, 0, -12],
          handL: [75, 0, 0],
          handR: [75, 0, 0],
          thighL: [-15, 0, 6],
          thighR: [42, 0, -6],
        },
      }),
    },
    {
      f: 16,
      easing: 'snap',
      pose: makePose(POSE_HSP_A, {
        root: { rx: 225, ry: 0, dz: 0.35 },
        bones: { spine: [-18, 0, 0], chest: [-16, 0, 0], thighL: [25, 0, 8], thighR: [-25, 0, -8] },
      }),
    },
    { f: 26, pose: POSE_GINGA_MID },
  ],
};

/** Aú Giratória (Full 360° twist during handstand phase). */
export const TRACK_AU_GIRATORIA: Track = buildSpinTrack(
  POSE_GINGA_MID,
  [
    { f: 8, base: POSE_HSP_A, spec: { root: { rx: 172, ry: 120 }, bones: { thighL: [0, 0, 48], thighR: [0, 0, -48] } } },
    { f: 16, base: POSE_HSP_A, spec: { root: { rx: 175, ry: 250 }, bones: { thighL: [0, 0, 35], thighR: [0, 0, -35] } } },
    { f: 23, base: POSE_GINGA_MID, spec: { root: { rx: 15, ry: 355 } } },
  ],
  POSE_GINGA_MID,
  30,
);

/** Aú com uma Mão (Single-arm cartwheel, free arm shielding face). */
export const TRACK_AU_UMA_MAO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 10,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 168, rz: -12 },
        bones: {
          upperArmL: [-172, 0, 10],
          foreArmL: [-6, 0, 0],
          handL: [75, 0, 0],
          upperArmR: [-72, -35, -35], // free guard arm!
          foreArmR: [-105, 0, 35],
          thighL: [0, 0, 52],
          shinL: [8, 0, 0],
          thighR: [0, 0, -52],
          shinR: [8, 0, 0],
        },
      }),
    },
    { f: 24, pose: POSE_GINGA_L },
  ],
};

/** Aú sem Mão (No-handed aerial sideways flip). */
export const TRACK_AU_SEM_MAO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 6,
      easing: 'coil',
      pose: makePose(POSE_GINGA_MID, {
        root: { rx: 32, ry: -20 },
        bones: { thighL: [-65, 0, 12], shinL: [88, 0, 0], upperArmL: [35, 0, 30], upperArmR: [35, 0, -30] },
      }),
    },
    {
      f: 14,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.62, rx: 176, ry: 20, rz: 15 },
        bones: {
          upperArmL: [-95, 0, 48],
          foreArmL: [-70, 0, 0],
          upperArmR: [-95, 0, -48],
          foreArmR: [-70, 0, 0],
          thighL: [0, 0, 66],
          shinL: [10, 0, 0],
          thighR: [0, 0, -66],
          shinR: [10, 0, 0],
        },
      }),
    },
    {
      f: 21,
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.25, rx: 280, rz: -20 },
        bones: { thighL: [-28, 0, 18], shinL: [45, 0, 0] },
      }),
    },
    { f: 28, pose: POSE_GINGA_L },
  ],
};

/** Aú Trançado (Minhoquinho: reversed 1-handed braided leg crossover cartwheel). */
export const TRACK_AU_TRANCADO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 9,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 165, ry: 90, rz: 18 },
        bones: {
          upperArmR: [-172, 0, -10],
          handR: [75, 0, 0],
          upperArmL: [-65, 25, 35],
          foreArmL: [-95, 0, -25],
          thighL: [-28, 25, -18], // legs cross/braid overhead!
          shinL: [55, 0, 0],
          thighR: [18, -25, 16],
          shinR: [25, 0, 0],
        },
      }),
    },
    {
      f: 18,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 165, ry: 180, rz: -15 },
        bones: {
          upperArmR: [-172, 0, -10],
          upperArmL: [-155, 0, 15],
          thighL: [18, 0, 32],
          thighR: [-28, 0, -32],
        },
      }),
    },
    { f: 28, pose: POSE_GINGA_L },
  ],
};

/** Aú-Zinho (Minhoquinho: tight on-the-spot compact curved cartwheel). */
export const TRACK_AU_ZINHO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 9,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 168, ry: 45, rz: 12 },
        bones: {
          spine: [-18, 12, 0],
          chest: [-18, 14, 0],
          thighL: [-48, 0, 16],
          shinL: [88, 0, 0],
          thighR: [-20, 0, -18],
          shinR: [75, 0, 0],
        },
      }),
    },
    { f: 22, pose: POSE_GINGA_MID },
  ],
};

/** Aú Amazonas (Stylized asymmetric bent/split leg poses suspended in handstand). */
export const TRACK_AU_AMAZONAS: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 10,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 176, rz: -10 },
        bones: {
          thighL: [-42, 18, 62],
          shinL: [98, 0, 0], // sculptural hooked front leg
          thighR: [28, -14, -58],
          shinR: [12, 0, 0],
        },
      }),
    },
    { f: 18, linear: true, pose: makePose(POSE_HSP_A, { root: { rx: 176, ry: 35 }, bones: { thighL: [-42, 18, 62], shinL: [98, 0, 0], thighR: [28, -14, -58], shinR: [12, 0, 0] } }) },
    { f: 28, pose: POSE_GINGA_L },
  ],
};

/** Aú Cordão de Ouro (Aú CDO — asymmetric whip-hip twisting handstand flourish). */
export const TRACK_AU_CDO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 8,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 165, ry: 115, rz: -22 },
        bones: {
          spine: [-14, 28, -14],
          upperArmL: [-172, 0, 15],
          handL: [75, 0, 0],
          upperArmR: [-85, -20, -45],
          thighL: [-22, 0, 58],
          shinL: [72, 0, 0],
          thighR: [14, 0, -52],
          shinR: [18, 0, 0],
        },
      }),
    },
    {
      f: 18,
      pose: makePose(POSE_GINGA_MID, {
        root: { rx: 28, ry: 220 },
        bones: { spine: [22, 18, 0], upperArmR: [-120, 0, -25], thighR: [-65, 0, -18], shinR: [24, 0, 0] },
      }),
    },
    { f: 28, pose: POSE_GINGA_L },
  ],
};

/** Macaco em Pé / Aú Macaco em Pé (Standing back-reach cartwheel/walkover). */
export const TRACK_MACACO_EM_PE: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 6,
      easing: 'coil',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -28, ry: 25 },
        bones: { spine: [-22, -18, 0], chest: [-24, -22, 0], upperArmR: [-155, -20, -25] },
      }),
    },
    {
      f: 14,
      easing: 'snap',
      pose: makePose(POSE_HSP_A, {
        root: { rx: -158, ry: 15, rz: 14 },
        bones: {
          spine: [-18, 0, 0],
          upperArmR: [-170, 0, -12],
          upperArmL: [-160, 0, 16],
          thighL: [0, 0, 48],
          thighR: [0, 0, -48],
        },
      }),
    },
    { f: 26, pose: POSE_GINGA_R },
  ],
};

// ---------------------------------------------------------------------------
// Cartwheel Kicks
// ---------------------------------------------------------------------------

/** Aú Batido (Signature upward L-kick cartwheel launcher). */
export const TRACK_AU_BATIDO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 6,
      easing: 'coil',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 35, rz: 70, dy: 0.14 },
        bones: { upperArmL: [-165, 0, 10], upperArmR: [-160, 0, -25], thighL: [-20, 0, 35], thighR: [15, 0, -45] },
      }),
    },
    {
      f: 12,
      easing: 'snap',
      pose: makePose(POSE_HSP_A, {
        root: { rx: 165, ry: 20, rz: -12, dy: 0.1 },
        bones: {
          upperArmL: [-165, 0, 20],
          upperArmR: [-60, 0, -45],
          thighR: [115, 0, -20],
          shinR: [8, 0, 0],
          thighL: [30, 0, 40],
          shinL: [65, 0, 0],
        },
      }),
    },
    {
      f: 19,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 165, rz: -30, dy: 0.12 },
        bones: { thighR: [-35, 0, -30], shinR: [40, 0, 0] },
      }),
    },
    { f: 30, pose: POSE_GINGA_R },
  ],
};

/** Aú Batendo (Rapid twin scissor-kicking cartwheel advance). */
export const TRACK_AU_BATENDO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 7,
      easing: 'snap',
      pose: makePose(POSE_HSP_A, {
        root: { rx: 162, rz: 22 },
        bones: { thighL: [108, 0, 18], shinL: [6, 0, 0], thighR: [-15, 0, -42] },
      }),
    },
    {
      f: 14,
      easing: 'snap',
      pose: makePose(POSE_HSP_A, {
        root: { rx: 162, rz: -22 },
        bones: { thighR: [108, 0, -18], shinR: [6, 0, 0], thighL: [-15, 0, 42] },
      }),
    },
    { f: 28, pose: POSE_GINGA_L },
  ],
};

/** Aú Navalha (Razor-sharp 1-handed rib-height slicing cartwheel kick). */
export const TRACK_AU_NAVALHA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 6,
      easing: 'coil',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 52, ry: -35, rz: 45 },
        bones: { upperArmL: [-160, 0, 15], handL: [70, 0, 0] },
      }),
    },
    {
      f: 11,
      easing: 'snap',
      pose: makePose(POSE_HSP_A, {
        root: { rx: 138, ry: -55, rz: -28 },
        bones: {
          upperArmL: [-168, 0, 10],
          handL: [75, 0, 0],
          upperArmR: [-65, -25, -45],
          foreArmR: [-95, 0, 25],
          thighR: [25, 0, -96], // razor horizontal slice across ribs!
          shinR: [5, 0, 0],
          footR: [28, 0, 0],
          thighL: [-25, 0, 32],
          shinL: [75, 0, 0],
        },
      }),
    },
    { f: 15, linear: true, pose: makePose(POSE_HSP_A, { root: { rx: 138, ry: -55, rz: -28 }, bones: { upperArmL: [-168, 0, 10], handL: [75, 0, 0], thighR: [25, 0, -96], shinR: [5, 0, 0], thighL: [-25, 0, 32], shinL: [75, 0, 0] } }) },
    { f: 26, pose: POSE_GINGA_L },
  ],
};

/** Helicóptero (Spinning twin-leg helicopter whip from Bananeira). */
export const TRACK_HELICOPTERO: Track = buildSpinTrack(
  POSE_HSP_A,
  [
    { f: 7, base: POSE_HSP_A, spec: { root: { rx: 175, ry: 120 }, bones: { thighL: [0, 0, 68], shinL: [8, 0, 0], thighR: [0, 0, -68], shinR: [8, 0, 0] } } },
    { f: 14, base: POSE_HSP_A, spec: { root: { rx: 175, ry: 240 }, bones: { thighL: [0, 0, 72], shinL: [8, 0, 0], thighR: [0, 0, -72], shinR: [8, 0, 0] } } },
    { f: 21, base: POSE_HSP_A, spec: { root: { rx: 175, ry: 350 }, bones: { thighL: [0, 0, 62], shinL: [15, 0, 0], thighR: [0, 0, -62], shinR: [15, 0, 0] } } },
  ],
  POSE_HSP_B,
  30,
);

/** Aú Chibata (Downward-slashing whip cartwheel into a ground/crouching target). */
export const TRACK_AU_CHIBATA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 7,
      easing: 'coil',
      pose: makePose(POSE_HSP_A, {
        root: { rx: 172, ry: 35, rz: 15 },
        bones: { thighR: [-10, 0, -85], thighL: [10, 0, 50] },
      }),
    },
    {
      f: 13,
      easing: 'snap',
      pose: makePose(POSE_HSP_A, {
        root: { rx: 142, ry: 75, rz: -25 },
        bones: {
          thighR: [88, 0, -25], // whipping top leg hard downward toward floor!
          shinR: [5, 0, 0],
          thighL: [-20, 0, 48],
          shinL: [45, 0, 0],
        },
      }),
    },
    { f: 26, pose: POSE_GINGA_R },
  ],
};

/** Pião de Mão (Handstand spinning heel whip). */
export const TRACK_PIAO_MAO: Track = buildSpinTrack(
  POSE_HSP_A,
  [
    { f: 6, base: POSE_HSP_A, spec: { root: { rx: 170, ry: 140 }, bones: { thighR: [-25, 0, -65], shinR: [10, 0, 0], thighL: [25, 0, 20], shinL: [75, 0, 0] } } },
    { f: 13, base: POSE_HSP_A, spec: { root: { rx: 168, ry: 290 }, bones: { thighR: [-35, 0, -75], shinR: [8, 0, 0], thighL: [25, 0, 20], shinL: [75, 0, 0] } } },
  ],
  POSE_HSP_A,
  24,
);
