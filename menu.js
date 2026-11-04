(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const sections = {new:'menuNew', continue:'menuContinue', load:'menuLoad', settings:'menuSettings', credits:'menuCredits', exit:'menuExit'};
  const titles = {new:'Iniciar jornada', continue:'Continuar jornada', load:'Carregar jogo', settings:'Configurações', credits:'Créditos', exit:'Sair'};
  const buttons = [...document.querySelectorAll('#menuHome .hw-btn')];
  const SFX = true;            // coloque false para desligar os sons do menu
  let lastBtn = null, ctx = null, armed = false;

  // sons curtos gerados no código (só tocam depois do primeiro clique ou tecla)
  function beep(freq, dur, vol) {
    if (!SFX || !armed) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
    } catch (e) {}
  }
  const sndMove = () => beep(330, .09, .05);
  const sndOk = () => { beep(196, .3, .08); beep(392, .45, .05); };

  function home() {
    $('menuHome').hidden = false; $('menuPanel').hidden = true;
    (lastBtn || buttons[0]).focus({preventScroll: true});
  }
  function show(name) {
    $('menuHome').hidden = true; $('menuPanel').hidden = false;
    for (const [key, id] of Object.entries(sections)) $(id).hidden = key !== name;
    $('menuPanelTitle').textContent = titles[name];
    if (name === 'continue') $('noProfiles').hidden = !$('savedProfiles').hidden;
    if (name === 'settings') updateTheme();
    if (name === 'new') $('newProfileName').focus({preventScroll:true}); else $('menuBack').focus({preventScroll:true});
  }
  function updateTheme() { $('menuTheme').textContent = 'Tema: ' + (document.documentElement.dataset.theme === 'classic' ? 'Clássico' : 'Escuro'); }

  document.querySelectorAll('[data-menu]').forEach(button => button.addEventListener('click', () => {
    armed = true; lastBtn = button; sndOk(); show(button.dataset.menu);
  }));
  buttons.forEach(b => b.addEventListener('mouseenter', sndMove));
  $('menuBack').addEventListener('click', () => { armed = true; sndMove(); home(); });
  $('authScreen').addEventListener('menu-open', () => { $('menuHome').hidden = false; $('menuPanel').hidden = true; });
  $('menuTheme').addEventListener('click', () => { $('themeToggle').click(); updateTheme(); });
  document.addEventListener('pointerdown', () => { armed = true; }, {once: true});

  document.addEventListener('keydown', e => {
    if ($('authScreen').hidden) return;
    armed = true;
    if (!$('menuPanel').hidden) { if (e.key === 'Escape') home(); return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = buttons.indexOf(document.activeElement), last = buttons.length - 1;
    const n = e.key === 'ArrowDown' ? (i < 0 ? 0 : (i + 1) % buttons.length) : (i < 0 ? last : (i - 1 + buttons.length) % buttons.length);
    buttons[n].focus({preventScroll: true}); sndMove();
  });

})();
