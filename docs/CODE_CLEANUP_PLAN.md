# Space Captain — Code Cleanup Plan

Temporary campaign plan for Web Chat. This document orders cleanup work; it does not replace
`WORKING_RULES.md`, `SYSTEM_MAP.md` or current gameplay contracts.

The goal is to reduce proven legacy, unclear ownership, hostile transport and unnecessary navigation without
changing gameplay or inventing a new architecture. Work one green atom at a time from fresh `master`. Delete this
plan after the campaign is complete; Git owns the history.

## Campaign rules

- Read `../CURRENT_HANDOFF.md`, `WORKING_RULES.md` and only the relevant durable docs before each atom.
- Fetch fresh `master`, then obtain the full exact contents of every touched source/test file.
- Prove imports, producers/consumers and runtime ownership before deleting or moving code.
- Keep behavior fixed unless the user explicitly makes a gameplay decision part of the atom.
- Split by responsibility and ownership, not line count.
- Prefer explicit `if`, `switch`, direct calls and small local helpers over registries/frameworks.
- Do not turn engine state into a generic equipment bag merely for symmetry.
- Do not pass mutable engine state into Phaser/app views.
- Do not replace the local typed Bridge event boundary with a global bus/service locator/outbox.
- Keep tests aligned with behavior and content contracts; do not preserve production optionality only to make test
  setup shorter.
- Produce a real Git patch from exact preimages and verify `git apply --check` before delivery.

Permanent repository rules and validation requirements remain authoritative in `WORKING_RULES.md`.

## Confirmed starting findings

These findings were established against `master` at `fd5ea5fad46248a70e1ec874ab6569730825c4e4`. Recheck them from
fresh source before editing.

### Proven or near-proven legacy

- `tools/content-editor/src/debug_start_loadout_editor.ts` and its CSS are the old 4x3 Debug Start editor. Current
  code imports `debug_start_ship_loadout_editor.ts`; the old pair has no consumer.
- `src/components/ui/button`, `cover` and `fade`, `src/system/Utils.ts` and
  `src/engine/defs/game_location.ts` have no repository consumers.
- `src/system/AudioManager.ts` and `StorageManager.ts` form an isolated pair with no application entry path. Treat
  them as a separate deletion decision because future audio/save work may intentionally reuse the names.
- `BRIDGE_EVENT.ENEMY_SHIP_DESTRUCTION_COMPLETED` is declared and emitted but has no consumer.
- `bridge_outgoing_spam_geometry.ts` is imported only by its own test; the live SPAM view uses separate geometry.
- `SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_BLUE_00` has no consumer outside its declaration.
- the obsolete opening-disruption property remains only in a test-side type cast in
  `tests/tools/content_editor_registry.test.ts`; the production behavior has already been removed.

Explicit holdouts are not legacy candidates: keep `ScreenWakeLock`, `BridgeMissileDebugView`, its Missile debug
config and the existing EndScene console logging.

### Transport and ownership candidates

- ship creation currently crosses Debug Start data, `ShipFactory`, `ShipNodeActorFactory`, actor presets and ship
  presets. `NewGameUniverseFactory` supplies a ready Debug Start enemy ship while also selecting an actor preset
  whose ship preset is then bypassed. Most alternative ship/actor presets are test scenario support.
- `EncounterEngine` and `EncounterSnapshotReader` expose many narrow getters used only by tests, while production
  primarily consumes detached aggregate presentation snapshots.
- `BridgeEncounterSnapshotSynchronizer` manually explodes one snapshot into the large
  `BridgePlayerShipDashboardMapper` input. Several mapper fields are optional specifically to shorten focused tests.
- `bridge_event.ts` and `BridgeEncounterEngineEventHandler.handleEvent()` are long, but most entries encode real
  one-shot-event versus current-snapshot semantics. Audit each producer/consumer before restructuring them.
- `tools/content-editor/src/main.ts` mixes bootstrap, network operations, selection state, rendering and schema-field
  construction. `server/content_references.ts` mixes reference discovery, draft validation and chassis-dependent
  cascade cleanup.

### Large objects requiring evidence before a split

Strong audit candidates:

- `PlayerShipStore` owns Hull, Drive/Evade, weapons, Shield, Defense Turret and Core mutations;
- `BridgePlayerShipChassisView` owns chassis rendering plus lifecycle/reconciliation for every equipment tile family;
- `BridgePlayerShipDashboardMapper` owns a broad app-side projection and repeated content lookups;
- the content-editor `main.ts` owns several distinct UI/application responsibilities.

Likely legitimate roots/facades unless a concrete duplicated owner is found:

- `EncounterEngine`;
- `GameRuntime`;
- `BridgeEncounterController`;
- `CombatPresentationSnapshot` construction.

Keep `BridgeEncounterController`, `BridgeEncounterEngineEventHandler`, `BridgeEncounterSnapshotSynchronizer` and
`BridgeEncounterPersistenceSynchronizer` separate. They own orchestration, one-shot effects, current-state
projection and persistence respectively.

## Ordered cleanup phases

### Phase 0 — current-truth documentation

Keep `CURRENT_HANDOFF.md` short, ensure `GAMEPLAY_CONTRACTS.md` describes implemented behavior and remove completed
work from `BACKLOG.md`. Durable docs should record contracts and ownership, not class-by-class implementation maps.

Status: completed by the planning atom that introduced this document; recheck the result after it lands on
`master`.

Definition of done:

- no document calls an already-removed mechanic current or pending;
- the handoff points to the next boundary without preserving completed migration archaeology;
- current slot/target/equipment vocabulary agrees with source.

### Phase 1 — mechanically proven dead leaves

