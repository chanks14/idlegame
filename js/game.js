'use strict';
// The single simulation step. Used by the browser loop, offline simulation and the headless simulator.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  const preHooks = [];   // run before production (timers that affect multipliers)
  const hooks = [];      // run after production (expansion, war, agents)
  const slowHooks = [];  // run ~once per second (achievements, unlock checks)
  let slowAcc = 0;

  function tick(dt) {
    const s = IG.state;
    s.run.time += dt;
    s.meta.playtime += dt;
    for (const h of preHooks) h(dt, s);
    if (IG.Mods.dirty) IG.Mods.compile();
    IG.Mods.dynamic();
    IG.Prod.tick(dt);
    for (const h of hooks) h(dt, s);
    slowAcc += dt;
    if (slowAcc >= 1) {
      slowAcc = 0;
      for (const h of slowHooks) h(s);
    }
    // ambient flavor messages
    s.run.flavorTimer -= dt;
    if (s.run.flavorTimer <= 0 && !IG.Bus.muted) {
      const iv = IG.CONFIG.ui.flavorInterval;
      s.run.flavorTimer = iv[0] + Math.random() * (iv[1] - iv[0]);
      const pool = IG.CONFIG.flavor[IG.CONFIG.eras[s.run.era].theme];
      if (pool && pool.length) IG.Log.add(IG.util.pick(pool), 'flavor');
    }
  }

  function newGame() {
    IG.state = IG.State.newState();
    IG.Mods.dirty = true;
    IG.Mods.compile();
    for (const fn of Game.onNewRun) fn(IG.state);
    IG.Mods.dirty = true;
    IG.Mods.compile();
    IG.Mods.dynamic();
    IG.Prod.computeRates();
  }

  const Game = {
    tick, newGame,
    onNewRun: [], // fn(state) — apply starting bonuses for a fresh run
    addPreHook(fn) { preHooks.push(fn); },
    addHook(fn) { hooks.push(fn); },
    addSlowHook(fn) { slowHooks.push(fn); },
    // Rebuild derived caches after loading a state.
    refresh() {
      IG.Mods.dirty = true;
      IG.Mods.compile();
      IG.Mods.dynamic();
      IG.Prod.computeRates();
    },
  };
  IG.Game = Game;
})();
