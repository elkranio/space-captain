# Space Captain — Backlog

Living backlog only. Completed historical phases belong in git history, not in the active task list.

Updated: 2026-08-14
Reference HEAD: `65a983b7460b66bf85a2753844540c78bf8bbe45`

## Current selected work

### 1. Missile Launcher + Missiles content/editor migration — NEXT

The targeted cleanup pass is complete and green.

Goal:
- make Missile Launcher + Missiles genuinely editor-friendly;
- migrate post-refactor tuning, not old spectral/color semantics;
- open IDs only where CRUD requires it;
- reference validation + referenced-delete protection;
- clean remaining historical RED/BLUE preset names as part of the migration if useful;
- preserve per-launch hidden runtime signature as runtime truth, never JSON content.

Current implemented missile tuning:
- missile name
- damage
- flight duration

Current implemented Defense Turret blind tuning:
- `blindInterceptChance`

Do not invent a missile blind-intercept penalty during editor migration unless gameplay design explicitly selects it.

## Content tools near-term

CRUD-ready:
- Ship Chassis
- Drives
- Power Cores
- Shield Generators
- Defense Turrets

Current SHIP MODULES:
- Power Cores
- Drives
- Shield Generators
- Defense Turrets

After Missile Launcher + Missiles:
- continue converting only content that blocks real tuning/work;
- do not migrate every registry collection for completeness.

## Near combat follow-ups

- Finish player Defense Turret installed/breakable/repair flow.
- Power Core BROKEN state:
  - charges -> 0
  - recharge progress -> 0
  - no defensive consumer while broken
- Shield Generator break mutation.
- Active Shield disappears immediately if generator breaks.
- Engineer repair commands for defensive installations.
- Balance shield task duration / TTL / generator cooldown / Power Core recharge.
- Revisit enemy shield behavior only after player-side contracts are stable.
- Decide whether Science gets real laser/node targeting; keep current SCI laser slot disabled until then.
- Decide if/when missile technology should reduce blind interception; current code has turret-side chance only.
- Helm evade remains a future separate missile response and must not be coupled to hidden signature mechanics.

## Missile semantic cleanup debt

Mechanical color semantics are gone, but some identifiers still contain historical names such as:
- `BASIC_RED_FULL_00`
- `BASIC_BLUE_FULL_00`
- generic RED/BLUE missile ship/node-actor aliases

These are naming debt, not current gameplay. Remove/rename when doing so clearly reduces confusion and test noise.

Internal `signature_a/signature_b` is hidden transitional truth. It is not automatically a refactor target unless a simpler representation preserves the current Science correctness mechanic.

## Captain dashboard / UX

- Final threat presentation after real art exists.
- Current repeated rows are provisional.
- Replace placeholder icons with final art.
- Retire officer context menu only after dashboard command coverage is complete.
- Keep direct task cancellation near current officer activity.
- Add clear leave/escape/navigation flow.
- Possible tabs: Combat / Engineering / Navigation.
- Auto-switch Combat on engagement and Navigation after combat remains plausible, not selected implementation.
- Avoid Boeing-density and giant generic UI frameworks.

## Bridge / art

- Final bridge asset production using `BRIDGE_ART_DIRECTION.md`.
- Preserve 1280x720 composition and four visible officers.
- VIP seat remains future scene/content hook.
- Continue reducing arcade color noise.

## Combat / content later

- More enemy loadouts after isolated weapon slices are proven.
- Combat pacing pass when crew mistakes/traits are active.
- Crew negative traits/hidden-risk pools.
- Officer relationships/arguments/R&R recovery.
- Contracts/routes/cargo/VIP run structure.

## Audio

- Short offline-generated officer acknowledgement/result/failure lines.
- Voice as UI feedback, not constant chatter.
- Batch-generate and post-process consistently.

## Low-priority technical notes

Do not schedule unless a concrete problem appears:
- detached nested snapshot data may be detached more than once; current data size is tiny;
- hypothetical-state logic in officer availability is ugly but currently simpler than a query-mode framework;
- long cohesive `CombatRunner`, `EncounterEngine`, `EncounterStateStore`, declarative event unions are not refactor targets by line count.

## Refactor policy

Refactor only when at least one is concrete:
- context travels too far;
- ownership is unclear;
- gameplay rule duplicated;
- state reconstructed in multiple places;
- callbacks form real spaghetti;
- method/type signatures become cognitively hostile;
- stale compatibility/semantic layers obscure current behavior;
- editor schema/catalog/CRUD plumbing repeats without adding meaning.

Known settled non-problems unless new evidence appears:
- `EncounterEngine` facade/composition root
- `BridgeController` composition root
- long declarative `bridge_event.ts`
- separate captain/player-weapon mappers
- specialized threat-row views
- specialized combat runners
