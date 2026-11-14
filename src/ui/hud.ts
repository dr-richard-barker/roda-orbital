// DOM Fighting Game HUD, Move List overlay, and Mode/Autopilot/Costume controls.
import { charById, type CostumeId } from '../data/characters';
import { MOVES } from '../data/moves';
import type { MatchState, SimEvent } from '../sim/state';

export interface HudCallbacks {
  onModeChange: (mode: 'VS_CPU' | 'TRAINING' | 'VS_2P') => void;
  onToggleAuto: (slot: 0 | 1) => void;
  onToggleHitboxes: () => void;
  onToggleRetro: () => void;
  onToggleCostume: (slot: 0 | 1) => void;
  onToggleTouch: () => void;
  onToggleMute: () => void;
  onResetMatch: () => void;
}

export class GameHud {
  private root: HTMLElement;
  private hp0!: HTMLElement;
  private hp1!: HTMLElement;
  private hpTrail0!: HTMLElement;
  private hpTrail1!: HTMLElement;
  private trailPct: [number, number] = [100, 100];
  private mal0!: HTMLElement;
  private mal1!: HTMLElement;
  private stance0!: HTMLElement;
  private stance1!: HTMLElement;
  private auto0!: HTMLElement;
  private auto1!: HTMLElement;
  private wins0!: HTMLElement;
  private wins1!: HTMLElement;
  private timerEl!: HTMLElement;
  private beatRing!: HTMLElement;
  private bannerEl!: HTMLElement;
  private combo0!: HTMLElement;
  private combo1!: HTMLElement;
  private frameInfo!: HTMLElement;
  private moveModal!: HTMLElement;
  private bannerTimer = 0;

