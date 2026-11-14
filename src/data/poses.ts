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

/** Ginga back-step (deep front knee bend, back ball-of-foot push, guarding forearm across face). */
export const POSE_GINGA_R: Pose = makePose(null, {
  root: { dx: -0.08, dy: 0, ry: -24 },
  bones: {
    pelvis: [10, -14, 6],
    spine: [14, 16, -5],
    chest: [10, 22, -6],
    head: [-14, -18, 2],
    upperArmR: [-72, -25, -28],
    foreArmR: [-102, 0, 42],
    upperArmL: [28, 12, 26],
    foreArmL: [-52, 0, -14],
    thighL: [-42, 12, 10],
    shinL: [62, 0, 0],
    footL: [-20, 0, 0],
    thighR: [32, -12, -10],
    shinR: [28, 0, 0],
    footR: [18, 0, 0], // heel lifted, pushing from ball of foot
  },
});

/** Ginga center pass (cadeira / base squat, knees bent, arms flowing wide). */
export const POSE_GINGA_MID: Pose = makePose(null, {
  root: { dx: 0, dy: 0, ry: 0 },
  bones: {
    pelvis: [8, 0, 0],
    spine: [10, 0, 0],
    chest: [8, 0, 0],
    head: [-10, 0, 0],
    upperArmL: [-46, 18, 30],
    foreArmL: [-82, 0, -28],
    upperArmR: [-46, -18, -30],
    foreArmR: [-82, 0, 28],
    thighL: [-36, 14, 15],
    shinL: [58, 0, 0],
    footL: [-22, 0, 0],
    thighR: [-36, -14, -15],
    shinR: [58, 0, 0],
    footR: [-22, 0, 0],
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
  root: { dy: 0, rx: 14, ry: -22 },
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
  root: { dy: 0, rx: 16, ry: -16 },
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

const WALK_STEP_A: Pose = makePose(POSE_GINGA_MID, {
  root: { ry: -12, dy: 0 },
  bones: {
    spine: [14, 10, 0],
    chest: [12, 14, 0],
    head: [-14, -12, 0],
    upperArmL: [-55, 18, 22],
    foreArmL: [-95, 0, -20],
    upperArmR: [-38, -10, -24],
    foreArmR: [-85, 0, 25],
    thighL: [-46, 8, 8],
    shinL: [62, 0, 0],
    footL: [-16, 0, 0],
    thighR: [22, -8, -8],
    shinR: [24, 0, 0],
    footR: [12, 0, 0],
  },
});
const WALK_STEP_B: Pose = mirrorPose(WALK_STEP_A);

export const TRACK_WALK_FWD: Track = {
  loop: 24,
  keys: [
    { f: 0, pose: WALK_STEP_A },
    { f: 6, pose: POSE_GINGA_MID },
    { f: 12, pose: WALK_STEP_B },
    { f: 18, pose: POSE_GINGA_MID },
  ],
};

export const TRACK_WALK_BACK: Track = {
  loop: 26,
  keys: [
    { f: 0, pose: WALK_STEP_B },
    { f: 13, pose: WALK_STEP_A },
  ],
};

export const TRACK_GUARD_HIGH: Track = {
  keys: [
    {
      f: 0,
      pose: makePose(POSE_GINGA_MID, {
        root: { rx: -4, ry: -12 },
        bones: {
          spine: [14, 8, 0],
          chest: [14, 10, 0],
          head: [-12, -10, 0],
          upperArmL: [-82, 32, 10],
          foreArmL: [-115, 0, -28],
          upperArmR: [-82, -32, -10],
          foreArmR: [-115, 0, 28],
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
          upperArmL: [-72, 24, 10],
          foreArmL: [-110, 0, -22],
          upperArmR: [-72, -24, -10],
          foreArmR: [-110, 0, 22],
        },
      }),
    },
  ],
};

/** High hit recoil (SF2 head & chest snap backward). */
export const TRACK_HITSTUN_HIGH: Track = {
  keys: [
    {
      f: 0,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -24, ry: 12 },
        bones: {
          spine: [-22, 10, -6],
          chest: [-24, 12, -6],
          head: [-34, 8, 0],
          upperArmL: [-15, 0, 52],
          foreArmL: [-35, 0, 0],
          upperArmR: [-15, 0, -52],
          foreArmR: [-35, 0, 0],
          thighL: [-28, 6, 8],
          shinL: [42, 0, 0],
        },
      }),
    },
    {
      f: 12,
      easing: 'ease',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -8 },
        bones: { spine: [-6, 0, 0], chest: [-6, 0, 0], head: [-8, 0, 0] },
      }),
    },
  ],
};

