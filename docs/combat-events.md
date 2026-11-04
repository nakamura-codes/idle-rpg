# Eventos infernais e interação de combate

O baú e o goblin deixam de usar os SVGs esquemáticos embutidos em `game.js`.
As novas pinturas têm volume, madeira/metal envelhecidos, couro e luz de brasa.
O painel usa uma moldura de ferro negro com relevos de caveira e fissuras
vermelhas. Nomes, instruções, barra e cronômetro continuam sendo texto/DOM
separados, sem palavras embutidas nas imagens. O painel fica abaixo dos
cabeçalhos da região/inimigo, com composição compacta para celular/paisagem.

## Interação

A tecla Q pode ativar `:focus-visible` no último botão clicado. A moldura global
de foco contornava toda a caixa retangular do monstro. O alvo mantém o foco e
o ataque por Espaço/Enter; a indicação visual passa para a legenda sublinhada.
Os demais botões mantêm suas indicações de foco.

Seleção de texto, arraste de imagens, destaque nativo de toque e callout de
imagem ficam desativados apenas dentro da arena. Inputs e textos do restante
da interface continuam disponíveis. Não há cancelamento global de eventos de
toque, captura de ponteiros ou bloqueio do zoom do navegador.

## Recursos e desempenho

Três imagens WebP, aproximadamente 59 KiB no total:

- `assets/events/cursed-chest.webp`: 256 px, fundo transparente.
- `assets/events/treasure-goblin.webp`: 256 px, fundo transparente.
- `assets/events/infernal-reliquary.webp`: largura de 384 px, moldura pintada.

A ilustração só é substituída quando muda a identidade do evento. O contador
e a barra continuam com escritas de valores alterados no relógio existente de
100 ms. Não há novo loop, filtro animado, observador ou leitura de layout.
Drop, recompensas, duração e condições de vitória/expiração permanecem iguais.
O HTML invalida o cache de `game.js` e carrega o CSS específico da correção.

## Validação

`tests/combat-events.cjs` reproduz clique no monstro seguido de Q, verifica a
cura/consumo único, foco por teclado, ataque por Espaço, toques nativos
repetidos, ausência de seleção, duas ilustrações, limites das legendas,
recompensas, expiração e reutilização do mesmo sprite nos ticks. Também verifica
a ausência de sobreposição com cabeçalhos de chefes das regiões 1 e 6. Testa
1366×768, 320×568, 390×844, 667×375 e 844×390. As capturas são apenas QA.

O benchmark opcional `PERF_EVENTS=1` acrescenta baú e goblin com ataques aos
testes existentes. A instrumentação só existe na resposta interceptada pelo
teste; a versão publicada não exporta objetos de teste. Eventos de duração
ampliada são criados exclusivamente no teste para manter a cena constante.

As medições são Chromium headless com renderização por software, desktop
1366×768 CPU 1× e celular simulado 390×844 CPU 6×. Servem para comparação no
mesmo ambiente; não prometem FPS em todo hardware ou substituem um aparelho
físico. O resultado detalhado acompanha este documento em JSON.

## Direção das artes

Artes raster geradas para este projeto e reduzidas para uso na interface.
Brief do baú: madeira negra gasta, ferragens de bronze, fechadura de caveira,
interior com luz de brasa, três quartos, objeto inteiro e fundo transparente.
Brief do goblin: criatura encurvada, capuz/couro puídos, saco de ouro roubado,
silhueta legível em escala pequena, pintura sólida e fundo transparente.
Brief da moldura: relicário gótico frontal, ferro negro, bronze envelhecido,
relevo de caveira e fissuras vermelhas, interior escuro vazio, sem lettering.

Fontes originais das artes ficam fora do runtime; apenas os WebPs otimizados
são adicionados ao jogo.

O teste antigo de XP exigia largura mínima fixa de 25 px. Na revisão sem
alterações, o texto completo tinha 24 px em 1024×600 (fonte de 6 px) e disparava
um falso positivo. A asserção agora mantém o limite de tamanho de fonte e exige
que o texto caiba de fato no elemento. Não altera a HUD de XP publicada.

## Resultado da comparação

| Dispositivo | Cena | FPS antes → depois | p95 depois |
| --- | --- | ---: | ---: |
| desktop | menu | 60 → 60 | 16.7 ms |
| desktop | battle-idle | 60 → 60 | 16.7 ms |
| desktop | battle-attacks | 60 → 60 | 16.7 ms |
| desktop | event-chest | 60 → 60 | 16.7 ms |
| desktop | event-goblin | 60 → 60 | 16.8 ms |
| desktop | codex-idle | 60 → 60 | 16.8 ms |
| desktop | hunt-attacks | 60 → 60 | 16.7 ms |
| desktop | menu-return | 60 → 60 | 16.7 ms |
| mobile-6x | menu | 60 → 60 | 16.8 ms |
| mobile-6x | battle-idle | 60 → 60 | 16.8 ms |
| mobile-6x | battle-attacks | 59 → 59 | 16.7 ms |
| mobile-6x | event-chest | 60 → 60 | 16.7 ms |
| mobile-6x | event-goblin | 60 → 60 | 16.8 ms |
| mobile-6x | codex-idle | 59 → 59 | 16.8 ms |
| mobile-6x | hunt-attacks | 59 → 59 | 16.8 ms |
| mobile-6x | menu-return | 60 → 60 | 16.7 ms |

Comparação aprovada com tolerância de amostragem de 3 FPS / 5 ms no p95.
Suítes de interação/eventos, inventário e HUD aprovadas; a HUD foi revisada em
13 resoluções, além dos testes determinísticos de combate, loot e regeneração.
Auditoria: 84 assets ativos/de construção, sem recursos ausentes ou órfãos.
