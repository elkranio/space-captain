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
- Defense Turret and Shield Generator draw from the same pool

A defensive consumer commits energy when its work starts. Later cancellation/interruption does not refund committed energy.

Persistent presentation state is synchronized from the encounter frame snapshot; there is no separate `PLAYER_POWER_CORE_CHARGE_SPENT` event contract.

Future missing contract:
- Power Core can become BROKEN
- when broken: charges → 0 and recharge progress → 0
- no defensive consumer can draw energy while broken

## Shield Generator / Active Shield

Installed hardware: **Shield Generator**.
Temporary encounter object: **Active Shield**.

Shield Generator:
- persistent installed player system
- ONLINE/BROKEN status
- READY/COOLDOWN phase
- no private charge pool
- `ENGINEER_DEPLOY_SHIELD` requires a working/ready generator, no existing Active Shield and available Power Core charge
- Power Core charge is spent at task start
- current deploy task: 3000 ms
- current basic generator cooldown: 5000 ms

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
- breaking the Shield Generator must immediately remove an active shield
- exact timings remain balance values, not sacred constants

## Defense Turret

Defense Turret is a separate installed defensive module.

Current implementation:
- no private charge/ammo pool
- consumes shared Power Core
- Weapons owns the loading/operation flow
- has READY / LOADING / COOLDOWN physical phases
- current code still uses red/blue beam bands against missile spectral bands
- player installed-system broken/repair lifecycle is still incomplete
- enemy Defense Turret is live and must remain behaviorally equivalent where the shared missile contract applies

The red/blue band mechanic is **scheduled for immediate replacement** by the approved missile tracking design below.

## Missiles — current code vs approved next contract

### Current code

At reference HEAD `5f33f12374db9dfc5241e9bc300139e921e6a542`:

- missile definitions are closed `RED_00` / `BLUE_00`
- missile definition owns `spectralBand`
- Defense Turret chooses a matching red/blue beam band
- Science can expose missile band intel

This is legacy behavior for the next refactor. Do not expand it.

### Why it changes

The model-level color/band contract has two design problems:

1. identifying one missile effectively teaches the player how to handle every same-type missile in the launcher;
2. Defense Turret no longer has finite private charges and instead uses regenerating Power Core energy, so guaranteed counterplay became too cheap for a weapon intended to be a serious, relatively expensive finite threat.

### Approved target contract

Each **launched missile instance** has its own hidden maneuver/signature pattern.

The pattern is runtime projectile truth, not a permanent shared fact of the missile model.

Science:
- analyzes a specific incoming missile;
- can acquire a tracking solution for that exact projectile;
- does not globally reveal every missile of the same launcher/model.

Defense Turret:
- may fire at identified or unidentified missiles;
- **identified/tracked missile → guaranteed intercept**;
- **unidentified missile → blind intercept with a visible chance**;
- a blind attempt is allowed; do not hard-disable the action merely because Science has not finished;
- every committed turret attempt spends the normal Power Core cost whether it hits or misses;
- normal turret load/cooldown/operator lifecycle still applies.

Equipment progression:
- better Defense Turrets improve blind-intercept reliability;
- better missiles make blind interception harder as the run progresses;
- Science remains the deterministic 100% answer, so equipment progression does not obsolete Science.

Not locked yet:
- exact probability formula;
- exact field names (`blindInterceptChance`, missile penalty/evasion/etc.);
- exact numerical progression;
- probability floor/ceiling;
- final fiction/UI wording for signature vs maneuver pattern vs tracking solution.

Keep the first implementation mathematically boring. Avoid accuracy × tracking × evasion × sensor-quality formula soup unless future gameplay proves it necessary.

### Presentation contract

The player must understand whether an intercept is deterministic or risky.

Target presentation direction:
- tracked/identified missile clearly communicates guaranteed intercept;
- unidentified missile action clearly communicates blind-intercept probability;
- current red/blue color coding is temporary and should disappear from the final mechanic.

Do not make UI infer probability independently. Engine/read model should provide the authoritative value/status needed for presentation.

### Threat importance

Missiles are intended to remain a serious threat:
- finite resource for the firing ship;
- relatively expensive/meaningful weapon rather than spam;
- player can respond through Science + Defense Turret, blind turret risk, and later other defensive choices such as evade;
- do not balance missile relevance only by inflating hull damage.

The immediate implementation task is described in `MISSILE_REFACTOR_HANDOFF.md`.

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
- Weapon/defense runners resolve physical outcomes; UI only presents them.
- Damage-interruptible officer tasks are interrupted by engine rules, not by view logic.
- Do not infer a damage node/targeting system from current visual hit points.

## Enemy crew architecture

Enemy crew is simulated, not a mirrored player bridge.

- policy chooses work;
- scheduler builds explicit decision context, validates and starts work;
- crew-task runner owns timing/lifecycle;
- weapon/defense runners own physical phases;
- science observation/report is separate from objective combat truth.

Policy does not own `EncounterState`.

`EnemyDecisionContext` currently contains:
- enemy threat decision snapshots
- crew-progress effects

Keep this separation unless a concrete simplification is proven.
