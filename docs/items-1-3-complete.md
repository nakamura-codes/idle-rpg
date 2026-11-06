# HELLWARD — código completo e mudanças dos itens 1 a 3

## Lista acumulada

1. **HP atrasado (preservado):** eco âmbar no inimigo/herói, HP principal imediato, espera de 500 ms reiniciável e descida de 420 ms. Novo alvo/fase reinicia a faixa do inimigo cheia, sem descida. Cura e regeneração sincronizam imediatamente. [Trechos completos do item 1](item-1-health-trail.md).
2. **Números:** pool de reutilização, limites configuráveis de 8 no inimigo e 5 no herói, duração de 760 ms (limitada a 600–900 em todos os modos), variação horizontal aleatória, crítico maior/laranja com pop e etiqueta; cura verde subindo do herói. O pop e a subida são removidos em movimento reduzido/modo leve. Valores continuam usando `fmt()`.
3. **Reação ao golpe:** flash de silhueta de 80 ms; recuo pequeno; faíscas reutilizadas com teto de 12; shake proporcional ao dano e limitado a 3 px; retenção visual crítica de 50 ms com intervalo mínimo de 700 ms. Na finalização de chefe, a imagem derrotada fica em uma camada temporária reutilizável, com retenção de 50 ms, flash de 160 ms e 12 faíscas; a lógica avança imediatamente.
4. **Configurações:** interruptor persistente “Efeitos de tela” desliga as reações decorativas, inclusive shake/hit-stop; preferência armazenada fora do save do personagem. `prefers-reduced-motion`, modo leve, aba oculta e menu também cancelam os efeitos correspondentes.
5. **Proteção da leitura:** flash/faíscas em z-index 12, imagem de finalização em 10, HP em 17 e números em 20/24. Somente o cenário treme. Os números usam limites visíveis dos 42 sprites, medidos offline, para ficar à esquerda da silhueta sem diminuir o inimigo. A cura mantém sua ancoragem no herói.

## Arquivos desta correção

Produção: `game.js`, `game-hud.js`, `index.html`, `combat-events.css`.
Testes: `tests/combat-numbers.cjs`, `tests/combat-impact.cjs`.
Documentação: este arquivo e `docs/performance-items-2-3.json`.

Nenhuma imagem ou dependência foi adicionada. O formato do save, regras de dano, recompensa e dimensões dos chefes são preservados. A transição completa do item 8 não foi implementada nesta rodada. Otimização e QA de telefone seguem adiados.

## Como testar

1. Cause dano normal/crítico e use uma poção: distinguir branco, laranja maior com pop e verde saindo do herói; números devem sumir em menos de um segundo.
2. Clique rapidamente por 20–30 s e pare: no máximo 13 números simultâneos e 12 faíscas, sem acúmulo no DOM.
3. Finalize um chefe: flash mais longo e faíscas extras na imagem derrotada, sem bloquear cliques, recompensas ou progresso; HP e números devem permanecer por cima.
4. Desmarque “Efeitos de tela” nas configurações, feche e ataque: dano/itens/HP continuam, sem reação decorativa; recarregue para conferir persistência.
5. Ative movimento reduzido do sistema: sem flash, shake, retenção ou pop; números continuam legíveis com fade de 760 ms. O item 1 continua respeitando essa preferência.

## Trechos completos alterados

Os métodos abaixo pertencem à classe `Game`. São apresentados integralmente, sem reticências, inclusive os pontos de integração que preservam trechos já existentes.

### game.js — configuração e limites de silhueta

