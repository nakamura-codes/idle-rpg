# HELLWARD — correção aprovada do item 1

## O que mudou

- Eco âmbar também na barra de vitalidade do herói; as duas barras principais mostram o HP imediatamente.
- Espera de 500 ms e descida de 420 ms, ajustáveis em `FX_CONFIG.healthTrail` no topo de `game.js`.
- Golpes durante a espera reiniciam os 500 ms mantendo a faixa parada no mesmo ponto. Durante uma descida já iniciada, outro golpe redireciona o movimento a partir do valor visual atual, sem salto nem nova espera.
- Na troca de inimigo, região ou fase, a faixa do inimigo reinicia em 100%, sem animação de descida, inclusive se o nome for repetido ou a referência do inimigo for reutilizada na troca de fase. Isso não altera o HP real do monstro.
- A faixa do herói representa apenas o próprio dano. Abrir um perfil, mudar HP máximo ou limpar efeitos sincroniza seu eco ao HP real; trocar de fase não cura o personagem.
- Qualquer cura, inclusive um pequeno tick de regeneração, sincroniza o eco imediatamente e cancela a animação pendente.
- Movimento reduzido, modo leve e `enabled:false` sincronizam sem eco animado; menu, troca/importação de perfil e aba oculta limpam os dois canais.
- No máximo duas animações de eco e dois elementos fixos. Sem timers, loops por quadro, partículas ou leituras de geometria adicionados. A leitura de `currentTime` ocorre apenas na mudança de HP; `commitStyles()` é usado somente se um golpe interromper uma descida já iniciada.
- Os itens 2–6, sprites, dimensões dos chefes, atributos, dano, recompensas e formato do save permanecem iguais.

## Arquivos alterados

Produção: `game.js`, `index.html` e `combat-events.css`.

Validação: `tests/enemy-health-trail.cjs` e `tests/performance.cjs`. Documentação: este arquivo e `docs/performance-health-trail-v2.json`.

## Teste manual curto

1. No Imperador, dê um golpe: o vermelho deve cair imediatamente e o âmbar esperar cerca de meio segundo antes de descer.
2. Dê três golpes rápidos enquanto o âmbar está esperando e pare: a espera deve contar novamente a partir do último golpe, sem piscar.
3. Quando o âmbar já estiver descendo, ataque novamente: a faixa deve continuar do ponto em que está, sem pular para cima.
4. Receba dano e confira a barra do herói. Use uma poção; qualquer cura, inclusive regeneração passiva, deve encaixar o âmbar imediatamente. Por essa regra, a regeneração pode encerrar o eco antes dos 500 ms.
5. Derrote um inimigo ou avance de fase: o âmbar do novo alvo deve começar cheio, sem arrastar o dano do anterior. O HP do herói não deve ser restaurado pela troca.
6. Ative redução de movimento e repita: HP e combate devem continuar funcionando sem eco animado.

## Código completo dos trechos alterados

As funções abaixo foram copiadas integralmente da implementação, sem reticências. São métodos da classe `Game`; mantenha-os dentro dessa classe. A configuração permanece no início da função envolvente de `game.js`. Em `constructor()`, `showAuth()` e `activate()`, as alterações são apenas a inicialização/limpeza do novo canal de HP; em `renderCore()`, a atualização direta de `heroHPFill` foi substituída por `renderHeroHealth(hp,b.maxHp)`.

### game.js — configuração

```js
  const FX_CONFIG = {
    healthTrail: {
      enabled: true,
      delayMs: 500,
      durationMs: 420,
      easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)'
    }
  };
```

### game.js — constructor()

