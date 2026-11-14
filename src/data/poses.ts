// Procedural Capoeira keyframe pose tracks.
// Coordinates: +Z is forward (facing opponent), +X is character's left, +Y is up.
// All angles in degrees inside makePose(); stored as radians in Float64Array.
import { makePose, mirrorPose, type Pose, type Track } from '../anim/pose';

// ---------------------------------------------------------------------------
// Base Stance Poses
// ---------------------------------------------------------------------------

/** Neutral upright ready pose (used as fallback/reference). */
export const POSE_NEUTRAL: Pose = makePose(null, {
  bones: {
    pelvis: [4, 0, 0],
    spine: [6, 0, 0],
    chest: [4, 0, 0],
    upperArmL: [-30, 0, 18],
    foreArmL: [-80, 0, -20],
    upperArmR: [-30, 0, -18],
    foreArmR: [-80, 0, 20],
    thighL: [-18, 8, 6],
    shinL: [30, 0, 0],
    footL: [-12, 0, 0],
    thighR: [12, -8, -6],
    shinR: [18, 0, 0],
    footR: [-10, 0, 0],
  },
});

/** Ginga back-step (right leg back, right arm guarding face, left arm back). */
export const POSE_GINGA_R: Pose = makePose(null, {
  root: { dx: -0.06, dy: -0.04, ry: -18 },
  bones: {
    pelvis: [8, -10, 4],
    spine: [10, 12, -4],
    chest: [8, 16, -4],
    head: [-10, -12, 0],
    upperArmR: [-65, -20, -25],
    foreArmR: [-95, 0, 35],
    upperArmL: [25, 10, 22],
    foreArmL: [-45, 0, -10],
    thighL: [-34, 10, 8],
    shinL: [52, 0, 0],
    footL: [-18, 0, 0],
    thighR: [28, -10, -8],
    shinR: [24, 0, 0],
    footR: [-12, 0, 0],
  },
});

/** Ginga center pass (feet parallel, knees bent, arms wide). */
export const POSE_GINGA_MID: Pose = makePose(null, {
  root: { dx: 0, dy: -0.06, ry: 0 },
  bones: {
    pelvis: [6, 0, 0],
    spine: [8, 0, 0],
    chest: [6, 0, 0],
    head: [-8, 0, 0],
    upperArmL: [-40, 15, 25],
    foreArmL: [-75, 0, -25],
    upperArmR: [-40, -15, -25],
    foreArmR: [-75, 0, 25],
    thighL: [-28, 12, 12],
    shinL: [46, 0, 0],
    footL: [-18, 0, 0],
    thighR: [-28, -12, -12],
    shinR: [46, 0, 0],
    footR: [-18, 0, 0],
  },
});

export const POSE_GINGA_L: Pose = mirrorPose(POSE_GINGA_R);

export const TRACK_GINGA: Track = {
  loop: 64,
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 16, pose: POSE_GINGA_MID },
    { f: 32, pose: POSE_GINGA_L },
    { f: 48, pose: POSE_GINGA_MID },
  ],
};

/** Bananeira (Handstand - HSP): inverted body, hands planted, legs split/tucked. */
export const POSE_HSP_A: Pose = makePose(null, {
  root: { rx: 175, ry: 0, rz: 4 },
  bones: {
    pelvis: [-8, 0, 0],
    spine: [-6, 0, 0],
    chest: [-6, 0, 0],
    head: [28, 0, 0], // look toward opponent
    upperArmL: [-170, 0, 12],
    foreArmL: [-8, 0, 0],
    handL: [75, 0, 0],
    upperArmR: [-170, 0, -12],
    foreArmR: [-8, 0, 0],
    handR: [75, 0, 0],
    thighL: [-25, 0, 14],
    shinL: [55, 0, 0],
    thighR: [15, 0, -14],
    shinR: [35, 0, 0],
  },
});

export const POSE_HSP_B: Pose = makePose(POSE_HSP_A, {
  root: { rx: 175, ry: 0, rz: -4 },
  bones: {
    thighL: [15, 0, 18],
    shinL: [35, 0, 0],
    thighR: [-28, 0, -18],
    shinR: [60, 0, 0],
  },
});

