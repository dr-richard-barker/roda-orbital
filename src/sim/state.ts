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

/** Single-frame player input in relative (facing-independent) numpad notation. */
export interface InputFrame {
  /** Numpad 1..9 relative to facing (6 = toward opponent, 4 = away, 8 = up/sidestep, 2 = down/crouch, 5 = neutral). */
  dir: number;
  /** Bitmask of currently held buttons. */
  buttons: number;
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

  // Sidestep state
  sidestepDir: number; // -1, 0, +1
  sidestepTimer: number;
}

export interface SimEvent {
  type: 'HIT' | 'BLOCK' | 'COUNTER' | 'BEAT_BONUS' | 'KO' | 'ROUND_START' | 'STANCE';
  slot: 0 | 1;
  pos: Vec3;
  value?: number;
  label?: string;
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
  bpm: number;
  framesPerBeat: number;
  beatPhase: number; // 0 .. framesPerBeat-1
  barBeat: number;   // 0..3

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
  };
}

export function createMatchState(cfg: Partial<MatchConfig> = {}): MatchState {
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
    trainingMode: cfg.trainingMode ?? false,
  };
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
    roundPhase: config.trainingMode ? 'FIGHT' : 'INTRO',
    phaseTimer: config.trainingMode ? 0 : 60,
    roundTimerFrames: 99 * 60,
    wins: [0, 0],
    winner: -1,
    bpm: 105,
    framesPerBeat: Math.round(3600 / 105), // 34 frames (~105.9 BPM)
    beatPhase: 0,
    barBeat: 0,
    events: [],
  };
}

export function resetRound(s: MatchState): void {
  for (let i = 0; i < 2; i++) {
    const f = s.fighters[i];
    const fresh = makeFighter(f.slot, f.charId, f.paletteIdx, f.costume);
    s.fighters[i] = fresh;
  }
  s.hitstop = 0;
  s.roundPhase = s.config.trainingMode ? 'FIGHT' : 'INTRO';
  s.phaseTimer = s.config.trainingMode ? 0 : 60;
  s.roundTimerFrames = 99 * 60;
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
  h.i32(s.beatPhase);
  h.i32(s.barBeat);
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
  }
  return h.finish();
}