```js
    constructor() {
      this.state = null;
      this.profileId = null;
      this.tab = 'upgrades';
      this.buyQuantity = 1;
      this.attributeQuantity = 1;
      this.huntSelection = null;
      this.inventoryFilter = 'all';
      this.inventorySort = 'new';
      this.sellRarity = 'low';
      this.lastFrameAt = 0;
      this.lastCoreRender = 0;
      this.lastPanelRender = 0;
      this.lastZoneRendered = -1;
      this.lastEventRendered = '';
      this.enemyHealthTrail = null;
      this.heroHealthTrail = null;
      this.combatNumbers = {enemy:new Map(),hero:new Map()};
      this.combatNumberSequence = {enemy:0,hero:0};
      this.combatNumberAnchors = {};
      this.combatVisuals = new Map();
      this.lastCombatImpactAt = -Infinity;
      this.lastCriticalImpactAt = -Infinity;
      document.documentElement.toggleAttribute('data-combat-idle-paused',document.hidden);
      this.reducedCombatMotion = matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedCombatMotion.addEventListener('change',()=>{
        this.resetEnemyHealthTrail();
        this.resetHeroHealthTrail();
        this.clearCombatNumbers();
        this.clearCombatVisuals();
        if(this.state)this.renderEnemyHealth();
      });
      this.startedLoop = false;
      this.loopTimer = 0;
      this.arenaSize = {width:800,height:400};
      // Reuse one observer: cache anchors only when the arena/actors/event resize.
      // Floating numbers never measure layout on hits or animation frames.
      const combatResize=new ResizeObserver(()=>this.cacheCombatNumberAnchors());
      for(const id of ['battlefield','combatHero','attackTarget','eventOverlay'])combatResize.observe($(id));
      this.sessionStorage = new Map();
      this.storageAvailable = this.testStorage();
      this.resetLegacyProgress();
      this.bindEvents();
      document.querySelectorAll('[data-status-icon]').forEach(node=>paintIcon(node,ART.status[node.dataset.statusIcon]));
      this.showAuth();
      window.addEventListener('pagehide',()=>this.save());
      window.addEventListener('beforeunload',()=>this.save());
      document.addEventListener('visibilitychange',()=>{
        document.documentElement.toggleAttribute('data-combat-idle-paused',document.hidden);
        this.resetEnemyHealthTrail();
        this.resetHeroHealthTrail();
        this.clearCombatNumbers();
        this.clearCombatVisuals();
        if (this.state) {this.stepClock();this.save();if(document.hidden)this.stopLoop();else{this.renderCore();this.startLoop();}}
      });
      setInterval(()=>this.save(),SAVE_INTERVAL);
    }
```

### game.js — showAuth()

```js
    showAuth() {
      this.stopLoop();
      this.resetEnemyHealthTrail();
      this.resetHeroHealthTrail();
      this.clearCombatNumbers();
      this.clearCombatVisuals();
      const profiles=this.getProfiles().sort((a,b)=>b.lastPlayed-a.lastPlayed);
      const list=$('profileList');
      list.replaceChildren();
      for (const profile of profiles) {
        const btn=document.createElement('button');btn.type='button';btn.className='saved-profile';
        const name=document.createElement('strong');name.textContent='♜  '+profile.name;
        const detail=document.createElement('small');detail.textContent='CONTINUAR  ❯';
        btn.append(name,detail);btn.addEventListener('click',()=>this.openProfile(profile));list.append(btn);
      }
      prop('savedProfiles','hidden',profiles.length===0);
      prop('authScreen','hidden',false);
      $('authScreen').dispatchEvent(new Event('menu-open'));
      document.dispatchEvent(new CustomEvent('hellward:scenechange',{detail:{scene:'menu'}}));
      $('newProfileName').value='';
    }
```

### game.js — activate()

