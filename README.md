# HELLWARD

RPG idle de fantasia sombria, em HTML/CSS/JavaScript, publicado no GitHub Pages.
Menu, combate, inventário, Livro Negro, ascensão e caça repetível funcionam sem
backend. Perfis e preferências ficam no navegador; há exportação/importação JSON.

## Executar localmente

Na raiz do projeto, execute `python -m http.server 8000` e abra
`http://localhost:8000`. O jogo publicado não precisa de instalação ou build.

## Fontes e arquivos gerados

- `index.html` declara os scripts e estilos ativos.
- `CATALOGO_ITENS.json` é a fonte editável dos 100 itens. O campo `imagem` aponta
  para o atlas atual; `icone_atlas` identifica sua célula.
- `item-catalog.js` é a versão gerada para o navegador.
- `CREATURES.json` documenta os 42 retratos atuais.
- `data/monster-proportions.json` define os portes e proporções dos monstros.
- `game-art.js` contém o mapa de atlas/retratos usado pelo jogo.
- `assets/backgrounds/fast/` e `assets/ui/` guardam os cenários e a HUD ativos.
- `assets/fonts/` inclui a fonte web e o original licenciado necessário para
  reconstruí-la. As ferramentas de geração ficam em `tools/`.

Após editar o catálogo ou os portes, rode `node tools/build-item-atlases.mjs` para
reconstruir `item-catalog.js` e `game-art.js`. Para gerar novas imagens de atlas,
consulte as entradas de imagem e os requisitos de Sharp descritos nessa ferramenta.
`python tools/build-dornen.py` recompila a fonte web com FontTools instalado.

## Verificação

```sh
node tools/check-assets.cjs
node tests/balance.cjs
node tests/hud-browser.cjs
node tests/gameplay-inventory.cjs
node tests/content-art.cjs
```

As suítes de navegador usam Playwright; a suíte de arte também usa Sharp.
`CHROMIUM_PATH` seleciona um Chromium local e `HUD_SCREENSHOTS` salva capturas.
O auditor verifica os recursos estáticos e dinâmicos, a sincronia dos catálogos e
os arquivos sem referência. Novos assets devem ter uma função declarada no projeto.

Capture FPS antes e depois das mudanças, no mesmo ambiente e sem outras suítes de
navegador competindo por CPU. O procedimento e o comparador estão em `AGENTS.md` e
`tests/performance.cjs`. Resultados anteriores e decisões de gameplay estão em `docs/`.

A limpeza de arquivos obsoletos está documentada em `docs/project-cleanup.md`.
O histórico Git preserva as versões anteriores; a limpeza reduz a árvore atual
e os arquivos publicados, sem reescrever o histórico.
