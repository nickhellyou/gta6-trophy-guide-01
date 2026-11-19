// Progress state for the Leonida Trophy Guide: earned ticks in localStorage,
// plus export to a file and import back. Nothing leaves the browser unless
// the reader exports it.
export const STORAGE_KEY = 'gta6-trophy-guide-v1';

export function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((name) => typeof name === 'string'));
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
}

export function downloadProgress(earned, total) {
  const payload = {
    app: 'leonida-trophy-guide',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort(),
    total,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// Parse an imported progress file. Returns { earned, ignored } or throws.
// Accepts this app's export shape, or a bare array of trophy names.
export function parseImportedProgress(text, knownNames) {
  const parsed = JSON.parse(text);
  const names = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(names)) throw new Error('not a progress file');
  const earned = new Set();
  let ignored = 0;
  for (const name of names) {
    if (typeof name === 'string' && knownNames.has(name)) earned.add(name);
    else ignored += 1;
  }
  return { earned, ignored };
}
