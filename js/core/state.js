'use strict';
// Game state factory. `perm` survives prestige; `run` is rebuilt on every prestige.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  function resourceMap() {
    const out = {};
    for (const r in IG.CONFIG.resources) out[r] = D(0);
    return out;
  }

  function newRun() {
    const C = IG.CONFIG;
    const gens = {};
    for (const id in C.generators) gens[id] = { n: 0, up: 0 };
    return {
      time: 0,                 // seconds in this run
      era: 0,
      resources: resourceMap(),
      produced: resourceMap(), // gross production this run (legacy / stats)
      eraBase: resourceMap(),  // `produced` when the current era began (cumulative era milestones)
      gens,
      research: {},            // id -> level
      clicks: 0,
      eraTimes: [0],           // run time when each era was reached
      flavorTimer: 30,
      agents: [],
      agentSeq: 0,
      trade: {},               // routeId -> level
      rites: { active: {}, uses: {} },
      grid: {},                // sectorId -> level
      compute: {},             // programId -> share (0..1)
      mega: { progress: {}, done: {}, active: null },
      exp: null,               // interstellar expansion state (created on entering the era)
      war: null,               // galactic war state
    };
  }

  function newPerm() {
    return {
      pp: 0,                   // unspent prestige points
      ppTotal: 0,              // lifetime earned
      prestiges: 0,
      tree: {},                // power tree node -> level
      highestEra: 0,
      achievements: {},        // id -> playtime unlocked
      stats: {
        lifetime: resourceMap(),
        bestEraTimes: [],      // fastest run time to reach each era
        bestWorlds: 0,
        frontsWon: 0,
        frontsLost: 0,
        totalClicks: 0,
        runs: [],              // summaries of recent runs
      },
    };
  }

  function newState() {
    const t = IG.util.now();
    return {
      version: IG.SAVE_VERSION || 1,
      meta: {
        created: t,
        lastSeen: t,
        playtime: 0,
        devMode: false,
        devMult: 1,
        seed: Math.floor(Math.random() * 1e9),
      },
      settings: {
        numberFormat: 'suffix',
        mute: false,
        volume: 0.5,
        buyMult: '1',
        popups: true,
        particles: true,
        confirmPrestige: true,
        agentsPaused: false,
      },
      perm: newPerm(),
      run: newRun(),
      log: [],
      ui: { tab: 'production', seenTabs: {} },
    };
  }

  IG.State = { newState, newRun, newPerm, resourceMap };
})();
