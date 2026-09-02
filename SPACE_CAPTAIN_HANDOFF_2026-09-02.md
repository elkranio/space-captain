# Space Captain — handoff after legacy UI cleanup

Date: 2026-09-02

Repository: `elkranio/space-captain`  
Branch: `master`  
Fresh master at handoff: `02b9cf52ef73b1b24ff9d2445ae8fcfe75127140`  
User reported this baseline GREEN and pushed.

---

# 0. How to resume in the next chat

Do **not** re-derive old decisions from scratch.

First:
1. Fetch fresh GitHub `master`.
2. Confirm it is at or ahead of `02b9cf52ef73b1b24ff9d2445ae8fcfe75127140`.
3. Start from **Section 8: Immediate next work**.
4. Work in micro-atoms.
5. Before each atom after a user push, re-fetch fresh `master`.

Important process rule from this cleanup:
- if a needed system is discovered inside a legacy owner, **move it to the correct owner immediately**;
- do not leave useful logic buried under something being deleted “until later cleanup”;
- delete newly orphaned tails in the same atom when the ownership is obvious;
- do not broaden cleanup into unrelated architecture work.

Avoid tool-loop failure:
- if GitHub code search is unreliable, stop retrying it;
- use repository tree / exact known paths / full file fetches;
- do not send repeated “continuing” messages without producing a result.

---

# 1. Collaboration / coding rules

User preferences:
- Russian.
- Direct and compact.
- Microsteps.
- Discuss ambiguous design before coding.
- No huge plans.
- No architecture-for-architecture.
- Simple/dumb code > clever abstractions.
- ~120 columns.
- Avoid pointless nominal aliases such as `type SomethingId = string`.

Patch workflow:
- GitHub `master` is source of truth.
- Always fetch exact fresh preimages.
- Prefer `.patch`.
- `git apply --check` is authoritative.
- Never fabricate patch context.
- If a user says “пушнул грин”, re-fetch master before the next atom.

Typical validation:

```bash
git apply --check <patch>
git apply <patch>

npm run typecheck
npm test
git -c core.safecrlf=false diff --check
```

Runtime smoke when the change has a meaningful visible/runtime path.

Do not casually touch:
- `src/config/gameConfig.ts`
- EndScene logging
- ScreenWakeLock
- BridgeMissileDebugView

---

# 2. Stack / boundaries

- Phaser 3 + TypeScript + p34t.
- Target UI space: 1280×720.
- Runtime atlas key currently `atlas`.
- Main bitmap UI font theme uses Chakra Petch semibold.
- Engine/domain: `src/engine/**`
- Phaser/app: `src/app/**`
- Bridge: `src/app/scenes/game/bridge/**`
- Phaser types must not leak into engine.

Architecture intent:
- engine state is authoritative;
- app mappers/synchronizers create detached bridge presentation read-models;
- Bridge scene has a scene-local event bus;
- equipment UI issues exact engine-resolved officer commands;
- task cancellation remains a real engine/controller path.

---

# 3. Core game / combat direction

Bridge roguelite / old-school funny captain game.

Four officers:
- Science
- Weapons
- Helm
- Engineer

Captain clicks ship equipment / bridge UI and issues orders.
Officers execute timed work.

Combat philosophy:
- readable telegraphs;
- not bullet hell;
- one threat has enough time to identify/react;
- shared resources and officer contention matter.

Threats:
- Missile
- Beam
- Sticky Mine
- SPAM

Equipment integrity:
- `> 0` operational
- `0` broken
- broken equipment disabled until repair
- encounter-local integrity resets post encounter if it survives
- Power Core is separate, non-spatial, non-breakable, non-targetable

Beam intended target model:
- `HULL | SLOT(slotId)`
- broken-slot targeting should effectively turn into Hull damage logic
- old directional shield model was removed
- shields use target nodes

Evade:
- READY
- WARMUP
- EVADING
- COOLDOWN

---

# 4. Current captain dashboard visual direction

Early-1990s Sierra / Space Quest VGA:
- flat chunky authored pixel art;
- cool blue military sci-fi;
- restrained lights;
- no glossy/mobile/realistic-3D look;
- no AI fish-scale / micro-greeble texture.