```js
  const FX_CONFIG = {
    numbers: {durationMs:760, enemyLimit:8, heroLimit:5, normalRem:1.44, criticalRem:1.88, heroRem:1.38, jitterRem:.75, riseRem:2, pop:1.18},
    impact: {heroBackPx:3,heroForwardPx:10,heroMs:220,criticalHeroMs:250,enemyPx:3,criticalEnemyPx:5,enemyMs:180,criticalEnemyMs:240,contactMs:66,criticalContactMs:75,slashRem:4.5,criticalSlashRem:6,enemyAttackPx:8,heroHurtPx:5,enemyAttackMs:220,heroHurtMs:260,gapMs:110, criticalGapMs:700, holdMs:50, flashMs:80, finalFlashMs:160, finalMs:300, shakePx:3, shakeMs:140, sparkLimit:12, sparks:4, criticalSparks:7, finalSparks:12, sparkMs:300, sparkTravelRem:2.5},
    healthTrail: {
      enabled: true,
      delayMs: 500,
      durationMs: 420,
      easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)'
    }
  };

  const MONSTER_INK_BOUNDS = {"assets/monsters/condenado-errante.webp":[0.0599,0.02083,0.9401,0.97917],"assets/monsters/guerreiro-esqueletico.webp":[0.04297,0.02083,0.95573,0.97917],"assets/monsters/sentinela-caida.webp":[0.04688,0.02083,0.95182,0.97917],"assets/monsters/arqueiro-macabro.webp":[0.08203,0.02083,0.91536,0.97917],"assets/monsters/zumbi-errante.webp":[0.03776,0.02083,0.96094,0.97917],"assets/monsters/espadachim-corrompido.webp":[0.02051,0.04688,0.97852,0.97949],"assets/monsters/cavaleiro-decapitado.webp":[0.01097,0.01729,0.98903,0.98936],"assets/monsters/lobo-sombrio.webp":[0.0332,0.33008,0.96875,0.96875],"assets/monsters/ratazana-pestilenta.webp":[0.03516,0.49414,0.96875,0.96875],"assets/monsters/lobo-da-praga.webp":[0.02148,0.12109,0.97852,0.97852],"assets/monsters/entorpecido-de-musgo.webp":[0.02539,0.02051,0.97461,0.97852],"assets/monsters/goblin-selvagem.webp":[0.02148,0.02148,0.97656,0.97852],"assets/monsters/rei-das-ratazanas.webp":[0.02474,0.34245,0.97917,0.97917],"assets/monsters/hidra-profanada.webp":[0.01064,0.01822,0.98936,0.98178],"assets/monsters/espectro-da-cripta.webp":[0.02344,0.02083,0.97656,0.97917],"assets/monsters/alma-enregelada.webp":[0.02539,0.02148,0.97461,0.97852],"assets/monsters/lamento-submerso.webp":[0.02344,0.02083,0.97526,0.97917],"assets/monsters/afogado-sem-rosto.webp":[0.04297,0.02083,0.95573,0.97917],"assets/monsters/sacerdote-esquecido.webp":[0.07552,0.02083,0.92448,0.97917],"assets/monsters/bruxa-das-criptas.webp":[0.03809,0.02051,0.96191,0.97949],"assets/monsters/rei-lich.webp":[0.01122,0.01064,0.98878,0.98936],"assets/monsters/golem-ferrugem.webp":[0.02051,0.05273,0.97852,0.97949],"assets/monsters/carcereiro-runico.webp":[0.02441,0.02051,0.97559,0.97949],"assets/monsters/guardiao-de-basalto.webp":[0.03418,0.02051,0.96484,0.97949],"assets/monsters/orc-carniceiro.webp":[0.02539,0.02051,0.97461,0.97949],"assets/monsters/construto-enferrujado.webp":[0.02246,0.02051,0.97656,0.97949],"assets/monsters/ogro-do-ferro.webp":[0.02051,0.10742,0.97949,0.97949],"assets/monsters/cavaleiro-do-abismo.webp":[0.01064,0.0128,0.98936,0.9872],"assets/monsters/arauto-das-chamas.webp":[0.09375,0.02051,0.90527,0.97949],"assets/monsters/demonio-carmesim.webp":[0.02637,0.02051,0.97266,0.97949],"assets/monsters/flagelo-abissal.webp":[0.02148,0.02051,0.97852,0.97949],"assets/monsters/sucubo-das-cinzas.webp":[0.02344,0.02474,0.97526,0.97917],"assets/monsters/sombra-incandescente.webp":[0.02734,0.02051,0.97266,0.97949],"assets/monsters/devorador-morbido.webp":[0.02148,0.0791,0.97949,0.97949],"assets/monsters/dragao-das-fendas.webp":[0.01064,0.01584,0.98936,0.98416],"assets/monsters/lich-imortal.webp":[0.02441,0.02051,0.97461,0.97949],"assets/monsters/rei-das-sombras.webp":[0.02051,0.02637,0.97949,0.97949],"assets/monsters/devorador-de-estrelas.webp":[0.02344,0.02051,0.97656,0.97949],"assets/monsters/sacerdote-do-vazio.webp":[0.06445,0.02148,0.93457,0.97949],"assets/monsters/arauto-do-eclipse.webp":[0.03516,0.02148,0.96387,0.97949],"assets/monsters/medusa-do-eclipse.webp":[0.03223,0.02051,0.9668,0.97949],"assets/monsters/imperador-do-crepusculo.webp":[0.01065,0.00821,0.98935,0.99179]};

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
      this.numberPool={enemy:[],hero:[]};
      this.combatNumberAnchors = {};
      this.combatVisuals = new Map();
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

### game.js — combatMotionEnabled()

```js
    combatMotionEnabled() {
      return this.state && !document.hidden && $('authScreen').hidden && !this.reducedCombatMotion.matches && !document.documentElement.classList.contains('hw-lite') && document.documentElement.dataset.screenEffects!=='off';
    }
```

### game.js — animateCombat()

```js
    animateCombat(channel,node,frames,options) {
      if(!node)return;
      this.combatVisuals.get(channel)?.cancel();
      const idle=node.closest('.actor-idle');
      idle?.classList.add('actor-active');
      const animation=node.animate(frames,{easing:'linear',...options});
      this.combatVisuals.set(channel,animation);
      const done=()=>{if(this.combatVisuals.get(channel)===animation){this.combatVisuals.delete(channel);idle?.classList.remove('actor-active');if(channel==='finisher')node.hidden=true;animation.cancel();}};
      animation.finished.then(done,done);
      return animation;
    }
```

### game.js — clearCombatVisuals()

```js
    clearCombatVisuals() {
      for(const animation of this.combatVisuals.values()){
        animation.effect?.target?.closest('.actor-idle')?.classList.remove('actor-active');
        animation.cancel();
      }
      this.combatVisuals.clear();
      $('finisherArt').hidden=true;
      this.lastCombatImpactAt=this.lastCriticalImpactAt=-Infinity;
    }
