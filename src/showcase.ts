// Interactive 3D Capoeira Move Showcase & Mudroljub / Minhoquinho Library Comparison.
import './showcase.css';
import { charById, COSTUME_LIST, ROSTER, type CostumeId } from './data/characters';
import {
  buildComparisonRows,
  getCoverageSummary,
  MINHOQUINHO_URL,
  MUDROJUB_URL,
  type ComparisonRow,
} from './data/moveCatalog';
import { MOVE_BY_ID, MOVES, type MoveCategory, type MoveDef } from './data/moves';
import { getShowcasePairReply } from './data/rodaDialogues';
import {
  FILTER_PRESETS,
  STYLE_PRESETS,
  type VisualFilterId,
  type VisualStyleId,
} from './render/presets';
import { GameRenderer } from './render/scene';
import { createMatchState, type InputFrame, type MatchState } from './sim/state';
import { step, triggerShowcaseAction } from './sim/step';

type SourceFilter = 'ALL' | 'MUDROJUB' | 'MINHOQUINHO' | 'BOTH' | 'ORIGINAL';

const rows = buildComparisonRows();
const rowByMoveId = new Map<string, ComparisonRow>(rows.map((r) => [r.move.id, r]));
const coverage = getCoverageSummary();

// DOM references
const badgesEl = document.getElementById('coverage-badges')!;
const tabAnimator = document.getElementById('tab-animator') as HTMLButtonElement;
const tabMatrix = document.getElementById('tab-matrix') as HTMLButtonElement;
const viewAnimator = document.getElementById('view-animator')!;
const viewMatrix = document.getElementById('view-matrix')!;

const animSearchEl = document.getElementById('anim-search') as HTMLInputElement;
const animSourceEl = document.getElementById('anim-source-filters')!;
const animCatEl = document.getElementById('anim-cat-filters')!;
const animCountEl = document.getElementById('anim-count-bar')!;
const animListEl = document.getElementById('anim-move-list')!;

const fighterSelect = document.getElementById('sc-fighter') as HTMLSelectElement;
const gravitySelect = document.getElementById('sc-gravity') as HTMLSelectElement;
const paletteSelect = document.getElementById('sc-palette') as HTMLSelectElement;
const skinSelect = document.getElementById('sc-skin') as HTMLSelectElement;
const styleSelect = document.getElementById('sc-style') as HTMLSelectElement;
const filterSelect = document.getElementById('sc-filter') as HTMLSelectElement;
const btnMaculele = document.getElementById('sc-maculele') as HTMLButtonElement;
const btnDummy = document.getElementById('sc-dummy') as HTMLButtonElement;
const btnPair = document.getElementById('sc-pair') as HTMLButtonElement;
const btnHitboxes = document.getElementById('sc-hitboxes') as HTMLButtonElement;
const btnRetro = document.getElementById('sc-retro') as HTMLButtonElement;
const btnCamReset = document.getElementById('sc-cam-reset') as HTMLButtonElement;

const canvasMount = document.getElementById('showcase-canvas')!;
const overlayPill = document.getElementById('stage-overlay-pill')!;
const btnPlayPause = document.getElementById('sc-play-pause') as HTMLButtonElement;
const btnReplay = document.getElementById('sc-replay') as HTMLButtonElement;
const btnTour = document.getElementById('sc-tour') as HTMLButtonElement;
const scrubber = document.getElementById('sc-scrubber') as HTMLInputElement;
const frameReadout = document.getElementById('sc-frame-readout')!;
const speedSelect = document.getElementById('sc-speed') as HTMLSelectElement;
const detailsCard = document.getElementById('move-details-card')!;

const matrixSearchEl = document.getElementById('matrix-search') as HTMLInputElement;
const matrixSourceEl = document.getElementById('matrix-source-filter') as HTMLSelectElement;
const matrixCatEl = document.getElementById('matrix-cat-filter') as HTMLSelectElement;
const matrixBodyEl = document.getElementById('matrix-tbody')!;

// Render top coverage pills
badgesEl.innerHTML = `
  <span class="cov-pill">✓ ${coverage.totalPlayable} Playable 3D Moves</span>
  <span class="cov-pill">✓ Mudroljub: ${coverage.mudroljubActiveCovered}/${coverage.mudroljubActiveTotal} active (${coverage.mudroljubAllCovered}/${coverage.mudroljubAllTotal} total)</span>
  <span class="cov-pill">✓ Minhoquinho Videos: ${coverage.minhoquinhoCovered}/${coverage.minhoquinhoTotal} (100%)</span>
`;

