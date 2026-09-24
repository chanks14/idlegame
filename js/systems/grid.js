'use strict';
// Industrial mechanic — Power Grid: electrify sectors for multipliers; each level adds continuous energy upkeep.
// If energy runs dry, the grid browns out and all sector bonuses scale down by supply / upkeep.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  function G() { return IG.CONFIG.grid; }
  function unlocked() { return !!IG.Mods.get().unlocks[G().unlock]; }
  function level(id) { return IG.state.run.grid[id] || 0; }

  function upkeep(id, lv) {
    const L = lv === undefined ? level(id) : lv;
    if (L <= 0) return D(0);
    const sec = G().sectors[id];
    return D(sec.drain).mul(D(G().drainGrowth).pow(L - 1)).mul(IG.Mods.get().gridDrain);
  }

  function totalUpkeep() {
    let t = D(0);
    for (const id in G().sectors) t = t.add(upkeep(id));
    return t;
  }

  function perLevel() { return 1 + (G().multPerLevel - 1) * IG.Mods.get().gridMult; }
  function mult(id, lv) { return D(perLevel()).pow(lv === undefined ? level(id) : lv); }

  function raiseCost(id) {
    return { energy: upkeep(id, level(id) + 1).mul(G().raiseCostSeconds) };
  }

  function raise(id, silent) {
    if (!unlocked()) return false;
    const c = raiseCost(id);
    if (!IG.Prod.canAfford(c)) return false;
    IG.Prod.pay(c);
    IG.state.run.grid[id] = level(id) + 1;
    if (!silent) IG.Bus.emit('purchase', { kind: 'grid', id });
    return true;
  }

  function lower(id) {
    if (level(id) <= 0) return false;
    IG.state.run.grid[id] = level(id) - 1;
    return true;
  }

  const Grid = { unlocked, level, upkeep, totalUpkeep, perLevel, mult, raiseCost, raise, lower, efficiency: 1 };

  IG.Mods.registerDynamic(function (s, dyn) {
    if (!s.run.grid) return;
    const up = totalUpkeep();
    if (up.lte(0)) { Grid.efficiency = 1; return; }
    const stock = s.run.resources.energy;
    const gross = (IG.Prod.cache.gross && IG.Prod.cache.gross.energy) || D(0);
    // Stock covers at least one second of upkeep → full power; otherwise limited by production.
    let eff = 1;
    if (stock.lt(up)) eff = Math.min(1, gross.div(up).toNumber());
    Grid.efficiency = eff;
    dyn.drains.energy = (dyn.drains.energy || D(0)).add(up.mul(Math.max(eff, 0)));
    for (const id in G().sectors) {
      const lv = level(id);
      if (!lv) continue;
      const m = mult(id, lv);
      const effective = eff >= 1 ? m : m.sub(1).mul(eff).add(1);
      for (const res of G().sectors[id].res) dyn.res[res] = dyn.res[res].mul(effective);
    }
  });

  IG.Grid = Grid;
})();
