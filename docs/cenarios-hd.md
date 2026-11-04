# Cenários HD — Hellward

Registro da direção de arte das seis regiões, geradas com a ferramenta integrada imagegen. Resolução nativa entregue na geração: **1672 × 941 pixels**. A versão ativa utiliza as texturas otimizadas em `assets/backgrounds/fast/`, com variantes para desktop e celular. Os arquivos anteriores em HD foram retirados da árvore atual; suas versões permanecem no histórico Git.

A implementação ativa usa uma pintura estática por região. As camadas antigas, suas texturas e os scripts de parallax de batalha foram removidos após a revisão de desempenho. Os personagens permanecem separados do cenário. Abaixo estão os briefs e prompts que originaram as pinturas, para referência de direção artística.

## Direção e prompts de geração

Método: ferramenta integrada, sem CLI/API externa. Pedido de resolução: 2560 × 1440 ou a maior resolução nativa disponível; resultado: 1672 × 941.

Prompt comum das regiões II–VI:

> Use case: stylized-concept. ONE production landscape background for dark fantasy RPG HELLWARD, region [REGION]. Highest native resolution, request 2560x1440 16:9. Premium hand-painted dark fantasy environment illustration, very detailed sharp brushwork and convincing stone/natural materials, refined game art, not pixel art or blurry upscaled imagery. Scene: [SCENE]. Consistent side-on battle camera slightly above ground, horizon at 48% height. Bottom half is an empty flat plane with very subdued surface texture, medium-dark neutral values for readable separate characters; no tall objects or obstructions in left or right combat positions. Interesting architecture and landscape only in distant top half. Coherent vanishing points, cinematic atmospheric depth and restrained light, elegant legible composition. No characters, creatures, text, interface, frames, watermark. Full backdrop for compositing with a separate ground plane.

| Região | Scene |
|---|---|
| Bosque Profanado | ancient towering twisted forest, distant ruined abbey, deep jade foliage, teal mist, narrow shafts of pale moonlight, EMPTY flat earth clearing |
| Criptas Afogadas | vast flooded subterranean gothic crypt, tall distant arches and eroded statues, cyan reflections in distant water, EMPTY dry broad stone terrace |
| Fortaleza de Ferro | massive medieval iron fortress, distant buttresses and furnaces, iron gray stone and restrained copper firelight, EMPTY flat fortress courtyard |
| Fendas Infernais | vast basalt volcanic canyon, distant glowing lava fissures and black spires, red ember sky and restrained amber glow, EMPTY flat black basalt plateau |
| Trono do Crepúsculo | immense distant ruined gothic throne citadel below an eclipsed violet sky, monumental arches and distant black mountains, silver violet rim light, EMPTY broad obsidian stone terrace |

Prompt de Campos de Cinza:

> Use case: stylized-concept. Production game background for HELLWARD, region Campos de Cinza. Create ONE ultra high quality landscape image at 2560x1440 (16:9) if supported, otherwise highest native landscape resolution. Detailed hand-painted dark fantasy environment, polished premium 2D RPG illustration, sharp fine brushwork and convincing materials, not pixel art, no low resolution textures. Distant ruined gothic citadel on the right third, layered blue slate mountains, ash drifting through a warm amber dusk sky, restrained dramatic volumetric light. Horizon at 48% height, broad EMPTY flat ash plain filling bottom half with sparse subtle surface texture, no large foreground rocks, no foreground ruins. Side-on battle camera slightly above ground, not overhead. Left third and right third must remain uncluttered for separately rendered characters. The lower half must be medium-dark neutral, readable against steel armor and monsters. Strong atmospheric depth, coherent perspective, elegance over clutter. No characters, no monsters, no skull sun, no text, UI, borders or watermark. This is a full backdrop to be combined with separately rendered foreground ground plane.
