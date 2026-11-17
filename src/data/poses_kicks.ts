// Capoeira Kicks & Headbutts: Chapa, Meia-Lua, Compasso, Escorpião, Martelo, Headbutts & Strikes.
import { makePose, type Track } from '../anim/pose';
import {
  buildSnapKickTrack,
  buildSpinTrack,
  POSE_GINGA_L,
  POSE_GINGA_MID,
  POSE_GINGA_R,
  POSE_NEUTRAL,
  POSE_QDR_BASE,
  POSE_RLX_A,
} from './poses_helpers';

// ---- Chapa Family (Push Kicks) ----

export const TRACK_BENCAO: Track = buildSnapKickTrack({
  start: POSE_GINGA_R,
  end: POSE_GINGA_L,
  windupFrame: 5,
  windup: {
    root: { ry: -14 },
    bones: { thighR: [-95, 0, 0], shinR: [118, 0, 0], upperArmL: [-65, 0, 22], foreArmL: [-85, 0, 0], upperArmR: [-55, 0, -25], foreArmR: [-85, 0, 0] },
  },
  impactFrame: 9,
  holdFrame: 13,
  impact: {
    root: { rx: -16, ry: -12 },
    bones: { spine: [-14, 0, 0], thighR: [-96, 0, -4], shinR: [4, 0, 0], footR: [28, 0, 0], thighL: [14, 0, 6], shinL: [16, 0, 0], upperArmL: [-40, 0, 40], upperArmR: [25, 0, -35] },
  },
  retractFrame: 18,
  retract: { root: { rx: -8 }, bones: { thighR: [-75, 0, 0], shinR: [38, 0, 0] } },
  totalFrames: 26,
});

/** Ground Chapa (Pisão from RLX). */
export const TRACK_CHAPA: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    { f: 7, easing: 'coil', pose: makePose(POSE_RLX_A, { root: { ry: -75, rz: 45 }, bones: { thighR: [-75, 0, -15], shinR: [105, 0, 0] } }) },
    {
      f: 12,
      easing: 'snap',
      pose: makePose(POSE_RLX_A, {
        root: { ry: -85, rz: 58 },
        bones: { thighR: [-25, 0, -85], shinR: [6, 0, 0], footR: [25, 0, 0], upperArmL: [-130, 0, 20], handL: [70, 0, 0] },
      }),
    },
    { f: 28, pose: POSE_RLX_A },
  ],
};

/** Chapa Lateral (Pisão — upright standing side-thrust heel kick). */
export const TRACK_CHAPA_LATERAL: Track = buildSnapKickTrack({
  start: POSE_GINGA_R,
  end: POSE_GINGA_L,
  windupFrame: 5,
  windup: {
    root: { ry: -68, rz: -16 },
    bones: { thighR: [-78, 0, -48], shinR: [118, 0, 0], upperArmL: [-55, 0, 32], upperArmR: [-55, 0, -32] },
  },
  impactFrame: 10,
  holdFrame: 14,
  impact: {
    root: { ry: -86, rz: -38 },
    bones: { spine: [6, 10, -16], head: [0, 72, 16], thighR: [-10, 0, -96], shinR: [5, 0, 0], footR: [20, 0, 0], thighL: [6, 0, 10], upperArmL: [-45, 0, 48], upperArmR: [-65, 0, -25] },
  },
  totalFrames: 26,
});

/** Chapa de Costas (Standing over-the-shoulder back heel thrust). */
export const TRACK_CHAPA_DE_COSTAS: Track = buildSnapKickTrack({
  start: POSE_GINGA_MID,
  end: POSE_GINGA_R,
  windupFrame: 5,
  windup: {
    root: { ry: 145, rx: 16 },
    bones: { thighR: [-70, 0, 0], shinR: [108, 0, 0], head: [-10, -45, 0] },
  },
  impactFrame: 10,
  holdFrame: 15,
  impact: {
    root: { ry: 175, rx: 46 },
    bones: { spine: [24, 15, 0], head: [-18, -32, 0], thighR: [108, 0, -8], shinR: [4, 0, 0], footR: [30, 0, 0], upperArmL: [-40, 0, 42], upperArmR: [-40, 0, -42] },
  },
  totalFrames: 28,
});

