# Space Captain — Gameplay Contracts

Stable gameplay and information rules for the encounter-heavy part of
Space Captain.

Last reviewed:

```text
2026-08-11
```

Labels:

```text
LOCKED
```

Implementation must follow unless design is explicitly reopened.

```text
CURRENT BASELINE
```

Implemented prototype behavior that may still be tuned.

```text
PROPOSED
```

Design direction under active discussion; do not treat as implemented.

---

# 1. Core encounter language — LOCKED DIRECTION

The player should interact with the current problem/opportunity first, not with
an officer menu first.

```text
situation / system / encounter object
→ visible response choices
→ choice shows responsible officer
→ officer becomes occupied
→ physical result appears on bridge
```

Combat depth should come from:

- officer contention;
- incomplete information;
- task commitment;
- limited resources;
- timing;
- multiple acceptable responses.

Combat must not require a new player to memorize a hidden table of officer
responsibilities before basic play is possible.

---

# 2. State lifetime — LOCKED

Encounter-local:

- flying missiles;
- active laser attacks;
- sticky mines;
- directional shields;
- spam channels;
- enemy crew tasks;
- threat observations/reports;
- temporary combat policy memory.

Persistent player ship state:

- hull;
- drive;
- PD charges;
- shield generator;
- installed weapon phase/ammunition state;
- navigation.

Enemy identity persists in the node until destroyed.

---

# 3. Surviving enemy persistence — LOCKED RESET

A surviving enemy is reconstructed from its persistent node baseline when the
encounter is reconstructed.

Reset includes encounter-local:

- hull damage;
- weapon ammunition/phases;
- shield/drive mutable encounter state;
- crew tasks;
- observations/reports;
- policy memory;
- temporary combat objects.

Destroyed enemy actors are removed persistently and do not return.

Player spent resources remain persistent.

---

# 4. Player hull ownership — LOCKED

Incoming hull damage is a domain result.

```text
combat resolver
→ engine mutates EncounterState.playerHull
→ engine emits applied result
→ app persists exact result
→ view presents it
```

The app does not calculate damage or destruction.

---

# 5. Officer occupation — LOCKED

Officer tasks represent work requiring a crew member.

Current weapon phase semantics:

```text
TARGETING
CHARGING
CHANNELING
DISPENSING
→ operator occupied

COOLDOWN
READY
→ operator free
```

Cancellation cannot refund a resource that was already intentionally spent.

---

# 6. Player missile offense — LOCKED

```text
ready physical launcher + ammo + live target
→ Weapons targets
→ physical launch spends missile
→ Weapons becomes free after launch
→ launcher cooldown proceeds autonomously
→ projectile resolves independently
```

Rules:

- each physical launcher has stable runtime `weaponId`;
- selected launcher is preserved through execution;
- enemy shields do not block missiles;
- enemy point defense is the missile counter;
- projectile is encounter-local.

---

# 7. Player laser offense — LOCKED

```text
ready laser + target + chosen sector
→ Weapons targets
→ laser charges
→ matching enemy shield may block
→ otherwise enemy hull takes damage
→ cooldown
```

Directional shield interaction applies to laser only.

---

# 8. Player sticky-mine offense — LOCKED

One command launches one salvo of separate mines.

Current starter baseline:

```text
capacity: 6
salvo: 3
interval: 1000 ms
cooldown: 15000 ms
fuse: 7500 ms
damage: 1 each
```

Rules:

- each launched mine spends ammunition;
- partial final salvo is allowed;
- attached mines continue after interruption;
- enemy shield does not block mines;
- enemy crew may clear player mines.

---

# 9. Player spam offense — CURRENT LOCKED BASELINE

Player spam projector is operated by:

```text
SCIENCE
```

Current content:

```text
targeting: shared 3000 ms
channel: 20000 ms
target crew progress multiplier: 0.5
cooldown: 15000 ms
```

Current behavior:

```text
Science starts spam
→ targeting uses crew-adjusted progress
→ channel becomes active
→ Science remains occupied through channel
→ target enemy crew work is slowed
→ enemy Science may purge
→ channel expires or is purged
→ projector cooldown
```

The active channel's physical lifetime advances in world time.

Spam is a deliberate commitment: the player gives up Science availability for a
large enemy-crew debuff window.

---

# 10. Player defense — LOCKED CURRENT SYSTEMS

## Point defense

- Weapons operates it;
- finite charges;
- beam band is selected;
- charge is spent when aiming begins;
- successful matching result can remove incoming missile;
- does not block laser or clear mine.

## Directional shield

- Engineer deploys LEFT/CENTER/RIGHT;
- matching incoming laser zone is blocked;
- shield is temporary;
- generator charges/regeneration follow generator rules;
- shield does not block missiles/mines.

## Sticky-mine clearing

Allowed officer roles may clear mines.
The intended pressure is officer allocation, not click speed.

