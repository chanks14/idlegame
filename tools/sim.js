'use strict';
// Headless pacing simulator. Plays the real game code with a simple purchasing strategy and reports how long
// each era takes, per run (prestige-to-prestige).
//
//   node tools/sim.js [--hours 12] [--dt 1] [--cps 4] [--runs 8] [--verbose] [--prestige auto|none]
//
// Strategy (an attentive active player):
//  - forages `cps` times per second while forage is meaningful (Stone/Bronze), less later
//  - buys research, generators, upgrades, trade routes, rites, grid, compute, megaprojects, agents greedily,
//    but reserves resources it needs for the current era milestone once that milestone is close
//  - advances eras as soon as possible; prestiges using the rule in `shouldPrestige`
const { load } = require('./headless');

const args = process.argv.slice(2);
function arg(name, def) {
  const i = args.indexOf('--' + name);
  if (i < 0) return def;
  const v = args[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
}
const HOURS = parseFloat(arg('hours', 12));
const DT = parseFloat(arg('dt', 1));
const CPS = parseFloat(arg('cps', 4));
const MAX_RUNS = parseInt(arg('runs', 30), 10);
const VERBOSE = !!arg('verbose', false);
const PRESTIGE = arg('prestige', 'auto');
const STALL = parseFloat(arg('stall', 15)) * 60;   // minutes without a new era before a stalled prestige

let clock = 1e12;
const { IG, context } = load({ clock: () => clock });
const Decimal = context.Decimal;
IG.Game.newGame();
const C = IG.CONFIG;
const D = IG.D;

// ------------------------------------------------------------------ strategy helpers
function reserved() {
  // resources needed for the milestone that we are close to affording → only spend small fractions of them
  const out = {};
  const e = C.eras[IG.state.run.era];
  if (!e.milestone) return out;
  for (const c of e.milestone) {
    if (c.type !== 'res') continue;
    const need = D(c.amount).mul(IG.Mods.get().eraReq);
    const have = IG.state.run.resources[c.res];
    if (have.gte(need)) { out[c.res] = 1; continue; }
    const rate = IG.Prod.cache.rates[c.res] || D(0);
    if (rate.gt(0) && need.sub(have).div(rate).lt(600)) out[c.res] = 1;
  }
  return out;
}

function affordableWith(costs, res, frac) {
  const r = IG.state.run.resources;
  for (const k in costs) {
    const limit = res[k] ? r[k].mul(0.05) : r[k].mul(frac);
    if (limit.lt(costs[k])) return false;
  }
  return true;
}

// Largest n of generator `id` purchasable while respecting the spending limits.
function maxWithin(id, res, frac) {
  const g = C.generators[id], owned = IG.state.run.gens[id].n, r = IG.state.run.resources;
  const cm = IG.Mods.get().cost[id] || 1;
  let best = Infinity;
  for (const k in g.cost) {
    const limit = res[k] ? r[k].mul(0.05) : r[k].mul(frac);
    const n = Decimal.affordGeometricSeries(limit, D(g.cost[k][0] * cm), D(g.cost[k][1]), owned).toNumber();
    if (n < best) best = n;
  }
  return Math.max(0, Math.floor(best));
}

function buyGenerators(res) {
  const s = IG.state;
  for (let e = s.run.era; e >= 0; e--) {
    for (const id of IG.Prod.listForEra(e)) {
      if (!IG.Prod.unlocked(id)) continue;
      const info = IG.Prod.upgradeInfo(id);
      if (info && info.ready && affordableWith(info.cost, res, 1)) IG.Prod.buyUpgrade(id, true);
      // older eras only get a share of holdings, so current-era purchases are not starved
      const n = maxWithin(id, res, e === s.run.era ? 1 : 0.5);
      if (n > 0) IG.Prod.buy(id, String(n), true);
    }
  }
}

function manage(res) {
  const s = IG.state;
  // research first — it is the cheapest multiplier
  let id, n = 0;
  while ((id = IG.Research.cheapestAffordable()) && n++ < 20) {
    if (!affordableWith(IG.Research.cost(id), res, 1)) break;
    IG.Research.buy(id, true);
  }
  // agents: recruit one of each unlocked type, then keep them upgraded
  for (const t in C.agents.types) {
    if (!IG.Agents.typeUnlocked(t)) continue;
    const staffed = C.agents.types[t].areas.filter((a) => IG.Agents.areaAvailable(a) && !IG.Agents.occupant(a)).length;
    if (staffed > 0 && affordableWith(IG.Agents.recruitCost(t), res, 0.3)) IG.Agents.recruit(t, true);
  }
  for (const a of s.run.agents) {
    if (!a.area) { const free = IG.Agents.eligibleAreas(a).find((x) => !IG.Agents.occupant(x)); if (free) IG.Agents.assign(a, free); }
    if (affordableWith(IG.Agents.upgradeCost(a), res, 0.1)) IG.Agents.upgrade(a, true);
  }
  if (IG.Trade.unlocked()) { let t; let k = 0; while ((t = IG.Trade.cheapest()) && k++ < 10 && affordableWith(IG.Trade.cost(t), res, 0.5)) IG.Trade.buy(t, true); }
  if (IG.Rites.unlocked()) for (const r in C.rites.list) if (IG.Rites.available(r) && !IG.Rites.active(r) && affordableWith(IG.Rites.cost(r), res, 0.3)) IG.Rites.invoke(r, true);
  if (IG.Grid.unlocked() && !IG.Agents.occupant('grid')) IG.Agents.actions.grid({ level: 1 });
  if (IG.Compute.unlocked() && IG.Compute.totalShare() < 0.99) IG.Compute.balance();
  if (IG.Mega.unlocked() && !s.run.mega.active) { const m = IG.Mega.cheapestAvailable(); if (m) IG.Mega.start(m); }
  if (IG.Expansion && IG.Expansion.active()) IG.Expansion.buildShips('max', true);
  if (IG.War && IG.War.active()) IG.War.autoAllocate();
  buyGenerators(res);
}

// ------------------------------------------------------------------ prestige rule
// A reasonable player: prestige when the pending gain at least doubles their lifetime points, or when progress
// has stalled (no new era for a while) and the gain is still meaningful.
let lastEraAt = 0;
function shouldPrestige() {
  if (PRESTIGE === 'none' || !IG.Prestige || !IG.Prestige.canPrestige()) return false;
  const s = IG.state;
  const gain = IG.Prestige.gain();
  const total = s.perm.ppTotal;
  const t = s.run.time;
  if (t < 600) return false;
  if (gain >= 2 * total + 10) return true;
  const stalled = t - lastEraAt > STALL;
  return stalled && gain >= Math.max(1, 0.5 * total);
}

// ------------------------------------------------------------------ run
const results = [];
let cur = { eras: [0], start: 0 };
let t = 0;
const end = HOURS * 3600;
let lastLog = 0;
while (t < end) {
  const s = IG.state;
  IG.Game.tick(DT);
  clock += DT * 1000;
  t += DT;
  const clicks = s.run.era <= 1 ? CPS : s.run.era <= 3 ? CPS / 2 : 0;
  if (clicks > 0) IG.Prod.forage(clicks * DT, true);
  manage(reserved());
  if (IG.Eras.canAdvance()) {
    IG.Eras.advance();
    cur.eras[s.run.era] = s.run.time;
    lastEraAt = s.run.time;
    if (VERBOSE) console.log('  [' + IG.fmtTime(t) + '] run ' + (results.length + 1) + ' reached ' + C.eras[s.run.era].name + ' at ' + IG.fmtTime(s.run.time));
  }
  if (VERBOSE && t - lastLog >= 600) {
    lastLog = t;
    const rs = IG.UI ? '' : Object.keys(C.resources).filter((r) => C.resources[r].era <= s.run.era)
      .map((r) => r + '=' + IG.fmt(s.run.resources[r]) + '(' + IG.fmt(IG.Prod.cache.rates[r] || 0) + '/s)').join(' ');
    console.log('    t=' + IG.fmtTime(t) + ' era=' + s.run.era + ' ' + rs);
  }
  if (shouldPrestige()) {
    const gain = IG.Prestige.gain();
    results.push({ eras: cur.eras.slice(), time: s.run.time, pp: gain, highest: s.run.era });
    IG.Prestige.doPrestige(true);
    if (IG.Sim && IG.Sim.spendPoints) IG.Sim.spendPoints();
    else if (IG.PowerTree) IG.PowerTree.autoSpend();
    lastEraAt = 0;
    cur = { eras: [0] };
    if (results.length >= MAX_RUNS) break;
  }
}
if (cur) results.push({ eras: cur.eras.slice(), time: IG.state.run.time, pp: IG.Prestige ? IG.Prestige.gain() : 0, highest: IG.state.run.era, unfinished: true });

// ------------------------------------------------------------------ report
const eraNames = C.eras.map((e) => e.name.replace(' Age', ''));
console.log('\nSimulated ' + IG.fmtTime(t) + ' (dt=' + DT + 's, ' + CPS + ' clicks/s early)\n');
const header = ['Run', 'Length', 'PP'].concat(eraNames.slice(1));
console.log(header.map((h) => h.padEnd(11)).join(''));
results.forEach((r, i) => {
  const cols = [String(i + 1) + (r.unfinished ? '*' : ''), IG.fmtTime(r.time), String(r.pp)];
  for (let e = 1; e < C.eras.length; e++) cols.push(r.eras[e] !== undefined ? IG.fmtTime(r.eras[e]) : '-');
  console.log(cols.map((c) => c.padEnd(11)).join(''));
});
const firstInterstellar = results.findIndex((r) => r.eras[7] !== undefined);
console.log('\nFirst prestige available (Classical) in run 1 at: ' + (results[0].eras[2] !== undefined ? IG.fmtTime(results[0].eras[2]) : 'never'));
console.log('First Interstellar: ' + (firstInterstellar >= 0 ? 'run ' + (firstInterstellar + 1) : 'not reached'));
