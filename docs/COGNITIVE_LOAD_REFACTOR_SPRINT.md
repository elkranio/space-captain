# SPACE CAPTAIN — COGNITIVE LOAD REFACTOR SPRINT

## Status

Planned refactor sprint.

This document is the working contract for a large cleanup pass over the Space Captain codebase.

The goal is **not** to make the code more abstract, more "enterprise", more DRY, or more theoretically elegant.

The goal is to make the project easier to understand, modify, debug, and extend by both the human developer and an AI coding assistant.

---

# 1. Primary goals

The refactor is successful if the code becomes:

1. **Dumb.**
2. **Obvious.**
3. **Locally understandable.**
4. **Easy to trace from input to authoritative state change to presentation.**
5. **Hard to accidentally execute through two different paths.**
6. **Low in cognitive overhead.**
7. **Low in historical baggage.**
8. **Consistent enough that a new feature has an obvious place to live.**

When choosing between:

- elegant but indirect;
- repetitive but obvious;

prefer **repetitive but obvious** unless the repetition itself creates a real maintenance problem.

When choosing between:

- compressed one-liner;
- two or three explicit statements;

prefer the version that is easiest to read without mentally parsing syntax.

Example:

```ts
const actor = state.actors.find((candidate) => candidate.id === actorId);
```

is fine.

But if a condition becomes dense:

```ts
if (actor?.drive.status === ONLINE && actor.evade.phase === READY && actor.team === ENEMY) {
```

prefer:

```ts
if (!actor) {
    return false;
}

if (actor.drive.status !== SHIP_DRIVE_STATUS.ONLINE) {
    return false;
}

if (actor.evade.phase !== SHIP_EVADE_PHASE.READY) {
    return false;
}

if (actor.team !== ENCOUNTER_TEAM.ENEMY) {
    return false;
}
```

The goal is not minimum lines.

The goal is minimum mental work.

---

# 2. Non-goals

Do **not** use this sprint as an excuse to:

- rewrite the game from scratch;
- introduce ECS;
- introduce dependency injection frameworks;
- build a generic event framework;
- build a generic state machine framework;
- build a generic "system" abstraction around every runner;
- convert everything into functional programming;
- convert everything into classes;
- create generic repositories/services/managers because the names sound clean;
- add abstractions for hypothetical future games;
- add abstractions for hypothetical future content that does not exist;
- create one-line helper functions that only rename another one-line helper;
- aggressively deduplicate code when duplication is easier to understand;
- redesign gameplay;
- redesign visual presentation;
- change balance unless required to preserve an existing contract;
- mix feature work into structural cleanup unless required by a regression.

This is a **clarity refactor**, not an architecture vanity project.

---

# 3. Core rule: one gameplay fact, one authoritative path

Every important gameplay fact must have one clear owner and one clear mutation path.

Examples:

- player hull;
- enemy hull;
- player Evade;
- enemy Evade;
- shield state;
- power core charges;
- weapon cooldown;
- projectile state;
- sticky mine state;
- SPAM channel;
- officer task;
- officer availability;
- travel/navigation state.

For each fact we should be able to answer:

```text
OWNER:
Who owns the mutable truth?

START / MUTATE:
Which method changes it?

ADVANCE:
Which runner/store advances it over time?

READ:
Which snapshot/query exposes it?

PRESENT:
Which app/view consumes it?
```

If there are two valid answers to `START / MUTATE`, investigate.

If presentation can mutate it, fix it.

If a controller keeps a second copy of it, investigate.

If a snapshot becomes another source of truth, fix it.

---

# 4. Required transport clarity

Transport must be boring and traceable.

For any gameplay action we should be able to trace a short chain such as:

```text
player input
-> bridge controller
-> encounter command
-> task / runner
-> authoritative store mutation
-> event or snapshot
-> bridge presentation
-> view
```

Or for continuously changing state:

```text
engine state
-> snapshot query
-> bridge snapshot synchronizer
-> bridge event payload
-> view
```

Avoid chains like:

```text
controller
-> coordinator
-> resolver
-> service
-> manager
-> context
-> helper
-> store
```

unless every layer has a real, independently useful responsibility.

## 4.1 Event vs snapshot rule

Use **events** for one-time facts:

- something fired;
- something hit;
- something ended;
- something exploded;
- a task completed;
- a bark was requested.

Use **snapshots/read models** for current state:

- current Evade phase;
- current missile timers;
- current hull;
- current shields;
- current weapon state;
- current officer availability.

Avoid representing the same gameplay fact through both systems unless there is a clear reason.

Do not create an event merely because a view can detect the same authoritative phase transition from a snapshot.

Do not use snapshots as a hidden event queue.

---

# 5. Refactor principle: delete before redesign

Before introducing a new abstraction, search for code that can simply disappear.

Look for:

- dead methods;
- dead classes;
- dead events;
- dead payload types;
- dead imports;
- dead view helpers;
- obsolete compatibility paths;
- temporary playtest hooks;
- old debug behavior;
- old migration code;
- duplicated state mutation;
- outdated tests that protect temporary behavior;
- comments describing systems that no longer exist;
- code kept because "maybe useful later";
- stale TODO branches;
- old content IDs;
- obsolete command IDs;
- old UI paths;
- old transport paths.

Search terms worth auditing:

```text
TODO
FIXME
TEMP
temporary
playtest
hack
legacy
compat
deprecated
opening
debug
workaround
remove later
for now
eventually
old
fallback
```

Not every occurrence is wrong, but every occurrence deserves inspection.

---

# 6. Refactor by behavior, not by file aesthetics

A file can look clean while the system is dirty.

The enemy Evade bug is the canonical example:

- debug behavior looked correct;
- Evade state implementation looked correct;
- view looked correct;
- a forgotten combat-start path silently started the same behavior elsewhere.

Therefore audit complete behavior paths, not only individual files.

For every major feature, inspect:

1. every caller;
2. every authoritative mutation;
3. every lifecycle entry point;
4. every frame/tick advancement;
5. every snapshot/query;
6. every presentation consumer;
7. tests that define the behavior.

---

# 7. Target architecture qualities

## 7.1 EncounterEngine should be boring

`EncounterEngine` should primarily:

