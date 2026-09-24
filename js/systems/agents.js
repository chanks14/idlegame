'use strict';
// Agents: mortal servants who automate an assigned area. Recruit → assign → upgrade. Reset on prestige.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  function A() { return IG.CONFIG.agents; }
  function list() { return IG.state.run.agents; }
  function typeUnlocked(t) {
    const def = A().types[t];
    return !!def && !!IG.Mods.get().unlocks[def.unlock];
  }
  function countOfType(t) { return list().filter((a) => a.type === t).length; }

  function scaleCost(spec, n) {
    const out = {};
    const m = IG.Mods.get().agentCost;
    for (const r in spec) out[r] = D(spec[r][0]).mul(D(spec[r][1]).pow(n)).mul(m);
    return out;
  }
  function recruitCost(t) { return scaleCost(A().types[t].recruit, countOfType(t)); }
  function upgradeCost(a) { return scaleCost(A().types[a.type].upgrade, a.level - 1); }

  function areaAvailable(areaId) {
    const ar = A().areas[areaId];
    if (!ar) return false;
    if (ar.era !== undefined && ar.era > IG.state.run.era) return false;
    if (ar.mech && !IG.Mods.get().unlocks[ar.mech]) return false;
    if (ar.minEra !== undefined && IG.state.run.era < ar.minEra) return false;
    return true;
  }
  function occupant(areaId) { return list().find((a) => a.area === areaId) || null; }
  function eligibleAreas(a) { return A().types[a.type].areas.filter(areaAvailable); }

  function genName(t) {
    const era = A().types[t].era;
    const s = IG.state;
    const r = IG.util.rng(s.meta.seed + s.run.agentSeq * 7919 + era * 104729);
    const N = A().names;
    const i = Math.min(era, N.first.length - 1);
    return IG.util.pick(N.first[i], r()) + ' ' + IG.util.pick(N.last[i], r());
  }

  function assign(a, areaId) {
    if (areaId && !eligibleAreas(a).includes(areaId)) return false;
    if (areaId) {
      const occ = occupant(areaId);
      if (occ && occ !== a) occ.area = null;
    }
    a.area = areaId || null;
    a.timer = 0;
    IG.Bus.emit('structure');
    return true;
  }

  function recruit(t, silent) {
    if (!typeUnlocked(t)) return null;
    const c = recruitCost(t);
    if (!IG.Prod.canAfford(c)) return null;
    IG.Prod.pay(c);
    const s = IG.state;
    s.run.agentSeq++;
    const a = { id: s.run.agentSeq, type: t, name: genName(t), level: 1, area: null, timer: 0 };
    list().push(a);
    const free = eligibleAreas(a).find((ar) => !occupant(ar));
    if (free) a.area = free;
    IG.Log.add(a.name + ', ' + A().types[t].name.toLowerCase() + ', answers your call.', 'milestone');
    if (!silent) IG.Bus.emit('purchase', { kind: 'agent', id: a.id });
    IG.Bus.emit('structure');
    return a;
  }

  function upgrade(a, silent) {
    const c = upgradeCost(a);
    if (!IG.Prod.canAfford(c)) return false;
    IG.Prod.pay(c);
    a.level++;
    if (!silent) IG.Bus.emit('purchase', { kind: 'agentUp', id: a.id });
    return true;
  }

  function interval(a) {
    const area = A().areas[a.area];
    if (!area) return Infinity;
    const base = A().baseInterval[area.kind] || 4;
    const speed = (1 + A().speedPerLevel * (a.level - 1)) * IG.Mods.get().agentSpeed * ((IG.dyn && IG.dyn.agentSpeed) || 1);
    return base / speed;
  }
  function bulk(a) { return 1 + Math.floor((a.level - 1) / A().bulkEvery) + Math.floor(IG.Mods.get().agentPower); }

  // ---------------------------------------------------------------- actions
  // Picks the affordable generator in `era` that is cheapest relative to holdings; buys upgrades first.
  function buyInEra(era, n) {
    let bought = 0;
    const gens = IG.Prod.listForEra(era).filter(IG.Prod.unlocked);
    for (const id of gens) {
      const info = IG.Prod.upgradeInfo(id);
      if (info && info.ready && IG.Prod.canAfford(info.cost)) { IG.Prod.buyUpgrade(id, true); bought++; }
    }
    for (let i = 0; i < n; i++) {
      let best = null, bv = Infinity;
      for (const id of gens) {
        const c = IG.Prod.costFor(id, 1);
        if (!IG.Prod.canAfford(c)) continue;
        let v = 0;
        const res = IG.state.run.resources;
        for (const r in c) v = Math.max(v, c[r].div(res[r].max(1e-9)).toNumber());
        if (v < bv) { bv = v; best = id; }
      }
      if (!best) break;
      IG.Prod.buy(best, '1', true);
      bought++;
    }
    return bought;
  }

  const actions = {
    forage(a) { IG.Prod.forage(a.level * A().forageClicksPerLevel, true); },
    gen(a) { buyInEra(A().areas[a.area].era, bulk(a)); },
    research(a) {
      for (let i = 0; i < bulk(a); i++) {
        const id = IG.Research.cheapestAffordable();
        if (!id) break;
        IG.Research.buy(id, true);
      }
    },
    trade(a) {
      for (let i = 0; i < bulk(a); i++) {
        const id = IG.Trade.cheapest();
        if (!id) break;
        IG.Trade.buy(id, true);
      }
    },
    rites() {
      for (const id in IG.CONFIG.rites.list) {
        if (IG.Rites.available(id) && !IG.Rites.active(id)) IG.Rites.invoke(id, true);
      }
    },
    grid(a) {
      const G = IG.Grid;
      if (G.efficiency < 0.999) {
        // brown-out: cut the most expensive sector
        let worst = null, wv = D(-1);
        for (const id in IG.CONFIG.grid.sectors) { const u = G.upkeep(id); if (u.gt(wv) && G.level(id) > 0) { wv = u; worst = id; } }
        if (worst) G.lower(worst);
        return;
      }
      const net = IG.Prod.cache.rates.energy || D(0);
      for (let i = 0; i < bulk(a); i++) {
        let best = null, bv = null;
        for (const id in IG.CONFIG.grid.sectors) {
          const extra = G.upkeep(id, G.level(id) + 1).sub(G.upkeep(id));
          if (bv === null || extra.lt(bv)) { bv = extra; best = id; }
        }
        if (!best || net.lt(bv.mul(1.5))) break;
        if (!G.raise(best, true)) break;
      }
    },
    compute() {
      if (IG.Compute.totalShare() < 0.999) IG.Compute.balance();
    },
    mega() {
      if (!IG.state.run.mega.active) {
        const id = IG.Mega.cheapestAvailable();
        if (id) IG.Mega.start(id);
      }
    },
  };

  function tick(dt) {
    const max = A().maxActionsPerTick;
    for (const a of list()) {
      if (!a.area || !areaAvailable(a.area)) continue;
      const iv = interval(a);
      a.timer += dt;
      if (a.timer < iv) continue;
      let n = Math.floor(a.timer / iv);
      if (n > max) { n = max; a.timer = 0; } else a.timer -= n * iv;
      const kind = A().areas[a.area].kind;
      const fn = actions[kind] || (Agents.extraActions[kind]);
      if (!fn) continue;
      for (let i = 0; i < n; i++) fn(a);
    }
  }

  IG.Game.addHook(tick);

  const Agents = { list, typeUnlocked, countOfType, recruitCost, upgradeCost, areaAvailable, occupant, eligibleAreas,
    assign, recruit, upgrade, interval, bulk, buyInEra, actions, extraActions: {},
    maxLevel() { return list().reduce((m, a) => Math.max(m, a.level), 0); } };
  IG.Agents = Agents;
})();