```js
    activate(profile,state) {
      this.resetEnemyHealthTrail();
      this.resetHeroHealthTrail();
      this.clearCombatNumbers();
      this.clearCombatVisuals();
      this.state=state;
      this.huntSelection=null;
      this.profileId=profile.id;
      this.lastZoneRendered=-1;
      this.lastEventRendered='';
      this.lastFrameAt=now();
      prop('authScreen','hidden',true);
      document.dispatchEvent(new CustomEvent('hellward:scenechange',{detail:{scene:'battle'}}));
      const seconds=Math.min(MAX_OFFLINE_SECONDS,Math.max(0,(now()-state.lastSeen)/1000));
      const offline=this.grantOffline(seconds);
      state.lastSeen=now();
      if (state.event && state.event.expiresAt <= now()) state.event=null;
      state.nextEventAt=now()+this.nextEventDelay();
      state.nextEnemyAttackAt=now()+enemyAttackInterval(state.mob);
      if(state.deadUntil && state.deadUntil<=now()) {state.deadUntil=0;state.heroHp=this.bonuses().maxHp;state.mob=freshMob(state);}
      this.touchProfile();
      this.renderEverything();
      this.addLog('Uma chama ressurge nas ruínas. A caçada continua.','✦','good');
      if (!this.storageAvailable) this.toast('Modo temporário: seu navegador bloqueou o armazenamento. Exporte backups JSON.');
      if (offline.kills>0) {
        this.addLog(`Seu ritual venceu ${fmt(offline.kills)} inimigos durante sua ausência.`, '☽', 'good');
        this.dialog('As cinzas guardaram sua jornada',`${state.name}, seus rituais continuaram a colher poder enquanto você esteve ausente.`,[{text:'RETOMAR A CAÇADA',primary:true}],'☽',{kind:'offline',duration:this.formatDuration(seconds),kills:offline.kills,gold:offline.gold,xp:offline.xp});
      }
      this.save();
      this.startLoop();
    }
```

### game.js — resetEnemyHealthTrail()

```js
    resetEnemyHealthTrail() {
      this.enemyHealthTrail?.animation?.cancel();
      this.enemyHealthTrail=null;
    }
```

### game.js — resetHeroHealthTrail()

```js
    resetHeroHealthTrail() {
      this.heroHealthTrail?.animation?.cancel();
      this.heroHealthTrail=null;
    }
```

### game.js — updateHealthTrail()

```js
    updateHealthTrail(key,id,ratio,resetTo=null) {
      const previous=this[key],node=$(id),config=FX_CONFIG.healthTrail;
      const motion=config.enabled && !document.hidden && !this.reducedCombatMotion.matches && !document.documentElement.classList.contains('hw-lite');
      if(!motion || !previous || resetTo!==null || ratio>previous.ratio){
        previous?.animation?.cancel();
        fill(id,(motion && resetTo!==null?resetTo:ratio)*100);
        return this[key]={ratio,animation:null,delay:0,duration:0};
      }
      if(previous.ratio===ratio)return previous;
      let delay=config.delayMs;
      let from=node.style.transform || `scaleX(${previous.ratio})`;
      const old=previous.animation;
      if(old){
        if(old.playState!=='finished' && old.playState!=='idle'){
          // Hits in the waiting phase restart its delay; an ongoing fall stays smooth.
          const time=old.currentTime??0;
          if(time<previous.delay)from=previous.from;
          else if(time<previous.delay+previous.duration){
            // Freeze only an interrupted fall, once per hit; no geometry reads.
            old.commitStyles();
            from=node.style.transform;
            delay=0;
          }
        }
        old.cancel();
      }
      fill(id,ratio*100);
      const animation=node.animate([{transform:from},{transform:`scaleX(${ratio})`}],{
        delay,duration:config.durationMs,easing:config.easing,fill:'both'
      });
      const next=this[key]={ratio,animation,delay,duration:config.durationMs,from};
      animation.finished.then(()=>{
        if(this[key]?.animation===animation){
          this[key].animation=null;
          animation.cancel();
        }
      },()=>{});
      return next;
    }
```

### game.js — renderEnemyHealth()

```js
    renderEnemyHealth() {
      const s=this.state,mob=s.mob,previous=this.enemyHealthTrail,stage=combatStage(s);
      const ratio=Math.max(0,Math.min(1,mob.hp/Math.max(1,mob.maxHp)));
      fill('mobHPFill',ratio*100);
      attr('mobHealthProgress','aria-label',`Vida de ${mob.name}`);
      attr('mobHealthProgress','aria-valuenow',String(Math.round(ratio*100)));
      attr('mobHealthProgress','aria-valuetext',`${fmt(Math.ceil(mob.hp))} de ${fmt(mob.maxHp)} pontos de vida`);
      const changed=previous && (previous.mob!==mob || previous.maxHp!==mob.maxHp || previous.zone!==s.zone || previous.stage!==stage);
      const trail=this.updateHealthTrail('enemyHealthTrail','mobHPDamageTrail',ratio,changed?1:null);
      Object.assign(trail,{mob,maxHp:mob.maxHp,zone:s.zone,stage});
    }
```

