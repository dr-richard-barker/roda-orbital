// Capoeira Defences, Esquivas, Bridges, Negativas, Rolês, Floor Flows & Quedas.
import { makePose, type Track } from '../anim/pose';
import {
  buildSpinTrack,
  POSE_BRIDGE_ARCH,
  POSE_COCORINHA_HOLD,
  POSE_GINGA_L,
  POSE_GINGA_MID,
  POSE_GINGA_R,
  POSE_NEUTRAL,
  POSE_QDR_BASE,
  POSE_RLX_A,
  POSE_RLX_B,
} from './poses_helpers';

// ---- Esquivas & Bridges ----

export const TRACK_COCORINHA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    { f: 6, easing: 'snap', pose: POSE_COCORINHA_HOLD },
    { f: 18, linear: true, pose: POSE_COCORINHA_HOLD },
    { f: 26, pose: POSE_GINGA_MID },
  ],
};

/** Resistência / Descida (Reclined rear-hand floor brace dodge). */
export const TRACK_RESISTENCIA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 8,
      easing: 'snap',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -48, ry: -26, rz: 14 },
        bones: {
          spine: [-22, 12, 0],
          head: [28, 18, 0],
          upperArmR: [25, 0, -28],
          foreArmR: [-10, 0, 0],
          handR: [65, 0, 0], // rear brace hand on mat!
          upperArmL: [-85, 25, 18],
          foreArmL: [-110, 0, -35], // shield arm!
          thighL: [-78, 12, 14],
          shinL: [96, 0, 0],
          thighR: [-42, -10, -14],
          shinR: [18, 0, 0],
        },
      }),
    },
    { f: 18, linear: true, pose: makePose(POSE_NEUTRAL, { root: { rx: -48, ry: -26, rz: 14 }, bones: { spine: [-22, 12, 0], head: [28, 18, 0], upperArmR: [25, 0, -28], handR: [65, 0, 0], upperArmL: [-85, 25, 18], foreArmL: [-110, 0, -35], thighL: [-78, 12, 14], shinL: [96, 0, 0], thighR: [-42, -10, -14], shinR: [18, 0, 0] } }) },
    { f: 26, pose: POSE_GINGA_R },
  ],
};

/** Esquiva Lateral (Deep wide-stance side duck). */
export const TRACK_ESQUIVA_LATERAL: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 7,
      easing: 'snap',
      pose: makePose(POSE_GINGA_MID, {
        root: { dx: 0.25, rx: 28, ry: 20, rz: 18 },
        bones: { spine: [28, 15, 16], head: [-28, -18, 0], thighL: [-82, 14, 24], shinL: [106, 0, 0], thighR: [-15, -14, -36], shinR: [12, 0, 0], upperArmR: [-80, -30, -20], foreArmR: [-110, 0, 35] },
      }),
    },
    { f: 16, linear: true, pose: makePose(POSE_GINGA_MID, { root: { dx: 0.25, rx: 28, ry: 20, rz: 18 }, bones: { spine: [28, 15, 16], thighL: [-82, 14, 24], shinL: [106, 0, 0], thighR: [-15, -14, -36], shinR: [12, 0, 0] } }) },
    { f: 24, pose: POSE_GINGA_MID },
  ],
};

/** Esquiva de Lado (Standing-base rib-twist side slip with high elbow guard). */
export const TRACK_ESQUIVA_DE_LADO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 6,
      easing: 'snap',
      pose: makePose(POSE_GINGA_MID, {
        root: { rx: 18, ry: -58, rz: -22 },
        bones: { spine: [22, -24, -14], head: [-18, 42, 0], upperArmR: [-95, -20, -25], foreArmR: [-115, 0, 42], thighL: [-62, 10, 12], shinL: [84, 0, 0], thighR: [-48, -10, -18], shinR: [68, 0, 0] },
      }),
    },
    { f: 22, pose: POSE_GINGA_L },
  ],
};

