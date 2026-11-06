/* Run with Playwright installed: node tests/hud-browser.cjs
   CHROMIUM_PATH optionally selects a local Chromium executable.
   HUD_SCREENSHOTS optionally selects a directory for QA captures. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403).end();return;}
  fs.readFile(file, (error, bytes) => {res.writeHead(error ? 404 : 200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'});res.end(error ? '' : bytes);});
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}), args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--disable-vulkan','--disable-features=Vulkan']});
  try {
    const p = await browser.newPage({viewport:{width:1366,height:768}});
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    p.on('response', r => {if(r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);});
    // Test-only access to the existing closure; no testing API ships in game.js.
    await p.route('**/game.js?*', async route => {
      const source = fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  new Game();', '  window.__hudTest = {game:new Game(), normalizeSave, newState, attributePoints, xpNeeded, ZONES};');
      await route.fulfill({contentType:'application/javascript', body:source});
    });
    await p.goto(`http://127.0.0.1:${server.address().port}`);
    await p.click('[data-menu="new"]');await p.fill('#newProfileName','Big');await p.click('#createProfileForm button');
    await p.waitForFunction(()=>document.getElementById('authScreen').hidden);
    await p.evaluate(()=>{
      const g=window.__hudTest.game,s=g.state;g.stepClock=()=>{};
      const slots=['weapon','helmet','armor','ring','necklace','relic'];
      const types={weapon:'arma',helmet:'capacete',armor:'armadura',ring:'anel',necklace:'colar',relic:'relíquia'};
      const stats=()=>({click:0,dps:0,crit:0,gold:0,luck:0,health:0,defense:0});
      const item=(id,slot,rarity,power)=>{
        const def=window.HELLWARD_ITEMS.find(i=>i.tipo===types[slot]);
        return {id,kind:'equipment',slot,rarity,quality:7,name:def.nome,catalogId:def.id,level:29,qty:1,stats:{...stats(),click:power,health:slot==='armor'?power*3:0},createdAt:Date.now()};
      };
      s.inventory=[];s.level=29;s.gold=74000;s.souls=20;s.runKills=120;s.heroHp=150;
      s.upgrades.strike=20;s.upgrades.ritual=35;s.skills.w1=3;s.skills.s1=2;
      for(const slot of slots){
        s.inventory.push(item('old-'+slot,slot,'raro',15),item('best-'+slot,slot,'lendario',60),item('spare-'+slot,slot,'epico',30));
        s.equipment[slot]='old-'+slot;
      }
      const potion=window.HELLWARD_ITEMS.find(i=>i.id.includes('pocao'));
      s.inventory.push({id:'potion',kind:'potion',slot:null,rarity:'comum',quality:null,name:potion.nome,catalogId:potion.id,level:1,qty:5,stats:stats(),createdAt:Date.now()});
      const mat=window.HELLWARD_ITEMS.find(i=>i.tipo==='material');
      s.inventory.push({id:'scrap',kind:'material',slot:null,rarity:'sucata',quality:null,name:mat.nome,catalogId:mat.id,level:1,qty:7,stats:stats(),createdAt:Date.now()});
      s.inventory.push(item('uncommon','weapon','incomum',5),item('common','weapon','comum',4));
      // Ranking must use attributes, not a rarity label; a better common beats a weak legendary.
      const common=item('common-strong','weapon','comum',90);s.inventory.push(common);
      g.renderEverything();g.save();
    });
    assert.equal(await p.locator('#playerHeroName').textContent(),'Big');
    await p.keyboard.press('i');
    assert.equal(await p.locator('#hudPanelTitle').textContent(),'Mochila de Big');
    assert.equal(await p.locator('.section-headline h2').textContent(),'Arsenal de Big');
    const before=await p.evaluate(()=>({hp:window.__hudTest.game.state.heroHp,gold:window.__hudTest.game.state.gold}));
    await p.click('[data-equip-best]');
    const best=await p.evaluate(()=>({equipment:window.__hudTest.game.state.equipment,hp:window.__hudTest.game.state.heroHp,gold:window.__hudTest.game.state.gold,potion:window.__hudTest.game.state.inventory.find(i=>i.id==='potion').qty}));
    assert.equal(best.equipment.weapon,'common-strong');
    for(const slot of ['helmet','armor','ring','necklace','relic'])assert.equal(best.equipment[slot],'best-'+slot);
    assert.equal(best.hp,before.hp);assert.equal(best.gold,before.gold);assert.equal(best.potion,5);
    assert.equal(await p.locator('[data-equip-best]').isDisabled(),true);
    await p.evaluate(()=>{const g=window.__hudTest.game;const original=g.state.inventory.find(i=>i.id===g.state.equipment.weapon);g.state.inventory.unshift({...original,id:'equal-weapon',stats:{...original.stats}});});
    assert.equal(await p.evaluate(()=>window.__hudTest.game.bestEquipment().weapon),'common-strong');
    console.log('PASS best equipment across six slots, true power ranking, ties, health and consumables');
    // Cancelling a batch sale must not mutate inventory or gold.
    await p.selectOption('#inventorySellRarity','raro');
    const snapshot=await p.evaluate(()=>({ids:window.__hudTest.game.state.inventory.map(i=>i.id),gold:window.__hudTest.game.state.gold}));
    await p.click('[data-sell-bulk]');
    assert.equal(await p.locator('#dialogBackdrop').getAttribute('data-kind'),'sale');
    await p.getByRole('button',{name:'MANTER ESPÓLIOS',exact:true}).click();
    assert.deepEqual(await p.evaluate(()=>({ids:window.__hudTest.game.state.inventory.map(i=>i.id),gold:window.__hudTest.game.state.gold})),snapshot);
    await p.click('[data-sell-bulk]');
    const sale=await p.evaluate(()=>{
      const g=window.__hudTest.game,s=g.state,copy=s.inventory.find(i=>i.id==='old-weapon');
      // Simulate a new drop and equipment changing while confirmation is open.
      s.inventory.push({...copy,id:'new-drop',stats:{...copy.stats}});s.equipment.weapon='old-weapon';
      const selected=g.saleCandidates('raro').filter(i=>i.id!=='new-drop');
      return {ids:selected.map(i=>i.id),earned:selected.reduce((sum,i)=>sum+g.itemPrice(i)*i.qty,0),gold:s.gold};
    });
    await p.getByRole('button',{name:'CONFIRMAR VENDA',exact:true}).click();
    const afterSale=await p.evaluate(()=>({ids:window.__hudTest.game.state.inventory.map(i=>i.id),gold:window.__hudTest.game.state.gold,equipment:window.__hudTest.game.state.equipment,potion:window.__hudTest.game.state.inventory.find(i=>i.id==='potion').qty}));
    for(const id of sale.ids)assert.ok(!afterSale.ids.includes(id));
    assert.ok(afterSale.ids.includes('new-drop'));assert.ok(afterSale.ids.includes('old-weapon'));
    assert.equal(afterSale.gold,sale.gold+sale.earned);assert.equal(afterSale.potion,5);
    await p.click('[data-equip-best]');
    const chosenWeapon=await p.evaluate(()=>window.__hudTest.game.state.equipment.weapon);
    // Higher rarities are selectable; valuable individual sales also require confirmation.
    await p.selectOption('#inventorySellRarity','epico');await p.click('[data-sell-bulk]');
    await p.getByRole('button',{name:'CONFIRMAR VENDA',exact:true}).click();
    assert.equal(await p.evaluate(()=>window.__hudTest.game.state.inventory.some(i=>i.rarity==='epico')),false);
    await p.selectOption('#inventorySellRarity','lendario');
    assert.equal(await p.locator('[data-sell-bulk]').isEnabled(),true);
    await p.click('[data-sell-bulk]');await p.getByRole('button',{name:'CONFIRMAR VENDA',exact:true}).click();
    for(const id of Object.values(await p.evaluate(()=>window.__hudTest.game.state.equipment)))assert.ok(await p.evaluate(id=>window.__hudTest.game.state.inventory.some(i=>i.id===id),id));
    await p.selectOption('#inventorySellRarity','low');
    assert.equal(await p.evaluate(()=>window.__hudTest.game.saleCandidates().some(i=>i.id==='uncommon')),false);
    await p.selectOption('#inventorySellRarity','all');await p.click('[data-sell-bulk]');
    await p.getByRole('button',{name:'CONFIRMAR VENDA',exact:true}).click();
    const survivors=await p.evaluate(()=>{const g=window.__hudTest.game;return g.state.inventory.every(i=>i.kind==='potion'||Object.values(g.state.equipment).includes(i.id))});assert.ok(survivors);
    assert.equal(await p.locator('[data-sell-bulk]').isDisabled(),true);
    console.log('PASS rarity sales, cancellation, confirmation, quote math, protected equipment/potions and snapshot drops');
    // Persist and resume through the actual menu. This also exercises the real offline return.
    await p.keyboard.press('Escape');await p.click('[data-open-panel="settings"]');
    const dl=p.waitForEvent('download');await p.click('#exportSave');const download=await dl;
    const saved=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(saved.state.equipment.weapon,chosenWeapon);assert.equal(saved.state.name,'Big');
    await p.keyboard.press('Escape');await p.click('#switchProfile');
    await p.evaluate(()=>{
      const profile=JSON.parse(localStorage.getItem('hellward_profiles_v7'))[0],key='hellward_save_v7_'+profile.id;
      const s=JSON.parse(localStorage.getItem(key));s.lastSeen=Date.now()-120000;s.zone=0;s.zoneProgress[0]={stage:1,kills:0,minibossDefeated:false,bossDefeated:false,cleared:false};s.mob=null;s.deadUntil=0;s.heroHp=500;localStorage.setItem(key,JSON.stringify(s));
    });
    await p.click('[data-menu="continue"]');await p.click('.saved-profile');
    assert.equal(await p.locator('#dialogBackdrop').getAttribute('data-kind'),'offline');
    assert.equal(await p.locator('.offline-loot>div').count(),3);
    assert.ok((await p.locator('#dialogText').textContent()).includes('Big'));
    const shots=process.env.HUD_SCREENSHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});
    const capture=async name=>{if(shots){await p.evaluate(()=>document.activeElement?.blur());await p.screenshot({path:path.join(shots,name+'.png')});}};
    await capture('offline-desktop');
    const offlineViewport=process.env.DESKTOP_ONLY?{width:1366,height:768}:{width:320,height:568};
    await p.setViewportSize(offlineViewport);await capture(process.env.DESKTOP_ONLY?'offline-desktop-resumed':'offline-mobile');
    const bounds=await p.locator('#dialogBackdrop .dialog').boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=offlineViewport.width&&bounds.y+bounds.height<=offlineViewport.height);
    await p.getByRole('button',{name:'RETOMAR A CAÇADA',exact:true}).click();
    await p.evaluate(()=>window.__hudTest.game.stepClock=()=>{});
    assert.equal(await p.evaluate(()=>window.__hudTest.game.state.equipment.weapon),chosenWeapon);
    assert.equal(await p.locator('#playerHeroName').textContent(),'Big');
    console.log('PASS saved equipment and actual offline-return layout with the player name');
    // Repeat a reached phase without consuming the pending miniboss checkpoint.
    await p.evaluate(()=>{const g=window.__hudTest.game;g.state.zoneProgress[0]={stage:5,kills:10,minibossDefeated:false,bossDefeated:false,cleared:false};g.state.lastEventAt=Date.now()+1e8;g.setHuntMode(null);});
    await p.click('[data-open-panel="zones"]');await p.selectOption('#farmStageSelect','3');await p.click('[data-start-hunt]');
    assert.equal(await p.evaluate(()=>window.__hudTest.game.state.farmStage),3);
    await p.selectOption('#farmStageSelect','2');await p.evaluate(()=>window.__hudTest.game.killMob());
    assert.equal(await p.locator('#farmStageSelect').inputValue(),'2');await p.selectOption('#farmStageSelect','3');
    const checkpoint=await p.evaluate(()=>JSON.stringify(window.__hudTest.game.state.zoneProgress[0]));
    await p.evaluate(()=>{const g=window.__hudTest.game;for(let i=0;i<11;i++)g.killMob();g.save();});
    assert.equal(await p.evaluate(()=>JSON.stringify(window.__hudTest.game.state.zoneProgress[0])),checkpoint);
    assert.equal(await p.evaluate(()=>window.__hudTest.game.state.mob.kind),'normal');
    const huntSave=await p.evaluate(()=>{const profile=JSON.parse(localStorage.getItem('hellward_profiles_v7'))[0];return JSON.parse(localStorage.getItem('hellward_save_v7_'+profile.id));});
    assert.equal(huntSave.farmStage,3);assert.equal(huntSave.farmKills,2);assert.ok(Array.isArray(huntSave.lootDryStreak));
    await p.locator('#hudPanelScroll').evaluate(el=>el.scrollTop=0);await capture('hunt-mobile');await p.click('[data-resume-journey]');
    assert.equal(await p.evaluate(()=>window.__hudTest.game.state.mob.kind),'miniboss');
    assert.equal(await p.evaluate(()=>window.__hudTest.game.state.farmStage),null);await p.keyboard.press('Escape');
    console.log('PASS hunt controls, repeated kills, saved hunt/loot fields and pending-miniboss restoration');
    // Capture all gameplay panels at desktop and narrow mobile sizes.
    for(const [w,h] of [[1366,768],[390,844],[320,568],[844,390]].filter(([w,h])=>!process.env.DESKTOP_ONLY || (w>=1000 && h>=600))){
      await p.setViewportSize({width:w,height:h});
      for(const name of ['upgrades','inventory','zones','ascension','chronicle','settings']){
        await p.click(`[data-open-panel="${name}"]`);
        await p.locator('#hudPanel img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode().catch(()=>{}))));
        await p.waitForTimeout(80);
        if(name==='chronicle'){
          assert.equal(await p.locator('#combatRegen').textContent(),await p.locator('#heroRegeneration').textContent());
          assert.notEqual(await p.locator('#combatRegen').textContent(),await p.locator('#naturalRegen').textContent());
          assert.ok((await p.locator('#heroRegeneration').getAttribute('title')).includes('Natural:'));
        }
        assert.equal(await p.locator('#hudPanelScroll').evaluate(el=>el.scrollTop),0,`${name} opens scrolled down`);
        const ui=await p.locator('#hudPanel').evaluate(el=>({box:el.getBoundingClientRect().toJSON(),width:el.scrollWidth,client:el.clientWidth,scroll:document.getElementById('hudPanelScroll').scrollWidth,scrollClient:document.getElementById('hudPanelScroll').clientWidth}));
        assert.ok(ui.box.x>=0&&ui.box.y>=0&&ui.box.right<=w&&ui.box.bottom<=h, `${name} ${w} clipped panel`);
        assert.ok(ui.width<=ui.client+1&&ui.scroll<=ui.scrollClient+1,`${name} ${w} horizontal overflow ${JSON.stringify(ui)}`);
        await capture(`${name}-${w}x${h}`);await p.keyboard.press('Escape');
      }
      await capture(`battle-${w}x${h}`);
    }
    assert.deepEqual(errors,[]);console.log('PASS six detailed gameplay panels at selected viewports; no JavaScript/asset errors');
  } finally {await browser.close();}
})().then(()=>server.close()).catch(error=>{console.error(error);server.close();process.exitCode=1;});
