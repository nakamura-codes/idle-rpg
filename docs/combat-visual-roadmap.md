# HELLWARD — evolução visual do combate, uma melhoria por vez

Análise do print enviado em 05/11/2026. A imagem já tem arquitetura gótica forte, bons recortes, hierarquia de boss e sombras. O herói parece diminuto perante a Medusa, mas a diferença vende a ameaça; manter os pés no mesmo plano e avaliar a ocupação real do sprite, sem diminuir novamente os bosses. O vazio central pode receber feedback de combate com muito mais retorno do que uma troca geral das artes. Névoa/iluminação estáticas, números de dano/cura e deslocamento do ataque do herói já existem no código: as propostas abaixo evoluem esses recursos.

## Prioridade por impacto / esforço

Escala de impacto 1–5; esforço relativo 1–5. Estimativas de implementação e QA, não de geração de toda a arte. Implementadas: nº 1 e nº 2. As demais continuam como próximas etapas.

| Nº | Melhoria | Impacto | Esforço | Resultado e limite de custo |
|---|---|---:|---:|---|
| 1 | Vida do inimigo com dano atrasado | 4 | 1 | Vermelho imediato, eco âmbar de 90 + 420 ms. Uma animação de transform, sem loop novo. |
| 2 | Números de dano, crítico e cura mais legíveis | 4 | 2 | Elevar contraste, diferenciar tamanho/cor/símbolo; preservar limites de 8 números no inimigo e 5 no herói. Ancorar ao alvo, sem confundir com eventos. |
| 3 | Peso de golpe e reação ao dano | 5 | 3 | Recuo curto do inimigo, faísca no ponto de impacto e ataque com antecipação. Shake de 2–3 px e hit-stop visual de 40–60 ms só em críticos, com intervalo mínimo. Nunca pausar relógio de combate/recompensas. |
| 4 | Idle discreto com peso nos pés | 3 | 2 | Respiração e balanço de 1–2 px no sprite interno; animações lentas e desencontradas. Não deformar espada/rosto nem mover a sombra junto com o torso. |
| 5 | Fontes pequenas e contraste | 3 | 2 | Dar espaço a fase, recursos e legendas; corpo simples nas informações pequenas, gótico nos títulos. No celular priorizar HP e fase em vez de encolher tudo. |
| 6 | Orbe de vida com reação | 3 | 2 | Já acompanha HP: acrescentar apenas brilho de borda/pulso baixo e desacelerado em vida baixa, sem ondulação por filtro. Sem duplicar aviso já existente. |
| 7 | Atmosfera regional em movimento | 4 | 3 | Aproveitar camadas atuais: uma névoa translúcida movendo por transform e luz variando levemente por opacity. Brasas só nas regiões de fogo; poeira/esporos nas outras. Máximo de 6–10 partículas decorativas recicladas; modo leve estático. |
| 8 | Entrada de elite, morte e transição de fase | 4 | 3 | Intro única de 500–700 ms, aura atrás de miniboss, morte breve com fade e assentamento, transição de fase curta. Encadear sem bloquear cliques nem criar tempo artificial de farm. Não reapresentar intro a cada tick. |
| 9 | Ouro/almas/fragmentos indo ao HUD | 4 | 4 | Uma partícula representativa por recurso ganho, agregando rajadas; saldo real sobe imediatamente. Medir origem/destino só no evento/resize. Limite de 6 voos e cancelamento ao trocar de perfil. |
| 10 | Profundidade por parallax e chão | 4 | 5 | Duas camadas extras de cenário alinhadas, movimento de poucos px e foreground baixo. Corrigir perspectiva, detritos e contato das sombras antes de mudar escala do herói. Não deslizar a imagem inteira nem o HUD. Desativar parallax no celular/modo leve se necessário. |

## Nº 1 — alteração exata

### `index.html`

- Cache: `game.js?v=21` e `combat-events.css?v=3`.
- No `.hp-track` dentro de `.mob-info`, adicionar `id="mobHealthProgress"`, `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"` e valor inicial.
- Inserir **antes** de `#mobHPFill`: `<div class="hp-damage-trail" id="mobHPDamageTrail" aria-hidden="true"></div>`.
- Manter `#mobHPText` e a vida atual. O eco decorativo não é uma segunda quantidade de HP.

### `game.js`

