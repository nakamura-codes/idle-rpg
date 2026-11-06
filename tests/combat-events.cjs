/* Native focus/touch regressions and both rare-event cards. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),sharp=require('sharp');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,bytes)=>{res.writeHead(error?404:200,{'Content-Type':({'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'});res.end(error?'':bytes);});
});
(async()=>{
  const {data,info}=await sharp(path.join(root,'assets/events/infernal-reliquary.webp')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(const [x,y] of [[0,0],[info.width-1,0],[0,info.height-1],[info.width-1,info.height-1]])assert.equal(data[(y*info.width+x)*4+3],0,'Frame exterior must be transparent, without a black rectangle');
  assert.ok(data[(Math.floor(info.height/2)*info.width+Math.floor(info.width/2))*4+3]>240,'Keep the dark interior panel');
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--disable-vulkan','--disable-features=Vulkan']});
  const errors=[],shots=process.env.HUD_SCREENSHOTS;
  if(shots)fs.mkdirSync(shots,{recursive:true});
  try{
    for(const mobile of (process.env.DESKTOP_ONLY?[false]:[false,true])){
      const p=await browser.newPage({viewport:mobile?{width:320,height:568}:{width:1366,height:768},hasTouch:mobile,isMobile:mobile});
      p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
      await p.route('**/game.js?*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  new Game();','  window.__combatTest={game:new Game(),freshMob};')}));
      await p.goto('http://127.0.0.1:'+server.address().port);
      await p.click('[data-menu="new"]');await p.fill('#newProfileName','Teste de combate');await p.click('#createProfileForm button');
      await p.waitForFunction(()=>document.getElementById('authScreen').hidden);
      await p.evaluate(()=>{
        const g=window.__combatTest.game;g.stopLoop();g.stepClock=()=>{};
        g.state.mob.hp=g.state.mob.maxHp=100000;g.state.heroHp=25;
        const potion=window.HELLWARD_ITEMS.find(i=>i.tipo==='poção');
        g.state.inventory.push({id:'test-potion',catalogId:potion.id,kind:'potion',slot:null,rarity:'comum',quality:null,name:potion.nome,qty:6,level:1,stats:{},createdAt:Date.now()});g.renderEverything();
      });
      if(!mobile){
        await p.click('#attackTarget');
        assert.equal(await p.evaluate(()=>document.activeElement.id),'attackTarget');
        const hp=await p.evaluate(()=>window.__combatTest.game.state.heroHp);
        await p.keyboard.press('q');
        assert.ok(await p.evaluate(()=>window.__combatTest.game.state.heroHp)>hp);
        assert.equal(await p.locator('#quickPotionCount').textContent(),'5');
        assert.equal(await p.locator('#attackTarget').evaluate(el=>getComputedStyle(el).outlineStyle),'none','Q must not outline the whole monster');
        await p.keyboard.press('Tab');await p.locator('#attackTarget').focus();
        const cue=await p.locator('#attackTarget').evaluate(el=>({visible:el.matches(':focus-visible'),hint:getComputedStyle(el.querySelector('.target-hint')).textDecorationLine}));
        assert.ok(cue.visible && cue.hint.includes('underline'),'Keyboard users retain a caption focus cue');
        const mobHp=await p.evaluate(()=>window.__combatTest.game.state.mob.hp);
        await p.keyboard.press('Space');assert.ok(await p.evaluate(()=>window.__combatTest.game.state.mob.hp)<mobHp);
        if(shots)await p.screenshot({path:path.join(shots,'q-after-attack.png')});
        console.log('PASS click → Q heals once, no monster rectangle; keyboard focus and Space attack work');
      }else{
        const hp=await p.evaluate(()=>window.__combatTest.game.state.mob.hp);
        for(let i=0;i<8;i++)await p.tap('#attackTarget');
        assert.ok(await p.evaluate(()=>window.__combatTest.game.state.mob.hp)<hp);
        assert.equal(await p.evaluate(()=>window.getSelection().toString()),'');
        const sprite=await p.locator('#monsterArt img').evaluate(el=>({drag:el.draggable,selection:getComputedStyle(el).userSelect,highlight:getComputedStyle(el).webkitTapHighlightColor}));
        assert.equal(sprite.drag,false);assert.equal(sprite.selection,'none');assert.equal(sprite.highlight,'rgba(0, 0, 0, 0)');
        await p.locator('#attackTarget').dispatchEvent('dblclick');assert.equal(await p.evaluate(()=>window.getSelection().toString()),'');
        await p.tap('#quickPotion');assert.equal(await p.locator('#quickPotionCount').textContent(),'5');
        console.log('PASS native repeated touch attacks and potion; no selection, image dragging or blue tap overlay');
      }
      for(const [w,h] of mobile?[[320,568],[390,844],[667,375],[844,390]]:[[1366,768]]){
        await p.setViewportSize({width:w,height:h});
        for(const type of ['chest','goblin']){
          await p.evaluate(type=>{const g=window.__combatTest.game;g.state.event={type,hp:80,maxHp:80,expiresAt:Date.now()+60000};g.lastEventRendered='';g.renderEvent();},type);
          await p.locator('#eventArt img').evaluate(img=>img.decode());
          const card=await p.locator('#eventOverlay').evaluate(el=>{
            const box=n=>n.getBoundingClientRect().toJSON();return {card:box(el),arena:box(document.getElementById('battlefield')),children:[...el.querySelectorAll('.event-ribbon,.event-title,.event-instruction,.event-progress-track,.event-clock')].map(n=>({box:box(n),scroll:n.scrollWidth,client:n.clientWidth})),src:el.querySelector('img').getAttribute('src')};
          });
          assert.ok(card.src.endsWith(type==='chest'?'cursed-chest.webp':'treasure-goblin.webp'));
          assert.equal(await p.locator('#eventOverlay').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)','No opaque box behind the ornate frame');
          assert.ok(card.card.x>=card.arena.x && card.card.right<=card.arena.right && card.card.y>=card.arena.y && card.card.bottom<=card.arena.bottom,`${w}x${h} event outside arena`);
          for(const child of card.children){assert.ok(child.box.x>=card.card.x && child.box.right<=card.card.right+1 && child.box.bottom<=card.card.bottom,`${w}x${h} clipped event caption`);assert.ok(child.scroll<=child.client+1,`${w} overflowing event text`);}
          const before=await p.evaluate(()=>({mob:window.__combatTest.game.state.mob.hp,event:window.__combatTest.game.state.event.hp}));
          if(mobile)await p.tap('#eventTarget');else await p.click('#eventTarget');
          assert.equal(await p.evaluate(()=>window.__combatTest.game.state.mob.hp),before.mob);
          assert.ok(await p.evaluate(()=>window.__combatTest.game.state.event.hp)<before.event);
          for(const zone of [0,5]){
            await p.evaluate(zone=>{const {game:g,freshMob}=window.__combatTest;g.state.zone=zone;g.state.zoneProgress[zone].stage=10;g.state.zoneProgress[zone].kills=10;g.state.mob=freshMob(g.state);g.renderEverything();},zone);
            const clear=await p.locator('#eventOverlay').evaluate(el=>{const b=el.getBoundingClientRect();return [...document.querySelectorAll('.battle-top,.stage-strip,.mob-info')].every(n=>{const r=n.getBoundingClientRect();return b.right<=r.left || b.left>=r.right || b.bottom<=r.top || b.top>=r.bottom;});});
            assert.ok(clear,`${w}x${h} zone ${zone+1} event overlaps a boss/region header: ${JSON.stringify(await p.evaluate(()=>Object.fromEntries(['#eventOverlay','.battle-top','.stage-strip','.mob-info'].map(s=>[s,document.querySelector(s).getBoundingClientRect().toJSON()]))))}`);
          }
          await p.evaluate(()=>{const {game:g,freshMob}=window.__combatTest;g.state.zone=0;g.state.zoneProgress[0].stage=1;g.state.zoneProgress[0].kills=0;g.state.mob=freshMob(g.state);g.state.mob.hp=g.state.mob.maxHp=100000;g.renderEverything();document.querySelector('.toast-stack').replaceChildren();});
          if(shots)await p.screenshot({path:path.join(shots,`${type}-${w}x${h}.png`)});
          // The 100 ms event countdown must not rebuild or decode its sprite.
          assert.equal(await p.evaluate(()=>{const g=window.__combatTest.game,img=document.querySelector('#eventArt img');g.renderEvent();return img===document.querySelector('#eventArt img');}),true);
          await p.evaluate(()=>{const g=window.__combatTest.game;g.state.event.hp=1;});
          const gold=await p.evaluate(()=>window.__combatTest.game.state.gold);
          if(mobile)await p.tap('#eventTarget');else await p.click('#eventTarget');
          assert.equal(await p.locator('#eventOverlay').isHidden(),true);
          assert.ok(await p.evaluate(()=>window.__combatTest.game.state.gold)>gold);
        }
        console.log(`PASS illustrated chest/goblin bounds, event-only damage, rewards and cached sprites at ${w}x${h}`);
      }
      await p.evaluate(()=>{const g=window.__combatTest.game;g.state.event={type:'chest',hp:10,maxHp:10,expiresAt:Date.now()-1};g.renderEvent();});
      assert.equal(await p.locator('#eventOverlay').isHidden(),true);
      await p.click('#switchProfile');await p.click('[data-menu="new"]');
      assert.notEqual(await p.locator('#newProfileName').evaluate(el=>getComputedStyle(el).userSelect),'none','Name fields remain editable/selectable');
      await p.close();
    }
    assert.deepEqual(errors,[]);console.log('PASS expiry, editable name field, no script/asset errors');
  }finally{await browser.close();}
})().then(()=>server.close()).catch(e=>{console.error(e);server.close();process.exitCode=1;});
