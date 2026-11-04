# Gameplay panels

The gameplay interface uses a shared carved iron and bone frame, crimson surfaces,
illustrated panel headers, equipment sockets and region landscapes. The offline
return dialog separates elapsed time, kills, gold and XP. Player identity comes
from the active profile, including the health HUD and inventory title.

The existing health medallion remains intact. Decorations are static: no new
animation loops, blur layers or per-frame JavaScript were introduced. The shared
512px WebP frame is reused with CSS border-image. Existing save formats and the
visible-game-only simulation clock are unchanged.

## Inventory behavior

- **Equip best:** compares the existing weighted `itemPower` score independently
  in each of the six equipment slots. Actual attributes determine the result;
  rarity alone does not. Ties keep the currently equipped item. This action does
  not sell items, consume potions, spend gold or restore health.
- **Bulk sales:** select scrap/common, an exact rarity, or all unequipped items.
  The preview shows unit count and total gold. Equipped items and potions are
  excluded. Every bulk sale requires confirmation.
- **Confirmation snapshot:** only the items offered when the dialog opened can
  be sold. Eligibility is checked again on confirmation, protecting items equipped
  in the meantime and drops obtained while the dialog was open.
- **Individual sales:** rare, epic and legendary equipment require confirmation.
  Equipped items cannot be sold.

## Validation

With Playwright available, run:

```sh
node tests/hud-browser.cjs
node tests/gameplay-inventory.cjs
```

`CHROMIUM_PATH` can select a local browser. `HUD_SCREENSHOTS` can capture panels.
The inventory suite checks all slots, real-stat ranking, ties, health, cancellation,
sale proceeds, protected equipment/potions, concurrent drops, persistence and the
actual offline return. It checks all six panels at 1366×768, 390×844, 320×568 and
844×390 with no horizontal clipping or JavaScript/asset errors.

## Readability and Dornen experiment

Relic names and subtitles now share individual opaque plaques with aligned
baselines. Their minimum sizes are 10px and 8px respectively, including 320px
screens. Region and enemy headers occupy separate aligned columns on desktop and
stack on portrait phones. Boss health bars reserve a gap above the sprites.

`assets/fonts/Dornen.ttf` is the original user-supplied font by Dieter Schumacher;
its included license is retained as `LICENSE-Dornen.txt`. The original has no
Portuguese accents. `tools/build-dornen.py` produces `dornen-ui.woff` with angular
accent outlines for Portuguese precomposed letters, retaining the base outlines.
Rebuild with `python tools/build-dornen.py` (fonttools required).

Dornen UI is limited to large gameplay titles. Settings → Appearance offers
**Dornen · teste** and **Clássica**; the preference persists separately from saves.
Body copy, numbers and small controls keep their readable fonts. No new animation
or rendering loop is used.

The region emblem at `assets/ui/regions-tree.webp` is a transparent 256px WebP
generated with the built-in image tool, then optimized for the header/navigation.
Generation brief: a single ancient sinister tree with gnarled black bark, crooked
bare branches, twisted roots and restrained orange/red infernal flames; hand-painted
gothic dark fantasy game illustration, centered clear silhouette, transparent
background, no scenery, characters, frame or text.

The browser suite additionally checks plaque alignment, text containment and
minimum font sizes at 13 viewports, loading and switching Dornen, and the region
emblem. Gameplay/inventory regression coverage remains unchanged.