/** Esquiva de Frente (Front lunge ducking torso forward over bent lead knee). */
export const TRACK_ESQUIVA_DE_FRENTE: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 7,
      easing: 'snap',
      pose: makePose(POSE_GINGA_MID, {
        root: { rx: 46, ry: -12 },
        bones: { spine: [34, 0, 0], chest: [28, 0, 0], head: [-42, 0, 0], upperArmR: [-92, -32, -16], foreArmR: [-110, 0, 35], upperArmL: [22, 0, 22], thighL: [-78, 6, 10], shinL: [92, 0, 0], thighR: [42, -6, -10], shinR: [18, 0, 0] },
      }),
    },
    { f: 16, linear: true, pose: makePose(POSE_GINGA_MID, { root: { rx: 46, ry: -12 }, bones: { spine: [34, 0, 0], chest: [28, 0, 0], head: [-42, 0, 0], thighL: [-78, 6, 10], shinL: [92, 0, 0], thighR: [42, -6, -10] } }) },
    { f: 24, pose: POSE_GINGA_MID },
  ],
};

/** Esquiva Baixa (Minhoquinho: ultra-low front crouch with rear hand grazing mat). */
export const TRACK_ESQUIVA_BAIXA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    {
      f: 7,
      easing: 'snap',
      pose: makePose(POSE_RLX_A, {
        root: { rx: 42, ry: -16 },
        bones: { spine: [36, 8, 0], head: [-46, 8, 0], upperArmR: [-25, 0, -28], handR: [68, 0, 0], upperArmL: [-92, 22, 18], foreArmL: [-112, 0, -32], thighL: [-102, 10, 14], shinL: [118, 0, 0], thighR: [25, -10, -14], shinR: [28, 0, 0] },
      }),
    },
    { f: 22, pose: POSE_GINGA_R },
  ],
};

/** Esquiva de Costas (Minhoquinho: swift backward step-away chest arch). */
export const TRACK_ESQUIVA_DE_COSTAS: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 7, easing: 'snap', pose: makePose(POSE_GINGA_R, { root: { rx: -18, ry: -28, dz: -0.22 }, bones: { spine: [-12, 18, 0], chest: [-12, 18, 0], upperArmR: [-86, -25, -20], foreArmR: [-105, 0, 38], thighL: [-28, 8, 8], thighR: [42, -12, -12] } }) },
    { f: 22, pose: POSE_GINGA_R },
  ],
};

/** Esquiva Paralela (Minhoquinho: parallel feet bob-and-weave sideways dodge). */
export const TRACK_ESQUIVA_PARALELA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    { f: 6, easing: 'snap', pose: makePose(POSE_GINGA_MID, { root: { dx: 0.18, rx: 24, rz: 22 }, bones: { spine: [24, 0, 22], head: [-18, 0, -18], thighL: [-72, 12, 16], shinL: [98, 0, 0], thighR: [-72, -12, -16], shinR: [98, 0, 0], upperArmL: [-78, 20, 15], foreArmL: [-112, 0, -28] } }) },
    { f: 14, easing: 'snap', pose: makePose(POSE_GINGA_MID, { root: { dx: -0.18, rx: 24, rz: -22 }, bones: { spine: [24, 0, -22], head: [-18, 0, 18], thighL: [-72, 12, 16], shinL: [98, 0, 0], thighR: [-72, -12, -16], shinR: [98, 0, 0] } }) },
    { f: 24, pose: POSE_GINGA_MID },
  ],
};

/** Ponte / Ponte para Trás (Full backward dorsal bridge). */
export const TRACK_PONTE_PARA_TRAS: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    { f: 9, easing: 'coil', pose: makePose(POSE_BRIDGE_ARCH, { root: { rx: -58 }, bones: { upperArmL: [-150, 0, 14], upperArmR: [-150, 0, -14] } }) },
    { f: 16, pose: POSE_BRIDGE_ARCH },
    { f: 24, linear: true, pose: POSE_BRIDGE_ARCH },
    { f: 34, pose: POSE_GINGA_MID },
  ],
};

