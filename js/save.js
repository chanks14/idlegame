'use strict';
// Save system: localStorage autosave, manual save, export/import strings, hard reset, versioned migrations.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  // Bump whenever the save format changes, and add a migration from the previous version below.
  const SAVE_VERSION = 2;
  const KEY = 'undyingHand.save';

  // migrations[v] upgrades a raw save object from version v to v+1.
  const migrations = {
    // v1 → v2: Decimals are now stored exactly as [mantissa, exponent] (deserialize() still reads the old
    // string form, so no data change is needed); war state gained `scale`, expansion gained `captured`.
    1: (raw) => {
      if (raw.run && raw.run.exp && raw.run.exp.captured === undefined) raw.run.exp.captured = 0;
      return raw;
    },
  };

  function migrate(raw) {
    let v = raw.version || 1;
    while (v < SAVE_VERSION) {
      const fn = migrations[v];
      if (fn) raw = fn(raw) || raw;
      v++;
      raw.version = v;
    }
    return raw;
  }

  // JSON with exact Decimal markers: {"$d": [mantissa, exponent]} (older saves used {"$d": "1.5e400"})
  function serialize(state) {
    return JSON.stringify(state, function (key, value) {
      const orig = this[key];
      if (orig instanceof Decimal) return { $d: [orig.mantissa, orig.exponent] };
      return value;
    });
  }

  function deserialize(str) {
    return JSON.parse(str, function (key, value) {
      if (value && typeof value === 'object' && value.$d !== undefined && Object.keys(value).length === 1) {
        const d = value.$d;
        return Array.isArray(d) ? Decimal.fromMantissaExponent(d[0], d[1]) : new Decimal(d);
      }
      return value;
    });
  }

  function storage() {
    try { return globalThis.localStorage || null; } catch (e) { return null; }
  }

  // Build a full state from a raw (possibly old/partial) save object.
  function hydrate(raw) {
    raw = migrate(raw);
    const fresh = IG.State.newState();
    const merged = IG.util.mergeDefaults(fresh, raw);
    // run.gens must contain every generator in config
    const run = merged.run;
    for (const id in IG.CONFIG.generators) if (!run.gens[id]) run.gens[id] = { n: 0, up: 0 };
    for (const r in IG.CONFIG.resources) {
      if (!(run.resources[r] instanceof Decimal)) run.resources[r] = IG.D(run.resources[r] || 0);
      if (!(run.produced[r] instanceof Decimal)) run.produced[r] = IG.D(run.produced[r] || 0);
      const life = merged.perm.stats.lifetime;
      if (!(life[r] instanceof Decimal)) life[r] = IG.D(life[r] || 0);
    }
    merged.version = SAVE_VERSION;
    for (const fn of Save.onHydrate) fn(merged);
    return merged;
  }

  const Save = {
    SAVE_VERSION, KEY, migrations, serialize, deserialize, hydrate, migrate,
    onHydrate: [],
    lastSaved: 0,

    save() {
      const ls = storage();
      if (!ls || !IG.state || Save.blocked) return false;
      IG.state.meta.lastSeen = IG.util.now();
      try {
        ls.setItem(KEY, serialize(IG.state));
        Save.lastSaved = IG.util.now();
        IG.Bus.emit('saved');
        return true;
      } catch (e) {
        console.error('Save failed', e);
        return false;
      }
    },

    // Returns the loaded state or null.
    load() {
      const ls = storage();
      if (!ls) return null;
      const str = ls.getItem(KEY);
      if (!str) return null;
      try {
        return hydrate(deserialize(str));
      } catch (e) {
        console.error('Load failed; keeping a backup copy', e);
        try { ls.setItem(KEY + '.corrupt', str); } catch (e2) { /* ignore */ }
        return null;
      }
    },

    exportString() {
      IG.state.meta.lastSeen = IG.util.now();
      const json = serialize(IG.state);
      return btoa(unescape(encodeURIComponent(json)));
    },

    // Returns the hydrated state, throws on invalid input.
    importString(str) {
      const trimmed = (str || '').trim();
      let json;
      try { json = decodeURIComponent(escape(atob(trimmed))); } catch (e) { json = trimmed; }
      const raw = deserialize(json);
      if (!raw || !raw.run || !raw.perm) throw new Error('Not a valid save');
      return hydrate(raw);
    },

    wipe() {
      const ls = storage();
      if (ls) ls.removeItem(KEY);
    },
  };

  IG.SAVE_VERSION = SAVE_VERSION;
  IG.Save = Save;
})();
