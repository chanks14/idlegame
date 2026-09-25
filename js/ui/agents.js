'use strict';
// Agents tab: recruit agent types, assign each agent to an area, upgrade them.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const { el, setText, setHTML, toggle, clear } = IG.dom;
  const C = () => IG.CONFIG;

  let recruitRefs = [];
  let rosterRefs = [];
  let areaRefs = [];

  function anyUnlocked() {
    for (const t in C().agents.types) if (IG.Agents.typeUnlocked(t)) return true;
    return IG.state.run.agents.length > 0;
  }

  function agentTip(a) {
    const T = C().agents.types[a.type];
    const iv = IG.Agents.interval(a);
    const nextA = Object.assign({}, a, { level: a.level + 1 });
    const iv2 = IG.Agents.interval(nextA);
    let h = '<b>' + a.name + '</b><br><i>' + T.name + ' — ' + T.desc + '</i><br>Level ' + a.level + '<br>';
    if (a.area) {
      h += 'Acts every ' + iv.toFixed(2) + 's → <b>' + iv2.toFixed(2) + 's</b><br>';
      h += 'Actions per turn: ' + IG.Agents.bulk(a) + ' → <b>' + IG.Agents.bulk(nextA) + '</b><br>';
    } else h += '<span class="muted">Idle — assign an area.</span><br>';
    h += 'Upgrade cost: ' + IG.dom.costHTML(IG.Agents.upgradeCost(a));
    return h;
  }

  function build(root) {
    recruitRefs = []; rosterRefs = []; areaRefs = [];
    const s = IG.state;

    // recruit
    const rec = el('section', { class: 'era-section' });
    rec.appendChild(el('div', { class: 'era-head' }, [IG.icons.node('agents'), el('span', { text: 'Recruit' })]));
    const rg = el('div', { class: 'gen-grid' });
    let teaserShown = false;
    for (const t in C().agents.types) {
      const T = C().agents.types[t];
      if (!IG.Agents.typeUnlocked(t)) {
        if (!teaserShown && T.era <= s.run.era + 1) {
          teaserShown = true;
          const key = T.unlock;
          let hint = 'Keep advancing.';
          for (const id in C().research) if (C().research[id].effects.some((e) => e.type === 'unlock' && e.key === key)) hint = 'Research ' + C().research[id].name + '.';
          rg.appendChild(el('div', { class: 'gen-card teaser', tip: '<b>???</b><br>' + hint }, [IG.icons.node('unknown', 'ic-lg'),
            el('div', { class: 'gen-info' }, [el('div', { class: 'gen-name', text: '???' }), el('div', { class: 'gen-rate', text: hint })])]));
        }
        continue;
      }
      const cost = el('div', { class: 'gen-cost' });
      const count = el('span', { class: 'gen-count' });
      const btn = el('button', { class: 'btn buy', on: { click: (e) => {
        const a = IG.Agents.recruit(t);
        if (a) IG.Bus.emit('popup', { x: e.clientX, y: e.clientY, text: a.name, cls: 'gold' });
      } } }, 'Recruit ' + T.name);
      const areas = T.areas.map((ar) => C().agents.areas[ar].name).join(', ');
      rg.appendChild(el('div', { class: 'gen-card', style: { '--rc': C().resources[Object.keys(T.recruit)[0]].color }, tip: '<b>' + T.name + '</b><br><i>' + T.desc + '</i><br>Can staff: ' + areas }, [
        el('div', { class: 'gen-top' }, [IG.icons.node('agent_' + t, 'ic-lg'), el('div', { class: 'gen-info' }, [
          el('div', { class: 'gen-name' }, [el('span', { text: T.name }), count]), el('div', { class: 'gen-rate', text: areas })])]),
        el('div', { class: 'gen-actions' }, [btn]), cost]));
      recruitRefs.push({ t, cost, btn, count });
    }
    rec.appendChild(rg);
    root.appendChild(rec);

    // roster
    const ros = el('section', { class: 'era-section' });
    ros.appendChild(el('div', { class: 'era-head' }, [IG.icons.node('agents'), el('span', { text: 'Your agents' }),
      el('span', { class: 'muted small', text: s.run.agents.length + ' serving' })]));
    if (!s.run.agents.length) ros.appendChild(el('div', { class: 'muted', text: 'No mortal serves you yet.' }));
    const list = el('div', { class: 'agent-list' });
    for (const a of s.run.agents) {
      const T = C().agents.types[a.type];
      const sel = el('select', { on: { change: (e) => { IG.Agents.assign(a, e.target.value || null); } } });
      sel.appendChild(el('option', { value: '', text: '— idle —' }));
      for (const ar of T.areas) {
        const avail = IG.Agents.areaAvailable(ar);
        const occ = IG.Agents.occupant(ar);
        const o = el('option', { value: ar, text: C().agents.areas[ar].name + (!avail ? ' (locked)' : occ && occ !== a ? ' (' + occ.name.split(' ')[0] + ')' : '') });
        if (!avail) o.disabled = true;
        sel.appendChild(o);
      }
      sel.value = a.area || '';
      const lvl = el('span', { class: 'agent-lv' });
      const info = el('span', { class: 'small muted' });
      const up = el('button', { class: 'btn small', on: { click: (e) => {
        if (IG.Agents.upgrade(a)) IG.Bus.emit('popup', { x: e.clientX, y: e.clientY, text: 'Lv ' + a.level, cls: 'gold' });
      } } });
      const row = el('div', { class: 'agent-row', tip: () => agentTip(a) }, [
        IG.icons.node('agent_' + a.type, 'ic-lg'),
        el('div', { class: 'agent-main' }, [el('div', {}, [el('b', { text: a.name }), ' ', el('span', { class: 'muted small', text: T.name }), ' ', lvl]), info]),
        sel, up]);
      list.appendChild(row);
      rosterRefs.push({ a, lvl, info, up, row });
    }
    ros.appendChild(list);
    root.appendChild(ros);

    // areas overview
    const ov = el('section', { class: 'era-section' });
    ov.appendChild(el('div', { class: 'era-head' }, [IG.icons.node('research'), el('span', { text: 'Areas' })]));
    const ag = el('div', { class: 'area-grid' });
    for (const ar in C().agents.areas) {
      if (!IG.Agents.areaAvailable(ar)) continue;
      const def = C().agents.areas[ar];
      const who = el('span', { class: 'small' });
      ag.appendChild(el('div', { class: 'area-item', tip: '<b>' + def.name + '</b><br>' + def.desc + '<br>Staffed by: ' +
        Object.keys(C().agents.types).filter((t) => C().agents.types[t].areas.includes(ar)).map((t) => C().agents.types[t].name).join(', ') },
      [el('b', { text: def.name }), who]));
      areaRefs.push({ ar, who });
    }
    ov.appendChild(ag);
    root.appendChild(ov);
  }

  function update() {
    for (const r of recruitRefs) {
      const c = IG.Agents.recruitCost(r.t);
      setHTML(r.cost, IG.dom.costHTML(c));
      toggle(r.btn, 'disabled', !IG.Prod.canAfford(c));
      setText(r.count, String(IG.Agents.countOfType(r.t)));
    }
    for (const r of rosterRefs) {
      setText(r.lvl, 'Lv ' + r.a.level);
      setText(r.info, r.a.area ? C().agents.areas[r.a.area].name + ' · every ' + IG.Agents.interval(r.a).toFixed(1) + 's × ' + IG.Agents.bulk(r.a) : 'Idle');
      const c = IG.Agents.upgradeCost(r.a);
      setHTML(r.up, 'Upgrade ' + IG.dom.costHTML(c));
      toggle(r.up, 'disabled', !IG.Prod.canAfford(c));
      toggle(r.row, 'idle', !r.a.area);
    }
    for (const r of areaRefs) {
      const occ = IG.Agents.occupant(r.ar);
      setHTML(r.who, occ ? '<span class="ok">' + IG.dom.esc(occ.name) + '</span>' : '<span class="muted">unstaffed</span>');
    }
  }

  IG.UI.registerTab({ id: 'agents', name: 'Agents', icon: 'agents', order: 2, isUnlocked: anyUnlocked,
    teaser: () => 'Mortal agents who automate your works. Research Ancestor Rites.', build, update });
})();