- construct the encounter subsystems;
- expose a small public API;
- orchestrate the main tick;
- expose snapshots/events;
- delegate mutations to clear owners.

The engine should not become a giant god object.

But it also should not become a meaningless proxy layer for dozens of tiny abstractions.

A good `step()` should read like a visible execution order:

```ts
this.powerCoreRunner.step(deltaMs);
this.shieldRunner.step(deltaMs);
this.officerTaskRunner.step(deltaMs);
this.actorEvadeRunner.step(deltaMs);
this.playerWeaponRunner.step(deltaMs);
this.combatRunner.step(deltaMs);
```

A developer should understand the major frame order by opening one method.

## 7.2 Stores own mutation

Stores should mutate authoritative state.

A store method should generally:

- validate;
- mutate;
- return a simple result.

Avoid stores that:

- emit presentation events;
- know about Phaser;
- know about bridge UI;
- format text;
- perform unrelated orchestration.

## 7.3 Runners advance systems

A runner is justified when it owns meaningful time/lifecycle behavior.

Good examples:

- projectile advancement;
- weapon phase advancement;
- Evade advancement;
- officer task advancement;
- enemy behavior decisions.

A runner is suspicious if it only forwards one call to a store.

## 7.4 Controllers orchestrate

Controllers can decide **when** systems interact.

Controllers should avoid becoming second state stores.

They should not rebuild authoritative facts from multiple places when the engine can expose one read model.

## 7.5 Views only present

Views may own:

- Phaser objects;
- visual interpolation;
- animation state;
- particle state;
- temporary presentation offsets;
- purely visual randomness.

Views must not own gameplay truth.

Views must not decide:

- whether an attack hits;
- whether Evade succeeds;
- whether a shield absorbs;
- whether a weapon is ready;
- whether an officer is available;
- whether a mine can be cleared.

---

# 8. Kill unnecessary types

The codebase should not contain type aliases merely because creating a type feels clean.

## 8.1 Remove meaningless primitive aliases

Examples to remove unless they provide real protection:

```ts
type ActorId = string;
type EnemyActorId = string;
type ProjectileId = string;
type OfficerTaskId = string;
type WeaponId = string;
type AnchorId = string;
type NodeId = string;
```

If all of them are structurally just `string`, and TypeScript allows them to be mixed freely, the alias does not provide type safety.

It only adds navigation overhead.

Prefer:

```ts
actorId: string;
weaponId: string;
taskId: string;
```

## 8.2 Keep types that encode real structure

Keep:

- discriminated unions;
- state shapes;
- meaningful payloads;
- meaningful input objects;
- result objects;
- content definitions;
- types that narrow behavior;
- types that prevent real invalid states.

Example:

```ts
type CombatTarget =
    | {
          kind: 'player_ship';
      }
    | {
          kind: 'actor';
          actorId: string;
      };
```

This is useful.

## 8.3 Avoid alias chains

Bad:

```ts
type ActorId = string;
type EnemyActorId = ActorId;
type CombatTargetActorId = EnemyActorId;
```

If reading a property requires jumping through several aliases, simplify it.

## 8.4 Avoid wrappers around wrappers

Inspect patterns like:

```ts
type FooState = {
    state: BarState;
};
```

or:

```ts
type FooResult = {
    result: BarResult;
};
```

If the wrapper adds no meaning, remove it.

---

# 9. Kill unnecessary abstractions

Every abstraction must pay rent.

Ask:

> What concrete complexity does this abstraction remove?

If the answer is vague, inspect it aggressively.

Suspicious names:

```text
Manager
Service
Coordinator
Processor
Resolver
Provider
Factory
Context
Adapter
Facade
Registry
Dispatcher
Handler
Strategy
Builder
```

These names are not forbidden.

They are audit signals.

## 9.1 Pass-through layers

Bad:

```ts
fooManager.startFoo()
    -> fooService.startFoo()
        -> fooCoordinator.startFoo()
            -> fooStore.startFoo()
```

Prefer the shortest path that preserves real boundaries.

## 9.2 One-method classes

A one-method class may be valid.

But ask whether a plain function would be clearer.

Do not keep classes solely for symmetry.

## 9.3 Generic contexts

Audit broad objects like:

```ts
context: {
    stateStore,
    emit,
    random,
    startTask,
    destroyActor,
    queueProjectile,
    ...
}
```

If a function uses two fields, consider passing two fields.

Large context bags hide dependencies.

## 9.4 Generic frameworks around simple mechanics

If a mechanic can be expressed by:

```ts
validate();
start();
advance();
finish();
```

do not build a generic workflow engine unless multiple real mechanics need exactly the same semantics.

---

# 10. Prefer explicit branching

Explicit `if` / `switch` code is usually preferred over clever dispatch.

Good:

```ts
switch (weapon.kind) {
    case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
        return ...

    case SHIP_WEAPON_KIND.BEAM_CANNON:
        return ...

    case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
        return ...
}
```

Potentially bad:

```ts
const handler =
    weaponHandlers[
        weapon.kind
    ];

return handler.execute(...);
```

The second form is only better if registration/dynamic extension is actually useful.

Do not optimize for hypothetical plug-in architecture.

---

# 11. Prefer early returns

Avoid deep nesting.

Bad:

```ts
if (actor) {
    if (actor.drive.status === ONLINE) {
        if (actor.evade.phase === READY) {
            ...
        }
    }
}
```

Prefer:

```ts
if (!actor) {
    return false;
}

if (actor.drive.status !== SHIP_DRIVE_STATUS.ONLINE) {
    return false;
}

if (actor.evade.phase !== SHIP_EVADE_PHASE.READY) {
    return false;
}

startShipEvade(...);

return true;
```

---

# 12. Split dense expressions

If a line or expression becomes easier to understand when split into two or three named statements, split it.

This is an explicit project rule.

Bad:

```ts
const remaining = Math.max(0, definition.durationMs - Math.min(state.elapsedMs, definition.durationMs));
```

Prefer:

```ts
const elapsedMs =
    Math.min(
        state.elapsedMs,
        definition.durationMs,
    );

const remainingMs =
    Math.max(
        0,
        definition.durationMs - elapsedMs,
    );
```

