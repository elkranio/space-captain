# Space Captain — Refactor Handoff

Created: 2026-08-13
Completed: 2026-08-14
Original completion HEAD: `65a983b7460b66bf85a2753844540c78bf8bbe45`
Current post-content baseline: `31445cf2b634f017a91e1035c29633c5f1e5c003`

**STATUS: COMPLETED / HISTORICAL. THIS IS NOT THE IMMEDIATE NEXT TASK.**

This file is retained only as rationale for the completed cleanup pass. Do not restart a broad refactor from this checklist.

## What the completed cleanup established

- normal bridge frame reads flow through `EncounterPresentationSnapshot`;
- initial encounter presentation uses safe encounter-space presentation data;
- `ENCOUNTER_LOADED` is marker-only;
- missile events cross a sanitized outbox boundary;
- objective missile signature and concrete observer hypothesis remain engine-only;
- focused engine getters remain legitimate narrow test/debug/domain seams;
- `EnemyDecisionPolicy`, scheduler, crew runner and physical runners remain separate by ownership.

## Work completed after the original refactor

The “next” content work described in the original version of this file is now also complete:

- separate Missile content entity removed;
- Missile Launcher owns physical missile tuning;
- separate Sticky Mine content entity removed;
- Sticky Mine Dispenser owns physical mine tuning;
- Ship Weapons split into four CRUD editor families;
- runtime still exposes one unified `SHIP_WEAPONS` catalog;
- heavy Laser renamed project-wide to **Beam Cannon**.

Do not schedule “Missile Launcher + Missiles editor migration” again.

# NON-NEGOTIABLE PATCH DELIVERY

- Never send a bare `.mjs` patch/recovery script.
- Every temporary `.mjs` script must be packaged inside a `.zip`.
- Applies to normal atoms, one-line fixes, recoveries, migrations, cleanup scripts, and doc patchers.
- Successful temporary patcher self-deletes after writes + guards.
- Failed patcher remains on disk.
- Never remove real project tooling such as `vite.config.mjs`.

Read the complete global rules in `PROJECT_CONTEXT.md`.

## Why the refactor was scheduled

Incremental gameplay/content work had touched:
- content editor/data infrastructure;
- defensive systems;
- enemy behavior;
- missile truth/intel/interception;
- captain dashboard/presentation.

The goal was to remove real cognitive debt before further feature/content work, not to pursue abstract architecture.

## Refactor objective

Good outcomes:
- fewer context hops;
- clearer ownership;
- simpler signatures;
- fewer duplicated rules;
- fewer stale semantic layers;
- one obvious place to change a rule;
- explicit code even when slightly longer.

Bad outcomes:
- “clean architecture” for its own sake;
- generic frameworks replacing readable specialized code;
- player/enemy unification just for symmetry;
- base classes/interfaces without multiple real consumers;
- moving code only to shorten files;
- broad rewrites while behavior is already green.

## Explicit non-targets unless evidence appears

Do not attack these by default:
- `EncounterEngine`
- `BridgeController`
- long cohesive `CombatRunner`
- `EncounterStateStore` facade
- declarative event unions
- specialized combat runners
- specialized threat-row views
- separate captain/player-weapon mappers
- Phaser views merely for having rendering lines

File length is not evidence.

## Gameplay invariants preserved by the cleanup

### Missiles
- hidden runtime signature is per projectile;
- observer knowledge is separate;
- UNKNOWN = no hypothesis;
- UNCERTAIN = concrete hypothesis, may be correct/wrong;
- CONFIRMED = truthful/terminal;
- correct hypothesis -> guaranteed HIT;
- wrong/no hypothesis -> blind turret chance;
- BASIC blind chance currently 0.4;
- MISS leaves missile alive;
- presentation does not receive objective signature.

### Defensive systems
- one shared Power Core;
- Shield Generator and Defense Turret consume it;
- Active Shield is encounter-local;
- Defense Turret is installed hardware.

### Enemy architecture
- policy chooses;
- scheduler validates/starts;
- crew runner times tasks;
- physical runners own weapon/defense phases;
- observer intel remains separate from truth.

### App boundary
- engine owns availability/rules;
- app maps real commands and safe snapshots;
- views do not calculate combat outcomes.

## Current refactor policy

Start another refactor pass only when at least one concrete problem exists:
- context travels too far;
- ownership is unclear;
- rule is duplicated;
- state is reconstructed in multiple places;
- callbacks form real spaghetti;
- signatures become cognitively hostile;
- stale compatibility layers actively obscure current behavior.

Do not manufacture refactor work before selecting the next gameplay/content goal.
