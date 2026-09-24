'use strict';
// Classical mechanic — Trade Routes: leveled routes that multiply one earlier resource.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  function T() { return IG.CONFIG.trade; }
  function unlocked() { return !!IG.Mods.get().unlocks[T().unlock]; }
  function level(id) { return IG.state.run.trade[id] || 0; }

  function cost(id) {
    const r = T().routes[id], lv = level(id), out = {};
    const m = IG.Mods.get().tradeCost;
    for (const k in r.cost) out[k] = D(r.cost[k][0]).mul(D(r.cost[k][1]).pow(lv)).mul(m);
    return out;
  }

  // Additive per level (linear effect vs geometric cost keeps the coin → routes loop stable).
  function perLevel() { return T().multPerLevel * IG.Mods.get().tradeMult; }
  function mult(id, lv) { return D(1 + perLevel() * (lv === undefined ? level(id) : lv)); }

  function buy(id, silent) {
    if (!unlocked()) return false;
    const c = cost(id);
    if (!IG.Prod.canAfford(c)) return false;
    IG.Prod.pay(c);
    IG.state.run.trade[id] = level(id) + 1;
    if (level(id) === 1) IG.Log.add('The ' + T().routes[id].name + ' opens for trade.', 'milestone');
    if (!silent) IG.Bus.emit('purchase', { kind: 'trade', id });
    return true;
  }

  function cheapest() {
    let best = null, bv = Infinity;
    for (const id in T().routes) {
      const c = cost(id);
      if (!IG.Prod.canAfford(c)) continue;
      const v = IG.util.log10(c.coin || D(1));
      if (v < bv) { bv = v; best = id; }
    }
    return best;
  }

  function totalLevels() {
    let t = 0;
    for (const id in IG.state.run.trade) t += IG.state.run.trade[id];
    return t;
  }

  IG.Mods.registerDynamic(function (s, dyn) {
    if (!s.run.trade) return;
    for (const id in s.run.trade) {
      const lv = s.run.trade[id];
      const r = T().routes[id];
      if (!lv || !r) continue;
      dyn.res[r.res] = dyn.res[r.res].mul(mult(id, lv));
    }
  });

  IG.Trade = { unlocked, level, cost, mult, perLevel, buy, cheapest, totalLevels };
})();
