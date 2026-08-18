# Space Captain — Current Handoff

Date: 2026-08-18
Baseline master at handoff refresh:
`55614759e9d95ddb42a3802d8d04dfffe0d99eea`

Always re-fetch `master` before creating the next patch; this SHA is a
historical checkpoint, not a permanent guard.

## Current state

The bridge rebuild and current combat presentation are working and pushed.

The repository is green at the current cognitive-load refactor checkpoint.

Important current contracts:
- `CLEAR STICKY MINE` is Engineer-only for player and enemy behavior.
- Every officer command definition belongs to exactly one scalar `role`.
- Helm Evade V0 is implemented end-to-end for player and enemy.
- SPAM remains explicitly non-evadable.
- Weapon/defense cooldowns use commitment semantics and independent recovery
  clocks.
- The opening disruption pulse is a real one-shot combat mechanic. Its automatic
  use is currently controlled from the app-side combat-start debug boundary
  while Evade/combat behavior is being tested; do not delete it as dead code.
- The previously tracked SPAM bridge-event failure and enemy-Evade debug-start
  leak are fixed and regression-covered.
- `docs/KNOWN_COMBAT_BUGS.md` currently records no active correctness blocker.

## Cognitive-load refactor position

The current refactor sprint has reached the final mechanical-cleanup pass.

The app/bridge transport pass is closed:
- the redundant player-weapon dashboard transport layer was removed;
- the final dashboard mapping now consumes the nearest safe presentation source;
- no further split of `BridgeEncounterEngineEventHandler` is justified merely
  because the file is large.

A proposed cleanup to inject one shared
`BridgeEncounterPersistenceSynchronizer` instance into both controller and
event-handler paths was rejected after auditing call sites. The synchronizer is
stateless, the mapping responsibility is already centralized, and the change
would add constructor plumbing without removing a second truth source.

Continue the sprint only for concrete RED findings. Do not manufacture cleanup
atoms from YELLOW watch points.

## Combat state worth preserving

Helm Evade currently includes:
- shared authoritative player/enemy Evade lifecycle;
- drive/content-driven warmup, duration, cooldown and Power cost;
- player Helm command/task integration;
- player and enemy production presentation;
- incoming enemy missile / Beam / new sticky-mine attachment misses while the
  player is actively EVADING;
- outgoing player Beam / missile / sticky-mine misses while the enemy is
  actively EVADING.

Established weapon/defense commitment edges:
- Beam Cannon: charge start.
- Missile Launcher: physical missile launch after targeting.
- SPAM Projector: channel start.
- Sticky Mine Dispenser: first physical mine launch.
- Shield Generator: Power spend / Engineer deployment start.
- Defense Turret: Power spend / Weapons loading start.

Action phase and cooldown are separate concepts. Do not reintroduce phase-based
cooldown presentation.

## Code-health watch points

- `BridgeEncounterEngineEventHandler` is large but still linear/readable.
  Split only if future scan/status/VFX work creates a genuinely cohesive
  sub-handler.
- `PlayerShipStore` is large but its ownership is still coherent. Do not split
  it solely because of file size.
- Do not unify weapon/turret/Evade cooldown helpers into a generic framework
  merely because the mechanics resemble each other.
- Sticky-mine lifecycle tests still mix tuning, sequencing, fuse and catch-up
  expectations. Give them a dedicated test-hygiene pass later rather than
  weakening them opportunistically.

## Near-term gameplay after the refactor

The canonical order lives in `docs/COMBAT_PLAYTEST_ROADMAP.md`.

Next steps:
1. enemy dashboard redesign;
2. player dashboard functional redesign;
3. Science enemy scan;
4. Beam Cannon semantic node targeting;
5. shared combat-effect model;
6. starter/basic gun experiment;
7. weapon hit-effects pass;
8. EMP experiment;
9. second Helm combat command.

## Startup for the next chat

Follow `docs/WORKING_RULES.md`:

1. Read this handoff.
2. Read every Markdown document in `docs/`.
3. Re-fetch current `master`.
4. Inspect the actual source/tests touched by the next atom before patching.

The historical SHA above is context only.
