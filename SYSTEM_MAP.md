# Space Captain — System Map

Living architecture map for the encounter-heavy part of Space Captain.

Read this file before changing encounter state ownership, combat step order,
engine/app transport, enemy policy or persistence synchronization.

This file describes:

- authoritative mutable state;
- subsystem ownership;
- execution order;
- transport rules;
- expected change paths;
- architectural warning signs.

It does not contain gameplay balance or implementation backlog.

Last mapped commit:

```text
a2918ae6edc900e34b8a290c8051d3a65a4e44e8
```

---

# 1. Core boundaries

```text
src/engine
```

Owns gameplay/domain state, rules, content, factories and headless simulation.

```text
src/app
```

Owns Phaser scenes, views, controllers, presentation events and persistence
integration with `GameRuntime`.

Hard rules:

- engine code does not import Phaser;
- scenes are containers, not rule owners;
- views consume prepared payloads and do not read `GAME_RUNTIME` directly;
- one mutable value has one authoritative owner;
- events describe facts and do not become a second mutable state;
- snapshots/read models are derived projections;
- generic frameworks are rejected unless current code is simpler after them.

---

# 2. Runtime ownership matrix

| Datum | Authoritative state during encounter | Main mutator | Persistent after encounter | Presentation |
|---|---|---|---|---|
| Player navigation | `EncounterState.navigation` | `EncounterStateStore` / task completion | yes, synchronized to `GameRuntime` | encounter object movement |
| Player drive | `EncounterState.drive` | `EncounterStateStore` | yes, synchronized to `GameRuntime` | player ship status |
| Point-defense charges | `EncounterState.combat.pointDefense` | command/task execution | yes, synchronized to `GameRuntime` | player ship status |
| Shield-generator state | `EncounterState.combat.shieldGenerator` | shield-generator runner/store | yes, synchronized to `GameRuntime` | player ship status |
| Player weapon state | `EncounterState.combat.playerWeapons` | `PlayerWeaponRunner` / store | yes, synchronized to `GameRuntime` | player weapon status |
| Player hull | `EncounterState.playerHull` | `EncounterStateStore.damagePlayerHull()` | yes, exact result synchronized to `GameRuntime` | player ship status |
| Enemy encounter actor | `EncounterState.actors` | encounter/combat systems | identity/baseline only | encounter object + telemetry |
| Enemy hull | ship encounter actor | `EncounterStateStore.damageEnemyActorHull()` | resets from node actor on reconstruction | enemy telemetry |
| Enemy weapon state | ship encounter actor | `CombatRunner` | resets from node actor on reconstruction | enemy telemetry |
| Player/incoming projectiles | `EncounterState.combat.projectiles` | `CombatRunner` | no | missile views |
| Sticky mines | `EncounterState.combat.stickyMines` | `CombatRunner` | no | sticky-mine views |
| Active laser attacks | `EncounterState.combat.laserAttacks` | `CombatRunner` | no | laser threat/VFX views |
| Player officer tasks | `EncounterState.officerTasks` | `OfficerTaskRunner` / store | only through reconstructed navigation tasks where required | officer activity |
| Enemy crew tasks | `ShipEncounterActorState.crewTasks` | `EnemyCrewTaskRunner` | no | currently no direct bridge projection |
| Objective player threat | combat object or player officer task | owning runner | no | outgoing weapon presentation |
| Enemy observation | `actor.threatObservations` | `EnemyThreatObserver` | no | enemy policy input |
| Enemy Science report | `observation.report` | `EnemyScienceIntelResolver` through task completion | no | enemy policy input |
| Enemy policy memory | `actor.decision` | `EnemyDecisionPolicy` | no | none |

Player hull is authoritative inside the encounter and is persisted from the
applied engine result.

Surviving enemy combat state intentionally resets from its persistent node
actor when the encounter is reconstructed. Do not add partial enemy-state
writeback without changing the locked gameplay contract.

---

# 3. Encounter composition

`EncounterEngine` is the public façade and composition root.

Current major subsystems:

```text
EncounterEngine
├─ EncounterStateStore
├─ OfficerCommandExecutor
├─ OfficerTaskRunner
├─ PlayerWeaponRunner
├─ CombatRunner
│  ├─ EnemyThreatObserver
│  └─ EnemyTaskScheduler
│     ├─ EnemyDecisionPolicy
│     ├─ EnemyCrewTaskRunner
│     └─ EnemyScienceIntelResolver
├─ CombatEngagementRunner
├─ PlayerShieldRunner
├─ ShieldGeneratorRunner
└─ ContactSequenceRunner
```

