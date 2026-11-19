// Leonida Trophy Guide: checklist, filters, spoiler setting, detail panel
// with a cited guide per trophy, and a roadmap to the platinum.
// Data: app/data/trophies.json — official names, descriptions and grades,
// guides in our own words with their sources. Progress: state.js.
import { loadEarned, saveEarned, downloadProgress, parseImportedProgress } from './state.js';
import { renderRoadmap } from './roadmap.js';

const KIND_LABELS = {
  story: 'Story',
  activities: 'Activities',
  heists: 'Heists & combat',
  cars: 'Cars, property & money',
  secrets: 'Side stories & secrets',
  platinum: 'Platinum & 100%',
};
// Trophies about finding collectibles, for the Collectibles filter.
const COLLECTIBLE_NAMES = new Set(['Don’t Touch My Deck', 'You WAiNKer!', 'Whip It Good']);

const listEl = document.getElementById('trophies');
const detailEl = document.getElementById('detail');
const emptyEl = document.getElementById('empty');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const missableEl = document.getElementById('missableOnly');
const earnedOnlyEl = document.getElementById('earnedOnly');
const spoilersEl = document.getElementById('spoilers');

let doc = null;
let earned = loadEarned();
let selectedName = 'Positive Mental Attitude';

function isSpoilerHidden(trophy) {
  return spoilersEl.checked && trophy.kind === 'story' && !earned.has(trophy.name);
}

function visibleName(trophy) {
  return isSpoilerHidden(trophy) ? 'Hidden story trophy' : trophy.name;
}

function visibleDescription(trophy) {
  return isSpoilerHidden(trophy)
    ? 'Story trophy — its name and description stay hidden until you earn it.'
    : trophy.description;
}

function gradeBadge(grade) {
  const span = document.createElement('span');
  span.className = `badge ${grade}`;
  span.textContent = grade;
  return span;
}

function kindTag(trophy) {
  const span = document.createElement('span');
  span.className = 'tag';
  span.textContent = KIND_LABELS[trophy.kind] ?? trophy.kind;
  return span;
}

function trophyMatches(trophy) {
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  const kind = kindEl.value;
  if (kind === 'online') return false; // No online trophies: all 55 are single-player.
  if (kind === 'collectibles') {
    if (!COLLECTIBLE_NAMES.has(trophy.name)) return false;
  } else if (kind !== 'all' && trophy.kind !== kind) {
    return false;
  }
  if (gradeEl.value !== 'all' && trophy.grade !== gradeEl.value) return false;
  if (missableEl.checked && !trophy.missable) return false;
  if (earnedOnlyEl.checked && !earned.has(trophy.name)) return false;
  return true;
}

function renderProgress() {
  const total = doc.trophies.length;
  const n = earned.size;
  document.getElementById('earnedCount').textContent = `${n} / ${total}`;
  document.getElementById('progressPct').textContent =
    n === total ? 'Platinum earned — Vice Got a Price!' : `${Math.round((n / total) * 100)}% to the platinum`;
  document.getElementById('progressFill').style.width = `${(n / total) * 100}%`;
  const counts = document.getElementById('gradeCounts');
  counts.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const all = doc.trophies.filter((t) => t.grade === grade).length;
    const got = doc.trophies.filter((t) => t.grade === grade && earned.has(t.name)).length;
    const span = document.createElement('span');
    span.textContent = `${grade}: ${got}/${all}`;
    counts.append(span);
  }
}

function renderDetail() {
  const trophy = doc.trophies.find((t) => t.name === selectedName) ?? doc.trophies[0];
  detailEl.replaceChildren();
  const hidden = isSpoilerHidden(trophy);
  const title = document.createElement('h3');
  title.textContent = hidden ? 'Hidden story trophy' : trophy.name;
  detailEl.append(title);
  const meta = document.createElement('p');
  meta.className = 'facts';
  meta.append(gradeBadge(trophy.grade), document.createTextNode(' '));
  const kindText = document.createElement('span');
  kindText.textContent = KIND_LABELS[trophy.kind] ?? trophy.kind;
  meta.append(kindText);
  if (trophy.hidden) meta.append(document.createTextNode(' · Hidden on PlayStation until earned'));
  if (trophy.count != null) meta.append(document.createTextNode(` · Count: ${trophy.count.toLocaleString('en-US')}`));
  detailEl.append(meta);
  const quote = document.createElement('blockquote');
  quote.textContent = hidden
    ? 'Official description hidden with the spoiler setting — earn this trophy to reveal it.'
    : `“${trophy.description}” — official description`;
  detailEl.append(quote);
  if (trophy.missable) {
    const warn = document.createElement('p');
    warn.className = 'warnbox';
    warn.textContent = '⚠ Missable — read the Chapter 1 warning at the top of this page before you play past it.';
    detailEl.append(warn);
  }
  const guide = document.createElement('p');
  guide.className = 'guide';
  guide.textContent = hidden ? 'Guide hidden until earned.' : trophy.guide;
  detailEl.append(guide);
  if (!hidden) {
    const srcHead = document.createElement('p');
    srcHead.className = 'facts';
    const b = document.createElement('b');
    b.textContent = 'Sources for this guide:';
    srcHead.append(b);
    detailEl.append(srcHead);
    const list = document.createElement('ul');
    list.className = 'sources';
    for (const source of trophy.sources) {
      const li = document.createElement('li');
      if (source.url) {
        const a = document.createElement('a');
        a.href = source.url;
        a.textContent = source.name;
        a.rel = 'noopener';
        li.append(a);
      } else {
        li.textContent = source.name;
      }
      list.append(li);
    }
    detailEl.append(list);
  }
  const earnedNote = document.createElement('p');
  earnedNote.className = 'facts';
  earnedNote.textContent = earned.has(trophy.name)
    ? '✓ Earned — ticked in this browser.'
    : 'Not earned yet — tick the box in the list when it pops.';
  detailEl.append(earnedNote);
}

