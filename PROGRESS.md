# PROGRESS

## Phase checklist
- [x] 1. Setup + core engine (loop, big numbers, save/load/export/import, offline + welcome back, number
       formatting, dev mode, config). Stone Age playable.
- [x] 2. Eras 2–7: generators, research, agents, buy multipliers, achievements, stats, event log, unlock
       teasers, era color themes.
- [ ] 3. Prestige and the Immortal's Power Tree.
- [ ] 4. Interstellar Age: planet types, habitability, cohorts, maturation, colony ships, galaxy canvas,
       20,000-world transition.
- [ ] 5. Galactic War Age: war production chain, factions, fronts, attrition, endless escalation,
       military tech.
- [ ] 6. Visual polish and sound: SVG icon set, particles, pop-ups, era transitions, audio.
- [ ] 7. Balancing: headless pacing simulation, config tuning to hit pacing targets, bug fixes.

## Log
### Phase 1 — core engine + Stone Age
- Global namespace `IG`, classic scripts (works from file://). break_infinity.js vendored in `lib/`.
- Fixed 20 ticks/s loop from real elapsed time; gaps > 10 s use large-step `IG.Offline.simulate`.
- Effects/modifier system (`js/core/modifiers.js`) compiled on change + per-tick dynamic multipliers.
- Generators with multi-resource geometric costs, buy x1/x10/x100/Max, ×2 upgrades at owned thresholds.
- Stone Age: Forage click, 4 generators, 8-tech research tree, milestone (food, stone, Copper Lore).
- Save: localStorage autosave (30 s), manual save, export/import (base64), hard reset (double confirm),
  SAVE_VERSION + migrations; Decimals serialized as `{"$d": "..."}`.
- Offline progress (24 h default cap) with welcome-back summary panel.
- Number formats: suffix / scientific / engineering. Tooltips, event log (Chronicle), toasts, modals.
- Dev mode: type `aeon` or `?dev=1`; backquote toggles panel (resources, production ×, skip time, jump
  era, grant PP, meet milestone).
- `node tools/check.js` = syntax check + headless smoke test + save round-trip + offline cap test.

### Phase 2 — Eras 2–7 (Bronze → Spacefaring)
- 7 eras total in config, each with 4 generators, a 7–9 tech research tree and a milestone.
- New resources: Bronze, Knowledge (research currency), Coin, Faith, Energy, Compute, Alloy.
- Era mechanics (each its own system + Production-tab panel):
  Trade Routes (Classical, additive per-level bonus), Rites (Medieval, timed buffs w/ escalating cost),
  Power Grid (Industrial, sector multipliers with energy upkeep + brown-out), Compute Programs (Atomic,
  slider allocation of compute capacity), Megaprojects (Spacefaring, production share diverted to builds).
- Synergies: later resources (produced this run) multiply every earlier era's generators (log-based).
- Agents: 8 types (Shaman → Navigator), recruit/assign/upgrade, 14 areas, procedurally generated names.
- 46 achievements (×1.02 production each), Stats tab, Achievements tab, unlock teasers ("???") for
  tabs, mechanics, agent types, locked generators and the next era. Per-era CSS themes.
- `tools/sim.js` first version (greedy active-player strategy; reports era times per run).

## Known issues
- none yet

## Balance notes
- Trade routes were originally multiplicative per level and caused a runaway coin→routes loop (1e270 in
  minutes). Now additive: 1 + 0.5 × tradeMult × level. Keep level-based effects additive or give them
  steeper cost growth than effect growth.
- Sim (no prestige, 4 clicks/s): Bronze 21m, Classical 46m, Medieval 1h03, Industrial 1h15, Atomic 1h55.
  Needs tuning in Phase 7 (target: Classical within 30–45 min).
