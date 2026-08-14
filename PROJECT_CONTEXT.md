# Space Captain — Project Context

Updated: 2026-08-15
Reference HEAD for this handoff: `e7fb792e430d6745ae50c7d7ddb84513fe5bc918`

This is the primary context for a fresh chat. Current GitHub `master` is always the source of truth. Re-read the repository before every coding atom; the reference HEAD above is only the handoff baseline.

## Immediate next work

The project is now moving from infrastructure/content work into **combat iteration**.

Selected sequence for the next chat:

1. **Fix weapon targeting semantics**
   - current code incorrectly applies the same generic 3000 ms `TARGETING` phase to every weapon family;
   - targeting should remain only where it is the actual weapon mechanic;
   - Missile Launcher keeps a real targeting/lock phase;
   - Beam Cannon should begin directly in CHARGING;
   - SPAM should begin directly in CHANNELING;
   - Sticky Mine Dispenser should begin directly in DISPENSING;
   - remove the generic telepathic “something is about to happen” warning contract and let real weapon-start events provide telegraphing.

2. **Add a Single Mine test weapon**
   - do not replace the current salvo dispenser;
   - add a second content definition in the same Sticky Mine Dispenser family;
   - intended experiment: `salvoSize = 1` with short enough timing/cooldown to let the player deliberately fire repeated single mines;
   - keep current salvo weapon available so both mechanics can be compared directly in Debug Start.

3. **Gameplay-fidelity visual pass**
   - not final art;
   - redesign both dashboard panels around the real combat loop;
   - move the bridge visually closer to a small Space Quest-era ship bridge and away from the current “hangar” feeling;
   - replace ugly placeholder missiles;
   - add basic combat juice such as impact screen shake / short flash;
   - adopt compact threat objects instead of long Excel-like threat rows.

The goal is to get to a combat build that is visually representative enough to judge **fun**, not to finish art.

## Latest completed fixes

Current `master` is green after these fixes:

- duplicate same-kind player weapons are supported by the app/dashboard presentation path;
- Debug Start can currently install four Missile Launchers on the player ship;
- incoming enemy missiles remain actionable/analyzable after their source enemy actor is destroyed;
- enemy destruction presentation no longer pauses the authoritative encounter simulation for the 600 ms explosion;
- the enemy destruction completion event no longer owns `isEncounterInteractive`;
- starter-hull tests no longer assume a magic hull value of `3`; they assert preservation of the actual initial runtime value instead;
- temporary accidental recovery patcher committed during the last sequence was removed again.

Important physical-threat contract:

> Once an actor-launched missile exists and targets `PLAYER_SHIP`, it remains an actionable physical threat independently of the source actor lifecycle.

Important presentation/simulation contract:

> Enemy destruction animation is presentation only. It must not pause `EncounterEngine.step()`, projectiles, tasks, recharge, or other encounter simulation.

## Read order for a fresh chat

1. `PROJECT_CONTEXT.md`
2. `GAMEPLAY_CONTRACTS.md`
3. `SYSTEM_MAP.md`
4. `BACKLOG.md`
5. `CAPTAIN_DASHBOARD_HANDOFF.md` for current combat UI work
6. `BRIDGE_ART_DIRECTION.md` for the upcoming gameplay-fidelity visual pass
7. `CONTENT_TOOLS_HANDOFF.md` only when returning to editor/content infrastructure
8. `REFACTOR_HANDOFF.md` only as completed audit rationale/history

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
- bitmap font: `pixel_operator`
- TypeScript `strict`, `noUnusedLocals`, `noUnusedParameters`
- normal validation: `npm run typecheck` then `npm test`
- user performs runtime smoke and pushes commits

## Working style

- Russian replies, short/direct/practical.
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
6. A failed temporary patcher must remain on disk for diagnosis.
7. A fully successful temporary patcher must clean up its patcher lineage:
   - delete **itself**;
   - delete every explicit obsolete ancestor patcher from the same atom/recovery chain if one exists;
   - first-attempt success therefore deletes only itself;
   - if `v1` failed and `v2` succeeds, `v2` deletes both `v1` and itself;
   - if several recovery attempts exist, the final successful script deletes all explicitly listed ancestors plus itself.
8. Ancestor cleanup must be **narrow and explicit**:
   - exact known temporary filenames only;
   - no broad `*.mjs` glob deletion;
   - only paths inside the repo/root patcher location;
   - never delete real project tooling.
