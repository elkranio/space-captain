# Space Captain — System Map

Living architecture map for the encounter-heavy part of Space Captain.

Last mapped commit:

```text
2011518c8d492eb6b7a99d6d2fc79f429e780f30
```

Read this file before changing:

- encounter mutable-state ownership;
- combat step order;
- command availability/execution;
- engine-to-app snapshot transport;
- bridge UI/controller boundaries;
- enemy policy;
- persistence synchronization.

---

# 1. Core boundaries

```text
src/engine
```

Owns gameplay/domain state, rules, content and headless simulation.

```text
src/app
```

Owns Phaser scenes, views, bridge-local input, read-model mapping,
presentation events and persistence integration.

Hard rules:

- engine does not import Phaser;
- views do not read `GAME_RUNTIME` directly;
- scenes are containers, not gameplay-rule owners;
- one mutable datum has one authoritative domain owner;
- events are facts, not a second mutable state;
- app snapshots/read models are detached projections;
- UI never reimplements command availability.

---

# 2. Encounter composition

`EncounterEngine` is the public encounter facade/composition root.

Current major composition:

```text
EncounterEngine
├─ EncounterStateStore
│  ├─ EncounterActorStore
│  ├─ EncounterNavigationStore
│  ├─ PlayerShipStore
│  └─ OfficerTaskStore
├─ EncounterSnapshotReader
├─ OfficerCommandExecutor
├─ OfficerTaskRunner
├─ PlayerWeaponRunner
│  ├─ PlayerMissileLauncherRunner
│  ├─ PlayerStickyMineDispenserRunner
│  ├─ PlayerLaserRunner
│  └─ PlayerSpamProjectorRunner
├─ CombatRunner
│  ├─ CombatMissileRunner
│  ├─ CombatStickyMineRunner
│  ├─ CombatLaserRunner
│  ├─ CombatSpamRunner
│  ├─ EnemyPointDefenseRunner
│  ├─ EnemyTaskScheduler
│  │  ├─ EnemyDecisionPolicy
│  │  ├─ EnemyCrewTaskRunner
│  │  └─ EnemyScienceIntelResolver
│  ├─ EnemyThreatObserver
│  └─ CombatRuntimeIdentityFactory
├─ CombatEngagementRunner
├─ PlayerShieldRunner
├─ EnemyShieldRunner
└─ ShieldGeneratorRunner
```

`EncounterEngine` may coordinate siblings for real cross-system boundaries.
Do not add sibling callbacks casually.

---

# 3. Current encounter step order

Current top-level order:

```text
PlayerShieldRunner
→ EnemyShieldRunner
→ OfficerTaskRunner
→ ShieldGeneratorRunner
→ PlayerWeaponRunner
→ CombatRunner
→ cancel player tasks with missing targets
```

Do not change order without focused regression tests.

Current combat conceptual pipeline:

```text
capture
→ integrate queued player combat objects
→ perceive
→ resolve pre-existing combat objects
→ perceive again
→ advance enemy crew decisions/tasks
→ schedule enemy work
→ advance enemy physical weapon systems
→ synchronize crew tasks
```

Reason for the pre-existing-object rule:

- a newly created object must not consume the current step's whole `deltaMs`;
- lethal cleanup may remove several objects;
- target-loss resolution must happen in a deterministic order.

---

# 4. Combat folder structure

Current grouped structure:

```text
src/engine/encounter/combat/
├─ CombatRunner.ts
├─ CombatEngagementRunner.ts
├─ CombatRuntimeIdentityFactory.ts
├─ enemy/
│  ├─ EnemyTaskScheduler.ts
│  ├─ EnemyDecisionPolicy.ts
│  ├─ EnemyCrewTaskRunner.ts
│  └─ intel/
│     ├─ EnemyThreatObserver.ts
│     └─ EnemyScienceIntelResolver.ts
├─ weapons/
│  ├─ PlayerWeaponRunner.ts
│  ├─ laser/
│  │  ├─ CombatLaserRunner.ts
│  │  └─ PlayerLaserRunner.ts
│  ├─ missile/
│  │  ├─ CombatMissileRunner.ts
│  │  └─ PlayerMissileLauncherRunner.ts
│  ├─ spam/
│  │  ├─ CombatSpamRunner.ts
│  │  └─ PlayerSpamProjectorRunner.ts
│  └─ sticky_mine/
│     ├─ CombatStickyMineRunner.ts
│     └─ PlayerStickyMineDispenserRunner.ts
├─ shield/
│  ├─ PlayerShieldRunner.ts
│  ├─ EnemyShieldRunner.ts
│  └─ ShieldGeneratorRunner.ts
├─ point_defense/
│  ├─ EnemyPointDefenseRunner.ts
│  └─ resolve_enemy_point_defense_beam_band.ts
└─ queries/
```

