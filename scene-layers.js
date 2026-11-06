/* Shared scene layers and configurable desktop parallax for every region. */
(() => {
  'use strict';
  const FX_CONFIG = {
    parallax: {enabled:true, regions:null, horizontalPercent:1.1, verticalPercent:.55,
      overscanPercent:4, transitionSeconds:.55, middleSpeed:.65, groundSpeed:.18,
      idleMs:22000,idleXPercent:.16,idleYPercent:.045,hitRem:.055,criticalRem:.13,phaseRem:.18,hitMs:230,criticalMs:320,phaseMs:420,gapMs:140,criticalGapMs:600},
    depth:{enabled:true}
  };
  // id/file are the public fields. slot/src remain compatible aliases so existing
  // configuration edits and integrations keep working without a save migration.
  function sceneLayer(spec) {
    const {slot,src,id=slot,file=src,...rest}=spec;
    const layer={id,file,...rest};
    Object.defineProperties(layer,{
      slot:{enumerable:true,get(){return this.id;},set(value){this.id=value;}},
      src:{enumerable:true,get(){return this.file;},set(value){this.file=value;}}
    });
    return layer;
  }
  const region = (slug, name, overlays = [], speed = .45) => {
    const base = `assets/backgrounds/fast/${slug}`,depthArt=window.HELLWARD_ROUND4_ART?.far[slug];
    const layers = [
      {slot:'distant',depthSrc:depthArt?.src,bossDepthSrc:depthArt?.bossSrc,bakedBlur:depthArt?.blur||0,src:base+'.webp?v=dark-14', bossSrc:base+'-boss.webp?v=dark-14',
        mobileSrc:base+'-mobile.webp?v=dark-14', bossMobileSrc:base+'-boss-mobile.webp?v=dark-14',
        depth:0, parallaxSpeed:speed, blur:0, opacity:1},
      ...overlays
    ];
    const reserved=[['middle',.25,.65],['ground',.4,.18],['mist',.5,1.3],['foreground',.9,1.6]];
    for(const [slot,depth,parallaxSpeed]of reserved){
      if(!layers.some(layer=>(layer.id??layer.slot)===slot))layers.push(slot==='ground'?
        {slot,src:base+'.webp?v=dark-14',bossSrc:base+'-boss.webp?v=dark-14',depthOnly:true,mask:'ground',depth,parallaxSpeed,blur:0,opacity:1}:
        {slot,src:null,depth,parallaxSpeed,blur:0,opacity:1});
    }
    return {name,layers:layers.map(sceneLayer)};
  };
  const SCENE_CONFIG = {
    loadTimeoutMs:6000, cacheLimit:32,
    order:['distant','middle','ground','mist','characters','foreground','effects'],
    regions:[
      region('campos-de-cinza','Campos de Cinza',[
        {slot:'mist',src:'assets/backgrounds/layers/campos-de-cinza-mist.png',depth:.5,parallaxSpeed:1.3,blur:0,opacity:.28,desktopOnly:true,commonOnly:true},
        {slot:'foreground',depthSrc:window.HELLWARD_ROUND4_ART?.foreground[0]?.src,bakedBlur:window.HELLWARD_ROUND4_ART?.foreground[0]?.blur||0,src:'assets/backgrounds/layers/campos-de-cinza-foreground.png',depth:.9,parallaxSpeed:1.6,blur:0,opacity:.72,desktopOnly:true,commonOnly:true}
      ], .45),
      region('bosque-profanado','Bosque Profanado'),
      region('criptas-afogadas','Criptas Afogadas'),
      region('fortaleza-de-ferro','Fortaleza de Ferro'),
      region('fendas-infernais','Fendas Infernais'),
      region('trono-do-crepusculo','Trono do Crepúsculo')
    ]
  };
  // Both names reference the same regional entries; no existing integration is renamed.
  const SCENE_LAYERS=SCENE_CONFIG.regions;
  window.SCENE_LAYERS=SCENE_LAYERS;
  // Public configuration is independent of saves. null regions enables all configured entries.
  window.HELLWARD_SCENE_CONFIG = SCENE_CONFIG;
  window.HELLWARD_PARALLAX_CONFIG = FX_CONFIG.parallax;
  window.HELLWARD_DEPTH_CONFIG = FX_CONFIG.depth;
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
    const depthOn=FX_CONFIG.depth.enabled&&!small.matches&&!document.documentElement.classList.contains('hw-lite')&&Boolean(window.HELLWARD_ROUND4_ART);
    const key = `${zone}:${boss}:${small.matches}:${depthOn}`;
    if(!force && key===lastKey)return;
    lastKey=key;const token=++generation;
    parallax.configure(zone);
    clearImages();arena.dataset.sceneMode='loading';arena.dataset.depthOfField=String(depthOn);delete arena.dataset.sceneFailure;
    const config=SCENE_CONFIG.regions[zone];
    if(!config){fallback(token,'missing-region');return;}
    const layers=config.layers.filter(layer => layer.src && (!layer.depthOnly||depthOn) && (!layer.desktopOnly || !small.matches) && (!layer.commonOnly || !boss))
      .sort((a,b)=>a.depth-b.depth);
    if(!layers.length){fallback(token,'empty-config');return;}
    const selected=layers.map(layer => ({...layer,blur:depthOn&&layer.depthSrc?layer.bakedBlur:layer.blur,
      src:depthOn&&layer.depthSrc?(boss?layer.bossDepthSrc||layer.bossSrc||layer.depthSrc:layer.depthSrc):
        small.matches?(boss?layer.bossMobileSrc||layer.mobileSrc||layer.bossSrc||layer.src:layer.mobileSrc||layer.src):boss?layer.bossSrc||layer.src:layer.src}));
    try {
      for(const layer of selected)if(!slots.has(layer.slot) || ['characters','effects'].includes(layer.slot))throw new Error('invalid-slot');
      const sizes=await Promise.all(selected.map(layer => load(layer.src)));
      if(token!==generation)return;
      const first=sizes[0];
      if(sizes.some(size => size.width!==first.width || size.height!==first.height))throw new Error('mismatched-dimensions');
      for(const layer of selected){
        const image=document.createElement('img');
        image.className='scene-layer-image';image.alt='';image.draggable=false;image.decoding='async';
        if(layer.mask)image.dataset.sceneMask=layer.mask;
        image.dataset.depth=String(layer.depth);image.dataset.parallaxSpeed=String(layer.parallaxSpeed);image.dataset.blur=String(layer.blur);
        image.style.opacity=String(bounded(layer.opacity,0,1,1));
        // blur describes the exported artwork; never apply a real-time CSS blur.
        image.addEventListener('error',()=>fallback(token,'image-render-error'),{once:true});
        image.src=layer.src;
        slots.get(layer.slot).querySelector(':scope>.scene-assets').append(image);
      }
      arena.dataset.sceneMode=selected.length>1?'layered':'single';
      arena.dataset.sceneLayerCount=String(selected.length);
      if(selected.some(layer=>layer.slot==='mist'))arena.dataset.sceneHasMist='true';
    } catch(error) {fallback(token,error.message);}
  }
  function createParallax() {
    const c=FX_CONFIG.parallax,root=document.documentElement,frame=document.getElementById('appFrame');
    const reduced=matchMedia('(prefers-reduced-motion:reduce)');
    const desktop=matchMedia('(hover:hover) and (pointer:fine) and (min-width:48rem)');
    const planes=[...slots].filter(([slot])=>!['characters','effects'].includes(slot));
    let zone=-1,bounds=null,pending=0,x=0,y=0,lastImpact=-Infinity,lastCritical=-Infinity;
    const impulses=new Map();
    arena.style.setProperty('--scene-parallax-overscan',c.overscanPercent+'%');
    arena.style.setProperty('--scene-parallax-duration',c.transitionSeconds+'s');
    arena.style.setProperty('--scene-idle-ms',c.idleMs+'ms');arena.style.setProperty('--scene-idle-x',c.idleXPercent+'%');arena.style.setProperty('--scene-idle-y',c.idleYPercent+'%');
    function enabled(){
      return c.enabled&&(c.regions===null?Boolean(SCENE_LAYERS[zone]):c.regions.includes(zone))&&desktop.matches&&!reduced.matches&&
        document.visibilityState==='visible'&&!frame.inert&&root.classList.contains('hw-game-active')&&
        !root.classList.contains('hw-lite')&&root.dataset.screenEffects!=='off';
    }
    function center(){
      if(pending)cancelAnimationFrame(pending);
      pending=0;x=0;y=0;
      arena.style.removeProperty('--scene-parallax-x');arena.style.removeProperty('--scene-parallax-y');
    }
    // Bounds are read on entry/resize/lifecycle changes, never in the frame callback.
    function measure(){if(enabled())bounds=arena.getBoundingClientRect();}
    function sync(){
      const wasActive=arena.dataset.parallaxActive==='true',active=enabled();
      if(wasActive!==active||!arena.hasAttribute('data-parallax-active'))arena.dataset.parallaxActive=String(active);
      if(!active){center();bounds=null;for(const a of impulses.values())a.cancel();impulses.clear();}else if(!wasActive)measure();
    }
    document.addEventListener('hellward:scene-impact',event=>{
      if(!enabled())return;const now=performance.now(),phase=Boolean(event.detail?.phase),critical=Boolean(event.detail?.critical);
      if(!phase&&now-lastImpact<c.gapMs)return;if(critical&&now-lastCritical<c.criticalGapMs)return;
      lastImpact=now;if(critical)lastCritical=now;
      const distance=phase?c.phaseRem:critical?c.criticalRem:c.hitRem,duration=phase?c.phaseMs:critical?c.criticalMs:c.hitMs;
      for(const [,node]of planes){const speed=Number(node.style.getPropertyValue('--scene-parallax-speed'))||0;impulses.get(node)?.cancel();
        const a=node.animate([{translate:'0rem 0rem'},{translate:`${distance*speed}rem ${-distance*speed*.35}rem`,offset:.3},{translate:'0rem 0rem'}],{duration,easing:'ease-out'});impulses.set(node,a);
        a.finished.then(()=>{if(impulses.get(node)===a)impulses.delete(node);},()=>{});
      }
    });
    arena.addEventListener('pointerenter',measure,{passive:true});
    arena.addEventListener('pointermove',event=>{
      if(event.pointerType!=='mouse'||!enabled()||!bounds?.width||!bounds?.height)return;
      x=Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1));
      y=Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1));
      if(pending)return;
      pending=requestAnimationFrame(()=>{
        pending=0;if(!enabled()){sync();return;}
        arena.style.setProperty('--scene-parallax-x',(-x*c.horizontalPercent).toFixed(3)+'%');
        arena.style.setProperty('--scene-parallax-y',(-y*c.verticalPercent).toFixed(3)+'%');
      });
    },{passive:true});
    arena.addEventListener('pointerleave',center,{passive:true});
    window.addEventListener('resize',()=>{center();sync();measure();},{passive:true});
    window.addEventListener('blur',center);
    window.addEventListener('pagehide',()=>{arena.dataset.parallaxActive='false';center();});
    document.addEventListener('visibilitychange',sync);
    document.addEventListener('hellward:screen-effects',sync);
    document.addEventListener('hellward:scenechange',sync);
    reduced.addEventListener('change',sync);desktop.addEventListener('change',sync);
    new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['class','data-screen-effects']});
    new MutationObserver(sync).observe(frame,{attributes:true,attributeFilter:['inert']});
    return {configure(value){
      zone=value;center();bounds=null;
      const layers=SCENE_CONFIG.regions[zone]?.layers||[];
      for(const [slot,node]of planes){
        const speed=layers.find(layer=>layer.slot===slot)?.parallaxSpeed??
          (slot==='middle'?c.middleSpeed:slot==='ground'?c.groundSpeed:0);
        node.style.setProperty('--scene-parallax-speed',String(speed));
      }
      sync();measure();
    }};
  }
  const parallax=createParallax();
  new MutationObserver(() => refresh()).observe(arena,{attributes:true,attributeFilter:['class']});
  small.addEventListener('change',()=>refresh());
  new MutationObserver(()=>refresh()).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  document.addEventListener('hellward:scene-layers-refresh',()=>refresh(true));
  refresh();
})();
