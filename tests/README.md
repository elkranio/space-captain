# Test boundaries

Run the complete suite with `npm test`; a focused file still works with `npm test -- <path>`.
`vitest.config.mts` separates two kinds of checks:

| Project | Files | Content source |
| --- | --- | --- |
| `scenarios` | `app/`, `engine/encounter/`, `engine/defs/` | Explicit `fixtures/scenario_content.json` |
| `live-content` | All other test files, including content, generation, runtime and editor tests | Actual workspace JSON |

Scenario setup replaces JSON inputs only. Schemas, catalogs, factories, command legality, gameplay and app adapters
remain real. Keep Vitest's per-file isolation enabled. The fixture is a controlled combat setup, not a second shipping
balance: do not regenerate it after editor changes. Change it deliberately when a scenario needs different inputs.

- Mechanical scenarios may use exact numbers to express a boundary, a salvo or a race. Their inputs must be explicit
  fixture data or values set in that test. Prefer definition-derived durations when the exact number is irrelevant.
- Live-content tests compare loaded/factory state with current JSON or its catalog definition. Do not freeze editable
  Hull, integrity, damage, ammunition, labels, timings or Debug Start loadout in expected literals.
- Invalid-input tests should start from valid data and assert the intended error/field. A failure on an unrelated missing
  field does not prove validation of the field under test.
- Inject deterministic RNG into encounter scenarios. Supply a sequence when the choice/order of random calls matters.
- Keep assertions on resource spending, cancellation, event order, detached state and hidden-information boundaries.
  Do not remove them merely because balance changed.
- Partial app test doubles are acceptable at adapter boundaries. Prefer actual typed state fixtures for engine queries.

## Audit notes

The audit covered the original 124 test files: engine mechanics/queries, app adapters, content/factories, runtime and
editor tests. Removed `StickyMineModel.test.ts` (a balance lock plus assertions on hand-written object literals) and
`content/new_game_player_weapons.test.ts` (covered by `create_new_run_state` and runtime weapon tests).
Removed redundant checks for old turret charge fields; exact factory-state assertions remain.

Balance-loading assertions now follow JSON, factory ammunition limits follow definitions, and runtime persistence uses
installed hardware IDs. Editor checks permit additional records/sprites and find the configured Drive by type.
Resource assertions removed in the incoming working tree were restored against starting charges.

Deferred production findings, not test exceptions:

- `power_cores` schema permits `rechargeDurationMs: 0`, and the recharge runner handles an already installed zero-duration
  core. `PowerCoreFactory` and `GameRuntime` reject elapsed time `0` against duration `0`, so such content cannot start a
  run. Resolve this contract explicitly; do not make live-content tests ignore the error.
- Asset deletion still protects `generic_00` / `unknown_00`, while the current chassis manifest uses `generic`. The test
  accurately exercises the existing registry policy, but the production policy needs a separate correction.

Verification included an alternate JSON-import balance (Hull 1, ammo 0, Core capacity 1, changed integrity, damage,
durations, labels and AI tuning) without modifying workspace content. This proves separation from those tuning values;
it does not prove every possible loadout or balance combination is playable. Real-content factories/reference checks
must still fail on invalid content or broken production contracts.
