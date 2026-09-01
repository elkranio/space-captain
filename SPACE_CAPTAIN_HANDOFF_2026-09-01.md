# SPACE CAPTAIN — HANDOFF
_Last updated: 2026-09-01_

## 0. Continuation point

Immediate next task:

> **Add `shortName` to equipment content and remove dashboard tile title hardcodes.**

The previous chat became too full during repo inspection. **No `shortName` patch has been produced yet.** Resume from fresh GitHub `master`.

---

## 1. Repo / workflow

Repo:

```text
elkranio/space-captain
branch: master
```

Freshest master checked in the old chat:

```text
f230c5cfd6aec34db76e2b712c786b6ea5475c7f
```

Always fetch fresh `master` again before editing; user often pushes between chats.

Stack / rules:

- Phaser 3 + TypeScript + p34t
- target UI: `1280x720`
- atlas key: `atlas`
- code line target: 120 chars
- prefer simple/dumb code over clever abstractions
- no nominal ID aliases just for strings
- small focused atoms, no unrelated refactors
- user prefers `.patch`

Delivery:

```bash
git apply --check <patch>
git apply <patch>
```

User then runs:

```bash
npm run typecheck
npm test
```

### Patch generation — important

We had repeated apply failures from incomplete/synthetic preimages. Required procedure:

1. Fetch fresh HEAD.
2. Fetch **full exact contents** of all existing touched files where practical.
3. Reconstruct exact preimages in temp git repo.
4. Commit baseline.
5. Edit.
6. `git add -A`.
7. Generate diff.
8. Reset baseline.
9. Validate:

```bash
git apply --check /mnt/data/<patch>
git apply /mnt/data/<patch>
git diff --check
```

Do not manufacture blank gaps in synthetic files and do not manually rewrite hunk line numbers.

---

## 2. Agreed production order

1. `shortName` content field + remove equipment title hardcodes.
2. Finish concrete tiles for remaining equipment.
3. Authoritative equipment placement/addressing: `mount.slotId -> chassis slot` instead of weapon-array index.
4. Targetable equipment nodes + damage + BROKEN + Engineer repair.
5. Visual target selection for weapons that can hit HULL or a specific SLOT/node.
6. Update shield system/UI to final damage/target model.
7. Add extra weapons/equipment from idea bank.
8. Proper combat playtest / pacing / tuning pass.

Deferred:

- officer busy hover, e.g. maybe `W BUSY FIRE`
- hotkeys
- tooltips
- gamepad
- economy/manufacturers
- generic equipment-tile architecture

---

## 3. Current dashboard visual language

Agreed states:

- **white/off-white** = ready / usable
- **yellow-orange progress fill** = active work (missile targeting, beam charging)
- **muted blue + progress** = cooldown
- **muted blue without progress** = resource-blocked
  - Missile Launcher with ammo `0`
  - Beam Cannon when CORE charges `< powerCost`
- **red** = broken / repair later

Do **not** dim merely because an officer is busy or no target exists. Those are external context and should eventually be expressed through hover/action language, not equipment-state color.

---

## 4. Missile Launcher tile status

File:

```text
src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeMissileLauncherTileView.ts
```

Current title is hardcoded:

```ts
"M. LAUNCHER"
```

This must be removed by the `shortName` atom.

Tile already has:

- equipment glyph
- ammo micro icon + current ammo
- integrity pips
- targeting progress
- cooldown progress
- resource-blocked dim at ammo `0`
- `W FIRE`
- `W CANCEL`
- repair enum/visual path exists, but real repair is deferred

Assets:

```text
equipment/icon_missile_launcher
icons/micro/ammo_missile_standard
```

---

## 5. Beam Cannon tile status

File:

```text
src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeBeamCannonTileView.ts
```

Current title is hardcoded:

```ts
"BEAM CANNON"
```

This must also become content-driven.

Beam tile is otherwise considered ready at the same current production level as Missile Launcher. It has:

- Beam glyph
- Power Core cost micro icon
- real `powerCost`
- integrity pips
- yellow/orange charging progress
- blue cooldown progress
- `W FIRE`
- `W CANCEL`
- static muted-blue resource block when CORE is insufficient

Assets:

```text
equipment/icon_beam_cannon
icons/micro/power_charge
```

---

## 6. Beam CORE mechanics already landed

Beam originally did not spend Power Core. Foundation now exists.

Beam definitions include:

```ts
powerCost: number;
```

Schema uses a positive integer.

Latest built-in tuning checked:

```text
beam_cannon_00 powerCost = 1
fast_beam      powerCost = 2
```

Beam command availability checks Power Core.

Power is committed when charging begins.

Cancellation does **not** refund committed power. Intentional.

---

## 7. Resource-blocked dim already landed

Latest pushed green state before this handoff:

### Missile

```ts
weapon.ammo.current === 0
```

