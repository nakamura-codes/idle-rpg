# HUD infernal de Hellward

A arena e as informações essenciais ocupam uma única tela. Os painéis abrem sobre o combate e têm rolagem interna; o combate automático continua enquanto um painel está aberto. Os ataques manuais ficam restritos à arena descoberta.

| Relíquia | Atalho | Função |
| --- | --- | --- |
| Livro Negro | C | Status, pontos de atributo, melhorias com ouro e registro da jornada |
| Cálice dourado | A | Ascensão e árvore de habilidades permanentes |
| Mochila velha | I | Equipamentos, consumíveis, filtros e venda |
| Regiões | M | Viagem e bestiário |
| Crônicas | J | Informações do inimigo e registro de combate |
| Poção rápida | Q | Usa a menor dose capaz de restaurar a vida faltante; se não houver, usa a maior disponível |
| Engrenagem | Clique | Som, tema, exportação/importação de saves e lista de atalhos |

Escape ou o botão de fechar retorna à arena. O foco do teclado permanece no painel aberto e retorna ao atalho ao fechar. Confirmações de ascensão e importação aparecem sobre o painel. Os controles de som da engrenagem e do menu principal compartilham as preferências existentes. O rodapé foi removido da arena; salvar/importar continuam disponíveis nas configurações. A barra dos inimigos comuns fica alinhada à sua posição, com espaço reservado acima da silhueta; chefões usam uma barra central maior.

## Pontos do Livro Negro

Cada nível após o primeiro concede dois pontos. Força adiciona 2 de dano base por clique; Vontade adiciona 1 DPS base; Vitalidade adiciona 15 de vida máxima; Resistência adiciona 1 de defesa. Bônus de habilidades continuam multiplicando os valores de ataque. Os atributos reiniciam com nível e melhorias na ascensão; habilidades permanentes e itens seguem as regras existentes.

Os saves V7 continuam no formato 3. Saves anteriores a esta HUD recebem todos os pontos correspondentes ao nível atual, ainda não distribuídos. As alocações são salvas em `attributes`. O saldo é derivado do nível e dos pontos gastos; importações são limitadas ao orçamento conquistado. Não há exclusão ou reinício de perfis existentes.

## Arte

Os três PNGs transparentes em `assets/hud/` foram criados com a ferramenta integrada de geração de imagens e preparados em 256 × 256 para uso na interface. Não dependem de serviço remoto durante o jogo.

Prompt comum: standalone HELLWARD dark fantasy RPG HUD inventory icon; highly detailed hand-painted grim medieval fantasy item illustration; realistic textures, chiaroscuro, gothic atmosphere; ONE isolated object centered, fills 80 percent of a square canvas, all edges visible, readable silhouette at 64px; charcoal, aged metal, burnt sienna and ember rim lighting; true transparent alpha; no text, letters, watermark, frame, UI, environment, ground plane or floating particles.

- `assets/hud/livro-negro.png`: closed ancient BLACK LEATHER GRIMOIRE, thick worn ivory page block, iron corner guards, small engraved ember-red sigil; slight three-quarter view of cover and spine.
- `assets/hud/calice-ascensao.png`: medieval GOTHIC GOLDEN CHALICE, weathered dark gold, clawlike base, pointed cathedral tracery on bowl, tiny blood-red cabochon, subtle warm gleam.
- `assets/hud/mochila-velha.png`: OLD BROWN LEATHER BACKPACK, medieval adventurer rucksack, torn edges, dark straps, small brass buckles, folded flap, visibly worn and readable silhouette.

As molduras em `assets/hud/forged-frame.svg` e os nichos em `assets/hud/relic-niche.svg` são vetores locais. A moldura usa nove fatias e dimensões intrínsecas explícitas para preservar cantos e espessura em todos os tamanhos. As ilustrações usam `object-fit: contain`, evitando cortes.

## Verificação

Com Playwright e Chromium instalados: `node tests/hud-browser.cjs`.

`CHROMIUM_PATH` permite indicar outro executável. `HUD_SCREENSHOTS` permite salvar capturas para inspeção. O teste fornece seu próprio servidor local e mantém o acesso de testes ao estado fora do código de produção.

Cobertura: encaixe em 1366×768, 1920×1080, 1920×852, 1536×864, 1280×720, 1024×768, 1024×600, 390×844, 375×667, 360×640, 320×568, 844×390 e 667×375; abertura/fechamento e navegação dos painéis; distribuição e limite de pontos; efeitos reais nos bônus; migração V7, persistência e importação inválida; melhorias, equipamento, poções, venda, ascensão, exportação/importação JSON e retomada do perfil; erros JavaScript e recursos ausentes.

A revisão visual inclui configurações, livro, mochila, ascensão, foco, todos os 42 monstros em três formatos de tela, eventos raros, números de dano longos e aviso de derrota. A suíte verifica limites de elementos, separação entre barra e sprite, texto de XP legível, atalhos, quantidade e consumo da poção rápida, volume e tema. Os testes locais isolam o relógio para comparar atributos e quantidades de forma determinística; o comportamento com o relógio ativo é também verificado na versão publicada.
