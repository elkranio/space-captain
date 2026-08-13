# Space Captain — Content Tools / Visual Editor Handoff

Updated: 2026-08-13  
Baseline `master` before this initiative: `b22fe96693f2d8964a5b8e1666b23acd6d0baeae`

This file is the persistent handoff for the visual development-tools initiative.

Read it before every content-tools atom together with:

1. `PROJECT_CONTEXT.md`
2. `GAMEPLAY_CONTRACTS.md`
3. `SYSTEM_MAP.md`
4. this file
5. focused files relevant to the current atom

Always re-check current GitHub `master` before preparing code changes.

---

## Why this exists

Space Captain is entering a tuning-heavy phase.

Enemy behavior, officer timing, cancellation/interruption rules, weapons, defenses and combat pacing all need frequent iteration. Editing these values directly in TypeScript is too slow and cognitively expensive for gameplay tuning.

The goal is to build a small visual development environment where gameplay/content parameters can be inspected and edited quickly without searching through engine code.

This is not a runtime player-facing feature.

---

## Primary goals

### 1. Fast tuning

A developer should be able to:

- open one local HTML editor;
- choose a content collection;
- inspect existing records;
- edit values;
- add / clone / delete records where the content model allows it;
- save;
- immediately see a normal tracked repo diff;
- run the game/tests against the same saved data.

### 2. Schema-driven automation

The editor should avoid hand-written forms for every content type.

A runtime-readable schema should drive as much as practical:

- field types;
- required / optional fields;
- numeric constraints;
- enums;
- booleans;
- discriminated variants;
- references to other content collections;
- defaults for new records;
- validation errors;
- generic form controls.

### 3. One content truth

The game and the editor must consume the same editable data.

Do not create:

- editor-only copies;
- exported generated balancing files;
- a second database;
- duplicated validation rules.

### 4. Preserve engine ownership

The editor changes data.

It must not move gameplay/domain semantics into UI code.

Engine code remains authoritative for behavior.

---

## Core architecture

Target flow:

```text
editable data
    ↓
runtime schema validation
    ↓
validated/indexed content facade
    ↓
game engine
```

The editor consumes the same first two layers:

```text
runtime schema + editable data
    ↓
content editor
    ↓
validated save
    ↓
same editable data files
```

Conceptual layout:

```text
src/engine/content/
    schemas/
        ...
    data/
        ...
    catalogs/
        ...
    validation/
        ...

src/engine/defs/
    domain/runtime types and semantics

tools/content-editor/
    index.html
    src/
    vite.config.ts
```

Exact folders may change if a simpler structure becomes obvious during implementation. Preserve the ownership model, not the sketch.

---

## Critical rule: TypeScript types are not editor schemas

TypeScript `type` / `interface` declarations disappear at runtime.

The browser editor cannot reliably "read defs" and construct forms from TypeScript types directly.

Therefore editable content needs a runtime-readable schema.

That schema becomes the shared source for:

- runtime validation;
- editor form generation;
- inferred/static TypeScript typing where practical.

Do not build a custom TypeScript parser for the editor.

Do not maintain an independent handwritten editor schema beside the engine type.

The concrete schema library should be chosen during the first implementation atom based on current project/tooling compatibility. Prefer a boring mature solution with runtime validation and good TypeScript integration.

---

## What belongs in editable content

Use this test:

> Could a designer reasonably change this while balancing the game without changing how the mechanic fundamentally works?

If yes, it is probably editable data.

Examples:

- officer task durations;
- `showProgress`;
- player cancellation flags;
- damage interruption flags;
- weapon damage;
- weapon ammo capacity;
- targeting / charge / cooldown / channel timings;
- salvo size;
- launch interval;
- missile flight duration;
- SPAM progress multiplier;
- shield duration/cooldown tuning;
- power core capacity/recharge tuning;
- enemy behavior delays/weights/priorities;
- names/labels that belong to content records.

---

## What stays in domain/code

Use this test:

> Would changing this require the engine to execute a different algorithm, state transition or semantic rule?

If yes, keep it in code.

Examples:

- weapon kinds;
- weapon phases;
- state-machine transitions;
- whether a phase requires an operator;
- whether a phase advances with crew time vs world time;
- command target semantics;
- authoritative availability logic;
- task/projectile/shield lifecycle code;
- combat ownership boundaries;
- snapshot architecture.

