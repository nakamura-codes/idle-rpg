# Itens 7 e 8 — revisão e aceite no desktop

A versão atual já continha a base dos itens 7 e 8. Esta revisão completa os controles de configuração, garante aura explícita também para `elite`, reforça o teto de partículas e valida a integração com as camadas/parallax atuais. Não duplica os sistemas existentes.

## Item 7 — névoa, luz e partículas

| Região | Partículas visíveis | Luz | Névoa |
| --- | --- | --- | --- |
| Campos de Cinza | 5 cinzas | Cobre, ciclo de 8 s | Cinza quente |
| Bosque Profanado | 4 folhas secas | Verde frio, 10 s | Musgo |
| Criptas Afogadas | 5 flocos espectrais | Azul glacial, 10 s | Azul acinzentado |
| Fortaleza de Ferro | 4 partículas de poeira | Ferrugem, 7,5 s | Rarefeita |
| Fendas Infernais | 6 brasas ascendentes | Vermelho brasa, 6,5 s | Fumaça quente |
| Trono do Crepúsculo | 4 motes espectrais | Violeta, 9 s | Violeta acinzentado |

Dois planos de névoa se movem lentamente atrás dos personagens. A névoa PNG existente continua integrada ao seu próprio plano. A luz pulsa apenas em opacidade e as partículas usam movimento CSS. Não há loop JS por frame nem blur em tempo real.

O pool fixo tem **8 elementos** e os padrões regionais usam no máximo **6**. A contagem configurada é convertida para inteiro e limitada à capacidade real do pool. Alterar a região ou recarregar a configuração não cria partículas adicionais.

`ATMOSPHERE_CONFIG`, no topo de `world-atmosphere.js`, contém cores, intensidades, tipos, contagens, tamanhos e durações por região. O alcance da névoa e os deslocamentos das partículas também ficam na configuração. `fogTravelRem` pode ser definido por região; `particle.travelRem` e `particle.sideRem` permitem personalizar o movimento regional.

Para testar ajustes durante o desenvolvimento:

```js
window.HELLWARD_ATMOSPHERE_CONFIG.regions[1].particle.count = 4;
document.dispatchEvent(new Event('hellward:atmosphere-refresh'));
```

A atmosfera pausa com aba oculta ou painel aberto. Movimento reduzido, modo leve ou Efeitos de tela desligados mantêm a aparência estática. A retomada após restaurar a página também sincroniza o estado. O trabalho de celular permanece para a rodada 5.

**Arquivos do item 7:** `world-atmosphere.js`, `world-fx.css` e `index.html`.

**Como testar:** percorra as seis regiões no computador, observe a névoa ao fundo/no chão, as diferenças de luz e as poucas partículas. Abra um painel ou troque de aba para conferir a pausa; compare com Efeitos de tela desligados e movimento reduzido.

## Item 8 — encontros e transições

- Intro de **1,25 s** com nome, título regional e fase. Entrada do sprite em **260 ms**, com deslocamento de **2 pixels em passos inteiros**. Sem escala/rotação; o ataque permanece disponível durante a intro.
- Aura estática distinta por categoria: **elite azul**, **minichefe verde**, **chefe dourado**, com cores/opacidades em `FX_CONFIG.encounter.auras`. A apresentação de `elite` é suportada sem acrescentar novos encontros, spawns ou regras de combate.
- Morte breve de **180 ms** para comuns/minichefes; chefes continuam usando a finalização existente de **300 ms**. Um único elemento de morte é reutilizado. A barra da troca fica oculta até representar o inimigo atual.
- Cortina de fase de **340 ms**, com o número da fase. Para encontros especiais, a própria intro também identifica a fase. O parallax e o shake existentes continuam em seus contêineres separados.
- Conclusão de região/expedição com ouro já creditado, XP e equipamento recebido/conversão na Mochila. Dura **6,5 s**, pode ser fechada em Continuar ou pelo ataque e não bloqueia o combate. Continuar apenas fecha a apresentação.

