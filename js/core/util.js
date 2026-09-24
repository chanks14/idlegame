'use strict';
// Core helpers shared by every module. No DOM access here.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  const ZERO = new Decimal(0);
  const ONE = new Decimal(1);

  // Coerce anything numeric into a Decimal (returns the same instance if already one).
  function D(x) {
    if (x instanceof Decimal) return x;
    if (x === undefined || x === null) return new Decimal(0);
    return new Decimal(x);
  }

  function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }

  // log10 of a Decimal that is safe for zero/negative values (returns 0).
  function log10(x) {
    const d = D(x);
    if (d.lte(0)) return 0;
    return d.log10();
  }

  // Deterministic PRNG (mulberry32) so galaxy/name generation is stable per seed.
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Deep clone for plain JSON-ish data that may contain Decimals.
  function clone(obj) {
    if (obj instanceof Decimal) return new Decimal(obj);
    if (Array.isArray(obj)) return obj.map(clone);
    if (obj && typeof obj === 'object') {
      const out = {};
      for (const k in obj) out[k] = clone(obj[k]);
      return out;
    }
    return obj;
  }

  // Merge `saved` onto `defaults`: keeps new default keys, overwrites with saved values.
  // Decimal defaults coerce saved strings/numbers into Decimals.
  function mergeDefaults(defaults, saved) {
    if (saved === undefined || saved === null) return defaults;
    if (defaults instanceof Decimal) {
      try { return D(saved); } catch (e) { return defaults; }
    }
    if (Array.isArray(defaults)) return Array.isArray(saved) ? saved : defaults;
    if (defaults && typeof defaults === 'object') {
      if (typeof saved !== 'object') return defaults;
      const out = defaults;
      for (const k in saved) {
        if (k in defaults) out[k] = mergeDefaults(defaults[k], saved[k]);
        else out[k] = saved[k];
      }
      return out;
    }
    return typeof saved === typeof defaults || defaults === null ? saved : defaults;
  }

  // Seconds-based "now" for the simulation clock (overridable by the headless sim).
  function now() { return Date.now(); }

  function pick(arr, r) { return arr[Math.floor((r === undefined ? Math.random() : r) * arr.length) % arr.length]; }

  IG.D = D;
  IG.ZERO = ZERO;
  IG.ONE = ONE;
  IG.util = { D, clamp, log10, rng, clone, mergeDefaults, now, pick };
})();
