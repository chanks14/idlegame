'use strict';
// Generators: costs (geometric, multi-resource), buying with multipliers, upgrades, per-tick production, forage.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  const cache = { rates: {}, gross: {}, genRates: {}, converterEff: {} };

  function cfg(id) { return IG.CONFIG.generators[id]; }
  function st(id) { return IG.state.run.gens[id]; }

  function unlocked(id) {
    const g = cfg(id), s = IG.state;
    if (g.era > s.run.era) return false;
    if (g.requires && !IG.Research.has(g.requires)) return false;
    return true;
  }

  function listForEra(era) {
    const out = [];
    for (const id in IG.CONFIG.generators) if (cfg(id).era === era) out.push(id);
    return out;
  }

  // ---- modernization: the current form of a generator line (see CONFIG.modernize)
  function tiersAt(id, era) {
    const line = IG.CONFIG.modernize.lines[id];
    const out = [];
    if (line) for (const t of line) if (t.era <= era) out.push(t);
    return out;
  }

  // {name, icon, desc, tier, mult, forms[]} for generator `id` in `era` (default: the current era)
  function view(id, era) {
    const g = cfg(id);
    const e = era === undefined ? IG.state.run.era : era;
    const tiers = tiersAt(id, e);
    const cur = tiers.length ? tiers[tiers.length - 1] : null;
    return {
      name: cur ? cur.name : g.name,
      icon: cur ? cur.icon : (g.icon || id),
      desc: cur ? cur.desc : g.desc,
      tier: tiers.length,
      mult: Math.pow(IG.CONFIG.modernize.multPerTier, tiers.length),
      forms: [g.name].concat(tiers.map((t) => t.name)),
    };
  }

  function modernMult(id, era) {
    return Math.pow(IG.CONFIG.modernize.multPerTier, tiersAt(id, era === undefined ? IG.state.run.era : era).length);
  }

  // Era hook: log the lines that change form on entering `era`.
  function onEraEnter(era) {
    const changes = [];
    for (const id in IG.CONFIG.generators) {
      const line = IG.CONFIG.modernize.lines[id];
      if (!line || !line.some((t) => t.era === era)) continue;
      changes.push(view(id, era - 1).name + ' → ' + view(id, era).name);
    }
    if (changes.length) IG.Log.add('Modernized: ' + changes.join(', ') + '.', 'milestone');
  }

  // Decimal forms of a generator's cost growth factors, cached on the config object (hot path).
  function growthD(g) {
    if (!g._growthD) { g._growthD = {}; for (const r in g.cost) g._growthD[r] = D(g.cost[r][1]); }
    return g._growthD;
  }

  // Cost to buy `n` units starting from the current count: {res: Decimal}
  function costFor(id, n) {
    const g = cfg(id), owned = st(id).n;
    const cm = IG.Mods.get().cost[id] || 1;
    const gd = growthD(g);
    const out = {};
    for (const r in g.cost) out[r] = Decimal.sumGeometricSeries(n, D(g.cost[r][0] * cm), gd[r], owned);
    return out;
  }

  function maxAfford(id) {
    const g = cfg(id), owned = st(id).n, res = IG.state.run.resources;
    const cm = IG.Mods.get().cost[id] || 1;
    const gd = growthD(g);
    let best = Infinity;
    for (const r in g.cost) {
      const n = Decimal.affordGeometricSeries(res[r], D(g.cost[r][0] * cm), gd[r], owned).toNumber();
      if (n < best) best = n;
    }
    return Math.max(0, Math.floor(best));
  }

  function canAfford(costs) {
    const res = IG.state.run.resources;
    for (const r in costs) if (res[r].lt(costs[r])) return false;
    return true;
  }

  function pay(costs) {
    const res = IG.state.run.resources;
    for (const r in costs) res[r] = res[r].sub(costs[r]).max(0);
  }

  // How many units a buy with the given mode would purchase (0 if unaffordable).
  function amountFor(id, mode) {
    if (mode === 'max') return maxAfford(id);
    const n = parseInt(mode, 10) || 1;
    return canAfford(costFor(id, n)) ? n : 0;
  }

  // Units shown in the cost label for a mode (max shows at least 1).
  function displayAmount(id, mode) {
    if (mode === 'max') return Math.max(1, maxAfford(id));
    return parseInt(mode, 10) || 1;
  }

  function buy(id, mode, silent) {
    if (!unlocked(id)) return 0;
    const n = amountFor(id, mode || '1');
    if (n <= 0) return 0;
    const c = costFor(id, n);
    if (!canAfford(c)) return 0;
    pay(c);
    const s = st(id);
    const before = s.n;
    s.n += n;
    if (before === 0) IG.Log.add('First ' + cfg(id).name + ' established.', 'milestone');
    if (!silent) IG.Bus.emit('purchase', { kind: 'gen', id, n });
    return n;
  }

  // ---- generator upgrades
  function upgradeInfo(id) {
    const U = IG.CONFIG.genUpgrades, s = st(id);
    if (s.up >= U.thresholds.length) return null;
    const threshold = U.thresholds[s.up];
    const g = cfg(id);
    const cm = IG.Mods.get().cost[id] || 1;
    const cost = {};
    const gd = growthD(g);
    for (const r in g.cost) cost[r] = D(g.cost[r][0] * cm * U.costFactor).mul(gd[r].pow(threshold));
    return {
      threshold,
      ready: s.n >= threshold,
      cost,
      mult: U.mult,
      name: (U.names[s.up] || ('Tier ' + (s.up + 1))) + ' ' + view(id).name,
    };
  }

  function buyUpgrade(id, silent) {
    const info = upgradeInfo(id);
    if (!info || !info.ready || !canAfford(info.cost)) return false;
    pay(info.cost);
    st(id).up++;
    IG.Mods.dirty = true;
    if (!silent) IG.Bus.emit('purchase', { kind: 'upgrade', id });
    return true;
  }

  // ---- production
  function computeRates() {
    const C = IG.CONFIG, s = IG.state;
    const mods = IG.Mods.get();
    const dyn = IG.dyn || IG.Mods.dynamic();
    const rates = {}, gross = {};
    for (const r in C.resources) { rates[r] = D(0); gross[r] = D(0); }
    const genRates = {};
    const consumers = [];
    for (const id in C.generators) {
      const n = s.run.gens[id].n;
      if (n <= 0) continue;
      const g = C.generators[id];
      const per = mods.gen[id];
      const out = {};
      for (const r in g.produces) out[r] = D(g.produces[r] * n).mul(per[r]).mul(dyn.era[g.era]).mul(dyn.res[r]);
      genRates[id] = out;
      if (g.consumes) { consumers.push(id); continue; }
      for (const r in out) gross[r] = gross[r].add(out[r]);
    }
    // external producers (worlds, war chain) add into gross through hooks
    for (const fn of Prod.extraProducers) fn(s, gross, dyn, mods);
    // converters: output limited by availability of their input (stockpile or this tick's production)
    const used = {};
    if (consumers.length) {
      const demand = {};
      for (const id of consumers) {
        const g = C.generators[id];
        for (const inp in g.consumes) {
          for (const r in genRates[id]) demand[inp] = (demand[inp] || D(0)).add(genRates[id][r].mul(g.consumes[inp]));
        }
      }
      const eff = {};
      for (const inp in demand) {
        if (demand[inp].lte(0)) { eff[inp] = 1; continue; }
        const stock = s.run.resources[inp];
        eff[inp] = stock.gte(demand[inp]) ? 1 : Math.min(1, gross[inp].div(demand[inp]).toNumber());
        used[inp] = demand[inp].mul(eff[inp]);
      }
      for (const id of consumers) {
        const g = C.generators[id];
        let e = 1;
        for (const inp in g.consumes) e = Math.min(e, eff[inp]);
        for (const r in genRates[id]) {
          if (e < 1) genRates[id][r] = genRates[id][r].mul(e);
          gross[r] = gross[r].add(genRates[id][r]);
        }
      }
      cache.converterEff = eff;
    }
    for (const r in C.resources) {
      let net = gross[r];
      if (dyn.drains[r]) net = net.sub(dyn.drains[r]);
      if (used[r]) net = net.sub(used[r]);
      rates[r] = net;
    }
    cache.rates = rates;
    cache.gross = gross;
    cache.genRates = genRates;
    return rates;
  }

  function tick(dt) {
    const s = IG.state;
    const rates = computeRates();
    const res = s.run.resources, prod = s.run.produced, life = s.perm.stats.lifetime;
    for (const r in rates) {
      const g = cache.gross[r];
      if (g.gt(0)) {
        const amt = g.mul(dt);
        prod[r] = prod[r].add(amt);
        life[r] = life[r].add(amt);
      }
      const delta = rates[r];
      if (delta.eq(0)) continue;
      res[r] = res[r].add(delta.mul(dt));
      if (res[r].lt(0)) res[r] = D(0);
    }
  }

  // ---- forage (Stone Age click action, stays useful later through clickRate)
  function forageGains() {
    const F = IG.CONFIG.forage, mods = IG.Mods.get();
    const out = {};
    const share = F.rateShare + mods.clickRate;
    for (const r in F.gain) {
      let v = D(F.gain[r]).mul(mods.click);
      if (share > 0 && cache.gross[r]) v = v.add(cache.gross[r].mul(share));
      out[r] = v;
    }
    return out;
  }

  function forage(count, silent) {
    const k = count || 1;
    const gains = forageGains();
    const s = IG.state;
    for (const r in gains) {
      const amt = gains[r].mul(k);
      s.run.resources[r] = s.run.resources[r].add(amt);
      s.run.produced[r] = s.run.produced[r].add(amt);
      s.perm.stats.lifetime[r] = s.perm.stats.lifetime[r].add(amt);
    }
    s.run.clicks += k;
    s.perm.stats.totalClicks += k;
    if (!silent) IG.Bus.emit('forage', { gains });
    return gains;
  }

  const Prod = {
    cache, extraProducers: [],
    unlocked, listForEra, view, modernMult, onEraEnter, costFor, maxAfford, canAfford, pay, amountFor, displayAmount, buy,
    upgradeInfo, buyUpgrade, computeRates, tick, forage, forageGains,
    totalGenerators() {
      let t = 0;
      for (const id in IG.state.run.gens) t += IG.state.run.gens[id].n;
      return t;
    },
  };
  IG.Prod = Prod;
})();