- No construtor, inicializar `enemyHealthTrail` e `reducedCombatMotion`; alterações de preferência limpam o efeito.
- Em `visibilitychange` e `showAuth()`, chamar `resetEnemyHealthTrail()`.
- Antes de `renderCore()`, acrescentar `resetEnemyHealthTrail()` e `renderEnemyHealth()` conforme o código deste commit.
- Em `renderCore()`, substituir a chamada isolada `fill('mobHPFill', ...)` por `this.renderEnemyHealth()`.
- O vermelho é atualizado imediatamente; só a camada âmbar usa transição CSS, com 90 ms de espera e 420 ms de movimento. Outra batida redireciona a transição a partir do valor visual atual e elimina a nova espera. O navegador mantém uma única transição.
- Objeto de inimigo diferente, HP máximo diferente ou cura encaixam a faixa imediatamente. Comparação por referência reconhece outro inimigo com o mesmo nome/sprite. Sem alteração em dano, drops, timers ou formato de save.
- Sem consulta de progresso de animação ou medição de layout; um prazo numérico identifica uma sequência de golpes. Sem timer ou `requestAnimationFrame` adicional. A camada não faz novas escritas quando o HP não muda.

### `combat-events.css`

- Logo após as regras de seleção do campo: `.hp-track` com contexto de empilhamento; `.hp-damage-trail` absoluta, origem à esquerda, gradiente âmbar, z-index 0.
- Vida atual em z-index 1, sem transição; texto em z-index 2 com contorno de sombra.
- Esconder camada decorativa em `.hw-lite` e `prefers-reduced-motion: reduce`.

### Verificação

`tests/enemy-health-trail.cjs` cobre dano imediato, faixa intermediária/final, sequência de golpes, outro inimigo de mesmo nome, cura, chefões, acessibilidade, modo leve, movimento reduzido, limpeza no menu e ausência de escritas em HP parado. Quatro viewports: 1366×768, 320×568, 390×844, 844×390.

A auditoria confirmou 95 assets ativos, 89 imagens raster e 42 monstros únicos; nenhum asset órfão ou duplicado por bytes/pixels. As suítes de combate/eventos, HUD e inventário/caça e os testes determinísticos de balanceamento passaram.

Métricas antes/depois e limites estão em `docs/performance-enemy-health-trail.json`. Não há novos assets raster, dependências ou arquivos de imagem duplicados nesta melhoria.

## Resultado de FPS da nº 1

A rodada ampla **não passou** a comparação automática: ataques desktop 60→54 FPS, ataques mobile 55→49 e caça mobile 53→44 (CPU 6×). Não tratar esta entrega como uma aprovação do gate de FPS.

Uma comparação A/B adicional mantém o mesmo inimigo e a mesma cadência, alternando três pares antes/depois: mediana mobile **56→55 FPS**, p95 **33,3→33,2 ms**, dentro das tolerâncias do projeto. A implementação final usa transição CSS sem leitura de progresso; a versão inicial com animação recriada por golpe foi descartada após medir custo maior. A rodada ampla e o controle medem situações diferentes; há variação forte do host, inclusive uma amostra de menu da versão antiga que durou 13,758 s em vez de 5 s. Atribuir todas as quedas ao host seria uma inferência, não um resultado comprovado. Permanecem pendentes a validação em celular físico e uma sessão de horas.

## Nº 2 — números de combate legíveis

Implementada após a nº 1, mantendo os demais efeitos da lista para entregas futuras.

- Dano causado em osso claro; crítico maior em âmbar e etiqueta CRÍTICO; dano recebido em coral; cura em verde dessaturado e etiqueta CURA. A informação também depende de sinais/etiquetas, não apenas de cor.
- Valores em Georgia com peso alto e contorno de sombra estático. A etiqueta não fica na mesma linha do número; cada lançamento alterna entre três faixas, separadas em 40 px no celular e 48 px no desktop.
- O mesmo ResizeObserver existente observa arena, herói, alvo e cartão do evento. As coordenadas são armazenadas só quando esses elementos mudam de tamanho; não há leitura de layout em golpes ou quadros da animação. Os números continuam em camadas independentes dos sprites, sem herdar a rotação/opacidade da derrota.
- Números acompanham o centro real do alvo, incluindo o Imperador colossal. Dano de evento acompanha sua ilustração. Cura/dano do herói desvia do cartão do evento quando há interseção.
- Os dois grupos guardam no máximo 8 nós/temporizadores do inimigo e 5 do herói. Ao ultrapassar, o mais antigo é removido e seu timeout cancelado. Menu, ativação de perfil, mudança de visibilidade e preferência de movimento limpam os grupos.
- Uma animação CSS de transform/opacity de 760 ms por número; remoção após 900 ms. Modo leve e movimento reduzido usam apenas um fade sem deslocamento. Nenhum asset, biblioteca ou loop adicional.