/** Mid/low hit recoil (gut-punch double-over). */
export const TRACK_HITSTUN_MID: Track = {
  keys: [
    {
      f: 0,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 22, ry: -10 },
        bones: {
          spine: [28, -8, 0],
          chest: [24, -10, 0],
          head: [18, 0, 0],
          upperArmL: [-55, 25, 10],
          foreArmL: [-95, 0, -30],
          upperArmR: [-55, -25, -10],
          foreArmR: [-95, 0, 30],
          thighL: [-42, 8, 10],
          shinL: [65, 0, 0],
          thighR: [-28, -8, -10],
          shinR: [50, 0, 0],
        },
      }),
    },
    {
      f: 12,
      easing: 'ease',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 6 },
        bones: { spine: [8, 0, 0], chest: [8, 0, 0] },
      }),
    },
  ],
};

export const TRACK_HITSTUN = TRACK_HITSTUN_MID;

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

/** Bênção (Front push kick — coiled knee chamber -> explosive hip thrust + hold) */
export const TRACK_BENCAO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 5,
      easing: 'coil',
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: -14 },
        bones: {
          thighR: [-95, 0, 0],
          shinR: [118, 0, 0],
          upperArmL: [-65, 0, 22],
          foreArmL: [-85, 0, 0],
          upperArmR: [-55, 0, -25],
          foreArmR: [-85, 0, 0],
        },
      }),
    },
    {
      f: 9,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -16, ry: -12 },
        bones: {
          spine: [-14, 0, 0],
          thighR: [-96, 0, -4],
          shinR: [4, 0, 0],
          footR: [28, 0, 0],
          thighL: [14, 0, 6],
          shinL: [16, 0, 0],
          upperArmL: [-40, 0, 40],
          upperArmR: [25, 0, -35],
        },
      }),
    },
    {
      f: 13,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -16, ry: -12 },
        bones: {
          spine: [-14, 0, 0],
          thighR: [-96, 0, -4],
          shinR: [4, 0, 0],
          footR: [28, 0, 0],
          thighL: [14, 0, 6],
          shinL: [16, 0, 0],
          upperArmL: [-40, 0, 40],
          upperArmR: [25, 0, -35],
        },
      }),
    },
    { f: 18, pose: makePose(POSE_NEUTRAL, { root: { rx: -8 }, bones: { thighR: [-75, 0, 0], shinR: [38, 0, 0] } }) },
    { f: 26, pose: POSE_GINGA_L },
  ],
};

/** Martelo (High roundhouse kick — chambered knee -> SF2 whipped extension + impact hold) */
export const TRACK_MARTELO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 6,
      easing: 'coil',
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: -48, rz: -20 },
        bones: {
          thighR: [-72, 0, -52],
          shinR: [105, 0, 0],
          upperArmL: [-55, 0, 38],
          foreArmL: [-90, 0, 0],
          upperArmR: [-55, 0, -38],
          foreArmR: [-90, 0, 0],
        },
      }),
    },
    {
      f: 10,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: -76, rz: -42 },
        bones: {
          spine: [10, 18, -16],
          head: [-6, 48, 20], // eyes stay locked on target!
          thighR: [-24, 0, -98],
          shinR: [6, 0, 0],
          footR: [40, 0, 0],
          thighL: [6, 0, 10],
          shinL: [12, 0, 0],
          upperArmL: [-45, 0, 48],
          upperArmR: [-65, 0, -25],
          foreArmR: [-95, 0, 0],
        },
      }),
    },
    {
      f: 14,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: -76, rz: -42 },
        bones: {
          spine: [10, 18, -16],
          head: [-6, 48, 20],
          thighR: [-24, 0, -98],
          shinR: [6, 0, 0],
          footR: [40, 0, 0],
          thighL: [6, 0, 10],
          shinL: [12, 0, 0],
          upperArmL: [-45, 0, 48],
          upperArmR: [-65, 0, -25],
          foreArmR: [-95, 0, 0],
        },
      }),
    },
    { f: 19, pose: makePose(POSE_NEUTRAL, { root: { ry: -52, rz: -22 }, bones: { thighR: [-30, 0, -68], shinR: [48, 0, 0] } }) },
    { f: 28, pose: POSE_GINGA_MID },
  ],
};

