# BEAM CANNON SYSTEM — FULL DESIGN + IMPLEMENTATION HANDOFF

## Purpose of this file

This file preserves the complete Beam Cannon direction discussed before the UI handoff.

Read this before implementing node-specific Beam damage.

The current game contains only the MINIMAL foundation needed for target intel and the Beam threat tile.

The full surgical Beam system described below is NOT implemented yet.

---

# 1. Core fantasy

Beam Cannon should not be just another hull-damage projectile.

Its gameplay identity is:

> a telegraphed precision weapon aimed at a specific ship node, creating a specific consequence that the captain can discover and defend against.

Missiles create interception pressure.

Beam creates target/consequence pressure.

The captain should care not only that a Beam is coming, but WHERE it is going.

---

# 2. Current implemented foundation

As of the handoff base, incoming enemy Beam attacks have:

- a hidden actual target node
- player-observer target intel
- Science TRACK support
- safe public snapshots that do not leak hidden truth
- normal Engineer SHIELD interaction
- exact Beam countdown
- production threat tile

Current target-node domain:

- `HULL`
- `BRIDGE`
- `DRIVE`

Current model lives around:

`src/engine/encounter/model/combat.ts`

Constants/types include:

- `BEAM_CANNON_TARGET_NODE`
- `BeamCannonTargetNode`
- `BEAM_CANNON_TARGET_INTEL_STATUS`
- `BeamCannonTargetIntel`
- `BeamCannonAttackState`
- safe `BeamCannonAttackSnapshot`

---

# 3. Hidden truth

Each incoming Beam chooses its target ONCE when the concrete Beam attack is created.

Do not reroll target while charging.

Hidden truth belongs to internal encounter state.

The UI and public event/snapshot layers must not receive `targetNode` directly.

This mirrors the principle already used for hidden missile signature truth.

---

# 4. Player observer knowledge

Beam target knowledge has three semantic states.

## UNKNOWN

Player knows a Beam is charging but does not know the target.

UI:

`UNKNOWN`

---

## UNCERTAIN

Science has produced a concrete hypothesis, but it may be wrong.

Examples:

- `HULL?`
- `BRIDGE?`
- `DRIVE?`

Important:

Uncertain intel preserves the actual hypothesis.

Do NOT reduce this to generic `GUESS`.

The whole point is that the captain acts on the guessed node.

The guess may be:

- correct
- incorrect

---

## CONFIRMED

Science knows the target.

Examples:

- `HULL`
- `BRIDGE`
- `DRIVE`

Do NOT replace the confirmed state with a generic `LOCK`.

The target name itself is the valuable information.

---

# 5. Current Science analysis profile

The first implemented Beam TRACK logic intentionally mirrors the rough missile analysis shape.

At the handoff point, the agreed/implemented profile was:

- 45% confirmed
- 40% uncertain with a correct hypothesis
- 15% uncertain with an incorrect hypothesis

For an incorrect hypothesis, choose one of the OTHER valid nodes.

Do not expose hidden truth in order to render uncertainty.

This tuning is provisional gameplay tuning, not sacred architecture.

It can change during balance work.

---

# 6. Current temporary impact behavior

Although Beam already has `targetNode`, the target currently DOES NOT control hit resolution.

For now Beam still follows the previous simplified hit path:

1. if player is EVADING and Beam resolution says miss → `MISS`
2. otherwise if active Shield fully catches it → `ABSORBED`
3. otherwise it resolves the old hull hit / old interruption behavior

This temporary behavior was intentionally retained while building the UI/intel foundation.

Do not mistake it for the final design.

---

# 7. Final node-target consequence language

The intended node meanings are:

## HULL

Attrition / task shock.

- damages hull
- may interrupt current officer tasks

This is the "physical ship hit" target.

---

## BRIDGE

Crew disruption.

- may stun officers

This should feel different from HULL interruption.

---

## DRIVE

Escape denial.

- damages/breaks the drive node
- broken drive prevents escape/jump/whatever current escape mechanic requires it

---

