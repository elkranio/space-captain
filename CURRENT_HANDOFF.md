# Space Captain — Current Handoff

This is the only live handoff file.

Historical handoffs belong in git history. Do not add dated root-level handoff files again unless there is a concrete
reason to preserve a temporary migration artifact.

Current source of truth:

```text
repository: elkranio/space-captain
branch: master
```

Always re-fetch fresh `master` and the exact touched files before preparing a code patch.

Read durable docs when their boundary is relevant:

- `docs/WORKING_RULES.md` — collaboration, patch and validation rules;
- `docs/GAME_DESIGN.md` — canonical intended design;
- `docs/GAMEPLAY_CONTRACTS.md` — current implemented runtime truth;
- `docs/EQUIPMENT.md` — equipment mechanics/status/idea bank;
- `docs/SYSTEM_MAP.md` — ownership/data-flow boundaries;
- `docs/BRIDGE_ART_DIRECTION.md` — durable bridge/dashboard visual grammar;
- `docs/THREAT_PANEL.md` — threat presentation contract;
- `docs/COMBAT_PLAYTEST_ROADMAP.md` — broader combat gate sequence;
- `docs/BACKLOG.md` — concrete deferred work only.

## Current implementation checkpoint

### Ship/loadout foundation — LANDED

- player and enemy ships carry real `chassisId`;
- chassis own stable physical slots with `slotId`, kind and 1-based grid coordinates;
- current slot kinds are `DRIVE | WEAPON | DEFENSE | UTILITY`;
- persistent mounts preserve `slotId -> equipmentId`;
- Debug Start/content editor are chassis-aware;
- Drive, Defense Turret, Shield Generator and all current weapon families carry encounter-local integrity;
- Power Core remains separate, non-spatial, non-breakable and non-targetable.

The generalized integrity foundation is ahead of generic gameplay behavior. Full BROKEN gating + Engineer repair is still
unfinished for most equipment families.

### Player combat dashboard — STANDARD EQUIPMENT LANDED

The MY SHIP dashboard has concrete production tiles for all seven current standard equipment families:

1. Missile Launcher
2. Beam Cannon
3. Sticky Mine Dispenser
4. SPAM Projector
5. Defense Turret
6. Shield Generator
7. Drive

Current tile grammar:

- catalog `shortName` for titles;
- off-white = ready;
- yellow/orange left-to-right pictogram fill = active work;
- muted blue = cooldown/resource blocked;
- red = broken/problem;
- integrity pips;
- resource/status micro-readout only where it changes an immediate decision.

Do not create a generic `EquipmentTileBase` merely because several concrete tiles now share visual ideas.

### Authoritative 4x3 placement — LANDED

Equipment placement no longer comes from weapon array order or equipment family.

Current path:

```text
player.ship.chassisId + player.ship.mounts
-> mount.equipmentId -> mount.slotId
-> SHIP_CHASSIS[chassisId].slots
-> BridgeEquipmentSlotPayload { column, row }
-> exact 4x3 dashboard cell
```

Rules:

- empty chassis slots remain empty;
- duplicate equipment kinds remain distinct by runtime equipment id;
- no fallback to array order;
- out-of-grid coordinates are errors.

### Beam Power Core cost — LANDED

Player Beam Cannon now uses its content-defined `powerCost`.

- command availability requires enough current Power Core charge;
- cost is committed when Beam charging starts;
- later cancellation/interruption does not refund committed Power;
- player Beam still targets the enemy actor as a whole for now.

Do not re-add Beam CORE cost as a TODO.

### Bridge shell / board state

Confirmed combat composition remains:

```text
TOP CENTER
    compact threat monitor area

SIDES
    SCIENCE + HELM monitors
    WEAPONS + ENGINEER monitors

CENTER
    first-person viewscreen

BOTTOM
    MY SHIP dashboard | ENEMY SHIP dashboard
```

Current status:

