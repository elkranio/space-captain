# Space Captain — Project Context

Updated: 2026-08-14
Reference HEAD for this handoff: `31445cf2b634f017a91e1035c29633c5f1e5c003`

This is the primary context for a fresh chat. Current GitHub `master` is always the source of truth. Re-read the repository before every coding atom; the reference HEAD above is only the handoff baseline.

## Immediate next task

There is **no hard-selected coding atom** at this handoff.

The large cleanup/content sequence is complete and green:

- encounter/app presentation boundary cleanup is complete;
- Missile Launcher owns missile physical tuning; there is no separate Missile content entity;
- Sticky Mine Dispenser owns mine physical tuning; there is no separate Sticky Mine content entity;
- Ship Weapons content is split into four real CRUD editor families;
- the former heavy Laser weapon was fully renamed to **Beam Cannon** across domain/content/editor/runtime/app/tests.

The next chat should start by reading fresh `master`, then continue the content-editor/content-data line from this clean baseline. A sensible first step is to runtime-smoke the current editor grouping/CRUD and choose the next concrete content/editor slice with the user. Do not recreate already-finished Missile/Sticky Mine migrations.

If the user deliberately selects gameplay work instead, current `master` remains the source of truth.

## Read order

1. `PROJECT_CONTEXT.md`
2. `GAMEPLAY_CONTRACTS.md`
3. `SYSTEM_MAP.md`
4. `BACKLOG.md`
5. `CONTENT_TOOLS_HANDOFF.md` for content/editor work
6. `CAPTAIN_DASHBOARD_HANDOFF.md` for dashboard/combat-context work
7. `REFACTOR_HANDOFF.md` only as completed audit rationale/history
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

These rules apply to every coding chat and every task.

1. **NEVER deliver a bare `.mjs` patch/recovery script to the user.**
2. **EVERY temporary `.mjs` patch, recovery, migration, cleanup or fix script MUST be packaged inside a `.zip` artifact.**
3. This includes tiny one-line recoveries.
4. The user downloads the ZIP, extracts the `.mjs`, and runs it locally.
5. Do not additionally attach the bare `.mjs`.
6. A successful temporary patch script must delete its own `.mjs` file after writes and post-guards.
7. A failed script must remain on disk for diagnosis.
8. Successful recovery may narrowly remove obsolete temporary ancestor patchers.
9. `vite.config.mjs` and other real project tooling are not temporary patch scripts and must never be removed by cleanup.

If a task-specific handoff conflicts with this section, this section wins.

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
- `git grep` does not see untracked files; filesystem-scan newly created/renamed files when necessary.
- During mass renames, remember that the unstaged Git index still lists old tracked paths. A filesystem postflight must distinguish old index paths from files that actually still exist.
- Avoid broad substring import removal: exact old import paths and word-boundary symbol guards are safer.
- Do not delete AST/expression nodes merely because nested text contains a legacy token.
- Do not `.trim()` raw `git status --porcelain` before parsing its leading XY status field.
- On Windows, invoke npm through `cmd.exe` / `ComSpec` from patchers when patchers run npm.

## Current gameplay / bridge state

The bridge has four active officer roles:

- Science
- Weapons
- Helm
- Engineer

The captain dashboard is becoming the main command surface. The old officer context menu remains legacy coverage and should not be removed until dashboard/navigation/engineering command coverage is complete.

### Captain dashboard

Left/stable player side:
- HULL
- shared Power Core / DEF
- Defense Turret blind chance (`TURRET 40%` for current BASIC hardware)
- ENGINE
- MISSILE
- BEAM CANNON
- MINES
- SPAM

Right/current combat context:
- one enemy summary
- enemy HULL + DEF
- incoming missiles
- incoming Beam Cannon threats
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

Current editor `Ship Modules` group:
- Power Cores
- Drives
- Shield Generators
- Defense Turrets

### Shared Power Core

- shared defensive energy budget
- Defense Turret and Shield Generator consume it
- no private Defense Turret charge/ammo pool
- committed energy is not refunded after later cancellation/interruption
- exact tuning is content data

### Shield Generator / Active Shield

- Shield Generator = installed persistent hardware
- Active Shield = encounter-local temporary effect
- current Active Shield absorbs one Beam Cannon hit or expires

### Defense Turret

- separate installed system
- one missile `INTERCEPT` flow
- current BASIC `blindInterceptChance = 0.4`
- player and enemy interception share the same resolver
- player installed broken/repair lifecycle remains future work