Arquivos e trechos:

| Arquivo | Trecho |
|---|---|
| `game.js` | Construtor e eventos de limpeza; `floatNumber()` e `floatHeroNumber()` delegam para `spawnCombatNumber()`; `cacheCombatNumberAnchors()`, `positionCombatNumber()`, `removeCombatNumber()` e `clearCombatNumbers()` cuidam apenas da apresentação. |
| `combat-events.css` | Bloco `.combat-number`, etiquetas `data-caption`, variantes de cor, camada do herói ocupando a arena e keyframes `hw-number-rise` / `hw-number-still`. |
| `index.html` | Cache atualizado para `game.js?v=22` e `combat-events.css?v=4`. |
| `tests/combat-numbers.cjs` | Cinco viewports, ancoragem de comum/miniboss/colossal, separação das etiquetas, eventos, estado inalterado, ausência de medição durante golpes, limites de nós/temporizadores, expiração e modo leve/movimento reduzido. |
| `tests/performance.cjs` | Flag apenas de teste `PERF_FEEDBACK=1`: mistura contínua de dano normal, crítico, dano recebido e cura a cada 200 ms. Antes e depois usam exatamente a mesma instrumentação. |

Resultados e limitações de FPS: `docs/performance-combat-numbers.json`. A cena específica de feedback ficou em **60→60 FPS no desktop e 58→60 FPS no mobile CPU6**, dentro das tolerâncias de FPS/p95. O comparativo amplo **não passou** em 8 cenas; houve pausas longas e oscilações também em menus. Uma tentativa incompleta foi preservada. Não há garantia de desempenho em celular físico ou em sessões de horas. A medição anterior da nº 1 permanece preservada em seu próprio relatório.

## Prompts de imagem — estilo fixo

Os prompts abaixo são um catálogo para as próximas etapas; nenhuma substituição geral de sprites ou fundos é necessária para a nº 1. Preserve o melhor da arte atual, usando o arquivo da região/sprite como referência visual em toda geração ou edição. Um prompt de texto sozinho não garante alinhamento perfeito entre camadas ou quadros.

**Cole este bloco antes de qualquer um dos prompts específicos:**

```text
HELLWARD — consistência visual obrigatória. Dark fantasy gótico adulto, opressivo e decadente; ilustração digital de materiais realistas, pincelada refinada e formas sólidas, detalhes legíveis na escala de um jogo 2D. Chiaroscuro, sombras profundas com textura preservada, iluminação lateral baixa e recorte frio muito discreto, metais gastos, couro rachado, osso antigo, pedra úmida e tecidos pesados. Paleta dessaturada de carvão, ferro, terra e vinho; cor regional restrita a luzes e pequenos acentos. Silhuetas claras contra o fundo, volumes convincentes, sem preto chapado cobrindo os detalhes. Mesmo mundo, perspectiva e direção de luz da referência anexada. Sem anime, cartoon, chibi, pixel art, neon, fantasia colorida, desenho de contorno, aparência de ícone, texto, números, logotipo, moldura, interface ou marca-d'água. Não redesenhar a HUD na imagem.
```

### Fundos por expedição

Saída: uma imagem de fundo por prompt, 16:9, fonte 1536×864 ou maior. No jogo preparar WebP 1280×720 e variante 720×405, conferindo peso e contraste. Manter linha dos pés e área jogável da referência. Cabeçalhos no terço superior; centro inferior com piso aberto. Não incluir herói ou inimigos.

**Campos de Cinza — área comum e miniboss**

```text
Cenário de combate 2D lateral de Campos de Cinza: planície de cinzas diante de uma capela arruinada, estacas quebradas, campas profanadas, horizonte de tempestade, fuligem, rachaduras e pedra carbonizada. Luz regional cinza e cobre apagado, fraca e localizada. Profundidade em arquitetura distante, ambiente médio e chão próximo; arena inferior aberta, foco de combate à direita e área do herói à esquerda. Nada importante junto aos limites da tela, sem personagens, sem névoa opaca cobrindo os pés. Manter perspectiva e altura do horizonte da referência anexada. Uma imagem completa, 16:9.
```

**Campos de Cinza — arena de Cavaleiro Decapitado**

