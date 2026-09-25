'use strict';
// Achievements tab: grid of badges; unlocked ones glow. Hidden details for locked ones show the requirement.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const { el, setText, toggle } = IG.dom;

  let refs = [];
  let summary = null;

  function build(root) {
    refs = [];
    summary = el('div', { class: 'ach-summary' });
    root.appendChild(summary);
    // resource and generator achievements show that resource/generator; the rest use a badge by condition type
    const achIcon = (c) => (c.type === 'res' && IG.icons.has(c.res) ? c.res : c.type === 'gen' && IG.icons.has(c.gen) ? c.gen : 'ach_' + c.type);
    const grid = el('div', { class: 'ach-grid' });
    for (const a of IG.Achievements.list()) {
      const node = el('div', { class: 'ach', tip: () => '<b>' + a.name + '</b><br>' + a.desc + '<br>' +
        (IG.Achievements.has(a.id) ? '<span class="ok">Unlocked at ' + IG.fmtTime(IG.state.perm.achievements[a.id]) + ' played</span>' : '<span class="muted">Locked</span>') +
        '<br>Reward: all production ×' + IG.CONFIG.achievements.multEach },
      [IG.icons.node(achIcon(a.cond), 'ic-lg'), el('div', { class: 'ach-name', text: a.name })]);
      grid.appendChild(node);
      refs.push({ a, node });
    }
    root.appendChild(grid);
  }

  function update() {
    const n = IG.Achievements.count(), total = IG.Achievements.list().length;
    setText(summary, n + ' / ' + total + ' achievements · bonus: all production ' + IG.fmtMult(IG.Achievements.mult()));
    for (const r of refs) toggle(r.node, 'got', IG.Achievements.has(r.a.id));
  }

  IG.UI.registerTab({ id: 'achievements', name: 'Achievements', icon: 'star', order: 70,
    isUnlocked: () => IG.Achievements.count() > 0, teaser: () => 'Earn your first achievement.', build, update });
})();
