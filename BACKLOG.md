# Space Captain — Backlog

Living backlog only. Completed historical phases belong in git history, not here.

Updated: 2026-08-13
Reference HEAD before this handoff: `5f33f12374db9dfc5241e9bc300139e921e6a542`

## Current selected work

### 1. Missile / Defense Turret gameplay refactor — NEXT

This is the first task in the next chat.

Read `MISSILE_REFACTOR_HANDOFF.md`.

Replace the current model-level red/blue missile-band counter contract with:

- unique hidden runtime maneuver/signature per launched missile;
- Science tracking solution for a specific projectile;
- tracked missile → guaranteed Defense Turret intercept;
- untracked missile → allowed blind intercept with visible probability;
- Defense Turret progression improves blind intercept;
- missile progression makes blind intercept harder;
- normal Power Core cost is committed regardless of hit/miss.

Exact formula/numbers/field names are still design work for the implementation atom. Keep the first formula simple.

Important sequencing:
- gameplay refactor first;
- stable tests/runtime second;
- **do not** migrate the old red/blue schema deeper into content tooling.

### 2. Missile Launcher + Missiles content/editor migration

Only after the gameplay refactor is green.

Goal:
- make the missile launcher and missile records real editor-friendly content;
- add/clone/delete where appropriate;
- dynamic IDs where CRUD requires it;
- cross-reference validation;
- preserve the newly refactored missile semantics instead of encoding the obsolete red/blue mechanic.

Exact collection/schema split should be decided against the post-refactor code, not now.

## Content tools near-term

Current CRUD-ready:
- Ship Chassis
- Drives
- Power Cores
- Shield Generators
- Defense Turrets

Current `SHIP MODULES` submenu:
- Power Cores
- Drives
- Shield Generators
- Defense Turrets

After launcher/missiles:
- continue migrating only content that is actively blocking tuning;
- do not convert every registry collection for completeness.

See `CONTENT_TOOLS_HANDOFF.md`.

## Near combat follow-ups

After the current content-tool slice returns to gameplay work:

- Finish player Defense Turret installed/breakable/repair flow if still incomplete.
- Power Core BROKEN state:
  - charges reset to 0;
  - recharge progress resets;
  - no defensive consumer while broken.
- Shield Generator break mutation.
- Active Shield disappears immediately if generator breaks.
- Engineer repair commands for defensive installations.
- Balance pass for shield task duration / shield TTL / generator cooldown / Power Core recharge.
- Revisit enemy defensive shield behavior only after player-side contracts are stable.
- Decide whether Science gets meaningful laser/node targeting; keep current SCI laser slot disabled until then.

## Captain dashboard / UX

- Final threat presentation after real art exists:
  - current repeated rows are provisional;
  - rows may become compact tiles;
  - optimize for heavy combat without “Boeing” density.
- Replace placeholder threat/system icons with final art.
- Retire officer context menu only after dashboard command coverage is complete.
- Keep direct `[X]` task cancellation near officer activity for cancellable tasks.
- Add a clear leave/escape/navigation flow.
- Possible bridge tabs: Combat / Engineering / Navigation.
- Auto-switch to Combat on combat start and Navigation after combat is a plausible direction, not yet an implementation task.
- Keep dashboard visual semantics centralized, but do not introduce a giant ThemeManager or generic threat-row framework.

## Bridge / art

- Final bridge asset production using `BRIDGE_ART_DIRECTION.md`.
- Preserve 1280×720 composition and four visible officers.
- VIP seat remains future scene/content hook.
- Continue reducing arcade color noise in final dashboard art.

## Combat / content later

- More enemy loadouts after isolated weapon slices are proven.
- Combat pacing pass when crew mistakes/traits are active; current timings are placeholders.
- Crew negative traits and hidden-risk pools.
- Officer relationships / arguments / R&R recovery.
- Contracts/routes/cargo/VIP run structure.

## Audio

- Short offline-generated officer acknowledgement/result/failure lines.
- Keep voice as UI feedback, not constant chatter.
- Batch-generate and post-process consistently; runtime TTS is not required.

## Low-priority technical notes

Do not schedule these unless a concrete problem appears:

- aggregate snapshots currently detach some already-detached nested data again; data is small and this is not worth API complexity without profiling;
- hypothetical-state logic in officer availability is ugly but currently simpler than adding a new query-mode abstraction;
- long cohesive files such as `CombatRunner`, `EncounterEngine`, `EncounterStateStore` and declarative event unions are not refactor targets by line count.

## Refactor policy

Do not schedule broad refactors by file length.

Refactor only when one of these is concrete:
- context travels too far;
- ownership is unclear;
- the same gameplay rule is duplicated;
- signatures become cognitively hostile;
- callbacks form real spaghetti;
- state is reconstructed in multiple places.

Known settled non-problems:
- `EncounterEngine` as facade/composition root
- `BridgeController` as composition root
- long declarative `bridge_event.ts`
- separate captain/player-weapon mappers
- specialized threat-row views
- specialized combat runners