9. `vite.config.mjs` and other real project `.mjs` files are not temporary patch scripts and must never be removed.
10. Self/ancestor cleanup happens only after all writes and post-guards have succeeded. If validation fails, keep the current script and its ancestors for diagnosis.

If a task-specific handoff conflicts with this section, this section wins.

## Patch construction rules

- Fetch fresh `master` and inspect exact files/callers/tests before preparing a patch.
- Guard the exact expected HEAD for a normal atom prepared against a known clean commit.
- Guard tracked clean state before writes, except explicit recovery atoms for known dirty state.
- Recovery patchers must guard the exact expected dirty/untouched targets rather than pretending the worktree is clean.
- Prefer structural/contextual anchors over brittle whitespace-only replacement.
- If an anchor is not unique, scope the transform structurally (for example to a named test/function) before writing.
- Validate all planned transforms before the first write when practical.
- Preserve file EOL style; Windows CRLF is common.
- Leave exactly one newline at EOF in touched text files.
- Finish with post-assertions and `git -c core.safecrlf=false diff --check`.
- Before deleting a helper/query/type, search all source + test consumers.
- `git grep` does not see untracked files; filesystem-scan newly created/renamed files when necessary.
- During mass renames, remember that the unstaged Git index may still list old tracked paths. Distinguish old index paths from files that physically still exist.
- Avoid broad substring import removal: exact old import paths and word-boundary symbol guards are safer.
- Do not delete AST/expression nodes merely because nested text contains a legacy token.
- Do not `.trim()` raw `git status --porcelain` before parsing its leading XY status field.
- On Windows, invoke npm through `cmd.exe` / `ComSpec` from patchers when patchers run npm.

## Core combat design target

The combat game is slow tactical pressure, not bullet hell.

Desired emotional mix:
- enough time to understand and decide;
- enough overlap/resource/crew pressure to create stress;
- visible consequences;
- no single obvious procedural response to every situation.

Stress should come from conflicts such as:
- Weapons is committed to an attack while an incoming threat appears;
- Science is occupied when uncertain intel matters;
- shared Power Core cannot satisfy every defense;
- player may consciously accept one hit to keep offensive tempo;
- enemy defense/repair competes with its offense.

The immediate design test is deliberately small:

> Make one combat encounter that the player wants to play again immediately.

Do not optimize late-run balance or “broken roguelite builds” before the base fight is fun.

## Current Debug Start baseline

Current `debug_start.json` at the handoff HEAD:

Player:
- maxHull: 30
- BASIC drive/core/shield/turret
- 4 × `missile_launcher_00`

Enemy:
- `generic_00` chassis
- BASIC drive/core/shield/turret
- 1 × `missile_launcher_00`
- other weapon slots empty

Debug Start is editable content and tests should not hardcode mutable values that are irrelevant to the contract under test.

## Defensive modules

Settled terms:
- `Power Core`
- `Ship Drive`
- `Shield Generator`
- `Defense Turret`

### Shared Power Core

- one defensive energy budget;
- Defense Turret and Shield Generator consume it;
- no private Defense Turret charge/ammo pool;
- committed energy is not refunded after later cancellation/interruption;
- exact tuning is content data.

### Shield Generator / Active Shield

- Shield Generator = installed persistent hardware;
- Active Shield = encounter-local temporary effect;
- current Active Shield absorbs one Beam Cannon hit or expires;
- break/repair work remains incomplete.

### Defense Turret

- separate installed system;
- one missile intercept flow;
- current BASIC blind chance = 0.4;
- player and enemy interception share the same resolver;
- player installed break/repair lifecycle remains future work.

## Weapon lifecycle design — current code vs selected next design

### Current implementation

There is one shared `SHIP_WEAPON_TARGETING_DURATION_MS`, sourced from:

`ship_weapon_rules.json -> enemy_targeting.durationMs = 3000`

Despite the name, current player and enemy weapon runners both use it.

Current generic phase model includes:
- READY
- TARGETING
- CHARGING
- CHANNELING
- DISPENSING
- COOLDOWN

The current generic enemy warning path starts at weapon work start through `PLAYER_SHIP_TARGETING_DETECTED`, then real weapon events later replace/clear it.

### Selected next semantic model

