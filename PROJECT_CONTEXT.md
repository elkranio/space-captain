# Space Captain — Project Context

Updated: 2026-08-15
Reference HEAD for this handoff: `449524c811cd14b8ec933f74565cb6c8241bfdd0`

This is the primary context for a fresh coding chat. Current GitHub `master` is always the source of truth. Re-read the repository before every coding atom; the reference HEAD above is only the handoff baseline.

## Immediate next work

### 1. Bridge rebuild — NEXT

The visual bridge baseline changed substantially during the 2026-08-15 art pass.

First task in the next coding chat:

> Assemble the new bridge background and the new seated officer sprites, remove presentation that belongs to the old station art, verify the bridge in runtime, then stop.

Use `BRIDGE_REBUILD_HANDOFF.md` as the focused implementation handoff.

Do not mix this atom with dashboard redesign, projectile polish, officer conversation logic, or enemy captain AI.

### 2. Officer head-turn presentation

After the static bridge is assembled and green:

- each visible officer should support three authored sprite states:
  - idle / looking at own station;
  - look left;
  - look right;
- the sprite is a precomposed chair + body + head asset;
- head swapping is an art-production trick, not a required runtime layer system;
- first gameplay use: barks/conversation reactions toward the captain or another officer.

### 3. Captain dashboard / combat fidelity

After the bridge shell is stable:

- continue the captain dashboard redesign;
- replace long threat rows with compact threat objects;
- improve projectile motion/perspective and restrained hit juice;
- then play the same fight repeatedly and judge fun.

## Latest completed gameplay/code work

Current GitHub `master` includes the weapon-lifecycle cleanup.

The old universal weapon pre-targeting layer is gone.

Current weapon phase semantics:

- Missile Launcher:
  - `READY -> TARGETING -> launch -> COOLDOWN`;
  - targeting duration belongs to the Missile Launcher definition as `targetingDurationMs`.
- Beam Cannon:
  - `READY -> CHARGING -> fire -> COOLDOWN`.
- SPAM Projector:
  - `READY -> CHANNELING -> COOLDOWN`.
- Sticky Mine Dispenser:
  - `READY -> DISPENSING -> COOLDOWN`.

`EnemyWorkExecutor` starts the concrete physical phase for the accepted weapon work and emits generic `ENEMY_ATTACK_STARTED`.

Bridge presentation maps that to a short generic attack-warning pulse. Concrete missile/Beam/SPAM/mine lifecycle events remain separate.

The removed shared content layer must not be recreated just to make timing uniform.

Other important completed invariants:

- duplicate same-kind player weapons are supported by app/dashboard presentation;
- incoming missiles remain actionable after their source actor is destroyed;
- enemy-destruction animation does not pause authoritative encounter simulation;
- engine owns command availability; app/views do not recreate it.

## Single Mine experiment

A local/manual Single Mine experiment was tried after the weapon-lifecycle cleanup.

Design impression:
- manually firing individual mines feels mechanically good;
- impact is still unclear because mine clearing is currently easy;
- likely next mechanic experiment is to restrict mine clearing to Engineer only and compare again.

Do not treat the exact local Single Mine content state as canonical from this handoff. Inspect the user's working tree/current `master` before touching it.

## Current bridge art checkpoint

The new bridge visual direction is selected strongly enough to implement.

Background direction:
- early-1990s Sierra / Space Quest VGA spirit;
- chunky readable pixels;
- compact ship bridge, not hangar;
- large polygonal forward viewscreen;
- broad lower foreground reserved for captain dashboard;
- four officer stations integrated into the room.

The user cleaned the production candidate in Photoshop:
- viewscreen area is cut out / transparent;
- officer station monitors are blank dark surfaces;
- role labels on stations are removed.

Do not keep polishing the background before runtime assembly.

### Officer assets

New officers are authored as whole seated sprites:
- chair + body + head;
- transparent background;
- intended 3 states per officer: idle, look-left, look-right;
- four roles: Science, Weapons, Helm, Engineer;
- 12 final sprites when the set is complete.

Some recoloring/polish was not finished on 2026-08-15. That is not a blocker for the first bridge rebuild.

Canonical bridge seated-asset area already exists:

`assets/raw/images/bridge/officers/`

Current `_seated_00` assets there are legacy and should remain until the new bridge port is proven.

Do not confuse these with the older portrait-style role folders under `assets/raw/images/officers/...`.

