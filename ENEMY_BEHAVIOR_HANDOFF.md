# Space Captain — Enemy Behavior Handoff

Paused code/design slice.

Read after `SYSTEM_MAP.md`.

Last updated:

```text
2026-08-04
```

Current repository checkpoint:

```text
66c037416f81aa446bbfeb682e16230418aee6b9
```

Bridge V0.1 migration and concrete player/enemy attack-runner refactors are
complete. Enemy defensive behavior is the next gameplay slice.

This file records the exact implementation boundary so the next behavior pass
does not repeat completed architecture work.

---

# 1. What is implemented

## Threat observation

Implemented:

```text
objective player threat
→ EnemyThreatObserver
→ actor-local EnemyThreatObservationState
```

Observations are encounter-local.

Objective truth and observation remain separate.

The policy must not read hidden objective details that the crew has not
observed/reported.

## Enemy Science identification

Implemented:

```text
unresolved observation
→ IDENTIFY_THREAT enemy crew task
→ EnemyScienceIntelResolver
→ observation.report
```

Reports may be wrong.

Wrong reports are deterministic/plausible for the current trait prototype.

The report intentionally does not contain a reliability flag.

The enemy captain/policy receives the report, not omniscient truth.

## Crew task lifecycle

Implemented:

```text
EnemyCrewTaskRunner
```

Owns:

- enemy role occupancy;
- task elapsed/duration;
- task completion;
- task synchronization with physical weapon phases;
- threat-identification completion callback;
- offensive-task completion callback.

Cooldown does not occupy the crew role.

Shared query:

```text
doesShipWeaponPhaseRequireOperator(phase)
```

Current semantic:

```text
TARGETING / CHARGING / CHANNELING / DISPENSING
→ operator occupied

READY / COOLDOWN
→ operator free
```

## Work intent

Implemented union:

```text
EnemyWorkIntent
```

Current variants:

```text
IDENTIFY_THREAT {
    role: SCIENCE
    observationId
}

OPERATE_WEAPON {
    role
    weaponId
}
```

This is deliberately small.

Do not replace it with a generic planner/action framework.

## Decision policy

Implemented:

```text
EnemyDecisionPolicy.selectWork(actor, role)
```

Policy owns:

- Science identification priority;
- weapon selection;
- role-local round-robin;
- role-local offensive delays.

Current selection order:

```text
SCIENCE:
    unresolved missile/laser observation
    → IDENTIFY_THREAT

otherwise:
    available weapon for requested role
    → OPERATE_WEAPON
```

Weapon-role mapping:

```text
SPAM_PROJECTOR → SCIENCE
other current offensive weapons → WEAPONS
```

Weapon availability currently checks:

- phase READY;
- required loaded content;
- ammunition;
- spam channel not already active.

## Scheduler

Implemented:

```text
EnemyTaskScheduler
```

Scheduler owns only physical execution:

- role exists;
- role is not busy;
- request one intent from policy;
- validate observation/weapon still exists and is startable;
- start crew task;
- set weapon targeting;
- emit targeting telegraph.

Scheduler does not own strategic priorities.

Current scheduled roles:

```text
WEAPONS
SCIENCE
```

## Combat order

`CombatRunner.step()` already exposes the required phase sequence:

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

Do not reorder this during enemy behavior work without focused ordering tests.

---

# 2. Main files

Production:

```text
src/engine/encounter/combat/EnemyDecisionPolicy.ts
src/engine/encounter/combat/EnemyTaskScheduler.ts
src/engine/encounter/combat/EnemyCrewTaskRunner.ts
src/engine/encounter/combat/EnemyThreatObserver.ts
src/engine/encounter/combat/EnemyScienceIntelResolver.ts
src/engine/encounter/combat/CombatRunner.ts
src/engine/encounter/combat/CombatMissileRunner.ts
src/engine/encounter/combat/CombatStickyMineRunner.ts
src/engine/encounter/combat/CombatLaserRunner.ts
src/engine/encounter/combat/CombatSpamRunner.ts
src/engine/encounter/combat/CombatRuntimeIdentityFactory.ts
src/engine/defs/ship_weapon.ts
src/engine/encounter/actors/ship/ship_encounter_actor.ts
src/engine/encounter/model/enemy_threat_observation.ts
src/engine/encounter/model/ship_crew_task.ts
```

Focused tests already touched by the policy-ownership pass:

```text
tests/engine/encounter/enemy_decision_policy.test.ts
tests/engine/encounter/enemy_task_scheduler.test.ts
```

Also inspect current offensive pacing and Science/report tests before editing.

Always search fresh `master` for all current usages.

---

# 3. Current behavior

Offensive behavior is still deliberately simple.

Current properties:

- WEAPONS serializes its physical weapons through role occupancy;
- SCIENCE may operate spam independently when present;
- role-local offensive delay comes from behavior data;
- loadout order and round-robin determine current offensive weapon selection;
- unavailable/cooldown weapons are skipped;
- physical weapon runners own launch/charge/channel/dispense resolution.

Current development encounter intentionally removes enemy Science.

Therefore:

```text
Spam Projector installed
+ no SCIENCE role
→ spam does not run
```

This was done to isolate player offense during implementation.

Do not assume spam was deleted.

---

# 4. What is not implemented

No actual enemy defensive response exists yet.

Missing:

## Point defense

```text
player missile threat
→ enemy policy may assign defense
→ enemy system intercepts or fails
```

Not implemented:

- enemy PD system/state;
- charges/cooldown contract;
- role ownership;
- crew task;
- physical interception;
- presentation;
- policy priority;
- tests.

## Directional shield response

```text
player laser target sector
→ enemy policy may assign Engineer
→ shield chosen/deployed
→ beam blocked or not
```

