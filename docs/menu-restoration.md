# Restauração do menu anterior — 4 de novembro de 2026

Restaura a arte e a apresentação anteriores à PR #29, conforme solicitado pelo usuário.
Os dois fundos WebP, menu.css, menu.js e menu-fit.js coincidem byte a byte com
a revisão b081eaa. Remove os planos, o controlador, o estilo e a opção de parallax,
além das ferramentas e documentos exclusivos dessa implementação.

As URLs das imagens restauradas e a versão de game-hud.css foram atualizadas
para evitar que o navegador reaproveite o cenário rejeitado em cache. A limpeza
da PR #28 permanece. game.js continua idêntico à versão anterior; nenhum dado
de personagens, inventário ou progresso é apagado ou migrado por esta mudança.

Validação: auditor de assets (81 assets, sem dependências ausentes/órfãs), suíte
de HUD/navegação/perfis/exportação/importação, balanceamento e comparação FPS.

| Dispositivo | Cena | FPS antes → depois | p95 depois |
| --- | --- | ---: | ---: |
| desktop | menu | 60 → 60 | 16.8 ms |
| desktop | battle-idle | 60 → 60 | 16.7 ms |
| desktop | battle-attacks | 60 → 60 | 16.7 ms |
| desktop | codex-idle | 60 → 60 | 16.7 ms |
| desktop | hunt-attacks | 60 → 60 | 16.8 ms |
| desktop | menu-return | 60 → 60 | 16.7 ms |
| mobile-6x | menu | 60 → 60 | 16.8 ms |
| mobile-6x | battle-idle | 60 → 60 | 16.8 ms |
| mobile-6x | battle-attacks | 58 → 58 | 16.8 ms |
| mobile-6x | codex-idle | 60 → 60 | 16.7 ms |
| mobile-6x | hunt-attacks | 57 → 59 | 16.8 ms |
| mobile-6x | menu-return | 60 → 59 | 16.7 ms |

A primeira execução após a reversão registrou 55 FPS/p95 de 33,2 ms em uma
amostra de batalha com cliques no celular 6×. Uma segunda execução isolada
passou no comparador de 3 FPS/5 ms e na comparação direta das 12 cenas. Os dados
das três execuções estão em menu-restoration-performance.json. As amostras
curtas apresentam variação e não garantem FPS para todos os aparelhos.
