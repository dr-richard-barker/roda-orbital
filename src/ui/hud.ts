// DOM Fighting Game HUD, Move List overlay, and Collapsible Customize Drawer.
import { charById, COSTUME_LIST, ROSTER, type CostumeId } from '../data/characters';
import { characterProfile } from '../data/fightingStyles';
import { MOVE_BY_ID, MOVES, type MoveCategory } from '../data/moves';
import {
  FILTER_PRESETS,
  STYLE_PRESETS,
  type VisualFilterId,
  type VisualStyleId,
} from '../render/presets';
import {
  TOQUE_PRESETS,
  toquePreset,
  type MatchState,
  type PlayMode,
  type SimEvent,
  type ToqueId,
} from '../sim/state';

export type HudMode = 'VS_CPU' | 'TRAINING' | 'VS_2P' | 'SHOW';

export interface HudCallbacks {
  onModeChange: (mode: HudMode) => void;
  onSelectFighter: (slot: 0 | 1, charId: string) => void;
  onSelectPalette: (slot: 0 | 1, paletteIdx: number) => void;
  onSelectCostume: (slot: 0 | 1, costume: CostumeId) => void;
  onSelectGravity: (gravityScale: number) => void;
  onSelectToque: (toque: ToqueId) => void;
  onSelectStyle: (style: VisualStyleId) => void;
  onSelectFilter: (filter: VisualFilterId) => void;
  onTryMove: (moveId: string) => void;
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
  private style0!: HTMLElement;
  private style1!: HTMLElement;
  private p1StyleNote!: HTMLElement;
  private p2StyleNote!: HTMLElement;
  private sigCombosEl!: HTMLElement;
  private lastSigCharId = '';
  private auto0!: HTMLElement;
  private auto1!: HTMLElement;
  private wins0!: HTMLElement;
  private wins1!: HTMLElement;
  private timerEl!: HTMLElement;
  private beatRing!: HTMLElement;
  private beatVignette!: HTMLElement;
  private beatPips!: NodeListOf<Element>;
  private koEmblem!: HTMLElement;
  private roundLabel!: HTMLElement;
  private showPhraseEl!: HTMLElement;
  private bannerEl!: HTMLElement;
  private combo0!: HTMLElement;
  private combo1!: HTMLElement;
  private frameInfo!: HTMLElement;
  private moveModal!: HTMLElement;
  private customizeDrawer!: HTMLElement;
  private customizeBtn!: HTMLButtonElement;
  private customizeBadge!: HTMLElement;
  private currentGravity = 1.0;
  private currentToque: ToqueId = 'sao_bento';
  private bannerTimer = 0;