/** Escala / Esquiva Escala (Floor diagonal scale lunge). */
export const TRACK_ESCALA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 7,
      easing: 'snap',
      pose: makePose(POSE_RLX_A, {
        root: { rx: 34, ry: -42, rz: 14 },
        bones: { spine: [32, 18, 8], head: [-32, -24, 0], upperArmR: [-45, 0, -28], handR: [68, 0, 0], upperArmL: [-82, 24, 22], foreArmL: [-108, 0, -32], thighL: [-98, 12, 18], shinL: [115, 0, 0], thighR: [28, -10, -22], shinR: [12, 0, 0] },
      }),
    },
    { f: 24, pose: POSE_RLX_A },
  ],
};

/** Aranha (Minhoquinho: low four-point crab/spider gliding dodge). */
export const TRACK_ARANHA: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    {
      f: 8,
      easing: 'snap',
      pose: makePose(POSE_BRIDGE_ARCH, {
        root: { rx: -68, ry: 24 },
        bones: { pelvis: [-8, 0, 0], spine: [-18, 12, 0], upperArmL: [-138, 0, 22], handL: [65, 0, 0], upperArmR: [-138, 0, -22], handR: [65, 0, 0], thighL: [-68, 0, 22], shinL: [96, 0, 0], thighR: [-68, 0, -22], shinR: [96, 0, 0] },
      }),
    },
    { f: 16, linear: true, pose: makePose(POSE_BRIDGE_ARCH, { root: { rx: -68, ry: -24 } }) },
    { f: 26, pose: POSE_RLX_A },
  ],
};

/** Giro (Minhoquinho: quick low 360° evasive pivot spin). */
export const TRACK_GIRO: Track = buildSpinTrack(
  POSE_GINGA_MID,
  [
    { f: 6, base: POSE_GINGA_MID, spec: { root: { rx: 22, ry: 125 } } },
    { f: 12, base: POSE_GINGA_MID, spec: { root: { rx: 24, ry: 255 } } },
  ],
  POSE_GINGA_R,
  20,
);

// ---- Negativa Family ----

export const TRACK_NEGATIVA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    { f: 8, pose: POSE_RLX_A },
    { f: 18, pose: POSE_RLX_B },
    { f: 26, pose: POSE_RLX_A },
  ],
};

/** Negativa Angola (Ultra-low flat torso-parallel Angola negativa). */
export const TRACK_NEGATIVA_ANGOLA: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    {
      f: 8,
      easing: 'snap',
      pose: makePose(POSE_RLX_A, {
        root: { rx: 38, ry: -12 },
        bones: { spine: [34, 18, 12], chest: [28, 18, 10], head: [-38, -22, 0], thighL: [-118, 14, 24], shinL: [128, 0, 0], thighR: [-78, -6, -8], shinR: [6, 0, 0], upperArmR: [-35, 0, -34], handR: [72, 0, 0] },
      }),
    },
    { f: 22, pose: POSE_RLX_A },
  ],
};

/** Negativa Derrubando / de Bimba (Low shoot trapping behind opponent's heel). */
export const TRACK_NEGATIVA_DERRUBANDO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 7,
      easing: 'snap',
      pose: makePose(POSE_RLX_A, {
        root: { rx: 28, ry: 10, dz: 0.28 },
        bones: { upperArmL: [-105, 0, 12], upperArmR: [-95, 0, -18], thighR: [-86, 18, -14], shinR: [28, 0, 0], footR: [0, 32, 0], thighL: [-110, 10, 18], shinL: [122, 0, 0] },
      }),
    },
    { f: 16, linear: true, pose: makePose(POSE_RLX_A, { root: { rx: 28, ry: -22, dz: 0.28 }, bones: { thighR: [-86, 28, 10], shinR: [35, 0, 0] } }) },
    { f: 26, pose: POSE_RLX_A },
  ],
};