/** Chapa Giratória (360° spinning back thrust kick). */
export const TRACK_CHAPA_GIRATORIA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 6, easing: 'coil', pose: makePose(POSE_NEUTRAL, { root: { ry: 110, rx: 12 }, bones: { spine: [12, 24, 0] } }) },
    {
      f: 12,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 192, rx: 38 },
        bones: { head: [-12, -30, 0], thighR: [104, 0, -10], shinR: [4, 0, 0], footR: [25, 0, 0], upperArmL: [-45, 0, 50], upperArmR: [-45, 0, -50] },
      }),
    },
    {
      f: 17,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 192, rx: 38 },
        bones: { thighR: [104, 0, -10], shinR: [4, 0, 0], footR: [25, 0, 0] },
      }),
    },
    { f: 30, pose: POSE_GINGA_L },
  ],
};

/** Vôo do Morcego (Flying bat twin-foot dropkick). */
export const TRACK_VOO_DO_MORCEGO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    { f: 5, easing: 'coil', pose: makePose(POSE_GINGA_MID, { root: { rx: 20 }, bones: { thighL: [-78, 0, 10], shinL: [105, 0, 0], thighR: [-78, 0, -10], shinR: [105, 0, 0] } }) },
    {
      f: 11,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.42, rx: -68, ry: 22 },
        bones: { spine: [-18, 0, 0], thighL: [-92, 0, 8], shinL: [8, 0, 0], thighR: [-86, 0, -8], shinR: [12, 0, 0], upperArmL: [-40, 0, 62], upperArmR: [-40, 0, -62] },
      }),
    },
    {
      f: 17,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.28, rx: -72, ry: 22 },
        bones: { thighL: [-92, 0, 8], shinL: [8, 0, 0], thighR: [-86, 0, -8], shinR: [12, 0, 0] },
      }),
    },
    { f: 30, pose: POSE_RLX_A },
  ],
};

// ---- Meia-Lua Family ----

export const TRACK_MEIA_LUA_FRENTE: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 5, easing: 'coil', pose: makePose(POSE_NEUTRAL, { root: { ry: -18 }, bones: { thighR: [-78, 28, 22], shinR: [15, 0, 0] } }) },
    { f: 10, easing: 'snap', pose: makePose(POSE_NEUTRAL, { root: { rx: -10, ry: 12 }, bones: { thighR: [-102, 0, -32], shinR: [5, 0, 0], upperArmL: [-45, 0, 42], upperArmR: [-45, 0, -42] } }) },
    { f: 15, linear: true, pose: makePose(POSE_NEUTRAL, { root: { rx: -8, ry: 32 }, bones: { thighR: [-84, -18, -48], shinR: [8, 0, 0] } }) },
    { f: 24, pose: POSE_GINGA_L },
  ],
};

export const TRACK_ARMADA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 6,
      easing: 'coil',
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 120 },
        bones: {
          spine: [12, 26, 0],
          chest: [10, 28, 0],
          neck: [0, -32, 0],
          head: [0, -36, 0],
          upperArmL: [-40, 0, 56],
          upperArmR: [-40, 0, -56],
          thighL: [-22, 16, 8],
          shinL: [32, 0, 0],
          footL: [18, 0, 0],
          toeL: [-30, 0, 0],
        },
      }),
    },
    {
      f: 12,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 270, rz: -22 },
        bones: {
          spine: [-6, 12, -8],
          neck: [-4, 18, 6],
          head: [-4, 24, 6],
          thighR: [-102, -14, -26],
          shinR: [4, 0, 0],
          footR: [25, 0, 0],
          thighL: [-14, 18, 8],
          shinL: [18, 0, 0],
          footL: [20, 0, 0],
          toeL: [-34, 0, 0],
          upperArmL: [-40, 0, 68],
          upperArmR: [-40, 0, -68],
        },
      }),
    },
    {
      f: 17,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 325, rz: -14 },
        bones: { thighR: [-82, 0, -14], shinR: [28, 0, 0], footL: [16, 0, 0], toeL: [-24, 0, 0] },
      }),
    },
    { f: 32, pose: POSE_GINGA_L },
  ],
};

