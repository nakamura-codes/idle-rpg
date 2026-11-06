/* Desktop warning follows real HP and stops with menus, preferences and defeat. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const shots = process.env.HUD_SCREENSHOTS;
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403).end(); return;}
  fs.readFile(file, (error, bytes) => {
    res.writeHead(error ? 404 : 200, {'Content-Type':({'.html':'text/html','.css':'text/css','.js':'application/javascript','.webp':'image/webp','.woff':'font/woff'})[path.extname(file)] || 'application/octet-stream'});
    res.end(error ? '' : bytes);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}), args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--disable-vulkan','--disable-features=Vulkan']});
  try {
    const page = await browser.newPage({viewport:{width:1366,height:768}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {if (response.status() >= 400) errors.push(response.status() + ' ' + response.url());});
    await page.route('**/game.js?*', route => route.fulfill({contentType:'application/javascript', body:fs.readFileSync(path.join(root, 'game.js'), 'utf8').replace('  new Game();', '  window.__orbTest = {g:new Game()};')}));
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.click('[data-menu="new"]');
    await page.fill('#newProfileName', 'Orbe de sangue');
    await page.click('#createProfileForm button');
    await page.waitForFunction(() => document.documentElement.classList.contains('hw-game-active') && !document.documentElement.classList.contains('hw-menu-open'));
    await page.evaluate(() => {
      const {g} = window.__orbTest;
      g.stopLoop(); g.startLoop = () => {}; g.stepClock = () => {};
    });
    async function hp(ratio, dead = false) {
      await page.evaluate(({ratio, dead}) => {
        const {g} = window.__orbTest;
        g.state.deadUntil = dead ? Date.now() + 10000 : 0;
        g.state.heroHp = g.bonuses().maxHp * ratio;
        g.renderCore();
      }, {ratio, dead});
      await page.waitForFunction(ratio => Math.abs(new DOMMatrix(getComputedStyle(document.getElementById('lifeOrbFill')).transform).d - ratio) < .001, ratio);
    }
    async function inspect() {
      return page.evaluate(() => {
        const liquid = document.querySelector('.life-orb-liquid');
        const style = getComputedStyle(liquid, '::before');
        return {
          name:style.animationName, playState:style.animationPlayState, opacity:parseFloat(style.opacity),
          duration:style.animationDuration, easing:style.animationTimingFunction, filter:style.filter, pointerEvents:style.pointerEvents,
          count:liquid.getAnimations({subtree:true}).filter(a => a.animationName === 'hw-orb-warning').length,
          fill:new DOMMatrix(getComputedStyle(document.getElementById('lifeOrbFill')).transform).d,
          aria:Number(document.getElementById('heroHealthProgress').getAttribute('aria-valuenow')),
          bar:getComputedStyle(document.getElementById('heroHPFill')).animationName,
          barFilter:getComputedStyle(document.getElementById('heroHPFill')).filter,
          box:liquid.getBoundingClientRect().toJSON()
        };
      });
    }
    if (shots) fs.mkdirSync(shots, {recursive:true});
    for (const [width, height] of [[1366,768],[1920,1080],[1024,600]]) {
      await page.setViewportSize({width,height});
      for (const ratio of [1,.5,.30,.31,.329,.33,.25,.15,.17,.18,.25,.34,1]) {
        await hp(ratio);
        const value = await inspect();
        const state=await page.locator('#errantVitals').getAttribute('data-vitality');
        const low = state==='low'||state==='critical';
        assert.equal(value.name, low ? 'hw-orb-warning' : 'none', `${width}: threshold at ${ratio}`);
        assert.equal(value.count, low ? 1 : 0, 'Exactly one warning');if(low)assert.ok(value.easing.startsWith('steps(12'),'Bounded opacity updates');
        assert.ok(Math.abs(value.fill - ratio) < .002, `Orb must show actual HP: ${JSON.stringify(value)}`);
        assert.equal(value.aria, Math.round(ratio * 100));
        assert.equal(value.bar, 'none', 'No simultaneous pulse on the HP track');
        assert.equal(value.barFilter, 'none');
        assert.equal(value.filter, 'none');
        assert.equal(value.pointerEvents, 'none');
      }
      await hp(.2);
      const steady = await page.evaluate(() => {
        const {g} = window.__orbTest, liquid = document.querySelector('.life-orb-liquid');
        const animation = liquid.getAnimations({subtree:true}).find(a => a.animationName === 'hw-orb-warning');
        const before = JSON.stringify(g.state), box = liquid.getBoundingClientRect().toJSON();
        for (let i = 0; i < 50; i++) g.renderCore();
        return {unchanged:before === JSON.stringify(g.state), reused:animation === liquid.getAnimations({subtree:true}).find(a => a.animationName === 'hw-orb-warning'), frames:animation.effect.getKeyframes(), timing:animation.effect.getTiming(), box, after:liquid.getBoundingClientRect().toJSON()};
      });
      assert.ok(steady.unchanged && steady.reused, 'Repeated renders preserve state and the running pulse');
      assert.deepEqual(steady.box, steady.after);
      assert.equal(steady.timing.duration, 1800);
      assert.ok(steady.frames.every(f => 'opacity' in f && !('filter' in f) && !('transform' in f)));
      await page.evaluate(() => document.documentElement.dataset.focus = 'battle');
      assert.equal((await inspect()).count, 1, 'Focused HUD keeps one warning');
      await page.evaluate(() => document.documentElement.dataset.focus = 'balanced');
      console.log(`PASS ${width}x${height}: actual HP, threshold, recovery, single opacity pulse and reused animation`);
    }
    const states=[];
    for(const ratio of [1,.3,.31,.329,.33,.15,.17,.179,.18,.32,.33]){await hp(ratio);states.push(await page.locator('#errantVitals').getAttribute('data-vitality'));}
    assert.deepEqual(states,['normal','low','low','low','normal','critical','critical','critical','low','low','normal']);
    await page.evaluate(()=>{const {g}=window.__orbTest,p=window.HELLWARD_ITEMS.find(i=>i.id.includes('pocao'));g.state.inventory.push({id:'orb-potion',kind:'potion',catalogId:p.id,name:p.nome,qty:3,createdAt:Date.now()});g.potionRenderKey='';g.renderCore();});
    await hp(.25);assert.equal(await page.locator('#quickPotion').getAttribute('data-life-cue'),'low');
    await hp(.14);assert.equal(await page.locator('#quickPotion').getAttribute('data-life-cue'),'critical');assert.equal((await inspect()).duration,'1.2s');
    await hp(.34);assert.equal((await inspect()).count,0);assert.equal(await page.locator('#quickPotion').getAttribute('data-life-cue'),'none');assert.ok((await inspect()).opacity>0);
    const colors=await page.evaluate(()=>{const {g}=window.__orbTest;return [1,.25,.14].map(r=>{g.state.heroHp=g.bonuses().maxHp*r;g.renderCore();return getComputedStyle(document.getElementById('errantVitals')).getPropertyValue('--orb-color').trim();});});
    assert.equal(new Set(colors).size,3,'Normal, low and critical use distinct glow colors');
    const immediate=await page.evaluate(()=>{const {g}=window.__orbTest;g.state.heroHp=g.bonuses().maxHp*.33;g.renderCore();return [getComputedStyle(document.querySelector('.life-orb-liquid'),'::before').animationName,document.getElementById('quickPotion').getAttribute('data-life-cue')];});
    assert.deepEqual(immediate,['none','none'],'Healing to exit threshold stops both cues in the same render');
    await page.evaluate(()=>{const {g}=window.__orbTest;g.state.inventory=g.state.inventory.filter(i=>i.kind!=='potion');g.potionRenderKey='';g.renderCore();});await hp(.25);assert.equal(await page.locator('#quickPotion').getAttribute('data-life-cue'),'none');
    await page.setViewportSize({width:1366,height:768});
    await hp(1);
    if (shots) await page.locator('.life-medallion').screenshot({path:path.join(shots,'orb-full.png')});
    await hp(.2);
    for (const [label, time] of [['dim',0],['bright',900]]) {
      const value = await page.evaluate(time => {
        const liquid = document.querySelector('.life-orb-liquid');
        const animation = liquid.getAnimations({subtree:true}).find(a => a.animationName === 'hw-orb-warning');
        animation.pause(); animation.currentTime = time;
        return {opacity:Number(getComputedStyle(liquid, '::before').opacity), box:liquid.getBoundingClientRect().toJSON()};
      }, time);
      assert.ok(Math.abs(value.opacity - (time ? .55 : .2)) < .01);
      if (shots) await page.locator('.life-medallion').screenshot({path:path.join(shots,`orb-low-${label}.png`)});
    }
    // Resume naturally before lifecycle checks; seeking above is only a visual test.
    await hp(.5); await hp(.2);
    for (const mode of ['lite','reduce']) {
      if (mode === 'lite') await page.evaluate(() => document.documentElement.classList.add('hw-lite'));
      else await page.emulateMedia({reducedMotion:'reduce'});
      const value = await inspect();
      assert.equal(value.count, 0); assert.ok(value.opacity > .3 && value.opacity < .6, 'Keep a static low-HP rim');
      await page.evaluate(() => document.documentElement.classList.remove('hw-lite'));
    }
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {configurable:true,get:() => true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal((await inspect()).playState, 'paused');
    await page.waitForTimeout(60);
    const frozen = await page.evaluate(() => document.querySelector('.life-orb-liquid').getAnimations({subtree:true}).find(a => a.animationName === 'hw-orb-warning').currentTime);
    await page.waitForTimeout(180);
    assert.equal(await page.evaluate(() => document.querySelector('.life-orb-liquid').getAnimations({subtree:true}).find(a => a.animationName === 'hw-orb-warning').currentTime), frozen);
    await page.evaluate(() => {delete document.hidden; document.dispatchEvent(new Event('visibilitychange'));});
    assert.equal((await inspect()).playState, 'running');
    await page.click('[data-open-panel="upgrades"]');
    assert.equal((await inspect()).playState, 'paused');
    await page.keyboard.press('Escape');
    assert.equal((await inspect()).playState, 'running');
    await page.evaluate(() => {
      window.__orbChanges = 0;
      window.__orbObserver = new MutationObserver(rows => window.__orbChanges += rows.length);
      window.__orbObserver.observe(document.querySelector('.life-orb-liquid'), {attributes:true,childList:true,subtree:true});
    });
    await page.waitForTimeout(2700);
    assert.equal(await page.evaluate(() => {window.__orbObserver.disconnect();return window.__orbChanges;}), 0, 'No DOM writes per pulse');
    await hp(0, true);
    assert.equal((await inspect()).count, 0, 'Defeat removes the warning');
    assert.equal((await inspect()).fill, 0);
    await hp(1);
    assert.equal((await inspect()).count, 0, 'Revive at full HP clears the warning');
    for (let i = 0; i < 3; i++) {
      await hp(.1);
      await page.click('#switchProfile');
      await page.waitForFunction(() => !document.documentElement.classList.contains('hw-game-active'));
      assert.equal((await inspect()).count, 0, 'No warning running in the menu');
      await page.click('[data-menu="continue"]');
      await page.click('.saved-profile');
      await page.waitForFunction(() => document.documentElement.classList.contains('hw-game-active') && !document.documentElement.classList.contains('hw-menu-open'));
      assert.equal((await inspect()).count, 1, 'Return to low-HP profile restores one warning');
    }
    assert.deepEqual(errors, []);
    console.log('PASS static lite/reduced motion, hidden/panel pause, no per-frame DOM changes, defeat/revive and three profile cycles');
    await page.close();
  } finally {await browser.close(); server.close();}
})().catch(error => {console.error(error); server.close(); process.exitCode = 1;});