```text
Use o fundo de Campos de Cinza anexado como referência obrigatória. Variante de arena para Cavaleiro Decapitado: pátio funerário da mesma capela, guilhotina e estátuas sem cabeça distantes, luas veladas. Mesma luz cinza e cobre apagado, mesma perspectiva, mesmo piso e mesma família de arquitetura. Aumentar a sensação de ameaça pela escala dos elementos distantes, preservando a área inferior vazia para o boss à direita e o herói à esquerda. Sem retratar o boss, sem retratar personagens e sem mudar a região. Uma imagem completa, 16:9.
```

**Bosque Profanado — área comum e miniboss**

```text
Cenário de combate 2D lateral de Bosque Profanado: floresta de árvores retorcidas, raízes como costelas, musgo úmido, santuários apodrecidos, esporos muito escassos e clareira de terra negra. Luz regional verde doentio e oliva escuro, fraca e localizada. Profundidade em arquitetura distante, ambiente médio e chão próximo; arena inferior aberta, foco de combate à direita e área do herói à esquerda. Nada importante junto aos limites da tela, sem personagens, sem névoa opaca cobrindo os pés. Manter perspectiva e altura do horizonte da referência anexada. Uma imagem completa, 16:9.
```

**Bosque Profanado — arena de Hidra Profanada**

```text
Use o fundo de Bosque Profanado anexado como referência obrigatória. Variante de arena para Hidra Profanada: clareira pantanosa cercada pelas mesmas raízes, ossadas enroscadas e poças escuras no perímetro. Mesma luz verde doentio e oliva escuro, mesma perspectiva, mesmo piso e mesma família de arquitetura. Aumentar a sensação de ameaça pela escala dos elementos distantes, preservando a área inferior vazia para o boss à direita e o herói à esquerda. Sem retratar o boss, sem retratar personagens e sem mudar a região. Uma imagem completa, 16:9.
```

**Criptas Afogadas — área comum e miniboss**

```text
Cenário de combate 2D lateral de Criptas Afogadas: cripta semissubmersa sob uma catedral, colunas partidas, sarcófagos, correntes molhadas, reflexos discretos nas bordas, corredor de pedra transitável. Luz regional ciano pálido e ardósia, fraca e localizada. Profundidade em arquitetura distante, ambiente médio e chão próximo; arena inferior aberta, foco de combate à direita e área do herói à esquerda. Nada importante junto aos limites da tela, sem personagens, sem névoa opaca cobrindo os pés. Manter perspectiva e altura do horizonte da referência anexada. Uma imagem completa, 16:9.
```

**Criptas Afogadas — arena de Rei Lich**

```text
Use o fundo de Criptas Afogadas anexado como referência obrigatória. Variante de arena para Rei Lich: nave funerária da mesma cripta com trono ossuário distante e espelhos de água nas laterais. Mesma luz ciano pálido e ardósia, mesma perspectiva, mesmo piso e mesma família de arquitetura. Aumentar a sensação de ameaça pela escala dos elementos distantes, preservando a área inferior vazia para o boss à direita e o herói à esquerda. Sem retratar o boss, sem retratar personagens e sem mudar a região. Uma imagem completa, 16:9.
```

**Fortaleza de Ferro — área comum e miniboss**

```text
Cenário de combate 2D lateral de Fortaleza de Ferro: fortaleza industrial medieval arruinada, muralhas maciças, correntes, portões dentados, braseiros de forja distantes e pátio de placas de ferro gasto. Luz regional âmbar de forja e ferro oxidado, fraca e localizada. Profundidade em arquitetura distante, ambiente médio e chão próximo; arena inferior aberta, foco de combate à direita e área do herói à esquerda. Nada importante junto aos limites da tela, sem personagens, sem névoa opaca cobrindo os pés. Manter perspectiva e altura do horizonte da referência anexada. Uma imagem completa, 16:9.
```

**Fortaleza de Ferro — arena de Cavaleiro do Abismo**

```text
Use o fundo de Fortaleza de Ferro anexado como referência obrigatória. Variante de arena para Cavaleiro do Abismo: salão de execução da mesma fortaleza, portas monumentais e correntes sobre abismo de forja ao fundo. Mesma luz âmbar de forja e ferro oxidado, mesma perspectiva, mesmo piso e mesma família de arquitetura. Aumentar a sensação de ameaça pela escala dos elementos distantes, preservando a área inferior vazia para o boss à direita e o herói à esquerda. Sem retratar o boss, sem retratar personagens e sem mudar a região. Uma imagem completa, 16:9.
```

