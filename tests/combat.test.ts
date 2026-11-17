import { describe, expect, it } from 'vitest';
import { createAiMemory, stepAi } from '../src/ai/cpu';
import {
  BTN_LH,
  BTN_LK,
  BTN_RH,
  BTN_RK,
  BTN_STANCE,
  createMatchState,
  EMPTY_INPUT,
  setMatchToque,
} from '../src/sim/state';
import { step } from '../src/sim/step';

describe('Capoeira Combat & Stance Mechanics', () => {
  it('cycles stances GINGA -> HSP -> RLX -> GINGA via stance button', () => {
    const s = createMatchState({ trainingMode: true });
    expect(s.fighters[0].stance).toBe('GINGA');

    // Press stance with up (8) -> Aú into HSP (Bananeira)
    step(s, [{ dir: 8, buttons: BTN_STANCE }, EMPTY_INPUT]);
    for (let i = 0; i < 25; i++) step(s, [EMPTY_INPUT, EMPTY_INPUT]);
    expect(s.fighters[0].stance).toBe('HSP');

    // Press stance with down (2) -> RLX (Negativa)
    step(s, [{ dir: 2, buttons: BTN_STANCE }, EMPTY_INPUT]);
    for (let i = 0; i < 15; i++) step(s, [EMPTY_INPUT, EMPTY_INPUT]);
    expect(s.fighters[0].stance).toBe('RLX');

    // Press stance -> Rolê into GINGA
    step(s, [{ dir: 5, buttons: BTN_STANCE }, EMPTY_INPUT]);
    for (let i = 0; i < 28; i++) step(s, [EMPTY_INPUT, EMPTY_INPUT]);
    expect(s.fighters[0].stance).toBe('GINGA');
  });

  it('triggers Meia-Lua de Compasso on 236+RK motion input', () => {
    const s = createMatchState({ trainingMode: true });
    step(s, [{ dir: 2, buttons: 0 }, EMPTY_INPUT]);
    step(s, [{ dir: 3, buttons: 0 }, EMPTY_INPUT]);
    step(s, [{ dir: 6, buttons: 0 }, EMPTY_INPUT]);
    step(s, [{ dir: 6, buttons: BTN_RK }, EMPTY_INPUT]);
    expect(s.fighters[0].mode).toBe('ATTACK');
    expect(s.fighters[0].moveId).toBe('meia_lua_compasso');
  });

  it('Aú Batido launches a close opponent into JUGGLE state and deals damage', () => {
    const s = createMatchState({ trainingMode: true });
    // Place fighters close together
    s.fighters[0].pos = [-0.65, 0, 0];
    s.fighters[1].pos = [0.65, 0, 0];
    const startHp = s.fighters[1].health;

    step(s, [{ dir: 2, buttons: BTN_RK }, EMPTY_INPUT]);
    expect(s.fighters[0].moveId).toBe('au_batido');

    let juggled = false;
    for (let i = 0; i < 20; i++) {
      step(s, [EMPTY_INPUT, EMPTY_INPUT]);
      if (s.fighters[1].mode === 'JUGGLE') juggled = true;
    }
    expect(juggled).toBe(true);
    expect(s.fighters[1].health).toBeLessThan(startHp);
  });

  it('enforces 0.78m grounded pushbox separation while allowing tight throw entry', () => {
    const s = createMatchState({ trainingMode: true });
    s.fighters[0].pos = [-0.2, 0, 0];
    s.fighters[1].pos = [0.2, 0, 0];
    step(s, [EMPTY_INPUT, EMPTY_INPUT]);
    const groundedSep = Math.hypot(
      s.fighters[1].pos[0] - s.fighters[0].pos[0],
      s.fighters[1].pos[2] - s.fighters[0].pos[2],
    );
    expect(groundedSep).toBeGreaterThanOrEqual(0.859);

    // Active throw (Vingativa: LH+RH) permits tight clinch entry < 0.78m
    s.fighters[0].pos = [-0.25, 0, 0];
    s.fighters[1].pos = [0.25, 0, 0];
    step(s, [{ dir: 5, buttons: BTN_LH | BTN_RH }, EMPTY_INPUT]);
    expect(s.fighters[0].moveId).toBe('vingativa');
    const throwSep = Math.hypot(
      s.fighters[1].pos[0] - s.fighters[0].pos[0],
      s.fighters[1].pos[2] - s.fighters[0].pos[2],
    );
    expect(throwSep).toBeLessThan(0.7);
  });

  it('produces higher juggle apex under Lunar 0.165g than Earth 1.0g in Play Mode', () => {
    const peakApex = (gravityScale: number): number => {
      const s = createMatchState({ trainingMode: true, gravityScale });
      s.fighters[0].pos = [-0.65, 0, 0];
      s.fighters[1].pos = [0.65, 0, 0];
      step(s, [{ dir: 2, buttons: BTN_RK }, EMPTY_INPUT]);
      let maxY = 0;
      for (let i = 0; i < 180; i++) {
        step(s, [EMPTY_INPUT, EMPTY_INPUT]);
        maxY = Math.max(maxY, s.fighters[1].pos[1]);
      }
      return maxY;
    };

    expect(peakApex(0.165)).toBeGreaterThan(peakApex(1.0) * 1.4);
  });

  it('configures Berimbau Toques (angola, sao_bento, iuna) and clamps beatPhase cleanly on switch', () => {
    const s = createMatchState({ toque: 'angola' });
    expect(s.toque).toBe('angola');
    expect(s.bpm).toBe(88);
    expect(s.framesPerBeat).toBe(41);

    s.beatPhase = 38;
    setMatchToque(s, 'iuna');
    expect(s.toque).toBe('iuna');
    expect(s.bpm).toBe(124);
    expect(s.framesPerBeat).toBe(29);
    expect(s.beatPhase).toBeLessThan(29);
  });

  it('chains flowing Capoeira combos directly via CancelRules without dropping to IDLE', () => {
    const s = createMatchState({ trainingMode: true });
    step(s, [{ dir: 6, buttons: BTN_LK }, EMPTY_INPUT]); // Queixada
    expect(s.fighters[0].moveId).toBe('queixada');

    for (let i = 0; i < 12; i++) step(s, [EMPTY_INPUT, EMPTY_INPUT]);
    // Inside cancel window [12, 22], press RK -> smooth seamless transition straight into Armada!
    step(s, [{ dir: 5, buttons: BTN_RK }, EMPTY_INPUT]);
    expect(s.fighters[0].mode).toBe('ATTACK');
    expect(s.fighters[0].moveId).toBe('armada');
  });

  it('drives distinct CPU fight styles across Angola (Jacaré), Handstand (Morcego), and Regional (Faísca)', () => {
    const sampleStyle = (charId: string) => {
      const s = createMatchState({ p1Char: charId, p2Char: 'touro', trainingMode: false });
      const ai0 = createAiMemory(0x11223344);
      const ai1 = createAiMemory(0x55667788);
      let rlxFrames = 0;
      let hspFrames = 0;
      const moves = new Set<string>();
      for (let f = 0; f < 900; f++) {
        step(s, [stepAi(s, 0, ai0, 'HARD'), stepAi(s, 1, ai1, 'MEDIUM')]);
        if (s.fighters[0].stance === 'RLX') rlxFrames++;
        if (s.fighters[0].stance === 'HSP') hspFrames++;
        if (s.fighters[0].moveId) moves.add(s.fighters[0].moveId);
      }
      return { rlxFrames, hspFrames, moves };
    };

    const jacare = sampleStyle('jacare');
    const morcego = sampleStyle('morcego');
    const faisca = sampleStyle('faisca');

    expect(jacare.moves.size).toBeGreaterThanOrEqual(4);
    expect(morcego.moves.size).toBeGreaterThanOrEqual(4);
    expect(faisca.moves.size).toBeGreaterThanOrEqual(4);
    expect(jacare.rlxFrames + morcego.hspFrames).toBeGreaterThan(20);
  });
});
