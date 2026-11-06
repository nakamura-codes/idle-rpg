# Conclusão do Passo 0 — seis regiões

Esta alteração completa a configuração e as garantias de empilhamento/fallback do Passo 0 e, conforme a confirmação do usuário, expande o parallax para as seis regiões. A implementação usa somente as artes e a atmosfera já existentes. Não foram criadas novas imagens nem separados artificialmente objetos dentro das pinturas atuais.

## Entrega

| Requisito | Resultado |
| --- | --- |
| Sete contêineres | Distante, meio, chão, névoa, personagens, primeiro plano e efeitos continuam presentes em todas as regiões |
| Personagens acima do cenário | O primeiro plano fica abaixo da camada de personagens; barras, eventos e efeitos continuam acima |
| Configuração das seis regiões | `SCENE_LAYERS`, exposto também em `window.SCENE_LAYERS`, aponta para as mesmas entradas usadas por `SCENE_CONFIG.regions` |
| Campos por camada | `id`, `file`, `depth`, `parallaxSpeed`, `blur` e `opacity`; `slot` e `src` continuam como aliases compatíveis |
| Camadas sem arte | Entrada com `file: null`; nenhuma tentativa de carregamento |
| Desfoque | `blur` é metadado da imagem exportada; nenhum filtro CSS de blur é aplicado pelo carregador |
| Falha | Volta ao fundo inteiro atual, sem manter imagens opcionais parciais; proteção contra resposta atrasada e timeout continuam |
| Parallax aprovado | Ativo nas seis regiões no desktop; respeita o interruptor existente, movimento reduzido, aba oculta, painel aberto e modo leve |
| Desempenho | CSS transforma planos; um único RAF agrupa eventos de mouse; sem loop contínuo de câmera com o ponteiro parado |
| Gameplay | `game.js`, dano, recompensas, inventário, progressão e formato de save não foram alterados |

Cada região tem cinco entradas de arte: `distant`, `middle`, `ground`, `mist` e `foreground`. O fundo original é a imagem distante. Campos de Cinza mantém os PNGs de névoa e primeiro plano já existentes para encontros comuns/miniboss no desktop. As outras regiões e os chefões continuam com os fundos já disponíveis, junto da luz/névoa ambientais existentes. As entradas sem PNG ficam preparadas com `null`.

As imagens se encaixam no contêiner com porcentagens. A margem de primeiro plano que era `-3px` passa a `-.1875rem`. Os sprites preservam as regras atuais de `image-rendering: pixelated` e não recebem os transforms de câmera.

## Configuração compatível

`SCENE_LAYERS` e `SCENE_CONFIG.regions` compartilham as mesmas entradas, sem renomear a API existente. Dentro de cada camada, `slot` lê/escreve `id`, e `src` lê/escreve `file`. Editar qualquer um dos pares atualiza o mesmo valor. O save do jogo não contém essas configurações.

Os campos públicos podem ser usados assim:

```js
const layer = window.SCENE_LAYERS[1].layers.find(layer => layer.id === 'mist');
layer.file = 'assets/backgrounds/layers/minha-nevoa-do-bosque.png';
layer.blur = 0; // valor já incorporado à imagem; não liga um filtro em tempo real
layer.opacity = .28;
document.dispatchEvent(new Event('hellward:scene-layers-refresh'));
```

Use PNG/WebP local e o mesmo enquadramento/dimensões das outras imagens da composição. `depth` ordena imagens dentro do seu plano; a ordem dos planos permanece fixa para proteger os atores e a interface.

`FX_CONFIG.parallax.regions: null` significa todas as regiões cadastradas. Assim, uma nova entrada de cenário usa o mesmo montador e movimento sem novos seletores ou condições de renderização. Se quiser voltar a uma seleção, use um array de índices, como `[0]`. `enabled: false` desliga o parallax inteiro. Amplitudes, margem, duração e velocidades continuam ajustáveis na configuração.

## Como testar

1. Recarregue o jogo e visite Campos de Cinza e Bosque Profanado. Mova o mouse nos dois e confirme velocidades diferentes entre cenário e névoa/luz, com atores e HUD fixos. Repita nas demais regiões desbloqueadas.
2. Vá até as extremidades da arena: não deve aparecer faixa vazia. Tire o mouse da arena: o cenário retorna ao centro.
3. Abra Configurações → Aparência → Efeitos de tela e desative. O parallax para em todas as regiões. Movimento reduzido e modo leve também prevalecem; aba oculta e painel aberto pausam o efeito.
4. Confira a escala de minichefes/chefes, ataques comuns/críticos, cura, fases, equipamentos e seu save normalmente.

