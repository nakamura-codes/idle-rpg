/* Controlled CPU soak. Default: 10 min fixed glow, then 10 min pulsing at 25% HP.
   Measures the Chromium process tree via Linux /proc, not only JS task time. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),seconds=Number(process.env.CPU_SECONDS||600),interval=Math.min(10,seconds),output=process.argv[2];
const hz=Number(execFileSync('python',['-c',"import os;print(os.sysconf('SC_CLK_TCK'))"],{encoding:'utf8'}));
function ticks(rootPid){
 const all=new Map();
 for(const id of fs.readdirSync('/proc').filter(s=>/^\d+$/.test(s))){try{const raw=fs.readFileSync('/proc/'+id+'/stat','utf8'),v=raw.slice(raw.lastIndexOf(')')+2).trim().split(/\s+/);all.set(+id,{parent:+v[1],ticks:+v[11]+ +v[12],born:v[19]});}catch{}}
 const keep=new Set([rootPid]);let changed=true;while(changed){changed=false;for(const [id,v]of all)if(keep.has(v.parent)&&!keep.has(id)){keep.add(id);changed=true;}}
 return new Map([...all].filter(([id])=>keep.has(id)));
}
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.css':'text/css','.js':'application/javascript','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'});res.end(e?'':b);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const result={secondsPerArm:seconds,cpuUnit:'percent of one CPU core, aggregate Chromium process tree',hz,arms:[]};
 try{
  for(const arm of (process.env.CPU_ARMS||'fixed,pulse').split(',')){
   const profileArg='--hellward-soak-id='+arm+'-'+Date.now();
   const service=await chromium.launchServer({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:[profileArg,'--no-sandbox','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--disable-vulkan','--disable-features=Vulkan']});
   const browser=await chromium.connect(service.wsEndpoint());
   try{
    const p=await browser.newPage({viewport:{width:1366,height:768}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.route('**/game.js?*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  new Game();','  window.__soak=new Game();')}));
    await p.goto('http://127.0.0.1:'+server.address().port);await p.click('[data-menu="new"]');await p.fill('#newProfileName','CPU '+arm);await p.click('#createProfileForm button');await p.waitForFunction(()=>document.documentElement.classList.contains('hw-game-active')&&!document.documentElement.classList.contains('hw-menu-open'));
    await p.evaluate(()=>{const g=window.__soak;g.stopLoop();g.startLoop=()=>{};g.stepClock=()=>{};const def=window.HELLWARD_ITEMS.find(i=>i.id.includes('pocao'));g.state.inventory.push({id:'soak-potion',kind:'potion',catalogId:def.id,name:def.nome,qty:3,createdAt:Date.now()});g.state.deadUntil=0;g.state.heroHp=g.bonuses().maxHp*.25;g.potionRenderKey='';g.renderCore();});
    if(arm==='pulse'&&process.env.CPU_PULSE_STEPS)await p.addStyleTag({content:'#errantVitals .life-orb-liquid::before,#quickPotion::before{animation-timing-function:steps('+Number(process.env.CPU_PULSE_STEPS)+',end)!important}'});
    if(arm==='fixed')await p.addStyleTag({content:'#errantVitals .life-orb-liquid::before,#quickPotion::before{animation:none!important;opacity:.45!important;will-change:auto!important}'});
    await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})));});
    await p.waitForTimeout(5000);
    assert.equal(await p.locator('#errantVitals').getAttribute('data-vitality'),'low');assert.equal(await p.locator('#quickPotion').getAttribute('data-life-cue'),'low');
    const cdp=await p.context().newCDPSession(p);await cdp.send('Performance.enable');
    // The executor can remap child PIDs; resolve the actual /proc ID by the unique temporary profile.
    const pid=fs.readdirSync('/proc').filter(s=>/^\d+$/.test(s)).map(Number).find(id=>{try{const args=fs.readFileSync('/proc/'+id+'/cmdline','utf8').split('\0');return args.includes(profileArg)&&!args.some(a=>a.startsWith('--type='));}catch{return false;}});
    assert.ok(pid,'Resolve Chromium browser process');
    const firstDOMNodes=await p.locator('*').count(),animationTiming=await p.locator('.life-orb-liquid').evaluate(n=>getComputedStyle(n,'::before').animationTimingFunction);
    const rows=[],started=performance.now();let previous=ticks(pid),last=performance.now();assert.ok(previous.size>=2,'Read actual Chromium process tree');
    while(performance.now()-started<seconds*1000){
     await new Promise(r=>setTimeout(r,Math.min(interval*1000,seconds*1000-(performance.now()-started))));
     const now=performance.now(),current=ticks(pid);let delta=0;for(const [id,v]of current){const old=previous.get(id);if(old&&old.born===v.born)delta+=Math.max(0,v.ticks-old.ticks);}
     const metrics=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
     rows.push({elapsedSec:(now-started)/1000,cpuPercent:delta/hz/((now-last)/1000)*100,processes:current.size,nodes:metrics.Nodes,heap:metrics.JSHeapUsedSize,taskSeconds:metrics.TaskDuration});previous=current;last=now;
     if(rows.length%6===0||now-started>=seconds*1000)console.log(arm,Math.round((now-started)/1000)+'s','CPU',rows.slice(-6).reduce((n,r)=>n+r.cpuPercent,0)/Math.min(6,rows.length));
    }
    assert.deepEqual(errors,[]);const mean=a=>a.reduce((n,r)=>n+r.cpuPercent,0)/a.length,window=Math.min(12,rows.length);
    const lastDOMNodes=await p.locator('*').count();
    result.arms.push({arm,firstDOMNodes,lastDOMNodes,animationTiming,meanCPU:mean(rows),firstWindowCPU:mean(rows.slice(0,window)),lastWindowCPU:mean(rows.slice(-window)),firstNodes:rows[0].nodes,lastNodes:rows.at(-1).nodes,rows});if(output)fs.writeFileSync(output,JSON.stringify(result,null,2));
   }finally{await browser.close();await service.close();}
  }
  const fixed=result.arms.find(a=>a.arm==='fixed'),pulse=result.arms.find(a=>a.arm==='pulse');
  if(fixed&&pulse)result.deltaMeanCPU=pulse.meanCPU-fixed.meanCPU;
  if(pulse){result.pulseDrift=pulse.lastWindowCPU-pulse.firstWindowCPU;result.noNodeGrowth=pulse.lastDOMNodes<=pulse.firstDOMNodes&&pulse.lastNodes<=pulse.firstNodes;}
  result.limit='Headless process-tree CPU samples; compare measured deltas and drift, not hardware-wide perceptibility. No game simulation, regeneration or damage during either arm; actor idles remain identical.';
  if(output)fs.writeFileSync(output,JSON.stringify(result,null,2));console.log(JSON.stringify({fixedCPU:fixed?.meanCPU,pulseCPU:pulse?.meanCPU,delta:result.deltaMeanCPU,drift:result.pulseDrift,noNodeGrowth:result.noNodeGrowth}));
 }finally{server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
