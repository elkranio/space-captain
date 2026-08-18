# Space Captain — Backlog

Last refreshed: 2026-08-18.

This is an active backlog, not a history log.
Completed implementation notes belong in the root `../CURRENT_HANDOFF.md` only
when they are needed to continue current work.

The canonical near-term combat feature order lives in
`COMBAT_PLAYTEST_ROADMAP.md`.

## P0 — combat correctness blockers

No current P0 combat correctness blockers are recorded.

If playtesting exposes a new correctness blocker, record it in
`KNOWN_COMBAT_BUGS.md` and clear it before treating dependent playtest evidence
as trustworthy.

Helm Evade V0 is implemented end-to-end for player/enemy lifecycle and current
missile/Beam/sticky-mine physical miss interactions.

## P1 — combat readability / build-space roadmap

After the current cognitive-load refactor sprint, follow
`COMBAT_PLAYTEST_ROADMAP.md`:

1. enemy dashboard redesign;
2. player dashboard functional redesign;
3. Science enemy scan;
4. Beam Cannon semantic node targeting;
5. shared combat-effect model;
6. starter/basic gun experiment;
7. weapon hit-effects pass;
8. EMP experiment;
9. second Helm combat command.

Do not duplicate the detailed contracts here.

## P1 — code-health cleanup

### Combat event handler watch point

`BridgeEncounterEngineEventHandler` is large but still linear.

Split only when upcoming scan/status work creates a clear cohesive sub-handler
such as combat VFX events. Do not create one class per event.

### PlayerShipStore watch point

Keep current ownership unless concrete duplication/ambiguity appears.

Small private helpers for repeated weapon lookup/validation are acceptable if
they remain boring and obvious. Do not split the store solely because it is
large.

## P2 — test hygiene follow-up

### Sticky-mine timing suites

Sticky-mine tests still mix:
- content tuning;
- salvo sequencing;
- fuse timing;
- large-step/catch-up semantics.

Do a dedicated cleanup later.

Goal:
- derive balance values from definitions where they are not the contract;
- preserve strict sequencing/fuse/catch-up assertions;
- do not weaken the tests merely to reduce maintenance.

Keep exhaustive command-role coverage strict.

## P2 — escape flow

Current target dependency:

1. drive/engine operational;
2. Engineer repairs it first when damaged;
3. Helm initiates escape;
4. other-officer availability requirement remains to be finalized during the
   escape implementation.

Do not fold escape into Evade.

## P2 — combat presentation polish

### Outgoing missile polish

Current pass is usable. Revisit only after higher-value gameplay work:

- trajectory extremes / clipping;
- launch feel;
- scale falloff;
- trail density/decay.

### Incoming/outgoing missile cleanup

- Consider short trail decay when a missile is intercepted instead of
  disappearing instantly.
- If readability needs it, test a very short final missile
  point-of-no-return/commit presentation rather than making the whole terminal
  phase un-interceptable.
- Continue using shared screen-shake presets instead of ad-hoc values.

## P2 — cleanup

### Disposable bridge debug layer

After the current combat-debug workflow is no longer needed:

- remove `src/app/scenes/game/bridge/debug_view/**`;
- remove the BridgeScene debug hook;
- remove `phaser3-rex-plugins` if no real runtime use remains;
- validate package-lock after uninstall.

Do this as a dedicated cleanup atom.

### Legacy missile assets

After both incoming/outgoing Graphics-based missile presentations are proven:

- search all manifest/runtime references;
- remove only confirmed-unused old missile sprite/raw assets;
- repack textures;
- validate runtime.

Do not delete assets from memory/assumption alone.

## Ongoing code-health rule

Every few feature atoms, do a focused cognitive-load pass:

- identify god objects / callback mazes;
- flatten needless context hopping;
- centralize genuinely shared startup/config data;
- simplify signatures that became difficult to read;
- prefer boring explicit code over clever abstractions.

Do not refactor stable code merely to make architecture look more sophisticated.
