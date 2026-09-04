# Space Captain — Backlog

Concrete deferred work only. Completed work and uncommitted idea fragments do not stay here.

Canonical intended mechanics live in `GAME_DESIGN.md`. Near-term combat sequencing lives in
`COMBAT_PLAYTEST_ROADMAP.md`.

## Gameplay

### Encounter-end lifecycle

Implement one explicit post-encounter lifecycle when this path is touched:

- surviving modules return to max integrity;
- Power Core returns to full;
- temporary combat tasks/effects/threat state is cleared according to encounter outcome;
- Hull damage persists;
- spent ammunition persists.

Do not create post-combat waiting/repair optimization for state that can be restored for free.

### Evade Drive wear

Confirmed intended behavior, not yet implemented:

- once Evade is committed, its eventual end deals 1 Drive module damage;
- apply the damage at Evade end, not start;
- normal completion, manual cancellation and Pilot Stun all still apply the damage;
- generic task `INTERRUPT` should not cancel an active Evade;
- the final Drive integrity point can power one last Evade and break when it ends.

### Cooldown starts after active work

Bring equipment lifecycles into line with the confirmed per-system table in `GAME_DESIGN.md`
("Equipment cooldown and cancellation").
The current per-system timing table and source/test references live in `GAMEPLAY_CONTRACTS.md`.

- remove cooldown overlap with active work where it still exists (Beam, Evade, Shield, mine salvos, enemy Turret/SPAM);
- start a full cooldown on termination, including an interrupted mine operation before its first launch;
- preserve free Missile-targeting cancellation: no ammo spent and no cooldown, including target loss;
- target loss during active Beam/Turret work starts a full cooldown;
- preserve SPAM's lack of manual cancellation; incoming damage can interrupt its work;
- preserve spent CORE and launched-mine costs, and retain unlaunched ammunition;
- update timing tests deliberately: some currently require the old overlapping recovery behavior.

Current priority lives in `CURRENT_HANDOFF.md` at the repository root. Inspect exact source/tests and split the work into
narrow atoms as needed. Documentation corrections have not implemented these timing changes. Evade Drive wear remains
the explicit TODO above; do not assume it is already wired at the new cooldown boundary.

### Escape flow

Confirmed intended dependency:

1. Drive must be operational.
2. Pilot performs the timed Escape task.
3. Other officers do not need to be idle.
4. Pilot interruption/Stun loses current Escape progress; the next attempt starts from zero.
5. Successful Escape ends and cleans the encounter; the old fight is not resumed later.

Remove any generic `all officers idle` requirement from local travel/escape paths when those paths are next touched. For
location-bound non-combat tasks, leaving should cancel/forfeit the task naturally instead of globally blocking travel.

### Baseline gun

Add the baseline-gun concept (Basic Gun / Autocannon) during the weapon/build-diversity pass. These are two working names
for one unimplemented concept. Keep no CORE cost; decide ammunition rules when implementing it.

It should become weak without investment but remain endgame-viable when the player deliberately builds/upgrades around
it.

## Test hygiene

### Sticky-mine timing suites

If maintenance becomes expensive, separate content tuning from strict sequencing/fuse/catch-up behavior:

- derive balance values from definitions where the number itself is not the contract;
- preserve strict salvo/fuse/catch-up assertions;
- keep command-role coverage strict.

Do not weaken behavior coverage merely to shorten tests.

## Cleanup

### Retained Missile debug tooling

`BridgeScene` no longer instantiates the old general debug layer. Keep `BridgeMissileDebugView` and
`bridge_missile_debug_config.ts` for upcoming Missile attack visual tests. They are temporary tooling, potentially retained
for a long time; do not delete `src/app/scenes/game/bridge/debug_view/**` as general cleanup.

Removal requires a separate explicit task after that testing workflow is replaced. Dependency cleanup is also separate
work and must inspect actual uses before removing packages.
