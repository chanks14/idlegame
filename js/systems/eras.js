'use strict';
// Era progression: milestone conditions and advancing.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  function era(i) { return IG.CONFIG.eras[i === undefined ? IG.state.run.era : i]; }

  function condLabel(c) {
    const C = IG.CONFIG;
    switch (c.type) {
      case 'res': return 'Hold ' + IG.fmt(req(c)) + ' ' + C.resources[c.res].name;
      case 'research': return 'Research ' + C.research[c.id].name;
      case 'gen': return 'Own ' + c.count + ' ' + IG.Prod.view(c.gen).name;
      case 'mega': return 'Complete the ' + C.megaprojects.list[c.id].name;
      case 'worlds': return 'Rule ' + IG.fmtInt(c.count) + ' worlds';
      case 'fronts': return 'Win ' + c.count + ' fronts this run';
      default: return '?';
    }
  }

  // Requirement amounts may be reduced by the power tree (eraReq modifier).
  function req(c) {
    if (c.type !== 'res') return c.amount;
    return D(c.amount).mul(IG.Mods.get().eraReq);
  }

  // Returns [{label, frac (0..1), done}]
  function progress(i) {
    const e = era(i);
    if (!e || !e.milestone) return [];
    const s = IG.state;
    return e.milestone.map((c) => {
      let frac = 0;
      switch (c.type) {
        case 'res': {
          const need = req(c);
          const have = s.run.resources[c.res];
          frac = have.gte(need) ? 1 : Math.max(0, IG.util.log10(have.add(1)) / IG.util.log10(need.add(1)));
          break;
        }
        case 'research': frac = IG.Research.has(c.id) ? 1 : 0; break;
        case 'gen': frac = Math.min(1, s.run.gens[c.gen].n / c.count); break;
        case 'mega': frac = IG.Mega ? IG.Mega.fraction(c.id) : 0; break;
        case 'worlds': frac = IG.Expansion ? Math.min(1, IG.Expansion.totalWorlds() / c.count) : 0; break;
        case 'fronts': frac = s.run.war ? Math.min(1, s.run.war.won / c.count) : 0; break;
      }
      return { label: condLabel(c), frac, done: frac >= 1, res: c.res };
    });
  }

  function hasNext() { return IG.state.run.era + 1 < IG.CONFIG.eras.length; }

  function canAdvance() {
    if (!hasNext()) return false;
    const e = era();
    if (e.autoAdvance) return false; // advanced by a system event (e.g. first contact)
    return progress().every((p) => p.done);
  }

  function enter(next, silent) {
    const s = IG.state, C = IG.CONFIG;
    s.run.era = next;
    s.run.eraTimes[next] = s.run.time;
    const best = s.perm.stats.bestEraTimes;
    if (best[next] === undefined || best[next] === null || s.run.time < best[next]) best[next] = s.run.time;
    if (next > s.perm.highestEra) s.perm.highestEra = next;
    for (const fn of Eras.onEnter) fn(next, s);
    IG.Mods.dirty = true;
    IG.Log.add('The ' + C.eras[next].name + ' begins. ' + C.eras[next].desc, 'era');
    IG.Prod.onEraEnter(next);
    if (!silent) IG.Bus.emit('era', { era: next });
  }

  function advance() {
    if (!canAdvance()) return false;
    enter(IG.state.run.era + 1);
    return true;
  }

  const Eras = { era, progress, canAdvance, advance, enter, hasNext, condLabel, onEnter: [] };
  IG.Eras = Eras;
})();