export const TRACK_HSP: Track = {
  loop: 48,
  keys: [
    { f: 0, pose: POSE_HSP_A },
    { f: 24, pose: POSE_HSP_B },
  ],
};

/** Negativa / Cocorinha (Low Ground Stance - RLX): low crouch, one leg extended, hand on floor. */
export const POSE_RLX_A: Pose = makePose(null, {
  root: { dy: -0.02, rx: 14, ry: -22 },
  bones: {
    pelvis: [18, 0, 0],
    spine: [20, 10, 6],
    chest: [18, 12, 4],
    head: [-25, -18, 0],
    upperArmR: [-10, 0, -28],
    foreArmR: [-15, 0, 0],
    handR: [60, 0, 0],
    upperArmL: [-75, 15, 18],
    foreArmL: [-90, 0, -15],
    thighL: [-105, 12, 18],
    shinL: [118, 0, 0],
    footL: [-18, 0, 0],
    thighR: [-65, -8, -10],
    shinR: [18, 0, 0],
    footR: [20, 0, 0],
  },
});

export const POSE_RLX_B: Pose = makePose(POSE_RLX_A, {
  root: { dy: -0.03, rx: 16, ry: -16 },
  bones: {
    spine: [24, 14, 8],
    thighR: [-70, -12, -14],
  },
});

export const TRACK_RLX: Track = {
  loop: 56,
  keys: [
    { f: 0, pose: POSE_RLX_A },
    { f: 28, pose: POSE_RLX_B },
  ],
};

// ---------------------------------------------------------------------------
// Utility / Reaction Tracks
// ---------------------------------------------------------------------------

export const TRACK_WALK_FWD: Track = {
  loop: 28,
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 14, pose: POSE_GINGA_L },
  ],
};

export const TRACK_GUARD_HIGH: Track = {
  keys: [
    {
      f: 0,
      pose: makePose(POSE_GINGA_MID, {
        bones: {
          spine: [12, 0, 0],
          chest: [12, 0, 0],
          upperArmL: [-75, 25, 10],
          foreArmL: [-110, 0, -25],
          upperArmR: [-75, -25, -10],
          foreArmR: [-110, 0, 25],
        },
      }),
    },
  ],
};

export const TRACK_GUARD_LOW: Track = {
  keys: [
    {
      f: 0,
      pose: makePose(POSE_RLX_A, {
        bones: {
          upperArmL: [-65, 20, 10],
          foreArmL: [-105, 0, -20],
          upperArmR: [-65, -20, -10],
          foreArmR: [-105, 0, 20],
        },
      }),
    },
  ],
};

export const TRACK_HITSTUN: Track = {
  keys: [
    {
      f: 0,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -18 },
        bones: {
          spine: [-16, 8, 0],
          chest: [-18, 10, 0],
          head: [-22, 0, 0],
          upperArmL: [-20, 0, 40],
          foreArmL: [-40, 0, 0],
          upperArmR: [-20, 0, -40],
          foreArmR: [-40, 0, 0],
        },
      }),
    },
    {
      f: 12,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -6 },
        bones: { spine: [-6, 0, 0], chest: [-6, 0, 0] },
      }),
    },
  ],
};

export const TRACK_AIR: Track = {
  keys: [
    {
      f: 0,
      pose: makePose(POSE_NEUTRAL, {
        bones: {
          upperArmL: [-110, 0, 35],
          foreArmL: [-45, 0, 0],
          upperArmR: [-110, 0, -35],
          foreArmR: [-45, 0, 0],
          thighL: [-55, 0, 12],
          shinL: [85, 0, 0],
          thighR: [-30, 0, -12],
          shinR: [65, 0, 0],
        },
      }),
    },
  ],
};

export const TRACK_KNOCKDOWN: Track = {
  keys: [
    {
      f: 0,
      pose: makePose(null, {
        root: { rx: -85, ry: 0, rz: 0 },
        bones: {
          upperArmL: [-30, 0, 45],
          upperArmR: [-30, 0, -45],
          thighL: [-20, 0, 12],
          shinL: [35, 0, 0],
          thighR: [-10, 0, -12],
          shinR: [20, 0, 0],
        },
      }),
    },
  ],
};

