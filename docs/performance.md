# Chrome performance revision

The display no longer depends on a continuous game/background render loop. Simulation runs on a 100 ms timer while a profile is active and the page is visible. Pointer attacks still update immediately. The core HUD checks display values every 180 ms and writes only changed text, properties, attributes and bar transforms. The timer stops on the main menu and while the document is hidden; returning retains existing offline progression.

Removed the numeric MutationObserver that synchronously measured and resized text after each update. Removed the ambient parallax requestAnimationFrame loop, duplicated full-screen landscape layers, idle sprite/filter effects and animated menu particles. The battle DOM is display:none behind the menu. The menu title lighting is baked into a 900 px asset, and the 1.24 MB hero PNG is displayed through a 48 KB WebP. Scenery uses a single 1280 px image or a 720 px mobile variant.

## Controlled comparison

Chromium headless with SwiftShader; five-second frame samples at 1366×768 with 1× CPU and 390×844 with CPU throttled to 6× using CDP. This is a reproducible local comparison, not a hardware compatibility guarantee.

| Scenario | Before FPS | After FPS | Before task ms | After task ms |
| --- | ---: | ---: | ---: | ---: |
| Desktop menu | 60 | 60 | 519 | 86 |
| Desktop idle battle | 43 | 60 | 584 | 164 |
| Desktop attacks, 5 per second | 52 | 60 | 928 | 429 |
| 6× CPU menu | 58 | 60 | 2567 | 417 |
| 6× CPU idle battle | 48 | 60 | 4117 | 1335 |
| 6× CPU attacks, 5 per second | 36 | 58 | 4859 | 2486 |

The idle menu performs zero measured DOM mutations or style recalculations after settling. Under 6× CPU attack load, DOM mutations decreased from 3478 to 501 and p95 frame interval from 50.1 to 16.8 ms. Raw readings are in performance-results.json.

Run `node tests/performance.cjs results.json` with Playwright installed. Set CHROMIUM_PATH if needed. Run `node tests/hud-browser.cjs` for gameplay, layout, import/export and overlay regression checks.

## Visual revision

Full-width scene, floating region and enemy labels, an illustrated iron/bone vitality medallion, a continuous carved altar for the three existing relic illustrations, and restrained resource/navigation rails. The old dashboard boxes and separate rectangular relic slots are removed. The new medallion and rail are static transparent WebP images; interface text is rendered in HTML for readability and accessibility.
