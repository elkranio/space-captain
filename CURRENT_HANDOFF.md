# Space Captain — Current Handoff

This is the only live handoff file.

Historical handoffs belong in git history. Do not add dated root-level handoff files again unless there is a concrete
reason to preserve a temporary migration artifact.

Current source of truth:

```text
repository: elkranio/space-captain
branch: master
```

Always re-fetch fresh `master` and the exact touched files before preparing a code patch.

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
- direct offensive slot targeting is not implemented yet.

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
- whole tile cells are interaction surfaces; contextual hover actions may replace the central pictogram.

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
- player Beam still targets the enemy actor as a whole for now.

Do not re-add Beam CORE cost as a TODO.

### Bridge shell / combat board state

Current combat composition:

```text
TOP CENTER
    compact threat monitor area (not implemented yet)

SIDES
    SCIENCE + HELM monitors
    WEAPONS + ENGINEER monitors

CENTER
    first-person viewscreen

BOTTOM
    MY SHIP dashboard | ENEMY SHIP dashboard
```

The old large 4x2 threat-action/combat-context view is gone. Do not resurrect it.

`BridgeScene` no longer instantiates the old general debug layer. The explicit holdout is the Missile debug tooling:
`BridgeMissileDebugView` + `bridge_missile_debug_config.ts`.

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

## Immediate next gameplay slice — player Beam semantic targeting

The persistent enemy board prerequisite is now landed. The next confirmed combat atom is to inspect the current Beam
command/task/runner/read path and replace actor-wide player Beam targeting with a semantic target carried end-to-end:

```text
HULL
or
SLOT(slotId)
```

Use the already-visible ENEMY SHIP Hull/equipment surfaces as the interaction language. Do not create another temporary
modal target picker unless the engine contract proves one is necessary.

After that:

```text
player Beam HULL | SLOT(slotId)
-> migrate/refine shared incoming Beam / targeted-Shield target vocabulary
-> compact top-center threat monitor
-> finish shared BROKEN gating + Engineer repair exposed by the board
-> first weak-player vs weak-enemy timing/balance smoke
-> Science tactical-information pass
```

## Important current runtime truths

- basic incoming threat identity is free information; no mandatory Science TRACK/IDENTIFY;
- current incoming Beam target vocabulary is still `HULL | DRIVE`;
- current player targeted Shield uses that same temporary `HULL | DRIVE` vocabulary;
- current player Beam still targets the enemy actor as a whole;
- Defense Turret interception is deterministic after successful Weapons work;
- Beam, Evade, Defense Turret and Shield Generator use shared Power Core;
- Drive has an existing BROKEN-only repair path;
- confirmed Evade Drive wear is still not implemented;
- encounter-end restoration/cleanup is still deferred;
- generic BROKEN gating/repair across all breakable equipment is still unfinished.

When intended design and runtime truth differ, keep the difference explicit. Do not silently rewrite one to look like the
other.

## Working rules for the next atom

Follow `docs/WORKING_RULES.md`; do not duplicate its patch/validation rules here.

Still avoid touching these unrelated holdouts without a concrete reason:

- `src/config/gameConfig.ts`;
- EndScene console logging;
- `ScreenWakeLock`;
- `BridgeMissileDebugView`.

## Next-chat continuation

Read this file, fetch fresh `master`, then inspect the current player Beam command/task/runner path together with the
landed enemy-dashboard slot identity/read model.

Start with **player Beam `HULL | SLOT(slotId)` targeting** unless the user explicitly changes priority.
