# Chefões e HUD de comandos

O tamanho anterior era limitado pela largura, pela altura máxima do alvo e pelas margens transparentes das imagens. A escala agora usa a silhueta visível. As margens transparentes dos seis chefões foram recortadas sem ampliar ou repintar a arte, preservando os pixels com WebP sem perdas. Os cinco primeiros chefões são gigantes, e o Imperador continua colossal. Os minibosses também recebem uma área maior de combate.

O Imperador ocupa 80–86% da altura da arena nos desktops testados e 71% em 390 × 844. Sua silhueta tem entre 3,67 e 4,98 vezes a altura visível do herói nos sete enquadramentos testados. Na tela curta de 320 × 568, o espaço reservado às informações limita a ocupação a 49%; não há recorte do personagem. Os chefões largos, como Hidra e Dragão, recebem uma área mais ampla e não ficam presos a um quadrado com espaço vazio.

A placa de nome e HP perdeu o preenchimento vermelho externo. O fundo escuro fica apenas dentro da moldura; o vermelho do preenchimento da barra continua indicando a vida. A moldura da HUD inferior agora envolve vitalidade, poção, Livro Negro, Ascensão, Mochila, Regiões e Crônicas. O antigo altar isolado foi removido, junto com sua imagem sem uso. A moldura nova usa uma imagem estática com nove fatias e não captura cliques.

## Validação

- `tests/boss-scale.cjs`: seis chefões em sete tamanhos de tela, limites da silhueta por alfa, ocupação absoluta da arena, proporção contra o herói, transparência da placa e acesso aos comandos.
- `tests/content-art.cjs`, `tests/hud-browser.cjs`, `tests/regions-art.cjs`, `tests/combat-events.cjs`, `tests/gameplay-inventory.cjs` e `tests/balance.cjs`: aprovados.
- `tools/check-assets.cjs` e `tools/check-sprites.cjs`: 95 assets ativos, 42 sprites canônicos e nenhum arquivo ausente, órfão ou duplicado por bytes/pixels.
- Capturas de desktop, telefone estreito e paisagem revisadas; nomes, vida e ações permanecem acessíveis.

Os dados de silhueta, hashes das imagens e prompt da moldura estão em `boss-command-hud.json`. Os resultados de desempenho desta alteração ficam em `performance-boss-command-hud.json`.

Não houve alteração de saves, progressão, itens, combate ou distribuição de pontos. A lógica de simulação continua com o mesmo timer; as mudanças visuais não acrescentam loops, filtros ou medições de layout por quadro.

## Desempenho

| Ambiente | Antes: mínimo / mediana / máximo | Depois: mínimo / mediana / máximo |
| --- | --- | --- |
| desktop | 25 / 60.0 / 60 | 29 / 57.5 / 60 |
| mobile-6x | 14 / 48.5 / 60 | 21 / 50.5 / 60 |

A comparação automática **failed**, com 14 situações fora da tolerância de 3 FPS / 5 ms de p95. O primeiro processo foi interrompido pela indisponibilidade do ambiente; o trecho completo de desktop foi preservado e as 20 amostras de celular foram repetidas após a recuperação. Os resultados brutos e o trecho interrompido estão no JSON. Há queda também no menu, que não foi alterado, mas isso não permite garantir ausência de regressão. A estabilidade em celular e a validação em aparelho real continuam pendentes.
