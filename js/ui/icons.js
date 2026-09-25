'use strict';
// SVG icon set (24×24 viewBox). Full-color flat illustrations with shade/highlight overlays; only a few chrome
// glyphs (lock, unknown, sound) and the faction emblems use currentColor so CSS can tint them.
// Any icon can be replaced by a file: add an entry to IG.ASSET_OVERRIDES in assets/manifest.js, e.g.
//   IG.ASSET_OVERRIDES = { food: 'assets/icons/food.png', planet_garden: 'assets/planets/garden.svg' }
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  const DK = 'rgba(0,0,0,.4)';   // cut-out detail color on silhouettes
  const SH = 'rgba(0,0,0,.22)';  // shade overlay (right/lower faces)
  const HL = 'rgba(255,255,255,.5)'; // highlight overlay
  const SK = '#e8b48a';          // skin
  const P = {};

  // tiny SVG builders: path, circle, rect, stroked path
  const p = (d, fill, a) => '<path d="' + d + '" fill="' + fill + '"' + (a ? ' ' + a : '') + '/>';
  const c = (cx, cy, r, fill, a) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"' + (a ? ' ' + a : '') + '/>';
  const r = (x, y, w, h, fill, rx) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (rx ? ' rx="' + rx + '"' : '') + ' fill="' + fill + '"/>';
  const s = (d, stroke, w, a) => '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (a ? ' ' + a : '') + '/>';

  // ---------------------------------------------------------------- resources
  P.food = // green apple
    p('M12 7.6c-1.6-1-3.4-1.4-5-.8C4.4 7.7 3.3 10.4 3.8 13.6c.6 3.9 3.2 7.4 5.7 7.4 1 0 1.6-.5 2.5-.5s1.5.5 2.5.5c2.5 0 5.1-3.5 5.7-7.4.5-3.2-.6-5.9-3.2-6.8-1.6-.6-3.4-.2-5 .8z', '#7cc242') +
    p('M15.4 7.1c2.3 1.1 3.4 3.6 2.9 6.5-.5 3.4-2.6 6.5-4.7 7 2.6-.1 5.1-3.5 5.7-7.2.5-3.1-.8-5.8-3.9-6.3z', SH) +
    '<ellipse cx="7.6" cy="11.2" rx="1.1" ry="2.3" transform="rotate(20 7.6 11.2)" fill="' + HL + '"/>' +
    s('M12 7.8c0-2 .5-3.6 1.7-4.9', '#6b4423', 1.5) +
    p('M13.2 4.6c1.4-1.9 3.8-2.4 5.6-1.8-.6 2-2.7 3.2-5.6 1.8z', '#3f9a2a');
  P.stone =
    p('M3 17.5l2.5-7 5-3.8 6.2 1.3 4 6.5-2.2 4.8-9 .9z', '#8f887d') +
    p('M5.5 10.5l5-3.8 6.2 1.3-3.4 3.3-6.2.6z', '#c4bdb1') +
    p('M13.3 11.3l3.4-3.3 4 6.5-2.2 4.8-4.4-1.2z', '#6c665c') +
    s('M8 14.5l2.5 1.5 1.8-1.2', 'rgba(0,0,0,.35)', .9);
  P.bronze = // ingot
    p('M4 19.5l2-6.5h12l2 6.5z', '#c7792c') + p('M6 13l1.6-3h8.8l1.6 3z', '#f5b866') +
    p('M18 13l2 6.5h-3.2L15.4 13z', SH) + s('M7.5 16h5', HL, 1) + c(17.5, 6.5, 1, '#fff3c0') +
    s('M17.5 4.5v4M15.5 6.5h4', '#fff3c0', .7);
  P.knowledge = // open book
    p('M1.5 6.5V20c3.5-1.2 7-1 10.5 1 3.5-2 7-2.2 10.5-1V6.5z', '#3a67c8') +
    p('M2.5 5c3-1.2 6.2-.9 9 1v13.5c-2.8-1.8-6-2.2-9-1z', '#f7ecd0') +
    p('M21.5 5c-3-1.2-6.2-.9-9 1v13.5c2.8-1.8 6-2.2 9-1z', '#e6d5ab') +
    s('M4.5 8.5c1.8-.4 3.6-.2 5 .6M4.5 11.5c1.8-.4 3.6-.2 5 .6M4.5 14.5c1.8-.4 3.6-.2 5 .6M14.5 12.1c1.4-.8 3.2-1 5-.6M14.5 15.1c1.4-.8 3.2-1 5-.6', '#8f9fc4', .8) +
    p('M15.5 5.3V10l1.3-1 1.3 1V4.9z', '#e0443a');
  P.coin =
    c(12, 12, 9.5, '#d99a1c') + c(12, 11.4, 8.6, '#f7c843') + c(12, 11.4, 6.2, 'none', 'stroke="#c88a14" stroke-width="1"') +
    p('M12 7.6l1.2 2.5 2.7.3-2 1.8.6 2.7-2.5-1.4-2.5 1.4.6-2.7-2-1.8 2.7-.3z', '#c88a14') +
    s('M6.2 8.4a7 7 0 013.6-3.3', '#fff6c8', 1.2);
  P.faith = // votive candle with halo
    c(12, 7, 5.5, '#d9a0ff', 'opacity=".35"') +
    p('M12 1.8c1.8 2.2 3 3.8 3 5.6a3 3 0 01-6 0c0-1.8 1.2-3.4 3-5.6z', '#ff9a2a') +
    p('M12 4.8c.9 1.2 1.5 2 1.5 3a1.5 1.5 0 01-3 0c0-1 .6-1.8 1.5-3z', '#fff2a8') +
    r(11.6, 10.3, .8, 1.3, '#3a2a1a') + r(8.5, 11.5, 7, 9, '#f3e8d2', 1) + r(13.2, 11.5, 2.3, 9, SH) +
    p('M8.5 12.3c0-.5.4-.8.8-.8h3.4v2.8a.8.8 0 01-1.6 0v-1h-2.6z', '#fffaf0') + r(6, 20, 12, 2.2, '#a86ad8', 1);
  P.energy =
    p('M13.5 1.5L4 14h6.5l-1.5 8.5L19 10h-6.5z', '#ffd83b', 'stroke="#e3861b" stroke-width="1" stroke-linejoin="round"') +
    p('M13.2 2.6L5.3 13.2h4.2z', '#fff6c2');
  P.compute = // chip
    p('M8 2h1.5v4H8zM11.25 2h1.5v4h-1.5zM14.5 2H16v4h-1.5zM8 18h1.5v4H8zM11.25 18h1.5v4h-1.5zM14.5 18H16v4h-1.5zM2 8h4v1.5H2zM2 11.25h4v1.5H2zM2 14.5h4V16H2zM18 8h4v1.5h-4zM18 11.25h4v1.5h-4zM18 14.5h4V16h-4z', '#e0b64a') +
    r(6, 6, 12, 12, '#2f3a48', 1.5) + r(9, 9, 6, 6, '#3ee8a0', .8) + r(10, 10, 2, 2, '#c8ffe6') + c(7.8, 7.8, .7, '#8a95a8');
  P.alloy = // steel I-beam
    p('M3 4h18v4h-7v8h7v4H3v-4h7V8H3z', '#9cc3e6') + r(3, 6.6, 18, 1.4, '#6388b0') + r(3, 18.6, 18, 1.4, '#6388b0') +
    r(12.6, 8, 1.4, 8, '#6388b0') + r(3, 4, 18, .9, '#e2f0ff') + r(3, 16, 18, .9, '#e2f0ff');
  P.starmatter =
    p('M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z', '#a86cff') +
    p('M12 5.5l1.6 4.9 4.9 1.6-4.9 1.6-1.6 4.9-1.6-4.9L5.5 12l4.9-1.6z', '#e9d6ff') + c(12, 12, 1.6, '#fff') +
    c(19, 5, 1.5, '#ff9ee6') + c(5, 19, 1.1, '#8fd8ff');
  P.materiel = // shell
    p('M8.5 12V9.5C8.5 5.5 12 2 12 2s3.5 3.5 3.5 7.5V12z', '#e0553a') + r(8.5, 12, 7, 9, '#d9a441') +
    r(8.5, 12, 7, 1.3, '#8a5a1a') + r(7.8, 20.2, 8.4, 1.8, '#b0802a', .4) + r(9.4, 5, 1, 15, HL) + r(13.4, 6, 2.1, 14, SH);
  P.warships =
    p('M12 1l3.5 8.5L21 13l-5.5 1.5L14 23h-4l-1.5-8.5L3 13l5.5-3.5z', '#aab5c7') +
    p('M12 1l3.5 8.5L21 13l-5.5 1.5L14 23h-2z', SH) + p('M12 6l1.2 6h-2.4z', '#ff5a4f') +
    p('M3 13l5.5-3.5.4 1.6L5 13.4zM21 13l-5.5-3.5-.4 1.6 3.9 2.3z', '#ff5a4f') + r(10.5, 21.4, 3, 1.6, '#4de1ff');
  P.legions = // helmet with crest
    p('M10.5 1.5h3l1 5.5h-5z', '#e0483a') + p('M5 21v-7a7 7 0 0114 0v7h-4v-5H9v5z', '#b3bdc9') +
    p('M12 7a7 7 0 017 7v7h-4v-5h-3z', SH) + p('M8 13h8v1.6H8z', '#2a2f38') + s('M7 11a5.5 5.5 0 013-3', HL, 1);
  P.worlds = // ringed planet
    s('M1 12a11 3.6 0 0122 0', '#e8c070', 1.6, 'transform="rotate(-20 12 12)"') +
    c(12, 12, 6.5, '#3f8fe0') + p('M7 10.5c1.5-1.5 3-.5 4-1.5s2.5-1.5 3.5 0-.5 2-2 2.5-1 2-2.5 2.5-3.5-1-3-3.5z', '#6fd07a') +
    p('M18.5 12a6.5 6.5 0 01-11.4 4.3A6.5 6.5 0 0018.5 12z', SH) +
    s('M1 12a11 3.6 0 0022 0', '#f0cf80', 1.6, 'transform="rotate(-20 12 12)"');
  P.pp = // the eye of the Immortal
    p('M1 12s4-7.5 11-7.5S23 12 23 12s-4 7.5-11 7.5S1 12 1 12z', '#2a1a40', 'stroke="#ffd36a" stroke-width="1.8"') +
    c(12, 12, 4.4, '#9a6cff') + c(12, 12, 2, '#1a0f2a') + c(13.4, 10.6, 1.2, '#fff');

  // ---------------------------------------------------------------- Stone Age generators
  P.gatherer =
    c(8, 4.6, 2.2, SK) + p('M8 7.8c-.6-.2-1.2 0-1.5.5L5.8 12l1.6.9-.4 8.1h2.2l.8-6.8 1.6-1.2-1.4-4.6c-.3-.5-.6-.6-1-.6z', '#9a6a3a') +
    p('M12.5 13h8.2l-1.3 7.5h-5.6z', '#c8994f') + s('M13 15.5h7.2M13.5 18h6.2', '#8a6128', .8) +
    c(14.8, 12.4, 1.3, '#e0443a') + c(17, 11.8, 1.3, '#9a3ab8') + c(19.2, 12.4, 1.2, '#e0443a') + p('M16 10.8c.6-1 1.6-1.4 2.6-1.2-.4 1-1.4 1.5-2.6 1.2z', '#3f9a2a');
  P.knapper =
    p('M3 20l8-8 2 2-8 8z', '#8a5a2e') + s('M6 17.5l1.5 1.5M7.5 16l1.5 1.5', '#d9b27a', .9) +
    p('M12 11l5-8 4 3-6 7z', '#7f8ea8') + p('M12 11l5-8 1.6 1.2L13.6 12.4z', '#c3cedf') +
    c(9, 6, .8, '#ffd23f') + c(7, 8.6, .6, '#ff9a2a') + c(10.6, 3.8, .55, '#ffd23f');
  P.hunters =
    s('M3 21L19.5 4.5', '#8a5a2e', 1.7) + p('M18 2h4v4l-2-2z', '#9aa7b8') +
    c(8, 6, 2, SK) + p('M6 9h4l1 5-2 1v6H7v-6l-2-1z', '#6b7a3a') + p('M6.2 10.5h3.6l.3 1.5H5.9z', '#c8a46a');
  P.hearth =
    p('M5 18.8h14l-1 2H6z', '#7a4a24') + s('M6 18l12 2M6 20l12-2', '#5a3418', 1.4) +
    c(4.2, 21.4, 1.5, '#8d877f') + c(8, 21.7, 1.5, '#a39d94') + c(12, 21.8, 1.5, '#8d877f') + c(16, 21.7, 1.5, '#a39d94') + c(19.8, 21.4, 1.5, '#8d877f') +
    p('M12 2c2 4 6 6 6 11a6 6 0 01-12 0c0-3 2-4 2-6 1 2 2 2 2 2 0-3 1-5 2-7z', '#ff6a1a') +
    p('M12 7c1.5 3 4 4.5 4 7.5a4 4 0 01-8 0c0-2 1.3-3 1.5-4 .8 1.2 1.5 1.4 1.5 1.4 0-2 .3-3.5 1-4.9z', '#ffae2e') +
    p('M12 12c.8 1.5 2 2.3 2 3.8a2 2 0 01-4 0c0-1.5 1.2-2.3 2-3.8z', '#fff0a0');
  // ---------------------------------------------------------------- Bronze Age
  P.smelter =
    r(10, 1.2, 4, 3.5, '#7a3e24') + c(12, .9, 1.2, 'rgba(210,210,220,.7)') +
    p('M5 22V10a7 7 0 0114 0v12z', '#b8653a') + p('M15 4.3A7 7 0 0119 10v12h-3V10c0-2.4-.4-4.2-1-5.7z', SH) +
    s('M5.8 13h2.6M15.6 13h2.6M5.3 16.5h3M15.6 16.5h3M7 9.5h2.4', 'rgba(0,0,0,.3)', .8) +
    p('M9 22v-5a3 3 0 016 0v5z', '#ff7a1a') + p('M10.5 22v-4a1.5 1.5 0 013 0v4z', '#ffe07a');
  P.scribe =
    r(3.5, 3, 12, 17, '#c9a36b', 2) + r(12.8, 3, 2.7, 17, SH) + r(3.5, 3, 12, 1.2, HL) +
    s('M6.5 7h6M6.5 10h6M6.5 13h4M6.5 16h5', '#7a5a2e', 1.3) +
    p('M17 21.5l3.8-12 1.6.5-3.8 12z', '#a8894a') + p('M17 21.5l.6-1.9 1.6.5z', '#4a3020');
  P.fields =
    r(2, 20, 20, 2.5, '#6b4a2a') + s('M3 21.2c1.5-.6 3 .6 4.5 0s3 .6 4.5 0 3 .6 4.5 0 3 .6 4.5 0', '#5ab0ff', .9) +
    r(11.2, 8, 1.6, 12, '#8fb63a') + p('M12 16c-2.5-.5-4.5.5-5.5 2 2.5.5 4.5-.5 5.5-2z', '#7cc242') +
    p('M12 2.5c2 1 2 3 0 4-2-1-2-3 0-4zM12 7c3 0 4 2 3 4-2 0-3-2-3-4zM12 7c-3 0-4 2-3 4 2 0 3-2 3-4zM12 11c3 0 4 2 3 4-2 0-3-2-3-4zM12 11c-3 0-4 2-3 4 2 0 3-2 3-4z', '#f0c040') +
    p('M12 7c3 0 4 2 3 4-2 0-3-2-3-4zM12 11c3 0 4 2 3 4-2 0-3-2-3-4z', 'rgba(170,100,10,.3)');
  P.forge =
    p('M3 9h13c0 3-2 4-5 4v3h3v3H6v-3h3v-3C5 13 3 12 3 9z', '#5d6573') + p('M3 9h13c0 .6-.1 1.1-.3 1.5H3.3C3.1 10.1 3 9.6 3 9z', '#a3acba') +
    r(6, 18, 8, 1, SH) + p('M17 4.5l-4 4 1.2 1.2 4-4z', '#9a6a3a') + p('M15.5 1.5l1.5-1 5 5-1 1.5z', '#8e97a6') +
    r(7, 7.6, 5, 1.4, '#ff8a2a', .6) + c(12.5, 5.8, .7, '#ffb02e') + c(9.8, 5, .6, '#ffd23f') + c(11.4, 3.6, .5, '#ff7a1a');
  // ---------------------------------------------------------------- Classical
  P.market =
    r(5, 9, 2, 12, '#8a5a2e') + r(17, 9, 2, 12, '#8a5a2e') + p('M8 14h8v7H8z', '#b07a42') + r(8, 14, 8, 1.2, '#d9a466') +
    c(9.8, 13, 1.3, '#7cc242') + c(12.1, 12.8, 1.4, '#ff9a2a') + c(14.3, 13, 1.3, '#e0443a') +
    p('M2 8.5L4 3h16l2 5.5z', '#e0483a') +
    p('M6.7 3h2.6l-.6 5.5H5.3zM12 3h2.7l.6 5.5H12zM17.3 3H20l2 5.5h-3.3z', '#f7ecd6');
  P.academy =
    p('M12 2l10 5H2z', '#efe9dc') + p('M12 2l10 5H12z', 'rgba(0,0,0,.1)') + c(12, 5.1, .9, '#e0b64a') +
    r(3, 8, 18, 2, '#d9d1bf') + p('M4 11h2.5v8H4zM8.5 11H11v8H8.5zM13 11h2.5v8H13zM17.5 11H20v8h-2.5z', '#f4efe4') +
    p('M5.6 11h.9v8h-.9zM10.1 11h.9v8h-.9zM14.6 11h.9v8h-.9zM19.1 11h.9v8h-.9z', 'rgba(0,0,0,.14)') + r(2, 20, 20, 2, '#b3a994');
  P.mint =
    '<ellipse cx="12" cy="18" rx="8" ry="3" fill="#d99a1c" stroke="#a8740e" stroke-width="1"/>' +
    '<ellipse cx="12" cy="13.5" rx="8" ry="3" fill="#ebb22e" stroke="#a8740e" stroke-width="1"/>' +
    '<ellipse cx="12" cy="9" rx="8" ry="3" fill="#f7c843" stroke="#a8740e" stroke-width="1"/>' +
    '<ellipse cx="12" cy="9" rx="4.5" ry="1.4" fill="#d99a1c"/>' + s('M6 7.6c1-.8 2.4-1.3 4-1.5', '#fff6c8', .9);
  P.galley =
    s('M1.5 22c1.5-.8 3 .8 4.5 0s3 .8 4.5 0 3 .8 4.5 0 3 .8 4.5 0 3 .8 4.5 0', '#4aa3e8', 1.1) +
    s('M5 19l-2 2.6M9 19l-1 2.6M13 19v2.6M17 19l1 2.6', '#c9a36b', 1.2) +
    r(11, 2.5, 2, 11.5, '#6b4423') + p('M13 3.5l7 6.5h-7z', '#f7ecd6') + p('M13 6.5h3.2l1.4 1.3H13z', '#e0483a') +
    p('M2 14h20l-3 5H5z', '#9a5f2e') + p('M2.9 15.5h18.2l-.5.9H3.4z', '#e0b64a') +
    c(7, 17.5, .8, '#e0483a') + c(10.5, 17.5, .8, '#3a8fe0') + c(14, 17.5, .8, '#e0483a') + c(17.4, 17.5, .8, '#3a8fe0');
  // ---------------------------------------------------------------- Medieval
  P.chapel =
    p('M3 14h5v8H3zM16 14h5v8h-5z', '#b5ac9a') + p('M2.4 14.2L5.5 11.2 8 14zM16 14l2.5-2.8 3.1 3z', '#56658a') +
    p('M8 7h8v15H8z', '#d4cbb8') + r(14, 7, 2, 15, SH) + p('M12 1l4 6H8z', '#56658a') + r(11.6, -.2, .8, 2, '#e0b64a') +
    p('M10 10.5a2 2 0 014 0v3h-4z', '#ffc94a') + p('M10.8 22v-3a1.2 1.2 0 012.4 0v3z', '#5a3a22');
  P.monastery =
    p('M2 11l10-7 10 7v11H2z', '#d8c8a4') + p('M12 4l10 7v11h-5V11z', 'rgba(0,0,0,.1)') +
    s('M1.5 11.6L12 4.2l10.5 7.4', '#a8452e', 2) +
    p('M6 22v-5.5a2 2 0 014 0V22zM14 22v-5.5a2 2 0 014 0V22z', '#5a3a22') + p('M11 8h2v4h-2z', '#ffc94a');
  P.guildhall =
    p('M3 10.5l9-6 9 6V22H3z', '#efe2c4') + p('M5 14h2v2.5H5zM17 14h2v2.5h-2z', '#ffc94a') +
    s('M3 12.8h18M3 17.8h18M8 10v12M16 10v12M8 12.8l4 5M16 12.8l-4 5', '#6b4423', 1.1) +
    s('M2.5 11L12 4.7l9.5 6.3', '#8a3a28', 1.6) + p('M10 22v-4.5h4V22z', '#5a3a22') +
    r(11.5, 1, 1, 4.5, '#6b4423') + p('M12.5 1h5.5l-1.5 1.8 1.5 1.8h-5.5z', '#3a7bd5');
  P.cathedral =
    p('M4.5 22V9l2.5-7.5L9.5 9v13zM14.5 22V9l2.5-7.5L19.5 9v13z', '#aeb2bd') + p('M4.5 9l2.5-7.5L9.5 9zM14.5 9l2.5-7.5L19.5 9z', '#56658a') +
    p('M9 22V12l3-4.5 3 4.5v10z', '#c9ccd4') + r(6.3, 11.5, 1.4, 3, '#ffc94a') + r(16.3, 11.5, 1.4, 3, '#ffc94a') +
    c(12, 14, 2, '#3a6fd8') + c(12, 14, 1, '#e0443a') + p('M10.8 22v-3a1.2 1.2 0 012.4 0v3z', '#5a3a22');
  // ---------------------------------------------------------------- Industrial
  P.steam =
    c(7.5, 1.6, 1.5, 'rgba(230,235,245,.85)') + c(9.6, 1.2, 1.1, 'rgba(230,235,245,.6)') +
    r(4, 2.5, 3, 4.5, '#3a4250') + r(2, 7, 11, 8, '#4a5566', 4) + r(5, 7, 1.2, 8, '#d9a441') + r(9, 7, 1.2, 8, '#d9a441') +
    r(3, 8, 9, 1.2, 'rgba(255,255,255,.15)', .6) + r(12, 11, 5.5, 1.6, '#b8c0cc') + r(2, 20, 11, 2, '#3a4250') +
    c(17.5, 15.5, 5, '#c0392b') + c(17.5, 15.5, 3.6, '#3a2a28') + s('M17.5 11.9v7.2M13.9 15.5h7.2M15 13l5 5M20 13l-5 5', '#c0392b', 1) + c(17.5, 15.5, 1.3, '#d9a441');
  P.university =
    r(11.5, 1, 1, 3, '#d9a441') + p('M5 10a7 7 0 0114 0z', '#5fb39a') + s('M7.3 8.6A5 5 0 0110.5 5.3', 'rgba(255,255,255,.5)', 1) +
    r(3, 10, 18, 2, '#e3dac4') + p('M4 13h2v7H4zM9 13h2v7H9zM13 13h2v7h-2zM18 13h2v7h-2z', '#f4efe4') + r(2, 20, 20, 2, '#b3a994');
  P.works =
    c(20.5, 1.4, 1.3, 'rgba(200,200,210,.7)') + c(18.6, .9, .9, 'rgba(200,200,210,.5)') +
    p('M2 22V11l6 4v-4l6 4v-4l5 3.3V3h3v19z', '#b5533a') + r(19, 3, 3, 19, '#8a3a2a') + r(19, 5, 3, 1, '#e0e0e0') +
    p('M2 11l6 4v1.3l-6-4zM8 11l6 4v1.3l-6-4zM14 11l5 3.3v1.3l-5-3.3z', '#6f2a1e') + p('M5 18h2v2H5zM10 18h2v2h-2zM15 18h2v2h-2z', '#ffc94a');
  P.power_station =
    c(6, 3.6, 2, 'rgba(240,244,250,.85)') + c(8, 2.2, 1.4, 'rgba(240,244,250,.7)') + c(16, 3.6, 2, 'rgba(240,244,250,.85)') + c(18, 2.2, 1.4, 'rgba(240,244,250,.7)') +
    p('M3 22c1-4 1-9-1-14h8c-2 5-2 10-1 14z', '#c9cdd4') + p('M13 22c1-4 1-9-1-14h8c-2 5-2 10-1 14z', '#b8bdc6') +
    p('M7 8h3c-2 5-2 10-1 14H6.5c.8-4 1.2-9 .5-14zM17 8h3c-2 5-2 10-1 14h-2.5c.8-4 1.2-9 .5-14z', SH) +
    r(2.6, 12, 7, 1, '#e0483a') + r(12.6, 12, 7, 1, '#e0483a');
  // ---------------------------------------------------------------- Atomic
  P.tabulator =
    r(3, 2, 18, 20, '#c8c0aa', 1.5) + r(4.5, 3.5, 15, 9, '#3a3f48', 1) +
    c(8.5, 8, 3, '#1f2328') + c(8.5, 8, 2.1, '#6a7280') + c(8.5, 8, .8, '#c8c0aa') +
    c(15.5, 8, 3, '#1f2328') + c(15.5, 8, 2.1, '#6a7280') + c(15.5, 8, .8, '#c8c0aa') +
    c(6.5, 15, .95, '#ff5a4a') + c(9.5, 15, .95, '#5dff9a') + c(12.5, 15, .95, '#ffc94a') + c(15.5, 15, .95, '#5dff9a') + c(18, 15, .95, '#ff5a4a') +
    r(6, 18, 12, 1.6, '#3a3f48', .5);
  P.reactor =
    c(12, 12, 4.4, '#6dff8a', 'opacity=".25"') +
    '<ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#4de1ff" stroke-width="1.4"/>' +
    '<ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#4de1ff" stroke-width="1.4" transform="rotate(60 12 12)"/>' +
    '<ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#4de1ff" stroke-width="1.4" transform="rotate(-60 12 12)"/>' +
    c(12, 12, 2.6, '#6dff8a') + c(11.3, 11.3, .8, '#e0ffe8') + c(22, 12, 1.1, '#fff') + c(17, 20.66, 1.1, '#fff') + c(7, 3.34, 1.1, '#fff');
  P.lab =
    p('M9 2h6v2h-1v6l6 10a1.5 1.5 0 01-1.3 2.2H5.3A1.5 1.5 0 014 20l6-10V4H9z', 'rgba(190,225,255,.22)', 'stroke="#cfe8ff" stroke-width="1"') +
    p('M7.1 14.8h9.8L20 20a1.5 1.5 0 01-1.3 2.2H5.3A1.5 1.5 0 014 20z', '#45e08a') + r(7.1, 14.8, 9.8, .9, '#a8ffcc') +
    c(10.6, 12.2, 1, '#8fffb8') + c(13.4, 10, .8, '#8fffb8') + c(12, 18, .9, '#d8ffe6') + c(15, 19.5, .7, '#d8ffe6');
  P.fab = // silicon wafer
    c(12, 12, 10, '#4c579a') +
    p('M6 8h3v3H6zM10.5 8h3v3h-3zM15 8h3v3h-3zM6 12.5h3v3H6zM10.5 12.5h3v3h-3zM15 12.5h3v3h-3zM8 17h3v2.5H8zM13 17h3v2.5h-3zM8 4.5h3V7H8zM13 4.5h3V7h-3z', '#9fb2ff') +
    p('M10.5 8h3v3h-3zM15 12.5h3v3h-3zM8 17h3v2.5H8z', '#c7a2ff') + p('M6 12.5h3v3H6zM13 4.5h3V7h-3z', '#7ff0e0') +
    s('M4.6 7.2A9 9 0 0110 3.2', 'rgba(255,255,255,.55)', 1.2) + r(10.5, 21.2, 3, 1, '#1f2448');
  // ---------------------------------------------------------------- Spacefaring
  P.launch =
    p('M10 18h4l-1 4.5h-2z', '#ff8a1a') + p('M10.8 18h2.4l-.6 3h-1.2z', '#fff0a0') +
    p('M8 13l-3 5v2l3-2zM16 13l3 5v2l-3-2z', '#e0443a') +
    p('M12 1c3 3 4 7 4 11v5H8v-5c0-4 1-8 4-11z', '#eef2f7') + p('M12 1c3 3 4 7 4 11v5h-2.4v-5c0-4-.6-8-1.6-11z', 'rgba(0,0,0,.14)') +
    p('M12 1c1.4 1.4 2.4 3 3 4.8H9c.6-1.8 1.6-3.4 3-4.8z', '#e0443a') + c(12, 9.3, 1.8, '#3a8fe0', 'stroke="#8a95a8" stroke-width=".8"') +
    r(8, 15, 8, 1, '#8a95a8');
  P.orbital_smelter =
    p('M1.5 3l6 1-1 6-6-1zM22.5 21l-6-1 1-6 6 1z', '#3a6fd8') + s('M4.5 3.5l-1 6M1 6l6 1M19.5 14.5l-1 6M17 17l6 1', '#8fb8ff', .5) +
    s('M7 7l3 3M14 14l3 3', '#9aa3b2', 1.5) + r(9, 9, 6, 6, '#e0b64a', 1) + c(12, 12, 1.5, '#ff7a1a') + c(12, 12, .6, '#fff0a0');
  P.observatory =
    c(4, 4, .7, '#fff3a0') + c(8, 2.4, .5, '#fff') + c(19, 9, .5, '#fff') +
    p('M2 17h20v5H2z', '#8d8a94') + c(6, 19.5, 1, '#6f6c76') + c(16, 20, 1.3, '#6f6c76') +
    p('M3 16a9 9 0 0118 0z', '#e8ecf2') + p('M15 7.6A9 9 0 0121 16h-3.3c0-3.4-1-6.4-2.7-8.4z', 'rgba(0,0,0,.14)') +
    p('M11 7h2v9h-2z', '#2a3048') + p('M14 4.5l6-3 1 2-6 3z', '#9aa3b2') + p('M20 1.5l1 2 1-.5-1-2z', '#4de1ff');
  P.tug =
    p('M3 13c0-4 3-6 6-6 2-2 6-1 7 2 2 1 2 4 0 6-1 3-5 4-8 3-3 0-5-2-5-5z', '#8f7a66') +
    p('M16 9c2 1 2 4 0 6-1 3-5 4-8 3 3-1 6-3 8-9z', SH) + c(8, 12, 1.3, '#6b5a4a') + c(12, 15, 1.7, '#6b5a4a') + c(10.5, 9.5, .8, '#6b5a4a') +
    s('M14.8 8l3-2.5', '#c0c8d4', .8) + p('M17 4l5.5-2.5L21 7z', '#e3eaf3') + c(17.6, 5, .9, '#4de1ff');
  // ---------------------------------------------------------------- Galactic War
  P.foundry =
    c(8, 9.5, 1.2, 'rgba(160,150,150,.6)') + p('M2 22V12l5 3v-3l5 3V8h3v14z', '#5a4a48') + r(12, 8, 3, 1.2, '#ff7a2a') +
    p('M4 18h2v2H4zM8.5 18h2v2h-2z', '#ff9a3a') + p('M17 22V11c0-3 2-5 2-5s2 2 2 5v11z', '#d9a441') +
    p('M17 11c0-3 2-5 2-5s2 2 2 5z', '#e0553a') + r(17, 13, 4, 1, '#8a5a1a') + r(20, 11, 1, 11, SH);
  P.yard =
    s('M2 21h20', '#e0b040', 2) + s('M5 17.2l-2 3.3M10 17.2l-1 3.3M15 17.2l1 3.3M20 17.2l2 3.3', '#e0b040', 1.5) +
    p('M3 13l6-4h10l2 4-2 3H5z', '#9aa6b8') + p('M3 13h18l-2 3H5z', SH) + s('M6.5 12.2h12', '#ff5d5d', 1) +
    c(10, 10.8, .7, '#4de1ff') + c(13, 10.8, .7, '#4de1ff') + c(16, 10.8, .7, '#4de1ff') +
    c(8, 18, .7, '#ffd23f') + c(13, 18.4, .6, '#ff9a2a') + c(17.4, 17.8, .5, '#ffd23f');
  P.barracks =
    r(11.4, 2.6, .8, 5.6, '#3a3f48') + p('M12.2 2.6h4.2l-1.1 1.3 1.1 1.3h-4.2z', '#e0483a') +
    p('M2 22V8h3v2h2V8h3v2h4V8h3v2h2V8h3v14h-8v-5a2 2 0 00-4 0v5z', '#6b7380') + r(2, 10, 20, 1.2, HL) +
    r(16, 10, 6, 12, SH) + r(5.2, 13, 1.2, 3, '#1f2328') + r(17.6, 13, 1.2, 3, '#1f2328');
  // forge_world is defined with the planets below
  // ---------------------------------------------------------------- agents
  P.agent_shaman =
    r(19, 7, 1.6, 15, '#8a5a2e') + c(19.8, 6.3, 1.9, '#4de1ff') + c(19.3, 5.8, .6, '#e0fbff') +
    p('M6 22l1.5-10h7L16 22z', '#8a5a2e') + p('M7.2 12h7.6l.3 1.6H6.9z', '#e3d5b4') + c(11, 7, 3, SK) +
    s('M8.4 4.2L6.4 1.6', '#e0443a', 1.5) + s('M13.6 4.2l2-2.6', '#ffc94a', 1.5) + s('M7.8 5.8L4.7 4.4', '#3a8fe0', 1.5) + s('M14.2 5.8l3.1-1.4', '#7cc242', 1.5);
  P.agent_priest =
    p('M6 22l2-10h8l2 10z', '#f2ede2') + p('M12 12h4l2 10h-6z', 'rgba(0,0,0,.1)') + p('M11 12h2v10h-2z', '#e0b64a') +
    c(12, 8.6, 2.8, SK) + p('M9 1h6l-1 5h-4z', '#f2ede2') + p('M9.8 5h4.4l-.2 1h-4z', '#e0b64a') + s('M12 1.8v2.6M10.9 2.8h2.2', '#e0b64a', .8);
  P.agent_scholar =
    p('M7 22l1-12h8l1 12z', '#3a5fb0') + c(12, 5, 3, SK) + p('M9 4.3a3 3 0 016 0c-1-.7-2-1-3-1s-2 .3-3 1z', '#a8a8b0') +
    p('M4.5 13.4l7.5 1.9 7.5-1.9v5.8L12 21.1l-7.5-1.9z', '#8a3a28') +
    p('M5 13l7 1.8 7-1.8v5.5l-7 1.8-7-1.8z', '#f7ecd0') + s('M12 14.8v5.5', '#8a6a3a', 1);
  P.agent_merchant =
    p('M5 22l1-12h8l1 12z', '#2f8a5a') + p('M6 10h8l-1 3H7z', '#e0b64a') + c(10, 5, 3, SK) +
    p('M7 4.5c0-2 1.5-3 3-3s3 1 3 3c-1-.6-2-.8-3-.8s-2 .2-3 .8z', '#9a3a28') +
    c(18, 16, 4, '#f7c843', 'stroke="#b8861a" stroke-width=".8"') + r(17, 10.6, 2, 2.2, '#8a5a2e') + p('M17.3 14.2h1.4v3.6h-1.4z', '#b8861a');
  P.agent_warden =
    p('M4 4l8-3 8 3v7c0 6-4 10-8 12-4-2-8-6-8-12z', '#c3cbd6', 'stroke="#7c8799" stroke-width="1"') +
    p('M12 1l8 3v7c0 6-4 10-8 12z', SH) + p('M11 5h2v14h-2zM7 9.5h10v2H7z', '#e0483a');
  P.agent_industrialist =
    p('M8 1h8v7H8z', '#26262c') + r(8, 5.6, 8, 1.1, '#c0392b') + p('M5 8h14v2H5z', '#26262c') +
    c(12, 13, 3, SK) + p('M6 23l1-6h10l1 6z', '#5a5f6a') + p('M10.8 17h2.4L12 19.5z', '#f2ede2') + s('M8.8 20.6c1.4.8 2.8.8 4.2 0', '#e0b64a', .8);
  P.agent_administrator =
    p('M6 22l1-12h10l1 12z', '#2f3f66') + p('M10 10h4l-2 3z', '#f2ede2') + p('M11.2 10.6h1.6l.6 5.4-1.4 1.8-1.4-1.8z', '#d8483a') +
    c(12, 5, 3, SK) + p('M9 4.6a3 3 0 016 0c-1-.8-2-1.1-3-1.1s-2 .3-3 1.1z', '#4a3020');
  P.agent_navigator =
    p('M6 18.5h12l1 4.5H5z', '#dfe6ee') + r(5.6, 20, 12.8, 1, '#ff8a2a') +
    c(12, 10, 8, '#eef2f7') + p('M16 3.1A8 8 0 0120 10a8 8 0 01-4 6.9A8 8 0 0018 10a8 8 0 00-2-6.9z', SH) +
    p('M6 9a6 4 0 0112 0v2a6 3 0 01-12 0z', '#3a6fd8') + s('M8.5 8.4a4.5 2.6 0 013.6-1.6', 'rgba(255,255,255,.7)', 1);
  P.agent_governor =
    p('M5 8l2-5 3 3 2-4 2 4 3-3 2 5z', '#f7c843') + c(12, 6.2, .8, '#e0443a') + c(8, 6.8, .6, '#3a8fe0') + c(16, 6.8, .6, '#3a8fe0') +
    c(12, 12, 3, SK) + p('M6 23l1-7h10l1 7z', '#7a3ab0') + p('M6.9 16h10.2l.2 1.3H6.7z', '#f2ede2');
  P.agent_admiral =
    c(12, 15, 3, SK) + p('M6 24l1-5h10l1 5z', '#1f2f55') + r(6.4, 19, 2.6, 1, '#e0b64a') + r(15, 19, 2.6, 1, '#e0b64a') +
    p('M4 8c2-4 14-4 16 0l-1 2H5z', '#1f2f55') + p('M5 10h14l-2 2H7z', '#111827') + r(11, 5, 2, 2, '#f7c843') + s('M5.5 9.3h13', '#e0b64a', .6);
  // ---------------------------------------------------------------- ships
  P.colony_ship =
    '<ellipse cx="1.8" cy="12" rx="1.4" ry="2" fill="#4de1ff"/>' +
    p('M4 7h4v1.5H4zM4 15.5h4V17H4z', '#9aa6b8') + p('M1.5 12l4-3.2h11.5l5.5 3.2-5.5 3.2H5.5z', '#dde4ee') +
    p('M1.5 12h21l-5.5 3.2H5.5z', 'rgba(0,0,0,.14)') + c(9, 12, 2.4, '#6fd07a') + c(14.5, 12, 2.4, '#3a8fe0') +
    c(8.4, 11.3, .7, 'rgba(255,255,255,.6)') + c(13.9, 11.3, .7, 'rgba(255,255,255,.6)');
  // ---------------------------------------------------------------- factions (tinted by faction color via currentColor)
  P.faction_vorrhal = '<path d="M12 2c-5 3-8 8-7 14l3-3c0 4 2 7 4 9 2-2 4-5 4-9l3 3c1-6-2-11-7-14z"/><circle cx="10" cy="11" r="1.4" fill="' + DK + '"/><circle cx="14" cy="11" r="1.4" fill="' + DK + '"/>';
  P.faction_ashen = '<circle cx="12" cy="12" r="3"/><path d="M5 12a7 7 0 0114 0M2 12a10 10 0 0120 0" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 12a7 7 0 0014 0M2 12a10 10 0 0020 0" fill="none" stroke="currentColor" stroke-width="1.8" opacity=".45"/>';
  P.faction_thessik = '<path d="M3 21L19 3l2 2-2 1 1 2-2 1 1 2-2 1 1 2-2 1 1 2-3 1L5 23z"/>';
  P.faction_lattice = '<path d="M12 2l9 5v10l-9 5-9-5V7z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 12l9-5M12 12L3 7M12 12v10" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.2"/>';
  // ---------------------------------------------------------------- eras
  P.era_stone = p('M12 1l5 9-5 13-5-13z', '#8e9bb0') + p('M12 1l5 9-5 13z', '#6f7b90') + p('M12 5l2 5-2 6-2-6z', '#c8d2e0');
  P.era_bronze =
    p('M2 21h20v-3H2z', '#b9884d') + p('M4 17h16v-3H4z', '#c99c62') + p('M6 13h12v-3H6z', '#d9b27a') + p('M9 9h6V6H9z', '#e8c48e') +
    p('M16 18h6v3h-6zM15 14h5v3h-5zM14 10h4v3h-4z', SH) + p('M11 2.5h2V6h-2z', '#e0913f');
  P.era_classical =
    p('M4 3h16v2H4zM6 6h12v1.5H6z', '#e3dac4') + p('M7 8h2v11H7zM11 8h2v11h-2zM15 8h2v11h-2z', '#f4efe4') +
    p('M8.2 8h.8v11h-.8zM12.2 8h.8v11h-.8zM16.2 8h.8v11h-.8z', 'rgba(0,0,0,.14)') + p('M5 19.5h14V21H5zM3 22h18v1.5H3z', '#b3a994');
  P.era_medieval =
    r(11.6, .8, .8, 6.4, '#5a4a3a') + p('M12.4 .8h4.2l-1.1 1.3 1.1 1.3h-4.2z', '#e0483a') +
    p('M5 22V7h2V4h2v3h2V4h2v3h2V4h2v3h2v15h-5v-5a2 2 0 00-4 0v5z', '#a9a39a') + r(15, 7, 4, 15, SH) +
    p('M10 22v-5a2 2 0 014 0v5z', '#3a2a1e') + r(7.2, 10, 1.2, 2.6, '#1f2328') + r(15.6, 10, 1.2, 2.6, '#1f2328');
  P.era_industrial =
    p('M10.5 2h3l.5 2.5 2 .8 2.1-1.4 2.1 2.1-1.4 2.1.8 2 2.5.5v3l-2.5.5-.8 2 1.4 2.1-2.1 2.1-2.1-1.4-2 .8-.5 2.5h-3l-.5-2.5-2-.8-2.1 1.4-2.1-2.1 1.4-2.1-.8-2L2 13.5v-3l2.5-.5.8-2-1.4-2.1 2.1-2.1 2.1 1.4 2-.8z', '#c0924a') +
    c(12, 12, 6, 'none', 'stroke="#8a6428" stroke-width="1"') + c(12, 12, 3.5, '#2a2018') + s('M6.5 9a6 6 0 013-3', HL, 1);
  P.era_atomic = P.reactor;
  P.era_spacefaring =
    c(20, 4.5, 2, '#d8dce4') + c(19.4, 4, .5, '#aeb3bd') +
    c(11, 13, 7, '#e08a3a') + s('M4.3 11.2h13.4M4.6 15.2h12.8', '#b8622a', 1.3) +
    p('M18 13a7 7 0 01-12.4 4.4A7 7 0 0018 13z', SH) +
    '<ellipse cx="12" cy="12" rx="11" ry="4" fill="none" stroke="#f0d8a0" stroke-width="1.4" transform="rotate(-25 12 12)"/>';
  P.era_interstellar =
    c(12, 12, 5, '#9d8cff', 'opacity=".25"') +
    s('M12 12c0-2 2-3 3.5-2S17 13 15 14.5 10 16 8.5 13.5 8 7.5 12 6s9 1.5 9.5 6-3 9-8.5 9.5S2.5 18 2.5 12', '#9d8cff', 2) +
    c(12, 12, 2, '#fff3c0') + c(19, 5, .6, '#fff') + c(4.5, 6, .5, '#8fd8ff');
  P.era_war =
    p('M3 3l2-1 14 14-2 2L3 4z', '#c8d0dc') + p('M21 3l-2-1L5 16l2 2L21 4z', '#dbe2ec') +
    s('M4.5 3.2L18 16.7M19.5 3.2L6 16.7', 'rgba(0,0,0,.18)', .6) +
    p('M4 17l3 3-2 2-3-3zM20 17l-3 3 2 2 3-3z', '#e0b64a') +
    s('M3.4 15.4l5.2 5.2M20.6 15.4l-5.2 5.2', '#8a5a2e', 1.2);
  // ---------------------------------------------------------------- UI glyphs
  P.research =
    p('M9 2h6v2h-1v5l5 9a2 2 0 01-2 3H7a2 2 0 01-2-3l5-9V4H9z', 'rgba(190,225,255,.22)', 'stroke="#cfe8ff" stroke-width="1"') +
    p('M7.8 13.5h8.4L19 18a2 2 0 01-2 3H7a2 2 0 01-2-3z', '#4a9aff') + c(11, 11.2, .9, '#9ccaff') + c(13, 17, .8, '#d6ebff');
  P.production =
    p('M3 21V10l5 3V10l5 3V10l5 3V4h3v17z', '#c86a3a') + r(18, 4, 3, 17, '#9a4a2a') + p('M5 16h2v2H5zM10 16h2v2h-2zM15 16h2v2h-2z', '#ffc94a');
  P.settings = '<path d="M12 8a4 4 0 100 8 4 4 0 000-8zm9 5v-2l-2.2-.6-.6-1.5 1.1-2-1.4-1.4-2 1.1-1.5-.6L13 3h-2l-.6 2.2-1.5.6-2-1.1-1.4 1.4 1.1 2-.6 1.5L3 11v2l2.2.6.6 1.5-1.1 2 1.4 1.4 2-1.1 1.5.6L11 21h2l.6-2.2 1.5-.6 2 1.1 1.4-1.4-1.1-2 .6-1.5z" fill="#aab3c2"/>';
  P.stats = p('M3 21h18v-2H3z', '#8a95a8') + p('M5 17h3V9H5z', '#4a9aff') + p('M10 17h3V4h-3z', '#7cc242') + p('M15 17h3v-6h-3z', '#ffb02e');
  P.lock = '<path d="M7 10V7a5 5 0 0110 0v3h1v11H6V10zm2 0h6V7a3 3 0 00-6 0z"/>';
  P.forage =
    p('M12 22c-5 0-8-4-8-8 3 0 5 1 7 3 0-5-2-9-6-12 5 1 9 5 9 11 1-3 4-5 6-5-1 6-4 11-8 11z', '#6fc23a') +
    s('M6 6c3 3 5 7 5 11M19 10c-2 1.5-4 4.5-5 8', '#3f8a1f', .9) + c(17, 5, 1.5, '#e0443a') + c(19.6, 6.4, 1.2, '#9a3ab8') + c(16.6, 7.6, 1.1, '#e0443a');
  P.era = c(12, 12, 9, '#f3ead6', 'stroke="#d9a441" stroke-width="2"') + s('M12 6v6l4.5 2.8', '#3a2a1e', 1.8);
  P.check = '<path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z" fill="#7fd07a"/>';
  P.star = p('M12 2l3 7h7l-5.5 4.5 2 7.5L12 17l-6.5 4 2-7.5L2 9h7z', '#ffd36a') + p('M12 2l3 7h7l-5.5 4.5 2 7.5L12 17z', 'rgba(200,120,0,.25)');
  P.unknown = '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.5 9a2.5 2.5 0 115 .5c0 2-2.5 2-2.5 4M12 16.5v1.5" fill="none" stroke="currentColor" stroke-width="2"/>';
  P.agents =
    c(16, 6.5, 3, '#c89a78') + p('M11 21c0-4.5 2.2-7.5 5-7.5s5 3 5 7.5z', '#7a5ab8') +
    c(9, 7.5, 3.3, SK) + p('M3 22c0-5 2.7-8 6-8s6 3 6 8z', '#3a8fd8');
  P.galaxy = P.era_interstellar;
  P.front = r(5, 2, 2, 20, '#9aa3b2') + p('M7 3h13l-3 4 3 4H7z', '#e0483a') + p('M7 7h11.5l1.5 4H7z', SH);
  P.trade =
    p('M11 3h2v17h-2zM6 21h12v1.5H6zM4 6h16v1.5H4z', '#c8973a') +
    s('M5 7.5l-3 6.5h6zM19 7.5l-3 6.5h6z', '#e0b64a', 1.1) + p('M2 14a3 2 0 006 0zM16 14a3 2 0 006 0z', '#f7c843');
  P.up = p('M12 3l8 8h-5v10H9V11H4z', '#ffd36a') + p('M12 3l8 8h-5v10h-3z', 'rgba(200,120,0,.25)');
  P.hourglass =
    p('M7.5 4.5h9l-4.5 7.5zM12 12l-4.5 7.5h9z', 'rgba(190,225,255,.25)') + p('M9 20h6l-3-4zM10 6.5h4L12 10z', '#f0c878') +
    r(5.5, 2, 13, 2.5, '#9a6a3a', .8) + r(5.5, 19.5, 13, 2.5, '#9a6a3a', .8);
  P.moon = p('M11.83 2.5A9.5 9.5 0 1020.7 15.8 8 8 0 0111.83 2.5z', '#f3e9b8') + c(7, 10, 1.2, 'rgba(0,0,0,.14)') + c(9, 16, 1.6, 'rgba(0,0,0,.14)');
  P.warn = p('M4 4l8-3 8 3v7c0 6-4 10-8 12-4-2-8-6-8-12z', '#e0483a') + s('M12 2.5l-2 6 3 3-2 5 1.5 5', '#3a0e0a', 2);
  P.infinity = s('M6.5 8a4 4 0 100 8c2.5 0 3.5-2 5.5-4s3-4 5.5-4a4 4 0 110 8c-2.5 0-3.5-2-5.5-4S9 8 6.5 8z', '#c8a8ff', 2.2);
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
  P.forge_world = planet('#3d2724', '<path d="M5 9l4 2 3-3 2 4 5-1M6 16l4-1 3 3 4-3" stroke="#ff7a2a" stroke-width="1.6" fill="none"/><circle cx="12" cy="8" r="1.1" fill="#ffd23f"/><circle cx="13" cy="18" r="1" fill="#ffb02e"/>');
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