## WEAPON — future

Disarm.

- damages/breaks a specific weapon/module
- broken weapon becomes unavailable until repaired

Important unresolved modeling question:

A generic `WEAPON` target becomes ambiguous once the ship has multiple weapons.

Do not add `WEAPON` to the target domain until the target identity model is clear.

Potential future model might target a concrete installed system/module rather than a generic node enum.

---

## SHIELD — future

Expose.

- damages/breaks Shield Generator node/module
- unavailable until repaired

Again, add only when the module damage architecture exists.

---

# 8. Node integrity

Binary `WORKING -> BROKEN` is considered too coarse.

Reason:

If every Beam instantly breaks every targeted system, weapon archetypes cannot meaningfully differ in anti-system strength.

Preferred model:

small node integrity tracks, represented as pips/boxes rather than large HP numbers.

Examples:

`DRIVE [■][■]`

`SHIELD [■][■][■]`

`WEAPON [■][■]`

Keep integrity tracks tiny.

Target range:

- usually 1–3 pips

Avoid turning ship systems into RPG health bars.

---

# 9. Weapon damage has TWO independent axes

Final Beam weapons should separate:

## `hullDamage`

How much physical ship damage the Beam causes when hull damage applies.

## `nodeDamage`

How much integrity damage it causes to a targeted system node.

These values do not automatically convert into one another.

Mental rule:

> `nodeDamage` breaks systems.  
> `hullDamage` breaks the ship.

This separation is important for distinct Beam archetypes.

---

# 10. Normal intact-node damage rules

These rules were explicitly agreed.

## Target = normal HULL

Hull receives:

`hullDamage`

HULL also participates in its interruption effect roll.

---

## Target = normal intact module/node

Node receives:

`nodeDamage`

Hull receives:

`0`

Example:

Weapon:

- hullDamage = 2
- nodeDamage = 1

Target:

`DRIVE [■][■]`

Result:

- DRIVE loses 1 integrity
- hull loses 0

---

# 11. VULNERABLE is a separate node modifier

`VULNERABLE` is NOT another attack type.

It is a property/modifier of the targeted node.

It answers:

> does a surgical hit on this location also expose the physical hull?

Keep it separate from node integrity.

Node can be:

- intact + normal
- intact + vulnerable
- broken
- potentially broken + vulnerability metadata depending on final model

---

# 12. Agreed vulnerable damage rules

## VULNERABLE system node

Node receives normal:

`nodeDamage`

AND hull receives normal weapon:

`hullDamage`

Example:

Weapon:

- hullDamage = 2
- nodeDamage = 1

Target:

`DRIVE [■][■] VULNERABLE`

Result:

- DRIVE integrity -1
- hull -2

Important:

Do NOT translate node damage into hull damage.

Do NOT add nodeDamage + hullDamage together as one physical number.

They remain separate effects.

---

## VULNERABLE HULL

Hull receives:

`hullDamage × 2`

Example:

Heavy Beam `hullDamage = 2`

Target:

`HULL VULNERABLE`

Result:

`hull -4`

---

# 13. Already-BROKEN node repeat hit

Strongly liked rule:

> hitting an already BROKEN system node deals `hullDamage ×2` to hull.

Reason:

A broken module becomes an "open wound".

This creates pressure to react when the enemy targets something already destroyed.

Example:

Drive is already BROKEN.

Enemy Beam targets DRIVE again.

If it gets through defense:

`hullDamage ×2`

This makes repeated targeting tactically meaningful instead of wasting the enemy shot.

---

# 14. BROKEN + VULNERABLE stacking is unresolved

Do NOT silently implement x4.

Previous preferred direction was:

- broken repeat hit remains `hullDamage ×2`
- vulnerability does not stack that again to x4

But this was NOT fully confirmed by the user.

Resolve before implementation.

Conservative likely rule:

`BROKEN` takes precedence for physical collateral and remains x2.

---

# 15. Node damage overkill spill is unresolved

Suppose:

- node has 1 integrity left
- Beam deals 2 nodeDamage