// ---------------------------------------------------------------------------
// Attack & Mobility Pose Tracks
// ---------------------------------------------------------------------------

/** Bênção (Front push kick) */
export const TRACK_BENCAO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 5,
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: -10 },
        bones: {
          thighR: [-85, 0, 0],
          shinR: [110, 0, 0],
          upperArmL: [-60, 0, 20],
          foreArmL: [-80, 0, 0],
          upperArmR: [-50, 0, -25],
          foreArmR: [-80, 0, 0],
        },
      }),
    },
    {
      f: 10,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -14, ry: -12 },
        bones: {
          spine: [-12, 0, 0],
          thighR: [-95, 0, -4],
          shinR: [6, 0, 0],
          footR: [25, 0, 0],
          thighL: [10, 0, 6],
          shinL: [18, 0, 0],
          upperArmL: [-40, 0, 35],
          upperArmR: [20, 0, -35],
        },
      }),
    },
    { f: 16, pose: makePose(POSE_NEUTRAL, { root: { rx: -10 }, bones: { thighR: [-80, 0, 0], shinR: [25, 0, 0] } }) },
    { f: 26, pose: POSE_GINGA_L },
  ],
};

/** Martelo (Roundhouse kick - high) */
export const TRACK_MARTELO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 6,
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: -45, rz: -18 },
        bones: {
          thighR: [-65, 0, -45],
          shinR: [95, 0, 0],
          upperArmL: [-50, 0, 35],
          foreArmL: [-85, 0, 0],
          upperArmR: [-50, 0, -35],
          foreArmR: [-85, 0, 0],
        },
      }),
    },
    {
      f: 11,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: -72, rz: -38 },
        bones: {
          spine: [10, 15, -14],
          thighR: [-25, 0, -95],
          shinR: [8, 0, 0],
          footR: [35, 0, 0],
          thighL: [6, 0, 10],
          shinL: [12, 0, 0],
          upperArmL: [-45, 0, 45],
          upperArmR: [-65, 0, -25],
          foreArmR: [-95, 0, 0],
        },
      }),
    },
    { f: 17, pose: makePose(POSE_NEUTRAL, { root: { ry: -55, rz: -22 }, bones: { thighR: [-30, 0, -70], shinR: [45, 0, 0] } }) },
    { f: 28, pose: POSE_GINGA_MID },
  ],
};

/** Ponteira (Fast front snap kick - jab equivalent) */
export const TRACK_PONTEIRA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_L },
    {
      f: 4,
      pose: makePose(POSE_NEUTRAL, {
        bones: { thighL: [-75, 0, 0], shinL: [95, 0, 0] },
      }),
    },
    {
      f: 7,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -8, ry: 8 },
        bones: {
          thighL: [-92, 0, 0],
          shinL: [8, 0, 0],
          footL: [40, 0, 0],
          upperArmL: [-55, 0, 20],
          foreArmL: [-90, 0, 0],
          upperArmR: [-55, 0, -20],
          foreArmR: [-90, 0, 0],
        },
      }),
    },
    { f: 18, pose: POSE_GINGA_R },
  ],
};

/** Armada (Spinning crescent kick) */
export const TRACK_ARMADA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 6,
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 120 },
        bones: { spine: [12, 25, 0], chest: [10, 25, 0], upperArmL: [-40, 0, 55], upperArmR: [-40, 0, -55] },
      }),
    },
    {
      f: 13,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 270, rz: -18 },
        bones: {
          thighR: [-95, 0, -28],
          shinR: [6, 0, 0],
          upperArmL: [-40, 0, 65],
          upperArmR: [-40, 0, -65],
        },
      }),
    },
    {
      f: 19,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 345, rz: -10 },
        bones: { thighR: [-75, 0, -10], shinR: [14, 0, 0] },
      }),
    },
    { f: 32, pose: POSE_GINGA_L },
  ],
};

