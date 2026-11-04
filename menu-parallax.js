/* Pointer-driven menu depth. No idle animation loop and no battle listeners. */
(() => {
  'use strict';
  const menu=document.getElementById('authScreen');
  const scene=document.getElementById('menuScenery');
  const button=document.getElementById('menuMovement');
  if(!menu||!scene)return;
  const media=matchMedia('(min-width:901px) and (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
  const planes=[...scene.querySelectorAll('.menu-depth-plane')];
  const sources=['assets/menu/parallax/background.webp','assets/menu/parallax/foreground.webp'];
  const depth=[5,24];
  const connection=navigator.connection;
  let preferred=true;
  try{preferred=localStorage.getItem('hellward_menu_motion')!=='off';}catch{}
  let active=false,ready=false,loading=false,failed=false,frame=0,x=0,y=0;
  let width=innerWidth,height=innerHeight;
  const capable=()=>media.matches&&!connection?.saveData&&!(navigator.deviceMemory&&navigator.deviceMemory<=4)&&!(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4);
  const visible=()=>!menu.hidden&&!document.hidden;
  function paint(){
    frame=0;
    if(!active)return;
    planes.forEach((plane,n)=>{plane.style.transform=`translate3d(${-x*depth[n]}px,${-y*depth[n]*.45}px,0)`;});
  }
  function move(event){
    if(event.pointerType==='touch')return;
    x=Math.max(-1,Math.min(1,event.clientX/width*2-1));
    y=Math.max(-1,Math.min(1,event.clientY/height*2-1));
    if(!frame)frame=requestAnimationFrame(paint);
  }
  function center(){x=0;y=0;if(active&&!frame)frame=requestAnimationFrame(paint);}
  function setActive(value){
    if(active===value)return;
    active=value;scene.hidden=!value;
    menu.dataset.parallax=value?'active':'static';
    if(value){menu.addEventListener('pointermove',move,{passive:true});menu.addEventListener('pointerleave',center);}
    else{
      menu.removeEventListener('pointermove',move);menu.removeEventListener('pointerleave',center);
      cancelAnimationFrame(frame);frame=0;x=0;y=0;
      planes.forEach(plane=>plane.style.removeProperty('transform'));
    }
  }
  async function load(){
    loading=true;
    try{
      await Promise.all(sources.map(src=>{const image=new Image();image.src=src;return image.decode();}));
      planes.forEach((plane,n)=>plane.style.backgroundImage=`url("${sources[n]}")`);
      ready=true;
    }catch{failed=true;}finally{loading=false;sync();}
  }
  function sync(){
    const allowed=capable();
    if(button){
      button.disabled=!allowed;
      button.setAttribute('aria-pressed',String(allowed&&preferred));
      button.textContent='Movimento do cenário: '+(!allowed?'Estático':preferred?'Ativado':'Desativado');
    }
    const enabled=allowed&&preferred&&visible()&&!failed;
    setActive(enabled&&ready);
    if(enabled&&!ready&&!loading)load();
  }
  button?.addEventListener('click',()=>{
    preferred=!preferred;
    try{localStorage.setItem('hellward_menu_motion',preferred?'on':'off');}catch{}
    sync();
  });
  media.addEventListener('change',sync);
  connection?.addEventListener?.('change',sync);
  document.addEventListener('hellward:scenechange',sync);
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('resize',()=>{width=innerWidth;height=innerHeight;center();sync();},{passive:true});
  window.addEventListener('pagehide',()=>setActive(false));
  window.addEventListener('pageshow',sync);
  sync();
})();
