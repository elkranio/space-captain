# Space Captain — Gameplay Contracts

Living gameplay invariants only. If code and this file disagree, inspect current code and fix this document rather than coding from stale prose.

## Encounter shape

- One full enemy ship at a time.
- Missiles, lasers, SPAM and sticky mines are weapons/threat objects produced by that ship, not additional command-capable enemies.
- Combat is telegraph → crew work/response → delivery/impact → cooldown, not bullet hell.
- The player wins/loses through readable timing pressure and crew execution, not twitch aiming.

## Officer command truth

- Engine decides command availability.
- App/controller may map a real `AvailableOfficerCommand` to a dashboard affordance.
- Views never recreate gameplay availability rules.
- Starting a command creates/owns an officer task in engine state.
- Cancellation belongs to the active task, not to the UI surface that started it.
- Busy-role behavior is represented through engine availability; presentation should not duplicate a separate busy-command rule.

## Shared Power Core

There is one shared player defensive energy store.

Current basic contract:
- capacity: 4 charges
- sequential recharge
- one charge recharge duration: 24 s
- Defense Turret and Shield Emitter draw from the same pool

A defensive consumer commits energy when its work starts. Later cancellation/interruption does not refund committed energy.

Persistent presentation state is synchronized from the encounter frame snapshot; there is no separate `PLAYER_POWER_CORE_CHARGE_SPENT` event contract.

Future missing contract:
- powerCore can become BROKEN
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
- absorption flashes/fades the shield before it vanishes

Player/enemy shield presentation shares timing/alpha math only. Combat ownership and view lifecycle remain separate.

Future:
- breaking the emitter must immediately remove an active shield
- exact timings remain balance values, not sacred constants

## Defense Turret

Defense Turret is a separate installed defensive system.

Current direction:
- no private charge pool
- consumes shared DEF
- red/blue beam band matters against missile spectral band
- player installed-system broken/repair lifecycle is still incomplete
- enemy Defense Turret is already a live independent implementation; do not delete it while changing player PD

## Missiles

- Incoming enemy missile is its own combat projectile with its own impact timer.
- Science can identify spectral band.
- Weapons can respond through defense-turret beam selection.
- Unknown missile can still be acted on; UI does not invent certainty.
- Dashboard renders incoming missiles independently.
- Enemy decision snapshots may resolve live missile timing/physical target, but must not bypass the Science epistemic boundary for hidden missile truth.

## Lasers

- Enemy laser attack is a timed telegraphed threat.
- Without Active Shield, firing resolves as `HIT` and damages hull.
- With Active Shield, firing resolves as `ABSORBED`; hull is unchanged and shield is consumed.
- Engineer shield deployment is exposed as the current captain response.
- Science slot is intentionally non-functional for laser targeting until a real targeting/intel contract exists.
- Current whole-hull impact points are presentation anchors, not semantic damage nodes.
- Dashboard renders active incoming laser threats independently.

## Sticky mines

Sticky mines are a two-direction combat system.

Core invariant:
- **each attached mine is an independent `StickyMineState` with its own fuse timer.**
- A salvo is a weapon firing pattern, not one aggregated threat object.

Enemy → player:
- enemy dispenser can target, dispense a salvo and cooldown;
- each launched mine attaches to `PLAYER_SHIP`;
- each mine can be cleared independently;
- detonation damages player hull and may interrupt an officer task;
- captain dashboard shows each attached hostile mine independently;
- clear actions come from real engine command availability.

Player → enemy:
- player dispenser launches mines toward the enemy actor;
- each mine attaches independently;
- enemy AI can assign available crew roles to clear player mines;
- uncleared detonation damages enemy hull.

Do not aggregate a salvo into one domain threat for UI convenience.

## SPAM

- SPAM is a channel/progress effect, not a projectile.
- Science launches player SPAM.
- Enemy Science can purge player SPAM.
- Player Science can purge enemy SPAM.
- Player `SCIENCE_FIRE_SPAM` is not manually cancellable once committed; damage interruption may still stop relevant task flow per engine contract.
- Active crew-progress modifiers are exposed through canonical `getActiveCrewProgressEffects()`.
- Player-specific `getActivePlayerSpamChannels()` compatibility query has been removed.
- Captain dashboard shows active hostile SPAM channels independently with real Science purge actions.
- Enemy decision policy receives relevant SPAM effects through explicit decision context rather than reading full encounter state.

## Combat presentation snapshot

`EncounterState` is the only authoritative mutable combat truth.

`CombatPresentationSnapshot` is a detached frame read model, not a second state. It may aggregate:
- player ship/system presentation
- officer availability/tasks
- enemy telemetry
- threats
- commands

Presentation consumers should reuse one coherent frame rather than reconstructing the same frame through unrelated getters.

## Damage / interruption

- Hull damage is engine-owned.
- Weapon runners resolve physical outcomes; UI only presents them.
- Damage-interruptible officer tasks are interrupted by engine rules, not by view logic.
- Do not infer a damage node/targeting system from current visual hit points.

## Enemy crew architecture

Enemy crew is simulated, not a mirrored player bridge.

- policy chooses work;
- scheduler builds explicit decision context, validates and starts work;
- crew-task runner owns timing/lifecycle;
- weapon runners own physical phases;
- science observation/report is separate from objective combat truth.

Policy does not own `EncounterState`.

`EnemyDecisionContext` currently contains:
- enemy threat decision snapshots
- crew-progress effects

Keep this separation unless a concrete simplification is proven.
