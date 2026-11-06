/* Visual damage echo: real HP stays immediate, transient animation is bounded. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.join(root,decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
 fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.css':'text/css','.js':'application/javascript','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'});res.end(e?'':b);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--disable-vulkan','--disable-features=Vulkan']});
 const errors=[];
 try{
  for(const [width,height] of [[1366,768],[320,568],[390,844],[844,390]].filter(([w,h])=>!process.env.DESKTOP_ONLY || (w>=1000 && h>=600))){
   const p=await browser.newPage({viewport:{width,height}});p.on('pageerror',e=>errors.push(e.message));
   await p.route('**/game.js?*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  new Game();','  window.__healthTest={g:new Game(),freshMob,ZONES};')}));
   await p.goto('http://127.0.0.1:'+server.address().port);
   await p.click('[data-menu="new"]');await p.fill('#newProfileName','Barra de dano');await p.click('#createProfileForm button');
   await p.evaluate(()=>{const {g}=window.__healthTest;g.stopLoop();g.stepClock=()=>{};g.state.mob.hp=g.state.mob.maxHp=1000;g.renderCore();});
   const snapshot=await p.evaluate(()=>{const {g}=window.__healthTest;const before=JSON.stringify(g.state);g.renderCore();return {before,after:JSON.stringify(g.state)};});
   assert.equal(snapshot.before,snapshot.after,'Drawing HP cannot mutate saves/gameplay');
   for(const [zone,kind] of [[0,'normal'],[5,'miniboss'],[5,'boss']]){
    await p.evaluate(({zone,kind})=>{const {g,ZONES}=window.__healthTest;g.state.zone=zone;g.state.zoneProgress[zone].stage=kind==='boss'?10:kind==='miniboss'?5:1;g.state.mob={name:kind==='boss'?ZONES[zone].boss:kind==='miniboss'?ZONES[zone].miniboss:ZONES[zone].names[0],kind,hp:1000,maxHp:1000,level:42};g.lastZoneRendered=-1;g.renderCore();},{zone,kind});
    await p.locator('#monsterArt img').evaluate(img=>img.decode());
    const hit=await p.evaluate(()=>{const {g}=window.__healthTest;g.damageMob(400,false,false);g.renderCore();getComputedStyle(document.getElementById('mobHPDamageTrail')).transform;const a=document.getElementById('mobHPDamageTrail').getAnimations()[0];a.pause();a.currentTime=0;return {hp:g.state.mob.hp,red:document.getElementById('mobHPFill').style.transform,echo:getComputedStyle(document.getElementById('mobHPDamageTrail')).transform,now:document.getElementById('mobHealthProgress').getAttribute('aria-valuenow'),duration:a.effect.getTiming().duration};});
    assert.equal(hit.hp,600);assert.equal(hit.red,'scaleX(0.6)');assert.equal(hit.echo,'matrix(1, 0, 0, 1, 0, 0)');assert.equal(hit.now,'60');assert.equal(hit.duration,420);
    // Resume, then inspect a controlled mid-animation time. No real-time sleep dependency.
    const mid=await p.evaluate(()=>{const {g}=window.__healthTest;const a=document.getElementById('mobHPDamageTrail').getAnimations()[0];a.play();a.currentTime=250;const n=document.getElementById('mobHPDamageTrail');return {scale:Number(getComputedStyle(n).transform.match(/matrix\(([^,]+)/)[1]),labelZ:getComputedStyle(document.getElementById('mobHPText')).zIndex,echoZ:getComputedStyle(n).zIndex};});
    assert.ok(mid.scale>.6&&mid.scale<1);assert.ok(Number(mid.labelZ)>Number(mid.echoZ));
    const burst=await p.evaluate(()=>{const {g}=window.__healthTest;const old=document.getElementById('mobHPDamageTrail').getAnimations()[0];g.damageMob(100,false,false);g.renderCore();return {old:old.playState,count:document.getElementById('mobHPDamageTrail').getAnimations().length,delay:document.getElementById('mobHPDamageTrail').getAnimations()[0].effect.getTiming().delay,from:Number(getComputedStyle(document.getElementById('mobHPDamageTrail')).transform.match(/matrix\(([^,]+)/)[1])};});
    assert.equal(burst.old,'idle');assert.equal(burst.count,1);assert.equal(burst.delay,0);assert.ok(burst.from>=.6&&burst.from<=1);
    await p.evaluate(()=>document.getElementById('mobHPDamageTrail').getAnimations()[0].finish());
    assert.equal(await p.locator('#mobHPDamageTrail').evaluate(n=>getComputedStyle(n).transform),'matrix(0.5, 0, 0, 1, 0, 0)');
    const replacement=await p.evaluate(()=>{const {g}=window.__healthTest;g.state.mob={...g.state.mob,hp:1000};g.renderCore();return {a:document.getElementById('mobHPDamageTrail').getAnimations().length,scale:getComputedStyle(document.getElementById('mobHPDamageTrail')).transform};});
    assert.equal(replacement.a,0);assert.equal(replacement.scale,'matrix(1, 0, 0, 1, 0, 0)','Same-named next enemy must start full');
    await p.evaluate(()=>{const {g}=window.__healthTest;g.state.mob.hp=100;g.renderCore();});
    if(process.env.HUD_SCREENSHOTS){fs.mkdirSync(process.env.HUD_SCREENSHOTS,{recursive:true});await p.evaluate(()=>{const a=document.getElementById('mobHPDamageTrail').getAnimations()[0];a.pause();a.currentTime=90;});await p.screenshot({path:path.join(process.env.HUD_SCREENSHOTS,`health-${kind}-${width}x${height}.png`)});}
    await p.evaluate(()=>{const {g}=window.__healthTest;g.state.mob.hp=700;g.renderCore();});
    assert.equal(await p.evaluate(()=>document.getElementById('mobHPDamageTrail').getAnimations().length),0,'Healing must snap, not replay damage');
   }
   const unchanged=await p.evaluate(()=>{const {g}=window.__healthTest;const n=document.getElementById('mobHPDamageTrail');let count=0;const observer=new MutationObserver(r=>count+=r.length);observer.observe(n,{attributes:true});for(let i=0;i<100;i++)g.renderEnemyHealth();return new Promise(r=>queueMicrotask(()=>{observer.disconnect();r(count);}));});
   assert.equal(unchanged,0,'Unchanged health creates no repeated writes');
   await p.emulateMedia({reducedMotion:'reduce'});
   const reduced=await p.evaluate(()=>{const {g}=window.__healthTest;g.state.mob.hp=600;g.renderCore();return {count:document.getElementById('mobHPDamageTrail').getAnimations().length,visibility:getComputedStyle(document.getElementById('mobHPDamageTrail')).visibility};});
   assert.equal(reduced.count,0);assert.equal(reduced.visibility,'hidden');await p.emulateMedia({reducedMotion:'no-preference'});
   await p.evaluate(()=>document.documentElement.classList.add('hw-lite'));
   assert.equal(await p.evaluate(()=>{const {g}=window.__healthTest;g.state.mob.hp=500;g.renderCore();return document.getElementById('mobHPDamageTrail').getAnimations().length;}),0);
   await p.evaluate(()=>{document.documentElement.classList.remove('hw-lite');const {g}=window.__healthTest;g.state.mob.hp=400;g.renderCore();});
   await p.click('#switchProfile');assert.equal(await p.locator('#mobHPDamageTrail').evaluate(n=>n.getAnimations().length),0,'Menu cancels old combat animation');
   console.log(`PASS ${width}x${height}: normal/miniboss/boss, interrupted hits, respawn, heal, accessibility, lite/reduced motion, cleanup and cached writes`);
   await p.close();
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