Not implemented:

- defensive intent;
- Engineer scheduling;
- exact/guessed sector logic;
- shield charge contract;
- enemy shield task;
- policy priority;
- presentation/telemetry;
- tests.

## Sticky-mine clearing

Not implemented:

- enemy observation/report needs;
- allowed role;
- clear task;
- nearest-fuse or policy target selection;
- physical removal;
- presentation;
- tests.

## Behavior preset differences

Behavior data exists, but policy does not yet produce strong visible personality
differences.

Not implemented:

- aggressive versus cautious priority;
- faction-specific refusal/retreat logic;
- defense willingness;
- intentional bad choices beyond Science report quality;
- surrender/retreat.

## Full priority grammar

Not locked:

```text
defense versus offense
which role owns each defense
what happens while role is busy
how long policy may delay
what information is exact versus reported
```

---

# 5. Architecture contract for the next behavior

Required path:

```text
gameplay contract
→ observation/report requirement
→ EnemyWorkIntent
→ EnemyDecisionPolicy selection
→ EnemyTaskScheduler validation/start
→ EnemyCrewTaskRunner lifecycle
→ physical resolver
→ event/snapshot presentation
→ tests
```

Policy decides:

```text
what work should be attempted
```

Scheduler decides:

```text
whether/how the selected intent can physically start
```

Physical subsystem decides:

```text
what the system actually does
```

Do not:

- hardcode enemy reaction inside player weapon code;
- let scheduler search observations or choose priorities;
- let policy mutate physical weapon/effect state directly;
- let policy read hidden objective threat truth past the report boundary;
- create a behavior tree;
- create generic utility AI;
- create one class per event;
- split a weapon family without moving its complete lifecycle behind a narrow
  concrete API;
- create a generic attack-runner hierarchy for missiles, mines, lasers or spam.

---

# 6. Resume point

Resume only after the bridge migration is closed or explicitly paused.

First activity:

```text
design discussion
+ fresh implementation inventory
```

Do not code immediately.

Lock:

1. first defensive vertical slice;
2. required role;
3. information available to policy;
4. task duration;
5. resource/cooldown rule;
6. failure when role is busy;
7. visible telegraph;
8. visible result;
9. behavior-preset difference, if any.

Most natural candidate:

```text
enemy point defense against one player missile
```

Why it is a good candidate:

- player missiles currently have no enemy counter;
- missile is already an observed/reported threat;
- target-loss and projectile lifecycle already exist;
- the complete missile lifecycle now has one physical owner in
  `CombatMissileRunner`;
- result is visually clear;
- scope can remain narrow.

This candidate is not locked.

Discuss it before implementation.

Alternative:

```text
enemy directional shield response to player laser
```

Do not implement both in one first atom.

---

# 7. Candidate point-defense contract questions

Before code, answer:

- Which enemy actor/loadout owns PD?
- Is PD a weapon, ship subsystem or abstract resource?
- Which crew role operates it?
- Does Science need to report the missile first?
- Can policy react to an unclassified observed missile?
- Is interception exact or probabilistic?
- Are charges finite?
- Does cooldown occupy the operator?
- Does aiming occupy the operator?
- What happens when the role is operating an offensive weapon?
- Can the enemy choose the wrong spectral band?
- Does behavior preset affect defense priority?
- Which event removes/resolves the player missile?
- How is interception shown on the viewscreen?
- How does player Science reveal enemy PD capability?

Avoid automatically mirroring the player's RED/BLUE command UI.

---

# 8. Candidate directional-shield contract questions

Before code, answer:

- Does enemy Science report the exact laser sector?
- Can a bad report produce a wrong sector?
- Does Engineer deploy immediately or through a task?
- How many charges exist?
- Does the shield persist for a timed window?
- Does defense preempt repair?
- Does offense continue while Engineer works?
- What happens if Engineer is absent or busy?
- How is shield state exposed in enemy telemetry?
- Is behavior preset aggressive enough to ignore defense?

Do not read the player laser target sector omnisciently unless the observation /
report contract explicitly permits it.

---

# 9. Tests required for the next slice

Policy:

- selected defensive intent under the exact threat/report state;
- no defense without required information;
- offense/defense priority;
- busy/missing role behavior;
- behavior preset difference if introduced.

Scheduler:

- validates physical target/system;
- starts exact role/task;
- rejects stale intent target;
- does not duplicate policy selection logic.

Crew task:

- role occupied while required;
- completion releases role at the correct phase;
- interruption/target loss behavior.

Physical resolution:

- successful defense;
- failed/wrong defense;
- resource/cooldown accounting;
- same-step ordering;
- target removal event/result.

Presentation:

- telegraph;
- resolution;
- no stale views after actor destruction;
- no new combat-object persistence.

Regression:

- existing missile/laser/mine offense;
- enemy offensive pacing;
- actor destruction;
- CombatRunner phase order;
- surviving enemy reset contract.

---

# 10. Deferred related work

- restore enemy Science/spam in the development encounter;
- stronger behavior preset personalities;
- enemy debug view for crew traits/tasks;
- enemy mine clearing;
- retreat/surrender;
- subsystem damage;
- timing/balance pass;
- combined pressure acceptance;
- tactical pause decision.

Do not restore all pressure at once before one defensive response is readable.

---

# 11. Handoff summary

Completed:

```text
observation
Science identification/report
possible wrong report
EnemyWorkIntent
single decision owner
scheduler validation/start
crew-task lifecycle
shared operator-phase semantics
explicit combat-step phases
```

Paused before:

```text
first actual enemy defensive tool
```

The next behavior pass should extend the existing narrow pipeline, not replace
it.
