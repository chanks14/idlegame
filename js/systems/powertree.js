'use strict';
// The Immortal's Power Tree: permanent nodes bought with prestige points; persists across prestiges.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  function T() { return IG.CONFIG.powerTree; }
  function node(id) { return T().nodes[id]; }
  function level(id) { return IG.state.perm.tree[id] || 0; }
  function maxed(id) { return level(id) >= node(id).maxLevel; }

  function cost(id) {
    const n = node(id);
    return Math.ceil(n.cost[0] * Math.pow(n.cost[1], level(id)));
  }

  function eraOk(id) {
    const n = node(id);
    return n.reqEra === undefined || IG.state.perm.highestEra >= n.reqEra;
  }

  function reqOk(id) {
    const n = node(id);
    if (!n.req) return true;
    for (const k in n.req) if (level(k) < n.req[k]) return false;
    return true;
  }

  function available(id) { return eraOk(id) && reqOk(id) && !maxed(id); }
  function canBuy(id) { return available(id) && IG.state.perm.pp >= cost(id); }

  function buy(id, silent) {
    if (!canBuy(id)) return false;
    const c = cost(id);
    const s = IG.state;
    s.perm.pp -= c;
    s.perm.ppSpent = (s.perm.ppSpent || 0) + c;
    s.perm.tree[id] = level(id) + 1;
    IG.Mods.dirty = true;
    // starting-resource nodes also apply immediately to the current run
    const n = node(id);
    for (const e of n.effects) {
      if (e.type === 'startRes') s.run.resources[e.res] = s.run.resources[e.res].add(e.amount);
    }
    if (!silent) IG.Bus.emit('purchase', { kind: 'node', id });
    IG.Bus.emit('structure');
    return true;
  }

  function totalLevels() {
    let t = 0;
    for (const id in IG.state.perm.tree) t += IG.state.perm.tree[id];
    return t;
  }

  // Simple spending heuristic (used by the simulator): repeatedly buy the cheapest affordable node,
  // preferring early-game production branches.
  const PRIORITY = { dominion: 1, echoes: 1, retinue: 1.3, inheritance: 1.6, sleep: 4, seedworlds: 1.2, diaspora: 1.2, ironwill: 1.1, endurance: 1.3 };
  function autoSpend() {
    for (let guard = 0; guard < 500; guard++) {
      let best = null, bv = Infinity;
      for (const id in T().nodes) {
        if (!canBuy(id)) continue;
        const br = T().branches[node(id).branch].id;
        const v = cost(id) * (PRIORITY[br] || 1);
        if (v < bv) { bv = v; best = id; }
      }
      if (!best) break;
      buy(best, true);
    }
  }

  IG.Mods.registerSource(function (s, push) {
    for (const id in s.perm.tree) {
      const lv = s.perm.tree[id];
      const n = T().nodes[id];
      if (!lv || !n) continue;
      for (const e of n.effects) push(e, lv);
      if (n.levelEffects) {
        for (const k in n.levelEffects) if (lv >= parseInt(k, 10)) for (const e of n.levelEffects[k]) push(e, 1);
      }
    }
  });

  IG.PowerTree = { node, level, maxed, cost, eraOk, reqOk, available, canBuy, buy, totalLevels, autoSpend };
})();
