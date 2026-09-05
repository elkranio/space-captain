# Space Captain — Current Handoff

This is the only live handoff file.

Historical handoffs belong in git history. Do not add dated root-level handoff files again unless there is a concrete
reason to preserve a temporary migration artifact.

Current source of truth:

```text
repository: elkranio/space-captain
branch: master
```

For Codex Local, the current checkout, working tree and exact source/tests are authoritative. Inspect them before editing;
no fresh `master` fetch is required. Web Chat patch preparation follows the fetch rules in `docs/WORKING_RULES.md`.

Read durable docs when their boundary is relevant:

- `docs/WORKING_RULES.md` — collaboration, patch and validation rules;
- `docs/GAME_DESIGN.md` — canonical intended design;
- `docs/GAMEPLAY_CONTRACTS.md` — current implemented runtime truth;
- `docs/EQUIPMENT.md` — equipment mechanics/status/idea bank;
- `docs/SYSTEM_MAP.md` — ownership/data-flow boundaries;
- `docs/BRIDGE_ART_DIRECTION.md` — durable bridge/dashboard visual grammar;
- `docs/THREAT_PANEL.md` — threat presentation contract;
- `docs/COMBAT_PLAYTEST_ROADMAP.md` — broader combat gate sequence;
- `docs/BACKLOG.md` — concrete deferred work only.

## Current implementation checkpoint

### Latest continuation — single-Mine migration and cleanup

This checkpoint restores context from an interrupted Web Chat cleanup. The local audit started from clean `master`
at `fe5c0ba89ad073d91bae57d83313f3b6d5e99eb1`. The migration was already in that checkout; the cleanup below was made
directly in Codex Local. Commit/push is user-owned: do not assume remote Web Chat can see these edits until they are
committed and pushed. This SHA is the audit baseline, not a claim about a later remote HEAD.

The current Mine Dispenser contract is:

```text
READY
-> Gunner task MINE AIM / weapon TARGETING
-> exactly one physical Mine release / attachment attempt
-> Gunner free; full dispenser COOLDOWN (or READY if cooldown is zero)

successful attachment -> independent full fuse -> Engineer CLEAR or Hull explosion
Evade at attachment  -> MISS; ammo and cooldown are still spent
```

This applies to both player and enemy. There is no automatic salvo, no second release after Gunner is freed, and no
separate launch interval. Multiple Mines may still exist through repeated commands or multiple dispensers. Preserve
each Mine as a separate runtime object and future threat-monitor entry.

Ownership and data:

- `gunner_fire_sticky_mines.durationMs` in `src/engine/content/data/officer_tasks_gunner.json` owns targeting time
  (currently 3000 ms). `GUNNER_FIRE_STICKY_MINES` remains the stable command/task id despite its plural name.
- `src/engine/content/data/sticky_mine_dispensers.json` owns damage, fuse, ammo capacity and cooldown. Both existing ids,
  `sticky_mine_dispenser_00` and `sticky_mine_solo`, use one release; their remaining tuning may differ.
- `OfficerTaskRunner` advances player aiming using crew time. The player Mine runner mirrors task elapsed time into
  weapon state for presentation, commits release, then completes the task. Do not let generic timed completion end
  this task before physical release.
- Enemy targeting uses that same task duration and crew-performance clock. The enemy captain decision read model
  reports targeting time as the prospective Gunner busy duration, not fuse/cooldown or the removed salvo duration.
- SPAM slows targeting. Attached fuses and cooldown run in world time.
- Current player manual cancellation, damage interruption and target loss during aiming return to READY with no ammo
  or cooldown cost. Released Mines are independent of officer work and cannot be cancelled via the completed task.
- A large targeting-completion step creates one Mine with its full fuse and a full cooldown; no catch-up salvos or
  backdated attachment age. Existing encounter-step ordering is retained: queued player attachments are integrated
  before existing-object resolution and receive no elapsed time in their creation step.
- Existing zero-fuse asymmetry remains: an enemy Mine resolves at attachment; a player Mine resolves on the next
  combat step. This cleanup did not redesign zero-duration or same-step rules.