As recompensas e o estado continuam síncronos; callbacks e timers só controlam a apresentação. Cliques durante a morte/entrada não criam filas crescentes de sprites, recompensas adicionais ou uma barra correspondente a um alvo antigo. Perfil, viagem, Ascensão, aba oculta e mudanças de preferência cancelam apresentações antigas.

Durações, passos e intensidades ficam em `FX_CONFIG.encounter`. O fade da conclusão e a quantização das animações passaram a ser campos explícitos. Uma região sem título específico usa seu subtítulo como fallback.

**Arquivos do item 8:** `game.js`, `world-fx.css` e `index.html`.

**Como testar:** encontre minichefes/chefes, ataque imediatamente durante a intro, atravesse fases e mate inimigos rapidamente. Confira o nome e a barra após cada troca. Na conclusão, pressione Continuar repetidamente e use Espaço: os totais de ouro/XP/itens não devem ser creditados novamente.

## Preservação e testes

Foram comparados e mantidos idênticos o código de dano/recompensas, a normalização do save e os demais grupos de `FX_CONFIG` dos itens 1 a 6. Não há mudança de versão/formato de save, fórmulas, loot ou recompensas.

Testes que passaram:

- `world-fx.cjs`: seis atmosferas, contagem limitada a oito mesmo com configuração excessiva, reutilização de elementos, três auras, intro clicável, morte/fases, pausa e preferências. Testa **80 cliques reais de botão** durante apresentações e compara **720 abates em 60 ataques transbordantes** com a referência: mesma economia, loot, progressão e chaves do save, sem duplicação. Continuar via clique/teclado não concede nada.
- `balance.cjs`: dano, defesa, cura, loot, progressão e migração.
- `hud-browser.cjs`: controles, equipamento, importação/exportação e persistência.
- `combat-events.cjs`: eventos, recompensas, ataque, cura e teclado.
- `combat-impact.cjs` e `combat-idle.cjs`: efeitos anteriores, limites e sprite sem transformações indevidas.
- `parallax.cjs`: seis regiões, atores fixos, margens e preferências.

Os testes de navegador usam `DESKTOP_ONLY=1`, conforme a prioridade atual. Foram inspecionadas as capturas de intro de elite/chefe e conclusão no desktop. Nenhum controle novo de celular foi acrescentado.

## Arquivos desta revisão

- `game.js`
- `world-atmosphere.js`
- `world-fx.css`
- `index.html` (versões de cache)
- `tests/world-fx.cjs`
- `docs/items-7-8-revisao.md` (este documento)

Arquivos completos: [game.js](../game.js), [world-atmosphere.js](../world-atmosphere.js), [world-fx.css](../world-fx.css), [index.html](../index.html).

## Desempenho

Chromium 153 headless, desktop 1366×768, mesmo ambiente, amostras de aproximadamente 5 segundos. Baseline antes das alterações e comparação final isolada com `PERF_DEVICE=desktop PERF_ATMOSPHERE=1 PERF_TRANSITIONS=1 PERF_HUNT=1`. Tolerâncias existentes: 3 FPS e 5 ms de p95; não são uma garantia de FPS em outros computadores.

| Cena | FPS antes → depois | p95 antes → depois (ms) |
| --- | --- | --- |
| menu | 60 → 60 | 16.8 → 16.7 |
| battle-idle | 60 → 60 | 16.7 → 16.7 |
| battle-attacks | 60 → 60 | 16.7 → 16.7 |
| atmosphere-region-0 | 60 → 60 | 16.7 → 16.7 |
| atmosphere-region-1 | 60 → 60 | 16.8 → 16.7 |
| atmosphere-region-2 | 60 → 60 | 16.8 → 16.8 |
| atmosphere-region-3 | 60 → 60 | 16.7 → 16.7 |
| atmosphere-region-4 | 60 → 60 | 16.7 → 16.8 |
| atmosphere-region-5 | 60 → 60 | 16.7 → 16.7 |
| encounter-burst | 60 → 60 | 16.7 → 16.7 |
| codex-idle | 60 → 60 | 16.8 → 16.8 |
| hunt-attacks | 60 → 60 | 16.7 → 16.7 |
| menu-return | 60 → 60 | 16.7 → 16.7 |

