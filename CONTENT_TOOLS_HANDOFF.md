# Space Captain — Content Tools Handoff

Updated: 2026-08-14
Reference HEAD: `31445cf2b634f017a91e1035c29633c5f1e5c003`

Persistent handoff for the local content editor / content-data initiative.

The earlier Missile/Sticky Mine content simplifications and Ship Weapons editor split are complete and green. There is no queued “Missile Launcher + Missiles migration” anymore.

## Read before content-tool work

1. `PROJECT_CONTEXT.md`
2. `GAMEPLAY_CONTRACTS.md`
3. `SYSTEM_MAP.md`
4. `CONTENT_TOOLS_HANDOFF.md`
5. focused schema/catalog/server/tests for the current collection

Always re-check current GitHub `master`.

## Purpose

Space Captain is tuning-heavy.

Normal workflow:

```text
npm run editor
-> open collection
-> edit / add / delete where allowed
-> Save
-> inspect git diff
-> run checks/game
-> repeat
```

The tool reduces cognitive load. It is not runtime gameplay and not a general game-engine editor.

## Current architecture

### Data / validation

- plain JSON canonical editable content
- Zod runtime schemas
- game catalogs consume validated data
- editor consumes the same schema/data surfaces
- no editor database
- no TypeScript AST rewriting
- current Zod dependency: `zod@4.4.3`

### Editor

- separate local Vite tool
- vanilla HTML/CSS/TypeScript
- no Phaser
- light theme
- schema-driven primitive inspector
- grouped collection navigation
- record selection
- dirty/save flow
- validation/error display
- add/delete for opt-in collections

### Local write boundary

Browser does not get arbitrary filesystem access.

Local server exposes whitelisted content operations. Saves validate before writing tracked JSON.

Referenced-delete checks exist for CRUD-enabled referenced collections.

### Chassis assets

Ship Chassis has justified collection-specific asset tooling:
- sprite handling
- atlas rebuild
- CRUD
- reference protection

Do not generalize asset tooling without another real asset-backed workflow.

## Content ownership rule

Designer-adjustable balance/config -> content.

Examples:
- names
- damage
- timings
- ammo/capacity
- cooldown
- probabilities
- behavior weights
- task tuning flags

Algorithm/state-transition/semantic rule -> code.

Examples:
- weapon kinds
- phase machines
- command target semantics
- authoritative availability
- Science intel semantics
- runtime missile signature generation
- projectile lifecycle

Editor changes data, not game rules.

## Current collection registry

### General

Registered non-CRUD or mixed general collections include:
- Officer Tasks
- Ship Weapon Rules
- Ship Behaviors
- Enemy Behavior Rules
- Ship Chassis

### Ship Modules

CRUD-ready:
- Power Cores
- Defense Turrets
- Shield Generators
- Drives

### Ship Weapons

CRUD-ready:
- Missile Launchers
- Beam Cannons
- Spam Projectors
- Sticky Mine Dispensers

`Ship Weapons` is an editor navigation group only. Do not create a giant runtime `ShipWeapon` class hierarchy merely because the editor groups these records.

## Weapon content architecture — CURRENT

Physical content is split by concrete weapon family:

```text
missile_launchers.json
beam_cannons.json
spam_projectors.json
sticky_mine_dispensers.json
        ↓
family Zod schemas
        ↓
unified runtime SHIP_WEAPONS catalog
```

Runtime consumers still use one `SHIP_WEAPONS` catalog.

Rules:
- `ShipWeaponId` is an open string so editor-created records do not require editing an exhaustive ID union;
- builtin `SHIP_WEAPON_ID.*` constants remain stable aliases;
- builtin IDs retain concrete catalog typing;
- IDs must be unique across all four weapon families;
- deleting a weapon used by enemy/player ship presets is blocked with usage information.

### Missile Launcher

Current editable tuning:
- name
- damage
- flight duration
- ammo capacity
- cooldown duration

There is no separate Missile content collection.

Each launched missile copies required physical tuning from the launcher definition and gets independent hidden runtime signature truth.

Do not recreate a separate Missile model merely to mirror old structure. Add separate ammo content only if future gameplay has genuinely selectable missile/ammo types.

### Beam Cannon

Current editable tuning:
- name
- damage
- charge duration
- cooldown duration

The current heavy precision weapon was renamed from Laser to Beam Cannon. `Laser` is not a compatibility alias.

### Spam Projector

Current editable tuning:
- name
- channel duration
- officer task progress multiplier
- cooldown duration

### Sticky Mine Dispenser

Current editable tuning:
- name
- damage
- fuse duration
- ammo capacity
- salvo size
- launch interval
- cooldown duration

There is no separate Sticky Mine content collection.

Runtime attached mines are autonomous after physical values are copied from the dispenser at launch/attach time.

## IDs / CRUD rule

Editor-created records must not require editing exhaustive TS ID unions every time.

For CRUD-enabled collections:
- record IDs are schema-validated strings;
- built-in constants may remain aliases;
- references must validate;
- deleting referenced records is blocked with useful usage information;
- ID rename remains forbidden until a concrete migration story exists.

For Ship Weapons specifically:
- IDs are globally unique across weapon families;
- duplicate cross-family IDs are rejected before they can silently collide in the merged runtime catalog.

## Validation layers

### Schema validation
- required fields
- primitive types
- integer/range constraints
- enums/variant shape

### Reference validation
- preset/module/content references exist
- referenced delete is blocked
- Ship Weapon cross-family ID collisions are blocked

### Game-specific invariant validation

Only where schema/reference validation is insufficient.

Do not duplicate normal runtime gameplay rules in editor validation.

## Generic editor philosophy

Prefer boring generic controls.

Collection-specific UI is justified only when a real workflow cannot be represented generically.

Good current example:
- chassis sprite/atlas tooling

Bad reason:
- “this collection would look prettier custom”

No React/framework migration unless actual complexity proves it useful.

## Next content/editor task

No concrete next collection is selected in this handoff.

Recommended fresh-chat sequence:
1. fetch current `master`;
2. launch/smoke `npm run editor`;
3. verify `Ship Weapons` grouping and CRUD behavior in the real UI;
4. inspect current friction;
5. choose one concrete next content/editor slice with the user.

Do not migrate every remaining registry collection merely for completeness.

Potential future content work should be driven by gameplay needs:
- new ship/weapon variants;
- enemy/loadout tuning;
- behavior tuning;
- future starter weapon if design is selected;
- remaining modules only when they need real designer iteration.

## Testing expectations for content migrations

Normally prove:
- baseline data validates;
- representative invalid data fails;
- new records work if CRUD enabled;
- referenced delete is blocked;
- cross-family weapon IDs cannot collide;
- game/catalog consumes validated data;
- editor loads/saves/reloads;
- local write cannot escape whitelist;
- `npm run typecheck`;
- `npm test`;
- editor Vite build/runtime smoke where relevant;
- `git -c core.safecrlf=false diff --check`.

## Patch delivery

Global rule lives in `PROJECT_CONTEXT.md` and applies here without exception:

**Every temporary `.mjs` patch/recovery script must be delivered only inside a `.zip`; never provide the bare `.mjs`.**

Successful patchers self-delete; failed patchers remain for diagnosis.
