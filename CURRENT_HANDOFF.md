# Space Captain — Current Handoff

## CURRENT CHECKPOINT — 2026-08-25

Base for this checkpoint: `master` at `a0a0e4335e6e5c182737f09be780a5cf8fe21233`.

This section supersedes the archived pre-slot handoff below. Read this section first. The older material is kept only as
historical implementation context and must not be treated as current runtime truth.

### Landed today

The chassis/loadout foundation is now real rather than planned:

- chassis own stable physical slots with `slotId`, kind and grid coordinates;
- current slot kinds are `DRIVE | WEAPON | DEFENSE | UTILITY`;
- Power Core remains separate, non-spatial and non-targetable;
- persistent player/enemy ship construction preserves chassis identity and `slotId -> equipmentId` mounts;
- Debug Start uses normalized `equipment[]` records instead of `weaponSlot1..4` / parallel mount fields;
- the content editor has a chassis-aware 4xN Debug Start equipment grid with compatibility-filtered equipment selectors;
- equipment-family definitions own `maxIntegrity`;
- encounter-local Drive / Defense Turret / Shield Generator / Weapon states now carry `integrity`;
- encounter equipment integrity is initialized fresh and does not leak back into persistent run state;
- shared encounter helpers exist for equipment operational state and integrity damage;
- typecheck + full test suite were green before this handoff update.

General BROKEN operational gating for every equipment family, repairs for every family and player Beam slot damage are
**not** finished merely because the integrity field now exists.

Equipment mechanics/status/brainstorm reference:

`docs/EQUIPMENT.md`

Read it before adding/changing equipment. It explicitly separates `LANDED`, `CONFIRMED TODO`, `IDEA BANK` and `OPEN` so
brainstorm entries do not accidentally become implementation commitments.

### Active slice — combat dashboard before precision targeting

Do **not** implement player Beam `HULL | SLOT(slotId)` targeting next.

We deliberately paused precision-target implementation until the target surfaces exist in the actual combat UI. Building
the target contract against the old dashboard would likely create throwaway interaction and presentation work.

Current order:

```text
new bridge/dashboard shell
-> equipment-tile information/state prototype
-> slot/integrity read models + dashboard runtime binding
-> move threats into the compact top-center monitor
-> finish BROKEN/repair operational behavior needed by the board
-> player Beam HULL | SLOT direct targeting on the real board
-> shared incoming Beam / targeted-Shield slot target model
-> first weak-fight timing/balance smoke
```

Re-fetch current `master` and exact touched files before every coding atom. Do not do another broad architecture audit.

### Confirmed combat-screen layout contract

Strict layout reference:

`docs/reference/combat_bridge_layout_2026-08-25.png`

The current visual contract is 1280x720 and uses the whole screen intentionally:

```text
TOP CENTER
    compact threat monitor

LEFT SIDE                         RIGHT SIDE
    SCIENCE video feed                WEAPONS video feed
    HELM video feed                   ENGINEER video feed

CENTER
    large first-person viewscreen

BOTTOM LEFT                       BOTTOM RIGHT
    MY SHIP dashboard                 ENEMY SHIP dashboard
```

The officers are shown through physical video/intercom monitors. Do not return to four seated officer backs/stations in
front of the captain merely to show the bridge interior. The captain remains first-person and invisible.

Both lower dashboards use almost the full screen width with a very small center gap. Each ship dashboard contains an
exact 4-column x 3-row equipment area plus one narrow special column. Preserve large equipment tiles; the latest
wireframe gives roughly `131x86` pixels per regular tile.

Dashboard grammar:

```text
PLAYER
HEADER: USS CAPYBARA | ESC | ... | CORE
BODY:   4x3 EQUIPMENT GRID | SPECIAL COLUMN

ENEMY
HEADER: ENEMY SHIP | ESC when fleeing | ... | CORE
BODY:   SPECIAL COLUMN | 4x3 EQUIPMENT GRID
```

