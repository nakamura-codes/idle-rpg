# Item/status art and creature proportions

All 100 catalog items now resolve to an illustrated icon. Six regional 512×640 WebP
atlases replace the tiny pixel icons in inventory, equipment slots and quick potions.
A seventh 512×384 atlas contains 12 semantic status illustrations: damage, ritual,
critical strike, fortune, vitality, defense, strength, will, regeneration, gold,
compass and souls. The six summary stats, four allocatable attributes and seven
upgrades use these illustrations. Runtime rendering is CSS backgrounds, with no
canvas or animation loop. All URLs come from bundled metadata, never imported saves.

Old equipment without a catalog ID gets a matching catalog-name icon or a safe
slot illustration. Its attributes, identity and value remain unchanged. Empty slots
show a dimmed type illustration. Save versions and item balance are unchanged.

## Attribute batches

Select x1, x5, x10 or MAX in the Livro Negro, then apply to an individual attribute.
Each action is clamped to the available point budget; MAX spends only that budget.
Actual combat bonuses, vitality health gain and saving happen once per action.
Vitality adds 15 current HP per applied point only while alive, matching the former
single-point behavior. Dead characters receive no healing from allocation.

## Art preparation

`tools/build-item-atlases.mjs sources.json` takes seven original generated-image
paths in JSON (six regional sheets in catalog order, then the status sheet). It
extracts fixed grid cells, trims alpha and fits each whole icon within a 114px box
on a 128px transparent tile. It refuses empty cells and emits the atlases and
`game-art.js`. Run without an argument to rebuild just the metadata.

Images were produced with the built-in image generation tool. Item prompt template:
production hand-painted gothic dark fantasy inventory atlas, exactly four columns
and five rows, true transparency, distinct whole objects, clear cell gutters, no
text/numbers/grid/frames/background. Cell instructions use each item's `nome` and
`visual` verbatim from `item-catalog.js`, grouped by `regiao`, left-to-right then
top-to-bottom, with unused trailing cells empty. The status prompt uses a 4×3 grid
of crossed steel swords, violet ritual fire/bowl, skull pierced by dagger, golden
star coin, crimson anatomical heart, spiked iron shield, iron gauntlet, violet eye,
healing blood flask, tattered reward banner, amber compass and amethyst soul crystal.

`assets/monsters/imperador-colossal.webp` is an edited portrait version of the old
wide final-boss sprite. The edit preserves black spiked armor, eclipse head/flame
corona, crimson wings, burning blade and void orb; it raises the wings and gives the
titan a tall complete body, with transparent background and no text or environment.
The previous source portraits remain recoverable in Git history. The portrait silhouette fits narrow phones
without stretching or clipping the wings, blade or feet.

## Creature direction

`data/monster-proportions.json` is the editable source of the 42 authored sizes.
Height values describe a requested percentage of arena height; available space,
screen width and whole-sprite containment provide responsive limits. Small
creatures receive an extra portrait-phone cap. The hero is modestly smaller for
normal fights and scales down for giants/colossal encounters to preserve contrast.
The final boss uses the available arena height and exceeds 2.1 times the hero's
rendered height in all four test viewports. The hit points and difficulty are unchanged.

| Creature | Size | Requested arena height |
| --- | --- | ---: |
| Condenado Errante | Médio | 47% |
| Guerreiro Esquelético | Médio | 49% |
| Sentinela Caída | Médio | 50% |
| Arqueiro Macabro | Médio | 47% |
| Zumbi Errante | Médio | 48% |
| Espadachim Corrompido | Grande | 58% |
| Cavaleiro Decapitado | Grande | 65% |
| Lobo Sombrio | Pequeno | 30% |
| Ratazana Pestilenta | Pequeno | 23% |
| Lobo da Praga | Pequeno | 33% |
| Entorpecido de Musgo | Grande | 62% |
| Goblin Selvagem | Pequeno | 32% |
| Rei das Ratazanas | Grande | 64% |
| Hidra Profanada | Gigante | 86% |
| Espectro da Cripta | Médio | 49% |
| Alma Enregelada | Pequeno | 37% |
| Lamento Submerso | Médio | 50% |
| Afogado Sem Rosto | Médio | 47% |
| Sacerdote Esquecido | Médio | 51% |
| Bruxa das Criptas | Grande | 60% |
| Rei Lich | Grande | 68% |
| Golem Ferrugem | Gigante | 76% |
| Carcereiro Rúnico | Grande | 62% |
| Guardião de Basalto | Gigante | 84% |
| Orc Carniceiro | Grande | 66% |
| Construto Enferrujado | Gigante | 78% |
| Ogro do Ferro | Gigante | 86% |
| Cavaleiro do Abismo | Gigante | 80% |
| Arauto das Chamas | Grande | 64% |
| Demônio Carmesim | Grande | 68% |
| Flagelo Abissal | Gigante | 80% |
| Súcubo das Cinzas | Médio | 50% |
| Sombra Incandescente | Grande | 70% |
| Devorador Mórbido | Gigante | 84% |
| Dragão das Fendas | Gigante | 92% |
| Lich Imortal | Grande | 64% |
| Rei das Sombras | Grande | 68% |
| Devorador de Estrelas | Gigante | 82% |
| Sacerdote do Vazio | Grande | 63% |
| Arauto do Eclipse | Grande | 72% |
| Medusa do Eclipse | Gigante | 86% |
| Imperador do Crepúsculo | Colossal | 100% |

## Validation

- `node tests/hud-browser.cjs`: 13 viewport layouts, all 42 monsters at three
  viewports, boss-bar separation, equipment, combat and saving regressions.
- `node tests/gameplay-inventory.cjs`: best-item ranking, bulk/individual sales,
  protected equipment/potions, concurrent drops, offline return and six panels.
- `node tests/content-art.cjs`: all 112 item/status atlas cells are visible with
  transparent gutters; old equipment fallback; batch points, real bonuses, budget
  clamp and death behavior; small/giant/colossal visual ratios at 1366×768,
  390×844, 320×568 and 844×390; export persistence and no JS/asset errors.

The browser suites accept CHROMIUM_PATH and HUD_SCREENSHOTS as documented in each file.