## Drive repair

Engineer repairs disabled main drive.

---

# 11. Enemy information model — LOCKED

Enemy policy does not receive unrestricted objective combat truth.

```text
objective player threat
→ observation
→ Science work
→ report
→ policy
```

Reports may be wrong.
Reports contain no reliability flag.
Policy must behave using the available report.

---

# 12. Enemy work ownership — LOCKED

```text
EnemyDecisionPolicy
→ selects work intent

EnemyTaskScheduler
→ validates / physically starts intent

EnemyCrewTaskRunner
→ owns crew occupation/task lifecycle

physical combat subsystem
→ owns actual effect
```

No behavior-tree or generic utility-AI framework for the current prototype.

---

# 13. Enemy defensive behavior — CURRENT BASELINE

Implemented intents include:

- missile interception;
- directional shield deployment;
- sticky-mine clearing;
- player spam purge;
- threat identification;
- normal offensive weapon operation.

Current details:

## Point defense

- Weapons operates enemy PD;
- requires installed ready PD and charges;
- current first behavior pass chooses RED/BLUE beam blindly/randomly;
- physical PD runner does not correct the policy choice.

## Directional shield

- Engineer uses Science report for player laser target zone;
- deployment is timing-aware so the shield is not always raised immediately;
- no valid report / no charge / wrong timing / busy Engineer can prevent defense.

## Sticky-mine clearing

- mines attached by player may be cleared;
- earliest detonation is prioritized;
- current role priority is:

```text
ENGINEER
SCIENCE
HELM
WEAPONS
```

## Player spam purge

Idle enemy Science prioritizes purging active player spam before identification
or offensive spam operation.

These are prototype priorities, not final enemy personality.

---

# 14. Enemy destruction — LOCKED

```text
enemy hull reaches zero
→ remaining player attacks targeting it resolve target-loss as required
→ encounter actor removed
→ persistent node actor removed
→ active enemy tasks/systems stop
→ destruction presentation
→ encounter continues
```

Already launched enemy missiles continue.
Already attached enemy mines on the player continue.

Destruction does not automatically end the encounter.

---

# 15. Captain dashboard interaction — LOCKED DIRECTION

Normal gameplay interaction should move toward:

```text
captain dashboard
→ contextual object/system/threat
→ action icon + officer role
→ one click where there is no real subchoice
```

Dashboard geography:

```text
LEFT
→ our ship, stable positions

RIGHT
→ current context, dynamic content
```

Combat left:

- persistent hull / PD / shield / engine;
- installed missile / laser / mine / spam systems;
- system state;
- direct system actions.

Combat right:

- enemy root context;
- player-known enemy information;
- incoming threats;
- threat response actions.

Normal officer context menus are temporary legacy UI and should be retired after
the dashboard preserves equivalent functionality.

Officer stations remain important for:

- character presence;
- work/activity;
- barks/reactions;
- task progress;
- local feedback.

---

# 16. Dashboard information honesty — LOCKED

A UI mockup may contain conceptual intel placeholders.
Runtime UI must not reveal domain data merely because the engine internally
knows it.

In particular:

- final enemy crew knowledge;
- vulnerabilities;
- system weaknesses;
- capability discovery

must have explicit player-facing information rules.

Do not use debug snapshots as permanent captain knowledge.

---

# 17. Global evasive maneuver — PROPOSED

Current preferred direction:

```text
one global Helm evasive-maneuver task
```

rather than one evade command per incoming projectile.

Proposed effect:

- Helm occupied for X seconds;
- mitigates incoming weapon-style threats such as missile/laser;
- does not directly solve sticky mines or spam;
- slows player weapon-related task progress while maneuvering;
- strength/duration may depend on ship/engine/Helm traits.

Open:

- exact damage/accuracy model;
- exact duration;
- exact player offensive slowdown;
- cooldown/recovery;
- engine-damage interaction.

Do not implement from this text alone; lock numbers and domain representation
first.

---

# 18. Escape — UNRESOLVED

A full escape/break-contact flow is not implemented.

It must remain easy to access during combat.

Possible UI direction:

- dashboard navigation context/tab;
- prominent `BREAK CONTACT` action.

Do not bury escape in several role menus.

---

# 19. Dashboard modes/tabs — PROPOSED

Possible modes:

```text
COMBAT
NAV
SHIP / DAMAGE
```

Possible behavior:

- combat begins → auto-select COMBAT;
- combat ends → return to NAV;
- manual switching remains possible.

This is UX direction, not a locked exact tab set.

---

# 20. Design-change rule

Before changing a locked gameplay contract, discuss:

- player-facing reason;
- officer occupation;
- resource consequences;
- lifecycle consequences;
- information/telegraph consequences;
- persistence consequences;
- required tests.

Implementation convenience alone is not enough.
