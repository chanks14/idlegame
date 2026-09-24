'use strict';
// War tab: empire totals, fleet, fronts with allocation sliders, galaxy with faction territories and front lines.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const { el, setText, setHTML, toggle, setStyle } = IG.dom;

  let refs = null;
  let factionLayer = null, factionKey = '';

  function factionIndex(fid) { return Object.keys(IG.CONFIG.war.factions).indexOf(fid); }

  // Sector of the galaxy (angle around the homeworld) owned by each faction; fronts split their faction's sector.
  function sectorFor(front) {
    const F = Object.keys(IG.CONFIG.war.factions);
    const nf = F.length;
    const fi = factionIndex(front.faction);
    const a0 = -Math.PI + fi * 2 * Math.PI / nf, a1 = a0 + 2 * Math.PI / nf;
    const same = IG.state.run.war.fronts.filter((f) => f.faction === front.faction);
    const k = same.indexOf(front);
    const w = (a1 - a0) / same.length;
    return [a0 + w * k + 0.04, a0 + w * (k + 1) - 0.04];
  }

  function overlay(ctx, v) {
    if (!IG.War.active()) return;
    const m = v.model, K = v.K;
    const F = IG.CONFIG.war.factions, fids = Object.keys(F);
    // cached faction tint over unclaimed stars
    const key = K + '|' + v.W + 'x' + v.H;
    if (key !== factionKey) {
      factionKey = key;
      factionLayer = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      factionLayer.width = v.W * dpr; factionLayer.height = v.H * dpr;
      const c = factionLayer.getContext('2d');
      c.scale(dpr, dpr);
      c.globalCompositeOperation = 'lighter';
      for (let k = K; k < m.N; k += 1) {
        const i = m.order[k];
        let a = m.ang[i];
        const fi = Math.min(fids.length - 1, Math.floor((a + Math.PI) / (2 * Math.PI / fids.length)));
        const [sx, sy] = v.toScreen(m.x[i], m.y[i]);
        c.fillStyle = F[fids[fi]].color;
        c.globalAlpha = 0.28;
        c.fillRect(sx - 1, sy - 1, 1.6, 1.6);
      }
    }
    ctx.drawImage(factionLayer, 0, 0, v.W, v.H);
    // frontier radius: real distance of the K-th star from home
    const idx = m.order[Math.min(m.N - 1, Math.max(0, K - 1))];
    const rho = Math.hypot(m.x[idx] - m.hx, m.y[idx] - m.hy) * v.scale;
    const [hx, hy] = v.toScreen(m.hx, m.hy);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const f of IG.state.run.war.fronts) {
      const [a0, a1] = sectorFor(f);
      const r = Math.max(20, rho * (1 + 0.06 * f.progress));
      const col = F[f.faction].color;
      const losing = f.progress < 0;
      ctx.strokeStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2.5 + Math.min(4, Math.abs(f.progress) * 4);
      ctx.globalAlpha = losing ? 0.55 + 0.45 * Math.sin(v.t * 6) : 0.9;
      if (losing) ctx.setLineDash([6, 5]); else ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(hx, hy, r, a0, a1);
      ctx.stroke();
      // battle sparks along the arc
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      for (let j = 0; j < 6; j++) {
        const a = a0 + (a1 - a0) * ((j * 0.173 + v.t * 0.07 * (j % 2 ? 1 : -1)) % 1 + 1) % 1;
        const fl = 0.5 + 0.5 * Math.sin(v.t * 9 + j * 2 + f.id);
        ctx.globalAlpha = fl;
        ctx.fillStyle = j % 2 ? '#ffffff' : col;
        ctx.fillRect(hx + Math.cos(a) * r - 1.5, hy + Math.sin(a) * r - 1.5, 3, 3);
      }
    }
    ctx.restore();
  }

  function factionTip(fid) {
    const f = IG.CONFIG.war.factions[fid];
    return '<b style="color:' + f.color + '">' + f.name + '</b><br><i>' + f.desc + '</i><br>' + f.traitText +
      '<br>Your counters vs them: ' + IG.fmtMult(IG.War.counter(fid));
  }

  function frontTip(f) {
    const W = IG.War;
    const P = W.committed(f), E = f.enemy;
    return '<b>' + f.name + '</b> — ' + W.faction(f.faction).name + ' (depth ' + f.depth + ')<br>' +
      'Committed: ' + IG.fmt(P) + ' vs enemy ' + IG.fmt(E) + ' (max ' + IG.fmt(W.emax(f)) + ')<br>' +
      'Victory captures <b>' + IG.fmtInt(W.captureSize(f)) + '</b> worlds · defeat loses ~' + IG.fmtInt(W.lossSize()) + '<br>' +
      '<span class="muted">Front progress moves toward the stronger side. +100% wins, −100% collapses.</span>';
  }

  function big(label) {
    const v = el('div', { class: 'es-val' });
    return { box: el('div', { class: 'es' }, [el('div', { class: 'es-label', text: label }), v]), v };
  }

  function build(root) {
    refs = { big: {}, fronts: [] };
    factionKey = '';
    const banner = el('div', { class: 'empire-summary war-banner' });
    for (const [k, label] of [['worlds', 'Worlds'], ['output', 'Empire output'], ['materiel', 'Materiel'], ['fleet', 'Fleet strength'], ['fronts', 'Fronts won · lost']]) {
      const b = big(label);
      refs.big[k] = b.v;
      banner.appendChild(b.box);
    }
    root.appendChild(banner);
    refs.grace = el('div', { class: 'war-grace' });
    root.appendChild(refs.grace);

    const layout = el('div', { class: 'war-layout' });
    const left = el('div', { class: 'war-left' });
    // fleet
    const fleet = el('div', { class: 'mech' });
    fleet.appendChild(el('div', { class: 'mech-title' }, [IG.icons.node('warships'), el('span', { text: 'Fleet' })]));
    refs.fleet = el('div', { class: 'fleet-stats' });
    fleet.appendChild(refs.fleet);
    left.appendChild(fleet);
    // fronts
    const fr = el('div', { class: 'mech' });
    fr.appendChild(el('div', { class: 'mech-title' }, [IG.icons.node('front'), el('span', { text: 'Fronts' }),
      el('span', { class: 'spacer' }),
      el('button', { class: 'btn small', on: { click: () => IG.War.autoAllocate() }, tip: 'Assign fleet in proportion to each front\'s enemy strength.' }, 'Auto-allocate'),
      el('button', { class: 'btn small', on: { click: () => IG.War.evenSplit() } }, 'Even split')]));
    refs.alloc = el('div', { class: 'small muted' });
    fr.appendChild(refs.alloc);
    const list = el('div', { class: 'front-list' });
    fr.appendChild(list);
    refs.frontList = list;
    left.appendChild(fr);
    layout.appendChild(left);

    const right = el('div', { class: 'war-right' });
    const gbox = el('div', { class: 'galaxy-box' });
    right.appendChild(gbox);
    const legend = el('div', { class: 'faction-legend' });
    for (const fid in IG.CONFIG.war.factions) {
      const f = IG.CONFIG.war.factions[fid];
      legend.appendChild(el('div', { class: 'faction-item', tip: () => factionTip(fid), style: { '--fc': f.color } },
        [IG.icons.node('faction_' + fid, 'ic-lg'), el('div', {}, [el('b', { text: f.name }), el('div', { class: 'small muted', text: f.traitText })])]));
    }
    right.appendChild(legend);
    layout.appendChild(right);
    root.appendChild(layout);
    refs.view = IG.GalaxyView.mount(gbox, { mode: 'war', overlay });
    buildFronts();
  }

  function buildFronts() {
    const list = refs.frontList;
    IG.dom.clear(list);
    refs.fronts = [];
    refs.frontIds = IG.state.run.war.fronts.map((f) => f.id).join(',');
    for (const f of IG.state.run.war.fronts) {
      const fac = IG.CONFIG.war.factions[f.faction];
      const fillL = el('div', { class: 'fb-left' }), fillR = el('div', { class: 'fb-right' });
      const status = el('span', { class: 'small' });
      const nums = el('div', { class: 'small muted' });
      const pct = el('span', { class: 'lv' });
      const range = el('input', { type: 'range', min: '0', max: '100', step: '1', value: String(Math.round(f.share * 100)),
        on: { input: (e) => { IG.War.setShare(f.id, parseInt(e.target.value, 10) / 100); } } });
      const row = el('div', { class: 'front', style: { '--fc': fac.color }, tip: () => frontTip(f) }, [
        el('div', { class: 'row' }, [el('span', {}, [IG.icons.node('faction_' + f.faction), ' ', el('b', { text: f.name }), ' ',
          el('span', { class: 'muted small', text: fac.name + ' · depth ' + f.depth })]), status]),
        el('div', { class: 'front-bar' }, [el('div', { class: 'fb-half' }, [fillL]), el('div', { class: 'fb-mid' }), el('div', { class: 'fb-half' }, [fillR])]),
        nums,
        el('div', { class: 'row' }, [el('span', { class: 'small muted', text: 'Fleet share' }), range, pct]),
      ]);
      list.appendChild(row);
      refs.fronts.push({ f, fillL, fillR, status, nums, pct, range });
    }
  }

  function update() {
    if (!refs || !IG.War.active()) return;
    const s = IG.state, W = IG.War, g = IG.Prod.cache.gross, r = IG.Prod.cache.rates;
    if (refs.frontIds !== s.run.war.fronts.map((f) => f.id).join(',')) buildFronts();
    let total = IG.D(0);
    for (const k in g) if (k !== 'warships' && k !== 'legions') total = total.add(g[k]);
    setText(refs.big.worlds, IG.fmtInt(IG.Expansion.totalWorlds()));
    setText(refs.big.output, IG.fmtRate(total));
    setText(refs.big.materiel, IG.fmtRate(g.materiel || 0));
    const fleet = W.fleetStrength();
    setText(refs.big.fleet, IG.fmt(fleet));
    setText(refs.big.fronts, IG.fmtInt(s.run.war.won) + ' · ' + IG.fmtInt(s.run.war.lost));
    const gl = W.graceLeft();
    setText(refs.grace, gl > 0 ? 'The aliens are still gathering. Their fronts will not advance for another ' + IG.fmtTime(gl) + '.' : '');
    toggle(refs.grace, 'hidden', gl <= 0);
    const eff = IG.Prod.cache.converterEff && IG.Prod.cache.converterEff.materiel;
    setHTML(refs.fleet,
      IG.icons.html('warships', 'ic-sm') + ' Warships <b>' + IG.fmt(s.run.resources.warships) + '</b> (' + IG.fmtRate(g.warships || 0) + ', power ' + IG.fmt(W.unitPower('warship')) + ' each)<br>' +
      IG.icons.html('legions', 'ic-sm') + ' Legions <b>' + IG.fmt(s.run.resources.legions) + '</b> (' + IG.fmtRate(g.legions || 0) + ', power ' + IG.fmt(W.unitPower('legion')) + ' each)<br>' +
      'Attrition: <span class="no">' + IG.fmtRate(s.run.war.lossRate) + '</span> strength' +
      (eff !== undefined && eff < 0.999 ? ' · <span class="no">Materiel shortage: yards at ' + IG.fmtPct(eff) + '</span>' : ''));
    setText(refs.alloc, 'Allocated: ' + IG.fmtPct(W.totalShare()) + ' of the fleet');
    for (const fr of refs.fronts) {
      const f = fr.f;
      const p = Math.max(-1, Math.min(1, f.progress));
      setStyle(fr.fillR, 'width', (Math.max(0, p) * 100).toFixed(1) + '%');
      setStyle(fr.fillL, 'width', (Math.max(0, -p) * 100).toFixed(1) + '%');
      const P = W.committed(f, fleet), E = f.enemy;
      const ratio = E.gt(0) ? P.div(E).toNumber() : 99;
      const adv = ratio > 1.02 ? 'advancing' : ratio < 0.98 ? 'retreating' : 'holding';
      setHTML(fr.status, '<span class="' + (adv === 'advancing' ? 'ok' : adv === 'retreating' ? 'no' : 'muted') + '">' + adv + '</span> ' + (p * 100).toFixed(0) + '%');
      setText(fr.nums, 'Ours ' + IG.fmt(P) + ' vs theirs ' + IG.fmt(E) + ' · capture ' + IG.fmtInt(W.captureSize(f)) + ' worlds');
      setText(fr.pct, IG.fmtPct(f.share));
      const v = String(Math.round(f.share * 100));
      if (fr.range.value !== v && document.activeElement !== fr.range) fr.range.value = v;
    }
  }

  IG.UI.headerExtras.push({ id: 'fleet', icon: 'warships', color: '#ff5d5d', show: () => IG.War.active(),
    value: () => IG.fmt(IG.War.fleetStrength()) + ' fleet',
    sub: () => IG.fmtInt(IG.state.run.war.won) + ' fronts won',
    tip: () => '<b>Fleet strength</b><br>Warships and legions × their power × your fleet multipliers.' });

  IG.UI.registerTab({ id: 'war', name: 'War', icon: 'front', order: 4,
    isUnlocked: () => IG.War.active(), teaser: () => 'Something waits beyond 20,000 worlds.', build, update });
})();
