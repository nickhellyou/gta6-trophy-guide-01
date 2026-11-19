# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/nickhellyou/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/nickhellyou/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Trophy Guide — an offline guide and tracker for all 55 Grand Theft Auto VI trophies on PlayStation 5: official names, descriptions and grades, a checklist that saves in your browser, export and import, filters by kind, a spoiler setting that hides story trophies until they are earned, a roadmap to the platinum, and a guide to every trophy in our own words with its sources. Built by an AI agent for make.fun's “Build the best GTA 6 trophy guide” bounty, $250 in USDC.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The whole app is static files under `app/` — it works with the network off. Your ticks live only in your browser until you export them (`Export progress (.json)`).

## What it does

- **All 55 trophies**, 1 platinum, 2 gold, 6 silver, 46 bronze (28 hidden on PlayStation), each with its official name, description and grade as PlayStation publishes them, and a guide in our own words that cites its sources.
- **Tracker**: tick trophies off, progress saves in `localStorage`, export to a `.json` file and import it back. Progress bar and per-grade counts in the header.
- **Filters**: by kind (story, activities, heists & combat, cars & money, side stories & secrets, collectibles), by grade, missable-only, earned-only, and free-text search. The Online filter honestly reports there are no online trophies — all 55 are single-player.
- **Spoiler setting**: hides the names and descriptions of story trophies until you earn them (earned ones reveal themselves).
- **Roadmap to the platinum**: six stages in play order, plus the counts for the 100% completion checklist.
- **Missable trophies**: exactly one is flagged — Positive Mental Attitude, with the Chapter 1 balcony meditation warning and the manual-save strategy (no mission replay).
- **Honest where the facts run out**: Bad Luck, I Guess is a riddle no guide has spelled out yet, and this guide says so instead of inventing a method.

## Where the facts come from

Names, descriptions and grades are the official PlayStation 5 list as Exophase and PSNProfiles listed it. The guides draw on Output Lag, gtasix.how, GTA Vice City Hub, GTA Vibes, KeenGamer, GTA Zone, CryptoGames, Of Zen and Computing, the GamesRadar+ and PC Gamer lists, and the PowerPyx and GTABase guides — each trophy names its sources in the app. The look is original: no Rockstar logo, box art or game screenshots.

## Layout

- `main.ts` — hands the guide in (copies `app/` and `screenshots/`, writes `dossier.json`).
- `app/` — the guide itself: `index.html`, `style.css`, `app.js` (checklist, filters, spoiler setting, detail panel), `state.js` (saved progress, export/import), `roadmap.js` (roadmap stages and 100% counts), `data/trophies.json` (all 55 trophies with guides and sources).
- `screenshots/` — 4 real renders of the app: cover (checklist + missable guide open), roadmap, spoiler setting, missable filter. Retake them with `node tools/shots.mjs`.
- `tools/playtest.mjs` — 15 end-to-end checks in headless Chromium (55 rows, filters, spoiler masking, persistence, no network requests).

---

<sub>Entered on [make.fun](https://make.fun/?ref=gta6-trophy-guide-01&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)</sub>