A comparação passou, incluindo as seis regiões e a rajada de transições.

## Trechos completos alterados em game.js

Entrada `encounter` dentro de `FX_CONFIG`:

```js
    encounter: {deathMs:180,bossDeathMs:300,introMs:1250,entryMs:260,entryPx:2,curtainMs:340,receiptMs:6500,receiptFadeMs:160,fadeSteps:12,entrySteps:2,auras:{elite:{color:'121 150 190',core:.40,halo:.08,opacity:.46},miniboss:{color:'119 168 148',core:.44,halo:.094,opacity:.5},boss:{color:'169 138 77',core:.40,halo:.078,opacity:.5}},titles:[['Guardião das cinzas','Soberano dos condenados'],['Predador do bosque','Terror das raízes profanadas'],['Oráculo das águas mortas','Rei da cripta afogada'],['Carrasco do ferro','Senhor da fortaleza maldita'],['Devorador das brasas','Soberano das fendas'],['Guardiã do eclipse','O último soberano']]},
```

```js
    animateEncounter(key,node,frames,duration,done=()=>{}) {
      this.stopEncounterAnimation(key);
      const animation=node.animate(frames,{duration,easing:`steps(${key==='entry'?FX_CONFIG.encounter.entrySteps:FX_CONFIG.encounter.fadeSteps},end)`,fill:'both'});
      this.encounterAnimations.set(key,animation);
      animation.finished.then(()=>{if(this.encounterAnimations.get(key)!==animation)return;this.encounterAnimations.delete(key);animation.cancel();done();},()=>{});
    }
```

```js
    renderEncounterFX() {
      const s=this.state;if(!s)return;
      if(this.encounterSeenState!==s){this.encounterSeenState=s;this.encounterSeenMob=null;}
      if(this.encounterSeenMob===s.mob)return;
      this.stopEncounterAnimation('entry');this.stopEncounterAnimation('intro');this.encounterIntro.hidden=true;
      this.encounterSeenMob=s.mob;
      if(!['boss','miniboss','elite'].includes(s.mob.kind)||s.deadUntil||!this.encounterMotionEnabled())return;
      const c=FX_CONFIG.encounter,banner=this.encounterIntro;
      banner.querySelector('small').textContent=`${s.mob.kind==='boss'?'CHEFÃO':'ELITE'} · FASE ${combatStage(s)}/10`;
      banner.querySelector('strong').textContent=s.mob.name;
      banner.querySelector('span').textContent=c.titles[s.zone]?.[s.mob.kind==='boss'?1:0]||ZONES[s.zone].subtitle;banner.hidden=false;
      this.animateEncounter('intro',banner,[{opacity:0},{opacity:1,offset:.1},{opacity:1,offset:.83},{opacity:0}],c.introMs,()=>{banner.hidden=true;});
      const idle=$('monsterArt').querySelector('.actor-idle');
      if(idle)this.animateEncounter('entry',idle,[{opacity:.4,transform:`translateX(${c.entryPx}px)`},{opacity:1,transform:'translateX(0)'}],c.entryMs);
    }
```

```js
    presentExpeditionReceipt() {
      const receipt=this.pendingExpeditionReceipt;this.pendingExpeditionReceipt=null;
      if(!this.encounterAnimations||!receipt||receipt.owner!==this.state||document.hidden||!$('authScreen').hidden)return;
      this.closeExpeditionReceipt();this.stopEncounterAnimation('intro');this.stopEncounterAnimation('curtain');this.encounterIntro.hidden=true;this.phaseCurtain.hidden=true;const node=this.expeditionReceipt;
      node.querySelector('small').textContent=receipt.final?'EXPEDIÇÃO CONCLUÍDA':'REGIÃO CONCLUÍDA';
      node.querySelector('strong').textContent=ZONES[receipt.zone].name;
      const rows=node.querySelectorAll('p');rows[0].textContent=`+${fmt(receipt.gold)} ouro · +${fmt(receipt.xp)} XP · ${receipt.trophy}`;
      rows[1].textContent=receipt.final?'As seis regiões foram conquistadas. Sua jornada continua.':`Próxima região: ${ZONES[this.state.zone].name} · FASE ${combatStage(this.state)}/10`;
      node.hidden=false;
      if(this.encounterMotionEnabled())this.animateEncounter('receipt',node,[{opacity:0},{opacity:1}],FX_CONFIG.encounter.receiptFadeMs);
      this.receiptTimer=setTimeout(()=>this.closeExpeditionReceipt(),FX_CONFIG.encounter.receiptMs);
    }
```

