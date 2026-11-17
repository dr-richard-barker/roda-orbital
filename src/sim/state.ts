// Pure simulation state types, factory, and deterministic state hashing.
import type { Vec3 } from '../core/fixedmath';
import { Hasher } from '../core/hash';
import { charById, type CostumeId } from '../data/characters';
import type { Stance } from '../data/moves';

export type ButtonBit = 1 | 2 | 4 | 8 | 16 | 32;
export const BTN_LH = 1;
export const BTN_RH = 2;
export const BTN_LK = 4;
export const BTN_RK = 8;
export const BTN_STANCE = 16;
export const BTN_TAG = 32;

export type PlayMode = 'VERSUS' | 'TRAINING' | 'SHOW';

export type ToqueId = 'angola' | 'sao_bento' | 'iuna';

export interface ToquePreset {
  id: ToqueId;
  label: string;
  shortLabel: string;
  bpm: number;
  description: string;
}

export const TOQUE_PRESETS: readonly ToquePreset[] = [
  {
    id: 'angola',
    label: 'Toque de Angola (88 BPM)',
    shortLabel: 'Angola · 88',
    bpm: 88,
    description: 'Deep, patient meditative Gunga cadence with relaxed rhythm window',
  },
  {
    id: 'sao_bento',
    label: 'São Bento Grande (105 BPM)',
    shortLabel: 'São Bento · 105',
    bpm: 105,
    description: 'Balanced driving Regional rhythm (standard Roda pace)',
  },
  {
    id: 'iuna',
    label: 'Iúna (124 BPM)',
    shortLabel: 'Iúna · 124',
    bpm: 124,
    description: 'Fast, celebratory Mestre Bimba acrobatic floreio toque',
  },
];

export function toquePreset(id: string | null | undefined): ToquePreset {
  return TOQUE_PRESETS.find((t) => t.id === id) ?? TOQUE_PRESETS[1];
}

/** Single-frame player input in relative (facing-independent) numpad notation. */
export interface InputFrame {
  /** Numpad 1..9 relative to facing (6 = toward opponent, 4 = away, 8 = up/sidestep, 2 = down/crouch, 5 = neutral). */
  dir: number;
  /** Bitmask of currently held buttons. */
  buttons: number;
  /** Optional choreographed/supportive move trigger honored strictly when MatchConfig.playMode === 'SHOW'. */
  showMoveId?: string;
}

export const EMPTY_INPUT: InputFrame = { dir: 5, buttons: 0 };

export type FighterMode =
  | 'IDLE'
  | 'WALK'
  | 'SHIFT'
  | 'ATTACK'
  | 'HITSTUN'
  | 'BLOCKSTUN'
  | 'JUGGLE'
  | 'KNOCKDOWN'
  | 'WAKEUP'
  | 'KO';

export interface BufferedInput {
  dir: number;
  pressed: number; // newly pressed button bits this frame
  held: number;
}

export interface FighterState {
  slot: 0 | 1;
  charId: string;
  paletteIdx: number;
  costume: CostumeId;
  pos: Vec3;
  vel: Vec3;
  /** Facing direction on XZ plane (unit vector). */
  facing: [number, number];
  stance: Stance;
  mode: FighterMode;
  modeFrame: number;
  stunFrames: number;

  // Active move or stance shift
  moveId: string | null;
  moveFrame: number;
  moveHitMask: number; // bitmask of HitWindow indices already connected
  hitConnected: boolean;
  hitBlocked: boolean;
  shiftTo: Stance | null;
  shiftDuration: number;

  // Health & resources
  health: number;
  maxHealth: number;
  redHealth: number;
  malicia: number; // 0..100

  // Juggle & combo tracking
  juggleHits: number;
  comboCount: number;
  comboDamage: number;
  lastFrameAdv: number; // for Training HUD

  // Input history (newest at index 0, max 16 frames)
  inputBuf: BufferedInput[];
  prevButtons: number;

  // Sidestep & walk direction
  sidestepDir: number; // -1, 0, +1
  sidestepTimer: number;
  walkDir: number; // 1 = forward, -1 = backward
  lastHitLevel: 'HIGH' | 'MID' | 'LOW' | 'THROW';
}

