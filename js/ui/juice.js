'use strict';
// Juice: number pop-ups, particle bursts (canvas overlay), era/prestige transition overlays.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  let canvas, ctx, particles = [], running = false;

  function popup(d) {
    if (!IG.state.settings.popups) return;
    const root = document.getElementById('popups');
    if (!root || root.childNodes.length > 40) return;
    const p = document.createElement('div');
    p.className = 'popup ' + (d.cls || '');
    p.textContent = d.text;
    const x = d.x !== undefined ? d.x : window.innerWidth / 2;
    const y = d.y !== undefined ? d.y : window.innerHeight / 2;
    p.style.left = (x + (Math.random() * 20 - 10)) + 'px';
    p.style.top = (y - 10) + 'px';
    root.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }

  function accent() {
    return getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#e0b060';
  }

  // Particle burst at screen position (x, y). count, color optional.
  function burst(x, y, count, color) {
    if (!IG.state.settings.particles || !ctx) return;
    const col = color || accent();
    const n = Math.min(count || 40, 160);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 260;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.8 + Math.random() * 0.9,
        age: 0, size: 1.5 + Math.random() * 2.5, col });
    }
    if (particles.length > 900) particles.splice(0, particles.length - 900);
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(step); }
  }

  let last = 0;
  function step(t) {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    const dpr = devicePixelRatio;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.life) { particles.splice(i, 1); continue; }
      p.vy += 220 * dt;
      p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx * dt; p.y += p.vy * dt;
      const k = 1 - p.age / p.life;
      ctx.globalAlpha = k;
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(p.x * dpr, p.y * dpr, p.size * dpr * (0.5 + k * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (particles.length) requestAnimationFrame(step);
    else { running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  // Full-screen title card used for era changes and prestige.
  function titleCard(title, sub, cls) {
    const root = document.getElementById('transition');
    if (!root) return;
    root.className = 'transition show ' + (cls || '');
    root.innerHTML = '<div class="tc-ring"></div><div class="tc-ring r2"></div><div class="tc-inner"><div class="tc-title"></div><div class="tc-sub"></div></div>';
    root.querySelector('.tc-title').textContent = title;
    root.querySelector('.tc-sub').textContent = sub || '';
    clearTimeout(root._t);
    root._t = setTimeout(() => { root.className = 'transition'; }, 3200);
    root.onclick = () => { root.className = 'transition'; };
  }

  function centerOf(sel) {
    const n = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!n) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = n.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // ---------------------------------------------------------------- ambient background (per-era mood particles)
  const AMBIENT = {
    stone: { n: 34, color: '#ff9a4a', kind: 'ember' }, bronze: { n: 34, color: '#ffcf6a', kind: 'ember' },
    classical: { n: 30, color: '#fff3dc', kind: 'dust' }, medieval: { n: 30, color: '#ffc86a', kind: 'ember' },
    industrial: { n: 18, color: '#b8b0a4', kind: 'smoke' }, atomic: { n: 46, color: '#4dff88', kind: 'rain' },
    spacefaring: { n: 70, color: '#cfe6ff', kind: 'star' }, interstellar: { n: 90, color: '#d6ccff', kind: 'star' },
    war: { n: 40, color: '#ff5a44', kind: 'ember' },
  };
  let bg, bgx, motes = [], moteTheme = '', bgLast = 0;

  function spawnMote(kind, W, H, fresh) {
    const m = { x: Math.random() * W, y: fresh ? Math.random() * H : (kind === 'rain' ? -10 : H + 10), a: Math.random(),
      s: 0.6 + Math.random() * 1.8, vx: (Math.random() - 0.5) * 8, vy: 0, ph: Math.random() * 6.28 };
    if (kind === 'ember') m.vy = -(10 + Math.random() * 22);
    if (kind === 'dust') { m.vy = -(2 + Math.random() * 5); m.vx = (Math.random() - 0.5) * 6; }
    if (kind === 'smoke') { m.vy = -(4 + Math.random() * 6); m.s = 40 + Math.random() * 60; }
    if (kind === 'rain') { m.vy = 30 + Math.random() * 50; m.vx = 0; }
    if (kind === 'star') { m.vy = 0; m.vx = 0; }
    return m;
  }

  function ambient(t) {
    requestAnimationFrame(ambient);
    if (!bg || document.hidden) return;
    if (t - bgLast < 42) return; // ~24 fps is plenty for mood particles
    const dt = Math.min(0.1, (t - bgLast) / 1000);
    bgLast = t;
    const W = window.innerWidth, H = window.innerHeight, dpr = devicePixelRatio;
    const theme = document.body.dataset.era || 'stone';
    const cfg = AMBIENT[theme] || AMBIENT.stone;
    if (theme !== moteTheme) { moteTheme = theme; motes = []; for (let i = 0; i < cfg.n; i++) motes.push(spawnMote(cfg.kind, W, H, true)); }
    bgx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgx.clearRect(0, 0, W, H);
    if (!IG.state.settings.particles) return;
    bgx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.ph += dt;
      m.x += (m.vx + Math.sin(m.ph) * 4) * dt;
      m.y += m.vy * dt;
      if (m.y < -120 || m.y > H + 20 || m.x < -120 || m.x > W + 120) { motes[i] = spawnMote(cfg.kind, W, H, false); continue; }
      let alpha;
      if (cfg.kind === 'star') alpha = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(m.ph * 1.7 + m.a * 10));
      else if (cfg.kind === 'smoke') alpha = 0.035;
      else alpha = 0.18 + 0.3 * m.a * (0.6 + 0.4 * Math.sin(m.ph * 3));
      bgx.globalAlpha = alpha;
      bgx.fillStyle = cfg.color;
      bgx.beginPath();
      bgx.arc(m.x, m.y, m.s, 0, 6.283);
      bgx.fill();
    }
    bgx.globalAlpha = 1;
    bgx.globalCompositeOperation = 'source-over';
  }

  function resizeBg() {
    if (!bg) return;
    bg.width = window.innerWidth * devicePixelRatio;
    bg.height = window.innerHeight * devicePixelRatio;
    bg.style.width = window.innerWidth + 'px';
    bg.style.height = window.innerHeight + 'px';
    moteTheme = '';
  }

  function flashCard(sel) {
    const n = document.querySelector(sel);
    if (!n) return;
    n.classList.remove('flash');
    void n.offsetWidth;
    n.classList.add('flash');
  }

  function init() {
    bg = document.getElementById('bg-canvas');
    if (bg) { bgx = bg.getContext('2d'); resizeBg(); window.addEventListener('resize', resizeBg); requestAnimationFrame(ambient); }
    IG.Bus.on('purchase', (d) => {
      if (d.kind === 'gen' || d.kind === 'upgrade') flashCard('.gen-card[data-gen="' + d.id + '"]');
    });
    IG.Bus.on('popup', (d) => {
      if (d.cls === 'gold' && d.x !== undefined) burst(d.x, d.y, 16, '#ffd76a');
      else if (d.cls === 'food' && d.x !== undefined) burst(d.x, d.y, 6, '#f0c27a');
    });
    canvas = document.getElementById('fx-canvas');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    IG.Bus.on('popup', popup);
    IG.Bus.on('era', (d) => {
      const e = IG.CONFIG.eras[d.era];
      titleCard(e.name, e.desc, 'era-' + e.theme);
      setTimeout(() => { const c = centerOf('#era-badge'); burst(c.x, c.y, 120); }, 200);
    });
    IG.Bus.on('prestige', (d) => {
      titleCard('The Long Night', 'Cities fall silent and the names are forgotten. You remember. +' + IG.fmtInt(d.gain) + ' points.', 'prestige');
      setTimeout(() => { const c = centerOf('#pp-chip'); burst(c.x, c.y, 140, '#c8a8ff'); }, 600);
    });
    IG.Bus.on('frontWon', (d) => {
      IG.UI.toast('Victory at <b>' + IG.dom.esc(d.front.name) + '</b> — ' + IG.fmtInt(d.worlds) + ' worlds taken', 'gold');
      const c = centerOf('.war-banner') ; burst(c.x, c.y, 70, '#ffd76a');
    });
    IG.Bus.on('frontLost', (d) => { IG.UI.toast('The line at <b>' + IG.dom.esc(d.front.name) + '</b> collapses — ' + IG.fmtInt(d.worlds) + ' worlds lost', 'bad'); });
    IG.Bus.on('milestone', (d) => { const c = centerOf(d && d.sel ? d.sel : '#era-card'); burst(c.x, c.y, 60); });
    IG.Bus.on('achievement', () => { const c = centerOf('#toasts'); burst(c.x, c.y - 20, 50, '#ffd76a'); });
  }

  IG.Juice = { init, popup, burst, titleCard, centerOf };
})();
