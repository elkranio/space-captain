# Space Captain — Backlog

Active deferred work only.

Completed work does not stay here.
The canonical near-term combat sequence lives in `COMBAT_PLAYTEST_ROADMAP.md`.

If a correctness blocker appears, put it at the top of this file while it is
active and remove it after the fix is regression-covered.

## Test hygiene

### Sticky-mine timing suites

Sticky-mine tests still mix:
- content tuning;
- salvo sequencing;
- fuse timing;
- large-step/catch-up semantics.

When this becomes expensive to maintain, do one dedicated cleanup:
- derive balance values from definitions where they are not the contract;
- preserve strict sequencing/fuse/catch-up assertions;
- keep command-role coverage strict.

Do not weaken tests merely to make them shorter.

## Gameplay follow-up

### Escape flow

Current intended dependency:
1. drive/engine must be operational;
2. Engineer repairs it first when damaged;
3. Helm initiates escape;
4. whether other officers must be idle remains a design decision for the
   implementation pass.

Escape is not Evade.

## Presentation polish

### Missile presentation

Current incoming/outgoing presentation is usable.

Revisit only when runtime evidence justifies it:
- trajectory extremes/clipping;
- launch feel;
- scale falloff;
- trail density/decay;
- short trail decay after interception;
- a very short terminal commit cue if readability needs it.

Continue using shared screen-shake presets rather than ad-hoc values.

## Cleanup

### Disposable bridge debug layer

When the current combat-debug workflow is no longer needed:
- remove `src/app/scenes/game/bridge/debug_view/**`;
- remove the BridgeScene debug hook;
- remove `phaser3-rex-plugins` if no real runtime use remains;
- validate the package lock after uninstall.

Do this as one dedicated cleanup atom.

### Legacy missile assets

After the Graphics-based incoming/outgoing missile presentations are confirmed
as the only runtime path:
- search manifest/runtime references;
- remove only confirmed-unused old missile sprite/raw assets;
- repack textures;
- validate runtime.

Do not delete assets from memory or assumption.
