# HELLWARD — itens 4 a 6: código completo dos trechos alterados

## O que mudou

- **Item 4:** idle CSS de 1 px para herói/miniboss/chefe e 2 px para inimigo comum, com ciclos de 2,4–2,9 s e fases diferentes. Sem escala, rotação ou skew no idle. Usa o mesmo asset em duas regiões recortadas: parte superior móvel e faixa inferior fixa; os pés e a sombra de contato não se deslocam. `image-rendering: pixelated` preservado. O sprite original continua disponível para as reações e ataques existentes. Não há frames novos de imagem nem arquivos duplicados.
- **Item 5:** utilitários solicitados com mínimo de `.8125rem` (13 px com a raiz padrão), cor clara e sombra leve. Contadores, abates/fase, Vitalidade, Regeneração, XP e atalhos revisados. Ajustes de espaço no HUD para desktop curto/foco de combate. Nenhuma alteração em `font-size` de `html`.
- **Item 6:** brilho normal fixo discreto; âmbar em vida baixa e vermelho em estado crítico. Histerese: entra em baixo aos 30%, sai aos 33%; entra em crítico aos 15%, sai aos 18% para baixo (ou normal a partir de 33%). Pulso de 1,8 s/1,2 s, com opacidade em 12 etapas por meia-volta para reduzir atualizações visuais. O frasco acompanha o alerta somente quando utilizável. A saída do alerta remove a animação imediatamente, sem transição residual. Movimento reduzido e modo leve mantêm brilho fixo; aba oculta pausa as animações.
- Limites e intensidades adicionados a `FX_CONFIG.idle` e `FX_CONFIG.orb`; nenhum cálculo JS por frame. Histerese transitória pertence à instância do jogo e não altera o formato do save.
- **Itens 1 a 3 preservados:** todas as 96 funções preexistentes fora de `constructor`/`renderCore` estão byte a byte iguais à base; configurações de números/impacto/faixa de HP e CSS fora dos blocos de idle/orbe também estão iguais. As alterações no construtor e em `renderCore` integram somente os itens 4–6.

## Arquivos alterados

Produção: `game.js`, `combat-events.css`, `game-hud.css`, `hud-legibility.css`, `index.html`.
Testes: `tests/combat-idle.cjs`, `tests/hud-readable.cjs`, `tests/life-orb.cjs`, `tests/orb-cpu.cjs`.
Documentação: este documento e `docs/performance-items-4-6.json`.

## Como testar no computador

1. Abra o combate em 1366×768 e 1024×600, sem zoom. Observe o herói e um monstro por cerca de 5 s: movimento discreto de 1–2 px, pés/sombra fixos e ritmos diferentes. Ataque repetidamente e volte à outra aba: ataques devem continuar iguais e idle deve pausar em segundo plano.
2. Confira Ouro/Almas/Fragmentos, abates/fase, Vitalidade/Regeneração, XP e M/J/C/A/I/Q. Abra o modo de foco e use valores altos: textos devem continuar dentro de seus espaços. O teste de 380 px continua adiado.
3. Com poções disponíveis, deixe a vida cair a 25%: orbe e frasco pulsam lentamente sem afetar a leitura do HP. Abaixo de 15%, o pulso acelera. Ao regenerar 30→32%, continua baixo; em 33%, encerra. No crítico, 15→17% continua crítico, em 18% volta a baixo; cura acima de 33% interrompe os dois alertas na renderização da cura.
4. Esgote as poções: o frasco deixa de sinalizar. Ative movimento reduzido no sistema/navegador ou modo leve: os alertas ficam estáticos e o idle some. Alterne de aba e de perfil; nenhum alerta deve vazar entre perfis.
5. Para repetir o teste longo, execute `node tests/orb-cpu.cjs resultado.json`: são 10 min de brilho fixo e 10 min de pulso a 25% HP, sem combate/regen e com o mesmo idle em ambos. O teste mede processos do Chromium, estabilidade do DOM e deriva temporal, não apenas tarefas JS.

A percepção de sutileza/contraste ainda deve ser validada por você no monitor usado para jogar. As medições headless e a revisão de capturas não garantem o mesmo FPS/CPU em todo hardware.

Dentro da classe `Game`, substitua `constructor` e `renderCore` pelas versões completas abaixo e adicione os três métodos novos logo após o construtor. Os blocos CSS substituem somente as regiões de idle/orbe indicadas; o bloco de legibilidade é acrescentado ao final do arquivo.

## game.js — FX_CONFIG completo

