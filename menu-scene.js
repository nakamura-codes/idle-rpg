/* Small cached image patches; animation only changes transform and opacity. */
(() => {
  'use strict';
  const menu = document.getElementById('authScreen');
  if (!menu) return;
  const scene = document.createElement('div');
  scene.className = 'hw-scene';
  scene.setAttribute('aria-hidden', 'true');
  const stage = document.createElement('div');
  stage.className = 'hw-scene-stage';
  const parts = [
    ['clouds', 970, 25, 660, 320],
    ['banner', 170, 130, 170, 445],
    ['flames', 435, 490, 215, 325]
  ];
  for (const [name,x,y,width,height] of parts) {
    const patch = document.createElement('div');
    patch.className = `hw-scene-patch hw-scene-${name}`;
    Object.assign(patch.style, {left:`${x}px`,top:`${y}px`,width:`${width}px`,height:`${height}px`,backgroundPosition:`-${x}px -${y}px`});
    stage.append(patch);
  }
  const glow = document.createElement('div');
  glow.className = 'hw-scene-glow';
  stage.append(glow);
  scene.append(stage);
  menu.prepend(scene);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function resize() {
    const width = menu.clientWidth, height = menu.clientHeight;
    if (!width || !height) return;
    const scale = Math.max(width/1672,height/941);
    Object.assign(stage.style, {
      left:`${(width-1672*scale)*(width<=700?.35:.5)}px`,
      top:`${(height-941*scale)/2}px`,transform:`scale(${scale})`
    });
  }
  function sync() {
    const active = !menu.hidden && !document.hidden && !reduced.matches;
    scene.classList.toggle('is-paused',!active);
    scene.hidden = reduced.matches;
    menu.classList.toggle('hw-motion-paused',!active);
    if (active) resize();
  }
  new ResizeObserver(resize).observe(menu);
  new MutationObserver(sync).observe(menu,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',sync);
  sync();
})();
