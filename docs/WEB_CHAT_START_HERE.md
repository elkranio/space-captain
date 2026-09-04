# Space Captain — Web Chat Start Here

> **WEB CHAT ONLY.** Codex Local must ignore this file unless the user explicitly asks to read or maintain it.

This is a connector-efficiency map for ChatGPT Web Chat, where there is no authoritative local checkout.
It is deliberately a **routing/cache layer**, not a second handoff, gameplay contract or design document.
Use it to know where to look, then fetch the exact current files relevant to the atom.

## Authority and freshness

Use each source for the thing it actually owns:

- `CURRENT_HANDOFF.md` — current checkpoint, landed work, current continuation and explicit holdouts;
- `docs/WORKING_RULES.md` — Web Chat patch workflow, Codex Local workflow, validation and code rules;
- `docs/GAME_DESIGN.md` — confirmed intended design;
- `docs/GAMEPLAY_CONTRACTS.md` — current implemented runtime behavior;
- `docs/SYSTEM_MAP.md` — durable ownership and data-flow boundaries;
- exact current source + tests — final authority for what the implementation actually does now.

If these disagree, do not blend them into a guessed compromise. Distinguish **implemented truth** from
**intended design**, inspect the exact code for the touched behavior, and keep the mismatch explicit.

## Web Chat connector fast path

For an ordinary atom, avoid recursively rediscovering the repository.

1. Read this file and `CURRENT_HANDOFF.md` once at chat/session start.
2. Read only the durable doc(s) relevant to the task using the router below.
3. If a path is uncertain, list the smallest likely directory instead of crawling the whole tree.
4. Before preparing a tracked-text patch, fetch the full exact current `master` contents of every touched file and the
   relevant tests. Follow `docs/WORKING_RULES.md` for patch construction and validation.
5. Re-check only the narrow source area whose freshness matters for the next atom.

This file can cache **stable locations and invariants**. Do not cache volatile pixel coordinates, balance numbers,
current TODO order or “latest change” details here; those belong in code, durable docs or `CURRENT_HANDOFF.md`.

## Repository map

### Runtime / framework side

```text
src/index.ts
    Phaser boot and scene registration

src/app/
    Phaser-facing game/app code
    ├── runtime/            persistent app runtime (`GameRuntime.ts`, `SceneRuntime.ts`)
    ├── scenes/             Phaser scenes and scene-owned presentation
    ├── manifests/          texture / presentation manifests
    ├── theme/              app presentation constants
    └── debug/              app-side debug support

src/components/
src/system/
src/types/
src/utils/
    p34t/framework/general support; not default cleanup territory

src/config/
    framework/game configuration; `gameConfig.ts` is an explicit holdout unless the task requires it
```

Main Phaser entry is `src/index.ts`. The current bridge scene is
`src/app/scenes/game/bridge/BridgeScene.ts`.

### Headless game side

```text
src/engine/
    ├── defs/               stable domain definitions / discriminants
    ├── content/            catalogs, data, presets and schemas
    ├── generation/         new-game / runtime object construction
    ├── universe/           universe/navigation domain
    └── encounter/          current encounter authority
        ├── EncounterEngine.ts
        ├── actors/
        ├── anchors/
        ├── combat/         physical combat/system runners + read queries
        ├── commands/       officer-command execution/handlers
        ├── model/          encounter command/combat/task types
        ├── officer_availability/
        ├── officer_tasks/
        ├── snapshots/      detached presentation/read snapshots
        └── state/          encounter-owned mutable state stores
```

`src/engine/**` is headless. Do not route Phaser/app types into it.

### Bridge adapter / presentation side

```text
src/app/scenes/game/bridge/
    ├── BridgeScene.ts
    ├── controller/
    │   ├── BridgeController.ts
    │   ├── encounter/
    │   └── captain_dashboard/
    ├── events/
    ├── view/
    │   ├── captain_dashboard/
    │   └── combat/
    └── debug_view/
```

The bridge boundary is intentionally split:

- engine owns gameplay truth and legality;
- encounter controller/synchronizers read engine truth and coordinate app presentation;
- dashboard mappers create UI-friendly payloads;
- Phaser views own layout, animation and input surfaces, not gameplay legality.

The central encounter adapter is
`src/app/scenes/game/bridge/controller/encounter/BridgeEncounterController.ts`.
Do not collapse its snapshot/event/persistence ordering just to reduce class count; see `docs/SYSTEM_MAP.md` first.

## High-value task router

### Officer roles / command IDs / command legality

Start with:

- `src/engine/defs/officer.ts`
- `src/engine/encounter/model/command.ts`
- `src/engine/encounter/commands/`
- `src/engine/encounter/officer_availability/`
- `docs/GAMEPLAY_CONTRACTS.md`

Current stable role ids are exactly:

```text
scientist
pilot
gunner
engineer
```

Use the current `OFFICER_ROLE` constants; do not resurrect the old Helm / Weapons / Science role ids.

### Captain MY SHIP / ENEMY SHIP dashboards

Controller / mapping entry points:

- `src/app/scenes/game/bridge/controller/captain_dashboard/BridgePlayerShipDashboardMapper.ts`
- `src/app/scenes/game/bridge/controller/captain_dashboard/BridgeEnemyShipDashboardMapper.ts`
- `src/app/scenes/game/bridge/controller/captain_dashboard/`

Presentation lives under:

- `src/app/scenes/game/bridge/view/captain_dashboard/player_ship/`
- `src/app/scenes/game/bridge/view/captain_dashboard/enemy_ship/`
- shared captain-dashboard primitives under `src/app/scenes/game/bridge/view/captain_dashboard/`