This was a structural cleanup.
Do not invent a second combat manager/facade.

---

# 5. EncounterStateStore ownership

`EncounterStateStore` remains the public mutable-state boundary.

It is now a facade over focused mutation groups:

```text
state/
├─ EncounterStateStore.ts
├─ create_encounter_state.ts
├─ actors/
│  └─ EncounterActorStore.ts
├─ navigation/
│  └─ EncounterNavigationStore.ts
├─ player/
│  └─ PlayerShipStore.ts
└─ officer_tasks/
   └─ OfficerTaskStore.ts
```

Responsibilities:

```text
EncounterActorStore
→ actor lookup/spawn/remove/team/hull/opening pulse

EncounterNavigationStore
→ arrival/travel/jump-point mutations
→ combat-zone cleanup when leaving anchor

PlayerShipStore
→ player hull/drive
→ player weapons
→ threat identification
→ shield/PD mutations

OfficerTaskStore
→ player officer-task storage/progress
```

Runners may still mutate their owned concrete state where appropriate.
Do not force every mutation through a giant store API.

---

# 6. Weapon lifecycle ownership

Shared player order:

```text
PlayerWeaponRunner
→ advance cooldowns for all installed player weapons
→ resolve current Science spam task
→ resolve current Weapons task
```

Concrete owners:

```text
PlayerMissileLauncherRunner
→ player missile targeting / ammo / launch

PlayerStickyMineDispenserRunner
→ player mine salvo / ammo / attach

PlayerLaserRunner
→ player laser targeting / charge / enemy shield-hull result

PlayerSpamProjectorRunner
→ Science targeting / 20s channel / cooldown / purge termination
```

Enemy/incoming physical owners:

```text
CombatMissileRunner
→ missile object lifecycle + enemy missile launcher lifecycle

CombatStickyMineRunner
→ mine lifecycle + enemy dispenser lifecycle

CombatLaserRunner
→ incoming enemy laser lifecycle

CombatSpamRunner
→ hostile enemy spam lifecycle

EnemyPointDefenseRunner
→ enemy PD physical interception

EnemyShieldRunner
→ enemy active shield lifetime / generator recovery
```

Do not replace concrete family runners with a generic attack framework.

---

# 7. Crew performance

`CrewPerformanceResolver` is the single current source of crew task progress
multipliers.

Current spam rule:

```text
active spam effect
→ target crew progress multiplier reduced

multiple same-family slowdowns
→ strongest slowdown wins
```

World clocks such as an already-active player spam channel continue in world
time; crew-operated targeting/task progress uses crew-adjusted delta.

Do not apply crew effects ad hoc inside individual unrelated runners.

---

# 8. Enemy behavior ownership

Information path:

```text
objective threat
→ EnemyThreatObserver
→ actor-local observation
→ enemy Science task
→ EnemyScienceIntelResolver
→ report
→ EnemyDecisionPolicy
```

Policy chooses work.

Scheduler validates/starts it.

Crew task runner owns operator occupation/lifecycle.

Physical subsystem owns the actual effect.

Current intent kinds:

- purge player spam;
- identify threat;
- operate offensive weapon;
- intercept missile;
- deploy shield;
- clear sticky mine.

Current work roles:

```text
WEAPONS
SCIENCE
ENGINEER
```

Mine clearing may also assign HELM through the dedicated mine-clearing priority.

Do not build a behavior tree or generic utility AI.

---

# 9. Engine-to-app read boundary

`EncounterSnapshotReader`:

- binds to authoritative encounter state;
- caches nothing;
- returns recursively detached results.

Important public reads:

- navigation;
- drive;
- player hull;
- available commands;
- officer availability;
- officer tasks;
- player weapon states;
- enemy telemetry;
- incoming/outgoing missiles;
- sticky mines;
- laser threats;
- active shields;
- enemy debug.

Dashboard code should consume prepared app read models, not reach into engine
state directly from Phaser views.

---

# 10. Bridge controller/view composition

Current bridge root:

```text
BridgeController
├─ BridgeView
└─ BridgeEncounterController
```

Current `BridgeView` composition:

