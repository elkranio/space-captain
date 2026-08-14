# Space Captain — Backlog

Living backlog only. Completed historical phases belong in git history, not in the active task list.

Updated: 2026-08-14
Reference HEAD: `31445cf2b634f017a91e1035c29633c5f1e5c003`

## Current selected work

There is **no hard-selected coding atom** at this handoff.

The previous selected content sequence is complete:
- separate Missile content entity removed;
- separate Sticky Mine content entity removed;
- physical projectile/mine tuning moved to their launchers/dispensers;
- Ship Weapons split into four CRUD editor families;
- heavy Laser renamed to Beam Cannon project-wide.

### Suggested first step next chat

Continue the content-editor/content-data line from the current clean baseline:

1. fetch fresh `master`;
2. smoke `npm run editor`;
3. verify the real `Ship Weapons` group:
   - Missile Launchers
   - Beam Cannons
   - Spam Projectors
   - Sticky Mine Dispensers
4. verify add/save/delete/reference-block behavior in UI;
5. choose one concrete next content/editor slice with the user.

Do not migrate collections merely for completeness.

## Content tools current state

CRUD-ready ship modules:
- Ship Chassis
- Drives
- Power Cores
- Shield Generators
- Defense Turrets

CRUD-ready ship weapons:
- Missile Launchers
- Beam Cannons
- Spam Projectors
- Sticky Mine Dispensers

There are no separate `Missiles` or `Sticky Mines` collections.

Weapon IDs are open editor strings, globally unique across weapon families, with referenced-delete protection against player/enemy ship presets.

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
- Decide if/when missile technology should reduce blind interception; current code has turret-side chance only.
- Helm evade remains a future separate missile response and must not be coupled to hidden signature mechanics.

## Beam Cannon future design

Current Beam Cannon is the slow/heavy energy weapon.

Likely future direction, not implemented:
- precision “sniper” role;
- can target HULL or concrete ship nodes;
- HULL remains always targetable;
- Science may unlock/identify targetable systems;
- node hit disables/breaks the node;
- vulnerable-node hit may also cause bonus hull damage;
- exact Science intel/vulnerability contract still needs deliberate design.

Do not implement node targeting from visual impact anchors; define a real semantic target contract first.

## Future starter weapon

Design possibility only:
- fast;
- weak initially;
- reliable “old faithful”;
- no ammo or very cheap energy economy;
- likely named **Pulse Laser** if/when selected.

This is intentionally separate from Beam Cannon. Do not rename Beam Cannon back to Laser to make room for it.

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
