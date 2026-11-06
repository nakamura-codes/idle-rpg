const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'});res.end(e?'':b);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.route('**/game.js?*',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  new Game();','  window.__parallaxTest={game:new Game(),ZONES};')}));
  await p.goto('http://127.0.0.1:'+server.address().port);
  await p.click('[data-menu="new"]');await p.fill('#newProfileName','Parallax');await p.click('#createProfileForm button');await p.waitForFunction(()=>document.getElementById('battlefield').dataset.parallaxActive==='true');
  await p.evaluate(()=>{const g=window.__parallaxTest.game;g.stopLoop();g.stepClock=()=>{};});
  const arena=p.locator('#battlefield'),box=await arena.boundingBox();
  async function move(right=true){await p.mouse.move(box.x+box.width*(right?.9:.1),box.y+box.height*.65);await p.waitForTimeout(650);}
  async function transforms(){return p.evaluate(()=>Object.fromEntries(['distant','ground','mist','characters','effects'].map(id=>[id,getComputedStyle(document.querySelector('[data-scene-layer="'+id+'"]')).transform])));}
  async function region(zone){await p.evaluate(zone=>{const {game:g,ZONES}=window.__parallaxTest;g.cancelEncounterFX?.();g.state.zone=zone;g.state.mob={name:ZONES[zone].names[0],kind:'normal',hp:100,maxHp:100,level:1};g.lastZoneRendered=-1;g.renderCore();},zone);}
  assert.equal(await arena.getAttribute('data-parallax-active'),'true');
  const actorBefore=await p.locator('#combatHero').boundingBox();
  await move();let t=await transforms();
  assert.notEqual(t.distant,'none');assert.notEqual(t.distant,t.mist);assert.equal(t.characters,'none');assert.equal(t.effects,'none');
  assert.deepEqual(await p.locator('#combatHero').boundingBox(),actorBefore);
  const farRight=t.distant;await move(false);assert.notEqual((await transforms()).distant,farRight);
  // Composited overscan covers the entire arena at both pointer extremes.
  for(const x of [box.x+1,box.x+box.width-1]){await p.mouse.move(x,box.y+1);await p.waitForTimeout(650);const r=await p.locator('.arena-scenery').boundingBox();assert.ok(r.x<=box.x&&r.y<=box.y&&r.x+r.width>=box.x+box.width&&r.y+r.height>=box.y+box.height);}
  await p.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await p.waitForTimeout(650);
  if(process.env.HUD_SCREENSHOTS){fs.mkdirSync(process.env.HUD_SCREENSHOTS,{recursive:true});await p.screenshot({path:path.join(process.env.HUD_SCREENSHOTS,'parallax-campos.png')});}
  for(let zone=1;zone<6;zone++){
    await region(zone);await move();assert.equal(await arena.getAttribute('data-parallax-active'),'true');
    const t=await transforms();assert.notEqual(t.distant,'none');assert.notEqual(t.distant,t.mist);assert.equal(t.characters,'none');assert.equal(t.effects,'none');
    for(const x of [box.x+1,box.x+box.width-1]){await p.mouse.move(x,box.y+1);await p.waitForTimeout(650);const r=await p.locator('.arena-scenery').boundingBox();assert.ok(r.x<=box.x&&r.y<=box.y&&r.x+r.width>=box.x+box.width&&r.y+r.height>=box.y+box.height);}
    if(process.env.HUD_SCREENSHOTS)await p.screenshot({path:path.join(process.env.HUD_SCREENSHOTS,'parallax-region-'+zone+'.png')});
  }
  await region(0);await move();
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>document.querySelector('#battlefield').dataset.parallaxActive==='false');assert.equal(await arena.getAttribute('data-parallax-active'),'false');assert.equal((await transforms()).distant,'none');
  await p.emulateMedia({reducedMotion:'no-preference'});await move();assert.equal(await arena.getAttribute('data-parallax-active'),'true');
  await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await arena.getAttribute('data-parallax-active'),'false');assert.equal((await transforms()).mist,'none');
  await p.evaluate(()=>{delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));});
  await p.click('#settingsButton');await p.click('#screenEffects');
  assert.equal(await p.locator('#screenEffects').isChecked(),false);assert.equal(await arena.getAttribute('data-parallax-active'),'false');
  if(process.env.HUD_SCREENSHOTS)await p.screenshot({path:path.join(process.env.HUD_SCREENSHOTS,'parallax-settings.png')});
  await p.reload();assert.equal(await p.locator('#screenEffects').isChecked(),false);
  await p.click('[data-menu="continue"]');await p.locator('.saved-profile').first().click();await p.click('#settingsButton');await p.click('#screenEffects');await p.keyboard.press('Escape');
  await move();assert.equal(await arena.getAttribute('data-parallax-active'),'true');
  await p.mouse.move(1,1);await p.waitForTimeout(650);assert.ok(!await arena.evaluate(el=>el.style.getPropertyValue('--scene-parallax-x')));
  // An idle pointer produces no scene style writes or continuous RAF loop.
  const writes=await p.evaluate(async()=>{const el=document.querySelector('#battlefield');let n=0;const observer=new MutationObserver(rows=>n+=rows.length);observer.observe(el,{attributes:true,attributeFilter:['style']});await new Promise(r=>setTimeout(r,200));observer.disconnect();return n;});assert.equal(writes,0);
  assert.deepEqual(errors,[]);
  console.log('PASS all six regions: independent planes, fixed actors, no exposed edges, reduced motion, hidden tab, preference persistence and idle writes');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
