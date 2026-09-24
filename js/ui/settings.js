'use strict';
// Settings tab: number format, toggles, audio, save/export/import/reset, hotkey list.
(function () {
  const IG = globalThis.IG || (globalThis.IG = {});
  const { el } = IG.dom;

  const HOTKEYS = [
    ['Space / F', 'Forage (Stone Age click)'],
    ['B', 'Cycle buy multiplier (x1 → x10 → x100 → Max)'],
    ['1 – 9', 'Switch to the Nth visible tab'],
    ['A', 'Advance to the next era (when the milestone is met)'],
    ['R', 'Research the cheapest available tech'],
    ['S', 'Save now'],
    ['M', 'Mute / unmute sound'],
    ['Esc', 'Close dialogs'],
    ['type "aeon"', 'Toggle developer mode (then ` opens the dev panel)'],
  ];

  function section(title, children) {
    return el('section', { class: 'settings-sec' }, [el('h3', { text: title })].concat(children));
  }

  function radioRow(name, options, current, onChange) {
    const row = el('div', { class: 'radio-row' });
    for (const [val, label] of options) {
      const input = el('input', { type: 'radio', name, value: val, ...(val === current ? { checked: 'checked' } : {}),
        on: { change: () => onChange(val) } });
      row.appendChild(el('label', { class: 'radio' }, [input, ' ' + label]));
    }
    return row;
  }

  function checkRow(label, key) {
    const s = IG.state.settings;
    return el('label', { class: 'check' }, [el('input', { type: 'checkbox', ...(s[key] ? { checked: 'checked' } : {}),
      on: { change: (e) => { s[key] = e.target.checked; IG.Bus.emit('settings', key); } } }), ' ' + label]);
  }

  function exportDialog() {
    const str = IG.Save.exportString();
    const ta = el('textarea', { class: 'save-text', readonly: 'readonly' });
    ta.value = str;
    IG.UI.modal({ title: 'Export save', body: el('div', {}, [el('p', { text: 'Copy this string somewhere safe.' }), ta]),
      buttons: [{ text: 'Copy', cls: 'primary', onClick: () => {
        ta.select();
        try { navigator.clipboard.writeText(str); } catch (e) { document.execCommand('copy'); }
        IG.UI.toast('Save copied to clipboard.');
        return false;
      } }, { text: 'Close' }] });
    setTimeout(() => ta.select(), 50);
  }

  function importDialog() {
    const ta = el('textarea', { class: 'save-text', placeholder: 'Paste an exported save string…' });
    IG.UI.modal({ title: 'Import save', body: el('div', {}, [el('p', { text: 'This replaces your current game.' }), ta]),
      buttons: [{ text: 'Cancel' }, { text: 'Import', cls: 'primary', onClick: () => {
        try {
          const st = IG.Save.importString(ta.value);
          IG.Main.loadState(st, true);
          IG.UI.toast('Save imported.');
        } catch (e) {
          IG.UI.toast('Import failed: ' + e.message, 'bad');
          return false;
        }
      } }] });
  }

  function resetDialog() {
    IG.UI.confirm('Hard reset', '<p>Erase <b>everything</b> — all eras, prestige, power tree and achievements?</p><p class="no">This cannot be undone.</p>',
      'Erase everything', () => {
        IG.UI.confirm('Are you certain?', 'The Undying Hand forgets all it has ever known.', 'Yes, erase', () => IG.Main.hardReset());
      });
  }

  function build(root) {
    const s = IG.state.settings;
    root.appendChild(section('Numbers', [
      radioRow('numfmt', [['suffix', 'Suffixes (1.23M, 4.56Qa)'], ['scientific', 'Scientific (1.23e6)'], ['engineering', 'Engineering (12.3e15)']],
        s.numberFormat, (v) => { s.numberFormat = v; IG.UI.rebuildAll(); }),
    ]));
    const vol = el('input', { type: 'range', min: '0', max: '1', step: '0.05', value: String(s.volume),
      on: { input: (e) => { s.volume = parseFloat(e.target.value); IG.Bus.emit('settings', 'volume'); } } });
    root.appendChild(section('Sound', [checkRow('Mute all sound', 'mute'),
      el('label', { class: 'range' }, ['Volume ', vol])]));
    root.appendChild(section('Display', [
      checkRow('Number pop-ups on purchases', 'popups'),
      checkRow('Particle effects', 'particles'),
      checkRow('Confirm before prestige', 'confirmPrestige'),
    ]));
    root.appendChild(section('Save', [
      el('p', { class: 'muted', text: 'Autosaves every ' + IG.CONFIG.autosaveSeconds + ' seconds to this browser.' }),
      el('div', { class: 'btn-row' }, [
        el('button', { class: 'btn primary', on: { click: () => { if (IG.Save.save()) IG.UI.toast('Game saved.'); } } }, 'Save now'),
        el('button', { class: 'btn', on: { click: exportDialog } }, 'Export'),
        el('button', { class: 'btn', on: { click: importDialog } }, 'Import'),
        el('button', { class: 'btn danger', on: { click: resetDialog } }, 'Hard reset'),
      ]),
    ]));
    const hk = el('table', { class: 'hotkeys' });
    for (const [k, d] of HOTKEYS) hk.appendChild(el('tr', {}, [el('td', {}, [el('kbd', { text: k })]), el('td', { text: d })]));
    root.appendChild(section('Hotkeys', [hk]));
    root.appendChild(section('About', [el('p', { class: 'muted', html:
      'The Undying Hand — from Stone Age to Galactic Empire. Big numbers by break_infinity.js (MIT). All art is generated in code.' })]));
  }

  IG.UI.registerTab({ id: 'settings', name: 'Settings', icon: 'settings', order: 90, isUnlocked: () => true, build });
  IG.UI.exportDialog = exportDialog;
})();
