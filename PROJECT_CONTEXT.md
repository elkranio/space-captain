# Space Captain — Project Context

Updated: 2026-08-13
Reference HEAD before this docs handoff: `5f33f12374db9dfc5241e9bc300139e921e6a542`

This is the primary handoff for a fresh chat. Treat code at the current GitHub `master` as source of truth and re-check HEAD before every coding atom.

## Read order

1. `PROJECT_CONTEXT.md`
2. `GAMEPLAY_CONTRACTS.md`
3. `SYSTEM_MAP.md`
4. `BACKLOG.md`
5. `CONTENT_TOOLS_HANDOFF.md` for content/editor work
6. `MISSILE_REFACTOR_HANDOFF.md` for the immediate next task
7. `CAPTAIN_DASHBOARD_HANDOFF.md` when dashboard work is relevant
8. `BRIDGE_ART_DIRECTION.md` only when visual/layout work is relevant

Do not reconstruct current behavior from old chats when the repo can answer it.

## Project / stack

- Repo: `elkranio/space-captain`
- Branch: `master`
- Phaser 3 + TypeScript + p34t
- 1280×720
- core engine: `src/engine/...`
- bridge app/controller/view: `src/app/scenes/game/bridge/...`
- atlas key currently `atlas`
- TypeScript `strict`, `noUnusedLocals` and `noUnusedParameters` are enabled
- user runs typecheck/tests/runtime smoke and pushes commits

## Working style

- Russian, short/direct, practical.
- Small coherent atoms.
- Discuss architecture before broad changes.
- Refactor only when it reduces cognitive load or removes real duplication/hops.
- Prefer explicit boring code over clever generic abstractions.
- Avoid speculative frameworks, generic registries and tiny classes “на будущее”.
- Preserve engine/app boundary: engine owns gameplay truth; app maps snapshots/events to presentation.
- GitHub access is read-only unless the user explicitly asks otherwise.
- Before producing a patch, fetch fresh `master` HEAD and inspect exact current files/callers/tests.

## Patch delivery rules

These are mandatory.

1. **Every patch script is delivered inside a `.zip`. Never hand over a bare patch script.**
2. **On successful completion, the patch script deletes its own `.mjs` file.**
3. Guard the exact expected HEAD when the atom was prepared against a known commit.
4. Guard tracked clean state before writing, unless the patch is explicitly a recovery atom for a known dirty state.
5. Prefer exact/contextual replacements over heuristic broad transforms.
6. Preserve source EOL style; Windows CRLF is common.
7. Validate planned transforms before the first write when practical.
8. Normalize touched text files to exactly one newline at EOF before validation.
9. Finish with post-assertions and `git -c core.safecrlf=false diff --check`.
10. A failed patcher should remain on disk for diagnosis.
11. If a recovery patch replaces failed patchers, successful recovery should also remove known obsolete ancestor patchers.
12. Before deleting a compatibility helper/query, search **all** source + test consumers first.
13. For directory/file semantic renames, create target parent directories before `git mv`.
14. Do not `.trim()` raw `git status --porcelain` before parsing; preserve the leading XY status field.
15. `git grep` does not see newly created untracked files; filesystem-scan new files in post-validation.
16. On Windows, route npm execution through `cmd.exe` / `ComSpec` rather than relying on direct `npm.cmd` spawn.
17. Prefer changed-line whitespace validation / `diff --check`; do not fail on unrelated pre-existing whole-file whitespace.

## Current gameplay / bridge state

The bridge has four active officer roles:

- Science
- Weapons
- Helm
- Engineer

The captain dashboard is becoming the main command surface. The old officer context menu still exists as legacy coverage and should not be removed until the dashboard covers every required command path.

### Captain dashboard

Left side is stable player-ship state/actions:

- HULL
- shared Power Core / DEF
- ENGINE
- MISSILE
- LASER
- MINES
- SPAM

Right side is current combat context:

- one enemy ship summary
- enemy HULL + DEF
- incoming missiles
- incoming lasers
- hostile sticky mines
- hostile SPAM channels

Dashboard buttons bind to real `AvailableOfficerCommand` values. Views must not reproduce engine availability rules.

Threat-row geometry is still a prototype, not a contract. Do not build a generic threat-row framework around the current shape.

