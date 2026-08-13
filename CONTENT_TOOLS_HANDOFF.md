# Space Captain — Content Tools Handoff

Updated: 2026-08-13
Reference HEAD before this handoff: `5f33f12374db9dfc5241e9bc300139e921e6a542`

This is the persistent handoff for the local content editor / content-data initiative.

Read before every content-tools atom:

1. `PROJECT_CONTEXT.md`
2. `GAMEPLAY_CONTRACTS.md`
3. `SYSTEM_MAP.md`
4. `CONTENT_TOOLS_HANDOFF.md`
5. focused schema/catalog/server/tests for the current collection
6. `MISSILE_REFACTOR_HANDOFF.md` when touching missiles

Always re-check current GitHub `master` before preparing code changes.

---

## Purpose

Space Captain is tuning-heavy.

The local editor exists so balancing content does not require hunting through TypeScript engine code.

Normal target workflow:

```text
npm run editor
→ open collection
→ edit / add / delete where allowed
→ Save
→ inspect git diff
→ run tests / game
→ repeat
```

The tool reduces cognitive load. It is not a runtime feature and not a general game-engine editor.

---

## Current architecture — implemented

The initiative is no longer hypothetical.

### Data / validation

- plain JSON is canonical editable content;
- Zod runtime schemas validate content;
- game catalogs consume validated data;
- editor consumes the same schemas/data;
- no separate editor database;
- no TypeScript AST rewriting;
- no custom schema language.

Current dependency:
- `zod@4.4.3`

Zod metadata / JSON schema is used to drive generic editor controls.

### Editor

- separate local Vite tool;
- vanilla HTML/CSS/TypeScript;
- no Phaser;
- light theme by design;
- schema-driven generic primitive inspector;
- collection navigation;
- record selection;
- dirty/save flow;
- validation/error display;
- add/delete for collections that opt in.

### Local write boundary

The browser does not get arbitrary filesystem access.

The local server exposes whitelisted content operations. Saves validate before writing normal tracked JSON files.

Referenced-delete checks are implemented for CRUD-enabled collections that are used by presets/content.

### Chassis asset tooling

Ship Chassis has local asset-management support:
- sprite asset handling;
- atlas rebuild flow;
- CRUD;
- reference protection.

Do not generalize the asset system unless another collection actually needs the same behavior.

---

## Content ownership rule

Use this test:

> Could a designer reasonably change this while balancing without changing how the mechanic fundamentally works?

If yes → content/tuning.

Examples:
- names;
- damage;
- timings;
- ammo/capacity;
- cooldowns;
- probabilities;
- tuning penalties/bonuses;
- behavior weights;
- task cancellation/interruption flags.

Use this test:

> Would changing this require a different algorithm/state transition/semantic rule?

If yes → engine/domain code.

Examples:
- weapon kinds;
- phase state machines;
- who owns task completion;
- command target semantics;
- authoritative availability;
- whether Science knowledge is required;
- tracked = guaranteed vs blind = probabilistic;
- runtime missile signature generation;
- projectile lifecycle.

The editor changes data, not game rules.

---

## Current collection registry

At reference HEAD the registry contains:

- Officer Tasks
- Ship Weapon Rules
- Ship Weapons
- Missiles
- Power Cores
- Defense Turrets
- Shield Generators
- Ship Behaviors
- Ship Chassis
- Drives
- Sticky Mines
- Enemy Behavior Rules

Not every registered collection is CRUD-ready.

### Current CRUD-ready collections

- Ship Chassis
- Drives
- Power Cores
- Shield Generators
- Defense Turrets

These use dynamic/open record maps where CRUD needs new IDs.

Stable built-in constants can remain convenience aliases, but the content type itself must not be closed when the editor can create records.

### `SHIP MODULES` sidebar

Current grouping:

```text
SHIP MODULES
- Power Cores
- Drives
- Shield Generators
- Defense Turrets
```

`Ship Chassis` remains separate from modules.

Terminology:
- Chassis = hull/body
- Ship Modules = installed hardware category
- current module families = Drives, Power Cores, Shield Generators, Defense Turrets

Do not introduce one giant runtime `ShipModule` hierarchy merely for editor grouping. Current domain catalogs can stay specialized.

---

## Completed semantic cleanup relevant to tools

Full semantic renames are complete:

```text
Defense Capacitor → Power Core
Shield Emitter    → Shield Generator
Point Defense     → Defense Turret
```

Do not restore compatibility aliases for old names.

Current editor/data terminology should use the new names only.

---

## Immediate sequencing rule — missiles

**Do not make Missiles CRUD-ready yet.**

Current missile content still encodes the old gameplay contract:

- closed red/blue missile IDs;
- model-level `spectralBand`;
- Defense Turret red/blue beam matching.

That mechanic is about to be replaced.

Read `MISSILE_REFACTOR_HANDOFF.md`.

Required order:

```text
1. gameplay refactor
   missile instance signature / Science tracking / blind intercept
        ↓
2. tests + runtime stable
        ↓
3. Missile Launcher + Missiles editor migration
```

Do not spend an atom making the obsolete red/blue schema more editable.

---

## Post-refactor missile content direction

Only broad ownership is decided.

### Runtime / code — NOT editor data

The following belongs to runtime/domain code:

- generation/storage of each launched missile's unique hidden maneuver/signature;
- Science knowledge/tracking state for a specific projectile;
- rule that tracked missile intercept is guaranteed;
- rule that untracked missile intercept is probabilistic;
- Power Core commit semantics;
- turret/projectile state transitions;
- exact authoritative calculation function.

### Likely editable tuning

After the mechanic is stable, content may expose values such as:

Defense Turret:
- blind-intercept quality/chance contribution;
- load duration;
- cooldown duration;
- name.

Missile:
- damage;
- flight duration;
- blind-intercept difficulty / maneuverability / countermeasure quality;
- name;
- later economic/rarity values when that system exists.

Missile Launcher:
- ammo capacity / initial loadout or analogous launcher tuning;
- launch/salvo timing as appropriate to the actual post-refactor weapon model;
- missile references/loadout where appropriate.

**Field names and exact formula are not locked.**
Design them against the post-refactor code.

Do not encode per-launch random signature as content data. It is instance runtime truth.

---

## IDs / CRUD rule

Long-term editor-created records must not require editing an exhaustive TypeScript ID union/object every time.

For CRUD-enabled collections:

- data record IDs are strings validated by schema;
- built-in ID constants may remain convenience references;
- cross-content references must be validated;
- deleting referenced records must be blocked with useful usage information;
- stable ID editing/renaming should stay forbidden until there is a concrete migration story.

Do not weaken all IDs globally. Open only the collections that need CRUD.

---

## Validation layers

### Schema validation

Examples:
- required fields;
- primitive types;
- integer/range constraints;
- enums;
- variant shape.

### Reference validation

Examples:
- preset references existing chassis/module;
- launcher references existing missile;
- content record cannot be deleted while referenced.

### Game-specific invariant validation

Only where schema/reference validation is insufficient.

Do not duplicate normal engine runtime rules in editor validation.

---

## Generic editor philosophy

Prefer boring generic controls.

Add collection-specific UI only when the generic schema form cannot represent a real workflow.

Good examples of justified special tooling:
- chassis sprite asset management;
- atlas rebuild.

Bad reason:
- “this collection would look prettier with a custom editor”.

No React/framework migration unless actual complexity proves it useful.

---

## New Game direction — later

Eventually the tool should support composition rather than only catalog editing:

- officers default;
- player chassis;
- installed modules;
- weapons/loadout;
- later universe node/anchor/enemy ship setup.

Do not build this before the catalogs it depends on are stable enough.

The player/enemy runtime models do not need premature unification for the editor.

---

## Testing / completion expectations

Every content migration atom should normally prove:

- current baseline data validates;
- representative invalid data fails;
- new records work if CRUD is enabled;
- referenced delete is blocked;
- game/catalog consumes validated data;
- baseline gameplay is preserved unless the atom explicitly changes gameplay;
- editor loads/saves/reloads;
- local write cannot escape the whitelist;
- `npm run typecheck`;
- `npm test`;
- editor Vite build;
- `git -c core.safecrlf=false diff --check`;
- runtime/editor smoke where relevant.

---

## Patch discipline

Project patch rules remain mandatory.

Especially:

- zip-only patch delivery;
- successful patcher self-delete;
- fresh HEAD guard;
- clean tracked state unless explicit recovery;
- exact/contextual replacements;
- preserve EOL;
- one newline at EOF;
- filesystem post-scan for newly created files;
- create target directories before `git mv`;
- safe `git status --porcelain` parsing;
- Windows npm through `cmd.exe` / `ComSpec`;
- failed patchers stay for diagnosis.

---

## Immediate next tool task after missile gameplay refactor

**Missile Launcher + Missiles CRUD/content migration.**

At that point:

1. inspect the freshly refactored missile/launcher definitions, catalogs, presets and references;
2. decide the smallest clean data split;
3. migrate the new tuning values, not the obsolete red/blue bands;
4. add dynamic IDs only where add/delete actually requires them;
5. add reference-protected delete;
6. expose the collections cleanly in the editor;
7. avoid a generic “all weapons” abstraction unless the actual data shape demands it.

After that, resume editor expansion only on demand.