`ESC` is no longer a tall side column. It is a compact header button and also the escape-progress surface. When escape is
active, progress fills the usable height of that button rather than appearing as a tiny nested bar.

`HULL` is not in the header and is not a fake equipment slot. The special column is split:

```text
BRIDGE
    compact role-state markers; use role letters + semantic state color in the real implementation

HULL
    one obvious clickable Hull target
    one vertical segmented HP meter
```

The Hull segments are divisions of **one** health meter, not independent progress bars. Segment count may adapt to
`maxHull` (for example ten visible segments for 10 Hull).

Power Core stays in the header as charge cells and remains non-targetable.

Do not add permanent combat-log, selected-target-details, officer-activity or ship-summary windows. Tooltips and transient
combat feedback are allowed when needed; persistent truth should live on the existing surfaces.

### Threat monitor contract

Threats live in the small physical monitor centered above the viewscreen.

One concrete runtime threat = one compact threat cell. Do not aggregate independent Missiles/Mines.

Two independent progress channels are fixed:

```text
ICON SILHOUETTE FILL
    = threat lifecycle / urgency progress

ROUNDED-SQUARE FRAME PERIMETER FILL
    = mitigation/work progress on that concrete threat
```

Do **not** add an ordinary horizontal progress bar under the icon.

Threat cells become direct targets only when a selected system requires that concrete threat. Engine command availability
remains authoritative.

### Next UI questions, not new layout regions

The next design work is the information architecture of one equipment tile and its states:

- identity / icon;
- READY / cooldown / active work;
- integrity / BROKEN;
- ammo/resource where relevant;
- selected / hovered / valid-target state;
- repair affordance when appropriate.

Solve these inside the existing board before inventing another permanent panel.

---

## Archived pre-slot handoff — historical only

Everything below this heading predates the landed chassis/loadout/integrity work. Keep it for implementation history, but
do not use its “next task”, old storage-shape statements or old atom ordering as current truth.

## Current checkpoint

Base for this handoff update: `master` at `9e6fcde8a9f57dba86f341652b38e04f10d91bf5`.

The four-pass cleanup/readiness audit is complete:

1. stale TRACK / old mechanic tails — closed;
2. transport / spaghetti — closed;
3. god objects / over-segmentation — closed;
4. local cognitive simplification — closed.

Do **not** spend the next chat doing another broad repository audit before starting the slot work. Re-fetch current
`master` and inspect the exact files touched by the first atom, as required by `docs/WORKING_RULES.md`, but the
architectural
readiness pass itself is already done.

Current combat foundation:

- basic incoming-threat identity is free; mandatory player Science TRACK/IDENTIFY is gone;
- player and enemy weapon lifecycles are split by concrete mechanic runners;
- incoming Beam currently uses the temporary `HULL | DRIVE` semantic target model;
- player Drive integrity and Beam module damage are engine-owned;
- player targeted-Shield semantics and the current `HULL | DRIVE` Shield picker are implemented;
- player Defense Turret and enemy Defense Turret currently resolve a completed shot against a still-live Missile
  deterministically;
- the currently landed captain threat presentation still uses the clean header and 4x2 glyph grid, but the confirmed
  next combat UI direction below supersedes that layout;
- encounter persistence has one explicit app-layer owner;
- `src/engine/encounter/state/` specialized stores are flattened under one public `EncounterStateStore` facade.

Important documentation boundary:

- `docs/GAME_DESIGN.md` = intended design;
- `docs/GAMEPLAY_CONTRACTS.md` = current implemented runtime truth;
- this file = exact next slice, current repo seams and implementation order.

## Next active slice — chassis-owned ship slots

The next task is to introduce physical ship slots so chassis can define different build shapes and combat can target
installed ship hardware semantically.

Confirmed baseline slot categories:

```text
WEAPON
DEFENSE
EQUIPMENT
```

The chassis owns which slots physically exist. A concrete ship loadout/preset fills compatible slots.

