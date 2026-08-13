# Space Captain — Project Context

Updated: 2026-08-13
Reference HEAD before this docs atom: `79ec6e607b7f5e7c55077469594e7b4990b337ae`

This is the primary handoff for a fresh chat. Treat code at the current GitHub `master` as source of truth and re-check HEAD before every coding atom.

## Read order

1. `PROJECT_CONTEXT.md`
2. `GAMEPLAY_CONTRACTS.md`
3. `SYSTEM_MAP.md`
4. `CAPTAIN_DASHBOARD_HANDOFF.md`
5. `BACKLOG.md`
6. `BRIDGE_ART_DIRECTION.md` only when visual/layout work is relevant

Do not reconstruct current behavior from old chats when the repo can answer it.

## Project / stack

- Repo: `elkranio/space-captain`
- Branch: `master`
- Phaser 3 + TypeScript + p34t
- 1280×720
- core engine: `src/engine/...`
- bridge app/controller/view: `src/app/scenes/game/bridge/...`
- atlas key currently `atlas`
- TypeScript `strict`, `noUnusedLocals` and `noUnusedParameters` are enabled
- user runs typecheck/tests/runtime smoke and pushes commits

## Working style

- Russian, short/direct, practical.
- Small coherent atoms.
- Discuss architecture before broad changes.
- Refactor only when it reduces cognitive load or removes real duplication/hops.
- Prefer explicit boring code over clever generic abstractions.
- Avoid speculative frameworks, generic registries and tiny classes “на будущее”.
- Preserve engine/app boundary: engine owns gameplay truth; app maps snapshots/events to presentation.
- GitHub access is read-only unless the user explicitly asks otherwise.
- Before producing a patch, fetch fresh `master` HEAD and inspect exact current files/callers/tests.

## Patch delivery rules

These are mandatory.

1. **Every patch script is delivered inside a `.zip`. Never hand over a bare patch script.**
2. **On successful completion, the patch script deletes its own `.mjs` file.**
3. Guard the exact expected HEAD when the atom was prepared against a known commit.
4. Guard tracked clean state before writing, unless the patch is explicitly a recovery atom for a known dirty state.
5. Prefer exact/contextual replacements over heuristic broad transforms.
6. Preserve source EOL style; Windows CRLF is common.
7. Validate planned transforms before the first write when practical.
8. Normalize touched text files to exactly one newline at EOF before validation.
9. Finish with post-assertions and `git -c core.safecrlf=false diff --check`.
10. A failed patcher should remain on disk for diagnosis.
11. If a recovery patch replaces failed patchers, successful recovery should also remove known obsolete ancestor patchers.
12. Before deleting a compatibility helper/query, search **all** source + test consumers first.

Known pitfalls:
- `git grep` ignores untracked files.
- `git status --porcelain` has a two-character status field.
- callback return strings in `String.replace(regex, callback)` do not expand `$1`.
- broad regex/list transforms can hit identical blocks in multiple methods.
- regex replacements around TypeScript generic return types must preserve punctuation such as `Extract<`.
- tests can be green while formatting is damaged; `diff --check` is part of completion.
- self-delete only happens after all validation; a failed validation leaves patchers behind intentionally.

## Current gameplay / bridge state

The bridge has four active officer roles:

- Science
- Weapons
- Helm
- Engineer

The captain dashboard is becoming the main command surface. The old officer context menu still exists as legacy coverage and should not be removed until the dashboard covers every required command path.

### Captain dashboard

Left side is stable player-ship state/actions:

- HULL
- shared DEF capacitor
- ENGINE
- MISSILE
- LASER
- MINES
- SPAM

Right side is current combat context:

- one enemy ship summary
- enemy HULL + DEF
- incoming missiles
- incoming lasers
- hostile sticky mines
- hostile SPAM channels

Dashboard buttons bind to real `AvailableOfficerCommand` values. Views must not reproduce engine availability rules.

Threat-row geometry is still a prototype, not a contract. Do not build a generic threat-row framework around the current shape.

Shared dashboard visual semantics now live near the dashboard:
- repeated row/icon/action/status colors are centralized
- countdown formatting is centralized
- geometry remains local to concrete views

### Defense / shield slice

Current player defense contract:

