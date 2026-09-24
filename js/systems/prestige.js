'use strict';
// Prestige — "The Long Night": civilization collapses back to the Stone Age; the immortal keeps its memory
// as prestige points (spent in the Power Tree).
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  function P() { return IG.CONFIG.prestige; }

  function legacy() {
    const s = IG.state, R = IG.CONFIG.resources;
    let t = D(0);
    for (const r in R) {
      if (!R[r].legacy) continue;
      t = t.add(s.run.produced[r].mul(R[r].legacy));
    }
    return t;
  }

  function basePoints(leg) {
    const l = IG.util.log10(leg);
    const x = Math.max(0, l - P().offset);
    return P().k * Math.pow(x, P().power);
  }

  function eraBonus() {
    const s = IG.state;
    const fronts = s.run.war ? s.run.war.won * (P().frontBonus || 0) : 0;
    return (P().eraBonus[s.run.era] || 0) + fronts;
  }

  function gain() {
    if (IG.state.run.era < P().minEra) return 0;
    const pts = basePoints(legacy()) * IG.Mods.get().ppMult;
    return Math.floor(pts) + eraBonus();
  }

  function unlocked() { return IG.state.perm.prestiges > 0 || IG.state.perm.highestEra >= P().minEra; }
  function canPrestige() { return IG.state.run.era >= P().minEra && gain() >= 1; }

  // Legacy needed for the next whole point (for the preview).
  function nextPointAt() {
    const cur = basePoints(legacy()) * IG.Mods.get().ppMult;
    const target = Math.floor(cur) + 1;
    const x = Math.pow(target / (P().k * IG.Mods.get().ppMult), 1 / P().power) + P().offset;
    return D(10).pow(x);
  }

  function doPrestige(silent) {
    if (!canPrestige()) return false;
    const s = IG.state;
    const g = gain();
    s.perm.pp += g;
    s.perm.ppTotal += g;
    s.perm.prestiges++;
    s.perm.stats.runs.push({ n: s.perm.prestiges, time: s.run.time, era: s.run.era, pp: g });
    if (s.perm.stats.runs.length > 50) s.perm.stats.runs.shift();
    const fromEra = s.run.era;
    s.run = IG.State.newRun();
    IG.Mods.dirty = true;
    IG.Mods.compile();
    for (const fn of IG.Game.onNewRun) fn(s);
    IG.Mods.dirty = true;
    IG.Mods.compile();
    IG.Mods.dynamic();
    IG.Prod.computeRates();
    IG.Log.add('The Long Night falls on the ' + IG.CONFIG.eras[fromEra].name + '. Cities burn, books rot, names are forgotten. You remember. (+' + g + ' points)', 'prestige');
    if (!silent) IG.Bus.emit('prestige', { gain: g, fromEra });
    IG.Bus.emit('structure');
    return g;
  }

  // Starting bonuses for every fresh run (power tree): resources and remembered research.
  IG.Game.onNewRun.push(function (s) {
    const m = IG.Mods.get();
    for (const r in m.startRes) s.run.resources[r] = s.run.resources[r].add(m.startRes[r]);
    for (let e = 0; e < IG.CONFIG.eras.length; e++) {
      if (!m.unlocks['memory:' + e]) continue;
      for (const id of IG.Research.listForEra(e)) {
        const t = IG.CONFIG.research[id];
        if (!t.maxLevel) s.run.research[id] = 1;
      }
    }
  });

  IG.Prestige = { legacy, gain, eraBonus, unlocked, canPrestige, nextPointAt, doPrestige, basePoints };
})();
