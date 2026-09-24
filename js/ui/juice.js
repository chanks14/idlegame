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
    root.innerHTML = '<div class="tc-inner"><div class="tc-title"></div><div class="tc-sub"></div></div>';
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

  function init() {
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
    IG.Bus.on('milestone', (d) => { const c = centerOf(d && d.sel ? d.sel : '#era-card'); burst(c.x, c.y, 60); });
    IG.Bus.on('achievement', () => { const c = centerOf('#toasts'); burst(c.x, c.y - 20, 50, '#ffd76a'); });
  }

  IG.Juice = { init, popup, burst, titleCard, centerOf };
})();
