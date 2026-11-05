# Monstros restantes, Errante e atmosfera regional

Os 11 monstros mantidos na primeira revisão foram refeitos: Guerreiro Esquelético, Zumbi Errante, Cavaleiro Decapitado, Lobo Sombrio, Ratazana Pestilenta, Rei das Ratazanas, Hidra Profanada, Rei Lich, Cavaleiro do Abismo, Dragão das Fendas e Imperador do Crepúsculo. Assim, os 42 monstros do jogo agora usam arte revisada. Foram removidos os dez PNGs anteriores e o retrato antigo do Imperador; não há cópias de reserva dentro dos assets ativos.

O Errante recebeu gravuras góticas, metal escurecido, correias e malha detalhadas, tecido desgastado, marcas de cinza e sombras pintadas nas peças da armadura. A pose continua voltada à direita, com espada e escudo. Os monstros continuam voltados à esquerda, com os portes existentes. O Imperador mantém seu formato vertical e a escala colossal. As imagens têm transparência real; usam WebP de 512 ou 768 pixels de largura, com 1016 pixels de altura para o Imperador.

| Região | Iluminação | Névoa/fumaça |
| --- | --- | --- |
| Campos de Cinza | Cobre e cinza quente | Poeira cinzenta baixa |
| Bosque Profanado | Verde doentio | Névoa musgosa |
| Criptas Afogadas | Ciano funerário | Névoa fria mais densa |
| Fortaleza de Ferro | Âmbar de forja | Fumaça discreta |
| Fendas Infernais | Vermelho de brasa | Fumaça vulcânica |
| Trono do Crepúsculo | Violeta crepuscular | Névoa espectral |

Os ambientes usam duas camadas CSS estáticas, sem timers, desfoque, mistura de filtros ou animações por quadro. As mesmas paletas acompanham a arena específica de cada chefão. No modo leve, a névoa é reduzida. As camadas não interceptam cliques ou toques e não alteram as dimensões do combate.

O herói e os 42 inimigos têm sombras de contato e projeção no chão. O deslocamento acompanha a direção da luz regional, e a extensão respeita o porte da criatura. As sombras ficam atrás das imagens e acima do cenário. Há sombras também nas miniaturas do bestiário, na ficha de inspeção e nas ilustrações dos eventos. As novas pinturas incluem sombras de forma e oclusão entre placas, ossos, pelos e escamas.

## Verificações

- Auditoria de referências, órfãos e duplicações por bytes/pixels: 95 assets, 89 imagens raster e 42 monstros canônicos transparentes.
- Fichas de todos os monstros abertas três vezes, com um único retrato e bloco de informações.
- Seis paletas regionais e seis configurações de névoa distintas, com camadas sem filtros ou captura de ponteiro.
- Comparação de pixels com e sem a sombra confirmou escurecimento visível do chão.
- Enquadramento de criaturas pequenas, gigantes e do Imperador em desktop, celular e paisagem; escala do Imperador superior a 2,1× a altura do herói.
- Combate, Q, seleção por toque, eventos, pontos, inventário, progressão e saves verificados pelas suítes existentes.

O inventário e os hashes estão em `atmosphere-review.json`; os prompts completos estão em `art-prompts.json`. A medição de FPS desta etapa está em `performance-atmosphere.json`, com resultados brutos e limites da simulação.

## FPS desta etapa

| Ambiente | Antes: mínimo / mediana / máximo | Depois: mínimo / mediana / máximo |
| --- | --- | --- |
| desktop | 8 / 51.5 / 60 | 22 / 59.5 / 60 |
| mobile-6x | 7 / 42.5 / 59 | 12 / 36.5 / 57 |

Comparação automática: **failed**, com 16 situações fora da tolerância de 3 FPS / 5 ms de p95. O ambiente já apresentou grande oscilação antes das mudanças, inclusive 8 FPS no desktop e 7 FPS no celular simulado. Os dados completos, incluindo resultados baixos e casos sinalizados, foram preservados. A estabilidade de FPS no telefone real permanece pendente; não há garantia de desempenho em hardware real. As camadas ambientais são estáticas e não acrescentam timers, filtros ou atualizações por quadro.

As 12 novas imagens somam 1.925.018 bytes, contra 7.845.079 bytes dos arquivos substituídos: redução de 75,5% na transferência de imagens. Isso não equivale a uma medição de FPS.