The editor must not become a way to mutate arbitrary engine semantics.

---

## Current repo starting point

The repo already has a useful content boundary:

```text
src/engine/content/
    catalogs/
    generation_pools/
    new_game/
    presets/
    rules/
```

This should evolve rather than be replaced wholesale.

Important current examples:

- `content/catalogs/ship_weapons.ts` contains editable weapon values;
- `content/catalogs/missiles.ts` contains editable missile values;
- `content/rules/officer_tasks.ts` contains task durations;
- `content/presets/ship_behaviors.ts` contains enemy behavior tuning;
- `model/officer_task.ts` currently contains cancellation/interruption policy in code.

The initiative should move balance/config data into the editable content layer where appropriate while preserving real domain semantics in engine code.

---

## Data storage direction

Prefer plain JSON for editable records.

Reasons:

- trivial browser/server serialization;
- clean git diffs;
- no AST rewriting;
- no code generation required for every save;
- easy validation;
- editor and game can consume the same files.

Example shape:

```json
[
    {
        "id": "laser_00",
        "name": "LASER EMITTER",
        "kind": "laser",
        "damage": 1,
        "chargeDurationMs": 12000,
        "cooldownDurationMs": 15000
    }
]
```

The game may keep TS catalog facades that:

1. import/load JSON;
2. validate it;
3. index records by id;
4. expose ergonomic existing APIs such as `SHIP_WEAPONS[id]`.

Do not force the whole engine to become JSON-aware.

---

## Content IDs

Long-term editor-created content must not require manual edits to an exhaustive TypeScript ID object every time a record is added.

Desired direction:

- record IDs live in content data;
- IDs remain strongly named string types where useful;
- schemas validate ID format;
- cross-content references are validated against loaded collections;
- editor reference fields use dropdowns/search against actual records.

Do not weaken runtime/domain identity unnecessarily during the first atom.

Migrate closed ID sets only when the editor needs to create/delete records in that collection.

---

## Editor architecture

The editor should be a separate local HTML/TypeScript dev tool.

Do not use Phaser.

Initial technology direction:

- Vite;
- vanilla HTML/CSS/TypeScript;
- no frontend framework unless actual complexity proves one useful.

Target UX:

```text
┌ Collections ───┬──────── Records ────────┬──── Inspector ─────┐
│ Officer Tasks  │ Identify Threat         │ Duration   3.0 s   │
│ Weapons        │ Purge Spam              │ Cancel     ✓       │
│ Missiles       │ Deploy Shield           │ Interrupt  ✓       │
│ Defense        │ ...                     │                    │
│ Enemy Behavior │                         │ [SAVE]             │
└────────────────┴──────────────────────────┴────────────────────┘
```

Useful baseline capabilities:

- collection navigation;
- record list;
- search/filter;
- inspector;
- dirty state;
- save;
- inline validation;
- add;
- clone;
- delete where allowed;
- clear error display.

Production polish is not a goal.

A boring reliable CRUD tool is better than a beautiful editor.

---

## File write boundary

The browser should not receive arbitrary filesystem access.

Run the editor through a local Node/Vite dev process, e.g.:

```bash
npm run editor
```

Use a small dev-only server/plugin boundary with whitelisted content collections.

Conceptually:

```text
GET  /__content/collections
GET  /__content/:collection
POST /__content/:collection
```

Save flow:

```text
editor payload
    ↓
schema validation
    ↓
cross-reference validation
    ↓
game/content invariant validation
    ↓
atomic write to whitelisted JSON file
    ↓
success
```

Never accept an arbitrary path from the browser and write to it.

Files saved by the editor are normal repo files and should appear directly in `git diff`.

---

## Validation layers

Validation should be explicit and layered.

### Schema validation

Examples:

- required fields;
- number vs string vs boolean;
- integer constraints;
- min/max;
- enum values;
- discriminated-union shape.

### Content-reference validation

Examples:

- weapon references an existing missile;
- ship references an existing weapon;
- preset references valid content IDs.

### Game-specific invariant validation

Only where schema/reference validation is insufficient.

Examples might include:

- values that must have an ordering relationship;
- logically incompatible combinations;
- duplicate IDs.

Do not duplicate engine runtime rules merely because the editor exists.

---

## First vertical slice