  constructor(container: HTMLElement, cb: HudCallbacks) {
    this.root = document.createElement('div');
    this.root.id = 'hud-root';
    this.root.innerHTML = `
      <div class="beat-vignette" id="beat-vignette"></div>

      <div class="hud-top">
        <div class="fighter-hud left">
          <div class="hud-name-row">
            <span class="name" id="name-0">FAÍSCA</span>
            <span class="style-pill" id="style-0" data-style="REGIONAL">REGIONAL</span>
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
          <div class="beat-pips" id="beat-pips" aria-label="4-beat Berimbau rhythm bar">
            <span class="bp"></span><span class="bp"></span><span class="bp"></span><span class="bp"></span>
          </div>
          <div class="round-label" id="round-label">RODA 1</div>
        </div>

        <div class="fighter-hud right">
          <div class="hud-name-row">
            <span class="pips" id="wins-1"></span>
            <span class="auto-badge" id="auto-1">🤖 CPU</span>
            <span class="stance-pill" id="stance-1">GINGA</span>
            <span class="style-pill" id="style-1" data-style="REGIONAL">REGIONAL</span>
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
      <div class="show-phrase hidden" id="show-phrase"></div>
      <div class="frame-bar hidden" id="frame-info"></div>

      <div class="customize-drawer hidden" id="customize-drawer" role="region" aria-label="Matchup, Gravity, Stage, and Toque Customization">
        <div class="drawer-head">
          <span>MATCHUP, WORLD GRAVITY, STAGE &amp; TOQUE</span>
          <button type="button" class="drawer-close" data-act="close-customize" aria-label="Close customize drawer">✕</button>
        </div>

        <div class="drawer-grid">
          <div class="drawer-group">
            <span class="drawer-label">P1</span>
            <select class="hud-select" id="p1-char-select" aria-label="P1 Fighter">${ROSTER.map(
              (c) => `<option value="${c.id}">P1: ${c.name} (${c.style.slice(0, 3)})</option>`,
            ).join('')}</select>
            <select class="hud-select" id="p1-pal-select" aria-label="P1 Color Palette">
              <option value="0">P1 Color 1</option>
              <option value="1">P1 Color 2</option>
              <option value="2">P1 Color 3</option>
            </select>
            <select class="hud-select" id="p1-skin-select" aria-label="P1 Skin">${COSTUME_LIST.map(
              (c) => `<option value="${c.id}">Skin: ${c.label}</option>`,
            ).join('')}</select>
            <button data-act="auto-0" title="Toggle AI control for P1 (F1)">P1 AI</button>
            <button data-act="maculele-0" title="Toggle P1 Maculelê Machete Outfit">⚔️ P1 Maculelê</button>
            <div class="drawer-note" id="p1-style-note"></div>
          </div>

          <div class="drawer-group">
            <span class="drawer-label">P2 / Partner</span>
            <select class="hud-select" id="p2-char-select" aria-label="P2 Partner Fighter">${ROSTER.map(
              (c) => `<option value="${c.id}">P2: ${c.name} (${c.style.slice(0, 3)})</option>`,
            ).join('')}</select>
            <select class="hud-select" id="p2-pal-select" aria-label="P2 Partner Color Palette">
              <option value="0">P2 Color 1</option>
              <option value="1" selected>P2 Color 2</option>
              <option value="2">P2 Color 3</option>
            </select>
            <select class="hud-select" id="p2-skin-select" aria-label="P2 Partner Skin">${COSTUME_LIST.map(
              (c) => `<option value="${c.id}">Skin: ${c.label}</option>`,
            ).join('')}</select>
            <button data-act="auto-1" title="Toggle AI control for P2 (F2)">P2 AI</button>
            <button data-act="maculele-1" title="Toggle P2 Maculelê Machete Outfit">⚔️ P2 Maculelê</button>
            <div class="drawer-note" id="p2-style-note"></div>
          </div>

          <div class="drawer-group">
            <span class="drawer-label">World &amp; Style</span>
            <select class="hud-select" id="gravity-select" aria-label="World Gravity">
              <option value="1.0">Gravity: Earth (1.0g)</option>
              <option value="0.38">Gravity: Mars (0.38g)</option>
              <option value="0.165">Gravity: Lunar (0.165g)</option>
            </select>
            <select class="hud-select" id="stage-style-select" aria-label="Stage Style">${STYLE_PRESETS.map(
              (s) => `<option value="${s.id}">Stage: ${s.label}</option>`,
            ).join('')}</select>
            <select class="hud-select" id="post-filter-select" aria-label="Visual Filter">${FILTER_PRESETS.map(
              (f) => `<option value="${f.id}">FX: ${f.label}</option>`,
            ).join('')}</select>
            <select class="hud-select" id="toque-select" aria-label="Berimbau Toque Rhythm">${TOQUE_PRESETS.map(
              (t) => `<option value="${t.id}"${t.id === 'sao_bento' ? ' selected' : ''}>Toque: ${t.label}</option>`,
            ).join('')}</select>
          </div>

          <div class="drawer-group">
            <span class="drawer-label">Assists &amp; Guides</span>
            <button data-act="hitboxes" title="Toggle Hitbox/Hurtbox View (F3)">Hitboxes</button>
            <button data-act="retro" title="Toggle Retro SF2 CRT Mode">📺 CRT</button>
            <button data-act="touch" title="Toggle iPad/Touch On-Screen Controls">📱 Touch</button>
            <a class="hud-link" href="./moves.html" title="Open 3D Move Showcase &amp; Mudroljub / Minhoquinho Comparison">📖 Showcase</a>
            <a class="hud-link" href="./making.html" title="Play Each Game Iteration &amp; Browse All 116 Capoeira Moves">🛠 Story &amp; Moves</a>
            <a class="hud-link" href="./tutorial.html" title="Read Controls, Modes &amp; Capoeira Play Tutorial">❓ Guide</a>
            <a class="hud-link" href="./history.html" title="Read the History &amp; Music of Capoeira">📜 History</a>
          </div>
        </div>
      </div>

      <div class="hud-toolbar">
        <button data-act="vs-cpu" class="active">vs CPU</button>
        <button data-act="show" title="Supportive Play / Show Duet (Synchronized Capoeira Dialogue)">🤝 Show</button>
        <button data-act="training">Training</button>
        <button data-act="vs-2p">2P</button>
        <span class="sep"></span>
        <button data-act="moves" title="Move List (Tab)">Moves (${MOVES.length})</button>
        <button data-act="customize" id="customize-btn" title="Customize Fighters, Lunar Gravity, Stage, Filters &amp; Toque">
          ⚙ Customize <span class="cust-badge" id="customize-badge">1.0g</span>
        </button>
        <button data-act="mute">🔊 Audio</button>
        <button data-act="reset">↻ Reset</button>
      </div>

      <div class="move-modal hidden" id="move-modal">
        <div class="move-card">
          <div class="move-head">
            <h2>RODA ORBITAL — CAPOEIRA COMMAND LIST (${MOVES.length} MOVES)</h2>
            <button id="close-moves">✕</button>
          </div>
          <p class="controls-summary">
            <b>Move / Sidestep:</b> WASD &nbsp;|&nbsp;
            <b>Hands:</b> U (LH), I (RH) &nbsp;|&nbsp;
            <b>Kicks:</b> J (LK), K (RK) &nbsp;|&nbsp;
            <b>Stance Shift:</b> O (2+O = Negativa, 8+O = Bananeira) &nbsp;|&nbsp;
            <b>Throw:</b> U+I &nbsp;|&nbsp;
            <b>Rhythm Sync:</b> Shift on the pulsing beat bar for -2f startup + Malícia!
          </p>
          <div class="move-filters">
            <div class="move-search-wrap">
              <input id="move-search" type="search" placeholder="Search move (e.g. Compasso, Macaco, Rasteira, Mortal)..." aria-label="Search moves" />
              <button id="move-search-clear" class="move-search-clear hidden" type="button" aria-label="Clear move search">×</button>
            </div>
            <div class="move-chips" id="move-chips"></div>
          </div>
          <div class="sig-combos-bar" id="sig-combos-bar"></div>
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
    this.style0 = this.root.querySelector('#style-0')!;
    this.style1 = this.root.querySelector('#style-1')!;
    this.p1StyleNote = this.root.querySelector('#p1-style-note')!;
    this.p2StyleNote = this.root.querySelector('#p2-style-note')!;
    this.sigCombosEl = this.root.querySelector('#sig-combos-bar')!;
    this.auto0 = this.root.querySelector('#auto-0')!;
    this.auto1 = this.root.querySelector('#auto-1')!;
    this.wins0 = this.root.querySelector('#wins-0')!;
    this.wins1 = this.root.querySelector('#wins-1')!;
    this.timerEl = this.root.querySelector('#timer')!;
    this.beatRing = this.root.querySelector('#beat-ring')!;
    this.beatVignette = this.root.querySelector('#beat-vignette')!;
    this.beatPips = this.root.querySelectorAll('#beat-pips .bp');
    this.koEmblem = this.root.querySelector('.ko-emblem')!;
    this.roundLabel = this.root.querySelector('#round-label')!;
    this.showPhraseEl = this.root.querySelector('#show-phrase')!;
    this.bannerEl = this.root.querySelector('#center-banner')!;
    this.combo0 = this.root.querySelector('#combo-0')!;
    this.combo1 = this.root.querySelector('#combo-1')!;
    this.frameInfo = this.root.querySelector('#frame-info')!;
    this.moveModal = this.root.querySelector('#move-modal')!;
    this.customizeDrawer = this.root.querySelector('#customize-drawer')!;
    this.customizeBtn = this.root.querySelector('#customize-btn')!;
    this.customizeBadge = this.root.querySelector('#customize-badge')!;

    // Populate move list with category tabs + live Search + Clear + Cancel Chains + Try button
    const grid = this.root.querySelector('#move-grid')!;
    const searchEl = this.root.querySelector<HTMLInputElement>('#move-search')!;
    const clearSearchBtn = this.root.querySelector<HTMLButtonElement>('#move-search-clear')!;
    const chipsEl = this.root.querySelector('#move-chips')!;
    const categories: ('All' | MoveCategory)[] = [
      'All',
      'Base & Stances',
      'Cartwheels',
      'Kicks',
      'Evasions & Floor',
      'Sweeps & Takedowns',
      'Acrobatics',
    ];
    let activeCat: 'All' | MoveCategory = 'All';

    const renderMoves = () => {
      const q = searchEl.value.trim().toLowerCase();
      clearSearchBtn.classList.toggle('hidden', q.length === 0);
      const filtered = MOVES.filter((m) => {
        if (activeCat !== 'All' && m.category !== activeCat) return false;
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          (m.english ?? '').toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.input.toLowerCase().includes(q)
        );
      });
      grid.innerHTML = filtered
        .map((m) => {
          const firstHit = m.hits[0];
          const frameInfo = firstHit
            ? `St ${firstHit.frames[0]}f · Act ${firstHit.frames[0]}–${firstHit.frames[1]} · Tot ${m.totalFrames}f`
            : `Stance · Tot ${m.totalFrames}f`;
          const lvl = firstHit ? firstHit.level : 'STANCE';
          const dmg = m.hits.reduce((a, b) => a + b.damage, 0);
          const chainHtml =
            m.cancels.length > 0
              ? `<div class="m-chains">${m.cancels
                  .map((c) => {
                    const target = MOVE_BY_ID[c.into]?.name ?? c.into;
                    const cond = c.on === 'HIT' ? ' [hit]' : '';
                    const beat = c.beatBonus ? ` +${c.beatBonus}f` : '';
                    return `<span class="m-chain-chip">→ ${target} <b>${c.input}</b>${cond}${beat}</span>`;
                  })
                  .join('')}</div>`
              : '';
          return `<div class="move-row">
            <div class="m-head">
              <span class="m-name">${m.name}</span>
              <span class="m-from">${m.from.join('/')}</span>
              <span class="m-in">${m.input}</span>
              <span class="m-meta">${lvl} · ${frameInfo} · ${dmg > 0 ? `${dmg} dmg` : m.endStance}</span>
              <button class="m-try" type="button" data-try-move="${m.id}">▶ Try</button>
            </div>
            ${chainHtml}
          </div>`;
        })
        .join('');
    };

    chipsEl.innerHTML = categories
      .map((c) => `<button type="button" class="move-chip${c === 'All' ? ' active' : ''}" data-cat="${c}">${c}</button>`)
      .join('');

    chipsEl.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-cat]');
      if (!btn) return;
      activeCat = btn.dataset.cat as 'All' | MoveCategory;
      chipsEl.querySelectorAll('.move-chip').forEach((b) => b.classList.toggle('active', b === btn));
      renderMoves();
    });
    searchEl.addEventListener('input', renderMoves);
    clearSearchBtn.addEventListener('click', () => {
      searchEl.value = '';
      renderMoves();
      searchEl.focus();
    });
    grid.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-try-move]');
      if (!btn) return;
      const moveId = btn.dataset.tryMove;
      if (moveId) {
        this.toggleMoveList();
        cb.onTryMove(moveId);
      }
    });
    renderMoves();

    // P1 & P2 / Partner matchup selectors
    this.root.querySelector<HTMLSelectElement>('#p1-char-select')!.addEventListener('change', (e) => {
      cb.onSelectFighter(0, (e.target as HTMLSelectElement).value);
    });
    this.root.querySelector<HTMLSelectElement>('#p1-pal-select')!.addEventListener('change', (e) => {
      cb.onSelectPalette(0, Number((e.target as HTMLSelectElement).value));
    });
    this.root.querySelector<HTMLSelectElement>('#p1-skin-select')!.addEventListener('change', (e) => {
      const next = (e.target as HTMLSelectElement).value as CostumeId;
      cb.onSelectCostume(0, next);
      this.setCostumeActive(0, next);
    });

    this.root.querySelector<HTMLSelectElement>('#p2-char-select')!.addEventListener('change', (e) => {
      cb.onSelectFighter(1, (e.target as HTMLSelectElement).value);
    });
    this.root.querySelector<HTMLSelectElement>('#p2-pal-select')!.addEventListener('change', (e) => {
      cb.onSelectPalette(1, Number((e.target as HTMLSelectElement).value));
    });
    this.root.querySelector<HTMLSelectElement>('#p2-skin-select')!.addEventListener('change', (e) => {
      const next = (e.target as HTMLSelectElement).value as CostumeId;
      cb.onSelectCostume(1, next);
      this.setCostumeActive(1, next);
    });

    // World Gravity, Stage Style, Filter & Berimbau Toque selectors
    this.root.querySelector<HTMLSelectElement>('#gravity-select')!.addEventListener('change', (e) => {
      const g = Number((e.target as HTMLSelectElement).value);
      cb.onSelectGravity(g);
      this.setGravityActive(g);
    });
    this.root.querySelector<HTMLSelectElement>('#stage-style-select')!.addEventListener('change', (e) => {
      cb.onSelectStyle((e.target as HTMLSelectElement).value as VisualStyleId);
    });
    this.root.querySelector<HTMLSelectElement>('#post-filter-select')!.addEventListener('change', (e) => {
      const next = (e.target as HTMLSelectElement).value as VisualFilterId;
      cb.onSelectFilter(next);
      this.setFilterActive(next);
    });
    this.root.querySelector<HTMLSelectElement>('#toque-select')!.addEventListener('change', (e) => {
      const next = (e.target as HTMLSelectElement).value as ToqueId;
      cb.onSelectToque(next);
      this.setToqueActive(next);
    });

    this.root.querySelector('#close-moves')!.addEventListener('click', () => this.toggleMoveList());

    const setModeActive = (btn: Element) => {
      this.root.querySelectorAll('[data-act="vs-cpu"],[data-act="show"],[data-act="training"],[data-act="vs-2p"]').forEach((b) =>
        b.classList.remove('active'),
      );
      btn.classList.add('active');
    };

    this.root.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('button[data-act]');
      if (!btn) return;
      const act = btn.getAttribute('data-act');
      if (act === 'vs-cpu') { setModeActive(btn); cb.onModeChange('VS_CPU'); }
      else if (act === 'show') { setModeActive(btn); cb.onModeChange('SHOW'); }
      else if (act === 'training') { setModeActive(btn); cb.onModeChange('TRAINING'); }
      else if (act === 'vs-2p') { setModeActive(btn); cb.onModeChange('VS_2P'); }
      else if (act === 'auto-0') cb.onToggleAuto(0);
      else if (act === 'auto-1') cb.onToggleAuto(1);
      else if (act === 'maculele-0') cb.onToggleCostume(0);
      else if (act === 'maculele-1') cb.onToggleCostume(1);
      else if (act === 'hitboxes') { btn.classList.toggle('active'); cb.onToggleHitboxes(); }
      else if (act === 'retro') { btn.classList.toggle('active'); cb.onToggleRetro(); }
      else if (act === 'touch') { btn.classList.toggle('active'); cb.onToggleTouch(); }
      else if (act === 'customize') this.toggleCustomizeDrawer();
      else if (act === 'close-customize') this.toggleCustomizeDrawer(false);
      else if (act === 'moves') this.toggleMoveList();
      else if (act === 'mute') cb.onToggleMute();
      else if (act === 'reset') cb.onResetMatch();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!this.moveModal.classList.contains('hidden')) {
          this.moveModal.classList.add('hidden');
        } else if (!this.customizeDrawer.classList.contains('hidden')) {
          this.toggleCustomizeDrawer(false);
        }
      }
    });
    this.refreshCustomizeBadge();
  }

  private refreshCustomizeBadge(): void {
    const gStr = Math.abs(this.currentGravity - 0.165) < 0.01
      ? '0.165g 🌙'
      : Math.abs(this.currentGravity - 0.38) < 0.01
        ? '0.38g 🔴'
        : '1.0g';
    const tLabel = toquePreset(this.currentToque).shortLabel;
    this.customizeBadge.textContent = `${gStr} · ${tLabel}`;
  }

  toggleCustomizeDrawer(forceOpen?: boolean): void {
    const open = forceOpen !== undefined ? forceOpen : this.customizeDrawer.classList.contains('hidden');
    this.customizeDrawer.classList.toggle('hidden', !open);
    this.customizeBtn.classList.toggle('active', open);
  }

  toggleMoveList(): void {
    this.moveModal.classList.toggle('hidden');
  }

  setMuteLabel(muted: boolean): void {
    const b = this.root.querySelector('[data-act="mute"]')!;
    b.textContent = muted ? '🔇 Muted' : '🔊 Audio';
  }

  setAutoBadges(a0: boolean, a1: boolean, playMode: PlayMode = 'VERSUS'): void {
    this.auto0.classList.toggle('hidden', !a0);
    this.auto1.classList.toggle('hidden', !a1);
    this.auto0.textContent = playMode === 'SHOW' ? '🤝 SHOW AI' : '🤖 AUTO';
    this.auto1.textContent = playMode === 'SHOW' ? '🤝 PARTNER' : '🤖 CPU';
    this.root.querySelector('[data-act="auto-0"]')?.classList.toggle('active', a0);
    this.root.querySelector('[data-act="auto-1"]')?.classList.toggle('active', a1);
  }

  setCostumeActive(slot: 0 | 1, costume: CostumeId): void {
    this.root.querySelector(`[data-act="maculele-${slot}"]`)?.classList.toggle('active', costume === 'maculele');
    const sel = this.root.querySelector<HTMLSelectElement>(`#p${slot + 1}-skin-select`);
    if (sel && sel.value !== costume) sel.value = costume;
  }

