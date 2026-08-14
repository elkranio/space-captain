# Space Captain — Gameplay Contracts

Living gameplay invariants only. If code and this file disagree, inspect current code and update/fix the mismatch instead of coding from stale prose.

Updated: 2026-08-14
Reference HEAD: `65a983b7460b66bf85a2753844540c78bf8bbe45`

## Encounter shape

- One full enemy ship at a time.
- Missiles, beamCannons, SPAM and sticky mines are weapons/threat objects produced by that ship, not additional command-capable enemies.
- Combat is telegraph -> crew work/response -> delivery/impact -> cooldown, not bullet hell.
- The player wins/loses through readable timing pressure and crew execution, not twitch aiming.

## Officer command truth

- Engine decides command availability.
- App/controller may map a real `AvailableOfficerCommand` to a dashboard affordance.
- Views never recreate gameplay availability rules.
- Starting a command creates/owns an officer task in engine state.
- Cancellation belongs to the active task, not to the UI surface that started it.
- Busy-role behavior comes from engine availability; presentation does not maintain a second busy-command ruleset.

## Shared Power Core

There is one shared player defensive energy store.

Current basic contract:
- capacity: 4 charges
- sequential recharge
- one charge recharge duration: 24 s
- Defense Turret and Shield Generator draw from the same pool

A defensive consumer commits energy when its work starts. Later cancellation/interruption does not refund committed energy.

Persistent presentation state is synchronized from encounter snapshots; there is no duplicate charge-spent event contract.

Future missing contract:
- Power Core can become BROKEN
- on break: charges -> 0 and recharge progress -> 0
- defensive consumers cannot draw energy while broken

## Shield Generator / Active Shield

Installed hardware: **Shield Generator**.
Temporary encounter object: **Active Shield**.

Shield Generator:
- persistent installed player/enemy system
- ONLINE/BROKEN status
- READY/COOLDOWN phase
- no private charge pool
- player `ENGINEER_DEPLOY_SHIELD` requires working/ready generator, no existing Active Shield, available Power Core charge
- Power Core charge is committed at task start
- current deploy task: 3000 ms
- current BASIC generator cooldown: 5000 ms

Active Shield:
- encounter-local
- current BASIC lifetime: 5000 ms
- covers the whole hull for now
- absorbs exactly one incoming beamCannon hit
- disappears on absorption
- otherwise expires at TTL
- final ~1 s blinks visually
- absorption flashes/fades before removal

Player/enemy shield presentation shares timing/alpha math only. Combat ownership and view lifecycle remain separate.

Future:
- breaking Shield Generator should immediately remove an active shield
- exact timings remain balance values

## Defense Turret

Defense Turret is a separate installed defensive module.

Current contract:
- no private charge/ammo pool
- consumes shared Power Core
- Weapons owns player loading/operation flow
- READY / LOADING / COOLDOWN physical phases
- one missile intercept action; no beam-band/color selection
- current BASIC `blindInterceptChance = 0.4`
- hard blind-intercept chance is equipment data and may be displayed numerically
- player and enemy missile interception use the same pure resolution rule
- player installed-system broken/repair lifecycle is still incomplete

A committed attempt costs Power Core regardless of HIT/MISS. A MISS leaves the missile alive.

## Missiles

### Objective truth

Every launched missile projectile has its own hidden runtime signature.

Invariants:
- runtime signature is projectile-instance truth;
- it is not part of `MissileDefinition`;
- identical missile models may have different runtime signatures;
- `missileId` must not reveal or reconstruct the runtime signature;
- current `signature_a` / `signature_b` values are hidden transitional implementation truth, not player-facing colors/frequencies.

### Observer Science intel

Observer knowledge is separate from projectile truth.

Public states:

`UNKNOWN`
- no concrete hypothesis exists.

`UNCERTAIN`
- a concrete hypothesis exists;
- it is operationally usable;
- it may objectively be correct or wrong;
- it may be analyzed again while engine command availability permits.

`CONFIRMED`
- a concrete hypothesis exists;
- engine invariant: it matches objective projectile truth;
- terminal for that projectile.

There is no public `INCORRECT` state and no public correctness flag.

Intel is per projectile. Learning missile A does not identify missile B even when they use the same missile model.

### Science analysis

Current analysis profiles:
- `STANDARD`
- `IMPAIRED`

Current confidence families:
- `CERTAIN`
- `STRONG`
- `WEAK`

Rules:
- `CERTAIN` produces truthful `CONFIRMED`;
- `STRONG` / `WEAK` produce `UNCERTAIN`;
- UNCERTAIN hypothesis can be correct or wrong;
- one analysis outcome drives both hypothesis reliability and bark/confidence family;
- Science confidence is qualitative player information, not a displayed numeric percent.

Current hidden tuning:
- STANDARD: 45% CERTAIN, 40% STRONG, 15% WEAK; overall hypothesis correctness ~84.5%;
- IMPAIRED: 10% CERTAIN, 45% STRONG, 45% WEAK; overall hypothesis correctness ~55%.

Those percentages are hidden tuning, not UI odds.

### Defense Turret resolution

Authoritative rule:

```text
concrete hypothesis matches projectile truth
    -> guaranteed HIT

no hypothesis OR wrong hypothesis
    -> blind roll using installed Defense Turret blindInterceptChance
```