=> static muted blue, no progress overlay.

### Beam

```ts
powerCoreCharges < weapon.powerCost
```

=> static muted blue, no progress overlay.

State priority:

1. active progress (targeting/charging)
2. cooldown
3. resource blocked
4. normal ready

---

## 8. Current equipment grid

File:

```text
src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgePlayerShipEquipmentGridView.ts
```

Current concrete production tiles:

- Missile Launcher
- Beam Cannon

Separate maps exist for both tile types.

Other weapon kinds remain intentionally blank.

### Temporary placement warning

Current grid placement still uses the **index in the full weapons snapshot array**.

This is temporary. Later replace with:

```text
mount.slotId -> ShipSlotDefinition.column / row
```

Do that before node targeting / damage work.

---

## 9. `shortName` design decision

User wants two user-facing names conceptually:

1. full equipment name
2. compact dashboard tile name

But **do not add a second full-name field**. Existing `name` already is the full name.

Agreed contract:

```ts
name: string;
shortName: string;
```

Meaning:

- `name` = full user-facing name for shop / tooltip / detailed UI / editor
- `shortName` = compact dashboard tile label

Do not derive `shortName` automatically from `name`; it should be explicit content.

---

## 10. Current weapon definition base

File:

```text
src/engine/defs/ship_weapon.ts
```

Current base:

```ts
export type ShipWeaponDefinitionBase = {
    id: string;
    name: string;

    kind: ShipWeaponKind;

    maxIntegrity: number;
    cooldownDurationMs: number;
};
```

Next atom should add:

```ts
shortName: string;
```

---

## 11. Current weapon schemas

File:

```text
src/engine/content/schemas/ship_weapons.ts
```

Current shared name schema:

```ts
const WEAPON_NAME_SCHEMA = z.string().min(1).meta({
    title: "Name",
});
```

Add a required short-name schema, e.g.:

```ts
const WEAPON_SHORT_NAME_SCHEMA = z.string().min(1).meta({
    title: "Short Name",
});
```

Then require it in all current weapon family records:

- Missile Launcher
- Beam Cannon
- Spam Projector
- Sticky Mine Dispenser

The content editor is schema-driven, so this should expose the editable field without special editor UI unless inspection/tests prove otherwise.

---

## 12. Current weapon data that needs `shortName`

Files:

```text
src/engine/content/data/missile_launchers.json
src/engine/content/data/beam_cannons.json
src/engine/content/data/spam_projectors.json
src/engine/content/data/sticky_mine_dispensers.json
```

Known current entries include:

### Missile

```json
"missile_launcher_00": {
    "name": "MISSILE LAUNCHER"
}
```

Use:

```json
"shortName": "M. LAUNCHER"
```

so current UI stays visually identical.

Debug variant `ml_full_auto` also needs an explicit short name.

### Beam

```json
"beam_cannon_00": {
    "name": "BEAM CANNON"
}
```

Use:

```json
"shortName": "BEAM CANNON"
```

Debug `fast_beam` also needs explicit `shortName`.

### Spam Projector

Built-in name currently `SPAM PROJECTOR`; add a compact explicit short name.

### Sticky Mine Dispenser

Built-in + debug variants need explicit short names.

Do not introduce fallback behavior for missing `shortName`; schema should require it.

---

## 13. Weapon catalog

File:

```text
src/engine/content/catalogs/ship_weapons.ts
```

Catalog maps tuning with:

```ts
return {
    id,
    kind: ...,
    slotKind: ...,
    ...tuning,
};
```

So once schema/data/type contain `shortName`, catalog should carry it automatically.

No special mapping should be necessary.

---

## 14. How tile titles should be fed

Avoid making Phaser tile views import/query `SHIP_WEAPONS` themselves.

Preferred seam:

```text
content/catalog -> presentation/dashboard mapper -> BridgePlayerWeaponDashboardPayload -> grid -> tile
```

Add something like:

```ts
shortName: string;
```

to `BridgePlayerWeaponDashboardPayload`.

Then tile API can be simple:

```ts
setTitle(shortName: string): void
```

Grid does:

```ts
tile.setTitle(weapon.shortName);
```

This removes the two hardcodes without leaking engine catalog lookup into Phaser view classes.

---

## 15. Tests likely affected

At minimum inspect/update:

```text
tests/engine/content/weapon_tuning.test.ts
tests/app/BridgePlayerShipDashboardMapper.test.ts
```

Also search content-editor CRUD tests and any fixtures constructing strict schema records for:

```text
MISSILE_LAUNCHER_TUNING_SCHEMA
BEAM_CANNON_TUNING_SCHEMA
SPAM_PROJECTOR_TUNING_SCHEMA
STICKY_MINE_DISPENSER_TUNING_SCHEMA
```

Previous lesson: once a strict schema gains a required field, **every hand-written valid fixture must gain that field**, or tests fail.