### Com e sem arquivos, em duas regiões

Faça os testes de falha em uma cópia local, com o cache desabilitado antes de recarregar.

| Região | Com arquivo | Sem arquivo |
| --- | --- | --- |
| Campos de Cinza | Os PNGs atuais carregam: `data-scene-mode="layered"`, três imagens | Renomeie temporariamente um PNG opcional: `fallback`, zero imagens opcionais; fundo CSS original visível |
| Bosque Profanado | Por padrão é `single`, uma imagem inteira; para testar composição, atribua um PNG 1280×720 ao `file` da camada `mist` e recarregue: `layered` | Com essa camada configurada, renomeie seu arquivo: `fallback`, sem composição parcial |

Para um teste descartável do Bosque, pode-se apontar a camada para o PNG existente de névoa de Campos de Cinza, apenas como fixture; isso não foi atribuído à região em produção. Volte o `file` a `null` após o teste. Sem arte configurada, nenhuma URL opcional é requisitada.

Erros de carga são tratados sem exceção de aplicação ou `console.error`. O navegador ainda pode registrar seu próprio HTTP 404 quando uma URL configurada não existe; esse diagnóstico de rede não pode ser apagado pelo carregador. Esta é a mesma limitação já registrada na entrega inicial.

## Testes executados

- `balance.cjs`: combate, loot, progressão, limites offline e migração de save.
- `parallax.cjs`: seis regiões em movimento, velocidades independentes, atores fixos, margens, pausa, preferências e ausência de trabalho contínuo.
- `scene-layers.cjs`: seis configurações completas, aliases, arte/falha em Campos e Bosque, fallback, timeout, dimensões, respostas tardias e primeiro plano opaco abaixo de atores/HUD/dano.
- `hud-browser.cjs`: controles, saves, importação/exportação, regiões e enquadramentos desktop.
- `world-fx.cjs`: atmosfera e encontros existentes; economia/progresso/chaves de save idênticos à referência.
- `combat-events.cjs`: ataque, cura, eventos, recompensas e teclado.

Todos passaram. Os testes de navegador foram executados com `DESKTOP_ONLY=1`. Testes em celular real e controles de toque permanecem para a rodada prevista.

## Arquivos alterados

- `scene-layers.js`
- `scene-layers.css`
- `index.html` (versões de cache)
- `tests/parallax.cjs`
- `tests/scene-layers.cjs`
- `docs/passo0-conclusao.md` (este documento)

## Desempenho

Mesmo ambiente, Chromium 153 headless, desktop 1366×768, amostras de aproximadamente 5 segundos. Comparação final isolada com `PERF_DEVICE=desktop PERF_HUNT=1`, usando a baseline capturada antes desta alteração. Tolerâncias existentes: 3 FPS e 5 ms de p95. Não é uma garantia de FPS em outros equipamentos.

| Cena | FPS antes → depois | p95 antes → depois (ms) |
| --- | --- | --- |
| menu | 60 → 60 | 16.7 → 16.8 |
| battle-idle | 60 → 60 | 16.7 → 16.7 |
| battle-attacks | 60 → 60 | 16.8 → 16.7 |
| codex-idle | 60 → 60 | 16.7 → 16.7 |
| hunt-attacks | 60 → 60 | 16.7 → 16.7 |
| menu-return | 60 → 60 | 16.7 → 16.7 |

Amostras adicionais com movimento de ponteiro a cada 33 ms:

| Região | FPS | p95 (ms) |
| --- | --- | --- |
| Campos de Cinza | 60 | 16.7 |
| Bosque Profanado | 60 | 16.8 |
| Criptas Afogadas | 60 | 16.7 |
| Fortaleza de Ferro | 60 | 16.7 |
| Fendas Infernais | 60 | 16.7 |
| Trono do Crepúsculo | 60 | 16.7 |

## Código completo do módulo de camadas

