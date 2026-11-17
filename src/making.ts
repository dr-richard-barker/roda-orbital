// Interactive Development Chronicle (Playable Iteration Tabs) & Complete 116-Move Index.
import './editorial.css';
import './making.css';
import './nav';
import {
  countMovesByIteration,
  getMoveIteration,
  ITERATIONS,
  type IterationId,
} from './data/iterations';
import { buildComparisonRows, getCoverageSummary } from './data/moveCatalog';
import { MOVE_BY_ID, type MoveCategory } from './data/moves';

const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
const panels = Array.from(document.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
const panelsWrap = document.getElementById('iter-panels-grid')!;
const heroPillsEl = document.getElementById('making-summary-pills')!;

const coverage = getCoverageSummary();
const iterCounts = countMovesByIteration();

heroPillsEl.innerHTML = `
  <span class="stat-pill">✓ 5 Playable Build Eras</span>
  <span class="stat-pill">✓ ${coverage.totalPlayable} Integrated Capoeira Moves (${iterCounts[1]} Core + ${iterCounts[3]} Expanded + ${iterCounts[5]} Angola Rituals)</span>
  <span class="stat-pill">✓ Mudroljub: ${coverage.mudroljubActiveCovered}/${coverage.mudroljubActiveTotal} · Minhoquinho: ${coverage.minhoquinhoCovered}/${coverage.minhoquinhoTotal}</span>
`;

let activeIframe: { era: IterationId; host: HTMLElement } | null = null;

function stopEmbeddedPreview(): void {
  if (!activeIframe) return;
  const { era, host } = activeIframe;
  const it = ITERATIONS.find((x) => x.id === era);
  host.innerHTML = renderPosterHtml(era, it?.embedUrl ?? './index.html');
  activeIframe = null;
}

function renderPosterHtml(era: IterationId, embedUrl: string): string {
  const it = ITERATIONS.find((x) => x.id === era)!;
  const p = it.preset;
  const spec =
    era === 'v3'
      ? `3D Move Animator Preview · Dummy Partner · 116 Moves · Direct Frame Scrubber`
      : `${p.mode} · ${p.p1.toUpperCase()} vs ${p.p2.toUpperCase()} · Gravity ${p.gravity}g · Stage: ${p.style} · FX: ${p.filter}${p.hitboxes ? ' · Hitboxes ON' : ''}`;
  return `
    <div class="iter-poster">
      <strong>Interactive Playable Frame — ${it.title}</strong>
      <p>${spec}</p>
      <div class="iter-stage-actions">
        <button type="button" class="mini-btn" data-launch-era="${era}" data-embed-url="${embedUrl}">
          ▶ Play Iteration ${it.number} Here
        </button>
        <a class="mini-btn secondary" href="${it.fullscreenUrl}">↗ Open Fullscreen</a>
      </div>
    </div>
  `;
}

function launchEmbeddedPreview(era: IterationId, host: HTMLElement, embedUrl: string): void {
  if (activeIframe && activeIframe.host !== host) {
    stopEmbeddedPreview();
  }
  const it = ITERATIONS.find((x) => x.id === era)!;
  host.innerHTML = `
    <iframe
      class="iter-iframe"
      src="${embedUrl}"
      title="Playable sandbox for ${it.title}"
      allow="autoplay; fullscreen"
    ></iframe>
  `;
  activeIframe = { era, host };
  const stopBtn = document.querySelector<HTMLButtonElement>(`[data-stop-era="${era}"]`);
  if (stopBtn) stopBtn.hidden = false;
}

function selectTab(targetId: IterationId, focusTab = false): void {
  if (activeIframe && activeIframe.era !== targetId) {
    const prevStop = document.querySelector<HTMLButtonElement>(`[data-stop-era="${activeIframe.era}"]`);
    if (prevStop) prevStop.hidden = true;
    stopEmbeddedPreview();
  }

  for (const tab of tabs) {
    const era = tab.dataset.era as IterationId;
    const isSel = era === targetId;
    tab.setAttribute('aria-selected', String(isSel));
    tab.setAttribute('tabindex', isSel ? '0' : '-1');
    tab.toggleAttribute('focusgroupstart', isSel);
    if (isSel) {
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      if (focusTab) tab.focus();
    }
  }

  for (const panel of panels) {
    const era = panel.dataset.era as IterationId;
    const isSel = era === targetId;
    if (isSel) {
      panel.removeAttribute('hidden');
      panel.setAttribute('tabindex', '0');
    } else {
      panel.setAttribute('hidden', 'until-found');
      panel.removeAttribute('tabindex');
    }
  }
}

// Initialize featured move chips and poster controls in each iteration panel
for (const it of ITERATIONS) {
  const chipsHost = document.getElementById(`chips-${it.id}`);
  if (chipsHost) {
    chipsHost.innerHTML = it.featuredMoves
      .map((id) => {
        const m = MOVE_BY_ID[id];
        return m
          ? `<a class="iter-move-pill" href="./moves.html?move=${m.id}">${m.name} <span style="opacity:.7">(${m.input})</span></a>`
          : '';
      })
      .join('');
  }

  const vp = document.getElementById(`viewport-${it.id}`);
  if (vp) {
    vp.innerHTML = renderPosterHtml(it.id, it.embedUrl);
  }
}

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const tabBtn = target.closest<HTMLButtonElement>('[role="tab"]');
  if (tabBtn?.dataset.era) {
    selectTab(tabBtn.dataset.era as IterationId, false);
    if (window.location.hash !== `#${tabBtn.dataset.era}`) {
      history.replaceState(null, '', `#${tabBtn.dataset.era}`);
    }
    return;
  }

  const launchBtn = target.closest<HTMLButtonElement>('[data-launch-era]');
  if (launchBtn) {
    const era = launchBtn.dataset.launchEra as IterationId;
    const embedUrl = launchBtn.dataset.embedUrl ?? `./index.html?era=${era}&embed=1`;
    const vp = document.getElementById(`viewport-${era}`);
    if (vp) launchEmbeddedPreview(era, vp, embedUrl);
    return;
  }

  const stopBtn = target.closest<HTMLButtonElement>('[data-stop-era]');
  if (stopBtn) {
    const era = stopBtn.dataset.stopEra as IterationId;
    if (activeIframe?.era === era) stopEmbeddedPreview();
    stopBtn.hidden = true;
  }
});

