# Space Captain — Missile / Defense Turret Refactor Handoff

Created: 2026-08-13
Reference HEAD before this handoff: `5f33f12374db9dfc5241e9bc300139e921e6a542`

**This is the immediate next coding task in the next chat.**

Do this gameplay refactor **before** making Missile Launcher / Missiles CRUD-ready in the content editor.

Always fetch fresh GitHub `master` first. The reference HEAD above is only the handoff baseline.

---

## Current problem

The current missile-defense contract is mechanically readable but has become too weak/dirty after other defense changes.

Current code uses:

```text
Missile definition
    red / blue spectral band

Science
    identifies band

Defense Turret
    loads matching red / blue beam
```

Current missile schema is closed around red/blue missile models.

### Design problem 1 — knowledge leaks across the launcher

If missile color/band is a property of the missile model, identifying one missile effectively teaches the player how to counter every other missile of that same kind.

The first reveal devalues later missiles in the same launcher/loadout.

### Design problem 2 — missiles lost threat weight

Defense Turret previously had finite non-regenerating private charges.

That was removed.

Defense Turret now consumes the shared regenerating Power Core, which is cleaner and should stay.

But together with easy persistent missile knowledge, that made missiles too cheaply solved.

Design intent:
- missiles are finite;
- relatively expensive / meaningful;
- a launch should feel like a serious incoming threat;
- missile relevance should not rely only on inflating damage.

---

## Approved replacement

### 1. Every launched missile has unique hidden runtime behavior

Each launched missile instance receives its own hidden maneuver/signature/pattern.

This is **not** shared model knowledge.

Conceptually:

```text
launcher fires missile A
    → hidden pattern A

launcher fires missile B
    → hidden pattern B

launcher fires missile C
    → hidden pattern C
```

Science knowledge about A does not reveal B or C.

Lore direction:
- missiles intentionally maneuver / vary guidance behavior to defeat automated defenses;
- Science analyzes the actual incoming trajectory/signature and derives a firing/tracking solution.

Exact fiction wording can change later.

### 2. Science analyzes a specific missile

Science action targets a concrete incoming projectile.

Successful analysis gives the player a tracking solution / identified state for that missile only.

The player-facing final wording does not need to literally say “signature”.

Possible UX language later:

```text
ANALYZE MISSILE
TRACKING SOLUTION ACQUIRED
```

Do not spend the refactor atom polishing copy.

### 3. Tracked missile = guaranteed Defense Turret intercept

If Science has solved the specific projectile:

```text
Defense Turret intercept = 100%
```

This is intentional.

Science is the deterministic counter and must remain relevant even against later-run missile technology.

### 4. Untracked missile = blind probabilistic intercept

Do **not** forbid firing.

The player may commit the Defense Turret against an unidentified missile and take a visible risk.

Conceptually:

```text
TRACKED
    guaranteed intercept

UNTRACKED
    blind intercept: X%
```

This is preferred over a hard “Science required” gate because it creates a captain decision instead of a mandatory two-button tax.

### 5. Blind attempt still costs Power Core energy

A turret attempt commits its normal Power Core cost whether the result is HIT or MISS.

Do not refund a miss.

The existing load/cooldown/operator lifecycle remains relevant.

### 6. Two parallel equipment progressions

Defense Turret progression:
- better turret → higher blind-intercept reliability.

Missile progression:
- better missile → harder to intercept blindly.

This prevents an early good turret from becoming a permanent 100% hard counter for the rest of the run.

Science still produces guaranteed interception and therefore remains strategically useful.

---

## Probability model — intentionally NOT finalized

Do not invent a complicated formula.

The design only requires:

```text
blind chance =
    turret quality
    opposed by missile quality
```

A possible simple implementation shape discussed was:

```text
turret blind chance
-
missile blind penalty
```

but this is **not yet a locked contract**.

Before coding, inspect the current call flow and choose the smallest representation that:

- is easy to display;
- is easy to tune later;
- allows turret progression;
- allows missile progression;
- cannot silently reach nonsensical values;
- does not create accuracy/tracking/evasion/sensor formula soup.

Exact numbers are not selected.

A minimum nonzero blind chance was discussed as potentially useful, but is not approved as a hard contract yet.

---

## Important architecture constraint — hidden truth

Current architecture deliberately separates objective combat truth from Science knowledge.

Preserve that.

Target conceptual flow:

```text
runtime missile
    hidden instance pattern / maneuver truth
        ↓
Science observation / intel
    knows or does not know this projectile
        ↓
Defense Turret resolution
    gets only the knowledge/result it is entitled to use
        ↓
presentation snapshot
    exposes player-readable tracked/blind state and chance
```

Do not let:

- dashboard/view read hidden missile pattern directly;
- captain mapper reconstruct Science certainty;
- enemy policy bypass the Science epistemic boundary;
- UI calculate hit chance independently from tuning/state.

The engine should own the authoritative intercept result/chance.

---

## Likely code surfaces to inspect fresh