// Populate fighter, skin, style, filter & category dropdowns
fighterSelect.innerHTML = ROSTER.map(
  (c) => `<option value="${c.id}">${c.name} — ${c.style}</option>`,
).join('');
skinSelect.innerHTML = COSTUME_LIST.map((c) => `<option value="${c.id}">${c.label}</option>`).join('');
styleSelect.innerHTML = STYLE_PRESETS.map((s) => `<option value="${s.id}">${s.label}</option>`).join('');
filterSelect.innerHTML = FILTER_PRESETS.map((f) => `<option value="${f.id}">${f.label}</option>`).join('');

const CATEGORIES: ('All' | MoveCategory)[] = [
  'All',
  'Base & Stances',
  'Cartwheels',
  'Kicks',
  'Evasions & Floor',
  'Sweeps & Takedowns',
  'Acrobatics',
];

animCatEl.innerHTML = CATEGORIES.map(
  (cat) => `<button type="button" class="chip${cat === 'All' ? ' active' : ''}" data-cat="${cat}">${cat}</button>`,
).join('');

matrixCatEl.innerHTML =
  '<option value="ALL">All Categories</option>' +
  CATEGORIES.filter((c) => c !== 'All')
    .map((c) => `<option value="${c}">${c}</option>`)
    .join('');

// State for showcase simulation & camera
let selectedMoveId = 'ginga';
let selectedFighter = 'faisca';
let selectedPalette = 0;
let selectedCostume: CostumeId = 'default';
let manualStyleSelected = false;
let dummyEnabled = false;
let pairReplyEnabled = false;
let pairReplyTriggered = false;
let pairReplyMoveId: string | null = null;
let pairReplyTriggerFrame = 2;
let animSource: SourceFilter = 'ALL';
let animCat: 'All' | MoveCategory = 'All';

let paused = false;
let autoTour = false;
let playbackSpeed = 1;
let idleLoopsBetweenMoves = 0;

const orbit = { yaw: 0.24, pitch: 0.24, dist: 3.35 };

let state: MatchState = createMatchState({
  p1Char: selectedFighter,
  p2Char: 'tigre',
  p1Palette: 0,
  p2Palette: 1,
  gravityScale: 1.0,
  trainingMode: true,
});
let prevState: MatchState = structuredClone(state);
const NEUTRAL_IN: InputFrame = { dir: 5, buttons: 0 };

const renderer = new GameRenderer(canvasMount, state);
renderer.setFighterVisible(1, dummyEnabled);

// Keep fighters cleanly centered on the roda platform for inspection
function resetPositions(): void {
  const halfSep = pairReplyEnabled && dummyEnabled ? 0.82 : 0.85;
  state.fighters[0].pos = [pairReplyEnabled && dummyEnabled ? -halfSep : -0.65, 0, 0];
  state.fighters[0].vel = [0, 0, 0];
  state.fighters[0].facing = [1, 0];
  state.fighters[1].pos = [pairReplyEnabled && dummyEnabled ? halfSep : 1.05, 0, 0];
  state.fighters[1].vel = [0, 0, 0];
  state.fighters[1].facing = [-1, 0];
  state.fighters[1].stance = 'GINGA';
  state.fighters[1].mode = 'IDLE';
  state.fighters[1].moveId = null;
  state.fighters[1].health = state.fighters[1].maxHealth;
  state.fighters[0].health = state.fighters[0].maxHealth;
}

