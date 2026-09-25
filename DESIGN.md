# The Undying Hand — From Stone Age to Galactic Empire

Design reference for the game. Part 1 is the original design brief (authoritative). Part 2 records the
concrete implementation decisions made to realize it (names, mechanics, formulas). Balance numbers live
in `js/config.js`, never here.

---

# Part 1 — Game design (original brief)

## Premise (keep story flavor light)
The player is a hidden immortal guiding humanity from the Stone Age to a galaxy-spanning empire, then
through an endless galactic war against alien species. Tone: grim, epic, far-future sci-fi. Use only
original names, factions, and terms. Do not use names, factions, or terminology from existing franchises
(e.g., Warhammer 40k). Story is delivered only through short era descriptions (one or two sentences) and
short event log messages. No dialogue or cutscenes.

## Eras
Stone Age → Bronze Age → Classical → Medieval → Industrial → Atomic → Spacefaring → Interstellar → Galactic War.
- Each era unlocks at least one new resource or mechanic, not just bigger numbers (e.g., writing/knowledge
  in Bronze, trade in Classical, faith or guilds in Medieval, energy in Industrial, computation in Atomic,
  orbital industry in Spacefaring).
- Eras 1–7 use a classic incremental structure: resources, generators with scaling costs, upgrades that
  multiply generators, and a research/tech tree per era.
- New tiers feed or multiply earlier tiers so the whole economy stays relevant.
- Era advancement requires reaching a stated milestone, shown in the UI.

## Automation: Agents
- Automation comes from mortal agents the immortal recruits and guides.
- Agent types evolve with the eras (e.g., shamans, priests, generals, scholars, merchants, industrialists,
  administrators, admirals).
- Each agent automates buying and/or production in an assigned area.
- Keep it simple: recruit, assign, upgrade. No agent death or micromanagement.

## Interstellar Age: Expansion
The focus shifts from buying generators to claiming worlds, and growth becomes exponential.
- Core loop: resources build colony ships → colony ships claim worlds → worlds produce resources → more ships.
- Planet types (e.g., garden, ocean, desert, ice, volcanic, barren, gas giant, asteroid field), each with a
  base habitability value.
- High-habitability worlds become colonies. Low or zero habitability worlds can still be claimed as mining
  stations/outposts that produce at a reduced rate based on habitability.
- Terraforming/habitability upgrades raise habitability per planet type, raising output.
- Maturation: newly claimed worlds start at low output and grow over time to a maximum matured output.
- All production goes into a shared empire-wide pool. No individual colony management.
- Each world adds to total output, so going from 1 to 2 worlds is a huge relative gain while 10,000 to
  10,001 is small. No other diminishing returns.
- Implementation: track worlds as cohorts (planet type + claim time bucket) that age and mature together.
  Never simulate worlds individually. Merge old matured cohorts to keep the cohort count small.
- Lots of expansion tech: ship speed, ship cost, colonization yield (multiple worlds per ship), maturation
  speed, habitability, production multipliers.
- Transition: reaching 20,000 worlds triggers first contact and the Galactic War Age.

## Galactic War Age
- Resource production continues and should feel enormous. Display empire totals prominently so the player
  feels the scale.
- Military is part of the production chain: resources → war materials → ships and armies → fleet strength.
- Several alien factions (3–5) with original names and one or two simple numeric traits each (e.g., grows
  fast, high defense, causes higher attrition, weak to a certain tech line).
- Fronts: each faction has one or more fronts. The player assigns fleet strength to fronts (by percentage
  sliders or allocations). Agents (admirals) can automate allocation.
- Combat is simple and purely numeric: each tick, compare player strength vs. enemy strength on each front,
  apply attrition losses to both sides, and move a front progress value. Winning a front captures a block
  of enemy worlds (added as new cohorts). Losing costs a block of the player's worlds. No tactical control
  and no individual battles.
- Endless war: enemy strength scales upward over time and with each front won, so the war never ends.
  Defeated fronts are replaced by deeper, stronger ones. The player's long-term goal is pushing further
  before prestiging.
- Lots of military tech and upgrades: weapons, armor, production speed, attrition reduction,
  faction-specific counters.

