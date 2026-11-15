// Capoeira handstands, headspins, macaco, flips, and aerial floreio pose tracks.
import { makePose, type Track } from '../anim/pose';
import {
  buildSpinTrack,
  POSE_BRIDGE_ARCH,
  POSE_COCORINHA_HOLD,
  POSE_GINGA_L,
  POSE_GINGA_MID,
  POSE_GINGA_R,
  POSE_HEADSTAND_BASE,
  POSE_HSP_A,
  POSE_NEUTRAL,
  POSE_RLX_A,
} from './poses_helpers';

/** Bananeira (showcase upright-to-handstand press — mudroljub M79 / minho N28). */
export const TRACK_BANANEIRA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    { f: 8, easing: 'coil', pose: makePose(POSE_COCORINHA_HOLD, { bones: { upperArmL: [-135, 0, 14], upperArmR: [-135, 0, -14], handL: [70, 0, 0], handR: [70, 0, 0] } }) },
    { f: 18, easing: 'snap', pose: POSE_HSP_A },
    { f: 28, linear: true, pose: makePose(POSE_HSP_A, { bones: { thighL: [-35, 0, 26], shinL: [45, 0, 0], thighR: [25, 0, -26], shinR: [25, 0, 0] } }) },
    { f: 38, pose: POSE_HSP_A },
  ],
};

/** Bananeira de Cabeça / Parada de Cabeça: steady tripod headstand (mudroljub M78 / minho N21). */
export const TRACK_BANANEIRA_DE_CABECA: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    { f: 9, easing: 'coil', pose: makePose(POSE_HEADSTAND_BASE, { bones: { thighL: [-90, 0, 12], shinL: [110, 0, 0], thighR: [-90, 0, -12], shinR: [110, 0, 0] } }) },
    { f: 20, linear: true, pose: makePose(POSE_HEADSTAND_BASE, { bones: { thighL: [-10, 0, 22], shinL: [12, 0, 0], thighR: [10, 0, -22], shinR: [12, 0, 0] } }) },
    { f: 32, linear: true, pose: POSE_HEADSTAND_BASE },
    { f: 42, pose: POSE_GINGA_MID },
  ],
};

/** Giro de Cabeça: continuous headspin on the crown with splayed legs (minho N18). */
export const TRACK_GIRO_DE_CABECA: Track = buildSpinTrack(
  POSE_RLX_A,
  [
    { f: 7, base: POSE_HEADSTAND_BASE, spec: { root: { rx: 178, ry: 0 }, bones: { thighL: [-28, 0, 42], thighR: [28, 0, -42] } } },
    { f: 14, base: POSE_HEADSTAND_BASE, spec: { root: { rx: 178, ry: 120 }, bones: { thighL: [-28, 0, 42], thighR: [28, 0, -42] } } },
    { f: 21, base: POSE_HEADSTAND_BASE, spec: { root: { rx: 178, ry: 240 }, bones: { thighL: [-28, 0, 42], thighR: [28, 0, -42] } } },
    { f: 28, base: POSE_HEADSTAND_BASE, spec: { root: { rx: 178, ry: 360 }, bones: { thighL: [-28, 0, 42], thighR: [28, 0, -42] } } },
  ],
  makePose(POSE_GINGA_MID, { root: { ry: 360 } }),
  38,
);

/** Macaquinho: low squat-to-one-hand mini back handspring (mudroljub M80 / minho N01). */
export const TRACK_MACAQUINHO: Track = {
  keys: [
    { f: 0, pose: POSE_COCORINHA_HOLD },
    {
      f: 7,
      easing: 'coil',
      pose: makePose(POSE_COCORINHA_HOLD, {
        root: { rx: -28, ry: -22 },
        bones: { upperArmR: [-155, 0, -18], foreArmR: [-10, 0, 0], handR: [75, 0, 0] },
      }),
    },
    {
      f: 16,
      easing: 'snap',
      pose: makePose(POSE_HSP_A, {
        root: { dy: 0.14, rx: -155, ry: -10, rz: 16 },
        bones: {
          upperArmL: [-90, 0, 38],
          upperArmR: [-168, 0, -10],
          handR: [75, 0, 0],
          thighL: [-55, 0, 20],
          shinL: [75, 0, 0],
          thighR: [-15, 0, -18],
          shinR: [55, 0, 0],
        },
      }),
    },
    {
      f: 24,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -265 },
        bones: { thighL: [-48, 0, 14], shinL: [62, 0, 0], thighR: [-38, 0, -14], shinR: [55, 0, 0] },
      }),
    },
    { f: 32, pose: makePose(POSE_GINGA_MID, { root: { rx: -360 } }) },
  ],
};

