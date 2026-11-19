// Roadmap to the platinum, built from the official trophy descriptions:
// which story chapters and missions, which collectibles and counts, in what
// order. Stage ids match the "stage" field of app/data/trophies.json.
export const ROADMAP_STAGES = [
  {
    id: 'stage1',
    title: 'Before you start',
    text: 'Turn spoilers on in this guide, set a manual save at the start of every chapter, and never use cheats on your trophy save — they switch off trophies and saving. There is no mission replay, so the saves are your only way back.',
    names: [],
  },
  {
    id: 'stage2',
    title: 'Chapter 1 — the one missable trophy',
    text: 'Play the opening, then finish Chapter 1. Do Lucia’s balcony meditation before the chapter ends — it is the only missable trophy in the game. Keep a Chapter 1 save until Positive Mental Attitude pops.',
    names: ['Just Like Paradise', 'Paradise Lost', 'Positive Mental Attitude'],
  },
  {
    id: 'stage3',
    title: 'Chapters 2–4 — the story opens up',
    text: 'Character switching opens in Chapter 2, and with it the partner trophies, the garage and Scooter Bros apps, and most activities. Chapter 3 brings the Snap Gun for jewelry stores; Chapter 4 brings the bank vaults.',
    names: ['T**s Ass Drug Money', 'Vice City, Baby!', 'Top Of The World, Ma', 'Trust', 'Break the Bank', 'Family Matters', 'DWNFALL', 'Hi-Jacked', 'Snow Storm', 'Retail Therapy', 'Sneakthief', 'Little Boxes', 'On the Spot', 'The Goodtime State'],
  },
  {
    id: 'stage4',
    title: 'The final mission',
    text: 'Keep an untouched manual save from just before the final mission. Finishing it earns the second Gold — then everything outside the story stays open, including the side-story finales and the 100% checklist.',
    names: ['You Gotta Know When to Get Off', 'Hot Together', 'Maximum Withdrawal', 'A Classic Blitz Play', 'Catch Me If You Can'],
  },
  {
    id: 'stage5',
    title: 'After the credits — clean-up',
    text: 'Finish the five side-story finales, the stranger strands, the collectibles and the grinds: 250 stunts, 50 challenges, 100 vehicles found, 100 WAiNK locations, 3 card sets, 42 shooting-range golds, 14 drone-race wins, 20 race wins, 39 illegal operations, and 500 Criminal Profile actions.',
    names: ['Strangers & Freaks', 'Cunning Stunts', 'The Shootist', 'Top Fun', 'Earn Cash, Not Kudos', 'Baited My Tackle', 'Stick Fiddler', 'One Last Thing', 'Don’t Touch My Deck', 'You WAiNKer!', 'Whip It Good', 'Dime on the Dollar', 'Treat Yo Self', 'Pest Control', 'Gunslinger', 'Fair Game', 'This Was No Boat Accident', 'The Lone Rider', 'Road to Rehabilitation', 'Supply & Demand', 'Spin On This!', 'Personal Best', 'Actions Speak Louder', 'In The Beginning…', 'Capital Offense', 'Bad Luck, I Guess', 'The Truth Is Out There', 'Ten Pin', 'Let’s Go Bowling'],
  },
  {
    id: 'stage6',
    title: '100% and the platinum',
    text: 'When the 100% checklist is done, A Long Road (Gold) pops — and Vice Got a Price! follows at once. Roughly 200 hours in all, difficulty about 4/10: long, not hard.',
    names: ['A Long Road', 'Vice Got a Price!'],
  },
];

// Counts the guides report for the 100% completion checklist.
export const HUNDRED_PERCENT = [
  'Stunts: 300 of 397 (250 for the trophy)',
  'Challenges: 70 of 80 (50 for the trophy)',
  'Vehicles discovered: 200 of 277 (100 for the trophy)',
  'Bank vaults: all 8 (5 for the trophy)',
  'Illegal operations: all 39 (one per gang of 9 for the trophy)',
  'Collectible card sets: 3 of 18 for the trophy',
  'Shooting Range gold medals: all 42',
  'Top Fun drone race locations: all 14',
  'Meditation spots: all 18',
  'Garages: all 8',
  'Activities tried: all 9 types',
];

export function renderRoadmap(intoStages, intoHundred, trophiesByName, earned) {
  intoStages.replaceChildren();
  for (const [index, stage] of ROADMAP_STAGES.entries()) {
    const li = document.createElement('li');
    const title = document.createElement('b');
    const num = document.createElement('span');
    num.className = 'n';
    num.textContent = String(index + 1);
    title.append(num, document.createTextNode(stage.title));
    const text = document.createElement('p');
    text.textContent = stage.text;
    li.append(title, text);
    if (stage.names.length > 0) {
      const names = document.createElement('div');
      names.className = 'names';
      const done = stage.names.filter((name) => earned.has(name)).length;
      names.textContent = `${done}/${stage.names.length} earned: ${stage.names.join(' · ')}`;
      li.append(names);
    }
    intoStages.append(li);
  }
  intoHundred.replaceChildren();
  for (const line of HUNDRED_PERCENT) {
    const li = document.createElement('li');
    li.textContent = line;
    intoHundred.append(li);
  }
}