## Old bridge presentation selected for removal

The new background already contains the consoles/stations, and the current station monitors are deliberately blank.

For the first rebuild remove the old presentation for:

- station monitor command/combat hint text;
- officer task text/progress presentation on station monitors;
- fake keyboard/touch-deck input pulses;
- ready/busy/blocked side lamps.

Do not remove engine officer task state or command availability. This is presentation cleanup only.

Keep legacy officer clicking/context-menu coverage unless the new geometry makes it impossible. The dashboard/navigation replacement is not complete yet.

## Read order for a fresh chat

1. `PROJECT_CONTEXT.md`
2. `BRIDGE_REBUILD_HANDOFF.md` — immediate next task
3. `GAMEPLAY_CONTRACTS.md`
4. `SYSTEM_MAP.md`
5. `BACKLOG.md`
6. `BRIDGE_ART_DIRECTION.md`
7. `CAPTAIN_DASHBOARD_HANDOFF.md` when returning to dashboard work
8. `CONTENT_TOOLS_HANDOFF.md` only for editor/content work

`REFACTOR_HANDOFF.md` was removed because that pass is completed historical context and its surviving rules are already captured in the living docs.

## Project / stack

- Repo: `elkranio/space-captain`
- Branch: `master`
- Phaser 3 + TypeScript + p34t
- target canvas: 1280×720
- engine/domain: `src/engine/...`
- bridge app/controller/view: `src/app/scenes/game/bridge/...`
- local content editor: `tools/content-editor/...`
- raw art: `assets/raw/images/...`
- packed live atlas: `assets/live/images/...`
- atlas key: `atlas`
- bitmap font: `pixel_operator`
- TypeScript `strict`, `noUnusedLocals`, `noUnusedParameters`

Normal validation:
- `npm run pack:tex` after raw image changes;
- `npm run typecheck`;
- `npm test`;
- runtime smoke;
- user pushes only after local validation.

## Working style

- Russian replies, short/direct/practical.
- Small coherent atoms.
- Discuss architecture before broad changes.
- Prefer explicit boring code over clever abstractions.
- Refactor only when it removes demonstrated cognitive debt.
- Preserve engine/app boundary.
- GitHub access is read-only unless the user explicitly requests a write.
- User applies patches locally, runs checks/runtime, and pushes.

# NON-NEGOTIABLE PATCH DELIVERY

These rules apply to every coding chat and every task.

1. Never deliver a bare temporary `.mjs` patch/recovery script.
2. Every temporary `.mjs` patch, recovery, migration, cleanup or fix script must be packaged inside a `.zip`.
3. Failed patchers remain on disk for diagnosis.
4. Successful patchers delete themselves only after all writes/post-guards succeed.
5. Recovery lineage cleanup is narrow and explicit: exact known temporary filenames only.
6. Never use broad `*.mjs` cleanup.
7. Never delete real project tooling such as `vite.config.mjs`.
8. Normal atoms guard exact expected HEAD.
9. Guard clean tracked state for normal code atoms unless the task explicitly must coexist with known local work.
10. Recovery/asset-aware atoms guard the exact targets they own instead of pretending unrelated local work does not exist.
11. Preserve EOL style and exactly one EOF newline.
12. Finish with post-assertions and `git -c core.safecrlf=false diff --check`.

## Core combat design target

Combat is slow tactical pressure, not bullet hell.

Desired pressure comes from conflicts:
- Weapons committed to offense while defense becomes urgent;
- Science occupied while intel matters;
- shared Power Core cannot satisfy every defense;
- accepting damage may be rational;
- enemy defensive work competes with offense.

The first real success criterion remains:

> One battle is good enough that the player wants to restart it immediately.

Do not optimize late-run progression before the base fight is fun.

## Core architecture checkpoint

`EncounterState` is authoritative mutable truth.

`EncounterPresentationSnapshot` is the normal detached app-facing frame root.

Events answer what just happened; snapshots answer what is true now.

Enemy behavior stays separated:
- perceived/decision snapshot;
- `EnemyDecisionPolicy`;
- `EnemyWorkExecutor`;
- `EnemyCrewTaskRunner`;
- specialized physical runners;
- observer/Science intel boundary.

Do not collapse this into a god object.

Physical threats can outlive their source actor.

There is no need for a global authoritative combat-ended flag just because the enemy actor disappears.
