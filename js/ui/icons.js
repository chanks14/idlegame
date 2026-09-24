'use strict';
// SVG icon set (24×24 viewBox, flat silhouette style, fill = currentColor unless a planet needs its palette).
// Any icon can be replaced by a file: add an entry to IG.ASSET_OVERRIDES in assets/manifest.js, e.g.
//   IG.ASSET_OVERRIDES = { food: 'assets/icons/food.png', planet_garden: 'assets/planets/garden.svg' }
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  const DK = 'rgba(0,0,0,.4)';  // cut-out detail color on silhouettes
  const P = {};

  // ---------------------------------------------------------------- resources
  P.food = '<path d="M12 3c-1 2-1 4 0 6-3-1-6 1-6 5 0 4 3 7 6 7s6-3 6-7c0-4-3-6-6-5 1-2 3-3 5-3-2-1-4-1-5-3z"/>';
  P.stone = '<path d="M4 17l3-8 5-3 6 2 3 7-4 4H8z"/><path d="M9 10l3 3 4-2" fill="none" stroke="' + DK + '" stroke-width="1.2"/>';
  P.bronze = '<path d="M3 18l3-6h12l3 6z"/><path d="M6.5 11l2-4h7l2 4z" opacity=".75"/><path d="M5 18h14" stroke="' + DK + '" stroke-width="1"/>';
  P.knowledge = '<path d="M2 5c3-1.3 6-1 9 1v14c-3-2-6-2.3-9-1z"/><path d="M22 5c-3-1.3-6-1-9 1v14c3-2 6-2.3 9-1z"/>';
  P.coin = '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="' + DK + '" stroke-width="1.5"/><path d="M11 8h2v8h-2z" fill="' + DK + '"/>';
  P.faith = '<path d="M12 2c2 3 4.5 5 4.5 8a4.5 4.5 0 01-9 0c0-2 1-3 2-4 0 2 1 3 2 3 0-2-1-4 .5-7z"/><rect x="9.5" y="15.5" width="5" height="6.5" rx="1"/>';
  P.energy = '<path d="M13.5 1.5L4 14h6.5l-1.5 8.5L19 10h-6.5z"/>';
  P.compute = '<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9" y="9" width="6" height="6" fill="' + DK + '"/><path d="M8 2h1.5v4H8zM11.25 2h1.5v4h-1.5zM14.5 2H16v4h-1.5zM8 18h1.5v4H8zM11.25 18h1.5v4h-1.5zM14.5 18H16v4h-1.5zM2 8h4v1.5H2zM2 11.25h4v1.5H2zM2 14.5h4V16H2zM18 8h4v1.5h-4zM18 11.25h4v1.5h-4zM18 14.5h4V16h-4z"/>';
  P.alloy = '<path d="M3 4h18v4h-7v8h7v4H3v-4h7V8H3z"/>';
  P.starmatter = '<path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z"/><circle cx="19" cy="5" r="1.5"/><circle cx="5" cy="19" r="1"/>';
  P.materiel = '<path d="M8.5 22V9.5C8.5 5.5 12 2 12 2s3.5 3.5 3.5 7.5V22z"/><rect x="8.5" y="17" width="7" height="1.8" fill="' + DK + '"/><rect x="8.5" y="12" width="7" height="1" fill="' + DK + '"/>';
  P.warships = '<path d="M12 1l3.5 8.5L21 13l-5.5 1.5L14 23h-4l-1.5-8.5L3 13l5.5-3.5z"/><path d="M12 6l1.2 6h-2.4z" fill="' + DK + '"/>';
  P.legions = '<path d="M5 21v-7a7 7 0 0114 0v7h-4v-5H9v5z"/><path d="M10.5 1.5h3l1 5.5h-5z"/><path d="M8 13h8v1.6H8z" fill="' + DK + '"/>';
  P.worlds = '<circle cx="12" cy="12" r="6.5"/><ellipse cx="12" cy="12" rx="11" ry="3.6" fill="none" stroke="currentColor" stroke-width="1.6" transform="rotate(-20 12 12)"/><path d="M8 10c2 1 3-1 5 0s3 2 4 1" fill="none" stroke="' + DK + '" stroke-width="1.2"/>';
  P.pp = '<path d="M1 12s4-7.5 11-7.5S23 12 23 12s-4 7.5-11 7.5S1 12 1 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2"/><circle cx="13.3" cy="10.7" r="1.3" fill="' + DK + '"/>';

  // ---------------------------------------------------------------- Stone Age generators
  P.gatherer = '<circle cx="9" cy="5" r="2.2"/><path d="M8 8h2l2 5-2 1-1 7H7l.5-7L6 12z"/><path d="M13 13h7l-1 6h-5z"/><circle cx="15" cy="12" r="1"/><circle cx="18" cy="12" r="1"/>';
  P.knapper = '<path d="M3 20l8-8 2 2-8 8z"/><path d="M12 11l5-8 4 3-6 7z"/>';
  P.hunters = '<path d="M2 21L20 3l1.2 1.2L3.2 22.2z"/><path d="M18 2l4 0 0 4-2-2z"/><circle cx="8" cy="6" r="2"/><path d="M6 9h4l1 5-2 1v6H7v-6l-2-1z"/>';
  P.hearth = '<path d="M12 2c2 4 6 6 6 11a6 6 0 01-12 0c0-3 2-4 2-6 1 2 2 2 2 2 0-3 1-5 2-7z"/><path d="M3 21h18v1.5H3z"/><path d="M5 19l14 0-1 2H6z"/>';
  // ---------------------------------------------------------------- Bronze Age
  P.smelter = '<path d="M5 22V10a7 7 0 0114 0v12z"/><path d="M9 22v-5a3 3 0 016 0v5z" fill="' + DK + '"/><path d="M10 3h4v3h-4z"/>';
  P.scribe = '<rect x="3.5" y="3" width="12" height="17" rx="2"/><path d="M6.5 7h6M6.5 10h6M6.5 13h4" stroke="' + DK + '" stroke-width="1.5"/><path d="M17 21.5l3.8-12 1.6.5-3.8 12z"/>';
  P.fields = '<path d="M11 22V8h2v14z"/><path d="M12 2.5c2 1 2 3 0 4-2-1-2-3 0-4zM12 7c3 0 4 2 3 4-2 0-3-2-3-4zM12 7c-3 0-4 2-3 4 2 0 3-2 3-4zM12 11c3 0 4 2 3 4-2 0-3-2-3-4zM12 11c-3 0-4 2-3 4 2 0 3-2 3-4z"/><path d="M3 22h18v-1.5H3z"/>';
  P.forge = '<path d="M3 9h13c0 3-2 4-5 4v3h3v3H6v-3h3v-3C5 13 3 12 3 9z"/><path d="M15.5 1.5l1.5-1 5 5-1 1.5z"/><path d="M17 4.5l-4 4 1.2 1.2 4-4z"/>';
  // ---------------------------------------------------------------- Classical
  P.market = '<path d="M2 8.5L4 3h16l2 5.5z"/><path d="M6 3l-1 5.5M10 3l-.5 5.5M14 3l.5 5.5M18 3l1 5.5" stroke="' + DK + '" stroke-width="1.2"/><path d="M5 9h2v12H5zM17 9h2v12h-2z"/><path d="M8 14h8v7H8z"/>';
  P.academy = '<path d="M12 2l10 5H2z"/><path d="M3 8h18v2H3zM4 11h2.5v8H4zM8.5 11H11v8H8.5zM13 11h2.5v8H13zM17.5 11H20v8h-2.5zM2 20h20v2H2z"/>';
  P.mint = '<ellipse cx="12" cy="18" rx="8" ry="3" stroke="' + DK + '" stroke-width="1"/><ellipse cx="12" cy="13.5" rx="8" ry="3" stroke="' + DK + '" stroke-width="1"/><ellipse cx="12" cy="9" rx="8" ry="3" stroke="' + DK + '" stroke-width="1"/><ellipse cx="12" cy="9" rx="4.5" ry="1.4" fill="' + DK + '"/>';
  P.galley = '<path d="M2 14h20l-3 5H5z"/><path d="M11 2.5h2v11.5h-2z"/><path d="M13 3.5l7 6.5h-7z"/><path d="M5 19l-2 3M9 19l-1 3M13 19v3M17 19l1 3" stroke="currentColor" stroke-width="1.3"/>';
  // ---------------------------------------------------------------- Medieval
  P.chapel = '<path d="M12 1l4 6H8z"/><path d="M8 7h8v15H8z"/><path d="M10 10.5a2 2 0 014 0v3h-4z" fill="' + DK + '"/><path d="M3 14h5v8H3zM16 14h5v8h-5z" opacity=".7"/>';
  P.monastery = '<path d="M2 11l10-7 10 7v11H2z"/><path d="M6 22v-5.5a2 2 0 014 0V22zM14 22v-5.5a2 2 0 014 0V22z" fill="' + DK + '"/><path d="M11 8h2v4h-2z" fill="' + DK + '"/>';
  P.guildhall = '<path d="M3 10.5l9-6 9 6V22H3z"/><path d="M10 22v-5h4v5z" fill="' + DK + '"/><path d="M11.5 1h1v4.5h-1z"/><path d="M12.5 1h5.5l-1.5 1.8 1.5 1.8h-5.5z"/><path d="M6 13h3v2.5H6zM15 13h3v2.5h-3z" fill="' + DK + '"/>';
  P.cathedral = '<path d="M4.5 22V9l2.5-7.5L9.5 9v13zM14.5 22V9l2.5-7.5L19.5 9v13z"/><path d="M9 22V12l3-4.5 3 4.5v10z"/><circle cx="12" cy="14" r="1.7" fill="' + DK + '"/>';
  // ---------------------------------------------------------------- Industrial
  P.steam = '<rect x="2" y="7" width="11" height="8" rx="4"/><path d="M4 2.5h3V7H4z"/><circle cx="17.5" cy="15.5" r="5"/><circle cx="17.5" cy="15.5" r="2" fill="' + DK + '"/><path d="M12 11h5.5v1.6H12z"/><path d="M2 20h11v2H2z"/>';
  P.university = '<path d="M5 10a7 7 0 0114 0z"/><path d="M11.5 1h1v3h-1z"/><path d="M3 10h18v2H3zM4 13h2v7H4zM9 13h2v7H9zM13 13h2v7h-2zM18 13h2v7h-2zM2 20h20v2H2z"/>';
  P.works = '<path d="M2 22V11l6 4v-4l6 4v-4l5 3.3V3h3v19z"/><path d="M5 18h2v2H5zM10 18h2v2h-2zM15 18h2v2h-2z" fill="' + DK + '"/>';
  P.power_station = '<path d="M3 22c1-4 1-9-1-14h8c-2 5-2 10-1 14z"/><path d="M13 22c1-4 1-9-1-14h8c-2 5-2 10-1 14z"/><path d="M5 6c0-2 2-2 2-4M15 6c0-2 2-2 2-4" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".6"/>';
  // ---------------------------------------------------------------- Atomic
  P.tabulator = '<rect x="3" y="2" width="18" height="20" rx="1.5"/><circle cx="8.5" cy="8" r="3" fill="' + DK + '"/><circle cx="15.5" cy="8" r="3" fill="' + DK + '"/><path d="M6 14h12v1.5H6zM6 17h12v1.5H6z" fill="' + DK + '"/>';
  P.reactor = '<circle cx="12" cy="12" r="2.4"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="1.6"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="1.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="1.6" transform="rotate(-60 12 12)"/>';
  P.lab = '<path d="M9 2h6v2h-1v6l6 10a1.5 1.5 0 01-1.3 2.2H5.3A1.5 1.5 0 014 20l6-10V4H9z"/><path d="M7.2 16h9.6l2 4H5.2z" fill="' + DK + '"/><circle cx="11" cy="13" r="1"/><circle cx="13.5" cy="11" r=".8"/>';
  P.fab = '<circle cx="12" cy="12" r="10"/><path d="M6 8h3v3H6zM10.5 8h3v3h-3zM15 8h3v3h-3zM6 12.5h3v3H6zM10.5 12.5h3v3h-3zM15 12.5h3v3h-3zM8 17h3v2.5H8zM13 17h3v2.5h-3zM8 4.5h3V7H8zM13 4.5h3V7h-3z" fill="' + DK + '"/>';
  // ---------------------------------------------------------------- Spacefaring
  P.launch = '<path d="M12 1c3 3 4 7 4 11v5H8v-5c0-4 1-8 4-11z"/><circle cx="12" cy="9" r="1.8" fill="' + DK + '"/><path d="M8 13l-3 5v2l3-2zM16 13l3 5v2l-3-2z"/><path d="M10 18h4l-1 4.5h-2z" opacity=".7"/>';
  P.orbital_smelter = '<rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(45 12 12)"/><path d="M1.5 3l6 1-1 6-6-1zM22.5 21l-6-1 1-6 6 1z"/><path d="M7 7l3 3M14 14l3 3" stroke="currentColor" stroke-width="1.5"/>';
  P.observatory = '<path d="M3 16a9 9 0 0118 0z"/><path d="M11 7h2v9h-2z" fill="' + DK + '"/><path d="M14 4.5l6-3 1 2-6 3z"/><path d="M2 17h20v5H2z"/>';
  P.tug = '<path d="M3 13c0-4 3-6 6-6 2-2 6-1 7 2 2 1 2 4 0 6-1 3-5 4-8 3-3 0-5-2-5-5z"/><circle cx="8" cy="12" r="1.3" fill="' + DK + '"/><circle cx="12" cy="15" r="1.7" fill="' + DK + '"/><path d="M17 4l5.5-2.5L21 7z"/>';
  // ---------------------------------------------------------------- Galactic War
  P.foundry = '<path d="M2 22V12l5 3v-3l5 3V8h3v14z"/><path d="M17 22V11c0-3 2-5 2-5s2 2 2 5v11z"/>';
  P.yard = '<path d="M3 13l6-4h10l2 4-2 3H5z"/><path d="M2 20h20v2H2z"/><path d="M5 17l-2 3M10 17l-1 3M15 17l1 3M20 17l2 3" stroke="currentColor" stroke-width="1.5"/>';
  P.barracks = '<path d="M2 22V8h3v2h2V8h3v2h4V8h3v2h2V8h3v14h-8v-5a2 2 0 00-4 0v5z"/>';
  P.forge_world = '<circle cx="12" cy="12" r="10"/><path d="M5 9l4 2 3-3 2 4 5-1M6 16l4-1 3 3 4-3" fill="none" stroke="' + DK + '" stroke-width="1.6"/>';
  // ---------------------------------------------------------------- agents
  P.agent_shaman = '<circle cx="11" cy="7" r="3"/><path d="M8 4L6 1.5M14 4l2-2.5M7.5 6L4.5 4.5M14.5 6l3-1.5" stroke="currentColor" stroke-width="1.5"/><path d="M6 22l1.5-10h7L16 22z"/><path d="M19 7v15h1.6V7z"/><circle cx="19.8" cy="6.5" r="1.6"/>';
  P.agent_priest = '<path d="M9 1h6l-1 5h-4z"/><circle cx="12" cy="8.6" r="2.8"/><path d="M6 22l2-10h8l2 10z"/><path d="M11.2 13h1.6v6h-1.6z" fill="' + DK + '"/>';
  P.agent_scholar = '<circle cx="12" cy="5" r="3"/><path d="M7 22l1-12h8l1 12z" opacity=".7"/><path d="M5 13l7 1.8 7-1.8v5.5l-7 1.8-7-1.8z"/><path d="M12 14.8v5.5" stroke="' + DK + '" stroke-width="1"/>';
  P.agent_merchant = '<circle cx="10" cy="5" r="3"/><path d="M5 22l1-12h8l1 12z"/><circle cx="18" cy="16" r="4"/><path d="M17 11h2v2h-2z"/><path d="M17.3 15h1.4v3h-1.4z" fill="' + DK + '"/>';
  P.agent_warden = '<path d="M4 4l8-3 8 3v7c0 6-4 10-8 12-4-2-8-6-8-12z"/><path d="M12 5v14M7 10h10" stroke="' + DK + '" stroke-width="2"/>';
  P.agent_industrialist = '<path d="M8 1h8v7H8z"/><path d="M5 8h14v2H5z"/><circle cx="12" cy="13" r="3"/><path d="M6 23l1-6h10l1 6z"/>';
  P.agent_administrator = '<circle cx="12" cy="5" r="3"/><path d="M6 22l1-12h10l1 12z"/><path d="M11 10h2l.6 6-1.6 2-1.6-2z" fill="' + DK + '"/>';
  P.agent_navigator = '<circle cx="12" cy="10" r="8"/><path d="M6 9a6 4 0 0112 0v2a6 3 0 01-12 0z" fill="' + DK + '"/><path d="M6 18.5h12l1 4.5H5z"/>';
  P.agent_governor = '<path d="M5 8l2-5 3 3 2-4 2 4 3-3 2 5z"/><circle cx="12" cy="12" r="3"/><path d="M6 23l1-7h10l1 7z"/>';
  P.agent_admiral = '<path d="M4 8c2-4 14-4 16 0l-1 2H5z"/><path d="M5 10h14l-2 2H7z" opacity=".7"/><circle cx="12" cy="15" r="3"/><path d="M6 24l1-5h10l1 5z"/><path d="M11 5h2v2h-2z" fill="' + DK + '"/>';
  // ---------------------------------------------------------------- ships
  P.colony_ship = '<path d="M1.5 12l4-3.2h11.5l5.5 3.2-5.5 3.2H5.5z"/><circle cx="9" cy="12" r="2.4" fill="' + DK + '"/><circle cx="14.5" cy="12" r="2.4" fill="' + DK + '"/><path d="M4 7h4v1.5H4zM4 15.5h4V17H4z"/>';
  // ---------------------------------------------------------------- factions
  P.faction_vorrhal = '<path d="M12 2c-5 3-8 8-7 14l3-3c0 4 2 7 4 9 2-2 4-5 4-9l3 3c1-6-2-11-7-14z"/><circle cx="10" cy="11" r="1.4" fill="' + DK + '"/><circle cx="14" cy="11" r="1.4" fill="' + DK + '"/>';
  P.faction_ashen = '<circle cx="12" cy="12" r="3"/><path d="M5 12a7 7 0 0114 0M2 12a10 10 0 0120 0" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 12a7 7 0 0014 0M2 12a10 10 0 0020 0" fill="none" stroke="currentColor" stroke-width="1.8" opacity=".45"/>';
  P.faction_thessik = '<path d="M3 21L19 3l2 2-2 1 1 2-2 1 1 2-2 1 1 2-2 1 1 2-3 1L5 23z"/>';
  P.faction_lattice = '<path d="M12 2l9 5v10l-9 5-9-5V7z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 12l9-5M12 12L3 7M12 12v10" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.2"/>';
  // ---------------------------------------------------------------- eras
  P.era_stone = '<path d="M12 1l5 9-5 13-5-13z"/><path d="M12 5l2 5-2 6-2-6z" fill="' + DK + '"/>';
  P.era_bronze = '<path d="M2 21h20v-3H2zM4 17h16v-3H4zM6 13h12v-3H6zM9 9h6V6H9z"/><path d="M11 2.5h2V6h-2z"/>';
  P.era_classical = '<path d="M4 3h16v2H4zM6 6h12v1.5H6zM7 8h2v11H7zM11 8h2v11h-2zM15 8h2v11h-2zM5 19.5h14V21H5zM3 22h18v1.5H3z"/>';
  P.era_medieval = '<path d="M5 22V7h2V4h2v3h2V4h2v3h2V4h2v3h2v15h-5v-5a2 2 0 00-4 0v5z"/>';
  P.era_industrial = '<path d="M10.5 2h3l.5 2.5 2 .8 2.1-1.4 2.1 2.1-1.4 2.1.8 2 2.5.5v3l-2.5.5-.8 2 1.4 2.1-2.1 2.1-2.1-1.4-2 .8-.5 2.5h-3l-.5-2.5-2-.8-2.1 1.4-2.1-2.1 1.4-2.1-.8-2L2 13.5v-3l2.5-.5.8-2-1.4-2.1 2.1-2.1 2.1 1.4 2-.8z"/><circle cx="12" cy="12" r="3.5" fill="' + DK + '"/>';
  P.era_atomic = P.reactor;
  P.era_spacefaring = '<circle cx="11" cy="13" r="7"/><ellipse cx="12" cy="12" rx="11" ry="4" fill="none" stroke="currentColor" stroke-width="1.4" transform="rotate(-25 12 12)"/><circle cx="20" cy="4.5" r="2"/>';
  P.era_interstellar = '<path d="M12 12c0-2 2-3 3.5-2S17 13 15 14.5 10 16 8.5 13.5 8 7.5 12 6s9 1.5 9.5 6-3 9-8.5 9.5S2.5 18 2.5 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="1.8"/>';
  P.era_war = '<path d="M3 3l2-1 14 14-2 2L3 4z"/><path d="M21 3l-2-1L5 16l2 2L21 4z"/><path d="M4 17l3 3-2 2-3-3zM20 17l-3 3 2 2 3-3z"/>';
  // ---------------------------------------------------------------- UI glyphs
  P.research = '<path d="M9 2h6v2h-1v5l5 9a2 2 0 01-2 3H7a2 2 0 01-2-3l5-9V4H9z"/>';
  P.production = '<path d="M3 21V10l5 3V10l5 3V10l5 3V4h3v17z"/>';
  P.settings = '<path d="M12 8a4 4 0 100 8 4 4 0 000-8zm9 5v-2l-2.2-.6-.6-1.5 1.1-2-1.4-1.4-2 1.1-1.5-.6L13 3h-2l-.6 2.2-1.5.6-2-1.1-1.4 1.4 1.1 2-.6 1.5L3 11v2l2.2.6.6 1.5-1.1 2 1.4 1.4 2-1.1 1.5.6L11 21h2l.6-2.2 1.5-.6 2 1.1 1.4-1.4-1.1-2 .6-1.5z"/>';
  P.stats = '<path d="M3 21h18v-2H3zM5 17h3V9H5zm5 0h3V4h-3zm5 0h3v-6h-3z"/>';
  P.lock = '<path d="M7 10V7a5 5 0 0110 0v3h1v11H6V10zm2 0h6V7a3 3 0 00-6 0z"/>';
  P.forage = '<path d="M12 22c-5 0-8-4-8-8 3 0 5 1 7 3 0-5-2-9-6-12 5 1 9 5 9 11 1-3 4-5 6-5-1 6-4 11-8 11z"/>';
  P.era = '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 5v7l5 3"/>';
  P.check = '<path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z"/>';
  P.star = '<path d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 17l-6.5 4 2-7.5L2 9h7z"/>';
  P.unknown = '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.5 9a2.5 2.5 0 115 .5c0 2-2.5 2-2.5 4M12 16.5v1.5" fill="none" stroke="currentColor" stroke-width="2"/>';
  P.agents = '<circle cx="16" cy="6.5" r="3" opacity=".6"/><path d="M11 21c0-4.5 2.2-7.5 5-7.5s5 3 5 7.5z" opacity=".6"/><circle cx="9" cy="7.5" r="3.3"/><path d="M3 22c0-5 2.7-8 6-8s6 3 6 8z"/>';
  P.galaxy = P.era_interstellar;
  P.front = '<path d="M5 2h2v20H5z"/><path d="M7 3h13l-3 4 3 4H7z"/>';
  P.trade = '<path d="M11 3h2v17h-2zM6 21h12v1.5H6zM4 6h16v1.5H4z"/><path d="M5 7.5l-3 6.5h6zM19 7.5l-3 6.5h6z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M2 14a3 2 0 006 0zM16 14a3 2 0 006 0z"/>';
  P.up = '<path d="M12 3l8 8h-5v10H9V11H4z"/>';
  P.hourglass = '<path d="M6 2h12v2.5l-4.5 7.5 4.5 7.5V22H6v-2.5l4.5-7.5L6 4.5z"/><path d="M9 20h6l-3-4z" fill="' + DK + '"/>';
  P.moon = '<path d="M15 2a10 10 0 100 20A8 8 0 0115 2z"/>';
  P.warn = '<path d="M4 4l8-3 8 3v7c0 6-4 10-8 12-4-2-8-6-8-12z"/><path d="M12 2.5l-2 6 3 3-2 5 1.5 5" fill="none" stroke="' + DK + '" stroke-width="2"/>';
  P.infinity = '<path d="M6.5 8a4 4 0 100 8c2.5 0 3.5-2 5.5-4s3-4 5.5-4a4 4 0 110 8c-2.5 0-3.5-2-5.5-4S9 8 6.5 8z" fill="none" stroke="currentColor" stroke-width="2.2"/>';
  P.sound = '<path d="M3 9h4l5-5v16l-5-5H3z"/><path d="M15 8a5 5 0 010 8M17.5 5.5a8.5 8.5 0 010 13" fill="none" stroke="currentColor" stroke-width="1.8"/>';

  // ---------------------------------------------------------------- planets (own palettes)
  function planet(base, extra) {
    return '<circle cx="12" cy="12" r="10" fill="' + base + '"/>' + extra +
      '<circle cx="12" cy="12" r="10" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1"/>' +
      '<path d="M5 6.5a10 10 0 0114 0" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.2"/>' +
      '<path d="M22 12a10 10 0 01-17.5 6.6A10 10 0 0022 12z" fill="rgba(0,0,0,.28)"/>';
  }
  P.planet_garden = planet('#4caf6a', '<path d="M5 10c2-2 4 0 6-1s3-3 5-2 2 3 0 4-3 0-4 2-3 4-5 3-4-3-2-6z" fill="#3a7bd5"/><path d="M6 15c3-1 5 0 7-1" stroke="#fff" stroke-opacity=".6" stroke-width="1.2" fill="none"/>');
  P.planet_ocean = planet('#2f6fd6', '<path d="M8 8c1-1 3 0 3 1s-2 2-3 1zM14 14c2-1 3 0 3 1s-2 2-3 1z" fill="#7fd07a"/><path d="M4 12c4-1 7 1 11 0M9 17c3-1 6 0 9-1" stroke="#fff" stroke-opacity=".55" stroke-width="1.1" fill="none"/>');
  P.planet_desert = planet('#d9a55b', '<path d="M3 11c4-2 7 1 11-1s5 0 7 1M4 15c4-1 8 1 12-1M7 7c3-1 6 1 10 0" stroke="#a8743a" stroke-width="1.4" fill="none"/>');
  P.planet_tundra = planet('#cfeaff', '<path d="M6 8l4 3 3-2 3 4 3-1M5 15l4-1 2 3 4-2" stroke="#8fb8d8" stroke-width="1.2" fill="none"/>');
  P.planet_volcanic = planet('#5a2b22', '<path d="M5 9l4 2 3-3 2 4 5-1M6 16l4-1 3 3 4-3" stroke="#ff6a3a" stroke-width="1.5" fill="none"/><circle cx="15" cy="8" r="1.2" fill="#ffb347"/>');
  P.planet_barren = planet('#8d877f', '<circle cx="8" cy="9" r="2.2" fill="#6d675f"/><circle cx="15" cy="14" r="3" fill="#6d675f"/><circle cx="14" cy="7" r="1.2" fill="#6d675f"/><circle cx="8" cy="16" r="1.4" fill="#6d675f"/>');
  P.planet_gas = planet('#c79aea', '<path d="M2.5 9h19M2 12h20M2.5 15h19" stroke="#9b6cc8" stroke-width="1.6"/><path d="M2.5 10.5h19" stroke="#ecd4ff" stroke-width="1"/><ellipse cx="15" cy="15" rx="2.2" ry="1.2" fill="#9b6cc8"/>');
  P.planet_asteroid = '<path d="M3 9c0-3 3-5 5-4 2-1 4 1 4 3s-2 4-4 4-5 0-5-3z" fill="#a88a70"/><path d="M12 16c0-3 3-4 5-3 2-1 5 1 4 4s-2 4-5 4-4-2-4-5z" fill="#8f735b"/><path d="M15 5c1-1 3 0 3 1s-1 2-2 2-2-2-1-3z" fill="#b89a80"/><circle cx="7" cy="8" r=".9" fill="#6f5a48"/><circle cx="17" cy="16" r="1.1" fill="#6f5a48"/><circle cx="4" cy="18" r="1.2" fill="#a88a70"/>';

  // achievement badges reuse glyphs by condition type
  const ALIAS = {
    ach_res: 'star', ach_era: 'era', ach_gen: 'production', ach_totalGens: 'production', ach_upgrades: 'up',
    ach_research: 'research', ach_agents: 'agents', ach_agentLevel: 'up', ach_clicks: 'forage', ach_tradeLevels: 'trade',
    ach_rites: 'faith', ach_gridLevel: 'energy', ach_computeAll: 'compute', ach_mega: 'alloy', ach_megaAll: 'alloy',
    ach_playtime: 'hourglass', ach_prestiges: 'moon', ach_nodes: 'pp', ach_ppSpent: 'pp', ach_worlds: 'worlds',
    ach_ships: 'colony_ship', ach_habTech: 'planet_garden', ach_fronts: 'front', ach_frontsLost: 'warn', ach_fleet: 'warships',
    ach_bigNumber: 'infinity',
  };

  function fallback(name) {
    const ch = (name || '?').replace(/^.*_/, '').charAt(0).toUpperCase();
    return '<circle cx="12" cy="12" r="10" fill="currentColor" opacity=".25"/><text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">' + ch + '</text>';
  }

  function html(name, cls) {
    const ov = IG.ASSET_OVERRIDES && IG.ASSET_OVERRIDES[name];
    const c = 'ic' + (cls ? ' ' + cls : '');
    if (ov) return '<img class="' + c + '" src="' + ov + '" alt="">';
    const key = P[name] ? name : ALIAS[name];
    return '<svg class="' + c + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[key] || fallback(name)) + '</svg>';
  }

  function node(name, cls) {
    const span = document.createElement('span');
    span.className = 'icw';
    span.innerHTML = html(name, cls);
    return span;
  }

  IG.icons = { P, ALIAS, html, node, has: (n) => !!(P[n] || ALIAS[n]) };
})();
