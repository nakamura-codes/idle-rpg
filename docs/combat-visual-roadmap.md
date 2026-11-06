# HELLWARD — evolução visual do combate, uma melhoria por vez

Análise do print enviado em 05/11/2026. A imagem já tem arquitetura gótica forte, bons recortes, hierarquia de boss e sombras. O herói parece diminuto perante a Medusa, mas a diferença vende a ameaça; manter os pés no mesmo plano e avaliar a ocupação real do sprite, sem diminuir novamente os bosses. O vazio central pode receber feedback de combate com muito mais retorno do que uma troca geral das artes. Névoa/iluminação estáticas, números de dano/cura e deslocamento do ataque do herói já existem no código: as propostas abaixo evoluem esses recursos.

## Prioridade por impacto / esforço

Escala de impacto 1–5; esforço relativo 1–5. Estimativas de implementação e QA, não de geração de toda a arte. Implementadas: nº 1, nº 2, nº 3, nº 4 e nº 5. Prioridade atual do usuário: computador; otimização e QA de celular ficam para depois. As demais continuam como próximas etapas.

| Nº | Melhoria | Impacto | Esforço | Resultado e limite de custo |
|---|---|---:|---:|---|
| 1 | Vida do inimigo com dano atrasado | 4 | 1 | Vermelho imediato, eco âmbar de 90 + 420 ms. Uma animação de transform, sem loop novo. |
| 2 | Números de dano, crítico e cura mais legíveis | 4 | 2 | Elevar contraste, diferenciar tamanho/cor/símbolo; preservar limites de 8 números no inimigo e 5 no herói. Ancorar ao alvo, sem confundir com eventos. |
| 3 | Peso de golpe e reação ao dano | 5 | 3 | Recuo curto do inimigo, faísca no ponto de impacto e ataque com antecipação. Shake de 2–3 px e hit-stop visual de 40–60 ms só em críticos, com intervalo mínimo. Nunca pausar relógio de combate/recompensas. |
| 4 | Idle discreto com peso nos pés | 3 | 2 | Respiração e balanço de 1–2 px no sprite interno; animações lentas e desencontradas. Não deformar espada/rosto nem mover a sombra junto com o torso. |
| 5 | Fontes pequenas e contraste | 3 | 2 | Recursos/fase/atalhos a 11 px, HP do inimigo a 12 px e do herói a 16–20 px; rodapé reorganizado e títulos góticos preservados. Etapa atual restrita ao computador. |
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

## Nº 3 — peso e reação dos golpes (computador)

- O herói antecipa o ataque com 3 px para trás e avança 10 px; o inimigo recua 3 px no golpe comum ou 5 px no crítico. Contra-ataques movem o inimigo 8 px e o herói 5 px, somente no sprite; sombras de contato permanecem no chão.
- No crítico destacado, as poses do herói e do inimigo seguram por **50 ms**, por keyframes. A simulação, o relógio, danos, recompensas e saves continuam imediatos; não há timers de retomada.
- O único `#duelSlash` já existente desenha o golpe em CSS transparente: 140 ms no comum e 170 ms no crítico, começando no contato da arma (66/75 ms). Usa as coordenadas armazenadas pela etapa nº 2, sem medir layout por golpe.
- `#arenaCamera` reúne só cenário, iluminação e névoa. O crítico destacado provoca tremor de até **2 px por 140 ms**. HUD, nome, HP, números e eventos ficam fora dessa câmera.
- Intervalos de apresentação: 110 ms entre golpes e 700 ms entre tremores/retenções críticas. Os cliques continuam causando dano, mesmo quando o efeito visual é limitado.
- Orçamento fixo: quatro animações transitórias (`hero`, `enemy`, `impact`, `camera`). Novo golpe substitui o canal anterior. Fim/cancelamento, troca de perfil/menu, derrota, ocultação e movimento reduzido limpam as referências. Modo leve/movimento reduzido omitem os efeitos.
- Removidas as duas leituras de `offsetWidth` em `enemyStrike()`. Sem novos nós por golpe, loops, bibliotecas, imagens ou filtros animados.

Trechos: `game.js` (`combatMotionEnabled`, `animateCombat`, `clearCombatVisuals`, `playCombatImpact`, `playEnemyAttack`, integração em `damageMob`/`enemyStrike` e limpeza); `combat-events.css` (`.arena-camera`, `.duel-slash` e preferências de movimento); `index.html` (câmera só do fundo, caches `game.js?v=23` e `combat-events.css?v=5`).