Should extra 1 nodeDamage become hull damage?

Preferred direction so far:

NO.

`nodeDamage` does not spill into hull.

Reason:

keeps the two damage axes clean.

But confirm before final implementation.

---

# 16. Crew/task effects use TWO-STAGE rolls

This was explicitly preferred.

Do NOT collapse crew-control effects into a single random count.

For each relevant effect:

## Stage 1 — proc roll

Does the effect happen?

Example:

`stunChance = 30%`

or

`interruptChance = 50%`

## Stage 2 — severity/count roll

If it procs, how many eligible targets are affected?

Example:

`stunAffected = 1..2`

`interruptAffected = 1..1`

This creates two independent weapon design axes:

- reliability
- severity

It also gives perks/modifiers cleaner knobs.

Example perk:

`+1 affected officer`

without changing proc chance.

---

# 17. HULL interruption

HULL hit can interrupt current officer tasks.

Final exact interrupt semantics are unresolved.

Candidates:

- cancel current task and lose all progress
- pause task for some period
- reset/restart progress
- other explicit interruption outcome

Do not implement until the meaning is chosen.

Eligibility rule:

Only officers with a currently active task that is actually interruptible should enter the candidate pool.

If roll says affect 2 but only 1 eligible task exists:

affect 1.

Never target nonexistent/ineligible tasks to satisfy rolled count.

---

# 18. BRIDGE stun

BRIDGE hit can stun officers.

Keep stun distinct from interrupt.

Stun is about officer availability/control.

Interrupt is about current task execution.

Do not encode both as the same generic "cancel task" mechanic.

Unresolved:

- stun duration
- whether duration is fixed globally or a weapon stat
- exact eligible officer pool
- behavior if an already-busy officer is stunned
- whether stun automatically cancels current task or pauses/blocks after completion

Need design decision before full implementation.

---

# 19. Suggested Beam weapon stat set

Minimal useful content stats:

- `hullDamage`
- `nodeDamage`
- `stunChance`
- `stunAffectedMin`
- `stunAffectedMax`
- `interruptChance`
- `interruptAffectedMin`
- `interruptAffectedMax`

Potentially later:

- stun duration
- targeting preferences
- shield interaction modifiers

Do not add stats before they have gameplay consumers.

---

# 20. Example archetype — NEEDLE BEAM

Role:

surgical anti-system weapon.

Example tuning:

- hullDamage: 1
- nodeDamage: 2
- stunChance: 15%
- stun affected: 1
- interruptChance: 25%
- interrupt affected: 1

Behavior:

- can one-shot a 2-pip DRIVE
- weak hull pressure
- weak crew control
- dangerous because it disables specific systems quickly

---

# 21. Example archetype — SHOCK BEAM

Role:

crew-control / disruption weapon.

Example tuning:

- hullDamage: 1
- nodeDamage: 1
- stunChance: 70%
- stun affected: 2–3
- interruptChance: 65%
- interrupt affected: 1–2

Behavior:

- requires multiple hits to break sturdier systems
- BRIDGE/HULL targeting is much more disruptive
- less efficient surgical module killer than Needle Beam

---

# 22. Possible future archetype — HEAVY BEAM

Role:

physical damage.

Possible direction:

- high hullDamage
- modest nodeDamage
- low crew-control probabilities

This weapon would make HULL and VULNERABLE targets especially scary.

Not yet tuned.

---

# 23. Shield resolution

Current defense order is conceptually useful:

1. Beam is fired
2. evasion may produce MISS
3. active Shield may fully absorb Beam
4. only if Beam penetrates/gets through does node consequence occur

Final node system should preserve:

> a fully stopped Beam causes no target-node effect.

Do not apply stun, interrupt, node damage, or vulnerable collateral before resolving full shield absorption.

Partial shield mechanics do not currently need to be invented.

---

# 24. Beam threat timing / Shield gameplay

Temporary shield duration creates an important Beam-specific timing game.

The player cannot simply deploy shield whenever Beam appears.

If shield is deployed too early:

