import { describe, expect, it } from 'vitest';
import { BTN_RK, BTN_STANCE, createMatchState, EMPTY_INPUT } from '../src/sim/state';
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
});