/** Queixada (Outside-in crescent kick) */
export const TRACK_QUEIXADA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_L },
    {
      f: 6,
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 52 },
        bones: { thighL: [-20, 20, -18], thighR: [-25, 0, 0], upperArmL: [-50, 0, 45], upperArmR: [-50, 0, -45] },
      }),
    },
    {
      f: 12,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 15, rx: -10 },
        bones: {
          thighR: [-102, -20, -25],
          shinR: [8, 0, 0],
          upperArmL: [-40, 0, 55],
          upperArmR: [-40, 0, -55],
        },
      }),
    },
    { f: 26, pose: POSE_GINGA_R },
  ],
};

/** Meia-Lua de Compasso (Signature spinning low-hand floor whip kick) */
export const TRACK_MEIA_LUA_COMPASSO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 7,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 75, ry: 110, rz: 15 },
        bones: {
          upperArmL: [-140, 0, 25],
          upperArmR: [-140, 0, -25],
          thighL: [-40, 0, 15],
          shinL: [50, 0, 0],
          thighR: [-20, 0, -20],
          shinR: [35, 0, 0],
        },
      }),
    },
    {
      f: 15,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 82, ry: 255, rz: 25 },
        bones: {
          upperArmL: [-155, 0, 15],
          handL: [70, 0, 0],
          upperArmR: [-155, 0, -15],
          handR: [70, 0, 0],
          thighR: [-10, 0, -95],
          shinR: [4, 0, 0],
          thighL: [-55, 0, 10],
          shinL: [65, 0, 0],
        },
      }),
    },
    {
      f: 22,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 65, ry: 340, rz: 10 },
        bones: {
          upperArmL: [-120, 0, 20],
          upperArmR: [-120, 0, -20],
          thighR: [-45, 0, -40],
          shinR: [25, 0, 0],
        },
      }),
    },
    { f: 36, pose: POSE_GINGA_MID },
  ],
};

/** Rasteira (Low sweep from Negativa/Ginga) */
export const TRACK_RASTEIRA: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    {
      f: 6,
      pose: makePose(POSE_RLX_A, {
        root: { ry: -45, rx: 22 },
        bones: { thighR: [-70, 0, -55], shinR: [10, 0, 0] },
      }),
    },
    {
      f: 12,
      linear: true,
      pose: makePose(POSE_RLX_A, {
        root: { ry: 45, rx: 25 },
        bones: {
          thighR: [-82, 25, 18],
          shinR: [12, 0, 0],
          footR: [0, 35, 0],
          upperArmR: [-120, 0, -35],
          handR: [65, 0, 0],
        },
      }),
    },
    { f: 28, pose: POSE_RLX_A },
  ],
};

/** Chapa (Side/back thrust kick from Negativa/ground) */
export const TRACK_CHAPA: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    {
      f: 7,
      pose: makePose(POSE_RLX_A, {
        root: { ry: -75, rz: 45 },
        bones: { thighR: [-75, 0, -15], shinR: [105, 0, 0] },
      }),
    },
    {
      f: 12,
      linear: true,
      pose: makePose(POSE_RLX_A, {
        root: { ry: -85, rz: 58 },
        bones: {
          thighR: [-25, 0, -85],
          shinR: [6, 0, 0],
          footR: [25, 0, 0],
          upperArmL: [-130, 0, 20],
          handL: [70, 0, 0],
        },
      }),
    },
    { f: 28, pose: POSE_RLX_A },
  ],
};

/** Cabeçada (Lunging headbutt) */
export const TRACK_CABECADA: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    {
      f: 6,
      pose: makePose(POSE_GINGA_MID, {
        root: { rx: 32 },
        bones: {
          spine: [28, 0, 0],
          chest: [28, 0, 0],
          head: [24, 0, 0],
          upperArmL: [30, 0, 35],
          upperArmR: [30, 0, -35],
          thighL: [-55, 0, 10],
          shinL: [80, 0, 0],
        },
      }),
    },
    {
      f: 11,
      linear: true,
      pose: makePose(POSE_GINGA_MID, {
        root: { rx: 48, dz: 0.25 },
        bones: {
          spine: [30, 0, 0],
          chest: [30, 0, 0],
          head: [28, 0, 0],
          upperArmL: [40, 0, 45],
          upperArmR: [40, 0, -45],
          thighL: [-65, 0, 8],
          shinL: [70, 0, 0],
          thighR: [35, 0, -8],
          shinR: [20, 0, 0],
        },
      }),
    },
    { f: 26, pose: POSE_GINGA_MID },
  ],
};