Do not trust filenames in this handoff blindly; search fresh HEAD.

Start with:

- `src/engine/defs/missile.ts`
- `src/engine/defs/defense_turret.ts`
- missile combat/runtime state
- Defense Turret factory/runner
- missile runner / projectile impact flow
- Science threat observation/intel resolver
- officer command definitions/availability for missile identification and turret firing
- enemy scheduler/policy defensive response to player missiles
- `CombatPresentationSnapshot`
- captain combat context mapper
- incoming missile dashboard/view
- Defense Turret beam VFX/event payloads
- missile and defense behavior tests
- content schemas/catalogs only where compilation/tuning seams require it

At reference HEAD:

`src/engine/defs/missile.ts` still owns:
- `MISSILE_SPECTRAL_BAND`
- `MissileSpectralBand`
- closed `MISSILE_ID.RED_00 / BLUE_00`
- `MissileDefinition.spectralBand`

`src/engine/defs/defense_turret.ts` still owns:
- `DEFENSE_TURRET_BEAM_BAND`
- `DefenseTurretBeamBand`
- `loadedBand`
- shot outcome
- load/cooldown phases

These are prime legacy surfaces for the refactor.

---

## Suggested implementation decomposition

Do not force this exact atom count. Keep commits coherent.

### Atom A — domain/runtime contract

Goal:
- replace spectral-band truth with per-projectile runtime signature/pattern/tracking-compatible state;
- preserve missile lifecycle;
- preserve Defense Turret lifecycle;
- no editor CRUD yet.

Questions to resolve from code:
- where unique runtime signature is generated;
- whether the signature itself needs a concrete enum/value at all, or whether only “tracking solution acquired” needs to survive as player knowledge;
- smallest state shape that keeps hidden truth meaningful without decorative complexity.

Avoid creating a rich signature taxonomy if gameplay only needs per-instance uniqueness.

### Atom B — Science knowledge / command flow

Goal:
- analysis targets one missile;
- knowledge attaches to that projectile;
- no reveal propagation to same-model missiles;
- availability stays engine-owned.

Reuse existing observation/intel separation.

### Atom C — Defense Turret resolution

Goal:
- tracked → guaranteed;
- untracked → authoritative blind probability;
- Power Core spent on every committed attempt;
- HIT/MISS outcome remains explicit;
- enemy/player behavior remains coherent.

Prefer one canonical probability helper/query if both presentation and runner need the value.

Do not duplicate formula in UI.

### Atom D — presentation/tests cleanup

Goal:
- dashboard communicates tracked vs blind;
- blind chance is visible;
- remove obsolete red/blue counter semantics from player-facing flow;
- remove dead spectral-band compatibility code after exhaustive search;
- update tests/contracts.

Could merge with earlier atoms if the code surface is small.

---

## Test cases the final slice should prove

At minimum:

### Instance knowledge

- two missiles from the same model can coexist;
- identifying missile A does not identify missile B.

### Tracked intercept

- tracked missile is intercepted deterministically;
- normal Power Core/turret lifecycle still applies.

### Blind intercept

- untracked missile can be targeted;
- chance comes from authoritative engine logic;
- success path destroys/intercepts missile;
- failure path leaves missile alive;
- Power Core cost is committed on both success and failure.

### Progression inputs

- better turret tuning can improve blind chance;
- better missile tuning can reduce blind chance;
- Science still gives deterministic success regardless of those tuning values.

Do not lock specific balance numbers in tests beyond baseline content values.

### Epistemic boundary

- presentation does not receive hidden signature truth unless that truth is intentionally transformed into player knowledge;
- enemy decision logic does not gain forbidden hidden knowledge.

### Regression

- missile flight/impact still works;
- turret load/cooldown still works;
- command availability still works;
- enemy defensive turret flow still works;
- snapshots remain detached/coherent.

---

## What NOT to do in this refactor

- Do not add EVADE.
- Do not redesign Power Core.
- Do not add missile economy/shop pricing yet.
- Do not build missile launcher CRUD yet.
- Do not build missile CRUD yet.
- Do not invent ten missile signature types.
- Do not add a generic hit-resolution framework for all weapons.
- Do not make a giant defense abstraction.
- Do not change laser/mine/SPAM mechanics.
- Do not use damage inflation as the primary fix for missile relevance.
- Do not prematurely solve final missile art/color language.

---

## Immediately after this refactor

Once typecheck/tests/runtime are green and the new missile contract feels correct:

**next content-tools task = Missile Launcher + Missiles migration into editor-ready content/CRUD.**

Read `CONTENT_TOOLS_HANDOFF.md`.

The new content schema should encode only balance/config values from the refactored mechanic.

Expected broad tuning candidates:

Defense Turret:
- blind-intercept quality/chance input
- load duration
- cooldown

Missile:
- damage
- flight duration
- blind-intercept difficulty
- name

Launcher:
- launcher/ammo/salvo/loadout tuning according to actual post-refactor code

Per-launch unique hidden signature remains runtime state, not JSON content.
