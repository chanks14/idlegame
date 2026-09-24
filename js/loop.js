'use strict';
// Browser game loop: fixed 20 ticks/s driven by real elapsed time; large gaps (throttled/background tab,
// sleep) are handled by the large-step offline simulation.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  let last = 0;
  let acc = 0;
  let autosaveAcc = 0;
  let timer = null;

  function frame() {
    const C = IG.CONFIG;
    const nowMs = IG.util.now();
    let elapsed = (nowMs - last) / 1000;
    last = nowMs;
    if (!(elapsed >= 0)) elapsed = 0;

    if (elapsed > C.loop.catchupThreshold) {
      const summary = IG.Offline.simulate(elapsed);
      if (elapsed >= C.loop.welcomeBackMin) IG.Bus.emit('welcomeBack', summary);
      acc = 0;
    } else {
      acc += elapsed;
      const step = 1 / C.tickRate;
      let n = 0;
      while (acc >= step && n < C.loop.maxTicksPerFrame) {
        IG.Game.tick(step);
        acc -= step;
        n++;
      }
      if (acc > step * C.loop.maxTicksPerFrame) {
        IG.Offline.simulate(acc, { uncapped: true });
        acc = 0;
      }
    }

    autosaveAcc += elapsed;
    if (autosaveAcc >= C.autosaveSeconds) {
      autosaveAcc = 0;
      IG.Save.save();
    }
    IG.state.meta.lastSeen = nowMs;
  }

  const Loop = {
    start() {
      last = IG.util.now();
      acc = 0;
      if (timer) clearInterval(timer);
      timer = setInterval(frame, 1000 / IG.CONFIG.tickRate);
      // catch up immediately when the tab becomes visible again
      document.addEventListener('visibilitychange', () => { if (!document.hidden) frame(); });
      window.addEventListener('beforeunload', () => IG.Save.save());
    },
    resetClock() { last = IG.util.now(); acc = 0; },
  };
  IG.Loop = Loop;
})();