Trecho de configuração visual dentro de `renderCore()`:

```js
      const arena = $('battlefield');
      if(arena.dataset.encounterKind!==bossKind){
        arena.dataset.encounterKind=bossKind;
        const aura=FX_CONFIG.encounter.auras[bossKind];
        if(aura)for(const [key,value]of Object.entries(aura))arena.style.setProperty('--encounter-aura-'+key,String(value));
      }
      arena.classList.toggle('elite-fight',bossKind==='elite');
      arena.classList.toggle('boss-fight',bossKind==='boss');
      arena.classList.toggle('miniboss-fight',bossKind==='miniboss');
      arena.classList.toggle('final-boss-fight',bossKind==='boss' && s.zone===ZONES.length-1);
```

## world-atmosphere.js completo

```js
/* Regional ambience: fixed pool, CSS motion, no frame loop. Desktop first. */
(() => {
  'use strict';
  const ATMOSPHERE_CONFIG = {
    maxParticles:8, particleSteps:120, fogSteps:40, lightSteps:20,
    fogTravelRem:.45, particleTravelRem:16, particleSideRem:1.5,
    regions:[
      {name:'Campos de Cinza',fogColor:'139 128 113',fogBack:.06,fogGround:.09,fogMs:42000,lightColor:'142 85 48',lightMin:.68,lightMax:.88,lightMs:8000,particle:{type:'ash',count:5,color:'183 163 138',sizeRem:.12,opacity:.32,durationMs:24000,rise:false}},
      {name:'Bosque Profanado',fogColor:'112 139 123',fogBack:.08,fogGround:.10,fogMs:48000,lightColor:'66 104 74',lightMin:.60,lightMax:.80,lightMs:10000,particle:{type:'leaf',count:4,color:'140 115 72',sizeRem:.24,opacity:.32,durationMs:30000,rise:false}},
      {name:'Criptas Afogadas',fogColor:'120 158 164',fogBack:.10,fogGround:.12,fogMs:50000,lightColor:'46 128 151',lightMin:.60,lightMax:.79,lightMs:10000,particle:{type:'snow',count:5,color:'151 186 190',sizeRem:.12,opacity:.33,durationMs:30000,rise:false}},
      {name:'Fortaleza de Ferro',fogColor:'104 92 83',fogBack:.04,fogGround:.06,fogMs:40000,lightColor:'175 91 35',lightMin:.70,lightMax:.91,lightMs:7500,particle:{type:'dust',count:4,color:'166 124 84',sizeRem:.11,opacity:.30,durationMs:26000,rise:false}},
      {name:'Fendas Infernais',fogColor:'114 74 67',fogBack:.06,fogGround:.08,fogMs:36000,lightColor:'191 46 21',lightMin:.65,lightMax:.90,lightMs:6500,particle:{type:'ember',count:6,color:'236 123 59',sizeRem:.14,opacity:.40,durationMs:24000,rise:true}},
      {name:'Trono do Crepúsculo',fogColor:'137 117 155',fogBack:.07,fogGround:.10,fogMs:46000,lightColor:'101 64 143',lightMin:.62,lightMax:.82,lightMs:9000,particle:{type:'soul',count:4,color:'174 151 189',sizeRem:.13,opacity:.32,durationMs:30000,rise:true}}
    ]
  };
  window.HELLWARD_ATMOSPHERE_CONFIG=ATMOSPHERE_CONFIG;
  const root=document.documentElement,arena=document.getElementById('battlefield'),frame=document.getElementById('appFrame');
  const desktop=matchMedia('(min-width:1000px) and (min-height:600px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const back=document.createElement('div'),ground=document.createElement('div'),field=document.createElement('div');
  back.className='atmo-fog atmo-fog-back';ground.className='atmo-fog atmo-fog-ground';field.className='atmo-particles';
  for(const node of [back,ground,field])node.setAttribute('aria-hidden','true');
  arena.querySelector('[data-scene-layer=middle]').append(back);
  arena.querySelector('[data-scene-layer=mist]').append(ground,field);
  const particles=Array.from({length:ATMOSPHERE_CONFIG.maxParticles},()=>{const node=document.createElement('i');node.className='atmo-particle';field.append(node);return node;});
  let lastZone=-1;
  function lifecycle(){
    const enabled=desktop.matches&&!reduced.matches&&!root.classList.contains('hw-lite')&&root.dataset.screenEffects!=='off'&&root.classList.contains('hw-game-active');
    const mode=!enabled?'static':document.hidden||frame.inert?'paused':'active';
    if(arena.dataset.atmosphere!==mode)arena.dataset.atmosphere=mode;
  }
  function configure(force=false){
    const zone=Number(arena.className.match(/\bzone-(\d+)\b/)?.[1]||0),c=ATMOSPHERE_CONFIG.regions[zone];
    if(!c)return;
    if(force||zone!==lastZone){
      lastZone=zone;const p=c.particle;
      const values={'atmo-fog-travel':(c.fogTravelRem??ATMOSPHERE_CONFIG.fogTravelRem)+'rem','atmo-fog-color':c.fogColor,'atmo-fog-back':c.fogBack,'atmo-fog-ground':c.fogGround,'atmo-fog-ms':c.fogMs+'ms','scene-light':c.lightColor,'atmo-light-min':c.lightMin,'atmo-light-max':c.lightMax,'atmo-light-ms':c.lightMs+'ms','atmo-color':p.color,'atmo-particle-opacity':p.opacity,'atmo-particle-ms':p.durationMs+'ms','atmo-particle-steps':ATMOSPHERE_CONFIG.particleSteps,'atmo-fade-steps':Math.round(ATMOSPHERE_CONFIG.particleSteps*.15),'atmo-core-steps':Math.round(ATMOSPHERE_CONFIG.particleSteps*.70),'atmo-fog-steps':ATMOSPHERE_CONFIG.fogSteps,'atmo-light-steps':ATMOSPHERE_CONFIG.lightSteps};
      for(const [key,value]of Object.entries(values))arena.style.setProperty('--'+key,String(value));
      field.dataset.type=p.type;
      const count=Math.min(particles.length,Math.max(0,Math.floor(Number(p.count)||0)));
      arena.dataset.ambientParticleCount=String(count);
      particles.forEach((node,i)=>{
        node.hidden=i>=count;
        node.style.left=((i*19+zone*13+7)%96)+'%';node.style.top=p.rise?'78%':'12%';
        node.style.width=node.style.height=p.sizeRem+'rem';
        node.style.setProperty('--mote-dx',((i%3-1)*(p.sideRem??ATMOSPHERE_CONFIG.particleSideRem))+'rem');node.style.setProperty('--mote-dy',((p.rise?-1:1)*(p.travelRem??ATMOSPHERE_CONFIG.particleTravelRem))+'rem');
        // Phase offsets are whole timing steps so sparse particles update together.
        node.style.setProperty('--mote-delay',-(i*17%ATMOSPHERE_CONFIG.particleSteps)*p.durationMs/ATMOSPHERE_CONFIG.particleSteps+'ms');
      });
    }
    lifecycle();
  }
  new MutationObserver(()=>configure()).observe(arena,{attributes:true,attributeFilter:['class']});
  new MutationObserver(lifecycle).observe(root,{attributes:true,attributeFilter:['class','data-screen-effects','data-combat-idle-paused']});
  new MutationObserver(lifecycle).observe(frame,{attributes:true,attributeFilter:['inert']});
  for(const media of [desktop,reduced])media.addEventListener('change',lifecycle);
  document.addEventListener('visibilitychange',lifecycle);
  document.addEventListener('hellward:atmosphere-refresh',()=>configure(true));
  window.addEventListener('pageshow',lifecycle);
  window.addEventListener('pagehide',()=>{arena.dataset.atmosphere='paused';});
  configure();
})();
```

