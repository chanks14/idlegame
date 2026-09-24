'use strict';
// Human-readable effect descriptions and "current → after purchase" tooltip lines.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  const LABELS = {
    global: 'All production', click: 'Forage gains', clickRate: 'Forage grants seconds of production',
    agentSpeed: 'Agent speed', agentCost: 'Agent costs', agentPower: 'Agent bulk actions', offlineCap: 'Offline cap (hours)',
    ppMult: 'Prestige points gained', synergyMult: 'Synergy strength', researchCost: 'Research costs',
    eraReq: 'Era milestone resource requirements', tradeMult: 'Trade route power', tradeCost: 'Trade route costs',
    riteMult: 'Rite power', riteDuration: 'Rite duration', riteCost: 'Rite costs', gridDrain: 'Grid upkeep',
    gridMult: 'Grid power', computeMult: 'Compute program power', megaCost: 'Megaproject costs',
    shipCost: 'Colony ship cost', shipSpeed: 'Colony ship speed', colonyYield: 'Worlds claimed per ship',
    maturation: 'World maturation speed', worldBonus: 'Per-world bonus to older industries', launchBatch: 'Ships per launch',
    worldOutput: 'World output', fleetPower: 'Fleet power', materiel: 'Materiel production', attrition: 'Attrition suffered',
    yardRate: 'Shipyard & barracks output', frontSpeed: 'Front advance speed', enemyStrength: 'Enemy strength',
    captureMult: 'Worlds captured per victory', lossMult: 'Worlds lost per defeat',
  };
  const ADD_PCT = { colonyYield: false, clickRate: false, offlineCap: false, agentPower: false, worldBonus: true, launchBatch: false };

  function targetName(e) {
    const C = IG.CONFIG;
    if (e.gen) {
      const ids = Array.isArray(e.gen) ? e.gen : [e.gen];
      return ids.map((g) => (C.generators[g] ? C.generators[g].name : g)).join(' & ') + ' output';
    }
    let parts = [];
    if (e.era !== undefined) {
      const eras = Array.isArray(e.era) ? e.era : [e.era];
      parts.push(eras.map((x) => C.eras[x] ? C.eras[x].name : 'Era ' + x).join(' & '));
    }
    if (e.res) parts.push(C.resources[e.res] ? C.resources[e.res].name : e.res);
    if (!parts.length) return 'All generator output';
    return parts.join(' ') + ' production';
  }

  function unlockName(key) {
    const u = IG.CONFIG.unlockNames && IG.CONFIG.unlockNames[key];
    return u || key;
  }

  // Value text for an effect at a level. Returns {label, value}
  function effectParts(e, level) {
    const lv = level === undefined ? 1 : level;
    const C = IG.CONFIG;
    switch (e.type) {
      case 'prod': return { label: targetName(e), value: IG.fmtMult(IG.D(e.mult).pow(lv)) };
      case 'cost': return { label: (e.gen ? C.generators[e.gen].name : targetName(e).replace(' production', '')) + ' costs', value: IG.fmtMult(Math.pow(e.mult, lv)) };
      case 'clickRate': return { label: 'Each forage also yields', value: '+' + (Math.round(e.add * lv * 100) / 100) + 's of production' };
      case 'unlock': return { label: 'Unlocks ' + unlockName(e.key), value: lv > 0 ? '✓' : '—' };
      case 'startRes': return { label: 'Start each run with ' + C.resources[e.res].name, value: IG.fmt(e.amount * lv) };
      case 'hab': return { label: 'Habitability' + (e.planet ? ' of ' + C.expansion.planets[e.planet].name + ' worlds' : ' of all worlds'), value: '+' + (e.add * lv).toFixed(2) };
      case 'counter': return { label: 'Fleet power vs ' + C.war.factions[e.faction].name, value: IG.fmtMult(Math.pow(e.mult, lv)) };
      case 'unitPower': return { label: (e.unit === 'warship' ? 'Warship' : 'Legion') + ' power', value: IG.fmtMult(IG.D(e.mult).pow(lv)) };
      default: {
        const label = LABELS[e.type] || e.type;
        if (e.add !== undefined) {
          const v = e.add * lv;
          return { label, value: ADD_PCT[e.type] ? '+' + (v * 100).toFixed(1) + '%' : '+' + (Math.round(v * 100) / 100) };
        }
        return { label, value: IG.fmtMult(IG.D(e.mult).pow(lv)) };
      }
    }
  }

  function effectText(e, level) {
    const p = effectParts(e, level);
    return p.label + ' ' + p.value;
  }

  // Tooltip lines showing each effect now vs after one more level.
  function effectsTip(effects, cur, next) {
    let h = '';
    for (const e of effects) {
      const a = effectParts(e, cur), b = effectParts(e, next);
      if (e.type === 'unlock') { h += '• ' + b.label + (cur > 0 ? ' <span class="ok">(done)</span>' : '') + '<br>'; continue; }
      h += '• ' + a.label + ': <span class="muted">' + (cur > 0 ? a.value : 'none') + '</span> → <b>' + b.value + '</b><br>';
    }
    return h;
  }

  function effectsSummary(effects, level) {
    return effects.map((e) => effectText(e, level)).join(' · ');
  }

  IG.describe = { effectText, effectsTip, effectsSummary, effectParts, LABELS };
})();
