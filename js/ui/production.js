'use strict';
// Production tab: buy multiplier, forage, per-era sections with mechanic panels and generator cards.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const { el, setText, setHTML, toggle, clear } = IG.dom;

  let cards = [];      // {id, node, count, rate, cost, btn, upBtn}
  let mechUpdaters = [];
  let forageRefs = null;
  let multBtns = {};

  // Mechanic panels register here: IG.UI.mechanics.push({era, id, build(container) -> update fn})
  const mechanics = [];

  function buyMode() { return IG.state.settings.buyMult; }

  function setBuyMode(m) {
    IG.state.settings.buyMult = m;
    for (const k in multBtns) toggle(multBtns[k], 'active', k === m);
  }

  function cycleBuyMode() {
    const order = ['1', '10', '100', 'max'];
    const i = order.indexOf(buyMode());
    setBuyMode(order[(i + 1) % order.length]);
  }

  function genTip(id) {
    const C = IG.CONFIG, g = C.generators[id], s = IG.state;
    const n = s.run.gens[id].n;
    const rates = IG.Prod.cache.genRates[id];
    const v = IG.Prod.view(id);
    let h = '<b>' + v.name + '</b><br><i>' + v.desc + '</i><br>';
    if (v.tier) {
      h += '<span class="lineage">' + v.forms.map((f, i) => (i === v.forms.length - 1 ? '<b>' + f + '</b>' : f)).join(' → ') + '</span><br>' +
        'Modernized ' + v.tier + '×: output ' + IG.fmtMult(v.mult) + '<br>';
    }
    for (const r in g.produces) {
      const total = rates && rates[r] ? rates[r] : IG.D(0);
      const each = n > 0 ? total.div(n) : IG.D(g.produces[r]).mul(IG.Mods.get().gen[id][r]);
      h += IG.icons.html(r, 'ic-sm') + ' ' + IG.fmtRate(each) + ' each · ' + IG.fmtRate(total) + ' total<br>';
    }
    if (g.consumes) {
      for (const inp in g.consumes) {
        h += 'Consumes ' + g.consumes[inp] + ' ' + C.resources[inp].name + ' per unit produced';
        const eff = IG.Prod.cache.converterEff[inp];
        if (eff !== undefined && eff < 0.999) h += ' <span class="no">(running at ' + IG.fmtPct(eff) + ' — not enough ' + C.resources[inp].name + ')</span>';
        h += '<br>';
      }
    }
    h += 'Upgrade multiplier: ' + IG.fmtMult(IG.D(C.genUpgrades.mult).pow(s.run.gens[id].up));
    return h;
  }

  function upTip(id) {
    const info = IG.Prod.upgradeInfo(id);
    if (!info) return 'All upgrades purchased.';
    const g = IG.CONFIG.generators[id];
    const rates = IG.Prod.cache.genRates[id] || {};
    let h = '<b>' + info.name + '</b><br>' + IG.Prod.view(id).name + ' output ×' + info.mult + '<br>';
    if (!info.ready) h += '<span class="no">Requires ' + info.threshold + ' owned</span><br>';
    for (const r in g.produces) {
      const cur = rates[r] || IG.D(0);
      h += IG.icons.html(r, 'ic-sm') + ' Now: ' + IG.fmtRate(cur) + ' → After: ' + IG.fmtRate(cur.mul(info.mult)) + '<br>';
    }
    h += 'Cost: ' + IG.dom.costHTML(info.cost);
    return h;
  }

  function buildCard(id) {
    const g = IG.CONFIG.generators[id];
    const count = el('span', { class: 'gen-count' });
    const rate = el('div', { class: 'gen-rate' });
    const cost = el('div', { class: 'gen-cost' });
    const btn = el('button', { class: 'btn buy', on: { click: (e) => {
      const n = IG.Prod.buy(id, buyMode());
      if (n > 0) IG.Bus.emit('popup', { x: e.clientX, y: e.clientY, text: '+' + n });
    } } });
    const upBtn = el('button', { class: 'btn up', tip: () => upTip(id), on: { click: (e) => {
      if (IG.Prod.buyUpgrade(id)) IG.Bus.emit('popup', { x: e.clientX, y: e.clientY, text: '×' + IG.CONFIG.genUpgrades.mult, cls: 'gold' });
    } } }, '⬆');
    const main = Object.keys(g.produces)[0];
    const v = IG.Prod.view(id);
    const node = el('div', { class: 'gen-card', 'data-gen': id, style: { '--rc': IG.CONFIG.resources[main].color } }, [
      el('div', { class: 'gen-top', tip: () => genTip(id) }, [IG.icons.node(v.icon, 'ic-lg'),
        el('div', { class: 'gen-info' }, [el('div', { class: 'gen-name' }, [el('span', { text: v.name }), count]), rate])]),
      el('div', { class: 'gen-actions' }, [btn, upBtn]),
      cost,
    ]);
    return { id, node, count, rate, cost, btn, upBtn };
  }

  function updateCard(c) {
    const s = IG.state, id = c.id, mode = buyMode();
    setText(c.count, IG.fmtInt(s.run.gens[id].n));
    const rates = IG.Prod.cache.genRates[id];
    const g = IG.CONFIG.generators[id];
    let rt = '';
    for (const r in g.produces) {
      rt += '<span class="gen-out" style="--rc:' + IG.CONFIG.resources[r].color + '">' + IG.icons.html(r, 'ic-sm') +
        (rates && rates[r] ? IG.fmtRate(rates[r]) : '0/s') + '</span>';
    }
    setHTML(c.rate, rt);
    const n = IG.Prod.displayAmount(id, mode);
    const costs = IG.Prod.costFor(id, n);
    setHTML(c.cost, IG.dom.costHTML(costs));
    const can = IG.Prod.amountFor(id, mode) > 0;
    setText(c.btn, 'Buy ' + (mode === 'max' ? 'Max (' + n + ')' : '×' + n));
    toggle(c.btn, 'disabled', !can);
    const info = IG.Prod.upgradeInfo(id);
    const showUp = info && s.run.gens[id].n >= Math.floor(info.threshold * 0.6);
    toggle(c.upBtn, 'hidden', !showUp);
    if (showUp) {
      const ok = info.ready && IG.Prod.canAfford(info.cost);
      toggle(c.upBtn, 'disabled', !ok);
      toggle(c.upBtn, 'ready', ok);
      setText(c.upBtn, info.ready ? '⬆ ×' + info.mult : '⬆ ' + info.threshold);
    }
  }

  function buildForage() {
    const btn = el('button', { class: 'forage-btn', on: { click: (e) => {
      const gains = IG.Prod.forage(1);
      IG.Bus.emit('popup', { x: e.clientX, y: e.clientY, text: '+' + IG.fmt(gains.food), cls: 'food' });
    } } });
    btn.innerHTML = IG.icons.html('forage', 'ic-xl') + '<span>Forage</span>';
    const info = el('div', { class: 'forage-info' });
    forageRefs = { btn, info };
    return el('div', { class: 'forage-card' }, [btn, info]);
  }

  // "modernized for the X Age" tag on sections whose lines have changed form
  function modernTag(e) {
    const s = IG.state;
    if (e >= s.run.era) return null;
    const ids = IG.Prod.listForEra(e).filter((id) => IG.Prod.view(id).tier > 0);
    if (!ids.length) return null;
    return el('span', { class: 'modern-tag', tip: '<b>Modernized</b><br>' + ids.map((id) => {
      const v = IG.Prod.view(id);
      return v.forms.join(' → ') + ' <span class="muted">(' + IG.fmtMult(v.mult) + ')</span>';
    }).join('<br>') }, 'modernized');
  }

  function build(root) {
    const s = IG.state, C = IG.CONFIG;
    cards = [];
    mechUpdaters = [];
    forageRefs = null;
    multBtns = {};
    const bar = el('div', { class: 'toolbar' });
    bar.appendChild(el('span', { class: 'muted', text: 'Buy:' }));
    for (const m of ['1', '10', '100', 'max']) {
      const b = el('button', { class: 'btn small mult' + (buyMode() === m ? ' active' : ''), on: { click: () => setBuyMode(m) } },
        m === 'max' ? 'Max' : 'x' + m);
      multBtns[m] = b;
      bar.appendChild(b);
    }
    root.appendChild(bar);

    const collapsed = s.ui.collapsed || (s.ui.collapsed = {});
    for (let e = s.run.era; e >= 0; e--) {
      const era = C.eras[e];
      const gens = IG.Prod.listForEra(e).filter(IG.Prod.unlocked);
      const mechs = mechanics.filter((m) => m.era === e && (!m.isUnlocked || m.isUnlocked()));
      const mechTeasers = mechanics.filter((m) => m.era === e && m.isUnlocked && !m.isUnlocked() && m.teaser);
      if (!gens.length && !mechs.length && !(e === 0)) continue;
      const sec = el('section', { class: 'era-section theme-' + era.theme + (collapsed[e] ? ' collapsed' : '') });
      const head = el('div', { class: 'era-head', on: { click: () => {
        collapsed[e] = !collapsed[e]; IG.UI.markDirty(); } } },
      [IG.icons.node('era_' + era.id), el('span', { text: era.name }), modernTag(e),
        el('span', { class: 'chev', text: collapsed[e] ? '▸' : '▾' })]);
      sec.appendChild(head);
      if (!collapsed[e]) {
        if (e === 0) sec.appendChild(buildForage());
        for (const m of mechs) {
          const box = el('div', { class: 'mech-panel' });
          const upd = m.build(box);
          sec.appendChild(box);
          if (upd) mechUpdaters.push(upd);
        }
        for (const m of mechTeasers) {
          sec.appendChild(el('div', { class: 'mech-teaser', tip: '<b>???</b><br>' + m.teaser() }, [IG.icons.node('lock'),
            el('span', { text: '??? — ' + m.teaser() })]));
        }
        const grid = el('div', { class: 'gen-grid' });
        for (const id of gens) {
          const c = buildCard(id);
          cards.push(c);
          grid.appendChild(c.node);
        }
        // teaser for generators of this era still locked behind research
        const locked = IG.Prod.listForEra(e).filter((id) => !IG.Prod.unlocked(id));
        if (locked.length) {
          const g = C.generators[locked[0]];
          const hint = g.requires ? 'Research ' + C.research[g.requires].name : 'Keep advancing';
          grid.appendChild(el('div', { class: 'gen-card teaser', tip: '<b>???</b><br>' + hint }, [
            IG.icons.node('unknown', 'ic-lg'), el('div', { class: 'gen-info' }, [el('div', { class: 'gen-name', text: '???' }),
              el('div', { class: 'gen-rate', text: hint })])]));
        }
        sec.appendChild(grid);
      }
      root.appendChild(sec);
    }
    // teaser for the next era
    if (IG.Eras.hasNext()) {
      const nx = C.eras[s.run.era + 1];
      root.appendChild(el('div', { class: 'era-teaser' }, [IG.icons.node('lock'),
        el('span', { text: '??? — new works await in the ' + nx.name + '. Meet the milestone shown in the sidebar.' })]));
    }
  }

  function update() {
    for (const c of cards) updateCard(c);
    for (const u of mechUpdaters) u();
    if (forageRefs) {
      const g = IG.Prod.forageGains();
      let t = '';
      for (const r in g) t += '<span class="gen-out" style="--rc:' + IG.CONFIG.resources[r].color + '">' + IG.icons.html(r, 'ic-sm') + '+' + IG.fmt(g[r]) + '</span>';
      setHTML(forageRefs.info, t + '<span class="muted">per click · ' + IG.fmtInt(IG.state.run.clicks) + ' clicks</span>');
    }
  }

  IG.UI.mechanics = mechanics;
  IG.UI.cycleBuyMode = cycleBuyMode;
  IG.UI.registerTab({ id: 'production', name: 'Production', icon: 'production', order: 0,
    isUnlocked: () => true, build, update });
})();