```text
BridgeView
├─ BridgeSpaceView
├─ BridgeCombatView
├─ BridgeInteriorView
├─ BridgeOfficerStationsView
├─ BridgeTargetingWarningView
├─ BridgeUiView
└─ BridgeOfficerBarksView
```

`BridgeCombatView` owns combat-only presentation modules and their dependency on
`BridgeSpaceView` positions.

Current `BridgeUiView` is temporary:

```text
BridgeUiView
├─ BridgeShipStatusView
├─ BridgeEnemyTelemetryView
├─ optional BridgeEnemyDebugPanelView
└─ BridgeOfficerContextMenuView
```

Target dashboard change:

```text
BridgeUiView
→ BridgeCaptainDashboardView
→ focused left/right dashboard subviews as needed
```

Do not move domain command rules into `BridgeCaptainDashboardView`.

---

# 11. Current command flow

Current role-menu flow:

```text
station click
→ OFFICER_STATION_CLICKED
→ BridgeEncounterController
→ BridgeOfficerCommandMenuController.open(role)
→ EncounterEngine.getAvailableCommands(role)
→ OFFICER_COMMAND_MENU_UPDATED
→ context menu
→ OFFICER_COMMAND_SELECTED
→ BridgeEncounterController
→ EncounterEngine.executeCommand()
```

Target dashboard flow should preserve the last half:

```text
dashboard model resolves current engine commands
→ dashboard action button
→ OFFICER_COMMAND_SELECTED
→ BridgeEncounterController
→ EncounterEngine.executeCommand()
```

Do not create a second execution API only for dashboard buttons.

Current `getAvailableCommands(role)` rule:

```text
role has officer task
→ no commands returned for that role
```

---

# 12. Bridge snapshot transport

`BridgeEncounterSnapshotSynchronizer` owns continuously changing encounter
read-model delivery.

Current relevant emissions:

```text
PLAYER_WEAPONS_STATUS_UPDATED
ENEMY_SHIP_TELEMETRY_UPDATED
INCOMING_MISSILES_UPDATED
OUTGOING_MISSILES_UPDATED
OUTGOING_STICKY_MINES_UPDATED
STICKY_MINES_UPDATED
LASER_THREATS_UPDATED
PLAYER_SHIELD_UPDATED
ENEMY_SHIELDS_UPDATED
```

It also persists player weapon snapshots into `GameRuntime`.

Navigation persistence remains explicit at lifecycle boundaries in
`BridgeEncounterController`.

Do not fold all persistence into a broad per-frame sync.

---

# 13. Known dashboard transport gaps

Current player weapon bridge payload includes:

- laser;
- missile launcher;
- spam projector.

It does not include the player sticky-mine dispenser.

The new left panel needs all installed current tools.
Fix the read model/mapping rather than reading engine state from the view.

Current enemy telemetry exposes:

- actor ID;
- hull;
- drive;
- shield generator;
- physical weapon kinds/phases.

The desired mockup also contains:

- crew composition;
- discovered weaknesses/intel.

Those are not yet a final player-facing knowledge contract.
Do not turn debug/omniscient data into permanent UI semantics accidentally.

---

# 14. Persistence ownership

During encounter, authoritative player mutable state lives in `EncounterState`.

Persistent player values synchronized to `GameRuntime` include:

- navigation;
- hull;
- drive;
- PD;
- shield generator;
- installed player weapon state.

Enemy:

- persistent node actor identity/baseline survives;
- destroyed actor is removed persistently;
- surviving mutable combat state resets when encounter is reconstructed.

Combat objects remain encounter-local.

---

# 15. Refactor warning signs

Stop and inspect when a dashboard feature requires:

- view reading `GAME_RUNTIME`;
- view reading raw `EncounterState`;
- duplicated command availability logic;
- new dashboard-specific command executor;
- both polling and snapshots for the same purpose;
- another sibling callback in `EncounterEngine`;
- copying weapon phase semantics into UI;
- one giant dashboard view owning data mapping, input and rendering;
- generic UI framework built before two contexts actually need it;
- changing combat step order for presentation convenience.

---

# 16. Current cleanup status

Completed:

- bridge combat presentation composition extraction;
- combat folder grouping;
- player weapon-family runner extraction;
- enemy behavior/defense vertical slices;
- unified crew-progress slowdown model;
- app snapshot transport extraction;
- detached snapshot boundary;
- `EncounterStateStore` decomposition.

No architecture cleanup is required before starting the captain dashboard.

Dashboard work should be a product/UX slice, not another architecture audit.
