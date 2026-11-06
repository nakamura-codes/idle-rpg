# Rodada 4 — itens 9 e 10

## Item 9: recompensas visuais

O saldo real continua sendo calculado e exibido imediatamente pelo jogo. A atualização ganha uma entrada discreta de opacidade e o contador pulsa quando o ícone chega. A animação nunca escreve saldos, concede recompensas ou agenda mudanças de número. Assim, gastar, importar um save, trocar de perfil ou abater inimigos rapidamente não deixa um valor antigo no HUD.

`round4.js` contém `FX_CONFIG`, exposto como `HELLWARD_ROUND4_CONFIG`. São 12 elementos reciclados, até quatro ícones por rajada, até dois por moeda, agrupamento de 85 ms e voo de 620 ms. A curva usa keyframes de transform/opacity; não existe loop de atualização por frame. Quando o pool está cheio, só os efeitos excedentes são descartados. Nenhuma recompensa é descartada. Almas e fragmentos seguem exclusivamente as regras já existentes (eventos, conversão de dez fragmentos e Ascensão); nenhum novo drop foi criado.

Ocultar a aba limpa voos e pulsos. Ao voltar não existe reprodução acumulada. Movimento reduzido, modo leve, painéis e “Efeitos de tela” desligado também suprimem os voos. Os valores continuam atuais.

Arquivos: `round4.js`, `round4.css`, três pontos de integração visual em `game.js` e carregamento em `index.html`.

### Como testar

1. Em Campos de Cinza, derrote inimigos e observe moedas em curva até Ouro e o pulso de chegada. Compare o saldo antes/depois de comprar uma melhoria durante os voos.
2. Vença eventos que dão fragmentos; ao completar dez, confira a conversão em alma e os dois destinos visuais. O jogo não passa a dar almas/fragmentos em todos os abates.
3. Abata vários inimigos rapidamente, troque de aba durante os voos e volte. O contador deve continuar correto, sem fila de animações. Repita com movimento reduzido e “Efeitos de tela” desligado.
4. `CHROMIUM_PATH=<chromium> DESKTOP_ONLY=1 node tests/round4.cjs` testa 240 abates, saldos exatos a cada abate, curva, conversão, gastos, reciclagem, troca de perfil e cancelamento por visibilidade.

## Item 10: profundidade e contato

As artes atuais foram preservadas. `node tools/build-round4.cjs` exporta 12 fundos distantes WebP (comum/chefe nas seis regiões, sigma 1,2) e um primeiro plano suavizado de Campos de Cinza (sigma 1,1). São imagens previamente processadas, sem `blur` em tempo real. Os originais continuam sendo o fallback. `round4-art.js` registra fontes, configurações e os contatos dos pés calculados pela transparência dos 43 sprites existentes.

Cada região combina fundo distante suavizado e chão nítido, com máscara gradual da imagem original. Não foram inventadas novas pinturas de objetos intermediários: as entradas de meio/primeiro plano continuam prontas para receber arte separada; Campos de Cinza mantém suas sobreposições existentes. Há duas poças/reflexos discretos, duas manchas, quatro pequenas pedras e duas fontes de brilho suave configuradas por região. A névoa e o mesmo pool de oito partículas agora são distribuídos atrás e à frente dos personagens, em velocidades diferentes.

As sombras se ajustam à largura real dos pés e à categoria do inimigo. Continuam presas aos personagens e não deslizam com o parallax. Nenhum sprite, escala de chefe, dano, loot, recompensa ou formato de save foi alterado. Sprites mantêm `image-rendering: pixelated`.

`scene-layers.js` reúne limites de parallax: ciclo CSS de 22 s, amplitude contínua de 0,16% horizontal/0,045% vertical multiplicada pela velocidade da camada; ponteiro de 1,1%/0,55%; impulsos de 0,055 rem no golpe, 0,13 rem no crítico e 0,18 rem na transição, também multiplicados pela velocidade da camada. Os impulsos cancelam os anteriores, com teto de uma animação de impulso por camada. Movimento reduzido e efeitos desligados centralizam e interrompem o cenário. Aba oculta e menus pausam os efeitos.

Arquivos: `scene-layers.js`, `world-atmosphere.js`, `round4.js`, `round4.css`, `round4-art.js`, `tools/build-round4.cjs`, `assets/backgrounds/depth/*.webp` (13), `docs/sprite-review.json`, `index.html` e testes/documentação.

### Como testar

