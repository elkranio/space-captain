# Space Captain — Command Palette Plan

Status:

```text
SUPERSEDED
```

Superseded on:

```text
2026-08-11
```

Active replacement:

```text
CAPTAIN_DASHBOARD_HANDOFF.md
```

---

# 1. Why this plan is superseded

The old plan assumed:

```text
select officer
→ show that officer's fixed command palette
→ choose command
```

Play/design review exposed a core UX problem:

- the player must know which officer owns the solution before interacting;
- combat becomes a knowledge/memory test;
- role-first navigation adds search steps during time pressure;
- station UI competes with barks, reactions and crew presentation.

New direction:

```text
select situation/system/threat
→ dashboard shows response
→ button shows responsible officer
```

The crew remains the limiting gameplay resource without being the first UI
navigation layer.

---

# 2. Useful principles preserved from the old plan

Still valid:

- stable positions matter;
- temporarily unavailable actions should normally stay visible and disabled;
- direct actions should be one click when there is no real choice;
- physical player weapons preserve exact runtime `weaponId`;
- views must not own gameplay availability;
- UI must remain gamepad/keyboard friendly eventually;
- disabled/currently-working states must be visually distinct;
- long help text should not be required during combat.

---

# 3. Principles no longer active

Do not build:

- one command palette per officer;
- station selection as the mandatory first input;
- permanent role tabs as the main combat navigation;
- a subtitle strip as the only way to understand command icons;
- incremental decoration of the old context menu.

---

# 4. Historical note

Git history preserves the original detailed command-palette design.

Do not use this file as an implementation plan.

Read:

```text
PROJECT_CONTEXT.md
CAPTAIN_DASHBOARD_HANDOFF.md
```
