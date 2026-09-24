'use strict';
// =====================================================================================
//  BALANCE CONFIG — every tunable number and all content definitions live here.
//  Systems read this generically; never hardcode balance values elsewhere.
// =====================================================================================
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  const CONFIG = {
    tickRate: 20,                 // simulation ticks per second
    loop: {
      catchupThreshold: 10,       // seconds of backlog handled by large-step simulation instead of ticks
      welcomeBackMin: 120,        // show the welcome-back panel for gaps longer than this (seconds)
      maxTicksPerFrame: 100,
    },
    ui: { refreshHz: 10, logMax: 150, flavorInterval: [45, 110] },
    autosaveSeconds: 30,
    offline: {
      baseCapHours: 24,           // default offline cap (power tree adds more)
      maxSteps: 1500,             // offline simulation resolution
      maxStepSeconds: 60,
      minStepSeconds: 0.25,
    },

    // ---------------------------------------------------------------- resources
    // legacy: weight used for prestige "legacy" (value of 1 unit produced)
    resources: {
      food:  { name: 'Food',  era: 0, color: '#d9a55b', legacy: 1,  desc: 'Roots, game and grain. The first currency of survival.' },
      stone: { name: 'Stone', era: 0, color: '#a39a8c', legacy: 3,  desc: 'Flint and fieldstone, shaped by patient hands.' },
    },

    // ---------------------------------------------------------------- eras
    // milestone conditions: {type:'res', res, amount} | {type:'research', id} | {type:'gen', gen, count}
    eras: [
      {
        id: 'stone', name: 'Stone Age', theme: 'stone',
        desc: 'Fire, hunger and the long dark. Scattered bands follow a stranger who never ages.',
        milestone: [
          { type: 'res', res: 'food', amount: 5e4 },
          { type: 'res', res: 'stone', amount: 1.2e4 },
          { type: 'research', id: 'copper_lore' },
        ],
      },
    ],

    // ---------------------------------------------------------------- forage (Stone Age click)
    forage: {
      gain: { food: 1, stone: 0.25 },   // base per click
      rateShare: 0,                     // + this many seconds of production per click (research raises it)
    },

    // ---------------------------------------------------------------- generators
    // produces: {res: perSecondEach}; cost: {res: [base, growth]}
    generators: {
      gatherer: { era: 0, name: 'Gatherer', icon: 'gatherer', desc: 'Forages roots, nuts and berries.',
        produces: { food: 0.4 }, cost: { food: [10, 1.12] } },
      knapper: { era: 0, name: 'Flint Knapper', icon: 'knapper', desc: 'Strikes flint into blades and scrapers.',
        produces: { stone: 0.25 }, cost: { food: [30, 1.13] } },
      hunters: { era: 0, name: 'Hunting Party', icon: 'hunters', desc: 'Runs down herds across the steppe.',
        produces: { food: 3 }, cost: { food: [220, 1.14], stone: [30, 1.12] } },
      hearth: { era: 0, name: 'Hearth Circle', icon: 'hearth', desc: 'A settled camp around an undying fire.',
        produces: { food: 18, stone: 4 }, cost: { food: [2800, 1.15], stone: [600, 1.14] } },
    },

    // Purchasable ×mult upgrades unlocked at owned-count thresholds (per generator).
    genUpgrades: {
      thresholds: [10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000],
      mult: 2,
      costFactor: 4,       // × cost of the threshold-th unit
      names: ['Refined', 'Seasoned', 'Masterwork', 'Exalted', 'Storied', 'Legendary', 'Mythic', 'Eternal',
        'Undying', 'Transcendent', 'Primordial', 'Sovereign', 'Celestial', 'Absolute', 'Infinite', 'Aeonic'],
    },

    // ---------------------------------------------------------------- research
    // cost: {res: amount} (one-shot) — repeatable techs use {res:[base,growth]} and maxLevel.
    // tier: column in the era's tree; prereq: ids that must be researched first.
    research: {
      fire: { era: 0, tier: 0, name: 'Tamed Fire', cost: { food: 60 },
        desc: 'Cooked food feeds more mouths.',
        effects: [{ type: 'prod', res: 'food', mult: 1.5 }, { type: 'click', mult: 2 }] },
      tools: { era: 0, tier: 0, name: 'Knapped Tools', cost: { food: 150, stone: 30 },
        desc: 'Sharper edges, faster work.',
        effects: [{ type: 'prod', gen: 'knapper', mult: 2 }, { type: 'clickRate', add: 0.05 }] },
      spears: { era: 0, tier: 1, name: 'Fire-hardened Spears', cost: { food: 700, stone: 150 }, prereq: ['fire'],
        desc: 'Hunting parties return more often.',
        effects: [{ type: 'prod', gen: 'hunters', mult: 2 }] },
      shelter: { era: 0, tier: 1, name: 'Hide Shelters', cost: { food: 1300, stone: 400 }, prereq: ['tools'],
        desc: 'Bands winter in one place.',
        effects: [{ type: 'prod', gen: 'gatherer', mult: 2 }, { type: 'prod', gen: 'knapper', mult: 1.5 }] },
      ancestor_rites: { era: 0, tier: 1, name: 'Ancestor Rites', cost: { food: 2500, stone: 600 }, prereq: ['fire'],
        desc: 'The first shamans learn to hear you. Unlocks Shaman agents.',
        effects: [{ type: 'unlock', key: 'agent:shaman' }, { type: 'prod', era: 0, mult: 1.2 }] },
      herb_lore: { era: 0, tier: 2, name: 'Herb Lore', cost: { food: 6000, stone: 1500 }, prereq: ['shelter'],
        desc: 'Fewer die of winter fevers.',
        effects: [{ type: 'prod', res: 'food', mult: 1.5 }, { type: 'clickRate', add: 0.05 }] },
      cave_paintings: { era: 0, tier: 2, name: 'Cave Paintings', cost: { food: 9000, stone: 2500 }, prereq: ['ancestor_rites'],
        desc: 'Memory outlives the rememberer.',
        effects: [{ type: 'prod', era: 0, mult: 1.5 }] },
      copper_lore: { era: 0, tier: 3, name: 'Copper Lore', cost: { food: 25000, stone: 6000 }, prereq: ['spears', 'herb_lore'],
        desc: 'Green stone that melts in the fire. The Bronze Age waits.',
        effects: [{ type: 'prod', res: 'stone', mult: 1.5 }] },
    },

    // Display names for {type:'unlock'} keys
    unlockNames: {
      'agent:shaman': 'Shaman agents',
    },

    // Later-era resources multiply all earlier eras: mult = 1 + k * log10(1 + amount)
    synergies: [],

    // ---------------------------------------------------------------- flavor text for the event log
    flavor: {
      stone: [
        'A child is born beneath a hunter\'s moon.',
        'The tribe follows the herds south as frost creeps in.',
        'Someone presses an ochre hand to the cave wall. It is not the first time you have seen it.',
        'Wolves circle the camp but do not approach the fire.',
        'An elder tells a story about a stranger who never grows old.',
        'A new flint seam is found in the riverbed.',
        'The drums carry across the valley long after dark.',
      ],
    },
  };

  IG.CONFIG = CONFIG;
})();
