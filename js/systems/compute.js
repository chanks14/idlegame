'use strict';
// Atomic mechanic — Compute Programs: split compute capacity (Compute produced per second) across programs.
// Each program's multiplier = 1 + k × computeMult × log10(1 + allocated)^pow.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  function P() { return IG.CONFIG.compute; }
  function unlocked() { return !!IG.Mods.get().unlocks[P().unlock]; }
  function share(id) { return IG.state.run.compute[id] || 0; }
  function totalShare() {
    let t = 0;
    for (const id in P().programs) t += share(id);
    return t;
  }

  // Set a program's share, shrinking the others proportionally if the total would exceed 100%.
  function setShare(id, v) {
    const c = IG.state.run.compute;
    v = IG.util.clamp(v, 0, 1);
    c[id] = v;
    let others = 0;
    for (const k in P().programs) if (k !== id) others += share(k);
    if (v + others > 1 && others > 0) {
      const scale = (1 - v) / others;
      for (const k in P().programs) if (k !== id) c[k] = share(k) * scale;
    }
  }

  function capacity() {
    const g = IG.Prod.cache.gross && IG.Prod.cache.gross.compute;
    return g || D(0);
  }

  function multFor(id, sh) {
    const pr = P().programs[id];
    const alloc = capacity().mul(sh === undefined ? share(id) : sh);
    const l = IG.util.log10(alloc.add(1));
    return 1 + pr.k * IG.Mods.get().computeMult * Math.pow(l, pr.pow);
  }

  function balance() {
    const ids = Object.keys(P().programs);
    for (const id of ids) IG.state.run.compute[id] = 1 / ids.length;
  }

  IG.Mods.registerDynamic(function (s, dyn) {
    if (!s.run.compute || !unlocked()) return;
    for (const id in P().programs) {
      if (!share(id)) continue;
      const m = multFor(id);
      if (m <= 1) continue;
      const t = P().programs[id].target;
      if (t === 'gens') { for (let e = 0; e < dyn.era.length; e++) dyn.era[e] = dyn.era[e].mul(m); }
      else if (t === 'agentSpeed') dyn.agentSpeed *= m;
      else dyn.res[t] = dyn.res[t].mul(m);
    }
  });

  IG.Compute = { unlocked, share, setShare, totalShare, capacity, multFor, balance };
})();