## Prestige
- The player prestiges many times across the full game, resetting to the Stone Age each time. Story:
  civilization collapses into a dark age and the immortal carries forward memory.
- First available at the Classical era. Prestige points scale with lifetime resources earned in the run
  (square-root or log-based formula in config), with bonus points for the highest era reached.
- Prestige points are spent on the Immortal's Power Tree.
- Show a preview of points to be gained before confirming.

## Immortal's Power Tree
A permanent skill tree persisting across prestiges. Branches: production multipliers, faster early eras,
stronger and cheaper agents, starting resources, offline progress cap, faster world maturation,
colonization yield, fleet strength, attrition reduction. Later nodes unlock only after reaching late eras
at least once. Display as a visual node tree.

## Standard features
- Buy multipliers: x1, x10, x100, Max.
- Number format setting: suffixes (1.2M, 3.4Qa), scientific, engineering.
- Achievements (at least 50 across all eras), each granting a small permanent production bonus.
- Statistics page: lifetime resources, time played, prestiges, fastest era times, current and best world
  counts, fronts won.
- Unlock teasers: show the next locked feature as "???" with a hint of its requirement.
- Event log: scrolling feed of short era-flavored messages and milestones.
- Tooltips on all upgrades showing current effect and effect after purchase.
- Hotkeys for common actions, listed in settings.

## Pacing targets (tune in config)
- First prestige available within ~30–45 minutes of active play.
- Reaching the Interstellar Age for the first time should take several prestiges.
- Each prestige should noticeably speed up the next run.
- A small headless simulation script (Node) plays the game with a simple purchasing strategy and reports
  time to reach each era, so pacing can be checked and tuned.

# Visual style
- All visuals made with code: SVG icons, CSS styling, and HTML canvas. No external image files required.
- Dark, clean interface with subtle glow effects. Each era has its own color theme (earthy browns for Stone
  Age, bronze/gold for Bronze, marble tones for Classical, deep reds and golds for Medieval, brass and smoke
  for Industrial, green-on-black for Atomic, cool blues for Spacefaring, blues and violets for Interstellar,
  reds for Galactic War).
- Consistent SVG icon set for resources, generators, agents, planet types, ships, and alien factions (flat
  or silhouette style).
- Interstellar and War ages: a procedurally generated galaxy view on canvas with spiral arms. Claimed
  regions glow and spread as the empire grows; fronts appear as colored boundaries. Represent world counts
  by density and glow, not individual planets.
- Juice: number pop-ups on purchases, particle bursts on milestones, smooth progress bars, a visual
  transition on era changes and prestige.
- Structure the code so any icon or image can later be replaced by a file in an /assets folder.
- Simple sound effects using the Web Audio API with a mute toggle and volume slider in settings.

## UI layout
Tabs: Production, Research, Agents, Galaxy (Interstellar+), War (Galactic War), Power Tree, Achievements,
Stats, Settings. Tabs appear as they unlock. Header shows primary resources, current era, and prestige points.

---

# Part 2 — Implementation decisions

## Resources and the per-era mechanic

| # | Era          | New resource(s)          | New mechanic (panel on Production tab)                                  |
|---|--------------|--------------------------|--------------------------------------------------------------------------|
| 0 | Stone Age    | Food, Stone              | **Forage** — manual gathering (click); scales with production.          |
| 1 | Bronze Age   | Bronze, Knowledge        | **Writing** — Knowledge becomes the research currency.                   |
| 2 | Classical    | Coin                     | **Trade Routes** — leveled routes that multiply an earlier resource.    |
| 3 | Medieval     | Faith                    | **Rites** — timed blessings bought with faith (big temporary multipliers). |
| 4 | Industrial   | Energy                   | **Power Grid** — electrify sectors for multipliers; costs energy upkeep. |
| 5 | Atomic       | Compute                  | **Compute Programs** — split compute capacity across three programs.    |
| 6 | Spacefaring  | Alloy                    | **Megaprojects** — huge long-term builds funded over time.               |
| 7 | Interstellar | Starmatter, Worlds       | **Expansion** — colony ships claim worlds tracked as cohorts.            |
| 8 | Galactic War | Materiel, Warships, Legions | **Fronts** — fleet allocation against endless alien fronts.           |

