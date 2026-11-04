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
    await p.click('[data-menu="new"]');
    await p.fill('#newProfileName','Errante');
    await p.click('#createProfileForm button');
    await p.waitForFunction(() => document.getElementById('authScreen').hidden);
    await p.evaluate(() => {
      const {game:g} = window.__hudTest;
      // Disable the clock only for deterministic action and health assertions.
      g.stepClock = () => {};
      g.state.nextEnemyAttackAt = Date.now() + 1e8;
    });
    const shots = process.env.HUD_SCREENSHOTS;
    if(shots)fs.mkdirSync(shots,{recursive:true});
    async function capture(name) {if(shots)await p.screenshot({path:path.join(shots,name+'.png')});}
    for (const [w,h] of [[1366,768],[1920,1080],[1920,852],[1536,864],[1280,720],[1024,768],[1024,600],[390,844],[375,667],[360,640],[320,568],[844,390],[667,375]]) {
      await p.setViewportSize({width:w,height:h});
      await p.waitForTimeout(80);
      const layout = await p.evaluate(() => {
        const box = el => el.getBoundingClientRect().toJSON();
        return {width:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),height:document.documentElement.scrollHeight,arena:box(document.getElementById('battlefield')),dock:box(document.querySelector('.hud-dock')),relics:[...document.querySelectorAll('[data-open-panel]')].map(box),broken:[...document.images].filter(i=>i.getClientRects().length && (!i.complete || !i.naturalWidth)).map(i=>i.src)};
      });
      assert.ok(layout.width <= w + 1, `${w}x${h} horizontal overflow: ${layout.width}`);
      assert.ok(layout.height <= h + 1, `${w}x${h} page overflow: ${layout.height}`);
      assert.ok(layout.arena.height >= 120, `${w}x${h} arena too short: ${layout.arena.height}`);
      assert.ok(layout.dock.bottom <= h, `${w}x${h} dock clipped`);
      assert.ok(layout.relics.every(b=>b.x>=0 && b.right<=w && b.bottom<=h), `${w}x${h} clipped relic: ${JSON.stringify(layout.relics)}`);
      assert.deepEqual(layout.broken, []);
      assert.ok(await p.locator('#xpLabel').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=6 && el.getBoundingClientRect().width>=25), `${w}x${h} XP text too small`);
      const captions=await p.locator('.relic-caption').evaluateAll(nodes=>nodes.map(el=>{
        const box=n=>n.getBoundingClientRect().toJSON(),title=el.querySelector('span'),detail=el.querySelector('small');
        return {plaque:box(el),button:box(el.parentElement),title:box(title),detail:box(detail),titleSize:parseFloat(getComputedStyle(title).fontSize),detailSize:parseFloat(getComputedStyle(detail).fontSize)};
      }));
      for(const c of captions){
        assert.ok(c.titleSize>=10 && c.detailSize>=8,`${w} unreadable relic label`);
        assert.ok(c.title.x>=c.plaque.x && c.title.right<=c.plaque.right+1 && c.detail.x>=c.plaque.x && c.detail.right<=c.plaque.right+1,`${w} text outside its plaque`);
        assert.ok(c.plaque.y>=c.button.y && c.plaque.bottom<=h,`${w} clipped plaque`);
      }
      assert.ok(Math.max(...captions.map(c=>c.title.y))-Math.min(...captions.map(c=>c.title.y))<1,`${w} misaligned relic titles`);
      await p.evaluate(()=>document.activeElement?.blur());
      await capture(`hud-${w}x${h}`);
      // Every viewport must keep the settings and codex close controls reachable.
      for(const name of ['settings','upgrades','inventory','ascension']) {
        await p.click(`[data-open-panel="${name}"]`);
        const overlay=await p.locator('#hudPanel').evaluate(el=>({box:el.getBoundingClientRect().toJSON(),scroll:el.scrollWidth,client:el.clientWidth,close:document.getElementById('hudClose').getBoundingClientRect().toJSON()}));
        assert.ok(overlay.box.x>=0 && overlay.box.right<=w && overlay.box.y>=0 && overlay.box.bottom<=h, `${w}x${h} ${name} clipped overlay`);
        assert.ok(overlay.scroll<=overlay.client+1, `${w}x${h} ${name} horizontal panel overflow`);
        assert.ok(overlay.close.bottom<=h && overlay.close.right<=w, 'Close control clipped');
        if(shots && name==='settings' && (w===1366 || w===320))await capture(`settings-${w}x${h}`);
        await p.keyboard.press('Escape');
      }
      console.log(`PASS viewport ${w}x${h} / arena ${Math.round(layout.arena.height)}px`);
    }
    await p.setViewportSize({width:1366,height:768});
    await p.click('[data-open-panel="settings"]');
    assert.ok(await p.evaluate(()=>document.fonts.check('34px "Dornen UI"','Regiões Ascensão Crônicas')));
    await p.selectOption('#hudTitleFont','classic');
    assert.equal(await p.locator('html').getAttribute('data-hud-font'),'classic');
    assert.equal(await p.evaluate(()=>localStorage.getItem('hellward_hud_title_font')),'classic');
    await p.selectOption('#hudTitleFont','dornen');
    assert.equal(await p.locator('html').getAttribute('data-hud-font'),'dornen');
    await p.keyboard.press('Escape');
    await p.click('[data-open-panel="zones"]');
    assert.ok((await p.locator('#hudPanelArt').getAttribute('src')).endsWith('regions-tree.webp'));
    await p.keyboard.press('Escape');
    await p.click('[data-open-panel="upgrades"]');
    assert.equal(await p.locator('#hudPanelTitle').textContent(),'Livro Negro');
    assert.equal(await p.locator('[data-attribute]:enabled').count(),0);
    assert.equal(await p.locator('#appFrame').evaluate(el=>el.inert),true);
    await p.keyboard.press('Shift+Tab');
    assert.ok(await p.locator('#hudPanel').evaluate(el=>el.contains(document.activeElement)));
    await p.keyboard.press('Escape');
    assert.equal(await p.locator('[data-open-panel="upgrades"]').evaluate(el=>el===document.activeElement),true);
    await p.evaluate(() => {const {game:g,xpNeeded} = window.__hudTest;g.awardXp(xpNeeded(1));g.renderCore();});
    assert.equal(await p.locator('#attributeBadge').textContent(),'2');
    await p.keyboard.press('c');
    const clickBefore = await p.evaluate(()=>window.__hudTest.game.bonuses().click);
    await p.click('[data-attribute="strength"]');
    assert.equal(await p.evaluate(()=>window.__hudTest.game.bonuses().click),clickBefore+2);
    await p.click('[data-attribute="will"]');
    assert.equal(await p.evaluate(()=>window.__hudTest.game.bonuses().dps),1);
    assert.equal(await p.locator('[data-attribute]:enabled').count(),0);
    await p.evaluate(()=>window.__hudTest.game.spendAttribute('strength'));
    assert.equal(await p.evaluate(()=>window.__hudTest.game.state.attributes.strength),1);
    console.log('PASS level points, real combat bonuses and overspend protection');
    await p.evaluate(()=>{
      const {game:g,xpNeeded} = window.__hudTest;
      g.awardXp(xpNeeded(2));g.state.heroHp=60;g.renderCore();g.renderPanel();
    });
    const hpBefore=await p.evaluate(()=>window.__hudTest.game.bonuses().maxHp);
    await p.click('[data-attribute="vitality"]');
    assert.equal(await p.evaluate(()=>window.__hudTest.game.state.heroHp),75);
    assert.equal(await p.evaluate(()=>window.__hudTest.game.bonuses().maxHp),hpBefore+15);
    const defenseBefore=await p.evaluate(()=>window.__hudTest.game.bonuses().defense);
    await p.click('[data-attribute="guard"]');
    assert.equal(await p.evaluate(()=>window.__hudTest.game.bonuses().defense),defenseBefore+1);
    await capture('hud-book');
    const saves = await p.evaluate(() => {
      const {game:g,normalizeSave,newState,attributePoints} = window.__hudTest;
      const round=normalizeSave(JSON.parse(g.read('hellward_save_v7_'+g.profileId)),g.state.name);
      const legacy=newState('Legado');legacy.level=8;delete legacy.attributes;
      const migrated=normalizeSave(legacy,'Legado');
      const bad=normalizeSave({...legacy,attributes:{strength:1e99,will:300,vitality:-3,guard:'NaN'}},'Legado');
      return {round:round.attributes,migrated:attributePoints(migrated),badBudget:Object.values(bad.attributes).reduce((a,b)=>a+b,0)};
    });
    assert.deepEqual(saves.round,{strength:1,will:1,vitality:1,guard:1});
    assert.equal(saves.migrated,14);assert.equal(saves.badBudget,14);
    console.log('PASS saved allocations, V7 migration and malformed imported allocations');
    // The keyboard must never attack through an open relic panel.
    await p.locator('#hudPanel').focus();
    const mobHP = await p.evaluate(()=>window.__hudTest.game.state.mob.hp);
    await p.keyboard.press('Space');
    assert.equal(await p.evaluate(()=>window.__hudTest.game.state.mob.hp),mobHP);
    for(const [tab,title] of [['inventory','Mochila de Errante'],['zones','Regiões Esquecidas'],['ascension','Cálice da Ascensão']]) {
      await p.click(`[data-tab="${tab}"]`);
      assert.equal(await p.locator('#hudPanelTitle').textContent(),title);
      assert.equal(await p.locator('#codexSummary').isVisible(),false);
    }
    await capture('hud-ascension');
    await p.keyboard.press('Escape');await p.keyboard.press('j');
    assert.equal(await p.locator('#hudChronicle').isVisible(),true);
    await capture('hud-chronicle');
    await p.keyboard.press('Escape');
    // Focus mode should enlarge the arena and preserve access to the three relics.
    const arenaBefore=await p.locator('#battlefield').evaluate(el=>el.clientHeight);
    await p.click('#focusBattle');
    assert.ok(await p.locator('#battlefield').evaluate(el=>el.clientHeight)>arenaBefore);
    await capture('hud-focused');await p.click('#focusBattle');
    // Existing buy/equip/potion/sell actions remain attached to the moved tabBody.
    await p.evaluate(()=>{const {game:g}=window.__hudTest;g.state.gold=100;g.renderCore();g.renderPanel();});
    await p.keyboard.press('c');
    await p.click('[data-buy="strike"]');
    assert.equal(await p.evaluate(()=>window.__hudTest.game.state.upgrades.strike),1);
    await p.keyboard.press('Escape');
    await p.evaluate(()=>{
      const {game:g}=window.__hudTest;
      g.state.inventory.push({id:'test-sword',kind:'equipment',catalogId:'',slot:'weapon',rarity:'raro',quality:5,name:'Espada de teste',level:1,qty:1,stats:{click:5,dps:0,crit:0,gold:0,luck:0,health:0,defense:0},createdAt:Date.now()});
      const potion=window.HELLWARD_ITEMS.find(i=>i.tipo==='poção'||i.tipo==='pocao'||i.id.includes('pocao'));
      if(potion)g.state.inventory.push({id:'test-potion',kind:'potion',catalogId:potion.id,slot:null,rarity:'comum',quality:null,name:potion.nome,level:1,qty:2,stats:{},createdAt:Date.now()});
      g.renderPanel();g.renderCore();
    });
    await p.keyboard.press('i');
    await p.click('[data-equip="test-sword"]');
    assert.equal(await p.evaluate(()=>window.__hudTest.game.state.equipment.weapon),'test-sword');
    assert.equal(await p.locator('[data-use="test-potion"]').count(),1);
    if(await p.locator('[data-use="test-potion"]').count()) {
      await p.evaluate(()=>window.__hudTest.game.state.heroHp=30);
      await p.click('[data-use="test-potion"]');
      assert.ok(await p.evaluate(()=>window.__hudTest.game.state.heroHp>30));
    }
    await p.keyboard.press('Escape');
    await p.evaluate(()=>{const {game:g}=window.__hudTest;g.state.heroHp=30;g.renderCore();});
    assert.equal(await p.locator('#quickPotion').isEnabled(),true);
    const qtyBefore=await p.locator('#quickPotionCount').textContent();
    await p.keyboard.press('q');
    assert.ok(await p.evaluate(()=>window.__hudTest.game.state.heroHp>30));
    assert.equal(Number(await p.locator('#quickPotionCount').textContent()),Number(qtyBefore)-1);
    await p.evaluate(()=>{const {game:g}=window.__hudTest;g.state.heroHp=g.bonuses().maxHp;g.renderCore();});
    assert.equal(await p.locator('#quickPotion').isDisabled(),true);
    await p.keyboard.press('i');
    await p.click('[data-equip="test-sword"]');
    await p.click('[data-sell="test-sword"]');
    await p.getByRole('button',{name:'CONFIRMAR VENDA',exact:true}).click();
    assert.equal(await p.locator('[data-equip="test-sword"]').count(),0);
    console.log('PASS panel keyboard navigation, gold upgrades, equipment, potions and sale');
    // Ascension confirmation is layered above, with panel focus restored on cancel.
    await p.click('[data-tab="ascension"]');
    await p.evaluate(()=>{const {game:g}=window.__hudTest;g.state.level=15;g.state.runKills=100;g.renderPanel();});
    await p.click('[data-ascend]');
    assert.equal(await p.locator('#dialogBackdrop').isVisible(),true);
    assert.equal(await p.locator('#hudPanel').evaluate(el=>el.inert),true);
    await p.getByRole('button',{name:'AINDA NÃO',exact:true}).click();
    assert.equal(await p.locator('#hudPanel').evaluate(el=>el.inert),false);
    await p.click('[data-ascend]');
    await p.getByRole('button',{name:'RENASCER',exact:true}).click();
    assert.equal(await p.evaluate(()=>window.__hudTest.game.state.level),1);
    assert.equal(await p.evaluate(()=>window.__hudTest.attributePoints(window.__hudTest.game.state)),0);
    assert.deepEqual(await p.evaluate(()=>window.__hudTest.game.state.attributes),{strength:0,will:0,vitality:0,guard:0});
    console.log('PASS ascension confirmation, focus restoration and attribute reset');
    await p.keyboard.press('Escape');
    await p.click('#switchProfile');
    assert.equal(await p.locator('#authScreen').isVisible(),true);
    assert.equal(await p.evaluate(()=>window.__hudTest.game.startedLoop),false);
    assert.equal(await p.evaluate(()=>window.__hudTest.game.loopTimer),0);
    assert.equal(await p.locator('#hudBackdrop').isVisible(),false);
    await p.click('[data-menu="continue"]');await p.click('.saved-profile');
    assert.equal(await p.locator('#authScreen').isVisible(),false);
    assert.equal(await p.locator('#appFrame').evaluate(el=>el.inert),false);
    // Exercise the real export/import route, including replacement confirmation.
    const downloadPromise = p.waitForEvent('download');
    await p.click('[data-open-panel="settings"]');
    await p.click('#exportSave');
    const download = await downloadPromise;
    const exported = JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    assert.equal(exported.type,'hellward');
    exported.state.level=8;delete exported.state.attributes;
    await p.locator('#saveFileInput').setInputFiles({name:'legacy-v7.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});
    await p.getByRole('button',{name:'IMPORTAR',exact:true}).click();
    assert.equal(await p.locator('#attributeBadge').textContent(),'14');
    await p.keyboard.press('c');
    await p.click('[data-attribute="strength"]');
    await p.keyboard.press('Escape');
    await p.reload();
    await p.click('[data-menu="continue"]');await p.click('.saved-profile');
    assert.equal(await p.evaluate(()=>window.__hudTest.game.state.attributes.strength),1);
    assert.equal(await p.locator('#attributeBadge').textContent(),'13');
    console.log('PASS real JSON export/import, old-save point grant and page reload persistence');
    // Settings control the same audio preferences as the main menu.
    await p.click('[data-open-panel="settings"]');
    await p.locator('#hudAudioControls button').click();
    assert.equal(await p.locator('#hudAudioControls button').getAttribute('aria-pressed'),'false');
    await p.locator('#hudAudioControls input').fill('45');
    assert.equal(await p.locator('#hudAudioControls output').textContent(),'45%');
    await p.click('#themeToggle');
    assert.equal(await p.evaluate(()=>document.documentElement.dataset.theme),'classic');
    await p.click('#themeToggle');await p.keyboard.press('Escape');
    // Explicitly inspect every regular roster entry and both bosses at mobile and desktop sizes.
    for(const [w,h] of [[1366,768],[320,568],[844,390]]) {
      await p.setViewportSize({width:w,height:h});
      for(let zone=0;zone<6;zone++) {
        for(const index of [0,1,2,3,4,5,6]) {
          const kind=index===6?'boss':index===5?'miniboss':'normal';
          await p.evaluate(({zone,kind,index})=>{
            const g=window.__hudTest.game;
            g.state.zone=zone;g.state.zoneProgress[zone].stage=kind==='boss'?10:kind==='miniboss'?5:1;
            g.state.mob={name:kind==='boss'?window.__hudTest.ZONES[zone].boss:kind==='miniboss'?window.__hudTest.ZONES[zone].miniboss:window.__hudTest.ZONES[zone].names[index],kind,level:50,hp:100,maxHp:100};
            g.lastZoneRendered=-1;g.renderCore();
          },{zone,kind,index});
          await p.locator('#monsterArt img').evaluate(img=>img.decode());
          const placement=await p.evaluate(()=>{
            const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();
            return {arena:rect('#battlefield'),hero:rect('#combatHero'),target:rect('#attackTarget'),hp:rect('.mob-info')};
          });
          const {arena,hero,target,hp}=placement;
          assert.ok(hero.x>=arena.x && hero.right<=arena.right && hero.y>=arena.y && hero.bottom<=arena.bottom, `${w} ${zone} ${kind} clipped hero`);
          assert.ok(target.x>=arena.x && target.right<=arena.right+1 && target.y>=hp.bottom+2 && target.bottom<=arena.bottom, `${w} ${zone} ${kind} sprite/health overlap ${JSON.stringify(placement)}`);
          assert.ok(hp.x>=arena.x && hp.right<=arena.right && hp.y>=arena.y, `${w} ${zone} ${kind} clipped health`);
          if(zone===5 && kind==='boss')await capture(`final-boss-${w}x${h}`);
        }
      }
    }
    console.log('PASS potion hotkey, settings audio/theme and all six regions with regular/miniboss/boss framing');
    // Rare events, critical damage and the defeat notice also stay within the arena.
    for(const [w,h] of [[1366,768],[320,568],[844,390]]) {
      await p.setViewportSize({width:w,height:h});
      await p.evaluate(()=>{const g=window.__hudTest.game;g.state.deadUntil=0;g.state.heroHp=50;g.state.event=null;g.spawnEvent();g.floatNumber('CRÍTICO! −1e250','crit');g.floatHeroNumber('−1e250');});
      await p.waitForTimeout(180);
      const overlays=await p.evaluate(()=>{const arena=document.getElementById('battlefield').getBoundingClientRect().toJSON();return {arena,boxes:[...document.querySelectorAll('#eventOverlay,.float-damage,.hero-damage-number')].filter(el=>el.getClientRects().length).map(el=>({name:el.className,rect:el.getBoundingClientRect().toJSON()}))};});
      for(const {name,rect:b} of overlays.boxes)assert.ok(b.x>=overlays.arena.x-1 && b.right<=overlays.arena.right+1 && b.y>=overlays.arena.y-1 && b.bottom<=overlays.arena.bottom+1, `${w} clipped ${name} ${JSON.stringify(overlays)}`);
      await capture(`event-${w}x${h}`);
      await p.evaluate(()=>{const g=window.__hudTest.game;g.state.event=null;g.state.heroHp=0;g.state.deadUntil=Date.now()+7000;g.renderCore();});
      const defeat=await p.locator('#heroRespawn').evaluate(el=>({box:el.getBoundingClientRect().toJSON(),arena:document.getElementById('battlefield').getBoundingClientRect().toJSON()}));
      assert.ok(defeat.box.y>=defeat.arena.y && defeat.box.bottom<=defeat.arena.bottom && defeat.box.x>=defeat.arena.x && defeat.box.right<=defeat.arena.right,'Clipped defeat message');
      await capture(`defeat-${w}x${h}`);
    }
    console.log('PASS rare event, oversized critical/healing numbers and defeat overlay bounds');
    assert.deepEqual(errors, []);
    console.log('PASS return to menu, resume profile, no JavaScript or asset errors');
  } finally {await browser.close();}
})().then(()=>server.close()).catch(error=>{console.error(error);server.close();process.exitCode=1;});
