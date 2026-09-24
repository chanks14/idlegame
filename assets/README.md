# Asset overrides

Everything in the game is drawn in code (SVG icons, CSS, canvas). To replace any icon with a file:

1. Put the file in this folder (e.g. `assets/icons/food.png` or `assets/planets/garden.svg`).
2. Map the icon name to the file in `assets/manifest.js`:

```js
IG.ASSET_OVERRIDES = {
  food: 'assets/icons/food.png',
  planet_garden: 'assets/planets/garden.svg',
};
```

Icon names are the keys of `P` in `js/ui/icons.js`:

- resources: `food`, `stone`, `bronze`, `knowledge`, `coin`, `faith`, `energy`, `compute`, `alloy`, `starmatter`,
  `materiel`, `warships`, `legions`, `worlds`, `pp`
- generators: the generator id from `js/config.js` (e.g. `gatherer`, `smelter`, `reactor`, `foundry`)
- agents: `agent_<type>` (e.g. `agent_shaman`); planets: `planet_<type>`; factions: `faction_<id>`
- eras: `era_<id>` (e.g. `era_bronze`); ships: `colony_ship`, `warships`
- UI glyphs: `production`, `research`, `agents`, `galaxy`, `front`, `settings`, `stats`, `star`, `lock`, …

Overrides render as `<img>` at the same size as the SVG they replace, so square images work best.