- shield expires before Beam fire

If deployed too late:

- Engineer / activation cannot finish before Beam fire

Therefore Beam threat tile should later visualize a VALID SHIELD WINDOW.

See:

`THREAT_PROGRESS_BARS_TASK.md`

This timing UI is separate from the node-damage implementation.

---

# 25. Science TRACK timing

Science target analysis is another Beam timing concern.

Science must complete TRACK before Beam fires.

The Beam progress visualization eventually needs to communicate both:

- TRACK deadline
- valid SHIELD window

Do not solve this by exposing hidden target truth.

---

# 26. Enemy target selection

Current first slice uses simple random target choice across:

- HULL
- BRIDGE
- DRIVE

This is intentionally dumb.

Future enemy AI can become smarter.

Examples:

- target DRIVE if player is likely to escape
- target already BROKEN node to exploit x2 hull damage
- target VULNERABLE node
- target BRIDGE for crew-control strategy
- target system that disables a current player response

Do not put smarter selection into the first node-damage implementation unless explicitly requested.

Keep target selection policy separate from hit consequence rules.

---

# 27. WEAPON target identity problem

This is deliberately deferred.

If the player has multiple installed weapons, `WEAPON` is not sufficient hidden truth.

Questions:

- target a concrete installed weapon runtime id?
- target a generic weapon bay node that affects all weapons?
- target slot?
- target subsystem/chassis mount?

Do not add `WEAPON` merely because the enum can accept another string.

Resolve the gameplay model first.

---

# 28. BRIDGE integrity question

Unresolved:

Should BRIDGE itself have integrity pips?

Two possible models:

## Effect-only BRIDGE

Every penetrating BRIDGE Beam only rolls crew stun.

No BRIDGE integrity/broken state.

Simpler.

## Physical BRIDGE node

BRIDGE has integrity and can become BROKEN, with some ship-wide consequence.

More systemic, but potentially much more complex.

No final decision.

Do not assume BRIDGE gets pips just because DRIVE/modules do.

---

# 29. HULL integrity question

HULL should almost certainly continue using the ship's existing main hull resource.

Do not create a separate HULL node HP track in addition to ship hull unless a later design explicitly requires it.

Likely model:

- HULL target points directly at main hull
- no separate HULL pips
- vulnerable HULL modifies main hull damage

---

# 30. Repair system questions

Once module integrity exists, repair must be defined.

Unresolved:

- does one Engineer repair task restore a broken module to full?
- or restore one pip?
- can partially damaged but not broken nodes be repaired?
- does repair need spare parts/resources?
- can repair happen in combat?
- does BROKEN state change available repair commands?

Keep the first implementation as simple as possible.

Likely useful v0 candidate:

- repair one pip per completed repair task

But this was not confirmed.

---

# 31. Drive consequence

Agreed high-level consequence:

BROKEN DRIVE prevents escape.

Wire this through the existing authoritative drive/system state.

Do not create a duplicate `canEscape` boolean owned by Beam logic.

Escape availability should naturally derive from the damaged drive state.

---

# 32. System-module consequence

Future broken module behavior:

- broken weapon → command unavailable
- broken shield generator → deploy shield unavailable
- broken drive → escape unavailable

Again:

system state is the source of truth.

Beam should damage system state, not maintain parallel Beam-only disabled flags.

---

# 33. Suggested implementation architecture

Keep it explicit.

A likely clean flow:

1. Beam attack already contains hidden target node.
2. Beam fires.
3. Resolve MISS.
4. Resolve full Shield absorption.
5. If penetrating:
   - inspect target
   - apply target-specific damage/effect
6. emit normal result/outbox events
7. other systems react to state/result as needed

Avoid giant callback webs.

Avoid pushing node-specific rules into Phaser/UI.

---

# 34. Suggested first implementation slice

Do NOT implement everything at once.

Recommended:

## Slice A — integrity + DRIVE only

- define minimal node integrity state for DRIVE
- give Beam weapon hullDamage/nodeDamage
- HULL target uses hullDamage
- DRIVE target uses nodeDamage
- broken DRIVE disables escape
- vulnerable can be postponed if needed