For layout/visual grammar, use `docs/BRIDGE_ART_DIRECTION.md` and the current view code. For gameplay meaning,
use engine snapshots/contracts instead of deriving truth from tile visuals.

### Equipment slots / placement / BROKEN state

Start with chassis/content definitions, encounter actor/mount helpers, dashboard snapshots and mappers.
The durable identity chain is:

```text
ship.chassisId + ship.mounts
-> mount.equipmentId -> mount.slotId
-> chassis slot
-> dashboard cell
```

Stable invariants:

- slot identity is `slotId`, never weapon-array order or dashboard index;
- installed equipment owns integrity and BROKEN/operational truth;
- slots own spatial identity, not a second health pool;
- Power Core is separate and non-spatial.

For current behavior details, verify `docs/GAMEPLAY_CONTRACTS.md` and exact engine code before editing.

### Player Beam targeting

Primary entry points:

- `src/app/scenes/game/bridge/controller/captain_dashboard/BridgeBeamTargetSelectionController.ts`
- `src/engine/encounter/model/command.ts`
- `src/engine/encounter/commands/`
- `src/engine/encounter/combat/beam_cannon/PlayerBeamCannonRunner.ts`
- enemy dashboard snapshot/query + mapper + equipment views

High-value tests include:

- `tests/app/BridgeBeamTargetSelectionController.test.ts`
- `tests/app/BridgeBeamTargetLock.test.ts`
- `tests/engine/encounter/player_beam_cannon_command.test.ts`
- `tests/engine/encounter/player_beam_cannon_slot_target.test.ts`
- Beam lifecycle/damage/destruction tests beside them

Current player Beam semantic target vocabulary is `HULL | SLOT(slotId)` end-to-end in the engine; the dashboard currently
exposes equipment-slot selection. Incoming enemy Beam and the current targeted player Shield still use their older
`HULL | DRIVE` vocabulary. Do not silently unify those domains in an unrelated UI atom.

### Defense Turret interaction

Start with:

- `src/app/scenes/game/bridge/controller/captain_dashboard/defense_turret/`
- player Defense Turret dashboard mapper/tile code
- `src/engine/encounter/commands/handlers/gunner_defense_turret_command_handler.ts`
- `src/engine/encounter/combat/defense_turret/`

The current Gunner interception flow and shared-Power semantics are engine-owned; UI only exposes available targets.

### Encounter event / snapshot bugs

Start with:

- `src/app/scenes/game/bridge/controller/encounter/BridgeEncounterController.ts`
- `src/app/scenes/game/bridge/controller/encounter/engine_events/`
- `src/app/scenes/game/bridge/controller/encounter/snapshots/`
- `src/engine/encounter/snapshots/`
- the concrete engine runner/store that owns the gameplay fact

Remember the durable distinction:

```text
event    = something happened once
snapshot = what is true now
```

Do not add duplicate events to transport current state that already belongs in a snapshot.

### Tests

Read `tests/README.md` before changing test architecture or fixture strategy.

Useful split:

```text
tests/app/                 bridge/controller/mapper contracts
tests/engine/              headless gameplay behavior
tests/runtime/             GameRuntime boundaries
tests/tools/               content-editor/tooling behavior
tests/fixtures/            explicit scenario/test content
```

The test suite intentionally uses explicit scenario fixtures for gameplay scenarios; do not restore assertions that merely
pin mutable shipping/editor balance values.

### Assets / atlas paths

Raw sprites live under `assets/raw/images/`. Texture packing derives frame keys recursively from that semantic tree;
TypeScript manifest frame paths omit `.png`.

Current semantic routing:

```text
bridge/**                  bridge-specific art only
combat/**                  reusable combat objects/effects
equipment/icons/**         reusable equipment art
icons/resources/**         resource symbols
icons/threats/**           threat symbols
icons/status/**            status symbols
ui/**                      generic UI controls
world/**                   world objects
```

`assets/live/images/` and `public/assets/images/` are packed/generated outputs, not the first place to hand-edit source art.
After raw texture changes, follow the pack/validation rule in `docs/WORKING_RULES.md`.

## Durable “do not guess” list

Before changing any of these, fetch the exact implementation and relevant contract rather than inferring from names:

- officer/command availability and busy semantics;
- cooldown commitment/cancellation timing — several current systems intentionally differ from confirmed future design;
- hidden enemy information vs presentation-safe snapshots;
- equipment target identity and mount/slot resolution;
- encounter event-drain vs snapshot-sync ordering;
- damage/interruption behavior;
- content/editor balance values.

Also preserve the explicit unrelated holdouts unless the task actually requires them:

- `src/config/gameConfig.ts`;
- existing EndScene `console.log`;
- `ScreenWakeLock`;
- `BridgeMissileDebugView`.

## Doc router

Use the smallest relevant set:

- coding workflow / patch discipline / validation → `docs/WORKING_RULES.md`
- ownership / engine-app-view boundaries → `docs/SYSTEM_MAP.md`
- intended mechanics → `docs/GAME_DESIGN.md`
- implemented mechanics → `docs/GAMEPLAY_CONTRACTS.md`
- equipment detail / equipment idea bank → `docs/EQUIPMENT.md`
- bridge/dashboard visual language → `docs/BRIDGE_ART_DIRECTION.md`
- threat UI → `docs/THREAT_PANEL.md`
- combat gate sequence → `docs/COMBAT_PLAYTEST_ROADMAP.md`
- deferred concrete work → `docs/BACKLOG.md`
- current landed state / next continuation → `CURRENT_HANDOFF.md`

Do not load every doc for every atom. This file exists specifically so Web Chat can route directly to the narrow source set
instead of burning connector calls rediscovering the same repository shape.
