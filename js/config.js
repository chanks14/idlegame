'use strict';
// =====================================================================================
//  BALANCE CONFIG — every tunable number and all content definitions live here.
//  Systems read this generically; never hardcode balance values elsewhere.
// =====================================================================================
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  const CONFIG = {
    tickRate: 20,                 // simulation ticks per second
    loop: {
      catchupThreshold: 10,       // seconds of backlog handled by large-step simulation instead of ticks
      welcomeBackMin: 120,        // show the welcome-back panel for gaps longer than this (seconds)
      maxTicksPerFrame: 100,
    },
    ui: { refreshHz: 10, logMax: 150, flavorInterval: [45, 110] },
    autosaveSeconds: 30,
    offline: {
      baseCapHours: 24,           // default offline cap (power tree adds more)
      maxSteps: 1500,             // offline simulation resolution
      maxStepSeconds: 60,
      minStepSeconds: 0.25,
    },

    // ---------------------------------------------------------------- resources
    // legacy: prestige weight of 1 unit produced. pinned: always shown in the header once unlocked.
    resources: {
      food:      { name: 'Food',      era: 0, color: '#d9a55b', legacy: 1,    desc: 'Roots, game and grain. The first currency of survival.' },
      stone:     { name: 'Stone',     era: 0, color: '#a39a8c', legacy: 2,    desc: 'Flint and fieldstone, shaped by patient hands.' },
      bronze:    { name: 'Bronze',    era: 1, color: '#d08a3a', legacy: 60,   desc: 'Copper and tin, wedded in fire.' },
      knowledge: { name: 'Knowledge', era: 1, color: '#8fb7e8', legacy: 40, pinned: true, desc: 'Written memory. Spent on research in every later age.' },
      coin:      { name: 'Coin',      era: 2, color: '#f2d06b', legacy: 3e3,  desc: 'Stamped silver that crosses every border.' },
      faith:     { name: 'Faith',     era: 3, color: '#e7b9ff', legacy: 1e5,  desc: 'Devotion, gathered in stone and song. Fuels the Rites.' },
      energy:    { name: 'Energy',    era: 4, color: '#ffb347', legacy: 3e6,  desc: 'Steam, coal and current. Powers the Grid.' },
      compute:   { name: 'Compute',   era: 5, color: '#5dff9a', legacy: 1e8,  desc: 'Calculation at the speed of lightning.' },
      alloy:     { name: 'Alloy',     era: 6, color: '#7ec8ff', legacy: 1e10, desc: 'Orbital alloys forged in zero gravity.' },
    },

    // ---------------------------------------------------------------- eras
    // milestone conditions: {type:'res', res, amount} | {type:'research', id} | {type:'gen', gen, count}
    //                       | {type:'mega', id} | {type:'worlds', count}
    eras: [
      { id: 'stone', name: 'Stone Age', theme: 'stone',
        desc: 'Fire, hunger and the long dark. Scattered bands follow a stranger who never ages.',
        milestone: [{ type: 'res', res: 'food', amount: 5e4 }, { type: 'res', res: 'stone', amount: 1e4 }, { type: 'research', id: 'copper_lore' }] },
      { id: 'bronze', name: 'Bronze Age', theme: 'bronze',
        desc: 'Cities of mud brick and ziggurats of pride. The first scribes write down your name.',
        milestone: [{ type: 'res', res: 'bronze', amount: 3e4 }, { type: 'res', res: 'knowledge', amount: 5e3 }, { type: 'research', id: 'weighed_silver' }] },
      { id: 'classical', name: 'Classical Age', theme: 'classical',
        desc: 'Marble, law and coin. Empires rise on roads you quietly laid down.',
        milestone: [{ type: 'res', res: 'coin', amount: 1e6 }, { type: 'res', res: 'knowledge', amount: 2e5 }, { type: 'research', id: 'feudal_oaths' }] },
      { id: 'medieval', name: 'Medieval Age', theme: 'medieval',
        desc: 'Bells, banners and plague. Faith burns bright in a darkened world.',
        milestone: [{ type: 'res', res: 'faith', amount: 5e5 }, { type: 'res', res: 'knowledge', amount: 5e7 }, { type: 'research', id: 'movable_type' }] },
      { id: 'industrial', name: 'Industrial Age', theme: 'industrial',
        desc: 'Coal smoke blots out the stars. For the first time, humanity moves faster than the seasons.',
        milestone: [{ type: 'res', res: 'energy', amount: 1e7 }, { type: 'res', res: 'knowledge', amount: 1e11 }, { type: 'research', id: 'fission_theory' }] },
      { id: 'atomic', name: 'Atomic Age', theme: 'atomic',
        desc: 'The atom is split. Machines begin to think, and the sky holds its breath.',
        milestone: [{ type: 'res', res: 'compute', amount: 1e7 }, { type: 'res', res: 'energy', amount: 1e12 }, { type: 'research', id: 'rocketry' }] },
      { id: 'spacefaring', name: 'Spacefaring Age', theme: 'spacefaring',
        desc: 'Humanity climbs out of the gravity well. The sky is no longer a ceiling.',
        milestone: [{ type: 'mega', id: 'ark_yards' }, { type: 'research', id: 'deep_drive' }] },
    ],
    endText: 'Beyond the Ark Yards lies the dark between stars…',

    // ---------------------------------------------------------------- forage (Stone Age click)
    forage: {
      gain: { food: 1, stone: 0.25 },   // base per click
      rateShare: 0,                     // + this many seconds of production per click (research raises it)
    },

    // ---------------------------------------------------------------- generators
    // produces: {res: perSecondEach}; cost: {res: [base, growth]}; requires: research id (optional)
    generators: {
      // Stone Age
      gatherer: { era: 0, name: 'Gatherer', icon: 'gatherer', desc: 'Forages roots, nuts and berries.',
        produces: { food: 0.4 }, cost: { food: [10, 1.12] } },
      knapper: { era: 0, name: 'Flint Knapper', icon: 'knapper', desc: 'Strikes flint into blades and scrapers.',
        produces: { stone: 0.2 }, cost: { food: [30, 1.13] } },
      hunters: { era: 0, name: 'Hunting Party', icon: 'hunters', desc: 'Runs down herds across the steppe.',
        produces: { food: 3 }, cost: { food: [220, 1.14], stone: [30, 1.12] } },
      hearth: { era: 0, name: 'Hearth Circle', icon: 'hearth', desc: 'A settled camp around an undying fire.',
        produces: { food: 18, stone: 3 }, cost: { food: [2800, 1.15], stone: [600, 1.14] } },
      // Bronze Age
      smelter: { era: 1, name: 'Copper Smelter', icon: 'smelter', desc: 'Clay furnaces coax metal from green stone.',
        produces: { bronze: 0.5 }, cost: { food: [4000, 1.12], stone: [1500, 1.12] } },
      scribe: { era: 1, name: 'Scribe', icon: 'scribe', desc: 'Presses tallies and prayers into wet clay.',
        produces: { knowledge: 0.25 }, cost: { food: [1.5e4, 1.13], bronze: [30, 1.13] } },
      fields: { era: 1, name: 'Irrigated Fields', icon: 'fields', desc: 'Canals turn the floodplain gold.',
        produces: { food: 150 }, cost: { food: [5e4, 1.14], bronze: [120, 1.13] } },
      forge: { era: 1, name: 'Bronze Forge', icon: 'forge', desc: 'Hammers ring from dawn until dusk.',
        produces: { bronze: 8 }, cost: { bronze: [1200, 1.15], stone: [3e4, 1.12] } },
      // Classical
      market: { era: 2, name: 'Market Stall', icon: 'market', desc: 'Every road ends at a market.',
        produces: { coin: 0.5 }, cost: { bronze: [4000, 1.13], food: [2e5, 1.12] } },
      academy: { era: 2, name: 'Academy', icon: 'academy', desc: 'Philosophers argue beneath the olive trees.',
        produces: { knowledge: 3 }, cost: { coin: [60, 1.14], knowledge: [800, 1.13] } },
      mint: { era: 2, name: 'Mint', icon: 'mint', desc: 'Silver stamped with the face of whoever rules this year.',
        produces: { coin: 7 }, cost: { coin: [800, 1.15], bronze: [2e4, 1.12] } },
      galley: { era: 2, name: 'Merchant Galley', icon: 'galley', desc: 'Oared ships linking every shore of the inland sea.',
        produces: { coin: 50, food: 5000 }, cost: { coin: [1.2e4, 1.16], food: [1e8, 1.12] } },
      // Medieval
      chapel: { era: 3, name: 'Wayside Chapel', icon: 'chapel', desc: 'Candles lit against the dark.',
        produces: { faith: 0.4 }, cost: { coin: [4e4, 1.13], stone: [1e7, 1.12] } },
      monastery: { era: 3, name: 'Monastery', icon: 'monastery', desc: 'Silent orders that copy and remember.',
        produces: { knowledge: 30, faith: 0.6 }, cost: { faith: [120, 1.14], coin: [2e5, 1.12] } },
      guildhall: { era: 3, name: 'Guildhall', icon: 'guildhall', desc: 'Masters and apprentices sworn to their craft.',
        produces: { coin: 400, bronze: 200 }, cost: { faith: [1000, 1.15], coin: [1e6, 1.13] } },
      cathedral: { era: 3, name: 'Cathedral', icon: 'cathedral', desc: 'A century of labor raised toward heaven.',
        produces: { faith: 20 }, cost: { faith: [1.2e4, 1.16], stone: [1e10, 1.12] } },
      // Industrial
      steam: { era: 4, name: 'Steam Engine', icon: 'steam', desc: 'Fire made to work.',
        produces: { energy: 0.6 }, cost: { coin: [5e7, 1.13], bronze: [1e7, 1.12] } },
      university: { era: 4, name: 'University', icon: 'university', desc: 'Lecture halls full of restless young minds.',
        produces: { knowledge: 1500 }, cost: { energy: [150, 1.14], faith: [5e4, 1.12] } },
      works: { era: 4, name: 'Assembly Works', icon: 'works', desc: 'A thousand hands, one rhythm.',
        produces: { coin: 2e4, bronze: 5e3 }, cost: { energy: [1500, 1.15], coin: [3e8, 1.12] } },
      power_station: { era: 4, name: 'Power Station', icon: 'power_station', desc: 'Turbines humming beneath brick chimneys.',
        produces: { energy: 25 }, cost: { energy: [2e4, 1.16], knowledge: [5e8, 1.12] } },
      // Atomic
      tabulator: { era: 5, name: 'Tabulator Bank', icon: 'tabulator', desc: 'Vacuum tubes glowing in orderly rows.',
        produces: { compute: 0.5 }, cost: { energy: [1e6, 1.13], knowledge: [1e10, 1.12] } },
      reactor: { era: 5, name: 'Fission Reactor', icon: 'reactor', desc: 'A tamed star in a concrete shell.',
        produces: { energy: 2000 }, cost: { compute: [200, 1.14], energy: [5e6, 1.12] } },
      lab: { era: 5, name: 'Research Laboratory', icon: 'lab', desc: 'White coats and whiter light.',
        produces: { knowledge: 5e5 }, cost: { compute: [2500, 1.15], coin: [1e13, 1.12] } },
      fab: { era: 5, name: 'Transistor Fab', icon: 'fab', desc: 'Clean rooms etching thought into silicon.',
        produces: { compute: 20 }, cost: { compute: [3e4, 1.16], energy: [1e9, 1.12] } },
      // Spacefaring
      launch: { era: 6, name: 'Launch Complex', icon: 'launch', desc: 'Towers of flame on the equator.',
        produces: { alloy: 0.5 }, cost: { compute: [5e5, 1.13], energy: [1e11, 1.12] } },
      orbital_smelter: { era: 6, name: 'Orbital Smelter', icon: 'orbital_smelter', desc: 'Mirrors focus sunlight onto molten ore.',
        produces: { alloy: 6 }, cost: { alloy: [250, 1.15], compute: [5e6, 1.12] } },
      observatory: { era: 6, name: 'Lunar Observatory', icon: 'observatory', desc: 'The far side of the moon listens to the universe.',
        produces: { knowledge: 2e8 }, cost: { alloy: [2500, 1.15], knowledge: [1e15, 1.12] } },
      tug: { era: 6, name: 'Asteroid Tug', icon: 'tug', desc: 'Drags mountains of metal into orbit.',
        produces: { alloy: 80, stone: 1e12 }, cost: { alloy: [3e4, 1.16], energy: [1e13, 1.12] } },
    },

    // Purchasable ×mult upgrades unlocked at owned-count thresholds (per generator).
    genUpgrades: {
      thresholds: [10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000],
      mult: 2,
      costFactor: 4,       // × cost of the threshold-th unit
      names: ['Refined', 'Seasoned', 'Masterwork', 'Exalted', 'Storied', 'Legendary', 'Mythic', 'Eternal',
        'Undying', 'Transcendent', 'Primordial', 'Sovereign', 'Celestial', 'Absolute', 'Infinite', 'Aeonic'],
    },

    // ---------------------------------------------------------------- research
    // cost: {res: amount} (one-shot) — repeatable techs use {res:[base,growth]} and maxLevel.
    // tier: column in the era's tree; prereq: ids that must be researched first.
    research: {
      // ---- Stone Age
      fire: { era: 0, tier: 0, name: 'Tamed Fire', cost: { food: 60 }, desc: 'Cooked food feeds more mouths.',
        effects: [{ type: 'prod', res: 'food', mult: 1.5 }, { type: 'click', mult: 2 }] },
      tools: { era: 0, tier: 0, name: 'Knapped Tools', cost: { food: 150, stone: 30 }, desc: 'Sharper edges, faster work.',
        effects: [{ type: 'prod', gen: 'knapper', mult: 2 }, { type: 'clickRate', add: 0.05 }] },
      spears: { era: 0, tier: 1, name: 'Fire-hardened Spears', cost: { food: 700, stone: 150 }, prereq: ['fire'],
        desc: 'Hunting parties return more often.', effects: [{ type: 'prod', gen: 'hunters', mult: 2 }] },
      shelter: { era: 0, tier: 1, name: 'Hide Shelters', cost: { food: 1300, stone: 400 }, prereq: ['tools'],
        desc: 'Bands winter in one place.', effects: [{ type: 'prod', gen: 'gatherer', mult: 2 }, { type: 'prod', gen: 'knapper', mult: 1.5 }] },
      ancestor_rites: { era: 0, tier: 1, name: 'Ancestor Rites', cost: { food: 2500, stone: 600 }, prereq: ['fire'],
        desc: 'The first shamans learn to hear you.', effects: [{ type: 'unlock', key: 'agent:shaman' }, { type: 'prod', era: 0, mult: 1.2 }] },
      herb_lore: { era: 0, tier: 2, name: 'Herb Lore', cost: { food: 6000, stone: 1500 }, prereq: ['shelter'],
        desc: 'Fewer die of winter fevers.', effects: [{ type: 'prod', res: 'food', mult: 1.5 }, { type: 'clickRate', add: 0.05 }] },
      cave_paintings: { era: 0, tier: 2, name: 'Cave Paintings', cost: { food: 9000, stone: 2500 }, prereq: ['ancestor_rites'],
        desc: 'Memory outlives the rememberer.', effects: [{ type: 'prod', era: 0, mult: 1.5 }] },
      copper_lore: { era: 0, tier: 3, name: 'Copper Lore', cost: { food: 25000, stone: 6000 }, prereq: ['spears', 'herb_lore'],
        desc: 'Green stone that melts in the fire. The Bronze Age waits.', effects: [{ type: 'prod', res: 'stone', mult: 1.5 }] },
      // ---- Bronze Age
      cuneiform: { era: 1, tier: 0, name: 'Cuneiform', cost: { knowledge: 15, bronze: 20 }, desc: 'Wedges in clay become words.',
        effects: [{ type: 'prod', res: 'knowledge', mult: 2 }] },
      wheel: { era: 1, tier: 0, name: 'The Wheel', cost: { knowledge: 40, bronze: 80 }, desc: 'Carts carry what backs cannot.',
        effects: [{ type: 'prod', era: 0, mult: 2 }] },
      tin_alloy: { era: 1, tier: 1, name: 'Tin Alloying', cost: { knowledge: 150, bronze: 300 }, prereq: ['cuneiform'],
        desc: 'The right mix makes the metal sing.', effects: [{ type: 'prod', res: 'bronze', mult: 2 }] },
      ox_plough: { era: 1, tier: 1, name: 'Ox Plough', cost: { knowledge: 250, bronze: 500 }, prereq: ['wheel'],
        desc: 'Beasts break the soil.', effects: [{ type: 'prod', gen: 'fields', mult: 2 }, { type: 'prod', res: 'food', mult: 1.5 }] },
      temple: { era: 1, tier: 1, name: 'Temple Priesthood', cost: { knowledge: 400, bronze: 800 }, prereq: ['cuneiform'],
        desc: 'Priests who speak in your name.', effects: [{ type: 'unlock', key: 'agent:priest' }, { type: 'prod', era: 1, mult: 1.25 }] },
      star_calendar: { era: 1, tier: 2, name: 'Star Calendar', cost: { knowledge: 1200, bronze: 2500 }, prereq: ['tin_alloy'],
        desc: 'The heavens keep time for the harvest.', effects: [{ type: 'prod', res: 'knowledge', mult: 2 }, { type: 'prod', era: 0, mult: 1.5 }] },
      clay_ledgers: { era: 1, tier: 2, name: 'Clay Ledgers', cost: { knowledge: 2000, bronze: 4000 }, prereq: ['ox_plough', 'temple'],
        desc: 'Debts recorded, disputes settled.', effects: [{ type: 'researchCost', mult: 0.85 }, { type: 'prod', gen: 'forge', mult: 2 }] },
      weighed_silver: { era: 1, tier: 3, name: 'Weighed Silver', cost: { knowledge: 4000, bronze: 1.5e4 }, prereq: ['star_calendar', 'clay_ledgers'],
        desc: 'A standard of value. The Classical Age beckons.', effects: [{ type: 'prod', era: 1, mult: 1.5 }] },
      // ---- Classical
      trade_routes: { era: 2, tier: 0, name: 'Caravan Roads', cost: { knowledge: 6000, coin: 50 }, desc: 'Opens Trade Routes.',
        effects: [{ type: 'unlock', key: 'mech:trade' }] },
      philosophy: { era: 2, tier: 0, name: 'Philosophy', cost: { knowledge: 1e4, coin: 150 }, desc: 'The examined life.',
        effects: [{ type: 'prod', res: 'knowledge', mult: 2 }] },
      coinage: { era: 2, tier: 1, name: 'Standard Coinage', cost: { knowledge: 2.5e4, coin: 600 }, prereq: ['trade_routes'],
        desc: 'One weight, one value, one realm.', effects: [{ type: 'prod', gen: 'market', mult: 2 }, { type: 'prod', gen: 'mint', mult: 2 }] },
      aqueducts: { era: 2, tier: 1, name: 'Aqueducts', cost: { knowledge: 4e4, coin: 1500 }, prereq: ['philosophy'],
        desc: 'Water flows uphill to the cities.', effects: [{ type: 'prod', res: 'food', mult: 3 }, { type: 'prod', era: 1, mult: 1.5 }] },
      merchant_houses: { era: 2, tier: 1, name: 'Merchant Houses', cost: { knowledge: 5e4, coin: 3000 }, prereq: ['trade_routes'],
        desc: 'Families whose fortunes span the sea.', effects: [{ type: 'unlock', key: 'agent:merchant' }, { type: 'prod', res: 'coin', mult: 1.5 }] },
      great_library: { era: 2, tier: 2, name: 'Great Library', cost: { knowledge: 1.2e5, coin: 8000 }, prereq: ['aqueducts'],
        desc: 'Every scroll in the world under one roof.', effects: [{ type: 'unlock', key: 'agent:scholar' }, { type: 'prod', res: 'knowledge', mult: 1.5 }] },
      paved_roads: { era: 2, tier: 2, name: 'Paved Roads', cost: { knowledge: 1.5e5, coin: 1.5e4 }, prereq: ['coinage', 'merchant_houses'],
        desc: 'All roads lead somewhere worth going.', effects: [{ type: 'tradeMult', mult: 1.4 }, { type: 'prod', era: [0, 1], mult: 2 }] },
      geometry: { era: 2, tier: 2, name: 'Geometry', cost: { knowledge: 2e5, coin: 2.5e4 }, prereq: ['philosophy'],
        desc: 'Proof, not opinion.', effects: [{ type: 'prod', res: 'bronze', mult: 2 }, { type: 'prod', res: 'stone', mult: 2 }] },
      feudal_oaths: { era: 2, tier: 3, name: 'Oaths of Fealty', cost: { knowledge: 3e5, coin: 1e5 }, prereq: ['great_library', 'paved_roads'],
        desc: 'The empire fractures into sworn lordships. The Medieval Age begins.', effects: [{ type: 'prod', era: 2, mult: 1.5 }] },
      // ---- Medieval
      liturgy: { era: 3, tier: 0, name: 'Liturgy', cost: { knowledge: 5e5, faith: 30 }, desc: 'Opens the Rites.',
        effects: [{ type: 'unlock', key: 'mech:rites' }] },
      scriptoria: { era: 3, tier: 0, name: 'Scriptoria', cost: { knowledge: 8e5, faith: 60 }, desc: 'Candlelit rooms of patient copying.',
        effects: [{ type: 'prod', res: 'knowledge', mult: 2 }] },
      three_field: { era: 3, tier: 1, name: 'Three-field Rotation', cost: { knowledge: 2e6, faith: 250 }, prereq: ['scriptoria'],
        desc: 'Let one field rest; feed a kingdom.', effects: [{ type: 'prod', res: 'food', mult: 4 }, { type: 'prod', era: 0, mult: 2 }] },
      pilgrimages: { era: 3, tier: 1, name: 'Pilgrimages', cost: { knowledge: 3e6, faith: 500 }, prereq: ['liturgy'],
        desc: 'Roads worn smooth by faithful feet.', effects: [{ type: 'prod', res: 'faith', mult: 2 }, { type: 'tradeMult', mult: 1.2 }] },
      wardens: { era: 3, tier: 1, name: 'Order of Wardens', cost: { knowledge: 5e6, faith: 1000 }, prereq: ['liturgy'],
        desc: 'Knights sworn to a master they never see.', effects: [{ type: 'unlock', key: 'agent:warden' }, { type: 'prod', era: 3, mult: 1.25 }] },
      windmills: { era: 3, tier: 2, name: 'Windmills', cost: { knowledge: 1e7, faith: 3000 }, prereq: ['three_field'],
        desc: 'The wind turns the stones.', effects: [{ type: 'prod', era: [0, 1, 2], mult: 2 }] },
      holy_relics: { era: 3, tier: 2, name: 'Holy Relics', cost: { knowledge: 1.5e7, faith: 6000 }, prereq: ['pilgrimages'],
        desc: 'Bones and splinters that work miracles.', effects: [{ type: 'riteMult', mult: 1.5 }, { type: 'unlock', key: 'rite:ascension' }] },
      guild_charters: { era: 3, tier: 2, name: 'Guild Charters', cost: { knowledge: 2e7, faith: 1e4 }, prereq: ['wardens'],
        desc: 'Monopolies granted by royal seal.', effects: [{ type: 'prod', gen: 'guildhall', mult: 3 }, { type: 'prod', res: 'coin', mult: 1.5 }] },
      movable_type: { era: 3, tier: 3, name: 'Movable Type', cost: { knowledge: 4e7, faith: 5e4 }, prereq: ['windmills', 'holy_relics', 'guild_charters'],
        desc: 'Knowledge escapes the monasteries. Industry stirs.', effects: [{ type: 'prod', res: 'knowledge', mult: 3 }] },
      // ---- Industrial
      power_grid: { era: 4, tier: 0, name: 'Power Grid', cost: { knowledge: 2e8, energy: 50 }, desc: 'Opens the Power Grid.',
        effects: [{ type: 'unlock', key: 'mech:grid' }] },
      coke_furnaces: { era: 4, tier: 0, name: 'Coke Furnaces', cost: { knowledge: 3e8, energy: 100 }, desc: 'Hotter fires, stronger steel.',
        effects: [{ type: 'prod', res: 'energy', mult: 2 }] },
      railways: { era: 4, tier: 1, name: 'Railways', cost: { knowledge: 1e9, energy: 600 }, prereq: ['coke_furnaces'],
        desc: 'Iron roads bind the continent together.', effects: [{ type: 'prod', era: [0, 1, 2, 3], mult: 3 }] },
      telegraph: { era: 4, tier: 1, name: 'Telegraph', cost: { knowledge: 1.5e9, energy: 1000 }, prereq: ['power_grid'],
        desc: 'Orders cross the world in minutes.', effects: [{ type: 'agentSpeed', mult: 1.5 }] },
      captains: { era: 4, tier: 1, name: 'Captains of Industry', cost: { knowledge: 2e9, energy: 2000 }, prereq: ['coke_furnaces'],
        desc: 'Men of iron will and thin mercy.', effects: [{ type: 'unlock', key: 'agent:industrialist' }, { type: 'prod', era: 4, mult: 1.5 }] },
      interchangeable: { era: 4, tier: 2, name: 'Interchangeable Parts', cost: { knowledge: 5e9, energy: 8000 }, prereq: ['captains'],
        desc: 'Every piece fits every machine.', effects: [{ type: 'prod', gen: 'works', mult: 3 }] },
      dynamo: { era: 4, tier: 2, name: 'Dynamo', cost: { knowledge: 8e9, energy: 1.5e4 }, prereq: ['power_grid', 'railways'],
        desc: 'Motion becomes current.', effects: [{ type: 'gridMult', mult: 1.5 }, { type: 'prod', res: 'energy', mult: 1.5 }] },
      transmission: { era: 4, tier: 2, name: 'Transmission Lines', cost: { knowledge: 1.2e10, energy: 3e4 }, prereq: ['telegraph'],
        desc: 'Power flows where it is needed.', effects: [{ type: 'gridDrain', mult: 0.7 }] },
      fission_theory: { era: 4, tier: 3, name: 'Fission Theory', cost: { knowledge: 5e10, energy: 2e5 }, prereq: ['interchangeable', 'dynamo', 'transmission'],
        desc: 'The heart of matter can be broken. The Atomic Age dawns.', effects: [{ type: 'prod', res: 'knowledge', mult: 2 }] },
      // ---- Atomic
      time_sharing: { era: 5, tier: 0, name: 'Time-sharing', cost: { knowledge: 5e11, compute: 30 }, desc: 'Opens Compute Programs.',
        effects: [{ type: 'unlock', key: 'mech:compute' }] },
      transistor: { era: 5, tier: 0, name: 'Transistor', cost: { knowledge: 8e11, compute: 80 }, desc: 'A switch the size of a grain of rice.',
        effects: [{ type: 'prod', res: 'compute', mult: 2 }] },
      green_revolution: { era: 5, tier: 1, name: 'Green Revolution', cost: { knowledge: 2e12, compute: 400 }, prereq: ['transistor'],
        desc: 'Famine becomes a memory.', effects: [{ type: 'prod', res: 'food', mult: 10 }, { type: 'prod', era: [0, 1, 2, 3, 4], mult: 2 }] },
      containers: { era: 5, tier: 1, name: 'Container Shipping', cost: { knowledge: 3e12, compute: 800 }, prereq: ['time_sharing'],
        desc: 'One box, every port.', effects: [{ type: 'prod', res: 'coin', mult: 5 }, { type: 'tradeMult', mult: 1.5 }] },
      bureaucracy: { era: 5, tier: 1, name: 'Bureaucratic Machines', cost: { knowledge: 5e12, compute: 1500 }, prereq: ['transistor'],
        desc: 'Forms in triplicate, processed at lightspeed.', effects: [{ type: 'unlock', key: 'agent:administrator' }, { type: 'prod', era: 5, mult: 1.5 }] },
      satellites: { era: 5, tier: 2, name: 'Satellite Relays', cost: { knowledge: 1.5e13, compute: 6000 }, prereq: ['containers'],
        desc: 'Voices bounced off artificial moons.', effects: [{ type: 'computeMult', mult: 1.5 }, { type: 'agentSpeed', mult: 1.25 }] },
      breeder: { era: 5, tier: 2, name: 'Breeder Reactors', cost: { knowledge: 2e13, compute: 1e4 }, prereq: ['bureaucracy'],
        desc: 'Fuel that makes more fuel.', effects: [{ type: 'prod', res: 'energy', mult: 3 }, { type: 'gridDrain', mult: 0.7 }] },
      rocketry: { era: 5, tier: 3, name: 'Rocketry', cost: { knowledge: 8e13, compute: 5e4 }, prereq: ['satellites', 'breeder', 'green_revolution'],
        desc: 'The gravity well is only a wall to be climbed.', effects: [{ type: 'prod', era: 5, mult: 1.5 }] },
      // ---- Spacefaring
      orbital_survey: { era: 6, tier: 0, name: 'Orbital Survey', cost: { knowledge: 5e15, alloy: 20 }, desc: 'Opens Megaprojects.',
        effects: [{ type: 'unlock', key: 'mech:mega' }] },
      reusable: { era: 6, tier: 0, name: 'Reusable Boosters', cost: { knowledge: 8e15, alloy: 60 }, desc: 'Rockets that land and fly again.',
        effects: [{ type: 'prod', res: 'alloy', mult: 2 }, { type: 'prod', gen: 'launch', mult: 2 }] },
      fusion: { era: 6, tier: 1, name: 'Fusion Ignition', cost: { knowledge: 2e16, alloy: 400 }, prereq: ['reusable'],
        desc: 'A star in a magnetic bottle.', effects: [{ type: 'prod', res: 'energy', mult: 10 }] },
      orbital_farms: { era: 6, tier: 1, name: 'Orbital Agriculture', cost: { knowledge: 3e16, alloy: 800 }, prereq: ['orbital_survey'],
        desc: 'Wheat under endless sunlight.', effects: [{ type: 'prod', era: [0, 1, 2, 3], mult: 10 }] },
      navigator_corps: { era: 6, tier: 1, name: 'Navigator Corps', cost: { knowledge: 5e16, alloy: 1500 }, prereq: ['reusable'],
        desc: 'Pilots who read the orbits like scripture.', effects: [{ type: 'unlock', key: 'agent:navigator' }, { type: 'prod', era: 6, mult: 1.25 }] },
      zero_g: { era: 6, tier: 2, name: 'Zero-g Metallurgy', cost: { knowledge: 1.5e17, alloy: 6000 }, prereq: ['fusion'],
        desc: 'Alloys impossible under gravity.', effects: [{ type: 'prod', gen: 'orbital_smelter', mult: 3 }] },
      mega_engineering: { era: 6, tier: 2, name: 'Megastructure Engineering', cost: { knowledge: 2e17, alloy: 1e4 }, prereq: ['orbital_farms', 'navigator_corps'],
        desc: 'Thinking in thousands of kilometers.', effects: [{ type: 'megaCost', mult: 0.7 }] },
      deep_drive: { era: 6, tier: 3, name: 'Deep-Space Drive', cost: { knowledge: 1e18, alloy: 5e4 }, prereq: ['zero_g', 'mega_engineering'],
        desc: 'Engines that can cross the gulf between suns.', effects: [{ type: 'prod', res: 'alloy', mult: 2 }] },
    },

    // Display names for {type:'unlock'} keys
    unlockNames: {
      'agent:shaman': 'Shaman agents', 'agent:priest': 'Priest agents', 'agent:scholar': 'Scholar agents',
      'agent:merchant': 'Merchant agents', 'agent:warden': 'Warden agents', 'agent:industrialist': 'Industrialist agents',
      'agent:administrator': 'Administrator agents', 'agent:navigator': 'Navigator agents', 'agent:admiral': 'Admiral agents',
      'mech:trade': 'Trade Routes', 'mech:rites': 'the Rites', 'mech:grid': 'the Power Grid', 'mech:compute': 'Compute Programs',
      'mech:mega': 'Megaprojects', 'rite:ascension': 'the Rite of Ascension',
      'memory:0': 'Stone Age research at the start of every run', 'memory:1': 'Bronze Age research at the start of every run',
    },

    // Later-era resources multiply all earlier eras: mult = 1 + k * log10(1 + produced this run)
    synergies: [
      { res: 'bronze', k: 0.5 },
      { res: 'coin', k: 0.4 },
      { res: 'faith', k: 0.4 },
      { res: 'energy', k: 0.4 },
      { res: 'compute', k: 0.4 },
      { res: 'alloy', k: 0.4 },
    ],

    // ---------------------------------------------------------------- era mechanics
    trade: {  // Classical — each route level multiplies one earlier resource
      unlock: 'mech:trade',
      multPerLevel: 0.5,   // +50% per level (scaled by tradeMult), additive across levels
      routes: {
        amber: { name: 'Amber Road', res: 'food', cost: { coin: [100, 2.1] }, desc: 'Northern amber for southern grain.' },
        salt: { name: 'Salt Road', res: 'stone', cost: { coin: [250, 2.1] }, desc: 'Salt caravans across the white desert.' },
        tin: { name: 'Tin Road', res: 'bronze', cost: { coin: [800, 2.2] }, desc: 'Tin from the mountain kingdoms.' },
        scroll: { name: 'Scroll Road', res: 'knowledge', cost: { coin: [2500, 2.3] }, desc: 'Books copied and traded between libraries.' },
        spice: { name: 'Spice Sea-lane', res: 'coin', cost: { coin: [8000, 2.5] }, desc: 'Monsoon winds carry fortunes.' },
      },
    },
    rites: {  // Medieval — timed multipliers bought with faith; cost grows with each use this run
      unlock: 'mech:rites',
      list: {
        plenty: { name: 'Rite of Plenty', res: ['food', 'stone'], mult: 10, duration: 60, cost: { faith: [40, 1.25] },
          desc: 'Fields and quarries overflow.' },
        anvil: { name: 'Rite of the Anvil', res: ['bronze', 'coin'], mult: 6, duration: 60, cost: { faith: [150, 1.25] },
          desc: 'Every hammer strikes true.' },
        lamps: { name: 'Rite of Lamps', res: ['knowledge'], mult: 5, duration: 60, cost: { faith: [400, 1.25] },
          desc: 'Scholars work through the night without tiring.' },
        ascension: { name: 'Rite of Ascension', all: true, mult: 3, duration: 90, cost: { faith: [5000, 1.3] },
          requires: 'rite:ascension', desc: 'The whole realm moves as one body.' },
      },
    },
    grid: {  // Industrial — electrify sectors: multiplier per level, continuous energy upkeep
      unlock: 'mech:grid',
      multPerLevel: 2.5,     // × per level (bonus part scaled by gridMult)
      drainGrowth: 3.5,      // upkeep(L) = drain × drainGrowth^(L-1)
      raiseCostSeconds: 60,  // raising a level costs this many seconds of the new upkeep, up front
      sectors: {
        agriculture: { name: 'Agriculture', res: ['food'], drain: 3, desc: 'Electric pumps and cold storage.' },
        mining: { name: 'Mining', res: ['stone', 'bronze'], drain: 6, desc: 'Drills and conveyors.' },
        commerce: { name: 'Commerce', res: ['coin'], drain: 15, desc: 'Lit shopfronts open all night.' },
        scholarship: { name: 'Scholarship', res: ['knowledge'], drain: 30, desc: 'Libraries that never close.' },
        devotion: { name: 'Devotion', res: ['faith'], drain: 60, desc: 'Cathedrals ablaze with electric light.' },
      },
    },
    compute: {  // Atomic — split compute capacity (compute/s) across programs
      unlock: 'mech:compute',
      programs: {
        logistics: { name: 'Logistics', target: 'gens', k: 0.3, pow: 2, desc: 'Multiplies all generator output.' },
        analytics: { name: 'Analytics', target: 'knowledge', k: 1, pow: 2, desc: 'Multiplies Knowledge production.' },
        automation: { name: 'Automation', target: 'agentSpeed', k: 0.04, pow: 2, desc: 'Speeds up every agent.' },
      },
    },
    megaprojects: {  // Spacefaring — one active project at a time; a share of production is diverted into it
      unlock: 'mech:mega',
      fundShare: 0.5,
      list: {
        orbital_ring: { name: 'Orbital Ring', cost: { alloy: 3e4, energy: 1e14 }, desc: 'A band of steel around the world.',
          effects: [{ type: 'prod', era: 6, mult: 3 }] },
        space_elevator: { name: 'Space Elevator', cost: { alloy: 3e5, compute: 1e9 }, prereq: 'orbital_ring',
          desc: 'A thread from the equator to the stars.', effects: [{ type: 'global', mult: 2 }] },
        lunar_foundry: { name: 'Lunar Foundries', cost: { alloy: 2e6, stone: 1e22 }, prereq: 'orbital_ring',
          desc: 'The moon hollowed into a forge.', effects: [{ type: 'prod', res: 'alloy', mult: 4 }] },
        solar_swarm: { name: 'Solar Swarm', cost: { alloy: 1e7, energy: 1e17 }, prereq: 'space_elevator',
          desc: 'Mirrors by the million, drinking the sun.', effects: [{ type: 'prod', res: 'energy', mult: 10 }, { type: 'gridDrain', mult: 0.5 }] },
        ark_yards: { name: 'Ark Yards', cost: { alloy: 1e8, knowledge: 1e20 }, prereq: 'lunar_foundry',
          desc: 'Shipyards large enough to build worlds that fly.', effects: [{ type: 'prod', era: 6, mult: 2 }] },
      },
    },

    // ---------------------------------------------------------------- agents
    agents: {
      baseInterval: { forage: 1, gen: 3, research: 5, trade: 4, rites: 3, grid: 5, compute: 10, mega: 5 },
      speedPerLevel: 0.2,        // interval / (1 + speedPerLevel × (level − 1))
      bulkEvery: 3,              // +1 bulk action per this many levels
      forageClicksPerLevel: 2,   // forage clicks per action = level × this
      maxActionsPerTick: 12,
      types: {
        shaman: { name: 'Shaman', era: 0, unlock: 'agent:shaman', areas: ['forage', 'gen0'],
          recruit: { food: [2000, 5] }, upgrade: { food: [1000, 2.6] }, desc: 'Dream-walkers who hear your voice in the smoke.' },
        priest: { name: 'Priest', era: 1, unlock: 'agent:priest', areas: ['gen0', 'gen1', 'rites'],
          recruit: { bronze: [400, 5] }, upgrade: { bronze: [200, 2.6] }, desc: 'Keepers of temple granaries.' },
        scholar: { name: 'Scholar', era: 2, unlock: 'agent:scholar', areas: ['research'],
          recruit: { knowledge: [2e4, 6] }, upgrade: { knowledge: [1e4, 2.8] }, desc: 'Minds that chase every question.' },
        merchant: { name: 'Merchant', era: 2, unlock: 'agent:merchant', areas: ['gen1', 'gen2', 'trade'],
          recruit: { coin: [500, 5] }, upgrade: { coin: [250, 2.6] }, desc: 'Traders with ledgers in a dozen tongues.' },
        warden: { name: 'Warden', era: 3, unlock: 'agent:warden', areas: ['gen2', 'gen3', 'rites'],
          recruit: { faith: [2000, 5] }, upgrade: { faith: [1000, 2.6] }, desc: 'Sworn knights who keep the realm running.' },
        industrialist: { name: 'Industrialist', era: 4, unlock: 'agent:industrialist', areas: ['gen3', 'gen4', 'grid'],
          recruit: { energy: [5000, 5] }, upgrade: { energy: [2500, 2.6] }, desc: 'Owners of mills, mines and men.' },
        administrator: { name: 'Administrator', era: 5, unlock: 'agent:administrator', areas: ['gen4', 'gen5', 'compute', 'mega', 'research'],
          recruit: { compute: [5000, 5] }, upgrade: { compute: [2500, 2.6] }, desc: 'Technocrats of the planetary state.' },
        navigator: { name: 'Navigator', era: 6, unlock: 'agent:navigator', areas: ['gen5', 'gen6', 'mega'],
          recruit: { alloy: [5000, 5] }, upgrade: { alloy: [2500, 2.6] }, desc: 'Pilots who trace paths between worlds.' },
      },
      areas: {
        forage: { name: 'Foraging', kind: 'forage', desc: 'Forages repeatedly.' },
        gen0: { name: 'Stone Age works', kind: 'gen', era: 0, desc: 'Buys Stone Age generators and upgrades.' },
        gen1: { name: 'Bronze Age works', kind: 'gen', era: 1, desc: 'Buys Bronze Age generators and upgrades.' },
        gen2: { name: 'Classical works', kind: 'gen', era: 2, desc: 'Buys Classical generators and upgrades.' },
        gen3: { name: 'Medieval works', kind: 'gen', era: 3, desc: 'Buys Medieval generators and upgrades.' },
        gen4: { name: 'Industrial works', kind: 'gen', era: 4, desc: 'Buys Industrial generators and upgrades.' },
        gen5: { name: 'Atomic works', kind: 'gen', era: 5, desc: 'Buys Atomic generators and upgrades.' },
        gen6: { name: 'Spacefaring works', kind: 'gen', era: 6, desc: 'Buys Spacefaring generators and upgrades.' },
        research: { name: 'Research', kind: 'research', desc: 'Researches the cheapest available tech.' },
        trade: { name: 'Trade routes', kind: 'trade', mech: 'mech:trade', desc: 'Extends the cheapest trade route.' },
        rites: { name: 'Rites', kind: 'rites', mech: 'mech:rites', desc: 'Keeps rites burning when faith allows.' },
        grid: { name: 'Power grid', kind: 'grid', mech: 'mech:grid', desc: 'Raises grid sectors while energy allows; cuts power on shortfall.' },
        compute: { name: 'Compute programs', kind: 'compute', mech: 'mech:compute', desc: 'Balances compute across all programs.' },
        mega: { name: 'Megaprojects', kind: 'mega', mech: 'mech:mega', desc: 'Starts the next megaproject when one completes.' },
      },
      names: {  // syllable tables for procedurally generated agent names, by agent era
        first: [['Ukka', 'Tor', 'Mara', 'Ghel', 'Oru', 'Senn', 'Adda', 'Rhu'],
          ['Enki-dar', 'Ashtu', 'Nimra', 'Sharru', 'Ilum', 'Beletu', 'Taram', 'Kishar'],
          ['Theron', 'Callis', 'Lysandra', 'Demos', 'Varro', 'Octavia', 'Kyros', 'Helike'],
          ['Aldric', 'Brunhild', 'Gerolt', 'Isolde', 'Wendel', 'Maud', 'Osric', 'Hedda'],
          ['Josiah', 'Ada', 'Cornelius', 'Harriet', 'Silas', 'Augusta', 'Ezra', 'Winifred'],
          ['Ingrid', 'Viktor', 'Nadia', 'Raymond', 'Tomiko', 'Anders', 'Lucia', 'Dmitri'],
          ['Kaito', 'Selene', 'Idris', 'Noor', 'Anselm', 'Tavi', 'Orla', 'Juno'],
          ['Vessa', 'Corin', 'Ysolde', 'Hadrik', 'Lior', 'Sabine', 'Tamsin', 'Oren'],
          ['Vessa', 'Corvane', 'Isra', 'Dalmar', 'Kestrel', 'Ruun', 'Sarai', 'Thorne']],
        last: [['of the Ash', 'Two-Moons', 'Stonehand', 'Far-Walker', 'of the Deep Cave', 'Wolfkin'],
          ['of Eridu', 'the Scribe', 'of the High House', 'Tin-Bearer', 'of the River', 'Star-Reader'],
          ['of Kallos', 'the Elder', 'Aurelian', 'of the Harbor', 'Philemon', 'the Wise'],
          ['of Harrowmere', 'the Grey', 'Blackwood', 'of Saint Veil', 'Ironside', 'the Pious'],
          ['Blackburn', 'Whitlock', 'Crane', 'Harrow', 'Foundry', 'Steele'],
          ['Kessler', 'Voronin', 'Hale', 'Moreau', 'Sato', 'Lindqvist'],
          ['Okafor', 'Reyes', 'Lunov', 'Achebe', 'Vance', 'Tanaka'],
          ['Kaur', 'Veyl', 'Starborn', 'Ashgrove', 'Ninefold', 'Varr'],
          ['Kaur', 'Veyl', 'Ironmark', 'Duskbane', 'Solace', 'Harrowgate']],
      },
    },

    // ---------------------------------------------------------------- prestige ("The Long Night")
    // points = floor(k × max(0, log10(legacy) − offset)^power × ppMult) + eraBonus[highest era this run]
    // legacy = Σ produced this run × resources[r].legacy
    prestige: {
      minEra: 2,
      k: 1,
      offset: 8,
      power: 1.5,
      eraBonus: [0, 0, 5, 10, 20, 40, 80, 160, 320],
    },

    // ---------------------------------------------------------------- Immortal's Power Tree
    // Radial layout: branch index sets the angle, depth the ring, lat a sideways offset (radians fraction).
    // cost: [base, growth] in prestige points per level. req: {nodeId: minLevel}. reqEra: highest era ever reached.
    powerTree: {
      branches: [
        { id: 'dominion', name: 'Dominion', color: '#ffcf5a' },
        { id: 'echoes', name: 'Echoes of the First Fire', color: '#ff8a4c' },
        { id: 'retinue', name: 'Retinue', color: '#7fd0ff' },
        { id: 'inheritance', name: 'Inheritance', color: '#c7e07a' },
        { id: 'sleep', name: 'The Long Sleep', color: '#b59cff' },
        { id: 'seedworlds', name: 'Seedworlds', color: '#6fe0b0' },
        { id: 'diaspora', name: 'Diaspora', color: '#8fb0ff' },
        { id: 'ironwill', name: 'Iron Will', color: '#ff5d5d' },
        { id: 'endurance', name: 'Endurance', color: '#e0a0a0' },
      ],
      nodes: {
        // Dominion — production multipliers
        dom1: { branch: 0, depth: 1, name: 'Voice in the Fire', maxLevel: 10, cost: [1, 2],
          desc: 'Your whisper quickens every hand.', effects: [{ type: 'global', mult: 1.5 }] },
        dom2: { branch: 0, depth: 2, name: 'Hand on the Scales', maxLevel: 10, cost: [25, 2.5], req: { dom1: 3 },
          desc: 'Fortune favors what you favor.', effects: [{ type: 'global', mult: 2 }] },
        dom3: { branch: 0, depth: 3, name: 'Eternal Dominion', maxLevel: 25, cost: [500, 3], req: { dom2: 3 }, reqEra: 7,
          desc: 'Stars bend to an older will.', effects: [{ type: 'global', mult: 3 }] },
        // Echoes of the First Fire — faster early eras
        echo1: { branch: 1, depth: 1, name: 'Remembered Fire', maxLevel: 5, cost: [1, 2.2],
          desc: 'The first ages come easier each time.', effects: [{ type: 'prod', era: [0, 1], mult: 2 }] },
        echo2: { branch: 1, depth: 2, name: 'Remembered Roads', maxLevel: 5, cost: [6, 2.4], req: { echo1: 2 },
          desc: 'Empires rise along familiar paths.', effects: [{ type: 'prod', era: [2, 3], mult: 2 }] },
        echo3: { branch: 1, depth: 3, name: 'Remembered Engines', maxLevel: 5, cost: [40, 2.5], req: { echo2: 2 }, reqEra: 4,
          desc: 'Industry is rediscovered, not invented.', effects: [{ type: 'prod', era: [4, 5, 6], mult: 2 }] },
        echo_ms: { branch: 1, depth: 2, lat: 0.32, name: 'Swift Milestones', maxLevel: 3, cost: [10, 3.5], req: { echo1: 3 },
          desc: 'Each age needs less to be born.', effects: [{ type: 'eraReq', mult: 0.7 }] },
        echo_mem: { branch: 1, depth: 3, lat: 0.3, name: 'Deep Memory', maxLevel: 2, cost: [20, 5], req: { echo_ms: 1 },
          desc: 'Level 1: every run starts with all Stone Age research. Level 2: Bronze Age research too.',
          effects: [{ type: 'unlock', key: 'memory:0' }], levelEffects: { 2: [{ type: 'unlock', key: 'memory:1' }] } },
        // Retinue — stronger and cheaper agents
        ret1: { branch: 2, depth: 1, name: 'Loyal Retinue', maxLevel: 8, cost: [2, 2],
          desc: 'Your servants work faster.', effects: [{ type: 'agentSpeed', mult: 1.25 }] },
        ret_first: { branch: 2, depth: 2, lat: 0.3, name: 'First Disciple', maxLevel: 1, cost: [3, 1], req: { ret1: 1 },
          desc: 'Shamans can be recruited from the first moment of every run.', effects: [{ type: 'unlock', key: 'agent:shaman' }] },
        ret2: { branch: 2, depth: 2, name: 'Cheap Devotion', maxLevel: 5, cost: [4, 2.2], req: { ret1: 2 },
          desc: 'Mortals serve you for less.', effects: [{ type: 'agentCost', mult: 0.6 }] },
        ret3: { branch: 2, depth: 3, name: 'Remembered Names', maxLevel: 5, cost: [25, 3], req: { ret2: 2 },
          desc: 'Each agent acts more times per turn.', effects: [{ type: 'agentPower', add: 1 }] },
        // Inheritance — starting resources
        inh1: { branch: 3, depth: 1, name: 'Buried Caches', maxLevel: 5, cost: [1, 2],
          desc: 'Food and stone hidden for the next dawn.', effects: [{ type: 'startRes', res: 'food', amount: 2000 }, { type: 'startRes', res: 'stone', amount: 500 }] },
        inh2: { branch: 3, depth: 2, name: 'Hidden Hoards', maxLevel: 5, cost: [8, 2.5], req: { inh1: 2 },
          desc: 'Metal, scrolls and coin sealed in forgotten vaults.', effects: [{ type: 'startRes', res: 'bronze', amount: 500 }, { type: 'startRes', res: 'knowledge', amount: 200 }, { type: 'startRes', res: 'coin', amount: 50 }] },
        inh3: { branch: 3, depth: 3, name: 'Relic Vaults', maxLevel: 5, cost: [40, 2.5], req: { inh2: 2 }, reqEra: 4,
          desc: 'Faith and energy stored against the dark.', effects: [{ type: 'startRes', res: 'faith', amount: 2000 }, { type: 'startRes', res: 'energy', amount: 1000 }] },
        // The Long Sleep — offline cap
        sleep1: { branch: 4, depth: 1, name: 'The Long Sleep', maxLevel: 4, cost: [2, 2],
          desc: 'You may slumber longer and still the world turns.', effects: [{ type: 'offlineCap', add: 12 }] },
        sleep2: { branch: 4, depth: 2, name: 'Dreaming Hand', maxLevel: 3, cost: [20, 3], req: { sleep1: 2 },
          desc: 'Your dreams keep the world in order.', effects: [{ type: 'offlineCap', add: 24 }] },
        // Seedworlds — faster world maturation (late)
        seed1: { branch: 5, depth: 1, name: 'Seedworlds', maxLevel: 5, cost: [50, 2], reqEra: 7,
          desc: 'New colonies bloom faster.', effects: [{ type: 'maturation', mult: 1.5 }] },
        seed2: { branch: 5, depth: 2, name: 'Gardeners of Worlds', maxLevel: 5, cost: [150, 2.2], req: { seed1: 2 }, reqEra: 7,
          desc: 'Every world is a little kinder to life.', effects: [{ type: 'hab', add: 0.05 }] },
        // Diaspora — colonization yield (late)
        dia1: { branch: 6, depth: 1, name: 'Diaspora', maxLevel: 5, cost: [60, 2.2], reqEra: 7,
          desc: 'Each ark carries enough to seed another world.', effects: [{ type: 'colonyYield', add: 1 }] },
        dia2: { branch: 6, depth: 2, name: 'Swift Arks', maxLevel: 5, cost: [150, 2.3], req: { dia1: 2 }, reqEra: 7,
          desc: 'Faster, cheaper ships.', effects: [{ type: 'shipSpeed', mult: 1.5 }, { type: 'shipCost', mult: 0.8 }] },
        // Iron Will — fleet strength (late)
        iron1: { branch: 7, depth: 1, name: 'Iron Will', maxLevel: 10, cost: [200, 2], reqEra: 8,
          desc: 'Your fleets do not break.', effects: [{ type: 'fleetPower', mult: 2 }] },
        iron2: { branch: 7, depth: 2, name: 'Unbroken Legions', maxLevel: 5, cost: [500, 2.5], req: { iron1: 3 }, reqEra: 8,
          desc: 'Soldiers who remember a thousand wars.', effects: [{ type: 'unitPower', unit: 'legion', mult: 3 }] },
        // Endurance — attrition reduction (late)
        end1: { branch: 8, depth: 1, name: 'Endurance', maxLevel: 6, cost: [200, 2], reqEra: 8,
          desc: 'Fewer ships lost to the grind of war.', effects: [{ type: 'attrition', mult: 0.85 }] },
        end2: { branch: 8, depth: 2, name: 'Last Stand', maxLevel: 4, cost: [400, 2.5], req: { end1: 2 }, reqEra: 8,
          desc: 'Worlds cling on when fronts collapse.', effects: [{ type: 'lossMult', mult: 0.7 }] },
      },
    },

    // ---------------------------------------------------------------- achievements
    // cond types: res (produced this run), era, gen, totalGens, upgrades, research, agents, agentLevel, clicks,
    //   tradeLevels, rites, gridLevel, computeAll, mega, megaAll, prestiges, nodes, ppSpent, worlds, ships, fronts,
    //   frontsLost, fleet, bigNumber, playtime, habTech
    achievements: {
      multEach: 1.02,   // each achievement: all production ×1.02 (multiplicative, permanent)
      list: [
        { id: 'first_fire', name: 'First Fire', desc: 'Produce 100 Food in one run.', cond: { type: 'res', res: 'food', amount: 100 } },
        { id: 'hoarder', name: 'Hoarder', desc: 'Produce 10,000 Food in one run.', cond: { type: 'res', res: 'food', amount: 1e4 } },
        { id: 'feast', name: 'Feast Without End', desc: 'Produce 1M Food in one run.', cond: { type: 'res', res: 'food', amount: 1e6 } },
        { id: 'granary', name: 'Granary of Ages', desc: 'Produce 1T Food in one run.', cond: { type: 'res', res: 'food', amount: 1e12 } },
        { id: 'stonewright', name: 'Stonewright', desc: 'Produce 10,000 Stone in one run.', cond: { type: 'res', res: 'stone', amount: 1e4 } },
        { id: 'mountains', name: 'Mountain Mover', desc: 'Produce 1B Stone in one run.', cond: { type: 'res', res: 'stone', amount: 1e9 } },
        { id: 'era1', name: 'Metal in the Fire', desc: 'Reach the Bronze Age.', cond: { type: 'era', era: 1 } },
        { id: 'tin_copper', name: 'Tin and Copper', desc: 'Produce 100,000 Bronze in one run.', cond: { type: 'res', res: 'bronze', amount: 1e5 } },
        { id: 'first_words', name: 'First Words', desc: 'Produce 100 Knowledge in one run.', cond: { type: 'res', res: 'knowledge', amount: 100 } },
        { id: 'clay_library', name: 'Library of Clay', desc: 'Produce 1M Knowledge in one run.', cond: { type: 'res', res: 'knowledge', amount: 1e6 } },
        { id: 'era2', name: 'Marble and Law', desc: 'Reach the Classical Age.', cond: { type: 'era', era: 2 } },
        { id: 'rich_kings', name: 'Rich as Kings', desc: 'Produce 1M Coin in one run.', cond: { type: 'res', res: 'coin', amount: 1e6 } },
        { id: 'realm_coin', name: 'Coin of the Realm', desc: 'Produce 1T Coin in one run.', cond: { type: 'res', res: 'coin', amount: 1e12 } },
        { id: 'era3', name: 'Bells in the Dark', desc: 'Reach the Medieval Age.', cond: { type: 'era', era: 3 } },
        { id: 'devout', name: 'Devout', desc: 'Produce 100,000 Faith in one run.', cond: { type: 'res', res: 'faith', amount: 1e5 } },
        { id: 'cathedral_builders', name: 'Cathedral Builders', desc: 'Produce 10B Faith in one run.', cond: { type: 'res', res: 'faith', amount: 1e10 } },
        { id: 'era4', name: 'Smoke and Steel', desc: 'Reach the Industrial Age.', cond: { type: 'era', era: 4 } },
        { id: 'spark', name: 'Spark', desc: 'Produce 1M Energy in one run.', cond: { type: 'res', res: 'energy', amount: 1e6 } },
        { id: 'power_hungry', name: 'Power Hungry', desc: 'Produce 1Qa Energy in one run.', cond: { type: 'res', res: 'energy', amount: 1e15 } },
        { id: 'era5', name: 'Split the Atom', desc: 'Reach the Atomic Age.', cond: { type: 'era', era: 5 } },
        { id: 'thinking_machines', name: 'Thinking Machines', desc: 'Produce 1M Compute in one run.', cond: { type: 'res', res: 'compute', amount: 1e6 } },
        { id: 'era6', name: 'Leave the Cradle', desc: 'Reach the Spacefaring Age.', cond: { type: 'era', era: 6 } },
        { id: 'orbit', name: 'Forged in Orbit', desc: 'Produce 1M Alloy in one run.', cond: { type: 'res', res: 'alloy', amount: 1e6 } },
        { id: 'tribe', name: 'The Tribe', desc: 'Own 10 Gatherers.', cond: { type: 'gen', gen: 'gatherer', count: 10 } },
        { id: 'horde', name: 'The Horde', desc: 'Own 100 Gatherers.', cond: { type: 'gen', gen: 'gatherer', count: 100 } },
        { id: 'industrious', name: 'Industrious', desc: 'Own 500 generators in total.', cond: { type: 'totalGens', count: 500 } },
        { id: 'sprawl', name: 'Sprawl', desc: 'Own 2,000 generators in total.', cond: { type: 'totalGens', count: 2000 } },
        { id: 'refined', name: 'Refinement', desc: 'Buy a generator upgrade.', cond: { type: 'upgrades', count: 1 } },
        { id: 'master_craft', name: 'Master Craftsman', desc: 'Own 50 generator upgrades at once.', cond: { type: 'upgrades', count: 50 } },
        { id: 'curious', name: 'Curious', desc: 'Complete 5 research.', cond: { type: 'research', count: 5 } },
        { id: 'scholar', name: 'Scholar', desc: 'Complete 25 research in one run.', cond: { type: 'research', count: 25 } },
        { id: 'polymath', name: 'Polymath', desc: 'Complete 50 research in one run.', cond: { type: 'research', count: 50 } },
        { id: 'follower', name: 'First Follower', desc: 'Recruit an agent.', cond: { type: 'agents', count: 1 } },
        { id: 'retinue', name: 'Retinue', desc: 'Command 5 agents.', cond: { type: 'agents', count: 5 } },
        { id: 'court', name: 'Court of the Undying', desc: 'Command 10 agents.', cond: { type: 'agents', count: 10 } },
        { id: 'veteran', name: 'Veteran', desc: 'Raise an agent to level 10.', cond: { type: 'agentLevel', level: 10 } },
        { id: 'dirt_hands', name: 'Hands in the Dirt', desc: 'Forage 100 times (lifetime).', cond: { type: 'clicks', count: 100 } },
        { id: 'relentless', name: 'Relentless', desc: 'Forage 5,000 times (lifetime).', cond: { type: 'clicks', count: 5000 } },
        { id: 'silk_salt', name: 'Silk and Salt', desc: 'Reach 10 total trade route levels.', cond: { type: 'tradeLevels', count: 10 } },
        { id: 'ordained', name: 'Ordained', desc: 'Perform 10 rites in one run.', cond: { type: 'rites', count: 10 } },
        { id: 'grid_online', name: 'Grid Online', desc: 'Power a grid sector to level 3.', cond: { type: 'gridLevel', level: 3 } },
        { id: 'machine_mind', name: 'Machine Mind', desc: 'Run all three compute programs at once.', cond: { type: 'computeAll' } },
        { id: 'megastructure', name: 'Megastructure', desc: 'Complete a megaproject.', cond: { type: 'mega', count: 1 } },
        { id: 'wonders', name: 'Wonders of the Cradle', desc: 'Complete every megaproject in one run.', cond: { type: 'megaAll' } },
        { id: 'long_night', name: 'The Long Night', desc: 'Prestige for the first time.', cond: { type: 'prestiges', count: 1 } },
        { id: 'cycles', name: 'Cycles', desc: 'Prestige 5 times.', cond: { type: 'prestiges', count: 5 } },
        { id: 'eternal_return', name: 'Eternal Return', desc: 'Prestige 25 times.', cond: { type: 'prestiges', count: 25 } },
        { id: 'awakened', name: 'Awakened', desc: 'Own 5 Power Tree levels.', cond: { type: 'nodes', count: 5 } },
        { id: 'ascendant', name: 'Ascendant', desc: 'Spend 1,000 prestige points in total.', cond: { type: 'ppSpent', count: 1000 } },
        { id: 'patient', name: 'Patient', desc: 'Play for 1 hour.', cond: { type: 'playtime', sec: 3600 } },
        { id: 'devoted', name: 'Devoted', desc: 'Play for 24 hours.', cond: { type: 'playtime', sec: 86400 } },
      ],
    },

    // ---------------------------------------------------------------- flavor text for the event log
    flavor: {
      stone: [
        'A child is born beneath a hunter\'s moon.',
        'The tribe follows the herds south as frost creeps in.',
        'Someone presses an ochre hand to the cave wall. It is not the first time you have seen it.',
        'Wolves circle the camp but do not approach the fire.',
        'An elder tells a story about a stranger who never grows old.',
        'A new flint seam is found in the riverbed.',
        'The drums carry across the valley long after dark.',
      ],
      bronze: [
        'Smoke from the smelters hangs over the river towns.',
        'A scribe presses the first tally of grain into wet clay.',
        'The priest-kings raise a stair to the sky and call it holy.',
        'Caravans bring tin from beyond the mountains.',
        'A flood buries a city. Another rises on its bones.',
        'In the temple, a statue bears a face you once wore.',
        'The calendar-keepers predict an eclipse to the hour.',
      ],
      classical: [
        'A philosopher asks whether a man can live forever. You do not answer.',
        'Marble columns rise above the harbor.',
        'The assembly argues through the night about grain prices.',
        'A galley returns laden with dyes and spices.',
        'Surveyors lay out a road as straight as an arrow.',
        'An old coin bears a profile the mint-master cannot identify.',
        'Plague visits the lower city and leaves in autumn.',
      ],
      medieval: [
        'Bells toll across a frozen valley.',
        'A monk copies a manuscript older than his order.',
        'The guilds march in procession on the feast day.',
        'Pilgrims walk a thousand miles to touch a stone you once carried.',
        'A castle falls; the peasants till the same fields for the new lord.',
        'Wardens ride out against raiders from the north.',
        'A comet is read as an omen. The harvest is good regardless.',
      ],
      industrial: [
        'The sky over the mill towns turns the color of iron.',
        'A locomotive screams through a valley that once knew only wolves.',
        'Strikers gather at the foundry gates.',
        'Telegraph wires hum with prices from distant exchanges.',
        'A child born today will never see the stars through the smog.',
        'The engineers speak of efficiency the way priests spoke of grace.',
        'A new furnace is lit. It will not go out for a century.',
      ],
      atomic: [
        'A second sun blooms briefly over the test range.',
        'Tape reels spin in a cold, humming room.',
        'Sirens are tested at noon every Tuesday.',
        'The reactor hums. The city glows all night.',
        'Punch cards stack to the ceiling of the census bureau.',
        'A scientist dreams of the stars and wakes to calculate trajectories.',
        'Somewhere, a finger rests beside a button and does not press it.',
      ],
      spacefaring: [
        'A rocket climbs on a pillar of fire; the whole world watches.',
        'The first child is born in orbit.',
        'Mining drones crack open an asteroid like a seed.',
        'Solar mirrors glint above the equator.',
        'A lunar city lights its domes for the long night.',
        'Old nations dissolve into orbital consortia.',
        'The sky is crowded with our own stars now.',
      ],
    },
  };

  IG.CONFIG = CONFIG;
})();