1. Visite Campos de Cinza e Bosque Profanado. Mova o ponteiro devagar: fundo e chão devem se deslocar em proporções diferentes; observe também o movimento contínuo e a névoa nos dois planos. Os pés e suas sombras devem permanecer juntos.
2. Repita em chefes, incluindo o Imperador do Crepúsculo. Eles permanecem deliberadamente maiores que o herói. Dê golpes, críticos e avance uma fase: os impulsos são breves e pequenos, sem mover o HUD.
3. Temporariamente remova/renomeie `assets/backgrounds/depth/campos-de-cinza-far.webp`, recarregue e confira o fundo original e combate funcional. Restaure o arquivo. Repita com `bosque-profanado-far.webp` e depois restaure. Uma falha descarta o conjunto de imagens daquela região e mantém o fundo original. Erros de carregamento são tratados; o navegador pode registrar a própria requisição ausente na aba Rede.
4. Ligue movimento reduzido, desative efeitos, abra menus e oculte a aba. Não deve haver parallax ativo nem voos pendentes. O modo leve mantém os fundos originais.
5. Testes de estrutura cobrem seis regiões, chefes/minichefes, fallback ausente/incompatível/vazio, dimensões e respostas atrasadas. Testes de contato cobrem 42 inimigos e três resoluções de computador. Testes de combate verificam que golpes não acrescentam leituras de layout.

## Validação

Testes: `balance.cjs`, `combat-events.cjs`, `combat-idle.cjs`, `combat-impact.cjs`, `hud-browser.cjs`, `boss-scale.cjs`, `parallax.cjs`, `scene-layers.cjs`, `world-fx.cjs`, `regions-art.cjs`, `round4.cjs`, `check-assets.cjs` e `check-sprites.cjs`. A suíte visual é executada com `DESKTOP_ONLY=1`; celular e controles de toque permanecem para a rodada 5.

A comparação de desempenho usa a mesma configuração de antes/depois: `PERF_DEVICE=desktop PERF_ATMOSPHERE=1 PERF_TRANSITIONS=1 PERF_MONSTERS=1 PERF_EVENTS=1 PERF_HUNT=1`, 27 cenas (incluindo seis atmosferas, rajada de encontros e chefes gigantes). Chromium 153 headless a 1366×768 no mesmo ambiente: as 27 cenas mantiveram 60 FPS antes/depois; p95 entre 16.7 e 16.8 ms depois. A comparação passou nos limites de 3 FPS/5 ms, sem regressão material observada. Isto não é garantia de FPS em todo hardware.

| Cena | FPS antes/depois | p95 antes (ms) | p95 depois (ms) |
|---|---:|---:|---:|
| menu | 60 / 60 | 16.8 | 16.7 |
| battle-idle | 60 / 60 | 16.7 | 16.7 |
| battle-attacks | 60 / 60 | 16.8 | 16.7 |
| event-chest | 60 / 60 | 16.7 | 16.7 |
| event-goblin | 60 / 60 | 16.8 | 16.7 |
| atmosphere-region-0 | 60 / 60 | 16.7 | 16.8 |
| atmosphere-region-1 | 60 / 60 | 16.7 | 16.7 |
| atmosphere-region-2 | 60 / 60 | 16.7 | 16.7 |
| atmosphere-region-3 | 60 / 60 | 16.7 | 16.7 |
| atmosphere-region-4 | 60 / 60 | 16.7 | 16.7 |
| atmosphere-region-5 | 60 / 60 | 16.8 | 16.8 |
| encounter-burst | 60 / 60 | 16.8 | 16.7 |
| codex-idle | 60 / 60 | 16.7 | 16.7 |
| hunt-attacks | 60 / 60 | 16.8 | 16.7 |
| sprite-corrupted-swordsman | 60 / 60 | 16.8 | 16.7 |
| sprite-headless-knight-boss | 60 / 60 | 16.7 | 16.7 |
| sprite-moss-thrall | 60 / 60 | 16.7 | 16.8 |
| sprite-hydra-boss | 60 / 60 | 16.7 | 16.7 |
| sprite-drowned-wraith | 60 / 60 | 16.7 | 16.8 |
| sprite-lich-boss | 60 / 60 | 16.8 | 16.7 |
| sprite-rust-golem | 60 / 60 | 16.7 | 16.7 |
| sprite-abyss-knight-boss | 60 / 60 | 16.7 | 16.8 |
| sprite-incandescent-shadow | 60 / 60 | 16.8 | 16.7 |
| sprite-rift-dragon-boss | 60 / 60 | 16.7 | 16.7 |
| sprite-star-devourer | 60 / 60 | 16.7 | 16.7 |
| sprite-colossal | 60 / 60 | 16.7 | 16.7 |
| menu-return | 60 / 60 | 16.7 | 16.7 |

Base da comparação: `f819dedd13ad1984595aa4bf2a3f7f8a3103b254`. Comando final: `CHROMIUM_PATH=<chromium> PERF_DEVICE=desktop PERF_ATMOSPHERE=1 PERF_TRANSITIONS=1 PERF_MONSTERS=1 PERF_EVENTS=1 PERF_HUNT=1 PERF_BASELINE=<before.json> node tests/performance.cjs <after.json>`. O caso `encounter-burst` mantém ataques/abates a cada 130 ms para exercitar recompensas e transições em sequência.
