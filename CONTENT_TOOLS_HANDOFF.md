# Space Captain — Content Tools Handoff

Updated: 2026-08-15
Reference HEAD: `449524c811cd14b8ec933f74565cb6c8241bfdd0`

Persistent handoff for the local content editor/content-data initiative.

This is not the current priority. Return here only when combat iteration needs a concrete content/tool workflow.

## Read before content-tool work

1. `PROJECT_CONTEXT.md`
2. `GAMEPLAY_CONTRACTS.md`
3. `SYSTEM_MAP.md`
4. `CONTENT_TOOLS_HANDOFF.md`
5. focused schema/catalog/server/tests

Always re-check current GitHub `master`.

## Purpose

Space Captain is tuning-heavy.

Normal workflow:

```text
npm run editor
-> edit content
-> Save
-> inspect git diff
-> run checks/game
-> repeat
```

The editor reduces cognitive load. It is not runtime gameplay and not a general game-engine editor.

## Architecture

### Data / validation

- plain JSON canonical editable content;
- Zod runtime schemas;
- game catalogs consume validated data;
- editor consumes the same schema/data surfaces;
- no editor database;
- no TypeScript AST rewriting.

### Editor

- separate local Vite tool;
- vanilla HTML/CSS/TypeScript;
- no Phaser;
- schema-driven primitive inspector;
- grouped collection navigation;
- dirty/save flow;
- validation/error display;
- add/delete for opt-in collections.

### Local write boundary

Browser does not receive arbitrary filesystem access.

Local server exposes whitelisted operations and validates tracked JSON before save.

Referenced-delete checks exist where required.

## Content ownership rule

Designer-adjustable balance/config -> content.

Examples:
- names;
- damage;
- timings;
- ammo/capacity;
- cooldown;
- probabilities;
- behavior weights;
- task tuning flags.

Algorithm/state-transition/semantic rule -> code.

Examples:
- weapon kinds;
- phase machines;
- command target semantics;
- authoritative availability;
- Science intel semantics;
- runtime signature generation;
- projectile lifecycle.

## Current collection shape

### General / mixed

Includes content such as:
- Officer Tasks;
- Ship Behaviors;
- Enemy Behavior Rules;
- Ship Chassis;
- Debug Start / presets as currently registered.

There is **no Ship Weapon Rules collection** anymore.

### Ship Modules

CRUD-ready:
- Power Cores;
- Defense Turrets;
- Shield Generators;
- Drives.

### Ship Weapons

CRUD-ready:
- Missile Launchers;
- Beam Cannons;
- Spam Projectors;
- Sticky Mine Dispensers.

`Ship Weapons` is editor navigation grouping only.

Do not create a giant runtime hierarchy because the editor groups them.

## Weapon content architecture

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

Rules:
- runtime uses one merged `SHIP_WEAPONS`;
- `ShipWeaponId` is an open string for editor-created records;
- built-in constants remain stable aliases;
- IDs must be unique across weapon families;
- referenced delete is blocked where real references exist.

### Missile Launcher

Editable tuning includes:
- name;
- damage;
- **targeting duration**;
- flight duration;
- ammo capacity;
- cooldown duration.

There is no separate Missile content collection.

### Beam Cannon

Editable tuning:
- name;
- damage;
- charge duration;
- cooldown duration.

### SPAM Projector

Editable tuning:
- name;
- channel duration;
- officer task progress multiplier;
- cooldown duration.

### Sticky Mine Dispenser

Editable tuning:
- name;
- damage;
- fuse duration;
- ammo capacity;
- salvo size;
- launch interval;
- cooldown duration.

There is no separate Sticky Mine content collection.

A single-mine experiment should remain another dispenser content record unless mechanics genuinely diverge.

## IDs / CRUD rule

For CRUD-enabled collections:
- record IDs are schema-validated strings;
- built-in constants may remain aliases;
- references validate;
- referenced delete is blocked with usage info;
- ID rename remains forbidden until a concrete migration story exists.

Ship Weapon IDs must remain globally unique across all weapon families.

## Validation layers

### Schema validation
- required fields;
- primitive types;
- ranges;
- enums/variant shape.

### Reference validation
- references exist;
- referenced delete is blocked;
- cross-family weapon ID collisions are blocked.

### Game-specific invariant validation
Only where schema/reference validation is insufficient.

Do not duplicate normal runtime rules in editor validation.

## Generic editor philosophy

Prefer boring generic controls.

Collection-specific UI is justified only by a real workflow.

Current good example:
- chassis sprite/atlas tooling.

No framework migration unless actual complexity proves it useful.

## Next content/editor task

No concrete editor task is selected.

When returning:
1. fetch current `master`;
2. smoke `npm run editor`;
3. inspect current friction;
4. select one gameplay-driven slice.

Do not migrate collections merely for completeness.

## Testing expectations

Normally prove:
- baseline data validates;
- representative invalid data fails;
- CRUD works where enabled;
- references/delete protection work;
- cross-family IDs cannot collide;
- game/catalog consumes validated data;
- editor save/reload works;
- local write cannot escape whitelist;
- `npm run typecheck`;
- `npm test`;
- editor build/runtime smoke when relevant.

## Patch delivery

Global ZIP-only temporary patcher rule from `PROJECT_CONTEXT.md` applies here without exception.
