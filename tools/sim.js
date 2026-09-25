'use strict';
// Headless pacing simulator. Plays the real game code (loaded from index.html's logic scripts) with a simple
// purchasing strategy and reports how long each era takes per run (prestige to prestige).
//
//   node tools/sim.js [flags]
//     --hours 8          simulated play time            --dt 3          seconds per simulation step
//     --cps 4            forage clicks/s (early eras)    --manage 2      seconds between strategy decisions
//     --prestige auto    'auto' | 'none'                 --stall 20      minutes without a new era → prestige
//     --mult 1           flat production multiplier (models prestige power when testing era lengths)
//     --set a.b.0=v      override any config value (repeatable), e.g. --set eras.2.milestone.0.amount=1e6
//     --runs 30          stop after this many prestiges  --verbose       resource snapshots every 10 min
//     --warlog           war state every 5 min           --snapshot f    write state at first contact
//     --from f           start from a saved state file
//
// Strategy (an attentive active player):
//  - forages `cps` times per second in the Stone/Bronze ages, half that until the Industrial Age
//  - buys research, generators, upgrades, trade routes, rites, grid, compute, megaprojects, agents greedily
//    (era milestones count resources gathered since the era began, so spending never delays them)
//  - builds colony arks only while there is space; auto-allocates the fleet; buys war industry
//  - advances eras immediately; prestiges when the gain ≥ 2× lifetime points + 10, or when stalled
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
const STALL = parseFloat(arg('stall', 20)) * 60;
const MULT = parseFloat(arg('mult', 1));            // flat production multiplier (models prestige power)
const MANAGE_EVERY = parseFloat(arg('manage', 2));  // seconds between strategy decisions
const WARLOG = !!arg('warlog', false);
const SNAP_OUT = arg('snapshot', '');   // write the state at first contact to this file
const SNAP_IN = arg('from', '');        // start from a saved state file
let warLogAt = 0;
let snapDone = false;    // save for the milestone once it is this many seconds away   // minutes without a new era before a stalled prestige

let clock = 1e12;
const { IG, context } = load({ clock: () => clock });
const Decimal = context.Decimal;
// --set a.b.0.c=value overrides config values (for parallel balance experiments)
for (let i = 0; i < args.length; i++) {
  if (args[i] !== '--set') continue;
  const [path, raw] = args[i + 1].split('=');
  const keys = path.split('.');
  let o = IG.CONFIG;
  for (let k = 0; k < keys.length - 1; k++) o = o[keys[k]];
  let v = Number(raw);
  if (Number.isNaN(v)) { try { v = JSON.parse(raw); } catch (e) { v = raw; } }
  o[keys[keys.length - 1]] = v;
}
IG.Game.newGame();
if (SNAP_IN) { IG.state = IG.Save.hydrate(IG.Save.deserialize(require('fs').readFileSync(SNAP_IN, 'utf8'))); IG.Game.refresh(); }
if (MULT !== 1) { IG.state.meta.devMult = MULT; IG.Mods.dirty = true; }
const C = IG.CONFIG;
const D = IG.D;

