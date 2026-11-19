// Leonida Trophy Guide: checklist, filters, spoiler setting, detail panel
// with cited guides, roadmap and missable views. Static data only: the
// trophy list is fetched once from data/trophies.json, and nothing else
// ever leaves the page.
import {
  createProgressStore,
  exportText,
  parseImport,
  EXPORT_FILENAME,
} from "./state.js";
import {
  ROADMAP_STAGES,
  HUNDRED_PERCENT,
  stageCounts,
} from "./roadmap.js";

const KIND_LABELS = {
  story: "Story",
  activities: "Activities",
  heists: "Heists & combat",
  cars: "Cars & money",
  side: "Side stories & secrets",
  platinum: "Platinum & 100%",
  collectibles: "Collectibles",
  online: "Online",
};

const GRADE_LABELS = {
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
};

const DEFAULT_TROPHY = "Positive Mental Attitude";
const SPOILER_NAME = "Hidden story trophy";
const SPOILER_DESC = "Hidden until earned.";

const $ = (id) => document.getElementById(id);

const store = createProgressStore();
let trophies = [];
let selectedName = DEFAULT_TROPHY;

const filters = {
  search: "",
  kind: "all",
  grade: "all",
  missableOnly: false,
  earnedOnly: false,
  spoilers: true,
};

function trophyByRef(ref) {
  if (!ref) return null;
  const want = ref.trim().toLowerCase();
  return (
    trophies.find((t) => t.id === want) ||
    trophies.find((t) => t.name.toLowerCase() === want) ||
    null
  );
}

function isMasked(trophy) {
  return (
    filters.spoilers && trophy.kind === "story" && !store.has(trophy.name)
  );
}

function displayName(trophy) {
  return isMasked(trophy) ? SPOILER_NAME : trophy.name;
}

function displayDescription(trophy) {
  return isMasked(trophy) ? SPOILER_DESC : trophy.description;
}

function matchesFilters(trophy) {
  if (filters.kind === "online") return false;
  if (filters.kind !== "all" && trophy.kind !== filters.kind) return false;
  if (filters.grade !== "all" && trophy.grade !== filters.grade) return false;
  if (filters.missableOnly && !trophy.missable) return false;
  if (filters.earnedOnly && !store.has(trophy.name)) return false;
  if (filters.search) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(filters.search)) return false;
  }
  return true;
}

function gradeCount(grade) {
  const members = trophies.filter((t) => t.grade === grade);
  const done = members.filter((t) => store.has(t.name)).length;
  return `${GRADE_LABELS[grade]} ${done}/${members.length}`;
}

function renderProgress() {
  const done = trophies.filter((t) => store.has(t.name)).length;
  const total = trophies.length;
  $("earnedCount").textContent = `${done} / ${total}`;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $("earnedPct").textContent = `${pct}%`;
  $("progressBar").style.width = `${pct}%`;
  $("progressBar").setAttribute("aria-valuenow", String(pct));
  $("gradeCounts").textContent = ["platinum", "gold", "silver", "bronze"]
    .map(gradeCount)
    .join("  ·  ");
}

function badge(trophy) {
  const bits = [`<span class="pill grade-${trophy.grade}">${GRADE_LABELS[trophy.grade]}</span>`];
  bits.push(`<span class="pill kind">${KIND_LABELS[trophy.kind]}</span>`);
  if (trophy.hidden) bits.push(`<span class="pill flag">Hidden</span>`);
  if (trophy.missable) bits.push(`<span class="pill flag missable">Missable</span>`);
  if (trophy.count != null) {
    bits.push(`<span class="pill count">Target ${trophy.count}</span>`);
  }
  return bits.join(" ");
}