- one shared Defense Capacitor
- Point Defense and Shield Emitter consume its charges
- Shield Emitter is a persistent installed system
- Engineer `DEPLOY SHIELD` spends a DEF charge at task start
- cancellation/interruption does not refund the charge
- task completion creates encounter-local Active Shield
- Active Shield absorbs one incoming laser hit, then disappears
- it also expires by TTL
- current basic shield duration: 5000 ms
- current emitter cooldown: 5000 ms
- player and enemy shield views share presentation timing/alpha helpers but keep separate lifecycle/position/scale ownership
- incoming laser event distinguishes `HIT` vs `ABSORBED`

Temporary whole-hull visual anchors live in `bridge_player_hull_combat_points.ts`. This is intentionally not a generic targeting registry.

Still missing:
- Shield Emitter break mutation and immediate active-shield removal on break
- Defense Capacitor broken status
- minimal player Point Defense installation/status and repair flow
- tuning

## Combat read-model architecture

`EncounterState` is the authoritative mutable truth.

`CombatPresentationSnapshot` is a detached one-frame read model built from that truth. It currently includes:

Player:
- hull
- drive
- DEF presentation state
- Shield Emitter
- Active Shield
- player weapons
- officer availability
- officer tasks

Combat/context:
- enemy ship presentation snapshots
- incoming/outgoing missiles
- outgoing sticky mines
- sticky-mine snapshots
- laser threats
- SPAM channels
- `commandsByRole`

The snapshot is not cached and is not a second state.

`BridgeEncounterController` captures one coherent combat snapshot after the engine step and reuses it across current presentation consumers. Officer stations no longer reconstruct a combat-frame view by separately walking tasks, availability, telemetry and commands.

Persistent player ship presentation state that belongs in `GameRuntime` is synchronized from the frame snapshot, not from a duplicate DEF event stream.

Travel/noninteractive presentation clearing explicitly clears stale combat context and enemy shields.

## Enemy behavior state

Enemy behavior remains deliberately split:

- `EnemyDecisionPolicy` chooses work
- `EnemyTaskScheduler` assembles explicit decision context, validates/schedules work and starts physical phases
- `EnemyCrewTaskRunner` owns crew-task lifecycle
- combat weapon runners own physical weapon/projectile/mine lifecycle
- threat observation / science intel are separate from objective truth

`EnemyDecisionPolicy` no longer owns or optionally receives full `EncounterState`.

Scheduler supplies a small `EnemyDecisionContext` containing:
- `EnemyThreatDecisionSnapshot[]`
- canonical `CrewProgressEffect[]`

Threat decision snapshots expose only the physical facts policy needs. Hidden missile truth still stays behind the Science observation/intel boundary.

SPAM slowdown/purge decisions and lifecycle validation use canonical `getActiveCrewProgressEffects()`. The transitional `getActivePlayerSpamChannels()` adapter has been removed.

Do not collapse this separation back into an enemy god object.

## Refactor checkpoint — completed 2026-08-13

The broad cleanup pass is complete. Important completed items:

- unified `CombatPresentationSnapshot`
- `EnemyThreatDecisionSnapshot` query for AI decisions
- duplicate public combat presentation getters removed
- officer stations moved onto the coherent combat snapshot
- travel presentation reset fixed
- dead DEF charge-spent event removed
- strict unused TS checks enabled
- dashboard visual tokens/countdown formatting deduplicated
- player/enemy shield presentation math deduplicated
- SPAM compatibility query removed; policy now consumes explicit decision context

Do **not** continue refactoring just because files are long. Return to feature/gameplay work unless a concrete new ownership/duplication problem appears.

## Architecture conclusions already settled

Leave these alone unless evidence changes:

- `BridgeController` is a healthy composition root.
- `EncounterEngine` is a legitimate facade/composition root.
- `CombatRunner` is long but cohesive; do not split for line count.
- `EncounterStateStore` is a facade over specialized stores, not a god-object bug by itself.
- `bridge_event.ts` is a long but cohesive declarative contract.
- `BridgeEncounterEngineEventHandler` is a transport/presentation boundary.
- `BridgeEncounterRuntimeSynchronizer` is EncounterEngine → GameRuntime persistence.
- `BridgeEncounterSnapshotSynchronizer` transports continuously changing read models.
- `BridgePlayerWeaponStatusMapper` and `BridgePlayerShipDashboardMapper` have different responsibilities and should stay separate.
- current hypothetical-state availability query is intentionally left simple.
- specialized threat rows and weapon runners should remain specialized until real repeated behavior demands abstraction.
