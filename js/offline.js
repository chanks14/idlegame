'use strict';
// Offline progress / throttled-tab catch-up: simulate a long gap in large steps and summarize gains.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  function capSeconds() {
    const hours = IG.CONFIG.offline.baseCapHours + IG.Mods.get().offlineCap;
    return hours * 3600;
  }

  function snapshot() {
    const s = IG.state;
    const snap = { res: {}, era: s.run.era, gens: IG.Prod.totalGenerators(), research: IG.Research.count() };
    for (const r in s.run.produced) snap.res[r] = D(s.run.produced[r]);
    snap.worlds = IG.Expansion ? IG.Expansion.totalWorlds() : 0;
    snap.frontsWon = s.perm.stats.frontsWon;
    snap.frontsLost = s.perm.stats.frontsLost;
    snap.achievements = Object.keys(s.perm.achievements).length;
    return snap;
  }

  const Offline = {
    collecting: false,
    logs: [],
    capSeconds,
    noteLog(entry) { if (Offline.logs.length < 200) Offline.logs.push(entry); },

    // Simulate `seconds` of game time. Returns a summary object.
    simulate(seconds, opts) {
      opts = opts || {};
      const O = IG.CONFIG.offline;
      const cap = opts.uncapped ? Infinity : capSeconds();
      const total = Math.min(seconds, cap);
      const before = snapshot();
      let step = Math.max(O.minStepSeconds, total / O.maxSteps);
      step = Math.min(step, O.maxStepSeconds);
      let steps = Math.ceil(total / step);
      if (steps > O.maxSteps * 4) { steps = O.maxSteps * 4; step = total / steps; }
      const wasMuted = IG.Bus.muted;
      IG.Bus.muted = true;
      Offline.collecting = true;
      Offline.logs = [];
      let left = total;
      try {
        for (let i = 0; i < steps && left > 1e-9; i++) {
          const dt = Math.min(step, left);
          IG.Game.tick(dt);
          left -= dt;
        }
      } finally {
        IG.Bus.muted = wasMuted;
        Offline.collecting = false;
      }
      const after = snapshot();
      const gains = {};
      for (const r in after.res) {
        const g = after.res[r].sub(before.res[r]);
        if (g.gt(0)) gains[r] = g;
      }
      const summary = {
        away: seconds,
        simulated: total,
        capped: seconds > total,
        gains,
        eraFrom: before.era, eraTo: after.era,
        gens: after.gens - before.gens,
        research: after.research - before.research,
        worlds: after.worlds - before.worlds,
        frontsWon: after.frontsWon - before.frontsWon,
        frontsLost: after.frontsLost - before.frontsLost,
        achievements: after.achievements - before.achievements,
        logs: Offline.logs.slice(-8),
      };
      IG.Bus.emit('structure');
      return summary;
    },
  };

  IG.Offline = Offline;
})();
