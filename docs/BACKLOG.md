# Space Captain — Backlog

Concrete deferred work only. Confirmed intended design lives in `GAME_DESIGN.md`; current runtime truth lives in
`GAMEPLAY_CONTRACTS.md`; broad sequencing lives in `COMBAT_PLAYTEST_ROADMAP.md`.

Do not put uncommitted weapon/crew/run ideas here. Idea-bank material belongs in the relevant design/idea document
until it becomes actual scheduled work.

## Combat correctness

### Remove generic random damage interruption

Ordinary damage must not randomly cancel officer work.

Remove the current generic damage-interruption path, including the `canBeInterruptedByDamage` policy/plumbing and
the Beam/Mine calls that select a random player task after damage.

Future control testing should use explicit `INTERRUPT` / `STUN` mechanics or dedicated test weapons rather than
making ordinary Hull/module damage secretly carry control.

### Remove opening disruption debug fossil

The old combat-start disruption pulse is no longer needed now that Escape is the intended combat-exit mechanic.

Remove the whole feature rather than merely disabling a flag:

- app debug setting/invocation;
- public engine entry point;
- encounter state/support used only by the pulse;
- disruption event/VFX/presentation leftovers;
- tests/content that exist only for that cheat.

Keep enemy combat-start Evade debug behavior only if it still has an independent useful testing purpose.

### Finish shared cooldown timing

Confirmed rule: full cooldown starts after active work/termination, not while active work is still running.

Already aligned or close enough:

- player Missile launch;
- player Sticky Mine single release;
- player Beam;
- player Defense Turret;
- normal player SPAM completion.

Remaining corrections:

- player Evade;
- player Shield;
- enemy Beam;
- enemy Defense Turret;
- enemy SPAM;
- any corresponding enemy Shield path that still commits recovery before work ends.

Preserve commitment rules:

- Missile targeting before launch is free: no ammo, no cooldown;
- Sticky Mine targeting before release is free: no ammo, no cooldown;
- Beam/Shield/Evade keep already-spent CORE after commitment;
- Beam/Turret target loss after active work begins terminates with full cooldown;
- SPAM has no normal manual-cancel action.

Update timing tests deliberately instead of preserving old overlap behavior.

### Evade Drive wear

Implement the confirmed 1-integrity cost for every committed Evade:

- WARMUP is the commitment edge;
- normal completion, manual cancel, explicit `INTERRUPT` and `STUN` all terminate the committed maneuver;
- apply 1 Drive integrity damage at termination;
- start full cooldown only after termination;
- the final Drive integrity point may power one last Evade and break afterward.

### SPAM purge symmetry

Player projection already remains committed after the enemy purges its effect. Enemy projection currently releases
its Scientist when the player purges the channel.

Make both directions follow the confirmed rule:

```text
PURGE removes the effect
-> projecting Scientist remains occupied until the original channel operation ends
-> full cooldown begins when that operation ends
```

Explicit `INTERRUPT` / `STUN` is different from PURGE and may terminate the operation.

## Targeting and defense

### Shared Beam / Shield semantic targets

Migrate incoming Beam and targeted Shield from temporary `HULL | DRIVE` handling to the shared intended vocabulary:

```text
HULL
BRIDGE
SLOT(slotId)
```

Player Beam already carries all three target kinds in engine commands. Dashboard slot selection is landed;
Hull/Bridge presentation input remains separate work.

Enemy Shield must protect a concrete semantic target rather than the current whole-ship shortcut.

### Bridge hit consequence

`BRIDGE` is already a valid player Beam target but currently resolves as a HIT with no gameplay consequence.

When control mechanics are ready, give Bridge hits an explicit consequence such as officer `INTERRUPT` / `STUN`
according to the design chosen at that time. Do not remove the semantic target as cleanup.

### Generic BROKEN gating and Engineer repair

Integrity and `integrity = 0 -> BROKEN` already exist. Finish the gameplay behavior around that foundation:

- every breakable equipment family blocks its function when BROKEN;
- command availability and physical execution consult the same operational truth;
- Engineer can repair BROKEN equipment to full integrity;
- damaged-but-operational equipment cannot be routinely topped off;
- preserve the existing Drive-specific repair behavior while generalizing the rule cleanly.

## Encounter lifecycle

### Encounter-end reset

Implement one explicit post-encounter lifecycle:

- surviving encounter-local equipment returns to max integrity;
- Power Core returns to full;
- temporary tasks/effects/threat state is cleared according to the encounter outcome;
- Hull damage persists;
- spent ammunition persists.

Normal enemy destruction must preserve still-relevant committed incoming physical threats until they resolve.
Negotiated/peaceful end and successful Escape clear all combat threats/effects immediately.

### Escape flow

Add the Drive inline interaction and timed cancellable Pilot Escape task.

Confirmed behavior:

1. Drive must be OPERATIONAL.
2. Other officers do not need to be idle.
3. Cancel / `INTERRUPT` / `STUN` loses current progress.
4. A new attempt starts from zero.
5. Success ends and cleans the encounter rather than suspending it.

### Travel idle-gate redesign — later, non-combat

Current `FLY_TO` / `JUMP` / `DOCK` use the old whole-bridge-idle restriction. Do not mix this redesign into current
combat work.

When navigation/travel is revisited, decide concurrency and location-bound task cancellation deliberately instead of
assuming the prototype gate is final design.

## Presentation

### Threat-readability migration

Replace the abandoned individual compact-threat-strip direction with the confirmed lighter presentation:

- category danger indicators;
- concrete telegraphy on the viewscreen;
- detailed concrete threat selection inside the relevant equipment interaction when needed.

Do not rebuild one permanent card/countdown/progress frame per threat on the captain board.

### Beam Hull / Bridge input

Player Beam engine commands already support Hull and Bridge in addition to equipment slots, but the current
dashboard selection flow exposes equipment slots only. Add deliberate Hull/Bridge target surfaces when that UI slice
is designed.

## Technical follow-ups

Two known production follow-ups remain from the previous test audit:

- zero-duration Power Core content passes schema validation but fails factory/runtime validation;
- asset deletion protects old sprite IDs instead of the current `generic` manifest ID.

Handle each as a narrow separate atom after inspecting the exact current source/tests.

## Retained tooling

Keep `BridgeMissileDebugView` and `bridge_missile_debug_config.ts` until the Missile visual-testing workflow is
explicitly replaced. Do not delete that holdout as generic cleanup.