/** Armada Dupla (Double spinning aerial envergado crescent). */
export const TRACK_ARMADA_DUPLA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 6, easing: 'coil', pose: makePose(POSE_NEUTRAL, { root: { ry: 125, rx: 14 }, bones: { thighL: [-55, 0, 12], shinL: [85, 0, 0] } }) },
    {
      f: 12,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.45, ry: 260, rz: -28 },
        bones: { spine: [-18, 0, -14], thighL: [-82, 0, 28], shinL: [10, 0, 0], thighR: [-92, 0, -34], shinR: [10, 0, 0], upperArmL: [-55, 0, 65], upperArmR: [-55, 0, -65] },
      }),
    },
    { f: 18, linear: true, pose: makePose(POSE_NEUTRAL, { root: { dy: 0.3, ry: 345, rz: -18 }, bones: { thighL: [-75, 0, 22], shinL: [14, 0, 0], thighR: [-75, 0, -22], shinR: [14, 0, 0] } }) },
    { f: 32, pose: POSE_GINGA_L },
  ],
};

export const TRACK_QUEIXADA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_L },
    {
      f: 6,
      easing: 'coil',
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 52 },
        bones: {
          neck: [0, -24, 0],
          head: [0, -28, 0],
          thighL: [-26, 22, -20],
          shinL: [34, 0, 0],
          thighR: [-28, 0, 12],
          shinR: [54, 0, 0],
          upperArmL: [-50, 0, 45],
          upperArmR: [-50, 0, -45],
        },
      }),
    },
    {
      f: 12,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 15, rx: -10 },
        bones: {
          thighR: [-106, -22, -28],
          shinR: [6, 0, 0],
          footR: [28, 0, 0],
          thighL: [-12, 12, 8],
          shinL: [16, 0, 0],
          upperArmL: [-40, 0, 56],
          upperArmR: [-40, 0, -56],
        },
      }),
    },
    { f: 18, pose: makePose(POSE_NEUTRAL, { root: { ry: -8 }, bones: { thighR: [-48, -12, -24], shinR: [68, 0, 0] } }) },
    { f: 26, pose: POSE_GINGA_R },
  ],
};

/** Queixada de Lado (Lateral side-stepping sweeping jaw kick). */
export const TRACK_QUEIXADA_DE_LADO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 6, pose: makePose(POSE_NEUTRAL, { root: { dx: 0.16, ry: -35 }, bones: { thighR: [-45, -18, 12] } }) },
    { f: 12, easing: 'snap', pose: makePose(POSE_NEUTRAL, { root: { ry: -58, rz: -26 }, bones: { thighR: [-22, 0, -104], shinR: [6, 0, 0], upperArmL: [-45, 0, 55], upperArmR: [-45, 0, -45] } }) },
    { f: 26, pose: POSE_GINGA_L },
  ],
};

// ---- Meia-Lua de Compasso Family ----

export const TRACK_MEIA_LUA_COMPASSO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 6,
      easing: 'coil',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 22, ry: 105, rz: 4 },
        bones: {
          spine: [38, 16, 0],
          chest: [30, 18, 0],
          neck: [-22, -20, 0],
          head: [-20, -28, 0],
          clavicleL: [0, 12, 12],
          upperArmL: [-76, 0, 18],
          handL: [72, 0, 0],
          clavicleR: [0, -12, -12],
          upperArmR: [-76, 0, -18],
          handR: [72, 0, 0],
          thighL: [-54, 16, 12],
          shinL: [48, 0, 0],
          footL: [-8, 0, 0],
          toeL: [-14, 0, 0],
          thighR: [24, 0, -22],
          shinR: [32, 0, 0],
        },
      }),
    },
    {
      f: 14,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 28, ry: 205, rz: 6 },
        bones: {
          spine: [48, 12, -8],
          chest: [38, 14, -6],
          neck: [-28, -24, 0],
          head: [-26, -36, 0],
          clavicleL: [0, 10, 14],
          upperArmL: [-82, 0, 14],
          foreArmL: [-6, 0, 0],
          handL: [74, 0, 0],
          clavicleR: [0, -10, -14],
          upperArmR: [-82, 0, -14],
          foreArmR: [-6, 0, 0],
          handR: [74, 0, 0],
          thighR: [102, -10, -24],
          shinR: [4, 0, 0],
          footR: [-25, 0, 0],
          thighL: [-58, 16, 12],
          shinL: [40, 0, 0],
          footL: [12, 0, 0],
          toeL: [-20, 0, 0],
        },
      }),
    },
    {
      f: 22,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 20, ry: 300, rz: 4 },
        bones: {
          spine: [28, 10, 0],
          chest: [20, 10, 0],
          neck: [-14, -14, 0],
          head: [-14, -18, 0],
          upperArmL: [-96, 0, 20],
          upperArmR: [-96, 0, -20],
          thighR: [28, 0, -48],
          shinR: [36, 0, 0],
          thighL: [-42, 10, 10],
          shinL: [44, 0, 0],
        },
      }),
    },
    { f: 36, pose: POSE_GINGA_MID },
  ],
};

