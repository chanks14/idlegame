'use strict';
// Interstellar expansion. Worlds are tracked as COHORTS (planet type + claim-time bucket), never individually.
// Cohorts mature from startFrac to full output; fully matured cohorts merge into one pool per planet type.
//   run.exp = { cohorts:[{type,t,n}], matured:{type:n}, flights:[{arrive,n}], carry:{type:frac},
//               shipsLaunched, worldsClaimed }
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  function X() { return IG.CONFIG.expansion; }
  function st() { return IG.state.run.exp; }
  function active() { return !!IG.state.run.exp; }
  function types() { return Object.keys(X().planets); }

  function init() {
    const e = { cohorts: [], matured: {}, flights: [], carry: {}, shipsLaunched: 0, worldsClaimed: 0 };
    for (const t of types()) { e.matured[t] = 0; e.carry[t] = 0; }
    e.matured[X().home] = 1;
    IG.state.run.exp = e;
  }

  // ---------------------------------------------------------------- planets
  function habitability(type) {
    const p = X().planets[type], m = IG.Mods.get();
    return Math.min(X().habCap, p.hab + (m.hab.all || 0) + (m.hab[type] || 0));
  }
  function isColony(type) { return habitability(type) >= X().colonyThreshold; }
  function outputFactor(type) {
    return Math.max(habitability(type), X().outpostFloor) * X().planets[type].yield;
  }
  function perWorld(type) {
    return D(X().baseOutput * outputFactor(type)).mul(IG.Mods.get().worldOutput);
  }

  function maturity(c, now) {
    const age = Math.max(0, now - c.t);
    const speed = IG.Mods.get().maturation;
    return Math.min(1, X().startFrac + (1 - X().startFrac) * (age * speed) / X().matureSeconds);
  }

  // {type: {total, effective, maturing}}
  function census() {
    const out = {};
    for (const t of types()) out[t] = { total: 0, effective: 0, maturing: 0 };
    if (!active()) return out;
    const e = st(), now = IG.state.run.time;
    for (const t of types()) { out[t].total += e.matured[t]; out[t].effective += e.matured[t]; }
    for (const c of e.cohorts) {
      const o = out[c.type];
      o.total += c.n;
      o.maturing += c.n;
      o.effective += c.n * maturity(c, now);
    }
    return out;
  }

  let cachedTotals = { total: 0, effective: 0, colonies: 0, outposts: 0, maturing: 0 };
  function recount() {
    const cs = census();
    const tot = { total: 0, effective: 0, colonies: 0, outposts: 0, maturing: 0 };
    for (const t in cs) {
      tot.total += cs[t].total;
      tot.effective += cs[t].effective;
      tot.maturing += cs[t].maturing;
      if (isColony(t)) tot.colonies += cs[t].total; else tot.outposts += cs[t].total;
    }
    cachedTotals = tot;
    return tot;
  }
  function totalWorlds() { return active() ? cachedTotals.total : 0; }
  function effectiveWorlds() { return active() ? cachedTotals.effective : 0; }

  // ---------------------------------------------------------------- claiming / losing
  // Split `count` worlds across planet types by weight, deterministically (fractional carry per type).
  function claim(count, time) {
    if (!active() || count <= 0) return 0;
    const e = st(), P = X().planets;
    let W = 0;
    for (const t in P) W += P[t].weight;
    const bucket = Math.floor(time / X().bucketSeconds) * X().bucketSeconds;
    let added = 0;
    for (const t in P) {
      e.carry[t] += count * P[t].weight / W;
      const whole = Math.floor(e.carry[t] + 1e-9);
      if (whole <= 0) continue;
      e.carry[t] -= whole;
      added += whole;
      let c = null;
      for (let i = e.cohorts.length - 1; i >= 0; i--) {
        if (e.cohorts[i].type === t && e.cohorts[i].t === bucket) { c = e.cohorts[i]; break; }
      }
      if (c) c.n += whole; else e.cohorts.push({ type: t, t: bucket, n: whole });
    }
    e.worldsClaimed += added;
    return added;
  }

  // Remove `count` worlds, matured pools first (proportionally), then the youngest cohorts.
  function lose(count) {
    if (!active() || count <= 0) return 0;
    const e = st();
    let left = Math.min(count, Math.max(0, recount().total - 1)); // never lose the last world
    const want = left;
    const pool = types().reduce((a, t) => a + e.matured[t], 0);
    if (pool > 0) {
      const frac = Math.min(1, left / pool);
      for (const t of types()) {
        const k = Math.min(e.matured[t], Math.round(e.matured[t] * frac));
        e.matured[t] -= k;
        left -= k;
      }
    }
    for (let i = e.cohorts.length - 1; i >= 0 && left > 0; i--) {
      const k = Math.min(e.cohorts[i].n, left);
      e.cohorts[i].n -= k;
      left -= k;
    }
    e.cohorts = e.cohorts.filter((c) => c.n > 0);
    if (recount().total < 1) { e.matured[X().home] = 1; recount(); }
    return want - Math.max(0, left);
  }

  // ---------------------------------------------------------------- ships
  function shipCost(n) {
    const out = {}, m = IG.Mods.get().shipCost;
    for (const r in X().shipCost) out[r] = D(X().shipCost[r]).mul(m).mul(n || 1);
    return out;
  }
  function travelTime() { return X().travelSeconds / IG.Mods.get().shipSpeed; }
  function yieldPerShip() { return X().baseYield + IG.Mods.get().colonyYield; }
  function maxShips() {
    const c = shipCost(1), res = IG.state.run.resources;
    let best = Infinity;
    for (const r in c) best = Math.min(best, res[r].div(c[r]).floor().toNumber());
    return Math.max(0, Math.min(best, 1e12));
  }
  function inFlight() { return active() ? st().flights.reduce((a, f) => a + f.n, 0) : 0; }

  function buildShips(mode, silent) {
    if (!active()) return 0;
    let n = mode === 'max' ? maxShips() : (parseInt(mode, 10) || 1);
    if (n <= 0) return 0;
    const c = shipCost(n);
    if (!IG.Prod.canAfford(c)) return 0;
    IG.Prod.pay(c);
    const e = st(), now = IG.state.run.time;
    const arrive = now + travelTime();
    const last = e.flights[e.flights.length - 1];
    if (last && Math.abs(last.arrive - arrive) < X().flightBucket) last.n += n;
    else e.flights.push({ arrive, n });
    e.shipsLaunched += n;
    if (!silent) IG.Bus.emit('purchase', { kind: 'ship', n });
    return n;
  }

  // ---------------------------------------------------------------- tick
  function tick(dt, s) {
    if (!active()) return;
    const e = st(), now = s.run.time;
    // arrivals
    if (e.flights.length && e.flights[0].arrive <= now) {
      const y = yieldPerShip();
      let ships = 0;
      while (e.flights.length && e.flights[0].arrive <= now) {
        const f = e.flights.shift();
        ships += f.n;
        claim(f.n * y, f.arrive);
      }
      if (!IG.Bus.muted && ships > 0) IG.Bus.emit('colonized', { ships, worlds: ships * y });
    }
    // maturation → merge matured cohorts into the per-type pool
    if (e.cohorts.length) {
      let merged = false;
      for (const c of e.cohorts) {
        if (maturity(c, now) >= 1) { e.matured[c.type] += c.n; c.n = 0; merged = true; }
      }
      if (merged) e.cohorts = e.cohorts.filter((c) => c.n > 0);
    }
    const tot = recount();
    if (tot.total > s.perm.stats.bestWorlds) s.perm.stats.bestWorlds = tot.total;
    if (s.run.era === 7 && tot.total >= X().firstContact && IG.CONFIG.eras[8]) {
      IG.Log.add('First contact. Alien signals answer from every direction at once — and they are not greetings.', 'war');
      IG.Eras.enter(8);
    }
    for (const fn of Expansion.onTick) fn(tot, s);
  }

  // Starmatter production from worlds (added to gross production).
  IG.Prod.extraProducers.push(function (s, gross, dyn) {
    if (!s.run.exp) return;
    const cs = census();
    let out = D(0);
    for (const t in cs) {
      if (cs[t].effective <= 0) continue;
      out = out.add(perWorld(t).mul(cs[t].effective));
    }
    gross.starmatter = gross.starmatter.add(out.mul(dyn.res.starmatter));
    Expansion.lastOutput = out;
  });

  // Every (maturity-weighted) world adds a flat bonus to all older generators.
  IG.Mods.registerDynamic(function (s, dyn) {
    if (!s.run.exp) return;
    const bonus = (X().worldBonus + IG.Mods.get().worldBonus) * effectiveWorlds();
    if (bonus <= 0) return;
    const m = D(1 + bonus);
    for (let e = 0; e < 7 && e < dyn.era.length; e++) dyn.era[e] = dyn.era[e].mul(m);
  });

  IG.Eras.onEnter.push(function (era, s) {
    if (era === 7 && !s.run.exp) {
      init();
      IG.Log.add('The first ark reaches a garden world. The empire now spans two suns.', 'milestone');
    }
  });
  IG.Game.addHook(tick);
  IG.Agents.extraActions.ships = function () { buildShips('max', true); };
  IG.Save.onHydrate.push(function () { cachedTotals = { total: 0, effective: 0, colonies: 0, outposts: 0, maturing: 0 }; });

  const Expansion = {
    active, init, types, habitability, isColony, outputFactor, perWorld, maturity, census, recount,
    totalWorlds, effectiveWorlds, claim, lose, shipCost, travelTime, yieldPerShip, maxShips, inFlight, buildShips,
    totals() { return cachedTotals; },
    onTick: [],
    lastOutput: D(0),
    devAddWorlds(n) { if (!active()) init(); claim(n, IG.state.run.time - X().matureSeconds * 2); recount(); },
  };
  IG.Expansion = Expansion;
})();
