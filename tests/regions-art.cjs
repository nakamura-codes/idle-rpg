/* Repeated bestiary dialogs and region/boss scenery on desktop and phones. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),roster=JSON.parse(fs.readFileSync(path.join(root,'CREATURES.json'),'utf8'));
const slugs=['campos-de-cinza','bosque-profanado','criptas-afogadas','fortaleza-de-ferro','fendas-infernais','trono-do-crepusculo'];
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream'});res.end(e?'':b);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--disable-vulkan','--disable-features=Vulkan']});
 try{
  const p=await browser.newPage({viewport:{width:1366,height:768}}),errors=[],shots=process.env.HUD_SCREENSHOTS;
  if(shots)fs.mkdirSync(shots,{recursive:true});
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await p.route('**/game.js?*',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  new Game();','  window.__regionsTest={game:new Game(),ZONES};')}));
  await p.goto(`http://127.0.0.1:${server.address().port}`);
  await p.click('[data-menu="new"]');await p.fill('#newProfileName','Bestiário');await p.click('#createProfileForm button');
  await p.waitForFunction(()=>document.getElementById('authScreen').hidden);
  await p.evaluate(()=>{const g=window.__regionsTest.game;g.stopLoop();g.stepClock=()=>{};});
  await p.click('[data-open-panel="zones"]');
  assert.equal(await p.locator('.bestiary-creature').count(),42);
  for(let n=0;n<42;n++){
   const z=Math.floor(n/7),i=n%7,button=`[data-inspect-zone="${z}"][data-inspect-creature="${i}"]`;
   for(let repeat=0;repeat<3;repeat++){
    await p.click(button);
    const modal=p.locator('#dialogText');
    assert.equal(await modal.locator('img').count(),1,`${roster[n].name}: exactly one portrait on opening ${repeat+1}`);
    assert.equal(await p.locator('#dialogTitle').textContent(),roster[n].name);
    const img=modal.locator('img');await img.evaluate(el=>el.decode());
    assert.equal(await img.getAttribute('src'),await p.locator(button+' img').getAttribute('src'));
    assert.ok((await img.getAttribute('src')).split('?')[0]===roster[n].asset,'Canonical portrait in dialog and region card');
    assert.equal(await modal.evaluate(el=>[...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).length),1,'One information block');
    const content=await modal.textContent();assert.equal(content.split(windowRegion(roster[n].region)).length-1,1,'One region caption');
    await p.click('#dialogActions button');assert.equal(await p.locator('#dialogBackdrop').isHidden(),true);
   }
  }
  // A non-creature dialog with the same caption must also lose the portrait.
  await p.evaluate(()=>{const g=window.__regionsTest.game;g.inspectMonster(0,0);g.dialog('Aviso',document.getElementById('dialogText').textContent);});
  assert.equal(await p.locator('#dialogText img').count(),0);await p.click('#dialogActions button');
  await p.keyboard.press('Escape');console.log('PASS 42 creature cards reopened three times: one portrait and one caption; generic dialogs clear old artwork');
  const regionalLight=new Set(),regionalMist=new Set();
  for(const [w,h] of [[1366,768],[390,844],[320,568],[844,390]]){
   await p.setViewportSize({width:w,height:h});
   for(let z=0;z<6;z++){
    const sources=[];
    for(const i of [0,5,6,0]){
     await p.evaluate(({z,i})=>{const {game:g,ZONES}=window.__regionsTest,zone=ZONES[z],kind=i===6?'boss':i===5?'miniboss':'normal';g.state.zone=z;g.state.farmStage=null;g.state.zoneProgress[z].stage=i===6?10:i===5?5:1;g.state.mob={name:i===6?zone.boss:i===5?zone.miniboss:zone.names[i],kind,hp:1e9,maxHp:1e9,level:50};g.lastZoneRendered=-1;g.renderCore();},{z,i});
     await p.locator('#monsterArt img').evaluate(el=>el.decode());
     assert.equal((await p.locator('#monsterArt img').getAttribute('src')).split('?')[0],roster[z*7+i].asset,'Arena uses canonical portrait');
     const src=await p.locator('.arena-scenery').evaluate(async el=>{const src=getComputedStyle(el).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];const img=new Image();img.src=src;await img.decode();return src;});
     const expected=slugs[z]+(i===6?'-boss':'')+(w<=760?'-mobile':'')+'.webp?v=dark-14';
     assert.ok(src.endsWith(expected),`${w}: ${src} should end in ${expected}`);sources.push(src);
     const atmosphere=await p.evaluate(()=>{
      const light=document.querySelector('.arena-lighting'),mist=document.querySelector('.arena-mist');
      const read=el=>{const s=getComputedStyle(el);return {background:s.backgroundImage,opacity:s.opacity,pointer:s.pointerEvents,animation:s.animationName,filter:s.filter,box:el.getBoundingClientRect().toJSON()};};
      return {light:read(light),mist:read(mist),shadows:[...document.querySelectorAll('.hero-ground-shadow,.mob-shadow')].map(read)};
     });
     for(const layer of [atmosphere.light,atmosphere.mist]){assert.equal(layer.pointer,'none');assert.equal(layer.animation,'none');assert.equal(layer.filter,'none');assert.ok(layer.box.width>0&&layer.box.height>0);}
     for(const shadow of atmosphere.shadows){assert.ok(shadow.box.width>0&&shadow.box.height>=14);assert.ok(Number(shadow.opacity)>.5);assert.equal(shadow.filter,'none');}
     regionalLight.add(atmosphere.light.background);regionalMist.add(atmosphere.mist.background+atmosphere.mist.opacity);
     if(w===1366&&z===0&&i===0&&sources.length===1){
      // Check painted output: a positioned shadow behind the scenery would fail.
      const clip=await p.locator('.hero-ground-shadow').boundingBox();
      const shown=await p.screenshot({clip});
      await p.addStyleTag({content:'.hero-ground-shadow,.mob-shadow{visibility:hidden!important}'});
      const hidden=await p.screenshot({clip});
      await p.locator('style').last().evaluate(el=>el.remove());
      const a=await sharp(shown).removeAlpha().raw().toBuffer(),b=await sharp(hidden).removeAlpha().raw().toBuffer();
      const darkening=a.reduce((sum,x,n)=>sum+b[n]-x,0)/a.length;
      assert.ok(darkening>.08,`Hero ground shadow must visibly darken the floor: ${darkening}`);
     }
     if(shots&&[0,6].includes(i))await p.screenshot({path:path.join(shots,`region-${z}-${i===6?'boss':'common'}-${w}.png`)});
    }
    assert.equal(sources[0],sources[1],'Miniboss belongs to the common regional arena');assert.notEqual(sources[1],sources[2],'Main boss owns its matching arena');assert.equal(sources[0],sources[3],'Leaving boss restores regional scenery');
   }
   await p.click('[data-open-panel="zones"]');
   const button='[data-inspect-zone="5"][data-inspect-creature="6"]';
   for(let n=0;n<3;n++){await p.click(button);assert.equal(await p.locator('#dialogText img').count(),1);const b=await p.locator('.dialog').boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=w+1&&b.y+b.height<=h+1,'Dialog stays inside viewport');await p.click('#dialogActions button');}
   await p.keyboard.press('Escape');console.log(`PASS six common/miniboss/boss scenery transitions and repeated portrait dialog at ${w}x${h}`);
  }
  assert.equal(regionalLight.size,6,'Six distinct regional light palettes');assert.equal(regionalMist.size,6,'Six distinct mist densities/colors');
  for(const slug of slugs)for(const boss of ['', '-boss'])for(const mobile of [false,true]){
   const m=await sharp(path.join(root,'assets/backgrounds/fast',slug+boss+(mobile?'-mobile':'')+'.webp')).metadata();
   assert.equal(m.width,mobile?720:1280);assert.equal(m.height,mobile?405:720);assert.equal(Boolean(m.hasAlpha),false,'Scene is full bleed');
  }
  assert.deepEqual(errors,[]);console.log('PASS 24 optimized scenery files and no missing assets or script errors');
 }finally{await browser.close();}
})().then(()=>server.close()).catch(e=>{console.error(e);server.close();process.exitCode=1});
function windowRegion(region){return ['Campos de Cinza','Bosque Profanado','Criptas Afogadas','Fortaleza de Ferro','Fendas Infernais','Trono do Crepúsculo'][region-1];}
