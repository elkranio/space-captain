# Space Captain — Known Combat Bugs

Updated: 2026-08-17.

This file records current observed combat correctness blockers.

It intentionally records symptoms, expected behavior and investigation
constraints rather than guessing root causes before the failing paths are
traced.

## 1. SPAM — unhandled bridge/app event path

### Observed

Using SPAM can reach a SPAM-related encounter/engine event that is not handled
by the bridge/app event path, producing a runtime failure instead of completing
cleanly.

The exact missing event/case should be confirmed from the focused reproduction
before changing code.

### Expected

- Every SPAM event crossing the engine -> app boundary has explicit handling.
- The SPAM action completes without an unhandled-event runtime error.
- SPAM gameplay semantics do not change.
- SPAM remains **not evadable**.

### Fix / investigation constraints

- Reproduce and identify the exact event that escapes current handling.
- Trace engine event -> bridge transport -> presentation consumer.
- Prefer an explicit event case/mapping over swallowing unknown events or
  weakening exhaustive handling.
- Add a focused regression test for the failing path.
- Keep the planned SPAM projection/presentation redesign out of this correctness
  fix unless the reproduction proves they are inseparable.

## 2. Enemy Evade — activates while disabled

### Observed

Enemy Evade can enter/perform its runtime Evade behavior while the enemy Evade
enable/debug flag is false/disabled.

That contradicts the configured playtest state and makes enemy behavior
untrustworthy: a disabled mechanic must not silently remain reachable through a
different path.

### Expected

When the enable/debug flag is disabled:
- enemy policy must not choose Evade;
- no Evade intent should be executed;
- no authoritative Evade task/state transition should start;
- no Evade VFX should appear as a consequence of gameplay state.

When enabled, the enemy should continue using the normal shared authoritative
Evade lifecycle.

### Fix / investigation constraints

Trace the enable state end-to-end:

```text
debug/content/config
    -> enemy policy / intent selection
    -> intent execution
    -> authoritative Evade start
    -> presentation snapshot / VFX
```

Do not assume the root cause before tracing it. Plausible classes of failure
include stale runtime/content, an alternate caller, policy bypass, or a missing
authoritative guard.

Add regression coverage for both:
- disabled -> enemy cannot start Evade;
- enabled -> normal enemy Evade behavior remains possible.

Do not "fix" this in the view. The authoritative gameplay path must obey the
configured gate.
