# Space Captain — Command Palette Plan

Deferred design/implementation plan.

This file replaces the earlier five-role art plan.

Read only after the bridge V0.1 migration is playable.

Last updated:

```text
2026-08-03
```

---

# 1. Status

Architecture blockers are closed.

The command palette itself is not implemented.

Current bridge still uses the old text/context-menu flow.

Palette work is deferred until:

```text
new bridge shell
+ four station views
+ station task/progress UI
+ Comms removal
```

Do not implement palette and bridge migration in one giant atom.

---

# 2. Role model

Officer palettes exist for exactly four roles:

- Science;
- Helm;
- Weapons;
- Engineer.

There is no Comms palette.

Captain actions are outside officer palettes.

Current captain action:

```text
HAIL
```

`REQUEST DOCKING` is removed.

Normal docking belongs to Helm and is directly available when the target/state
permits it.

---

# 3. Information split

Station answers:

```text
where to look
what the officer is currently doing
whether the station is ready/busy/blocked
```

Station monitor shows:

- current task icon;
- task progress when meaningful;
- interrupted/blocked state;
- local activity.

Command palette answers:

```text
what commands can be issued now
```

Captain dashboard / debug panels show:

- ship systems;
- resources;
- warnings;
- target/enemy telemetry.

Viewscreen shows:

- physical threats;
- target ship;
- projectiles;
- combat effects;
- navigation objects.

Do not duplicate the same information in every layer.

---

# 4. Interaction model

Select role:

```text
click station
or keyboard shortcut
→ palette switches to that role
```

Stable slot rule:

```text
temporarily unavailable
→ slot remains in place, disabled

physical equipment not installed
→ equipment slot does not exist
```

Direct command:

```text
click slot
→ execute
```

Real choice:

```text
click slot
→ compact choice row
→ click resolved choice
→ execute
```

Choice row is used only when a real choice exists.

Examples:

- laser sector;
- shield sector;
- point-defense target/band;
- specific threat identification;
- multiple navigation/contact targets.

Do not add a second screen merely to confirm one obvious action.

---

# 5. Physical weapon identity

Each installed physical launcher/dispenser gets its own stable slot.

Examples:

```text
missile launcher #1
missile launcher #2
sticky-mine dispenser #1
laser #1
```

Command target already carries:

```text
ACTOR_WEAPON {
    weaponId
    actorId
}
```

Availability, validation and execution preserve the exact `weaponId`.

Do not return to "find first ready launcher" behavior.

---

# 6. Role content direction

Not a final command list.

## Helm

Current/future:

- Plot Course;
- Fly To;
- Dock;
- Jump;
- future Evade.

## Science

Current/future:

- Identify Threat;
- Purge Spam;
- Analyze Enemy;
- scan/authored science actions.

## Weapons

Current:

- point defense;
- laser;
- missile launchers;
- sticky-mine dispensers;
- allowed mine-clearing actions.

## Engineer

Current/future:

- directional shield;
- Repair Engine;
- allowed mine-clearing actions;
- future system repairs.

## Captain

Outside officer palette:

- Hail;
- dialogue choices;
- authored contact decisions;
- future captain-only actions.

Do not force captain actions into an officer role.

---

# 7. Task cancellation

`CANCEL TASK` remains a stable final slot for roles that can own cancellable
tasks.

State:

```text
cancellable current task
→ enabled

no task / non-cancellable task
→ disabled
```

Do not remove/reorder the slot based on temporary state.

---

# 8. Layout direction

Final palette should be integrated with the future captain dashboard.

Current V0.1 bridge has no final dashboard.

Therefore:

- do not draw final palette assets during bridge import;
- keep temporary debug/status panels;
- prototype palette geometry only after station layout is stable;
- reserve lower foreground for future dashboard.

Likely layout:

```text
target / enemy
→ command palette
→ ship systems / alerts
```

This is direction, not locked pixel dimensions.

---

# 9. Station activity states

Station visual states should distinguish:

- idle;
- ready/actionable;
- selected;
- busy;
- blocked;
- interrupted;
- damaged/unavailable later.

Do not encode all states only by color.

Use a combination of:

- monitor treatment;
- task icon;
- progress;
- small indicators;
- framing/pulse;
- touch-panel activity.

Monitor task feedback must remain readable without an officer sprite.

---

# 10. Palette states

Required slot states:

```text
IDLE
HOVER / FOCUS
PRESSED
DISABLED
SELECTED / CHOICE OPEN
```

Do not change slot dimensions between states.

Disabled must remain recognizable.

Selected must not be confused with busy/cooldown.

Gamepad focus and mouse hover should use the same semantic state.

---

# 11. Subtitle / explanation

Hover/focus may write one short explanation into a dedicated strip.

Use it for:

- command name;
- target;
- resource reason;
- short disabled reason.

Do not use long help paragraphs during combat.

Do not require subtitle reading for basic icon recognition.

---

# 12. Keyboard and gamepad

Stable role shortcuts must be defined after the final four-role visual order is
locked.

Do not reuse the old `1–5` assumption.

Requirements:

- four stable role shortcuts;
- clear focus;
- confirm/cancel;
- choice-row navigation;
- task cancellation;
- input blocking during transitions;
- no conflict with debug/text input.

Gamepad support should not require precise pointer movement.

---

# 13. Art production order

After bridge V0.1 is stable:

```text
1. palette geometry mock
2. one role with placeholder icons
3. slot states
4. choice row
5. subtitle strip
6. runtime test at 1280×720
7. first four production icons
8. remaining icons
9. dashboard integration
```

Do not draw every icon before one role works in runtime.

Suggested first icon set:

- Hail only if testing captain-action placement;
- Identify Threat;
- missile launcher;
- Cancel Task.

---

# 14. Code direction

Target flow:

```text
engine command availability
→ app palette snapshot/model
→ stable role slot definitions
→ enabled/disabled resolved command
→ palette view
→ optional choice row
→ exact command execution
```

The palette view must not read `GAME_RUNTIME`.

The palette must not own gameplay availability rules.

Avoid:

- decorating the old text menu incrementally;
- two long-lived command UIs;
- another generic UI framework;
- per-frame rebuilding/reordering of slots;
- view-driven domain decisions.

The old menu may remain only until one complete palette vertical slice replaces
it.

---

# 15. Acceptance criteria

Palette work is complete when:

- exactly four officer palettes exist;
- captain HAIL is outside officer palettes;
- no request-docking command exists;
- slots remain stable while availability changes;
- physical weapons keep separate identities;
- direct commands take one click;
- real choices take one additional compact choice;
- task cancellation is clear;
- keyboard and mouse both work;
- open palette updates while encounter state changes;
- combat remains readable at 1280×720;
- old text command menu is removed.
