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