Do not keep the current debug assumption that every ship effectively has four universal weapon fields. Different chassis
must be able to expose different slot counts/configurations.

### Confirmed gameplay rules

- Hull is not a slot.
- Power Core remains non-breakable and non-targetable.
- A targetable slot has encounter-local integrity and binary functionality:
  - integrity > 0 -> OPERATIONAL;
  - integrity = 0 -> BROKEN.
- A BROKEN slot disables the installed hardware mounted in that slot.
- Engineer repairs only BROKEN targetable slots/modules and restores them to full integrity.
- Beam may target Hull or a concrete breakable enemy slot.
- Beam hit on an operational slot deals module/slot damage and no Hull damage.
- A hit that breaks the slot still has no overkill spill into Hull.
- A later Beam hit on an already BROKEN slot deals `hullDamage * 2`.
- Beam's target is basic readable combat information; no Science permission gate.
- Power Core consumption for the player Beam remains intended design but is still a separate current-runtime mismatch
  tracked in `docs/BACKLOG.md`.

Do not over-generalize multiplicity before content requires it. Current scalar `drive`, `defenseTurret`, `powerCore` and
`shieldGenerator` fields do not need to become generic arrays merely because slots are being introduced. Chassis slot
layout should be able to evolve, but v1 should preserve the simplest current runtime ownership that satisfies the actual
loadouts.

One design detail can be settled during the first model atom without another repo audit: which current fixed systems
participate in `EQUIPMENT` / `DEFENSE` slots versus remaining chassis/core hardware. Power Core is explicitly outside
the
targetable set.

## Early-combat target

The slot work is not only a data-model feature. It is the foundation for the first useful combat-balance pass.

The intended first-fight shape:

- weak/basic player ship versus weak/basic enemy ship;
- a reasonable player should win almost every time;
- the fight should resolve quickly;
- "easy but long" is a failure: no toothpick-vs-tree attrition;
- unupgraded weapon families must not be obvious traps in early combat;
- especially, Missile Launcher and Beam Cannon must both be viable offensive choices.

Beam precision is allowed to be valuable, but it must not make Beam strictly better than Missile. Missile can compete
through direct Hull pressure, timing, ammo/tuning and different interaction with defenses. Do not force equal mechanics
or
identical time-to-kill merely to call the families balanced.

## Confirmed combat dashboard / interaction direction

The previous plan of using the right captain dashboard primarily as a large threat grid and opening enemy inspection
separately is superseded.

The target combat-board grammar is:

```text
TOP / COMPACT STRIP
    incoming threats + urgency/progress

LEFT DASHBOARD
    MY SHIP
    installed slots + state + integrity + activity
    primary controllable systems

RIGHT DASHBOARD
    ENEMY SHIP
    installed slots + state + integrity + activity
    semantic targets
```

Basic enemy anatomy is persistent combat information. Do **not** require a separate enemy-inspect button or pause merely
to see enemy Hull, installed slots, their integrity/BROKEN state and obvious current activity.

Science may later reveal deeper properties, traits, vulnerabilities, exact hidden values or other decision-changing
information. It does not gate the permanent basic enemy board.

The two ship dashboards should share one visual language, but they do not need identical information density:

- left answers **what can I do?** — readiness, cooldown, ammo, CORE/resource state, officer availability and clickability;
- right answers **what is happening to the enemy / what can I target?** — Hull, slots, integrity/BROKEN, active state and
  target highlights.

### Direct interaction grammar

Prefer one common combat interaction:

```text
select own system
-> highlight valid targets
-> select target
```

Examples:

```text
Defense Turret on MY SHIP
-> valid Missile threats highlight in threat strip
-> select one Missile

Beam Cannon on MY SHIP
-> valid enemy HULL / slots highlight on ENEMY SHIP
-> select target

Shield Generator on MY SHIP
-> valid own protected slots highlight
-> select target

Missile Launcher on MY SHIP
-> enemy ship / Hull target
-> launch
```

