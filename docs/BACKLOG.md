# Space Captain — Backlog

Concrete deferred work only. Completed work and uncommitted idea fragments do not stay here.

Near-term combat sequencing lives in `COMBAT_PLAYTEST_ROADMAP.md`.

## Gameplay

### Encounter-end module reset

Confirmed intended lifecycle:

- system/module integrity is encounter-local;
- surviving modules return to max integrity after the encounter;
- hull damage does not auto-reset;
- hull repair remains station-only.

Implement as one explicit encounter-end lifecycle atom when that write-back path is touched.

### Escape flow

Current intended dependency:

1. Drive must be operational.
2. Engineer repairs it first when broken.
3. Helm initiates escape.
4. Whether other officers must be idle remains a design decision for the implementation pass.

Escape is not Evade.

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

### Legacy missile assets

After Graphics-based incoming/outgoing Missile presentation is confirmed as the only runtime path:

- search manifest/runtime references;
- remove only confirmed-unused old Missile sprite/raw assets;
- repack textures;
- validate runtime.