## world-fx.css completo

```css
/* Atmosphere stays below characters and HUD in the Step 0 slots. */
.atmo-fog,.atmo-particles{position:absolute;pointer-events:none;user-select:none;display:none}
.atmo-fog-back{inset:32% -2% 27%;background:radial-gradient(ellipse at 18% 60%,rgb(var(--atmo-fog-color)/var(--atmo-fog-back)),transparent 70%),radial-gradient(ellipse at 82% 70%,rgb(var(--atmo-fog-color)/var(--atmo-fog-back)),transparent 72%)}
.atmo-fog-ground{inset:68% -2% 0;background:radial-gradient(ellipse at 25% 74%,rgb(var(--atmo-fog-color)/var(--atmo-fog-ground)),transparent 73%),radial-gradient(ellipse at 78% 84%,rgb(var(--atmo-fog-color)/var(--atmo-fog-ground)),transparent 75%)}
.atmo-particles{inset:0;overflow:hidden}
.atmo-particle{position:absolute;display:block;background:rgb(var(--atmo-color));border-radius:50%;opacity:0;pointer-events:none}
.atmo-particles[data-type=leaf] .atmo-particle{border-radius:0;clip-path:polygon(0 45%,75% 0,100% 70%,30% 100%)}
.atmo-particles[data-type=soul] .atmo-particle{border-radius:0;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
.atmo-particles[data-type=snow] .atmo-particle{border-radius:0}
html.hw-game-active #battlefield:is([data-atmosphere=active],[data-atmosphere=paused]) .atmo-fog,html.hw-game-active #battlefield:is([data-atmosphere=active],[data-atmosphere=paused]) .atmo-particles{display:block}
html.hw-game-active #battlefield:is([data-atmosphere=active],[data-atmosphere=paused]) .atmo-fog,html.hw-game-active #battlefield:is([data-atmosphere=active],[data-atmosphere=paused])[data-scene-has-mist] [data-scene-layer=mist]>.scene-assets{animation:hw-fog-drift var(--atmo-fog-ms) steps(var(--atmo-fog-steps),end) infinite alternate!important}
html.hw-game-active #battlefield:is([data-atmosphere=active],[data-atmosphere=paused]) .atmo-fog-ground{animation-direction:alternate-reverse!important}
html.hw-game-active #battlefield:is([data-atmosphere=active],[data-atmosphere=paused]) .arena-lighting{animation:hw-regional-light var(--atmo-light-ms) steps(var(--atmo-light-steps),end) infinite!important}
html.hw-game-active #battlefield:is([data-atmosphere=active],[data-atmosphere=paused]) .atmo-particle:not([hidden]){animation:hw-mote-drift var(--atmo-particle-ms) steps(var(--atmo-particle-steps),end) var(--mote-delay,0ms) infinite!important}
html.hw-game-active #battlefield[data-atmosphere=paused] .atmo-fog,html.hw-game-active #battlefield[data-atmosphere=paused] .arena-lighting,html.hw-game-active #battlefield[data-atmosphere=paused] .atmo-particle:not([hidden]),html.hw-game-active #battlefield[data-atmosphere=paused][data-scene-has-mist] [data-scene-layer=mist]>.scene-assets{animation-play-state:paused!important}
#battlefield[data-atmosphere=static] :is(.atmo-fog,.atmo-particles){display:none!important}
@keyframes hw-fog-drift{from{transform:translateX(calc(var(--atmo-fog-travel) * -1))}to{transform:translateX(var(--atmo-fog-travel))}}
@keyframes hw-regional-light{0%,100%{opacity:var(--atmo-light-min)}50%{opacity:var(--atmo-light-max)}}
@keyframes hw-mote-drift{0%{opacity:0;transform:translate(0,0);animation-timing-function:steps(var(--atmo-fade-steps),end)}15%{opacity:var(--atmo-particle-opacity);transform:translate(calc(var(--mote-dx) * .15),calc(var(--mote-dy) * .15));animation-timing-function:steps(var(--atmo-core-steps),end)}85%{opacity:var(--atmo-particle-opacity);transform:translate(calc(var(--mote-dx) * .85),calc(var(--mote-dy) * .85));animation-timing-function:steps(var(--atmo-fade-steps),end)}100%{opacity:0;transform:translate(var(--mote-dx),var(--mote-dy))}}
/* The only sprite motion added here is a two-pixel entry; no scale/rotation. */
.encounter-death{position:absolute;pointer-events:none;z-index:10}
.encounter-death img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;image-rendering:pixelated!important}
.encounter-death .mob-shadow{z-index:-1}
.battlefield.encounter-hold .attack-target{opacity:0!important}
.battlefield.encounter-hold .mob-info .hp-track{visibility:hidden}
.encounter-intro,.encounter-curtain,.expedition-receipt{position:absolute;z-index:15;left:clamp(1rem,8%,7rem);top:32%;width:min(35%,25rem);color:#f3dfbf;background:#110e10ed;border:1px solid #8a6745;box-shadow:inset 0 0 0 .18rem #1c1615;padding:.8rem 1rem;text-align:center;pointer-events:none;text-shadow:0 .0625rem .125rem #000}
.encounter-intro small,.encounter-curtain small,.expedition-receipt small{display:block;color:#c5ab87;font:700 .75rem/1.4 Georgia,serif;letter-spacing:.05em}
.encounter-intro strong,.encounter-curtain strong,.expedition-receipt strong{display:block;margin:.25rem 0;font:700 clamp(1rem,1.8vw,1.5rem)/1.2 var(--hud-title-font,Georgia),serif}
.encounter-intro span,.expedition-receipt p{font:.8125rem/1.4 Georgia,serif;margin:.3rem 0}
.encounter-curtain{top:38%;background:linear-gradient(90deg,#100d0df5,#241817ed,#100d0df5)}
.expedition-receipt{top:30%;width:min(38%,28rem);pointer-events:auto}
.expedition-receipt button{margin-top:.5rem;padding:.4rem 1rem;min-height:2rem;background:#251a16;color:#ffe6b7;border:1px solid #9b754c;font:700 .8125rem/1.3 Georgia,serif;cursor:pointer}
.expedition-receipt button:focus-visible{outline:2px solid #e6bd7c;outline-offset:2px}
html.hw-game-active .battlefield:is(.elite-fight,.miniboss-fight,.boss-fight) .monster-aura{display:block!important;inset:0;filter:none!important;opacity:var(--encounter-aura-opacity,.5);z-index:0;background:radial-gradient(ellipse 45% 9% at 50% 94%,rgb(var(--encounter-aura-color)/var(--encounter-aura-core)),transparent 80%),radial-gradient(ellipse 38% 50% at 50% 60%,rgb(var(--encounter-aura-color)/var(--encounter-aura-halo)),transparent 75%);border:0;animation:none!important}
html.hw-game-active .battlefield.miniboss-fight .monster-aura{background:radial-gradient(ellipse 42% 8% at 50% 94%,rgb(var(--encounter-aura-color)/var(--encounter-aura-core)),transparent 80%),radial-gradient(ellipse 40% 50% at 50% 60%,rgb(var(--encounter-aura-color)/var(--encounter-aura-halo)),transparent 75%)}
html.hw-lite .battlefield .monster-aura,html[data-screen-effects=off] .battlefield .monster-aura{display:none!important}
@media(max-width:999px),(max-height:599px){.encounter-intro,.encounter-curtain{display:none!important}.expedition-receipt{left:5%;top:32%;width:90%}}
@media(prefers-reduced-motion:reduce){.atmo-fog,.atmo-particles{display:none!important}.arena-lighting{animation:none!important}.scene-assets{animation:none!important;transform:none!important}}

.phase-transition-veil{position:absolute;inset:0;z-index:9;pointer-events:none;opacity:0;background:linear-gradient(90deg,#100b16a6,#100b1644,#100b16a6)}
```

Referências atualizadas em `index.html`:

```html
  <script src="game.js?v=29" defer></script>
  <script src="world-atmosphere.js?v=2" defer></script>
  <link rel="stylesheet" href="world-fx.css?v=2">
```
