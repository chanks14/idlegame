'use strict';
// Boot: load or create state, apply offline progress, start loop + UI refresh, wire hotkeys.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  let uiTimer = null;

  function loadState(state, fromImport) {
    IG.state = state;
    IG.Game.refresh();
    if (IG.UI.rebuildAll) IG.UI.rebuildAll();
    IG.Loop.resetClock();
    if (fromImport) IG.Save.save();
    IG.Bus.emit('loaded');
  }

  function hardReset() {
    IG.Save.wipe();
    IG.Save.blocked = true;
    IG.Game.newGame();
    IG.Save.blocked = false;
    IG.Save.save();
    IG.UI.rebuildAll();
    IG.Log.add('A stranger wakes beside a dying fire, remembering nothing.', 'era');
    IG.UI.toast('All progress erased.');
  }

  function offlineOnLoad() {
    const s = IG.state;
    const away = (IG.util.now() - (s.meta.lastSeen || IG.util.now())) / 1000;
    if (away >= 5) {
      const sum = IG.Offline.simulate(away);
      if (away >= IG.CONFIG.loop.welcomeBackMin) setTimeout(() => IG.UI.welcomeBack(sum), 300);
    }
  }

  // ------------------------------------------------------------------ hotkeys
  let typed = '';
  function onKey(e) {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    typed = (typed + k.toLowerCase()).slice(-4);
    if (typed === 'aeon') { typed = ''; IG.Dev.enable(); return; }
    if (k === '`') { IG.Dev.toggle(); return; }
    if (k === 'Escape') {
      const backs = document.querySelectorAll('.modal-back');
      if (backs.length) backs[backs.length - 1].remove();
      return;
    }
    if (document.querySelector('.modal-back')) return;
    if (k === ' ' || k === 'f' || k === 'F') {
      if (IG.state.run.era >= 0) { e.preventDefault(); IG.Prod.forage(1); }
      return;
    }
    if (k === 'b' || k === 'B') { IG.UI.cycleBuyMode(); IG.UI.toast('Buy ' + (IG.state.settings.buyMult === 'max' ? 'Max' : 'x' + IG.state.settings.buyMult)); return; }
    if (k === 's' || k === 'S') { if (IG.Save.save()) IG.UI.toast('Game saved.'); return; }
    if (k === 'a' || k === 'A') { IG.Eras.advance(); return; }
    if (k === 'r' || k === 'R') { const id = IG.Research.cheapestAffordable(); if (id) IG.Research.buy(id); return; }
    if (k === 'p' || k === 'P') { IG.Agents.setPaused(!IG.Agents.paused()); IG.UI.toast(IG.Agents.paused() ? 'Agents paused' : 'Agents resumed'); return; }
    if (k === 'm' || k === 'M') { IG.state.settings.mute = !IG.state.settings.mute; IG.Bus.emit('settings', 'mute'); IG.UI.toast(IG.state.settings.mute ? 'Muted' : 'Sound on'); return; }
    if (k >= '1' && k <= '9') {
      const visible = IG.UI.tabs.filter((t) => t.isUnlocked());
      const t = visible[parseInt(k, 10) - 1];
      if (t) IG.UI.switchTab(t.id);
    }
  }

  function boot() {
    const loaded = IG.Save.load();
    if (loaded) {
      IG.state = loaded;
      IG.Game.refresh();
    } else {
      IG.Game.newGame();
      IG.Log.add('A stranger wakes beside a dying fire. The tribe does not know your name. They will.', 'era');
    }
    if (/[?&]dev=1/.test(location.search)) IG.state.meta.devMode = true;
    IG.UI.init();
    IG.Juice.init();
    if (IG.Audio) IG.Audio.init();
    if (loaded) offlineOnLoad();
    IG.Loop.start();
    document.addEventListener('keydown', onKey);
    uiTimer = setInterval(() => {
      try { IG.UI.refresh(); } catch (err) { console.error(err); }
    }, 1000 / IG.CONFIG.ui.refreshHz);
    IG.UI.refresh();
    if (IG.state.meta.devMode) IG.UI.toast('Developer mode — press ` for the panel.');
  }

  IG.Main = { boot, loadState, hardReset };
  window.addEventListener('DOMContentLoaded', boot);
})();
