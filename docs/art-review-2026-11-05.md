# Revisão visual de HELLWARD — 05/11/2026

As fichas de criaturas agora começam com conteúdo novo em cada abertura. A mesma criatura pode ser fechada e reaberta sem acumular retratos ou informações. Arena, bestiário e ficha usam a mesma imagem canônica.

Foram revisados os 42 monstros e todas as demais imagens do projeto. Foram refeitos 31 monstros: 24 tinham apenas 192 × 192 pixels e outros sete precisavam de uma interpretação mais sombria. As imagens substitutas têm transparência real e resolução de 512, 768 ou 1024 pixels, conforme o porte. Os 11 sprites já adequados foram mantidos, incluindo o Imperador colossal. Os 31 PNGs substituídos e o antigo fallback SVG do Espectro foram removidos.

Os seis territórios receberam novos cenários pintados e cada chefão ganhou uma arena distinta, construída a partir da arte da sua região. Criaturas comuns e minibosses compartilham o cenário regional. A troca do chefão usa a classe já existente no combate, sem novos timers ou animações. Há versões WebP de 1280 × 720 para desktop e 720 × 405 para celular. As prévias da aba Regiões também usam a arte nova.

| Região | Arena de chefão |
| --- | --- |
| Campos de Cinza | Pátio de execução do Cavaleiro Decapitado |
| Bosque Profanado | Altar alagado da Hidra Profanada |
| Criptas Afogadas | Sepulcro real do Rei Lich |
| Fortaleza de Ferro | Salão de julgamento do Cavaleiro do Abismo |
| Fendas Infernais | Caldeira do Dragão das Fendas |
| Trono do Crepúsculo | Santuário imperial do Imperador do Crepúsculo |

A moldura dos eventos foi refeita com o exterior transparente. O painel interno escuro e os ornamentos permanecem; o retângulo preto externo foi eliminado. As URLs receberam novas versões para atualizar o cache dos jogadores.

## Validação

- `tools/check-assets.cjs`: 95 assets ativos, sem referências ausentes ou arquivos órfãos.
- `tools/check-sprites.cjs`: 42 sprites canônicos com transparência e resolução adequada; 89 imagens raster verificadas, sem duplicações por bytes ou pixels decodificados.
- `tests/regions-art.cjs`: 42 fichas abertas três vezes, retrato e texto únicos; troca de cenários comuns/minibosses/chefões em seis regiões e quatro tamanhos de tela; 24 arquivos de cenário válidos.
- `tests/combat-events.cjs`: transparência externa, eventos no desktop/celular/paisagem, dano, recompensa, tecla Q e seleção por toque.
- `tests/content-art.cjs`, `tests/hud-browser.cjs`, `tests/gameplay-inventory.cjs` e `tests/balance.cjs`: enquadramento, hierarquia de porte, itens, status, progressão, exportação/importação e persistência de saves.

O teste de fichas foi executado também sobre a versão anterior e reproduziu a falha: dois retratos na segunda abertura do primeiro monstro. A versão corrigida passou nas 42 fichas. As capturas de celular e paisagem foram revisadas visualmente.

O inventário detalhado está em `sprite-review.json`; a associação entre regiões, chefões e arquivos está em `region-backgrounds.json`. Os prompts de criação estão em `art-prompts.json`. Os resultados completos de desempenho estão em `performance-art-review.json`.


## Desempenho e pendências

Foram medidas 40 situações por versão: menu, combate, eventos, painéis, caça e criaturas de todas as regiões, incluindo os seis chefões. Chromium headless com renderização SwiftShader; desktop em 1366 × 768 com CPU normal e celular em 390 × 844 com CPU limitada em 6×. Cada amostra dura cinco segundos. Os testes rodaram em sequência, após as verificações funcionais e o processamento das imagens.

| Ambiente | Versão anterior: mínimo / mediana / máximo | Integração: mínimo / mediana / máximo |
| --- | --- | --- |
| Desktop | 49 / 60 / 60 FPS | 51 / 60 / 60 FPS |
| Celular simulado, CPU 6× | 8 / 35 / 59 FPS | 4 / 55 / 60 FPS |

A comparação automática **não passou** no limite de 3 FPS / 5 ms de p95 em oito situações. Repetimos três vezes os casos Entorpecido de Musgo, Devorador de Estrelas e Imperador, com 750 ms de aquecimento por amostra. Musgo e Devorador de Estrelas voltaram a 55–60 FPS na integração; o Imperador variou de 7 a 60 FPS na versão anterior e de 14 a 58 FPS na integração, usando o mesmo sprite do chefão. Essa variabilidade impede atribuir um resultado estável ao celular ou garantir ausência de regressão.

A integração das artes e as correções funcionais estão concluídas. **Ficam pendentes o perfil de desempenho em um telefone real e a investigação de memória/cache de imagens e dos tempos de quadro do chefão final.** O relatório preserva os resultados baixos e as falhas da comparação; não há garantia de 60 FPS em hardware real.