Os grupos dos itens 1–3 abaixo são reproduzidos para fornecer o objeto completo e continuam inalterados.

```js
  const FX_CONFIG = {
    idle: {heroMs:2400,enemyMs:2600,minibossMs:2800,bossMs:2900,heroPx:1,enemyPx:2,minibossPx:1,bossPx:1,heroPhaseMs:700,phaseSpreadMs:1200},
    orb: {lowEnter:.30,lowExit:.33,criticalEnter:.15,criticalExit:.18,lowMs:1800,criticalMs:1200,pulseSteps:12,normalOpacity:.14,lowMin:.2,lowMax:.55,criticalMin:.3,criticalMax:.8,normalColor:'196 107 114',lowColor:'219 161 90',criticalColor:'250 92 88'},
    numbers: {durationMs:760, enemyLimit:8, heroLimit:5, normalRem:1.44, criticalRem:1.88, heroRem:1.38, jitterRem:.75, riseRem:2, pop:1.18},
    impact: {heroBackPx:3,heroForwardPx:10,heroMs:220,criticalHeroMs:250,enemyPx:3,criticalEnemyPx:5,enemyMs:180,criticalEnemyMs:240,contactMs:66,criticalContactMs:75,slashRem:4.5,criticalSlashRem:6,enemyAttackPx:8,heroHurtPx:5,enemyAttackMs:220,heroHurtMs:260,gapMs:110, criticalGapMs:700, holdMs:50, flashMs:80, finalFlashMs:160, finalMs:300, shakePx:3, shakeMs:140, sparkLimit:12, sparks:4, criticalSparks:7, finalSparks:12, sparkMs:300, sparkTravelRem:2.5},
    healthTrail: {
      enabled: true,
      delayMs: 500,
      durationMs: 420,
      easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)'
    }
  };
```

## game.js — constructor completo

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
      this.numberPool={enemy:[],hero:[]};
      this.combatNumberAnchors = {};
      this.combatVisuals = new Map();
      this.configureAtmosphereFX();
      this.prepareIdle($('combatHero').querySelector('.actor-idle'),$('combatHero').querySelector('img'));
      this.vitalityState='normal';this.vitalityOwner=null;
      this.sparkCursor=0;
      this.sparkNodes=Array.from({length:FX_CONFIG.impact.sparkLimit},()=>{const n=document.createElement('i');n.className='combat-spark';n.setAttribute('aria-hidden','true');$('battlefield').append(n);return n;});
      document.addEventListener('hellward:screen-effects',()=>this.clearCombatVisuals());
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

## game.js — configureAtmosphereFX completo

```js
    configureAtmosphereFX() {
      const root=document.documentElement,i=FX_CONFIG.idle,o=FX_CONFIG.orb;
      const values={'hero-idle-ms':i.heroMs+'ms','enemy-idle-ms':i.enemyMs+'ms','miniboss-idle-ms':i.minibossMs+'ms','boss-idle-ms':i.bossMs+'ms','hero-idle-px':-i.heroPx+'px','enemy-idle-px':-i.enemyPx+'px','miniboss-idle-px':-i.minibossPx+'px','boss-idle-px':-i.bossPx+'px','hero-idle-steps':i.heroPx,'enemy-idle-steps':i.enemyPx,'miniboss-idle-steps':i.minibossPx,'boss-idle-steps':i.bossPx,'hero-idle-phase':-i.heroPhaseMs+'ms','orb-pulse-steps':o.pulseSteps,'orb-low-ms':o.lowMs+'ms','orb-critical-ms':o.criticalMs+'ms','orb-normal-opacity':o.normalOpacity,'orb-low-min':o.lowMin,'orb-low-max':o.lowMax,'orb-critical-min':o.criticalMin,'orb-critical-max':o.criticalMax,'orb-normal-color':o.normalColor,'orb-low-color':o.lowColor,'orb-critical-color':o.criticalColor};
      for(const [name,value]of Object.entries(values))root.style.setProperty('--'+name,String(value));
    }
```

## game.js — prepareIdle completo

```js
    prepareIdle(idle,image) {
      if(idle.querySelector('.idle-top'))return;
      idle.style.setProperty('--idle-sprite',`url(${JSON.stringify(image.getAttribute('src'))})`);
      const top=document.createElement('span'),motion=document.createElement('span'),feet=document.createElement('span');
      top.className='idle-top';motion.className='idle-motion';feet.className='idle-feet';
      top.append(motion);idle.append(top,feet);
      const ready=()=>image.decode().then(()=>idle.classList.add('idle-ready')).catch(()=>{});
      if(image.complete&&image.naturalWidth)ready();else image.addEventListener('load',ready,{once:true});
    }
```

