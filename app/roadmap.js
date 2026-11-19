// The road to the platinum, in play order: six stages built from the
// official trophy descriptions, plus the 100% completion checklist whose
// counters run past several trophies' own targets.
export const ROADMAP_STAGES = [
  {
    id: "before-you-start",
    title: "1. Before you start",
    blurb:
      "Start the long grinds on day one: stunts, scans, WAiNK spots and challenges.",
  },
  {
    id: "chapter-1",
    title: "2. Chapter 1 — the one missable",
    blurb:
      "Finish Gone Fishing and Chapter 1, and do the balcony meditation first.",
  },
  {
    id: "chapters-2-4",
    title: "3. Chapters 2–4",
    blurb:
      "Story, heists, vaults, garages and the shooting range open across these chapters.",
  },
  {
    id: "final-mission",
    title: "4. The final mission",
    blurb:
      "Finish the last story mission. Keep a manual save from just before it.",
  },
  {
    id: "after-credits",
    title: "5. After the credits",
    blurb:
      "Side finales, drone races, card sets, garages and secrets stay open.",
  },
  {
    id: "platinum-100",
    title: "6. 100% + platinum",
    blurb:
      "Reach 100% for the gold; the platinum pops with the last trophy.",
  },
];

// The 100% completion counters, as the guides report them. Each line names
// the trophy target first and the 100% target after it, where they differ.
export const HUNDRED_PERCENT = [
  { label: "Stunts", trophy: "250", full: "300" },
  { label: "Shooting Range gold medals", trophy: "42", full: "42" },
  { label: "Top Fun drone race locations won", trophy: "14", full: "14" },
  { label: "Meditation spots", trophy: "18", full: "18" },
  { label: "Collectible card sets", trophy: "3", full: "3 of 18" },
  { label: "Garage properties", trophy: "8", full: "8" },
  { label: "Gangs robbed (illegal operations)", trophy: "9", full: "9 of 39 ops" },
  { label: "Activity types tried", trophy: "9", full: "9" },
  { label: "Bank vaults robbed", trophy: "5", full: "8" },
  { label: "Illegal operations robbed", trophy: "9 gangs", full: "39" },
  { label: "Challenges completed", trophy: "50", full: "70 of 80" },
  { label: "Vehicles discovered", trophy: "100", full: "200 of 277" },
];

// How many trophies of a stage are earned, for the roadmap's counters.
export function stageCounts(trophies, earned) {
  return ROADMAP_STAGES.map((stage) => {
    const members = trophies.filter((t) => t.stage === stage.id);
    const done = members.filter((t) => earned.has(t.name)).length;
    return { ...stage, total: members.length, done };
  });
}