**Fendas Infernais — área comum e miniboss**

```text
Cenário de combate 2D lateral de Fendas Infernais: desfiladeiro vulcânico de basalto cortado por fissuras, templos diabólicos corroídos, lava distante e terreno de batalha de rocha escura sólida. Luz regional vermelho brasa e laranja queimado, fraca e localizada. Profundidade em arquitetura distante, ambiente médio e chão próximo; arena inferior aberta, foco de combate à direita e área do herói à esquerda. Nada importante junto aos limites da tela, sem personagens, sem névoa opaca cobrindo os pés. Manter perspectiva e altura do horizonte da referência anexada. Uma imagem completa, 16:9.
```

**Fendas Infernais — arena de Dragão das Fendas**

```text
Use o fundo de Fendas Infernais anexado como referência obrigatória. Variante de arena para Dragão das Fendas: amplo altar de basalto do mesmo desfiladeiro, cratera distante, arcos partidos e escala colossal. Mesma luz vermelho brasa e laranja queimado, mesma perspectiva, mesmo piso e mesma família de arquitetura. Aumentar a sensação de ameaça pela escala dos elementos distantes, preservando a área inferior vazia para o boss à direita e o herói à esquerda. Sem retratar o boss, sem retratar personagens e sem mudar a região. Uma imagem completa, 16:9.
```

**Trono do Crepúsculo — área comum e miniboss**

```text
Cenário de combate 2D lateral de Trono do Crepúsculo: terraço de catedral imperial em ruínas sob eclipse, gárgulas, bandeiras rasgadas, abismos e pináculos infinitos, piso de lajes escuras semelhante à referência do combate da Medusa. Luz regional violeta acinzentado e ouro envelhecido, fraca e localizada. Profundidade em arquitetura distante, ambiente médio e chão próximo; arena inferior aberta, foco de combate à direita e área do herói à esquerda. Nada importante junto aos limites da tela, sem personagens, sem névoa opaca cobrindo os pés. Manter perspectiva e altura do horizonte da referência anexada. Uma imagem completa, 16:9.
```

**Trono do Crepúsculo — arena de Imperador do Crepúsculo**

```text
Use o fundo de Trono do Crepúsculo anexado como referência obrigatória. Variante de arena para Imperador do Crepúsculo: esplanada imperial da mesma catedral, trono monumental distante e eclipse maior, preservando materiais, clima e paleta da área comum. Mesma luz violeta acinzentado e ouro envelhecido, mesma perspectiva, mesmo piso e mesma família de arquitetura. Aumentar a sensação de ameaça pela escala dos elementos distantes, preservando a área inferior vazia para o boss à direita e o herói à esquerda. Sem retratar o boss, sem retratar personagens e sem mudar a região. Uma imagem completa, 16:9.
```

### Camadas para parallax e atmosfera

Aplicar separadamente ao fundo aprovado de cada região; usar edição com referência para preservar registro/perspectiva. Não pedir várias camadas numa única imagem montada.

```text
Edite o fundo de HELLWARD anexado. Entregue SOMENTE a camada distante: céu e arquitetura/vegetação do horizonte. Remova personagens, HUD e objetos próximos. Complete discretamente o que estava encoberto, preservando perspectiva e iluminação. Fundo opaco, 16:9, sem alterar o horizonte.
```

```text
Edite o fundo de HELLWARD anexado. Entregue SOMENTE um recorte de primeiro plano na mesma posição: raízes, ferro partido ou lajes rachadas já existentes no rodapé. Transparência alfa real em todo o restante, inclusive no centro. Ocupar no máximo 12% da altura inferior, sem ocupar onde estão os pés do herói/inimigo. Sem sombra retangular, sem preto substituindo a transparência. Tela 16:9.
```

```text
Uma única faixa baixa de névoa cinza muito translúcida, fria e orgânica, para o piso de uma arena gótica de HELLWARD. Fios esparsos e vazios amplos, densidade baixa, nenhum personagem ou paisagem. Transparência alfa real, bordas que se dissolvem suavemente em todos os lados, sem retângulo, sem luz intensa. Formato 3:1. A cor regional será aplicada com opacidade/cor simples no jogo.
```

Brasas, poeira e pequenos pontos de luz devem ser criados em CSS, sem imagens novas. Pulsação de luz, orbe, dano atrasado e números também usam código, não precisam de assets.

### Sprites de inimigos

