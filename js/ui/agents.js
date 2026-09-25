'use strict';
// Agents tab: recruit agent types into free posts, assign each agent to an area, upgrade and promote them.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const { el, setText, setHTML, toggle, clear } = IG.dom;
  const C = () => IG.CONFIG;

  let recruitRefs = [];
  let rosterRefs = [];
  let areaRefs = [];
  let promoteRefs = [];   // rows of the open promotion dialog

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
      h += 'Actions per turn: ' + IG.Agents.bulk(a) + '<br>';
    } else h += '<span class="muted">Idle — assign an area.</span><br>';
    h += 'Upgrade cost: ' + IG.dom.costHTML(IG.Agents.upgradeCost(a));
    if (IG.Agents.promoteTargets(a).length) h += '<br><span class="muted">Can be promoted to a newer calling.</span>';
    return h;
  }

  // Free posts a type could fill right now.
  function freePosts(t) {
    let n = 0;
    for (const ar of C().agents.types[t].areas) {
      if (IG.Agents.areaAvailable(ar)) n += Math.max(0, IG.Agents.crewCap(ar) - IG.Agents.occupants(ar).length);
    }
    return n;
  }

  function openPromote(a) {
    const body = el('div', { class: 'promote-list' });
    const T0 = C().agents.types[a.type];
    body.appendChild(el('p', { class: 'muted', html: IG.dom.esc(a.name) + ' (' + T0.name + ', Lv ' + a.level + ') would rise to Lv <b>' +
      IG.Agents.promoteLevel(a) + '</b> in a new calling. Their current post is freed unless the new calling can keep it.' }));
    promoteRefs = [];
    let dlg = null;
    for (const t of IG.Agents.promoteTargets(a)) {
      const T = C().agents.types[t];
      const cost = el('div', { class: 'gen-cost' });
      const btn = el('button', { class: 'btn buy', on: { click: (e) => {
        if (IG.Agents.promote(a, t)) {
          IG.Bus.emit('popup', { x: e.clientX, y: e.clientY, text: T.name, cls: 'gold' });
          if (dlg) dlg.close();
        }
      } } }, 'Promote');
      const areas = T.areas.map((ar) => C().agents.areas[ar].name).join(', ');
      body.appendChild(el('div', { class: 'promote-row' }, [IG.icons.node('agent_' + t, 'ic-lg'),
        el('div', { class: 'agent-main' }, [el('b', { text: T.name }), el('div', { class: 'small muted', text: areas }), cost]), btn]));
      promoteRefs.push({ a, t, cost, btn });
    }
    dlg = IG.UI.modal({ title: 'Promote ' + IG.dom.esc(a.name), body, buttons: [{ text: 'Close' }], onClose: () => { promoteRefs = []; } });
    updatePromote();
  }

  function updatePromote() {
    for (const r of promoteRefs) {
      const room = IG.Agents.canPromote(r.a, r.t);
      const c = IG.Agents.promoteCost(r.a, r.t);
      setHTML(r.cost, room ? IG.dom.costHTML(c) : '<span class="muted">No free post for this calling.</span>');
      toggle(r.btn, 'disabled', !room || !IG.Prod.canAfford(c));
    }
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
      const posts = el('div', { class: 'gen-rate' });
      const btn = el('button', { class: 'btn buy', on: { click: (e) => {
        const a = IG.Agents.recruit(t);
        if (a) IG.Bus.emit('popup', { x: e.clientX, y: e.clientY, text: a.name, cls: 'gold' });
      } } }, 'Recruit ' + T.name);
      const areas = T.areas.map((ar) => C().agents.areas[ar].name).join(', ');
      rg.appendChild(el('div', { class: 'gen-card', style: { '--rc': C().resources[Object.keys(T.recruit)[0]].color }, tip: '<b>' + T.name + '</b><br><i>' + T.desc + '</i><br>Can staff: ' + areas +
        '<br><span class="muted">Each area holds a small crew; recruits need a free post.</span>' }, [
        el('div', { class: 'gen-top' }, [IG.icons.node('agent_' + t, 'ic-lg'), el('div', { class: 'gen-info' }, [
          el('div', { class: 'gen-name' }, [el('span', { text: T.name }), count]), el('div', { class: 'gen-rate', text: areas }), posts])]),
        el('div', { class: 'gen-actions' }, [btn]), cost]));
      recruitRefs.push({ t, cost, btn, count, posts });
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
        const full = avail && a.area !== ar && !IG.Agents.hasRoom(ar, a);
        const n = IG.Agents.occupants(ar).length, cap = IG.Agents.crewCap(ar);
        const o = el('option', { value: ar, text: C().agents.areas[ar].name + (!avail ? ' (locked)' : ' (' + n + '/' + cap + (full ? ' full' : '') + ')') });
        if (!avail || full) o.disabled = true;
        sel.appendChild(o);
      }
      sel.value = a.area || '';
      const lvl = el('span', { class: 'agent-lv' });
      const info = el('span', { class: 'small muted' });
      const up = el('button', { class: 'btn small', on: { click: (e) => {
        if (IG.Agents.upgrade(a)) IG.Bus.emit('popup', { x: e.clientX, y: e.clientY, text: 'Lv ' + a.level, cls: 'gold' });
      } } });
      const acts = el('div', { class: 'agent-acts' }, [up]);
      let pro = null;
      if (IG.Agents.promoteTargets(a).length) {
        pro = el('button', { class: 'btn small promote', on: { click: () => openPromote(a) } }, 'Promote…');
        acts.appendChild(pro);
      }
      const row = el('div', { class: 'agent-row', tip: () => agentTip(a) }, [
        IG.icons.node('agent_' + a.type, 'ic-lg'),
        el('div', { class: 'agent-main' }, [el('div', {}, [el('b', { text: a.name }), ' ', el('span', { class: 'muted small', text: T.name }), ' ', lvl]), info]),
        sel, acts]);
      list.appendChild(row);
      rosterRefs.push({ a, lvl, info, up, row, pro });
    }
    ros.appendChild(list);
    root.appendChild(ros);

    // areas overview
    const ov = el('section', { class: 'era-section' });
    ov.appendChild(el('div', { class: 'era-head' }, [IG.icons.node('research'), el('span', { text: 'Areas' })]));
    const ag = el('div', { class: 'area-grid' });
    for (const ar in C().agents.areas) {
      if (!IG.Agents.areaAvailable(ar)) continue;
      if (!Object.keys(C().agents.types).some((t) => IG.Agents.typeUnlocked(t) && C().agents.types[t].areas.includes(ar))) continue;
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
      const free = freePosts(r.t);
      setHTML(r.cost, free ? IG.dom.costHTML(c) : '<span class="muted">No free post — promote, or open more posts.</span>');
      toggle(r.btn, 'disabled', !free || !IG.Prod.canAfford(c));
      setText(r.count, String(IG.Agents.countOfType(r.t)));
      setText(r.posts, free + (free === 1 ? ' free post' : ' free posts'));
    }
    for (const r of rosterRefs) {
      setText(r.lvl, 'Lv ' + r.a.level);
      setText(r.info, r.a.area ? C().agents.areas[r.a.area].name + ' · every ' + IG.Agents.interval(r.a).toFixed(1) + 's × ' + IG.Agents.bulk(r.a) : 'Idle');
      const c = IG.Agents.upgradeCost(r.a);
      setHTML(r.up, 'Upgrade ' + IG.dom.costHTML(c));
      toggle(r.up, 'disabled', !IG.Prod.canAfford(c));
      toggle(r.row, 'idle', !r.a.area);
      if (r.pro) toggle(r.pro, 'ready', IG.Agents.promoteTargets(r.a).some((t) => IG.Agents.canPromote(r.a, t) &&
        IG.Prod.canAfford(IG.Agents.promoteCost(r.a, t))));
    }
    for (const r of areaRefs) {
      const occ = IG.Agents.occupants(r.ar);
      const cap = IG.Agents.crewCap(r.ar);
      setHTML(r.who, occ.length ? '<span class="ok">' + occ.map((a) => IG.dom.esc(a.name)).join(', ') + '</span> <span class="muted">' +
        occ.length + '/' + cap + '</span>' : '<span class="muted">unstaffed · 0/' + cap + '</span>');
    }
    updatePromote();
  }

  IG.UI.registerTab({ id: 'agents', name: 'Agents', icon: 'agents', order: 2, isUnlocked: anyUnlocked,
    teaser: () => 'Mortal agents who automate your works. Research Ancestor Rites.', build, update });
})();
