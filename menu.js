(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const sections = {new:'menuNew', continue:'menuContinue', load:'menuLoad', settings:'menuSettings', credits:'menuCredits', exit:'menuExit'};
  const titles = {new:'Iniciar jornada', continue:'Continuar jornada', load:'Carregar jogo', settings:'Configurações', credits:'Créditos', exit:'Sair'};
  function home() { $('menuHome').hidden=false; $('menuPanel').hidden=true; }
  function show(name) {
    $('menuHome').hidden=true; $('menuPanel').hidden=false;
    for (const [key,id] of Object.entries(sections)) $(id).hidden=key!==name;
    $('menuPanelTitle').textContent=titles[name];
    if (name==='continue') $('noProfiles').hidden=!$('savedProfiles').hidden;
    if (name==='settings') updateTheme();
    if (name==='new') $('newProfileName').focus(); else $('menuBack').focus();
  }
  function updateTheme() { $('menuTheme').textContent='Tema: '+(document.documentElement.dataset.theme==='classic'?'Clássico':'Escuro'); }
  document.querySelectorAll('[data-menu]').forEach(button=>button.addEventListener('click',()=>show(button.dataset.menu)));
  $('menuBack').addEventListener('click',home);
  $('authScreen').addEventListener('menu-open',home);
  $('menuTheme').addEventListener('click',()=>{ $('themeToggle').click(); updateTheme(); });
  document.addEventListener('keydown', e=>{if(e.key==='Escape' && !$('authScreen').hidden && !$('menuPanel').hidden) home();});
})();
