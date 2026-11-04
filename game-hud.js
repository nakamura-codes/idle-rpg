/* One viewport for combat, with accessible relic panels over the arena. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const backdrop = $('hudBackdrop'), panel = $('hudPanel');
  const frame = $('appFrame');
  // Decorative type is limited to large titles. Keep the experiment reversible.
  function setTitleFont(value) {
    const font=value==='classic'?'classic':'dornen';
    root.dataset.hudFont=font;$('hudTitleFont').value=font;
    try {localStorage.setItem('hellward_hud_title_font',font);} catch {}
  }
  let savedFont='dornen';
  try {savedFont=localStorage.getItem('hellward_hud_title_font') || savedFont;} catch {}
  setTitleFont(savedFont);
  $('hudTitleFont').addEventListener('change',e=>setTitleFont(e.target.value));
  const labels = {
    upgrades:['CRÔNICAS DO ERRANTE','Livro Negro'],
    inventory:['RELIQUIÁRIO DO VIAJANTE','Mochila'],
    ascension:['O PREÇO DA ETERNIDADE','Cálice da Ascensão'],
    zones:['ALÉM DOS PORTÕES','Regiões Esquecidas'],
    chronicle:['SUSSURROS DO ABISMO','Crônicas da Jornada'],
    settings:['A JORNADA É SUA','Configurações']
  };
  let active = null, opener = null;
  function setExpanded() {
    document.querySelectorAll('[data-open-panel]').forEach(b => b.setAttribute('aria-expanded', String(b.dataset.openPanel === active)));
  }
  function display(name) {
    if (!labels[name]) return;
    active = name;
    $('hudFeedback').hidden=true;
    $('hudPanelEyebrow').textContent = labels[name][0];
    $('hudPanelTitle').textContent = name === 'inventory' ? 'Mochila de ' + $('profileName').textContent : labels[name][1];
    const art={upgrades:'assets/hud/livro-negro.png',inventory:'assets/hud/mochila-velha.png',ascension:'assets/hud/calice-ascensao.png',zones:'assets/ui/regions-tree.webp',chronicle:'assets/hud/livro-negro.png',settings:'assets/ui/vitality-bezel.webp'}[name];
    if($('hudPanelArt').getAttribute('src')!==art)$('hudPanelArt').src=art;
    panel.dataset.view = name;
    $('codexSummary').hidden = name !== 'upgrades';
    $('codexJourney').hidden = name !== 'upgrades';
    $('hudChronicle').hidden = name !== 'chronicle';
    const special = name === 'chronicle' || name === 'settings';
    $('hudSettings').hidden = name !== 'settings';
    $('tabBody').hidden = special;
    panel.querySelector('.tab-nav').hidden = special;
    $('hudPanelScroll').scrollTop = 0;
    setExpanded();
  }
  function close(restore = true) {
    if (backdrop.hidden) return;
    backdrop.hidden = true; active = null;
    $('hudFeedback').hidden=true;
    frame.inert = !$('authScreen').hidden;
    setExpanded();
    if (restore && $('authScreen').hidden) opener?.focus({preventScroll:true});
  }
  function open(name, button) {
    if (!$('authScreen').hidden || !$('dialogBackdrop').hidden || !labels[name]) return;
    if (active === name && !backdrop.hidden) { close(); return; }
    opener = button || document.querySelector(`[data-open-panel="${name}"]`);
    if (name !== 'chronicle' && name !== 'settings') panel.querySelector(`[data-tab="${name}"]`).click();
    backdrop.hidden = false; display(name); frame.inert = true;
    $('hudClose').focus({preventScroll:true});
  }
  document.querySelectorAll('[data-open-panel]').forEach(button => button.addEventListener('click', () => open(button.dataset.openPanel, button)));
  panel.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => display(button.dataset.tab)));
  $('hudClose').addEventListener('click', () => close());
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', e => {
    if (!$('authScreen').hidden || !$('dialogBackdrop').hidden) return;
    if (!backdrop.hidden && e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (!backdrop.hidden && e.key === 'Tab') {
      const focusable = [...panel.querySelectorAll('button:not(:disabled),select,input,a[href],[tabindex="0"]')].filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { e.preventDefault(); first?.focus(); }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || ['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
    const name = {c:'upgrades',a:'ascension',i:'inventory',m:'zones',j:'chronicle'}[e.key.toLowerCase()];
    if (name) { e.preventDefault(); open(name); }
  });
  function syncScene() {
    const inMenu = !$('authScreen').hidden;
    root.classList.toggle('hw-game-active', !inMenu);
    if (inMenu) close(false);
    frame.inert = inMenu || !backdrop.hidden;
  }
  document.addEventListener('hellward:scenechange', syncScene);
  new MutationObserver(syncScene).observe($('authScreen'), {attributes:true, attributeFilter:['hidden']});
  // A confirmation dialog may appear over a relic panel. Restore focus to the
  // panel after dismissal and keep the covered panel out of the tab order.
  new MutationObserver(() => {
    panel.inert = !$('dialogBackdrop').hidden;
    if ($('dialogBackdrop').hidden && !backdrop.hidden) $('hudClose').focus({preventScroll:true});
  }).observe($('dialogBackdrop'), {attributes:true, attributeFilter:['hidden']});
  syncScene();
})();