The engine remains authoritative for command availability and exact command payloads. The view may present direct spatial
targeting, but it must not recreate legality.

Avoid a popup/menu as the default targeting step when the target already exists visibly on the combat board. A small
target picker is acceptable only where direct board selection becomes ambiguous or materially worse.

### Compact threat strip

Threats remain concrete runtime objects, but they no longer need large action cards.

The intended strip:

- one compact icon/cell per concrete threat; no aggregation of independent Missiles/Mines;
- icon/designation + clear progress/urgency;
- family color and terminal danger language remain;
- a threat currently being handled/targeted is visibly marked;
- no permanent `[HIT] / [SHIELD] / [CLEAR] / [PURGE]` mitigation button inside each threat cell;
- threat cells become targets only when a selected own system/action requires that concrete threat.

The strip may occupy a narrow area above the captain dashboards / below the viewscreen, or another compact high-priority
location found during layout. Exact placement is not yet sacred.

Small area must **not** mean low visual priority. Imminent threats must still be able to dominate attention immediately.

`docs/THREAT_PANEL.md` contains the durable presentation contract for this direction.

## Readiness audit for this slice — already completed

No blocking callback maze, transport problem or god-object refactor was found.

### Existing content / generation seam

Current flow is already close to the desired ownership:

```text
ShipChassisDefinition
    -> ShipPreset / loadout
    -> ShipFactory
    -> persistent ship state
    -> encounter runtime copy
```

Relevant files inspected on the handoff base:

```text
src/engine/defs/ship_chassis.ts
src/engine/content/schemas/ship_chassis.ts
src/engine/content/data/ship_chassis.json
src/engine/content/presets/ships.ts
src/engine/generation/ship/ShipFactory.ts
src/engine/generation/space_node_actor/ShipNodeActorFactory.ts
```

`ShipChassisDefinition` currently owns only `name`, `spriteId`, `maxHull`.
`ShipPreset` currently owns installed drive/defensive systems/weapons.
This is the natural place to add chassis slot layout and loadout-to-slot assignment.

### Player creation seam

Enemy/persistent ship state already carries `chassisId`.

Player persistent state currently does **not**:

```text
PlayerShipState
    hull / maxHull
    drive
    defenseTurret
    powerCore
    shieldGenerator
    weapons[]
```

`debug_start.player` also bypasses chassis and currently owns `maxHull` plus exactly four required
`weaponSlot1Id..weaponSlot4Id` fields.

Relevant files:

```text
src/engine/defs/player.ts
src/engine/generation/new_game/create_new_game_player.ts
src/engine/generation/new_game/debug_start_ship_factory.ts
src/engine/content/schemas/debug_start.ts
src/engine/content/catalogs/debug_start.ts
src/engine/content/data/debug_start.json
```

This is the main model seam to remove. Player should gain real chassis identity and stop living in a parallel
`maxHull + four weapon slots` configuration world.

### Encounter/runtime seam

Enemy actor path already preserves chassis identity:

```text
ShipSpaceNodeActorState.chassisId
-> EncounterStateStore.fromSpaceNode()
-> EncounterActorStore.spawnShipActor()
-> ShipEncounterActorState.chassisId
```

Relevant files:

```text
src/engine/defs/universe.ts
src/engine/encounter/actors/ship_encounter_actor.ts
src/engine/encounter/state/EncounterActorStore.ts
src/engine/encounter/state/create_encounter_state.ts
src/engine/encounter/model/state.ts
src/engine/encounter/model/combat.ts
```

Player encounter state currently receives Hull/Drive/combat systems separately and has no chassis/slot state. Add that
deliberately; do not hide slot truth in presentation-only data.

### Existing Beam prototype

Incoming Beam already proves most of the damage semantics with hardcoded `HULL | DRIVE`:

```text
HULL
    -> hullDamage

operational DRIVE
    -> moduleDamage
    -> no Hull damage

hit that breaks DRIVE
    -> no Hull spill

already BROKEN DRIVE
    -> hullDamage * 2
```