/** Meia Lua Presa (Short compact locked compass crescent). */
export const TRACK_MEIA_LUA_PRESA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 6, easing: 'coil', pose: makePose(POSE_NEUTRAL, { root: { rx: 68, ry: 90 }, bones: { upperArmL: [-145, 0, 20], upperArmR: [-145, 0, -20], thighR: [-25, 0, -40], shinR: [45, 0, 0] } }) },
    { f: 12, easing: 'snap', pose: makePose(POSE_NEUTRAL, { root: { rx: 72, ry: 175, rz: 18 }, bones: { upperArmL: [-155, 0, 15], handL: [70, 0, 0], upperArmR: [-155, 0, -15], handR: [70, 0, 0], thighR: [-14, 0, -88], shinR: [6, 0, 0] } }) },
    { f: 24, pose: POSE_GINGA_R },
  ],
};

/** Meia Lua Solta (Hands-free compass crescent without touching floor). */
export const TRACK_MEIA_LUA_SOLTA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 6, easing: 'coil', pose: makePose(POSE_NEUTRAL, { root: { rx: 52, ry: 115 }, bones: { upperArmL: [-55, 0, 38], foreArmL: [-95, 0, 0], upperArmR: [-55, 0, -38], foreArmR: [-95, 0, 0] } }) },
    { f: 13, easing: 'snap', pose: makePose(POSE_NEUTRAL, { root: { rx: 58, ry: 255, rz: 18 }, bones: { upperArmL: [-62, 0, 48], upperArmR: [-62, 0, -48], thighR: [-12, 0, -96], shinR: [4, 0, 0], thighL: [-48, 0, 10], shinL: [60, 0, 0] } }) },
    { f: 30, pose: POSE_GINGA_L },
  ],
};

/** Meia Lua Dupla (Double continuous spinning compass kick). */
export const TRACK_MEIA_LUA_DUPLA: Track = buildSpinTrack(
  POSE_GINGA_R,
  [
    { f: 8, spec: { root: { rx: 78, ry: 165, rz: 18 }, bones: { upperArmL: [-150, 0, 15], upperArmR: [-150, 0, -15], thighR: [-12, 0, -94], shinR: [4, 0, 0] } } },
    { f: 18, spec: { root: { rx: 78, ry: 345, rz: -18 }, bones: { upperArmL: [-150, 0, 15], upperArmR: [-150, 0, -15], thighL: [-12, 0, 94], shinL: [4, 0, 0] } } },
    { f: 28, spec: { root: { rx: 72, ry: 520, rz: 12 }, bones: { upperArmL: [-140, 0, 20], upperArmR: [-140, 0, -20], thighR: [-18, 0, -86], shinR: [8, 0, 0] } } },
  ],
  POSE_GINGA_MID,
  38,
);

/** Meia Lua de Compasso com Queda de Rins. */
export const TRACK_MEIA_LUA_QUEDA_DE_RINS: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 8, easing: 'snap', pose: makePose(POSE_NEUTRAL, { root: { rx: 82, ry: 205, rz: 20 }, bones: { thighR: [-12, 0, -94], shinR: [4, 0, 0], upperArmL: [-155, 0, 15], upperArmR: [-155, 0, -15] } }) },
    { f: 17, pose: POSE_QDR_BASE },
    { f: 30, pose: POSE_RLX_A },
  ],
};

/** Meia Lua Reversão (Compass whipping over into inverted spinal bridge). */
export const TRACK_MEIA_LUA_REVERSAO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 8, easing: 'snap', pose: makePose(POSE_NEUTRAL, { root: { rx: 84, ry: 195 }, bones: { thighR: [-10, 0, -96], upperArmL: [-155, 0, 15], upperArmR: [-155, 0, -15] } }) },
    { f: 16, pose: makePose(POSE_NEUTRAL, { root: { rx: 175, ry: 230 }, bones: { spine: [-22, 0, 0], chest: [-22, 0, 0], upperArmL: [-170, 0, 12], upperArmR: [-170, 0, -12], thighL: [25, 0, 20], thighR: [-25, 0, -20] } }) },
    { f: 30, pose: POSE_GINGA_L },
  ],
};