/** Macaco: full sweeping backward handspring flip from crouch (mudroljub M81 / minho N24). */
export const TRACK_MACACO: Track = {
  keys: [
    { f: 0, pose: POSE_COCORINHA_HOLD },
    {
      f: 8,
      easing: 'coil',
      pose: makePose(POSE_BRIDGE_ARCH, {
        root: { rx: -45, ry: -28 },
        bones: { upperArmR: [-168, 0, -12], handR: [75, 0, 0], upperArmL: [-55, 0, 35] },
      }),
    },
    {
      f: 18,
      easing: 'snap',
      pose: makePose(POSE_HSP_A, {
        root: { dy: 0.28, rx: -180, rz: 18 },
        bones: {
          upperArmL: [-155, 0, 20],
          upperArmR: [-172, 0, -12],
          thighL: [-15, 0, 26],
          shinL: [25, 0, 0],
          thighR: [25, 0, -26],
          shinR: [35, 0, 0],
        },
      }),
    },
    {
      f: 26,
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.22, rx: -295 },
        bones: { thighL: [-55, 0, 12], shinL: [75, 0, 0], thighR: [-45, 0, -12], shinR: [65, 0, 0] },
      }),
    },
    { f: 36, pose: makePose(POSE_GINGA_MID, { root: { rx: -360 } }) },
  ],
};

/** S-Dobrado: sinuous S-curved macaco reversal sweeping leg into kick (mudroljub M82). */
export const TRACK_S_DOBRADO: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    { f: 8, easing: 'coil', pose: makePose(POSE_BRIDGE_ARCH, { root: { rx: -75, ry: 45 }, bones: { upperArmR: [-165, 0, -18], handR: [75, 0, 0] } }) },
    {
      f: 18,
      easing: 'snap',
      pose: makePose(POSE_HSP_A, {
        root: { dy: 0.26, rx: -175, ry: 120, rz: -22 },
        bones: { thighR: [-72, 0, -32], shinR: [22, 0, 0], thighL: [22, 0, 26], shinL: [55, 0, 0] },
      }),
    },
    { f: 34, pose: makePose(POSE_GINGA_R, { root: { rx: -360, ry: 180 } }) },
  ],
};

/** Xangô: rising handspring-bounce kick / tucked invert whip (mudroljub M84). */
export const TRACK_XANGO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 7, easing: 'coil', pose: POSE_COCORINHA_HOLD },
    {
      f: 17,
      easing: 'snap',
      pose: makePose(POSE_HSP_A, {
        root: { dy: 0.34, rx: -185, ry: 90 },
        bones: { thighR: [-85, 0, -18], shinR: [12, 0, 0], thighL: [-55, 0, 18], shinL: [75, 0, 0] },
      }),
    },
    { f: 32, pose: makePose(POSE_GINGA_L, { root: { rx: -360, ry: 180 } }) },
  ],
};

/** Xangô de Frente: explosive forward vaulting split-leg kick (mudroljub M85). */
export const TRACK_XANGO_DE_FRENTE: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 7, easing: 'coil', pose: makePose(POSE_COCORINHA_HOLD, { root: { rx: 35 } }) },
    {
      f: 18,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.42, rx: 165, rz: 15 },
        bones: {
          spine: [-15, 0, 0],
          upperArmL: [-155, 0, 22],
          upperArmR: [-155, 0, -22],
          thighR: [-90, 0, -12],
          shinR: [8, 0, 0],
          thighL: [32, 0, 12],
          shinL: [45, 0, 0],
        },
      }),
    },
    { f: 34, pose: makePose(POSE_GINGA_MID, { root: { rx: 360 } }) },
  ],
};

/** Mortal de Costas (Backflip Flash Kick — mudroljub M86). */
export const TRACK_MORTAL: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 6, easing: 'coil', pose: makePose(POSE_COCORINHA_HOLD, { root: { rx: 12 }, bones: { upperArmL: [35, 0, 22], upperArmR: [35, 0, -22] } }) },
    {
      f: 12,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.56, rx: -115 },
        bones: { spine: [-18, 0, 0], chest: [-16, 0, 0], thighR: [-72, 0, -10], shinR: [12, 0, 0], thighL: [-55, 0, 10], shinL: [75, 0, 0] },
      }),
    },
    {
      f: 19,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.65, rx: -225 },
        bones: { spine: [-20, 0, 0], thighR: [-80, 0, -12], shinR: [10, 0, 0], thighL: [-65, 0, 12], shinL: [85, 0, 0] },
      }),
    },
    {
      f: 26,
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.25, rx: -320 },
        bones: { thighL: [-50, 0, 12], shinL: [75, 0, 0], thighR: [-45, 0, -12], shinR: [65, 0, 0] },
      }),
    },
    { f: 34, pose: makePose(POSE_GINGA_MID, { root: { rx: -360 } }) },
  ],
};