Do **not** delete `TARGETING` globally.

Use phases because they mean something for the concrete weapon:

- Missile Launcher:
  - READY -> TARGETING/LOCKING -> LAUNCH -> COOLDOWN
  - Weapons must minimally participate before launch;
  - targeting/locking itself is a real observable telegraph.

- Beam Cannon:
  - READY -> CHARGING -> FIRE -> COOLDOWN
  - no generic pre-targeting;
  - charging is the commitment/channel and the telegraph;
  - Weapons remains occupied while the weapon phase requires an operator.

- SPAM:
  - READY -> CHANNELING -> COOLDOWN
  - no generic pre-targeting;
  - the channel beginning is the visible attack start.

- Sticky Mine Dispenser:
  - READY -> DISPENSING -> COOLDOWN
  - no generic pre-targeting;
  - current salvo behavior can remain as one dispensing operation;
  - Single Mine experiment will reuse the same family with `salvoSize = 1`.

Reaction time should come from each weapon’s real lifecycle/tuning, not from an artificial universal +3 s pre-warning.

## Missile gameplay/content

There is no standalone Missile content entity.

Missile Launcher owns physical projectile tuning:
- name
- damage
- flight duration
- ammo capacity
- cooldown duration

Every concrete projectile owns hidden runtime signature truth. Observer Science knowledge is separate:
- UNKNOWN
- UNCERTAIN
- CONFIRMED

Interception:
- correct concrete hypothesis -> guaranteed HIT;
- wrong/no hypothesis -> Defense Turret blind chance;
- blind MISS leaves missile alive.

A source actor may die while its missile remains active. The projectile remains an independent physical threat until resolved.

## Sticky Mine gameplay/content

There is no standalone Sticky Mine content entity.

Sticky Mine Dispenser owns:
- damage
- fuse duration
- ammo capacity
- salvo size
- launch interval
- cooldown duration

Every attached mine is independent runtime state.

Selected experiment:
- keep existing salvo dispenser;
- add a second Single Mine content definition in the same weapon family;
- compare one-command salvo vs repeated deliberate single-mine commands before choosing/removing either behavior.

Do not create a new weapon kind/runner only to test `salvoSize = 1`.

## Beam Cannon

Current heavy precision energy weapon is **Beam Cannon**.

Design intent:
- effectively free in ammo/resource terms;
- its primary price is operator commitment/time;
- long offensive commitment is intentional until combat testing proves it merely frustrating;
- future semantic targeting can include HULL / hardpoints / officers/systems;
- this makes the “free” shot strategically expensive through occupied Weapons time.

Do not knee-jerk convert it into a missile-like “quick aim then autonomous charge” before real combat testing.

## Content editor state

Current editor infrastructure is real and green.

Important completed pieces:
- Ship Modules CRUD;
- four Ship Weapons CRUD families;
- Officer Tasks split by role/shared;
- Enemy Behavior content;
- Debug Start player/enemy loadout editing;
- generic content-reference dropdowns;
- weapon-slot references across all weapon families;
- open string weapon IDs with cross-family uniqueness/reference validation.

This work is not the current priority. Return only when combat iteration requires content/tool support.

## Combat read-model architecture

`EncounterState` is authoritative mutable truth.

`EncounterPresentationSnapshot` is the normal detached app-facing frame root.

Events represent discrete transitions; snapshots represent current truth.

Enemy behavior flow is intentionally separated:
- decision snapshot / perceived facts;
- `EnemyDecisionPolicy`;
- `EnemyWorkExecutor`;
- `EnemyCrewTaskRunner`;
- specialized physical combat runners;
- `EnemyThreatObserver` / Science intel boundary.

Do not collapse enemy behavior into a god object.

Physical weapon runners are shared where appropriate between player/enemy. Do not move all combat physics into enemy AI.

There is no global authoritative `combatEnded` / `combatActive` engine flag. Do not add one merely because an enemy actor disappears.

## Refactor checkpoint

The broad refactor pass is historical/completed.

Only refactor when concrete evidence appears:
- duplicated gameplay rule;
- unclear ownership;
- context reconstruction;
- callback spaghetti;
- hostile method/type signatures;
- stale semantic layer that actively obscures current behavior.

The current universal weapon targeting layer is a valid cleanup target because it now obscures weapon-specific semantics.