function renderList() {
  const list = $("trophies");
  list.innerHTML = "";
  const shown = trophies.filter(matchesFilters);
  const empty = $("empty");
  if (shown.length === 0) {
    empty.hidden = false;
    empty.textContent =
      filters.kind === "online"
        ? "No online trophies — all 55 are single-player."
        : "No trophies match these filters.";
  } else {
    empty.hidden = true;
    empty.textContent = "";
  }
  for (const trophy of shown) {
    const earned = store.has(trophy.name);
    const li = document.createElement("li");
    li.className = "row" + (earned ? " earned" : "") + (trophy.name === selectedName ? " selected" : "");
    li.dataset.name = trophy.name;
    const label = document.createElement("label");
    label.className = "tick";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = earned;
    box.setAttribute("aria-label", `Earned: ${trophy.name}`);
    box.addEventListener("change", () => {
      store.toggle(trophy.name);
      renderAll();
    });
    label.append(box);
    const body = document.createElement("div");
    body.className = "row-body";
    const name = document.createElement("span");
    name.className = "tname";
    name.textContent = displayName(trophy);
    const desc = document.createElement("span");
    desc.className = "tdesc";
    desc.textContent = displayDescription(trophy);
    const meta = document.createElement("span");
    meta.className = "tmeta";
    meta.innerHTML = badge(trophy);
    body.append(name, desc, meta);
    body.addEventListener("click", () => {
      selectedName = trophy.name;
      renderAll();
      syncDeepLink();
    });
    li.append(label, body);
    list.append(li);
  }
}

function renderDetail() {
  const panel = $("detail");
  const trophy = trophyByRef(selectedName) || trophies[0];
  if (!trophy) {
    panel.innerHTML = "<p>No trophy selected.</p>";
    return;
  }
  const masked = isMasked(trophy);
  const head = document.createElement("div");
  head.className = "detail-head";
  const title = document.createElement("h2");
  title.textContent = masked ? SPOILER_NAME : trophy.name;
  const pills = document.createElement("p");
  pills.className = "tmeta";
  pills.innerHTML = badge(trophy);
  head.append(title, pills);
  panel.innerHTML = "";
  panel.append(head);
  const quote = document.createElement("blockquote");
  quote.textContent = masked ? SPOILER_DESC : `“${trophy.description}”`;
  panel.append(quote);
  if (masked) {
    const note = document.createElement("p");
    note.className = "spoiler-note";
    note.textContent =
      "Spoilers are on: earn this story trophy to reveal its name, description and guide.";
    panel.append(note);
    return;
  }
  const guide = document.createElement("p");
  guide.className = "guide";
  guide.textContent = trophy.guide;
  panel.append(guide);
  // Sources sit directly under the guide, so a reader — and a screenshot —
  // sees where every fact comes from without scrolling past the details.
  const sourcesTitle = document.createElement("h3");
  sourcesTitle.textContent = "Sources for this guide";
  panel.append(sourcesTitle);
  const sources = document.createElement("ul");
  sources.className = "sources";
  for (const source of trophy.sources) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = source.name;
    li.append(link);
    sources.append(li);
  }
  panel.append(sources);
  const facts = document.createElement("ul");
  facts.className = "facts";
  const factRows = [
    ["Grade", GRADE_LABELS[trophy.grade]],
    ["Kind", KIND_LABELS[trophy.kind]],
    ["Hidden on PlayStation", trophy.hidden ? "Yes" : "No"],
    ["Roadmap stage", stageTitle(trophy.stage)],
  ];
  if (trophy.count != null) factRows.push(["Official target", String(trophy.count)]);
  for (const [key, value] of factRows) {
    const li = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = key;
    li.append(strong, document.createTextNode(`: ${value}`));
    facts.append(li);
  }
  panel.append(facts);
  if (trophy.missable) {
    const warn = document.createElement("div");
    warn.className = "warning";
    const warnTitle = document.createElement("strong");
    warnTitle.textContent = "Missable — read this first";
    const warnText = document.createElement("p");
    warnText.textContent =
      "The Chapter 1 balcony meditation is gone once Chapter 1 ends, and there is no mission replay. Keep a manual save from Chapter 1 until this trophy pops.";
    warn.append(warnTitle, warnText);
    panel.append(warn);
  }
}

function stageTitle(id) {
  const stage = ROADMAP_STAGES.find((s) => s.id === id);
  return stage ? stage.title : id;
}

function renderRoadmap() {
  const stages = $("stages");
  stages.innerHTML = "";
  for (const stage of stageCounts(trophies, store.earned())) {
    const li = document.createElement("li");
    li.className = "stage";
    const head = document.createElement("div");
    head.className = "stage-head";
    const title = document.createElement("strong");
    title.textContent = stage.title;
    const count = document.createElement("span");
    count.className = "stage-count";
    count.textContent = `${stage.done} / ${stage.total} earned`;
    head.append(title, count);
    const blurb = document.createElement("p");
    blurb.textContent = stage.blurb;
    li.append(head, blurb);
    stages.append(li);
  }
  const hundred = $("hundredList");
  hundred.innerHTML = "";
  for (const item of HUNDRED_PERCENT) {
    const li = document.createElement("li");
    const label = document.createElement("strong");
    label.textContent = item.label;
    li.append(label, document.createTextNode(` — trophy ${item.trophy}, 100% needs ${item.full}`));
    hundred.append(li);
  }
}