- Incoming Mines survive destruction of their source. Outgoing Mines are cleaned when their target disappears or
  stops being hostile. CLEAR remains Engineer-only with no fallback role.

Completed cleanup:

- removed dead `DISPENSING` from the shared weapon phase vocabulary and its runner/query/test branches;
- removed `dispensedMineCount`, `salvoTargetActorId` and their factory, snapshot, reset and test plumbing;
- removed always-zero player attachment `ageMs`, which existed for the former salvo catch-up path;
- removed `dispensingProgress` from the bridge payload/mapper; the Mine tile now consumes `targetingProgress`;
- the Mine tile now exposes the existing engine-authorized `G CANCEL` through the shared task-cancellation input path;
- enemy debug work text now says `AIM MINE` during TARGETING;
- retained real ammo, fuse, cancellation, Evade, damage and event assertions while removing obsolete counter assertions;
- added real engine-to-dashboard coverage for aiming/cancellation/release and a damage-interruption regression.

The preceding migration had already removed `salvoSize` / `launchIntervalMs` from definitions, schemas, live content
and scenario JSON. It had also removed `showProgress` from officer-task content/state. Do not reintroduce any of these
fields to make old snippets compile. Missile targeting similarly belongs to `gunner_fire_missile.durationMs`, not the
launcher; the scenario fixture migration and original test failures were fixed before this cleanup.

Useful file routes for a Web Chat with slow repository access (paths are exact; inspect full current files before edits):

| Responsibility | Files |
| --- | --- |
| Content and strict schema | `src/engine/content/data/officer_tasks_gunner.json`, `src/engine/content/data/sticky_mine_dispensers.json`, `src/engine/content/schemas/ship_weapons.ts`, `src/engine/content/schemas/officer_task_tuning.ts` |
| Domain timing/weapon shape | `src/engine/defs/officer_task.ts`, `src/engine/defs/ship_weapon.ts` |
| Player start/cancel | `src/engine/encounter/commands/handlers/gunner_fire_sticky_mines_command_handler.ts`, `src/engine/encounter/state/PlayerShipStore.ts`, `src/engine/encounter/officer_tasks/OfficerTaskEffects.ts` |
| Player progress/release | `src/engine/encounter/officer_tasks/OfficerTaskRunner.ts`, `src/engine/encounter/combat/PlayerWeaponRunner.ts`, `src/engine/encounter/combat/sticky_mine/PlayerStickyMineDispenserRunner.ts` |
| Physical Mines and enemy targeting | `src/engine/encounter/combat/sticky_mine/CombatStickyMineRunner.ts`, `src/engine/encounter/combat/CombatRunner.ts` |
| Enemy work/busy duration | `src/engine/encounter/combat/enemy/EnemyWorkExecutor.ts`, `src/engine/encounter/combat/enemy/EnemyCrewTaskRunner.ts`, `src/engine/encounter/combat/queries/get_enemy_captain_decision_snapshot.ts` |
| Snapshot/presentation | `src/engine/encounter/snapshots/combat_presentation_snapshot.ts`, `src/app/scenes/game/bridge/controller/captain_dashboard/BridgePlayerShipDashboardMapper.ts`, `src/app/scenes/game/bridge/events/bridge_event.ts` |
| Tile and input | `src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgePlayerShipEquipmentGridView.ts`, `src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeStickyMineDispenserTileView.ts` |

Primary regression suites: `tests/engine/encounter/player_sticky_mine_command.test.ts`,
`tests/engine/encounter/sticky_mine_dispenser.test.ts`, `tests/engine/encounter/player_evade_sticky_mine_resolution.test.ts`,
`tests/engine/encounter/enemy_evade_player_sticky_mine_resolution.test.ts`, and
`tests/app/BridgePlayerShipDashboardMapper.test.ts`. Existing clearing, snapshots, actor cleanup, factories and phase
classification suites remain part of the full run. Fixtures stay in `tests/fixtures/scenario_content.json`;
live-content tests continue reading actual workspace JSON (see `tests/README.md`).