// Keyboard fallback when native focusgroup is unavailable (Firefox/Safari)
const tablist = document.querySelector<HTMLElement>('[role="tablist"]');
tablist?.addEventListener('keydown', (e) => {
  const cur = document.activeElement as HTMLButtonElement | null;
  if (!cur || !tabs.includes(cur)) return;
  const idx = tabs.indexOf(cur);
  let nextIdx = idx;
  if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
  else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
  else if (e.key === 'Home') nextIdx = 0;
  else if (e.key === 'End') nextIdx = tabs.length - 1;
  else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (cur.dataset.era) selectTab(cur.dataset.era as IterationId, false);
    return;
  } else {
    return;
  }
  e.preventDefault();
  tabs[nextIdx].focus();
});

// Sync active tab cleanly when browser Find-in-Page matches text inside a hidden="until-found" panel
panelsWrap.addEventListener('beforematch', (e) => {
  const panel = (e.target as HTMLElement).closest<HTMLElement>('[role="tabpanel"]');
  const era = panel?.dataset.era as IterationId | undefined;
  if (era) selectTab(era, false);
});

// Honor URL hash deep-links like #v1 .. #v5
const hashEra = window.location.hash.replace('#', '') as IterationId;
if (ITERATIONS.some((x) => x.id === hashEra)) {
  selectTab(hashEra, false);
}

// ---------------------------------------------------------------------------
// Complete 116-Move Integrated Capoeira Encyclopedia Table
// ---------------------------------------------------------------------------
const rows = buildComparisonRows();
const searchInput = document.getElementById('mk-search') as HTMLInputElement;
const catSelect = document.getElementById('mk-cat') as HTMLSelectElement;
const sourceSelect = document.getElementById('mk-source') as HTMLSelectElement;
const countNote = document.getElementById('mk-count-note')!;
const tbody = document.getElementById('mk-tbody')!;
const iterFilterChips = Array.from(document.querySelectorAll<HTMLButtonElement>('.filter-chip[data-iter]'));

let activeIterFilter: 'ALL' | '1' | '3' | '5' = 'ALL';

