'use strict';
// Welcome-back summary panel and other system dialogs.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const { el } = IG.dom;

  function welcomeBack(sum) {
    const C = IG.CONFIG;
    const body = el('div', { class: 'welcome' });
    body.appendChild(el('p', { html: 'You were away for <b>' + IG.fmtTime(sum.away) + '</b>.' +
      (sum.capped ? ' <span class="muted">(Only ' + IG.fmtTime(sum.simulated) + ' counted — raise the offline cap in the Power Tree.)</span>' : '') }));
    body.appendChild(el('p', { class: 'muted', text: 'Your agents kept the fires burning.' }));
    const list = el('div', { class: 'gain-list' });
    let any = false;
    for (const r in sum.gains) {
      if (!C.resources[r] || C.resources[r].hidden) continue;
      any = true;
      list.appendChild(el('div', { class: 'gain-row', style: { '--rc': C.resources[r].color } }, [
        IG.icons.node(r), el('span', { text: C.resources[r].name }), el('b', { text: '+' + IG.fmt(sum.gains[r]) })]));
    }
    if (!any) list.appendChild(el('div', { class: 'muted', text: 'Nothing was produced.' }));
    body.appendChild(list);
    const extra = [];
    if (sum.eraTo > sum.eraFrom) extra.push('Advanced to the ' + C.eras[sum.eraTo].name);
    if (sum.gens > 0) extra.push(IG.fmtInt(sum.gens) + ' generators acquired');
    if (sum.research > 0) extra.push(sum.research + ' techs researched');
    if (sum.worlds !== 0) extra.push((sum.worlds > 0 ? '+' : '') + IG.fmtInt(sum.worlds) + ' worlds');
    if (sum.frontsWon > 0) extra.push(sum.frontsWon + ' fronts won');
    if (sum.frontsLost > 0) extra.push(sum.frontsLost + ' fronts lost');
    if (sum.achievements > 0) extra.push(sum.achievements + ' achievements unlocked');
    if (extra.length) body.appendChild(el('ul', { class: 'wb-extra' }, extra.map((t) => el('li', { text: t }))));
    if (sum.logs && sum.logs.length) {
      body.appendChild(el('div', { class: 'wb-logs' }, sum.logs.map((l) => el('div', { class: 'log-entry ' + l.cls, text: l.msg }))));
    }
    IG.UI.modal({ title: 'Welcome back, Undying One', body, buttons: [{ text: 'Continue', cls: 'primary' }], cls: 'welcome-modal' });
    IG.Bus.emit('sfx', 'welcome');
  }

  IG.Bus.on('welcomeBack', welcomeBack);
  IG.UI.welcomeBack = welcomeBack;
})();