```

### game.js — playCombatImpact()

```js
    playCombatImpact(critical=false,amount=0,maxHp=1) {
      if(!this.combatMotionEnabled()){this.clearCombatVisuals();return;}
      const c=FX_CONFIG.impact,t=performance.now();
      if(t-this.lastCombatImpactAt<FX_CONFIG.impact.gapMs)return;
      this.lastCombatImpactAt=t;
      const strong=critical && t-this.lastCriticalImpactAt>=FX_CONFIG.impact.criticalGapMs;
      if(strong)this.lastCriticalImpactAt=t;
      const heroFrames=[{transform:'translateX(0)'},{transform:`translateX(${-c.heroBackPx}px)`,offset:.12},{transform:`translateX(${c.heroForwardPx}px)`,offset:.3}];
      if(strong)heroFrames.push({transform:`translateX(${c.heroForwardPx}px)`,offset:.3+c.holdMs/c.criticalHeroMs,easing:'ease-out'});
      heroFrames.push({transform:'translateX(0)'});
      this.animateCombat('hero',$('combatHero').querySelector('img'),heroFrames,{duration:strong?c.criticalHeroMs:c.heroMs});
      const delay=strong?c.criticalContactMs:c.contactMs;
      const enemyFrames=strong?[{transform:`translateX(${c.criticalEnemyPx}px)`},{transform:`translateX(${c.criticalEnemyPx}px)`,offset:c.holdMs/c.criticalEnemyMs,easing:'ease-out'},{transform:'translateX(0)'}]:[{transform:'translateX(0)'},{transform:`translateX(${c.enemyPx}px)`,offset:.22,easing:'ease-out'},{transform:'translateX(0)'}];
      this.animateCombat('enemy',$('monsterArt').querySelector('img'),enemyFrames,{duration:strong?c.criticalEnemyMs:c.enemyMs,delay});
      const a=this.combatNumberAnchors.enemy,{width,height}=this.arenaSize,slash=$('duelSlash'),size=(strong?c.criticalSlashRem:c.slashRem)*(this.uiRem||16);
      const x=Math.max(76,Math.min(width-76,a?.width?a.x+a.width/2:width*.75));
      const y=Math.max(76,Math.min(height-76,a?.height?a.y+a.height*.42:height*.5));
      for(const [key,value] of Object.entries({left:x+'px',top:y+'px',width:size+'px',height:size+'px'}))if(slash.style[key]!==value)slash.style[key]=value;
      slash.classList.toggle('impact-critical',strong);
      this.animateCombat('impact',slash,[{opacity:0,transform:'translate(-50%,-50%) rotate(-12deg) scale(.65)'},{opacity:1,transform:'translate(-50%,-50%) rotate(-8deg) scale(1)',offset:.2},{opacity:0,transform:'translate(-50%,-50%) rotate(-5deg) scale(1.08)'}],{duration:strong?170:140,delay});
      this.playHitDecorations(false,strong);
      const shake=Math.min(FX_CONFIG.impact.shakePx,FX_CONFIG.impact.shakePx*Math.min(1,amount/Math.max(1,maxHp))*(strong?2:.1)+(strong?1:0));
      if(shake>.05)this.animateCombat('camera',$('arenaCamera'),[{transform:'translateX(0)'},{transform:`translateX(${-shake}px)`,offset:.2},{transform:`translateX(${shake}px)`,offset:.4},{transform:'translateX(-1px)',offset:.65},{transform:'translateX(0)'}],{duration:FX_CONFIG.impact.shakeMs,delay});
    }
```

### game.js — playHitDecorations()

```js
    playHitDecorations(final=false,strong=false) {
      if(!this.combatMotionEnabled())return;
      const c=FX_CONFIG.impact,a=this.combatNumberAnchors.enemy;if(!a?.width)return;
      const img=$('monsterArt').querySelector('img');if(!img)return;
      const node=final?$('finisherArt'):$('targetFlash');
      for(const [k,v]of Object.entries({left:a.x+'px',top:a.y+'px',width:a.width+'px',height:a.height+'px'}))node.style[k]=v;
      const src=img.getAttribute('src');node.style.setProperty('--hit-mask',`url(${JSON.stringify(src)})`);
      if(final){node.querySelector('img').src=src;node.hidden=false;this.animateCombat('finisher',node,[{opacity:1,transform:'translateX(0)'},{opacity:1,transform:'translateX(0)',offset:c.holdMs/c.finalMs},{opacity:0,transform:'translateX(3px)'}],{duration:c.finalMs,fill:'both'});}
      const flash=final?node.querySelector('i'):node;
      this.animateCombat('flash',flash,[{opacity:.9},{opacity:0}],{duration:final?c.finalFlashMs:c.flashMs,fill:'both'});
      if(final)this.animateCombat('camera',$('arenaCamera'),[{transform:'translateX(0)'},{transform:`translateX(${-c.shakePx}px)`,offset:.25},{transform:`translateX(${c.shakePx}px)`,offset:.5},{transform:'translateX(0)'}],{duration:c.shakeMs});
      const count=final?c.finalSparks:strong?c.criticalSparks:c.sparks;
      for(let i=0;i<Math.min(count,c.sparkLimit);i++){
        const index=this.sparkCursor++%this.sparkNodes.length,n=this.sparkNodes[index],angle=Math.random()*Math.PI*2;
        const travel=(.5+Math.random())*c.sparkTravelRem*(this.uiRem||16);
        n.style.left=(a.x+a.width*.5)+'px';n.style.top=(a.y+a.height*.42)+'px';
        this.animateCombat('spark'+index,n,[{opacity:1,transform:'translate(0,0)'},{opacity:0,transform:`translate(${Math.round(Math.cos(angle)*travel)}px,${Math.round(Math.sin(angle)*travel)}px)`}],{duration:c.sparkMs,fill:'both'});
      }
    }
```

### game.js — playEnemyAttack()

```js
    playEnemyAttack() {
      if(!this.combatMotionEnabled()){this.clearCombatVisuals();return;}
      const c=FX_CONFIG.impact;
      this.animateCombat('enemy',$('monsterArt').querySelector('img'),[{transform:'translateX(0)'},{transform:`translateX(${-c.enemyAttackPx}px)`,offset:.28,easing:'ease-out'},{transform:'translateX(0)'}],{duration:c.enemyAttackMs});
      this.animateCombat('hero',$('combatHero').querySelector('img'),[{transform:'translateX(0)'},{transform:`translateX(${-c.heroHurtPx}px)`,offset:.18,easing:'ease-out'},{transform:'translateX(0)'}],{duration:c.heroHurtMs});
    }
