'use strict';
// Achievements: checked about once per second; each grants a small permanent production multiplier.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  function upgradesOwned(s) {
    let t = 0;
    for (const id in s.run.gens) t += s.run.gens[id].up;
    return t;
  }

  // cond evaluators: (cond, state) -> bool
  const COND = {
    res: (c, s) => s.run.produced[c.res] && s.run.produced[c.res].gte(c.amount),
    era: (c, s) => s.perm.highestEra >= c.era,
    gen: (c, s) => s.run.gens[c.gen] && s.run.gens[c.gen].n >= c.count,
    totalGens: (c) => IG.Prod.totalGenerators() >= c.count,
    upgrades: (c, s) => upgradesOwned(s) >= c.count,
    research: (c) => IG.Research.count() >= c.count,
    agents: (c, s) => s.run.agents.length >= c.count,
    agentLevel: (c) => IG.Agents.maxLevel() >= c.level,
    clicks: (c, s) => s.perm.stats.totalClicks >= c.count,
    tradeLevels: (c) => IG.Trade.totalLevels() >= c.count,
    rites: (c, s) => (s.run.rites.total || 0) >= c.count,
    gridLevel: (c, s) => Object.values(s.run.grid).some((l) => l >= c.level),
    computeAll: () => Object.keys(IG.CONFIG.compute.programs).every((id) => IG.Compute.share(id) > 0.05),
    mega: (c) => IG.Mega.count() >= c.count,
    megaAll: () => Object.keys(IG.CONFIG.megaprojects.list).every((id) => IG.Mega.done(id)),
    playtime: (c, s) => s.meta.playtime >= c.sec,
    prestiges: (c, s) => s.perm.prestiges >= c.count,
    nodes: (c, s) => Object.values(s.perm.tree).reduce((a, b) => a + b, 0) >= c.count,
    ppSpent: (c, s) => (s.perm.ppSpent || 0) >= c.count,
    worlds: (c) => !!IG.Expansion && IG.Expansion.totalWorlds() >= c.count,
    ships: (c, s) => !!s.run.exp && (s.run.exp.shipsLaunched || 0) >= c.count,
    habTech: (c) => !!IG.Research && IG.Research.level('terraform') >= c.level,
    fronts: (c, s) => s.perm.stats.frontsWon >= c.count,
    frontsLost: (c, s) => s.perm.stats.frontsLost >= c.count,
    fleet: (c) => !!IG.War && IG.War.fleetStrength().gte(c.amount),
    bigNumber: (c, s) => Object.values(s.run.resources).some((v) => v.exponent >= 308) ||
      (!!IG.Prod.cache.gross && Object.values(IG.Prod.cache.gross).some((v) => v.exponent >= 308)),
  };

  function list() { return IG.CONFIG.achievements.list; }
  function has(id) { return IG.state.perm.achievements[id] !== undefined; }
  function count() { return Object.keys(IG.state.perm.achievements).length; }

  function check(s) {
    for (const a of list()) {
      if (s.perm.achievements[a.id] !== undefined) continue;
      const fn = COND[a.cond.type];
      let ok = false;
      try { ok = fn ? !!fn(a.cond, s) : false; } catch (e) { ok = false; }
      if (ok) {
        s.perm.achievements[a.id] = s.meta.playtime;
        IG.Mods.dirty = true;
        IG.Log.add('Achievement: ' + a.name + ' — ' + a.desc, 'achievement');
        IG.Bus.emit('achievement', a);
      }
    }
  }

  function mult() { return Math.pow(IG.CONFIG.achievements.multEach, count()); }

  IG.Game.addSlowHook(check);
  IG.Mods.registerSource(function (s, push) {
    const n = Object.keys(s.perm.achievements).length;
    if (n) push({ type: 'global', mult: IG.CONFIG.achievements.multEach }, n);
  });

  IG.Achievements = { list, has, count, check, mult, COND };
})();