function setupPairReply(): void {
  pairReplyTriggered = false;
  pairReplyMoveId = null;
  pairReplyTriggerFrame = 2;
  if (!pairReplyEnabled || !dummyEnabled) return;

  const p1Move = MOVE_BY_ID[selectedMoveId];
  const reply = getShowcasePairReply(selectedMoveId);
  if (!p1Move || !reply) return;

  const replyMove = MOVE_BY_ID[reply.moveId];
  if (!replyMove) return;

  // If P1 move is a pure evasion/floreio, swap roles cleanly on P2 or time dummy's swing around P1's dodge
  const firstHit = p1Move.hits[0];
  if (firstHit) {
    const midHit = Math.round((firstHit.frames[0] + firstHit.frames[1]) * 0.5);
    const crush = replyMove.hurtboxOverrides?.[0]?.frames ?? [3, replyMove.totalFrames - 5];
    const midCrush = Math.round((crush[0] + crush[1]) * 0.5);
    pairReplyMoveId = replyMove.id;
    pairReplyTriggerFrame = Math.max(1, midHit - midCrush);
  } else {
    const p1Crush = p1Move.hurtboxOverrides?.[0]?.frames ?? [3, p1Move.totalFrames - 5];
    const midCrush = Math.round((p1Crush[0] + p1Crush[1]) * 0.5);
    const replyHit = replyMove.hits[0];
    const midHit = replyHit ? Math.round((replyHit.frames[0] + replyHit.frames[1]) * 0.5) : 12;
    if (midHit >= midCrush) {
      // Kick starts slightly earlier if needed, otherwise trigger immediately
      pairReplyMoveId = replyMove.id;
      pairReplyTriggerFrame = 1;
    } else {
      pairReplyMoveId = replyMove.id;
      pairReplyTriggerFrame = Math.max(1, midCrush - midHit);
    }
  }
}

function playSelectedMove(moveId = selectedMoveId): void {
  selectedMoveId = MOVE_BY_ID[moveId] ? moveId : MOVES[0].id;
  state.config.playMode = pairReplyEnabled && dummyEnabled ? 'SHOW' : 'TRAINING';
  resetPositions();
  if (!dummyEnabled) state.fighters[0].pos = [0, 0, 0];
  triggerShowcaseAction(state, 0, selectedMoveId);
  setupPairReply();
  prevState = structuredClone(state);
  const m = MOVE_BY_ID[selectedMoveId]!;
  scrubber.max = String(m.totalFrames);
  scrubber.value = '0';
  updateDetailsCard(m);
  highlightSelectedListItem();
}

function maybeTriggerPairReply(): void {
  if (
    pairReplyEnabled &&
    dummyEnabled &&
    !pairReplyTriggered &&
    pairReplyMoveId &&
    state.fighters[0].modeFrame >= pairReplyTriggerFrame
  ) {
    pairReplyTriggered = true;
    triggerShowcaseAction(state, 1, pairReplyMoveId);
  }
}

function stepShowcaseOneFrame(): void {
  prevState = structuredClone(state);
  maybeTriggerPairReply();
  step(state, [NEUTRAL_IN, NEUTRAL_IN]);
  for (const ev of state.events) {
    if (ev.type === 'HARMONY') renderer.vfx.spawnHarmony(ev.pos);
  }
  // Prevent arena drift far from showcase center
  if (Math.hypot(state.fighters[0].pos[0], state.fighters[0].pos[2]) > 2.2) {
    resetPositions();
    if (!dummyEnabled) state.fighters[0].pos = [0, 0, 0];
  }
  state.fighters[1].health = state.fighters[1].maxHealth;
}

function scrubToFrame(targetFrame: number): void {
  const m = MOVE_BY_ID[selectedMoveId]!;
  state.config.playMode = pairReplyEnabled && dummyEnabled ? 'SHOW' : 'TRAINING';
  resetPositions();
  if (!dummyEnabled) state.fighters[0].pos = [0, 0, 0];
  triggerShowcaseAction(state, 0, m.id);
  setupPairReply();
  for (let i = 0; i < targetFrame; i++) {
    prevState = structuredClone(state);
    maybeTriggerPairReply();
    step(state, [NEUTRAL_IN, NEUTRAL_IN]);
  }
  if (targetFrame === 0) prevState = structuredClone(state);
  syncScrubberUI();
}

function syncScrubberUI(): void {
  const f0 = state.fighters[0];
  const m = MOVE_BY_ID[selectedMoveId]!;
  const curF = f0.mode === 'ATTACK' ? f0.moveFrame : m.totalFrames;
  const pairSuffix =
    pairReplyEnabled && dummyEnabled && pairReplyMoveId && MOVE_BY_ID[pairReplyMoveId]
      ? ` ⇄ ${MOVE_BY_ID[pairReplyMoveId].name.toUpperCase()}`
      : '';
  scrubber.value = String(Math.min(m.totalFrames, curF));
  frameReadout.textContent = `${Math.min(m.totalFrames, curF)} / ${m.totalFrames}f`;
  overlayPill.textContent = `${m.name.toUpperCase()}${pairSuffix} · ${charById(selectedFighter).name.toUpperCase()} · ${curF}f`;
}

