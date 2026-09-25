# PROGRESS

## Phase checklist
- [x] 1. Setup + core engine (loop, big numbers, save/load/export/import, offline + welcome back, number
       formatting, dev mode, config). Stone Age playable.
- [x] 2. Eras 2–7: generators, research, agents, buy multipliers, achievements, stats, event log, unlock
       teasers, era color themes.
- [x] 3. Prestige and the Immortal's Power Tree.
- [x] 4. Interstellar Age: planet types, habitability, cohorts, maturation, colony ships, galaxy canvas,
       20,000-world transition.
- [x] 5. Galactic War Age: war production chain, factions, fronts, attrition, endless escalation,
       military tech.
- [x] 6. Visual polish and sound: SVG icon set, particles, pop-ups, era transitions, audio.
- [x] 7. Balancing: headless pacing simulation, config tuning to hit pacing targets, bug fixes.

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
- Agents: 8 types (Shaman → Navigator), recruit/assign/upgrade (crews + promotion since the rework), 14 areas, procedurally generated names.
- 46 achievements (×1.02 production each), Stats tab, Achievements tab, unlock teasers ("???") for
  tabs, mechanics, agent types, locked generators and the next era. Per-era CSS themes.
- `tools/sim.js` first version (greedy active-player strategy; reports era times per run).

### Phase 3 — Prestige + Power Tree
- `js/systems/prestige.js`: legacy = Σ produced × resource legacy weight; points =
  floor(k·(log10 legacy − offset)^power · ppMult) + era bonus. Available from the Classical Age.
  Preview (gain, legacy, next point threshold) in the Power Tree tab and in the header chip (+N).
- Confirmation dialog lists what is kept vs lost; "The Long Night" transition; saves immediately.
- `js/systems/powertree.js`: 26 nodes in 9 branches (Dominion, Echoes of the First Fire, Retinue,
  Inheritance, The Long Sleep, Seedworlds, Diaspora, Iron Will, Endurance). Late branches need era 7/8
  reached once (`reqEra`). Special effects: starting resources, remembered research (`memory:N`),
  Shamans from the start. Radial SVG tree UI with glowing links, tooltips (now → after), locked states.
- New run bonuses are applied through `IG.Game.onNewRun` hooks.
- 5 prestige/tree achievements. Sim now prestiges like a reasonable player (gain ≥ 2× lifetime, or stalled).

### Phase 4 — Interstellar Age
- `js/systems/expansion.js`: 8 planet types (Garden, Ocean, Desert, Ice, Volcanic, Barren, Gas Giant,
  Asteroid Field) with base habitability, weight and yield. Colonies (hab ≥ 0.5) vs outposts (floor 15%).
- Worlds are cohorts `{type, t(bucket), n}`; maturity ramps 5% → 100% over `matureSeconds / maturation`;
  matured cohorts merge into one pool per type (cohort count stays ≈ types × buckets, tested at 3M worlds).
- Colony arks: cost Starmatter + Alloy, travel time, yield worlds per ark, deterministic type split with
  fractional carry. Ships in flight are merged into ≤ flightBucket-second groups.
- Worlds produce Starmatter (extra producer) and give +2%/world to every older era (dynamic multiplier).
- 20 Interstellar techs (many repeatable): drive, hulls, seeding, terraforming, cryo-berths, per-planet
  habitability, stellar industry, imperial integration. Governor agent + "Colony ships" automation area.
- Galaxy tab: procedural 4-arm spiral (7,000 stars, seeded), territory spreads from the homeworld by claim
  order (log scale of worlds), glow layers cached offscreen, frontier shimmer, ark sparks in flight.
- 20,000 worlds → First Contact → Galactic War era (war systems in Phase 5). 10 new achievements.

### Phase 5 — Galactic War
- New resources: Materiel, Warships, Legions. War generators: Arms Foundry, Forge World (materiel),
  Void Shipyard and Legion Barracks are *converters* (`consumes` in config): output limited by materiel
  stock/production, consumption shown as a drain. Converter efficiency shown in tooltips / War tab.
