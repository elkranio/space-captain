# Space Captain — System Map

Last mapped commit: `5a37de2d24c8212c8ff1251ab097f75b293e5f9b`

## Boundaries

```text
src/engine → gameplay/domain/headless simulation
src/app    → Phaser/input/presentation/read-model mapping/persistence integration
```

Rules:

- engine does not import Phaser;
- views do not own command availability;
- views do not read raw EncounterState;
- events are facts, not second mutable state;
- one mutable datum has one authoritative owner;
- app read models are detached projections.

## EncounterEngine composition

Current high level:

```text
EncounterEngine
├─ EncounterStateStore
├─ EncounterSnapshotReader
├─ OfficerCommandExecutor
├─ OfficerTaskRunner
├─ PlayerWeaponRunner
├─ CombatRunner
├─ CombatEngagementRunner
└─ DefenseCapacitorRunner
```

Removed architecture:

```text
PlayerShieldRunner
EnemyShieldRunner
ShieldGeneratorRunner
shield generator defs/content/factory
```

## Step order

```text
DefenseCapacitorRunner
→ OfficerTaskRunner
→ PlayerWeaponRunner
→ CombatRunner
→ cancel officer tasks with missing targets
```

Do not change without focused lifecycle tests.

## Mutable state ownership

Conceptually:

```text
actors       → actor identity/team/hull/spawn/remove
navigation   → arrival/travel/jump/dock-related state
player       → hull/drive/DEF/PD/weapons/player knowledge
officer task → player task storage/progress/cancel
```

Do not route every mutation through a giant generic store API just for uniformity.

## Defense

Current player renewable resource:

```text
DefenseCapacitorState
DefenseCapacitorRunner
```

Starter baseline: 4 charges, 24s sequential recharge.

Point defense spends shared DEF.

Old directional shield objects/generator state are gone.

## Weapon/combat ownership

```text
PlayerWeaponRunner
├─ PlayerMissileLauncherRunner
├─ PlayerStickyMineDispenserRunner
├─ PlayerLaserRunner
└─ PlayerSpamProjectorRunner
```

Physical combat families include missile, sticky mine, laser, spam, enemy PD and
enemy task/policy/intel modules.

Laser current truth: no spatial target zones, no shield block, deterministic hull result.

## Encounter read boundary

`EncounterSnapshotReader` backs public detached reads such as:

```text
getAvailableCommands
getNavigationState
getDriveState
getPlayerHullState
getOfficerAvailabilityStates
getOfficerTasks
getPlayerWeaponStates
getDefenseCapacitorState
getEnemyShipTelemetrySnapshots
getEnemyDebugSnapshots
getIncoming/Outgoing combat objects
getStickyMineSnapshots
getLaserThreatSnapshots
getSpamChannels
```

Engine debug/telemetry reads may survive deleted presentation if they still serve
functional observability.

## BridgeView composition

```text
BridgeView
├─ BridgeSpaceView
├─ BridgeCombatView
├─ BridgeInteriorView
├─ BridgeTargetingWarningView
├─ BridgeOfficerStationsView
├─ BridgeCaptainDashboardView
├─ BridgeOfficerBarksView
└─ BridgeOfficerContextMenuView
```

Removed: `BridgeUiView`, old enemy telemetry/debug panel, old ship-status UI,
shield-field view.

## Command flow

```text
UI resolves exact AvailableOfficerCommand
→ BRIDGE_EVENT.OFFICER_COMMAND_SELECTED
→ BridgeEncounterController
→ EncounterEngine.executeCommand(...)
```

Authoritative availability:

```text
EncounterEngine.getAvailableCommands(role)
```

Do not duplicate in dashboard views.

## Local Space boundary

Old Local Space/GameOverlay is presentation-only and is next removal target.

It is not source of truth for current node/navigation/anchors or `HELM_FLY_TO`.

Current fly path is through officer context menu.

Future navigation dashboard should project fresh domain data rather than preserve
old UI transport.

## Current audit targets

First high-context candidates:

```text
BridgeEncounterEngineEventHandler
BridgeEncounterController
```

Do not split on line count alone.

`EncounterEngine` currently functions as facade/composition root.
`bridge_event.ts` is a large contract file, not automatically a god object.

## Callback warning

Current real cross-system callbacks include damage interruption, spam purge,
mine clearing, queued combat objects and enemy destruction.

Good refactor reduces sibling edges/context reconstruction.
Bad refactor hides same graph behind more forwarding classes.
