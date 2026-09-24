'use strict';
// UI shell: header, tab bar (with unlock teasers), sidebar (era milestone, resources, event log), modals.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const { el, setText, setHTML, toggle, setStyle, clear } = IG.dom;

  const tabs = [];
  const refs = {};
  let dirty = true;       // current tab needs rebuild
  let tabbarKey = '';
  let resKey = '';
  let eraKey = '';
  let logBuilt = false;

  // def: {id, name, icon, order, isUnlocked(): bool, teaser(): string, build(container), update()}
  function registerTab(def) {
    tabs.push(def);
    tabs.sort((a, b) => a.order - b.order);
  }

  function current() { return IG.state.ui.tab; }

  function switchTab(id) {
    const t = tabs.find((x) => x.id === id);
    if (!t || !t.isUnlocked()) return;
    IG.state.ui.tab = id;
    IG.state.ui.seenTabs[id] = true;
    dirty = true;
    tabbarKey = '';
    IG.dom.hideTip();
    IG.Bus.emit('tab', id);
  }

  // ---------------------------------------------------------------- tab bar
  function buildTabbar() {
    const bar = refs.tabbar;
    const unlocked = tabs.filter((t) => t.isUnlocked());
    const key = unlocked.map((t) => t.id).join(',') + '|' + current() + '|' +
      unlocked.filter((t) => !IG.state.ui.seenTabs[t.id]).map((t) => t.id).join(',');
    if (key === tabbarKey) return;
    tabbarKey = key;
    clear(bar);
    for (const t of unlocked) {
      const b = el('button', { class: 'tab' + (t.id === current() ? ' active' : '') +
        (IG.state.ui.seenTabs[t.id] || t.id === current() ? '' : ' new'),
        on: { click: () => switchTab(t.id) }, 'data-tab': t.id });
      b.innerHTML = IG.icons.html(t.icon) + '<span>' + t.name + '</span>';
      bar.appendChild(b);
    }
    // teaser: the next locked tab
    const next = tabs.find((t) => !t.isUnlocked() && t.teaser);
    if (next) {
      const b = el('button', { class: 'tab locked', tip: '<b>???</b><br>' + next.teaser() });
      b.innerHTML = IG.icons.html('lock') + '<span>???</span>';
      bar.appendChild(b);
    }
  }

  // ---------------------------------------------------------------- header
  function unlockedResources() {
    const C = IG.CONFIG, era = IG.state.run.era, out = [];
    for (const r in C.resources) {
      const d = C.resources[r];
      if (d.era > era) continue;
      if (d.hidden) continue;
      out.push(r);
    }
    return out;
  }

  function headerResources() {
    const C = IG.CONFIG, era = IG.state.run.era;
    const list = unlockedResources().filter((r) => {
      const d = C.resources[r];
      return d.era >= era - 1 || d.pinned;
    });
    return list;
  }

  // Extra header chips for non-resource totals (worlds, fleet): {id, icon, color, show(), value(), sub(), tip()}
  const headerExtras = [];

  function buildHeader() {
    const list = headerResources();
    const extras = headerExtras.filter((x) => x.show());
    const key = list.join(',') + '|' + extras.map((x) => x.id).join(',');
    if (key !== resKey) {
      resKey = key;
      clear(refs.resBar);
      refs.resChips = {};
      for (const r of list) {
        const d = IG.CONFIG.resources[r];
        const amt = el('span', { class: 'amt' });
        const rate = el('span', { class: 'rate' });
        const chip = el('div', { class: 'res-chip', style: { '--rc': d.color },
          tip: () => resourceTip(r) }, [IG.icons.node(r), el('div', { class: 'res-vals' }, [amt, rate])]);
        refs.resBar.appendChild(chip);
        refs.resChips[r] = { amt, rate };
      }
      refs.extraChips = [];
      for (const x of extras) {
        const amt = el('span', { class: 'amt' });
        const rate = el('span', { class: 'rate' });
        const chip = el('div', { class: 'res-chip extra', style: { '--rc': x.color }, tip: x.tip }, [IG.icons.node(x.icon), el('div', { class: 'res-vals' }, [amt, rate])]);
        refs.resBar.appendChild(chip);
        refs.extraChips.push({ x, amt, rate });
      }
    }
    for (const c of refs.extraChips || []) { setText(c.amt, c.x.value()); setText(c.rate, c.x.sub ? c.x.sub() : ''); }
    const s = IG.state;
    for (const r in refs.resChips) {
      setText(refs.resChips[r].amt, IG.fmt(s.run.resources[r]));
      const rt = IG.Prod.cache.rates[r];
      setText(refs.resChips[r].rate, rt ? (rt.lt(0) ? '' : '+') + IG.fmtRate(rt) : '');
    }
    const e = IG.CONFIG.eras[s.run.era];
    setHTML(refs.eraBadge, IG.icons.html('era_' + e.id) + '<span>' + e.name + '</span>');
    const pend = IG.Prestige.canPrestige() ? IG.Prestige.gain() : 0;
    setText(refs.ppChip.querySelector('.amt'), IG.fmtInt(s.perm.pp) + (pend > 0 ? '  (+' + IG.fmtInt(pend) + ')' : ''));
    toggle(refs.ppChip, 'ready', pend > 0);
    toggle(refs.ppChip, 'hidden', s.perm.prestiges === 0 && s.perm.pp === 0 && !(IG.Prestige && IG.Prestige.unlocked()));
    if (document.body.dataset.era !== e.theme) document.body.dataset.era = e.theme;
  }

  function resourceTip(r) {
    const d = IG.CONFIG.resources[r];
    const s = IG.state;
    const rate = IG.Prod.cache.rates[r] || IG.D(0);
    const gross = IG.Prod.cache.gross[r] || IG.D(0);
    let h = '<b>' + d.name + '</b><br><i>' + d.desc + '</i><br>';
    h += 'Held: ' + IG.fmt(s.run.resources[r]) + '<br>';
    h += 'Production: ' + IG.fmtRate(gross);
    if (!rate.eq(gross)) h += '<br>Net: ' + IG.fmtRate(rate);
    h += '<br>Produced this run: ' + IG.fmt(s.run.produced[r]);
    return h;
  }

  // ---------------------------------------------------------------- sidebar
  function buildEraCard() {
    const s = IG.state, C = IG.CONFIG;
    const key = s.run.era + '|' + C.eras.length;
    const card = refs.eraCard;
    if (key !== eraKey) {
      eraKey = key;
      clear(card);
      const e = C.eras[s.run.era];
      card.appendChild(el('div', { class: 'era-title' }, [IG.icons.node('era_' + e.id), el('span', { text: e.name })]));
      card.appendChild(el('div', { class: 'era-desc', text: e.desc }));
      refs.msList = el('div', { class: 'ms-list' });
      refs.msRows = [];
      refs.advBtn = null;
      const nextE = C.eras[s.run.era + 1];
      if (e.milestone && e.milestone.length) {
        const head = e.autoAdvance ? e.autoAdvanceText : nextE ? 'To reach the ' + nextE.name + ':' : 'Milestone:';
        card.appendChild(el('div', { class: 'ms-head', text: head }));
        card.appendChild(refs.msList);
        refs.msRows = IG.Eras.progress().map((p) => {
          const bar = el('div', { class: 'bar-fill' });
          const lbl = el('span', { class: 'ms-label' });
          const row = el('div', { class: 'ms-row' }, [lbl, el('div', { class: 'bar' }, [bar])]);
          refs.msList.appendChild(row);
          return { row, bar, lbl };
        });
      }
      if (nextE && !e.autoAdvance) {
        refs.advBtn = el('button', { class: 'btn primary advance', on: { click: () => IG.Eras.advance() } },
          'Advance to the ' + nextE.name);
        card.appendChild(refs.advBtn);
      }
      if (!nextE) card.appendChild(el('div', { class: 'ms-head muted', text: C.endText || 'The road beyond is shrouded. More ages await.' }));
    }
    if (refs.msRows && refs.msRows.length) {
      const prog = IG.Eras.progress();
      prog.forEach((p, i) => {
        const r = refs.msRows[i];
        if (!r) return;
        setText(r.lbl, p.label);
        setStyle(r.bar, 'width', (p.frac * 100).toFixed(1) + '%');
        toggle(r.row, 'done', p.done);
      });
      if (refs.advBtn) {
        const ok = IG.Eras.canAdvance();
        refs.advBtn.disabled = !ok;
        toggle(refs.advBtn, 'pulse', ok);
      }
    }
  }

  function buildResPanel() {
    const list = unlockedResources();
    const key = list.join(',');
    if (key !== refs.resPanelKey) {
      refs.resPanelKey = key;
      clear(refs.resPanel);
      refs.resRows = {};
      refs.resPanel.appendChild(el('div', { class: 'panel-title', text: 'Stores' }));
      for (const r of list) {
        const d = IG.CONFIG.resources[r];
        const amt = el('span', { class: 'amt' });
        const rate = el('span', { class: 'rate' });
        const row = el('div', { class: 'res-row', style: { '--rc': d.color }, tip: () => resourceTip(r) },
          [IG.icons.node(r), el('span', { class: 'name', text: d.name }), amt, rate]);
        refs.resPanel.appendChild(row);
        refs.resRows[r] = { amt, rate };
      }
    }
    const s = IG.state;
    for (const r in refs.resRows) {
      setText(refs.resRows[r].amt, IG.fmt(s.run.resources[r]));
      const rt = IG.Prod.cache.rates[r];
      setText(refs.resRows[r].rate, rt && !rt.eq(0) ? IG.fmtRate(rt) : '');
    }
  }

  function logEntryNode(e) {
    return el('div', { class: 'log-entry ' + e.cls }, [
      el('span', { class: 'log-t', text: IG.fmtTime(e.t) }), el('span', { class: 'log-m', text: e.msg })]);
  }

  function rebuildLog() {
    clear(refs.log);
    const entries = IG.state.log.slice(-80).reverse();
    for (const e of entries) refs.log.appendChild(logEntryNode(e));
    logBuilt = true;
  }

  function onLog(entry) {
    if (!logBuilt) return;
    refs.log.insertBefore(logEntryNode(entry), refs.log.firstChild);
    while (refs.log.childNodes.length > 80) refs.log.removeChild(refs.log.lastChild);
  }

  // ---------------------------------------------------------------- modals & toasts
  // opts: {title, body (node|string), buttons:[{text, cls, onClick(close) }], wide, onClose}
  function modal(opts) {
    const root = refs.modalRoot;
    const box = el('div', { class: 'modal' + (opts.wide ? ' wide' : '') + (opts.cls ? ' ' + opts.cls : '') });
    const back = el('div', { class: 'modal-back' }, [box]);
    function close() {
      back.classList.add('closing');
      setTimeout(() => back.remove(), 180);
      if (opts.onClose) opts.onClose();
    }
    if (opts.title) box.appendChild(el('h2', { html: opts.title }));
    const body = el('div', { class: 'modal-body' });
    if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);
    box.appendChild(body);
    const btns = el('div', { class: 'modal-btns' });
    for (const b of (opts.buttons || [{ text: 'Close' }])) {
      btns.appendChild(el('button', { class: 'btn ' + (b.cls || ''), on: { click: () => { if (b.onClick) { if (b.onClick(close) === false) return; } close(); } } }, b.text));
    }
    box.appendChild(btns);
    back.addEventListener('mousedown', (e) => { if (e.target === back && !opts.sticky) close(); });
    root.appendChild(back);
    return { close, box };
  }

  function confirm(title, text, yes, onYes) {
    return modal({ title, body: text, buttons: [
      { text: 'Cancel' },
      { text: yes || 'Confirm', cls: 'danger', onClick: onYes },
    ] });
  }

  function toast(msg, cls) {
    const t = el('div', { class: 'toast ' + (cls || ''), html: msg });
    refs.toasts.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  }

  // ---------------------------------------------------------------- main
  function init() {
    refs.tabbar = document.getElementById('tabbar');
    refs.content = document.getElementById('tab-content');
    refs.resBar = document.getElementById('res-bar');
    refs.eraBadge = document.getElementById('era-badge');
    refs.ppChip = document.getElementById('pp-chip');
    refs.eraCard = document.getElementById('era-card');
    refs.resPanel = document.getElementById('res-panel');
    refs.log = document.getElementById('log');
    refs.modalRoot = document.getElementById('modal-root');
    refs.toasts = document.getElementById('toasts');
    refs.ppChip.innerHTML = IG.icons.html('pp') + '<span class="amt">0</span>';
    refs.ppChip._tip = () => '<b>Echoes of Memory</b><br>Prestige points to spend in the Power Tree.<br>Lifetime earned: ' + IG.fmtInt(IG.state.perm.ppTotal) +
      (IG.Prestige.canPrestige() ? '<br>Prestige now for <b>+' + IG.fmtInt(IG.Prestige.gain()) + '</b>' : '') + '<br><span class="muted">Click to open the Power Tree.</span>';
    refs.ppChip.addEventListener('click', () => switchTab('powertree'));
    document.getElementById('btn-save').addEventListener('click', () => { if (IG.Save.save()) toast('Game saved.'); });
    IG.Bus.on('log', onLog);
    IG.Bus.on('structure', () => { dirty = true; });
    IG.Bus.on('era', () => { dirty = true; eraKey = ''; tabbarKey = ''; });
    IG.dom.initTooltips();
    rebuildAll();
  }

  function rebuildAll() {
    dirty = true; tabbarKey = ''; resKey = ''; eraKey = ''; refs.resPanelKey = '';
    rebuildLog();
    if (!tabs.find((t) => t.id === current() && t.isUnlocked())) IG.state.ui.tab = 'production';
  }

  function refresh() {
    buildTabbar();
    buildHeader();
    buildEraCard();
    buildResPanel();
    const t = tabs.find((x) => x.id === current());
    if (!t) return;
    if (dirty) {
      dirty = false;
      clear(refs.content);
      refs.content.className = 'tab-' + t.id;
      t.build(refs.content);
    }
    if (t.update) t.update();
    IG.dom.refreshTip();
  }

  IG.UI = { headerExtras, registerTab, switchTab, init, refresh, rebuildAll, modal, confirm, toast, current, tabs,
    markDirty() { dirty = true; }, resetEraCard() { eraKey = ''; }, unlockedResources };
})();