Usar o sprite canônico atual anexado como referência de identidade. Os 42 já foram revisados; estes prompts são para futuras correções pontuais, não uma ordem de substituir todos. Gerar uma pose neutra por arquivo, recorte alfa verdadeiro. Conferir alinhamento de pés e pivô antes de pensar em quadros extras. A sombra de contato permanece separada no jogo.

**Condenado Errante — Campos de Cinza**

```text
Refaça apenas o sprite de Condenado Errante, inimigo comum de Campos de Cinza, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral cinza e cobre apagado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Guerreiro Esquelético — Campos de Cinza**

```text
Refaça apenas o sprite de Guerreiro Esquelético, inimigo comum de Campos de Cinza, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral cinza e cobre apagado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Sentinela Caída — Campos de Cinza**

```text
Refaça apenas o sprite de Sentinela Caída, inimigo comum de Campos de Cinza, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral cinza e cobre apagado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Arqueiro Macabro — Campos de Cinza**

```text
Refaça apenas o sprite de Arqueiro Macabro, inimigo comum de Campos de Cinza, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral cinza e cobre apagado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Zumbi Errante — Campos de Cinza**

```text
Refaça apenas o sprite de Zumbi Errante, inimigo comum de Campos de Cinza, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral cinza e cobre apagado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Espadachim Corrompido — Campos de Cinza**

```text
Refaça apenas o sprite de Espadachim Corrompido, miniboss ameaçador de Campos de Cinza, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral cinza e cobre apagado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Cavaleiro Decapitado — Campos de Cinza**

```text
Refaça apenas o sprite de Cavaleiro Decapitado, chefão monumental de Campos de Cinza, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral cinza e cobre apagado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Lobo Sombrio — Bosque Profanado**

```text
Refaça apenas o sprite de Lobo Sombrio, inimigo comum de Bosque Profanado, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral verde doentio e oliva escuro. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Ratazana Pestilenta — Bosque Profanado**

```text
Refaça apenas o sprite de Ratazana Pestilenta, inimigo comum de Bosque Profanado, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral verde doentio e oliva escuro. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Lobo da Praga — Bosque Profanado**

```text
Refaça apenas o sprite de Lobo da Praga, inimigo comum de Bosque Profanado, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral verde doentio e oliva escuro. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Entorpecido de Musgo — Bosque Profanado**

```text
Refaça apenas o sprite de Entorpecido de Musgo, inimigo comum de Bosque Profanado, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral verde doentio e oliva escuro. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Goblin Selvagem — Bosque Profanado**

```text
Refaça apenas o sprite de Goblin Selvagem, inimigo comum de Bosque Profanado, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral verde doentio e oliva escuro. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Rei das Ratazanas — Bosque Profanado**

```text
Refaça apenas o sprite de Rei das Ratazanas, miniboss ameaçador de Bosque Profanado, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral verde doentio e oliva escuro. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Hidra Profanada — Bosque Profanado**

```text
Refaça apenas o sprite de Hidra Profanada, chefão monumental de Bosque Profanado, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral verde doentio e oliva escuro. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Espectro da Cripta — Criptas Afogadas**

```text
Refaça apenas o sprite de Espectro da Cripta, inimigo comum de Criptas Afogadas, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral ciano pálido e ardósia. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Alma Enregelada — Criptas Afogadas**

```text
Refaça apenas o sprite de Alma Enregelada, inimigo comum de Criptas Afogadas, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral ciano pálido e ardósia. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Lamento Submerso — Criptas Afogadas**

```text
Refaça apenas o sprite de Lamento Submerso, inimigo comum de Criptas Afogadas, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral ciano pálido e ardósia. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Afogado Sem Rosto — Criptas Afogadas**

```text
Refaça apenas o sprite de Afogado Sem Rosto, inimigo comum de Criptas Afogadas, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral ciano pálido e ardósia. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Sacerdote Esquecido — Criptas Afogadas**

```text
Refaça apenas o sprite de Sacerdote Esquecido, inimigo comum de Criptas Afogadas, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral ciano pálido e ardósia. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Bruxa das Criptas — Criptas Afogadas**

```text
Refaça apenas o sprite de Bruxa das Criptas, miniboss ameaçador de Criptas Afogadas, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral ciano pálido e ardósia. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Rei Lich — Criptas Afogadas**