## game.js — renderVitalityMood completo

```js
    renderVitalityMood(hp,maxHp) {
      const o=FX_CONFIG.orb,ratio=Math.max(0,Math.min(1,hp/Math.max(1,maxHp)));
      let mood=this.vitalityOwner===this.state?this.vitalityState:'normal';
      if(this.state.deadUntil)mood='dead';
      else if(mood==='critical'){
        if(ratio>=o.criticalExit)mood=ratio>=o.lowExit?'normal':'low';
      }else if(mood==='low'){
        if(ratio<=o.criticalEnter)mood='critical';else if(ratio>=o.lowExit)mood='normal';
      }else mood=ratio<=o.criticalEnter?'critical':ratio<=o.lowEnter?'low':'normal';
      this.vitalityOwner=this.state;this.vitalityState=mood;
      attr('errantVitals','data-vitality',mood);
      const warning=mood==='low'||mood==='critical';
      $('errantVitals').classList.toggle('low-health',warning);
      attr('quickPotion','data-life-cue',warning&&!$('quickPotion').disabled?mood:'none');
    }
```

## game.js — renderCore completo

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
      attr('heroHealthProgress','aria-valuenow',String(Math.round(100*hp/b.maxHp)));
      attr('heroHealthProgress','aria-valuetext',`${fmt(Math.ceil(hp))} de ${fmt(b.maxHp)} pontos de vida`);
      const potionKey=`${s.inventory.length}|${s.inventory.filter(x=>x.kind==='potion').map(x=>x.id+':'+x.qty).join(',')}|${deadForPotion(s,b)}`;
      if(this.potionRenderKey!==potionKey){this.potionRenderKey=potionKey;this.renderQuickPotion();}
      this.renderVitalityMood(hp,b.maxHp);
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
        idle.style.setProperty('--idle-delay',(-((visualIndex*.43+s.zone*.71)%(FX_CONFIG.idle.phaseSpreadMs/1000))).toFixed(2)+'s');
        portrait.addEventListener('load',()=>this.cacheCombatNumberAnchors(),{once:true});
        idle.append(portrait);
        this.prepareIdle(idle,portrait);
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

## combat-events.css — bloco completo alterado

```css
/* Fixed feet and contact shadows; only the clipped upper sprite moves. */
.battlefield .actor-idle{--idle-cycle:var(--enemy-idle-ms);--idle-lift:var(--enemy-idle-px);--idle-steps:var(--enemy-idle-steps);display:block;position:relative;z-index:1;width:100%;height:100%;pointer-events:none}
.battlefield .hero-idle{--idle-cycle:var(--hero-idle-ms);--idle-lift:var(--hero-idle-px);--idle-steps:var(--hero-idle-steps);--idle-delay:var(--hero-idle-phase)}
.battlefield.miniboss-fight .enemy-idle{--idle-cycle:var(--miniboss-idle-ms);--idle-lift:var(--miniboss-idle-px);--idle-steps:var(--miniboss-idle-steps)}
.battlefield.boss-fight .enemy-idle{--idle-cycle:var(--boss-idle-ms);--idle-lift:var(--boss-idle-px);--idle-steps:var(--boss-idle-steps)}
.battlefield .actor-idle>img,.battlefield .idle-motion,.battlefield .idle-feet{image-rendering:pixelated!important}
.battlefield .idle-top,.battlefield .idle-motion,.battlefield .idle-feet{position:absolute;inset:0;pointer-events:none}
.battlefield .idle-top{clip-path:inset(0 0 12% 0);visibility:hidden}
.battlefield .idle-feet{clip-path:inset(87% 0 0 0);visibility:hidden}
.battlefield .idle-motion,.battlefield .idle-feet{background:var(--idle-sprite) center bottom/contain no-repeat}
html.hw-game-active .idle-ready:not(.actor-active)>img{opacity:0}
html.hw-game-active .idle-ready:not(.actor-active)>.idle-top,html.hw-game-active .idle-ready:not(.actor-active)>.idle-feet{visibility:visible}
html.hw-game-active .idle-ready .idle-motion{animation:hw-idle-breathe var(--idle-cycle) steps(var(--idle-steps),end) var(--idle-delay,0s) infinite!important}
@keyframes hw-idle-breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(var(--idle-lift))}}
html.hw-game-active .actor-active .idle-motion,html.hw-game-active[data-combat-idle-paused] .idle-ready .idle-motion{animation-play-state:paused!important}
html.hw-lite .idle-top,html.hw-lite .idle-feet,html:not(.hw-game-active) .idle-top,html:not(.hw-game-active) .idle-feet,.combat-hero.defeated .idle-top,.combat-hero.defeated .idle-feet{display:none!important}
html.hw-lite .actor-idle>img,.combat-hero.defeated .actor-idle>img{opacity:1!important}
@media(prefers-reduced-motion:reduce){.battlefield .idle-top,.battlefield .idle-feet{display:none!important}.battlefield .actor-idle>img{opacity:1!important}}
```

