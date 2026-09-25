'use strict';
// Production-tab panels for the per-era mechanics: Trade Routes, Rites, Power Grid, Compute, Megaprojects.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const { el, setText, setHTML, toggle, setStyle } = IG.dom;
  const C = () => IG.CONFIG;

  function unlockTeaser(key) {
    for (const id in C().research) {
      const t = C().research[id];
      if (t.effects.some((e) => e.type === 'unlock' && e.key === key)) return 'Research ' + t.name + ' to unlock.';
    }
    return 'Keep advancing.';
  }

  function header(box, iconName, title, desc) {
    const res = C().resources[iconName];
    box.style.setProperty('--rc', res ? res.color : '#e0b64a');
    box.appendChild(el('div', { class: 'mech-title' }, [IG.icons.node(iconName), el('span', { text: title })]));
    if (desc) box.appendChild(el('div', { class: 'mech-desc', text: desc }));
  }

  // ---------------------------------------------------------------- Trade
  IG.UI.mechanics.push({
    era: 2, isUnlocked: () => IG.Trade.unlocked(), teaser: () => 'Trade Routes. ' + unlockTeaser('mech:trade'),
    build(root) {
      const box = el('div', { class: 'mech' });
      header(box, 'trade', 'Trade Routes', 'Each level adds +' + Math.round(IG.Trade.perLevel() * 100) + '% production of the linked resource.');
      const grid = el('div', { class: 'mech-grid' });
      const items = [];
      for (const id in C().trade.routes) {
        const r = C().trade.routes[id];
        const lv = el('span', { class: 'lv' }), eff = el('div', { class: 'small muted' }), cost = el('div', { class: 'small' });
        const btn = el('button', { class: 'btn small', on: { click: (e) => {
          if (IG.Trade.buy(id)) IG.Bus.emit('popup', { x: e.clientX, y: e.clientY, text: r.name + ' +1', cls: 'gold' });
        } } }, 'Extend');
        const item = el('div', { class: 'mech-item', style: { '--rc': C().resources[r.res].color }, tip: () => '<b>' + r.name + '</b><br><i>' + r.desc + '</i><br>' +
          C().resources[r.res].name + ' production: ' + IG.fmtMult(IG.Trade.mult(id)) + ' → <b>' + IG.fmtMult(IG.Trade.mult(id, IG.Trade.level(id) + 1)) + '</b><br>Cost: ' + IG.dom.costHTML(IG.Trade.cost(id)) },
        [el('div', { class: 'row' }, [el('span', {}, [IG.icons.node(r.res, 'ic-sm'), ' ' + r.name]), lv]), eff, el('div', { class: 'row' }, [cost, btn])]);
        grid.appendChild(item);
        items.push({ id, lv, eff, cost, btn });
      }
      box.appendChild(grid);
      root.appendChild(box);
      return () => {
        for (const it of items) {
          setText(it.lv, 'Lv ' + IG.Trade.level(it.id));
          setText(it.eff, C().resources[C().trade.routes[it.id].res].name + ' ' + IG.fmtMult(IG.Trade.mult(it.id)));
          const c = IG.Trade.cost(it.id);
          setHTML(it.cost, IG.dom.costHTML(c));
          toggle(it.btn, 'disabled', !IG.Prod.canAfford(c));
        }
      };
    },
  });

  // ---------------------------------------------------------------- Rites
  IG.UI.mechanics.push({
    era: 3, isUnlocked: () => IG.Rites.unlocked(), teaser: () => 'The Rites. ' + unlockTeaser('mech:rites'),
    build(root) {
      const box = el('div', { class: 'mech' });
      header(box, 'faith', 'Rites', 'Spend Faith on timed blessings. Each performance this age costs more than the last.');
      const grid = el('div', { class: 'mech-grid' });
      const items = [];
      for (const id in C().rites.list) {
        const r = C().rites.list[id];
        if (!IG.Rites.available(id)) {
          grid.appendChild(el('div', { class: 'mech-item teaser', tip: '<b>???</b><br>' + unlockTeaser(r.requires) }, [el('span', { class: 'muted', text: '??? — ' + unlockTeaser(r.requires) })]));
          continue;
        }
        const target = r.all ? 'all production' : r.res.map((x) => C().resources[x].name).join(' & ');
        const bar = el('div', { class: 'bar-fill' }), cost = el('div', { class: 'small' }), state = el('span', { class: 'small muted' });
        const btn = el('button', { class: 'btn small', on: { click: (e) => {
          if (IG.Rites.invoke(id)) IG.Bus.emit('popup', { x: e.clientX, y: e.clientY, text: r.name, cls: 'gold' });
        } } }, 'Perform');
        const item = el('div', { class: 'mech-item', tip: () => '<b>' + r.name + '</b><br><i>' + r.desc + '</i><br>' +
          target + ' ×' + IG.Rites.power(id).toFixed(2) + ' for ' + Math.round(IG.Rites.duration(id)) + 's<br>Performed ' + IG.Rites.uses(id) + ' times this run<br>Cost: ' + IG.dom.costHTML(IG.Rites.cost(id)) },
        [el('div', { class: 'row' }, [el('b', { text: r.name }), state]),
          el('div', { class: 'small muted', text: target + ' ×' + IG.Rites.power(id).toFixed(1) }),
          el('div', { class: 'bar' }, [bar]), el('div', { class: 'row' }, [cost, btn])]);
        grid.appendChild(item);
        items.push({ id, item, bar, cost, btn, state });
      }
      box.appendChild(grid);
      root.appendChild(box);
      return () => {
        for (const it of items) {
          const rem = IG.Rites.remaining(it.id);
          const on = rem > 0;
          toggle(it.item, 'active', on);
          setStyle(it.bar, 'width', (on ? (rem / IG.Rites.duration(it.id)) * 100 : 0).toFixed(1) + '%');
          setText(it.state, on ? Math.ceil(rem) + 's' : '');
          const c = IG.Rites.cost(it.id);
          setHTML(it.cost, IG.dom.costHTML(c));
          toggle(it.btn, 'disabled', !IG.Prod.canAfford(c));
          setText(it.btn, on ? 'Renew' : 'Perform');
        }
      };
    },
  });

  // ---------------------------------------------------------------- Power Grid
  IG.UI.mechanics.push({
    era: 4, isUnlocked: () => IG.Grid.unlocked(), teaser: () => 'The Power Grid. ' + unlockTeaser('mech:grid'),
    build(root) {
      const box = el('div', { class: 'mech' });
      header(box, 'energy', 'Power Grid', 'Electrify sectors of the economy. Each level multiplies output but draws continuous Energy upkeep. If Energy runs dry the grid browns out.');
      const status = el('div', { class: 'grid-status' });
      box.appendChild(status);
      const grid = el('div', { class: 'mech-grid' });
      const items = [];
      for (const id in C().grid.sectors) {
        const sct = C().grid.sectors[id];
        const lv = el('span', { class: 'lv' }), eff = el('div', { class: 'small muted' }), cost = el('div', { class: 'small' });
        const plus = el('button', { class: 'btn small', on: { click: (e) => {
          if (IG.Grid.raise(id)) IG.Bus.emit('popup', { x: e.clientX, y: e.clientY, text: sct.name + ' ⚡', cls: 'gold' });
        } } }, '+');
        const minus = el('button', { class: 'btn small', on: { click: () => IG.Grid.lower(id) } }, '−');
        const item = el('div', { class: 'mech-item', tip: () => '<b>' + sct.name + '</b><br><i>' + sct.desc + '</i><br>' +
          'Boosts: ' + sct.res.map((x) => C().resources[x].name).join(', ') + '<br>' +
          'Multiplier: ' + IG.fmtMult(IG.Grid.mult(id)) + ' → <b>' + IG.fmtMult(IG.Grid.mult(id, IG.Grid.level(id) + 1)) + '</b><br>' +
          'Upkeep: ' + IG.fmtRate(IG.Grid.upkeep(id)) + ' → <b>' + IG.fmtRate(IG.Grid.upkeep(id, IG.Grid.level(id) + 1)) + '</b> Energy<br>' +
          'Raise cost: ' + IG.dom.costHTML(IG.Grid.raiseCost(id)) },
        [el('div', { class: 'row' }, [el('b', { text: sct.name }), lv]), eff, el('div', { class: 'row' }, [cost, el('span', {}, [minus, ' ', plus])])]);
        grid.appendChild(item);
        items.push({ id, item, lv, eff, cost, plus, minus });
      }
      box.appendChild(grid);
      root.appendChild(box);
      return () => {
        const up = IG.Grid.totalUpkeep();
        const e = IG.Grid.efficiency;
        setHTML(status, 'Upkeep: <b>' + IG.fmtRate(up) + '</b> Energy · Net energy: ' + IG.fmtRate(IG.Prod.cache.rates.energy || 0) +
          ' · Grid power: <span class="' + (e < 0.999 ? 'no' : 'ok') + '">' + IG.fmtPct(e) + '</span>');
        for (const it of items) {
          const L = IG.Grid.level(it.id);
          setText(it.lv, 'Lv ' + L);
          setText(it.eff, IG.fmtMult(IG.Grid.mult(it.id)) + ' · upkeep ' + IG.fmtRate(IG.Grid.upkeep(it.id)));
          const c = IG.Grid.raiseCost(it.id);
          setHTML(it.cost, IG.dom.costHTML(c));
          toggle(it.plus, 'disabled', !IG.Prod.canAfford(c));
          toggle(it.minus, 'disabled', L <= 0);
          toggle(it.item, 'active', L > 0);
        }
      };
    },
  });

  // ---------------------------------------------------------------- Compute
  IG.UI.mechanics.push({
    era: 5, isUnlocked: () => IG.Compute.unlocked(), teaser: () => 'Compute Programs. ' + unlockTeaser('mech:compute'),
    build(root) {
      const box = el('div', { class: 'mech' });
      header(box, 'compute', 'Compute Programs', 'Divide your compute capacity (Compute produced per second) between programs. Shares always total at most 100%.');
      const cap = el('div', { class: 'grid-status' });
      box.appendChild(cap);
      const grid = el('div', { class: 'mech-grid' });
      const items = [];
      for (const id in C().compute.programs) {
        const p = C().compute.programs[id];
        const val = el('span', { class: 'lv' }), eff = el('div', { class: 'small muted' });
        const range = el('input', { type: 'range', min: '0', max: '100', step: '1', value: String(Math.round(IG.Compute.share(id) * 100)),
          on: { input: (e) => { IG.Compute.setShare(id, parseInt(e.target.value, 10) / 100); syncRanges(); } } });
        const item = el('div', { class: 'mech-item', tip: () => '<b>' + p.name + '</b><br>' + p.desc + '<br>Current: ' + IG.fmtMult(IG.Compute.multFor(id)) },
          [el('div', { class: 'row' }, [el('b', { text: p.name }), val]), eff, range]);
        grid.appendChild(item);
        items.push({ id, val, eff, range });
      }
      function syncRanges() {
        for (const it of items) {
          const v = String(Math.round(IG.Compute.share(it.id) * 100));
          if (it.range.value !== v && document.activeElement !== it.range) it.range.value = v;
        }
      }
      box.appendChild(grid);
      box.appendChild(el('button', { class: 'btn small', on: { click: () => { IG.Compute.balance(); syncRanges(); } } }, 'Balance evenly'));
      root.appendChild(box);
      return () => {
        setHTML(cap, 'Capacity: <b>' + IG.fmtRate(IG.Compute.capacity()) + '</b> · Allocated: ' + IG.fmtPct(IG.Compute.totalShare()));
        for (const it of items) {
          setText(it.val, IG.fmtPct(IG.Compute.share(it.id)));
          setText(it.eff, C().compute.programs[it.id].desc + ' ' + IG.fmtMult(IG.Compute.multFor(it.id)));
        }
        syncRanges();
      };
    },
  });

  // ---------------------------------------------------------------- Megaprojects
  IG.UI.mechanics.push({
    era: 6, isUnlocked: () => IG.Mega.unlocked(), teaser: () => 'Megaprojects. ' + unlockTeaser('mech:mega'),
    build(root) {
      const box = el('div', { class: 'mech' });
      header(box, 'alloy', 'Megaprojects', 'One project at a time. While active, ' + IG.fmtPct(C().megaprojects.fundShare) + ' of each required resource\'s production flows into it.');
      const grid = el('div', { class: 'mech-grid wide' });
      const items = [];
      for (const id in C().megaprojects.list) {
        const p = C().megaprojects.list[id];
        const state = el('span', { class: 'small' });
        const bars = {};
        const barBox = el('div', {});
        for (const r in p.cost) {
          const fill = el('div', { class: 'bar-fill' });
          const lbl = el('div', { class: 'small muted' });
          bars[r] = { fill, lbl };
          barBox.appendChild(lbl);
          barBox.appendChild(el('div', { class: 'bar' }, [fill]));
        }
        const startBtn = el('button', { class: 'btn small', on: { click: () => IG.Mega.start(id) } }, 'Begin');
        const pourBtn = el('button', { class: 'btn small', on: { click: () => IG.Mega.contribute(0.5) } }, 'Pour in 50% of stores');
        const item = el('div', { class: 'mech-item', tip: () => '<b>' + p.name + '</b><br><i>' + p.desc + '</i><br>' +
          IG.describe.effectsSummary(p.effects, 1) + (p.prereq ? '<br>Requires: ' + C().megaprojects.list[p.prereq].name : '') },
        [el('div', { class: 'row' }, [el('b', { text: p.name }), state]), el('div', { class: 'small muted', text: IG.describe.effectsSummary(p.effects, 1) }), barBox,
          el('div', { class: 'row' }, [startBtn, pourBtn])]);
        grid.appendChild(item);
        items.push({ id, item, state, bars, startBtn, pourBtn });
      }
      box.appendChild(grid);
      root.appendChild(box);
      return () => {
        const active = IG.state.run.mega.active;
        for (const it of items) {
          const p = C().megaprojects.list[it.id];
          const done = IG.Mega.done(it.id), avail = IG.Mega.available(it.id), isAct = active === it.id;
          setText(it.state, done ? '✓ Complete' : isAct ? 'Under construction' : avail ? 'Ready' : 'Locked');
          toggle(it.item, 'active', isAct);
          toggle(it.item, 'done', done);
          const c = IG.Mega.cost(it.id), pr = IG.Mega.progress(it.id);
          for (const r in it.bars) {
            const f = done ? 1 : Math.min(1, pr[r].div(c[r]).toNumber());
            setStyle(it.bars[r].fill, 'width', (f * 100).toFixed(1) + '%');
            setText(it.bars[r].lbl, C().resources[r].name + ': ' + IG.fmt(done ? c[r] : pr[r]) + ' / ' + IG.fmt(c[r]));
          }
          toggle(it.startBtn, 'hidden', done || isAct || !avail || !!active);
          toggle(it.pourBtn, 'hidden', !isAct);
        }
      };
    },
  });
})();