This proves the basic model.

## Slice B — vulnerable physical collateral

- vulnerable node -> nodeDamage + hullDamage
- vulnerable HULL -> hullDamage x2

## Slice C — broken repeat hit

- already broken targeted node -> hullDamage x2

## Slice D — HULL interrupt

- two-stage proc/count
- exact interrupt semantics first

## Slice E — BRIDGE stun

- two-stage proc/count
- define stun state/duration

## Slice F — future modules

- SHIELD
- concrete WEAPON modeling

This sequencing is only a recommendation; inspect current architecture first.

---

# 35. Testing expectations

At minimum, future node Beam tests should cover:

- target selected once and does not reroll
- hidden target does not leak
- normal HULL receives hullDamage
- normal DRIVE receives nodeDamage and no hullDamage
- vulnerable DRIVE receives nodeDamage + hullDamage
- vulnerable HULL receives hullDamage x2
- already broken DRIVE receives hullDamage x2
- shield absorption prevents all node consequences
- miss prevents all node consequences
- zero/insufficient integrity transitions node to BROKEN
- broken drive blocks escape through authoritative system availability
- proc failure produces no stun/interrupt
- proc success rolls affected count
- eligible pool smaller than rolled count is handled safely

Add deterministic RNG injection rather than flaky probabilistic tests.

Be mindful:

Beam target selection itself consumes encounter RNG.

Tests using scripted RNG sequences must account for that first roll.

---

# 36. Content editor implications

Eventually Beam weapon definitions will probably need editor support for:

- hullDamage
- nodeDamage
- stun proc/count values
- interrupt proc/count values
- possibly stun duration

Do not edit the content editor before the runtime stat model is stable.

Runtime/gameplay model first.

Editor plumbing second.

---

# 37. UI implications beyond threat tile

Node integrity may need player-ship dashboard representation.

Preferred direction:

small pips/boxes, not raw numeric HP.

Example:

`DRIVE [■][■]`

Do not overload the threat tile with target-node integrity unless it proves decision-critical.

Threat tile's job is:

- what is targeting us
- where
- when
- what can we do

Player system dashboard's job is:

- what condition our systems are in

Keep those responsibilities separate.

---

# 38. Open decisions checklist

Resolve explicitly before the relevant slice:

- exact HULL interrupt semantics
- stun duration
- stun eligibility
- whether BRIDGE has integrity
- repair one-pip vs full restoration
- broken + vulnerable stacking
- nodeDamage overkill spill
- WEAPON concrete target identity
- future SHIELD node integrity
- whether vulnerable can be temporary/dynamic and who creates it

Do not let an implementation accidentally decide these by convenience.

---

# 39. Compact authoritative rule summary

Current intended physical rules:

### Normal HULL
`hull -= hullDamage`

plus possible interrupt effect.

### Vulnerable HULL
`hull -= hullDamage * 2`

plus possible interrupt effect.

### Normal intact system node
`nodeIntegrity -= nodeDamage`

`hull -= 0`

### Vulnerable intact system node
`nodeIntegrity -= nodeDamage`

`hull -= hullDamage`

### Already BROKEN targeted system node
`hull -= hullDamage * 2`

Broken+Vulnerable stacking still needs explicit confirmation.

---

# 40. Design identity summary

Beam target meanings:

- HULL = attrition / task shock
- BRIDGE = crew disruption
- DRIVE = escape denial
- WEAPON = disarm
- SHIELD = expose

Modifiers/state:

- VULNERABLE = surgical hit also causes physical hull collateral
- BROKEN = node disabled; repeated targeted hit becomes dangerous hull damage
- integrity pips = tiny system survivability track

Weapon axes:

- hullDamage = physical ship killing
- nodeDamage = system breaking
- stun reliability/severity
- interrupt reliability/severity

This is the intended Beam Cannon system. Preserve these distinctions rather than reducing it to "beam deals damage to selected subsystem".
