/* Fit the complete menu into the visible viewport; no continuous frame loop. */
(() => {
  'use strict';
  const menu = document.getElementById('authScreen');
  const shell = menu?.querySelector('.hw-shell');
  if (!shell) return;
  let frame = 0;
  function fit() {
    frame = 0;
    const open = !menu.hidden;
    document.documentElement.classList.toggle('hw-menu-open',open);
    if (!open || !shell.offsetHeight || !shell.offsetWidth) return;
    const padding = getComputedStyle(menu);
    const height = menu.clientHeight-parseFloat(padding.paddingTop)-parseFloat(padding.paddingBottom);
    const width = menu.clientWidth-parseFloat(padding.paddingLeft)-parseFloat(padding.paddingRight);
    const scale = Math.max(0.05,Math.min(1,height/shell.offsetHeight,width/shell.offsetWidth));
    shell.style.setProperty('--hw-fit',String(scale));
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(fit); }
  const resize = new ResizeObserver(schedule);
  resize.observe(menu); resize.observe(shell);
  new MutationObserver(schedule).observe(menu,{attributes:true,attributeFilter:['hidden']});
  window.visualViewport?.addEventListener('resize',schedule);
  document.fonts?.ready.then(schedule);
  shell.querySelectorAll('img').forEach(img=>img.addEventListener('load',schedule));
  schedule();
})();