  constructor(container: HTMLElement, cb: HudCallbacks) {
    this.root = document.createElement('div');
    this.root.id = 'hud-root';
    this.root.innerHTML = `
      <div class="hud-top">
        <div class="fighter-hud left">
          <div class="hud-name-row">
            <span class="name" id="name-0">FAÍSCA</span>
            <span class="stance-pill" id="stance-0">GINGA</span>
            <span class="auto-badge hidden" id="auto-0">🤖 AUTO</span>
            <span class="pips" id="wins-0"></span>
          </div>
          <div class="hp-track">
            <div class="hp-trail p1" id="hp-trail-0"></div>
            <div class="hp-fill p1" id="hp-0"></div>
          </div>
          <div class="mal-track"><div class="mal-fill" id="mal-0"></div></div>
          <div class="combo-callout" id="combo-0"></div>
        </div>

        <div class="hud-center">
          <div class="ko-emblem">K.O.</div>
          <div class="beat-ring" id="beat-ring">
            <span class="timer" id="timer">99</span>
          </div>
          <div class="round-label" id="round-label">RODA 1</div>
        </div>

        <div class="fighter-hud right">
          <div class="hud-name-row">
            <span class="pips" id="wins-1"></span>
            <span class="auto-badge" id="auto-1">🤖 CPU</span>
            <span class="stance-pill" id="stance-1">GINGA</span>
            <span class="name" id="name-1">FAÍSCA</span>
          </div>
          <div class="hp-track">
            <div class="hp-trail p2" id="hp-trail-1"></div>
            <div class="hp-fill p2" id="hp-1"></div>
          </div>
          <div class="mal-track"><div class="mal-fill" id="mal-1"></div></div>
          <div class="combo-callout" id="combo-1"></div>
        </div>
      </div>

      <div class="center-banner hidden" id="center-banner">GINGA!</div>
      <div class="frame-bar hidden" id="frame-info"></div>

      <div class="hud-toolbar">
        <button data-act="vs-cpu" class="active">1P vs CPU</button>
        <button data-act="training">Training</button>
        <button data-act="vs-2p">Local 2P</button>
        <span class="sep"></span>
        <button data-act="auto-0" title="Toggle AI control for P1 (F1)">P1 Auto [F1]</button>
        <button data-act="auto-1" title="Toggle AI control for P2 (F2)">P2 Auto [F2]</button>
        <button data-act="maculele-0" title="Toggle P1 Maculelê Machete Outfit">P1 Maculelê ⚔️</button>
        <button data-act="hitboxes" title="Toggle Hitbox/Hurtbox View (F3)">Hitboxes [F3]</button>
        <button data-act="retro" title="Toggle Retro SF2 CRT/Pixel Mode">📺 Retro CRT</button>
        <button data-act="touch" title="Toggle iPad/Touch On-Screen Controls">📱 Touch</button>
        <button data-act="moves" title="Move List (Tab)">Moves [Tab]</button>
        <button data-act="mute">🔊 Audio</button>
        <button data-act="reset">↻ Restart</button>
      </div>

      <div class="move-modal hidden" id="move-modal">
        <div class="move-card">
          <div class="move-head">
            <h2>RODA ORBITAL — CAPOEIRA COMMAND LIST</h2>
            <button id="close-moves">✕</button>
          </div>
          <p class="controls-summary">
            <b>Move / Sidestep:</b> WASD &nbsp;|&nbsp;
            <b>Hands:</b> U (LH), I (RH) &nbsp;|&nbsp;
            <b>Kicks:</b> J (LK), K (RK) &nbsp;|&nbsp;
            <b>Stance Shift:</b> O (2+O = Negativa, 8+O = Bananeira) &nbsp;|&nbsp;
            <b>Throw:</b> U+I &nbsp;|&nbsp;
            <b>Rhythm Sync:</b> Shift on the pulsing center ring for -2f startup + Malícia!
          </p>
          <div class="move-grid" id="move-grid"></div>
        </div>
      </div>
    `;
    container.appendChild(this.root);

    this.hp0 = this.root.querySelector('#hp-0')!;
    this.hp1 = this.root.querySelector('#hp-1')!;
    this.hpTrail0 = this.root.querySelector('#hp-trail-0')!;
    this.hpTrail1 = this.root.querySelector('#hp-trail-1')!;
    this.mal0 = this.root.querySelector('#mal-0')!;
    this.mal1 = this.root.querySelector('#mal-1')!;
    this.stance0 = this.root.querySelector('#stance-0')!;
    this.stance1 = this.root.querySelector('#stance-1')!;
    this.auto0 = this.root.querySelector('#auto-0')!;
    this.auto1 = this.root.querySelector('#auto-1')!;
    this.wins0 = this.root.querySelector('#wins-0')!;
    this.wins1 = this.root.querySelector('#wins-1')!;
    this.timerEl = this.root.querySelector('#timer')!;
    this.beatRing = this.root.querySelector('#beat-ring')!;
    this.bannerEl = this.root.querySelector('#center-banner')!;
    this.combo0 = this.root.querySelector('#combo-0')!;
    this.combo1 = this.root.querySelector('#combo-1')!;
    this.frameInfo = this.root.querySelector('#frame-info')!;
    this.moveModal = this.root.querySelector('#move-modal')!;

    // Populate move list
    const grid = this.root.querySelector('#move-grid')!;
    grid.innerHTML = MOVES.map((m) => {
      const firstHit = m.hits[0];
      const startup = firstHit ? `${firstHit.frames[0]}f` : '—';
      const lvl = firstHit ? firstHit.level : 'STANCE';
      const dmg = m.hits.reduce((a, b) => a + b.damage, 0);
      return `<div class="move-row">
        <span class="m-name">${m.name}</span>
        <span class="m-from">${m.from.join('/')}</span>
        <span class="m-in">${m.input}</span>
        <span class="m-meta">${lvl} · ${startup} · ${dmg > 0 ? `${dmg} dmg` : m.endStance}</span>
      </div>`;
    }).join('');

    this.root.querySelector('#close-moves')!.addEventListener('click', () => this.toggleMoveList());

    const setModeActive = (btn: Element) => {
      this.root.querySelectorAll('[data-act="vs-cpu"],[data-act="training"],[data-act="vs-2p"]').forEach((b) =>
        b.classList.remove('active'),
      );
      btn.classList.add('active');
    };

    this.root.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('button[data-act]');
      if (!btn) return;
      const act = btn.getAttribute('data-act');
      if (act === 'vs-cpu') { setModeActive(btn); cb.onModeChange('VS_CPU'); }
      else if (act === 'training') { setModeActive(btn); cb.onModeChange('TRAINING'); }
      else if (act === 'vs-2p') { setModeActive(btn); cb.onModeChange('VS_2P'); }
      else if (act === 'auto-0') cb.onToggleAuto(0);
      else if (act === 'auto-1') cb.onToggleAuto(1);
      else if (act === 'maculele-0') cb.onToggleCostume(0);
      else if (act === 'hitboxes') { btn.classList.toggle('active'); cb.onToggleHitboxes(); }
      else if (act === 'retro') { btn.classList.toggle('active'); cb.onToggleRetro(); }
      else if (act === 'touch') { btn.classList.toggle('active'); cb.onToggleTouch(); }
      else if (act === 'moves') this.toggleMoveList();
      else if (act === 'mute') cb.onToggleMute();
      else if (act === 'reset') cb.onResetMatch();
    });
  }

  toggleMoveList(): void {
    this.moveModal.classList.toggle('hidden');
  }

  setMuteLabel(muted: boolean): void {
    const b = this.root.querySelector('[data-act="mute"]')!;
    b.textContent = muted ? '🔇 Muted' : '🔊 Audio';
  }

  setAutoBadges(a0: boolean, a1: boolean): void {
    this.auto0.classList.toggle('hidden', !a0);
    this.auto1.classList.toggle('hidden', !a1);
    this.root.querySelector('[data-act="auto-0"]')?.classList.toggle('active', a0);
    this.root.querySelector('[data-act="auto-1"]')?.classList.toggle('active', a1);
  }

  setCostumeActive(slot: 0 | 1, costume: CostumeId): void {
    if (slot === 0) {
      this.root.querySelector('[data-act="maculele-0"]')?.classList.toggle('active', costume === 'maculele');
    }
  }

  showBanner(text: string, frames = 55): void {
    this.bannerEl.textContent = text;
    this.bannerEl.classList.remove('hidden');
    this.bannerTimer = frames;
  }

  update(state: MatchState, events: SimEvent[], showFrameInfo: boolean, dtFrames = 1): void {
    const [f0, f1] = state.fighters;
    const p0 = Math.max(0, (f0.health / f0.maxHealth) * 100);
    const p1 = Math.max(0, (f1.health / f1.maxHealth) * 100);
    this.hp0.style.width = `${p0}%`;
    this.hp1.style.width = `${p1}%`;
    // SF2 delayed crimson damage trail
    this.trailPct[0] = p0 > this.trailPct[0] ? p0 : Math.max(p0, this.trailPct[0] - 0.55 * dtFrames);
    this.trailPct[1] = p1 > this.trailPct[1] ? p1 : Math.max(p1, this.trailPct[1] - 0.55 * dtFrames);
    this.hpTrail0.style.width = `${this.trailPct[0]}%`;
    this.hpTrail1.style.width = `${this.trailPct[1]}%`;

    this.mal0.style.width = `${f0.malicia}%`;
    this.mal1.style.width = `${f1.malicia}%`;

    this.stance0.textContent = f0.stance;
    this.stance1.textContent = f1.stance;
    this.root.querySelector('#name-0')!.textContent = charById(f0.charId).name.toUpperCase();
    this.root.querySelector('#name-1')!.textContent = charById(f1.charId).name.toUpperCase();

    this.wins0.textContent = '★'.repeat(state.wins[0]) + '☆'.repeat(Math.max(0, 2 - state.wins[0]));
    this.wins1.textContent = '★'.repeat(state.wins[1]) + '☆'.repeat(Math.max(0, 2 - state.wins[1]));

    this.timerEl.textContent = state.config.trainingMode
      ? '∞'
      : String(Math.ceil(state.roundTimerFrames / 60)).padStart(2, '0');
    this.root.querySelector('#round-label')!.textContent = state.config.trainingMode
      ? 'TRAINING'
      : `RODA ${state.round}`;

    // Pulsing berimbau ring
    const beatDist = Math.min(state.beatPhase, state.framesPerBeat - state.beatPhase);
    const onBeat = beatDist <= 4;
    const pulse = 1 + (1 - state.beatPhase / state.framesPerBeat) * 0.14;
    this.beatRing.style.transform = `scale(${pulse.toFixed(3)})`;
    this.beatRing.classList.toggle('on-beat', onBeat);

    // Combo callouts (shown on the attacker's side, reading defender's comboCount)
    this.combo0.textContent = f1.comboCount >= 2 ? `${f1.comboCount} HIT COMBO! (${f1.comboDamage})` : '';
    this.combo1.textContent = f0.comboCount >= 2 ? `${f0.comboCount} HIT COMBO! (${f0.comboDamage})` : '';

    // Event banners
    for (const ev of events) {
      if (ev.type === 'ROUND_START') this.showBanner(`RODA ${state.round} — JOGA!`, 50);
      else if (ev.type === 'KO') this.showBanner('K.O.!', 85);
      else if (ev.type === 'COUNTER') this.showBanner('COUNTER HIT!', 35);
      else if (ev.type === 'BEAT_BONUS') this.showBanner(`⚡ AXÉ SYNC! (${ev.label ?? ''})`, 32);
    }

    if (state.roundPhase === 'MATCH_OVER') {
      const wName = charById(state.fighters[state.winner === 1 ? 1 : 0].charId).name.toUpperCase();
      this.showBanner(`${wName} WINS THE RODA!`, 120);
    }

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dtFrames;
      if (this.bannerTimer <= 0) this.bannerEl.classList.add('hidden');
    }

    // Frame data bar
    this.frameInfo.classList.toggle('hidden', !showFrameInfo && !state.config.trainingMode);
    if (showFrameInfo || state.config.trainingMode) {
      const adv = f0.lastFrameAdv;
      const advStr = adv > 0 ? `+${adv}f` : `${adv}f`;
      this.frameInfo.textContent =
        `P1 ${f0.stance} | ${f0.mode}${f0.moveId ? ` (${f0.moveId} f${f0.moveFrame})` : ''} | ` +
        `Last Adv: ${advStr} | P2 ${f1.stance} (${f1.mode}) | Sim Frame: ${state.frame}`;
    }
  }
}
