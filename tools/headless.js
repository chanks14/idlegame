'use strict';
// Loads the game's logic scripts (everything in index.html except UI/browser-only files) into a Node vm
// context, so the real game code can be simulated headlessly.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const BROWSER_ONLY = [/^js\/ui\//, /^js\/loop\.js$/, /^js\/main\.js$/, /^assets\//];

function scriptList() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const re = /<script\s+src="([^"]+)"/g;
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

function logicScripts() {
  return scriptList().filter((s) => !BROWSER_ONLY.some((r) => r.test(s)));
}

// Returns the IG namespace from a fresh context. opts.clock: function returning ms for IG.util.now.
function load(opts) {
  opts = opts || {};
  const context = { console, Math, Date, JSON, setTimeout, clearTimeout };
  context.globalThis = context;
  vm.createContext(context);
  for (const rel of logicScripts()) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, context, { filename: rel });
  }
  const IG = context.IG;
  if (opts.clock) IG.util.now = opts.clock;
  return { IG, context };
}

module.exports = { load, scriptList, logicScripts, ROOT };