Captain dashboard:
- first-person captain;
- two large physical bottom screens;
- left = MY SHIP;
- right = future ENEMY SHIP;
- old combat-context UI is gone;
- the right physical screen still exists visually as a blank placeholder.

Player dashboard:
- exact 4×3 equipment grid;
- special column to the right;
- HULL above BRIDGE;
- ESCAPE in header;
- equipment tile = title + equipment glyph + resource info + integrity;
- whole tile is the interaction surface.

Important state language:
- ready: normal/off-white
- activity: yellow/orange
- cooldown: muted blue/progress
- temporary resource/officer unavailable: muted/static blue
- broken/problem: red

Future polish still deferred:
- operational Turret tile should probably keep normal chrome/title/integrity while only the glyph communicates disabled/cooldown state;
- Turret inline view currently does not show cooldown duration clearly.

---

# 5. Defense Turret — current finished baseline

This is already implemented. Do not redesign it during cleanup unless a cleanup dependency requires it.

## Tile contract

Target presence does NOT decide whether the interaction screen can open.

Operational Turret (`integrity > 0`) can open its inline interaction even if:
- no targets;
- no CORE;
- cooldown;
- Weapons busy;
- an intercept is already active.

Broken Turret cannot open it.

If Turret breaks while inline screen is open:
- player dashboard auto-closes the Turret screen.
- THIS FORCE-CLOSE IS ALREADY DONE. Do not re-implement it.

Target indicator:
- small pulsing yellow icon on tile;
- means at least one suitable incoming missile exists;
- independent of readiness.

Tile hover label:
- `[W] INTERCEPT`

## Inline selector

Folder:

`src/app/scenes/game/bridge/view/captain_dashboard/player_ship/interaction/defense_turret/`

Main behavior:
- inline panel replaces equipment grid + special column;
- MY SHIP header remains;
- close X in upper-right;
- no missiles -> `NO INTERCEPTABLE THREATS`;
- initial ordering by TTI;
- after opening relative order is stable;
- new threats append;
- removed threats compact upward;
- ~160 ms compaction;
- max visible capacity derived from height;
- hidden rows are still modeled but not partially leaked.

Each missile lane:
- right -> left by real TTI;
- dotted trajectory;
- per-lane cutoff tick;
- after cutoff the missile remains selectable;
- late unattended threat blinks red;
- active intercept suppresses red late-danger state;
- active row shows `CANCEL`;
- other rows cannot fire while an intercept is active;
- tracker triangle repeatedly travels toward the target;
- tracker impact gives short activity-orange flash.

Authoritative active intercept:
- no local selected target truth;
- read from `missile.activeTasks?.interceptMissileTaskId`;
- survives close/reopen;
- cancel emits real `OFFICER_TASK_CANCEL_REQUESTED`.

## Turret live read-model requirements

The Turret currently consumes `CAPTAIN_COMBAT_CONTEXT_UPDATED`, specifically incoming missile data.

For each incoming missile it needs:

```ts
{
    projectileId: string;
    designation: string;

    timeToImpactMs: number;
    initialTimeToImpactMs: number;

    actions: {
        interceptMissile?: BridgeOfficerCommandSelectedPayload;
    };

    activeTasks?: {
        interceptMissileTaskId?: string;
    };

    decisionTimings?: {
        interceptMissileMinRemainingMs: number | null;
    };
}
```

Timing truth:
- `timeToImpactMs`
- `initialTimeToImpactMs`
- `playerThreatDecisionTimings.missile.interceptMinRemainingMs`

The intercept command must remain the exact engine-resolved command.

The active task id must remain authoritative and player-cancellable.

---

# 6. Legacy systems removed in this chat

## A. Old captain combat/threat panel — physically removed

Deleted old Phaser presentation subtree:

`src/app/scenes/game/bridge/view/captain_dashboard/combat_context/**`

This included the old:
- threat list;
- beam threat rows/glyph;
- missile threat row;
- mine/spam threat rows/glyphs;
- old shield targeting view;
- beam shield timing strip helper.

Also removed its obsolete test:
- `tests/app/get_beam_shield_timing_strip_state.test.ts`

