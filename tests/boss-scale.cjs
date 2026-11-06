const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),sharp=require('sharp');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..'),roster=JSON.parse(fs.readFileSync(path.join(root,'CREATURES.json')));
const server=http.createServer((req,res)=>{const f=path.join(root,req.url.split('?')[0]==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream'});res.end(e?'':b);});});
async function alpha(file){const {data,info}=await sharp(path.join(root,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});let left=info.width,top=info.height,right=0,bottom=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}return {left,top,right,bottom,width:info.width,height:info.height};}
(async()=>{
 const silhouettes={};for(const f of ['assets/hero/fast/errante.webp',...roster.filter(x=>x.slot===6).map(x=>x.asset)])silhouettes[f]=await alpha(f);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--disable-vulkan','--disable-features=Vulkan']});
 try{
  const p=await browser.newPage({viewport:{width:1366,height:768}}),errors=[],metrics=[],shots=process.env.HUD_SCREENSHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.route('**/game.js?*',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  new Game();','  window.__bossTest={game:new Game(),ZONES};')}));
  await p.goto('http://127.0.0.1:'+server.address().port);await p.click('[data-menu="new"]');await p.fill('#newProfileName','Nakamura');await p.click('#createProfileForm button');await p.waitForFunction(()=>document.getElementById('authScreen').hidden);
  await p.evaluate(()=>{const g=window.__bossTest.game;g.stopLoop();g.state.level=47;g.state.heroHp=g.bonuses().maxHp;});
  for(const [w,h] of [[1920,1080],[1366,768],[1024,600],[390,844],[320,568],[844,390],[667,375]].filter(([w,h])=>!process.env.DESKTOP_ONLY||(w>=1000&&h>=600))){
   await p.setViewportSize({width:w,height:h});
   for(let zone=0;zone<6;zone++){
    await p.evaluate(zone=>{const {game:g,ZONES}=window.__bossTest;g.state.zone=zone;g.state.deadUntil=0;g.state.zoneProgress[zone].stage=10;g.state.mob={name:ZONES[zone].boss,kind:'boss',level:50,hp:100,maxHp:100};g.lastZoneRendered=-1;g.renderCore();},zone);
    await p.locator('#monsterArt img').evaluate(img=>img.decode());
    const result=await p.evaluate(silhouettes=>{
     const bounds=selector=>{const img=document.querySelector(selector),r=img.getBoundingClientRect(),key=img.getAttribute('src').split('?')[0],a=silhouettes[key],scale=Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight),x=r.x+(r.width-img.naturalWidth*scale)/2,y=r.bottom-img.naturalHeight*scale;return {x:x+a.left*scale,y:y+a.top*scale,right:x+a.right*scale,bottom:y+a.bottom*scale,height:(a.bottom-a.top)*scale};};
     const arena=document.getElementById('battlefield').getBoundingClientRect().toJSON(),dock=document.querySelector('.hud-dock'),pseudo=getComputedStyle(dock,'::before'),hp=document.querySelector('.mob-info'),s=getComputedStyle(hp,'::before');return {hero:bounds('#combatHero img'),boss:bounds('#monsterArt img'),arena,hp:hp.getBoundingClientRect().toJSON(),nameBackground:s.backgroundColor,dockFrame:pseudo.borderImageSource,footer:dock.getBoundingClientRect().toJSON()};
    },silhouettes);
    const {boss,hero,arena,hp}=result,ratio=boss.height/hero.height,coverage=boss.height/arena.height;
    assert.ok(boss.x>=arena.x-1&&boss.right<=arena.right+1&&boss.y>=hp.bottom+2&&boss.bottom<=arena.bottom,`${w} boss ${zone} clipped: ${JSON.stringify(result)}`);
    assert.ok(ratio>=(zone===5?3.4:1.65),`${w} boss ${zone} visible silhouette too small: ${ratio}`);
    if(zone===5)assert.ok(coverage>=(w>h?.6:w<=360?.48:w<=760?.68:.6),`${w} Emperor must dominate arena: ${coverage}`);
    assert.equal(result.nameBackground,'rgba(0, 0, 0, 0)','No red rectangular backdrop outside the ornate monster HUD');assert.ok(result.dockFrame.includes('command-surround.webp'));
    assert.ok(result.footer.x>=0&&result.footer.right<=w+1&&result.footer.bottom<=h+1);
    metrics.push({viewport:[w,h],zone,ratio,coverage});if(shots)await p.screenshot({path:path.join(shots,`boss-${zone}-${w}x${h}.png`)});
   }
   for(const panel of ['upgrades','ascension','inventory','zones','chronicle']){await p.click(`[data-open-panel="${panel}"]`);assert.ok(await p.locator('#hudPanel').isVisible());await p.keyboard.press('Escape');}
   console.log('PASS visible alpha silhouettes, full command HUD and controls at '+w+'x'+h);
  }
  assert.deepEqual(errors,[]);if(process.env.BOSS_METRICS)fs.writeFileSync(process.env.BOSS_METRICS,JSON.stringify(metrics,null,2));
 }finally{await browser.close();}
})().then(()=>server.close()).catch(e=>{console.error(e);server.close();process.exitCode=1});
