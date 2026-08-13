# Space Captain — Refactor Handoff

Created: 2026-08-13
Completed: 2026-08-14
Reference completion HEAD: `65a983b7460b66bf85a2753844540c78bf8bbe45`

**STATUS: COMPLETED / GREEN. THIS IS NO LONGER THE IMMEDIATE NEXT TASK.**

This file is retained as the rationale and audit checklist for the completed post-gameplay/content-editor refactor. Do not restart a broad cleanup pass from this document alone.

Completion highlights:
- normal bridge frame reads now flow through `EncounterPresentationSnapshot`;
- command-menu/navigation app reads were migrated to the aggregate snapshot;
- initial encounter presentation uses a safe `EncounterSpacePresentationSnapshot`;
- `ENCOUNTER_LOADED` is marker-only and no longer exposes `EncounterState`;
- missile events cross a central sanitized outbox as `MissileEventProjectileSnapshot`;
- objective missile signature and concrete observer hypothesis remain engine-only;
- focused engine getters were intentionally retained where they remain useful as narrow test/debug/domain seams.

# NON-NEGOTIABLE PATCH DELIVERY

This must survive context switches.

- **Never send the user a bare `.mjs` patch/recovery script.**
- **Every temporary `.mjs` script must be packaged inside a `.zip` artifact.**
- Applies to normal atoms, one-line fixes, recoveries, migrations, cleanup scripts, and doc patchers.
- Do not also expose the bare `.mjs`.
- Successful temporary patcher self-deletes after all writes + guards.
- Failed patcher remains on disk.
- Cleanup may remove only our temporary patchers, never project tooling such as `vite.config.mjs`.

Read the complete global rules in `PROJECT_CONTEXT.md`.

---

## Why this refactor was scheduled

Recent work changed several connected areas:

1. local content editor/data infrastructure
   - JSON/Zod content
   - CRUD-ready Ship Chassis / Drives / Power Cores / Shield Generators / Defense Turrets
   - local write server/reference protection
2. defensive systems
   - shared Power Core
   - Shield Generator / Active Shield
   - Defense Turret as installed system
3. enemy behavior
   - defensive Defense Turret / shields / mine clearing / SPAM behavior
4. missile contract
   - per-projectile hidden runtime signature
   - observer Science intel
   - qualitative uncertainty
   - one Defense Turret intercept command
   - blind probability
   - safe app presentation snapshot boundary
5. captain dashboard/presentation
   - direct threat actions
   - missile UNKNOWN/UNCERTAIN/CONFIRMED status
   - numeric `TURRET 40%`

The code is green, but incremental atoms and recoveries often leave cognitive debt even when behavior is correct.

The goal is to find and remove that debt **before** adding Missile Launcher + Missiles editor CRUD.

---

## Starting state

At reference HEAD:

- `npm run typecheck` green
- full `npm test` green
- runtime smoke green

Runtime missile smoke validated:
- player missiles can be intercepted by enemy Defense Turret;
- blind enemy miss leaves missile in flight;
- later retry can hit;
- enemy new-game defense sandbox now mounts one missile launcher;
- enemy -> player missile Science/Defense Turret flow works in runtime.

Do not change gameplay behavior during cleanup unless a bug is demonstrated and discussed.

---

## Refactor objective

Reduce cognitive load.

Good outcomes:
- fewer context hops;
- clearer ownership;
- simpler signatures;
- fewer duplicated rules;
- fewer stale compatibility/semantic names;
- less fixture boilerplate where a local helper genuinely helps;
- one obvious place to change a rule;
- explicit code even when slightly longer.

Bad outcomes:
- “clean architecture” for its own sake;
- generic framework replacing readable specialized code;
- player/enemy unification just for symmetry;
- base classes/interfaces without multiple real consumers;
- moving code only to make files shorter;
- broad rewrites while behavior is already green.

---

## Required first step — audit before patches

Fresh chat must:

1. fetch current `master`;
2. read:
   - `PROJECT_CONTEXT.md`
   - `REFACTOR_HANDOFF.md`
   - `GAMEPLAY_CONTRACTS.md`
   - `SYSTEM_MAP.md`
   - `BACKLOG.md`
   - `CONTENT_TOOLS_HANDOFF.md`
3. inspect current source/tests, not only docs;
4. produce a short ranked list of **proven** refactor candidates;
5. discuss the list with the user before the first broad refactor atom.

Do not manufacture work to fill the list.

---

## High-value audit areas

These are candidates, not guaranteed problems.

### A. Stale missile naming / semantic debt

Gameplay no longer has red/blue spectral bands, but historical identifiers remain, including likely:
- `BASIC_RED_FULL_00`
- `BASIC_BLUE_FULL_00`
- `GENERIC_MISSILE_RED_00`
- `GENERIC_MISSILE_BLUE_00`
- related node-actor aliases/tests

Audit whether a narrow semantic rename now reduces confusion.

Do not confuse this with hidden `signature_a/signature_b`:
- A/B is still real hidden runtime truth used by Science correctness/interception;
- it is intentionally not player-facing;
- only remove/change it if a simpler domain representation preserves the actual mechanic.

### B. Missile truth -> intel -> interception -> presentation boundary