## game-hud.css — bloco completo alterado

```css
/* Constant normal rim plus hysteretic warning states, independent of HP text. */
@media(min-width:1000px) and (min-height:600px){
  #errantVitals{--orb-color:var(--orb-normal-color);--orb-min:var(--orb-normal-opacity);--orb-max:var(--orb-normal-opacity);--orb-cycle:var(--orb-low-ms)}
  #errantVitals[data-vitality=low]{--orb-color:var(--orb-low-color);--orb-min:var(--orb-low-min);--orb-max:var(--orb-low-max)}
  #errantVitals[data-vitality=critical]{--orb-color:var(--orb-critical-color);--orb-min:var(--orb-critical-min);--orb-max:var(--orb-critical-max);--orb-cycle:var(--orb-critical-ms)}
  .hud-dock .life-orb-liquid::before,.hud-dock #quickPotion::before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:2;opacity:var(--orb-normal-opacity);background:radial-gradient(ellipse at center,transparent 55%,rgb(var(--orb-color)/.55) 85%,rgb(var(--orb-color)/.8));box-shadow:inset 0 0 .65rem rgb(var(--orb-color)/.6)}
  .hud-dock #quickPotion::before{opacity:0;z-index:0;background:transparent;box-shadow:inset 0 0 .65rem rgb(var(--orb-color)/.6),0 0 .3rem rgb(var(--orb-color)/.3)}
  html.hw-game-active #errantVitals:is([data-vitality=low],[data-vitality=critical]) .life-orb-liquid::before,html.hw-game-active #quickPotion:is([data-life-cue=low],[data-life-cue=critical])::before{animation:hw-orb-warning var(--orb-cycle) steps(var(--orb-pulse-steps),end) infinite;will-change:opacity}
  #errantVitals[data-vitality=dead] .life-orb-liquid::before{opacity:0}
  html .hud-dock .hero-health-track span.critical{animation:none;filter:none}
  html.hw-game-active[data-combat-idle-paused] #errantVitals .life-orb-liquid::before,html.hw-game-active[data-combat-idle-paused] #quickPotion::before,html.hw-game-active .app-frame[inert] #errantVitals .life-orb-liquid::before,html.hw-game-active .app-frame[inert] #quickPotion::before{animation-play-state:paused!important}
  html.hw-lite #errantVitals .life-orb-liquid::before,html.hw-lite #quickPotion::before{animation:none!important;will-change:auto}
  html.hw-lite #errantVitals:is([data-vitality=low],[data-vitality=critical]) .life-orb-liquid::before,html.hw-lite #quickPotion:is([data-life-cue=low],[data-life-cue=critical])::before{opacity:var(--orb-max)}
  html.hw-lite .hud-dock .life-orb-liquid>span{transition:none}
}
@keyframes hw-orb-warning{0%,100%{opacity:var(--orb-min)}50%{opacity:var(--orb-max)}}
@media(min-width:1000px) and (min-height:600px) and (prefers-reduced-motion:reduce){
  #errantVitals .life-orb-liquid::before,#quickPotion::before{animation:none!important;will-change:auto}
  #errantVitals:is([data-vitality=low],[data-vitality=critical]) .life-orb-liquid::before,#quickPotion:is([data-life-cue=low],[data-life-cue=critical])::before{opacity:var(--orb-max)}
}
```

## hud-legibility.css — bloco completo alterado