`EncounterEngine` may coordinate siblings, but every new sibling callback is a
warning sign. Before adding one, check whether:

- the operation is a real cross-system orchestration;
- two systems have accidentally acquired overlapping ownership;
- the operation belongs in the state store as a shared invariant;
- an existing domain event or explicit result can carry the information.

Do not introduce a DI container or service locator.

---

# 4. Encounter step order

Current top-level engine order:

```text
PlayerShieldRunner
→ OfficerTaskRunner
→ ContactSequenceRunner
→ ShieldGeneratorRunner
→ PlayerWeaponRunner
→ CombatRunner
→ cancel player tasks with missing targets
```

Current combat step order:

```text
capture IDs of combat objects that existed before this step
→ integrate queued player missile launches
→ integrate queued player sticky-mine attachments
→ synchronize enemy observations
→ advance only pre-existing projectiles
→ advance only pre-existing sticky mines
→ synchronize enemy observations again
→ advance enemy crew tasks and decisions
→ schedule enemy work
→ advance enemy weapons
→ synchronize enemy crew tasks after weapon advancement
```

Locked lifecycle reason:

- a player launch physically performed by `PlayerWeaponRunner` must exist before
  an older lethal impact resolves;
- the new combat object must not receive the current step's `deltaMs`;
- actor destruction resolves remaining player combat objects as `TARGET_LOST`
  before actor removal and destruction presentation;
- iteration uses stable IDs because lethal cleanup may remove several objects.

Any edit to this order requires focused regression tests.

Current readable phase pipeline:

```text
capture
→ integrate
→ perceive
→ resolve existing objects
→ perceive
→ decide
→ execute
→ finalize
```

`CombatRunner.step()` expresses this order through private phase methods.
Do not inline the pipeline back into one mixed orchestration block and do not
introduce another coordinator class.

---

# 5. Enemy cognition and work ownership

Current information chain:

```text
objective combat truth
→ EnemyThreatObserver
→ EnemyThreatObservationState
→ enemy Science task
→ EnemyScienceIntelResolver
→ EnemyThreatReport
→ enemy policy
```

Locked semantic distinctions:

- objective truth is the actual projectile, sticky mine or player officer task;
- observation means the enemy crew can currently notice the threat;
- report is the Science conclusion and may be false;
- the report intentionally contains no reliability flag;
- policy must not bypass the report to read hidden objective threat details.

Current decision ownership:

- `EnemyDecisionPolicy.selectWork(actor, role)` selects one `EnemyWorkIntent`;
- policy owns Science-identification priority, weapon round-robin and offensive
  delays;
- `EnemyTaskScheduler` validates and starts the selected intent;
- scheduler does not search observations or select weapons independently.

```text
EnemyDecisionPolicy selects EnemyWorkIntent
→ EnemyTaskScheduler validates and executes the intent
→ EnemyCrewTaskRunner owns task lifecycle
→ physical subsystem owns weapon/effect lifecycle
```

Policy decides **what work should be attempted**.
Scheduler decides **whether and how that intent can be physically started**.

Do not build a generic planner, behavior tree or utility-AI framework.

---

# 6. Weapon lifecycle ownership

Player weapon lifecycle belongs to `PlayerWeaponRunner`.

Enemy weapon lifecycle currently belongs to `CombatRunner`.

Officer/crew tasks describe operator occupation and selected targets. Cooldowns
do not occupy the operator.

The shared domain query is:

```text
doesShipWeaponPhaseRequireOperator(phase)
```

Do not duplicate the list of active operator-controlled phases in another
runner, scheduler or command rule.

Current rule:

```text
TARGETING / CHARGING / CHANNELING / DISPENSING
→ operator remains occupied

COOLDOWN / READY
→ operator is free
```

A weapon family may receive its own runner only when that split makes the
current lifecycle smaller and leaves a narrow public contract.

Physical player-weapon commands use the resolved target:

```text
ACTOR_WEAPON
├─ weaponId — installed runtime weapon instance
└─ actorId  — enemy target
```

Availability emits one command per ready physical weapon instance.
`OfficerCommandExecutor` validates the exact `weaponId + actorId` pair.
Command handlers execute that exact weapon instance and must not search again
for the first ready launcher/dispenser.

---

# 7. Engine-to-app transport

Use one transport purpose per datum.

## Domain events

Use events for:

- identity creation/removal;
- completed actions and outcomes;
- one-shot VFX;
- state transitions requiring persistence side effects;
- cinematic or scene-flow requests.

Examples:

```text
missile launched
sticky mine resolved
laser fired
enemy destroyed
officer task started/ended
```