function highlightSelectedListItem(): void {
  animListEl.querySelectorAll('.move-item').forEach((el) => {
    const active = el.getAttribute('data-move-id') === selectedMoveId;
    el.classList.toggle('selected', active);
    if (active) el.setAttribute('aria-selected', 'true');
    else el.removeAttribute('aria-selected');
  });
}

function updateDetailsCard(m: MoveDef): void {
  const row = rowByMoveId.get(m.id);
  const firstHit = m.hits[0];
  const startup = firstHit ? `${firstHit.frames[0]}f` : '—';
  const activeWin = firstHit ? `${firstHit.frames[0]}–${firstHit.frames[1]}f` : 'Floreio / Dodge';
  const dmg = m.hits.reduce((a, b) => a + b.damage, 0);
  const level = firstHit ? firstHit.level : m.hurtboxOverrides?.[0]?.profile ?? 'EVASION';

  const sourceLinks: string[] = [];
  if (row) {
    for (const me of row.mudroljub) {
      const href = me.commented ? MUDROJUB_URL : `${MUDROJUB_URL}#moves/${me.slug}.html`;
      sourceLinks.push(
        `<a class="ext-link" href="${href}" target="_blank" rel="noopener noreferrer">Mudroljub: ${me.label}</a>`,
      );
    }
    for (const ne of row.minhoquinho) {
      sourceLinks.push(
        `<a class="ext-link" href="${MINHOQUINHO_URL}/v/${ne.slug}" target="_blank" rel="noopener noreferrer">Minhoquinho Video: ${ne.title}</a>`,
      );
    }
  }
  if (sourceLinks.length === 0) {
    sourceLinks.push(`<span class="cov-pill">★ Roda Orbital Signature Move</span>`);
  }

  detailsCard.innerHTML = `
    <div>
      <div class="md-head">
        <h2 class="md-title">${m.name}</h2>
        <span class="md-eng">${m.english ?? ''}</span>
      </div>
      <p class="md-desc">${m.description ?? ''}</p>
      <div class="md-sources">${sourceLinks.join('')}</div>
    </div>
    <div class="md-stats">
      <div class="stat-box"><span class="stat-label">Command</span><span class="stat-val">${m.input}</span></div>
      <div class="stat-box"><span class="stat-label">From -> End</span><span class="stat-val">${m.from.join('/')} -> ${m.endStance}</span></div>
      <div class="stat-box"><span class="stat-label">Total Frames</span><span class="stat-val">${m.totalFrames}f</span></div>
      <div class="stat-box"><span class="stat-label">Startup / Hit</span><span class="stat-val">${startup} (${activeWin})</span></div>
      <div class="stat-box"><span class="stat-label">Property</span><span class="stat-val">${level}</span></div>
      <div class="stat-box"><span class="stat-label">Damage</span><span class="stat-val">${dmg > 0 ? `${dmg} dmg` : 'Evasive'}</span></div>
    </div>
  `;
}

function matchesSource(row: ComparisonRow, src: SourceFilter): boolean {
  if (src === 'ALL') return true;
  if (src === 'MUDROJUB') return row.mudroljub.length > 0;
  if (src === 'MINHOQUINHO') return row.minhoquinho.length > 0;
  if (src === 'BOTH') return row.mudroljub.length > 0 && row.minhoquinho.length > 0;
  return row.mudroljub.length === 0 && row.minhoquinho.length === 0;
}