```css
/* Desktop utilities: rem-based type; never change html font-size. */
@media(min-width:1000px) and (min-height:600px){
  html.hw-game-active .topbar .resource-pill small,html.hw-game-active .topbar .profile-copy small,html.hw-game-active .stage-caption strong,html.hw-game-active .stage-caption>span,html.hw-game-active .stage-pips span,html.hw-game-active .battle-bottom,html.hw-game-active .hud-dock .hero-level-line>span:last-child,html.hw-game-active .hud-dock .hero-health-line>span,html.hw-game-active .hud-dock .hero-health-footer>span,html.hw-game-active .hud-dock #heroRegeneration,html.hw-game-active .hud-dock #xpLabel,html.hw-game-active .hud-dock .relic-caption>small,html.hw-game-active .hud-dock .relic-caption kbd,html.hw-game-active .hud-dock .hud-secondary kbd,html.hw-game-active .hud-dock .quick-potion>span:last-child,html.hw-game-active .hud-dock .quick-potion kbd{
    font-size:.8125rem;line-height:1.3;letter-spacing:.01em;color:#f3dfbf;text-shadow:0 .0625rem .125rem #000,0 -.0625rem .0625rem #0009;
  }
  html.hw-game-active .topbar .resource-pill strong{font-size:1.125rem;line-height:1.4;color:#fff0d3;text-shadow:0 .0625rem .125rem #000}
  html.hw-game-active .resource-pill>div:last-child{grid-template-rows:1.1rem 1.575rem}
  html.hw-game-active .hud-dock .hero-health-footer>span:first-child{display:flex;flex-wrap:wrap;gap:0 .3rem;white-space:normal}
  html.hw-game-active .hud-dock .hero-health-line{row-gap:0}
  html.hw-game-active .hud-dock .relic-caption{min-height:4.2rem}
  html.hw-game-active .hud-dock .relic-button img{width:3rem;height:3rem}
  html.hw-game-active .hud-dock .hud-secondary button{height:2.65rem}
  html.hw-game-active[data-focus=battle] .app-frame{grid-template-rows:3.125rem 0 minmax(0,1fr) 9rem}
  html.hw-game-active[data-focus=battle] .topbar{height:3.125rem}
}
@media(min-width:1000px) and (min-height:600px) and (max-height:680px){
  html.hw-game-active .app-frame,html.hw-game-active[data-focus=battle] .app-frame{grid-template-rows:3.125rem 0 minmax(0,1fr) 9rem}
  html.hw-game-active .topbar{height:3.125rem}
  html.hw-game-active .hud-dock .relic-button img{width:2.5rem;height:2.5rem}
  html.hw-game-active .hud-dock .hero-level-line{margin-bottom:.125rem}
}
```

## index.html — linhas completas de cache

```html
  <script src="game.js?v=27" defer></script>
  <link rel="stylesheet" href="game-hud.css?v=7">
  <link rel="stylesheet" href="hud-legibility.css?v=3">
  <link rel="stylesheet" href="combat-events.css?v=9">
```

## Validação

Resultados brutos e limites da comparação constam em `docs/performance-items-4-6.json`. Suítes desktop: combat-idle, life-orb, hud-readable, hud-browser, combat-numbers, combat-impact, enemy-health-trail, combat-events, gameplay-inventory e boss-scale. Verificações determinísticas de balanceamento e auditorias de assets/sprites também passaram. Os testes dos itens 1–3 foram executados sem editar suas implementações.

## Resultados medidos

- Comparação final isolada, 16 cenas desktop: **60 FPS antes e depois**, p95 máximo **16,8 ms** em ambos. Passou nos limites de 3 FPS/5 ms do projeto.
- Controle com brilho fixo: **600 s**, média **5.52% de um núcleo**. Pulso final em produção: **600 s**, média **8.00% de um núcleo**; custo adicional de **2.49 pontos percentuais de um núcleo** neste ambiente.
- A primeira versão contínua do pulso consumiu 13.47% em média e mostrou deriva temporal; a versão em 12 etapas reduziu a média em **40.6%**. Essa primeira medição também foi preservada no JSON, para não ocultar o resultado que motivou a otimização.
- Pulso final: primeiros 120 s **7.83%**, últimos 120 s **7.88%**, diferença **0.05 ponto percentual**. DOM conectado: **605 → 605 elementos**. A contagem CDP (que inclui nós destacados aguardando coleta) caiu de 1235 para 1138; não representa crescimento de elementos na tela.
- O controle fixo de 10 min foi reutilizado: o único ajuste posterior foi a curva de opacidade do pulso e seu valor em `FX_CONFIG`; no controle as duas animações são desligadas pelo próprio teste, portanto esse ajuste não afeta o controle. O pulso final foi medido sem override de CSS de teste.
- CPU medida inclui os processos de navegador, renderer e GPU com ANGLE SwiftShader por software; **não é a porcentagem da máquina inteira nem uma garantia de consumo imperceptível no seu PC**. A percepção de custo em hardware real e a sutileza visual ainda precisam da validação manual descrita acima. Celular segue adiado.
