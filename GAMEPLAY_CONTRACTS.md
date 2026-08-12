# Space Captain — Gameplay Contracts

Living gameplay invariants only. If code and this file disagree, inspect the current code and fix this document rather than coding from stale prose.

## Encounter shape

- One full enemy ship at a time.
- Missiles, lasers, spam and sticky mines are weapons/threat objects produced by that ship, not additional command-capable enemies.
- Combat is telegraph → crew work/response → delivery/impact → cooldown, not bullet hell.
- The player wins/loses through readable timing pressure and crew execution, not twitch aiming.

## Officer command truth

- Engine decides command availability.
- App/controller may map a real `AvailableOfficerCommand` to a dashboard affordance.
- Views never recreate gameplay availability rules.
- Starting a command creates/owns an officer task in engine state.
- Cancellation belongs to the active task, not to the UI surface that started it.

## Shared Defense Capacitor

There is one shared player defensive energy store.

Current basic contract:
- capacity: 4 charges
- sequential recharge
- one charge recharge duration: 24 s
- Point Defense and Shield Emitter draw from the same pool

A defensive consumer commits energy when its work starts. Later cancellation/interruption does not refund committed energy.

Future missing contract:
- capacitor can become BROKEN
- when broken: charges → 0 and recharge progress → 0
- no defensive consumer can draw energy while broken

## Shield Emitter / Active Shield

Installed hardware: **Shield Emitter**.
Temporary encounter object: **Active Shield**.

Shield Emitter:
- persistent installed player system
- ONLINE/BROKEN status
- READY/COOLDOWN phase
- no private charge pool
- `ENGINEER_DEPLOY_SHIELD` requires a working/ready emitter, no existing Active Shield and available DEF charge
- DEF charge is spent at task start
- current deploy task: 3000 ms
- current basic emitter cooldown: 5000 ms

Active Shield:
- encounter-local, not persistent ship state
- current basic lifetime: 5000 ms
- covers the whole hull for now
- absorbs exactly one incoming laser hit of any power
- disappears on absorption
- otherwise expires at TTL
- final ~1 s blinks visually
- absorption flashes the shield before it vanishes

Future:
- breaking the emitter must immediately remove an active shield
- exact timings remain balance values, not sacred constants

## Point Defense

Point Defense is a separate installed defensive system.

Current direction:
- no private charge pool
- consumes shared DEF
- red/blue beam band matters against missile spectral band
- player installed-system broken/repair lifecycle is still incomplete
- enemy Point Defense is already a live independent implementation; do not delete it while changing player PD

## Missiles

- Incoming enemy missile is its own combat projectile with its own impact timer.
- Science can identify spectral band.
- Weapons can respond through point-defense beam selection.
- Unknown missile can still be acted on; UI does not invent certainty.
- Dashboard currently renders incoming missiles independently.

## Lasers

- Enemy laser attack is a timed telegraphed threat.
- Without Active Shield, firing resolves as `HIT` and damages hull.
- With Active Shield, firing resolves as `ABSORBED`; hull is unchanged and shield is consumed.
- Engineer shield deployment is exposed as the current captain response.
- Science slot is intentionally non-functional for laser targeting until a real targeting/intel contract exists.
- Current whole-hull impact points are presentation anchors, not semantic damage nodes.

## Sticky mines

Sticky mines are already a two-direction combat system.

Core invariant:
- **each attached mine is an independent `StickyMineState` with its own fuse timer.**
- A salvo is a weapon firing pattern, not one aggregated threat object.

Enemy → player:
- enemy dispenser can target, dispense a salvo and cooldown;
- each launched mine attaches to `PLAYER_SHIP`;
- each mine can be cleared independently;
- detonation damages player hull and may interrupt an officer task.

Player → enemy:
- player dispenser launches mines toward the enemy actor;
- each mine attaches independently;
- enemy AI can assign crew to clear player mines;
- uncleared detonation damages enemy hull.

Captain dashboard does not yet show sticky mines in combat context. This is the immediate next slice.

## Spam

- Spam is a channel/effect, not a projectile.
- Science launches player spam.
- Enemy Science can purge player spam.
- Player Science can purge enemy spam.
- Player `SCIENCE_FIRE_SPAM` is not manually cancellable once committed; damage interruption may still stop relevant task flow per engine contract.
- Captain-context threat presentation for enemy spam is still future work.

## Damage / interruption

- Hull damage is engine-owned.
- Weapon runners resolve physical outcomes; UI only presents them.
- Damage-interruptible officer tasks are interrupted by engine rules, not by view logic.
- Do not infer a damage node/targeting system from current visual hit points.

## Enemy crew architecture

Enemy crew is simulated, not a mirrored player bridge.

- policy chooses work;
- scheduler validates and starts work;
- crew-task runner owns timing/lifecycle;
- weapon runners own physical phases;
- science observation/report is separate from objective combat truth.

Keep this separation unless a concrete simplification is proven.
