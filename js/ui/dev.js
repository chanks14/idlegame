'use strict';
// Developer mode: hidden toggle (type "aeon" or ?dev=1). Backquote opens/closes the panel.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const { el } = IG.dom;

  let panel = null;
  let open = false;

  function addResources(mult) {
    const s = IG.state;
    for (const r of IG.UI.unlockedResources()) {
      const gross = IG.Prod.cache.gross[r];
      const add = gross && gross.gt(0) ? gross.mul(mult) : IG.D(mult * 10);
      s.run.resources[r] = s.run.resources[r].add(add);
    }
    IG.UI.toast('Resources added.');
  }

  function build() {
    panel = document.getElementById('dev-panel');
    panel.innerHTML = '';
    const C = IG.CONFIG, s = IG.state;
    const btn = (text, fn) => el('button', { class: 'btn small', on: { click: fn } }, text);
    const eraSel = el('select', {}, C.eras.map((e, i) => el('option', { value: String(i), text: i + ' · ' + e.name })));
    eraSel.value = String(s.run.era);
    const multSel = el('select', {}, [1, 10, 100, 1000, 1e6].map((m) => el('option', { value: String(m), text: '×' + IG.fmt(m) })));
    multSel.value = String(s.meta.devMult || 1);
    panel.appendChild(el('div', { class: 'dev-head' }, [el('b', { text: 'Developer mode' }), btn('✕', toggle)]));
    panel.appendChild(el('div', { class: 'dev-row' }, [el('span', { text: 'Resources' }),
      btn('+60s prod', () => addResources(60)), btn('+1h prod', () => addResources(3600)), btn('×1000 held', () => {
        for (const r of IG.UI.unlockedResources()) s.run.resources[r] = s.run.resources[r].add(1).mul(1000);
      })]));
    panel.appendChild(el('div', { class: 'dev-row' }, [el('span', { text: 'Production' }), multSel,
      btn('Apply', () => { s.meta.devMult = parseFloat(multSel.value); IG.Mods.dirty = true; IG.UI.toast('Production ×' + multSel.value); })]));
    panel.appendChild(el('div', { class: 'dev-row' }, [el('span', { text: 'Skip time' }),
      btn('1 min', () => skip(60)), btn('10 min', () => skip(600)), btn('1 hour', () => skip(3600)), btn('8 hours', () => skip(28800))]));
    panel.appendChild(el('div', { class: 'dev-row' }, [el('span', { text: 'Jump to era' }), eraSel,
      btn('Go', () => { IG.Dev.jumpToEra(parseInt(eraSel.value, 10)); })]));
    panel.appendChild(el('div', { class: 'dev-row' }, [el('span', { text: 'Prestige pts' }),
      btn('+10', () => grantPP(10)), btn('+100', () => grantPP(100)), btn('+10k', () => grantPP(10000))]));
    panel.appendChild(el('div', { class: 'dev-row' }, [el('span', { text: 'Misc' }),
      btn('Meet milestone', () => meetMilestone()), btn('Research era', () => researchAll()), btn('+Worlds', () => { if (IG.Expansion) IG.Expansion.devAddWorlds(1000); }), btn('Win front', () => { if (IG.War) IG.War.devWin(); })]));
    panel.appendChild(el('div', { class: 'dev-row' }, [el('span', { text: 'Disable' }),
      btn('Leave dev mode', () => { s.meta.devMode = false; s.meta.devMult = 1; IG.Mods.dirty = true; toggle(); IG.UI.toast('Dev mode off.'); })]));
  }

  function skip(sec) {
    const sum = IG.Offline.simulate(sec, { uncapped: true });
    IG.UI.welcomeBack(sum);
  }

  function grantPP(n) {
    IG.state.perm.pp += n;
    IG.state.perm.ppTotal += n;
    IG.UI.toast('+' + n + ' prestige points');
  }

  function meetMilestone() {
    const e = IG.CONFIG.eras[IG.state.run.era];
    if (!e.milestone) return;
    for (const c of e.milestone) {
      if (c.type === 'res') {
        const run = IG.state.run, need = IG.D(c.amount).mul(IG.Mods.get().eraReq);
        if (run.resources[c.res].lt(need)) run.resources[c.res] = need;
        if (IG.Eras.gathered(c.res).lt(need)) run.eraBase[c.res] = run.produced[c.res].sub(need);
      }
      if (c.type === 'research') { IG.state.run.research[c.id] = 1; IG.Mods.dirty = true; }
      if (c.type === 'gen') { const g = IG.state.run.gens[c.gen]; if (g.n < c.count) g.n = c.count; }
      if (c.type === 'mega' && IG.Mega) IG.Mega.devComplete(c.id);
      if (c.type === 'worlds' && IG.Expansion) IG.Expansion.devAddWorlds(Math.max(0, c.count - IG.Expansion.totalWorlds()));
    }
    IG.UI.markDirty();
  }

  function researchAll() {
    const s = IG.state;
    for (const id of IG.Research.listForEra(s.run.era)) {
      const t = IG.CONFIG.research[id];
      if (!t.maxLevel) s.run.research[id] = 1;
    }
    IG.Mods.dirty = true;
    IG.UI.markDirty();
  }

  function toggle() {
    if (!IG.state.meta.devMode) return;
    open = !open;
    if (open) build();
    document.getElementById('dev-panel').classList.toggle('show', open);
  }

  function enable() {
    IG.state.meta.devMode = !IG.state.meta.devMode;
    IG.UI.toast(IG.state.meta.devMode ? 'Developer mode enabled — press ` for the panel.' : 'Developer mode disabled.');
    if (IG.state.meta.devMode && !open) toggle();
    if (!IG.state.meta.devMode && open) toggle();
  }

  const Dev = {
    toggle, enable,
    // Jump directly to an era: grants the prior milestones and a stake of resources.
    jumpToEra(target) {
      const s = IG.state, C = IG.CONFIG;
      while (s.run.era < target && s.run.era + 1 < C.eras.length) {
        meetMilestone();
        researchAll();
        IG.Eras.enter(s.run.era + 1, true);
        IG.Mods.compile();
      }
      if (IG.Dev.onJump) IG.Dev.onJump(target);
      IG.Mods.dirty = true;
      IG.UI.rebuildAll();
      IG.Bus.emit('era', { era: s.run.era });
    },
  };

  IG.Dev = Dev;
})();