```text
Refaça apenas o sprite de Rei Lich, chefão monumental de Criptas Afogadas, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral ciano pálido e ardósia. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Golem Ferrugem — Fortaleza de Ferro**

```text
Refaça apenas o sprite de Golem Ferrugem, inimigo comum de Fortaleza de Ferro, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral âmbar de forja e ferro oxidado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Carcereiro Rúnico — Fortaleza de Ferro**

```text
Refaça apenas o sprite de Carcereiro Rúnico, inimigo comum de Fortaleza de Ferro, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral âmbar de forja e ferro oxidado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Guardião de Basalto — Fortaleza de Ferro**

```text
Refaça apenas o sprite de Guardião de Basalto, inimigo comum de Fortaleza de Ferro, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral âmbar de forja e ferro oxidado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Orc Carniceiro — Fortaleza de Ferro**

```text
Refaça apenas o sprite de Orc Carniceiro, inimigo comum de Fortaleza de Ferro, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral âmbar de forja e ferro oxidado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Construto Enferrujado — Fortaleza de Ferro**

```text
Refaça apenas o sprite de Construto Enferrujado, inimigo comum de Fortaleza de Ferro, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral âmbar de forja e ferro oxidado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Ogro do Ferro — Fortaleza de Ferro**

```text
Refaça apenas o sprite de Ogro do Ferro, miniboss ameaçador de Fortaleza de Ferro, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral âmbar de forja e ferro oxidado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Cavaleiro do Abismo — Fortaleza de Ferro**

```text
Refaça apenas o sprite de Cavaleiro do Abismo, chefão monumental de Fortaleza de Ferro, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral âmbar de forja e ferro oxidado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Arauto das Chamas — Fendas Infernais**

```text
Refaça apenas o sprite de Arauto das Chamas, inimigo comum de Fendas Infernais, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral vermelho brasa e laranja queimado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Demônio Carmesim — Fendas Infernais**

```text
Refaça apenas o sprite de Demônio Carmesim, inimigo comum de Fendas Infernais, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral vermelho brasa e laranja queimado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Flagelo Abissal — Fendas Infernais**

```text
Refaça apenas o sprite de Flagelo Abissal, inimigo comum de Fendas Infernais, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral vermelho brasa e laranja queimado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Súcubo das Cinzas — Fendas Infernais**

```text
Refaça apenas o sprite de Súcubo das Cinzas, inimigo comum de Fendas Infernais, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral vermelho brasa e laranja queimado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Sombra Incandescente — Fendas Infernais**

```text
Refaça apenas o sprite de Sombra Incandescente, inimigo comum de Fendas Infernais, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral vermelho brasa e laranja queimado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Devorador Mórbido — Fendas Infernais**

```text
Refaça apenas o sprite de Devorador Mórbido, miniboss ameaçador de Fendas Infernais, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral vermelho brasa e laranja queimado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Dragão das Fendas — Fendas Infernais**

```text
Refaça apenas o sprite de Dragão das Fendas, chefão monumental de Fendas Infernais, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral vermelho brasa e laranja queimado. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Lich Imortal — Trono do Crepúsculo**

```text
Refaça apenas o sprite de Lich Imortal, inimigo comum de Trono do Crepúsculo, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral violeta acinzentado e ouro envelhecido. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Rei das Sombras — Trono do Crepúsculo**

```text
Refaça apenas o sprite de Rei das Sombras, inimigo comum de Trono do Crepúsculo, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral violeta acinzentado e ouro envelhecido. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Devorador de Estrelas — Trono do Crepúsculo**

```text
Refaça apenas o sprite de Devorador de Estrelas, inimigo comum de Trono do Crepúsculo, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral violeta acinzentado e ouro envelhecido. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Sacerdote do Vazio — Trono do Crepúsculo**

```text
Refaça apenas o sprite de Sacerdote do Vazio, inimigo comum de Trono do Crepúsculo, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral violeta acinzentado e ouro envelhecido. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Arauto do Eclipse — Trono do Crepúsculo**

```text
Refaça apenas o sprite de Arauto do Eclipse, inimigo comum de Trono do Crepúsculo, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral violeta acinzentado e ouro envelhecido. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Medusa do Eclipse — Trono do Crepúsculo**