Relevant implementation:

```text
src/engine/encounter/model/combat.ts
src/engine/encounter/combat/beam_cannon/CombatBeamCannonRunner.ts
```

Do not build a second parallel `slotTarget` model next to `BeamCannonTargetNode` forever. The current node type is an
early prototype of the future semantic ship target model and should be replaced/generalized in controlled atoms.

### Player Beam target transport

Current player Beam command/task only carries:

```text
weaponId
targetActorId
```

Current command target is `ACTOR_WEAPON`; the task has no target slot.

Relevant path:

```text
src/engine/encounter/model/command.ts
src/engine/encounter/commands/handlers/weapons_fire_beam_cannon_command_handler.ts
src/engine/encounter/model/officer_task.ts
src/engine/encounter/officer_tasks/create_officer_task_draft.ts
src/engine/encounter/combat/beam_cannon/PlayerBeamCannonRunner.ts
src/engine/encounter/model/event.ts
```

The path is short and typed. Carrying a concrete target slot through it is expected work, not a transport refactor.

The existing officer command menu remains a useful adapter because it already receives engine-resolved commands and
returns opaque `OfficerCommandTarget` payloads. However, the confirmed combat UX should prefer direct dashboard
selection for visible systems/targets rather than forcing Beam/Turret/Shield through a generic menu or popup.

### Presentation/read-model seam

Enemy telemetry currently exposes Hull, Drive, Evade, Core, active Shield and weapon identity/phase, but not chassis
slots.

Relevant files:

```text
src/engine/encounter/combat/queries/get_enemy_ship_telemetry_snapshots.ts
src/engine/encounter/snapshots/combat_presentation_snapshot.ts
src/app/scenes/game/bridge/controller/encounter/snapshots/BridgeEncounterSnapshotSynchronizer.ts
src/app/scenes/game/bridge/controller/captain_dashboard/BridgeCaptainCombatContextMapper.ts
src/app/scenes/game/bridge/events/bridge_event.ts
```

Expose slot state through the existing snapshot/read-model boundary. Do not let views reconstruct slot legality or
integrity from weapon/system fields.

## Recommended implementation atoms

Keep these atoms narrow. Re-fetch full exact source/tests for the current atom before producing each patch.

### Atom 1 — chassis slot definitions

Introduce the smallest domain/content model for chassis-owned slot layout.

Expected work:

- stable slot identity inside a chassis;
- slot kind `WEAPON | DEFENSE | EQUIPMENT`;
- targetable integrity/max-integrity data only where the design actually requires it;
- schema/data validation;
- uniqueness/compatibility validation that belongs to content truth.

Do not add encounter combat behavior yet.

### Atom 2 — loadout mounts + factory validation

Make ship presets/loadouts say which compatible chassis slot each installed item occupies.

Goals:

- `ShipFactory` validates chassis slot existence/kind;
- fixed `four weapon slots` is not a chassis rule;
- generated ship state preserves enough mount identity for later runtime slot lookup;
- do not convert every scalar installed system into a generic collection unless required.

### Atom 3 — unify player chassis/loadout creation

Give persistent `PlayerShipState` real `chassisId`.

Remove the separate debug-player assumption that owns `maxHull` independently of chassis and requires exactly four
weapon fields. Reuse the normal ship/loadout assembly concept as far as it reduces duplicate truth.

Do not force player/enemy crew/behavior generation to become identical; only unify physical ship construction.

### Atom 4 — encounter slot runtime

Create authoritative encounter-local slot integrity/state for both sides.

Requirements:

- player and enemy runtime can resolve slot by stable slot id;
- BROKEN state has one authoritative source;
- slot damage does not become persistent run attrition;
- persistent loadout/chassis identity survives, encounter integrity is disposable/resettable;
- avoid duplicate `slot broken` booleans on installed systems.