However, see the formatting section below: do not mechanically explode every function call into six vertical lines.

The objective is readability, not maximum line count.

---

# 13. Formatting rule: VS Code print width = 120

The working target is:

```text
printWidth: 120
```

Code should be written with this width in mind.

This is important.

The previous style often over-wrapped code and inserted too many blank lines, which increased vertical distance and made local logic harder to scan.

## 13.1 Do not wrap merely because an expression contains dots

Bad:

```ts
const powerCore =
    snapshot
        .player
        .powerCore;
```

Prefer:

```ts
const powerCore = snapshot.player.powerCore;
```

if it fits comfortably within 120 columns.

Bad:

```ts
this.eventBus.emit(
    BRIDGE_EVENT
        .PLAYER_SHIELD_UPDATED,

    payload,
);
```

Prefer:

```ts
this.eventBus.emit(
    BRIDGE_EVENT.PLAYER_SHIELD_UPDATED,
    payload,
);
```

## 13.2 Do not vertically explode enum access

Bad:

```ts
SHIP_EVADE_PHASE
    .EVADING
```

Prefer:

```ts
SHIP_EVADE_PHASE.EVADING
```

Bad:

```ts
OFFICER_ROLE
    .SCIENCE
```

Prefer:

```ts
OFFICER_ROLE.SCIENCE
```

## 13.3 Use line breaks to expose structure, not to obey an imaginary 70-column limit

Good:

```ts
const enemy = snapshot.enemyShips.find(
    (candidate) => candidate.actorId === actorId,
);
```

Good:

```ts
this.eventBus.emit(
    BRIDGE_EVENT.ENEMY_EVADES_UPDATED,
    enemyEvades,
);
```

Good:

```ts
const isAvailable =
    drive.status === SHIP_DRIVE_STATUS.ONLINE &&
    evade.phase === SHIP_EVADE_PHASE.READY;
```

## 13.4 Avoid excessive blank lines

Do not insert blank lines between every property in an object.

Bad:

```ts
return {
    actorId:
        actor.id,

    hull:
        actor.hull,

    phase:
        actor.evade.phase,
};
```

Prefer:

```ts
return {
    actorId: actor.id,
    hull: actor.hull,
    phase: actor.evade.phase,
};
```

Use blank lines to separate conceptual groups, not every field.

## 13.5 Multiline objects should remain compact

Prefer:

```ts
return {
    actorId: actor.id,
    hull: {
        current: actor.hull,
        max: actor.maxHull,
    },
    evade: {
        ...actor.evade,
    },
};
```

## 13.6 Function signatures

Keep short signatures on one line.

Prefer:

```ts
public findActorById(actorId: string | undefined): EncounterActorState | undefined {
```

over:

```ts
public findActorById(
    actorId:
        string | undefined,
):
    EncounterActorState | undefined {
```

Split only when the signature genuinely becomes hard to read or exceeds the practical width.

## 13.7 Short calls stay short

Prefer:

```ts
this.stateStore.findActorById(actorId);
```

over:

```ts
this.stateStore
    .findActorById(
        actorId,
    );
```

## 13.8 Long boolean expressions

Split by logical meaning:

```ts
const isValidTarget =
    actor.team === ENCOUNTER_TEAM.ENEMY &&
    actor.hull > 0 &&
    actor.anchorId === currentAnchorId;
```

If each condition deserves different failure behavior, use early returns instead.

---

# 14. Blank-line discipline

Blank lines are structural syntax.

Use them between:

- validation phase;
- mutation phase;
- result construction;
- clearly separate conceptual blocks.

Do not use them between every statement.

A method should visually form a few chunks, not dozens of islands.

---

# 15. Magic strings audit

Search aggressively for string literals that encode project vocabulary.

Examples:

```ts
'atlas'
'vfx'
'pixel_operator'
'ship_enemy_00'
'starter_drive_00'
'SCI'
'WPN'
'HELM'
'ENG'
```

Not every string needs a constant.

Create constants when the string:

- is repeated;
- is a shared contract;
- represents an asset key;
- represents a layer key;
- represents a content identifier;
- is likely to change;
- has semantic meaning beyond the local method.

Do not create:

```ts
const EMPTY_STRING = '';
```

## 15.1 Hardcoded content IDs in gameplay logic

This is high priority.

Bad:

```ts
if (weapon.weaponId === 'starter_missile_launcher_00') {
```

Prefer checking:

- weapon kind;
- capability;
- content definition property;
- runtime state.

Gameplay logic should generally not care which starter preset created the equipment.

---

# 16. Magic numbers audit

Especially inspect views and presentation code.

Look for:

- x/y positions;
- widths/heights;
- alpha;
- tint;
- depth;
- padding;
- animation duration;
- particle speed;
- particle lifetime;
- visual offsets;
- text size;
- icon size;
- interpolation factors;
- cooldown display thresholds;
- layout gaps.

Move meaningful/tunable presentation values into local presentation config files.

Example:

```text
BridgeEnemyEvadeView.ts
bridge_enemy_evade_presentation.ts
```

The view should describe behavior.

The config should hold presentation constants.

Do not move obvious local arithmetic constants into global files.

---

# 17. View hygiene audit

Views are likely to contain a large amount of accumulated local mess.

For each view inspect:

- asset keys;
- atlas frame names;
- font keys;
- layer names;
- repeated labels;
- colors;
- positions;
- sizes;
- offsets;
- alpha;
- depth;
- tweens;
- particle constants;
- repeated Phaser object creation;
- repeated cleanup logic;
- duplicate coordinate formulas;
- direct knowledge of gameplay mechanics;
- direct knowledge of content IDs.

A good view should mostly say:

```text
create objects
subscribe
map presentation state to visuals
update visual-only animation
destroy
```

---

# 18. Asset and frame key policy

Shared asset keys should live in an obvious location.

Avoid dozens of arbitrary raw literals distributed across views.

However, avoid giant universal registries that require searching one huge file.

Prefer domain-local constants when only one feature owns an asset.

---

# 19. Layer name policy

If layer names are a shared bridge contract, avoid raw repeated strings:

```ts
scene.layers.get('vfx');
scene.layers.get('bridge');
scene.layers.get('ui');
```