function renderSidebarMoves(): void {
  const q = animSearchEl.value.trim().toLowerCase();
  const visibleRows = rows.filter((r) => {
    if (!matchesSource(r, animSource)) return false;
    if (animCat !== 'All' && r.move.category !== animCat) return false;
    if (!q) return true;
    const m = r.move;
    return (
      m.name.toLowerCase().includes(q) ||
      (m.english ?? '').toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      r.mudroljub.some((e) => e.label.toLowerCase().includes(q)) ||
      r.minhoquinho.some((e) => e.title.toLowerCase().includes(q))
    );
  });

  animCountEl.textContent = `Showing ${visibleRows.length} of ${MOVES.length} Moves`;
  animListEl.innerHTML = visibleRows
    .map((r) => {
      const m = r.move;
      const isSel = m.id === selectedMoveId;
      const badges = [
        r.mudroljub.length > 0 ? '<span class="src-badge src-m" title="In Mudroljub">M</span>' : '',
        r.minhoquinho.length > 0 ? '<span class="src-badge src-n" title="In Minhoquinho Video Library">V</span>' : '',
        r.mudroljub.length === 0 && r.minhoquinho.length === 0
          ? '<span class="src-badge src-o" title="Roda Orbital Signature">★</span>'
          : '',
      ].join('');
      return `<li>
        <button type="button" class="move-item${isSel ? ' selected' : ''}" data-move-id="${m.id}" ${
          isSel ? 'aria-selected="true"' : ''
        }>
          <span class="mi-title">${m.name}</span>
          <span class="mi-sub">${m.english ?? m.category ?? ''} · [${m.from.join('/')}: ${m.input}]</span>
          <span class="mi-badges">${badges}</span>
        </button>
      </li>`;
    })
    .join('');
}

function renderComparisonMatrix(): void {
  const q = matrixSearchEl.value.trim().toLowerCase();
  const src = matrixSourceEl.value as SourceFilter;
  const cat = matrixCatEl.value;

  const filtered = rows.filter((r) => {
    if (!matchesSource(r, src)) return false;
    if (cat !== 'ALL' && r.move.category !== cat) return false;
    if (!q) return true;
    const m = r.move;
    return (
      m.name.toLowerCase().includes(q) ||
      (m.english ?? '').toLowerCase().includes(q) ||
      r.mudroljub.some((e) => e.label.toLowerCase().includes(q)) ||
      r.minhoquinho.some((e) => e.title.toLowerCase().includes(q))
    );
  });

  matrixBodyEl.innerHTML = filtered
    .map((r) => {
      const m = r.move;
      const mudCell =
        r.mudroljub.length > 0
          ? r.mudroljub
              .map((e) => {
                const url = e.commented ? MUDROJUB_URL : `${MUDROJUB_URL}#moves/${e.slug}.html`;
                return `<a class="tbl-link" href="${url}" target="_blank" rel="noopener noreferrer">${e.label}</a>${
                  e.commented ? ' <span class="tbl-muted">(archived)</span>' : ''
                }`;
              })
              .join('<br/>')
          : '<span class="tbl-muted">—</span>';

      const minhoCell =
        r.minhoquinho.length > 0
          ? r.minhoquinho
              .map(
                (e) =>
                  `<a class="tbl-link" href="${MINHOQUINHO_URL}/v/${e.slug}" target="_blank" rel="noopener noreferrer">${e.title}</a> <span class="tbl-muted">(${e.section})</span>`,
              )
              .join('<br/>')
          : '<span class="tbl-muted">—</span>';

      return `<tr>
        <th scope="row">${m.name}<br/><span class="tbl-muted">${m.english ?? ''}</span></th>
        <td data-label="Category & Command">${m.category ?? ''}<br/><span class="cmd-code">${m.from.join('/')} · ${m.input}</span></td>
        <td data-label="Mudroljub Catalog">${mudCell}</td>
        <td data-label="Minhoquinho Video">${minhoCell}</td>
        <td data-label="Coverage"><span class="status-ok">✓ 3D Playable</span></td>
        <td data-label="3D Preview"><button type="button" class="ctrl-btn accent" data-preview-move="${m.id}">▶ Animate</button></td>
      </tr>`;
    })
    .join('');
}

function setActiveView(view: 'animator' | 'matrix'): void {
  const isAnim = view === 'animator';
  viewAnimator.classList.toggle('hidden', !isAnim);
  viewMatrix.classList.toggle('hidden', isAnim);
  if (isAnim) {
    tabAnimator.setAttribute('aria-current', 'page');
    tabMatrix.removeAttribute('aria-current');
    renderer.resize(canvasMount);
  } else {
    tabMatrix.setAttribute('aria-current', 'page');
    tabAnimator.removeAttribute('aria-current');
    renderComparisonMatrix();
  }
}

// Navigation tabs
tabAnimator.addEventListener('click', () => setActiveView('animator'));
tabMatrix.addEventListener('click', () => setActiveView('matrix'));

