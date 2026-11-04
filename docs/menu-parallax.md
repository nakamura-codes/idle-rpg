# Menu infernal em parallax — 4 de novembro de 2026

O menu utiliza as seis camadas fornecidas pelo usuário: céu, ruínas, vale de
lava, plataforma, cavaleiro e névoa/brasas. A composição mantém o personagem
à esquerda e os comandos à direita, com título, botões e texto imóveis.

## Composição e movimento

Para preservar a fluidez, seis fontes viraram dois planos WebP:

| Plano | Arte | Deslocamento horizontal máximo |
| --- | --- | ---: |
| Fundo | Céu, ruínas distantes e vale de lava | 5 px |
| Primeiro plano | Plataforma, cavaleiro, névoa e brasas | 24 px |

O eixo vertical usa 45% desses valores. A escala de segurança de 7% cobre os
limites mesmo nos extremos. O cavaleiro foi reduzido a 63%, reposicionado na
plataforma e unido a ela no build; seus pés não deslizam durante o movimento.
O fundo estático e os planos compartilham a mesma composição e enquadramento.
O foco dos controles não desloca a tela fixa; o ajuste de escala também limpa
qualquer rolagem residual ao abrir painéis em celulares estreitos.

O efeito responde ao ponteiro e suaviza apenas `transform` com CSS. Há no
máximo um `requestAnimationFrame` agendado por entrada; não existe loop de
animação ocioso, movimento automático, leitura de layout por frame, filtro ou
observador adicional. Os listeners do ponteiro são removidos quando o menu
fecha, a página fica oculta ou o movimento é desativado. A batalha não recebe
esse efeito. A volta ao menu o reativa quando permitido.

Em telas de até 900 px, toque, movimento reduzido, economia de dados,
memória reportada de até 4 GB ou até quatro processadores lógicos reportados,
é utilizado um único fundo estático. As duas texturas extras não são
solicitadas nesses casos. Esses sinais são heurísticas; APIs indisponíveis
não são tratadas como prova de aparelho fraco. Uma falha no carregamento dos
planos também preserva o fundo estático e os controles.

As configurações do menu incluem “Movimento do cenário”. A preferência é
salva em `hellward_menu_motion`, independente dos perfis e saves do jogo.
O botão fica indisponível quando o dispositivo ou a preferência do sistema
solicita a versão estática.

## Reconstruir a arte

Com Sharp disponível, execute:

```sh
node tools/build-menu-parallax.mjs sources.json
node tools/check-assets.cjs
```

`sources.json` é um array com seis caminhos locais, nesta ordem:

| Camada | Arquivo fornecido |
| --- | --- |
| Céu | `image(20261104-151649).png` |
| Ruínas | `image(20261104-151657).png` |
| Vale | `image(20261104-151705).png` |
| Plataforma | `image(20261104-151710).png` |
| Cavaleiro | `image(20261104-151715).png` |
| Atmosfera | `image(20261104-151720).png` |

Os PNGs originais não são duplicados no repositório. A ferramenta gera dois
planos de 1536 px de largura e substitui os dois fundos estáticos já existentes
em `assets/ui/`. O fundo menor tem 960 px de largura. Não há recorte ou geração
de imagens em tempo de execução. O menu usa a mesma marca e os botões atuais;
equipamentos, drops, combate e formato dos saves permanecem iguais.

## Verificação

- `tests/menu-parallax.cjs`: duas profundidades distintas, margem de segurança,
  comandos imóveis, preferência persistida, pausa durante o jogo, retorno ao
  menu, oito tamanhos de tela e seis cenários de fallback, incluindo falha de
  textura, sem erros JavaScript.
- Suítes de HUD, inventário/gameplay, arte e balanceamento aprovadas.
- Revisão visual do menu em 320×568 e 844×390 e do menu com profundidade no
  navegador de prévia. Auditor de assets sem dependências ausentes/órfãs.
- O benchmark adiciona `PERF_PARALLAX=1`, que movimenta o ponteiro no desktop;
  `PERF_MENU_ONLY=1` permite medir somente o menu durante ajustes.

### Desempenho final

Benchmark isolado após os testes funcionais, Chromium headless/SwiftShader,
amostras de 5 segundos. Desktop 1366×768 CPU 1×; celular 390×844 CPU 6×.
Dados completos em `menu-parallax-performance.json`.

| Cena | Desktop antes → depois | Celular 6× antes → depois |
| --- | ---: | ---: |
| Menu parado | 60 → 60 FPS | 60 → 60 FPS |
| Batalha sem cliques | 60 → 60 FPS | 60 → 60 FPS |
| Batalha com cliques | 60 → 60 FPS | 59 → 58 FPS |
| Livro Negro | 60 → 60 FPS | 60 → 60 FPS |
| Caça com cliques | 60 → 60 FPS | 58 → 59 FPS |
| Retorno ao menu | 60 → 60 FPS | 60 → 60 FPS |

Com o ponteiro em movimento, o novo menu atingiu **59 FPS**, p95
**16.8 ms** e **0 recálculos de layout** durante a amostra.
As 12 cenas equivalentes e a cena adicional respeitaram os limites de 3 FPS/5 ms.
Os primeiros ensaios com cinco planos foram rejeitados por custo de composição;
a publicação utiliza dois planos. Esse benchmark de curta duração não garante
FPS em todos os aparelhos. A versão estática e a opção de desligar o movimento
permanecem disponíveis.