Prefer an existing central layer vocabulary if available.

If none exists and repetition is meaningful, introduce a small one.

Do not build a generic layer-management abstraction during this sprint.

---

# 20. Color policy

Repeated semantic colors should have names.

Examples:

```text
available
busy
blocked
warning
critical
task progress
shield
evade thruster
```

Purely local art colors may remain local presentation constants.

Do not scatter the same hex value through multiple classes.

---

# 21. State duplication audit

Search for duplicated facts in:

- controller fields;
- view state;
- engine state;
- runtime state;
- snapshot cache;
- event payload cache;
- local flags.

Examples of suspicious fields:

```text
isBusy
isCombatActive
isEvading
hasShield
currentTarget
activeWeapon
currentAnchor
```

If the engine already knows the answer, ask why another layer stores it.

Presentation state is allowed when it is genuinely visual:

```text
particle accumulator
chosen visual direction
sprite interpolation offset
animation progress
```

---

# 22. Boolean audit

Booleans often hide state machines.

Look for combinations like:

```ts
isStarted
isActive
isCoolingDown
isFinished
```

If multiple booleans represent one lifecycle, consider one explicit phase union.

Do not replace a simple boolean with an enum merely for style.

Use a phase when invalid boolean combinations are possible.

---

# 23. Nullable-state audit

Look for objects where meaning depends on several optional fields:

```ts
{
    targetId?: string;
    elapsedMs?: number;
    result?: FooResult;
}
```

If several combinations are invalid, prefer a discriminated union.

But do not create unions where a simple optional value is genuinely enough.

---

# 24. Function responsibility audit

A method should have an explainable job.

Suspicious methods:

- mutate state and emit UI;
- validate unrelated systems;
- start one mechanic and stop another;
- return a snapshot while also mutating timers;
- query and cache hidden state;
- destroy objects as a side effect of reading;
- silently repair invalid state.

If a method name undersells its side effects, either rename it or split it.

---

# 25. Method naming audit

Names should expose behavior.

Bad or suspicious:

```text
process
handle
update
sync
resolve
apply
run
doThing
```

These may still be valid, but inspect them.

Prefer specific names:

```text
advanceActorEvades
startPlayerSpamChanneling
consumeActiveShield
completeTravel
removeDestroyedActor
```

---

# 26. Hidden side-effect audit

Search lifecycle methods:

```text
start
engage
load
spawn
sync
refresh
initialize
complete
```

Check that they do not secretly:

- start weapons;
- start Evade;
- spend resources;
- disable systems;
- create debug behavior;
- emit unrelated events.

Lifecycle boundaries should be predictable.

---

# 27. Debug boundary audit

Debug behavior must not leak into authoritative engine rules.

Preferred:

```text
app/debug
-> invokes normal public engine action
-> engine performs normal authoritative mutation
```

Avoid:

```text
engine checks debug flag
enemy AI checks debug flag
store checks debug flag
content definition checks debug flag
```

Debug flags should be removable without changing production gameplay code.

---

# 28. Test seam audit

Tests should not require ugly production APIs only for access.

But do not expose mutable state publicly just to simplify tests.

Prefer narrow test helpers.

Review any production method that exists only because tests need it.

---

# 29. Test quality audit

Tests can preserve bad architecture.

Look for tests that intentionally lock in:

- temporary playtest hooks;
- legacy behavior;
- compatibility behavior;
- implementation details no longer part of the contract.

Tests should protect current gameplay contracts, not archaeology.

---

# 30. Test naming

Test names should describe the contract.

Good:

```text
does not start enemy Evade when combat-start debug behavior is disabled
```

Bad:

```text
test evade thing
```

---

# 31. Architecture regression tests

Add a small number of tests for dangerous system boundaries.

Candidates:

- combat engagement alone does not start enemy Evade;
- debug OFF does not mutate enemy Evade;
- debug ON uses normal shared Evade lifecycle;
- SPAM is not evadable;
- snapshot objects are detached from engine truth;
- invalid commands do not start tasks;
- one task cannot accidentally be started through two paths;
- shield remains intact when an Evade miss resolves before shield absorption;
- views do not decide authoritative hit/miss outcomes.

Do not attempt to encode the entire architecture into meta-tests.

---

# 32. Command pipeline audit

Target model:

```text
command request
-> validation
-> task/action start
-> authoritative state mutation
-> result/event
```

Inspect:

- duplicated validation;
- validation in presentation;
- validation after mutation;
- commands that mutate multiple unrelated systems;
- task starts outside command/executor paths;
- task cancellation paths;
- hidden resource spending;
- inconsistent task completion.

---

# 33. Officer task audit

Check:

- one owner for task state;
- one start path;
- one completion path;
- one cancellation path;
- duration semantics;
- interruption semantics;
- source command relation;
- task result ownership;
- no bridge-side task truth.

Remove wrappers that only forward to `OfficerTaskStore`.

---

# 34. Enemy behavior audit

Enemy behavior is likely to become much larger.

Before adding more AI:

- make intent vocabulary obvious;
- make selection separate from execution;
- ensure intent execution uses normal authoritative mechanics;
- avoid AI-only versions of player mechanics;
- avoid hidden "opening behavior" hooks;
- avoid fallback behavior scattered across runners;
- keep defensive decisions readable;
- make priority ordering visible in one place if possible.

We should be able to read enemy decision priority without opening ten files.

---

# 35. Player/enemy shared mechanics audit

When mechanics are genuinely shared, use one primitive.

Examples:

- Evade phase machine;
- projectile resolution rules;
- hull damage shape where appropriate.

Do not force sharing where player and enemy rules are actually different.

"Shared" should reduce duplicate truth, not create a generic monster abstraction.

---

# 36. Combat resolution order audit

The execution order should be documented by code structure.

Inspect:

- Evade advancement;
- projectile impact;
- beam impact;
- shield resolution;
- mine attachment;
- SPAM;
- hull damage;
- destruction cleanup.

Avoid mechanics depending on accidental file ordering.

The main frame/tick orchestration should make important ordering visible.

---

# 37. IDs and identity audit

Use plain `string` where nominal typing gives no protection.

At the same time, inspect whether IDs are being reconstructed, parsed, or guessed unnecessarily.

