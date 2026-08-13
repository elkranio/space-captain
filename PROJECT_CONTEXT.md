# Space Captain — Project Context

Updated: 2026-08-13
Reference HEAD for this handoff: `b06c3da83387b267ba7a92a3ad0024834382e903`

This is the primary context for a fresh chat. Current GitHub `master` is always the source of truth. Re-read the repository before every coding atom; the reference HEAD above is only the handoff baseline.

## Immediate next task

**Post-gameplay/content-editor refactor pass.**

Read `REFACTOR_HANDOFF.md` immediately after this file.

The missile / Science / Defense Turret gameplay refactor is complete, typecheck/tests are green, and runtime smoke has passed in both directions. Do not reopen missile design during the cleanup pass unless current code proves a real bug.

After the refactor is green, the next feature/content task is the Missile Launcher + Missiles editor/content migration described in `CONTENT_TOOLS_HANDOFF.md`.

## Read order

1. `PROJECT_CONTEXT.md`
2. `REFACTOR_HANDOFF.md` — immediate next task
3. `GAMEPLAY_CONTRACTS.md`
4. `SYSTEM_MAP.md`
5. `BACKLOG.md`
6. `CONTENT_TOOLS_HANDOFF.md` when editor/content work is relevant
7. `CAPTAIN_DASHBOARD_HANDOFF.md` when dashboard work is relevant
8. `BRIDGE_ART_DIRECTION.md` only for visual/layout work

Do not reconstruct current behavior from old chats when the repository can answer it.

## Project / stack

- Repo: `elkranio/space-captain`
- Branch: `master`
- Phaser 3 + TypeScript + p34t
- 1280×720
- engine/domain: `src/engine/...`
- bridge app/controller/view: `src/app/scenes/game/bridge/...`
- local content editor: `tools/content-editor/...`
- atlas key currently `atlas`
- TypeScript `strict`, `noUnusedLocals`, `noUnusedParameters`
- normal validation: `npm run typecheck` then `npm test`
- user performs runtime smoke and pushes commits

## Working style

- Russian, short/direct, practical.
- Small coherent atoms.
- Discuss architecture before broad changes.
- Refactor only when it reduces cognitive load, removes real duplication/hops, clarifies ownership, or fixes a demonstrated problem.
- Prefer explicit boring code over clever generic abstractions.
- Avoid speculative frameworks, generic registries, unnecessary base classes, and tiny classes “на будущее”.
- Preserve engine/app boundary: engine owns gameplay truth; app maps safe snapshots/events to presentation.
- GitHub access is read-only unless the user explicitly asks otherwise.
- The user applies patches locally, runs checks/runtime, and pushes.

# NON-NEGOTIABLE PATCH DELIVERY

These rules apply to **every coding chat and every task**, not only the current refactor.

1. **NEVER deliver a bare `.mjs` patch/recovery script to the user.**
2. **EVERY temporary `.mjs` patch, recovery, migration, cleanup or fix script MUST be packaged inside a `.zip` artifact.**
3. This includes tiny one-line recoveries. There is no “small enough to send bare” exception.
4. The user downloads the ZIP, extracts the `.mjs`, and runs it locally.
5. Do not additionally attach the bare `.mjs` “for convenience”.
6. A successful temporary patch script must delete its own `.mjs` file after writes and post-guards.
7. A failed script must remain on disk for diagnosis.
8. Successful recovery should narrowly remove obsolete temporary ancestor patchers.
9. `vite.config.mjs` and other real project tooling are **not** temporary patch scripts and must never be removed by cleanup.

If a future handoff or task-specific file conflicts with this section, **this section wins**.

## Patch construction rules

- Fetch fresh `master` and inspect exact files/callers/tests before preparing a patch.
- Guard the exact expected HEAD for a normal atom prepared against a known clean commit.
- Guard tracked clean state before writes, except explicit recovery atoms for known dirty state.
- Prefer structural/contextual anchors over brittle whitespace-only replacement.
- Validate planned transforms before the first write when practical.
- Preserve file EOL style; Windows CRLF is common.
- Leave exactly one newline at EOF in touched text files.
- Finish with post-assertions and `git -c core.safecrlf=false diff --check`.
- Before deleting a helper/query/type, search all source + test consumers.
- `git grep` does not see untracked files; filesystem-scan newly created files when necessary.
- Do not `.trim()` raw `git status --porcelain` before parsing its leading XY status field.
- On Windows, invoke npm through `cmd.exe` / `ComSpec` from patchers when patchers run npm.
- Prefer changed-line whitespace validation over failing on unrelated old whitespace.

## Current gameplay / bridge state

The bridge has four active officer roles:

- Science
- Weapons
- Helm
- Engineer

The captain dashboard is becoming the main command surface. The old officer context menu remains legacy coverage and should not be removed until dashboard command coverage is complete.

### Captain dashboard

Left/stable player side:
- HULL
- shared Power Core / DEF
- Defense Turret blind chance (`TURRET 40%` for current BASIC hardware)
- ENGINE
- MISSILE
- LASER
- MINES
- SPAM

