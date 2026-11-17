// Entry point: wires 60 Hz deterministic sim, Three.js renderer, Input/AI, Audio, and HUD.
import './style.css';
import { createAiMemory, stepAi } from './ai/cpu';
import { createShowAiMemory, stepShowAi } from './ai/showAi';
import { AudioEngine } from './audio/sfx';
import { InputManager } from './input/manager';
import { TouchControls } from './input/touch';
import { GameRenderer } from './render/scene';
import type { VisualFilterId, VisualStyleId } from './render/presets';
import type { CostumeId } from './data/characters';
import { ITERATION_PRESETS, type IterationId } from './data/iterations';
import {
  createMatchState,
  setMatchToque,
  type InputFrame,
  type MatchState,
  type PlayMode,
  type ToqueId,
} from './sim/state';
import { step, triggerShowcaseAction } from './sim/step';
import { GameHud, type HudMode } from './ui/hud';

const app = document.getElementById('app')!;
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('embed') === '1') {
  document.body.classList.add('embed-mode');
}

const eraKey = urlParams.get('era') as IterationId | null;
const eraPreset = eraKey && eraKey in ITERATION_PRESETS ? ITERATION_PRESETS[eraKey] : null;

const selectedChars: [string, string] = [
  urlParams.get('p1') ?? eraPreset?.p1 ?? 'faisca',
  urlParams.get('p2') ?? eraPreset?.p2 ?? 'faisca',
];
const selectedPalettes: [number, number] = [
  Number(urlParams.get('p1pal') ?? eraPreset?.p1Pal ?? 0) || 0,
  Number(urlParams.get('p2pal') ?? eraPreset?.p2Pal ?? 1) || 0,
];
const initCostumes: [CostumeId, CostumeId] = [
  (urlParams.get('p1skin') ?? eraPreset?.p1Skin ?? 'default') as CostumeId,
  (urlParams.get('p2skin') ?? eraPreset?.p2Skin ?? 'default') as CostumeId,
];
let selectedGravity = Number(urlParams.get('g') ?? eraPreset?.gravity ?? 1.0) || 1.0;
let selectedToque: ToqueId = (urlParams.get('toque') ?? eraPreset?.toque ?? 'sao_bento') as ToqueId;
const initMode = ((urlParams.get('mode') ?? eraPreset?.mode ?? 'VS_CPU') as HudMode);
const initStyle = ((urlParams.get('style') ?? eraPreset?.style ?? (Math.abs(selectedGravity - 0.165) < 0.01 ? 'lunar' : 'sf2')) as VisualStyleId);
const initFilter = ((urlParams.get('filter') ?? eraPreset?.filter ?? 'none') as VisualFilterId);
const initHitboxes = urlParams.get('hb') !== null ? urlParams.get('hb') === '1' : Boolean(eraPreset?.hitboxes);
let manualStyleSelected = Boolean(urlParams.get('style') || eraPreset?.style);

const initPlayMode: PlayMode = initMode === 'SHOW' ? 'SHOW' : initMode === 'TRAINING' ? 'TRAINING' : 'VERSUS';
const initTraining = initMode === 'TRAINING';

let state: MatchState = createMatchState({
  p1Char: selectedChars[0],
  p2Char: selectedChars[1],
  p1Palette: selectedPalettes[0],
  p2Palette: selectedPalettes[1],
  p1Costume: initCostumes[0],
  p2Costume: initCostumes[1],
  gravityScale: selectedGravity,
  toque: selectedToque,
  trainingMode: initTraining,
  playMode: initPlayMode,
});
let prevState: MatchState = structuredClone(state);

const autoEnabled: [boolean, boolean] =
  initMode === 'SHOW'
    ? [true, true]
    : initMode === 'TRAINING' || initMode === 'VS_2P'
      ? [false, false]
      : [false, true];
const aiMem = [createAiMemory(0x11223344), createAiMemory(0x55667788)];
const showAiMem = [createShowAiMemory(0x11223344), createShowAiMemory(0x55667788)];

const renderer = new GameRenderer(app, state);
renderer.setStyle(initStyle);
renderer.setFilter(initFilter);
renderer.debug.setVisible(initHitboxes);
const audio = new AudioEngine();
const touch = new TouchControls(app);

function restartMatch(
  trainingMode = state.config.trainingMode,
  playMode: PlayMode = state.config.playMode ?? (trainingMode ? 'TRAINING' : 'VERSUS'),
): void {
  state = createMatchState({
    p1Char: selectedChars[0],
    p2Char: selectedChars[1],
    p1Palette: selectedPalettes[0],
    p2Palette: selectedPalettes[1],
    p1Costume: state.fighters[0].costume,
    p2Costume: state.fighters[1].costume,
    gravityScale: selectedGravity,
    toque: selectedToque,
    trainingMode,
    playMode,
  });
  showAiMem[0] = createShowAiMemory(0x11223344);
  showAiMem[1] = createShowAiMemory(0x55667788);
  renderer.rebuildFighter(0, state.fighters[0].charId, selectedPalettes[0], state.fighters[0].costume);
  renderer.rebuildFighter(1, state.fighters[1].charId, selectedPalettes[1], state.fighters[1].costume);
  prevState = structuredClone(state);
}

