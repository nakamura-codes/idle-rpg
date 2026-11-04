/* Playwright + sharp; CHROMIUM_PATH and HUD_SCREENSHOTS are optional. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),sharp=require('sharp');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.js':'application/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.png':'image/png','.woff':'font/woff'})[path.extname(file)]||'application/octet-stream'});res.end(e?'':b);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--disable-vulkan','--disable-features=Vulkan']});
 try{
  const p=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await p.route('**/game.js?*',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  new Game();','  window.__contentTest={game:new Game(),newState,attributePoints,ZONES};')}));
  await p.goto(`http://127.0.0.1:${server.address().port}`);
  await p.click('[data-menu="new"]');await p.fill('#newProfileName','Revisão de Arte');await p.click('#createProfileForm button');
  await p.waitForFunction(()=>document.getElementById('authScreen').hidden);
  await p.evaluate(()=>{const g=window.__contentTest.game;g.stepClock=()=>{};g.state.level=29;g.state.heroHp=200;g.renderEverything();});
  await p.keyboard.press('c');
  assert.equal(await p.locator('.summary-icon').count(),6);assert.equal(await p.locator('.attribute-icon').count(),4);
  const before=await p.evaluate(()=>window.__contentTest.game.bonuses());
  await p.click('[data-attribute-qty="5"]');await p.click('[data-attribute="strength"]');
  assert.equal(await p.evaluate(()=>window.__contentTest.game.state.attributes.strength),5);
  assert.equal(await p.evaluate(()=>window.__contentTest.game.bonuses().click),before.click+10);
  await p.click('[data-attribute="vitality"]');
  assert.equal(await p.evaluate(()=>window.__contentTest.game.state.heroHp),275);
  assert.equal(await p.evaluate(()=>window.__contentTest.game.bonuses().maxHp),before.maxHp+75);
  await p.click('[data-attribute-qty="10"]');await p.click('[data-attribute="will"]');
  assert.equal(await p.evaluate(()=>window.__contentTest.game.bonuses().dps),before.dps+10);
  await p.click('[data-attribute-qty="all"]');await p.click('[data-attribute="guard"]');
  assert.equal(await p.evaluate(()=>window.__contentTest.game.state.attributes.guard),36);
  assert.equal(await p.locator('[data-attribute]:enabled').count(),0);
  const total=await p.evaluate(()=>{const g=window.__contentTest.game;for(const q of [0,-3,500,'invalid'])g.spendAttribute('strength',q);return Object.values(g.state.attributes).reduce((a,b)=>a+b,0);});assert.equal(total,56);
  await p.evaluate(()=>{const g=window.__contentTest.game;g.state.level++;g.state.deadUntil=Date.now()+8000;g.state.heroHp=0;g.renderEverything();});
  await p.click('[data-attribute-qty="10"]');assert.equal(await p.locator('[data-attribute="vitality"]').textContent(),'+2');
  await p.click('[data-attribute="vitality"]');assert.equal(await p.evaluate(()=>window.__contentTest.game.state.heroHp),0);
  assert.equal(await p.evaluate(()=>window.__contentTest.attributePoints(window.__contentTest.game.state)),0);
  console.log('PASS x5/x10/MAX allocation, actual bonuses, remaining-point clamp, invalid amounts and no healing while dead');
  await p.keyboard.press('Escape');
  await p.evaluate(()=>{
   const g=window.__contentTest.game,s=g.state;s.deadUntil=0;s.heroHp=400;
   s.inventory=window.HELLWARD_ITEMS.map((d,n)=>({id:'art-'+n,catalogId:d.id,name:d.nome,kind:d.tipo==='poção'?'potion':d.tipo==='material'?'material':'equipment',slot:({arma:'weapon',capacete:'helmet',armadura:'armor',anel:'ring',colar:'necklace','relíquia':'relic'})[d.tipo]||null,rarity:({Sucata:'sucata',Comum:'comum',Incomum:'incomum',Raro:'raro','Épico':'epico',Lendário:'lendario'})[d.raridade],quality:7,level:29,qty:1,stats:{click:1,dps:0,crit:0,gold:0,luck:0,health:0,defense:0},createdAt:n}));
   // Pre-catalog equipment and malformed catalog references still get a safe picture.
   for(const slot of ['weapon','helmet','armor','ring','necklace','relic'])s.inventory.push({...s.inventory.find(i=>i.slot===slot),id:'legacy-'+slot,catalogId:'https://untrusted.invalid/icon',name:'Relíquia antiga '+slot});
   g.renderEverything();g.save();
  });
  await p.keyboard.press('i');assert.equal(await p.locator('.item-card .item-icon').count(),106);
  const art=await p.evaluate(()=>window.HELLWARD_ART);
  assert.equal(Object.keys(art.items).length,100);assert.equal(Object.keys(art.status).length,12);
  for(const descriptor of [...Object.values(art.items),...Object.values(art.status)]){
   const {data,info}=await sharp(path.join(root,descriptor.src)).ensureAlpha().extract({left:descriptor.col*128,top:descriptor.row*128,width:128,height:128}).raw().toBuffer({resolveWithObject:true});
   let opaque=0;
   for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const alpha=data[(y*info.width+x)*4+3];if(alpha>20)opaque++;
    if(x<5||x>122||y<5||y>122)assert.equal(alpha,0,'Icon touches its cell edge');
   }
   assert.ok(opaque>200,'Empty or invisible icon');
  }
  const urls=await p.locator('.item-icon').evaluateAll(icons=>icons.map(i=>getComputedStyle(i).backgroundImage));
  assert.ok(urls.every(url=>url.includes('/assets/')&&!url.includes('untrusted')));
  const shots=process.env.HUD_SCREENSHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});
  const capture=async name=>{if(shots)await p.screenshot({path:path.join(shots,name+'.png')});};
  await p.selectOption('#inventorySort','rarity');await capture('illustrated-inventory');await p.keyboard.press('Escape');
  await p.keyboard.press('c');await p.locator('.attribute-section').scrollIntoViewIfNeeded();await capture('bulk-attributes');await p.keyboard.press('Escape');
  console.log('PASS all 100 item icons, 12 status icons, alpha gutters, legacy fallback and safe bundled asset URLs');
  const visualBounds=()=>{
   const bounds=selector=>{const img=document.querySelector(selector),r=img.getBoundingClientRect(),scale=Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;return {x:r.x+(r.width-w)/2,y:r.bottom-h,right:r.x+(r.width+w)/2,bottom:r.bottom,width:w,height:h};};
   return {hero:bounds('#combatHero img'),monster:bounds('#monsterArt img'),hp:document.querySelector('.mob-info').getBoundingClientRect().toJSON(),arena:document.getElementById('battlefield').getBoundingClientRect().toJSON()};
  };
  for(const [w,h] of [[1366,768],[390,844],[320,568],[844,390]]){
   await p.setViewportSize({width:w,height:h});
   for(const [zone,index,label] of [[1,1,'rat'],[1,4,'goblin'],[0,1,'skeleton'],[3,2,'golem'],[1,6,'hydra'],[4,6,'dragon'],[5,6,'colossal']]){
    await p.evaluate(({zone,index})=>{const g=window.__contentTest.game,z=window.__contentTest.ZONES[zone],kind=index===6?'boss':index===5?'miniboss':'normal';g.state.zone=zone;g.state.zoneProgress[zone].stage=kind==='boss'?10:1;g.state.mob={name:index===6?z.boss:index===5?z.miniboss:z.names[index],kind,hp:100,maxHp:100,level:50};g.lastZoneRendered=-1;g.renderCore();},{zone,index});
    await p.locator('#monsterArt img').evaluate(img=>img.decode());
    const b=await p.evaluate(visualBounds),ratio=b.monster.height/b.hero.height;
    assert.ok(b.monster.x>=b.arena.x&&b.monster.right<=b.arena.right+1&&b.monster.y>=b.hp.bottom+2&&b.monster.bottom<=b.arena.bottom,`${w} ${label} clipped or under health bar: ${JSON.stringify(b)}`);
    if(label==='rat'||label==='goblin')assert.ok(ratio<.9,`${w} ${label} should be smaller than the hero: ${ratio}`);
    if(['golem','hydra','dragon'].includes(label))assert.ok(ratio>1.2,`${label} should tower over the hero: ${ratio}`);
    if(label==='colossal')assert.ok(ratio>2.1,`Final boss should be colossal: ${ratio}`);
    await capture(`${label}-${w}x${h}`);
   }
  }
  console.log('PASS authored size hierarchy and final boss >2.1x hero height in four viewports, with complete silhouettes below health bars');
  await p.setViewportSize({width:390,height:844});await p.keyboard.press('c');
  for(const n of ['1','5','10','all'])await p.click(`[data-attribute-qty="${n}"]`);
  const ui=await p.locator('#hudPanel').evaluate(el=>({width:el.scrollWidth,client:el.clientWidth}));assert.ok(ui.width<=ui.client+1);await capture('mobile-attributes');
  await p.keyboard.press('Escape');await p.click('[data-open-panel="settings"]');
  const dl=p.waitForEvent('download');await p.click('#exportSave');const download=await dl;
  const saved=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(Object.values(saved.state.attributes).reduce((a,b)=>a+b,0),58);
  assert.deepEqual(errors,[]);console.log('PASS saved bulk allocations, narrow layout, and no JavaScript/asset errors');
 }finally{await browser.close();}
})().then(()=>server.close()).catch(e=>{console.error(e);server.close();process.exitCode=1;});