Inspect:
- `MissileCombatProjectileState`
- `missile_signature_intel.ts`
- `resolve_missile_signature_analysis.ts`
- `resolve_missile_interception.ts`
- player/enemy consumers
- `MissilePresentationSnapshot`
- bridge mappers/events/views

Questions:
- is hidden truth ever reconstructed/leaked outside engine?
- is hypothesis/status mapping duplicated?
- is the safe snapshot shape explicit and easy to follow?
- did recovery work leave awkward adapter code?

Preserve invariant:
- app receives status, not objective signature/hypothesis.

### C. Player Defense Turret installed/persistence path

Defense Turret recently became real `PlayerShipState` hardware.

Trace:
- new-game preset/factory
- `GameRuntime`
- `BridgeEncounterController`
- encounter state
- runner/lifecycle
- presentation snapshot/dashboard

Look for:
- state copied/reconstructed unnecessarily;
- persistent vs encounter-local ownership ambiguity;
- missing synchronization that is currently harmless only because a field is not mutated;
- signatures carrying more context than needed.

Do not invent a persistence abstraction if ownership is already clear.

### D. Enemy defensive behavior context travel

Inspect:
- `EnemyDecisionPolicy`
- `EnemyTaskScheduler`
- `EnemyCrewTaskRunner`
- Science intel/observation
- Defense Turret/shield/mine behavior callbacks

Look specifically for:
- context being rebuilt multiple times;
- callback chains;
- duplicated target validation;
- hostile method signatures;
- policy knowing more state than it needs.

Do not collapse into one enemy god object.

### E. Combat presentation/snapshot synchronization

Recent work added:
- safe missile presentation snapshots;
- Defense Turret blind chance in player status;
- multiple synchronized bridge consumers.

Inspect:
- `combat_presentation_snapshot.ts`
- `BridgeEncounterSnapshotSynchronizer`
- captain dashboard mappers
- incoming missile sync/view

Look for:
- duplicated frame projections;
- repeated optional object reconstruction;
- app mapping the same engine concept twice;
- hidden state leaking through too-broad types.

Do not merge specialized mappers solely to reduce file count.

### F. Content editor / content-data seams

Because several collections were migrated incrementally, inspect:
- Zod schemas
- JSON catalogs
- collection registry metadata
- add/delete/reference checks
- server route/write whitelist
- CRUD tests/fixtures

Look for:
- copy-paste plumbing across collections;
- same reference-validation rule expressed in multiple places;
- collection-specific branches that no longer need to exist;
- generic helpers that became more complicated than explicit code;
- test setup boilerplate that obscures intent.

Do not build a universal content framework.

### G. Tests after incremental recovery atoms

Many tests were mechanically migrated.

Audit:
- giant exact snapshots that are brittle without proving meaningful contracts;
- repeated construction of installed Defense Turret/player ship/missile presentation state;
- tests importing hidden truth when they only test app presentation;
- duplicated helper logic.

Prefer focused contract assertions over enormous snapshots when the snapshot itself is not the contract.

---

## Explicit non-targets unless evidence appears

Do not attack these by default:
- `EncounterEngine` because it is central/long
- `BridgeController` because it is a composition root
- `CombatRunner` because it is long
- `EncounterStateStore` facade
- declarative event unions
- specialized combat runners
- specialized threat row views
- separate captain/player-weapon mappers
- Phaser view classes merely for having many rendering lines

File length is not evidence.

---

## Gameplay invariants the refactor must preserve

### Missiles

- runtime signature is per projectile, hidden;
- model/id does not reveal signature;
- UNKNOWN = no hypothesis;
- UNCERTAIN = concrete hypothesis, may be correct/wrong, retryable;
- CONFIRMED = concrete truthful hypothesis, terminal;
- correct hypothesis -> guaranteed HIT;
- wrong/no hypothesis -> blind turret chance;
- BASIC blind chance currently 0.4;
- MISS leaves missile alive;
- committed turret attempt costs Power Core;
- one player intercept command;
- presentation receives status only;
- Science confidence is qualitative, equipment chance is numeric.

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
- observer intel separate from truth.

### App boundary

- engine owns availability/rules;
- app maps real commands and safe snapshots;
- views do not calculate combat outcomes.

---

## Refactor atom discipline

Prefer several small atoms over one huge rewrite.

For each atom:
1. state the concrete problem;
2. state the simplification;
3. patch only that surface;
4. `npm run typecheck`;
5. focused tests if useful;
6. full `npm test` before calling the atom closed;
7. runtime smoke after changes that could affect encounter/content-editor behavior;
8. user pushes only after green.

After user says pushed, re-fetch GitHub HEAD before next atom.

---

## Expected end state

Refactor is done when:
- no high-value proven cleanup remains;
- code is easier to navigate than before;
- no gameplay/editor behavior intentionally changed;
- typecheck green;
- full tests green;
- relevant runtime/editor smoke green;
- docs updated if ownership/names changed.

Then move to:

**Missile Launcher + Missiles content/editor migration** in `CONTENT_TOOLS_HANDOFF.md`.

Do not continue feature work inside the refactor chat merely because cleanup finished early.