/** Meia Lua Pulada (Jumping compass crescent kick). */
export const TRACK_MEIA_LUA_PULADA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 6, easing: 'coil', pose: makePose(POSE_GINGA_MID, { root: { ry: 95 }, bones: { thighL: [-55, 0, 10], shinL: [85, 0, 0] } }) },
    { f: 13, easing: 'snap', pose: makePose(POSE_NEUTRAL, { root: { dy: 0.42, rx: 52, ry: 255, rz: 20 }, bones: { thighR: [-14, 0, -98], shinR: [4, 0, 0], thighL: [-62, 0, 14], shinL: [88, 0, 0], upperArmL: [-65, 0, 50], upperArmR: [-65, 0, -50] } }) },
    { f: 28, pose: POSE_GINGA_L },
  ],
};

/** Meia Lua Pulada sem Mão (Butterfly Kick — horizontal airborne twin-leg compass arc). */
export const TRACK_MEIA_LUA_PULADA_SEM_MAO: Track = buildSpinTrack(
  POSE_GINGA_R,
  [
    { f: 6, spec: { root: { rx: 65, ry: 110 }, bones: { upperArmL: [-40, 0, 55], upperArmR: [-40, 0, -55] } } },
    { f: 12, spec: { root: { dy: 0.56, rx: 86, ry: 245, rz: 15 }, bones: { spine: [-18, 0, 0], thighL: [25, 0, 38], thighR: [25, 0, -55], shinR: [6, 0, 0], upperArmL: [-55, 0, 68], upperArmR: [-55, 0, -68] } } },
    { f: 19, spec: { root: { dy: 0.34, rx: 72, ry: 345, rz: -12 }, bones: { thighL: [-15, 0, 48], thighR: [-35, 0, -25] } } },
  ],
  POSE_GINGA_L,
  30,
);

// ---- Escorpião + Chicote ----

/** Escorpião (Hands planted, arching back heel over crown like scorpion tail). */
export const TRACK_ESCORPIAO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    { f: 7, easing: 'coil', pose: makePose(POSE_NEUTRAL, { root: { rx: 72 }, bones: { upperArmL: [-145, 0, 14], handL: [70, 0, 0], upperArmR: [-145, 0, -14], handR: [70, 0, 0] } }) },
    {
      f: 14,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 112 },
        bones: {
          spine: [-28, 0, 0],
          chest: [-25, 0, 0],
          head: [-25, 0, 0],
          upperArmL: [-160, 0, 12],
          handL: [75, 0, 0],
          upperArmR: [-160, 0, -12],
          handR: [75, 0, 0],
          thighR: [65, 0, -8],
          shinR: [78, 0, 0],
          footR: [30, 0, 0], // stinger heel!
          thighL: [-58, 0, 10],
          shinL: [72, 0, 0],
        },
      }),
    },
    { f: 28, pose: POSE_RLX_A },
  ],
};

/** Escorpião Duplo (Both heels arched forward overhead on planted hands). */
export const TRACK_ESCORPIAO_DUPLO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    { f: 7, easing: 'coil', pose: makePose(POSE_NEUTRAL, { root: { rx: 95 }, bones: { upperArmL: [-155, 0, 14], upperArmR: [-155, 0, -14] } }) },
    {
      f: 14,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 142 },
        bones: {
          spine: [-30, 0, 0],
          chest: [-28, 0, 0],
          upperArmL: [-166, 0, 12],
          handL: [75, 0, 0],
          upperArmR: [-166, 0, -12],
          handR: [75, 0, 0],
          thighL: [58, 0, 10],
          shinL: [76, 0, 0],
          thighR: [58, 0, -10],
          shinR: [76, 0, 0],
        },
      }),
    },
    { f: 28, pose: POSE_GINGA_MID },
  ],
};

/** Escorpião em Pé (Standing balance over-the-head heel kick). */
export const TRACK_ESCORPIAO_EM_PE: Track = buildSnapKickTrack({
  start: POSE_GINGA_MID,
  end: POSE_GINGA_L,
  windupFrame: 6,
  windup: { root: { rx: 42 }, bones: { upperArmL: [-40, 0, 48], upperArmR: [-40, 0, -48], thighL: [-20, 0, 6], shinL: [25, 0, 0] } },
  impactFrame: 12,
  holdFrame: 16,
  impact: { root: { rx: 78 }, bones: { spine: [-18, 0, 0], upperArmL: [-40, 0, 62], upperArmR: [-40, 0, -62], thighR: [82, 0, -10], shinR: [86, 0, 0], footR: [35, 0, 0], thighL: [-72, 0, 6], shinL: [14, 0, 0] } },
  totalFrames: 28,
});

