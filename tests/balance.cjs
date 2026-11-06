/* Deterministic gameplay checks; no browser or production test hooks required. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');let seed=123456;
const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',hidden:true,style:{},classList:{add(){},remove(){}},setAttribute(){}});return nodes.get(id);};
let clock=Date.now();class ClockDate extends Date{static now(){return clock;}}
const context={window:{},Math:math,Date:ClockDate,crypto:require('node:crypto').webcrypto,document:{visibilityState:'visible',addEventListener(){},getElementById:node}};
vm.createContext(context);
for(const file of ['item-catalog.js','game-art.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  new Game();','  globalThis.api={Game,newState,normalizeSave,freshMob,enemyBaseDamage,enemyHitDamage,enemyAttackInterval,combatRegeneration,unlockedZone,RARE_DROP_LIMIT};'),context);
const api=context.api;
function game(){const g=Object.create(api.Game.prototype);g.state=api.newState('Balance');g.tab='upgrades';for(const key of ['renderCore','renderPanel','renderEverything','renderEvent','save','toast','addLog','floatHeroNumber','playEnemyAttack','playCombatImpact','clearCombatVisuals'])g[key]=()=>{};g.state.lastEventAt=Date.now()+1e10;return g;}
const originalRandom=math.random;
// Bosses have meaningful minimum hits even against old overpowered armor.
const damage=[];
for(let z=0;z<6;z++){
 const g=game(),s=g.state;s.zone=z;s.zoneProgress[z].stage=10;s.zoneProgress[z].kills=10;s.mob=api.freshMob(s);
 const raw=api.enemyBaseDamage(s),hits=[0,10,100,600,2000,1e8].map(d=>api.enemyHitDamage(s,d));
 assert.ok(hits.every((h,i)=>h>=Math.round(raw*.25)&&(i===0||h<=hits[i-1])));
 assert.ok(hits[2]<hits[0],'Defense must still help');
 damage.push({zone:z+1,raw,defense600:hits[3],maximumArmor:hits[5]});
 const hp=s.heroHp;s.heroHp=1e9;assert.equal(api.enemyHitDamage(s,600),hits[3]);s.heroHp=hp;
}
assert.ok(damage[5].defense600>damage[0].defense600*5);
console.log('PASS boss armor floor, useful defense, increasing late-region damage, and no damage scaling with player health');
// Recovery keeps its normal value on common foes and has smooth, gear-independent
// saturation against elites. More recovery always helps; armor never lowers healing.
for(let zone=0;zone<6;zone++){
 const g=game(),s=g.state;s.zone=zone;s.zoneProgress[zone].stage=10;
 for(const kind of ['normal','miniboss','boss']){
  s.mob={...s.mob,kind};
  assert.equal(api.enemyAttackInterval(s.mob),kind==='boss'?2000:kind==='miniboss'?2200:2400);
  let last=0;
  for(const natural of [.8,5,30,200,1000000]){
   const recovery=api.combatRegeneration(s,natural);assert.ok(recovery>last&&recovery<=natural);last=recovery;
   if(kind==='normal')assert.equal(recovery,natural);
   else{
    for(const defense of [0,100,600,100000000]){
     const incoming=api.enemyHitDamage(s,defense)/(api.enemyAttackInterval(s.mob)/1000);
     assert.ok(recovery<incoming*(kind==='boss'?.33:.56),'Elite regeneration must not cancel sustained damage');
    }
   }
  }
 }
}
// Exercise the actual 100 ms simulation and attack scheduler, not just formulas.
{const g=game(),s=g.state;s.zone=3;s.zoneProgress[3].stage=10;s.zoneProgress[3].kills=10;s.mob=api.freshMob(s);s.level=60;s.upgrades.vitality=100;s.upgrades.recovery=30;
 s.inventory=[{id:'armor',kind:'equipment',slot:'armor',stats:{click:0,dps:0,crit:0,gold:0,luck:0,health:0,defense:600}}];s.equipment.armor='armor';
 const b=g.bonuses();assert.ok(b.regenNatural>30&&b.regen<8);
 s.upgrades.recovery++;assert.ok(g.bonuses().regen>b.regen);s.upgrades.recovery--;
 const natural=api.combatRegeneration(s,30);s.inventory[0].stats.defense=1200;assert.equal(api.combatRegeneration(s,30),natural);s.inventory[0].stats.defense=600;
 s.heroHp=b.maxHp*.7;const start=s.heroHp;s.nextEnemyAttackAt=clock+2000;s.nextEventAt=clock+1e10;g.lastFrameAt=clock;
 let hits=0;const strike=g.enemyStrike;g.enemyStrike=function(){hits++;strike.call(this);};
 for(let i=0;i<600;i++){clock+=100;g.stepClock();}
 assert.equal(hits,30);assert.ok(s.heroHp<start-1000&&s.heroHp>0,'Boss pressure must deplete HP despite high natural regeneration');
 const expected=start+b.regen*60-api.enemyHitDamage(s,b.defense)*30;assert.ok(Math.abs(s.heroHp-expected)<.001);
 const oldHp=s.heroHp,potion=context.window.HELLWARD_ITEMS.find(d=>d.tipo==='poção'&&d.regiao==='Fortaleza de Ferro');assert.ok(potion);
 s.inventory.push({id:'heal',catalogId:potion.id,name:potion.nome,kind:'potion',qty:1,createdAt:clock});g.usePotion('heal');assert.ok(s.heroHp>oldHp+1000,'Potions retain full healing');
 g.setHuntMode(3);assert.equal(g.bonuses().regen,g.bonuses().regenNatural);
 console.log('PASS 60-second boss simulation: 30 attacks, sustained HP loss, useful recovery upgrades, unchanged potions and full recovery on common foes');
}
// Ordinary foes retain the old formula, keeping a safe place to train.
{const g=game();for(const d of [0,30,300,3000])assert.equal(api.enemyHitDamage(g.state,d),Math.max(1,Math.round(api.enemyBaseDamage(g.state)*100/(100+d*4))));}
// A guaranteed good item must arrive even with the worst possible random rolls.
for(let z=0;z<6;z++){
 const g=game(),s=g.state;s.zone=z;math.random=()=>.999999;
 for(let n=0;n<59;n++)g.rollCombatLoot();assert.equal(s.inventory.length,0);assert.equal(s.lootDryStreak[z],59);
 g.rollCombatLoot();assert.equal(s.inventory.length,1);const item=s.inventory[0];
 assert.equal(item.kind,'equipment');assert.ok(['raro','epico','lendario'].includes(item.rarity));assert.ok(item.quality>=5);assert.equal(s.lootDryStreak[z],0);
}
math.random=()=>0;
{const g=game();g.state.lootDryStreak[0]=59;g.awardEquipment('raro',1);assert.equal(g.state.lootDryStreak[0],59);g.awardEquipment('raro',5);assert.equal(g.state.lootDryStreak[0],0);g.dropMaterial(3);g.dropMaterial(5);assert.equal(g.state.inventory.find(i=>i.kind==='material').qty,8);}
console.log('PASS guaranteed rare quality 5+ in all regions, low-quality loot does not erase the guarantee, and scrap bundles stack correctly');
math.random=originalRandom;
// Real item generation, seeded distribution; capture items instead of filling the bag.
{const g=game(),counts={material:0,potion:0,equipment:0};g.addItem=item=>{if(item)counts[item.kind]+=item.qty;return item;};
 for(let i=0;i<100000;i++)g.rollCombatLoot();
 assert.ok(counts.material>68000&&counts.material<72000);
 assert.ok(counts.potion>3500&&counts.potion<5500);
 assert.ok(counts.equipment>3000&&counts.equipment<4100);
 assert.ok(counts.material>counts.equipment*15);
 g.state.skills.r1=1000;assert.equal(g.bonuses().drop,.05);
 console.log('PASS seeded 100,000-kill loot distribution:',JSON.stringify(counts));
}
// Farming never consumes a campaign checkpoint or bypasses a mandatory boss.
{const g=game(),s=g.state,p=s.zoneProgress[0];p.stage=5;p.kills=10;s.mob=api.freshMob(s);assert.equal(s.mob.kind,'miniboss');
 const checkpoint=JSON.stringify(p);g.setHuntMode(6);assert.equal(s.farmStage,null);g.setHuntMode(3);
 assert.equal(s.mob.kind,'normal');const gold=s.gold;
 for(let i=0;i<65;i++)g.killMob();
 assert.equal(JSON.stringify(p),checkpoint);assert.equal(s.zone,0);assert.equal(api.unlockedZone(s,1),false);assert.ok(s.gold>gold&&s.level>1);
 assert.equal(s.farmStage,3);assert.equal(s.farmKills,5);
 const saved=api.normalizeSave(JSON.parse(JSON.stringify(s)),s.name);assert.equal(saved.farmStage,3);assert.equal(saved.farmKills,5);assert.equal(saved.mob.kind,'normal');assert.equal(saved.lootDryStreak[0],s.lootDryStreak[0]);
 g.setHuntMode(null);assert.equal(s.mob.kind,'miniboss');assert.equal(JSON.stringify(p),checkpoint);
 g.setHuntMode(3);s.upgrades.ritual=1000;s.heroHp=100;const pity=s.lootDryStreak[0];g.grantOffline(3600);
 assert.equal(JSON.stringify(p),checkpoint);assert.equal(s.lootDryStreak[0],pity);assert.equal(s.zone,0);
 g.setHuntMode(null);const result=g.grantOffline(3600);assert.equal(result.kills,0);
}
// Old saves get safe defaults. Hostile hunt/loot fields cannot unlock content.
{const old=JSON.parse(JSON.stringify(api.newState('Legacy')));delete old.farmStage;delete old.lootDryStreak;delete old.farmKills;
 const s=api.normalizeSave(old,'Legacy');assert.equal(s.farmStage,null);assert.deepEqual(Array.from(s.lootDryStreak),[0,0,0,0,0,0]);
 old.farmStage=999;old.farmKills=999;old.lootDryStreak=[999,-3,'bad'];const bad=api.normalizeSave(old,'Legacy');assert.equal(bad.farmStage,1);assert.equal(bad.farmKills,9);assert.equal(bad.lootDryStreak[0],59);assert.equal(bad.lootDryStreak[1],0);
}
console.log('PASS hunt repeat/resume, campaign gates, offline boundaries, persistent loot counters and safe old-save migration');
console.log('BOSS_DAMAGE',JSON.stringify(damage));
