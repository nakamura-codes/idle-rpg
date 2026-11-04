# Loot, bosses and repeatable hunts

This revision slows equipment acquisition while making scrap a useful gold source.
It preserves existing character levels, items and campaign progress. Saved games
gain optional hunt state and six regional good-loot counters; older saves receive
safe defaults without a reset.

## Loot rules

| Source | Equipment | Other rewards |
| --- | --- | --- |
| Normal enemy | 2% base, rising with luck to a 5% cap | Independent 70% scrap and 4.5% potion rolls |
| Miniboss first clear | 40%; 80% uncommon / 19% rare / 1% epic within that roll | 3 scrap units plus existing gold/XP |
| Region boss first clear | Guaranteed equipment; 90% rare / 9% epic / 1% legendary, quality at least 3 | 5 scrap units plus existing gold/XP |
| Treasure goblin | 20%; 85% rare / 14% epic / 1% legendary within that roll | 3 scrap units and existing gold/XP/fragments |
| Rare chest | 35%; same equipment rarity weights as the goblin | 4 scrap units and existing gold/XP/fragments |

Equipment selection now explicitly excludes potions and materials. Potion drops
have their own roll, so preparing for a boss remains practical even with scarce
equipment. Existing quality/attribute calculations and previously acquired items
remain intact.

Each region tracks normal enemies defeated in active combat since receiving a
rare-or-better piece of quality 5+. The 60th such kill guarantees a regional rare
equipment item with quality at least 5. Receiving an equally good random, boss or
event item resets that region's counter early. Low-quality rares do not erase it.
Counters survive death, travel, reload and hunt-mode changes; ascension starts a
new journey and resets them. Offline rewards retain their gold/XP-only behavior
and do not consume this active-combat guarantee.

The 2–5% figure is the random equipment roll, separate from the guaranteed reward.
In a seeded 100,000-kill test with base luck, actual generated rewards were 69,706
scrap units, 4,524 potions and 3,706 equipment pieces including guarantees. The same
test validates every region's worst-case guaranteed reward.

Scrap sale value is `floor(6 × 2.15^regionIndex)` per unit, rather than the old
`floor(2 × 1.9^regionIndex)`. Values depend on region rather than the first item's
level in a stack. Scrap bundles now add their complete quantity when stacking.

## Repeat a phase without losing the campaign

Regiões → Repetir fase lets the player select any phase reached in the current
region. Normal enemies repeat there, providing XP, gold, scrap, potions and the
same equipment guarantee. The campaign's phase, kills and mandatory boss flags
are not modified. Retomar expedição restores the exact checkpoint and pending boss
at full enemy health; switching mode does not heal the character.

The active stage supplies the correct enemy health and rewards. Unreached phases
and locked regions cannot be selected. Offline hunting can earn gold/XP in the
selected phase; normal offline campaign progression still stops at mandatory bosses.
Travel leaves hunt mode, and ascension clears it with the rest of the journey.

## Boss damage and armor

Normal enemy damage and mitigation are unchanged, preserving places to train.
Elites use stronger regional damage growth (1.64 rather than 1.46). Boss/miniboss
multipliers are now 3.2 / 2.05 instead of 2.65 / 1.8. Armor has diminishing returns
with a regional scale and can mitigate at most 75% of boss damage or 85% of miniboss
damage. Health investment never raises incoming damage: the formula does not scale
with player maximum HP or equipped-item power.

The actual attack and the chronicle damage preview share `enemyHitDamage`.
At phase 10, a character with 600 defense receives:

| Region | Raw boss hit | Received hit |
| --- | ---: | ---: |
| Campos de Cinza | 54 | 14 |
| Bosque Profanado | 89 | 22 |
| Criptas Afogadas | 145 | 36 |
| Fortaleza de Ferro | 238 | 60 |
| Fendas Infernais | 391 | 98 |
| Trono do Crepúsculo | 641 | 166 |

For comparison, the previous final-boss formula gave roughly 12 damage against
600 defense. Defense and health still buy survival time; armor alone no longer
erases late bosses. Enemy HP and existing equipment statistics were not inflated
or retroactively reduced to force this outcome.

## Performance and validation

The Ampliar control and its handler are removed. Panel opening now resets the
visible scroll container, and subsequent updates preserve that container's position.
Loot does not independently redraw the hidden inventory; combat batches its visible
panel update once per kill. New probability/counter work happens per kill, not per
frame. No new animation, timer, observer or graphical effect is introduced.

- `node tests/balance.cjs`: deterministic 100,000-kill distribution, all six loot
  guarantees, armor extremes, hunt checkpoint/XP/gold behavior, offline boundaries,
  scrap quantities, counter persistence and old-save normalization.
- `tests/gameplay-inventory.cjs`: actual hunt controls, repeat/resume and stored
  fields, plus inventory/offline/panel regressions at four viewport sizes.
- `tests/hud-browser.cjs`: 13 HUD viewports, all 42 creatures at three sizes, removal
  of Ampliar, combat, points, equipment, themes, import/export and return-to-menu.
- `tests/content-art.cjs`: all item/status icons, batch attributes and creature sizes.
- `tests/performance.cjs`: same-environment before/after samples with the optional
  `PERF_HUNT=1` workload and `PERF_BASELINE=<before.json>` regression comparison.

The per-change performance workflow is also recorded in AGENTS.md. Results for this
revision are in balance-performance.json; these measurements describe the test
environment rather than all possible devices.

### Measured frame rates

| Scenario | Desktop before → after | 6× CPU mobile before → after |
| --- | --- | --- |
| Menu | 60 → 60 FPS | 60 → 60 FPS |
| Idle battle | 60 → 60 FPS | 60 → 60 FPS |
| Attacks, 5/s | 60 → 60 FPS | 58 → 59 FPS |
| Open Livro Negro | 60 → 60 FPS | 60 → 60 FPS |
| Repeat-phase attacks, 5/s | 60 → 60 FPS | 58 → 58 FPS |
| Return to menu | 60 → 60 FPS | 60 → 60 FPS |

The final samples retained a p95 frame interval of approximately 16.7–16.8 ms.
Idle menu samples had zero DOM mutations, layouts or style recalculations. The new
hunt workload is compared with the earlier attack workload because it did not
exist in the baseline. The automated tolerance check passed.