## Snapshots/read models

Use snapshots for continuously changing state:

- remaining impact/fuse/charge time;
- current telemetry;
- current shield duration;
- current weapon status;
- current command availability.

App-side collection and bridge delivery of continuously changing encounter
read models is owned by:

```text
BridgeEncounterSnapshotSynchronizer
```

It may map engine read models to bridge payloads and emit complete snapshot
updates. It does not own domain decisions, navigation lifecycle or event
translation.

All app-facing reads from one encounter are owned by:

```text
EncounterSnapshotReader
```

The reader is bound to the authoritative `EncounterState`, but owns no state
and caches nothing. Every public read recursively detaches its result before it
crosses the engine boundary.

The encounter outbox applies the same detached-snapshot rule at `emit` time.
Event producers may pass their current domain object; queued events never keep
mutable references to encounter state. `ENCOUNTER_LOADED` is therefore a real
initial snapshot and must not be used as a mutation handle.

Headless tests that intentionally arrange mid-encounter state use the single
test-only `getMutableEncounterStateForTest` white-box helper. Runtime code must
never copy that pattern.

## Persistence synchronization

Event-driven persistence is owned by:

```text
BridgeEncounterRuntimeSynchronizer
```

For each encounter event, the app order is:

```text
EncounterEvent
→ synchronize persistent GameRuntime state
→ translate presentation / scene-flow effects
```

`BridgeEncounterEngineEventHandler` owns bridge presentation and scene flow but
must not call `GameRuntime` mutation methods directly.

Snapshot-based player-weapon persistence is owned by
`BridgeEncounterSnapshotSynchronizer`, next to the matching bridge-status
projection. Navigation synchronization remains explicit in
`BridgeEncounterController` at lifecycle boundaries and must not be folded into
per-frame snapshot transport.

## Bridge events

Bridge events are app-layer delivery messages to views/controllers.
They are not domain truth and must not be read back as gameplay state.

A new feature should not use both a domain event and snapshot for the same
purpose. It may use:

```text
event for add/remove/VFX
+
snapshot for continuous current values
```

---

# 8. Expected change paths

## New enemy defensive response

```text
gameplay contract
→ observation/report requirements
→ EnemyWorkIntent
→ policy selection
→ scheduler validation/start
→ enemy crew task lifecycle
→ physical resolver
→ event/snapshot projection
→ tests
```

## New player weapon

```text
definition/state
→ command availability/execution
→ player officer task
→ PlayerWeaponRunner lifecycle
→ combat object or direct effect
→ authoritative mutation
→ engine event/snapshot
→ persistence sync
→ bridge presentation
→ tests
```

## New continuous bridge telemetry

```text
engine query/read model
→ app mapper
→ bridge update payload
→ view
```

## New one-shot bridge effect

```text
engine event
→ bridge event translation
→ view/VFX
```

---

# 9. Refactor warning signs

Stop and inspect architecture when a local feature requires any of these:

- more than five production files across unrelated subsystems;
- changes to more than two central discriminated-union switches;
- both polling and events without distinct purposes;
- another direct `GAME_RUNTIME` mutation inside presentation code;
- another sibling callback in `EncounterEngine`;
- copying the same phase/availability rule into another file;
- storing objective data again inside an observation/report/view payload;
- changing combat step order without an ordering regression test;
- a repair script that touches unrelated cleanup;
- a mapper or handler becoming responsible for domain decisions.

---

# 10. Current cleanup sequence

```text
1. done — lock gameplay/persistence contracts
2. done — resolve player-hull and surviving-enemy ownership
3. done — make EnemyDecisionPolicy the single decision owner
4. done — centralize crew-controlled weapon-phase semantics
5. done — expose CombatRunner step phases explicitly
6. done — separate bridge persistence transport from presentation transport
7. done — audit again before command-palette implementation
8. done — extract app snapshot transport from BridgeEncounterController
9. done — centralize detached engine reads and snapshot cloning
10. next — return to one narrow enemy defensive behavior slice
```

Audit result: physical launchers/dispensers now keep stable command identity
through availability, validation and execution. No further architecture
refactor is required before replacing the old command menu with the complete
command-palette interaction flow.

The snapshot cleanup removed duplicated transport and unsafe mutable references
without changing gameplay ownership or step order.

Small adjacent cleanups are allowed when they:

- remove duplicated semantics;
- shorten a transport;
- clarify ownership;
- reduce branching;
- strengthen an invariant;
- remain behavior-preserving and locally testable.

Do not expand an atom only for naming/style consistency.
