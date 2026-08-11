# Space Captain — Bridge V0.1 Handoff

Completed bridge migration reference.

Last updated:

```text
2026-08-11
```

Current repository checkpoint:

```text
2011518c8d492eb6b7a99d6d2fc79f429e780f30
```

---

# 1. Status

Bridge V0.1 migration is complete and runtime-accepted.

Implemented:

- four playable roles;
- Comms removed;
- HAIL/request-docking prototype removed;
- direct normal Helm docking;
- bridge shell;
- modular station base;
- four separate seated-officer sprites;
- task labels;
- optional task progress;
- touch/work pulses;
- availability lights;
- role abbreviations on officer backs;
- station combat hints;
- barks;
- viewscreen combat presentation.

This document is historical/reference material.
The active visual/UI slice is now:

```text
CAPTAIN_DASHBOARD_HANDOFF.md
```

---

# 2. Locked bridge role set

Exactly four visible playable stations:

- Science;
- Weapons;
- Engineer;
- Helm.

No Comms station in current V0.1.

---

# 3. Bridge role after dashboard redesign

New division of responsibility:

```text
bridge/stations
→ characters
→ work
→ barks
→ reactions
→ task/activity/progress

captain dashboard
→ commands
→ ship systems
→ current context
→ threats
```

This is important.

The original V0.1 station interaction layer was intentionally functional, but
normal officer context menus are now expected to disappear once dashboard
interaction covers equivalent functionality.

Do not remove station task/activity feedback.

---

# 4. Current BridgeView composition

`BridgeView` is now a high-level composition root.

Combat visual modules are grouped in:

```text
BridgeCombatView
```

This owns:

- incoming/outgoing missile views;
- outgoing player mine/spam views;
- laser threat/beam/player laser views;
- player/enemy shield views;
- sticky-mine view;
- spam view;
- enemy destruction;
- combat VFX.

Do not put captain dashboard combat presentation inside `BridgeCombatView`.
Dashboard belongs to bridge UI/presentation.

---

# 5. Current station presentation

Station view currently supports:

- idle state;
- task label;
- optional progress bar;
- touch-panel activity pulses;
- availability lights;
- combat hint text when idle/free.

With dashboard:

- task/activity/progress remain useful;
- combat action hints may become redundant;
- selected-station/context-menu emphasis is no longer the target interaction
  model.

Reassess hints only after a playable dashboard exists.

---

# 6. Current temporary bridge UI

Current `BridgeUiView` still contains:

```text
BridgeShipStatusView
BridgeEnemyTelemetryView
BridgeOfficerContextMenuView
optional BridgeEnemyDebugPanelView
```

These were always temporary.

Dashboard migration should replace them incrementally.

Do not remove `BridgeOfficerContextMenuView` until:

- dashboard can execute equivalent commands;
- task cancellation has a replacement;
- noncombat navigation commands have a replacement.

---

# 7. Current art

Current imported bridge/station/officer art remains prototype art.

Target final vibe:

- early-1990s Sierra VGA;
- Space Quest spirit;
- readable chunky pixel forms;
- slightly worn service ship;
- more comedic personality than clean Star Trek;
- no modern glossy sci-fi.

The user will attach the current dashboard mockup separately in the next chat.

Do not treat generated concept text/ship names as game canon.

---

# 8. Dashboard placement

The lower foreground was originally reserved for a future captain dashboard.
That future slice is now active.

Dashboard target:

```text
lower portion of 1280×720
LEFT = our ship
RIGHT = current context
```

Keep enough vertical bridge space for:

- officer silhouettes;
- station work;
- barks;
- viewscreen target.

The screenshot should not become a control-wall image where the bridge is only
background decoration.
