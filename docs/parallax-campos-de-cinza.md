# Parallax de teste — Campos de Cinza

Integração sobre a versão atual da `main`, preservando as camadas, as artes e os efeitos de combate/ambiente já publicados. O parallax fica limitado à região de índice 0, inclusive seu fundo de chefão. As outras cinco regiões não recebem movimento de câmera.

O cenário acompanha suavemente o ponteiro do mouse. Fundo, névoa, luz e primeiro plano usam velocidades diferentes. Os atores e o HUD não recebem esse transform. O shake existente continua no contêiner pai `arenaCamera`; a animação de névoa existente continua nos filhos dos planos, sem conflito entre transforms.

## Arquivos

- `scene-layers.js`: configuração `FX_CONFIG.parallax` e controlador de eventos; aproveita a configuração de arte e o carregador atuais.
- `scene-layers.css`: transform dos planos e margem relativa para evitar bordas vazias.
- `index.html`: versões de cache e descrição do controle de efeitos já existente.
- `tests/parallax.cjs`: novo teste de movimento, isolamento das regiões e preferências.
- `docs/parallax-campos-de-cinza.md`: este registro.

`game.js`, `game-hud.js`, saves, dano, recompensas, artes, efeitos de combate e ambiente não foram substituídos ou modificados.

## Configuração

No topo de `scene-layers.js`:

```js
const FX_CONFIG = {
  parallax: {enabled:true, regions:[0], horizontalPercent:1.8, verticalPercent:.9,
    overscanPercent:4, transitionSeconds:.55, middleSpeed:.65, groundSpeed:.8}
};
```

A configuração também é exposta em `window.HELLWARD_PARALLAX_CONFIG`. As velocidades das imagens de Campos de Cinza ficam em `SCENE_CONFIG.regions[0]`: distante 0.45, névoa 1.3 e primeiro plano 1.6. Os planos de luz/chão e meio usam os valores de apoio acima.

Somente planos de cenário se movem. CSS interpola o `transform`; um único `requestAnimationFrame` pendente agrupa eventos de ponteiro. Não há loop de câmera com o mouse parado, partículas adicionais ou blur adicional. A geometria é lida ao entrar na arena, redimensionar ou reativar a cena, nunca no callback de frame.

O efeito respeita o controle existente **Configurações → Aparência → Efeitos de tela**, `prefers-reduced-motion`, modo leve e tipo de entrada. Pausa com aba oculta, menu ou painel aberto. Retorna ao centro quando o mouse sai. Fica desativado sem mouse preciso ou em janela abaixo de 48rem; o trabalho de celular continua adiado.

## Como testar

1. Abra o jogo no computador e inicie/continue em Campos de Cinza.
2. Mova o mouse entre os lados da arena e entre cima/baixo: os planos devem acompanhar com intensidades diferentes, sem deslocar atores ou HUD e sem expor bordas.
3. Tire o mouse da arena para conferir o retorno ao centro.
4. Desligue/ligue **Efeitos de tela** para comparar; a preferência existente continua persistente após recarregar.
5. Ative movimento reduzido ou oculte a aba: o parallax deve parar. Ao retomar, começa centrado.
6. Viaje ao Bosque Profanado e às demais regiões desbloqueadas: o ponteiro não deve deslocar seus planos. Volte a Campos de Cinza para reativar o teste.
7. Confira ataques comuns/críticos e o chefão: o shake existente e os efeitos de impacto devem continuar funcionando.

## Verificação

Passaram `balance.cjs`, `parallax.cjs`, `hud-browser.cjs`, `scene-layers.cjs`, `world-fx.cjs` e `combat-events.cjs`. Os testes de camadas também conferem fallback, carregamento tardio e geometria dos atores/HUD em todas as regiões e tipos de encontro. O teste de ambiente confirma que a economia, o loot, a progressão e as chaves do save seguem iguais à referência.

```bash
DESKTOP_ONLY=1 node tests/parallax.cjs
DESKTOP_ONLY=1 node tests/hud-browser.cjs
DESKTOP_ONLY=1 node tests/scene-layers.cjs
DESKTOP_ONLY=1 node tests/world-fx.cjs
DESKTOP_ONLY=1 node tests/combat-events.cjs
node tests/balance.cjs
```

Use `CHROMIUM_PATH` quando necessário para selecionar o Chromium instalado.

## Desempenho

Chromium 153 headless, desktop 1366×768, amostras de cerca de 5 segundos no mesmo ambiente. Baseline capturada antes das alterações; comparação final isolada, com `PERF_DEVICE=desktop PERF_HUNT=1`. A tolerância existente é de 3 FPS e 5 ms de p95. Estes resultados não garantem FPS em outros equipamentos.

| Cena | FPS antes → depois | p95 antes → depois (ms) |
| --- | --- | --- |
| menu | 60 → 60 | 16.7 → 16.8 |
| battle-idle | 60 → 60 | 16.7 → 16.8 |
| battle-attacks | 60 → 60 | 16.7 → 16.7 |
| codex-idle | 60 → 60 | 16.8 → 16.7 |
| hunt-attacks | 60 → 60 | 16.7 → 16.7 |
| menu-return | 60 → 60 | 16.7 → 16.7 |

Amostra adicional com parallax em movimento, recebendo eventos de ponteiro a cada 33 ms: **60 FPS**, **p95 16.7 ms**.
