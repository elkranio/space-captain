# Space Captain — Current Handoff

Updated: 2026-08-19

Always re-fetch current `master` before preparing a patch.

## Where we are

The previous cognitive-load / callback audit is closed. Do not resume refactoring
unless current feature work exposes a concrete ownership, duplication or
maintainability problem.

The active work is now the **captain threat-dashboard combat-readability slice**.

Current base at the time of this handoff:

`e26cee6ed417387c771fff36ad2ca8fb2770287f`

Treat that SHA only as a handoff marker. Fresh `master` is authoritative.

## Current gameplay/UI state

Two production threat tiles are green:

- Missile
- Beam Cannon

Both use the same compact `163x66` tile language and now share the common
3-column threat grid.

Missile currently shows:

- missile icon
- `NO ID / GUESS / LOCK`
- exact countdown
- `[S] TRACK`
- `[W] HIT`

Beam currently shows:

- Beam Cannon icon
- `UNKNOWN / HULL? / BRIDGE? / DRIVE?`
- confirmed `HULL / BRIDGE / DRIVE`
- exact countdown
- `[S] TRACK`
- `[E] SHIELD`

Beam target truth is already real engine state. Science TRACK updates
player-observer knowledge without leaking the hidden target.

Important temporary limitation:

> Beam target nodes currently affect intel/presentation only. A penetrating Beam
> still resolves through the old hull-centric hit path. The full node-damage
> system is a later explicit slice.

## Immediate roadmap

### Phase 1 — finish the threat tile set

Do this first.

1. Convert Sticky Mine from legacy row to the same `163x66` tile.
2. Convert Spam from legacy row to the same `163x66` tile.
3. Runtime-review Missile / Beam / Mine / Spam together.

Mine and Spam deliberately have **no state/status label** in the upper middle
area. Those labels would not change a player decision.

Their upper row is simply:

- threat icon
- exact timer

Use only real actions already exposed by the engine/app command flow.

Detailed task:

`THREAT_TILES_TASK.md`

### Phase 2 — decision-window progress bars

After all four tile types use the same tile grammar, add useful timing
visualization.

This is not a generic percent-remaining bar.

The bar should answer which responses are still realistically possible.

Planned semantics:

- **Missile:** TRACK + HIT window -> HIT-only window -> effectively too late.
- **Beam:** visualize the valid Shield deployment window and also communicate
  whether Science can still finish TRACK before fire.
- **Mine:** simple latest-safe-start threshold for beginning the clear task.
- **Spam:** no progress bar.

Thresholds must derive from real task/action durations, not arbitrary percentages
or duplicated UI timing rules.

Detailed task:

`THREAT_PROGRESS_BARS_TASK.md`

### Phase 3 — Beam Cannon node-damage system

Only after the threat-dashboard timing/readability slice is stable.

Turn the already-existing hidden Beam target into real consequences.

Core intended model:

- `HULL` -> hull damage + possible task interruption
- `BRIDGE` -> officer stun pressure
- `DRIVE` -> system integrity damage / broken drive denies escape
- later concrete `WEAPON` / `SHIELD` targets when their identity model is clear

Beam weapons should separate:

- `hullDamage`
- `nodeDamage`

System nodes should use small integrity pips rather than large numeric HP bars.

`VULNERABLE` and `BROKEN` have separate semantics. Crew stun and task
interruption must also remain separate effects.

Do not reconstruct this system from memory. The detailed design, agreed rules,
open questions and suggested implementation slices are in:

`BEAM_CANNON_SYSTEM.md`

### Phase 4 — return to the broader combat playtest roadmap

After the threat-dashboard + Beam-node foundation is functional, resume the
larger combat-readability/build roadmap in:

`docs/COMBAT_PLAYTEST_ROADMAP.md`

That document remains the broader direction. The three phases above are the
current concrete implementation path inside that larger combat work.

Do not jump to later roguelite balance, crew relationships, shops or full-run
playtesting before the current combat readability/effect foundation works.

## Important implementation constraints

- Engine/runtime state is authoritative; do not recreate gameplay truth in the
  app.
- Keep hidden Beam `targetNode` internal. Public snapshots/events expose only
  observer intel.
- Preserve `EncounterEngine.step()` / `CombatRunner.step()` ordering unless a
  focused mechanic explicitly requires a change.
- Newly launched player missiles/mines must not consume the same combat step's
  `deltaMs`.
- Public `EncounterEvent` outbox behavior remains separate from synchronous
  internal effects.
- Use existing resolved officer commands for tile actions.
- Do not hard-disable an action merely because the UI thinks timing is bad if
  the engine still considers the command legal. Late failed attempts can be
  gameplay.
- Keep patches narrow and build them from exact fresh source.
- Prefer explicit/simple code over speculative generic threat frameworks.

## Files to read for the active work

Start with:

- `CURRENT_HANDOFF.md`
- `THREAT_TILES_TASK.md`
- `THREAT_PROGRESS_BARS_TASK.md`
- `BEAM_CANNON_SYSTEM.md`
- `docs/WORKING_RULES.md`
- `docs/SYSTEM_MAP.md`
- `docs/COMBAT_PLAYTEST_ROADMAP.md`

Then inspect fresh source/tests for the exact atom being changed.

## Startup sequence

1. Read this handoff and the three active task/design files above.
2. Read the durable repo docs required by `docs/WORKING_RULES.md`.
3. Re-fetch current `master`.
4. Inspect the exact current source and tests for the active atom.
5. Continue from **Phase 1: Sticky Mine tile** unless the user explicitly changes
   priority.
