// On-screen multi-touch virtual joystick + Capoeira action buttons for iPad / tablets.
import { BTN_LH, BTN_LK, BTN_RH, BTN_RK, BTN_STANCE } from '../sim/state';

export class TouchControls {
  readonly root: HTMLElement;
  private stickBase!: HTMLElement;
  private stickKnob!: HTMLElement;
  private stickPointerId: number | null = null;
  private stickOrigin = { x: 0, y: 0 };

  // Screen-space axes (-1..+1) and held button bitmask
  sx = 0;
  sy = 0;
  buttons = 0;

  private activeButtons = new Map<number, number>(); // pointerId -> button bit
  private visible = false;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'touch-controls';
    this.root.className = 'hidden';
    this.root.innerHTML = `
      <div class="touch-pad" id="touch-pad">
        <div class="stick-base" id="stick-base">
          <div class="stick-knob" id="stick-knob"></div>
        </div>
      </div>
      <div class="touch-btns">
        <button class="t-btn lh" data-bit="${BTN_LH}">LH<span>U</span></button>
        <button class="t-btn rh" data-bit="${BTN_RH}">RH<span>I</span></button>
        <button class="t-btn stance" data-bit="${BTN_STANCE}">STANCE<span>O</span></button>
        <button class="t-btn lk" data-bit="${BTN_LK}">LK<span>J</span></button>
        <button class="t-btn rk" data-bit="${BTN_RK}">RK<span>K</span></button>
      </div>
    `;
    container.appendChild(this.root);

    this.stickBase = this.root.querySelector('#stick-base')!;
    this.stickKnob = this.root.querySelector('#stick-knob')!;

    // Auto-enable on touch-capable devices (iPad / iPhone / Android)
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) this.setVisible(true);

    const pad = this.root.querySelector('#touch-pad')!;
    pad.addEventListener('pointerdown', (e) => {
      const pe = e as PointerEvent;
      pe.preventDefault();
      if (this.stickPointerId !== null) return;
      this.stickPointerId = pe.pointerId;
      const rect = this.stickBase.getBoundingClientRect();
      this.stickOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      (pad as HTMLElement).setPointerCapture(pe.pointerId);
      this.updateStick(pe.clientX, pe.clientY);
    });
    pad.addEventListener('pointermove', (e) => {
      const pe = e as PointerEvent;
      if (pe.pointerId !== this.stickPointerId) return;
      pe.preventDefault();
      this.updateStick(pe.clientX, pe.clientY);
    });
    const endStick = (e: Event) => {
      const pe = e as PointerEvent;
      if (pe.pointerId !== this.stickPointerId) return;
      this.stickPointerId = null;
      this.sx = 0;
      this.sy = 0;
      this.stickKnob.style.transform = 'translate(0px, 0px)';
    };
    pad.addEventListener('pointerup', endStick);
    pad.addEventListener('pointercancel', endStick);

    // Multi-touch action buttons
    this.root.querySelectorAll('.t-btn').forEach((btn) => {
      const bit = Number(btn.getAttribute('data-bit'));
      btn.addEventListener('pointerdown', (e) => {
        const pe = e as PointerEvent;
        pe.preventDefault();
        (btn as HTMLElement).setPointerCapture(pe.pointerId);
        this.activeButtons.set(pe.pointerId, bit);
        btn.classList.add('pressed');
        this.recomputeButtons();
      });
      const release = (e: Event) => {
        const pe = e as PointerEvent;
        if (this.activeButtons.delete(pe.pointerId)) {
          btn.classList.remove('pressed');
          this.recomputeButtons();
        }
      };
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
    });
  }

  private updateStick(cx: number, cy: number): void {
    const maxR = 46;
    const dx = cx - this.stickOrigin.x;
    const dy = cy - this.stickOrigin.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxR);
    const ang = Math.atan2(dy, dx);
    const kx = Math.cos(ang) * clamped;
    const ky = Math.sin(ang) * clamped;
    this.stickKnob.style.transform = `translate(${kx.toFixed(1)}px, ${ky.toFixed(1)}px)`;

    const dead = 14;
    this.sx = Math.abs(dx) > dead ? Math.sign(dx) : 0;
    this.sy = Math.abs(dy) > dead ? -Math.sign(dy) : 0; // screen up = +1
  }

  private recomputeButtons(): void {
    let mask = 0;
    for (const b of this.activeButtons.values()) mask |= b;
    this.buttons = mask;
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.root.classList.toggle('hidden', !v);
  }

  isVisible(): boolean {
    return this.visible;
  }
}
