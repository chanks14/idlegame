'use strict';
// Research / tech tree. One-shot techs (level 0/1) and repeatable techs (maxLevel, geometric cost).
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  function cfg(id) { return IG.CONFIG.research[id]; }
  function level(id) { return IG.state.run.research[id] || 0; }
  function has(id) { return level(id) > 0; }
  function repeatable(id) { return !!cfg(id).maxLevel; }
  function maxed(id) { const t = cfg(id); return t.maxLevel ? level(id) >= t.maxLevel : has(id); }

  function prereqsMet(id) {
    const t = cfg(id);
    if (!t.prereq) return true;
    return t.prereq.every(has);
  }

  function visible(id) {
    const t = cfg(id);
    return t.era <= IG.state.run.era;
  }

  function available(id) { return visible(id) && prereqsMet(id) && !maxed(id); }

  function cost(id) {
    const t = cfg(id), lv = level(id), out = {};
    const m = IG.Mods.get().researchCost;
    for (const r in t.cost) {
      const c = t.cost[r];
      out[r] = Array.isArray(c) ? D(c[0]).mul(D(c[1]).pow(lv)).mul(m) : D(c).mul(m);
    }
    return out;
  }

  function canBuy(id) { return available(id) && IG.Prod.canAfford(cost(id)); }

  function buy(id, silent) {
    if (!canBuy(id)) return false;
    IG.Prod.pay(cost(id));
    IG.state.run.research[id] = level(id) + 1;
    IG.Mods.dirty = true;
    const t = cfg(id);
    if (!repeatable(id)) IG.Log.add('Discovered: ' + t.name + '.', 'milestone');
    if (!silent) IG.Bus.emit('purchase', { kind: 'research', id });
    IG.Bus.emit('structure');
    return true;
  }

  function listForEra(era) {
    const out = [];
    for (const id in IG.CONFIG.research) if (cfg(id).era === era) out.push(id);
    return out;
  }

  function count() {
    let n = 0;
    for (const id in IG.state.run.research) if (IG.state.run.research[id] > 0) n++;
    return n;
  }

  // Cheapest affordable research (used by Scholar agents and the simulator).
  function cheapestAffordable(filterEra) {
    let best = null, bestV = Infinity;
    for (const id in IG.CONFIG.research) {
      if (filterEra !== undefined && cfg(id).era !== filterEra) continue;
      if (!canBuy(id)) continue;
      const c = cost(id);
      let v = 0;
      for (const r in c) v = Math.max(v, IG.util.log10(c[r]));
      if (v < bestV) { bestV = v; best = id; }
    }
    return best;
  }

  const Research = { cfg, level, has, repeatable, maxed, prereqsMet, visible, available, cost, canBuy, buy,
    listForEra, count, cheapestAffordable };

  IG.Mods.registerSource(function (s, push) {
    const R = IG.CONFIG.research;
    for (const id in s.run.research) {
      const lv = s.run.research[id];
      if (!lv || !R[id]) continue;
      for (const e of R[id].effects) push(e, lv);
    }
  });

  IG.Research = Research;
})();