const CATEGORIES: MoveCategory[] = [
  'Base & Stances',
  'Cartwheels',
  'Kicks',
  'Evasions & Floor',
  'Sweeps & Takedowns',
  'Acrobatics',
];
catSelect.innerHTML =
  '<option value="ALL">All Categories (6)</option>' +
  CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('');

function renderMoveIndex(): void {
  const q = searchInput.value.trim().toLowerCase();
  const cat = catSelect.value;
  const src = sourceSelect.value;

  const filtered = rows.filter((r) => {
    const itNum = getMoveIteration(r.move.id);
    if (activeIterFilter !== 'ALL' && String(itNum) !== activeIterFilter) return false;
    if (cat !== 'ALL' && r.move.category !== cat) return false;
    if (src === 'MUDROJUB' && r.mudroljub.length === 0) return false;
    if (src === 'MINHOQUINHO' && r.minhoquinho.length === 0) return false;
    if (src === 'ORIGINAL' && (r.mudroljub.length > 0 || r.minhoquinho.length > 0)) return false;

    if (!q) return true;
    const cancelText = r.move.cancels.map((c) => MOVE_BY_ID[c.into]?.name ?? c.into).join(' ');
    const hay = `${r.move.name} ${r.move.english ?? ''} ${r.move.description ?? ''} ${r.move.input} ${cancelText}`.toLowerCase();
    return hay.includes(q);
  });

  countNote.textContent = `Showing ${filtered.length} of ${rows.length} integrated moves`;

  tbody.innerHTML = filtered
    .map((r) => {
      const m = r.move;
      const itNum = getMoveIteration(m.id);
      const itLabel = itNum === 1 ? 'Iter 1 · Core' : itNum === 5 ? 'Iter 5 · Ritual' : 'Iter 3 · Library';
      const firstHit = m.hits[0];
      const frameSummary = firstHit
        ? `${m.totalFrames}f · ${firstHit.damage} dmg · ${firstHit.level}`
        : `${m.totalFrames}f · Evade / Floreio`;
      const cancels =
        m.cancels.length > 0
          ? m.cancels
              .slice(0, 3)
              .map((c) => `→ ${MOVE_BY_ID[c.into]?.name ?? c.into}`)
              .join(' ')
          : '—';
      const prov: string[] = [];
      if (r.mudroljub.length > 0) prov.push('<span class="prov-tag">Mudroljub</span>');
      if (r.minhoquinho.length > 0) prov.push('<span class="prov-tag">Minhoquinho</span>');
      if (prov.length === 0) prov.push('<span class="prov-tag">Roda Orbital ★</span>');

      return `
        <tr>
          <th scope="row" data-label="Technique">
            <strong>${m.name}</strong>
            <div style="font-size:.76rem;color:var(--text-muted);font-weight:400">${m.english ?? ''}</div>
          </th>
          <td data-label="Iteration">
            <span class="era-tag era-${itNum}">${itLabel}</span>
          </td>
          <td data-label="Category & Command">
            <div>${m.category ?? 'Core'}</div>
            <div style="margin-top:.2rem"><kbd>${m.input}</kbd> <span style="font-size:.75rem;color:var(--text-muted)">from ${m.from.join('/')}</span></div>
          </td>
          <td data-label="Frame Data">${frameSummary}</td>
          <td data-label="Flow Routes"><span class="cancel-chain">${cancels}</span></td>
          <td data-label="Provenance">${prov.join('')}</td>
          <td data-label="Inspect 3D">
            <a class="mini-btn secondary" href="./moves.html?move=${m.id}">🕺 3D View</a>
          </td>
        </tr>
      `;
    })
    .join('');
}

for (const chip of iterFilterChips) {
  chip.addEventListener('click', () => {
    activeIterFilter = (chip.dataset.iter as 'ALL' | '1' | '3' | '5') ?? 'ALL';
    for (const c of iterFilterChips) {
      c.setAttribute('aria-pressed', String(c === chip));
    }
    renderMoveIndex();
  });
}

searchInput.addEventListener('input', renderMoveIndex);
catSelect.addEventListener('change', renderMoveIndex);
sourceSelect.addEventListener('change', renderMoveIndex);

renderMoveIndex();