Important:
- `BridgeCombatView` is NOT this old panel.
- `BridgeCombatView` is alive and owns actual combat VFX.
- DO NOT delete `BridgeCombatView` in cleanup.

The old view was already disconnected from `BridgeCaptainDashboardView`, so removal was presentation-only.

## B. Officer context menu UX — fully removed

Removed the complete legacy menu chain:

`BridgeOfficerStationView click`
→ `OFFICER_STATION_CLICKED`
→ `BridgeEncounterController`
→ `BridgeOfficerCommandMenuController`
→ `OFFICER_COMMAND_MENU_UPDATED`
→ `BridgeOfficerContextMenuView`

Deleted:
- `BridgeOfficerCommandMenuController`
- entire `view/ui/officer_context_menu/**`
- context-menu manifest
- raw context-menu sprites
- menu refresh/update/station-click event plumbing
- menu payload types
- menu-specific layout pieces

Officer station views no longer create a clickable hit area.

Result:
- clicking any of the four officer monitors does literally nothing.

Kept intentionally:
- `OFFICER_COMMAND_SELECTED`
- `OFFICER_TASK_CANCEL_REQUESTED`
- engine command execution
- officer tasks
- equipment interactions

Important correction from the removal atom:
- `src/app/scenes/game/bridge/view/ui/ui_event.ts` was initially thought menu-only;
- that was wrong;
- bark UI still imports it;
- it was restored and is LIVE.
- Do not delete it merely because context menu is gone.

## C. Menu layout tail removed

Removed `contextMenuPosition` from:
- `BridgeOfficerStationLayoutEntry`
- all four officer station layout entries

This was pure menu geometry.

## D. Old captain dashboard helper/style tails removed

Latest cleanup removed:
- `src/app/scenes/game/bridge/view/captain_dashboard/captain_dashboard_format.ts`
- `tests/app/captain_dashboard_format.test.ts`

Also trimmed old unused captain dashboard style tokens.

Current `CAPTAIN_DASHBOARD_STYLE` contains only live groups:

```ts
header
powerCore
equipmentSlot
equipmentProgress
equipmentIntegrity
specialColumn
```

Old groups such as generic threat row/action/status cell/defense recharge styling were removed.

Fresh current file:
`src/app/scenes/game/bridge/view/captain_dashboard/captain_dashboard_style.ts`

---

# 7. Important live leftovers after the UI removals

This is the central cleanup problem now.

## A. `CAPTAIN_COMBAT_CONTEXT_UPDATED` is still live, but over-broad

Do NOT delete it blindly because Defense Turret uses it.

Current producer path:

`BridgeEncounterSnapshotSynchronizer.syncCaptainCombatContext()`
→ `mapCaptainCombatContextToBridgePayload()`
→ `CAPTAIN_COMBAT_CONTEXT_UPDATED`
→ Defense Turret interaction threat list

Current mapper:

`src/app/scenes/game/bridge/controller/captain_dashboard/BridgeCaptainCombatContextMapper.ts`

Current synchronizer:

`src/app/scenes/game/bridge/controller/encounter/snapshots/BridgeEncounterSnapshotSynchronizer.ts`

The mapper still projects the entire old universal combat-context model:
- enemy ship + enemy power core;
- incoming missiles;
- incoming beam cannon threats;
- sticky mines;
- active spam channels;
- shield targeting commands;
- active shield deploy task;
- Science commands;
- Weapons commands;
- Engineer commands;
- player threat decision timings;
- officer tasks.

This width exists largely because the deleted right-side threat panel once consumed it.

The only confirmed current UI consumer that must survive cleanup is the Defense Turret missile selector.

## B. Current synchronizer still pays for that broad mapper every combat frame

`syncInitial()` calls:
- `syncCaptainCombatContext()`

`syncCombatPresentation()` calls:
- `syncCaptainCombatContext()`

And `syncCaptainCombatContext()` currently passes:

```ts
enemyShips
incomingMissiles
beamCannonThreats
stickyMineSnapshots
spamChannels
playerThreatDecisionTimings
officerTasks
availableScienceCommands
availableWeaponsCommands
availableEngineeringCommands
```

This is a prime cleanup target.

