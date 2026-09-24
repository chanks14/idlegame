'use strict';
// Procedural spiral-galaxy canvas. Claimed territory spreads outward from the homeworld and glows; world counts
// are shown by density and glow, never as individual planets. Used by the Galaxy and War tabs.
//   const view = IG.GalaxyView.mount(containerEl, { mode: 'galaxy' | 'war' }); view.destroy();
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  let model = null; // shared star model (generated once per seed)

  function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r()); }

  function generate() {
    const G = IG.CONFIG.expansion.galaxy;
    const seed = G.seed + ((IG.state && IG.state.meta.seed) || 0) % 1000;
    if (model && model.seed === seed) return model;
    const r = IG.util.rng(seed);
    const N = G.stars, arms = G.arms;
    const x = new Float32Array(N), y = new Float32Array(N), size = new Float32Array(N), bright = new Float32Array(N);
    const hue = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const kind = r();
      let px, py;
      if (kind < 0.16) { // bulge
        px = gauss(r) * 0.13; py = gauss(r) * 0.11;
        hue[i] = 40 + r() * 20; bright[i] = 0.55 + r() * 0.45;
      } else if (kind < 0.88) { // arms
        const a = Math.floor(r() * arms);
        const rad = 0.1 + 0.9 * Math.pow(r(), 0.85);
        const th = a * 2 * Math.PI / arms + rad * 3.4 + gauss(r) * 0.22 * (1.1 - rad * 0.5);
        px = Math.cos(th) * rad + gauss(r) * 0.02; py = Math.sin(th) * rad + gauss(r) * 0.02;
        hue[i] = 200 + r() * 50; bright[i] = 0.3 + r() * 0.6;
      } else { // thin disk / halo
        const rad = Math.sqrt(r()) * 1.02, th = r() * Math.PI * 2;
        px = Math.cos(th) * rad; py = Math.sin(th) * rad;
        hue[i] = 20 + r() * 220; bright[i] = 0.15 + r() * 0.35;
      }
      x[i] = px; y[i] = py * 0.82;
      size[i] = 0.5 + Math.pow(r(), 3) * 1.8;
    }
    // homeworld on arm 0, mid-disk
    const hr = 0.56, hth = hr * 3.4;
    const hx = Math.cos(hth) * hr, hy = Math.sin(hth) * hr * 0.82;
    // claim order: distance from home with noise → organic, blobby growth
    const d = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const dx = x[i] - hx, dy = y[i] - hy;
      d[i] = Math.sqrt(dx * dx + dy * dy) * (0.8 + 0.4 * r());
    }
    const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => d[a] - d[b]);
    // angle of each star around the homeworld (used for faction sectors)
    const ang = new Float32Array(N);
    for (let i = 0; i < N; i++) ang[i] = Math.atan2(y[i] - hy, x[i] - hx);
    model = { seed, N, x, y, size, bright, hue, order, dist: d, ang, hx, hy };
    return model;
  }

  function claimedCount(worlds) {
    const G = IG.CONFIG.expansion.galaxy;
    if (worlds <= 0) return 0;
    const f = Math.min(1, Math.pow(Math.log10(1 + worlds) / Math.log10(1 + G.fullAtWorlds), 1.4));
    return Math.max(1, Math.floor(f * model.N));
  }

  function mount(container, opts) {
    opts = opts || {};
    generate();
    const canvas = document.createElement('canvas');
    canvas.className = 'galaxy-canvas';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, scale = 1;
    let base = null, claimLayer = null, claimedK = -1, claimColor = '';
    let raf = 0, alive = true, t0 = performance.now();

    function toScreen(px, py) { return [W / 2 + px * scale, H / 2 + py * scale]; }

    function resize() {
      const rect = container.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      W = Math.max(300, rect.width);
      H = Math.max(260, Math.min(W * 0.62, window.innerHeight * 0.62));
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      scale = Math.min(W, H / 0.82) * 0.47;
      base = null; claimedK = -1;
    }

    function drawBase() {
      base = document.createElement('canvas');
      base.width = W * dpr; base.height = H * dpr;
      const b = base.getContext('2d');
      b.scale(dpr, dpr);
      b.fillStyle = '#03030a';
      b.fillRect(0, 0, W, H);
      // core glow
      const g = b.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, scale * 0.55);
      g.addColorStop(0, 'rgba(255,230,190,0.55)');
      g.addColorStop(0.25, 'rgba(200,160,255,0.18)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      b.fillStyle = g;
      b.fillRect(0, 0, W, H);
      // dust along arms: faint blobs sampled from star positions
      b.globalCompositeOperation = 'lighter';
      const m = model;
      for (let i = 0; i < m.N; i += 23) {
        const [sx, sy] = toScreen(m.x[i], m.y[i]);
        const rad = scale * 0.07;
        const gg = b.createRadialGradient(sx, sy, 0, sx, sy, rad);
        gg.addColorStop(0, 'hsla(' + m.hue[i] + ',60%,55%,0.05)');
        gg.addColorStop(1, 'rgba(0,0,0,0)');
        b.fillStyle = gg;
        b.fillRect(sx - rad, sy - rad, rad * 2, rad * 2);
      }
      for (let i = 0; i < m.N; i++) {
        const [sx, sy] = toScreen(m.x[i], m.y[i]);
        b.fillStyle = 'hsla(' + m.hue[i] + ',40%,' + (55 + m.bright[i] * 35) + '%,' + (0.25 + m.bright[i] * 0.45) + ')';
        const s = m.size[i] * 0.9;
        b.fillRect(sx - s / 2, sy - s / 2, s, s);
      }
      b.globalCompositeOperation = 'source-over';
    }

    function drawClaimed(K, color) {
      claimLayer = document.createElement('canvas');
      claimLayer.width = W * dpr; claimLayer.height = H * dpr;
      const c = claimLayer.getContext('2d');
      c.scale(dpr, dpr);
      c.globalCompositeOperation = 'lighter';
      const m = model;
      // soft territory glow: large faint discs
      const glowR = scale * (0.05 + 0.04 * Math.min(1, K / m.N * 3));
      for (let k = 0; k < K; k += Math.max(1, Math.floor(K / 350))) {
        const i = m.order[k];
        const [sx, sy] = toScreen(m.x[i], m.y[i]);
        const gg = c.createRadialGradient(sx, sy, 0, sx, sy, glowR);
        gg.addColorStop(0, color.replace('ALPHA', '0.10'));
        gg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gg;
        c.fillRect(sx - glowR, sy - glowR, glowR * 2, glowR * 2);
      }
      // claimed stars, bright
      c.fillStyle = color.replace('ALPHA', '0.95');
      for (let k = 0; k < K; k++) {
        const i = m.order[k];
        const [sx, sy] = toScreen(m.x[i], m.y[i]);
        const s = 1 + m.size[i];
        c.fillRect(sx - s / 2, sy - s / 2, s, s);
      }
      c.globalCompositeOperation = 'source-over';
    }

    function empireColor() {
      const st = getComputedStyle(document.body);
      const acc = (st.getPropertyValue('--accent') || '#9d8cff').trim();
      // convert hex to rgba template
      const h = acc.replace('#', '');
      if (h.length === 6) {
        const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',ALPHA)';
      }
      return 'rgba(157,140,255,ALPHA)';
    }

    function frame(now) {
      if (!alive) return;
      if (!canvas.isConnected) { alive = false; ro.disconnect(); return; }
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      const t = (now - t0) / 1000;
      if (!base) { resize(); drawBase(); }
      const worlds = IG.Expansion ? IG.Expansion.totalWorlds() : 0;
      const K = claimedCount(worlds);
      const col = empireColor();
      if (Math.abs(K - claimedK) > Math.max(2, claimedK * 0.004) || col !== claimColor || !claimLayer) {
        claimedK = K; claimColor = col;
        drawClaimed(K, col);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(base, 0, 0, W, H);
      ctx.drawImage(claimLayer, 0, 0, W, H);
      const m = model;
      ctx.globalCompositeOperation = 'lighter';
      // frontier shimmer
      const f0 = Math.max(0, K - Math.max(20, Math.floor(K * 0.06)));
      for (let k = f0; k < Math.min(m.N, K + 10); k++) {
        const i = m.order[k];
        const [sx, sy] = toScreen(m.x[i], m.y[i]);
        const a = 0.35 + 0.35 * Math.sin(t * 2.2 + i);
        ctx.fillStyle = col.replace('ALPHA', a.toFixed(2));
        const s = 2 + m.size[i];
        ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
      }
      // homeworld beacon
      const [hx, hy] = toScreen(m.hx, m.hy);
      const pr = 5 + 2 * Math.sin(t * 2);
      const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, pr * 3);
      hg.addColorStop(0, 'rgba(255,255,255,0.9)');
      hg.addColorStop(0.3, col.replace('ALPHA', '0.6'));
      hg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(hx - pr * 3, hy - pr * 3, pr * 6, pr * 6);
      // ships in flight: sparks travelling from home toward the frontier
      const flying = IG.Expansion ? IG.Expansion.inFlight() : 0;
      if (flying > 0 && K > 0) {
        const n = Math.min(24, 3 + Math.floor(Math.log10(flying + 1) * 5));
        for (let j = 0; j < n; j++) {
          const target = m.order[Math.max(0, K - 1 - ((j * 97) % Math.max(1, Math.floor(K * 0.08) + 1)))];
          const [tx, ty] = toScreen(m.x[target], m.y[target]);
          const p = ((t * 0.18 + j * 0.137) % 1);
          const sx = hx + (tx - hx) * p, sy = hy + (ty - hy) * p;
          ctx.fillStyle = 'rgba(255,255,255,' + (0.8 * (1 - p)).toFixed(2) + ')';
          ctx.fillRect(sx - 1, sy - 1, 2.2, 2.2);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      if (opts.overlay) opts.overlay(ctx, { W, H, scale, toScreen, model: m, K, t });
    }

    const ro = new ResizeObserver(() => { base = null; });
    ro.observe(container);
    raf = requestAnimationFrame(frame);
    return {
      canvas,
      destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); },
    };
  }

  IG.GalaxyView = { mount, generate, claimedCount, model: () => model };
})();
