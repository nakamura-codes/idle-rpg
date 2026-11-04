# HELLWARD changes

Preserve the browser game's performance with every gameplay or HUD change.

- Before editing runtime code, capture a same-environment baseline with
  `node tests/performance.cjs <before.json>` using `CHROMIUM_PATH` when needed.
- After functional/browser checks finish, run the benchmark in isolation with
  `PERF_BASELINE=<before.json> PERF_HUNT=1 node tests/performance.cjs <after.json>`.
  The comparison checks desktop/mobile at 6× CPU throttle, FPS and p95 frame time.
  Its 3 FPS / 5 ms tolerance accounts for short-sample noise; inspect the actual
  measurements and fix material regressions before publishing.
- Record the before/after results and relevant limits in the change documentation.
  Do not claim hardware-wide FPS guarantees from a headless benchmark.
- Keep simulation visible-profile-only, with the existing 100 ms timer and changed-
  value DOM writes. Avoid per-frame layout reads, animation observers, expensive
  filters and repeated rendering of hidden inventory panels.
- Run relevant deterministic gameplay tests and the browser regression suites.
  Review narrow-phone and landscape screenshots for new HUD controls.
- Preserve player saves, character items and campaign checkpoints unless the user
  explicitly asks to reset them. Publish authorized changes through the existing
  GitHub Pages workflow and verify the public runtime.