Start with **Officer Task Tuning**.

This slice is intentionally small and should prove the entire infrastructure.

Target editable fields include, where appropriate:

- base duration;
- `showProgress`;
- `canBeCancelledByPlayer`;
- `canBeInterruptedByDamage`.

The UI may present command + task information together for usability, but domain ownership should remain separated.

Do not merge command semantics and officer task semantics into one engine object just because one editor screen shows both.

The first slice should prove:

1. runtime schema;
2. JSON-backed editable data;
3. validation;
4. game consumption of validated data;
5. local editor;
6. load/edit/save;
7. git-visible file changes;
8. existing game behavior preserved by migrated baseline values.

---

## Planned migration sequence

### Phase 1 — infrastructure + Officer Task Tuning

- choose schema library;
- establish content schema/data/validation seam;
- add editor dev entry point;
- build generic primitive form renderer;
- migrate officer task tuning;
- preserve current behavior exactly;
- add validation/tests.

### Phase 2 — weapons + missiles

Prove:

- discriminated unions;
- richer numeric tuning;
- collection references;
- add/clone/delete;
- migration away from closed IDs where needed.

### Phase 3 — defenses + enemy behavior

Expose tuning for:

- power core;
- shield emitter;
- defense turret as appropriate;
- ship/enemy behavior presets.

This phase should directly support rapid enemy-AI/combat tuning.

### Phase 4 — migrate only on demand

Do not convert every content file just because the infrastructure exists.

Move additional catalogs/presets into editor-friendly data only when there is a real development need.

---

## Enemy behavior target

This initiative exists partly to make enemy behavior experimentation cheap.

Expected future editable behavior parameters may include things like:

- offensive task delay;
- decision interval;
- reaction delay;
- defensive reaction windows;
- threat priorities;
- SPAM purge priority;
- sticky-mine clear priority;
- weapon preference weights.

These are examples, not current contracts.

Do not invent the final enemy behavior schema before the gameplay policy is designed.

---

## Non-goals

Do not turn this into:

- a general game engine editor;
- Unity/Unreal-style scene tooling;
- a Phaser editor;
- a universe/map editor unless later needed;
- an arbitrary filesystem browser;
- an editor for runtime mutable state;
- a giant theme/UI project;
- a generic plugin framework;
- a new database server;
- a custom schema language;
- a requirement to migrate all existing content immediately.

---

## Architecture guardrails

- Engine remains gameplay truth.
- Editable files contain content/tuning, not runtime mutable state.
- Runtime schemas describe editable data, not engine algorithms.
- Catalog facades may preserve ergonomic existing engine APIs.
- Editor UX must not dictate domain ownership.
- No duplicated "editor validation" and "game validation" implementations.
- No generated TS source on every normal edit unless a future concrete need proves it necessary.
- No broad refactor by file length while doing this initiative.
- Each migration atom should preserve gameplay before introducing new tuning values.

---

## Testing / completion expectations

Every migration atom should normally prove:

- schema accepts current valid content;
- schema rejects representative invalid content;
- duplicate IDs are rejected;
- broken references are rejected when references exist;
- game consumes the validated data;
- migrated baseline behavior is unchanged;
- editor can load and save the collection;
- save cannot escape whitelisted files.

Keep existing project discipline:

- `npm run typecheck`
- `npm test`
- runtime smoke where relevant
- `git -c core.safecrlf=false diff --check`

---

## Patch delivery rules

Existing project patch rules remain mandatory.

Especially:

1. patch scripts are delivered only inside `.zip`;
2. successful patch scripts delete their own `.mjs`;
3. fetch fresh `master` HEAD before every coding atom;
4. guard expected HEAD;
5. guard clean tracked state unless repairing a known failed atom;
6. preserve EOL style;
7. normalize touched text files to one newline at EOF;
8. validate planned transforms before writing where practical;
9. run `git -c core.safecrlf=false diff --check`;
10. failed patchers remain on disk for diagnosis.

---

## Success state for the initiative

This initiative is successful when tuning a combat parameter no longer requires searching through engine code.

A normal workflow should become:

```text
npm run editor
→ open collection
→ change value
→ Save
→ inspect git diff
→ run/play
→ repeat
```

The engine should remain as explicit and boring as before.

The tool exists to reduce cognitive load during gameplay iteration, not to make the architecture more clever.