`tests/combat-impact.cjs` valida comum, miniboss e Imperador em **1920×1080, 1366×768 e 1024×600**: retenção exata, HUD imóvel, dano/agendamento imediatos, ausência de leituras de layout, intervalos, rajadas, limpeza e preferências. As suítes existentes aceitam `DESKTOP_ONLY=1`; sem essa flag, continuam completas. `PERF_DEVICE=desktop PERF_IMPACT=1` mede ataques críticos e contra-ataques com instrumentação idêntica antes/depois. O fixture de balanceamento substitui somente os novos métodos cosméticos por funções vazias.

Resultados e limites estão em `docs/performance-combat-impact.json`. A nova comparação após recuperação do ambiente passou: as dez cenas finais, incluindo críticos/contra-ataques, mediram **60 FPS** no desktop, dentro das tolerâncias de FPS/p95. Isso não representa garantia em todo computador. Foram repetidos após recuperar a cópia local do ambiente. Otimização/QA de celular ficam adiados por orientação do usuário; os estilos responsivos existentes foram preservados.

## Nº 4 — idle discreto, com pés e sombras apoiados (computador)

- Herói e inimigo recebem um único wrapper `.actor-idle` em torno da imagem. A sombra permanece fora dele; o ataque continua animando somente a imagem interna. O pé fica como origem da transformação (`50% 100%`).
- Respiração por escala vertical de 1,0065 no herói; 1,005 nos comuns; 1,004 em minibosses; 1,0025 em chefões. Balanço horizontal por inclinação de 0,15°, 0,12°, 0,09° e 0,07°, respectivamente. A variação é de poucos pixels, sem flutuação dos pés nem deformação grande da armadura.
- Ritmos distintos: herói 5,2 s; inimigo comum 6,4 s; miniboss 7,2 s; boss 8,4 s. O inimigo usa uma defasagem determinística por região e sprite, evitando movimento sincronizado e sorteios a cada render.
- O início do ataque/recuo marca o wrapper como `.actor-active` e pausa o idle no ponto atual. Fim ou cancelamento retoma a mesma fase. A retenção de 50 ms dos críticos da nº 3 continua preservada.
- Menu, modo leve, movimento reduzido e derrota do herói desligam a animação correspondente. A visibilidade da página usa o atributo `data-combat-idle-paused`, atualizado somente na mudança de visibilidade, para pausar abas ocultas.
- Orçamento: duas animações CSS contínuas enquanto o combate está visível, além dos quatro canais transitórios já existentes. Nenhum timer, loop, observador, leitura de layout por golpe/frame, asset ou biblioteca adicional. Wrapper/imagem/fase não são recriados em renders repetidos do mesmo sprite.

Arquivos: `game.js` (wrapper do inimigo e pausa/limpeza nos canais de ataque), `index.html` (wrapper do herói e caches `game.js?v=24` / `combat-events.css?v=6`), `combat-events.css` (keyframes e estados). As regras são restritas aos dois atores da arena; retratos, bestiário e HUD continuam estáticos.

`tests/combat-idle.cjs` verifica os 42 inimigos em 1366×768 e quatro casos extremos em 1920×1080 e 1024×600: linha dos pés, sombra fixa, amplitude, ritmos distintos, estado do jogo preservado, reutilização de nós/animação, pausa/retomada, cancelamento, ausência de trabalho do observador por frame, preferências, visibilidade, derrota e três ciclos de perfil. O teste geométrico usa seek controlado; os testes de ciclo de vida usam outra página sem manipulação manual das animações.

Resultados completos: `docs/performance-combat-idle.json`. A comparação passou nas 13 cenas, com 59–60 FPS finais e 60 FPS nos três casos de repouso. São medidas do ambiente de teste, sem garantia para todo computador. A flag de teste `PERF_IDLE=1` mede comuns, miniboss e Imperador colossal parados, com a simulação igualmente suspensa antes/depois. Otimização/QA de celular continuam adiados por orientação do usuário.

## Nº 5 — fontes e contraste da HUD (computador)

As informações operacionais usam Arial/sans-serif e tons claros de osso sobre as placas escuras existentes. O gótico permanece nos títulos de região e painéis. As regras novas começam em 1000 px de largura e 600 px de altura; as regras de celular não foram alteradas.