## C. `AvailableOfficerCommand` still has presentation-ish fields

Current engine type:

```ts
export type AvailableOfficerCommand = {
    commandId: EncounterOfficerCommandId;
    label: string;
    target: OfficerCommandTarget;
    targetLabel?: string;
};
```

`OfficerCommandDef` also has `label`.

Do NOT delete these yet.

Known current use:
- `BridgeCaptainCombatContextMapper.mapShieldTargeting()` uses `command.targetLabel`.
- That use may disappear once old broad combat context is removed.

Need a full consumer audit after the combat-context cleanup:
- determine whether `AvailableOfficerCommand.label`
- and `AvailableOfficerCommand.targetLabel`
still have any real consumer outside the removed officer menu / old combat-context UI.

Do not assume `OfficerCommandDef.label` can disappear just because `AvailableOfficerCommand.label` can.

---

# 8. Immediate next work — continue cleanup before enemy dashboard

We are intentionally NOT building the enemy dashboard yet.

First finish the cleanup exposed by deleting old combat UI.

## Recommended next micro-atoms

### Atom 1 — move Turret off legacy-named universal combat context

Goal:
extract the read-model that Defense Turret actually needs into a correctly-owned Turret-specific pipeline.

Do not simply keep a giant `CaptainCombatContext` with most fields removed if it can be cleanly owned by the Turret interaction.

Suggested shape to inspect/discuss before coding:

- Turret-specific mapper/read-model, e.g. under captain dashboard / player ship / defense turret ownership.
- Turret-specific bridge event, naming to be chosen after inspecting current event conventions.
- Input should only require:
  - incoming missiles;
  - Weapons available commands;
  - player officer tasks;
  - missile intercept decision timing.

Output should only contain Turret missile rows.

Possible safe split:
1. add Turret-specific mapper/event and switch Turret consumer to it;
2. green/push;
3. delete old `CAPTAIN_COMBAT_CONTEXT_UPDATED` mapper/payload and all orphaned fields/types.

This respects the user rule:
**move useful logic out of the legacy owner immediately, then delete the legacy owner.**

Do not reimplement missile timing or command availability.
Reuse authoritative snapshot data.

### Atom 2 — delete the now-unowned old combat-context read model

After Turret has moved:
- delete `BridgeCaptainCombatContextMapper.ts` if nothing else uses it;
- remove `CAPTAIN_COMBAT_CONTEXT_UPDATED`;
- remove its payload types from `bridge_event.ts`;
- remove obsolete enemyShip / beam / mine / spam / shield-targeting context payload types;
- remove `syncCaptainCombatContext()` from `BridgeEncounterSnapshotSynchronizer`;
- remove old imports;
- remove mapper tests that only test the deleted broad context;
- keep independent combat VFX synchronization events.

Critical distinction:
these independent events are not automatically dead:
- `INCOMING_MISSILES_UPDATED`
- `BEAM_CANNON_THREATS_UPDATED`
- sticky-mine VFX events
- shield VFX events
- enemy evade/shield events
etc.

They feed real `BridgeCombatView` presentation and must be audited independently.

### Atom 3 — audit engine command presentation fields

After old combat-context read model is gone, inspect all fresh consumers of:

```ts
AvailableOfficerCommand.label
AvailableOfficerCommand.targetLabel
```

If no live UI requires them:
- remove them from `AvailableOfficerCommand`;
- remove their construction plumbing;
- update focused tests.

Do NOT casually remove `OfficerCommandDef.label` without proving it is also presentation-only / unused.

### Atom 4 — one final post-removal audit

Look for:
- stale imports;
- stale tests;
- stale comments saying “right combat context”;
- orphaned helper functions/types;
- old threat/menu-specific assets/manifests;
- controller dependencies that only existed for the deleted flows;
- snapshot reconstruction that became pointless.

Do not start broad refactors unrelated to these removals.

---

# 9. Physical right captain screen — do not confuse with old combat-context UI

`BridgeCaptainDashboardView` still owns two physical screen sprites:

- `playerShipScreen`
- `combatContextScreen`

`combatContextScreen` is now only a blank physical second screen.

The **screen itself should remain**, because it becomes the ENEMY SHIP dashboard.

