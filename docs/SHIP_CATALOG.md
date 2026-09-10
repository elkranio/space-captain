# Space Captain — Ship Catalog

Implemented physical ship content and editor workflow. This is the current contract for the three-atom migration
described in `SHIP_CATALOG_PLAN.md`.

## Content and runtime boundary

`src/engine/content/data/ships.json` is the reusable catalog for both player and enemy ships. Each object key is a
stable ship content ID. Its record contains `name`, `chassisId` and `equipment`:

```json
{
    "example_ship": {
        "name": "Example Ship",
        "chassisId": "generic_00",
        "equipment": [
            { "id": "drive_00", "slotId": "drive", "type": "drive", "equipmentId": "basic_00" }
        ]
    }
}
```

Equipment `id` is the stable installed-instance identity within this ship. `equipmentId` references a definition in
an equipment catalog. `slotId` references the selected chassis. The same instance IDs may occur in different ship
definitions or actors; mutable runtime objects are created separately for each assembly.

Equipment types are `drive`, `power_core`, `defense_turret`, `shield_generator` and `weapon`. Weapon family/kind is
resolved from its catalog, including SPAM's UTILITY slot requirement. Ships require exactly one Drive; Power Core,
Defense Turret and Shield Generator are optional singletons; weapons may be empty. Instance IDs and occupied slot
IDs must each be unique within a ship. Every mount must reference existing equipment and a compatible chassis slot.

The schema rejects extra fields, including runtime damage/progress. Hull/integrity, full ammunition, initial Core
charges and system phases are initialized by the existing factories. Ship content contains no team, crew or AI.

`catalogs/ships.ts` validates JSON and adapts its slot-oriented authoring shape into `ShipDefinition = ShipPreset &
{ name: string }`. The existing `content/presets/ships.ts` remains the physical assembly contract consumed by
`ShipFactory`; there is no second runtime build implementation. New gameplay consumers can resolve `SHIPS[id]`
and use that same factory without involving Debug Start.

`debug_start.json` now contains only:

```json
{
    "playerShipId": "debug_start_player",
    "enemyShipId": "debug_start_enemy"
}
```

The new-game boundary resolves these IDs through `SHIPS` and creates fresh physical state. Either role may select
any valid build, including the same build for both. Player construction and encounter startup accept absent turret
and shield, as enemy construction already did; missing equipment is not silently installed. Team, crew, behavior,
actor IDs and placement remain with `NewGameUniverseFactory` / scenario assembly.

The migration retained the two former Debug Start loadouts and all their equipment instance IDs. The fixed scenario
test fixture underwent the same shape migration without changing its equipment or balance.

## Editor workflow

Run `npm run editor`.

1. Open **Ships → Ships**. Use **+ Add** to choose a new stable ID, then edit its display name and chassis.
2. Select chassis tiles to install equipment. A newly created ship has empty slots; install its required Drive
   before saving. Hull and Bridge remain fixed semantic slots.
3. Use **Duplicate Ship** for a variant. It deep-copies the current draft, generates a free `_copy` / `_copy_N` ID,
   and keeps the chassis, loadout and per-ship equipment instance IDs. Edit the display name and desired slots.
4. Press **Save** to persist the catalog, then open **Debug Start → Starting Ships**. Choose Player Ship and Enemy
   Ship from the same catalog and save again. This selection does not alter any saved build.

Display names can change freely. Content IDs are stable keys, shown in the inspector and dropdown labels; editing
an existing ID in place is not a separate UI operation. To replace an ID, create a new build, update its consumers,
then delete the old one. Saving is per collection. Reload/restart the game to assemble newly selected content;
editor changes do not replace hardware inside an already running encounter.

The previous Debug Start slot editor was moved to `tools/content-editor/src/ship_loadout_editor.ts` and its CSS.
Starting Ships is a single compact form with two reference controls, with no record-list column or embedded loadout.

## Reference integrity and chassis changes

- Missing Starting Ships IDs are rejected. Deleting or renaming a referenced ship ID is blocked with its usages.
- Every saved ship protects its referenced chassis and equipment, including builds not selected in Debug Start.
- Saving Ships validates chassis existence, equipment references, slot compatibility, uniqueness and required Drive.
- Changing a ship's chassis shows invalid/orphaned mounts until the layout is corrected. Saving rejects an invalid
  layout. Editing a slot removes mounts whose slot IDs no longer exist; incompatible occupied slots can be cleared
  or replaced through their equipment controls.
- Removing or changing the kind of an optional chassis slot removes its mounts from **all** saved builds on that
  chassis. Starting Ships references remain unchanged. Geometry-only changes preserve mounts.
- A chassis edit that would remove a ship's required Drive mount is blocked. Move that build to another valid
  chassis or remove its references/build before renaming its Drive slot. The chassis schema still requires its
  own Hull, Bridge, Drive and Power Core slots even when Core equipment is absent.
- Dependent ship cleanup is validated before writes, then written before the chassis file. This retains the
  existing safe write order: if the chassis write fails, the old optional slot is simply empty. This is not a
  multi-file database transaction.

`server/content_registry.ts`, `content_references.ts`, `ship_chassis_cleanup.ts` and `content_api.ts` own these
editor boundaries. No Debug Start-owned equipment cascade remains.

## Verification and continuation

On 2026-09-10: typecheck and the complete suite passed (117 files / 354 tests). Browser checks covered create,
chassis selection, install/save, duplicate/edit isolation, both starting dropdowns, reload persistence, referenced
deletion blocking and unused-ship deletion. Temporary smoke builds were removed and the original defaults restored.

New focused coverage lives in `tests/engine/generation/ship_catalog.test.ts` and
`tests/tools/content_editor_ships.test.ts`; existing startup, editor and runtime tests now read the catalog format.
The catalog tests exercise the same build in both roles, independent mutable state, and a player with only a Drive.

The three planned atoms are implemented. Crew templates, player/enemy archetypes, AI redesign, procedural builds and
ship progression remain outside this migration; future consumers should reuse the physical catalog boundary.
