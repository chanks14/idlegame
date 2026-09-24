'use strict';
// Event bus (systems -> UI) and the persistent event log.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  const handlers = {};
  const Bus = {
    muted: false, // offline simulation mutes juice-type events
    on(evt, fn) { (handlers[evt] || (handlers[evt] = [])).push(fn); },
    emit(evt, data) {
      if (Bus.muted) return;
      const list = handlers[evt];
      if (!list) return;
      for (let i = 0; i < list.length; i++) {
        try { list[i](data); } catch (e) { console.error('Bus handler error', evt, e); }
      }
    },
  };

  // cls: 'era' | 'milestone' | 'achievement' | 'war' | 'flavor' | 'system' | 'prestige' | 'warn'
  const Log = {
    add(msg, cls) {
      const s = IG.state;
      if (!s) return;
      const entry = { t: s.meta.playtime, msg, cls: cls || 'flavor' };
      s.log.push(entry);
      const max = IG.CONFIG.ui.logMax;
      if (s.log.length > max) s.log.splice(0, s.log.length - max);
      if (!Bus.muted) Bus.emit('log', entry);
      else if (IG.Offline && IG.Offline.collecting && entry.cls !== 'flavor') IG.Offline.noteLog(entry);
    },
  };

  IG.Bus = Bus;
  IG.Log = Log;
})();
