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

Confirmed intended behavior, not yet assumed implemented:

- once Evade is committed, its eventual end deals 1 Drive module damage;
- apply the damage at Evade end, not start;
- normal completion, manual cancellation and Helm Stun all still apply the damage;
- generic task `INTERRUPT` should not cancel an active Evade;
- the final Drive integrity point can power one last Evade and break when it ends.

### Escape flow

Confirmed intended dependency:

1. Drive must be operational.
2. Helm performs the timed Escape task.
3. Other officers do not need to be idle.
4. Helm interruption/Stun loses current Escape progress; the next attempt starts from zero.
5. Successful Escape ends and cleans the encounter; the old fight is not resumed later.

Remove any generic `all officers idle` requirement from local travel/escape paths when those paths are next touched. For
location-bound non-combat tasks, leaving should cancel/forfeit the task naturally instead of globally blocking travel.

### Beam Power Core cost

Intended player Beam spends shared Power Core. Current runtime contract may still differ. Implement deliberately when
player Beam semantic-targeting slice is touched.

### Baseline gun

Add a no-ammo/no-CORE Basic Gun during the weapon/build-diversity pass.

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

### Disposable bridge debug layer

When the combat-debug workflow is no longer needed:

- remove `src/app/scenes/game/bridge/debug_view/**`;
- remove `phaser3-rex-plugins` if no real runtime use remains;
- validate the package lock after uninstall.