Right/current combat context:
- one enemy summary
- enemy HULL + DEF
- incoming missiles
- incoming lasers
- hostile sticky mines
- hostile SPAM

Dashboard actions bind real `AvailableOfficerCommand` values. Views must not recreate engine availability.

Threat-row geometry is still provisional. Do not create a generic threat-row framework merely around the current layout.

## Defensive modules

Settled terms:
- `Power Core`
- `Ship Drive`
- `Shield Generator`
- `Defense Turret`

Current editor `SHIP MODULES` contains:
- Power Cores
- Drives
- Shield Generators
- Defense Turrets

### Shared Power Core

- shared defensive energy budget
- Defense Turret and Shield Generator consume it
- no private Defense Turret ammo/charge pool
- committed energy is not refunded after later cancellation/interruption
- exact tuning is content data

### Shield Generator / Active Shield

- Shield Generator = installed persistent hardware
- Active Shield = encounter-local temporary effect
- semantic rename from Shield Emitter is complete

### Defense Turret

- separate installed system
- one missile `INTERCEPT` flow; no red/blue beam choice
- current BASIC `blindInterceptChance = 0.4`
- player and enemy missile interception share the same resolver
- player installed broken/repair lifecycle remains future work

## Missile gameplay — COMPLETE

The old red/blue spectral-band mechanic is gone from gameplay.

Current contract:
- each concrete missile projectile owns hidden runtime `signature` truth;
- missile definitions/models do not own that signature;
- current internal A/B signature values are transitional hidden implementation truth, not player-facing color/frequency semantics;
- observer intel is separate from projectile truth;
- public intel states are `UNKNOWN`, `UNCERTAIN`, `CONFIRMED`;
- `UNCERTAIN` contains a concrete usable hypothesis which may be right or wrong;
- `CONFIRMED` must always contain the objectively correct hypothesis and is terminal;
- `UNKNOWN` and `UNCERTAIN` can expose Science analysis/re-analysis according to engine command availability;
- correct hypothesis -> guaranteed Defense Turret HIT;
- wrong hypothesis or no hypothesis -> equipment blind-intercept chance;
- blind MISS leaves the missile alive/in flight;
- a committed turret attempt still spends its normal Power Core cost;
- one deterministic injected RNG flow is used; UI does not roll;
- player-facing presentation receives `identificationStatus`, never objective signature/hypothesis;
- hard equipment odds are displayed numerically; Science confidence remains qualitative.

Current Science analysis profiles:
- `STANDARD`
- `IMPAIRED`

Confidence families:
- `CERTAIN`
- `STRONG`
- `WEAK`

Current hidden Science tuning is implementation tuning, not player-facing probability.

Runtime smoke passed:
- player missile -> enemy Defense Turret: immediate intercept and blind miss/retry behavior observed;
- enemy missile -> player: Science/Defense Turret flow observed after mounting a missile launcher on the new-game defense sandbox.

Important remaining semantic debt:
- some TypeScript preset IDs still contain historical `RED` / `BLUE` names (`BASIC_RED_FULL_00`, `BASIC_BLUE_FULL_00`, generic ship/node-actor aliases). They no longer mean missile color mechanics. Audit/rename during the refactor if it clearly reduces confusion.

## Content editor state

The local editor is real infrastructure:

- Vite + vanilla TypeScript
- light theme
- Zod runtime schemas
- plain JSON canonical editable content
- whitelisted local server write boundary
- generic schema-driven primitive controls
- dirty/save flow
- add/delete via collection metadata
- referenced-delete blocking
- chassis sprite asset management + atlas rebuild
- editor writes normal tracked repo content

CRUD-ready now:
- Ship Chassis
- Drives
- Power Cores
- Shield Generators
- Defense Turrets

Missiles and ship weapons are editor-readable but Missile Launcher + Missiles still need their post-refactor CRUD/content migration. Do that **after** the cleanup pass, not inside it.

## Combat read-model architecture

`EncounterState` is authoritative mutable truth.

`CombatPresentationSnapshot` is a detached one-frame read model, not a second state.

Missiles now have an explicit safe presentation boundary:
- engine projectile truth may contain hidden signature/hypothesis;
- `MissilePresentationSnapshot` does not;
- app receives physical missile fields plus `identificationStatus`;
- bridge payload/view layers do not import/use hidden missile truth.

Enemy behavior remains split:
- `EnemyDecisionPolicy` chooses work
- `EnemyTaskScheduler` builds explicit decision context and starts work
- `EnemyCrewTaskRunner` owns crew task lifecycle
- specialized combat runners own physical lifecycle
- Science observation/intel is separate from objective truth

Do not collapse this into an enemy god object.

## Refactor checkpoint

A targeted cleanup pass is now intentionally scheduled because a large amount of gameplay and editor/content code changed in a short period.

This is **not** permission to refactor by line count.

Settled non-problems unless new evidence appears:
- `BridgeController` as composition root
- `EncounterEngine` as facade/composition root
- long but cohesive `CombatRunner`
- `EncounterStateStore` facade
- long declarative event unions
- specialized threat rows
- specialized combat runners
- separate captain/player-weapon mappers