/** Escorpião na Queda de Rins. */
export const TRACK_ESCORPIAO_QUEDA_DE_RINS: Track = {
  keys: [
    { f: 0, pose: POSE_QDR_BASE },
    { f: 10, easing: 'snap', pose: makePose(POSE_QDR_BASE, { root: { rx: 110, ry: -20, rz: 42 }, bones: { thighR: [58, 0, -28], shinR: [82, 0, 0], thighL: [-48, 0, 28], shinL: [65, 0, 0] } }) },
    { f: 16, linear: true, pose: makePose(POSE_QDR_BASE, { root: { rx: 110, ry: -20, rz: 42 }, bones: { thighR: [58, 0, -28], shinR: [82, 0, 0] } }) },
    { f: 26, pose: POSE_QDR_BASE },
  ],
};

/** Chicote (Minhoquinho: explosive floor whip kick lashed out from Queda de Rins). */
export const TRACK_CHICOTE: Track = {
  keys: [
    { f: 0, pose: POSE_QDR_BASE },
    { f: 6, easing: 'coil', pose: makePose(POSE_QDR_BASE, { bones: { thighR: [-72, 0, -15], shinR: [108, 0, 0] } }) },
    { f: 11, easing: 'snap', pose: makePose(POSE_QDR_BASE, { root: { rx: 88, ry: -55, rz: 52 }, bones: { thighR: [-18, 0, -98], shinR: [4, 0, 0], footR: [35, 0, 0] } }) },
    { f: 15, linear: true, pose: makePose(POSE_QDR_BASE, { root: { rx: 88, ry: -55, rz: 52 }, bones: { thighR: [-18, 0, -98], shinR: [4, 0, 0] } }) },
    { f: 25, pose: POSE_RLX_A },
  ],
};

// ---- Martelo & Other Kicks + Headbutts ----

export const TRACK_MARTELO: Track = buildSnapKickTrack({
  start: POSE_GINGA_R,
  end: POSE_GINGA_MID,
  windupFrame: 6,
  windup: { root: { ry: -48, rz: -20 }, bones: { thighR: [-76, 0, -54], shinR: [108, 0, 0], thighL: [-12, 16, 6], shinL: [22, 0, 0], footL: [14, 0, 0], toeL: [-22, 0, 0], upperArmL: [-55, 0, 38], foreArmL: [-90, 0, 0], upperArmR: [-55, 0, -38], foreArmR: [-90, 0, 0] } },
  impactFrame: 10,
  holdFrame: 14,
  impact: { root: { ry: -76, rz: -42 }, bones: { spine: [10, 18, -16], neck: [-4, 24, 10], head: [-4, 28, 12], thighR: [-24, 0, -98], shinR: [6, 0, 0], footR: [42, 0, 0], toeR: [22, 0, 0], thighL: [-10, 22, 10], shinL: [14, 0, 0], footL: [18, 0, 0], toeL: [-26, 0, 0], upperArmL: [-45, 0, 48], upperArmR: [-65, 0, -25], foreArmR: [-95, 0, 0] } },
  retractFrame: 19,
  retract: { root: { ry: -52, rz: -22 }, bones: { thighR: [-38, 0, -72], shinR: [76, 0, 0], thighL: [-10, 12, 8], shinL: [16, 0, 0] } },
  totalFrames: 28,
});

/** Martelo do Chão (Roundhouse kick launched from low 1-hand ground support). */
export const TRACK_MARTELO_DO_CHAO: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    { f: 6, easing: 'coil', pose: makePose(POSE_RLX_A, { root: { rx: 32, ry: -52, rz: 38 }, bones: { upperArmL: [-135, 0, 22], handL: [70, 0, 0], thighR: [-68, 0, -45], shinR: [102, 0, 0] } }) },
    { f: 11, easing: 'snap', pose: makePose(POSE_RLX_A, { root: { rx: 28, ry: -82, rz: 56 }, bones: { upperArmL: [-140, 0, 24], handL: [72, 0, 0], thighR: [-18, 0, -94], shinR: [6, 0, 0], footR: [38, 0, 0] } }) },
    { f: 15, linear: true, pose: makePose(POSE_RLX_A, { root: { rx: 28, ry: -82, rz: 56 }, bones: { thighR: [-18, 0, -94], shinR: [6, 0, 0] } }) },
    { f: 26, pose: POSE_RLX_A },
  ],
};

