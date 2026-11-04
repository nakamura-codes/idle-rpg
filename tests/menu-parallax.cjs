/* Isolated browser regression: depth, lifecycle, fallback, preferences and fit. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream'});res.end(e?'':b);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--disable-vulkan','--disable-features=Vulkan']});
 const base=`http://127.0.0.1:${server.address().port}`,errors=[];
 try{
  const context=await browser.newContext({viewport:{width:1366,height:768}});
  await context.addInitScript(()=>{Object.defineProperty(navigator,'deviceMemory',{get:()=>8});Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8});});
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto(base);await p.waitForFunction(()=>document.getElementById('authScreen').dataset.parallax==='active');
  await p.mouse.move(20,20);await p.waitForTimeout(800);
  assert.equal(await p.locator('.menu-depth-plane').count(),2);
  const transforms=await p.locator('.menu-depth-plane').evaluateAll(planes=>planes.map(plane=>new DOMMatrix(getComputedStyle(plane).transform).m41));
  assert.ok(transforms.every((x,n)=>x>0&&(!n||x>transforms[n-1])),'Depth must increase towards the viewer');
  const boundaries=await p.locator('.menu-depth-plane').evaluateAll(planes=>planes.map(e=>e.getBoundingClientRect().toJSON()));
  assert.ok(boundaries.every(r=>r.left<0&&r.top<0&&r.right>1366&&r.bottom>768));
  // The real input position must not move the title or commands.
  const title=await p.locator('.hw-title-art').boundingBox();await p.mouse.move(1345,745);await p.waitForTimeout(800);assert.deepEqual(await p.locator('.hw-title-art').boundingBox(),title);
  await p.click('[data-menu="settings"]');await p.click('#menuMovement');assert.equal(await p.locator('#menuScenery').isVisible(),false);
  await p.reload();assert.equal(await p.locator('#menuScenery').isVisible(),false);assert.equal(await p.evaluate(()=>localStorage.getItem('hellward_menu_motion')),'off');
  await p.click('[data-menu="settings"]');await p.click('#menuMovement');await p.click('#menuBack');await p.waitForFunction(()=>document.getElementById('authScreen').dataset.parallax==='active');
  await p.click('[data-menu="new"]');await p.fill('#newProfileName','Teste Parallax');await p.click('#createProfileForm button');
  assert.equal(await p.locator('#menuScenery').isVisible(),false);
  const paused=await p.locator('.menu-depth-plane').evaluateAll(planes=>planes.map(e=>e.getAttribute('style')));
  await p.mouse.move(200,200);await p.waitForTimeout(120);assert.deepEqual(await p.locator('.menu-depth-plane').evaluateAll(planes=>planes.map(e=>e.getAttribute('style'))),paused);
  await p.click('#switchProfile');await p.waitForFunction(()=>document.getElementById('authScreen').dataset.parallax==='active');
  console.log('PASS two depth planes, viewport overscan, stable commands, saved toggle, battle suspension and menu return');
  if(process.env.HUD_SCREENSHOTS)fs.mkdirSync(process.env.HUD_SCREENSHOTS,{recursive:true});
  for(const [width,height] of [[1920,1080],[1920,852],[1366,768],[1024,600],[900,600],[390,844],[320,568],[844,390]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(150);
   const bounds=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,rects:[...document.querySelectorAll('.hw-title-art,#menuHome .hw-btn,.hw-note')].map(e=>e.getBoundingClientRect().toJSON())}));
   assert.ok(bounds.scroll<=width&&bounds.rects.every(r=>r.left>=0&&r.right<=width+.5&&r.top>=0&&r.bottom<=height+.5),`${width}×${height}`);
   if(process.env.HUD_SCREENSHOTS)await p.screenshot({path:path.join(process.env.HUD_SCREENSHOTS,`menu-${width}x${height}.png`)});
   await p.click('[data-menu="settings"]');await p.waitForTimeout(150);const settings=await p.locator('#menuPanel,#menuMovement,#menuBack').evaluateAll(elements=>elements.map(e=>e.getBoundingClientRect().toJSON()));assert.ok(settings.every(r=>r.left>=0&&r.right<=width+.5&&r.top>=0&&r.bottom<=height+.5),`${width}x${height} settings ${JSON.stringify(settings)}`);if(process.env.HUD_SCREENSHOTS)await p.screenshot({path:path.join(process.env.HUD_SCREENSHOTS,`menu-settings-${width}x${height}.png`)});await p.click('#menuBack');
  }
  await context.close();
  for(const variant of ['mobile','reduced','memory','cores','data','failure']){
   const ctx=await browser.newContext({viewport:variant==='mobile'?{width:390,height:844}:{width:1366,height:768},hasTouch:variant==='mobile',reducedMotion:variant==='reduced'?'reduce':'no-preference'});
   await ctx.addInitScript(({variant})=>{
    Object.defineProperty(navigator,'deviceMemory',{get:()=>variant==='memory'?2:8});Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>variant==='cores'?2:8});
    if(variant==='data')Object.defineProperty(navigator,'connection',{get:()=>({saveData:true})});
   },{variant});
   const page=await ctx.newPage(),requests=[];page.on('request',r=>{if(r.url().includes('/menu/parallax/'))requests.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
   if(variant==='failure')await page.route('**/menu/parallax/background.webp',r=>r.abort());
   await page.goto(base,{waitUntil:'networkidle'});assert.equal(await page.locator('#menuScenery').isVisible(),false,variant);
   if(variant!=='failure')assert.equal(requests.length,0,variant+' must not download depth textures');
   assert.ok(await page.locator('[data-menu="new"]').isVisible());
   await ctx.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS eight menu sizes; static mobile/reduced-motion/low-memory/low-core/data-saving/error fallbacks and zero JS errors');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