Cleanup validation: focused Mine/dashboard suites passed; full `npm test` passed 341 tests in 122 files;
`npm run typecheck` and `git -c core.safecrlf=false diff --check` passed. Browser smoke on the actual Debug Start loadout
confirmed `G CANCEL`, cancellation restoring `G FIRE` with all 6 Mines retained, and a completed release leaving 5 Mines
with the dispenser in recovery and Gunner free. No raw textures changed. The final diff was reviewed; no commit or push
was performed by Codex.

Open boundary, deliberately not changed: the older design requires full cooldown on Mine termination, while the
current single-Mine implementation cancels targeting for free. `GAME_DESIGN.md`, `GAMEPLAY_CONTRACTS.md` and `BACKLOG.md`
now say this explicitly. Resolve it as a separate gameplay decision; do not restore salvos to satisfy that old wording.
Generic BROKEN gating/repair and the compact threat monitor also remain unfinished.

### Ship/loadout foundation — LANDED

- player and enemy ships carry real `chassisId`;
- chassis own stable physical slots with `slotId`, kind and 1-based grid coordinates;
- current slot kinds are `DRIVE | WEAPON | DEFENSE | UTILITY`;
- persistent mounts preserve `slotId -> equipmentId`;
- Debug Start/content editor are chassis-aware;
- Drive, Defense Turret, Shield Generator and all current weapon families carry encounter-local integrity;
- Power Core remains separate, non-spatial, non-breakable and non-targetable.

The generalized integrity foundation is ahead of generic gameplay behavior. Full BROKEN gating + Engineer repair is still
unfinished for most equipment families.

### Dual captain ship dashboards — LANDED BASIC STATE

Both lower captain screens are real persistent ship dashboards.

MY SHIP:

- shared header owns HULL and Power Core presentation;
- exact 4x3 equipment grid consumes chassis slot/mount coordinates;
- all seven current standard equipment families have concrete tiles;
- Defense Turret still opens its existing inline Missile-selection interaction;
- there is no BRIDGE/HULL special column anymore.

ENEMY SHIP:

- presentation-safe engine query produces detached enemy dashboard snapshots;
- snapshot synchronization + `BridgeEnemyShipDashboardMapper` map them into bridge payloads;
- the right dashboard renders basic HULL plus the mirrored 4x3 installed-equipment grid;
- equipment identity, slot placement, integrity and BROKEN state are visible;
- hidden ammo/cooldown/crew-decision truth is not leaked merely because the engine owns it;
- player Beam can target occupied equipment slots, including already-BROKEN equipment.

Shared dashboard presentation now owns common chrome/status primitives such as header, Hull, Power Core, slot chrome,
integrity, metrics, pips and progress-icon treatment. Keep player/enemy event adapters separate where their data/visibility
policy differs; do not rebuild duplicated tile chrome inside each concrete equipment view.

### Current tile grammar

- catalog `shortName` for equipment titles;
- off-white / normal chrome = ready;
- activity progress is shown on the equipment pictogram;
- muted presentation = cooldown/resource unavailable;
- red = BROKEN/problem state;
- integrity pips remain compact and state-consistent;
- resource/status metrics appear only where they change an immediate decision;
- whole tile cells are interaction surfaces; contextual hover actions replace the title while the pictogram stays visible.

### Authoritative 4x3 placement — LANDED

Equipment placement does not come from weapon array order or equipment family.

```text
ship.chassisId + ship.mounts
-> mount.equipmentId -> mount.slotId
-> SHIP_CHASSIS[chassisId].slots
-> { column, row }
-> exact 4x3 dashboard cell
```

Rules:

- empty chassis slots remain empty;
- duplicate equipment kinds remain distinct by runtime equipment id;
- no fallback to array order;
- out-of-grid or missing mount/slot mappings are errors.

### Beam Power Core cost — LANDED

Player Beam Cannon uses its content-defined `powerCost`.

- command availability requires enough current Power Core charge;
- cost is committed when Beam charging starts;
- later cancellation/interruption does not refund committed Power;
- player Beam carries a semantic `HULL | SLOT(slotId)` target; dashboard input currently selects slots only.

Do not re-add Beam CORE cost as a TODO.

### Bridge shell / combat board state

Current combat composition:

```text
TOP CENTER
    compact threat monitor area (not implemented yet)

SIDES
    SCIENTIST + PILOT monitors
    GUNNER + ENGINEER monitors

CENTER
    first-person viewscreen

BOTTOM
    MY SHIP dashboard | ENEMY SHIP dashboard
```

The old large 4x2 threat-action/combat-context view is gone. Do not resurrect it.

`BridgeScene` no longer instantiates the old general debug layer. The explicit holdout is the Missile debug tooling:
`BridgeMissileDebugView` + `bridge_missile_debug_config.ts`. Keep them for upcoming Missile attack visual tests.
This is temporary tooling, potentially retained for a long time; removal requires an explicit task.

`docs/reference/combat_bridge_layout_2026-08-25.png` remains useful for macro composition, but live dashboard internals
supersede its old special-column geometry.

## Cleanup/refactor checkpoint — CLOSED

The large cleanup window is complete. Recent cleanup removed obsolete presentation/asset branches rather than preserving
legacy compatibility:

- officer bark views/assets removed;
- unused officer portrait manifests/assets removed;
- old role glyphs and unused officer look-left/look-right sprites removed;
- obsolete combat/speech-bubble UI manifests removed;
- old equipment-tile debug view removed;
- MY SHIP special-column view removed;
- obsolete ship chassis art variants removed;
- dashboard tile presentation was decomposed into small shared visual primitives instead of duplicated per-tile chrome.

Durable ownership details live in `docs/SYSTEM_MAP.md`.

Do not schedule another general refactor pass. Refactor only when a feature exposes a concrete ownership, duplication or
cognitive-load problem.

## Asset tree checkpoint — NORMALIZED

Raw image paths are semantic rather than scene-owned by default.

Rules:

- `bridge/**` contains bridge-specific art only;
- reusable combat objects live under `combat/**`;
- reusable equipment art lives under `equipment/icons/**`;
- reusable small symbols are split by meaning under `icons/resources`, `icons/threats` and `icons/status`;
- generic UI controls remain under `ui/**`;
- world objects remain under `world/**`;
- `bridge/ui/officer_monitor/frame` stays bridge-owned because that frame is specific to the bridge presentation;
- singleton filenames do not carry meaningless `_00`; keep `_00/_01/...` only for real visual series such as SPAM
  popups and station variants.

TexturePacker recursively derives atlas frame keys from `assets/raw/images`; TS manifests must match those relative paths
without `.png`.

## Beam slot targeting — LANDED

The player Beam tile now enters presentation-only target selection instead of immediately issuing the actor-wide command.
The selected tile keeps `G CANCEL`; other own equipment tiles dim and their existing input surfaces are disabled.
The Beam outline and header background highlight only on hover; the cancel label stays visible without hover.
Enemy equipment outlines pulse together and hover shows `G FIRE`. Re-clicking the selected Beam cancels for free.
Gunner stays free and CORE is not spent. Snapshot updates preserve selection, or close it when availability/targets vanish.

Clicking occupied enemy equipment now submits `SLOT(slotId)` through the existing Beam command, Gunner task and runner.
The engine validates the current mounted target and resolves it by stable slot identity, never by array order.
At impact, intact equipment takes `moduleDamage`; a breaking hit never spills into Hull. Equipment already BROKEN at
impact instead causes `hullDamage * 2` to Hull. Enemy Evade and whole-ship Shield retain their existing precedence.

Own tiles regain normal input at target acceptance. The selected target shows the packed `icons/status/target_lock`
micro icon in shared cyan, pulsing at its top-right. Its state derives from the active Gunner task via the dashboard
snapshot and clears on completion/cancellation/interruption or target cleanup. CORE commitment and viewscreen VFX remain.
Player Beam now starts full cooldown at shot resolution or cancellation/interruption; enemy Beam still starts recovery
at charging. Missing slot equipment cancels through existing task cleanup.

HULL and empty slots do not highlight. Engine Hull shots remain explicit `HULL` targets; Hull pip input and the Bridge
module are deferred. Future Gunner Stun must cancel pre-command selection; Stun itself is not implemented.

## Deferred correction — equipment cooldown timing

