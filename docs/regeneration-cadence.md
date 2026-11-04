# Regeneration and enemy cadence

Boss combat now accounts for both incoming damage and healing between attacks.
Character items, natural recovery formula, potion healing, saves, boss hit damage
and enemy HP remain intact. This revision changes attack timing and passive
recovery against elites.

| Enemy | Previous interval | New interval |
| --- | ---: | ---: |
| Common | 2.75 s | 2.4 s |
| Miniboss | 3.05 s | 2.2 s |
| Boss | 3.6 s | 2.0 s |

The existing visible-game 100 ms clock schedules the faster attacks. There are no
new timers, rendering loops, observers or graphical effects. Saved/resumed and
fresh enemies use the same interval helper.

## Recovery under elite pressure

Natural recovery remains `0.55 + maximumHP × 0.0025 + recoveryRank × 0.65` per
second. Common enemies retain this full rate. For elites, a fixed regional budget
is calculated from the enemy's raw hit and attack interval:

```text
budget = rawEnemyHit × 0.075 / attackIntervalSeconds
activeRecovery = naturalRecovery / (1 + naturalRecovery / budget)
```

This soft saturation leaves every recovery upgrade useful while preventing
passive healing from erasing elite damage. The pressure budget does not read
player defense, maximum HP or equipment power. Better armor therefore never
reduces healing, and stronger health/recovery still improve survival. At the
existing armor mitigation floors, passive regeneration approaches roughly 30%
of boss incoming damage per second or 50% for minibosses (small integer-hit
rounding differences apply), while staying below those limits for finite builds.

Returning to common-enemy hunts restores full natural recovery immediately.
Mode switching still restores the pending boss at full enemy health, preventing
partial-boss healing loops. Potions, level-up healing, attribute healing and
revival keep their existing effects. Offline rewards retain the previous rules.

The HP HUD displays the active rate and provides the natural value in its tooltip.
Crônicas → Visão da Batalha shows both values, including on touch screens. Sangue
Renovado explicitly describes natural recovery and the effect of elite pressure.

## Validation

`tests/balance.cjs` now uses a controlled clock to exercise the actual simulation
and attack scheduler. A 60-second fourth-region boss fight receives exactly 30
hits. A prepared level-60 character with 4,377 maximum HP, approximately 600 armor
from gear, 100 vitality upgrades and 30 recovery upgrades has about 31 natural
HP/s but about 6.9 effective HP/s. Starting at 70% life, it loses over 1,000 HP
across the minute, without dying in the fixture. A potion still restores its full
regional amount, and common-enemy recovery returns to the natural value.

The suite also checks every region, extreme armor/recovery values, monotonically
useful recovery upgrades, defense-independent healing budgets, attack intervals,
the existing loot distribution, guarantees, hunt progression and save migration.
Browser suites cover the HP/chronicle rate agreement, 13 HUD sizes, all creature
bounds, six panels, inventory, points, hunts and persistence. Screenshots of the
new chronicle fields were reviewed on narrow phones and desktop.

## Performance comparison

Raw same-environment measurements are in regen-performance.json. All comparisons
passed the existing FPS/p95 tolerance gate. The benchmark was run after the final
runtime changes, in isolation from browser regression suites.

| Scenario | Desktop before → after | 6× CPU mobile before → after |
| --- | --- | --- |
| Menu | 60 → 60 FPS | 60 → 60 FPS |
| Idle battle | 60 → 60 FPS | 60 → 60 FPS |
| Attacks, 5/s | 60 → 60 FPS | 59 → 58 FPS |
| Livro Negro | 60 → 60 FPS | 60 → 60 FPS |
| Hunt attacks, 5/s | 60 → 60 FPS | 57 → 58 FPS |
| Return to menu | 60 → 60 FPS | 59 → 60 FPS |

The p95 frame interval remained approximately 16.7–16.8 ms. Idle-menu samples
retained zero DOM mutations, layouts and style recalculations. These are measured
test results, not a guarantee for every device.