const hud = new GameHud(app, {
  onModeChange(mode) {
    audio.unlock();
    if (mode === 'VS_CPU') {
      autoEnabled[0] = false;
      autoEnabled[1] = true;
      restartMatch(false, 'VERSUS');
    } else if (mode === 'SHOW') {
      autoEnabled[0] = true;
      autoEnabled[1] = true;
      restartMatch(false, 'SHOW');
      hud.showBanner('🤝 JOGAR NA RODA! (PLAY / SHOW)', 55);
    } else if (mode === 'TRAINING') {
      autoEnabled[0] = false;
      autoEnabled[1] = false;
      restartMatch(true, 'TRAINING');
    } else {
      autoEnabled[0] = false;
      autoEnabled[1] = false;
      restartMatch(false, 'VERSUS');
    }
    hud.setAutoBadges(autoEnabled[0], autoEnabled[1], state.config.playMode);
  },
  onSelectFighter(slot, charId) {
    audio.unlock();
    selectedChars[slot] = charId;
    state.fighters[slot].charId = charId;
    prevState.fighters[slot].charId = charId;
    renderer.rebuildFighter(slot, charId, state.fighters[slot].paletteIdx, state.fighters[slot].costume);
  },
  onSelectPalette(slot, paletteIdx) {
    audio.unlock();
    selectedPalettes[slot] = paletteIdx;
    state.fighters[slot].paletteIdx = paletteIdx;
    prevState.fighters[slot].paletteIdx = paletteIdx;
    renderer.setPalette(slot, paletteIdx);
  },
  onSelectCostume(slot, costume: CostumeId) {
    audio.unlock();
    state.fighters[slot].costume = costume;
    prevState.fighters[slot].costume = costume;
    renderer.setCostume(slot, costume);
    hud.setCostumeActive(slot, costume);
  },
  onSelectGravity(gravityScale: number) {
    audio.unlock();
    selectedGravity = gravityScale;
    state.config.gravityScale = gravityScale;
    prevState.config.gravityScale = gravityScale;
    if (!manualStyleSelected) {
      const autoStyle: VisualStyleId = Math.abs(gravityScale - 0.165) < 0.01 ? 'lunar' : 'sf2';
      renderer.setStyle(autoStyle);
      hud.setStyleActive(autoStyle);
    }
    const label = Math.abs(gravityScale - 0.165) < 0.01
      ? '🌙 LUNAR GRAVITY (0.165g)'
      : Math.abs(gravityScale - 0.38) < 0.01
        ? '🔴 MARS GRAVITY (0.38g)'
        : '🌍 EARTH GRAVITY (1.0g)';
    hud.showBanner(label, 42);
  },
  onSelectToque(toque: ToqueId) {
    audio.unlock();
    selectedToque = toque;
    setMatchToque(state, toque);
    setMatchToque(prevState, toque);
    hud.setToqueActive(toque);
  },
  onSelectStyle(style: VisualStyleId) {
    audio.unlock();
    manualStyleSelected = true;
    renderer.setStyle(style);
    hud.setStyleActive(style);
  },
  onSelectFilter(filter: VisualFilterId) {
    audio.unlock();
    renderer.setFilter(filter);
    hud.setFilterActive(filter);
  },
  onTryMove(moveId) {
    audio.unlock();
    triggerShowcaseAction(state, 0, moveId);
  },
  onToggleAuto(slot) {
    audio.unlock();
    autoEnabled[slot] = !autoEnabled[slot];
    hud.setAutoBadges(autoEnabled[0], autoEnabled[1], state.config.playMode);
  },
  onToggleHitboxes() {
    renderer.debug.setVisible(!renderer.debug.isVisible());
  },
  onToggleRetro() {
    const next: VisualFilterId = renderer.isRetroMode() ? 'none' : 'crt';
    renderer.setFilter(next);
    hud.setFilterActive(next);
  },
  onToggleTouch() {
    audio.unlock();
    touch.setVisible(!touch.isVisible());
  },
  onToggleCostume(slot) {
    const next = state.fighters[slot].costume === 'maculele' ? 'default' : 'maculele';
    state.fighters[slot].costume = next;
    prevState.fighters[slot].costume = next;
    renderer.setCostume(slot, next);
    hud.setCostumeActive(slot, next);
  },
  onToggleMute() {
    audio.unlock();
    audio.setMuted(!audio.isMuted());
    hud.setMuteLabel(audio.isMuted());
  },
  onResetMatch() {
    audio.unlock();
    restartMatch(state.config.trainingMode);
  },
});

