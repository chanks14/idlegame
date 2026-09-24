'use strict';
// Quick verification: syntax-check every script in index.html, then run a headless smoke test that plays
// the game for a while and asserts the state stays sane (no NaN, save round-trips).
//   node tools/check.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { load, scriptList, ROOT } = require('./headless');

let failures = 0;
function fail(msg) { failures++; console.error('FAIL:', msg); }

// 1. syntax
for (const rel of scriptList()) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { fail('missing script ' + rel); continue; }
  if (rel.startsWith('lib/')) continue;
  try { new vm.Script(fs.readFileSync(file, 'utf8'), { filename: rel }); } catch (e) { fail('syntax ' + rel + ': ' + e.message); }
}

// 2. smoke test
const { IG } = load();
IG.Game.newGame();
const C = IG.CONFIG;

function sane() {
  const s = IG.state;
  for (const r in s.run.resources) {
    const v = s.run.resources[r];
    if (!(v instanceof IG.D(0).constructor) || !isFinite(v.mantissa) || isNaN(v.mantissa)) return 'resource ' + r + ' = ' + v;
  }
  return null;
}

const ticks = parseInt(process.argv[2] || '20000', 10);
let t = 0;
for (let i = 0; i < ticks; i++) {
  IG.Game.tick(0.5);
  t += 0.5;
  if (i % 4 === 0) IG.Prod.forage(2, true);
  // naive buyer
  for (const id in C.generators) if (IG.Prod.unlocked(id)) { IG.Prod.buy(id, 'max', true); IG.Prod.buyUpgrade(id, true); }
  let rid; while ((rid = IG.Research.cheapestAffordable())) IG.Research.buy(rid, true);
  if (IG.Agents) IG.Agents.autoStaff && IG.Agents.autoStaff();
  if (IG.Eras.canAdvance()) IG.Eras.advance();
  const bad = sane();
  if (bad) { fail('insane state at t=' + t + ': ' + bad); break; }
}
console.log('smoke: simulated ' + IG.fmtTime(t) + ', era ' + IG.state.run.era + ' (' + C.eras[IG.state.run.era].name + ')');

// 3. save round trip
const str = IG.Save.serialize(IG.state);
const back = IG.Save.hydrate(IG.Save.deserialize(str));
if (!back.run.resources.food.eq(IG.state.run.resources.food)) fail('save round-trip mismatch');
if (IG.Save.serialize(back).length < str.length * 0.9) fail('save round-trip lost data');

// 4. offline simulation
IG.state = back;
IG.Game.refresh();
const sum = IG.Offline.simulate(3600 * 30);
if (!sum.capped) fail('offline cap not applied');
const bad = sane();
if (bad) fail('offline produced insane state: ' + bad);

if (failures) { console.error(failures + ' failure(s)'); process.exit(1); }
console.log('check: OK');