/** Troca de Negativa (Crisp hopping leg-exchange Left <-> Right low on mat). */
export const TRACK_TROCA_DE_NEGATIVA: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    { f: 7, easing: 'snap', pose: makePose(POSE_RLX_A, { root: { dy: 0.14, rx: 18, ry: 0 }, bones: { upperArmL: [-135, 0, 18], handL: [70, 0, 0], upperArmR: [-135, 0, -18], handR: [70, 0, 0], thighL: [-82, 0, 14], shinL: [98, 0, 0], thighR: [-82, 0, -14], shinR: [98, 0, 0] } }) },
    { f: 14, pose: makePose(POSE_RLX_B, { root: { rx: 14, ry: 22 } }) },
    { f: 22, pose: POSE_RLX_A },
  ],
};

// ---- Rolê & Floor Flow Transitions ----

export const TRACK_ROLE: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    {
      f: 8,
      easing: 'coil',
      pose: makePose(POSE_RLX_A, {
        root: { rx: 62, ry: 130, dy: 0.04 },
        bones: {
          neck: [-14, -34, 0],
          head: [-14, -44, 0],
          upperArmL: [-125, 0, 24],
          handL: [74, 0, 0],
          upperArmR: [-125, 0, -24],
          handR: [74, 0, 0],
          thighL: [-78, 0, 20],
          shinL: [92, 0, 0],
          footR: [18, 0, 0],
          toeR: [-28, 0, 0],
        },
      }),
    },
    {
      f: 16,
      pose: makePose(POSE_GINGA_MID, {
        root: { ry: 280 },
        bones: {
          spine: [18, 0, 0],
          neck: [-8, -22, 0],
          head: [-10, -24, 0],
          thighL: [-44, 12, 16],
          shinL: [70, 0, 0],
          footL: [-14, 0, 0],
          toeL: [-22, 0, 0],
        },
      }),
    },
    { f: 24, pose: POSE_GINGA_R },
  ],
};

/** Rolê de Ponte (Bridge roll turnaround). */
export const TRACK_ROLE_DE_PONTE: Track = {
  keys: [
    { f: 0, pose: POSE_BRIDGE_ARCH },
    { f: 9, linear: true, pose: makePose(POSE_BRIDGE_ARCH, { root: { rx: -72, ry: 140, rz: 18 }, bones: { upperArmL: [-160, 0, 18], upperArmR: [-95, 0, -35], thighL: [-48, 0, 18], shinL: [72, 0, 0] } }) },
    { f: 18, linear: true, pose: makePose(POSE_RLX_A, { root: { rx: 28, ry: 290 } }) },
    { f: 28, pose: POSE_GINGA_MID },
  ],
};

/** Volta por Cima (Overhead shoulder/back rollover moenda). */
export const TRACK_VOLTA_POR_CIMA: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    { f: 7, pose: makePose(POSE_NEUTRAL, { root: { rx: -95, ry: 30 }, bones: { spine: [18, 0, 0], thighL: [-95, 0, 16], shinL: [90, 0, 0], thighR: [-95, 0, -16], shinR: [90, 0, 0], upperArmL: [-120, 0, 35], upperArmR: [-120, 0, -35] } }) },
    { f: 15, pose: makePose(POSE_NEUTRAL, { root: { rx: -210, ry: 145 }, bones: { thighL: [-65, 0, 28], thighR: [-40, 0, -28] } }) },
    { f: 26, pose: POSE_RLX_A },
  ],
};

/** Volta de Lado (Minhoquinho: smooth Cordão de Ouro sideways floor return). */
export const TRACK_VOLTA_DE_LADO: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    { f: 8, pose: makePose(POSE_QDR_BASE, { root: { rx: 98, ry: 65, rz: -42 }, bones: { thighL: [-45, 0, 38], thighR: [-25, 0, -48] } }) },
    { f: 17, pose: makePose(POSE_RLX_A, { root: { rx: 32, ry: 225, rz: 16 }, bones: { upperArmL: [-145, 0, 20], thighR: [-45, 0, -42] } }) },
    { f: 26, pose: POSE_GINGA_L },
  ],
};