- **Feed/multiply**: each era's resource multiplies the production of all earlier eras (logarithmic
  "synergy", configured per resource). Early generators of each era cost earlier resources, and research
  costs mix knowledge with era resources, so older tiers keep mattering.
- **Generator upgrades**: each generator has purchasable ×2 upgrades unlocked at owned-count thresholds.
- **Modernization**: older generators change form as ages pass (Gatherer → Farmstead → … → Hydroponic Tower) so the
  economy never shows Stone Age works in the Space Age. The form is derived from the current era (same id, count and
  upgrades; nothing saved); each form reached multiplies output by `modernize.multPerTier`. Lines in
  `CONFIG.modernize.lines`.
- **Research**: a small tech tree per era (prerequisites within the era). From the Bronze Age on, research
  costs Knowledge. Interstellar and War have repeatable (leveled) techs.
- **Milestones**: each era lists conditions (resource amounts, key research). When all are met the player
  presses "Advance".

## Agents
Recruit (cost scales per type) into a free post, assign to an *area*, upgrade (faster actions), promote.
Each area holds a small crew (`agents.crewBase`, +`crewSize` from Bureaucratic Machines and the Power Tree);
areas whose action is all-or-nothing (rites, grid, compute, megaprojects, colony ships, fleet command) are
`solo` and hold one. Every agent in a crew acts on its own timer, so **recruiting adds actions and upgrading
adds speed**. Recruiting is blocked when every eligible post is full, so no agent is ever bought just to idle.
Promotion turns an agent into an unlocked type of a later era for `promote.costMult` × that type's recruit
cost, keeping ⌈level × `promote.keepLevels`⌉; it keeps its post if the new type can staff it. Types: Shaman
(Stone), Priest (Bronze), Scholar & Merchant (Classical), Warden (Medieval), Industrialist (Industrial),
Administrator (Atomic), Navigator (Spacefaring), Admiral (Galactic War). Each area lists which types may
staff it. Areas: per-era generators, forage, research, trade, rites, grid, compute, megaprojects, colony
ships, expansion tech, war production, fleet allocation. Agents reset on prestige.

## Interstellar
- The homeworld (one matured Garden world) is granted on entry. Worlds produce **Starmatter** and add a
  flat per-world bonus to all older production.
- Colony ships cost Starmatter (+Alloy), travel for a time (ship speed tech), then each claims
  `yield` worlds split deterministically across planet types by config weights.
- World output = base × max(habitability, outpost floor) × type yield × maturity × multipliers. Worlds with
  habitability ≥ the colony threshold are Colonies; others are Outposts.
- Cohorts are keyed by (planet type, claim-time bucket). Matured cohorts merge into one per type.
- 20,000 worlds → First Contact → Galactic War.

## Galactic War
- Chain: Starmatter → **Foundries** produce Materiel → **Shipyards**/**Barracks** convert Materiel into
  Warships/Legions → Fleet Strength = units × power × multipliers.
- Factions (original): **Vorrhal Brood** (grows fast), **Ashen Choir** (high defense), **Thessik Reach**
  (high attrition), **Hollow Lattice** (regenerates; weak to Disruptor tech line).
- Each front: enemy strength E regenerates toward a max that escalates with time and depth. Player
  committed strength P = fleet × allocation share. Both sides take attrition; progress moves by
  `speed × (P − E)/(P + E)`. +100% captures a block of worlds (new cohorts) and spawns a deeper front;
  −100% loses a block of the player's worlds.

## Prestige ("The Long Night")
Points = `floor(k × max(0, log10(legacy) − offset)^power) + eraBonus[highest era]`, where legacy is the
weighted sum of resources produced this run. Available from the Classical era.

## Power Tree
Radial SVG tree around "The Undying" core; 9 branches (Dominion/production, Echoes of the First Fire/early
eras, Retinue/agents, Inheritance/starting resources, Long Sleep/offline cap, Seedworlds/maturation,
Diaspora/colonization yield, Iron Will/fleet strength, Endurance/attrition). Late-branch nodes require the
Interstellar or Galactic War era to have been reached at least once.

## Code layout
See `CLAUDE.md` for the file map and rules.