### game.js — renderHeroHealth()

```js
    renderHeroHealth(hp,maxHp) {
      const ratio=Math.max(0,Math.min(1,hp/Math.max(1,maxHp))),previous=this.heroHealthTrail;
      fill('heroHPFill',ratio*100);
      const changed=previous && (previous.state!==this.state || previous.maxHp!==maxHp);
      const trail=this.updateHealthTrail('heroHealthTrail','heroHPDamageTrail',ratio,changed?ratio:null);
      Object.assign(trail,{state:this.state,maxHp});
    }
```

### game.js — renderCore()

```js
    renderCore() {
      const s=this.state;
      if(!s)return;
      const b=this.bonuses();
      this.renderScene();
      text('goldValue',fmt(s.gold));
      text('prestigeValue',fmt(s.souls));
      const points = attributePoints(s);
      $('attributeBadge').textContent = fmt(points);
      $('attributeBadge').hidden = points === 0;
      $('attributeBadge').parentElement.setAttribute('aria-label', `Livro Negro: status e pontos (C). ${fmt(points)} pontos disponíveis`);
      text('fragmentValue',`${s.shards} / 10`);
      text('profileName',s.name);
      text('playerHeroName',s.name);
      attr('playerHeroName','title',s.name);
      text('combatHeroName',s.name);
      attr('heroHealthProgress','aria-label','Vida de '+s.name);
      attr('codexSummary','aria-label','Status de '+s.name);
      text('levelValue',fmt(s.level));
      const required=xpNeeded(s.level);
      text('xpLabel',s.level===MAX_LEVEL?'NÍVEL MÁXIMO':`${fmt(s.xp)} / ${fmt(required)} XP`);
      const pct=s.level>=MAX_LEVEL?100:Math.max(0,Math.min(100,s.xp/required*100));
      fill('xpFill',pct);
      attr('xpProgress','aria-valuenow',String(Math.round(pct)));
      text('clickStat',fmt(b.click,1));
      text('dpsStat',fmt(b.dps,1));
      text('critStat',fmtPercent(b.crit));
      text('luckStat',fmtPercent(b.luck));
      const hp=Math.min(s.heroHp,b.maxHp);
      text('heroHPText',`${fmt(Math.ceil(hp))} / ${fmt(b.maxHp)} HP`);
      this.renderHeroHealth(hp,b.maxHp);
      fill('lifeOrbFill',hp/b.maxHp*100,'Y');
      fill('arenaHPFill',Math.max(0,Math.min(100,hp/b.maxHp*100)));
      $('heroHPFill').classList.toggle('critical',hp/b.maxHp<.26);
      $('errantVitals').classList.toggle('low-health',hp/b.maxHp<.26 && !s.deadUntil);
      attr('heroHealthProgress','aria-valuenow',String(Math.round(100*hp/b.maxHp)));
      attr('heroHealthProgress','aria-valuetext',`${fmt(Math.ceil(hp))} de ${fmt(b.maxHp)} pontos de vida`);
      const potionKey=`${s.inventory.length}|${s.inventory.filter(x=>x.kind==='potion').map(x=>x.id+':'+x.qty).join(',')}|${deadForPotion(s,b)}`;
      if(this.potionRenderKey!==potionKey){this.potionRenderKey=potionKey;this.renderQuickPotion();}
      const regenText=`+${fmt(b.regen,1)}/s`,naturalRegenText=`+${fmt(b.regenNatural,1)}/s`;
      text('heroRegeneration',regenText);
      attr('heroRegeneration','title',`Recuperação atual: ${regenText}. Natural: ${naturalRegenText}.${s.mob.kind==='normal'?'':' A presença de elites limita a cura passiva.'}`);
      text('combatRegen',regenText);
      text('naturalRegen',naturalRegenText);
      text('defenseStat',fmt(b.defense,1));
      text('hpStat',fmt(b.maxHp));
      const dead=Boolean(s.deadUntil);
      prop('attackTarget','disabled',dead);
      prop('heroRespawn','hidden',!dead);
      text('heroRespawnTime',dead?`${Math.ceil(Math.max(0,s.deadUntil-now())/1000)}s`:'');
      $('combatHero').classList.toggle('defeated',dead);
      text('enemyDamage',fmt(enemyHitDamage(s,b.defense)));
      text('rareDropProgress',`${s.lootDryStreak[s.zone]} / ${RARE_DROP_LIMIT} abates ativos`);
      text('enemyAttackCountdown',dead?'PAUSADO':`${(Math.max(0,s.nextEnemyAttackAt-now())/1000).toFixed(1)}s`);
      text('runKills',fmt(s.runKills));
      text('runGold',fmt(s.runGold));
      text('rebirths',fmt(s.rebirths));
      text('runStatus',`JORNADA ${this.roman(Math.min(30,s.rebirths+1))}`);
      text('currentZoneShort',ZONES[s.zone].rune);
      const phase=progressAt(s),bossKind=s.mob.kind;
      text('mobName',s.mob.name);
      prop('mobName','title',s.mob.name);
      // A save cannot inject an arbitrary src: choose only from our bundled roster.
      const visualIndex = bossKind === 'boss' ? 6 : bossKind === 'miniboss' ? 5
        : Math.max(0, ZONES[s.zone].names.indexOf(s.mob.name));
      const sprite = monsterSrc(s.zone,visualIndex);
      const proportions=ART.monsters[s.zone][visualIndex];
      const arenaNode=$('battlefield');
      if(arenaNode.dataset.monsterSize!==proportions.size)arenaNode.dataset.monsterSize=proportions.size;
      if(arenaNode.dataset.stature!==String(proportions.height)){
        arenaNode.dataset.stature=String(proportions.height);
        arenaNode.style.setProperty('--monster-stature',proportions.height+'%');
      }
      const artNode = $('monsterArt');
      if(artNode.dataset.family!==MONSTER_FAMILIES[s.zone][visualIndex])artNode.dataset.family=MONSTER_FAMILIES[s.zone][visualIndex];
      if (artNode.dataset.sprite !== sprite) {
        this.combatVisuals.get('enemy')?.cancel();
        this.combatVisuals.delete('enemy');
        artNode.dataset.sprite = sprite;
        const portrait = document.createElement('img');
        portrait.src = sprite;
        portrait.width = 300;
        portrait.height = 315;
        portrait.alt = '';
        portrait.draggable = false;
        portrait.decoding = 'async';
        const idle=document.createElement('span');
        idle.className='actor-idle enemy-idle';
        idle.style.setProperty('--idle-delay',(-((visualIndex*.43+s.zone*.71)%4)).toFixed(2)+'s');
        idle.append(portrait);
        artNode.replaceChildren(idle);
      }
      text('mobLevel',bossKind==='boss'?'☠ CHEFÃO':bossKind==='miniboss'?'✦ MINIBOSS':`Nv. ${fmt(s.mob.level)}`);
      const arena = $('battlefield');
      arena.classList.toggle('boss-fight',bossKind==='boss');
      arena.classList.toggle('miniboss-fight',bossKind==='miniboss');
      arena.classList.toggle('final-boss-fight',bossKind==='boss' && s.zone===ZONES.length-1);
      const frame = $('cameraState');
      frame.textContent = bossKind === 'boss' ? (s.zone===ZONES.length-1 ? 'CONFRONTO FINAL' : 'ARENA DE CHEFÃO') :
        bossKind === 'miniboss' ? 'ARENA DE MINIBOSS' : 'COMBATE • 2D';
      const hunting=s.farmStage!=null,stage=combatStage(s),kills=hunting?s.farmKills:phase.kills;
      text('stageNumber',`FASE ${stage} / 10${hunting?' · CAÇA':''}`);
      text('stageKills',hunting?`${kills} / 10 · REPETINDO`:phase.cleared?'REGIÃO CONQUISTADA':bossKind==='boss'?'CHEFÃO FINAL':bossKind==='miniboss'?'MINIBOSS':`${kills} / 10 INIMIGOS`);
      fill('stageProgressFill',!hunting&&phase.cleared?100:kills*10);
      attr('stageProgressTrack','aria-valuenow',String(!hunting&&phase.cleared?100:kills*10));
      for(const bar of $('stagePips').children){
        const n=Number(bar.dataset.stage);
        bar.classList.toggle('completed',!hunting&&(phase.cleared||n<phase.stage));
        bar.classList.toggle('active',(hunting||!phase.cleared)&&n===stage);
      }
      text('intelMob',s.mob.name);
      text('mobHPText',`${fmt(Math.ceil(s.mob.hp))} / ${fmt(s.mob.maxHp)}`);
      this.renderEnemyHealth();
      text('zoneKillsLabel',`${fmt(s.zoneKills[s.zone])} ABATES · FASE ${phase.stage}/10`);
      const rewardScale=bossKind==='boss'?18:bossKind==='miniboss'?7:1;
      text('intelReward',`+${fmt(Math.floor(multiply(rewardGold(s),rewardScale)*b.gold))} ouro · +${fmt(Math.floor(rewardXp(s)*(bossKind==='boss'?14:bossKind==='miniboss'?6:1)))} XP`);
      text('dropChance',fmtPercent(b.drop));
      text('goldBonus',`+${fmtPercent(b.gold-1)}`);
      text('prestigePreview',fmt(this.previewPrestige()));
      text('inventoryCount',s.inventory.length);
      this.renderMilestone();
      this.renderEvent();
    }
```