/** Fuga (Minhoquinho: tucked knees flipped over bent QDR elbow). */
export const TRACK_FUGA: Track = {
  keys: [
    { f: 0, pose: POSE_QDR_BASE },
    { f: 8, easing: 'snap', pose: makePose(POSE_QDR_BASE, { root: { rx: 145, ry: 95, rz: 28 }, bones: { thighL: [-95, 0, 6], shinL: [115, 0, 0], thighR: [-95, 0, -6], shinR: [115, 0, 0] } }) },
    { f: 17, pose: makePose(POSE_RLX_A, { root: { rx: 22, ry: 180 } }) },
    { f: 24, pose: POSE_RLX_A },
  ],
};

/** Corrupio (Minhoquinho: circular floor spin pivoting on one planted hand). */
export const TRACK_CORRUPIO: Track = buildSpinTrack(
  POSE_RLX_A,
  [
    { f: 7, base: POSE_RLX_A, spec: { root: { rx: 48, ry: 120, rz: 22 }, bones: { upperArmR: [-145, 0, -22], handR: [75, 0, 0], thighL: [-58, 0, 35], thighR: [-35, 0, -42] } } },
    { f: 15, base: POSE_RLX_A, spec: { root: { rx: 48, ry: 255, rz: 22 }, bones: { upperArmR: [-145, 0, -22], handR: [75, 0, 0], thighL: [-58, 0, 35], thighR: [-35, 0, -42] } } },
  ],
  POSE_RLX_A,
  24,
);

/** Gorila (Minhoquinho: low broad-shouldered knuckle/ape stalking advance). */
export const TRACK_GORILA: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    {
      f: 8,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 52, ry: 10 },
        bones: { spine: [28, 0, 0], head: [-38, 0, 0], upperArmL: [-110, 0, 28], handL: [60, 0, 0], upperArmR: [-110, 0, -28], handR: [60, 0, 0], thighL: [-96, 16, 22], shinL: [112, 0, 0], thighR: [-86, -16, -22], shinR: [104, 0, 0] },
      }),
    },
    { f: 16, pose: makePose(POSE_NEUTRAL, { root: { rx: 52, ry: -10, dz: 0.25 }, bones: { spine: [28, 0, 0], head: [-38, 0, 0], upperArmL: [-110, 0, 28], upperArmR: [-110, 0, -28], thighL: [-86, 16, 22], shinL: [104, 0, 0], thighR: [-96, -16, -22], shinR: [112, 0, 0] } }) },
    { f: 24, pose: POSE_RLX_A },
  ],
};

// ---- Queda Family ----

/** Queda de Três (Low three-point floor brace: two feet + one palm). */
export const TRACK_QUEDA_DE_TRES: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    { f: 8, pose: makePose(POSE_RLX_A, { root: { rx: 46 }, bones: { spine: [26, 0, 0], head: [-36, 0, 0], upperArmR: [-125, 0, -18], handR: [70, 0, 0], upperArmL: [-68, 22, 18], foreArmL: [-108, 0, -28], thighL: [-88, 12, 16], shinL: [98, 0, 0], thighR: [-88, -12, -16], shinR: [98, 0, 0] } }) },
    { f: 22, pose: POSE_RLX_A },
  ],
};

/** Queda de Quatro (Low four-point crab/table evasion). */
export const TRACK_QUEDA_DE_QUATRO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    { f: 8, easing: 'snap', pose: makePose(POSE_BRIDGE_ARCH, { root: { rx: -72 }, bones: { pelvis: [-4, 0, 0], spine: [-8, 0, 0], chest: [-8, 0, 0], upperArmL: [-135, 0, 16], upperArmR: [-135, 0, -16], thighL: [-78, 0, 14], shinL: [92, 0, 0], thighR: [-78, 0, -14], shinR: [92, 0, 0] } }) },
    { f: 18, linear: true, pose: makePose(POSE_BRIDGE_ARCH, { root: { rx: -72 }, bones: { upperArmL: [-135, 0, 16], upperArmR: [-135, 0, -16], thighL: [-78, 0, 14], shinL: [92, 0, 0], thighR: [-78, 0, -14], shinR: [92, 0, 0] } }) },
    { f: 26, pose: POSE_RLX_A },
  ],
};

