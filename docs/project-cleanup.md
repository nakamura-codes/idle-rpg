# Limpeza do projeto — 4 de novembro de 2026

Foram removidos **184 arquivos obsoletos**, totalizando **11.328.388 bytes**
(11,33 MB / 10,80 MiB) da árvore atual. O histórico Git permanece intacto.
Essa redução não equivale a 11 MB a menos em cada carregamento: boa parte dos
arquivos já não era solicitada pelo navegador. O objetivo é retirar duplicatas,
fontes antigas de recursos e código desativado sem alterar o jogo atual.

| Grupo removido | Arquivos | Bytes |
| --- | ---: | ---: |
| Estilos e scripts não importados | 7 | 22.315 |
| Cenários antigos e camadas de batalha | 36 | 6.804.141 |
| Herói PNG anterior ao WebP ativo | 1 | 1.243.217 |
| Nicho antigo da HUD | 1 | 1.880 |
| Ícones individuais anteriores aos atlas | 100 | 90.082 |
| Artes de menu anteriores ou duplicadas | 12 | 2.868.921 |
| Monstros SVG substituídos | 24 | 90.067 |
| Retratos substituídos | 3 | 207.765 |
| **Total** | **184** | **11.328.388** |

O inventário completo está em `cleanup-manifest.json`. Permanecem 81 assets,
incluindo o áudio, os cenários otimizados, 42 monstros, o fallback do espectro,
os atlas de itens/status, as ilustrações da HUD e o menu ativo. O original TTF
e sua licença foram preservados para permitir reconstruir a fonte web.

## Referências e manutenção

O auditor `node tools/check-assets.cjs` percorre os imports do HTML, URLs de
estilos, caminhos de scripts e os mapas dinâmicos de itens, status e monstros.
Ele verifica dependências ausentes, assets sem referência, estilos/scripts de
raiz não importados e a sincronia dos catálogos.

`CATALOGO_ITENS.json` passa a apontar para as células dos atlas já usados pelo
jogo. Seus 100 IDs, nomes e demais definições foram preservados. A ferramenta
`build-item-atlases.mjs` gera `item-catalog.js` a partir desse JSON e recompõe
o mapa `game-art.js`. `CREATURES.json` aponta para os retratos atuais do espectro
e do Imperador. A referência alternativa do Imperador foi alinhada ao mesmo
WebP colossal que já era utilizado em combate.

Foram retiradas referências CSS às camadas e ícones antigos. O menu continua
usando a pintura atual. As novas imagens fornecidas para uma proposta de
parallax não fazem parte desta publicação. Regras de combate, drops, regeneração,
inventário e salvamentos não foram alteradas.

## Verificação

- Auditor de assets: 81 arquivos ativos/de construção, nenhuma dependência
  ausente ou asset órfão; 100 itens e 42 metadados de criaturas consistentes.
- `tests/balance.cjs`: simulação determinística de 100 mil abates, cadência,
  regeneração, chefões, caça, migração e persistência aprovadas.
- `tests/hud-browser.cjs`: 13 tamanhos de tela, 42 monstros, painéis e ações de
  gameplay aprovados, sem erros JavaScript ou recursos ausentes.
- `tests/gameplay-inventory.cjs`: seis painéis em quatro formatos, equipamento,
  vendas, retorno offline e caça aprovados.
- `tests/content-art.cjs`: 100 ícones de itens, 12 de status, fallback legado,
  pontos em lote e proporções dos monstros aprovados.
- Capturas revisadas em celular estreito e paisagem; os ícones e o layout atual
  permanecem presentes. Reconstrução dos mapas e `git diff --check` aprovados.

### Desempenho

Benchmark isolado, Chromium headless/SwiftShader, amostras de 5 segundos por
cena. Desktop 1366×768 CPU 1×; celular 390×844 CPU limitada em 6×.
Dados completos em `cleanup-performance.json`.

| Cena | Desktop antes → depois | Celular 6× antes → depois |
| --- | ---: | ---: |
| Menu | 60 → 60 FPS | 60 → 60 FPS |
| Batalha sem cliques | 60 → 60 FPS | 60 → 60 FPS |
| Batalha com cliques | 60 → 60 FPS | 57 → 60 FPS |
| Livro Negro | 60 → 60 FPS | 60 → 60 FPS |
| Caça com cliques | 60 → 60 FPS | 58 → 59 FPS |
| Retorno ao menu | 60 → 60 FPS | 59 → 60 FPS |

O p95 dos frames permaneceu entre 16,7 e 16,8 ms. O comparador automático
aprovou a mudança; a comparação direta das 12 cenas também respeitou as
margens de 3 FPS/5 ms. Não houve regressão medida. Variações pequenas entre
amostras não comprovam um ganho causado pela limpeza, e estes resultados
não garantem FPS em todos os aparelhos.
