// Keyboard + Gamepad input manager with camera-relative -> facing-relative numpad conversion.
import {
  BTN_LH,
  BTN_LK,
  BTN_RH,
  BTN_RK,
  BTN_STANCE,
  BTN_TAG,
  type FighterState,
  type InputFrame,
} from '../sim/state';

export interface KeyBinding {
  up: string;
  down: string;
  left: string;
  right: string;
  lh: string;
  rh: string;
  lk: string;
  rk: string;
  stance: string;
  tag: string;
}

export const P1_KEYS: KeyBinding = {
  up: 'KeyW',
  down: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  lh: 'KeyU',
  rh: 'KeyI',
  lk: 'KeyJ',
  rk: 'KeyK',
  stance: 'KeyO',
  tag: 'KeyL',
};

export const P2_KEYS: KeyBinding = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  lh: 'Numpad4',
  rh: 'Numpad5',
  lk: 'Numpad1',
  rk: 'Numpad2',
  stance: 'Numpad6',
  tag: 'Numpad3',
};

export class InputManager {
  private down = new Set<string>();
  private onToggleCallback?: (code: string) => void;

  constructor(onToggle?: (code: string) => void) {
    this.onToggleCallback = onToggle;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    this.down.add(e.code);
    if (
      e.code === 'F1' ||
      e.code === 'F2' ||
      e.code === 'F3' ||
      e.code === 'Escape' ||
      e.code === 'Tab'
    ) {
      e.preventDefault();
      this.onToggleCallback?.(e.code);
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code);
  };

  private handleBlur = (): void => {
    this.down.clear();
  };

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
  }

  /**
   * Poll input for a player slot, converting screen-space right/left/up/down
   * into facing-relative numpad direction (6 = forward, 4 = back, 8 = sidestep up, 2 = down/crouch).
   */
  poll(
    slot: 0 | 1,
    fighter: FighterState,
    camRightX: number,
    camRightZ: number,
    touch?: { sx: number; sy: number; buttons: number },
  ): InputFrame {
    const bind = slot === 0 ? P1_KEYS : P2_KEYS;
    let sx = 0; // screen right (+1) / left (-1)
    let sy = 0; // screen up (+1) / down (-1)
    let buttons = 0;

    if (this.down.has(bind.right)) sx += 1;
    if (this.down.has(bind.left)) sx -= 1;
    if (this.down.has(bind.up)) sy += 1;
    if (this.down.has(bind.down)) sy -= 1;

    if (this.down.has(bind.lh)) buttons |= BTN_LH;
    if (this.down.has(bind.rh)) buttons |= BTN_RH;
    if (this.down.has(bind.lk)) buttons |= BTN_LK;
    if (this.down.has(bind.rk)) buttons |= BTN_RK;
    if (this.down.has(bind.stance)) buttons |= BTN_STANCE;
    if (this.down.has(bind.tag)) buttons |= BTN_TAG;

    if (slot === 0 && touch) {
      if (touch.sx !== 0) sx = touch.sx;
      if (touch.sy !== 0) sy = touch.sy;
      buttons |= touch.buttons;
    }

    // Gamepad support (gamepad index = slot)
    const pads = navigator.getGamepads?.() ?? [];
    const gp = pads[slot];
    if (gp) {
      const ax = gp.axes[0] ?? 0;
      const ay = gp.axes[1] ?? 0;
      if (ax > 0.35 || gp.buttons[15]?.pressed) sx = 1;
      else if (ax < -0.35 || gp.buttons[14]?.pressed) sx = -1;
      if (ay < -0.35 || gp.buttons[12]?.pressed) sy = 1;
      else if (ay > 0.35 || gp.buttons[13]?.pressed) sy = -1;

      if (gp.buttons[2]?.pressed) buttons |= BTN_LH; // X / Square
      if (gp.buttons[3]?.pressed) buttons |= BTN_RH; // Y / Triangle
      if (gp.buttons[0]?.pressed) buttons |= BTN_LK; // A / Cross
      if (gp.buttons[1]?.pressed) buttons |= BTN_RK; // B / Circle
      if (gp.buttons[4]?.pressed) buttons |= BTN_STANCE; // LB
      if (gp.buttons[5]?.pressed) buttons |= BTN_TAG; // RB
    }

    // Project screen right onto fighter's facing vector so "forward" is always 6
    const dot = sx * (fighter.facing[0] * camRightX + fighter.facing[1] * camRightZ);
    const fwd = dot > 0.25 ? 1 : dot < -0.25 ? -1 : 0;

    // Numpad mapping: 5=neutral, 6=fwd, 4=back, 8=up, 2=down
    const dir = 5 + fwd + sy * 3;
    return { dir, buttons };
  }
}