```text
Refaça apenas o sprite de Medusa do Eclipse, miniboss ameaçador de Trono do Crepúsculo, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral violeta acinzentado e ouro envelhecido. Corpo serpentino completo, coroa de eclipse, serpentes no lugar dos cabelos, cajado lunar e armadura ritual; anatomia coesa, cauda apoiada no solo. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

**Imperador do Crepúsculo — Trono do Crepúsculo**

```text
Refaça apenas o sprite de Imperador do Crepúsculo, boss colossal de fim de campanha de Trono do Crepúsculo, usando o sprite anexado para manter espécie, anatomia, traje, arma e identidade. Corpo inteiro em vista lateral de três quartos, rosto e arma orientados para a esquerda, postura de combate neutra com peso nos pés. Materiais sólidos, textura refinada, volumes escuros legíveis, luz lateral violeta acinzentado e ouro envelhecido. Sem cenário, sem piso pintado e sem sombra larga embutida. Fundo transparente alfa real. Não cortar armas, membros, asas ou cauda; margem alfa estreita e uniforme. Fonte de pelo menos 1024 px no lado maior, sem pixel art; adaptar a escala no código, sem torná-lo um ícone distante dentro da tela.
```

### Herói

```text
Refine o Errante de HELLWARD usando o sprite atual anexado. Cavaleiro humano de armadura de ferro gasto com gravuras góticas discretas, couro rachado, cota de malha e tabardo pesado rasgado, espada e escudo na mesma configuração. Corpo inteiro em três quartos, voltado para a DIREITA, pés na mesma linha, pose neutra e centro de massa natural. Sombras esculpindo armadura, recorte frio discreto; sem brilho de super-herói e sem aumentar a arma. Preservar silhueta, rosto oculto e proporções da referência. Fundo alfa transparente, sem chão nem sombra larga embutida, sem cortar a espada, margem estreita. Fonte 1024 px no lado maior.
```

### Efeitos e recompensas

**Golpe físico — um asset**

```text
Um único arco curto e irregular de golpe de espada para HELLWARD, em diagonal, metal pálido e âmbar oxidado, poucas lascas nas extremidades, centro recortado e luz contida. Leitura clara em tamanho pequeno, aspecto de golpe pesado, sem círculo mágico, sem personagem, sem sangue, sem fundo. Alfa transparente verdadeiro; bordas suavemente dissolvidas, sem retângulo preto. Tela quadrada, efeito ocupa o centro com margem curta. Uma imagem, não um atlas.
```

**Impacto arcano de elite — um asset**

```text
Uma única pequena ruptura de energia sombria para HELLWARD: estilhaços curtos de violeta dessaturado ao redor de um núcleo escuro translúcido, brilho muito contido, sem fumaça espessa, sem círculo de interface, sem personagem. Alfa transparente verdadeiro, formato quadrado, silhueta irregular. Preparado para flash de 120 ms; não desenhar quadros de animação nem texto.
```

**Ouro — um asset**

```text
Uma única moeda antiga de ouro envelhecido de HELLWARD, vista em três quartos, borda lascada, relevo de sigilo abstrato corroído sem letras, luz lateral baixa, volume sólido e leitura em 20 px. Centralizada, fundo transparente alfa real, sem halo grande, sem chão, sem moldura. Fonte quadrada 512 px.
```

**Alma — um asset**

```text
Uma única brasa de alma aprisionada de HELLWARD, forma de lágrima irregular de vidro fumê e luz violeta muito pálida, núcleo fantasmagórico sutil sem rosto cartunesco. Silhueta distinta e leitura em 20 px, sombras profundas e brilho baixo. Centralizada, fundo transparente alfa real, sem halo grande, chão ou moldura. Fonte quadrada 512 px.
```

**Fragmento — um asset**

```text
Um único fragmento de obsidiana ritual de HELLWARD, ponta irregular, faces quebradas com uma veia fina de âmbar antigo, volume facetado realista, silhueta nítida e leitura em 20 px. Centralizado, fundo transparente alfa real, sem neon, halo grande, chão ou moldura. Fonte quadrada 512 px.
```

Antes de gerar os três drops, prefira reutilizar os ícones atuais se a leitura já for boa. Para sprites/FX transparentes, exportar WebP com alfa e revisar em fundo claro e escuro. Não usar JPEG. Não gerar mais variações sem substituir ou remover referências aposentadas.

## Limites para as próximas melhorias

Sem biblioteca adicional, filtros animados de blur/drop-shadow, leituras de layout por frame ou observador por partícula. Animar transform/opacity e parar tudo ao sair do combate ou ocultar a página. Respeitar modo leve e movimento reduzido. Recompensas, danos, saves e timer de 100 ms permanecem independentes dos efeitos. Rodar benchmark isolado antes/depois de cada etapa, mais checagem de assets e celular em retrato/paisagem.
