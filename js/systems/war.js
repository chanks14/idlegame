'use strict';
// Galactic War — purely numeric fronts. Resources → Materiel → Warships/Legions → fleet strength → fronts.
//   run.war = { start, fronts:[{id, faction, name, depth, progress, enemy(Decimal), share}], won, lost, seq }
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  function W() { return IG.CONFIG.war; }
  function st() { return IG.state.run.war; }
  function active() { return !!IG.state.run.war; }
  function faction(id) { return W().factions[id]; }
  function trait(fid, k, def) { const t = faction(fid).traits; return t[k] !== undefined ? t[k] : def; }

  function minutesAtWar() { return active() ? Math.max(0, (IG.state.run.time - st().start) / 60) : 0; }

  function emax(f) {
    const w = W();
    const growth = trait(f.faction, 'growth', 1);
    return D(w.baseEnemy * trait(f.faction, 'strength', 1))
      .mul(D(w.depthGrowth).pow(f.depth))
      .mul(D(w.timeGrowthPerMin).pow(minutesAtWar() * growth))
      .mul(IG.Mods.get().enemyStrength);
  }

  function newFront(fid, depth) {
    const e = st();
    e.seq++;
    const names = W().frontNames;
    const f = { id: e.seq, faction: fid, name: names[(e.seq - 1) % names.length] + (e.seq > names.length ? ' ' + (Math.floor((e.seq - 1) / names.length) + 1) : ''),
      depth, progress: 0, enemy: D(0), share: 0 };
    f.enemy = emax(f).mul(0.6);
    return f;
  }

  function init() {
    const e = { start: IG.state.run.time, fronts: [], won: 0, lost: 0, seq: 0, lossRate: D(0),
      core: Math.floor(IG.Expansion.totalWorlds() * W().coreFloor) };
    IG.state.run.war = e;
    for (const fid in W().factions) {
      for (let k = 0; k < faction(fid).fronts; k++) e.fronts.push(newFront(fid, 0));
    }
    evenSplit();
  }

  // ---------------------------------------------------------------- fleet
  function unitPower(unit) {
    const m = IG.Mods.get();
    return D(W().unitPower[unit]).mul(m.unitPower[unit] || 1).mul(m.fleetPower);
  }
  function fleetStrength() {
    const r = IG.state.run.resources;
    if (!r.warships) return D(0);
    return r.warships.mul(unitPower('warship')).add(r.legions.mul(unitPower('legion')));
  }
  function counter(fid) { return IG.Mods.get().counter[fid] || 1; }
  function committed(f, fleet) { return (fleet || fleetStrength()).mul(f.share).mul(counter(f.faction)); }

  // ---------------------------------------------------------------- allocation
  function setShare(id, v) {
    const fronts = st().fronts;
    const f = fronts.find((x) => x.id === id);
    if (!f) return;
    v = IG.util.clamp(v, 0, 1);
    f.share = v;
    let others = 0;
    for (const x of fronts) if (x !== f) others += x.share;
    if (v + others > 1 && others > 0) {
      const scale = (1 - v) / others;
      for (const x of fronts) if (x !== f) x.share *= scale;
    }
  }
  function evenSplit() {
    const fronts = st().fronts;
    for (const f of fronts) f.share = 1 / fronts.length;
  }
  // Shares proportional to what each front needs (enemy strength / counter bonus), min 3% each.
  function autoAllocate() {
    const fronts = st().fronts;
    const need = fronts.map((f) => f.enemy.div(counter(f.faction)));
    let tot = D(0);
    for (const n of need) tot = tot.add(n);
    if (tot.lte(0)) { evenSplit(); return; }
    let sum = 0;
    fronts.forEach((f, i) => { f.share = Math.max(0.03, need[i].div(tot).toNumber()); sum += f.share; });
    for (const f of fronts) f.share /= sum;
  }
  function totalShare() { return active() ? st().fronts.reduce((a, f) => a + f.share, 0) : 0; }

  // ---------------------------------------------------------------- outcomes
  function captureSize(f) {
    return Math.floor(W().captureBase * Math.pow(W().captureGrowth, f.depth) * IG.Mods.get().captureMult);
  }
  function lossSize() {
    const worlds = IG.Expansion.totalWorlds();
    const want = Math.floor(Math.max(W().lossMin, worlds * W().lossFrac) * IG.Mods.get().lossMult);
    return Math.max(0, Math.min(want, worlds - (active() ? st().core || 0 : 0)));
  }

  function win(f, idx) {
    const s = IG.state, e = st();
    const n = captureSize(f);
    IG.Expansion.claim(n, s.run.time);
    e.won++;
    s.perm.stats.frontsWon++;
    IG.Log.add('Victory at ' + f.name + ' against the ' + faction(f.faction).name + '. ' + IG.fmtInt(n) + ' worlds taken. A deeper front opens.', 'war');
    IG.Bus.emit('frontWon', { front: f, worlds: n });
    const nf = newFront(f.faction, f.depth + 1);
    nf.share = f.share;
    e.fronts[idx] = nf;
  }

  function lose(f) {
    const s = IG.state, e = st();
    const n = IG.Expansion.lose(lossSize());
    e.lost++;
    s.perm.stats.frontsLost++;
    f.progress = 0;
    f.lull = W().lullSeconds;
    f.enemy = f.enemy.mul(W().lullEnemyFrac);
    IG.Log.add('The line at ' + f.name + ' collapses. The ' + faction(f.faction).name + ' overrun ' + IG.fmtInt(n) + ' worlds.', 'warn');
    IG.Bus.emit('frontLost', { front: f, worlds: n });
  }

  // ---------------------------------------------------------------- tick
  function tick(dt, s) {
    if (!active()) return;
    const w = W(), e = st(), m = IG.Mods.get();
    const fleet = fleetStrength();
    const grace = s.run.time - e.start < w.graceSeconds;
    let loss = D(0);
    for (let i = 0; i < e.fronts.length; i++) {
      const f = e.fronts[i];
      const Em = emax(f);
      // regeneration toward Emax (exact exponential form: stable for large offline steps)
      const k = w.regenPerSec * trait(f.faction, 'regen', 1);
      f.enemy = Em.sub(Em.sub(f.enemy).mul(Math.exp(-k * dt)));
      const P = committed(f, fleet);
      const E = f.enemy;
      const tot = P.add(E);
      if (tot.gt(0)) {
        const pFrac = P.div(tot).toNumber(), eFrac = 1 - pFrac;
        // attrition both ways, each bounded by the smaller side (Lanchester-like, stable)
        const enemyLoss = P.mul(w.playerLethality * 2 * eFrac);
        f.enemy = Decimal.max(Em.mul(w.floorFrac), E.sub(enemyLoss.mul(dt)));
        if (P.gt(0)) {
          loss = loss.add(E.mul(w.enemyLethality * trait(f.faction, 'lethality', 1) * m.attrition * 2 * pFrac).div(counter(f.faction)));
        }
        const ratio = pFrac - eFrac;
        let dp = ratio >= 0 ? w.advanceSpeed * m.frontSpeed * ratio : w.retreatSpeed * ratio;
        if (f.lull > 0) f.lull -= dt;
        if ((grace || f.lull > 0) && dp < 0) dp = 0;
        f.progress += dp * dt;
      }
      if (f.progress >= 1) win(f, i);
      else if (f.progress <= -1) lose(f);
    }
    // apply fleet attrition proportionally to both unit types (exponential form)
    e.lossRate = loss;
    if (loss.gt(0) && fleet.gt(0)) {
      const keep = Math.exp(-Math.min(20, loss.div(fleet).toNumber() * dt));
      const r = s.run.resources;
      r.warships = r.warships.mul(keep);
      r.legions = r.legions.mul(keep);
    }
  }

  IG.Eras.onEnter.push(function (era, s) {
    if (era === 8 && !s.run.war) {
      init();
      IG.Log.add('War. ' + Object.keys(W().factions).map((k) => faction(k).name).join(', ') + ' — all at once. Build fleets before the grace of surprise runs out.', 'war');
    }
  });
  IG.Game.addHook(tick);
  IG.Agents.extraActions.warfleet = function () { if (active()) autoAllocate(); };

  IG.War = { active, init, emax, fleetStrength, unitPower, committed, counter, setShare, evenSplit, autoAllocate, totalShare,
    captureSize, lossSize, minutesAtWar, faction,
    graceLeft() { return active() ? Math.max(0, W().graceSeconds - (IG.state.run.time - st().start)) : 0; },
    devWin() { if (active()) win(st().fronts[0], 0); },
  };
})();
