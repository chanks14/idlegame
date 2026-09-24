# PROGRESS

## Phase checklist
- [x] 1. Setup + core engine (loop, big numbers, save/load/export/import, offline + welcome back, number
       formatting, dev mode, config). Stone Age playable.
- [ ] 2. Eras 2–7: generators, research, agents, buy multipliers, achievements, stats, event log, unlock
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

## Known issues
- none yet

## Balance notes
- none yet