/** Aú (Cartwheel lateral/forward evasion & transition into HSP) */
export const TRACK_AU: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 7,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 40, rz: 85, dy: 0.15 },
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
        root: { rx: 175, rz: 0, dy: 0.05 },
        bones: { thighL: [0, 0, 48], shinL: [10, 0, 0], thighR: [0, 0, -48], shinR: [10, 0, 0] },
      }),
    },
    { f: 22, pose: POSE_HSP_A },
  ],
};

/** Aú Batido (Cartwheel kick launcher! Splits legs overhead and snaps one down/up) */
export const TRACK_AU_BATIDO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 6,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 35, rz: 70, dy: 0.22 },
        bones: { upperArmL: [-165, 0, 10], upperArmR: [-160, 0, -25], thighL: [-20, 0, 35], thighR: [15, 0, -45] },
      }),
    },
    {
      f: 12,
      linear: true,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 165, ry: 20, rz: -12, dy: 0.14 },
        bones: {
          upperArmL: [-165, 0, 20],
          upperArmR: [-60, 0, -45],
          thighR: [115, 0, -20], // striking leg whips forward/upward toward opponent (+Z)
          shinR: [8, 0, 0],
          thighL: [30, 0, 40],
          shinL: [65, 0, 0],
        },
      }),
    },
    {
      f: 19,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 165, rz: -30, dy: 0.2 },
        bones: { thighR: [-35, 0, -30], shinR: [40, 0, 0] },
      }),
    },
    { f: 30, pose: POSE_GINGA_R },
  ],
};

/** Helicóptero (Spinning double-leg kick from Bananeira / HSP) */
export const TRACK_HELICOPTERO: Track = {
  keys: [
    { f: 0, pose: POSE_HSP_A },
    {
      f: 7,
      linear: true,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 175, ry: 120 },
        bones: { thighL: [0, 0, 68], shinL: [8, 0, 0], thighR: [0, 0, -68], shinR: [8, 0, 0] },
      }),
    },
    {
      f: 14,
      linear: true,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 175, ry: 240 },
        bones: { thighL: [0, 0, 72], shinL: [8, 0, 0], thighR: [0, 0, -72], shinR: [8, 0, 0] },
      }),
    },
    {
      f: 21,
      linear: true,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 175, ry: 350 },
        bones: { thighL: [0, 0, 62], shinL: [15, 0, 0], thighR: [0, 0, -62], shinR: [15, 0, 0] },
      }),
    },
    { f: 30, pose: POSE_HSP_B },
  ],
};

/** Pião de Mão (Handstand spinning heel whip) */
export const TRACK_PIAO_MAO: Track = {
  keys: [
    { f: 0, pose: POSE_HSP_A },
    {
      f: 6,
      linear: true,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 170, ry: 140 },
        bones: { thighR: [-25, 0, -65], shinR: [10, 0, 0], thighL: [25, 0, 20], shinL: [75, 0, 0] },
      }),
    },
    {
      f: 13,
      linear: true,
      pose: makePose(POSE_HSP_A, {
        root: { rx: 168, ry: 290 },
        bones: { thighR: [-35, 0, -75], shinR: [8, 0, 0], thighL: [25, 0, 20], shinL: [75, 0, 0] },
      }),
    },
    { f: 24, pose: POSE_HSP_A },
  ],
};

/** Rolê (Low ground roll forward/recover into Ginga) */
export const TRACK_ROLE: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    {
      f: 8,
      pose: makePose(POSE_RLX_A, {
        root: { rx: 60, ry: 130, dy: 0.08 },
        bones: {
          upperArmL: [-120, 0, 25],
          upperArmR: [-120, 0, -25],
          thighL: [-75, 0, 20],
          shinL: [90, 0, 0],
        },
      }),
    },
    {
      f: 16,
      pose: makePose(POSE_GINGA_MID, {
        root: { ry: 280 },
        bones: { spine: [18, 0, 0], thighL: [-40, 0, 15], shinL: [65, 0, 0] },
      }),
    },
    { f: 24, pose: POSE_GINGA_R },
  ],
};