Avoid using display labels as identity.

Avoid magic prefix parsing unless it is a deliberate contract.

---

# 38. Content-definition audit

Runtime logic should consume content definitions consistently.

Look for:

- starter values duplicated in code;
- cooldowns duplicated in views;
- durations duplicated in tests;
- asset mappings duplicated across screens;
- fallback stats hardcoded in runtime logic.

One gameplay value should have one content source.

---

# 39. Default-value audit

Defaults can hide bugs.

Inspect patterns like:

```ts
value ?? 0
value ?? []
value ?? false
definition ?? fallbackDefinition
```

Ask whether absence is truly valid.

If missing state is a bug, throw early instead of silently inventing a default.

---

# 40. Error handling audit

Errors should identify broken contracts clearly.

Prefer:

```ts
throw new Error(`Encounter actor not found: ${actorId}`);
```

over:

```ts
throw new Error('invalid state');
```

Avoid swallowing errors to keep the game running during development when the state should be impossible.

---

# 41. Exhaustiveness audit

Keep exhaustive `switch` behavior where it protects real unions.

Do not weaken:

```ts
default:
    return assertNever(value);
```

just to silence a new case.

Add the new explicit case.

The SPAM bridge bug is the canonical example.

---

# 42. Array scan audit

Repeated:

```ts
state.actors.find(...)
state.actors.filter(...)
```

is fine at current project scale if it is clearer.

Do not introduce maps/index caches solely for theoretical performance.

Only optimize if profiling or actual scale requires it.

---

# 43. Performance non-goal

Do not trade clarity for micro-performance without evidence.

Space Captain currently benefits more from understandable code than from eliminating tiny allocations.

Keep obvious hot loops sensible, but do not turn readable code into mutation-heavy micro-optimized code without a measured reason.

---

# 44. Mutation audit

Prefer mutation where the state store clearly owns mutable runtime state.

Do not clone everything reflexively.

Clone when crossing a read boundary:

- snapshot;
- presentation;
- public detached output.

Mutation inside the authoritative store is acceptable and often clearer.

---

# 45. Snapshot audit

Snapshots must be:

- detached;
- read-only by convention/API;
- free from hidden mutation;
- free from gameplay side effects.

Snapshot construction should not advance timers or consume resources.

---

# 46. Mapper audit

Mappers are justified when they convert between meaningful contracts.

A mapper that simply renames one property may be unnecessary.

Inspect chains like:

```text
engine snapshot
-> mapper A
-> bridge payload
-> mapper B
-> view state
```

Collapse when intermediate shapes add no value.

---

# 47. Payload audit

Avoid nearly identical payload types repeated in several layers.

If two layers intentionally have different contracts, keep them separate.

If they are structurally identical only because of historical evolution, simplify.

---

# 48. Event naming audit

Event names should reflect facts, not implementation.

Good:

```text
MISSILE_LAUNCHED
OFFICER_TASK_ENDED
PLAYER_SPAM_CHANNEL_STARTED
```

Suspicious:

```text
REFRESH_UI
UPDATE_THING
SYNC_STATE
PROCESS_COMBAT
```

---

# 49. Event lifecycle audit

Check:

- who emits;
- who drains;
- who consumes;
- whether one event can remain unhandled;
- whether events are emitted before authoritative state mutation;
- whether tests drain/discard events and accidentally hide integration bugs.

The SPAM regression exposed why engine-only tests are not enough for engine-to-app boundaries.

---

# 50. BridgeEventBus audit

Check for:

- unused bridge events;
- duplicate events representing snapshots;
- inconsistent payload shapes;
- events emitted but never consumed;
- consumers with no producers;
- hidden ordering assumptions.

---

# 51. Controller field audit

Every controller boolean/field should justify itself.

Examples to inspect:

```text
hasApplied...
isInitialized
isCombat...
last...
current...
pending...
```

Ask whether the field is:

- lifecycle bookkeeping;
- cached authoritative state;
- duplicated engine state;
- workaround for event ordering.

Remove or rename accordingly.

---

# 52. View internal state audit

Allowed:

- local tween state;
- particle arrays;
- interpolation;
- visual direction;
- accumulated presentation offset.

Suspicious:

- gameplay cooldown;
- authoritative active/inactive;
- hit chance;
- available commands;
- damage state not derived from snapshot/event.

---

# 53. Phaser-specific cleanup

Inspect:

- repeated `scene.add.*` boilerplate;
- repeated layer attachment;
- repeated destroy/unsubscribe code;
- listeners not removed;
- scene update listeners;
- object references surviving destroy;
- duplicated bounds math.

Extract only where it makes individual views substantially simpler.

Do not create a generic Phaser widget framework during this sprint.

---

# 54. Listener lifecycle audit

Every `.on(...)` should have a clear matching `.off(...)` when appropriate.

Every scene update subscription should be cleaned up.

Look for duplicate subscriptions after scene restart.

---

# 55. Cleanup/destroy audit

Destroy methods should be boring.

They should:

- unsubscribe;
- destroy Phaser objects;
- clear local presentation containers/maps.

Avoid gameplay mutation during destroy unless explicitly required.

---

# 56. Naming consistency

Choose one vocabulary.

Examples:

```text
actor
enemy ship
ship actor
hostile actor
```

Use different names only when they mean different things.

Likewise:

```text
start
begin
activate
engage
commit
```

Avoid synonyms for the same lifecycle action.

---

# 57. File naming consistency

Related code should be easy to locate.

Avoid three different naming styles for the same concept.

Example:

```text
BridgeEnemyEvadeView.ts
bridge_enemy_evade_presentation.ts
```

is acceptable when PascalCase = class and snake_case = data/config.

Keep that pattern consistent.

---

# 58. Directory audit

Directories should reflect ownership, not historical sequence.

Look for:

- one-file directories;
- abandoned directories;
- helpers stored far away from their only consumer;
- generic `utils` dumping grounds;
- feature pieces scattered across unrelated roots.

Do not reorganize the entire tree for aesthetics.

Move files only when it clearly improves discoverability.

---

# 59. Utils audit

`utils`, `helpers`, `common`, `shared` are danger zones.

Every generic helper should have multiple real callers or a clear domain purpose.