## Missile gameplay/content — CURRENT

The old red/blue spectral-band mechanic and separate Missile content entity are gone.

Current contract:
- Missile Launcher definition owns physical projectile tuning:
  - name
  - damage
  - `flightDurationMs`
  - `ammoCapacity`
  - `cooldownDurationMs`
- each launched projectile copies physical values needed for its autonomous flight;
- each concrete missile projectile also owns hidden runtime `signature` truth;
- observer intel is separate from projectile truth;
- public intel states are `UNKNOWN`, `UNCERTAIN`, `CONFIRMED`;
- correct hypothesis -> guaranteed Defense Turret HIT;
- wrong hypothesis or no hypothesis -> equipment blind-intercept chance;
- blind MISS leaves the missile alive/in flight;
- presentation receives player-visible identification state, never objective signature.

There is no separate Missiles JSON/schema/catalog/preset layer to recreate unless future selectable ammo types actually need one.

## Sticky Mine gameplay/content — CURRENT

The separate Sticky Mine content entity is also gone.

Sticky Mine Dispenser definition owns:
- name
- damage
- `fuseDurationMs`
- `ammoCapacity`
- `salvoSize`
- `launchIntervalMs`
- `cooldownDurationMs`

At launch/attach, runtime mine state receives physical values and becomes autonomous. Runtime `mineId` used by CLEAR MINE tasks/results is still valid runtime object identity and must not be confused with the removed content mine ID.

## Beam Cannon — CURRENT

The former heavy `Laser` weapon is now **Beam Cannon** everywhere in current project terminology.

Current role:
- slow charge;
- energy weapon;
- no ammunition economy;
- current enemy attack is a telegraphed threat;
- Active Shield is the current defensive response;
- future node-targeting / Science targeting contract is not implemented yet.

Do not reintroduce `Laser` as an alias for the current Beam Cannon. A future fast/weak starter laser is a separate design possibility, not current content.

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

Ship modules:
- Ship Chassis
- Drives
- Power Cores
- Shield Generators
- Defense Turrets

Ship weapons:
- Missile Launchers
- Beam Cannons
- Spam Projectors
- Sticky Mine Dispensers

`Ship Weapons` is an editor group, not a runtime hierarchy. Runtime still exposes one unified `SHIP_WEAPONS` catalog.

Weapon record IDs are open strings for editor-created records; stable builtin `SHIP_WEAPON_ID.*` constants remain convenience aliases. Weapon IDs must be unique across weapon families, and deleting a weapon still referenced by player/enemy ship presets is blocked.

There are no separate `Missiles` or `Sticky Mines` editor collections.

## Combat read-model architecture

`EncounterState` is authoritative mutable truth.

`EncounterPresentationSnapshot` is the normal app-facing detached frame read. It composes:
- navigation;
- safe encounter-space presentation;
- player/system/officer presentation;
- enemy/threat presentation;
- real command availability grouped by role.

`CombatPresentationSnapshot` remains a focused child projection used by the aggregate builder and narrow engine/test reads.

Current event rule:
- snapshots answer **what is true now**;
- events answer **what just happened**;
- `ENCOUNTER_LOADED` is a marker, not an `EncounterState` transport;
- missile event payloads are sanitized and do not expose hidden objective signature.

Enemy behavior remains split:
- `EnemyDecisionPolicy` chooses work
- `EnemyTaskScheduler` builds explicit decision context and starts work
- `EnemyCrewTaskRunner` owns crew task lifecycle
- specialized combat runners own physical lifecycle
- Science observation/intel is separate from objective truth

Do not collapse this into an enemy god object.

## Refactor checkpoint

The targeted cleanup pass plus the subsequent weapon-content simplifications are complete and green. Do not continue refactoring merely to reduce file length or remove focused seams.

Further cleanup should again require concrete evidence:
- duplicated rules;
- unclear ownership;
- context reconstruction;
- hostile signatures;
- real callback spaghetti;
- stale semantic layers that actively obscure current behavior.

Settled non-problems unless new evidence appears:
- `BridgeController` as composition root
- `EncounterEngine` as facade/composition root
- long but cohesive `CombatRunner`
- `EncounterStateStore` facade
- long declarative event unions
- specialized threat rows
- specialized combat runners
- separate captain/player-weapon mappers
