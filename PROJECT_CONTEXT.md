# Space Captain — Project Context

Living handoff. Read first in every new development chat.

Last updated: `2026-08-11`

Latest verified `master`:

```text
5a37de2d24c8212c8ff1251ab097f75b293e5f9b
```

Read order:

```text
PROJECT_CONTEXT.md
REFACTOR_AUDIT_HANDOFF.md
CAPTAIN_DASHBOARD_HANDOFF.md
SYSTEM_MAP.md
GAMEPLAY_CONTRACTS.md
BACKLOG.md
```

Historical/specialized docs only when needed:

```text
ENEMY_BEHAVIOR_HANDOFF.md
BRIDGE_ART_DIRECTION.md
BRIDGE_V01_HANDOFF.md
COMMAND_PALETTE_ART_PLAN.md
```

## Project direction

Space Captain is a comedic retro sci-fi bridge-command roguelite.

Core interaction:

```text
situation appears
→ captain sees valid responses
→ captain chooses intent
→ UI shows responsible officer
→ officer becomes occupied
→ bridge shows work/reaction/result
```

Complexity should come from officer contention, incomplete information, task commitment,
limited resources, timing and multiple acceptable responses.

Avoid bullet hell, APM tests, spreadsheet combat, mandatory counter tables and
role-menu memorization.

## Collaboration / repo workflow

Repository: `elkranio/space-captain`, branch `master`.

Rules:

- GitHub read-only for assistant; user applies/tests/pushes.
- Before every code atom, read fresh remote `master`.
- After user says `pushed`, verify fresh HEAD and changed files.
- Deliver repo edits as guarded `.mjs` apply script inside ZIP.
- No dirty-tree guard unless requested.
- Preflight before write; no destructive rollback by default.
- Prefer small coherent atoms and lower cognitive load over architecture aesthetics.
- Russian, short/direct, critical when needed.

Validation:

```bash
npm run typecheck
npm test
```

Runtime smoke when behavior/presentation changes.

## Current active phase

```text
CLEANUP / ARCHITECTURE AUDIT
BEFORE SEMANTIC LASER TARGETING
```

Order:

```text
1. legacy/dead concepts
2. god objects + unnecessary segmentation
3. naming/model truth
4. transport/spaghetti/callback graph
5. final consistency/tests/runtime
6. semantic laser targeting
```

Legacy cleanup is effectively complete. Final sweep found only a stale comment
mentioning deleted `BridgeUiView`; it was removed and pushed.

Immediate next atom:

```text
remove old LOCAL SPACE / GameOverlay presentation island
```

Then inspect real god-object/high-context candidates.

See `REFACTOR_AUDIT_HANDOFF.md`.

## Captain dashboard status

Player-side left dashboard is implemented.

Current view structure:

```text
src/app/scenes/game/bridge/view/captain_dashboard/
├─ BridgeCaptainDashboardView.ts
└─ player_ship/
   ├─ BridgePlayerShipDashboardView.ts
   ├─ status/BridgePlayerShipStatusStripView.ts
   └─ systems/
      ├─ BridgePlayerShipSystemsView.ts
      └─ BridgePlayerShipSystemRowView.ts
```

Status:

```text
HULL
DEF
ENGINE
```

System rows:

```text
MISSILE → WPN
LASER   → WPN
MINES   → WPN
SPAM    → SCI
```

Action states distinguish:

```text
ACTIVE
DISABLED_SYSTEM
DISABLED_OFFICER_BUSY
ENGAGED_CURRENT_WORK
```

Old officer context menu remains temporarily for navigation/noncombat commands
and cancellation.

## Current bridge composition

`BridgeView` currently owns:

```text
BridgeSpaceView
BridgeCombatView
BridgeInteriorView
BridgeTargetingWarningView
BridgeOfficerStationsView
BridgeCaptainDashboardView
BridgeOfficerBarksView
BridgeOfficerContextMenuView
```

`BridgeUiView`, old enemy telemetry/debug presentation panels and old ship-status
presentation are gone.

## Defense truth

Old shield-generator gameplay was removed.

Current shared resource:

```text
DEFENSE CAPACITOR
UI: DEF
capacity: 4
recharge: 24000 ms per missing charge
sequential recharge
```

Point defense spends DEF.

Any future Engineer shield should compete for shared DEF rather than resurrecting
the old shield-generator model.

## Laser truth

Old spatial targeting is gone:

```text
LEFT/CENTER/RIGHT
LaserTargetZone
targetZone
directional shield blocking
laser-zone Science identification
```

Current laser baseline:

```text
TARGETING
→ CHARGING
→ deterministic HULL hit
→ COOLDOWN
```

Incoming beam presentation temporarily lands at a neutral center-bottom point.

## Locked next combat direction

Do not implement until audit closes.

Semantic targets:

```text
HULL
ENGINE
WEAPONS
BRIDGE
VULNERABLE NODE
```

Intent:

- HULL: normal hull damage.
- ENGINE: disable engine, no hull damage.
- WEAPONS: one semantic node; internally disables/damages one working installed weapon.
- BRIDGE: officer/bridge disruption, no hull damage.
- VULNERABLE NODE: Science-discovered, one successful hit, x2 hull damage, then disappears.

v0.1 hits deterministic. Everything except hull destruction should be temporary/repairable.
Game over only from hull reaching zero.

Target-selection UI costs nothing to open; officer work starts after a real target
choice. If only HULL is available, direct-fire without overlay.

## Navigation direction

`HELM_FLY_TO` is not coupled to the old Local Space map view. Current fly command
is still available through the officer context menu.

Old top-center Local Space icon + popup node representation is legacy presentation.
Future navigation belongs in captain dashboard context.

Keep navigation/world source of truth; do not preserve dead Local Space events/views
“for later”.

## Next-chat procedure

Do not repeat the broad audit from the previous chat.

```text
1. read fresh master
2. read REFACTOR_AUDIT_HANDOFF.md
3. inspect exact Local Space/GameOverlay files + external imports
4. build one guarded removal atom
5. typecheck/tests/runtime smoke
6. user pushes
7. verify fresh master
8. inspect BridgeEncounterEngineEventHandler + BridgeEncounterController
```

Previous chat had tool-orchestration stalls and never delivered the Local Space patch.