function renderMissable() {
  const box = $("missableList");
  box.innerHTML = "";
  const missable = trophies.filter((t) => t.missable);
  for (const trophy of missable) {
    const card = document.createElement("article");
    card.className = "missable-card";
    const title = document.createElement("h3");
    title.textContent = trophy.name;
    const quote = document.createElement("blockquote");
    quote.textContent = `“${trophy.description}”`;
    const guide = document.createElement("p");
    guide.textContent = trophy.guide;
    const strategy = document.createElement("p");
    strategy.className = "strategy";
    strategy.textContent =
      "Save strategy: the game has 15 manual save slots plus one autosave. Keep one save at the start of every chapter and one untouched save from just before the final mission, and rotate the rest. Never use cheats on your trophy save.";
    card.append(title, quote, guide, strategy);
    box.append(card);
  }
  const count = $("missableCount");
  count.textContent = `${missable.length} missable trophy — every other trophy stays available after the credits.`;
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissable();
}

function setView(view) {
  const names = ["checklist", "roadmap", "missable"];
  const wanted = names.includes(view) ? view : "checklist";
  for (const name of names) {
    $(`view-${name}`).hidden = name !== wanted;
    const button = document.querySelector(`[data-view="${name}"]`);
    if (button) button.setAttribute("aria-pressed", String(name === wanted));
  }
}

function syncDeepLink() {
  const params = new URLSearchParams(window.location.search);
  params.set("trophy", selectedName);
  params.set("spoilers", filters.spoilers ? "on" : "off");
  history.replaceState(null, "", `${window.location.pathname}?${params}`);
}

function download(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function bindControls() {
  $("search").addEventListener("input", (event) => {
    filters.search = event.target.value.trim().toLowerCase();
    renderList();
  });
  $("kind").addEventListener("change", (event) => {
    filters.kind = event.target.value;
    renderList();
  });
  $("grade").addEventListener("change", (event) => {
    filters.grade = event.target.value;
    renderList();
  });
  $("missableOnly").addEventListener("change", (event) => {
    filters.missableOnly = event.target.checked;
    renderList();
  });
  $("earnedOnly").addEventListener("change", (event) => {
    filters.earnedOnly = event.target.checked;
    renderList();
  });
  $("spoilers").addEventListener("change", (event) => {
    filters.spoilers = event.target.checked;
    renderAll();
  });
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      setView(button.dataset.view);
      const params = new URLSearchParams(window.location.search);
      params.set("view", button.dataset.view);
      history.replaceState(null, "", `${window.location.pathname}?${params}`);
    });
  });
  $("exportBtn").addEventListener("click", () => {
    download(EXPORT_FILENAME, exportText(store.earned()));
  });
  $("importFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    const status = $("importStatus");
    if (!file) return;
    const text = await file.text();
    const result = parseImport(text, trophies.map((t) => t.name));
    if (result.error) {
      status.textContent = result.error;
      return;
    }
    store.replace(result.earned);
    status.textContent = `Imported ${result.earned.size} earned trophies.`;
    renderAll();
    event.target.value = "";
  });
}

function applyDeepLinks() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  if (view) setView(view);
  const spoilers = params.get("spoilers");
  if (spoilers === "on" || spoilers === "off") {
    filters.spoilers = spoilers === "on";
    $("spoilers").checked = filters.spoilers;
  }
  const kind = params.get("kind");
  if (kind && [...$("kind").options].some((o) => o.value === kind)) {
    filters.kind = kind;
    $("kind").value = kind;
  }
  if (params.get("missable") === "only") {
    filters.missableOnly = true;
    $("missableOnly").checked = true;
  }
  const trophy = trophyByRef(params.get("trophy"));
  if (trophy) selectedName = trophy.name;
}

async function boot() {
  const response = await fetch("data/trophies.json");
  const data = await response.json();
  trophies = data.trophies;
  bindControls();
  applyDeepLinks();
  renderAll();
  window.__guideReady = true;
}

boot();
