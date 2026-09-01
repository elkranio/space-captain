# Space Captain — Current Handoff

> **SUPERSEDED FOR CURRENT IMPLEMENTATION STATE — 2026-09-01**
>
> Read `SPACE_CAPTAIN_HANDOFF_2026-09-01_DASHBOARD.md` first.
> The remainder of this file is an older checkpoint and must not be used as the current atom plan.

## CURRENT CHECKPOINT — 2026-08-26

Base for this checkpoint: `master` at `58a63584e89afef4467f37b13a3854d8906135c5`.

This file is intentionally current-only again. Historical handoffs remain in git history; do not carry obsolete atom
plans forward as live instructions.

Read before the next coding atom:

- `docs/WORKING_RULES.md` — permanent collaboration/code rules;
- `docs/GAME_DESIGN.md` — intended design;
- `docs/GAMEPLAY_CONTRACTS.md` — current implemented runtime truth;
- `docs/EQUIPMENT.md` — equipment mechanics/status/idea bank;
- `docs/BRIDGE_ART_DIRECTION.md` — durable bridge/dashboard visual grammar;
- `docs/COMBAT_PLAYTEST_ROADMAP.md` — broader combat gate sequence.

Re-fetch current `master` and the exact touched files before every atom. Do not repeat a broad architecture audit.

## Landed foundation

The chassis/loadout/integrity foundation from the previous slice remains landed:

- chassis own stable physical slots with `slotId`, kind and grid coordinates;
- current slot kinds are `DRIVE | WEAPON | DEFENSE | UTILITY`;
- persistent player/enemy ship construction preserves chassis identity and `slotId -> equipmentId` mounts;
- Debug Start uses normalized equipment records and the content editor is chassis-aware;
- breakable equipment definitions own `maxIntegrity`;
- encounter-local Drive / Defense Turret / Shield Generator / Weapon state carries `integrity`;
- shared encounter helpers define equipment operational state and integrity damage;
- Power Core remains separate, non-spatial, non-breakable and non-targetable.

General BROKEN gating/repair for every family and player Beam `HULL | SLOT(slotId)` damage are still unfinished.

## Landed bridge/dashboard shell

The first-person combat bridge has been rebuilt around the confirmed 1280x720 composition.

Current visual structure:

```text
TOP CENTER
    compact physical threat monitor area

LEFT SIDE                         RIGHT SIDE
    SCIENCE monitor                   WEAPONS monitor
    HELM monitor                      ENGINEER monitor

CENTER
    large first-person viewscreen

BOTTOM LEFT                       BOTTOM RIGHT
    MY SHIP dashboard                 ENEMY/legacy combat context for now
```

Important landed details:

- officer portraits sit behind physical transparent monitor frames;
- officer role labels use the shared role palette and color the first letter only;
- role colors are centralized in `src/app/theme/officer.ts`:
    - Science = blue;
    - Helm = green;
    - Weapons = red;
    - Engineer = yellow;
- the captain remains first-person/invisible;
- both lower dashboard background sprites are integrated with no center gap;
- MY SHIP header is rebuilt with `USS CAPYBARA`, compact `[ESC]`, Power Core icon and charge cells;
- MY SHIP owns an exact 4x3 equipment grid plus a narrow right special column;
- the special column currently contains visual-only `BRIDGE` / `HULL` placeholders;
- the legacy left status/systems row views were removed after verifying they owned presentation only.

Current MY SHIP geometry in `BridgePlayerShipDashboardView` is deliberately considered done unless a real runtime
binding exposes a problem. Do not resume 1px dashboard-frame tuning for its own sake.

Strict layout reference remains:

`docs/reference/combat_bridge_layout_2026-08-25.png`

## Missile Launcher tile visual prototype — LANDED

The first real equipment-tile language was designed and implemented as a debug-driven production view:

`src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeMissileLauncherTileView.ts`

It is intentionally a concrete Missile Launcher tile, not a premature generic equipment framework. Extract a shared tile
shell only after at least a second family proves what actually repeats.

Permanent tile information is intentionally sparse:

```text
M. LAUNCHER

[launcher pictogram / progress surface]

[ammo glyph] current ammo                     integrity pips
```

Decisions already made:

- show current ammo only (`5`), not `5/10`; capacity belongs in detailed inspection/tooltips where useful;
- integrity uses compact pips: filled = intact, outline = missing integrity;
- the launcher pictogram itself is the progress bar; no extra horizontal progress bar;
- progress always fills left -> right;
- source art keeps internal pixel detail and uses ordinary Phaser tint, not `setTintFill()`;
- normal/off-white, BROKEN/red and cooldown/muted states tint the whole tile chrome consistently so state reads as one
  visual object rather than a mixture of unrelated colors;
- targeting/work progress keeps normal chrome and overlays the launcher with activity color;
- hover replaces only the center pictogram area with the contextual action; title/ammo/integrity stay put;
- no nested button/chrome is added around hover commands.