/** Chapéu de Couro (Wide ground-leaning sweeping body kick). */
export const TRACK_CHAPEU_DE_COURO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 7, easing: 'coil', pose: makePose(POSE_RLX_A, { root: { rx: 56, ry: 75, rz: 28 }, bones: { upperArmL: [-135, 0, 22], thighR: [-25, 0, -52] } }) },
    { f: 14, easing: 'snap', pose: makePose(POSE_NEUTRAL, { root: { rx: 38, ry: -65, rz: 48 }, bones: { spine: [18, -22, 16], thighR: [-22, 0, -96], shinR: [6, 0, 0], upperArmL: [-125, 0, 35], upperArmR: [-50, 0, -45] } }) },
    { f: 28, pose: POSE_GINGA_L },
  ],
};

/** Armada com Martelo (Tornado Kick — spin leap into mid-air roundhouse). */
export const TRACK_ARMADA_COM_MARTELO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 6, easing: 'coil', pose: makePose(POSE_NEUTRAL, { root: { ry: 135 }, bones: { spine: [12, 22, 0], upperArmL: [-40, 0, 50], upperArmR: [-40, 0, -50] } }) },
    { f: 14, easing: 'snap', pose: makePose(POSE_NEUTRAL, { root: { dy: 0.42, ry: 285, rz: -36 }, bones: { thighR: [-22, 0, -96], shinR: [6, 0, 0], footR: [40, 0, 0], thighL: [-55, 0, 12], shinL: [88, 0, 0] } }) },
    { f: 18, linear: true, pose: makePose(POSE_NEUTRAL, { root: { dy: 0.3, ry: 315, rz: -28 }, bones: { thighR: [-22, 0, -96], shinR: [6, 0, 0] } }) },
    { f: 30, pose: POSE_GINGA_L },
  ],
};

export const TRACK_PONTEIRA: Track = buildSnapKickTrack({
  start: POSE_GINGA_L,
  end: POSE_GINGA_R,
  windupFrame: 4,
  windup: { bones: { thighL: [-78, 0, 0], shinL: [100, 0, 0] } },
  impactFrame: 6,
  holdFrame: 9,
  impact: { root: { rx: -10, ry: 10 }, bones: { thighL: [-94, 0, 0], shinL: [6, 0, 0], footL: [42, 0, 0], upperArmL: [-60, 0, 22], foreArmL: [-95, 0, 0], upperArmR: [-60, 0, -22], foreArmR: [-95, 0, 0] } },
  totalFrames: 18,
});

/** Gancho (Whipped outside-to-inside hooking heel kick). */
export const TRACK_GANCHO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 5, easing: 'coil', pose: makePose(POSE_NEUTRAL, { root: { ry: -55, rz: -24 }, bones: { thighR: [-86, -24, -48], shinR: [25, 0, 0] } }) },
    { f: 10, easing: 'snap', pose: makePose(POSE_NEUTRAL, { root: { ry: -82, rz: -34 }, bones: { head: [0, 68, 12], thighR: [-92, 18, -32], shinR: [88, 0, 0], footR: [30, 0, 0] } }) },
    { f: 24, pose: POSE_GINGA_L },
  ],
};

/** Esporão (Minhoquinho: deceptive fast snapping heel-spur whip from high chamber). */
export const TRACK_ESPORAO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 5, easing: 'coil', pose: makePose(POSE_NEUTRAL, { root: { ry: -18 }, bones: { thighR: [-98, 0, 0], shinR: [118, 0, 0] } }) },
    { f: 8, easing: 'snap', pose: makePose(POSE_NEUTRAL, { root: { rx: -14, ry: -52, rz: -22 }, bones: { thighR: [-95, 16, -28], shinR: [4, 0, 0], footR: [32, 0, 0] } }) },
    { f: 12, linear: true, pose: makePose(POSE_NEUTRAL, { root: { rx: -14, ry: -20, rz: -12 }, bones: { thighR: [-95, -24, -10], shinR: [12, 0, 0] } }) },
    { f: 22, pose: POSE_GINGA_L },
  ],
};

