# Space Captain — Content Tools Handoff

Updated: 2026-08-14
Reference HEAD: `65a983b7460b66bf85a2753844540c78bf8bbe45`

Persistent handoff for the local content editor / content-data initiative.

The targeted cleanup described in `REFACTOR_HANDOFF.md` is complete and green. The queued next content task is **Missile Launcher + Missiles migration**.

## Read before content-tool work

1. `PROJECT_CONTEXT.md`
2. `GAMEPLAY_CONTRACTS.md`
3. `SYSTEM_MAP.md`
4. `CONTENT_TOOLS_HANDOFF.md`
5. focused schema/catalog/server/tests for the current collection
6. current post-refactor missile files when touching missiles

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
- no custom schema language
- current Zod dependency: `zod@4.4.3`

### Editor

- separate local Vite tool
- vanilla HTML/CSS/TypeScript
- no Phaser
- light theme
- schema-driven primitive inspector
- collection navigation
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
- correct-hypothesis = guaranteed intercept
- runtime missile signature generation
- projectile lifecycle

Editor changes data, not game rules.

## Current collection registry

Registered collections include:
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

### CRUD-ready

- Ship Chassis
- Drives
- Power Cores
- Shield Generators
- Defense Turrets

CRUD-enabled record IDs should be open strings validated by schema where adding records requires new IDs. Built-in constants may remain convenience aliases.

### SHIP MODULES group

- Power Cores
- Drives
- Shield Generators
- Defense Turrets

Do not create a giant runtime `ShipModule` hierarchy merely because the editor groups them together.

## Missile gameplay refactor — COMPLETE

The old red/blue spectral-band gameplay contract is gone.

Current runtime/domain rules:
- each launched missile gets hidden per-projectile runtime signature truth;
- Science intel is per projectile;
- `UNKNOWN`, `UNCERTAIN`, `CONFIRMED`;
- UNCERTAIN has a concrete hypothesis which may be correct/wrong;
- CONFIRMED is guaranteed truthful;
- correct concrete hypothesis -> guaranteed intercept;
- wrong/no hypothesis -> installed Defense Turret `blindInterceptChance`;
- current BASIC turret chance = 0.4;
- blind MISS leaves missile alive;
- Power Core cost is committed on attempt;
- app presentation gets `identificationStatus`, not hidden signature/hypothesis.

Do not encode runtime signature in JSON.

## Current missile/content reality

### Defense Turret

Already content-backed/CRUD-ready.

Editable tuning currently includes:
- name
- load duration
- cooldown duration
- `blindInterceptChance`

Hard equipment chance is legitimate numeric content.

### Missiles

Current definitions are neutral BASIC models; runtime signature is not model data.

Current balance fields include:
- name
- damage
- flight duration

There is **no implemented missile blind-intercept penalty/difficulty field yet**.

Do not invent one during editor migration unless gameplay design explicitly selects it.

### Missile Launcher

Launcher presets still exist in TypeScript and still contain historical names such as:
- `BASIC_RED_FULL_00`
- `BASIC_BLUE_FULL_00`

Those names are stale vocabulary only. They currently load neutral `MISSILE_ID.BASIC_00/BASIC_01`.

The cleanup/refactor pass should audit this naming debt. The later editor migration should not preserve obsolete color semantics.

## Next editor task after refactor

**Missile Launcher + Missiles CRUD/content migration.**

Goals:
- choose the smallest post-refactor data split;
- move actual designer tuning to JSON/Zod;
- add/clone/delete where useful;
- dynamic/open IDs only where CRUD requires it;
- cross-reference validation;
- referenced-delete protection;
- preserve runtime signature as runtime-only truth;
- remove stale red/blue preset semantics/names if still present;
- avoid generic “all weapons” abstraction unless data really demands it.

Potential tuning based on current code:

Missile:
- name
- damage
- flight duration

Launcher:
- weapon definition reference
- loaded missile reference / loadout representation
- ammo count/capacity semantics according to current model

Defense Turret already owns blind intercept chance.

Do not add missile blind penalty merely because an old design note once proposed it.

## IDs / CRUD rule

Editor-created records must not require editing exhaustive TS ID unions every time.

For CRUD-enabled collections:
- record IDs are schema-validated strings;
- built-in constants may remain aliases;
- references must validate;
- deleting referenced records is blocked with useful usage information;
- ID rename remains forbidden until a concrete migration story exists.

Open only collections that need CRUD.

## Validation layers

### Schema validation
- required fields
- primitive types
- integer/range constraints
- enums/variant shape

### Reference validation
- preset/module/content references exist
- referenced delete is blocked

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

## Refactor concerns before more editor migration

Inspect, do not assume:
- repeated CRUD add/delete/reference plumbing;
- repeated schema/catalog/metadata declarations;
- duplicated fixture/test builders;
- collection-specific branches left over from incremental migrations;
- local server routing/write whitelist complexity;
- whether any generic helper currently increases rather than decreases cognitive load.

Do not turn this audit into a giant meta-framework.

## Testing expectations for content migrations

Normally prove:
- baseline data validates;
- representative invalid data fails;
- new records work if CRUD enabled;
- referenced delete is blocked;
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