  setGravityActive(gravityScale: number): void {
    this.currentGravity = gravityScale;
    const sel = this.root.querySelector<HTMLSelectElement>('#gravity-select');
    if (sel) {
      const val = Math.abs(gravityScale - 0.165) < 0.01
        ? '0.165'
        : Math.abs(gravityScale - 0.38) < 0.01
          ? '0.38'
          : '1.0';
      if (sel.value !== val) sel.value = val;
    }
    this.refreshCustomizeBadge();
  }

  setToqueActive(toque: ToqueId): void {
    this.currentToque = toque;
    const sel = this.root.querySelector<HTMLSelectElement>('#toque-select');
    if (sel && sel.value !== toque) sel.value = toque;
    this.refreshCustomizeBadge();
  }

  setFilterActive(filter: VisualFilterId): void {
    this.root.querySelector('[data-act="retro"]')?.classList.toggle('active', filter === 'crt');
    const sel = this.root.querySelector<HTMLSelectElement>('#post-filter-select');
    if (sel && sel.value !== filter) sel.value = filter;
  }

  setStyleActive(style: VisualStyleId): void {
    const sel = this.root.querySelector<HTMLSelectElement>('#stage-style-select');
    if (sel && sel.value !== style) sel.value = style;
  }

  /** Sync all toolbar buttons & customize selects when booting from URL iteration presets. */
  syncPreset(opts: {
    mode: HudMode;
    p1: string;
    p2: string;
    p1Skin: CostumeId;
    p2Skin: CostumeId;
    p1Pal: number;
    p2Pal: number;
    gravity: number;
    toque: ToqueId;
    style: VisualStyleId;
    filter: VisualFilterId;
    hitboxes: boolean;
  }): void {
    const modeAttr =
      opts.mode === 'SHOW'
        ? 'show'
        : opts.mode === 'TRAINING'
          ? 'training'
          : opts.mode === 'VS_2P'
            ? 'vs-2p'
            : 'vs-cpu';
    this.root.querySelectorAll('[data-act="vs-cpu"],[data-act="show"],[data-act="training"],[data-act="vs-2p"]').forEach((b) =>
      b.classList.toggle('active', b.getAttribute('data-act') === modeAttr),
    );

    const setVal = (selId: string, val: string) => {
      const sel = this.root.querySelector<HTMLSelectElement>(selId);
      if (sel) sel.value = val;
    };
    setVal('#p1-char-select', opts.p1);
    setVal('#p2-char-select', opts.p2);
    setVal('#p1-pal-select', String(opts.p1Pal));
    setVal('#p2-pal-select', String(opts.p2Pal));

    this.setCostumeActive(0, opts.p1Skin);
    this.setCostumeActive(1, opts.p2Skin);
    this.setGravityActive(opts.gravity);
    this.setToqueActive(opts.toque);
    this.setStyleActive(opts.style);
    this.setFilterActive(opts.filter);
    this.root.querySelector('[data-act="hitboxes"]')?.classList.toggle('active', opts.hitboxes);
  }

