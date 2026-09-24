'use strict';
// Number and time formatting. Honors state.settings.numberFormat: 'suffix' | 'scientific' | 'engineering'.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const D = IG.D;

  const BASIC = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
  const UNITS = ['', 'U', 'D', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'O', 'N'];
  const TENS = ['', 'Dc', 'Vg', 'Tg', 'Qd', 'Qn', 'Sxg', 'Spg', 'Ocg', 'Nog'];
  const HUNDREDS = ['', 'Ce', 'Dce', 'Tce', 'Qace', 'Qice', 'Sxce', 'Spce', 'Oce', 'Noce'];

  // Suffix for 10^(3*n).
  function suffixFor(n) {
    if (n < BASIC.length) return BASIC[n];
    const i = n - 1; // i >= 10
    if (i >= 1000) return null;
    return UNITS[i % 10] + TENS[Math.floor(i / 10) % 10] + HUNDREDS[Math.floor(i / 100)];
  }

  function mode() {
    return (IG.state && IG.state.settings && IG.state.settings.numberFormat) || 'suffix';
  }

  function small(v, places) {
    // v is a plain number < 1000 in magnitude
    const a = Math.abs(v);
    if (a === 0) return '0';
    if (places !== undefined) return v.toFixed(places);
    if (a < 10) return trimZeros(v.toFixed(2));
    if (a < 100) return trimZeros(v.toFixed(1));
    return Math.floor(v).toString();
  }

  function trimZeros(s) {
    if (s.indexOf('.') < 0) return s;
    return s.replace(/\.?0+$/, '');
  }

  // Format any number/Decimal for display.
  function fmt(x, opts) {
    const d = D(x);
    if (!isFinite(d.mantissa) || isNaN(d.mantissa)) return '∞';
    const neg = d.lt(0);
    const a = neg ? d.neg() : d;
    let out;
    if (a.lt(1000)) {
      out = small(a.toNumber(), opts && opts.places);
    } else {
      let e = a.exponent;
      let m = a.mantissa;
      // carry rounding (9.999 → 10.00) into the exponent before choosing the display unit
      if (parseFloat(m.toFixed(2)) >= 10) { m /= 10; e += 1; }
      const f = mode();
      if (f === 'scientific') {
        out = m.toFixed(2) + 'e' + e;
      } else {
        let n = Math.floor(e / 3);
        let mm = m * Math.pow(10, e - n * 3);
        let str = mm >= 100 ? mm.toFixed(1) : mm.toFixed(2);
        if (parseFloat(str) >= 1000) { n += 1; mm /= 1000; str = mm.toFixed(2); }
        if (f === 'engineering') {
          out = str + 'e' + (n * 3);
        } else {
          const sfx = suffixFor(n);
          out = sfx === null ? m.toFixed(2) + 'e' + e : str + sfx;
        }
      }
    }
    return neg ? '-' + out : out;
  }

  // Whole-number display for counts (generators, worlds).
  function fmtInt(x) {
    const d = D(x);
    if (d.lt(1e6)) return Math.floor(d.toNumber()).toLocaleString('en-US');
    return fmt(d);
  }

  function fmtRate(x) { return fmt(x) + '/s'; }

  function fmtMult(x) {
    const d = D(x);
    if (d.lt(1000)) return '×' + small(d.toNumber());
    return '×' + fmt(d);
  }

  function fmtPct(x, places) {
    return (x * 100).toFixed(places === undefined ? 0 : places) + '%';
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    if (!isFinite(sec)) return '∞';
    const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600);
    const m = Math.floor(sec % 3600 / 60), s = sec % 60;
    if (d > 0) return d + 'd ' + h + 'h ' + m + 'm';
    if (h > 0) return h + 'h ' + m + 'm ' + s + 's';
    if (m > 0) return m + 'm ' + s + 's';
    return s + 's';
  }

  IG.fmt = fmt;
  IG.fmtInt = fmtInt;
  IG.fmtRate = fmtRate;
  IG.fmtMult = fmtMult;
  IG.fmtPct = fmtPct;
  IG.fmtTime = fmtTime;
  IG.format = { fmt, fmtInt, fmtRate, fmtMult, fmtPct, fmtTime, suffixFor };
})();
