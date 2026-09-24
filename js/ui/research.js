'use strict';
// Research tab: per-era tech trees laid out by tier columns.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const { el, setText, setHTML, toggle } = IG.dom;

  let cards = [];

  function tip(id) {
    const t = IG.CONFIG.research[id];
    const lv = IG.Research.level(id);
    let h = '<b>' + t.name + '</b>' + (t.maxLevel ? ' <span class="muted">Lv ' + lv + (t.maxLevel < 1e9 ? '/' + t.maxLevel : '') + '</span>' : '') + '<br>';
    h += '<i>' + t.desc + '</i><br>';
    if (IG.Research.maxed(id)) {
      h += IG.describe.effectsSummary(t.effects, lv) + '<br><span class="ok">Researched</span>';
      return h;
    }
    h += IG.describe.effectsTip(t.effects, lv, lv + 1);
    if (!IG.Research.prereqsMet(id)) {
      h += '<span class="no">Requires: ' + t.prereq.filter((p) => !IG.Research.has(p)).map((p) => IG.CONFIG.research[p].name).join(', ') + '</span><br>';
    }
    h += 'Cost: ' + IG.dom.costHTML(IG.Research.cost(id));
    return h;
  }

  function build(root) {
    const s = IG.state, C = IG.CONFIG;
    cards = [];
    const hide = !!s.ui.hideResearched;
    const bar = el('div', { class: 'toolbar' }, [
      el('label', { class: 'check' }, [el('input', { type: 'checkbox', ...(hide ? { checked: 'checked' } : {}),
        on: { change: (e) => { s.ui.hideResearched = e.target.checked; IG.UI.markDirty(); } } }), ' Hide completed research']),
    ]);
    root.appendChild(bar);
    for (let e = s.run.era; e >= 0; e--) {
      const ids = IG.Research.listForEra(e);
      if (!ids.length) continue;
      const era = C.eras[e];
      const done = ids.filter((id) => IG.Research.maxed(id)).length;
      const sec = el('section', { class: 'era-section theme-' + era.theme });
      sec.appendChild(el('div', { class: 'era-head' }, [IG.icons.node('era_' + era.id), el('span', { text: era.name + ' research' }),
        el('span', { class: 'muted small', text: done + '/' + ids.length })]));
      const tiers = {};
      for (const id of ids) {
        if (hide && IG.Research.maxed(id) && !IG.Research.repeatable(id)) continue;
        const t = C.research[id];
        (tiers[t.tier || 0] || (tiers[t.tier || 0] = [])).push(id);
      }
      const grid = el('div', { class: 'tech-grid' });
      const keys = Object.keys(tiers).map(Number).sort((a, b) => a - b);
      for (const k of keys) {
        const col = el('div', { class: 'tech-col' });
        for (const id of tiers[k]) {
          const t = C.research[id];
          const lvl = el('span', { class: 'tech-lv' });
          const cost = el('div', { class: 'tech-cost' });
          const node = el('div', { class: 'tech', tip: () => tip(id), on: { click: (ev) => {
            if (IG.Research.buy(id)) IG.Bus.emit('popup', { x: ev.clientX, y: ev.clientY, text: t.name, cls: 'gold' });
          } } }, [el('div', { class: 'tech-name' }, [el('span', { text: t.name }), lvl]),
            el('div', { class: 'tech-eff', text: IG.describe.effectsSummary(t.effects, 1) }), cost]);
          col.appendChild(node);
          cards.push({ id, node, cost, lvl });
        }
        grid.appendChild(col);
      }
      sec.appendChild(grid);
      root.appendChild(sec);
    }
  }

  function update() {
    for (const c of cards) {
      const maxed = IG.Research.maxed(c.id);
      const pre = IG.Research.prereqsMet(c.id);
      toggle(c.node, 'done', maxed);
      toggle(c.node, 'locked', !pre);
      const can = !maxed && pre && IG.Research.canBuy(c.id);
      toggle(c.node, 'can', can);
      if (maxed) setHTML(c.cost, '<span class="ok">✓ Researched</span>');
      else if (!pre) setHTML(c.cost, '<span class="muted">Locked</span>');
      else setHTML(c.cost, IG.dom.costHTML(IG.Research.cost(c.id)));
      const t = IG.CONFIG.research[c.id];
      if (t.maxLevel) setText(c.lvl, 'Lv ' + IG.Research.level(c.id));
    }
  }

  IG.UI.registerTab({ id: 'research', name: 'Research', icon: 'research', order: 1,
    isUnlocked: () => true, build, update });
})();
