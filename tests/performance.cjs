const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(e?'':b)});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--disable-vulkan','--disable-features=Vulkan']});const rows=[];
try{for(const test of [{name:'desktop',width:1366,height:768,cpu:1},{name:'mobile-6x',width:390,height:844,cpu:6}]){
 const p=await browser.newPage({viewport:{width:test.width,height:test.height}});const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:test.cpu});await cdp.send('Performance.enable');
 await p.addInitScript(()=>{window.__mutations=0;new MutationObserver(r=>window.__mutations+=r.length).observe(document,{subtree:true,attributes:true,characterData:true,childList:true});});
 if(process.env.PERF_EVENTS)await p.route('**/game.js?*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  new Game();','  window.__perfGame=new Game();')}));
 await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForTimeout(1000);
 async function sample(scene){
 const before=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
 const stats=await p.evaluate(async()=>{const start=performance.now(),base=window.__mutations,frames=[];let last=start;return await new Promise(resolve=>{function tick(t){frames.push(t-last);last=t;if(t-start<5000)requestAnimationFrame(tick);else{frames.sort((a,b)=>a-b);resolve({frames:frames.length,elapsed:t-start,p95:frames[Math.floor(frames.length*.95)],slow:frames.filter(x=>x>34).length,mutations:window.__mutations-base})}}requestAnimationFrame(tick)})});
 const after=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));const out={device:test.name,scene,...stats,fps:Math.round(stats.frames*1000/stats.elapsed),layout:after.LayoutCount-before.LayoutCount,style:after.RecalcStyleCount-before.RecalcStyleCount,taskMs:Math.round(1000*(after.TaskDuration-before.TaskDuration)),scriptMs:Math.round(1000*(after.ScriptDuration-before.ScriptDuration))};rows.push(out);console.log(out);
 }
 await sample('menu');await p.click('[data-menu="new"]');await p.fill('#newProfileName','Perf');await p.click('#createProfileForm button');await p.waitForTimeout(500);await sample('battle-idle');
 await p.evaluate(()=>window.__auto=setInterval(()=>document.getElementById('attackTarget').click(),200));await sample('battle-attacks');await p.evaluate(()=>clearInterval(window.__auto));if(process.env.PERF_EVENTS){
  for(const type of ['chest','goblin']){
   await p.evaluate(type=>{const g=window.__perfGame;g.state.event={type,hp:1e9,maxHp:1e9,expiresAt:Date.now()+1e8};g.lastEventRendered='';g.renderEvent();},type);
   await p.locator('#eventArt').evaluate(async el=>{for(const img of el.querySelectorAll('img'))await img.decode();});
   await p.evaluate(()=>window.__auto=setInterval(()=>document.getElementById('eventTarget').click(),200));await sample('event-'+type);await p.evaluate(()=>clearInterval(window.__auto));
  }
  await p.evaluate(()=>{const g=window.__perfGame;g.state.event=null;g.renderEvent();});
 }
 await p.click('[data-open-panel="upgrades"]');await sample('codex-idle');await p.keyboard.press('Escape');if(process.env.PERF_HUNT){await p.click('[data-open-panel="zones"]');await p.selectOption('#farmStageSelect','1');await p.click('[data-start-hunt]');await p.keyboard.press('Escape');await p.evaluate(()=>window.__auto=setInterval(()=>document.getElementById('attackTarget').click(),200));await sample('hunt-attacks');await p.evaluate(()=>clearInterval(window.__auto));}await p.click('#switchProfile');await sample('menu-return');await p.close();
}}finally{await browser.close();server.close();}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(rows,null,2));
if(process.env.PERF_BASELINE){
 const baseline=JSON.parse(fs.readFileSync(process.env.PERF_BASELINE,'utf8'));
 const regressions=rows.flatMap(row=>{const before=baseline.find(x=>x.device===row.device&&x.scene===(row.scene==='hunt-attacks'?'battle-attacks':row.scene));return !before?[row.device+' '+row.scene+': missing baseline']:row.fps<before.fps-3?[row.device+' '+row.scene+': FPS '+before.fps+' -> '+row.fps]:row.p95>before.p95+5?[row.device+' '+row.scene+': p95 '+before.p95+' -> '+row.p95]:[];});
 if(regressions.length)throw Error('Performance regression: '+regressions.join('; '));
 console.log('PASS performance comparison: <=3 FPS sampling tolerance and <=5 ms p95 variation');
}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