If a helper has one caller and hides simple logic, inline it.

---

# 60. Factory audit

Factories are useful when object creation is genuinely complex or standardized.

Inspect factories that:

- wrap a constructor;
- fill only one default;
- hide which content is being created;
- produce types with many post-creation mutations.

If creation is clearer inline, simplify.

---

# 61. Resolver audit

A resolver should ideally be pure:

```text
input state
-> answer
```

If a resolver:

- mutates state;
- emits events;
- starts tasks;
- destroys actors;

rename/split it.

---

# 62. Query audit

Queries should read.

They should not:

- mutate;
- cache hidden state;
- consume resources;
- advance clocks.

Names like `get`, `find`, `select`, `query` should be safe reads.

---

# 63. Boolean-return audit

Methods returning `boolean` should have obvious semantics.

Bad:

```ts
if (doThing()) {
```

when `true` could mean "started", "completed", "found", or "changed".

Prefer names like:

```text
tryStartActorEvade
removeActorIfDestroyed
consumeOpeningDisruptionPulse
```

---

# 64. Result-object audit

Do not create a result interface for every function.

Use a result object when multiple outputs matter.

Bad:

```ts
type StartResult = {
    started: boolean;
};
```

Prefer:

```ts
boolean
```

unless additional information is needed.

---

# 65. Optional parameter audit

Many optional parameters can indicate an unclear API.

Inspect methods with several `?` arguments.

Prefer explicit input objects when there are multiple meaningful optional values.

But do not wrap one or two simple arguments in a type merely for style.

---

# 66. Constructor audit

Constructors with huge dependency lists indicate either:

- too much responsibility;
- a useful context boundary;
- accidental architecture growth.

Inspect, do not automatically split.

Avoid dependency bags that hide the same problem.

---

# 67. Import audit

Imports can reveal coupling.

Red flags:

- engine importing app;
- engine importing Phaser;
- view importing mutable store;
- gameplay logic importing debug config;
- low-level store importing controller.

Dependency direction should remain obvious.

---

# 68. Circular responsibility audit

Even without literal circular imports, look for conceptual loops:

```text
controller tells engine
engine emits event
controller converts event
view emits another event
controller tells engine again
```

Sometimes valid, often a sign that command/input and presentation channels are mixed.

---

# 69. Initialization audit

Initialization code often accumulates leftovers.

Inspect:

- encounter constructor;
- scene create;
- controller init;
- initial snapshot sync;
- initial event drain;
- combat start;
- arrival completion.

Look for duplicate initialization and ordering hacks.

---

# 70. Lifecycle audit

Explicitly list major lifecycle transitions:

```text
scene start
encounter loaded
arrival
anchored
hostility begins
combat active
enemy destroyed
travel
jump
encounter destroy
```

Each transition should have one recognizable orchestration path.

---

# 71. Persistence audit

Persistence must not become a second runtime truth.

Check:

- when snapshot is persisted;
- whether persisted data is read back mid-encounter;
- whether app runtime and encounter engine can disagree;
- whether persistence synchronizers mutate gameplay.

---

# 72. Randomness audit

Randomness should enter through clear seams.

Avoid direct `Math.random()` in authoritative gameplay if seeded/testable randomness is intended.

Visual-only randomness in views is fine.

Keep gameplay RNG and presentation RNG conceptually separate.

---

# 73. Time source audit

Know which systems use:

- raw encounter/world delta;
- task-adjusted delta;
- animation time;
- Phaser scene time.

Do not let presentation clocks affect gameplay.

Avoid re-deriving authoritative timers in views.

---

# 74. Cooldown audit

Cooldown semantics should be centralized per mechanic.

Avoid:

- cooldown decremented in two runners;
- UI recomputing cooldown from timestamps differently;
- task duration treated as cooldown;
- cancellation refund rules duplicated.

---

# 75. Validation audit

Validation should occur before mutation.

Pattern:

```text
validate all required conditions
-> commit costs
-> start state
-> emit result/event
```

Avoid partial mutation followed by a validation failure.

---

# 76. Resource-spend audit

Power, ammo, charges, cooldown commitment should have explicit moments.

Search for:

```text
spend
consume
charge
ammo
cooldown
```

Make sure one action cannot pay twice or avoid payment through cancellation.

---

# 77. Cancellation audit

Every cancellable mechanic should answer:

- can player cancel?
- can damage interrupt?
- are costs refunded?
- does cooldown remain?
- what event/result is emitted?
- who clears task/state?

Keep cancellation rules close to the mechanic.

---

# 78. Destruction audit

Actor destruction often creates spaghetti.

Trace:

```text
damage
-> hull zero
-> destruction decision
-> state removal
-> projectile cleanup
-> target cleanup
-> presentation event
```

Avoid multiple subsystems each independently deciding that the actor died.

---

# 79. Missing-target cleanup audit

Check task/projectile/mine/beam cleanup when actors disappear.

Prefer one obvious cleanup responsibility.

Avoid scattered defensive `if (!target) return` that leaves stale state alive forever.

---

# 80. Comments audit

Comments should explain **why**, contracts, or non-obvious ordering.

Delete comments that simply narrate syntax.

Bad:

```ts
// Increment elapsed time.
elapsedMs += deltaMs;
```

Useful:

```ts
// Evade advances before physical impact resolution so impact-time queries
// observe the authoritative phase for this frame.
```

Delete obsolete historical comments.

Do not keep comments describing removed temporary behavior.

---

# 81. Russian/English comment consistency

Keep existing project convention where practical.

Do not spend the sprint translating comments for aesthetics.

Rewrite a comment if its meaning is unclear or stale.

---

# 82. Long file audit

A long file is not automatically bad.

Split when:

- multiple unrelated responsibilities exist;
- a clear subsystem can be named;
- local navigation becomes painful.

Do not split purely because a file passes an arbitrary line count.

One obvious 600-line file can be better than eight 80-line files with indirection.

---

# 83. Tiny file audit

Tiny files can be worse than large files when they force navigation.

Inspect files that contain:

- one trivial constant;
- one trivial alias;
- one trivial wrapper;
- one one-line function.

Merge into the nearest meaningful owner when that improves discoverability.

---

# 84. DRY audit