### Atom 5 — operational gating

Connect BROKEN slot state to installed hardware functionality through one domain rule/query.

Do **not** spread variants of:

```text
weapon READY && slot not broken
shield ONLINE && slot not broken
...
```

through command handlers, AI and runners.

Command availability and physical execution should consult the same authoritative operational rule.

### Atom 6 — enemy slot read model + player Beam target contract

Expose concrete enemy slot targets through engine read models/available commands.

Introduce a semantic player Beam target equivalent to:

```text
HULL
or
SLOT(slotId)
```

Carry it through command -> officer task -> Beam runner. Keep engine command availability authoritative.

### Atom 7 — player Beam slot impact

Implement:

```text
HULL
    -> normal hullDamage

OPERATIONAL slot
    -> moduleDamage
    -> no Hull damage

hit that breaks slot
    -> still no Hull spill

already BROKEN slot
    -> hullDamage * 2
```

Then verify destruction cleanup, target loss and existing Shield/Evade behavior remain coherent.

### Atom 8 — migrate incoming Beam / targeted Shield to the shared slot target model

Only after the shared slot target identity is stable, replace the temporary incoming `HULL | DRIVE` vocabulary with the
same semantic ship-target model where appropriate.

Do this as a separate atom because current incoming Beam and player targeted Shield already form a working vertical
slice.

### Atom 9 — dual ship dashboard read models + state presentation

Build presentation on real slot truth:

```text
LEFT  = MY SHIP
RIGHT = ENEMY SHIP
```

Both sides should show basic Hull/slot anatomy and live integrity/BROKEN/activity state continuously.

Left additionally emphasizes controllable-system readiness/resources and officer-dependent availability.
Right emphasizes targetable enemy state.

Do not add a separate mandatory basic enemy-inspect screen. Deep Science inspection may remain a later layer.

### Atom 10 — direct system targeting + compact threat strip

Move combat input toward:

```text
select own system
-> highlight engine-resolved valid targets
-> select target
```

Use enemy Hull/slots, own slots and concrete threat icons as target surfaces depending on the selected system.

Replace the large 4x2 threat action grid with the compact high-priority threat strip described in
`docs/THREAT_PANEL.md`. Preserve real threat identity/urgency and active-mitigation marking; remove permanent mitigation
buttons from threat cells.

### Atom 11 — first weak-fight tuning smoke

Only after the real slot mechanics and intended combat-board interaction are usable, create/adjust simple player/enemy
chassis + loadout content for an early encounter and test actual fight duration.

Compare at least Missile-focused and Beam-focused basic offensive setups.

Questions:

- is the first fight reliably winnable without perfect play?
- is it short enough to avoid attrition boredom?
- does the board let the player read both ships and threats without opening extra basic-inspection UI?
- does selecting a system and then a target feel obvious under time pressure?
- does Beam precision create a useful choice rather than free superiority?
- does Missile direct Hull pressure remain competitive?
- are there long stretches where the player is only waiting for cooldowns?

Do not balance by paper DPS alone; timing, officer occupation, CORE, ammo and enemy defenses are part of the result.

## Explicit non-work before slots

Do not pre-refactor these just because the slot slice is large:

- `CombatRunner`;
- `PlayerShipStore`;
- encounter event architecture;
- bridge persistence architecture;
- snapshot/controller layering;
- enemy behavior root.

The readiness audit found no blocker there. Refactor only if the concrete slot implementation exposes a real cost.

## After the slot / first-fight slice

The dual ship dashboards, direct targeting and compact threat strip are now part of the slot/first-fight slice rather than
deferred presentation work.

After that smoke, continue with:

```text
Science tactical-information pass
-> enemy targeted Shield / deeper target behavior as needed
-> iterate combat timing/build balance from actual play
```

`docs/COMBAT_PLAYTEST_ROADMAP.md` contains the broader gate sequence.
`docs/BACKLOG.md` contains deferred intended/runtime mismatches.
