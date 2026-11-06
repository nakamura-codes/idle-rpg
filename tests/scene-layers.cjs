/* Static scene structure, optional-art failure paths, races and HUD protection. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),shots=process.env.HUD_SCREENSHOTS;
const original=execFileSync('git',['show','1373015d3e1b90d9d282513f308a3468033140e5:index.html'],{cwd:root,encoding:'utf8'});
const originalGame=execFileSync('git',['show','1373015d3e1b90d9d282513f308a3468033140e5:game.js'],{cwd:root,encoding:'utf8'});
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.woff':'font/woff'})[path.extname(file)]||'application/octet-stream'});res.end(e?'':b);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--disable-vulkan','--disable-features=Vulkan']});
 const errors=[];
 async function open(mode){
  const p=await browser.newPage({viewport:{width:1366,height:768}});p.on('pageerror',e=>errors.push(e.message));
  if(mode==='baseline')await p.route('**/',r=>r.fulfill({contentType:'text/html',body:original}));
  await p.route('**/game.js?*',r=>r.fulfill({contentType:'application/javascript',body:(mode==='baseline'?originalGame:fs.readFileSync(path.join(root,'game.js'),'utf8')).replace('  new Game();','  window.__sceneTest={g:new Game(),ZONES};')}));
  if(mode==='missing')await p.route('**/campos-de-cinza-foreground.png',r=>r.fulfill({status:404,body:''}));
  if(mode==='mismatch'){const pixel=await sharp({create:{width:8,height:8,channels:4,background:'#fff'}}).png().toBuffer();await p.route('**/campos-de-cinza-mist.png',r=>r.fulfill({contentType:'image/png',body:pixel}));}
  if(mode==='empty')await p.route('**/scene-layers.js?*',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'scene-layers.js'),'utf8').replace('// Public configuration',"SCENE_CONFIG.regions[0].layers=[];\n  // Public configuration")}));
  if(mode==='stall')await p.route('**/scene-layers.js?*',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'scene-layers.js'),'utf8').replace('loadTimeoutMs:6000','loadTimeoutMs:120')}));
  await p.goto('http://127.0.0.1:'+server.address().port);await p.click('[data-menu="new"]');await p.fill('#newProfileName','Camadas teste');await p.click('#createProfileForm button');await p.waitForFunction(()=>document.documentElement.classList.contains('hw-game-active')&&!document.documentElement.classList.contains('hw-menu-open'));
  await p.evaluate(()=>{const {g}=window.__sceneTest;g.stopLoop();g.startLoop=()=>{};g.stepClock=()=>{};g.state.heroHp=g.bonuses().maxHp;});return p;
 }
 async function scene(p,zone,kind){await p.evaluate(({zone,kind})=>{const {g,ZONES}=window.__sceneTest,z=ZONES[zone];g.state.zone=zone;g.state.farmStage=null;g.state.deadUntil=0;g.state.event=null;g.state.zoneProgress[zone].stage=kind==='boss'?10:kind==='miniboss'?5:1;g.state.mob={name:kind==='boss'?z.boss:kind==='miniboss'?z.miniboss:z.names[0],kind,hp:100,maxHp:100,level:42};g.lastZoneRendered=-1;g.clearCombatVisuals();g.clearCombatNumbers();g.renderCore();}, {zone,kind});await p.locator('#monsterArt img').evaluate(n=>n.decode());await p.waitForTimeout(650);}
 async function settled(p){await p.waitForFunction(()=>['single','layered','fallback'].includes(document.getElementById('battlefield').dataset.sceneMode));}
 async function boxes(p){return p.evaluate(()=>Object.fromEntries(['combatHero','attackTarget','mobHealthProgress','heroHealthProgress','lifeOrbFill','goldValue'].map(id=>{const b=document.getElementById(id).getBoundingClientRect();return [id,[b.x,b.y,b.width,b.height].map(v=>Math.round(v*100)/100)];})));}
 try{
  const p=await open('normal'),before=await open('baseline');if(shots)fs.mkdirSync(shots,{recursive:true});
  for(const [width,height]of (process.env.SCENE_FAULTS_ONLY?[]:[[1366,768],[1920,1080],[1024,600]])){
   await p.setViewportSize({width,height});await before.setViewportSize({width,height});
   for(let zone=0;zone<6;zone++)for(const kind of ['normal','miniboss','boss']){
    await scene(p,zone,kind);await settled(p);await scene(before,zone,kind);
    assert.deepEqual(await boxes(p),await boxes(before),`${width} zone ${zone} ${kind}: original actor/HUD geometry`);
    const data=await p.evaluate(()=>{const a=document.getElementById('battlefield');return {mode:a.dataset.sceneMode,slots:[...a.querySelectorAll('[data-scene-layer]')].map(n=>n.dataset.sceneLayer),images:[...a.querySelectorAll('.scene-layer-image')].map(n=>({src:n.getAttribute('src'),animation:getComputedStyle(n).animationName,transform:getComputedStyle(n).transform,filter:getComputedStyle(n).filter,depth:n.dataset.depth,speed:n.dataset.parallaxSpeed})),z:['.scene-foreground','.scene-effects','.mob-info'].map(s=>Number(getComputedStyle(a.querySelector(s)).zIndex)),sparkParents:[...a.querySelectorAll('.combat-spark')].every(n=>n.parentElement.dataset.sceneLayer==='effects')};});
    assert.deepEqual(data.slots,['distant','middle','ground','mist','characters','foreground','effects']);assert.ok(data.sparkParents);assert.ok(data.z[0]<data.z[1]&&data.z[1]<data.z[2]);assert.equal(data.mode,zone===0&&kind!=='boss'?'layered':'single');assert.equal(data.images.length,zone===0&&kind!=='boss'?3:1);for(const img of data.images){assert.equal(img.animation,'none');assert.equal(img.transform,'none');assert.equal(img.filter,'none');assert.ok(img.depth&&img.speed);}
    if(shots&&width===1366&&zone===0&&kind==='normal')await p.screenshot({path:path.join(shots,'campos-de-cinza-layered.png')});
   }
   console.log('PASS '+width+'x'+height+': six regions/common/miniboss/boss, exact baseline actor/HUD geometry, static layers and stacking order');
  }
  assert.ok(await p.evaluate(()=>window.SCENE_LAYERS===window.HELLWARD_SCENE_CONFIG.regions));
  for(let zone=0;zone<6;zone++){
    const entries=await p.evaluate(zone=>window.SCENE_LAYERS[zone].layers.map(layer=>({id:layer.id,file:layer.file,slot:layer.slot,src:layer.src,depth:layer.depth,speed:layer.parallaxSpeed,blur:layer.blur,opacity:layer.opacity})),zone);
    assert.deepEqual(entries.map(x=>x.id).sort(),['distant','middle','ground','mist','foreground'].sort());
    for(const layer of entries){assert.equal(layer.id,layer.slot);assert.equal(layer.file,layer.src);for(const key of ['depth','speed','blur','opacity'])assert.equal(typeof layer[key],'number');}
  }
  // Reuse a bundled PNG only as a test overlay in Bosque: no new production art.
  await scene(p,1,'normal');
  await p.evaluate(()=>{window.SCENE_LAYERS[1].layers.find(layer=>layer.id==='mist').file='assets/backgrounds/layers/campos-de-cinza-mist.png';document.dispatchEvent(new Event('hellward:scene-layers-refresh'));});
  await settled(p);assert.equal(await p.locator('#battlefield').getAttribute('data-scene-mode'),'layered');assert.equal(await p.locator('.scene-layer-image').count(),2);
  await p.route('**/missing-bosque.png',route=>route.fulfill({status:404,body:''}));
  await p.evaluate(()=>{window.SCENE_LAYERS[1].layers.find(layer=>layer.id==='mist').file='assets/backgrounds/layers/missing-bosque.png';document.dispatchEvent(new Event('hellward:scene-layers-refresh'));});
  await settled(p);assert.equal(await p.locator('#battlefield').getAttribute('data-scene-mode'),'fallback');assert.equal(await p.locator('.scene-layer-image').count(),0);
  await p.evaluate(()=>{window.SCENE_LAYERS[1].layers.find(layer=>layer.id==='mist').file=null;document.dispatchEvent(new Event('hellward:scene-layers-refresh'));});await settled(p);
  console.log('PASS complete SCENE_LAYERS entries/compatible aliases and loaded/missing Bosque overlay');
  await p.setViewportSize({width:1366,height:768});await scene(p,0,'normal');await settled(p);
  await p.evaluate(()=>{window.HELLWARD_SCENE_CONFIG.regions[0].layers[1].blur=.0625;document.dispatchEvent(new Event('hellward:scene-layers-refresh'));});await settled(p);assert.equal(await p.locator('[data-scene-layer=mist] img').evaluate(n=>getComputedStyle(n).filter),'none');assert.equal(await p.locator('[data-scene-layer=mist] img').getAttribute('data-blur'),'0.0625');await p.evaluate(()=>{window.HELLWARD_SCENE_CONFIG.regions[0].layers[1].blur=0;document.dispatchEvent(new Event('hellward:scene-layers-refresh'));});await settled(p);
  const stable=await p.evaluate(async()=>{const a=document.getElementById('battlefield'),images=[...a.querySelectorAll('.scene-layer-image')],old=JSON.stringify(window.__sceneTest.g.state);let writes=0;const mo=new MutationObserver(r=>writes+=r.length);for(const n of a.querySelectorAll('.scene-assets'))mo.observe(n,{attributes:true,childList:true,subtree:true});for(let n=0;n<100;n++)window.__sceneTest.g.renderCore();await new Promise(r=>setTimeout(r,120));mo.disconnect();return {same:images.every((n,i)=>n===a.querySelectorAll('.scene-layer-image')[i]),unchanged:old===JSON.stringify(window.__sceneTest.g.state),writes};});assert.deepEqual(stable,{same:true,unchanged:true,writes:0});
  // An opaque test foreground with an enormous child z-index cannot hide HUD/damage.
  await p.evaluate(()=>{const g=window.__sceneTest.g;g.floatNumber('12345','crit');for(const a of document.getElementById('damageLayer').getAnimations({subtree:true})){a.pause();a.currentTime=350;}});
  const guards=await p.evaluate(()=>['.mob-info','#damageLayer','#combatHero','#attackTarget'].map(selector=>{const parent=document.querySelector(selector),mark=document.createElement('i');mark.className='paint-order-guard';mark.style.cssText='position:absolute;left:8px;top:8px;width:6px;height:6px;background:rgb(20,200,50)!important;opacity:1!important;z-index:999999';parent.append(mark);return mark.getBoundingClientRect().toJSON();}));
  await p.addStyleTag({content:'[data-scene-layer=foreground] .scene-assets{background:#f0f!important;z-index:999999!important}'});
  for(const clip of guards){const {data,info}=await sharp(await p.screenshot({clip})).removeAlpha().raw().toBuffer({resolveWithObject:true}),n=(Math.floor(info.height/2)*info.width+Math.floor(info.width/2))*3;assert.ok(Math.abs(data[n]-20)<3&&Math.abs(data[n+1]-200)<3&&Math.abs(data[n+2]-50)<3,'An opaque foreground child cannot paint over actors, HUD or damage');}
  await p.locator('.paint-order-guard').evaluateAll(nodes=>nodes.forEach(n=>n.remove()));
  await p.locator('style').last().evaluate(n=>n.remove());await p.close();await before.close();console.log('PASS no DOM churn/save changes and opaque-foreground HUD/damage protection');
  for(const mode of ['missing','mismatch','empty']){const q=await open(mode);await settled(q);assert.equal(await q.locator('#battlefield').getAttribute('data-scene-mode'),'fallback');assert.equal(await q.locator('.scene-layer-image').count(),0);assert.ok(await q.locator('.arena-scenery').evaluate(n=>getComputedStyle(n).backgroundImage.includes('campos-de-cinza')));const kills=await q.evaluate(()=>{const g=window.__sceneTest.g,n=g.state.runKills;g.killMob();return g.state.runKills-n;});assert.equal(kills,1);await q.close();console.log('PASS '+mode+': original whole-background fallback and combat remains functional');}
  const q=await open('normal');await settled(q);let blocked;await q.route('**/campos-de-cinza-mist.png?race=1',r=>{blocked=r;});
  await q.evaluate(()=>{const c=window.HELLWARD_SCENE_CONFIG;c.regions[0].layers[1].src+='?race=1';document.dispatchEvent(new Event('hellward:scene-layers-refresh'));});await q.waitForTimeout(100);await scene(q,5,'boss');await settled(q);await blocked.continue();await q.waitForTimeout(300);assert.equal(await q.locator('.scene-layer-image').count(),1);assert.ok((await q.locator('.scene-layer-image').getAttribute('src')).includes('trono-do-crepusculo-boss'));await q.close();console.log('PASS late image response cannot overwrite another region/boss');
  const stalled=await open('stall');await settled(stalled);let held;await stalled.route('**/campos-de-cinza-mist.png?timeout=1',r=>{held=r;});await stalled.evaluate(()=>{window.HELLWARD_SCENE_CONFIG.regions[0].layers[1].src+='?timeout=1';document.dispatchEvent(new Event('hellward:scene-layers-refresh'));});await settled(stalled);assert.equal(await stalled.locator('#battlefield').getAttribute('data-scene-mode'),'fallback');await held.abort();await stalled.close();console.log('PASS bounded loading timeout keeps the original scenery');
  for(const name of ['mist','foreground']){const {data,info}=await sharp(path.join(root,'assets/backgrounds/layers/campos-de-cinza-'+name+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,1280);assert.equal(info.height,720);let visible=0,transparent=0;for(let n=3;n<data.length;n+=4){if(data[n]>0)visible++;else transparent++;}assert.ok(visible>100&&transparent>info.width*info.height*.5);if(name==='foreground')for(let y=0;y<720;y++)for(let x=200;x<1080;x++)assert.ok(data[(y*1280+x)*4+3]<=1,'Foreground center stays transparent (one alpha level of resize tolerance)');}
  assert.deepEqual(errors,[]);console.log('PASS matching PNG dimensions/alpha and no script errors');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
