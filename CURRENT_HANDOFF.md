# Space Captain — Current Handoff

Date: 2026-08-18

Always re-fetch current `master` before preparing a patch.

## Current state

The large cognitive-load refactor sprint and the documentation cleanup are complete.
The repository is green.

A follow-up read-only audit was then run specifically from an **AI-assisted coding**
perspective: minimize context reconstruction, hidden dependency paths, and
plausible-but-wrong code paths.

The audit found one concrete engine-level cleanup target: a callback dependency
knot around encounter combat/task orchestration.

The detailed audit result, target graph, sequencing constraints and atom plan live
in:

`docs/AI_ASSISTED_ENGINE_SIMPLIFICATION.md`

Read that document before changing encounter runner wiring.

## Active slice

Temporarily pause the gameplay roadmap and simplify the encounter callback knot.

This is **not** another broad cleanup sprint and **not** an event-bus rewrite.

Immediate next atom:

**EnemyCrewTaskRunner completion callbacks -> synchronous returned completion
results handled by EnemyBehaviorRunner.**

Keep the atom narrow. Do not introduce the proposed internal-effect boundary in
the same atom.

After the engine simplification slice closes, return to the canonical combat
roadmap. The next gameplay/presentation target remains the **enemy dashboard
redesign**.

## Important constraints

- Preserve current gameplay and same-step ordering exactly.
- Do not create a global mutable encounter singleton/service locator.
- Do not replace the callback knot with a generic event bus.
- Do not create a queued internal outbox unless a concrete ordering need is
  demonstrated. The current preferred escape hatch for the few real ownership
  cycles is a tiny **synchronous typed internal-effect boundary**.
- Public `EncounterEvent` outbox behavior is separate and should remain intact.
- `emit` callbacks, injected RNG and real UI/listener/tween callbacks are not
  cleanup targets merely because they are callbacks.
- Do not split large readable files on line count. In particular,
  `BridgeEncounterEngineEventHandler` was a false-positive audit hotspot.

## Temporary/debug context worth preserving

- The opening disruption pulse is a real one-shot mechanic. Automatic use is
  currently controlled from the app-side combat-start debug boundary while
  combat behavior is being tested. Do not delete the mechanic as dead code.
- The disposable bridge debug layer is still intentionally retained. Its cleanup
  is tracked in `docs/BACKLOG.md`.

## Startup

Follow `docs/WORKING_RULES.md`:

1. read this handoff;
2. read every Markdown document in `docs/`;
3. pay special attention to `docs/AI_ASSISTED_ENGINE_SIMPLIFICATION.md`;
4. re-fetch current `master`;
5. inspect the exact current source/tests touched by the next atom.