Do not worship DRY.

Safe duplication is acceptable if:

- the two behaviors may diverge;
- abstraction would hide the rules;
- the duplicated code is short;
- callers become much easier to read.

Abstract only after a real shared concept is obvious.

---

# 85. "Future-proofing" audit

Delete scaffolding for futures that are not actively planned.

Examples:

- generic multi-enemy systems if combat contract remains one enemy;
- generic plugin architecture;
- generic equipment categories not used;
- unused state fields reserved for later.

Keep documented backlog ideas in docs, not half-built runtime abstractions.

---

# 86. Content editor boundary audit

The content editor should edit data.

It should not create runtime behavior exceptions.

Check that editor schemas remain data/debug boundaries and do not leak UI/editor concepts into engine logic.

---

# 87. Public API audit

Every public method should have at least one real external caller or represent an intentional stable boundary.

If only the same class/subsystem uses it, reduce visibility where helpful.

Do not obsessively mark everything private if it makes tests or composition awkward.

---

# 88. Getter audit

Avoid getters that hide expensive or mutating behavior.

A getter should feel like a read.

Avoid getters that rebuild large state repeatedly unless deliberate and cheap enough.

---

# 89. Recomputed context audit

Look for code that repeatedly reconstructs the same context from distant state.

If many consumers need the same read model, consider one query/snapshot.

But avoid caching it as mutable second truth.

---

# 90. Deep property chain audit

Chains like:

```ts
foo.bar.baz.qux.value
```

may be fine once.

If used repeatedly, bind a local:

```ts
const evade = enemy.evade;
```

This can improve readability without adding abstraction.

---

# 91. Destructuring audit

Destructuring is useful when it clarifies.

Avoid destructuring fifteen properties just to look concise.

Prefer direct access when it keeps ownership visible.

---

# 92. Optional chaining audit

Optional chaining can hide unexpected absence.

Bad:

```ts
actor?.drive?.status
```

when actor and drive are required by contract.

In required state, validate and throw/return explicitly.

Use `?.` for genuinely optional relationships.

---

# 93. Non-null assertion audit

Search:

```ts
!
```

on values.

Remove unjustified non-null assertions.

Prefer explicit validation.

Do not add huge type machinery just to eliminate every assertion if the invariant is obvious and local.

---

# 94. Cast audit

Search:

```ts
as unknown as
as SomeType
```

Every cast deserves inspection.

Some test mocks are fine.

Production casts often indicate a contract mismatch.

---

# 95. Enum/object vocabulary audit

Current `as const` vocabularies are often fine.

Do not convert them to TS `enum` merely for style.

Keep whichever representation is already clear and consistent.

---

# 96. Re-export audit

Barrel files can hide where code lives.

Avoid introducing new large barrels.

Inspect existing re-export chains if they make ownership harder to find.

Direct imports are often easier during a project of this size.

---

# 97. Duplicate vocabulary audit

Search for multiple definitions of:

- status values;
- phase values;
- role labels;
- weapon kinds;
- team names;
- command IDs.

One concept should have one vocabulary source.

---

# 98. Presentation config locality

Presentation constants should live near the feature that consumes them.

Avoid one giant `ui_constants.ts`.

Prefer:

```text
enemy_evade/
    BridgeEnemyEvadeView.ts
    bridge_enemy_evade_presentation.ts
```

Likewise for other substantial views.

---

# 99. Layout config audit

If a bridge layout is conceptually fixed, centralize related coordinates enough that the composition can be tuned without hunting through multiple methods.

Do not turn every coordinate into a global semantic token.

---

# 100. Repeated UI construction audit

If four officer stations repeat substantial UI creation, consider one local helper/component.

But avoid abstract widget hierarchies.

A helper is successful if opening the caller becomes easier, not merely shorter.

---

# 101. Label/text audit

Move repeated gameplay/UI labels out of random methods when:

- shared;
- localized later;
- used as command vocabulary;
- repeated in multiple screens.

One-off debug labels can stay local.

---

# 102. Console/debug log audit

Production code should not accumulate random `console.log`.

After diagnosis:

- remove temporary logs;
- keep only intentional debug infrastructure.

Search the whole repo for console usage during the sprint.

---

# 103. Commented-out code

Delete commented-out code.

Git already stores history.

Only keep commented examples when they are actual documentation.

---

# 104. Unused configuration audit

Remove constants/config fields that no longer affect runtime.

A tunable value that has no consumer is misleading.

---

# 105. Configuration ownership audit

Gameplay config belongs with engine/content.

Presentation config belongs with app/view.

Debug config belongs with app/debug.

Do not mix these domains.

---

# 106. File-level readability target

When opening any important file, a developer should quickly answer:

- what does this file own?
- what does it read?
- what can it mutate?
- who calls it?
- what does it emit/return?

If those answers require opening five other files, consider simplification.

---

# 107. Feature-level readability target

For each major feature, create or update a short system map entry.

Example:

```text
ENEMY EVADE

Trigger:
- app debug behavior for current playtest
- future enemy policy

Authoritative start:
- EncounterEngine.tryStartActorEvade
- EncounterActorStore.tryStartActorEvade
- startShipEvade

Advance:
- EncounterActorStore.advanceActorEvades

Read:
- enemy telemetry snapshot

Present:
- BridgeEncounterSnapshotSynchronizer
- BridgeEnemyEvadeView
```

The final path should be short enough to fit in one small block.

---

# 108. System map categories to audit

At minimum:

## Encounter lifecycle

- encounter load;
- arrival;
- anchoring;
- hostile engagement;
- travel;
- jump;
- teardown.

## Player systems

- hull;
- drive;
- power core;
- shield;
- defense turret;
- Evade.

## Player weapons

- missile;
- beam cannon;
- sticky mine;
- SPAM.

## Enemy systems

- hull;
- drive;
- shield;
- defense turret;
- Evade;
- weapon state;
- crew tasks;
- behavior;
- science intel.

## Threats

- missile;
- beam;
- sticky mine;
- SPAM.

## Officers

- command availability;
- task start;
- progress;
- cancellation;
- completion;
- blocking.

## Bridge presentation

- engine events;
- snapshots;
- event bus;
- views;
- dashboard;
- combat views.

