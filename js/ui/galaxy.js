'use strict';
// Galaxy tab (Interstellar+): empire summary, galaxy canvas, colony ships, planet census.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const { el, setText, setHTML, toggle } = IG.dom;

  let refs = null;

  function planetIcon(type) { return IG.icons.html('planet_' + type, 'ic-lg'); }

  function stat(label) {
    const v = el('div', { class: 'es-val' });
    const box = el('div', { class: 'es' }, [el('div', { class: 'es-label', text: label }), v]);
    return { box, v };
  }

  function build(root) {
    const X = IG.CONFIG.expansion, E = IG.Expansion;
    refs = { stats: {}, planets: {} };
    const summary = el('div', { class: 'empire-summary' });
    for (const [k, label] of [['worlds', 'Worlds'], ['split', 'Colonies · Outposts'], ['output', 'Starmatter'], ['bonus', 'Bonus to old industries'], ['flight', 'Arks in flight']]) {
      const s = stat(label);
      refs.stats[k] = s.v;
      summary.appendChild(s.box);
    }
    root.appendChild(summary);

    const layout = el('div', { class: 'galaxy-layout' });
    const canvasBox = el('div', { class: 'galaxy-box' });
    layout.appendChild(canvasBox);

    const side = el('div', { class: 'galaxy-side' });
    // colony ships
    const ship = el('div', { class: 'mech' });
    ship.appendChild(el('div', { class: 'mech-title' }, [IG.icons.node('colony_ship'), el('span', { text: 'Colony Arks' })]));
    ship.appendChild(el('div', { class: 'mech-desc', text: 'Each ark travels for a while, then claims worlds. New worlds start weak and mature over time.' }));
    refs.shipInfo = el('div', { class: 'small' });
    ship.appendChild(refs.shipInfo);
    const btns = el('div', { class: 'btn-row ship-btns' });
    refs.shipBtns = [];
    for (const m of ['1', '10', '100', 'max']) {
      const b = el('button', { class: 'btn small', on: { click: (e) => {
        const n = E.buildShips(m);
        if (n > 0) IG.Bus.emit('popup', { x: e.clientX, y: e.clientY, text: '+' + IG.fmtInt(n) + ' arks', cls: 'gold' });
      } } }, m === 'max' ? 'Launch max' : 'Launch ' + m);
      btns.appendChild(b);
      refs.shipBtns.push({ m, b });
    }
    ship.appendChild(btns);
    refs.shipCost = el('div', { class: 'small' });
    ship.appendChild(refs.shipCost);
    side.appendChild(ship);

    // planet census
    const tbl = el('table', { class: 'planet-table' });
    tbl.appendChild(el('tr', {}, ['', 'Type', 'Habitability', 'Worlds', 'Output each'].map((h) => el('th', { text: h }))));
    for (const t of E.types()) {
      const p = X.planets[t];
      const hab = el('td'), cnt = el('td', { class: 'num' }), out = el('td', { class: 'num' });
      const row = el('tr', { tip: () => planetTip(t) }, [el('td', { html: planetIcon(t) }), el('td', { text: p.name }), hab, cnt, out]);
      tbl.appendChild(row);
      refs.planets[t] = { hab, cnt, out, row };
    }
    side.appendChild(el('div', { class: 'mech' }, [el('div', { class: 'mech-title', text: 'Planet census' }), tbl]));
    layout.appendChild(side);
    root.appendChild(layout);
    refs.view = IG.GalaxyView.mount(canvasBox, { mode: 'galaxy' });
  }

  function planetTip(t) {
    const X = IG.CONFIG.expansion, E = IG.Expansion, p = X.planets[t];
    const h = E.habitability(t);
    return '<b>' + p.name + ' worlds</b><br>Base habitability ' + p.hab.toFixed(2) + ' → current <b>' + h.toFixed(2) + '</b><br>' +
      (E.isColony(t) ? 'Settled as <span class="ok">colonies</span>' : 'Claimed as <span class="muted">mining outposts</span> (min ' + IG.fmtPct(X.outpostFloor) + ' output)') +
      '<br>Resource yield ×' + p.yield + '<br>Output per matured world: ' + IG.fmtRate(E.perWorld(t)) + ' Starmatter';
  }

  function update() {
    if (!refs) return;
    const E = IG.Expansion, X = IG.CONFIG.expansion;
    if (!E.active()) return;
    const tot = E.totals();
    setText(refs.stats.worlds, IG.fmtInt(tot.total) + (tot.maturing > 0 ? '  (' + IG.fmtInt(tot.maturing) + ' maturing)' : ''));
    setText(refs.stats.split, IG.fmtInt(tot.colonies) + ' · ' + IG.fmtInt(tot.outposts));
    setText(refs.stats.output, IG.fmtRate(IG.Prod.cache.gross.starmatter || 0));
    setText(refs.stats.bonus, IG.fmtMult(1 + (X.worldBonus + IG.Mods.get().worldBonus) * E.effectiveWorlds()));
    const fl = IG.state.run.exp.flights;
    setText(refs.stats.flight, IG.fmtInt(E.inFlight()) + (fl.length ? '  · next in ' + Math.ceil(fl[0].arrive - IG.state.run.time) + 's' : ''));
    setHTML(refs.shipInfo, 'Travel time <b>' + E.travelTime().toFixed(0) + 's</b> · <b>' + E.yieldPerShip() + '</b> world(s) per ark · maturation ' +
      IG.fmtTime(X.matureSeconds / IG.Mods.get().maturation) + ' · launched ' + IG.fmtInt(IG.state.run.exp.shipsLaunched));
    setHTML(refs.shipCost, 'Cost per ark: ' + IG.dom.costHTML(E.shipCost(1)) + ' · affordable: ' + IG.fmtInt(E.maxShips()));
    const max = E.maxShips();
    for (const sb of refs.shipBtns) toggle(sb.b, 'disabled', sb.m === 'max' ? max < 1 : max < parseInt(sb.m, 10));
    const cs = E.census();
    for (const t in refs.planets) {
      const r = refs.planets[t];
      const h = E.habitability(t);
      setHTML(r.hab, h.toFixed(2) + ' <span class="small ' + (E.isColony(t) ? 'ok' : 'muted') + '">' + (E.isColony(t) ? 'colony' : 'outpost') + '</span>');
      setText(r.cnt, IG.fmtInt(cs[t].total));
      setText(r.out, IG.fmtRate(E.perWorld(t)));
    }
  }

  IG.UI.headerExtras.push({ id: 'worlds', icon: 'worlds', color: '#9d8cff', show: () => IG.Expansion.active(),
    value: () => IG.fmtInt(IG.Expansion.totalWorlds()) + ' worlds',
    sub: () => IG.fmtInt(IG.Expansion.inFlight()) + ' arks in flight',
    tip: () => '<b>Worlds</b><br>Every world adds to the empire\'s total output.<br>Colonies: ' + IG.fmtInt(IG.Expansion.totals().colonies) +
      '<br>Outposts: ' + IG.fmtInt(IG.Expansion.totals().outposts) + '<br>Best ever: ' + IG.fmtInt(IG.state.perm.stats.bestWorlds) });

  IG.UI.registerTab({ id: 'galaxy', name: 'Galaxy', icon: 'galaxy', order: 3,
    isUnlocked: () => IG.Expansion.active(), teaser: () => 'The stars. Reach the Interstellar Age.', build, update });
})();