/** Mortal de Frente: no-hands front somersault axe landing (mudroljub M87). */
export const TRACK_MORTAL_DE_FRENTE: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 6, easing: 'coil', pose: POSE_COCORINHA_HOLD },
    {
      f: 14,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.65, rx: 165 },
        bones: {
          spine: [32, 0, 0],
          chest: [28, 0, 0],
          upperArmL: [-95, 18, 12],
          foreArmL: [-95, 0, 0],
          upperArmR: [-95, -18, -12],
          foreArmR: [-95, 0, 0],
          thighL: [-110, 0, 12],
          shinL: [120, 0, 0],
          thighR: [-110, 0, -12],
          shinR: [120, 0, 0],
        },
      }),
    },
    {
      f: 22,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.45, rx: 285 },
        bones: { thighR: [-85, 0, -8], shinR: [10, 0, 0], thighL: [-32, 0, 8], shinL: [45, 0, 0] },
      }),
    },
    { f: 34, pose: makePose(POSE_GINGA_MID, { root: { rx: 360 } }) },
  ],
};

/** Mola: head-spring kip-up explosion from supine onto both feet (mudroljub M88). */
export const TRACK_MOLA: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    {
      f: 7,
      easing: 'coil',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -95 },
        bones: {
          upperArmL: [-140, 0, 22],
          handL: [70, 0, 0],
          upperArmR: [-140, 0, -22],
          handR: [70, 0, 0],
          thighL: [-115, 0, 10],
          shinL: [45, 0, 0],
          thighR: [-115, 0, -10],
          shinR: [45, 0, 0],
        },
      }),
    },
    {
      f: 17,
      easing: 'snap',
      pose: makePose(POSE_BRIDGE_ARCH, {
        root: { dy: 0.42, rx: -32 },
        bones: { thighL: [-28, 0, 14], shinL: [52, 0, 0], thighR: [-28, 0, -14], shinR: [52, 0, 0] },
      }),
    },
    { f: 28, pose: POSE_GINGA_MID },
  ],
};

/** Mariposa: butterfly aerial twist (mudroljub M89). */
export const TRACK_MARIPOSA: Track = buildSpinTrack(
  POSE_GINGA_R,
  [
    { f: 7, spec: { root: { rx: 48, ry: -45 }, bones: { thighL: [-55, 0, 14], shinL: [75, 0, 0], thighR: [-45, 0, -14], shinR: [65, 0, 0] } } },
    { f: 14, spec: { root: { dy: 0.54, rx: 78, ry: 120, rz: 18 }, bones: { upperArmL: [-95, 0, 62], upperArmR: [-95, 0, -62], thighL: [-18, 0, 36], thighR: [25, 0, -36] } } },
    { f: 22, spec: { root: { dy: 0.58, rx: 82, ry: 270, rz: 12 }, bones: { upperArmL: [-95, 0, 62], upperArmR: [-95, 0, -62], thighL: [25, 0, 36], thighR: [-18, 0, -36] } } },
    { f: 29, spec: { root: { dy: 0.26, rx: 32, ry: 360 } } },
  ],
  makePose(POSE_GINGA_MID, { root: { ry: 360 } }),
  36,
);

/** Folha Seca: falling-leaf slanted aerial kick-backflip (mudroljub M90). */
export const TRACK_FOLHA_SECA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 7,
      easing: 'coil',
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: -45, rz: 18 },
        bones: { thighR: [-85, 0, -12], shinR: [14, 0, 0], thighL: [-28, 0, 10], shinL: [42, 0, 0] },
      }),
    },
    {
      f: 15,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.52, rx: -145, ry: 95, rz: 48 },
        bones: {
          spine: [-20, 12, -14],
          upperArmL: [-110, 0, 52],
          upperArmR: [-110, 0, -52],
          thighL: [-82, 0, 14], // high slicing whip leg
          shinL: [12, 0, 0],
          thighR: [28, 0, -20],
          shinR: [35, 0, 0],
        },
      }),
    },
    {
      f: 24,
      linear: true,
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.34, rx: -285, ry: 215, rz: 28 },
        bones: { thighL: [-55, 0, 18], thighR: [-45, 0, -18] },
      }),
    },
    { f: 34, pose: makePose(POSE_GINGA_L, { root: { rx: -360, ry: 360 } }) },
  ],
};

/** Parafuso (Corkscrew double-kick spiral launcher — Roda Orbital aerial special). */
export const TRACK_PARAFUSO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 6, easing: 'coil', pose: makePose(POSE_GINGA_L, { root: { ry: -80 }, bones: { thighR: [-65, 0, -10], shinR: [95, 0, 0] } }) },
    {
      f: 13,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.45, ry: 120, rz: 22 },
        bones: { thighL: [-105, 0, 20], shinL: [10, 0, 0], thighR: [-35, 0, -15], shinR: [90, 0, 0], upperArmR: [-120, 0, -45] },
      }),
    },
    {
      f: 21,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { dy: 0.62, ry: 300, rz: -24 },
        bones: { thighR: [-115, 0, -22], shinR: [8, 0, 0], thighL: [-40, 0, 15], shinL: [85, 0, 0], upperArmL: [-120, 0, 45] },
      }),
    },
    { f: 32, pose: makePose(POSE_GINGA_MID, { root: { ry: 360 } }) },
  ],
};