hud.setAutoBadges(autoEnabled[0], autoEnabled[1], state.config.playMode);
hud.syncPreset({
  mode: initMode,
  p1: selectedChars[0],
  p2: selectedChars[1],
  p1Skin: initCostumes[0],
  p2Skin: initCostumes[1],
  p1Pal: selectedPalettes[0],
  p2Pal: selectedPalettes[1],
  gravity: selectedGravity,
  toque: selectedToque,
  style: initStyle,
  filter: initFilter,
  hitboxes: initHitboxes,
});

const input = new InputManager((code) => {
  audio.unlock();
  if (code === 'F1') {
    autoEnabled[0] = !autoEnabled[0];
    hud.setAutoBadges(autoEnabled[0], autoEnabled[1], state.config.playMode);
  } else if (code === 'F2') {
    autoEnabled[1] = !autoEnabled[1];
    hud.setAutoBadges(autoEnabled[0], autoEnabled[1], state.config.playMode);
  } else if (code === 'F3') {
    renderer.debug.setVisible(!renderer.debug.isVisible());
  } else if (code === 'Tab') {
    hud.toggleMoveList();
  }
});

window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
window.addEventListener('keydown', () => audio.unlock(), { once: true });

// Fixed 60 Hz simulation loop with accumulator, presentation slow-mo, & render interpolation
const DT = 1 / 60;
let acc = 0;
let lastTime = performance.now();
let slowMoTimer = 0;
let slowMoMax = 0.56;
let slowMoMin = 0.28;

function frame(now: number): void {
  const dtReal = Math.min((now - lastTime) / 1000, 0.25);
  lastTime = now;
  let simTimeScale = 1.0;
  if (slowMoTimer > 0) {
    slowMoTimer = Math.max(0, slowMoTimer - dtReal);
    const progress = slowMoMax > 0 ? 1 - slowMoTimer / slowMoMax : 1;
    simTimeScale = slowMoMin + (1 - slowMoMin) * progress;
  }
  acc += dtReal * simTimeScale;

  const [camRx, camRz] = renderer.getCamRight();

  while (acc >= DT) {
    prevState = structuredClone(state);
    const inShow = state.config.playMode === 'SHOW';
    const in0: InputFrame = autoEnabled[0]
      ? inShow
        ? stepShowAi(state, 0, showAiMem[0])
        : stepAi(state, 0, aiMem[0], 'MEDIUM')
      : input.poll(0, state.fighters[0], camRx, camRz, touch.isVisible() ? touch : undefined);
    const in1: InputFrame = autoEnabled[1]
      ? inShow
        ? stepShowAi(state, 1, showAiMem[1])
        : stepAi(state, 1, aiMem[1], 'MEDIUM')
      : input.poll(1, state.fighters[1], camRx, camRz);

    step(state, [in0, in1]);

    // Trigger VFX, camera shake, audio, and peak finisher polish from sim events
    audio.syncBeat(state);
    audio.handleEvents(state.events);
    for (const ev of state.events) {
      if (ev.type === 'HIT') {
        renderer.vfx.spawnBurst(ev.pos, 0xff9f1c, 12, false);
        renderer.vfx.spawnDust(state.fighters[ev.slot].pos, 3);
        renderer.triggerShake(0.08);
      } else if (ev.type === 'COUNTER') {
        renderer.vfx.spawnBurst(ev.pos, 0xff2a2a, 18, false);
        renderer.vfx.spawnDust(state.fighters[ev.slot].pos, 5);
        renderer.triggerShake(0.15);
      } else if (ev.type === 'BLOCK') {
        renderer.vfx.spawnBurst(ev.pos, 0x48cae4, 8, true);
      } else if (ev.type === 'HARMONY') {
        renderer.vfx.spawnHarmony(ev.pos);
        if ((ev.value ?? 0) >= 5 && (ev.value ?? 0) % 5 === 0) {
          slowMoMax = 0.28;
          slowMoTimer = 0.28;
          slowMoMin = 0.62;
          renderer.triggerFinisherPolish(ev.pos, 'MILESTONE');
        }
      } else if (ev.type === 'BEAT_BONUS') {
        renderer.vfx.spawnBeatRing(ev.pos, 0xffd166);
      } else if (ev.type === 'KO') {
        renderer.vfx.spawnBurst(ev.pos, 0xff2a2a, 24, false);
        renderer.vfx.spawnDust(state.fighters[ev.slot].pos, 8);
        renderer.triggerShake(0.24);
        slowMoMax = 0.56;
        slowMoTimer = 0.56;
        slowMoMin = 0.28;
        renderer.triggerFinisherPolish(ev.pos, 'KO');
      }
    }
    hud.update(state, state.events, renderer.debug.isVisible(), 1);
    acc -= DT;
  }

  renderer.draw(prevState, state, acc / DT, dtReal);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