  showBanner(text: string, frames = 55): void {
    this.bannerEl.textContent = text;
    this.bannerEl.classList.remove('hidden');
    this.bannerTimer = frames;
  }

  update(state: MatchState, events: SimEvent[], showFrameInfo: boolean, dtFrames = 1): void {
    const [f0, f1] = state.fighters;
    const d0 = charById(f0.charId);
    const d1 = charById(f1.charId);
    const n0El = this.root.querySelector('#name-0');
    const n1El = this.root.querySelector('#name-1');
    if (n0El) n0El.textContent = d0.name.toUpperCase();
    if (n1El) n1El.textContent = d1.name.toUpperCase();
    const shortStyle = (s: string) => (s === 'CONTEMPORANEA' ? 'CONTEMP.' : s);
    this.style0.textContent = shortStyle(d0.style);
    this.style0.setAttribute('data-style', d0.style);
    this.style1.textContent = shortStyle(d1.style);
    this.style1.setAttribute('data-style', d1.style);
    const prof0 = characterProfile(f0.charId);
    const prof1 = characterProfile(f1.charId);
    this.p1StyleNote.textContent = `${prof0.archetypeTag} — ${prof0.specialty}`;
    this.p2StyleNote.textContent = `${prof1.archetypeTag} — ${prof1.specialty}`;
    if (this.lastSigCharId !== f0.charId) {
      this.lastSigCharId = f0.charId;
      this.sigCombosEl.innerHTML = prof0.combos
        .map(
          (c) =>
            `<span class="sig-combo-pill"><b>${c.name}:</b> ${c.steps
              .map((s) => MOVE_BY_ID[s]?.name ?? s)
              .join(' → ')}</span>`,
        )
        .join('');
    }
    const isShow = state.config.playMode === 'SHOW';
    this.root.classList.toggle('mode-show', isShow);

    const p0 = isShow ? Math.max(8, state.harmony.flow) : Math.max(0, (f0.health / f0.maxHealth) * 100);
    const p1 = isShow ? Math.max(8, state.harmony.flow) : Math.max(0, (f1.health / f1.maxHealth) * 100);
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

    if (isShow) {
      this.wins0.textContent = state.harmony.streak > 0 ? `FLOW ×${state.harmony.streak}` : 'AXÉ';
      this.wins1.textContent = state.harmony.bestStreak > 0 ? `BEST ×${state.harmony.bestStreak}` : 'RODA';
    } else {
      this.wins0.textContent = '★'.repeat(state.wins[0]) + '☆'.repeat(Math.max(0, 2 - state.wins[0]));
      this.wins1.textContent = '★'.repeat(state.wins[1]) + '☆'.repeat(Math.max(0, 2 - state.wins[1]));
    }

    this.koEmblem.textContent = isShow ? 'AXÉ' : 'K.O.';
    this.timerEl.textContent = isShow
      ? '♪'
      : state.config.trainingMode
        ? '∞'
        : String(Math.ceil(state.roundTimerFrames / 60)).padStart(2, '0');
    this.roundLabel.textContent = isShow
      ? `PLAY / SHOW · ${toquePreset(state.toque).shortLabel}`
      : state.config.trainingMode
        ? `TRAINING · ${toquePreset(state.toque).shortLabel}`
        : `RODA ${state.round} · ${toquePreset(state.toque).shortLabel}`;

    // Pulsing berimbau ring + 4-beat pip indicator + peripheral downbeat vignette
    const beatDist = Math.min(state.beatPhase, state.framesPerBeat - state.beatPhase);
    const onBeat = beatDist <= 4;
    const isDownbeat =
      state.barBeat === 0 || (state.barBeat === 3 && state.beatPhase >= state.framesPerBeat - 4);
    const pulse = 1 + (1 - state.beatPhase / state.framesPerBeat) * (isDownbeat ? 0.19 : 0.13);
    this.beatRing.style.transform = `scale(${pulse.toFixed(3)})`;
    this.beatRing.classList.toggle('on-beat', onBeat);
    this.beatRing.classList.toggle('on-downbeat', onBeat && isDownbeat);
    this.beatVignette.classList.toggle('active', onBeat && state.roundPhase === 'FIGHT');
    this.beatVignette.classList.toggle('downbeat', onBeat && isDownbeat && state.roundPhase === 'FIGHT');
    this.beatPips.forEach((pip, idx) => {
      pip.classList.toggle('active', idx === state.barBeat);
      pip.classList.toggle('down', idx === 0);
    });

    // Combo callouts or Show phrase badge
    if (isShow) {
      this.combo0.textContent = state.harmony.nearMisses > 0 ? `${state.harmony.nearMisses} SYNC DODGES` : '';
      this.combo1.textContent = !this.auto0.classList.contains('hidden') ? 'F1: JUMP IN' : '1P + PARTNER';
      this.showPhraseEl.classList.remove('hidden');
      if (state.harmony.lastPhrase && state.harmony.phraseTimer > 0) {
        this.showPhraseEl.textContent = `🤝 ${state.harmony.lastPhrase.toUpperCase()} · STREAK ×${state.harmony.streak}`;
      } else {
        this.showPhraseEl.textContent =
          '🤝 JOGAR NA RODA · SYNCHRONIZED DIALOGUE (F1 TO TAKE P1)';
      }
    } else {
      this.showPhraseEl.classList.add('hidden');
      this.combo0.textContent = f1.comboCount >= 2 ? `${f1.comboCount} HIT COMBO! (${f1.comboDamage})` : '';
      this.combo1.textContent = f0.comboCount >= 2 ? `${f0.comboCount} HIT COMBO! (${f0.comboDamage})` : '';
    }

    // Event banners
    for (const ev of events) {
      if (ev.type === 'ROUND_START') this.showBanner(`RODA ${state.round} — JOGA!`, 50);
      else if (ev.type === 'KO') this.showBanner('K.O.!', 85);
      else if (ev.type === 'COUNTER') this.showBanner('COUNTER HIT!', 35);
      else if (ev.type === 'HARMONY' && (ev.value === 1 || (ev.value ?? 0) % 3 === 0)) {
        this.showBanner(`🤝 ${ev.label?.toUpperCase() ?? 'AXÉ!'} ×${ev.value ?? 1}`, 34);
      } else if (ev.type === 'BEAT_BONUS' && !isShow) {
        this.showBanner(`⚡ AXÉ SYNC! (${ev.label ?? ''})`, 32);
      }
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