- `js/systems/war.js`: 4 original factions with numeric traits — Vorrhal Brood (fast growth, 2 fronts),
  Ashen Choir (high defense), Thessik Reach (high attrition), Hollow Lattice (regenerates, weak to
  Disruptors). Fronts: enemy regenerates toward Emax (depth × time escalation), Lanchester-like attrition
  both ways, progress ±1, victory captures a block of worlds as new cohorts and opens a deeper front,
  defeat loses a block of worlds. 5-minute grace after first contact, per-front lull after a collapse,
  core-world floor (50% of worlds at first contact). All math uses exact/exponential forms → stable for
  large offline steps (8 h offline ≈ 0.8 s).
- Allocation sliders per front, Auto-allocate (proportional to need) and Even split; Admiral agents
  ("Fleet command" area) auto-allocate. 16 military techs (weapons, armor, production, logistics,
  occupation, scorched retreat, faction counters incl. Disruptors).
- War tab: prominent empire totals, fleet panel, fronts, galaxy view with faction territories and
  glowing/dashed front arcs. Header shows worlds + fleet. 6 war achievements.

### Phase 6 — Visual polish and sound
- Full SVG icon set in `js/ui/icons.js`: 15 resources, 32 generators, 10 agents, 8 planets (own palettes),
  colony ark, 4 faction emblems, 9 era glyphs, UI glyphs, achievement badges by condition type (aliases).
  Every icon can be replaced via `assets/manifest.js` (`IG.ASSET_OVERRIDES`), see `assets/README.md`.
- Juice: number pop-ups on purchases, small particle bursts on gold pop-ups/forage, big bursts on era,
  milestone, achievement, prestige, front victory; generator card flash on purchase; era/prestige title
  card with double shockwave ring; per-era ambient background particles (embers, dust, smoke, green rain,
  twinkling stars, war sparks) at ~24 fps, paused when hidden, toggled by the Particles setting.
- `js/ui/audio.js`: Web Audio synthesized SFX (forage, buy, upgrade, research, ship launch, achievement,
  era swell, prestige boom + shimmer, front won/lost, welcome back). Mute button in header, M hotkey,
  volume slider + mute in Settings. Audio unlocks on first user gesture.
- Galaxy capacity (1e12 worlds) tapers claims only near the cap, keeping world counts finite.

### Phase 7 — Balancing and bug fixes
- `tools/sim.js` grew into a tuning harness: `--prestige auto|none`, `--cps`, `--manage` (seconds between
  decisions), `--reserve`, `--stall`, `--mult` (flat production multiplier), `--set path=value` (config
  override, repeatable), `--warlog`, `--snapshot file` (state at first contact), `--from file`.
- `tools/uitest.js`: Playwright smoke test through every era and tab (tooltips, buttons, prestige,
  export/import, offline). Found and fixed a Research-tab crash in eras 7–8 (describe.js config paths).
- Structural fixes found by simulation:
  - Trade routes multiplicative → additive (runaway coin loop).
  - Interstellar/war repeatable techs had cheap geometric costs vs. strong effects → super-exponential
    blow-ups; now Σ ln(effect)/ln(cost growth) ≈ 0.35 and lower caps.
  - Colonization is bounded by `freeSpace` (60k) + space opened by conquest (2× captured worlds); growth
    after first contact comes from winning fronts. "Launch max" and agents only launch useful arks.
  - Enemy base strength scales with Starmatter/s at first contact (fair start for any economy); slower time
    escalation (1.02/min); prestige bonus per front won (8 points).
  - Bootstrap generators of each era cost older resources with steep growth (1.3).
  - Power tree softened (×1.25 / ×1.5 per level) so prestige compresses runs gradually.
  - Saves store Decimals exactly as [mantissa, exponent] (SAVE_VERSION 2 + migration).
  - Suffix notation falls back to scientific beyond 1e303.
