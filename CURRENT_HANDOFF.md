# Space Captain — Current Handoff

Date: 2026-08-16  
Baseline master at handoff creation:
`a08f6daef8a13ab608ef10666d77f31d5f5a42d4`

Always re-fetch `master` before creating the next patch; this SHA is a
historical checkpoint, not a permanent guard.

## Current state

The bridge rebuild and current combat presentation are working and pushed.

The repository is green after the 2026-08-16 combat cleanup pass:

- `CLEAR STICKY MINE` is Engineer-only for player and enemy behavior.
- The obsolete Shared officer-task editor surface/content was removed.
- Every officer command definition belongs to exactly one scalar `role`.
- The combat playtest roadmap is documented in
  `docs/COMBAT_PLAYTEST_ROADMAP.md`.
- The Helm Evade gameplay contract is documented in `docs/HELM_EVADE.md`.
- Weapon/defense cooldowns now use commitment semantics:
  cooldown begins at the concrete commitment edge and may overlap active work.
- Cooldown recovery advances in raw encounter/world time.
- Cancellation/interruption after commitment does not refund/reset cooldown.
- Player weapon dashboard cooldown presentation now reads the independent
  cooldown clock, so Beam/SPAM/etc. can show recovery while their action phase
  is still active.
- A test-hygiene pass removed several accidental dependencies on current balance
  numbers, whole canonical loadouts, exact floating-point equality and unrelated
  full-state shapes.
- Typecheck, focused tests, full test suite and runtime smoke were green before
  this handoff refresh.

## Current combat position — Evade implemented, two blockers open

Helm Evade V0 is now implemented end-to-end far beyond the old "next atom"
state that this handoff previously described.

Implemented behavior includes:
- shared authoritative player/enemy Evade lifecycle;
- drive/content-driven warmup, duration, cooldown and Power cost;
- player Helm command/task integration;
- player and enemy production presentation;
- incoming enemy missile / Beam / new sticky-mine attachment misses while the
  player is actively EVADING;
- outgoing player Beam / missile / sticky-mine misses while the enemy is
  actively EVADING;
- SPAM remains explicitly non-evadable.

Before moving deeper into dashboard/scan roadmap work, resolve the two current
combat correctness blockers recorded in `docs/KNOWN_COMBAT_BUGS.md`:

1. SPAM currently reaches an unhandled bridge/app event path and can fail at
   runtime.
2. Enemy Evade can activate in runtime while its enable/debug flag is disabled.

Treat both as correctness fixes, not presentation redesign atoms. In particular:
- do not change SPAM's non-evadable gameplay contract while fixing its event
  transport;
- do not hide the enemy-Evade bug in presentation; trace the authoritative
  enable flag through policy/intent/execution and add regression coverage.

The previously discussed SPAM projection visual redesign is separate from the
SPAM runtime bug.

## Cooldown semantics Evade must reuse

Do not create a second cooldown model for Evade.

Current commitment edges:

- Beam Cannon: charge start.
- Missile Launcher: physical missile launch after targeting.
- SPAM Projector: channel start.
- Sticky Mine Dispenser: first physical mine launch.
- Shield Generator: Power spend / Engineer deployment start.
- Defense Turret: Power spend / Weapons loading start.

The recent migration introduced independent recovery clocks because action
phase and cooldown are no longer the same concept. Evade should follow that
established rule.

## Code-health notes for the Evade implementation

### Avoid new runner callback chains

The current encounter composition already has several runner-to-runner
callbacks.

Do not implement Evade resolution by adding a new callback maze such as
combat runner -> Helm runner -> another runner.

Physical hit resolvers should be able to ask authoritative encounter/player
state whether the ship is currently Evading.

### Player weapon dashboard transport

A concrete cleanup candidate was identified:

```text
PlayerWeaponPresentationSnapshot
    -> BridgePlayerWeaponStatusMapper
    -> BridgePlayerWeaponStatusPayload
    -> BridgePlayerShipDashboardMapper
```

The cooldown-presentation bug exposed that this intermediate semantic layer can
go stale when engine timing changes.

Do not refactor it before Evade. Revisit it after Evade and before/while doing
the player/enemy dashboard redesign. Prefer deleting a transport step over
adding another abstraction if the intermediate payload has no independent
consumer.

### Other watch points

- `BridgeEncounterEngineEventHandler` is large but still linear/readable.
  Split only if upcoming Evade/scan/status work gives it genuinely separate
  reasons to change.
- `PlayerShipStore` is large but its ownership is still coherent. Do not split
  it merely because of file size.
- Do not unify weapon/turret cooldown helpers into a generic framework just
  because their mechanics resemble each other.

## Test notes

The test-hygiene pass intentionally changed the test policy:

- content/catalog tests should verify loading/schema/catalog invariants rather
  than mirror every current balance number;
- behavior/lifecycle tests should derive timing from real definitions/tuning
  when the exact number is not the contract being tested;
- command tests should select the command/state relevant to the behavior instead
  of asserting unrelated full lists;
- derived floating-point values should use tolerant comparison;
- exhaustive command-role coverage remains intentionally strict.

When `HELM_EVADE` is added, the exhaustive command-role test should fail until
Evade is explicitly mapped to Helm. That failure is useful.

Sticky-mine lifecycle tests still contain some intertwined tuning + sequencing
expectations. Do not clean them opportunistically during Evade. Give them a
separate test-hygiene atom later so salvo/fuse/catch-up behavior is not weakened
by accident.

## After Evade

Near-term combat order remains canonical in
`docs/COMBAT_PLAYTEST_ROADMAP.md`:

1. Helm Evade.
2. Enemy dashboard redesign.
3. Player dashboard functional redesign.
4. Science enemy scan.
5. Beam Cannon semantic node targeting.
6. Shared combat-effect model.
7. Starter/basic gun experiment.
8. Weapon hit-effects pass.
9. EMP experiment.
10. Second Helm combat command.

Do not pull later roadmap systems into the Evade atom.

## Startup for the next chat

Follow `docs/WORKING_RULES.md`:

1. Read this handoff.
2. Read every Markdown document in `docs/`.
3. Re-fetch current `master`.
4. Inspect the actual source/tests touched by Evade before patching.

The historical SHA above is context only.