// Sidebar filters & move selection
animSearchEl.addEventListener('input', renderSidebarMoves);
animSourceEl.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-src]');
  if (!btn) return;
  animSource = btn.dataset.src as SourceFilter;
  animSourceEl.querySelectorAll('.chip').forEach((b) => b.classList.toggle('active', b === btn));
  renderSidebarMoves();
});
animCatEl.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-cat]');
  if (!btn) return;
  animCat = btn.dataset.cat as 'All' | MoveCategory;
  animCatEl.querySelectorAll('.chip').forEach((b) => b.classList.toggle('active', b === btn));
  renderSidebarMoves();
});
animListEl.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-move-id]');
  if (!btn) return;
  const id = btn.dataset.moveId;
  if (id) {
    paused = false;
    btnPlayPause.textContent = '⏸ Pause';
    playSelectedMove(id);
  }
});

// Matrix filters & click-to-animate
matrixSearchEl.addEventListener('input', renderComparisonMatrix);
matrixSourceEl.addEventListener('change', renderComparisonMatrix);
matrixCatEl.addEventListener('change', renderComparisonMatrix);
matrixBodyEl.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-preview-move]');
  if (!btn) return;
  const id = btn.dataset.previewMove;
  if (id) {
    setActiveView('animator');
    paused = false;
    btnPlayPause.textContent = '⏸ Pause';
    playSelectedMove(id);
  }
});

// Stage controls
fighterSelect.addEventListener('change', () => {
  selectedFighter = fighterSelect.value;
  state.fighters[0].charId = selectedFighter;
  prevState.fighters[0].charId = selectedFighter;
  renderer.rebuildFighter(0, selectedFighter, selectedPalette, selectedCostume);
  syncScrubberUI();
});

paletteSelect.addEventListener('change', () => {
  selectedPalette = Number(paletteSelect.value);
  state.fighters[0].paletteIdx = selectedPalette;
  prevState.fighters[0].paletteIdx = selectedPalette;
  renderer.setPalette(0, selectedPalette);
});

skinSelect.addEventListener('change', () => {
  selectedCostume = skinSelect.value as CostumeId;
  state.fighters[0].costume = selectedCostume;
  prevState.fighters[0].costume = selectedCostume;
  renderer.setCostume(0, selectedCostume);
  btnMaculele.classList.toggle('active', selectedCostume === 'maculele');
});

styleSelect.addEventListener('change', () => {
  manualStyleSelected = true;
  renderer.setStyle(styleSelect.value as VisualStyleId);
});

filterSelect.addEventListener('change', () => {
  const next = filterSelect.value as VisualFilterId;
  renderer.setFilter(next);
  btnRetro.classList.toggle('active', next === 'crt');
});

gravitySelect.addEventListener('change', () => {
  const g = Number(gravitySelect.value);
  state.config.gravityScale = g;
  if (!manualStyleSelected) {
    const autoStyle: VisualStyleId = Math.abs(g - 0.165) < 0.01 ? 'lunar' : 'sf2';
    styleSelect.value = autoStyle;
    renderer.setStyle(autoStyle);
  }
  playSelectedMove();
});

btnMaculele.addEventListener('click', () => {
  selectedCostume = selectedCostume === 'maculele' ? 'default' : 'maculele';
  state.fighters[0].costume = selectedCostume;
  prevState.fighters[0].costume = selectedCostume;
  skinSelect.value = selectedCostume;
  renderer.setCostume(0, selectedCostume);
  btnMaculele.classList.toggle('active', selectedCostume === 'maculele');
});

btnDummy.addEventListener('click', () => {
  dummyEnabled = !dummyEnabled;
  if (!dummyEnabled) {
    pairReplyEnabled = false;
    btnPair.classList.remove('active');
  }
  btnDummy.classList.toggle('active', dummyEnabled);
  renderer.setFighterVisible(1, dummyEnabled);
  playSelectedMove();
});

btnPair.addEventListener('click', () => {
  pairReplyEnabled = !pairReplyEnabled;
  btnPair.classList.toggle('active', pairReplyEnabled);
  if (pairReplyEnabled && !dummyEnabled) {
    dummyEnabled = true;
    btnDummy.classList.add('active');
    renderer.setFighterVisible(1, true);
  }
  playSelectedMove();
});

btnHitboxes.addEventListener('click', () => {
  const next = !renderer.debug.isVisible();
  renderer.debug.setVisible(next);
  btnHitboxes.classList.toggle('active', next);
});

