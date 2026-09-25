'use strict';
// Synthesized sound effects (Web Audio API) — no audio files. Honors settings.mute and settings.volume.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  let ctx = null, master = null;
  const lastPlayed = {};
  const MIN_GAP = { buy: 0.05, forage: 0.04, ship: 0.2, upgrade: 0.08 };

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    applyVolume();
    return ctx;
  }

  function applyVolume() {
    if (!master) return;
    const s = IG.state.settings;
    master.gain.value = s.mute ? 0 : Math.max(0, Math.min(1, s.volume)) * 0.5;
  }

  // one oscillator note with an ADSR-ish envelope
  function tone(freq, t0, dur, type, vol, slideTo) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + Math.min(0.02, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function noise(t0, dur, vol, fromHz, toHz) {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(fromHz, t0);
    f.frequency.exponentialRampToValueAtTime(toHz, t0 + dur);
    f.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  const SOUNDS = {
    forage(t) { tone(260 + Math.random() * 60, t, 0.07, 'triangle', 0.12, 180); },
    buy(t) { tone(660, t, 0.06, 'square', 0.05); tone(990, t + 0.04, 0.07, 'square', 0.04); },
    upgrade(t) { [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.05, 0.14, 'triangle', 0.1)); },
    research(t) { tone(880, t, 0.25, 'sine', 0.12); tone(1320, t + 0.08, 0.35, 'sine', 0.09); },
    ship(t) { noise(t, 0.5, 0.12, 400, 2400); },
    achievement(t) { [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.07, 0.3, 'triangle', 0.12)); },
    era(t) {
      [220, 277, 330, 440].forEach((f, i) => tone(f, t + i * 0.12, 2.2 - i * 0.2, 'sawtooth', 0.05));
      tone(110, t, 2.5, 'sine', 0.18);
      noise(t, 1.8, 0.05, 200, 3000);
    },
    prestige(t) {
      tone(70, t, 2.8, 'sine', 0.35, 35);
      noise(t, 2.2, 0.1, 1200, 90);
      [1568, 1319, 1047, 880, 784].forEach((f, i) => tone(f, t + 0.8 + i * 0.18, 0.9, 'triangle', 0.06));
    },
    frontWon(t) { [392, 523, 659, 784].forEach((f, i) => tone(f, t + i * 0.1, 0.35, 'square', 0.06)); tone(196, t, 0.8, 'sawtooth', 0.06); },
    frontLost(t) { tone(220, t, 0.9, 'sawtooth', 0.09, 70); noise(t, 0.7, 0.08, 800, 100); },
    welcome(t) { [262, 330, 392].forEach((f) => tone(f, t, 1.4, 'sine', 0.08)); },
    click(t) { tone(1200, t, 0.03, 'square', 0.03); },
  };

  function play(name) {
    const s = IG.state && IG.state.settings;
    if (!s || s.mute || s.volume <= 0) return;
    if (!ensure() || !SOUNDS[name]) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    const gap = MIN_GAP[name] || 0.03;
    if (lastPlayed[name] && t - lastPlayed[name] < gap) return;
    lastPlayed[name] = t;
    try { SOUNDS[name](t + 0.01); } catch (e) { /* audio is best-effort */ }
  }

  function init() {
    // browsers only allow audio after a user gesture
    const unlock = () => { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    const KIND = { gen: 'buy', upgrade: 'upgrade', research: 'research', node: 'upgrade', agent: 'upgrade', agentUp: 'upgrade', agentPromote: 'upgrade',
      trade: 'buy', grid: 'buy', rite: 'research', ship: 'ship' };
    IG.Bus.on('purchase', (d) => play(KIND[d.kind] || 'buy'));
    IG.Bus.on('forage', () => play('forage'));
    IG.Bus.on('era', () => play('era'));
    IG.Bus.on('prestige', () => play('prestige'));
    IG.Bus.on('achievement', () => play('achievement'));
    IG.Bus.on('frontWon', () => play('frontWon'));
    IG.Bus.on('frontLost', () => play('frontLost'));
    IG.Bus.on('milestone', () => play('achievement'));
    IG.Bus.on('sfx', (n) => play(n));
    IG.Bus.on('settings', (k) => { if (k === 'mute' || k === 'volume') applyVolume(); });
    IG.Bus.on('loaded', applyVolume);
  }

  IG.Audio = { init, play, applyVolume };
})();
