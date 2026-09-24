# CLAUDE.md — The Undying Hand (incremental idle game)

## Start of every session
1. Read `PROGRESS.md` first: it lists what is built, what is next, known issues and balance notes.
2. Read `DESIGN.md` when starting a new feature (Part 1 = original brief, Part 2 = implementation decisions).

## Tech rules
- Plain HTML/CSS/JavaScript. **No framework, no build step.** The game must run by double-clicking
  `index.html` (file://). Therefore: no ES modules, no fetch of local files. Every script is a classic
  `<script>` that attaches to the global namespace `IG` via `const IG = globalThis.IG || (globalThis.IG = {})`.
- **All big-number math uses break_infinity.js** (`lib/break_infinity.min.js`, global `Decimal`). Resource
  amounts, rates, costs and production multipliers are `Decimal`. Use `IG.D(x)` to coerce. Plain numbers are
  fine for counts (generators, worlds, levels), timers and small bounded factors.
- **All balance values live in `js/config.js`** (`IG.CONFIG`). Never hardcode costs, rates, thresholds,
  multipliers or timings in systems/UI code — add a config key instead.
- **Worlds are tracked as cohorts** (planet type + claim-time bucket), never individually.
- **Only original names and terms.** No franchise terminology (no Warhammer 40k, Star Wars, Star Trek, Mass
  Effect, etc. names or jargon).
- Game logic (`js/core`, `js/systems`, `js/game.js`) must never touch the DOM, so the headless simulator
  (`tools/sim.js`) can run it in Node. UI code lives in `js/ui` and only reads state / calls system APIs.
- Systems talk to the UI through `IG.Bus.emit(event, data)` (purchase, era, prestige, achievement, …).
- Performance: only update DOM nodes whose text/class changed (`IG.dom.setText`, `IG.dom.toggle`); UI
  refresh is throttled to ~10/sec; rebuild a tab only when `IG.UI.markDirty()` is called.
- Offline progress and throttled-tab catch-up use `IG.Offline.simulate()` (large steps, never tick-by-tick).

## File map
```
index.html              entry; script order matters (lib → config → core → systems → game → ui → main)
css/style.css           layout + per-era themes (body[data-era=…] CSS variables)
lib/                    break_infinity.js (MIT)
js/config.js            ALL balance values and content definitions (eras, generators, research, …)
js/core/                util (D, helpers), format (numbers/time), events (bus + log), state, modifiers
js/systems/             one file per major system: production, eras, research, agents, trade, rites,
                        grid, compute, megaprojects, achievements, prestige, powertree, expansion, war
js/game.js              IG.Game.tick(dt) — the single simulation step used by loop, offline and sim
js/save.js              localStorage save/load/export/import, SAVE_VERSION + migrations
js/offline.js           large-step offline simulation + summary
js/loop.js              browser fixed-tick loop (20 ticks/s from real elapsed time)
js/ui/                  dom helpers, icons, tabs, panels, juice (particles/popups), audio, dev mode
js/main.js              boot
tools/sim.js            headless pacing simulator (node tools/sim.js --help)
assets/                 optional file overrides for icons (see assets/README.md)
```

## Workflow rules
- One feature at a time; keep the game playable after each change (open index.html, no console errors).
- Run `node tools/sim.js` after balance changes and note results in PROGRESS.md.
- Run `node tools/check.js` (syntax + headless smoke test) before committing.
- At the end of each session: update `PROGRESS.md` (built, known issues, balance notes) and commit with a
  clear message.
- **Whenever the save format changes: bump `SAVE_VERSION` in `js/save.js` and add a migration** to
  `IG.Save.migrations` that upgrades the previous version.
- New content (generator, tech, achievement, node) = config entry first; systems read config generically.

## Conventions
- IDs are lowercase snake/camel strings; display names live in config `name` fields.
- Effects vocabulary is defined in `js/core/modifiers.js` (header comment). Reuse it for new content.
- Dev mode: type `aeon` (outside inputs) or open with `?dev=1`. Backquote toggles the dev panel.
