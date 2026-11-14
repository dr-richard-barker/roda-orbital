// Entry point: wires 60 Hz deterministic sim, Three.js renderer, Input/AI, Audio, and HUD.
import './style.css';
import { createAiMemory, stepAi } from './ai/cpu';
import { AudioEngine } from './audio/sfx';
import { InputManager } from './input/manager';
import { TouchControls } from './input/touch';
import { GameRenderer } from './render/scene';
import { createMatchState, type InputFrame, type MatchState } from './sim/state';
import { step } from './sim/step';
import { GameHud } from './ui/hud';

const app = document.getElementById('app')!;

let state: MatchState = createMatchState({
  p1Char: 'faisca',
  p2Char: 'faisca',
  p1Palette: 0,
  p2Palette: 1,
  gravityScale: 1.0,
  trainingMode: false,
});
let prevState: MatchState = structuredClone(state);

const autoEnabled: [boolean, boolean] = [false, true]; // 1P vs CPU by default
const aiMem = [createAiMemory(0x11223344), createAiMemory(0x55667788)];

const renderer = new GameRenderer(app, state);
const audio = new AudioEngine();
const touch = new TouchControls(app);

function restartMatch(trainingMode = state.config.trainingMode): void {
  state = createMatchState({
    p1Char: 'faisca',
    p2Char: 'faisca',
    p1Palette: 0,
    p2Palette: 1,
    p1Costume: state.fighters[0].costume,
    p2Costume: state.fighters[1].costume,
    gravityScale: 1.0,
    trainingMode,
  });
  prevState = structuredClone(state);
}

const hud = new GameHud(app, {
  onModeChange(mode) {
    audio.unlock();
    if (mode === 'VS_CPU') {
      autoEnabled[0] = false;
      autoEnabled[1] = true;
      restartMatch(false);
    } else if (mode === 'TRAINING') {
      autoEnabled[0] = false;
      autoEnabled[1] = false;
      restartMatch(true);
    } else {
      autoEnabled[0] = false;
      autoEnabled[1] = false;
      restartMatch(false);
    }
    hud.setAutoBadges(autoEnabled[0], autoEnabled[1]);
  },
  onToggleAuto(slot) {
    audio.unlock();
    autoEnabled[slot] = !autoEnabled[slot];
    hud.setAutoBadges(autoEnabled[0], autoEnabled[1]);
  },
  onToggleHitboxes() {
    renderer.debug.setVisible(!renderer.debug.isVisible());
  },
  onToggleRetro() {
    renderer.setRetroMode(!renderer.isRetroMode());
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

hud.setAutoBadges(autoEnabled[0], autoEnabled[1]);

const input = new InputManager((code) => {
  audio.unlock();
  if (code === 'F1') {
    autoEnabled[0] = !autoEnabled[0];
    hud.setAutoBadges(autoEnabled[0], autoEnabled[1]);
  } else if (code === 'F2') {
    autoEnabled[1] = !autoEnabled[1];
    hud.setAutoBadges(autoEnabled[0], autoEnabled[1]);
  } else if (code === 'F3') {
    renderer.debug.setVisible(!renderer.debug.isVisible());
  } else if (code === 'Tab') {
    hud.toggleMoveList();
  }
});

window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
window.addEventListener('keydown', () => audio.unlock(), { once: true });

// Fixed 60 Hz simulation loop with accumulator + render interpolation
const DT = 1 / 60;
let acc = 0;
let lastTime = performance.now();

function frame(now: number): void {
  const dtReal = Math.min((now - lastTime) / 1000, 0.25);
  lastTime = now;
  acc += dtReal;

  const [camRx, camRz] = renderer.getCamRight();

  while (acc >= DT) {
    prevState = structuredClone(state);
    const in0: InputFrame = autoEnabled[0]
      ? stepAi(state, 0, aiMem[0], 'MEDIUM')
      : input.poll(0, state.fighters[0], camRx, camRz, touch.isVisible() ? touch : undefined);
    const in1: InputFrame = autoEnabled[1]
      ? stepAi(state, 1, aiMem[1], 'MEDIUM')
      : input.poll(1, state.fighters[1], camRx, camRz);

    step(state, [in0, in1]);

    // Trigger VFX, camera shake, and audio from sim events
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
      } else if (ev.type === 'BEAT_BONUS') {
        renderer.vfx.spawnBeatRing(ev.pos, 0xffd166);
      } else if (ev.type === 'KO') {
        renderer.vfx.spawnBurst(ev.pos, 0xff2a2a, 24, false);
        renderer.vfx.spawnDust(state.fighters[ev.slot].pos, 8);
        renderer.triggerShake(0.24);
      }
    }
    hud.update(state, state.events, renderer.debug.isVisible(), 1);
    acc -= DT;
  }

  renderer.draw(prevState, state, acc / DT, dtReal);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