/** Ponteira (Fast front snap kick — crisp jab speed) */
export const TRACK_PONTEIRA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_L },
    {
      f: 4,
      easing: 'coil',
      pose: makePose(POSE_NEUTRAL, {
        bones: { thighL: [-78, 0, 0], shinL: [100, 0, 0] },
      }),
    },
    {
      f: 6,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -10, ry: 10 },
        bones: {
          thighL: [-94, 0, 0],
          shinL: [6, 0, 0],
          footL: [42, 0, 0],
          upperArmL: [-60, 0, 22],
          foreArmL: [-95, 0, 0],
          upperArmR: [-60, 0, -22],
          foreArmR: [-95, 0, 0],
        },
      }),
    },
    {
      f: 9,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -10, ry: 10 },
        bones: {
          thighL: [-94, 0, 0],
          shinL: [6, 0, 0],
          footL: [42, 0, 0],
          upperArmL: [-60, 0, 22],
          foreArmL: [-95, 0, 0],
          upperArmR: [-60, 0, -22],
          foreArmR: [-95, 0, 0],
        },
      }),
    },
    { f: 18, pose: POSE_GINGA_R },
  ],
};

/** Armada (Spinning crescent kick — tight spin windup -> explosive whip) */
export const TRACK_ARMADA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 6,
      easing: 'coil',
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 120 },
        bones: { spine: [12, 25, 0], chest: [10, 25, 0], upperArmL: [-40, 0, 55], upperArmR: [-40, 0, -55] },
      }),
    },
    {
      f: 12,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 270, rz: -20 },
        bones: {
          thighR: [-98, 0, -28],
          shinR: [5, 0, 0],
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
        bones: { thighR: [-82, 0, -14], shinR: [10, 0, 0] },
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
      easing: 'coil',
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
      f: 14,
      easing: 'snap',
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
      easing: 'coil',
      pose: makePose(POSE_GINGA_R, {
        root: { ry: -38 },
        bones: { upperArmR: [-65, -35, -78], foreArmR: [-35, 0, 0] },
      }),
    },
    {
      f: 9,
      easing: 'snap',
      pose: makePose(POSE_GINGA_MID, {
        root: { ry: 28, dz: 0.16 },
        bones: {
          spine: [14, 24, 0],
          chest: [12, 28, 0],
          upperArmR: [-86, 38, -18],
          foreArmR: [-10, 0, 0],
          upperArmL: [-45, 0, 25],
          foreArmL: [-80, 0, 0],
        },
      }),
    },
    {
      f: 12,
      linear: true,
      pose: makePose(POSE_GINGA_MID, {
        root: { ry: 28, dz: 0.16 },
        bones: {
          spine: [14, 24, 0],
          chest: [12, 28, 0],
          upperArmR: [-86, 38, -18],
          foreArmR: [-10, 0, 0],
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
  WALK_BACK: TRACK_WALK_BACK,
  GUARD_HIGH: TRACK_GUARD_HIGH,
  GUARD_LOW: TRACK_GUARD_LOW,
  HITSTUN: TRACK_HITSTUN,
  HITSTUN_HIGH: TRACK_HITSTUN_HIGH,
  HITSTUN_MID: TRACK_HITSTUN_MID,
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