- MY SHIP standard equipment board is real;
- the narrow MY SHIP special column exists but BRIDGE/HULL content is still placeholder-only;
- ENEMY SHIP is not yet rebuilt as the persistent mirrored slot board;
- the old large 4x2 threat-action/combat-context view has been removed;
- the physical right captain screen remains as a blank ENEMY SHIP placeholder;
- the compact top-center threat monitor is not implemented yet;
- Defense Turret inline threat selection and combat VFX remain live;
- `src/app/scenes/game/bridge/debug_view/**` still exists, but `BridgeScene` no longer instantiates the old debug layer.

Strict visual reference:

`docs/reference/combat_bridge_layout_2026-08-25.png`

## Refactor checkpoint — CLOSED

The pre-dashboard cleanup/refactor window is complete. Durable ownership details live in `docs/SYSTEM_MAP.md`.

Current results that matter for the next feature:

- `BridgeEncounterController` owns app-layer encounter interactivity and scene-flow decisions;
- `BridgeEncounterEngineEventHandler` maps one drained engine event at a time and owns presentation only;
- the broad captain combat-context read model/event is gone;
- Defense Turret uses its narrow `DEFENSE_TURRET_THREATS_UPDATED` read path;
- `AvailableOfficerCommand` is `commandId + target`; display labels remain definition-owned;
- snapshot, event and persistence boundaries remain intentionally separate where their lifecycle/order differs.

Do not schedule another general refactor pass. Refactor only when a feature exposes a concrete ownership, duplication or
cognitive-load problem.

## Immediate next slice — persistent ENEMY SHIP dashboard

Do not block the enemy board on unfinished MY SHIP BRIDGE/HULL semantics.

Build the persistent right-side enemy dashboard first, using current encounter-safe read truth:

- one enemy ship at a time;
- enemy ship name in the header;
- enemy Power Core may be presented separately from the equipment grid;
- visible basic enemy Hull state;
- visible installed equipment slots with type/name/icon/integrity/BROKEN state;
- no hidden ammo, cooldown, internal crew-task or decision data unless a future Science mechanic explicitly reveals it.

The dashboard is a stable information surface first and a direct-target surface second. Do not invent Beam targeting inside
the dashboard view before the engine target contract is inspected.

MY SHIP BRIDGE/HULL special-column semantics remain unresolved follow-up work. Preserve the existing 4x3 grid and do not
invent bridge damage merely because the visual region exists.

## Combat order from here

Current direction:

```text
persistent ENEMY SHIP slot board
-> inspect current Beam engine/read-model against real dashboard slots
-> player Beam HULL | SLOT(slotId) targeting through the dashboard
-> migrate/refine shared incoming Beam / targeted-Shield target vocabulary
-> compact top-center threat monitor migration
-> finish shared BROKEN gating + Engineer repair where the board exposes missing behavior
-> first weak-player vs weak-enemy timing/balance smoke
-> Science tactical-information pass
```

Do not resurrect the superseded large threat-action dashboard as the target UX.

## Important current runtime truths

- basic incoming threat identity is free information; no mandatory Science TRACK/IDENTIFY;
- current incoming Beam target vocabulary is still `HULL | DRIVE`;
- current player targeted Shield uses that same temporary `HULL | DRIVE` vocabulary;
- current player Beam still targets the enemy actor as a whole;
- Defense Turret interception is deterministic after successful Weapons work;
- Beam, Evade, Defense Turret and Shield Generator use shared Power Core;
- Drive has an existing BROKEN-only repair path;
- confirmed Evade Drive wear is still not implemented;
- encounter-end restoration/cleanup is still deferred;
- generic BROKEN gating/repair across all breakable equipment is still unfinished.

When intended design and runtime truth differ, keep the difference explicit. Do not silently rewrite one to look like the
other.

## Working rules for the next atom

Follow `docs/WORKING_RULES.md`; do not duplicate its patch/validation rules here.

Still avoid touching these unrelated holdouts without a concrete reason:

- `src/config/gameConfig.ts`;
- EndScene console logging;
- `ScreenWakeLock`;
- `BridgeMissileDebugView`.

## Next-chat continuation

Read this file, fetch fresh `master`, then inspect the current right-dashboard presentation code plus the engine
presentation/read-model data available for the current enemy ship.

Start with the **persistent ENEMY SHIP dashboard**. Keep Beam targeting out of the first dashboard atom unless the current
code proves that target identity must be introduced at the same boundary.
