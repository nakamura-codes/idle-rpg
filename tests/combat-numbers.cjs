/* Readability, true actor anchors, bounded DOM/timers and independent game state. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.env.HUD_SCREENSHOTS;
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.css':'text/css','.js':'application/javascript','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'});res.end(e?'':b);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--disable-vulkan','--disable-features=Vulkan']});const errors=[];
 try{
  const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/game.js?*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  new Game();','  window.__numbersTest={g:new Game(),ZONES};')}));
  await p.goto('http://127.0.0.1:'+server.address().port);await p.click('[data-menu="new"]');await p.fill('#newProfileName','Feedback visual');await p.click('#createProfileForm button');
  await p.evaluate(()=>{const {g}=window.__numbersTest;g.stopLoop();g.stepClock=()=>{};});
  for(const [width,height] of [[1366,768],[320,568],[390,844],[667,375],[844,390]]){
   await p.setViewportSize({width,height});
   for(const [zone,kind] of [[0,'normal'],[5,'miniboss'],[5,'boss']]){
    await p.evaluate(({zone,kind})=>{const {g,ZONES}=window.__numbersTest;g.clearCombatNumbers();g.state.zone=zone;g.state.event=null;g.state.zoneProgress[zone].stage=kind==='boss'?10:kind==='miniboss'?5:1;g.state.deadUntil=0;g.state.heroHp=g.bonuses().maxHp;g.state.mob={name:kind==='boss'?ZONES[zone].boss:kind==='miniboss'?ZONES[zone].miniboss:ZONES[zone].names[0],kind,hp:10000,maxHp:10000,level:42};g.lastZoneRendered=-1;g.renderCore();},{zone,kind});
    await p.locator('#monsterArt img').evaluate(img=>img.decode());
    await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const data=await p.evaluate(()=>{const {g}=window.__numbersTest;const before=JSON.stringify(g.state);const read=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=()=>{throw Error('Hit must not read layout');};try{g.floatNumber('−12,5k');g.floatNumber('CRÍTICO! −98,7k','crit');g.floatHeroNumber('−3,2k');g.floatHeroNumber('+4,8k ♥',true);}finally{Element.prototype.getBoundingClientRect=read;}
     const nodes=[...document.querySelectorAll('.combat-number')];for(const n of nodes)for(const a of n.getAnimations()){a.pause();a.currentTime=180;}
     const box=n=>n.getBoundingClientRect().toJSON();return {before,after:JSON.stringify(g.state),arena:box(document.getElementById('battlefield')),hero:box(document.getElementById('combatHero')),target:box(document.getElementById('attackTarget')),nodes:nodes.map(n=>({className:n.className,text:n.textContent,caption:n.dataset.caption,rect:box(n),font:parseFloat(getComputedStyle(n).fontSize),color:getComputedStyle(n).color,top:parseFloat(n.style.top),left:parseFloat(n.style.left),captionHeight:n.dataset.caption?16:0}))};});
    assert.equal(data.before,data.after,'Cosmetic numbers preserve game state');assert.equal(data.nodes.length,4);
    const crit=data.nodes.find(n=>n.caption==='CRÍTICO'),heal=data.nodes.find(n=>n.caption==='CURA'),normal=data.nodes.find(n=>n.className==='combat-number float-damage '),hurt=data.nodes.find(n=>n.className.includes('hero-hit'));
    assert.ok(crit.font>normal.font);assert.equal(crit.text,'−98,7k');assert.equal(heal.text,'+4,8k');assert.equal(new Set(data.nodes.map(n=>n.color)).size,4);
    for(const n of data.nodes){assert.ok(n.font>=18,`${width}: too small ${n.className}`);assert.ok(n.rect.x>=data.arena.x && n.rect.right<=data.arena.right+1 && n.rect.y-n.captionHeight>=data.arena.y && n.rect.bottom<=data.arena.bottom,`${width} ${kind} clipped ${JSON.stringify(n)}`);}
    assert.ok(Math.abs(crit.left-(data.target.x-data.arena.x+data.target.width/2))<20,'Critical stays with actual enemy, including colossal');
    assert.ok(Math.abs(hurt.left-(data.hero.x-data.arena.x+data.hero.width/2))<20,'Hero damage stays with hero');
    assert.notEqual(normal.top,crit.top,'Consecutive hits use separate lanes');
    assert.ok(normal.rect.bottom+2<=crit.rect.y-crit.captionHeight || normal.rect.right<crit.rect.x || normal.rect.x>crit.rect.right,'Critical badge must not cover the preceding number');
    assert.ok(hurt.rect.bottom+2<=heal.rect.y-heal.captionHeight || hurt.rect.right<heal.rect.x || hurt.rect.x>heal.rect.right,'Healing badge must not cover hero damage');
    if(shots && kind==='miniboss'){fs.mkdirSync(shots,{recursive:true});await p.screenshot({path:path.join(shots,`numbers-${width}x${height}.png`)});}
   }
   await p.evaluate(()=>{const {g}=window.__numbersTest;g.clearCombatNumbers();g.state.event={type:'chest',hp:1000,maxHp:1000,expiresAt:Date.now()+60000};g.lastEventRendered='';g.renderEvent();});
   await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const event=await p.evaluate(()=>{const {g}=window.__numbersTest;g.floatNumber('−123','event-hit');g.floatHeroNumber('+999 ♥',true);for(const n of document.querySelectorAll('.combat-number'))for(const a of n.getAnimations()){a.pause();a.currentTime=180;}const box=n=>n.getBoundingClientRect().toJSON();return {card:box(document.getElementById('eventOverlay')),art:box(document.getElementById('eventArt')),hit:box(document.querySelector('.event-hit')),heal:box(document.querySelector('.healing'))};});
   assert.ok(Math.abs((event.hit.x+event.hit.width/2)-(event.art.x+event.art.width/2))<=16,'Event feedback follows card art');
   assert.ok(event.heal.right<=event.card.x || event.heal.x>=event.card.right || event.heal.bottom<=event.card.y || event.heal.y>=event.card.bottom,'Healing does not cover the event card');
   console.log(`PASS ${width}x${height}: readable normal/crit/heal, real normal/miniboss/colossal anchors, lanes, events and unchanged state`);
  }
  const cap=await p.evaluate(()=>{const {g}=window.__numbersTest;g.clearCombatNumbers();for(let i=0;i<250;i++){g.floatNumber('−100');g.floatHeroNumber('+100 ♥',true);}return {enemy:g.combatNumbers.enemy.size,hero:g.combatNumbers.hero.size,dom:document.querySelectorAll('.combat-number').length};});
  assert.deepEqual(cap,{enemy:8,hero:5,dom:13},'Burst caps both live DOM and tracked removal timers');
  await p.waitForTimeout(1100);assert.equal(await p.locator('.combat-number').count(),0);assert.equal(await p.evaluate(()=>Object.values(window.__numbersTest.g.combatNumbers).reduce((n,g)=>n+g.size,0)),0);
  for(const mode of ['lite','reduce']){
   if(mode==='lite')await p.evaluate(()=>document.documentElement.classList.add('hw-lite'));else await p.emulateMedia({reducedMotion:'reduce'});
   const motion=await p.evaluate(()=>{const {g}=window.__numbersTest;g.floatNumber('−12');const n=document.querySelector('.combat-number'),a=n.getAnimations()[0];a.pause();a.currentTime=0;const from=getComputedStyle(n).transform;a.currentTime=350;return {from,to:getComputedStyle(n).transform,name:getComputedStyle(n).animationName};});
   assert.equal(motion.from,motion.to);assert.equal(motion.name,'hw-number-still');await p.evaluate(()=>{window.__numbersTest.g.clearCombatNumbers();document.documentElement.classList.remove('hw-lite');});
  }
  await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>{const {g}=window.__numbersTest;g.floatNumber('−12');g.floatHeroNumber('+4 ♥',true);});
  await p.click('#switchProfile');assert.equal(await p.locator('.combat-number').count(),0);assert.equal(await p.evaluate(()=>Object.values(window.__numbersTest.g.combatNumbers).reduce((n,g)=>n+g.size,0)),0);
  assert.deepEqual(errors,[]);console.log('PASS burst DOM/timer caps, timed expiry, lite/reduced motion and menu cleanup');await p.close();
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