Important consequence:
- `CONFIRMED` + correct -> guaranteed
- `UNCERTAIN` + correct -> guaranteed
- `UNCERTAIN` + wrong -> blind chance
- `UNKNOWN` -> blind chance

The resolver does not care whether a correct hypothesis is labeled CONFIRMED or UNCERTAIN; it compares concrete hypothesis to objective truth.

Blind RNG is deterministic/injected and validated in `[0, 1)`. UI/store code must not call `Math.random()` to resolve interception.

### Current progression state

Implemented today:
- Defense Turret owns `blindInterceptChance`;
- BASIC = 40%.

Not implemented yet:
- missile-side blind-intercept penalty/difficulty;
- a formula combining turret quality and missile quality.

Do not document or implement missile-side penalty as existing behavior. Add it only when the design is deliberately selected.

### Presentation boundary

`EncounterPresentationSnapshot` is the normal app-facing frame root. Its combat slice uses `MissilePresentationSnapshot` for continuously changing missile data.

Presentation receives:
- physical identifiers/timing/target/source data needed by UI;
- `identificationStatus`.

Presentation does **not** receive:
- objective runtime signature;
- concrete Science hypothesis.

Discrete missile events use `MissileEventProjectileSnapshot`. It intentionally carries only physical event-presentation fields and does **not** carry objective `signature` or mutable observer `identification`. Event payloads are projected/detached at the `EncounterEngine` outbox boundary.

Captain missile rows and viewscreen HUD show player-visible `UNKNOWN / UNCERTAIN / CONFIRMED` state, not A/B signature values.

Hard equipment odds may be shown numerically (`TURRET 40%` for current BASIC turret). Science confidence remains qualitative.

### Runtime validation

The finished slice was validated with:
- full TypeScript checks;
- full test suite;
- runtime player -> enemy missile interception;
- runtime enemy -> player missile interception;
- observed blind MISS leaving the projectile alive;
- observed later retry HIT;
- new-game defense sandbox mounting one normal missile launcher for bidirectional smoke.

## BeamCannons

- Enemy beamCannon attack is a timed telegraphed threat.
- Without Active Shield, firing resolves as HIT and damages hull.
- With Active Shield, firing resolves as ABSORBED; hull is unchanged and shield is consumed.
- Engineer shield deployment is the current captain response.
- Science slot is intentionally non-functional for beamCannon targeting until a real targeting/intel contract exists.
- Current whole-hull impact points are presentation anchors, not semantic damage nodes.
- Dashboard renders active incoming beamCannon threats independently.

## Sticky mines

Core invariant:
- every attached mine is an independent `StickyMineState` with its own fuse;
- salvo is a weapon firing pattern, not one aggregate domain threat.

Enemy -> player:
- enemy dispenser targets/dispenses/cools down;
- each mine attaches to PLAYER_SHIP;
- each can be cleared independently;
- detonation damages hull and may interrupt officer work;
- dashboard shows each hostile mine independently;
- clear actions come from real engine availability.

Player -> enemy:
- player dispenser launches mines toward enemy actor;
- each mine attaches independently;
- enemy AI can assign available roles to clear mines;
- uncleared detonation damages enemy hull.

Do not aggregate salvo state for UI convenience.

## SPAM

- SPAM is a channel/progress effect, not a projectile.
- Science launches player SPAM.
- Enemy Science can purge player SPAM.
- Player Science can purge enemy SPAM.
- Player `SCIENCE_FIRE_SPAM` is not manually cancellable once committed; damage interruption may still stop relevant work.
- Active crew-progress modifiers are exposed through canonical `getActiveCrewProgressEffects()`.
- Dashboard shows hostile SPAM channels independently with real Science purge actions.
- Enemy decision policy receives relevant SPAM effects through explicit decision context rather than reading full encounter state.

## Encounter presentation snapshot

`EncounterState` is the only authoritative mutable encounter/combat truth.

`EncounterPresentationSnapshot` is the detached app-facing frame root, not a second state. It composes safe navigation/space data with the focused `CombatPresentationSnapshot`.

It may aggregate:
- player ship/system presentation
- officer availability/tasks
- enemy telemetry
- threats
- commands by role
- safe encounter-space geometry/visual identifiers

Normal presentation consumers should reuse one coherent frame rather than rebuild the same frame through unrelated getters. Focused getters may still exist for narrow engine/test/debug reads.

Events remain separate because they represent discrete transitions rather than current frame truth. `ENCOUNTER_LOADED` is marker-only. Missile event payloads are explicitly sanitized before leaving `EncounterEngine`.

Hidden-domain-data rule:
- presentation may receive only player-visible/operational read-model data;
- hidden missile signature/hypothesis must not leak through snapshots, load payloads, or missile events.

## Damage / interruption

- Hull damage is engine-owned.
- Weapon/defense runners resolve physical outcomes; UI only presents them.
- Damage-interruptible officer tasks are interrupted by engine rules, not view logic.
- Do not infer a damage-node/targeting system from visual impact anchors.

## Enemy crew architecture

Enemy crew is simulated, not a mirrored player bridge.

- policy chooses work;
- scheduler builds explicit decision context, validates and starts work;
- crew-task runner owns timing/lifecycle;
- weapon/defense runners own physical phases;
- Science observation/report is separate from objective combat truth.

Policy does not own `EncounterState`.

Keep this separation unless a concrete simplification is proven.