| Informação | Menor tamanho visível antes, nos seis testes | Agora |
|---|---:|---:|
| Recursos e fase | 7 px | 11 px |
| HP do inimigo | 8 px | 12 px |
| HP do herói | 11 px | 16–20 px |
| Regeneração / XP | 6 px | 11–12 px / 11 px |
| Legendas das relíquias | 8 px | 11 px |
| Atalhos visíveis | 9 px, alguns ocultos em janela baixa | 11 px |
| Ação da poção | 5 px | 11 px |

- Nome e nível do herói compartilham uma linha; HP pode ocupar a próxima linha quando o valor é longo. Regeneração e XP têm linhas próprias, sem reticências nos valores.
- O rodapé reserva mais largura para os dados do herói. Ícones das relíquias ficam um pouco menores para dar espaço às legendas e às teclas. A poção vazia continua desabilitada, mas sua legenda permanece legível.
- Janelas de 600–680 px de altura usam rodapé de 112 px, orbe de 94 px e imagens de relíquias de 44 px. O modo focado também acomoda valores em notação científica e nomes longos sem ultrapassar a tela.
- HP do inimigo ganha faixa de 16 px e texto com números alinhados. O cabeçalho sem margem extra mantém espaço acima da silhueta do chefão. A moldura continua sem o retângulo vermelho exterior.
- Cartões dos eventos reservam espaço para título de duas linhas e instrução. A fita não quebra em duas linhas; em janela baixa/estreita o cartão mede 128 px de largura.
- Nenhuma alteração em `game.js`, atributos, dano, loot, saves ou escala dos chefões. Nenhuma imagem, biblioteca, animação, timer, observador ou leitura de layout em produção foi acrescentada.

Arquivos e trechos:

| Arquivo | Alteração |
|---|---|
| `hud-legibility.css` | Bloco final `/* Desktop reading sizes: keep the painted frames and large gothic headings. */`, regras de recursos/fase/HP, `.hud-dock`, `.relic-caption`, `.hud-secondary` e eventos; duas media queries compactas para janelas baixas. |
| `index.html` | Cache `hud-legibility.css?v=2`; os scripts permanecem iguais. |
| `tests/hud-readable.cjs` | Medidas de fonte, texto completo, limites dos controles e dos eventos em seis resoluções; comum, miniboss, colossal e modo focado com valores altos. Capturas opcionais por `HUD_SCREENSHOTS`; comparação tipográfica por `READABILITY_REPORT` e `READABILITY_BASELINE=1`. |
| `tests/boss-scale.cjs` | Filtro opcional `DESKTOP_ONLY=1`, mantendo a rodada completa como padrão. |
| `docs/performance-hud-readable.json` | Baseline, resultado final das 13 cenas e limites da medição. |

Verificação geométrica: 1920×1080, 1536×864, 1366×768, 1280×720, 1024×768 e 1024×600. Testes incluem nomes extensos, valores até 1e250, molduras sem fundo vermelho e cartões de baú/goblin. As suítes existentes verificam combate, preferências, painéis, inventário, caça e escala dos seis chefões. Otimização e QA de telefone seguem adiados por orientação do usuário.

A comparação passou nas 13 cenas dentro da tolerância de 3 FPS / 5 ms de p95: **58–60 FPS** finais, contra 60 FPS de baseline. O códex ficou em 60→59 FPS e a caça em 60→58; as outras onze cenas em 60→60. O p95 final ficou em **16,7–16,8 ms** neste ambiente headless. Os números não são uma garantia para todo computador. A auditoria verificou 95 assets, 89 imagens raster e 42 monstros, sem arquivos órfãos ou duplicatas por bytes/pixels. Métricas completas em `docs/performance-hud-readable.json`.

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

Sem biblioteca adicional, filtros animados de blur/drop-shadow, leituras de layout por frame ou observador por partícula. Animar transform/opacity e parar tudo ao sair do combate ou ocultar a página. Respeitar modo leve e movimento reduzido. Recompensas, danos, saves e timer de 100 ms permanecem independentes dos efeitos. Rodar benchmark isolado antes/depois de cada etapa e checagem de assets. Nesta etapa validar computador; retomar QA de celular em retrato/paisagem quando o usuário solicitar.