export interface SimEvent {
  type: 'HIT' | 'BLOCK' | 'COUNTER' | 'BEAT_BONUS' | 'KO' | 'ROUND_START' | 'STANCE' | 'HARMONY' | 'GRAZE';
  slot: 0 | 1;
  pos: Vec3;
  value?: number;
  label?: string;
}

export interface HarmonyState {
  flow: number; // 0..100 synchronized Play / Show meter
  streak: number;
  bestStreak: number;
  nearMisses: number;
  grazes: number;
  callerSlot: 0 | 1;
  lastPhrase: string;
  phraseTimer: number;
}

export interface MatchConfig {
  p1Char: string;
  p2Char: string;
  p1Palette?: number;
  p2Palette?: number;
  p1Costume?: CostumeId;
  p2Costume?: CostumeId;
  gravityScale: number; // 1.0 Earth, 0.38 Mars, 0.165 Lunar, 0.02 Station
  arenaRadius: number;
  rhythmSyncEnabled: boolean;
  trainingMode: boolean;
  playMode?: PlayMode;
  toque?: ToqueId;
}

export interface MatchState {
  frame: number;
  rngSeed: number;
  config: MatchConfig;
  fighters: [FighterState, FighterState];
  hitstop: number;

  // Round state
  round: number;
  roundPhase: 'INTRO' | 'FIGHT' | 'KO' | 'MATCH_OVER';
  phaseTimer: number;
  roundTimerFrames: number; // 99s * 60 = 5940
  wins: [number, number];
  winner: -1 | 0 | 1;

  // Rhythm clock (sim-owned for determinism)
  toque: ToqueId;
  bpm: number;
  framesPerBeat: number;
  beatPhase: number; // 0 .. framesPerBeat-1
  barBeat: number;   // 0..3

  // Cooperative Show / Play Mode telemetry
  harmony: HarmonyState;

  // Transient events emitted this frame (cleared each step)
  events: SimEvent[];
}

function makeFighter(slot: 0 | 1, charId: string, paletteIdx: number, costume: CostumeId): FighterState {
  const def = charById(charId);
  return {
    slot,
    charId: def.id,
    paletteIdx,
    costume,
    pos: [slot === 0 ? -1.4 : 1.4, 0, 0],
    vel: [0, 0, 0],
    facing: [slot === 0 ? 1 : -1, 0],
    stance: 'GINGA',
    mode: 'IDLE',
    modeFrame: 0,
    stunFrames: 0,
    moveId: null,
    moveFrame: 0,
    moveHitMask: 0,
    hitConnected: false,
    hitBlocked: false,
    shiftTo: null,
    shiftDuration: 0,
    health: def.health,
    maxHealth: def.health,
    redHealth: def.health,
    malicia: 0,
    juggleHits: 0,
    comboCount: 0,
    comboDamage: 0,
    lastFrameAdv: 0,
    inputBuf: [],
    prevButtons: 0,
    sidestepDir: 0,
    sidestepTimer: 0,
    walkDir: 1,
    lastHitLevel: 'MID',
  };
}

function makeInitialHarmony(): HarmonyState {
  return {
    flow: 0,
    streak: 0,
    bestStreak: 0,
    nearMisses: 0,
    grazes: 0,
    callerSlot: 0,
    lastPhrase: '',
    phraseTimer: 0,
  };
}