The agreed cooldown corrections are partially implemented. Player Beam now starts full cooldown at resolution or
cancellation, and single-Mine release starts full cooldown after targeting. Other rows remain mixed. Follow the per-system
"Equipment cooldown and cancellation" table in `docs/GAME_DESIGN.md` and the implementation checklist in `docs/BACKLOG.md`.
`docs/GAMEPLAY_CONTRACTS.md` records the current code behavior, including overlapping recovery and player/enemy differences.

Preserve free Missile-targeting cancellation and SPAM's lack of manual cancellation. Mine targeting currently also
cancels for free; its discrepancy with the older full-cooldown termination design is explicit in the Mine checkpoint
above and in the backlog. Keep this work narrow; Evade Drive wear is a separate TODO, not an already-landed cost.

## Targeting continuation

Player Beam now carries a semantic target end-to-end:

```text
HULL
or
SLOT(slotId)
```

ENEMY SHIP equipment-tile input is landed. Hull targeting via the Hull pip area and the future Bridge module remain
separate atoms. Do not add a modal target picker.

After that:

```text
player Beam HULL | SLOT(slotId)
-> migrate/refine shared incoming Beam / targeted-Shield target vocabulary
-> compact top-center threat monitor
-> finish shared BROKEN gating + Engineer repair exposed by the board
-> first weak-player vs weak-enemy timing/balance smoke
-> Scientist tactical-information pass
```

## Important current runtime truths

- basic incoming threat identity is free information; no mandatory Scientist TRACK/IDENTIFY;
- current incoming Beam target vocabulary is still `HULL | DRIVE`;
- current player targeted Shield uses that same temporary `HULL | DRIVE` vocabulary;
- current player Beam resolves `HULL | SLOT(slotId)`; only slot selection is exposed on the dashboard so far;
- slot targets resolve installed equipment; integrity/BROKEN belongs to equipment, never to a second slot-health state;
- Defense Turret interception is deterministic after successful Gunner work;
- Beam, Evade, Defense Turret and Shield Generator use shared Power Core;
- Drive has an existing BROKEN-only repair path;
- confirmed Evade wear (1 Drive integrity at maneuver end) is still not implemented;
- SPAM viewscreen garbage/ads presentation is implemented beneath bridge controls;
- cooldown timing does not consistently match the confirmed after-action rule; see `docs/GAMEPLAY_CONTRACTS.md`
  for the current per-system timing and `docs/BACKLOG.md` for the deferred correction;
- encounter-end restoration/cleanup is still deferred;
- generic BROKEN gating/repair across all breakable equipment is still unfinished.

Existing interruption asymmetry observed during Beam tests: incoming mines and Beams interrupt officer work;
incoming Missile impact currently only applies Hull damage and emits its impact event. This atom does not change it.

When intended design and runtime truth differ, keep the difference explicit. Do not silently rewrite one to look like the
other.

## Working rules for the next atom

Test audit: see `tests/README.md` for scenario-vs-live-content boundaries. `npm test` runs both projects.
Two production follow-ups remain: zero-duration Power Core content passes schema validation but fails factory/runtime
validation; asset deletion protects old sprite IDs instead of the current `generic` manifest ID. Neither was changed
by the test audit.

Follow `docs/WORKING_RULES.md`; do not duplicate its patch/validation rules here.

Still avoid touching these unrelated holdouts without a concrete reason:

- `src/config/gameConfig.ts`;
- EndScene console logging;
- `ScreenWakeLock`;
- `BridgeMissileDebugView`.

## Next-chat continuation

Start with the single-Mine checkpoint near the top of this file; it restores the interrupted cleanup context and gives
exact source/test routes. The broader board, targeting and holdout context below it is intentionally retained so Web Chat
does not need to reconstruct the project through slow repository reads. Follow the applicable local/Web Chat baseline
in `docs/WORKING_RULES.md`; do not apply old salvo patches or rely on pre-migration task/content snippets.

Single-Mine cleanup and Beam equipment-slot targeting are complete. There is no queued generic cleanup/refactor pass.
Choose the next narrow slice with the user: reconcile Mine cancellation cooldown, continue remaining equipment cooldown
corrections, or return to Hull targeting / shared target vocabulary / threat monitor / BROKEN gating in the existing
sequence above. These are alternatives, not authorization to implement all of them.
