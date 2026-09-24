'use strict';
// Medieval mechanic — Rites: timed production multipliers bought with Faith. Cost grows with each use per run.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  function R() { return IG.CONFIG.rites; }
  function st() { return IG.state.run.rites; }
  function unlocked() { return !!IG.Mods.get().unlocks[R().unlock]; }
  function available(id) {
    const r = R().list[id];
    return unlocked() && (!r.requires || !!IG.Mods.get().unlocks[r.requires]);
  }
  function uses(id) { return st().uses[id] || 0; }
  function remaining(id) { return st().active[id] || 0; }
  function active(id) { return remaining(id) > 0; }

  function cost(id) {
    const r = R().list[id], out = {};
    const m = IG.Mods.get().riteCost;
    for (const k in r.cost) out[k] = D(r.cost[k][0]).mul(D(r.cost[k][1]).pow(uses(id))).mul(m);
    return out;
  }
  function duration(id) { return R().list[id].duration * IG.Mods.get().riteDuration; }
  function power(id) { return 1 + (R().list[id].mult - 1) * IG.Mods.get().riteMult; }

  function invoke(id, silent) {
    if (!available(id)) return false;
    const c = cost(id);
    if (!IG.Prod.canAfford(c)) return false;
    IG.Prod.pay(c);
    st().active[id] = duration(id);
    st().uses[id] = uses(id) + 1;
    st().total = (st().total || 0) + 1;
    if (!silent) {
      IG.Log.add(R().list[id].name + ' is performed.', 'milestone');
      IG.Bus.emit('purchase', { kind: 'rite', id });
    }
    return true;
  }

  IG.Game.addPreHook(function (dt, s) {
    const a = s.run.rites.active;
    for (const id in a) {
      if (a[id] > 0) { a[id] -= dt; if (a[id] <= 0) delete a[id]; }
    }
  });

  IG.Mods.registerDynamic(function (s, dyn) {
    const a = s.run.rites && s.run.rites.active;
    if (!a) return;
    for (const id in a) {
      if (!(a[id] > 0)) continue;
      const r = R().list[id];
      if (!r) continue;
      // With large offline steps, a rite ending mid-step only counts for its share of the step.
      const p = D(power(id));
      if (r.all) { for (const res in dyn.res) dyn.res[res] = dyn.res[res].mul(p); }
      else for (const res of r.res) dyn.res[res] = dyn.res[res].mul(p);
    }
  });

  IG.Rites = { unlocked, available, uses, remaining, active, cost, duration, power, invoke };
})();
