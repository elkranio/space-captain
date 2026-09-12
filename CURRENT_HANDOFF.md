# Space Captain — Current Handoff

This is the only live handoff file. Git history owns completed migration/refactor history; keep this file focused on
the current repository state and the next useful boundaries.

## CURRENT STATE — 2026-09-12

```text
repository:    elkranio/space-captain
branch:        master
HEAD:          a09da207efb747be3c35277123b916d4e10fa307
baseline tree: clean before this documentation-only handoff update
status:        player SPAM prepare / commit / recovery + officer portrait states landed
typecheck:     green
tests:         119 files / 390 tests green
diff-check:    green before push
```

Fresh repository state still wins. Web Chat must fetch current `master` and inspect exact source/tests before every
patch; Codex Local uses the current workspace. Durable workflow rules live in `docs/WORKING_RULES.md`.

## Active continuation: officer progress presentation

The player SPAM lifecycle now implements the agreed three-way split:

```text
Scientist PREPARE / TARGETING task
-> COMMIT
-> autonomous projector ACTIVE
-> full projector cooldown

COMMIT
-> separate Scientist NEURAL_RECOVERY status
-> Scientist becomes available independently of projector ACTIVE
```

Landed behavior:

- PREPARE occupies Scientist, drives the SPAM tile's yellow shared progress and is player-cancellable;
- COMMIT ends the officer task, starts the harmful effect and starts `NEURAL_RECOVERY`;
- player SPAM runtime owns `activeTargetActorId`, so the effect no longer depends on a surviving officer task;
- `OfficerStatusRunner` owns temporary officer statuses independently from officer work;
- `NEURAL_RECOVERY` blocks Scientist commands and availability without pretending to be generic `STUN`;
- PURGE ends target slowdown only; projector ACTIVE and recovery keep their own clocks;
- a purged projection stays visible in red until nominal ACTIVE ends;
- the SPAM tile already uses the shared PREPARE / ACTIVE / COOLDOWN progress bar;
- all four officer portraits support `IDLE | ACTIVE | STUNNED | INCAPACITATED` assets;
- current tasks map to `ACTIVE`; Scientist `NEURAL_RECOVERY` maps to `INCAPACITATED`; otherwise portraits are `IDLE`.

Current player SPAM tuning is:

```text
warmupDurationMs:          3000
neuralRecoveryDurationMs: 3000
channelDurationMs:        20000
cooldownDurationMs:       35000
```

The 3000 ms recovery is functioning correctly but reads very quickly in play. Treat a longer duration as an explicit
tuning decision, not a timer bug.

### Next narrow atom

Add progress presentation for current officer work/status at the officer station, starting with Scientist SPAM:

- during PREPARE, the portrait is `ACTIVE` and officer progress derives from the current officer task;
- after COMMIT, the portrait is `INCAPACITATED` and recovery progress derives from `NEURAL_RECOVERY`;
- when recovery ends, the portrait returns to `IDLE` even if projector ACTIVE continues;
- keep officer progress on the officer/role surface; do not add a second recovery bar to the SPAM equipment tile;
- reuse one small explicit officer-station progress treatment so later equipment can expose Pilot/Gunner/Engineer
  work without duplicating view logic;
- do not build a generic action/status DSL, service locator or event bus.

Inspect the accepted bridge composition before choosing exact bar geometry. Keep this atom presentational: the engine
already exposes task/status `durationMs` and `elapsedMs` in snapshots.

Primary routes:

- `src/engine/encounter/model/officer_status.ts`;
- `src/engine/encounter/officer_statuses/OfficerStatusRunner.ts`;
- `src/engine/encounter/combat/spam/PlayerSpamProjectorRunner.ts`;
- `src/engine/encounter/snapshots/combat_presentation_snapshot.ts`;
- `src/app/scenes/game/bridge/controller/encounter/snapshots/BridgeEncounterSnapshotSynchronizer.ts`;
- `src/app/scenes/game/bridge/view/officer_stations/`;
- `src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeSpamProjectorTileView.ts`;
- `tests/engine/encounter/player_spam_projector.test.ts`;
- `tests/app/BridgeEncounterSnapshotSynchronizer.test.ts`.

## Remaining SPAM work after the presentation atom

- decide recovery tuning through playtest; current value is 3000 ms;
- converge enemy SPAM on the same PREPARE / COMMIT / autonomous ACTIVE / recovery ownership;
- connect future explicit `STUN`/`INTERRUPT` without letting post-COMMIT control recall a launched payload;
- use the established officer-state presentation for other equipment one narrow family at a time.

Do not reopen the completed ownership cleanup or introduce a universal phase/state framework.

## Other current gameplay boundaries

- player Beam target vocabulary is `HULL | BRIDGE | SLOT(slotId)`; dashboard input currently exposes occupied enemy
  equipment slots, while Hull/Bridge input remains future work;
- incoming enemy Beam and targeted player Shield still use temporary `HULL | DRIVE`; enemy Shield remains whole-ship;
- Sticky Mine uses one physical release per command; there is no salvo/`DISPENSING` phase;
- ordinary damage does not randomly interrupt officer work; future control must be explicit `INTERRUPT` / `STUN`;
- generic BROKEN gating and generic Engineer repair remain unfinished;
- full cooldown-after-action alignment still remains for Evade, Shield and several enemy paths;
- confirmed Evade direction still includes one Drive integrity damage after a committed maneuver terminates.

## Doc map

- `docs/WEB_CHAT_START_HERE.md` — Web Chat-only navigation cache for this continuation;
- `docs/WORKING_RULES.md` — durable collaboration, patch and validation rules;
- `docs/SPAM_LIFECYCLE.md` — SPAM ownership, presentation and remaining convergence contract;
- `docs/GAMEPLAY_CONTRACTS.md` — current implemented runtime truth;
- `docs/GAME_DESIGN.md` — confirmed intended design and labelled working theories;
- `docs/EQUIPMENT.md` — equipment status and idea bank;
- `docs/BACKLOG.md` — concrete deferred work only;
- `docs/COMBAT_PLAYTEST_ROADMAP.md` — combat gates and sequencing;
- `docs/SYSTEM_MAP.md` — durable ownership/data-flow boundaries;
- `docs/BRIDGE_ART_DIRECTION.md` — bridge/dashboard visual grammar.

## Holdouts

Do not touch these without a concrete task:

- `src/config/gameConfig.ts`;
- EndScene console logging;
- `ScreenWakeLock`;
- `BridgeMissileDebugView` and Missile debug config;
- framework/p34t `src/system/Utils.ts`, `AudioManager.ts` and `StorageManager.ts` unless active work requires them.