## Persistence

- runtime state;
- encounter write-back;
- navigation state.

---

# 109. Three-pass sprint structure

## Pass 1 — Archaeology and deletion

Goal:

**Remove historical baggage before changing structure.**

Actions:

- grep/search dirty keywords;
- map major feature paths;
- identify duplicate mutation paths;
- remove dead code;
- remove old temporary hooks;
- remove stale tests;
- remove unused events/types;
- remove old compatibility wrappers;
- remove commented-out code;
- remove stale config;
- identify red/yellow/green refactor targets.

Deliverable:

```text
RED    = dangerous / duplicate / spaghetti / hidden side effect
YELLOW = unnecessary complexity / hard to read
GREEN  = understandable, do not touch
```

## Pass 2 — Engine and gameplay simplification

Focus:

- EncounterEngine;
- EncounterStateStore;
- specialized stores;
- combat runners;
- command handlers;
- officer tasks;
- enemy behavior;
- shared combat mechanics.

Goals:

- one mutation path;
- simple public API;
- obvious tick order;
- less context plumbing;
- fewer meaningless types;
- fewer pass-through layers;
- clearer function names;
- explicit validation.

## Pass 3 — App / bridge / presentation simplification

Focus:

- BridgeEncounterController;
- event handlers;
- snapshot synchronizers;
- bridge event bus;
- dashboard mappers;
- views;
- presentation config.

Goals:

- clear event vs snapshot split;
- remove redundant transport;
- magic strings/numbers cleanup;
- compact 120-column formatting;
- presentation-only state stays presentation-only;
- no duplicated gameplay truth.

---

# 110. Atom policy during refactor

The audit can be massive.

The changes should remain small and testable.

Prefer atoms such as:

```text
01 remove obsolete combat-start hooks
02 simplify EncounterEngine public API
03 collapse duplicate actor mutation path
04 simplify officer command context
05 remove primitive ID aliases
06 clean enemy behavior intent execution
07 simplify bridge snapshot transport
08 clean enemy evade view constants
```

For every atom:

```text
apply
-> typecheck
-> focused tests
-> full tests when appropriate
-> runtime smoke when behavior/presentation changed
-> push
```

Do not accumulate twenty untested structural edits.

---

# 111. Refactor decision test

Before adding a helper/type/class, answer:

1. Does it reduce the number of concepts needed to understand the system?
2. Does it shorten the behavior path?
3. Does it remove duplicated truth?
4. Does it make invalid behavior harder?
5. Will opening the caller become easier to understand?

If most answers are "no", do not add it.

---

# 112. "Too much refactor" test

Stop and reconsider if we start:

- inventing a framework;
- creating abstractions before finding duplication;
- moving dozens of files without behavioral benefit;
- renaming everything at once;
- changing public vocabulary for aesthetics;
- rewriting stable code that is already obvious;
- building a perfect domain model for hypothetical future mechanics.

The desired reaction when reading final code is:

> "Yeah, of course it works like this."

Not:

> "Wow, that's clever."

---

# 113. End-of-sprint cleanup

Before declaring success:

- search again for all dirty keywords;
- search all `[enemy-evade-debug]` / temporary diagnostic logs;
- search `console.log`;
- search old playtest names;
- search unused ID aliases;
- search magic asset keys;
- search hardcoded starter content IDs;
- run typecheck;
- run complete test suite;
- runtime smoke major combat flows;
- update `SYSTEM_MAP.md`;
- update `PROJECT_CONTEXT.md`;
- update `BACKLOG.md`;
- update `WORKING_RULES.md` if new permanent coding rules were established.

---

# 114. Permanent coding rules after this sprint

Unless a future case strongly justifies otherwise:

1. Prefer dumb code.
2. Prefer explicit code.
3. Prefer local readability over theoretical abstraction.
4. Prefer one authoritative mutation path.
5. Prefer early returns.
6. Prefer meaningful intermediate variables for dense logic.
7. Prefer direct `string` IDs over meaningless aliases.
8. Prefer explicit switches over generic dispatch tables when easier to read.
9. Prefer a few duplicated lines over a confusing generic abstraction.
10. Keep gameplay truth in engine state.
11. Keep presentation state in views only when genuinely visual.
12. Keep debug behavior outside engine rules.
13. Keep events for occurrences and snapshots for current state.
14. Delete temporary behavior after the experiment ends.
15. Delete tests that only protect removed temporary behavior.
16. Do not keep dead compatibility paths "just in case".
17. Do not silently invent defaults for impossible missing state.
18. Do not introduce a type unless it carries useful semantics.
19. Do not introduce a class unless it owns a useful responsibility.
20. Do not introduce a file unless finding that concept becomes easier.
21. Write TypeScript for `printWidth = 120`.
22. Do not vertically explode simple property access or enum constants.
23. Use blank lines to separate concepts, not every statement.
24. If a dense line becomes much clearer as 2–3 statements, split it.
25. If a method has surprising side effects, rename or split it.
26. If one behavior can start through two paths, treat it as a bug until proven intentional.
27. When in doubt, optimize for the reader opening the file six months later.

---

# 115. Definition of done

The sprint is done when:

- major gameplay systems have one obvious authoritative owner;
- major gameplay actions have one short traceable path;
- stale playtest/debug hooks are gone;
- duplicate transport paths are reduced;
- primitive ID aliases are substantially reduced;
- pass-through abstractions are substantially reduced;
- hardcoded gameplay content IDs are removed from logic where inappropriate;
- views have cleaner presentation constants;
- magic strings/numbers are reduced where they carry semantic meaning;
- bridge transport is understandable;
- `EncounterEngine` tick and public API are easy to scan;
- enemy decision flow is easy to scan;
- officer task flow is easy to scan;
- snapshots are clearly read-only transport;
- formatting matches the 120-column working style;
- files no longer contain excessive vertical wrapping and blank-line noise;
- tests protect current contracts rather than temporary archaeology;
- `SYSTEM_MAP.md` accurately reflects the final architecture;
- adding the next combat mechanic feels obvious rather than dangerous.

The final standard is not "architecturally impressive".

The final standard is:

> **The code is boring, explicit, predictable, and hard to misunderstand.**
