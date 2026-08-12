# Space Captain — Project Context

Updated: 2026-08-12
Reference HEAD before this docs atom: `fb170a1ea88d8feb49a5c5ff7655982e55edf7c6`

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
- user runs typecheck/tests/runtime smoke and pushes commits

## Working style

- Russian, short/direct, practical.
- Small coherent atoms.
- Discuss architecture before broad changes.
- Refactor only when it reduces cognitive load or removes real duplication/hops.
- Avoid speculative frameworks, generic registries and tiny classes “на будущее”.
- Preserve engine/app boundary: engine owns gameplay truth; app maps snapshots/events to presentation.
- GitHub access is read-only unless the user explicitly asks otherwise.
- Before producing a patch, fetch fresh `master` HEAD and inspect the exact current files/callers/tests.

## Patch delivery rules

These are mandatory.

1. **Every patch script is delivered inside a `.zip`. Never hand over a bare patch script.**
2. **On successful completion, the patch script deletes its own `.mjs` file.**
3. Guard the exact expected HEAD when the atom was prepared against a known commit.
4. Guard tracked clean state before writing, unless the patch is explicitly a recovery atom for a known dirty state.
5. Prefer exact/contextual replacements over heuristic broad transforms.
6. Preserve source EOL style; Windows CRLF is common.
7. Validate all planned transforms before the first write when practical.
8. Finish with post-assertions and `git -c core.safecrlf=false diff --check`.
9. A failed patcher should remain on disk for diagnosis.
10. If a recovery patch replaces failed patchers, successful recovery should also remove known obsolete ancestor patchers.

Known pitfalls:
- `git grep` ignores untracked files.
- `git status --porcelain` has a two-character status field.
- callback return strings in `String.replace(regex, callback)` do not expand `$1`.
- broad AST/list removal can swallow newlines or unrelated fixtures.
- tests can be green while formatting is damaged; inspect diff shape too.

## Current gameplay / bridge state

The bridge has four active officer roles:

- Science
- Weapons
- Helm
- Engineer

The captain dashboard is becoming the main command surface. The old officer context menu still exists as legacy coverage and should not be removed until the dashboard covers the needed commands.

### Captain dashboard

Left side is stable player-ship state:

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
- incoming missile threats
- incoming laser threats

Dashboard buttons use real `AvailableOfficerCommand` values. Views must not reproduce engine availability rules.

Current button presentation is intentionally role-neutral:
- active: dark neutral blue + steel-blue border + white text
- non-interactive/busy/engaged: one neutral disabled gray treatment
- red/blue remain only where they encode beam choice

Threat-row geometry is a prototype, not a contract. Future final art may replace rows with much more compact tiles. Do not build a generic threat-layout framework around the current row shape.

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
- player shield visual exists, including final-second blink and absorbed-hit flash/fade
- incoming laser event distinguishes `HIT` vs `ABSORBED`
- beam endpoint uses hull impact point for HIT and shield impact point for ABSORBED

Temporary whole-hull visual anchors live in `bridge_player_hull_combat_points.ts`. This is intentionally not a generic targeting registry.

Still missing:
- Shield Emitter break mutation and immediate active-shield removal on break
- Defense Capacitor broken status
- minimal player Point Defense installation/status and repair flow
- tuning

## Enemy behavior state

Enemy behavior is split deliberately:

- `EnemyDecisionPolicy` chooses work
- `EnemyTaskScheduler` validates/schedules work and starts physical weapon phases
- `EnemyCrewTaskRunner` owns task lifecycle
- combat weapon runners own weapon/projectile/mine physics/lifecycle
- threat observation / science intel are separate from objective truth

Do not collapse these back into one enemy god object.

## NEXT CHAT: enemy sticky mines on captain context

This is the next coding target.

Fresh repo findings at `fb170a1e...`:

- `GENERIC_STICKY_MINES_00` already exists.
- `GENERIC_DEFENSE_SANDBOX_00` is still a laser-only sandbox enemy.
- `EnemyDecisionPolicy` already treats a ready sticky-mine dispenser as a Weapons offensive weapon.
- `EnemyTaskScheduler` already starts generic enemy weapon targeting.
- `CombatStickyMineRunner` already owns both directions and already:
  - advances enemy dispenser TARGETING → DISPENSING → COOLDOWN;
  - creates each enemy mine as its own `StickyMineState`;
  - targets `PLAYER_SHIP`;
  - gives each mine its own fuse timer;
  - emits attach/detonation events;
  - damages player hull on detonation.
- `getStickyMineSnapshots()` already returns player-attached hostile mines individually and includes clear-state flags.
- `BridgeEncounterSnapshotSynchronizer` already feeds those snapshots to the existing bridge sticky-mine presentation.
- `BridgeCaptainCombatContextMapper` currently transports only missiles + lasers. Captain context has no sticky-mine threat payload/view yet.

Therefore the next atom should primarily be **sandbox + captain-dashboard transport/presentation**, not a new mine domain.

Likely scope:
1. switch the current defense sandbox enemy from laser to sticky-mine dispenser;
2. transport current hostile mine snapshots into captain combat context;
3. show each mine independently (1 runtime mine = 1 captain threat);
4. reuse existing real clear-mine commands/availability rather than inventing UI rules;
5. keep threat visuals simple/provisional.

Do not in this atom:
- aggregate a salvo into one domain threat;
- invent a generic threat registry;
- redesign final threat tile/row geometry;
- alter mine physics unless a real gap is found;
- mix in spam/threat UI work.

Before coding, re-fetch fresh HEAD and inspect:
- `src/engine/content/presets/ships.ts`
- `src/engine/content/presets/sticky_mine_dispensers.ts`
- `src/engine/encounter/combat/weapons/sticky_mine/CombatStickyMineRunner.ts`
- `src/engine/encounter/combat/enemy/EnemyDecisionPolicy.ts`
- `src/engine/encounter/combat/enemy/EnemyTaskScheduler.ts`
- `src/engine/encounter/combat/queries/get_sticky_mine_snapshots.ts`
- `src/engine/encounter/commands/handlers/clear_sticky_mine_command_handler.ts`
- `src/app/scenes/game/bridge/controller/captain_dashboard/BridgeCaptainCombatContextMapper.ts`
- `src/app/scenes/game/bridge/controller/encounter/snapshots/BridgeEncounterSnapshotSynchronizer.ts`
- captain combat-context event types and views
- all mapper/synchronizer tests and callers before changing required inputs

## Architecture conclusions already settled

Leave these alone unless evidence changes:

- `BridgeController` is a healthy composition root.
- `EncounterEngine` is a legitimate facade/composition root.
- `bridge_event.ts` is long but cohesive declarative contract; do not split just for length.
- `BridgeEncounterEngineEventHandler` is a transport/presentation boundary.
- `BridgeEncounterRuntimeSynchronizer` is EncounterEngine → GameRuntime persistence.
- `BridgeEncounterSnapshotSynchronizer` transports continuously changing read models.
- `BridgePlayerWeaponStatusMapper` and `BridgePlayerShipDashboardMapper` have different responsibilities and should stay separate.
