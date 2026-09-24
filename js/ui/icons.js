'use strict';
// SVG icon registry (24×24 viewBox, silhouette style, fill = currentColor).
// Any icon can be replaced by a file: add an entry to IG.ASSET_OVERRIDES (assets/manifest.js), e.g.
//   IG.ASSET_OVERRIDES = { food: 'assets/icons/food.png' }
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  const P = {}; // name -> inner SVG markup

  // ---- resources
  P.food = '<path d="M12 3c-1 2-1 4 0 6-3-1-6 1-6 5 0 4 3 7 6 7s6-3 6-7c0-4-3-6-6-5 1-2 3-3 5-3-2-1-4-1-5-3z"/>';
  P.stone = '<path d="M4 17l3-8 5-3 6 2 3 7-4 4H8z"/><path d="M9 10l3 3 4-2" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/>';
  // ---- stone age generators
  P.gatherer = '<circle cx="9" cy="5" r="2.2"/><path d="M8 8h2l2 5-2 1-1 7H7l.5-7L6 12z"/><path d="M13 13h7l-1 6h-5z"/><circle cx="15" cy="12" r="1"/><circle cx="18" cy="12" r="1"/>';
  P.knapper = '<path d="M3 20l8-8 2 2-8 8z"/><path d="M12 11l5-8 4 3-6 7z"/>';
  P.hunters = '<path d="M2 21L20 3l1.2 1.2L3.2 22.2z"/><path d="M18 2l4 0 0 4-2-2z"/><circle cx="8" cy="6" r="2"/><path d="M6 9h4l1 5-2 1v6H7v-6l-2-1z"/>';
  P.hearth = '<path d="M12 2c2 4 6 6 6 11a6 6 0 01-12 0c0-3 2-4 2-6 1 2 2 2 2 2 0-3 1-5 2-7z"/><path d="M3 21h18v1.5H3z"/><path d="M5 19l14 0-1 2H6z"/>';
  // ---- UI glyphs
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

  function fallback(name) {
    const ch = (name || '?').charAt(0).toUpperCase();
    return '<circle cx="12" cy="12" r="10" fill="currentColor" opacity=".25"/><text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">' + ch + '</text>';
  }

  function html(name, cls) {
    const ov = IG.ASSET_OVERRIDES && IG.ASSET_OVERRIDES[name];
    const c = 'ic' + (cls ? ' ' + cls : '');
    if (ov) return '<img class="' + c + '" src="' + ov + '" alt="">';
    return '<svg class="' + c + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || fallback(name)) + '</svg>';
  }

  function node(name, cls) {
    const span = document.createElement('span');
    span.className = 'icw';
    span.innerHTML = html(name, cls);
    return span;
  }

  IG.icons = { P, html, node, has: (n) => !!P[n] };
})();
