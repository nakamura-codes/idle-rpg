/* Regional ambience: fixed pool, CSS motion, no frame loop. Desktop first. */
(() => {
  'use strict';
  const ATMOSPHERE_CONFIG = {
    maxParticles:8, particleSteps:120, fogSteps:40, lightSteps:20,
    fogTravelRem:.45, particleTravelRem:16, particleSideRem:1.5,frontParticles:1,frontFogRatio:.78,frontParticleRatio:.82,
    regions:[
      {name:'Campos de Cinza',fogColor:'139 128 113',fogBack:.06,fogGround:.09,fogMs:42000,lightColor:'142 85 48',lightMin:.68,lightMax:.88,lightMs:8000,particle:{type:'ash',count:5,color:'183 163 138',sizeRem:.12,opacity:.32,durationMs:24000,rise:false}},
      {name:'Bosque Profanado',fogColor:'112 139 123',fogBack:.08,fogGround:.10,fogMs:48000,lightColor:'66 104 74',lightMin:.60,lightMax:.80,lightMs:10000,particle:{type:'leaf',count:4,color:'140 115 72',sizeRem:.24,opacity:.32,durationMs:30000,rise:false}},
      {name:'Criptas Afogadas',fogColor:'120 158 164',fogBack:.10,fogGround:.12,fogMs:50000,lightColor:'46 128 151',lightMin:.60,lightMax:.79,lightMs:10000,particle:{type:'snow',count:5,color:'151 186 190',sizeRem:.12,opacity:.33,durationMs:30000,rise:false}},
      {name:'Fortaleza de Ferro',fogColor:'104 92 83',fogBack:.04,fogGround:.06,fogMs:40000,lightColor:'175 91 35',lightMin:.70,lightMax:.91,lightMs:7500,particle:{type:'dust',count:4,color:'166 124 84',sizeRem:.11,opacity:.30,durationMs:26000,rise:false}},
      {name:'Fendas Infernais',fogColor:'114 74 67',fogBack:.06,fogGround:.08,fogMs:36000,lightColor:'191 46 21',lightMin:.65,lightMax:.90,lightMs:6500,particle:{type:'ember',count:6,color:'236 123 59',sizeRem:.14,opacity:.40,durationMs:24000,rise:true}},
      {name:'Trono do Crepúsculo',fogColor:'137 117 155',fogBack:.07,fogGround:.10,fogMs:46000,lightColor:'101 64 143',lightMin:.62,lightMax:.82,lightMs:9000,particle:{type:'soul',count:4,color:'174 151 189',sizeRem:.13,opacity:.32,durationMs:30000,rise:true}}
    ]
  };
  window.HELLWARD_ATMOSPHERE_CONFIG=ATMOSPHERE_CONFIG;
  const root=document.documentElement,arena=document.getElementById('battlefield'),frame=document.getElementById('appFrame');
  const desktop=matchMedia('(min-width:1000px) and (min-height:600px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const back=document.createElement('div'),ground=document.createElement('div'),field=document.createElement('div');
  back.className='atmo-fog atmo-fog-back';ground.className='atmo-fog atmo-fog-ground';field.className='atmo-particles';
  for(const node of [back,ground,field])node.setAttribute('aria-hidden','true');
  arena.querySelector('[data-scene-layer=middle]').append(back);
  arena.querySelector('[data-scene-layer=mist]').append(ground,field);
  const front=document.createElement('div'),frontFog=document.createElement('div'),frontField=document.createElement('div');
  front.className='scene-atmo-front';front.setAttribute('aria-hidden','true');frontFog.className='atmo-fog atmo-fog-front';frontField.className='atmo-particles atmo-particles-front';front.append(frontFog,frontField);arena.append(front);
  const particles=Array.from({length:ATMOSPHERE_CONFIG.maxParticles},()=>{const node=document.createElement('i');node.className='atmo-particle';field.append(node);return node;});
  let lastZone=-1;
  function lifecycle(){
    const enabled=desktop.matches&&!reduced.matches&&!root.classList.contains('hw-lite')&&root.dataset.screenEffects!=='off'&&root.classList.contains('hw-game-active');
    const mode=!enabled?'static':document.hidden||frame.inert?'paused':'active';
    if(arena.dataset.atmosphere!==mode)arena.dataset.atmosphere=mode;
  }
  function configure(force=false){
    const zone=Number(arena.className.match(/\bzone-(\d+)\b/)?.[1]||0),c=ATMOSPHERE_CONFIG.regions[zone];
    if(!c)return;
    if(force||zone!==lastZone){
      lastZone=zone;const p=c.particle;
      const values={'atmo-front-particle-ms':(p.durationMs*ATMOSPHERE_CONFIG.frontParticleRatio)+'ms','atmo-front-fog-ms':(c.fogMs*ATMOSPHERE_CONFIG.frontFogRatio)+'ms','atmo-fog-travel':(c.fogTravelRem??ATMOSPHERE_CONFIG.fogTravelRem)+'rem','atmo-fog-color':c.fogColor,'atmo-fog-back':c.fogBack,'atmo-fog-ground':c.fogGround,'atmo-fog-ms':c.fogMs+'ms','scene-light':c.lightColor,'atmo-light-min':c.lightMin,'atmo-light-max':c.lightMax,'atmo-light-ms':c.lightMs+'ms','atmo-color':p.color,'atmo-particle-opacity':p.opacity,'atmo-particle-ms':p.durationMs+'ms','atmo-particle-steps':ATMOSPHERE_CONFIG.particleSteps,'atmo-fade-steps':Math.round(ATMOSPHERE_CONFIG.particleSteps*.15),'atmo-core-steps':Math.round(ATMOSPHERE_CONFIG.particleSteps*.70),'atmo-fog-steps':ATMOSPHERE_CONFIG.fogSteps,'atmo-light-steps':ATMOSPHERE_CONFIG.lightSteps};
      for(const [key,value]of Object.entries(values))arena.style.setProperty('--'+key,String(value));
      field.dataset.type=p.type;frontField.dataset.type=p.type;
      const count=Math.min(particles.length,Math.max(0,Math.floor(Number(p.count)||0)));
      arena.dataset.ambientParticleCount=String(count);
      const frontCount=Math.min(count,Math.max(0,Math.min(2,c.frontParticles??ATMOSPHERE_CONFIG.frontParticles)));
      particles.forEach((node,i)=>{
        const parent=i<frontCount?frontField:field;if(node.parentElement!==parent)parent.append(node);
        node.hidden=i>=count;
        node.style.left=((i*19+zone*13+7)%96)+'%';node.style.top=p.rise?'78%':'12%';
        node.style.width=node.style.height=p.sizeRem+'rem';
        node.style.setProperty('--mote-dx',((i%3-1)*(p.sideRem??ATMOSPHERE_CONFIG.particleSideRem))+'rem');node.style.setProperty('--mote-dy',((p.rise?-1:1)*(p.travelRem??ATMOSPHERE_CONFIG.particleTravelRem))+'rem');
        // Phase offsets are whole timing steps so sparse particles update together.
        node.style.setProperty('--mote-delay',-(i*17%ATMOSPHERE_CONFIG.particleSteps)*p.durationMs/ATMOSPHERE_CONFIG.particleSteps+'ms');
      });
    }
    lifecycle();
  }
  new MutationObserver(()=>configure()).observe(arena,{attributes:true,attributeFilter:['class']});
  new MutationObserver(lifecycle).observe(root,{attributes:true,attributeFilter:['class','data-screen-effects','data-combat-idle-paused']});
  new MutationObserver(lifecycle).observe(frame,{attributes:true,attributeFilter:['inert']});
  for(const media of [desktop,reduced])media.addEventListener('change',lifecycle);
  document.addEventListener('visibilitychange',lifecycle);
  document.addEventListener('hellward:atmosphere-refresh',()=>configure(true));
  window.addEventListener('pageshow',lifecycle);
  window.addEventListener('pagehide',()=>{arena.dataset.atmosphere='paused';});
  configure();
})();
