/* Item 1: immediate real HP, 500ms echo restart, full enemy/phase reset and cleanup. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.css':'text/css','.js':'application/javascript','.webp':'image/webp','.woff':'font/woff'})[path.extname(file)]||'application/octet-stream'});res.end(e?'':b);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--disable-vulkan','--disable-features=Vulkan']});
 try{
  const errors=[];
  for(const [width,height] of [[1366,768],[1920,1080],[1024,600],[320,568],[390,844],[844,390]].filter(([w,h])=>!process.env.DESKTOP_ONLY||(w>=1000&&h>=600))){
   const p=await browser.newPage({viewport:{width,height}});
   p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
   await p.route('**/game.js?*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  new Game();','  window.__healthTest={g:new Game(),freshMob,ZONES,FX_CONFIG};')}));
   await p.goto('http://127.0.0.1:'+server.address().port);
   await p.click('[data-menu="new"]');await p.fill('#newProfileName','Eco de dano');await p.click('#createProfileForm button');
   await p.waitForFunction(()=>document.documentElement.classList.contains('hw-game-active')&&!document.documentElement.classList.contains('hw-menu-open'));
   await p.evaluate(()=>{const {g}=window.__healthTest;g.stopLoop();g.startLoop=()=>{};g.stepClock=()=>{};});
   async function inspect(){return p.evaluate(()=>{
    const scale=id=>new DOMMatrix(getComputedStyle(document.getElementById(id)).transform).a;
    const row=(trail,fill,progress)=>{const n=document.getElementById(trail),a=n.getAnimations()[0];return {scale:scale(trail),real:scale(fill),count:n.getAnimations().length,delay:a?.effect.getTiming().delay,duration:a?.effect.getTiming().duration,aria:Number(document.getElementById(progress).getAttribute('aria-valuenow')),z:getComputedStyle(n).zIndex,fillZ:getComputedStyle(document.getElementById(fill)).zIndex,hidden:n.getAttribute('aria-hidden')};};
    return {enemy:row('mobHPDamageTrail','mobHPFill','mobHealthProgress'),hero:row('heroHPDamageTrail','heroHPFill','heroHealthProgress')};
   });}
   async function setHP(ratio){await p.evaluate(ratio=>{const {g}=window.__healthTest;g.state.mob.hp=g.state.mob.maxHp*ratio;g.state.heroHp=g.bonuses().maxHp*ratio;g.renderCore();},ratio);}
   for(const [zone,kind] of [[0,'normal'],[5,'miniboss'],[5,'boss']]){
    await p.evaluate(({zone,kind})=>{const {g,ZONES}=window.__healthTest;g.state.zone=zone;g.state.zoneProgress[zone].stage=kind==='boss'?10:kind==='miniboss'?5:1;g.state.deadUntil=0;g.state.mob={name:kind==='boss'?ZONES[zone].boss:kind==='miniboss'?ZONES[zone].miniboss:ZONES[zone].names[0],kind,hp:1000,maxHp:1000,level:42};g.state.heroHp=g.bonuses().maxHp;g.lastZoneRendered=-1;g.renderCore();},{zone,kind});
    await p.locator('#monsterArt img').evaluate(img=>img.decode());
    let value=await inspect();assert.equal(value.enemy.scale,1);assert.equal(value.enemy.count,0);
    await setHP(.6);
    await p.evaluate(()=>{for(const id of ['mobHPDamageTrail','heroHPDamageTrail']){const a=document.getElementById(id).getAnimations()[0];a.pause();a.currentTime=250;}});
    value=await inspect();
    for(const r of Object.values(value)){
     assert.ok(Math.abs(r.real-.6)<.00001,'Real HP is immediate, including hero');assert.equal(r.scale,1);assert.equal(r.delay,500);assert.equal(r.duration,420);assert.equal(r.count,1);assert.equal(r.aria,60);assert.equal(r.hidden,'true');assert.ok(Number(r.fillZ)>Number(r.z));
    }
    // A hit halfway through the wait starts a fresh 500ms delay from the held value.
    await setHP(.5);
    await p.evaluate(()=>{for(const id of ['mobHPDamageTrail','heroHPDamageTrail']){const a=document.getElementById(id).getAnimations()[0];a.pause();a.currentTime=499;}});
    value=await inspect();for(const r of Object.values(value)){assert.equal(r.delay,500);assert.equal(r.scale,1);assert.ok(Math.abs(r.real-.5)<.00001);assert.equal(r.count,1);}
    // Interrupt a descending curve: preserve the displayed value and continue, no jump.
    const continuation=await p.evaluate(()=>{
     const {g}=window.__healthTest,ids=['mobHPDamageTrail','heroHPDamageTrail'];
     const scale=n=>new DOMMatrix(getComputedStyle(n).transform).a;
     const before=ids.map(id=>{const n=document.getElementById(id),a=n.getAnimations()[0];a.currentTime=710;return scale(n);});
     const read=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=()=>{throw Error('HP update must not measure geometry');};
     try{g.state.mob.hp=400;g.state.heroHp=g.bonuses().maxHp*.4;g.renderCore();}finally{Element.prototype.getBoundingClientRect=read;}
     return ids.map((id,i)=>{const n=document.getElementById(id),a=n.getAnimations()[0];a.pause();a.currentTime=0;return {before:before[i],after:scale(n),delay:a.effect.getTiming().delay,count:n.getAnimations().length};});
    });
    for(const r of continuation){assert.ok(r.before>.5&&r.before<1);assert.ok(Math.abs(r.before-r.after)<.00002,JSON.stringify(r));assert.equal(r.delay,0);assert.equal(r.count,1);}
    await p.evaluate(()=>{for(const id of ['mobHPDamageTrail','heroHPDamageTrail'])document.getElementById(id).getAnimations()[0].finish();});
    value=await inspect();for(const r of Object.values(value)){assert.ok(Math.abs(r.scale-.4)<.00001);assert.equal(r.count,0);}
    // Healing (even a tiny regeneration tick) snaps the echo to actual HP immediately.
    await setHP(.3);await setHP(.301);value=await inspect();
    for(const r of Object.values(value)){assert.ok(Math.abs(r.scale-.301)<.00001);assert.equal(r.count,0);}
    await setHP(.2);
    const replacement=await p.evaluate(()=>{const {g}=window.__healthTest;g.state.mob={...g.state.mob,hp:1000};g.renderCore();return {hp:g.state.mob.hp,count:document.getElementById('mobHPDamageTrail').getAnimations().length,scale:new DOMMatrix(getComputedStyle(document.getElementById('mobHPDamageTrail')).transform).a};});
    assert.equal(replacement.hp,1000);assert.equal(replacement.count,0);assert.equal(replacement.scale,1,'Same-named next enemy starts full without descent');
    await setHP(.5);
    const phase=await p.evaluate(()=>{const {g}=window.__healthTest;g.state.zoneProgress[g.state.zone].stage=g.state.zoneProgress[g.state.zone].stage===10?9:10;const before=JSON.stringify(g.state);g.renderEnemyHealth();return {unchanged:before===JSON.stringify(g.state),count:document.getElementById('mobHPDamageTrail').getAnimations().length,scale:new DOMMatrix(getComputedStyle(document.getElementById('mobHPDamageTrail')).transform).a,real:new DOMMatrix(getComputedStyle(document.getElementById('mobHPFill')).transform).a};});
    assert.ok(phase.unchanged);assert.equal(phase.count,0);assert.equal(phase.scale,1,'Phase alone resets full, even if the mob reference is reused');assert.equal(phase.real,.5,'Reset is visual and cannot heal gameplay HP');
    await setHP(.8);
    if(process.env.HUD_SCREENSHOTS&&kind==='boss'){
     await setHP(.45);await p.evaluate(()=>{for(const id of ['mobHPDamageTrail','heroHPDamageTrail']){const a=document.getElementById(id).getAnimations()[0];a.pause();a.currentTime=250;}});
     fs.mkdirSync(process.env.HUD_SCREENSHOTS,{recursive:true});await p.screenshot({path:path.join(process.env.HUD_SCREENSHOTS,`health-both-${width}x${height}.png`)});
    }
   }
   await setHP(1);
   const unchanged=await p.evaluate(()=>{const {g}=window.__healthTest,before=JSON.stringify(g.state);let writes=0;const observer=new MutationObserver(rows=>writes+=rows.length);for(const id of ['mobHPDamageTrail','heroHPDamageTrail'])observer.observe(document.getElementById(id),{attributes:true});for(let i=0;i<100;i++)g.renderCore();return new Promise(resolve=>queueMicrotask(()=>{observer.disconnect();resolve({writes,unchanged:before===JSON.stringify(g.state)});}));});
   assert.equal(unchanged.writes,0);assert.ok(unchanged.unchanged);
   const burst=await p.evaluate(()=>{const {g}=window.__healthTest;for(let i=1;i<=100;i++){g.state.mob.hp=g.state.mob.maxHp*(1-i*.009);g.state.heroHp=g.bonuses().maxHp*(1-i*.009);g.renderCore();}return {nodes:document.querySelectorAll('.hp-damage-trail').length,animations:[...document.querySelectorAll('.hp-damage-trail')].reduce((sum,n)=>sum+n.getAnimations().length,0)};});
   assert.deepEqual(burst,{nodes:2,animations:2});
   for(const mode of ['lite','reduce','config']){
    if(mode==='lite')await p.evaluate(()=>document.documentElement.classList.add('hw-lite'));
    if(mode==='reduce')await p.emulateMedia({reducedMotion:'reduce'});
    if(mode==='config')await p.evaluate(()=>window.__healthTest.FX_CONFIG.healthTrail.enabled=false);
    await setHP(.09);value=await inspect();for(const r of Object.values(value)){assert.equal(r.count,0);assert.ok(Math.abs(r.scale-.09)<.00001);}
    await p.evaluate(()=>{document.documentElement.classList.remove('hw-lite');window.__healthTest.FX_CONFIG.healthTrail.enabled=true;});await p.emulateMedia({reducedMotion:'no-preference'});await setHP(1);await setHP(.1);
   }
   await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
   value=await inspect();assert.ok(Object.values(value).every(r=>r.count===0));
   await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
   await setHP(.05);await p.click('#switchProfile');value=await inspect();assert.ok(Object.values(value).every(r=>r.count===0));
   console.log(`PASS ${width}x${height}: enemy/hero 500ms restart, smooth retarget, full enemy/phase reset, immediate heal/HP, fixed nodes and cleanup`);
   await p.close();
  }
  // A natural run checks completion/cleanup without seeking animations manually.
  const p=await browser.newPage({viewport:{width:1366,height:768}});
  await p.route('**/game.js?*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  new Game();','  window.__healthTest={g:new Game()};')}));
  await p.goto('http://127.0.0.1:'+server.address().port);await p.click('[data-menu="new"]');await p.fill('#newProfileName','Eco natural');await p.click('#createProfileForm button');
  await p.waitForFunction(()=>document.documentElement.classList.contains('hw-game-active')&&!document.documentElement.classList.contains('hw-menu-open'));
  await p.evaluate(()=>{const {g}=window.__healthTest;g.stopLoop();g.startLoop=()=>{};g.stepClock=()=>{};g.state.mob.hp=g.state.mob.maxHp;g.state.heroHp=g.bonuses().maxHp;g.renderCore();g.state.mob.hp*=.6;g.state.heroHp*=.6;g.renderCore();window.__trailWrites=0;window.__trailObserver=new MutationObserver(rows=>window.__trailWrites+=rows.length);for(const id of ['mobHPDamageTrail','heroHPDamageTrail'])window.__trailObserver.observe(document.getElementById(id),{attributes:true});});
  await p.waitForFunction(()=>[...document.querySelectorAll('.hp-damage-trail')].every(n=>!n.getAnimations().length));
  const settled=await p.evaluate(()=>{window.__trailObserver.disconnect();return {writes:window.__trailWrites,scales:[...document.querySelectorAll('.hp-damage-trail')].map(n=>new DOMMatrix(getComputedStyle(n).transform).a)};});
  assert.equal(settled.writes,0,'No DOM writes per frame or on completion');assert.ok(settled.scales.every(n=>Math.abs(n-.6)<.00001));
  await p.close();assert.deepEqual(errors,[]);console.log('PASS natural completion with zero per-frame DOM writes and no live animation left');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