---

## 16. Should `shortName` apply only to weapons?

Design intent: **all real ship equipment should eventually have `name + shortName`**, including:

- weapons
- drive
- defense turret
- shield generator
- power core
- future utility equipment

Current catalogs include:

```text
src/engine/content/catalogs/defense_turrets.ts
src/engine/content/catalogs/power_cores.ts
src/engine/content/catalogs/shield_generators.ts
src/engine/content/catalogs/ship_drives.ts
src/engine/content/catalogs/ship_weapons.ts
```

At next-chat start, inspect their defs/schemas/data.

Two valid scopes:

### Smaller atom

Add `shortName` only to weapons now, remove current Missile/Beam hardcodes, then extend other equipment when their tiles are built.

### Better if still mechanically small

Add `shortName` to **all current real equipment families** now, then only wire the currently existing weapon tiles into dashboard titles.

Since more equipment tiles are the very next task, the second option is probably preferable if it stays simple and does not require architectural refactor.

Do not automatically include chassis or other concepts that are not actual equipment.

---

## 17. Presentation / mapper context

Player weapon presentation snapshot currently carries runtime state/timing/ammo/integrity. Dashboard mapper already derives dashboard-specific data such as:

- ammo
- targeting progress
- Beam charging progress
- cooldown progress
- Beam power cost
- integrity
- action availability
- cancel task

Resolving `shortName` in the mapper is natural; do not create duplicate runtime truth.

---

## 18. Current action behavior

### Missile Launcher

Phases relevant to dashboard:

```text
READY -> TARGETING -> COOLDOWN -> READY
```

Targeting occupies Weapons.

Hover:

```text
W FIRE
W CANCEL
```

### Beam Cannon

```text
READY -> CHARGING -> COOLDOWN -> READY
```

Charging occupies Weapons.

Hover:

```text
W FIRE
W CANCEL
```

Beam CORE is committed at charge start and not refunded on cancel.

---

## 19. Future target model — do not mix into `shortName`

Future precision target model:

```text
HULL
or
SLOT(slotId)
```

Visual intent:

- enemy chassis/backplate itself can be selected as whole HULL target
- concrete equipment slots can be selected individually
- do not create a fake HULL equipment tile

Do not touch this during the `shortName` atom.

---

## 20. Future damage / repair — do not mix now

Planned vertical slice:

1. hit specific equipment node
2. integrity decreases
3. integrity reaches zero
4. tile becomes BROKEN/red
5. equipment is disabled
6. hover exposes Engineer repair
7. Engineer task runs with progress
8. integrity restored

Prefer proving one full vertical slice and then applying it across equipment.

---

## 21. Tile architecture rule

Do **not** introduce `EquipmentTileBase` just because Missile and Beam currently share visual patterns.

User prefers concrete tile classes while design is still evolving.

Current common visual pattern:

- title top-left
- glyph centered
- resource/status bottom-left
- integrity bottom-right
- left-to-right progress fill over glyph
- hover header replaces title with role/action

Keep consistency without premature abstraction.

---

## 22. Remaining tile work after `shortName`

Likely next:

- Sticky Mine Dispenser
- Spam Projector
- Defense Turret
- Shield Generator
- Drive
- Power Core / special system presentation as appropriate

Power Core may not behave like a normal action tile. Do not force all systems into one interaction model.

If a new tile needs a missing sprite, tell the user before coding it; user creates/edits art assets.

---

## 23. Visual/game principles to retain

Visual target:

- Sierra / Space Quest V / early-1990s VGA
- practical worn military sci-fi
- restrained lights
- readable, operational dashboard
- avoid AI-looking noise / random greebles / fish scales

Combat target:

- not bullet hell
- telegraph -> reaction -> resolution -> cooldown
- operator/crew contention matters
- dashboard should communicate tactical state quickly

---

## 24. Exact next-chat instruction

When continuing:

1. Read this handoff.
2. Fetch fresh GitHub `master`.
3. Inspect current equipment defs/schemas/data for weapons, drive, defense turret, shield generator, power core.
4. Decide whether `shortName` can cleanly be added to all real equipment families in one small mechanical atom.
5. Add required `shortName` schema/data/type fields.
6. Expose weapon `shortName` through dashboard payload/mapper.
7. Remove hardcoded tile titles:

```text
"M. LAUNCHER"
"BEAM CANNON"
```

8. Update content/editor/mapper tests and all strict-schema fixtures.
9. Generate patch from **fresh exact full preimages**.
10. Validate `git apply --check` and `git diff --check`.
11. Send `.patch` + apply commands.
12. Do not begin remaining tiles until this atom is green.

Last user request before handoff:

> "завтра наступило, погнали прокидывать shortName\nи убираем хардкод"

Freshest checked master at that point:

```text
f230c5cfd6aec34db76e2b712c786b6ea5475c7f
```
