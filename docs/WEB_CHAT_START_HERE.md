# Space Captain — Web Chat Start Here

> **WEB CHAT ONLY.** This is a navigation cache, not a second handoff or gameplay contract.

## Start

1. Read `CURRENT_HANDOFF.md` and `docs/WORKING_RULES.md`.
2. Fetch fresh `master`; the repository is authoritative.
3. Read `docs/SPAM_LIFECYCLE.md` and the exact source/tests for the current atom.
4. Keep the patch narrow and use the Web Chat patch workflow from `WORKING_RULES.md`.

Checkpoint when this cache was written:

```text
master: a09da207efb747be3c35277123b916d4e10fa307
typecheck: green
tests: 119 files / 390 tests green
```

If fresh `master` differs, inspect the new source and use it instead of this hash.

## Current continuation

Player SPAM prepare / commit / recovery and officer portrait switching are landed. The next narrow presentation atom
is officer progress at the officer station, beginning with Scientist:

```text
SPAM PREPARE task
-> ACTIVE portrait + task progress

COMMIT
-> INCAPACITATED portrait + NEURAL_RECOVERY progress

recovery ends
-> IDLE portrait, independently of projector ACTIVE
```

The SPAM equipment tile already has the shared PREPARE / ACTIVE / COOLDOWN progress bar. Do not put Scientist neural
recovery on that tile. The new treatment belongs to the officer/role surface and should be reusable for later
Pilot/Gunner/Engineer work without creating a universal state-machine abstraction.

Current recovery is 3000 ms. The timer is correct; it simply looks brief. Retuning it requires an explicit gameplay
choice.

## Primary source routes

- engine status model/clock:
  `src/engine/encounter/model/officer_status.ts`,
  `src/engine/encounter/officer_statuses/OfficerStatusRunner.ts`;
- SPAM commit:
  `src/engine/encounter/combat/spam/PlayerSpamProjectorRunner.ts`;
- snapshot transport:
  `src/engine/encounter/snapshots/combat_presentation_snapshot.ts`,
  `src/app/scenes/game/bridge/controller/encounter/snapshots/BridgeEncounterSnapshotSynchronizer.ts`;
- officer presentation:
  `src/app/scenes/game/bridge/view/officer_stations/`;
- existing equipment progress reference:
  `src/app/scenes/game/bridge/view/captain_dashboard/BridgeEquipmentProgressBarView.ts`,
  `src/app/scenes/game/bridge/view/captain_dashboard/bridge_equipment_progress_presentation.ts`;
- focused tests:
  `tests/engine/encounter/player_spam_projector.test.ts`,
  `tests/app/BridgeEncounterSnapshotSynchronizer.test.ts`.

## Durable authority

- current checkpoint and next boundary → `CURRENT_HANDOFF.md`;
- workflow and patch rules → `docs/WORKING_RULES.md`;
- current runtime → `docs/GAMEPLAY_CONTRACTS.md`;
- intended SPAM ownership → `docs/SPAM_LIFECYCLE.md`;
- visual grammar → `docs/BRIDGE_ART_DIRECTION.md`;
- exact behavior → fresh source and tests.

Events mean what happened; snapshots mean what is true now. Officer progress is current state and should travel through
the existing snapshot synchronization path.
