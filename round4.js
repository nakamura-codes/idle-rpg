/* Cosmetic round 4 controllers. No rewards, balance writes or per-frame loops. */
(() => {
 'use strict';
 const FX_CONFIG={
  rewards:{poolSize:12,maxPerBurst:4,maxPerType:2,batchMs:85,durationMs:620,staggerMs:35,arcRem:5,pulseMs:170,digitMs:120},
  contact:{widthFactor:1.08,minWidthRem:1.4,minHeightRem:.875,maxHeightRem:1.75,heightFactor:.065,opacity:{small:.66,medium:.76,large:.82,giant:.87,colossal:.9}},
  ground:{bloomOpacity:.09,regions:[
   {color:'118 85 63',wet:.11,lights:[[.17,.48],[.72,.43]]},
   {color:'64 97 78',wet:.17,lights:[[.49,.24],[.76,.44]]},
   {color:'79 145 159',wet:.22,lights:[[.28,.51],[.72,.47]]},
   {color:'145 93 49',wet:.12,lights:[[.18,.45],[.72,.48]]},
   {color:'200 75 35',wet:.16,lights:[[.24,.51],[.77,.43]]},
   {color:'129 92 165',wet:.18,lights:[[.23,.42],[.73,.43]]}
  ]}
 };
 window.HELLWARD_ROUND4_CONFIG=FX_CONFIG;
 const $=id=>document.getElementById(id),root=document.documentElement,arena=$('battlefield');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),desktop=matchMedia('(min-width:1000px) and (min-height:600px)');
 const permitted=()=>!document.hidden&&desktop.matches&&!reduced.matches&&!root.classList.contains('hw-lite')&&root.dataset.screenEffects!=='off'&&root.classList.contains('hw-game-active')&&!$('appFrame').inert;
 function createRewards(){
  const c=FX_CONFIG.rewards,layer=document.createElement('div');layer.className='reward-flight-layer';layer.setAttribute('aria-hidden','true');document.body.append(layer);
  const counters={gold:$('goldValue'),souls:$('prestigeValue'),shards:$('fragmentValue')};
  const pills=Object.fromEntries(Object.entries(counters).map(([key,node])=>[key,node.closest('.resource-pill')]));
  const pool=Array.from({length:c.poolSize},()=>{const node=document.createElement('i'),icon=document.createElement('span');node.className='reward-flight';node.hidden=true;node.append(icon);layer.append(node);return {node,icon,animation:null,type:null,token:0};});
  const pulses=new Map(),digits=new Map();
  let owner=null,last=null,batch=null,timer=0,serial=0,resetNext=false,measureFrame=0,geometry={targets:{},arena:null,rem:16,width:1,height:1};
  function measure(){
   measureFrame=0;const r=arena.getBoundingClientRect();
   geometry={arena:{x:r.x,y:r.y,width:r.width,height:r.height},width:innerWidth,height:innerHeight,rem:parseFloat(getComputedStyle(root).fontSize)||16,targets:{}};
   for(const [key,pill]of Object.entries(pills)){const b=pill.querySelector('.resource-icon').getBoundingClientRect();if(b.width&&b.height)geometry.targets[key]={x:b.x+b.width/2,y:b.y+b.height/2};}
  }
  function scheduleMeasure(){if(!measureFrame)measureFrame=requestAnimationFrame(measure);}
  const observer=new ResizeObserver(scheduleMeasure);observer.observe(arena);observer.observe(document.querySelector('.topbar'));for(const pill of Object.values(pills))observer.observe(pill);
  window.addEventListener('resize',scheduleMeasure,{passive:true});document.fonts?.ready.then(scheduleMeasure);measure();
  function release(slot){slot.token=++serial;slot.animation?.cancel();slot.animation=null;slot.type=null;slot.node.hidden=true;}
  function flush(){clearTimeout(timer);timer=0;batch=null;for(const slot of pool)release(slot);for(const a of [...pulses.values(),...digits.values()])a.cancel();pulses.clear();digits.clear();}
  function pulse(type){
   if(!permitted())return;
   pulses.get(type)?.cancel();const a=pills[type].animate([{transform:'scale(1)'},{transform:'scale(1.035)',offset:.4},{transform:'scale(1)'}],{duration:c.pulseMs,easing:'ease-out'});pulses.set(type,a);
   a.finished.then(()=>{if(pulses.get(type)===a)pulses.delete(type);},()=>{});
  }
  function digit(type){
   if(!permitted())return;
   digits.get(type)?.cancel();const a=counters[type].animate([{opacity:.64},{opacity:1}],{duration:c.digitMs,easing:'ease-out'});digits.set(type,a);
   a.finished.then(()=>{if(digits.get(type)===a)digits.delete(type);},()=>{});
  }
  function styleIcon(slot,type){
   slot.node.className='reward-flight reward-'+type;
   const art=window.HELLWARD_ART?.status[type==='gold'?'gold':'souls'];
   slot.icon.style.cssText='';slot.icon.textContent=type==='shards'?'✧':'';
   if(type!=='shards'&&art){slot.icon.style.backgroundImage=`url('${art.src}')`;slot.icon.style.backgroundSize=`${art.cols*100}% ${art.rows*100}%`;slot.icon.style.backgroundPosition=`${art.col*100/(art.cols-1)}% ${art.row*100/(art.rows-1)}%`;}
  }
  function start(slot,type,amount,origin,index){
   const g=geometry,target=g.targets[type],r=g.arena;if(!target||!r?.width||!r.height)return;
   const x=r.x+origin.x*r.width,y=r.y+origin.y*r.height,dx=target.x-x,dy=target.y-y;
   const arc=c.arcRem*g.rem,controlX=dx*.5+(index%2?1:-1)*arc*.35,controlY=dy*.5-arc;
   const frames=[0,.25,.5,.75,1].map(t=>({offset:t,transform:`translate(${(2*(1-t)*t*controlX+t*t*dx)/g.rem}rem,${(2*(1-t)*t*controlY+t*t*dy)/g.rem}rem)`,opacity:t===0?.3:t===1?0:1}));
   styleIcon(slot,type);slot.node.style.left=x/g.width*100+'%';slot.node.style.top=y/g.height*100+'%';slot.node.dataset.amount=String(amount);slot.node.hidden=false;slot.type=type;
   const token=slot.token=++serial,entryOwner=owner;
   const a=slot.animation=slot.node.animate(frames,{duration:c.durationMs,delay:index*c.staggerMs,easing:'linear',fill:'both'});
   a.finished.then(()=>{if(slot.token!==token)return;release(slot);if(owner===entryOwner)pulse(type);},()=>{});
  }
  function emit(){
   timer=0;const job=batch;batch=null;if(!job||job.owner!==owner||!permitted())return;
   let used=0;
   for(const [type,amount]of Object.entries(job.gains)){
    if(!(amount>0)||!geometry.targets[type])continue;
    const count=Math.min(c.maxPerType,amount>=100?2:1);
    for(let n=0;n<count&&used<c.maxPerBurst;n++){
     const free=pool.find(slot=>!slot.animation);if(!free)break;
     start(free,type,amount/count,job.origin,used++);
    }
   }
  }
  function queue(gains,origin){
   if(!permitted())return;
   if(!batch)batch={owner,gains:{gold:0,souls:0,shards:0},origin};
   for(const key of Object.keys(batch.gains))batch.gains[key]+=gains[key]||0;
   batch.origin=origin;
   if(!timer)timer=setTimeout(emit,c.batchMs);
  }
  function sync(state,anchors={},size={width:1,height:1}){
   const values={gold:state.gold,souls:state.souls,shards:state.shards};
   for(const [key,value]of Object.entries(values))if(counters[key].dataset.actualValue!==String(value))counters[key].dataset.actualValue=String(value);
   const now={...values,kills:state.runKills,rebirths:state.rebirths};
   if(owner!==state||!last||resetNext){flush();owner=state;last=now;resetNext=false;return;}
   const soulGain=Math.max(0,now.souls-last.souls),ascended=now.rebirths!==last.rebirths;
   const shards=Math.max(0,now.shards-last.shards+(ascended?0:soulGain*10));
   const gold=Math.max(0,now.gold-last.gold),killed=now.kills>last.kills&&!ascended;
   if(now.gold<last.gold||now.souls<last.souls||(!soulGain&&now.shards<last.shards))flush();
   for(const key of Object.keys(values))if(now[key]!==last[key])digit(key);
   if(killed||shards||soulGain){
    const kind=ascended?'hero':shards?'event':'enemy',a=anchors[kind];
    const origin=a?.width?{x:(a.x+a.width/2)/size.width,y:(a.y+a.height*(kind==='event'?.5:.88))/size.height}:{x:kind==='hero'?.25:.73,y:.75};
    queue({gold,souls:soulGain,shards},origin);
   }
   last=now;
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)resetNext=true;flush();});
  window.addEventListener('pagehide',flush);reduced.addEventListener('change',flush);desktop.addEventListener('change',flush);
  new MutationObserver(()=>{if(!permitted())flush();}).observe(root,{attributes:true,attributeFilter:['class','data-screen-effects']});
  new MutationObserver(()=>{if(!permitted())flush();}).observe($('appFrame'),{attributes:true,attributeFilter:['inert']});
  return {sync,flush,get activeCount(){return pool.filter(s=>s.animation).length;},get poolSize(){return pool.length;}};
 }
 function createDepth(){
  const data=window.HELLWARD_ROUND4_ART;if(!data)return;
  const details=document.createElement('div');details.className='depth-ground-details';details.setAttribute('aria-hidden','true');
  for(let i=0;i<8;i++){const n=document.createElement('i');n.className=i<2?'depth-puddle':i<4?'depth-stain':'depth-pebble';n.style.setProperty('--detail-x',([34,76,18,61,9,42,81,92][i])+'%');n.style.setProperty('--detail-y',([8,17,11,24,19,9,25,6][i])+'%');details.append(n);}
  arena.querySelector('[data-scene-layer=ground]').append(details);
  const blooms=Array.from({length:2},()=>{const n=document.createElement('i');n.className='depth-bloom';n.setAttribute('aria-hidden','true');arena.querySelector('.arena-lighting').append(n);return n;});
  let zone=-1,frame=0;
  function configure(){
   const value=Number(arena.className.match(/\bzone-(\d+)\b/)?.[1]||0);if(value===zone)return;zone=value;
   const c=FX_CONFIG.ground.regions[zone]||FX_CONFIG.ground.regions[0];details.style.setProperty('--ground-detail-color',c.color);details.style.setProperty('--ground-wet',String(c.wet));
   blooms.forEach((n,i)=>{n.style.left=c.lights[i][0]*100+'%';n.style.top=c.lights[i][1]*100+'%';n.style.opacity=String(FX_CONFIG.ground.bloomOpacity);});
  }
  function fit(host,img,shadow,kind){
   if(!img?.naturalWidth||!shadow)return;const source=img.getAttribute('src').split('?')[0],contact=data.contacts[source];if(!contact)return;
   const box=host.getBoundingClientRect();if(!box.width||!box.height)return;
   const rem=parseFloat(getComputedStyle(root).fontSize)||16,c=FX_CONFIG.contact,scale=Math.min(box.width/img.naturalWidth,box.height/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;
   const x=(box.width-w)/2+(contact.foot[0]+contact.foot[1])/2*w,y=box.height-h+contact.foot[2]*h;
   const width=Math.min(box.width*.94,Math.max(c.minWidthRem*rem,(contact.foot[1]-contact.foot[0])*w*c.widthFactor));
   const height=Math.max(c.minHeightRem*rem,Math.min(c.maxHeightRem*rem,width*c.heightFactor));
   const values={left:(x-width/2)/box.width*100+'%',width:width/box.width*100+'%',bottom:(box.height-y-height/2)/box.height*100+'%',height:height/rem+'rem',opacity:String(c.opacity[kind]??c.opacity.medium)};
   for(const [key,value]of Object.entries(values))if(shadow.style.getPropertyValue('--contact-'+key)!==value)shadow.style.setProperty('--contact-'+key,value);
   shadow.dataset.contact='fitted';
  }
  function measure(){frame=0;fit($('combatHero'),$('combatHero').querySelector('img'),arena.querySelector('.hero-ground-shadow'),'medium');fit($('attackTarget'),$('monsterArt').querySelector('img'),arena.querySelector('.mob-shadow'),arena.dataset.monsterSize||'medium');}
  function schedule(){if(!frame)frame=requestAnimationFrame(measure);}
  const observer=new ResizeObserver(schedule);observer.observe($('combatHero'));observer.observe($('attackTarget'));
  new MutationObserver(()=>{const img=$('monsterArt').querySelector('img');if(img&&!img.complete)img.addEventListener('load',schedule,{once:true});schedule();}).observe($('monsterArt'),{childList:true});
  new MutationObserver(configure).observe(arena,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',schedule,{passive:true});document.fonts?.ready.then(schedule);configure();schedule();
 }
 window.HELLWARD_REWARD_FX=createRewards();createDepth();
})();
