# Space Captain — Enemy Behavior Handoff

Paused gameplay slice.

Dashboard work is currently active.
Read this file when enemy behavior work resumes.

Last updated:

```text
2026-08-11
```

Repository checkpoint:

```text
2011518c8d492eb6b7a99d6d2fc79f429e780f30
```

---

# 1. Current status

The old statement:

```text
enemy defensive behavior is not implemented
```

is no longer true.

The enemy prototype now has:

- threat observation;
- fallible Science reports;
- offense;
- missile point defense;
- directional shield response;
- sticky-mine clearing;
- player spam purge;
- player-spam slowdown on enemy crew;
- constrained crew roles/tasks.

The next enemy pass is therefore about behavior quality/personality, not about
building the first defense infrastructure.

---

# 2. Current information chain

```text
objective player threat
→ EnemyThreatObserver
→ EnemyThreatObservationState
→ enemy Science task
→ EnemyScienceIntelResolver
→ EnemyThreatReport
→ EnemyDecisionPolicy
```

Objective truth and reports remain separate.

Policy must not bypass the report boundary for hidden information.

---

# 3. Current work intents

`EnemyWorkIntent` currently includes:

```text
PURGE_SPAM
IDENTIFY_THREAT
OPERATE_WEAPON
DEPLOY_SHIELD
CLEAR_STICKY_MINE
INTERCEPT_MISSILE
```

This union is deliberately concrete.

Do not replace it with:

- generic planner;
- utility AI;
- behavior tree;
- generic action graph.

---

# 4. Current scheduler roles

Normal per-role scheduling:

```text
WEAPONS
SCIENCE
ENGINEER
```

Sticky-mine clearing has a dedicated selection path and may also use Helm.

Scheduler responsibilities remain physical:

- role exists;
- role is free;
- selected intent still valid;
- start crew task;
- start physical system/telegraph.

Strategic priority remains policy-owned.

---

# 5. Current policy priorities

Before normal per-role work, enemy mine clearing is scheduled.

For Science, current priority includes:

```text
active player spam on this actor
→ PURGE_SPAM

otherwise unresolved missile/laser observation
→ IDENTIFY_THREAT

otherwise
→ available Science-operated weapon (spam)
```

Weapons may:

- intercept observed player missile with enemy PD;
- otherwise operate offensive loadout.

Engineer may:

- deploy directional shield for a reported player laser in the allowed timing
  window.

Offensive weapons still use role-local pacing/round-robin.

This is a prototype priority grammar, not final characterful behavior.

---

# 6. Enemy point defense

Implemented.

Requires:

- enemy PD subsystem;
- phase READY;
- charges > 0;
- player missile observation.

Current first-pass beam choice is intentionally blind:

```text
RED or BLUE
→ random 50/50
```

Physical PD execution does not silently correct the policy choice.

Future behavior work may use:

- Science report;
- behavior preset;
- known launcher data;
- faction doctrine.

Do not make PD omniscient.

---

# 7. Enemy directional shield

Implemented.

Current path:

```text
player laser task becomes observable
→ enemy Science report contains target zone
→ policy waits for timing window
→ Engineer deploys matching shield
→ active shield may absorb laser
```

Policy uses actual physical time-to-fire only as observable timing information.
Hidden target zone comes from the Science report.

Current timing intentionally avoids always raising the shield immediately.

---

# 8. Enemy sticky-mine clearing

Implemented.

Current selection:

- player-attached mines on this actor;
- unclaimed mine nearest detonation;
- use first free available role from:

```text
ENGINEER
SCIENCE
HELM
WEAPONS
```

Multiple roles may clear multiple mines when available.

Do not change to a generic hazard-cleanup framework unless another current hazard
actually benefits.

---

# 9. Enemy response to player spam

Implemented.

Player spam:

- operated by player Science;
- channels for 20 seconds;
- slows target enemy crew task progress.

Enemy Science:

```text
active player spam
→ PURGE_SPAM has high priority
→ timed Science work
→ purge channel
```

This creates a real Science commitment tradeoff on both sides.

---

# 10. Crew performance model

`CrewPerformanceResolver` is shared by player/enemy crew task progress.

Current behavior:

- active progress effects are queried centrally;
- strongest slowdown wins;
- individual task runners receive crew-adjusted delta rather than inventing
  their own modifier rules.

Do not duplicate spam slowdown logic in new enemy tasks.

---

# 11. Current physical owners

```text
enemy missiles
→ CombatMissileRunner

enemy sticky mines
→ CombatStickyMineRunner

enemy lasers
→ CombatLaserRunner

enemy spam
→ CombatSpamRunner

enemy point defense
→ EnemyPointDefenseRunner

enemy shield lifetime/regeneration
→ EnemyShieldRunner

enemy crew scheduling
→ EnemyTaskScheduler

enemy strategic selection
→ EnemyDecisionPolicy
```

Current grouped paths are documented in `SYSTEM_MAP.md`.

---

# 12. Future enemy behavior work

Not active now.

Useful next questions after dashboard/combat UX is playable:

## Behavior preset differences

Make personalities visible through:

- offense/defense priority;
- willingness to spend limited defense;
- willingness to ignore threats;
- targeting preference;
- post-task pacing;
- retreat/surrender threshold.

Avoid invisible ±5% personality stats.

## Retreat / surrender

Not implemented.

Needs encounter consequences before code.

## Enemy subsystem damage

Not implemented.

Must produce visible command consequences.

## Better PD knowledge

Current random band is deliberately crude.
Future Science knowledge can make defense more competent.

## Opening disruption ownership

Current opening disruption exists.
Future content should decide whether it belongs to:

- ship capability;
- installed system;
- behavior preset;
- scripted encounter.

---

# 13. Resume rule

When enemy behavior resumes:

1. read fresh `master`;
2. play the dashboard combat loop;
3. identify one visible behavior problem;
4. lock one behavior change;
5. preserve policy/scheduler/physical-owner separation;
6. add focused policy + lifecycle tests.

Do not reopen behavior architecture merely because the combat UI changed.
