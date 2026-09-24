'use strict';
// Spacefaring mechanic — Megaprojects: one active project at a time; a share of each required resource's
// production is diverted into it until complete. Stores can also be poured in manually.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  function M() { return IG.CONFIG.megaprojects; }
  function st() { return IG.state.run.mega; }
  function unlocked() { return !!IG.Mods.get().unlocks[M().unlock]; }
  function done(id) { return !!st().done[id]; }
  function available(id) {
    const p = M().list[id];
    return unlocked() && !done(id) && (!p.prereq || done(p.prereq));
  }
  function cost(id) {
    const p = M().list[id], out = {};
    const m = IG.Mods.get().megaCost;
    for (const r in p.cost) out[r] = D(p.cost[r]).mul(m);
    return out;
  }
  function progress(id) {
    const pr = st().progress[id] || (st().progress[id] = {});
    for (const r in M().list[id].cost) if (!(pr[r] instanceof Decimal)) pr[r] = D(pr[r] || 0);
    return pr;
  }
  function fraction(id) {
    if (done(id)) return 1;
    const c = cost(id), pr = progress(id);
    let sum = 0, n = 0;
    for (const r in c) { sum += Math.min(1, pr[r].div(c[r]).toNumber()); n++; }
    return n ? sum / n : 0;
  }

  function start(id) {
    if (!available(id)) return false;
    st().active = id;
    IG.Log.add('Work begins on the ' + M().list[id].name + '.', 'milestone');
    return true;
  }

  function complete(id) {
    st().done[id] = true;
    if (st().active === id) st().active = null;
    IG.Mods.dirty = true;
    IG.Log.add('The ' + M().list[id].name + ' is complete.', 'milestone');
    IG.Bus.emit('milestone', { kind: 'mega', id });
    IG.Bus.emit('structure');
  }

  function checkDone(id) {
    const c = cost(id), pr = progress(id);
    for (const r in c) if (pr[r].lt(c[r])) return false;
    complete(id);
    return true;
  }

  // Pour a fraction of current stores into the active project.
  function contribute(frac) {
    const id = st().active;
    if (!id) return false;
    const c = cost(id), pr = progress(id), res = IG.state.run.resources;
    for (const r in c) {
      const need = c[r].sub(pr[r]);
      if (need.lte(0)) continue;
      const give = Decimal.min(need, res[r].mul(frac));
      res[r] = res[r].sub(give);
      pr[r] = pr[r].add(give);
    }
    checkDone(id);
    return true;
  }

  const funding = {};

  IG.Mods.registerDynamic(function (s, dyn) {
    for (const k in funding) delete funding[k];
    const id = s.run.mega && s.run.mega.active;
    if (!id || !M().list[id]) return;
    const c = cost(id), pr = progress(id);
    const gross = IG.Prod.cache.gross || {};
    for (const r in c) {
      if (pr[r].gte(c[r]) || !gross[r]) continue;
      const f = gross[r].mul(M().fundShare);
      funding[r] = f;
      dyn.drains[r] = (dyn.drains[r] || D(0)).add(f);
    }
  });

  IG.Game.addHook(function (dt, s) {
    const id = s.run.mega.active;
    if (!id) return;
    const c = cost(id), pr = progress(id);
    for (const r in funding) pr[r] = Decimal.min(c[r], pr[r].add(funding[r].mul(dt)));
    checkDone(id);
  });

  IG.Mods.registerSource(function (s, push) {
    for (const id in s.run.mega.done) {
      const p = M().list[id];
      if (p && s.run.mega.done[id]) for (const e of p.effects) push(e, 1);
    }
  });

  IG.Mega = { unlocked, done, available, cost, progress, fraction, start, contribute, funding,
    count() { return Object.keys(st().done).length; },
    cheapestAvailable() {
      let best = null, bv = Infinity;
      for (const id in M().list) {
        if (!available(id)) continue;
        let v = 0;
        for (const r in M().list[id].cost) v = Math.max(v, IG.util.log10(M().list[id].cost[r]));
        if (v < bv) { bv = v; best = id; }
      }
      return best;
    },
    devComplete(id) { if (!done(id)) complete(id); },
  };
})();
