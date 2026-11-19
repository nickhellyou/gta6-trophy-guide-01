// Saved progress for the Leonida Trophy Guide: one localStorage key, plus
// export to a file and import back with the names checked against the list.
export const STORAGE_KEY = "gta6-trophy-guide-v1";
export const EXPORT_FILENAME = "gta6-trophy-progress.json";

// Read the earned set out of localStorage. Anything that is not a clean
// array of strings is treated as no progress rather than throwing.
export function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((name) => typeof name === "string"));
  } catch {
    return new Set();
  }
}

// Write the earned set back. Stored as a sorted array so two identical
// checklists always serialise the same way.
export function saveEarned(earned) {
  const names = [...earned].sort();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
}

// Flip one trophy and persist the result. Returns the new earned state.
export function toggleEarned(earned, name) {
  const next = new Set(earned);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  saveEarned(next);
  return next;
}

// Serialise the earned set for export. The file only ever names trophies.
export function exportText(earned) {
  return JSON.stringify(
    { guide: "Leonida Trophy Guide", earned: [...earned].sort() },
    null,
    2,
  );
}

// Parse an imported file. Returns { earned } on success, or { error } when
// the file is not JSON, has no earned list, or names a trophy that is not
// on the list. Unknown names are rejected, never silently dropped, so a
// file from another guide cannot pollute the checklist.
export function parseImport(text, validNames) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "That file is not valid JSON." };
  }
  const list = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(list)) {
    return { error: "That file has no earned trophy list." };
  }
  const known = new Set(validNames);
  const unknown = list.filter(
    (name) => typeof name !== "string" || !known.has(name),
  );
  if (unknown.length > 0) {
    return { error: `Unknown trophy in file: ${unknown[0]}` };
  }
  return { earned: new Set(list) };
}

// A progress store: the earned set plus the small operations the page needs.
// app.js owns one store and re-renders after every change.
export function createProgressStore() {
  let earned = loadEarned();
  return {
    earned() {
      return earned;
    },
    has(name) {
      return earned.has(name);
    },
    toggle(name) {
      earned = toggleEarned(earned, name);
      return earned;
    },
    replace(next) {
      earned = new Set(next);
      saveEarned(earned);
      return earned;
    },
    clear() {
      earned = new Set();
      saveEarned(earned);
      return earned;
    },
  };
}
