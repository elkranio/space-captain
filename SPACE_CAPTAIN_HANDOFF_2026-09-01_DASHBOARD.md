# Space Captain — Dashboard Handoff — 2026-09-01

## Current source of truth

Repository: `elkranio/space-captain`
Branch: `master`
Checkpoint commit: `6292b3ed1106c7397d53cd3781fdc1df26de3ade`

This handoff supersedes the implementation-state sections of older handoff files.
Always re-fetch fresh `master` and exact touched files before making a patch.

Read these durable docs before changing design/runtime contracts:

- `docs/WORKING_RULES.md`
- `docs/GAME_DESIGN.md`
- `docs/GAMEPLAY_CONTRACTS.md`
- `docs/EQUIPMENT.md`
- `docs/BRIDGE_ART_DIRECTION.md`
- `docs/COMBAT_PLAYTEST_ROADMAP.md`

Do not ask the user to paste repository files. GitHub is the source of truth.

---

## Immediate checkpoint

The player captain dashboard now has the complete set of standard equipment tiles:

1. Missile Launcher
2. Beam Cannon
3. Sticky Mine Dispenser
4. SPAM Projector
5. Defense Turret
6. Shield Generator
7. Drive

The old temporary equipment placement by array/order has also been removed.

### Next work

The next dashboard atoms are:

1. **BRIDGE**
2. **HULL**

Do not start another generic equipment tile pass first.

Before implementing BRIDGE/HULL, inspect the fresh dashboard/chassis code and discuss the exact visual/interaction contract.
These are special dashboard/chassis regions, not ordinary equipment devices.

---

## Authoritative equipment layout — LANDED

Commit `6292b3ed1106c7397d53cd3781fdc1df26de3ade` landed the proper 4x3 equipment layout.

The dashboard no longer derives placement from:

- weapon array index;
- equipment type;
- "turret after weapons";
- "shield after turret";
- "drive after shield".

Placement now comes from the player's authoritative ship configuration:

`player.ship.chassisId + player.ship.mounts`

The bridge controller passes this layout into `BridgeEncounterSnapshotSynchronizer`.

`BridgePlayerShipDashboardMapper` resolves an installed runtime equipment id through:

`mount.equipmentId -> mount.slotId -> SHIP_CHASSIS[chassisId].slots`

and emits canonical 1-based:

```ts
type BridgeEquipmentSlotPayload = {
    column: number;
    row: number;
};
```

The equipment grid converts those coordinates to the exact 4x3 cell.

Important rules now encoded in the implementation:

- grid placement comes only from chassis slots/mounts;
- empty chassis slots stay empty;
- duplicate equipment kinds remain distinct by runtime equipment id;
- slot coordinates are 1-based at the bridge payload boundary;
- a slot outside the 4x3 dashboard grid throws;
- no fallback to array order should be reintroduced.

Relevant model:

`src/engine/defs/ship_slot.ts`

```ts
export type ShipSlotDefinition = {
    id: string;
    label: string;
    kind: ShipSlotKind;
    column: number;
    row: number;
    operatorRole: OfficerRole | null;
};

export type ShipEquipmentMountState = {
    slotId: string;
    equipmentId: string;
    integrity: number;
};
```

Chassis definitions own the immutable slot layout.
Ship presets/runtime mounts own the installed equipment.

Relevant files:

- `src/engine/defs/ship_slot.ts`
- `src/engine/defs/ship_chassis.ts`
- `src/engine/content/catalogs/ship_chassis.ts`
- `src/app/scenes/game/bridge/controller/BridgeEncounterController.ts`
- `src/app/scenes/game/bridge/controller/encounter/snapshots/BridgeEncounterSnapshotSynchronizer.ts`
- `src/app/scenes/game/bridge/controller/captain_dashboard/BridgePlayerShipDashboardMapper.ts`
- `src/app/scenes/game/bridge/events/bridge_event.ts`
- `src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgePlayerShipEquipmentGridView.ts`

---

## Standard equipment tile grammar

The equipment grid is exactly 4 columns x 3 rows.

Current visual state language:

- neutral / off-white — ready;
- yellow/orange left-to-right crop — active work;
- muted blue — cooldown;
- muted blue static — resource blocked;
- red — broken/problem;
- integrity is represented by pips;
- equipment titles come from catalog `shortName`.

Do not dim equipment merely because an officer is busy or there is no valid target.

Do not reintroduce category-wide background colors. The user was not sold on that direction.

A future idea exists for tiny category glyphs near names, but it is **not implemented** and should not be bundled into BRIDGE/HULL work.

---

## Standard tile status

### Missile Launcher

Concrete tile exists.

Shows:

- catalog short name;
- ammo;
- integrity;
- targeting progress;
- cooldown progress;
- resource blocked at zero ammo;
- Weapons FIRE/CANCEL hover behavior when authoritative action/task data allows it.

### Beam Cannon

Concrete tile exists.

Shows:

- catalog short name;
- Power Core cost;
- integrity;
- charging progress;
- cooldown progress;
- resource blocked when current Power Core charge is below cost;
- Weapons FIRE/CANCEL hover behavior from authoritative action/task data.

### Sticky Mine Dispenser

Concrete tile exists.

Shows:

- catalog short name;
- ammo;
- integrity;
- dispensing progress;
- cooldown;
- zero-ammo blocked state.

Player cancellation is intentionally not exposed for the current mine task contract.

### SPAM Projector

Concrete tile exists.

