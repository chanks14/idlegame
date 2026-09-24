'use strict';
// Minimal DOM helpers with change-detection so UI refreshes only touch nodes whose content changed.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});

  function el(tag, props, children) {
    const node = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v === undefined || v === null) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'on') { for (const ev in v) node.addEventListener(ev, v[ev]); }
        else if (k === 'style') { for (const sk in v) node.style[sk] = v[sk]; }
        else if (k === 'tip') node._tip = v;
        else if (k === 'dataset') { for (const dk in v) node.dataset[dk] = v[dk]; }
        else node.setAttribute(k, v);
      }
    }
    if (children) append(node, children);
    return node;
  }

  function append(node, children) {
    if (!Array.isArray(children)) children = [children];
    for (const c of children) {
      if (c === null || c === undefined || c === false) continue;
      node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    }
    return node;
  }

  function setText(node, str) {
    if (!node) return;
    if (node._t !== str) { node._t = str; node.textContent = str; }
  }

  function setHTML(node, str) {
    if (!node) return;
    if (node._h !== str) { node._h = str; node.innerHTML = str; }
  }

  function toggle(node, cls, on) {
    if (!node) return;
    const key = '_c_' + cls;
    if (node[key] !== on) { node[key] = on; node.classList.toggle(cls, !!on); }
  }

  function setStyle(node, prop, val) {
    if (!node) return;
    const key = '_s_' + prop;
    if (node[key] !== val) { node[key] = val; node.style[prop] = val; }
  }

  function setAttr(node, attr, val) {
    const key = '_a_' + attr;
    if (node[key] !== val) { node[key] = val; node.setAttribute(attr, val); }
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Formats a cost map {res: Decimal} as HTML with affordability coloring.
  function costHTML(costs) {
    const res = IG.state.run.resources, C = IG.CONFIG;
    const parts = [];
    for (const r in costs) {
      const ok = res[r].gte(costs[r]);
      parts.push('<span class="cost ' + (ok ? 'ok' : 'no') + '">' + IG.icons.html(r, 'ic-sm') +
        IG.fmt(costs[r]) + '</span>');
    }
    return parts.join(' ');
  }

  // ------------------------------------------------------------------ tooltips
  // Any element with `_tip` (string or function returning HTML) shows a tooltip on hover.
  let tipEl = null, tipTarget = null, tipX = 0, tipY = 0;

  function initTooltips() {
    tipEl = el('div', { class: 'tooltip', role: 'tooltip' });
    document.body.appendChild(tipEl);
    document.addEventListener('mouseover', (e) => {
      let t = e.target;
      while (t && t !== document.body && !t._tip) t = t.parentNode;
      if (t && t._tip) { tipTarget = t; renderTip(); tipEl.classList.add('show'); }
      else hideTip();
    });
    document.addEventListener('mousemove', (e) => { tipX = e.clientX; tipY = e.clientY; if (tipTarget) positionTip(); });
    document.addEventListener('mouseleave', hideTip);
  }

  function hideTip() { tipTarget = null; if (tipEl) tipEl.classList.remove('show'); }

  function renderTip() {
    if (!tipTarget || !tipTarget.isConnected) { hideTip(); return; }
    const t = tipTarget._tip;
    const html = typeof t === 'function' ? t() : t;
    setHTML(tipEl, html);
    positionTip();
  }

  function positionTip() {
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    let x = tipX + 16, y = tipY + 16;
    if (x + w > window.innerWidth - 8) x = tipX - w - 16;
    if (y + h > window.innerHeight - 8) y = window.innerHeight - h - 8;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    tipEl.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  }

  IG.dom = { el, append, setText, setHTML, toggle, setStyle, setAttr, clear, esc, costHTML, initTooltips,
    refreshTip() { if (tipTarget) renderTip(); }, hideTip };
})();