export function createMatchState(cfg: Partial<MatchConfig> = {}): MatchState {
  const playMode: PlayMode = cfg.playMode ?? (cfg.trainingMode ? 'TRAINING' : 'VERSUS');
  const trainingMode = playMode === 'TRAINING' ? true : (cfg.trainingMode ?? false);
  const nonElim = playMode !== 'VERSUS';
  const toque = toquePreset(cfg.toque);
  const config: MatchConfig = {
    p1Char: cfg.p1Char ?? 'faisca',
    p2Char: cfg.p2Char ?? 'faisca',
    p1Palette: cfg.p1Palette ?? 0,
    p2Palette: cfg.p2Palette ?? 1,
    p1Costume: cfg.p1Costume ?? 'default',
    p2Costume: cfg.p2Costume ?? 'default',
    gravityScale: cfg.gravityScale ?? 1.0,
    arenaRadius: cfg.arenaRadius ?? 6.5,
    rhythmSyncEnabled: cfg.rhythmSyncEnabled ?? true,
    trainingMode,
    playMode,
    toque: toque.id,
  };
  const framesPerBeat = Math.round(3600 / toque.bpm);
  return {
    frame: 0,
    rngSeed: 0x13572468,
    config,
    fighters: [
      makeFighter(0, config.p1Char, config.p1Palette!, config.p1Costume!),
      makeFighter(1, config.p2Char, config.p2Palette!, config.p2Costume!),
    ],
    hitstop: 0,
    round: 1,
    roundPhase: nonElim ? 'FIGHT' : 'INTRO',
    phaseTimer: nonElim ? 0 : 60,
    roundTimerFrames: 99 * 60,
    wins: [0, 0],
    winner: -1,
    toque: toque.id,
    bpm: toque.bpm,
    framesPerBeat, // 34 frames (~105.9 BPM) for default São Bento Grande
    beatPhase: 0,
    barBeat: 0,
    harmony: makeInitialHarmony(),
    events: [],
  };
}

/** Update the active Berimbau toque rhythm clock live without breaking beatPhase bounds. */
export function setMatchToque(s: MatchState, toqueId: ToqueId): void {
  const preset = toquePreset(toqueId);
  s.toque = preset.id;
  s.config.toque = preset.id;
  s.bpm = preset.bpm;
  s.framesPerBeat = Math.round(3600 / preset.bpm);
  if (s.beatPhase >= s.framesPerBeat) {
    s.beatPhase = s.beatPhase % s.framesPerBeat;
  }
}

export function resetRound(s: MatchState): void {
  const nonElim = s.config.playMode !== 'VERSUS';
  for (let i = 0; i < 2; i++) {
    const f = s.fighters[i];
    const fresh = makeFighter(f.slot, f.charId, f.paletteIdx, f.costume);
    s.fighters[i] = fresh;
  }
  s.hitstop = 0;
  s.roundPhase = nonElim ? 'FIGHT' : 'INTRO';
  s.phaseTimer = nonElim ? 0 : 60;
  s.roundTimerFrames = 99 * 60;
  s.harmony = makeInitialHarmony();
}

export function hashMatchState(s: MatchState): number {
  const h = new Hasher();
  h.i32(s.frame);
  h.i32(s.rngSeed);
  h.i32(s.hitstop);
  h.i32(s.round);
  h.str(s.roundPhase);
  h.i32(s.phaseTimer);
  h.i32(s.roundTimerFrames);
  h.i32(s.wins[0]);
  h.i32(s.wins[1]);
  h.i32(s.winner);
  h.str(s.toque);
  h.i32(s.beatPhase);
  h.i32(s.barBeat);
  h.i32(s.harmony.streak);
  h.i32(s.harmony.nearMisses);
  h.i32(s.harmony.grazes);
  h.i32(s.harmony.callerSlot);
  h.f64(s.harmony.flow);
  for (const f of s.fighters) {
    h.str(f.charId);
    h.f64(f.pos[0]); h.f64(f.pos[1]); h.f64(f.pos[2]);
    h.f64(f.vel[0]); h.f64(f.vel[1]); h.f64(f.vel[2]);
    h.f64(f.facing[0]); h.f64(f.facing[1]);
    h.str(f.stance);
    h.str(f.mode);
    h.i32(f.modeFrame);
    h.i32(f.stunFrames);
    h.str(f.moveId ?? '');
    h.i32(f.moveFrame);
    h.i32(f.moveHitMask);
    h.f64(f.health);
    h.f64(f.malicia);
    h.i32(f.juggleHits);
    h.i32(f.comboCount);
    h.i32(f.walkDir);
    h.str(f.lastHitLevel);
  }
  return h.finish();
}