### index.html — elementos completos modificados

```html
<script src="game.js?v=25" defer></script>
<link rel="stylesheet" href="combat-events.css?v=7">
<div class="hero-health-track" id="heroHealthProgress" role="progressbar" aria-label="Vida do personagem" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><div class="hp-damage-trail" id="heroHPDamageTrail" aria-hidden="true"></div><span id="heroHPFill" style="width:100%"></span></div>
```

### combat-events.css — bloco completo das faixas

```css
/* Two bounded damage echoes, behind the immediate enemy/hero HP fills. */
.battlefield .hp-track,.hud-dock .hero-health-track{position:relative;isolation:isolate}
.battlefield .hp-damage-trail,.hud-dock .hero-health-track>.hp-damage-trail{
  position:absolute;inset:0;z-index:0;pointer-events:none;
  display:block;width:100%;height:100%;transition:none;
  transform-origin:left center;background:linear-gradient(#c39a63,#765132);
}
.battlefield .hp-track .hp-fill{position:relative;z-index:1;transition:none}
.hud-dock .hero-health-track>#heroHPFill{position:relative;z-index:1;transition:none!important}
.battlefield .hp-track .hp-numbers{z-index:2;text-shadow:0 1px 2px #000}
.hw-lite .hp-damage-trail{visibility:hidden}
@media(prefers-reduced-motion:reduce){.hp-damage-trail{visibility:hidden}}
```

## Validação e FPS

Passaram o teste específico de HP em três resoluções e três tipos de inimigo, as regressões de combate/eventos, HUD/legibilidade, inventário/caça, números, impacto, idle, orbe, escala dos seis chefes e balanceamento. Auditoria: 95 assets, 89 imagens raster e 42 monstros únicos, sem duplicatas.

A comparação isolada passou nas 16 cenas: **60→60 FPS**, incluindo golpes isolados e rajadas simultâneas no HP do Imperador e do herói. São amostras headless; não representam garantia para todo computador nem teste de horas. Dados completos em [performance-health-trail-v2.json](performance-health-trail-v2.json).