Likely future bridge navigation direction:
- left-side bridge tabs such as Combat / Engineering / Navigation;
- auto-switch to Combat when combat starts;
- switch to Navigation after combat;
- eventual leave/flee action can live naturally in this navigation structure.

Do not implement this until its UX is actually selected.

## Current defensive modules

Terminology is now settled:

- `Power Core`
- `Ship Drive`
- `Shield Generator`
- `Defense Turret`

These appear under **SHIP MODULES** in the local content editor.

### Shared Power Core

- shared defensive energy budget
- Defense Turret and Shield Generator consume it
- no private non-regenerating PD ammo/charges
- committed energy is not refunded by later cancellation/interruption
- exact tuning remains content data

### Shield Generator / Active Shield

`Shield Generator` is installed hardware.
`Active Shield` is the temporary encounter-local shield state/effect.

The full semantic rename `Shield Emitter -> Shield Generator` is complete.

### Defense Turret

The full semantic rename `Point Defense -> Defense Turret` is complete.

Current implementation still uses the old red/blue beam-band missile counter contract. **That contract is the immediate next gameplay refactor and should not be migrated into richer content CRUD before it is fixed.**

## Immediate next task — missile / Defense Turret refactor

Read `MISSILE_REFACTOR_HANDOFF.md`.

Approved design direction:

- remove missile model-level red/blue knowledge as the core counter mechanic;
- every launched missile gets its own hidden runtime maneuver/signature pattern;
- Science analyzes a **specific incoming missile** and produces a tracking solution for that projectile;
- identified/tracked missile: Defense Turret intercept is guaranteed;
- unidentified missile: firing is still allowed, but is a visible RNG risk;
- Defense Turret quality improves blind-intercept chance;
- missile quality reduces blind-intercept chance over the run;
- exact probability formula, field names and numbers are **not locked yet**;
- turret attempts still spend Power Core energy regardless of hit/miss;
- Science remains the deterministic answer and should not become obsolete through equipment progression.

Order of work:

1. refactor missile / Science / Defense Turret gameplay contract first;
2. get tests and runtime behavior stable;
3. only then migrate **Missile Launcher + Missiles** into editor-ready CRUD/content data;
4. continue content tooling after that.

Do not start the content migration first: the current missile schema encodes the mechanic we are about to remove.

## Content editor state

The local editor is now real infrastructure, not a proposal.

Current important facts:

- Vite + vanilla TypeScript local tool
- light theme
- Zod runtime schemas
- plain JSON editable content
- whitelisted local server routes
- generic schema-driven primitive form rendering
- save validation
- add/delete support by collection metadata
- referenced-delete blocking
- chassis sprite asset management / atlas rebuild tooling
- editor changes normal tracked repo files

CRUD-ready content currently includes:

- Ship Chassis
- Drives
- Power Cores
- Shield Generators
- Defense Turrets

`SHIP MODULES` sidebar currently contains:

- Power Cores
- Drives
- Shield Generators
- Defense Turrets

Missiles and ship weapons already exist as editor-readable collections but are still closed/static and are **not** the next atom until the missile mechanic refactor is complete.

See `CONTENT_TOOLS_HANDOFF.md`.

## Combat read-model architecture

`EncounterState` is authoritative mutable truth.

`CombatPresentationSnapshot` is a detached one-frame read model built from that truth. It is not cached and is not a second state.

`BridgeEncounterController` captures one coherent combat snapshot after the engine step and reuses it across current presentation consumers.

Enemy behavior remains deliberately split:

- `EnemyDecisionPolicy` chooses work
- `EnemyTaskScheduler` assembles explicit decision context, validates/schedules work and starts physical phases
- `EnemyCrewTaskRunner` owns crew-task lifecycle
- combat weapon/defense runners own physical lifecycle
- threat observation / science intel are separate from objective truth

Do not collapse this separation back into an enemy god object.

## Refactor checkpoint

The broad cleanup pass completed on 2026-08-13.

Do **not** resume broad refactoring because files are long. The missile task is a targeted gameplay contract refactor with a concrete design reason.

Settled non-problems:

- `BridgeController` as composition root
- `EncounterEngine` as facade/composition root
- long but cohesive `CombatRunner`
- `EncounterStateStore` facade
- long declarative event unions
- specialized threat rows
- specialized combat runners
- separate captain/player-weapon mappers
