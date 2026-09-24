'use strict';
// Statistics tab: lifetime resources, time played, prestiges, fastest era times, worlds and fronts.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const { el, setText } = IG.dom;

  let cells = {};

  function row(tbody, label, key) {
    const v = el('td', { class: 'num' });
    tbody.appendChild(el('tr', {}, [el('td', { text: label }), v]));
    cells[key] = v;
  }

  function table(title, rows) {
    const tb = el('tbody');
    for (const [label, key] of rows) row(tb, label, key);
    return el('section', { class: 'stats-sec' }, [el('h3', { text: title }), el('table', { class: 'stats' }, [tb])]);
  }

  function build(root) {
    cells = {};
    const C = IG.CONFIG;
    const wrap = el('div', { class: 'stats-wrap' });
    wrap.appendChild(table('General', [
      ['Time played', 'playtime'], ['This run', 'runtime'], ['Current era', 'era'], ['Highest era ever', 'highest'],
      ['Prestiges', 'prestiges'], ['Prestige points earned', 'ppTotal'], ['Forage clicks (lifetime)', 'clicks'],
      ['Generators owned', 'gens'], ['Research completed (run)', 'research'], ['Agents serving', 'agents'],
      ['Achievements', 'ach'],
    ]));
    wrap.appendChild(table('Empire', [
      ['Worlds (current)', 'worlds'], ['Worlds (best)', 'bestWorlds'], ['Fronts won', 'frontsWon'], ['Fronts lost', 'frontsLost'],
    ]));
    const lifeRows = [];
    for (const r in C.resources) if (!C.resources[r].hidden) lifeRows.push([C.resources[r].name, 'life_' + r]);
    wrap.appendChild(table('Lifetime resources produced', lifeRows));
    const eraRows = C.eras.map((e, i) => [e.name, 'era_' + i]);
    wrap.appendChild(table('Fastest time to reach each era', eraRows));
    const runs = el('section', { class: 'stats-sec' }, [el('h3', { text: 'Recent runs' })]);
    const rt = el('table', { class: 'stats' });
    rt.appendChild(el('tr', {}, ['#', 'Length', 'Highest era', 'Points'].map((h) => el('th', { text: h }))));
    const list = IG.state.perm.stats.runs.slice(-10).reverse();
    if (!list.length) rt.appendChild(el('tr', {}, [el('td', { colspan: '4', class: 'muted', text: 'No completed runs yet.' })]));
    for (const r of list) {
      rt.appendChild(el('tr', {}, [el('td', { text: String(r.n) }), el('td', { text: IG.fmtTime(r.time) }),
        el('td', { text: C.eras[r.era] ? C.eras[r.era].name : '?' }), el('td', { class: 'num', text: IG.fmtInt(r.pp) })]));
    }
    runs.appendChild(rt);
    wrap.appendChild(runs);
    root.appendChild(wrap);
  }

  function update() {
    const s = IG.state, C = IG.CONFIG, st = s.perm.stats;
    const set = (k, v) => { if (cells[k]) setText(cells[k], v); };
    set('playtime', IG.fmtTime(s.meta.playtime));
    set('runtime', IG.fmtTime(s.run.time));
    set('era', C.eras[s.run.era].name);
    set('highest', C.eras[s.perm.highestEra].name);
    set('prestiges', IG.fmtInt(s.perm.prestiges));
    set('ppTotal', IG.fmtInt(s.perm.ppTotal));
    set('clicks', IG.fmtInt(st.totalClicks));
    set('gens', IG.fmtInt(IG.Prod.totalGenerators()));
    set('research', String(IG.Research.count()));
    set('agents', String(s.run.agents.length));
    set('ach', IG.Achievements.count() + ' / ' + IG.Achievements.list().length);
    set('worlds', IG.fmtInt(IG.Expansion ? IG.Expansion.totalWorlds() : 0));
    set('bestWorlds', IG.fmtInt(st.bestWorlds));
    set('frontsWon', IG.fmtInt(st.frontsWon));
    set('frontsLost', IG.fmtInt(st.frontsLost));
    for (const r in C.resources) set('life_' + r, IG.fmt(st.lifetime[r]));
    C.eras.forEach((e, i) => {
      const t = st.bestEraTimes[i];
      set('era_' + i, i === 0 ? '—' : (t === undefined || t === null ? 'not reached' : IG.fmtTime(t)));
    });
  }

  IG.UI.registerTab({ id: 'stats', name: 'Stats', icon: 'stats', order: 80, isUnlocked: () => true, build, update });
})();