The variable name `combatContextScreen` is stale, but this is not urgent dead code.
Prefer renaming it when the enemy dashboard is introduced, rather than doing a cosmetic-only atom now.

Current comment says the old right-side combat context is intentionally disconnected pending replacement.

---

# 10. Enemy dashboard — next actual feature after cleanup

Once the cleanup above is green, build the physical enemy dashboard **before** implementing real Beam targeting.

Requirements already agreed:

## Header
- enemy ship name;
- enemy Power Core;
- no ESCAPE button.

## Body
- enemy equipment tiles;
- HULL + BRIDGE placeholders immediately;
- same broad physical dashboard language as MY SHIP.

Enemy tiles expose only player-knowable/perceived data:
- equipment type/name;
- icon;
- integrity/health.

Do NOT mirror internal player telemetry:
- no ammo;
- no resource consumption;
- no cooldown;
- no internal task state;
unless a future Science/intel mechanic explicitly reveals it.

Normal enemy dashboard:
- inert / non-interactive.

Target mode:
- when a weapon such as Beam enters targeting, the enemy dashboard becomes the targeting surface;
- it must be visually obvious that the entire right dashboard entered TARGET MODE;
- exact highlighting treatment still TBD;
- different future weapons may allow different target subsets.

Do not prematurely build a generic targeting-policy framework.
Just keep the boundary open.

Important feature order:
1. finish cleanup;
2. build enemy dashboard physically;
3. inspect Beam engine/read-model;
4. implement real Beam targeting against enemy dashboard;
5. Shield after that.

---

# 11. Beam direction to preserve

Do not build Beam targeting as a textual popup.

Targeting should eventually happen through the enemy dashboard.

Intended target semantics:
- Hull
- installed equipment slot(s)

Future targeting restrictions may vary by weapon.

Enemy dashboard should be a reusable targeting surface, but do not abstract policy before there is a second real use case.

---

# 12. Things that are definitely NOT cleanup targets

Do not delete these merely because the legacy UI disappeared:

- `BridgeCombatView`
- actual missile/beam/shield/mine/spam VFX paths
- `OFFICER_COMMAND_SELECTED`
- `OFFICER_TASK_CANCEL_REQUESTED`
- engine command execution
- officer tasks
- Turret timing snapshot
- Turret active intercept task id
- `ui_event.ts` used by bark UI
- current `CAPTAIN_DASHBOARD_STYLE`
- physical right captain screen
- player dashboard equipment grid
- Power Core / Hull presentation
- Defense Turret inline interaction

---

# 13. Current `BridgeEncounterController` notes

The officer menu controller is gone.

Current officer command input path is directly:

bridge equipment/UI
→ `OFFICER_COMMAND_SELECTED`
→ `BridgeEncounterController.handleOfficerCommandSelected`
→ `encounterEngine.executeCommand`

Cancellation:

Turret `CANCEL`
→ `OFFICER_TASK_CANCEL_REQUESTED`
→ `encounterEngine.cancelTask`

After command/cancel the controller:
- gets fresh presentation snapshot;
- persists;
- syncs dashboard;
- drains engine events;
- syncs relevant combat presentation.

Do not reintroduce officer station click/menu orchestration.

---

# 14. Current baseline validation state

Latest user message before this handoff:
- cleanup patch applied;
- typecheck/tests were fixed after removing the stale `captain_dashboard_format` test;
- user said **“пушнул грин”**.

Current master commit observed after that push:

`02b9cf52ef73b1b24ff9d2445ae8fcfe75127140`

Recent comparison from `c9c088a...` to current master confirms removal/trim of:
- `captain_dashboard_format.ts`
- `tests/app/captain_dashboard_format.test.ts`
- 32 dead lines from `captain_dashboard_style.ts`
- menu-only `contextMenuPosition` layout data

---

# 15. New-chat opening instruction

A good first message in the next chat can simply be:

> Read the handoff. Fetch fresh master. Continue the deep post-removal cleanup. Start by extracting Defense Turret off `CAPTAIN_COMBAT_CONTEXT_UPDATED`; do not touch enemy dashboard yet. Show me the exact ownership plan before the first patch.

That should be enough to resume without re-explaining the session.