btnRetro.addEventListener('click', () => {
  const next: VisualFilterId = renderer.isRetroMode() ? 'none' : 'crt';
  renderer.setFilter(next);
  filterSelect.value = next;
  btnRetro.classList.toggle('active', next === 'crt');
});

btnCamReset.addEventListener('click', () => {
  orbit.yaw = 0.24;
  orbit.pitch = 0.24;
  orbit.dist = 3.35;
});

// Transport & playback
btnPlayPause.addEventListener('click', () => {
  paused = !paused;
  btnPlayPause.textContent = paused ? '▶ Play' : '⏸ Pause';
});

btnReplay.addEventListener('click', () => {
  paused = false;
  btnPlayPause.textContent = '⏸ Pause';
  playSelectedMove();
});

btnTour.addEventListener('click', () => {
  autoTour = !autoTour;
  btnTour.classList.toggle('active', autoTour);
  if (autoTour) {
    paused = false;
    btnPlayPause.textContent = '⏸ Pause';
  }
});

speedSelect.addEventListener('change', () => {
  playbackSpeed = Number(speedSelect.value);
});

scrubber.addEventListener('input', () => {
  paused = true;
  btnPlayPause.textContent = '▶ Play';
  scrubToFrame(Number(scrubber.value));
});

// Interactive pointer orbit + zoom on canvas
let dragging = false;
let lastX = 0;
let lastY = 0;

canvasMount.addEventListener('pointerdown', (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  canvasMount.setPointerCapture(e.pointerId);
});

canvasMount.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  orbit.yaw -= dx * 0.008;
  orbit.pitch = Math.max(-0.08, Math.min(1.15, orbit.pitch + dy * 0.006));
});

canvasMount.addEventListener('pointerup', (e) => {
  dragging = false;
  if (canvasMount.hasPointerCapture(e.pointerId)) {
    canvasMount.releasePointerCapture(e.pointerId);
  }
});

canvasMount.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    orbit.dist = Math.max(1.8, Math.min(6.0, orbit.dist + e.deltaY * 0.003));
  },
  { passive: false },
);

// Handle initial query parameter e.g. moves.html?move=meia_lua_compasso&view=matrix&dummy=1
const urlParams = new URLSearchParams(window.location.search);
const initMove = urlParams.get('move');
const initView = urlParams.get('view');
if (urlParams.get('dummy') === '1' || urlParams.get('pair') === '1') {
  dummyEnabled = true;
  btnDummy.classList.add('active');
  renderer.setFighterVisible(1, true);
}
if (urlParams.get('pair') === '1') {
  pairReplyEnabled = true;
  btnPair.classList.add('active');
}

renderSidebarMoves();
renderComparisonMatrix();
playSelectedMove(initMove ?? 'meia_lua_compasso');
if (initView === 'matrix') setActiveView('matrix');

// Fixed 60 Hz animation loop with slow-motion speed factor & looping replay
const DT = 1 / 60;
let acc = 0;
let lastTime = performance.now();

function frame(now: number): void {
  const dtReal = Math.min((now - lastTime) / 1000, 0.25);
  lastTime = now;

  if (!paused && !viewAnimator.classList.contains('hidden')) {
    acc += dtReal * playbackSpeed;
    while (acc >= DT) {
      stepShowcaseOneFrame();
      if (state.fighters[0].mode === 'IDLE') {
        idleLoopsBetweenMoves++;
        if (idleLoopsBetweenMoves >= 18) {
          idleLoopsBetweenMoves = 0;
          if (autoTour) {
            const idx = MOVES.findIndex((m) => m.id === selectedMoveId);
            const nextMove = MOVES[(idx + 1) % MOVES.length];
            playSelectedMove(nextMove.id);
          } else {
            playSelectedMove(selectedMoveId);
          }
        }
      } else {
        idleLoopsBetweenMoves = 0;
      }
      acc -= DT;
    }
    syncScrubberUI();
  }

  if (!viewAnimator.classList.contains('hidden')) {
    renderer.draw(prevState, state, paused ? 1 : Math.min(1, acc / DT), dtReal, {
      yaw: orbit.yaw,
      pitch: orbit.pitch,
      dist: orbit.dist,
      focusSlot: dummyEnabled ? 'mid' : 0,
    });
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
