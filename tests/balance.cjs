/* Deterministic gameplay checks; no browser or production test hooks required. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');let seed=123456;
const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',hidden:true,style:{},classList:{add(){},remove(){}},setAttribute(){}});return nodes.get(id);};
const context={window:{},Math:math,Date,crypto:require('node:crypto').webcrypto,document:{addEventListener(){},getElementById:node}};
vm.createContext(context);
for(const file of ['item-catalog.js','game-art.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  new Game();','  globalThis.api={Game,newState,normalizeSave,freshMob,enemyBaseDamage,enemyHitDamage,unlockedZone,RARE_DROP_LIMIT};'),context);
const api=context.api;
function game(){const g=Object.create(api.Game.prototype);g.state=api.newState('Balance');g.tab='upgrades';for(const key of ['renderCore','renderPanel','renderEverything','renderEvent','save','toast','addLog','floatHeroNumber'])g[key]=()=>{};g.state.lastEventAt=Date.now()+1e10;return g;}
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
