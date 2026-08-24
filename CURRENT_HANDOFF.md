# Space Captain — Current Handoff

## Current checkpoint

Base for this handoff: `master` at `08532f90387861fc0ffa79978c4bfa26066fe616`.

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
- captain threat presentation uses the clean header and 4x2 Missile / Beam / Mine / SPAM glyph grid;
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

The officer command menu is also already suitable: it receives engine-resolved commands, groups them by `targetLabel`
and returns the opaque `OfficerCommandTarget` on selection. Do not build a separate UI targeting framework just for
slots unless the final UX genuinely requires one.

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

### Atom 9 — first weak-fight tuning smoke

Create/adjust simple player/enemy chassis + loadout content for an early encounter and test actual fight duration.

Compare at least Missile-focused and Beam-focused basic offensive setups.

Questions:

- is the first fight reliably winnable without perfect play?
- is it short enough to avoid attrition boredom?
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

Return to the presentation/readability sequence:

```text
OUR SHIP functional/module dashboard + targeted-Shield visual
-> enemy inspectability / enemy dashboard
-> Science tactical-information pass
-> enemy targeted Shield / deeper target behavior as needed
```

`docs/COMBAT_PLAYTEST_ROADMAP.md` contains the broader gate sequence.
`docs/BACKLOG.md` contains deferred intended/runtime mismatches.