Shows:

- catalog short name;
- integrity;
- channeling progress;
- cooldown;
- purged presentation state;
- Science FIRE/CANCEL hover behavior.

No fake ammo/resource row exists.

### Defense Turret

Concrete tile exists.

Lifecycle:

`READY -> LOADING -> COOLDOWN -> READY`

Current contract:

- Power charge is committed when intercept is issued;
- Weapons performs the intercept work;
- success/cancel/damage interruption/target disappearance do not refund the charge;
- committed work enters full cooldown;
- threat row owns the concrete missile target, so the tile itself has no generic FIRE hover action.

Tile shows:

- `DEF. TURRET`;
- Power Core cost;
- integrity;
- intercept/loading progress;
- cooldown;
- insufficient-power blocked state.

### Shield Generator

Concrete tile exists.

Important design truth:

- the old left/center/right shield model is gone;
- shields protect ship **nodes**;
- future targeting is expected to work through node selection/highlight rather than directional sectors;
- do not restore directional shield UI.

Tile currently shows:

- `SHIELD GEN.`;
- Power Core cost;
- integrity;
- deployment progress;
- cooldown;
- insufficient-power blocked state;
- broken state.

Targeting mechanics are deliberately outside the tile for now.

Presentation uses `PlayerShieldGeneratorPresentationSnapshot`, which wraps:

```ts
{
    state,
    cooldownDurationMs,
    integrity
}
```

Persistence must persist `shieldGenerator.state`, not the wrapper.

### Drive

Concrete tile exists and is green.

Catalog baseline:

```json
{
    "basic_00": {
        "name": "BASIC DRIVE",
        "shortName": "DRIVE",
        "maxIntegrity": 2,
        "evadeWarmupMs": 1000,
        "evadeDurationMs": 30000,
        "evadeCooldownMs": 20000,
        "evadePowerCost": 2
    }
}
```

Tile shows:

- `DRIVE`;
- EVADE Power Core cost;
- integrity pips;
- disabled/broken red state;
- insufficient-power blue state.

Do **not** add explanatory text such as "evade damages drive" inside the tile.
The user wants proper tooltips/descriptions later for all equipment.

Drive tile does not currently own EVADE execution/click mechanics. That was intentionally kept out of the presentation atom.

---

## Existing EVADE runtime truth

Shared evade phases:

`READY -> WARMUP -> EVADING -> COOLDOWN -> READY`

Cooldown is committed at maneuver start and runs independently through warmup/evading.

Stopping/cancelling an active evade preserves committed cooldown.

Do not redesign this while doing BRIDGE/HULL presentation.

---

## BRIDGE and HULL — next design boundary

These are **not** normal equipment tiles.

The current dashboard concept has a narrow special column:

- PLAYER side: special column is on the right;
- ENEMY side: special column is on the left;
- BRIDGE occupies the upper special area;
- HULL occupies the lower special area.

The broader targeting concept is that the ship/chassis itself can be targetable while individual equipment slots remain independently targetable.

Do not create a fake normal equipment "HULL tile" merely to make hull targetable.

Before coding the next atom, inspect the current dashboard composition and decide with the user:

- exact BRIDGE visual payload;
- whether BRIDGE is a targetable node and what state it exposes;
- exact HULL/chassis presentation;
- how the special column and chassis/backplate relate visually;
- what belongs in tooltip versus always-visible tile text.

Preserve the existing 4x3 equipment grid.

---

## Dashboard visual constraints

Target UI: 1280x720.

Current full-screen bridge direction:

- central viewscreen stays locked;
- four officer monitor panels near the edges;
- top-center threat monitor;
- two large lower dashboards;
- tiny center gap;
- large equipment tiles;
- exact 4x3 equipment grid;
- ESCAPE belongs in the dashboard header, not a tall vertical column;
- no visible captain character.

Art direction:

- classic early-1990s VGA / Sierra / Space Quest feel;
- clean deliberate pixel clusters;
- limited palette;
- practical worn military sci-fi;
- restrained lights;
- avoid AI-looking noisy greebles, fish-scale texture, glossy mobile-game rendering, and 3D-slop.

Equipment icon target footprint has been approximately 100x40 with minimal transparent padding.

---

## Coding / collaboration rules for the next chat

- Russian.
- Direct and short.
- Work in micro-atoms.
- Discuss design before implementation when behavior/UX is ambiguous.
- No architecture for architecture's sake.
- No unrelated refactors inside feature atoms.
- Prefer simple/dumb code over clever abstractions.
- Target line length: 120.
- Do not introduce pointless nominal aliases such as `type SomethingId = string`.
- GitHub `master` is the source of truth.
- Re-fetch touched files before every patch.
- Prefer `.patch`.
- User applies patch, then runs typecheck/tests/runtime smoke and pushes.

Patch-generation rule after failures in the previous chat:

**Never generate a patch from fake truncated files/padding and then claim it is exact.**

Use exact full files or exact real repository hunks.
The user's local `git apply --check` is authoritative.

Do not touch without a concrete reason:

- `src/config/gameConfig.ts`
- EndScene console logging
- `ScreenWakeLock`
- `BridgeMissileDebugView`

---

## Suggested first message/action in the next chat

Read this file, fetch fresh `master`, inspect the current player dashboard composition and the BRIDGE/HULL-related runtime model.

Then ACK the checkpoint and discuss **BRIDGE** first.

Do not repeat the equipment tile work or the slot-layout refactor.