/** Galopante (Open-palm slapping strike) */
export const TRACK_GALOPANTE: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 5,
      pose: makePose(POSE_GINGA_R, {
        root: { ry: -35 },
        bones: { upperArmR: [-65, -35, -75], foreArmR: [-30, 0, 0] },
      }),
    },
    {
      f: 10,
      linear: true,
      pose: makePose(POSE_GINGA_MID, {
        root: { ry: 25, dz: 0.15 },
        bones: {
          spine: [12, 20, 0],
          chest: [10, 25, 0],
          upperArmR: [-85, 35, -18],
          foreArmR: [-12, 0, 0],
          upperArmL: [-45, 0, 25],
          foreArmL: [-80, 0, 0],
        },
      }),
    },
    { f: 22, pose: POSE_GINGA_L },
  ],
};

/** Vingativa (Close-range Capoeira takedown/throw) */
export const TRACK_VINGATIVA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 6,
      pose: makePose(POSE_GINGA_MID, {
        root: { ry: 30, dz: 0.2 },
        bones: {
          spine: [20, 15, 0],
          upperArmL: [-90, -10, 15],
          foreArmL: [-45, 0, 0],
          upperArmR: [-85, 10, -15],
          foreArmR: [-45, 0, 0],
        },
      }),
    },
    {
      f: 14,
      linear: true,
      pose: makePose(POSE_GINGA_MID, {
        root: { ry: -55, rx: 18 },
        bones: {
          spine: [25, -30, 0],
          upperArmL: [-40, 20, 30],
          upperArmR: [-50, 35, -20],
          thighL: [-55, 0, 12],
          shinL: [75, 0, 0],
        },
      }),
    },
    { f: 28, pose: POSE_GINGA_R },
  ],
};

/** Parafuso (Aerial corkscrew kick) */
export const TRACK_PARAFUSO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 7,
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.35, ry: 140, rx: -15 },
        bones: { thighL: [-75, 0, 15], shinL: [95, 0, 0], upperArmL: [-110, 0, 35], upperArmR: [-110, 0, -35] },
      }),
    },
    {
      f: 15,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.55, ry: 310, rz: -25 },
        bones: {
          thighR: [-90, 0, -35],
          shinR: [6, 0, 0],
          thighL: [-45, 0, 15],
          shinL: [70, 0, 0],
          upperArmL: [-60, 0, 55],
          upperArmR: [-60, 0, -55],
        },
      }),
    },
    { f: 28, pose: POSE_GINGA_L },
  ],
};

export const POSE_TRACKS: Record<string, Track> = {
  GINGA: TRACK_GINGA,
  HSP: TRACK_HSP,
  RLX: TRACK_RLX,
  AIR: TRACK_AIR,
  WALK_FWD: TRACK_WALK_FWD,
  GUARD_HIGH: TRACK_GUARD_HIGH,
  GUARD_LOW: TRACK_GUARD_LOW,
  HITSTUN: TRACK_HITSTUN,
  KNOCKDOWN: TRACK_KNOCKDOWN,
  ponteira: TRACK_PONTEIRA,
  galopante: TRACK_GALOPANTE,
  bencao: TRACK_BENCAO,
  martelo: TRACK_MARTELO,
  armada: TRACK_ARMADA,
  queixada: TRACK_QUEIXADA,
  meia_lua_compasso: TRACK_MEIA_LUA_COMPASSO,
  rasteira: TRACK_RASTEIRA,
  chapa: TRACK_CHAPA,
  cabecada: TRACK_CABECADA,
  au: TRACK_AU,
  au_batido: TRACK_AU_BATIDO,
  helicoptero: TRACK_HELICOPTERO,
  piao_mao: TRACK_PIAO_MAO,
  role: TRACK_ROLE,
  vingativa: TRACK_VINGATIVA,
  parafuso: TRACK_PARAFUSO,
};
