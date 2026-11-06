/* Scene preparation only: no parallax, animation loop or gameplay state. */
(() => {
  'use strict';
  const region = (slug, name, overlays = []) => {
    const base = `assets/backgrounds/fast/${slug}`;
    return {name, layers: [
      {slot:'distant', src:base+'.webp?v=dark-14', bossSrc:base+'-boss.webp?v=dark-14',
        mobileSrc:base+'-mobile.webp?v=dark-14', bossMobileSrc:base+'-boss-mobile.webp?v=dark-14',
        depth:0, parallaxSpeed:.1, blur:0, opacity:1},
      ...overlays
    ]};
  };
  const SCENE_CONFIG = {
    loadTimeoutMs:6000, cacheLimit:32, maxBlurRem:.125,
    order:['distant','middle','ground','mist','characters','foreground','effects'],
    regions:[
      region('campos-de-cinza','Campos de Cinza',[
        {slot:'mist',src:'assets/backgrounds/layers/campos-de-cinza-mist.png',depth:.5,parallaxSpeed:.2,blur:0,opacity:.28,desktopOnly:true,commonOnly:true},
        {slot:'foreground',src:'assets/backgrounds/layers/campos-de-cinza-foreground.png',depth:.9,parallaxSpeed:.6,blur:0,opacity:.72,desktopOnly:true,commonOnly:true}
      ]),
      region('bosque-profanado','Bosque Profanado'),
      region('criptas-afogadas','Criptas Afogadas'),
      region('fortaleza-de-ferro','Fortaleza de Ferro'),
      region('fendas-infernais','Fendas Infernais'),
      region('trono-do-crepusculo','Trono do Crepúsculo')
    ]
  };
  // Public configuration is independent of saves; speeds/depth are metadata only.
  window.HELLWARD_SCENE_CONFIG = SCENE_CONFIG;
  const arena = document.getElementById('battlefield');
  const small = matchMedia('(max-width:760px)');
  const slots = new Map(SCENE_CONFIG.order.map(slot => [slot, arena.querySelector(`[data-scene-layer="${slot}"]`)]));
  const effects = slots.get('effects');
  // Game creates the fixed spark pool before this deferred module runs.
  for(const spark of arena.querySelectorAll(':scope>.combat-spark'))effects.append(spark);
  const cache = new Map();
  let generation = 0, lastKey = '';
  const bounded = (n, min, max, fallback) => Number.isFinite(n) ? Math.max(min, Math.min(max,n)) : fallback;
  function load(src) {
    if(cache.has(src))return cache.get(src);
    // Local bundled artwork only. Nothing is read from imported save URLs.
    if(!/^assets\/backgrounds\/[a-z0-9_./-]+\.(png|webp)(\?[a-z0-9_=-]+)?$/i.test(src))return Promise.reject(new Error('invalid-path'));
    const pending = new Promise((resolve,reject) => {
      const image = new Image();
      const timer = setTimeout(() => finish(false),SCENE_CONFIG.loadTimeoutMs);
      let settled = false;
      function finish(ok) {
        if(settled)return;
        settled=true;clearTimeout(timer);image.onload=null;image.onerror=null;
        if(ok)resolve({width:image.naturalWidth,height:image.naturalHeight});
        else reject(new Error('missing-or-invalid-image'));
      }
      image.onload = () => image.decode().then(() => finish(true),() => finish(false));
      image.onerror = () => finish(false);
      image.src = src;
    });
    cache.set(src,pending);
    // Cache dimensions, not Image/DOM objects or decoded bitmap references.
    pending.catch(() => {if(cache.get(src)===pending)cache.delete(src);});
    while(cache.size>SCENE_CONFIG.cacheLimit)cache.delete(cache.keys().next().value);
    return pending;
  }
  function clearImages() {
    for(const slot of slots.values())slot.querySelector(':scope>.scene-assets')?.replaceChildren();
    delete arena.dataset.sceneHasMist;
    arena.dataset.sceneLayerCount='1';
  }
  function fallback(token, reason) {
    if(token!==generation)return;
    clearImages();arena.dataset.sceneMode='fallback';arena.dataset.sceneFailure=reason;
  }
  async function refresh(force=false) {
    const zone = Number(arena.className.match(/\bzone-(\d+)\b/)?.[1] || 0);
    const boss = arena.classList.contains('boss-fight');
    const key = `${zone}:${boss}:${small.matches}`;
    if(!force && key===lastKey)return;
    lastKey=key;const token=++generation;
    clearImages();arena.dataset.sceneMode='loading';delete arena.dataset.sceneFailure;
    const config=SCENE_CONFIG.regions[zone];
    if(!config){fallback(token,'missing-region');return;}
    const layers=config.layers.filter(layer => (!layer.desktopOnly || !small.matches) && (!layer.commonOnly || !boss));
    if(!layers.length){fallback(token,'empty-config');return;}
    const selected=layers.map(layer => ({...layer,src:small.matches ? (boss ? layer.bossMobileSrc || layer.mobileSrc || layer.bossSrc || layer.src : layer.mobileSrc || layer.src) : boss ? layer.bossSrc || layer.src : layer.src}));
    try {
      for(const layer of selected)if(!slots.has(layer.slot) || ['characters','effects'].includes(layer.slot))throw new Error('invalid-slot');
      const sizes=await Promise.all(selected.map(layer => load(layer.src)));
      if(token!==generation)return;
      const first=sizes[0];
      if(sizes.some(size => size.width!==first.width || size.height!==first.height))throw new Error('mismatched-dimensions');
      for(const layer of selected){
        const image=document.createElement('img');
        image.className='scene-layer-image';image.alt='';image.draggable=false;image.decoding='async';
        image.dataset.depth=String(layer.depth);image.dataset.parallaxSpeed=String(layer.parallaxSpeed);image.dataset.blur=String(layer.blur);
        image.style.opacity=String(bounded(layer.opacity,0,1,1));
        const blur=bounded(layer.blur,0,SCENE_CONFIG.maxBlurRem,0);
        if(blur)image.style.setProperty('filter',`blur(${blur}rem)`,'important');
        image.addEventListener('error',()=>fallback(token,'image-render-error'),{once:true});
        image.src=layer.src;
        slots.get(layer.slot).querySelector(':scope>.scene-assets').append(image);
      }
      arena.dataset.sceneMode=selected.length>1?'layered':'single';
      arena.dataset.sceneLayerCount=String(selected.length);
      if(selected.some(layer=>layer.slot==='mist'))arena.dataset.sceneHasMist='true';
    } catch(error) {fallback(token,error.message);}
  }
  new MutationObserver(() => refresh()).observe(arena,{attributes:true,attributeFilter:['class']});
  small.addEventListener('change',()=>refresh());
  document.addEventListener('hellward:scene-layers-refresh',()=>refresh(true));
  refresh();
})();