```js
/* Shared scene layers and configurable desktop parallax for every region. */
(() => {
  'use strict';
  const FX_CONFIG = {
    parallax: {enabled:true, regions:null, horizontalPercent:1.8, verticalPercent:.9,
      overscanPercent:4, transitionSeconds:.55, middleSpeed:.65, groundSpeed:.8}
  };
  // id/file are the public fields. slot/src remain compatible aliases so existing
  // configuration edits and integrations keep working without a save migration.
  function sceneLayer(spec) {
    const {slot,src,id=slot,file=src,...rest}=spec;
    const layer={id,file,...rest};
    Object.defineProperties(layer,{
      slot:{enumerable:true,get(){return this.id;},set(value){this.id=value;}},
      src:{enumerable:true,get(){return this.file;},set(value){this.file=value;}}
    });
    return layer;
  }
  const region = (slug, name, overlays = [], speed = .45) => {
    const base = `assets/backgrounds/fast/${slug}`;
    const layers = [
      {slot:'distant', src:base+'.webp?v=dark-14', bossSrc:base+'-boss.webp?v=dark-14',
        mobileSrc:base+'-mobile.webp?v=dark-14', bossMobileSrc:base+'-boss-mobile.webp?v=dark-14',
        depth:0, parallaxSpeed:speed, blur:0, opacity:1},
      ...overlays
    ];
    const reserved=[['middle',.25,.65],['ground',.4,.8],['mist',.5,1.3],['foreground',.9,1.6]];
    for(const [slot,depth,parallaxSpeed]of reserved){
      if(!layers.some(layer=>(layer.id??layer.slot)===slot))layers.push({slot,src:null,depth,parallaxSpeed,blur:0,opacity:1});
    }
    return {name,layers:layers.map(sceneLayer)};
  };
  const SCENE_CONFIG = {
    loadTimeoutMs:6000, cacheLimit:32,
    order:['distant','middle','ground','mist','characters','foreground','effects'],
    regions:[
      region('campos-de-cinza','Campos de Cinza',[
        {slot:'mist',src:'assets/backgrounds/layers/campos-de-cinza-mist.png',depth:.5,parallaxSpeed:1.3,blur:0,opacity:.28,desktopOnly:true,commonOnly:true},
        {slot:'foreground',src:'assets/backgrounds/layers/campos-de-cinza-foreground.png',depth:.9,parallaxSpeed:1.6,blur:0,opacity:.72,desktopOnly:true,commonOnly:true}
      ], .45),
      region('bosque-profanado','Bosque Profanado'),
      region('criptas-afogadas','Criptas Afogadas'),
      region('fortaleza-de-ferro','Fortaleza de Ferro'),
      region('fendas-infernais','Fendas Infernais'),
      region('trono-do-crepusculo','Trono do Crepúsculo')
    ]
  };
  // Both names reference the same regional entries; no existing integration is renamed.
  const SCENE_LAYERS=SCENE_CONFIG.regions;
  window.SCENE_LAYERS=SCENE_LAYERS;
  // Public configuration is independent of saves. null regions enables all configured entries.
  window.HELLWARD_SCENE_CONFIG = SCENE_CONFIG;
  window.HELLWARD_PARALLAX_CONFIG = FX_CONFIG.parallax;
  const arena = document.getElementById('battlefield');
  const small = matchMedia('(max-width:760px)');
  const slots = new Map(SCENE_CONFIG.order.map(slot => [slot, arena.querySelector(`[data-scene-layer="${slot}"]`)]));
  const effects = slots.get('effects');
  // Game creates the fixed spark pool before this deferred module runs.
  for(const spark of arena.querySelectorAll(':scope>.combat-spark'))effects.append(spark);
  const cache = new Map();
  let generation = 0, lastKey = '';
  const bounded = (n, min, max, fallback) => Number.isFinite(n) ? Math.max(min, Math.min(max,n)) : fallback;
  function load(src) {
    if(cache.has(src))return cache.get(src);
    // Local bundled artwork only. Nothing is read from imported save URLs.
    if(!/^assets\/backgrounds\/[a-z0-9_./-]+\.(png|webp)(\?[a-z0-9_=-]+)?$/i.test(src))return Promise.reject(new Error('invalid-path'));
    const pending = new Promise((resolve,reject) => {
      const image = new Image();
      const timer = setTimeout(() => finish(false),SCENE_CONFIG.loadTimeoutMs);
      let settled = false;
      function finish(ok) {
        if(settled)return;
        settled=true;clearTimeout(timer);image.onload=null;image.onerror=null;
        if(ok)resolve({width:image.naturalWidth,height:image.naturalHeight});
        else reject(new Error('missing-or-invalid-image'));
      }
      image.onload = () => image.decode().then(() => finish(true),() => finish(false));
      image.onerror = () => finish(false);
      image.src = src;
    });
    cache.set(src,pending);
    // Cache dimensions, not Image/DOM objects or decoded bitmap references.
    pending.catch(() => {if(cache.get(src)===pending)cache.delete(src);});
    while(cache.size>SCENE_CONFIG.cacheLimit)cache.delete(cache.keys().next().value);
    return pending;
  }
  function clearImages() {
    for(const slot of slots.values())slot.querySelector(':scope>.scene-assets')?.replaceChildren();
    delete arena.dataset.sceneHasMist;
    arena.dataset.sceneLayerCount='1';
  }
  function fallback(token, reason) {
    if(token!==generation)return;
    clearImages();arena.dataset.sceneMode='fallback';arena.dataset.sceneFailure=reason;
  }
  async function refresh(force=false) {
    const zone = Number(arena.className.match(/\bzone-(\d+)\b/)?.[1] || 0);
    const boss = arena.classList.contains('boss-fight');
    const key = `${zone}:${boss}:${small.matches}`;
    if(!force && key===lastKey)return;
    lastKey=key;const token=++generation;
    parallax.configure(zone);
    clearImages();arena.dataset.sceneMode='loading';delete arena.dataset.sceneFailure;
    const config=SCENE_CONFIG.regions[zone];
    if(!config){fallback(token,'missing-region');return;}
    const layers=config.layers.filter(layer => layer.src && (!layer.desktopOnly || !small.matches) && (!layer.commonOnly || !boss))
      .sort((a,b)=>a.depth-b.depth);
    if(!layers.length){fallback(token,'empty-config');return;}
    const selected=layers.map(layer => ({...layer,src:small.matches ? (boss ? layer.bossMobileSrc || layer.mobileSrc || layer.bossSrc || layer.src : layer.mobileSrc || layer.src) : boss ? layer.bossSrc || layer.src : layer.src}));
    try {
      for(const layer of selected)if(!slots.has(layer.slot) || ['characters','effects'].includes(layer.slot))throw new Error('invalid-slot');
      const sizes=await Promise.all(selected.map(layer => load(layer.src)));
      if(token!==generation)return;
      const first=sizes[0];
      if(sizes.some(size => size.width!==first.width || size.height!==first.height))throw new Error('mismatched-dimensions');
      for(const layer of selected){
        const image=document.createElement('img');
        image.className='scene-layer-image';image.alt='';image.draggable=false;image.decoding='async';
        image.dataset.depth=String(layer.depth);image.dataset.parallaxSpeed=String(layer.parallaxSpeed);image.dataset.blur=String(layer.blur);
        image.style.opacity=String(bounded(layer.opacity,0,1,1));
        // blur describes the exported artwork; never apply a real-time CSS blur.
        image.addEventListener('error',()=>fallback(token,'image-render-error'),{once:true});
        image.src=layer.src;
        slots.get(layer.slot).querySelector(':scope>.scene-assets').append(image);
      }
      arena.dataset.sceneMode=selected.length>1?'layered':'single';
      arena.dataset.sceneLayerCount=String(selected.length);
      if(selected.some(layer=>layer.slot==='mist'))arena.dataset.sceneHasMist='true';
    } catch(error) {fallback(token,error.message);}
  }
  function createParallax() {
    const c=FX_CONFIG.parallax,root=document.documentElement,frame=document.getElementById('appFrame');
    const reduced=matchMedia('(prefers-reduced-motion:reduce)');
    const desktop=matchMedia('(hover:hover) and (pointer:fine) and (min-width:48rem)');
    const planes=[...slots].filter(([slot])=>!['characters','effects'].includes(slot));
    let zone=-1,bounds=null,pending=0,x=0,y=0;
    arena.style.setProperty('--scene-parallax-overscan',c.overscanPercent+'%');
    arena.style.setProperty('--scene-parallax-duration',c.transitionSeconds+'s');
    function enabled(){
      return c.enabled&&(c.regions===null?Boolean(SCENE_LAYERS[zone]):c.regions.includes(zone))&&desktop.matches&&!reduced.matches&&
        document.visibilityState==='visible'&&!frame.inert&&root.classList.contains('hw-game-active')&&
        !root.classList.contains('hw-lite')&&root.dataset.screenEffects!=='off';
    }
    function center(){
      if(pending)cancelAnimationFrame(pending);
      pending=0;x=0;y=0;
      arena.style.removeProperty('--scene-parallax-x');arena.style.removeProperty('--scene-parallax-y');
    }
    // Bounds are read on entry/resize/lifecycle changes, never in the frame callback.
    function measure(){if(enabled())bounds=arena.getBoundingClientRect();}
    function sync(){
      const wasActive=arena.dataset.parallaxActive==='true',active=enabled();
      if(wasActive!==active||!arena.hasAttribute('data-parallax-active'))arena.dataset.parallaxActive=String(active);
      if(!active){center();bounds=null;}else if(!wasActive)measure();
    }
    arena.addEventListener('pointerenter',measure,{passive:true});
    arena.addEventListener('pointermove',event=>{
      if(event.pointerType!=='mouse'||!enabled()||!bounds?.width||!bounds?.height)return;
      x=Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1));
      y=Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1));
      if(pending)return;
      pending=requestAnimationFrame(()=>{
        pending=0;if(!enabled()){sync();return;}
        arena.style.setProperty('--scene-parallax-x',(-x*c.horizontalPercent).toFixed(3)+'%');
        arena.style.setProperty('--scene-parallax-y',(-y*c.verticalPercent).toFixed(3)+'%');
      });
    },{passive:true});
    arena.addEventListener('pointerleave',center,{passive:true});
    window.addEventListener('resize',()=>{center();sync();measure();},{passive:true});
    window.addEventListener('blur',center);
    window.addEventListener('pagehide',()=>{arena.dataset.parallaxActive='false';center();});
    document.addEventListener('visibilitychange',sync);
    document.addEventListener('hellward:screen-effects',sync);
    document.addEventListener('hellward:scenechange',sync);
    reduced.addEventListener('change',sync);desktop.addEventListener('change',sync);
    new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['class','data-screen-effects']});
    new MutationObserver(sync).observe(frame,{attributes:true,attributeFilter:['inert']});
    return {configure(value){
      zone=value;center();bounds=null;
      const layers=SCENE_CONFIG.regions[zone]?.layers||[];
      for(const [slot,node]of planes){
        const speed=layers.find(layer=>layer.slot===slot)?.parallaxSpeed??
          (slot==='middle'?c.middleSpeed:slot==='ground'?c.groundSpeed:0);
        node.style.setProperty('--scene-parallax-speed',String(speed));
      }
      sync();measure();
    }};
  }
  const parallax=createParallax();
  new MutationObserver(() => refresh()).observe(arena,{attributes:true,attributeFilter:['class']});
  small.addEventListener('change',()=>refresh());
  document.addEventListener('hellward:scene-layers-refresh',()=>refresh(true));
  refresh();
})();
```

