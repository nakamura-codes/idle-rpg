/* UI preferences are independent of game saves. Apply theme before first paint. */
(()=>{'use strict';
 const root=document.documentElement;
 let theme='dark';try{theme=localStorage.getItem('hellward_ui_theme')==='classic'?'classic':'dark'}catch(_){}
 root.dataset.theme=theme;
 document.addEventListener('DOMContentLoaded',()=>{
  const themeButton=document.getElementById('themeToggle');
  const focusButton=document.getElementById('focusBattle');
  function updateTheme(){
   const dark=root.dataset.theme==='dark';
   themeButton.setAttribute('aria-pressed',String(dark));
   themeButton.textContent=dark?'☾ Escuro':'☀ Clássico';
   document.querySelector('meta[name="theme-color"]').content=dark?'#090c11':'#15120f';
  }
  themeButton.addEventListener('click',()=>{
   root.dataset.theme=root.dataset.theme==='dark'?'classic':'dark';
   try{localStorage.setItem('hellward_ui_theme',root.dataset.theme)}catch(_){}
   updateTheme();
  });updateTheme();
  focusButton.addEventListener('click',()=>{
   const focused=root.dataset.focus!=='battle';root.dataset.focus=focused?'battle':'normal';
   focusButton.setAttribute('aria-pressed',String(focused));focusButton.textContent=focused?'Restaurar':'Ampliar';
  });
 });
})();