```

### game.js — cacheCombatNumberAnchors()

```js
    cacheCombatNumberAnchors() {
      const arena=$('battlefield').getBoundingClientRect();
      if(!arena.width || !arena.height)return;
      this.arenaSize={width:arena.width,height:arena.height};
      this.uiRem=parseFloat(getComputedStyle(document.documentElement).fontSize)||16;
      const box=id=>{
        const b=$(id).getBoundingClientRect();
        return {x:b.left-arena.left,y:b.top-arena.top,width:b.width,height:b.height};
      };
      this.combatNumberAnchors={enemy:box('attackTarget'),hero:box('combatHero'),event:box('eventArt'),eventCard:$('eventOverlay').hidden?null:box('eventOverlay')};
      const img=$('monsterArt').querySelector('img'),a=this.combatNumberAnchors.enemy;
      const ink=img&&MONSTER_INK_BOUNDS[img.getAttribute('src').split('?')[0]];
      if(ink&&img.naturalWidth){const scale=Math.min(a.width/img.naturalWidth,a.height/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;
        this.combatNumberAnchors.ink={x:a.x+(a.width-w)/2+ink[0]*w,right:a.x+(a.width-w)/2+ink[2]*w};}
      for(const group of Object.values(this.combatNumbers))for(const [node,meta] of group)this.positionCombatNumber(node,meta);
    }
```

### game.js — positionCombatNumber()

```js
    positionCombatNumber(node,meta) {
      const {width,height}=this.arenaSize;
      const a=this.combatNumberAnchors[meta.kind];
      const small=width<=760,crit=meta.style==='crit';
      const cfg=FX_CONFIG.numbers,rem=this.uiRem||16;
      const desired=(crit?cfg.criticalRem:meta.hero?cfg.heroRem:cfg.normalRem)*rem;
      const budget=Math.min(width-24,meta.hero?Math.max(108,width*.28):width*.45,260);
      const size=Math.min(desired,budget/Math.max(1,node.textContent.length*.68));
      const half=Math.max(node.textContent.length*size*.34,meta.caption.length*5/2)+7;
      let x=a?.width?a.x+a.width/2:width*(meta.hero?.22:meta.kind==='event'?.13:.75);
      let y=a?.height?a.y+a.height*(meta.hero?.32:meta.kind==='event'?.5:.42):height*.55;
      if(meta.kind==='reward'){x=width*.5;y=height*.56;}
      const laneGap=meta.kind==='event'?6:small?40:48;
      // Reserve travel/caption space before splitting lanes, even on short actors.
      if(a?.height && meta.kind==='enemy')y=Math.max(a.y+50+laneGap,y);
      x+=meta.jitter;
      if(meta.kind==='enemy'){const edge=this.combatNumberAnchors.ink?.x??a?.x??width*.6;const room=Math.max(48,edge-20);const fitted=Math.min(size,room/Math.max(1,node.textContent.length*.68));node.style.fontSize=(fitted/rem)+'rem';const span=Math.max(node.textContent.length*fitted*.34,meta.caption.length*5/2)+7;x=Math.max(span+8,edge-span-16-Math.abs(meta.jitter));}

      y+=meta.lane*laneGap;
      y=Math.max(58,Math.min(height-Math.ceil(size*1.1)-8,y));
      const card=this.combatNumberAnchors.eventCard;
      if(meta.hero && card && x-half<card.x+card.width+8 && x+half>card.x && y+20>card.y && y-54<card.y+card.height)x=card.x+card.width+half+12;
      x=Math.max(half+8,Math.min(width-half-8,x));
      if(meta.kind!=='enemy')node.style.fontSize=(size/rem)+'rem';node.style.left=`${x}px`;node.style.top=`${y}px`;
    }
```

### game.js — spawnCombatNumber()

```js
    spawnCombatNumber(label,style,hero) {
      if(document.hidden || !$('authScreen').hidden)return;
      const key=hero?'hero':'enemy',group=this.combatNumbers[key];
      const cfg=FX_CONFIG.numbers;
      while(group.size>=(hero?cfg.heroLimit:cfg.enemyLimit))this.removeCombatNumber(group.keys().next().value,group);
      const node=this.numberPool[key].pop()||document.createElement('span');
      const caption=style==='crit'?'CRÍTICO':style==='healing'?'CURA':'';
      node.className=`combat-number ${hero?'hero-damage-number':'float-damage'} ${style}`;
      let value=String(label);
      if(style==='crit')value=value.replace(/^CRÍTICO!?\s*/u,'');
      if(style==='healing')value=value.replace(/\s*♥\s*$/u,'');
      node.textContent=value;
      if(caption)node.dataset.caption=caption;else delete node.dataset.caption;
      const kind=hero?'hero':style==='event-hit'?'event':style==='reward'?'reward':'enemy';
      const meta={hero,kind,style,caption,lane:this.combatNumberSequence[key]++%3-1,jitter:(Math.random()*2-1)*cfg.jitterRem*(this.uiRem||16),timer:0,animation:null};
      this.positionCombatNumber(node,meta);
      $(hero?'heroDamageLayer':'damageLayer').append(node);
      group.set(node,meta);
      const reduced=this.reducedCombatMotion.matches||document.documentElement.classList.contains('hw-lite');
      const rise=cfg.riseRem*(this.uiRem||16),duration=Math.max(600,Math.min(900,cfg.durationMs));
      const frames=reduced?[{opacity:1},{opacity:1,offset:.75},{opacity:0}]:[
        {opacity:0,transform:`translate(-50%,0) scale(${style==='crit'?.85:1})`},
        {opacity:1,transform:`translate(-50%,-${rise*.1}px) scale(${style==='crit'?cfg.pop:1})`,offset:.15},
        {opacity:1,transform:`translate(-50%,-${rise*.4}px) scale(1)`,offset:.55},
        {opacity:0,transform:`translate(-50%,-${rise}px) scale(1)`}];
      meta.animation=node.animate(frames,{duration,easing:'ease-out',fill:'both'});
      meta.animation.finished.then(()=>{if(group.get(node)===meta)this.removeCombatNumber(node,group);},()=>{});
    }
```

### game.js — removeCombatNumber()

```js
    removeCombatNumber(node,group) {
      const meta=group.get(node);
      if(!meta)return;
      clearTimeout(meta.timer);meta.animation?.cancel();
      group.delete(node);node.remove();this.numberPool[meta.hero?'hero':'enemy'].push(node);
    }
```

### game.js — damageMob()

```js
    damageMob(amount,fromClick,critical) {
      const s=this.state;
      if(!s || s.deadUntil || amount<=0)return;
      if(fromClick){this.floatNumber(`${critical?'CRÍTICO! ':''}−${fmt(amount)}`,critical?'crit':'');this.playCombatImpact(critical,amount,s.mob.maxHp);}
      let remaining=amount;
      let chain=0;
      while(remaining>0 && chain++<12){
        const mob=s.mob;
        if(!mob || mob.hp<=0){s.mob=freshMob(s);continue;}
        if(remaining<mob.hp){mob.hp=Math.max(0,mob.hp-remaining);break;}
        remaining-=mob.hp;
        mob.hp=0;
        this.killMob();
      }
    }
```

### game.js — killMob()

```js
    killMob() {
      const s=this.state;
      const defeated=s.mob;
      const kind=defeated.kind||'normal';
      const name=defeated.name;
      if(kind==='boss')this.playHitDecorations(true,true);
      const multiplier=kind==='boss'?18:kind==='miniboss'?7:1;
      const gold=Math.floor(multiply(multiply(rewardGold(s),multiplier),this.bonuses().gold));
      const xp=Math.floor(multiply(rewardXp(s),kind==='boss'?14:kind==='miniboss'?6:1));
      this.awardGold(gold);
      s.runKills++;s.lifetimeKills++;s.zoneKills[s.zone]++;
      this.awardXp(xp);
      const progress=progressAt(s);
      let travelNext=false;
      if(kind==='miniboss'){
        progress.minibossDefeated=true;
        progress.stage=6;progress.kills=0;
        this.dropMaterial(3);
        if(Math.random()<.4)this.awardEquipment(weightedPick(['incomum','raro','epico'],[80,19,1]));
        this.addLog(`MINIBOSS ${name} vencido! Fase 6 desbloqueada. +${fmt(gold)} ouro e +${fmt(xp)} XP.`,'⚔','epic');
        this.toast('✦ MINIBOSS VENCIDO! A fase 6 foi liberada!','epic');
      }else if(kind==='boss'){
        progress.bossDefeated=true;progress.cleared=true;progress.stage=10;progress.kills=10;
        this.dropMaterial(5);
        this.awardEquipment(weightedPick(['raro','epico','lendario'],[90,9,1]),3);
        this.addLog(`CHEFÃO ${name} DERROTADO! ${ZONES[s.zone].name} foi conquistada! +${fmt(gold)} ouro e +${fmt(xp)} XP.`,'◆','epic');
        this.toast(`CHEFÃO DERROTADO! ${s.zone===ZONES.length-1?'Todas as regiões conquistadas!':'Nova região liberada!'}`,'epic');
        travelNext=s.zone<ZONES.length-1;
      }else{
        if(s.farmStage!=null)s.farmKills=(s.farmKills+1)%ENEMIES_PER_PHASE;
        else if(!progress.cleared){
          progress.kills++;
          if(progress.kills===ENEMIES_PER_PHASE){
            if(progress.stage===5){
              this.addLog(`Os dez inimigos da fase 5 caíram. O MINIBOSS surgiu!`,'☠','rare');
              this.toast('⚠ MINIBOSS — Uma criatura poderosa bloqueia o caminho!');
            }else if(progress.stage===10){
              this.addLog(`Os dez inimigos da fase 10 caíram. O CHEFÃO FINAL despertou!`,'☠','epic');
              this.toast('⚠ CHEFÃO DA REGIÃO! Prepare seus golpes!','epic');
            }else{
              progress.stage++;progress.kills=0;
              this.addLog(`FASE ${progress.stage} liberada em ${ZONES[s.zone].name}!`,'✦','good');
            }
          }
        }
        this.rollCombatLoot();
        this.addLog(`${name} derrotado. +${fmt(gold)} ouro · +${fmt(xp)} XP.`,'⚔');
      }
      if(!s.event && now()-s.lastEventAt>17000 && Math.random()<(.029+s.skills.r3*.007))this.spawnEvent();
      if(travelNext){
        const previousZone=ZONES[s.zone].name;
        s.zone++;
        s.event=null;
        s.nextEventAt=now()+this.nextEventDelay();
        this.lastZoneRendered=-1;
        this.addLog(`✧ ${previousZone} concluída. Você avançou para ${ZONES[s.zone].name}!`,'⚑','good');
        this.toast(`REGIÃO ${ZONES[s.zone].rune} — ${ZONES[s.zone].name}`,'good');
      }
      s.mob=freshMob(s,defeated.name);
      s.nextEnemyAttackAt=now()+enemyAttackInterval(s.mob);
      this.renderCore();
      if(!$('hudBackdrop').hidden && (this.tab==='inventory'||this.tab==='zones'))this.renderPanel();
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
        portrait.addEventListener('load',()=>this.cacheCombatNumberAnchors(),{once:true});
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

### game-hud.js — arquivo completo

```js
/* One viewport for combat, with accessible relic panels over the arena. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const backdrop = $('hudBackdrop'), panel = $('hudPanel');
  const frame = $('appFrame');
  // Decorative type is limited to large titles. Keep the experiment reversible.
  function setTitleFont(value) {
    const font=value==='classic'?'classic':'dornen';
    root.dataset.hudFont=font;$('hudTitleFont').value=font;
    try {localStorage.setItem('hellward_hud_title_font',font);} catch {}
  }
  let savedFont='dornen';
  try {savedFont=localStorage.getItem('hellward_hud_title_font') || savedFont;} catch {}
  setTitleFont(savedFont);
  $('hudTitleFont').addEventListener('change',e=>setTitleFont(e.target.value));
  function setScreenEffects(enabled){
    root.dataset.screenEffects=enabled?'on':'off';$('screenEffects').checked=enabled;
    try{localStorage.setItem('hellward_screen_effects',enabled?'on':'off');}catch{}
    document.dispatchEvent(new Event('hellward:screen-effects'));
  }
  let effects=true;try{effects=localStorage.getItem('hellward_screen_effects')!=='off';}catch{}
  setScreenEffects(effects);
  $('screenEffects').addEventListener('change',e=>setScreenEffects(e.target.checked));
  const labels = {
    upgrades:['CRÔNICAS DO ERRANTE','Livro Negro'],
    inventory:['RELIQUIÁRIO DO VIAJANTE','Mochila'],
    ascension:['O PREÇO DA ETERNIDADE','Cálice da Ascensão'],
    zones:['ALÉM DOS PORTÕES','Regiões Esquecidas'],
    chronicle:['SUSSURROS DO ABISMO','Crônicas da Jornada'],
    settings:['A JORNADA É SUA','Configurações']
  };
  let active = null, opener = null;
  function setExpanded() {
    document.querySelectorAll('[data-open-panel]').forEach(b => b.setAttribute('aria-expanded', String(b.dataset.openPanel === active)));
  }
  function display(name) {
    if (!labels[name]) return;
    active = name;
    $('hudFeedback').hidden=true;
    $('hudPanelEyebrow').textContent = labels[name][0];
    $('hudPanelTitle').textContent = name === 'inventory' ? 'Mochila de ' + $('profileName').textContent : labels[name][1];
    const art={upgrades:'assets/hud/livro-negro.png',inventory:'assets/hud/mochila-velha.png',ascension:'assets/hud/calice-ascensao.png',zones:'assets/ui/regions-tree.webp',chronicle:'assets/hud/livro-negro.png',settings:'assets/ui/vitality-bezel.webp'}[name];
    if($('hudPanelArt').getAttribute('src')!==art)$('hudPanelArt').src=art;
    panel.dataset.view = name;
    $('codexSummary').hidden = name !== 'upgrades';
    $('codexJourney').hidden = name !== 'upgrades';
    $('hudChronicle').hidden = name !== 'chronicle';
    const special = name === 'chronicle' || name === 'settings';
    $('hudSettings').hidden = name !== 'settings';
    $('tabBody').hidden = special;
    panel.querySelector('.tab-nav').hidden = special;
    $('hudPanelScroll').scrollTop = 0;
    setExpanded();
  }
  function close(restore = true) {
    if (backdrop.hidden) return;
    backdrop.hidden = true; active = null;
    $('hudFeedback').hidden=true;
    frame.inert = !$('authScreen').hidden;
    setExpanded();
    if (restore && $('authScreen').hidden) opener?.focus({preventScroll:true});
  }
  function open(name, button) {
    if (!$('authScreen').hidden || !$('dialogBackdrop').hidden || !labels[name]) return;
    if (active === name && !backdrop.hidden) { close(); return; }
    opener = button || document.querySelector(`[data-open-panel="${name}"]`);
    if (name !== 'chronicle' && name !== 'settings') panel.querySelector(`[data-tab="${name}"]`).click();
    backdrop.hidden = false; display(name); frame.inert = true;
    $('hudClose').focus({preventScroll:true});
  }
  document.querySelectorAll('[data-open-panel]').forEach(button => button.addEventListener('click', () => open(button.dataset.openPanel, button)));
  panel.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => display(button.dataset.tab)));
  $('hudClose').addEventListener('click', () => close());
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', e => {
    if (!$('authScreen').hidden || !$('dialogBackdrop').hidden) return;
    if (!backdrop.hidden && e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (!backdrop.hidden && e.key === 'Tab') {
      const focusable = [...panel.querySelectorAll('button:not(:disabled),select,input,a[href],[tabindex="0"]')].filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { e.preventDefault(); first?.focus(); }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || ['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
    const name = {c:'upgrades',a:'ascension',i:'inventory',m:'zones',j:'chronicle'}[e.key.toLowerCase()];
    if (name) { e.preventDefault(); open(name); }
  });
  function syncScene() {
    const inMenu = !$('authScreen').hidden;
    root.classList.toggle('hw-game-active', !inMenu);
    if (inMenu) close(false);
    frame.inert = inMenu || !backdrop.hidden;
  }
  document.addEventListener('hellward:scenechange', syncScene);
  new MutationObserver(syncScene).observe($('authScreen'), {attributes:true, attributeFilter:['hidden']});
  // A confirmation dialog may appear over a relic panel. Restore focus to the
  // panel after dismissal and keep the covered panel out of the tab order.
  new MutationObserver(() => {
    panel.inert = !$('dialogBackdrop').hidden;
    if ($('dialogBackdrop').hidden && !backdrop.hidden) $('hudClose').focus({preventScroll:true});
  }).observe($('dialogBackdrop'), {attributes:true, attributeFilter:['hidden']});
  syncScene();
})();

```

### index.html — elementos completos modificados

```html
  <script src="game.js?v=26" defer></script>
  <script src="game-hud.js?v=7" defer></script>
  <link rel="stylesheet" href="combat-events.css?v=8">
            <span class="duel-slash" id="duelSlash" aria-hidden="true"></span><span id="targetFlash" class="target-flash" aria-hidden="true"></span><span id="finisherArt" class="finisher-art" hidden aria-hidden="true"><img alt=""><i class="target-flash"></i></span>
        <section class="settings-card"><h3>Aparência</h3><label class="screen-effects-control"><input id="screenEffects" type="checkbox" checked> Efeitos de tela (flash e shake)</label><p>Escolha o tema e compare a fonte dos títulos.</p><button id="themeToggle" type="button" class="settings-action" aria-pressed="true" aria-label="Alternar modo escuro">☾ Escuro</button><label class="font-control" for="hudTitleFont">Fonte dos títulos<select id="hudTitleFont" class="dark-select"><option value="dornen">Dornen · teste</option><option value="classic">Clássica</option></select></label><p class="font-note">Dornen nos títulos; descrições e números mantêm a fonte de leitura.</p></section>
```

### combat-events.css — arquivo completo

```css
/* Native selection feedback belongs to text fields, not the combat sprites. */
.battlefield,.battlefield *{
  -webkit-user-select:none;user-select:none;
  -webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;
}
.battlefield img{-webkit-user-drag:none}
/* Grounded, compositor-only idle lives outside the sprite's attack transform. */
.battlefield .actor-idle{
  --idle-cycle:6.4s;--idle-scale:1.005;--idle-lean:.12deg;
  display:block;position:relative;z-index:1;width:100%;height:100%;
  transform-origin:50% 100%;pointer-events:none;
}
.battlefield .hero-idle{--idle-cycle:5.2s;--idle-scale:1.0065;--idle-lean:.15deg;--idle-delay:-.9s}
.battlefield.miniboss-fight .attack-target .actor-idle{--idle-cycle:7.2s;--idle-scale:1.004;--idle-lean:.09deg}
.battlefield.boss-fight .attack-target .actor-idle{--idle-cycle:8.4s;--idle-scale:1.0025;--idle-lean:.07deg}
html.hw-game-active .battlefield .actor-idle{
  animation:hw-idle-breathe var(--idle-cycle) ease-in-out var(--idle-delay,0s) infinite!important;
}
@keyframes hw-idle-breathe{
  0%,100%{transform:skewX(calc(0deg - var(--idle-lean))) scaleY(1)}
  50%{transform:skewX(var(--idle-lean)) scaleY(var(--idle-scale))}
}
html.hw-game-active .battlefield .actor-idle.actor-active,html.hw-game-active[data-combat-idle-paused] .battlefield .actor-idle{animation-play-state:paused!important}
html.hw-game-active.hw-lite .battlefield .actor-idle,html.hw-game-active .battlefield .combat-hero.defeated .actor-idle,html:not(.hw-game-active) .actor-idle{animation:none!important;transform:none!important}
@media(prefers-reduced-motion:reduce){html.hw-game-active .battlefield .actor-idle{animation:none!important;transform:none!important}}
/* Only scenery shakes; actor motion stays on sprites, outside the stable HUD. */
.arena-camera{position:absolute;inset:-3px;z-index:0;pointer-events:none}
.app-frame .battlefield .duel-slash{
  --impact-core:#f4e2c4;position:absolute;z-index:12;width:72px;height:72px;
  left:75%;top:50%;border:0;border-radius:0;opacity:0;transform:none;
  background:linear-gradient(135deg,transparent 45%,#9d81624d 47%,var(--impact-core) 50%,#a7764e80 52%,transparent 55%);
  box-shadow:none;pointer-events:none;
}
.duel-slash::before,.duel-slash::after{
  content:'';position:absolute;inset:16%;
  background:linear-gradient(45deg,transparent 45%,var(--impact-core) 50%,transparent 55%);
}
.duel-slash::after{inset:29%;transform:rotate(22deg)}
.app-frame .duel-slash.impact-critical{--impact-core:#ffdb96}
.hw-lite .duel-slash{display:none!important}
.hw-lite .arena-camera,.hw-lite .battlefield .combat-hero-sprite,.hw-lite .battlefield .monster-art img{transform:none!important}
@media(prefers-reduced-motion:reduce){
  .duel-slash{display:none!important}
  .arena-camera,.battlefield .combat-hero-sprite,.battlefield .monster-art img{transform:none!important}
}
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
/* Cached actor coordinates share arena space; they never inherit sprite rotation. */
.app-frame .battlefield .hero-damage-layer{
  inset:0;width:100%;height:100%;display:block;contain:layout style;z-index:24;
}
.app-frame .battlefield .combat-number{
  position:absolute;width:max-content;margin:0;padding:0;pointer-events:none;
  font-family:Georgia,serif;font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums;
  letter-spacing:0;white-space:nowrap;color:#fff0d1;
  text-shadow:-1px -1px #100b0c,1px -1px #100b0c,-1px 1px #100b0c,1px 1px #100b0c,0 2px 2px #000;
  animation:none!important;transform:translateX(-50%);
}
.app-frame .combat-number.crit{color:#ff974f;font-weight:900}
.app-frame .combat-number.hero-hit{color:#ffafa3}
.app-frame .combat-number.healing{color:#c3e6b3}
.app-frame .combat-number.event-hit,.app-frame .combat-number.reward{color:#e8c889}
.combat-number[data-caption]::before{
  content:attr(data-caption);position:absolute;left:50%;bottom:calc(100% + 2px);transform:translateX(-50%);
  padding:1px 4px;border:1px solid #9e774b;background:#171014e8;color:inherit;
  font:700 9px/11px Arial,sans-serif;letter-spacing:.7px;text-shadow:0 1px #000;
}
.combat-number.healing[data-caption]::before{border-color:#6f8062}
@keyframes hw-number-rise{
  0%{opacity:0;transform:translate(-50%,5px)}
  10%,55%{opacity:1}
  100%{opacity:0;transform:translate(-50%,-32px)}
}
.hw-lite .app-frame .battlefield .combat-number{animation:none!important}
@keyframes hw-number-still{0%,75%{opacity:1;transform:translateX(-50%)}100%{opacity:0;transform:translateX(-50%)}}
@media(prefers-reduced-motion:reduce){
  .app-frame .battlefield .combat-number{animation:none!important}
}
/* Q can trigger :focus-visible on the last clicked target. Keep the keyboard
   cue on its short caption instead of outlining the monster's entire box. */
.battlefield .attack-target:focus-visible{outline:none}
.battlefield .attack-target:focus-visible .target-hint{
  color:#ffe2b2;opacity:1;text-decoration:underline;text-underline-offset:3px;
}

/* One static painted frame, two cached WebP sprites; no extra animation loop. */
.app-frame .event-overlay{
  left:12px;right:auto;top:142px;width:156px;height:222px;
  padding:27px 15px 17px;background:url('assets/events/infernal-reliquary.webp?v=2') center/100% 100% no-repeat;
  animation:none;box-shadow:none;
}
.app-frame .event-ribbon{
  height:15px;padding:0;border:0;background:none;box-shadow:none;
  color:#e0bc8e;font:700 8px/15px var(--ui);letter-spacing:1px;text-shadow:0 1px #000;
}
.app-frame .event-button{
  display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:78px 30px 12px 6px 16px;
  align-items:center;justify-items:center;gap:3px;width:100%;padding:0;
  border:0;background:none;box-shadow:none;animation:none;color:#f0d6b0;
}
.app-frame .event-button:focus-visible{outline:1px solid #cf9b64;outline-offset:2px}
.app-frame .event-illustration{display:block;width:100%;height:78px;line-height:1;pointer-events:none}
.app-frame .event-illustration img{display:block;width:100%;height:100%;object-fit:contain}
.app-frame .event-title{
  display:grid;place-items:center;width:100%;min-height:0;max-width:100%;
  font:700 14px/15px var(--serif);color:#f3dcbd;text-align:center;text-wrap:balance;
}
.app-frame .event-instruction{
  margin:0;padding:0;color:#d4b692;font:700 8px/12px var(--ui);letter-spacing:.2px;
}
.app-frame .event-progress-track{
  width:100%;height:6px;border:1px solid #72513b;background:#120b0c;overflow:hidden;
}
.app-frame .event-progress-track>span{
  width:100%!important;transform-origin:left center;background:linear-gradient(90deg,#7c2522,#d38b49);
}
.app-frame .event-clock{margin:0;color:#e7c494;font:700 11px/16px var(--ui);font-variant-numeric:tabular-nums}
@media(max-width:760px){
  .app-frame .event-overlay{
    left:6px;top:164px;width:116px;height:min(184px,calc(100% - 172px));
    padding:22px 11px 13px;
  }
  .app-frame .event-ribbon{height:13px;font-size:7px;line-height:13px;letter-spacing:.3px}
  .app-frame .event-button{height:calc(100% - 13px);grid-template-rows:minmax(22px,1fr) 28px 12px 6px 15px;gap:3px}
  .app-frame .event-illustration{width:100%;height:100%;min-height:0}
  .app-frame .event-title{font-size:12px;line-height:14px}
  .app-frame .event-instruction{font-size:8px;letter-spacing:0;white-space:nowrap}
  .app-frame .event-clock{font-size:10px;line-height:15px}
}
@media(max-width:760px) and (max-height:650px) and (orientation:portrait){
  .app-frame .event-overlay{top:164px;height:min(166px,calc(100% - 172px));padding:18px 11px 10px}
  .app-frame .event-ribbon{height:11px;line-height:11px}
  .app-frame .event-button{height:calc(100% - 11px);grid-template-rows:minmax(24px,1fr) 26px 10px 5px 14px;gap:2px}
  .app-frame .event-title{line-height:13px}
  .app-frame .event-instruction{line-height:10px}
  .app-frame .event-clock{line-height:14px}
}
@media(orientation:landscape) and (max-height:600px){
  .app-frame .event-overlay{left:6px;top:94px;width:min(116px,calc(15vw - 10px));height:min(156px,calc(100% - 100px));padding:16px 11px 10px}
  .app-frame .event-ribbon{height:11px;font-size:7px;line-height:11px;letter-spacing:.3px}
  .app-frame .event-button{height:calc(100% - 11px);grid-template-rows:minmax(18px,1fr) 26px 10px 5px 14px;gap:2px}
  .app-frame .event-illustration{height:100%;min-height:0}
  .app-frame .event-title{font-size:12px;line-height:13px}
  .app-frame .event-instruction{font-size:8px;line-height:10px;letter-spacing:0;white-space:nowrap}
  .app-frame .event-clock{font-size:10px;line-height:14px}
}

/* Bounded decorative layers always remain below HP (17) and damage text (20/24). */
.target-flash,.finisher-art,.combat-spark{position:absolute;pointer-events:none;opacity:0;z-index:12}
.target-flash{background:#ffdfce;mask-image:var(--hit-mask);mask-size:contain;mask-position:center bottom;mask-repeat:no-repeat}
.finisher-art{z-index:10}
.finisher-art>img,.finisher-art>.target-flash{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center bottom}
.combat-spark{width:.18rem;height:.18rem;background:#f5bb75}
.screen-effects-control{display:flex;align-items:center;gap:.6rem;margin:1rem 0;font: .875rem/1.5 Arial,sans-serif}
html[data-screen-effects=off] .target-flash,html[data-screen-effects=off] .finisher-art,html[data-screen-effects=off] .combat-spark{display:none}
@media(prefers-reduced-motion:reduce){.target-flash,.finisher-art,.combat-spark{display:none}}

.finisher-art>img{image-rendering:pixelated}

```

## Validação e desempenho

Passaram as regressões de combate, números, HP atrasado, HUD/legibilidade, inventário/caça, idle, escala dos chefes, orbe e balanceamento. O teste dos números e impactos cobre três resoluções de computador. Auditoria de 95 assets: nenhuma duplicata.

A comparação de 16 cenas passou dentro da tolerância do projeto. FPS final: **60–60** neste ambiente headless. A finalização foi testada funcionalmente, mas não em um benchmark separado. Não houve teste em hardware físico ou sessão de horas. Dados brutos: [performance-items-2-3.json](performance-items-2-3.json).
