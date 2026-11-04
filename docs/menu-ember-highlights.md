# Detalhes de brasa nos botões — 4 de novembro de 2026

Os seis botões do menu recebem detalhes quentes em repouso: a moldura vermelha
já existente é misturada à cinza com opacidade 0,42, preservando o metal escuro
e acrescentando cobre, vermelho e dourado. Ao passar o mouse ou selecionar por
teclado, a moldura quente fica totalmente visível. O texto usa marfim claro
(#f5dfb7), sombra escura curta e um reflexo quente discreto e estático.

A vinheta do cenário passa atrás dos controles. Antes, o z-index 3 a colocava
sobre a coluna do menu, reduzindo o contraste do título e dos botões. A arte do
cenário e sua composição são as mesmas. Não há novos assets, chamas, filtros,
loops ou animações; os estados dos botões mudam imediatamente. A versão do
menu.css no HTML foi atualizada para invalidar o cache.

Validação: auditor de assets (81 ativos/de construção, sem órfãos/ausências),
suíte de HUD/navegação/perfis e simulação determinística de balanceamento.
Revisão visual no navegador dos estados normal e selecionado por teclado.
O código e os dados de gameplay/saves não foram modificados.

## Desempenho

Benchmark isolado após os testes funcionais, com amostras de cinco segundos.
Desktop 1366×768 CPU 1×; celular 390×844 CPU 6×, Chromium headless/SwiftShader.

| Dispositivo | Cena | FPS antes → depois | p95 depois |
| --- | --- | ---: | ---: |
| desktop | menu | 60 → 60 | 16.7 ms |
| desktop | battle-idle | 60 → 60 | 16.8 ms |
| desktop | battle-attacks | 60 → 60 | 16.7 ms |
| desktop | codex-idle | 60 → 59 | 16.7 ms |
| desktop | hunt-attacks | 60 → 60 | 16.7 ms |
| desktop | menu-return | 60 → 60 | 16.8 ms |
| mobile-6x | menu | 60 → 60 | 16.7 ms |
| mobile-6x | battle-idle | 60 → 60 | 16.7 ms |
| mobile-6x | battle-attacks | 57 → 57 | 16.8 ms |
| mobile-6x | codex-idle | 60 → 60 | 16.7 ms |
| mobile-6x | hunt-attacks | 51 → 58 | 16.8 ms |
| mobile-6x | menu-return | 59 → 60 | 16.7 ms |

O comparador automático e a comparação direta das 12 cenas passaram nas
margens existentes de 3 FPS/5 ms. Dados completos em menu-ember-performance.json.
Amostras curtas variam e não garantem FPS em todos os aparelhos.