Use separate small atoms:

1. remove the old Debug Start editor module and CSS;
2. remove unused scaffold UI components and isolated trivial definitions;
3. remove the unused Bridge destruction-completed event;
4. resolve the test-only SPAM geometry helper: use one production geometry implementation or delete the orphan and
   its test;
5. remove the unused blue actor preset and stale disruption test type;
6. decide and handle the isolated Audio/Storage pair separately.

Every deletion atom must show a fresh repo-wide reference search and focused validation. Do not combine unrelated
leaves merely because they are all deletions.

### Phase 2 — ship construction and preset ownership

Start with an audit-only atom. Classify every ship/actor preset as production content, Debug Start input, test
fixture or unused data. Then make production construction explicit:

```text
Debug Start equipment[]
-> one ship assembler
-> physical ship state

New game actor input
-> physical ship + explicit team/crew/behavior
-> persistent ship actor
```

Move scenario-only variants into test fixtures/builders. Remove the current preset-plus-ready-ship override path.
Do not design the future saved-ship/archetype product model inside this cleanup atom.

### Phase 3 — read and presentation transport

Proceed vertically:

1. inventory each public `EncounterEngine`/`EncounterSnapshotReader` getter and its production/test callers;
2. migrate test-only callers to the stable aggregate snapshot or a real domain query, then remove dead forwards;
3. reshape the player dashboard mapper around one cohesive detached player presentation input plus commands and
   chassis identity;
4. replace test-only production optionality with focused test builders;
5. inventory Bridge event producers and consumers, deleting only unused events or snapshot duplication.

Preserve the engine/app/view boundary and event-versus-snapshot meaning. Do not introduce a generic transport
framework.

### Phase 4 — content editor responsibilities

Delete the old editor first. Then keep load/save/bootstrap and top-level coordination in `main.ts`, while extracting
the schema-driven inspector field construction as one cohesive responsibility. Keep content-reference and
asset-reference controls together where their lifecycle is shared.

In `content_references.ts`, first remove paths made obsolete by the preset cleanup. If the remaining file still has
multiple owners, separate generic reference validation from chassis/Debug Start cascade cleanup. Do not create a
generic validation DSL or one file per field/content kind.

### Phase 5 — state and presentation object ownership

Audit by owned facts and mutation paths, not LOC.

- Revisit `PlayerShipStore` when generic BROKEN/repair or cooldown work makes stable mutation groups visible.
- Simplify the dashboard mapper input before splitting its internal functions.
- In `BridgePlayerShipChassisView`, remove duplicated tile lifecycle/reconciliation only when one explicit collection
  owner can replace it without hiding family-specific behavior.
- Keep composition roots and exhaustive event switches intact unless the atom proves duplicated truth or hostile
  dependencies.

Each accepted split must leave one gameplay/presentation fact with one clearer owner and reduce dependencies or
branching. A lower line count alone is not success.

### Phase 6 — excessive segmentation

Low-risk candidates after dead-code removal:

- merge the four tiny encounter anchor variant type files into `encounter_anchor.ts`;
- merge `encounter_actor.ts` with its only current ship actor variant while no second actor kind exists;
- remove primitive aliases or single-member union files only when a clear existing owner can absorb them.

Do not merge the four Bridge encounter orchestration/synchronization responsibilities. Do not replace explicit
equipment-family views with a universal inheritance hierarchy.

### Phase 7 — cognitive simplification

Run one subsystem per atom after structural work is green:

- remove forwarding without a contract;
- remove branches and optionality kept only for old tests;
- reduce hostile parameter bags;
- flatten control flow with early returns;
- retain explicit exhaustive switches;
- delete historical or code-restating comments;
- replace vague local names with domain names;
- remove helpers whose abstraction is harder than the repeated code they replace.

This pass must not change gameplay, add architecture or reopen accepted bridge/dashboard visual design.

## Web Chat atom envelope

Use this structure when starting each implementation atom:

```text
Work from fresh master. This is one cleanup atom with no behavior change.

Read CURRENT_HANDOFF.md, docs/WORKING_RULES.md, docs/CODE_CLEANUP_PLAN.md and only the durable docs relevant to this
atom. Fetch the full exact current contents of every touched source/test file.

Goal: <one concrete cleanup result>.

Before editing, show the actual imports/producers/consumers and identify the exact obsolete or duplicated contract.
Keep scope inside this atom. Prefer explicit code; do not add generic registries/services/event buses/outboxes.

Generate a real Git patch from exact preimages and verify git apply --check against those preimages. Report focused
and full validation results plus every remaining ambiguity.
```

Web Chat should finish one coherent atom, let the user apply/validate/push it, then start the next atom from newly
fetched `master`. When context becomes Yellow/Red under `WORKING_RULES.md`, finish the current atom and move the next
heavy atom to a fresh chat.

## Validation floor

For TypeScript/gameplay/application atoms:

```bash
npm run typecheck
npm test -- <focused test path>
npm test
git -c core.safecrlf=false diff --check
```

Use runtime smoke for visual behavior that tests cannot prove. Use `npm run pack:tex` only when raw texture inputs
move or change. Always inspect the final diff and keep unrelated cleanup out of the patch.

## Campaign completion

The campaign is complete when:

- confirmed dead modules and events are gone;
- production ship construction no longer depends on test-like preset indirection;
- public read and dashboard transport surfaces reflect real consumers;
- large objects have explicit justified ownership, whether split or retained;
- tiny-file navigation remains only where it communicates a real contract;
- the full suite is green after every landed atom;
- a final cognitive pass finds no remaining high-value simplification in the touched subsystems.