## CSS completo das camadas

```css
/* Static scene slots. Existing whole regional background is always underneath. */
.scene-plane,.scene-assets{position:absolute;inset:0;pointer-events:none}
.scene-plane{animation:none!important;transform:none;transition:none;isolation:isolate}
.scene-assets{z-index:1}
.scene-layer-image{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;object-position:center center;pointer-events:none;user-select:none;animation:none!important;transition:none;transform:none;-webkit-user-drag:none}
.arena-camera>[data-scene-layer=distant]{z-index:0}
.arena-camera>[data-scene-layer=middle]{z-index:1}
.arena-camera>[data-scene-layer=ground]{z-index:2}
.arena-camera>[data-scene-layer=mist]{z-index:3}
#battlefield>.scene-characters{z-index:4}
.scene-characters>.attack-target{pointer-events:auto}
#battlefield>.scene-foreground{z-index:3;inset:-.1875rem}
#battlefield>.scene-effects{z-index:20}
#battlefield>.mob-info,#battlefield>.event-overlay,#battlefield>.hero-respawn{z-index:40!important}
#battlefield[data-scene-has-mist] .arena-mist{visibility:hidden}
/* Pointer parallax only moves scenery planes; camera shake and ambient child
   animations keep their existing transforms. Relative overscan prevents gaps. */
#battlefield[data-parallax-active=true] .scene-plane:is([data-scene-layer=distant],[data-scene-layer=middle],[data-scene-layer=ground],[data-scene-layer=mist],[data-scene-layer=foreground]){
 inset:calc(0% - var(--scene-parallax-overscan));
 transform:translate(calc(var(--scene-parallax-x,0%) * var(--scene-parallax-speed,0)),calc(var(--scene-parallax-y,0%) * var(--scene-parallax-speed,0)));
 transition:transform var(--scene-parallax-duration) ease-out;will-change:transform;
}
#battlefield[data-parallax-active=false] .scene-plane{transform:none;transition:none;will-change:auto}
@media(prefers-reduced-motion:reduce){#battlefield .scene-plane{transform:none!important;transition:none!important;will-change:auto!important}}
```