// ------------------------------------------------------------------ strategy helpers
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
  while ((id = IG.Research.cheapestAffordable()) && n++ < 20) IG.Research.buy(id, true);
  // agents: fill free posts, promote agents stuck in works two or more eras old, then keep them upgraded
  for (const t in C.agents.types) {
    if (IG.Agents.canRecruit(t) && affordableWith(IG.Agents.recruitCost(t), res, 0.3)) IG.Agents.recruit(t, true);
  }
  for (const a of s.run.agents) {
    const ar = C.agents.areas[a.area];
    if (ar && ar.kind === 'gen' && ar.era <= s.run.era - 2) {
      const t = IG.Agents.promoteTargets(a).filter((x) => IG.Agents.canPromote(a, x))
        .sort((x, y) => C.agents.types[y].era - C.agents.types[x].era)[0];
      if (t && affordableWith(IG.Agents.promoteCost(a, t), res, 0.3)) IG.Agents.promote(a, t, true);
    }
  }
  IG.Agents.autoStaff();
  for (const a of s.run.agents) {
    if (affordableWith(IG.Agents.upgradeCost(a), res, 0.1)) IG.Agents.upgrade(a, true);
  }
  if (IG.Trade.unlocked()) { let t; let k = 0; while ((t = IG.Trade.cheapest()) && k++ < 10 && affordableWith(IG.Trade.cost(t), res, 0.5)) IG.Trade.buy(t, true); }
  if (IG.Rites.unlocked()) for (const r in C.rites.list) if (IG.Rites.available(r) && !IG.Rites.active(r) && affordableWith(IG.Rites.cost(r), res, 0.3)) IG.Rites.invoke(r, true);
  if (IG.Grid.unlocked() && !IG.Agents.occupants('grid').length) IG.Agents.actions.grid({ level: 1 });
  if (IG.Compute.unlocked() && IG.Compute.totalShare() < 0.99) IG.Compute.balance();
  if (IG.Mega.unlocked() && !s.run.mega.active) { const m = IG.Mega.cheapestAvailable(); if (m) IG.Mega.start(m); }
  if (IG.War && IG.War.active()) IG.War.autoAllocate();
  buyGenerators(res);
  if (IG.Expansion && IG.Expansion.active()) IG.Expansion.buildShips('max', true);
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
let manageAcc = 0;
while (t < end) {
  const s = IG.state;
  IG.Game.tick(DT);
  clock += DT * 1000;
  t += DT;
  const clicks = s.run.era <= 1 ? CPS : s.run.era <= 3 ? CPS / 2 : 0;
  if (clicks > 0) IG.Prod.forage(clicks * DT, true);
  manageAcc += DT;
  if (manageAcc >= MANAGE_EVERY) { manageAcc = 0; manage({}); }
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
  if (SNAP_OUT && s.run.war && !snapDone) {
    snapDone = true;
    require('fs').writeFileSync(SNAP_OUT, IG.Save.serialize(s));
    console.log('  snapshot written at ' + IG.fmtTime(t));
  }
  if (WARLOG && s.run.war && t - warLogAt >= 300) {
    warLogAt = t;
    const w = s.run.war, g = IG.Prod.cache.gross;
    console.log('  war t+' + IG.fmtTime(s.run.time - w.start) + ' fleet ' + IG.fmt(IG.War.fleetStrength()) + ' ships ' + IG.fmt(s.run.resources.warships) +
      ' leg ' + IG.fmt(s.run.resources.legions) + ' mat/s ' + IG.fmt(g.materiel) + ' sm/s ' + IG.fmt(g.starmatter) + ' loss/s ' + IG.fmt(w.lossRate) +
      ' won ' + w.won + ' lost ' + w.lost + ' worlds ' + IG.fmtInt(IG.Expansion.totalWorlds()) +
      ' gens ' + ['foundry', 'yard', 'barracks', 'forge_world'].map((k) => s.run.gens[k].n).join('/') +
      ' | ' + w.fronts.map((f) => (f.progress * 100).toFixed(0) + '%:' + IG.fmt(f.enemy)).join(' ') +
      ' | tech ' + ['lances', 'war_economy', 'mobilization', 'keels'].map((k) => IG.Research.level(k)).join('/'));
  }
  // record eras entered by any means (auto-advance such as First Contact included)
  for (let e = 1; e <= s.run.era; e++) if (cur.eras[e] === undefined && s.run.eraTimes[e] !== undefined) { cur.eras[e] = s.run.eraTimes[e]; lastEraAt = s.run.time; }
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
let cum = 0;
const firstReach = {};
results.forEach((r, i) => {
  for (let e = 1; e < C.eras.length; e++) if (r.eras[e] !== undefined && firstReach[e] === undefined) firstReach[e] = { run: i + 1, total: cum + r.eras[e] };
  cum += r.time;
});
console.log('\nFirst time each era was reached (run #, total play time):');
for (let e = 1; e < C.eras.length; e++) {
  const f = firstReach[e];
  console.log('  ' + C.eras[e].name.padEnd(18) + (f ? 'run ' + f.run + ', ' + IG.fmtTime(f.total) : 'not reached'));
}
if (IG.state.run.war) console.log('War: fronts won ' + IG.state.perm.stats.frontsWon + ', lost ' + IG.state.perm.stats.frontsLost + ', worlds ' + IG.fmtInt(IG.Expansion.totalWorlds()));
const firstInterstellar = results.findIndex((r) => r.eras[7] !== undefined);
console.log('\nFirst prestige available (Classical) in run 1 at: ' + (results[0].eras[2] !== undefined ? IG.fmtTime(results[0].eras[2]) : 'never'));
console.log('First Interstellar: ' + (firstInterstellar >= 0 ? 'run ' + (firstInterstellar + 1) : 'not reached'));
