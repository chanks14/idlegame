'use strict';
// =====================================================================================
//  MODIFIERS — aggregates every effect source into one compiled structure (IG.mods).
//
//  Effect vocabulary (used in config research / power tree / megaprojects / achievements):
//    {type:'prod', mult, gen?, era?, res?}   multiply generator output (filters optional; none = all gens)
//    {type:'cost', mult, gen?, era?}         multiply generator costs
//    {type:'global', mult}                   multiply ALL production (generators + worlds + war chain)
//    {type:'click', mult}                    multiply forage gains
//    {type:'clickRate', add}                 forage also grants `add` seconds of production
//    {type:'unlock', key}                    unlock a feature (e.g. 'agent:shaman')
//    {type:'startRes', res, amount}          starting resources each run
//    {type:'offlineCap', add}                hours added to the offline cap
//    {type:'hab', add, planet?}              habitability for a planet type (or all)
//    {type:'counter', faction, mult}         fleet power multiplier vs one faction
//    {type:'unitPower', unit, mult}          power multiplier for 'warship' | 'legion'
//    {type:'<numeric key>', mult|add}        any key of NUMERIC_KEYS below
//  Levels: `mult` is raised to the level, `add` is multiplied by the level.
// =====================================================================================
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  // Plain-number modifiers: [key, default]
  const NUMERIC_KEYS = {
    clickRate: 0, agentSpeed: 1, agentCost: 1, agentPower: 0, crewSize: 0, offlineCap: 0, ppMult: 1, synergyMult: 1,
    researchCost: 1, eraReq: 1,
    tradeMult: 1, tradeCost: 1, riteMult: 1, riteDuration: 1, riteCost: 1, gridDrain: 1, gridMult: 1,
    computeMult: 1, megaCost: 1,
    shipCost: 1, shipSpeed: 1, colonyYield: 0, maturation: 1, worldBonus: 0, launchBatch: 0,
    attrition: 1, yardRate: 1, frontSpeed: 1, enemyStrength: 1, captureMult: 1, lossMult: 1,
  };
  // Decimal modifiers
  const DECIMAL_KEYS = { global: 1, click: 1, worldOutput: 1, fleetPower: 1, materiel: 1 };

  const sources = [];   // fn(state, push(effect, level))
  const dynamics = [];  // fn(state, dyn)

  function fresh() {
    const m = { unlocks: {}, startRes: {}, hab: { all: 0 }, counter: {}, unitPower: {},
      prodEffects: [], costEffects: [], gen: {}, cost: {} };
    for (const k in NUMERIC_KEYS) m[k] = NUMERIC_KEYS[k];
    for (const k in DECIMAL_KEYS) m[k] = D(DECIMAL_KEYS[k]);
    return m;
  }

  function apply(m, eff, level) {
    if (!level) return;
    const t = eff.type;
    switch (t) {
      case 'prod':
        m.prodEffects.push({ gen: eff.gen, era: eff.era, res: eff.res, mult: D(eff.mult).pow(level) });
        return;
      case 'cost':
        m.costEffects.push({ gen: eff.gen, era: eff.era, mult: Math.pow(eff.mult, level) });
        return;
      case 'unlock':
        m.unlocks[eff.key] = true;
        return;
      case 'startRes':
        m.startRes[eff.res] = (m.startRes[eff.res] || 0) + eff.amount * level;
        return;
      case 'hab': {
        const k = eff.planet || 'all';
        m.hab[k] = (m.hab[k] || 0) + eff.add * level;
        return;
      }
      case 'counter':
        m.counter[eff.faction] = (m.counter[eff.faction] || 1) * Math.pow(eff.mult, level);
        return;
      case 'unitPower':
        m.unitPower[eff.unit] = (m.unitPower[eff.unit] || D(1)).mul(D(eff.mult).pow(level));
        return;
      default:
        if (t in DECIMAL_KEYS) {
          m[t] = m[t].mul(D(eff.mult).pow(level));
        } else if (t in NUMERIC_KEYS) {
          if (eff.add !== undefined) m[t] += eff.add * level;
          else m[t] *= Math.pow(eff.mult, level);
        } else {
          console.warn('Unknown effect type', t);
        }
    }
  }

  function matches(e, genId, gen, res) {
    if (e.gen !== undefined && (Array.isArray(e.gen) ? e.gen.indexOf(genId) < 0 : e.gen !== genId)) return false;
    if (e.era !== undefined) {
      if (Array.isArray(e.era) ? e.era.indexOf(gen.era) < 0 : e.era !== gen.era) return false;
    }
    if (res !== undefined && e.res !== undefined && e.res !== res) return false;
    return true;
  }

  function compile() {
    const s = IG.state, C = IG.CONFIG;
    const m = fresh();
    const push = (eff, level) => apply(m, eff, level === undefined ? 1 : level);
    for (const src of sources) src(s, push);
    if (s.meta.devMult && s.meta.devMult !== 1) m.global = m.global.mul(s.meta.devMult);

    const upMult = C.genUpgrades.mult;
    for (const id in C.generators) {
      const g = C.generators[id];
      const up = s.run.gens[id] ? s.run.gens[id].up : 0;
      const base = m.global.mul(D(upMult).pow(up)).mul(IG.Prod.modernMult(id, s.run.era));
      const per = {};
      for (const r in g.produces) {
        let x = base;
        for (const e of m.prodEffects) if (matches(e, id, g, r)) x = x.mul(e.mult);
        per[r] = x;
      }
      m.gen[id] = per;
      let c = 1;
      for (const e of m.costEffects) if (matches(e, id, g)) c *= e.mult;
      m.cost[id] = c;
    }
    IG.mods = m;
    Mods.dirty = false;
    return m;
  }

  // Per-tick dynamic multipliers: dyn.era[e], dyn.res[r] (Decimals) + misc numbers.
  function dynamic() {
    const s = IG.state, C = IG.CONFIG;
    const dyn = { era: [], res: {}, agentSpeed: 1, drains: {} };
    for (let e = 0; e < C.eras.length; e++) dyn.era.push(D(1));
    for (const r in C.resources) dyn.res[r] = D(1);
    for (const fn of dynamics) fn(s, dyn);
    IG.dyn = dyn;
    return dyn;
  }

  const Mods = {
    dirty: true,
    NUMERIC_KEYS, DECIMAL_KEYS,
    registerSource(fn) { sources.push(fn); },
    registerDynamic(fn) { dynamics.push(fn); },
    compile,
    dynamic,
    get() { if (Mods.dirty || !IG.mods) compile(); return IG.mods; },
    // Effect of a single definition list at a level, compiled in isolation (for tooltips).
    preview(effects, level) {
      const m = fresh();
      for (const e of effects) apply(m, e, level);
      return m;
    },
  };

  // Built-in synergy dynamic: later-era resources multiply every earlier era.
  Mods.registerDynamic(function synergy(s, dyn) {
    const C = IG.CONFIG;
    const k0 = (IG.mods ? IG.mods.synergyMult : 1);
    for (const syn of C.synergies) {
      const amt = s.run.produced[syn.res];
      if (!amt || amt.lte(0)) continue;
      const srcEra = C.resources[syn.res].era;
      if (srcEra > s.run.era) continue;
      const mult = D(1 + syn.k * k0 * IG.util.log10(amt.add(1)));
      for (let e = 0; e < srcEra; e++) dyn.era[e] = dyn.era[e].mul(mult);
    }
  });

  IG.Mods = Mods;
})();