/** Joelhada (Close-range surging knee strike). */
export const TRACK_JOELHADA: Track = buildSnapKickTrack({
  start: POSE_GINGA_MID,
  end: POSE_GINGA_R,
  windupFrame: 4,
  windup: { bones: { upperArmL: [-95, 0, 16], upperArmR: [-95, 0, -16], thighR: [20, 0, 0] } },
  impactFrame: 8,
  holdFrame: 12,
  impact: { root: { rx: -14, dz: 0.22 }, bones: { thighR: [-108, 0, 0], shinR: [122, 0, 0], upperArmL: [-55, 22, 16], foreArmL: [-95, 0, -25], upperArmR: [-55, -22, -16], foreArmR: [-95, 0, 25] } },
  totalFrames: 20,
});

// ---- Headbutts + Galopante ----

export const TRACK_CABECADA: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    { f: 6, pose: makePose(POSE_GINGA_MID, { root: { rx: 32 }, bones: { spine: [28, 0, 0], chest: [28, 0, 0], head: [24, 0, 0], upperArmL: [30, 0, 35], upperArmR: [30, 0, -35], thighL: [-55, 0, 10], shinL: [80, 0, 0] } }) },
    { f: 11, linear: true, pose: makePose(POSE_GINGA_MID, { root: { rx: 48, dz: 0.25 }, bones: { spine: [30, 0, 0], chest: [30, 0, 0], head: [28, 0, 0], upperArmL: [40, 0, 45], upperArmR: [40, 0, -45], thighL: [-65, 0, 8], shinL: [70, 0, 0], thighR: [35, 0, -8], shinR: [20, 0, 0] } }) },
    { f: 26, pose: POSE_GINGA_MID },
  ],
};

/** Cabeçada Baixa (Low diving ducking headbutt into stomach). */
export const TRACK_CABECADA_BAIXA: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    { f: 9, easing: 'snap', pose: makePose(POSE_NEUTRAL, { root: { rx: 64, dz: 0.28 }, bones: { spine: [26, 0, 0], chest: [24, 0, 0], head: [20, 0, 0], thighL: [-82, 0, 12], shinL: [98, 0, 0], thighR: [-15, 0, -12], shinR: [42, 0, 0], upperArmL: [35, 0, 35], upperArmR: [35, 0, -35] } }) },
    { f: 14, linear: true, pose: makePose(POSE_NEUTRAL, { root: { rx: 64, dz: 0.28 }, bones: { spine: [26, 0, 0], chest: [24, 0, 0], head: [20, 0, 0], thighL: [-82, 0, 12], shinL: [98, 0, 0] } }) },
    { f: 24, pose: POSE_RLX_A },
  ],
};

/** Cocada (Rising chin/chest skull crown butt from close range). */
export const TRACK_COCADA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    { f: 5, easing: 'coil', pose: makePose(POSE_GINGA_MID, { root: { rx: 22 }, bones: { thighL: [-68, 0, 12], shinL: [96, 0, 0], thighR: [-68, 0, -12], shinR: [96, 0, 0] } }) },
    { f: 9, easing: 'snap', pose: makePose(POSE_NEUTRAL, { root: { rx: 24, dz: 0.22 }, bones: { spine: [18, 0, 0], chest: [22, 0, 0], head: [32, 0, 0], upperArmL: [-55, 22, 20], foreArmL: [-105, 0, -20], upperArmR: [-55, -22, -20], foreArmR: [-105, 0, 20] } }) },
    { f: 22, pose: POSE_GINGA_MID },
  ],
};

export const TRACK_GALOPANTE: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 5, easing: 'coil', pose: makePose(POSE_GINGA_R, { root: { ry: -38 }, bones: { upperArmR: [-65, -35, -78], foreArmR: [-35, 0, 0] } }) },
    { f: 9, easing: 'snap', pose: makePose(POSE_GINGA_MID, { root: { ry: 28, dz: 0.16 }, bones: { spine: [14, 24, 0], chest: [12, 28, 0], upperArmR: [-86, 38, -18], foreArmR: [-10, 0, 0], upperArmL: [-45, 0, 25], foreArmL: [-80, 0, 0] } }) },
    { f: 12, linear: true, pose: makePose(POSE_GINGA_MID, { root: { ry: 28, dz: 0.16 }, bones: { spine: [14, 24, 0], chest: [12, 28, 0], upperArmR: [-86, 38, -18], foreArmR: [-10, 0, 0], upperArmL: [-45, 0, 25], foreArmL: [-80, 0, 0] } }) },
    { f: 22, pose: POSE_GINGA_L },
  ],
};