function renderList() {
  listEl.replaceChildren();
  const shown = doc.trophies.filter(trophyMatches);
  if (kindEl.value === 'online') {
    emptyEl.hidden = false;
    emptyEl.textContent = 'No online trophies — all 55 trophies are single-player and offline. Nothing to filter here.';
  } else {
    emptyEl.hidden = shown.length > 0;
    emptyEl.textContent = 'No trophies match these filters. Try clearing the search or choosing another kind.';
  }
  document.getElementById('filterCount').textContent =
    kindEl.value === 'online' ? '' : `Showing ${shown.length} of ${doc.trophies.length} trophies`;
  for (const trophy of shown) {
    const li = document.createElement('li');
    if (earned.has(trophy.name)) li.classList.add('earned');
    if (trophy.name === selectedName) li.classList.add('selected');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(trophy.name);
    box.setAttribute('aria-label', `Earned: ${visibleName(trophy)}`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(trophy.name);
      else earned.delete(trophy.name);
      saveEarned(earned);
      renderAll();
    });
    box.addEventListener('click', (event) => event.stopPropagation());
    const main = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'tname';
    name.textContent = visibleName(trophy);
    const desc = document.createElement('div');
    desc.className = 'tdesc';
    desc.textContent = visibleDescription(trophy);
    const meta = document.createElement('div');
    meta.className = 'tmeta';
    meta.append(gradeBadge(trophy.grade), kindTag(trophy));
    if (trophy.missable) {
      const flag = document.createElement('span');
      flag.className = 'tag missable';
      flag.textContent = 'Missable';
      meta.append(flag);
    }
    if (trophy.hidden) {
      const flag = document.createElement('span');
      flag.className = 'tag hidden-t';
      flag.textContent = 'Hidden';
      meta.append(flag);
    }
    main.append(name, desc, meta);
    li.append(box, main);
    li.addEventListener('click', () => {
      selectedName = trophy.name;
      renderAll();
      detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    listEl.append(li);
  }
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap(
    document.getElementById('stages'),
    document.getElementById('hundred'),
    null,
    earned,
  );
}

function applyUrlParams() {
  const params = new URLSearchParams(location.search);
  const kind = params.get('kind');
  if (kind && [...kindEl.options].some((o) => o.value === kind)) kindEl.value = kind;
  const grade = params.get('grade');
  if (grade && [...gradeEl.options].some((o) => o.value === grade)) gradeEl.value = grade;
  const spoilers = params.get('spoilers');
  if (spoilers === 'off') spoilersEl.checked = false;
  if (spoilers === 'on') spoilersEl.checked = true;
  if (params.get('missable') === 'only') missableEl.checked = true;
  const trophy = params.get('trophy');
  if (trophy) {
    const found = doc.trophies.find((t) => String(t.id) === trophy || t.name === trophy);
    if (found) selectedName = found.name;
  }
  const view = params.get('view');
  if (view === 'roadmap' || view === 'missable' || view === 'checklist') {
    document.getElementById(view)?.scrollIntoView();
  }
}

function wireControls() {
  for (const el of [searchEl, kindEl, gradeEl, missableEl, earnedOnlyEl, spoilersEl]) {
    el.addEventListener('input', renderAll);
    el.addEventListener('change', renderAll);
  }
  document.getElementById('exportBtn').addEventListener('click', () => {
    downloadProgress(earned, doc.trophies.length);
  });
  document.getElementById('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const { earned: next, ignored } = parseImportedProgress(
        await file.text(),
        new Set(doc.trophies.map((t) => t.name)),
      );
      earned = next;
      saveEarned(earned);
      renderAll();
      document.getElementById('filterCount').textContent =
        `Imported ${earned.size} earned trophies${ignored ? ` (${ignored} names ignored)` : ''}.`;
    } catch {
      document.getElementById('filterCount').textContent = 'That file is not a trophy progress export.';
    }
    event.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (window.confirm('Clear every tick in this browser?')) {
      earned = new Set();
      saveEarned(earned);
      renderAll();
    }
  });
  for (const tab of document.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => {
      for (const other of document.querySelectorAll('.tab')) other.classList.remove('active');
      tab.classList.add('active');
    });
  }
}

async function boot() {
  const response = await fetch('data/trophies.json');
  doc = await response.json();
  wireControls();
  applyUrlParams();
  renderAll();
  window.__guideReady = true;
}

boot();