/** Queda de Rins (Classic kidney-balance elbow freeze hold). */
export const TRACK_QUEDA_DE_RINS: Track = {
  keys: [
    { f: 0, pose: POSE_RLX_A },
    { f: 8, pose: POSE_QDR_BASE },
    { f: 20, linear: true, pose: POSE_QDR_BASE },
    { f: 28, pose: POSE_RLX_A },
  ],
};

/** Relógio (360° clock spin around planted hand in Queda de Rins). */
export const TRACK_RELOGIO: Track = buildSpinTrack(
  POSE_QDR_BASE,
  [
    { f: 8, base: POSE_QDR_BASE, spec: { root: { rx: 95, ry: 95, rz: 48 } } },
    { f: 16, base: POSE_QDR_BASE, spec: { root: { rx: 95, ry: 215, rz: 48 } } },
    { f: 24, base: POSE_QDR_BASE, spec: { root: { rx: 95, ry: 335, rz: 48 } } },
  ],
  POSE_RLX_A,
  30,
);

/** Chamada de Angola (Ritual open-palm invitation / tactical malícia trap). */
export const TRACK_CHAMADA: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 8,
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 12 },
        bones: {
          spine: [-6, 8, 0],
          chest: [-6, 12, 0],
          head: [4, -10, 0],
          upperArmR: [-84, -12, -22],
          foreArmR: [-14, 0, 0],
          handR: [24, 0, 0],
          upperArmL: [-40, 22, 24],
          foreArmL: [-92, 0, -24],
          thighL: [-22, 10, 8],
          shinL: [34, 0, 0],
          footL: [-12, 0, 0],
          thighR: [10, -10, -8],
          shinR: [20, 0, 0],
          footR: [-10, 0, 0],
        },
      }),
    },
    {
      f: 24,
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: -8 },
        bones: {
          spine: [6, -6, 0],
          chest: [4, -8, 0],
          head: [-4, 12, 0],
          upperArmR: [-76, -10, -26],
          foreArmR: [-22, 0, 0],
          handR: [20, 0, 0],
          upperArmL: [-48, 22, 26],
          foreArmL: [-96, 0, -24],
          thighL: [-26, 10, 10],
          shinL: [40, 0, 0],
          footL: [-14, 0, 0],
          thighR: [-14, -10, -10],
          shinR: [28, 0, 0],
          footR: [-14, 0, 0],
        },
      }),
    },
    { f: 34, pose: POSE_GINGA_R },
  ],
};

/** Volta ao Mundo (Calm circling walk around Roda perimeter to reset rhythm and catch breath). */
export const TRACK_VOLTA_MUNDO: Track = {
  keys: [
    { f: 0, pose: POSE_GINGA_MID },
    {
      f: 9,
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: 20 },
        bones: {
          spine: [4, 10, -4],
          chest: [2, 12, -4],
          head: [-4, -18, 0],
          upperArmL: [-34, 12, 22],
          foreArmL: [-66, 0, -18],
          upperArmR: [18, -10, -18],
          foreArmR: [-42, 0, 14],
          thighL: [-28, 8, 8],
          shinL: [38, 0, 0],
          footL: [-10, 0, 0],
          thighR: [18, -8, -8],
          shinR: [22, 0, 0],
          footR: [12, 0, 0],
        },
      }),
    },
    {
      f: 21,
      pose: makePose(POSE_NEUTRAL, {
        root: { ry: -18 },
        bones: {
          spine: [4, -10, 4],
          chest: [2, -12, 4],
          head: [-4, 16, 0],
          upperArmL: [16, 10, 18],
          foreArmL: [-42, 0, -14],
          upperArmR: [-36, -12, -22],
          foreArmR: [-66, 0, 18],
          thighL: [18, 8, 8],
          shinL: [22, 0, 0],
          footL: [12, 0, 0],
          thighR: [-28, -8, -8],
          shinR: [38, 0, 0],
          footR: [-10, 0, 0],
        },
      }),
    },
    { f: 32, pose: POSE_GINGA_MID },
  ],
};
