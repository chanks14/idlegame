'use strict';
// Agents: mortal servants who automate an assigned area. Recruit → assign → upgrade → promote. Reset on prestige.
// Each area holds a crew (crewBase + crewSize modifier; `solo` areas hold one). Every agent in a crew acts on its own
// timer, so recruiting adds actions and upgrading adds speed. Recruiting needs a free post, so no one is left idle.
// Promotion turns an agent into a newer type (later era), keeping part of its levels, for part of a recruit's cost.
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
  function crewCap(areaId) {
    const ar = A().areas[areaId];
    if (!ar) return 0;
    return ar.solo ? 1 : A().crewBase + Math.floor(IG.Mods.get().crewSize);
  }
  function occupants(areaId) { return list().filter((a) => a.area === areaId); }
  // Room for one more agent in the area, not counting `except` (an agent about to move or change type).
  function hasRoom(areaId, except) {
    return occupants(areaId).filter((a) => a !== except).length < crewCap(areaId);
  }
  function eligibleAreas(a) { return A().types[a.type].areas.filter(areaAvailable); }
  // Best free post for a type: available, with room, fewest agents already there (ties by config order).
  function freeAreaFor(t, except) {
    let best = null, bn = Infinity;
    for (const ar of A().types[t].areas) {
      if (!areaAvailable(ar) || !hasRoom(ar, except)) continue;
      const n = occupants(ar).filter((a) => a !== except).length;
      if (n < bn) { bn = n; best = ar; }
    }
    return best;
  }
  function canRecruit(t) { return typeUnlocked(t) && !!freeAreaFor(t); }

  function genName(t) {
    const era = A().types[t].era;
    const s = IG.state;
    const r = IG.util.rng(s.meta.seed + s.run.agentSeq * 7919 + era * 104729);
    const N = A().names;
    const i = Math.min(era, N.first.length - 1);
    return IG.util.pick(N.first[i], r()) + ' ' + IG.util.pick(N.last[i], r());
  }

  function assign(a, areaId) {
    if (areaId && (!eligibleAreas(a).includes(areaId) || !hasRoom(areaId, a))) return false;
    a.area = areaId || null;
    a.timer = 0;
    IG.Bus.emit('structure');
    return true;
  }

  function recruit(t, silent) {
    if (!canRecruit(t)) return null;
    const c = recruitCost(t);
    if (!IG.Prod.canAfford(c)) return null;
    IG.Prod.pay(c);
    const s = IG.state;
    s.run.agentSeq++;
    const a = { id: s.run.agentSeq, type: t, name: genName(t), level: 1, area: freeAreaFor(t), timer: 0 };
    list().push(a);
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

  // Types this agent could be promoted to: unlocked and from a later era (canPromote also needs a free post).
  function promoteTargets(a) {
    const from = A().types[a.type].era;
    return Object.keys(A().types).filter((t) => A().types[t].era > from && typeUnlocked(t));
  }
  function promoteCost(a, t) {
    const c = recruitCost(t);
    for (const r in c) c[r] = c[r].mul(A().promote.costMult);
    return c;
  }
  function promoteLevel(a) { return Math.max(1, Math.ceil(a.level * A().promote.keepLevels)); }
  function canPromote(a, t) { return promoteTargets(a).includes(t) && !!freeAreaFor(t, a); }

  function promote(a, t, silent) {
    if (!canPromote(a, t)) return false;
    const c = promoteCost(a, t);
    if (!IG.Prod.canAfford(c)) return false;
    IG.Prod.pay(c);
    const oldName = A().types[a.type].name.toLowerCase();
    a.type = t;
    a.level = promoteLevel(a);
    // keep the current post if the new type may staff it, else move to the best free one
    if (!(a.area && A().types[t].areas.includes(a.area) && areaAvailable(a.area))) a.area = freeAreaFor(t, a);
    a.timer = 0;
    const art = /^[aeiou]/.test(oldName) ? 'an ' : 'a ';
    IG.Log.add(a.name + ', once ' + art + oldName + ', rises to ' + A().types[t].name.toLowerCase() + '.', 'milestone');
    if (!silent) IG.Bus.emit('purchase', { kind: 'agentPromote', id: a.id });
    IG.Bus.emit('structure');
    return true;
  }

  // Puts idle agents into free posts (used by tools; the game never moves agents on its own).
  function autoStaff() {
    for (const a of list()) {
      if (a.area) continue;
      const ar = freeAreaFor(a.type, a);
      if (ar) a.area = ar;
    }
  }

  function interval(a) {
    const area = A().areas[a.area];
    if (!area) return Infinity;
    const base = A().baseInterval[area.kind] || 4;
    const speed = (1 + A().speedPerLevel * (a.level - 1)) * IG.Mods.get().agentSpeed * ((IG.dyn && IG.dyn.agentSpeed) || 1);
    return base / speed;
  }
  function bulk() { return 1 + Math.floor(IG.Mods.get().agentPower); }

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

  // Pause switch for every agent at once (a player setting, so it survives prestige). Paused agents keep their
  // posts but their timers stop, so resuming never triggers a burst of stored-up actions.
  function paused() { return !!IG.state.settings.agentsPaused; }
  function setPaused(on) {
    on = !!on;
    if (paused() === on) return;
    IG.state.settings.agentsPaused = on;
    IG.Log.add(on ? 'Your agents stand down and await your word.' : 'Your agents return to their work.', 'system');
    IG.Bus.emit('agentsPaused', on);
  }

  function tick(dt) {
    if (paused()) return;
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

  const Agents = { list, typeUnlocked, countOfType, recruitCost, upgradeCost, areaAvailable, crewCap, occupants, hasRoom,
    eligibleAreas, freeAreaFor, canRecruit, assign, recruit, upgrade, promoteTargets, promoteCost, promoteLevel, canPromote,
    promote, autoStaff, paused, setPaused, interval, bulk, buyInEra, actions, extraActions: {},
    maxLevel() { return list().reduce((m, a) => Math.max(m, a.level), 0); } };
  IG.Agents = Agents;
})();