- Performance (browser, 5M worlds, 1e450 values): tick 0.13–0.57 ms, UI refresh < 1 ms; 24 h offline ≈ 0.4 s.

### Agents rework — crews and promotion
- Problem: one agent per area but unlimited recruiting, so extra agents sat idle (a 2nd Scholar always did).
- Areas now hold a crew: `agents.crewBase` = 2, `solo` areas (rites, grid, compute, mega, ships, fleet) hold 1.
  New `crewSize` modifier: +1 from Bureaucratic Machines (Atomic research) and Gathered Congregations (Retinue node,
  2 levels). Every crew member acts on its own timer; recruiting needs a free post (button explains why not).
- Upgrades now only add speed (removed `bulkEvery` level bulk); extra actions come from more crew members and
  the Remembered Names node.
- Promotion: an agent can rise to any unlocked type of a later era for 50% of that type's recruit cost, keeping
  half its levels (rounded up) and its post when the new type can staff it. "Promote…" dialog in the roster.
- Agents tab: free posts per type, crew counts (n/cap) in the area picker and overview, full areas disabled;
  the overview hides areas no unlocked type can staff. No save-format change (agents keep the same fields).
- Sim strategy fills free posts and promotes agents stuck in works two or more eras old.

## Known issues
- Pacing numbers come from an idealized simulated player; expect a human to be ~1.2–1.6× slower.
- The endless war is designed to stall eventually (enemy escalation is exponential in time); the intended
  answer is to prestige. Very long single war runs (> 3–4 h) are not finely tuned.
- Front lines on the galaxy view are arcs around the homeworld per faction sector — a stylized
  representation, not a simulation of territory.
- Audio starts only after the first click/keypress (browser autoplay policy).
- Offline simulation uses steps of up to 60 s: exact for production, approximate for war/agents.
- No save downgrade: a save exported from a newer version cannot be imported into an older build.
- Mobile layout is functional but not optimized.

## Balance notes
- Final pacing (`node tools/sim.js --hours 8 --dt 3 --manage 3`, idealized active player, 4 clicks/s):
  Classical (first prestige) run 1 at 26 m · Medieval run 2 · Industrial run 3 · Atomic run 4 ·
  Spacefaring run 5 · Interstellar run 6 at 3 h 07 m total · Galactic War run 7 at 4 h 10 m.
- Casual profile (`--cps 2 --manage 10`): Classical 27 m, Interstellar run 6 (3 h 10 m), War run 7 (4 h 28 m).
- Check-in profile (`--cps 1 --manage 120`, agents do most work): Classical 40 m, Interstellar run 7
  (5 h 22 m), War run 8 (6 h 46 m).
- After the agents rework (crews + promotion), same profiles: active Classical 25 m, Interstellar run 6
  (2 h 53 m), War run 7 (4 h 08 m); casual Classical 24 m, Interstellar run 6 (3 h 09 m), War run 7
  (4 h 13 m); check-in Classical 39 m, Interstellar run 7 (5 h 16 m), War run 8 (6 h 39 m). Pre-change
  baseline on the same build: active 3 h 07 m / 4 h 10 m, check-in 5 h 06 m / 6 h 30 m — within ~5%.
- War arc (from a first-contact snapshot): fast conquest for ~20 min, contested fronts for ~2–2.5 h
  (~75–140 fronts won, worlds 60k → ~4M), then escalation wins and the player prestiges.
- Levers: era milestone amounts (per-era length), bootstrap generator cost growth, power tree effect/cost
  ratios (how much each prestige compresses a run), `prestige.offset/power/eraBonus/frontBonus`,
  `expansion.shipCost/matureSeconds/travelSeconds/freeSpace`, `war.enemyScale/timeGrowthPerMin/depthGrowth`.
- Rule of thumb: any level-based effect needs cost growth much steeper than effect growth, or it must be
  additive — otherwise the resource that pays for it runs away.
- Trade routes were originally multiplicative per level and caused a runaway coin→routes loop (1e270 in
  minutes). Now additive: 1 + 0.5 × tradeMult × level.