Current hover language:

```text
READY / actionable
    W FIRE
    W uses Weapons red

BROKEN / repairable
    E REPAIR
    E uses Engineer yellow

COOLDOWN / unavailable
    no hover action
```

The runtime action text may later become `CANCEL` while current work/repair is active if the real task is cancellable.
Do not invent cancellation semantics in the view; use the real task/command contract.

### Equipment icon asset convention

Equipment icons are universal game assets, not bridge-only assets. Current convention:

```text
assets/raw/images/equipment/<family>/<visual_archetype>/icon.png
```

Current launcher asset:

```text
assets/raw/images/equipment/missile_launchers/light_rack/icon.png
```

Different weapon progression items should be able to use different visual archetypes/silhouettes. Do not collapse all
Missile Launchers onto one icon merely because they share one `ShipWeaponKind`.

Icons used by combat tiles should remain readable under left-to-right progress overlays and tinting. Prefer a strong
silhouette plus a few large internal masses over either flat featureless glyphs or tiny-detail illustration.

## Current debug harness

`BridgeEquipmentTileDebugView` is intentionally still active in `BridgeScene` while the tile is being validated.

Current keys:

```text
1 = animated cooldown progress
2 = animated repair progress
3 = animated targeting progress
4 = nominal reset; hover -> W FIRE
5 = fully BROKEN; hover -> E REPAIR
6 = fully cooldown; no hover action
```

This harness is presentation-only. Do not move fake progress/repair state into engine contracts to satisfy it.

The older `BridgeMissileDebugView` trajectory prototype is disconnected and no longer owns number keys. It can be removed
when convenient; the active disposable debug layer is the equipment-tile harness.

## Immediate next slice — real combat Missile Launcher tile

The next task is **not** more visual invention. Bind the tile we already like to real combat state.

Current app-side weapon payload already exposes:

```text
id
weaponId
kind
ammo.current / ammo.max where relevant
cooldownProgress
engine-resolved action state + command
```

Important missing presentation truth for the new board:

- `BridgePlayerWeaponDashboardPayload` does not currently expose `slotId`;
- it does not expose weapon `integrity` / `maxIntegrity`;
- it does not expose numeric officer-work progress for Missile targeting;
- the 4x3 `BridgePlayerShipEquipmentGridView` currently draws empty slot geometry only and does not place equipment by
  authoritative chassis slot coordinates.

Do not patch around those gaps in the view.

There is one especially important seam: encounter weapons have integrity through `EncounterShipWeaponState`, but
`createShipWeaponStateSnapshot()` currently returns the base `ShipWeaponState` shape and therefore does not preserve that
encounter-only integrity into `PlayerWeaponPresentationSnapshot`. Fix the read-model boundary deliberately rather than
reconstructing integrity from unrelated fields.

Recommended next atoms:

```text
1. Extend the player equipment presentation/read-model with the minimum real mount + integrity truth needed by the grid.
2. Bind the concrete Missile Launcher tile to the real installed launcher and its authoritative slot position.
3. Wire READY/cooldown/action state and real ammo; emit the exact engine-resolved command on click.
4. Add real targeting/work progress only through an authoritative snapshot/task timing source; do not fake it.
5. Add BROKEN/repair action only when the engine exposes the real Engineer repair command/task for that equipment.
6. After the Missile tile works in combat, build a second equipment family and only then decide what common tile shell is
   worth extracting.
```

Keep the engine authoritative for legality. Pointer hover, click, future keyboard hotkeys and eventual gamepad input must
all remain presentation/input adapters that invoke the same semantic action path; gameplay rules must not live in Phaser
pointer handlers.

## Broader combat order after the real Missile tile

Do not jump straight to precision Beam targeting before the actual board is usable.

Current direction:

```text
real MY SHIP equipment binding
-> remaining useful MY SHIP equipment surfaces / real special-column state
-> persistent ENEMY SHIP slot board
-> compact top-center threat monitor migration
-> finish shared BROKEN / repair operational behavior required by the board
-> player Beam HULL | SLOT(slotId) direct targeting
-> shared incoming Beam / targeted-Shield slot target model
-> first weak-player vs weak-enemy timing/balance smoke
```

The exact order between remaining player tile families and the first enemy-board slice may move if one gives a cleaner
vertical test, but do not resurrect the superseded large threat-action dashboard.

## Deferred UI/control ideas

Detailed combat stats do not need to be crammed into the tile. A later hover tooltip can carry damage, effects, traits,
capacity and other inspection-only information while the tile keeps only immediate operational truth.

Runtime hotkey assignment and gamepad support are recorded in:

`ideas/combat_ui.md`

Do not let future gamepad concerns veto good mouse/keyboard combat interaction now. Preserve semantic input boundaries so
a later focus/navigation layer can call the same actions without changing engine rules.
