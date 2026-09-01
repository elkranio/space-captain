# Space Captain — Current Handoff

This is the only live handoff file.

Historical handoffs belong in git history. Do not add dated root-level handoff files again unless there is a concrete
reason to preserve a temporary migration artifact.

Current source of truth:

```text
repository: elkranio/space-captain
branch: master
last inspected before this docs cleanup: ba555b21f9a434b39988e4d6929287f67e981a9c
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
- the old large threat-action presentation is still the current legacy runtime surface;
- compact threat monitor migration is still pending;
- `src/app/scenes/game/bridge/debug_view/**` still exists, but `BridgeScene` no longer instantiates the old debug layer.

Strict visual reference:

`docs/reference/combat_bridge_layout_2026-08-25.png`

## Immediate next slice — BRIDGE, then HULL

Do not start another standard equipment-tile pass.

The next design/implementation boundary is the MY SHIP special column:

```text
BRIDGE
HULL
```

These are not ordinary equipment tiles.

Before coding BRIDGE, inspect the fresh dashboard/chassis/runtime code and settle the exact contract with the user.

### BRIDGE questions still open

Decide deliberately:

- what BRIDGE always shows;
- whether BRIDGE is a targetable semantic ship node;
- what damage/state it would own if targetable;
- whether its four role markers are only officer state or part of a deeper bridge-damage mechanic;
- what information is permanent versus tooltip-only.

Do not invent bridge damage merely because the visual region exists.

### HULL boundary

HULL is ship/chassis state, not equipment.

Preserve:

- one explicit Hull target surface;
- visible Hull HP;
- no fake normal equipment `HULL` slot;
- future direct targeting should use the already-visible Hull surface.

The exact relationship between the narrow HULL region and a larger selectable chassis/backplate can be refined during the
HULL atom, but the existing 4x3 equipment grid must remain intact.

## Combat order after BRIDGE/HULL

Current direction:

```text
BRIDGE special state
-> HULL special state / target surface
-> persistent ENEMY SHIP slot board
-> compact top-center threat monitor migration
-> finish shared BROKEN gating + Engineer repair needed by the board
-> player Beam HULL | SLOT(slotId) targeting
-> shared incoming Beam / targeted-Shield slot target model
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

Follow `docs/WORKING_RULES.md`.

In particular:

- Russian, direct, small atoms;
- discuss ambiguous UX/behavior before implementation;
- engine owns gameplay legality;
- views present mapped truth;
- simple/dumb code over speculative architecture;
- roughly 120 columns;
- no pointless primitive ID aliases;
- re-fetch exact current files before patch generation;
- prefer `.patch`;
- user applies, validates, commits and pushes.

Do not touch without a concrete reason:

- `src/config/gameConfig.ts`;
- EndScene console logging;
- `ScreenWakeLock`;
- `BridgeMissileDebugView`.

## Next-chat continuation

Read this file, fetch fresh `master`, inspect the current player dashboard special-column code and the BRIDGE-related
runtime model.

Then ACK and discuss **BRIDGE** first.
