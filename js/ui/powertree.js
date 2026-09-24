'use strict';
// Power Tree tab: prestige panel + radial SVG skill tree.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const { el, setText, setHTML, toggle } = IG.dom;
  const SVGNS = 'http://www.w3.org/2000/svg';

  let refs = null;

  function svg(tag, attrs, parent) {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function pos(n) {
    const T = IG.CONFIG.powerTree;
    const nb = T.branches.length;
    const a = -Math.PI / 2 + (n.branch * 2 * Math.PI) / nb + (n.lat || 0);
    const r = 70 + n.depth * 112;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }

  function nodeTip(id) {
    const PT = IG.PowerTree, n = PT.node(id), lv = PT.level(id);
    const T = IG.CONFIG.powerTree;
    let h = '<b>' + n.name + '</b> <span class="muted">' + T.branches[n.branch].name + '</span><br><i>' + n.desc + '</i><br>';
    h += 'Level ' + lv + ' / ' + n.maxLevel + '<br>';
    if (PT.maxed(id)) h += IG.describe.effectsSummary(n.effects, lv) + '<br><span class="ok">Mastered</span>';
    else {
      h += IG.describe.effectsTip(n.effects, lv, lv + 1);
      if (!PT.eraOk(id)) h += '<span class="no">Requires reaching the ' + IG.CONFIG.eras[n.reqEra].name + ' at least once</span><br>';
      if (!PT.reqOk(id)) h += '<span class="no">Requires: ' + Object.keys(n.req).map((k) => PT.node(k).name + ' Lv ' + n.req[k]).join(', ') + '</span><br>';
      h += 'Cost: <b>' + IG.fmtInt(PT.cost(id)) + '</b> points';
    }
    return h;
  }

  function prestigeDialog() {
    const P = IG.Prestige, s = IG.state;
    if (!P.canPrestige()) return;
    const g = P.gain();
    const go = () => {
      IG.Prestige.doPrestige();
      IG.Save.save();
      IG.UI.switchTab('powertree');
    };
    if (!s.settings.confirmPrestige) { go(); return; }
    IG.UI.modal({
      title: 'Embrace the Long Night?',
      body: '<p>Civilization will collapse into a dark age and begin again in the <b>Stone Age</b>.</p>' +
        '<p>You will gain <b class="gold">' + IG.fmtInt(g) + '</b> prestige points (' + IG.fmtInt(P.gain() - P.eraBonus()) + ' from legacy + ' + P.eraBonus() + ' for reaching the ' + IG.CONFIG.eras[s.run.era].name + (s.run.war ? ' and winning ' + s.run.war.won + ' fronts' : '') + ').</p>' +
        '<p class="muted">Kept: Power Tree, prestige points, achievements, statistics, settings.<br>Lost: resources, generators, research, agents, worlds, fleets.</p>',
      buttons: [{ text: 'Not yet' }, { text: 'Let it fall', cls: 'danger', onClick: go }],
    });
  }

  function build(root) {
    const T = IG.CONFIG.powerTree;
    refs = { nodes: {}, links: [] };
    // prestige panel
    const pp = el('div', { class: 'pp-big' });
    const gain = el('div', { class: 'pp-gain' });
    const detail = el('div', { class: 'small muted' });
    const btn = el('button', { class: 'btn danger prestige-btn', on: { click: prestigeDialog } }, 'Embrace the Long Night');
    root.appendChild(el('div', { class: 'prestige-panel' }, [
      el('div', {}, [el('div', { class: 'muted small', text: 'Echoes of Memory (prestige points)' }), pp]),
      el('div', { class: 'pp-mid' }, [gain, detail]),
      btn,
    ]));
    refs.pp = pp; refs.gain = gain; refs.detail = detail; refs.btn = btn;

    // tree
    const wrap = el('div', { class: 'pt-wrap' });
    const s = svg('svg', { viewBox: '-510 -500 1020 1000', class: 'pt-svg' });
    const defs = svg('defs', {}, s);
    const grad = svg('radialGradient', { id: 'ptCore' }, defs);
    svg('stop', { offset: '0%', 'stop-color': '#fff6d8' }, grad);
    svg('stop', { offset: '60%', 'stop-color': 'var(--accent)' }, grad);
    svg('stop', { offset: '100%', 'stop-color': 'rgba(0,0,0,0)' }, grad);
    // rings
    for (let d = 1; d <= 3; d++) svg('circle', { cx: 0, cy: 0, r: 70 + d * 112, class: 'pt-ring' }, s);
    // branch labels
    T.branches.forEach((b, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / T.branches.length;
      const x = Math.cos(a) * 470, y = Math.sin(a) * 470;
      const t = svg('text', { x, y, class: 'pt-branch', 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: b.color }, s);
      t.textContent = b.name;
    });
    // links
    const linkG = svg('g', {}, s);
    for (const id in T.nodes) {
      const n = T.nodes[id];
      const p = pos(n);
      const parents = n.req ? Object.keys(n.req) : [null];
      for (const par of parents) {
        const q = par ? pos(T.nodes[par]) : { x: 0, y: 0 };
        const line = svg('line', { x1: q.x, y1: q.y, x2: p.x, y2: p.y, class: 'pt-link', stroke: T.branches[n.branch].color }, linkG);
        refs.links.push({ line, id, par });
      }
    }
    // core
    svg('circle', { cx: 0, cy: 0, r: 58, fill: 'url(#ptCore)', class: 'pt-core' }, s);
    const ct = svg('text', { x: 0, y: 5, 'text-anchor': 'middle', class: 'pt-core-text' }, s);
    ct.textContent = 'The Undying';
    // nodes
    for (const id in T.nodes) {
      const n = T.nodes[id];
      const p = pos(n);
      const g = svg('g', { class: 'pt-node', transform: 'translate(' + p.x + ',' + p.y + ')' }, s);
      g.style.setProperty('--bc', T.branches[n.branch].color);
      svg('circle', { r: 30, class: 'pt-halo' }, g);
      svg('circle', { r: 24, class: 'pt-disc' }, g);
      const lv = svg('text', { y: 5, 'text-anchor': 'middle', class: 'pt-lv' }, g);
      const name = svg('text', { y: 42, 'text-anchor': 'middle', class: 'pt-name' }, g);
      name.textContent = n.name;
      g._tip = () => nodeTip(id);
      g.addEventListener('click', (e) => {
        if (IG.PowerTree.buy(id)) IG.Bus.emit('popup', { x: e.clientX, y: e.clientY, text: n.name, cls: 'gold' });
      });
      refs.nodes[id] = { g, lv };
    }
    wrap.appendChild(s);
    root.appendChild(wrap);
  }

  function update() {
    if (!refs) return;
    const P = IG.Prestige, PT = IG.PowerTree, s = IG.state;
    setText(refs.pp, IG.fmtInt(s.perm.pp));
    if (s.run.era < IG.CONFIG.prestige.minEra) {
      setHTML(refs.gain, 'The Long Night can fall once you reach the <b>' + IG.CONFIG.eras[IG.CONFIG.prestige.minEra].name + '</b>.');
      setText(refs.detail, '');
    } else {
      setHTML(refs.gain, 'Prestige now for <b class="gold">+' + IG.fmtInt(P.gain()) + '</b> points');
      setText(refs.detail, 'Legacy ' + IG.fmt(P.legacy()) + ' · next point at ' + IG.fmt(P.nextPointAt()) + ' · era bonus +' + P.eraBonus());
    }
    toggle(refs.btn, 'disabled', !P.canPrestige());
    for (const id in refs.nodes) {
      const r = refs.nodes[id];
      const lv = PT.level(id), mx = PT.node(id).maxLevel;
      setText(r.lv, lv + '/' + mx);
      toggle(r.g, 'owned', lv > 0);
      toggle(r.g, 'maxed', lv >= mx);
      toggle(r.g, 'can', PT.canBuy(id));
      toggle(r.g, 'locked', !PT.eraOk(id) || !PT.reqOk(id));
    }
    for (const l of refs.links) toggle(l.line, 'lit', PT.level(l.id) > 0);
  }

  IG.UI.registerTab({ id: 'powertree', name: 'Power Tree', icon: 'pp', order: 5,
    isUnlocked: () => IG.Prestige.unlocked(), teaser: () => 'The immortal\'s memory. Reach the Classical Age.', build, update });
  IG.UI.prestigeDialog = prestigeDialog;
})();
