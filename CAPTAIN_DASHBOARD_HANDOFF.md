# Space Captain — Captain Dashboard Handoff

Current design + implementation handoff.

Checkpoint: `5a37de2d24c8212c8ff1251ab097f75b293e5f9b`

Status:

```text
left player-ship dashboard implemented
right combat context pending
navigation context pending
old officer context menu temporarily present
```

## Core UX

```text
problem/system/context object
→ visible valid action
→ action shows officer role
→ officer performs work
```

Bridge = characters/reactions/activity.
Dashboard = decisions/state/context.

## Geography

```text
UPPER        bridge / crew / viewscreen
LOWER LEFT   OUR SHIP, persistent
LOWER RIGHT  CURRENT CONTEXT, dynamic
```

Do not prebuild a universal context framework.

## Implemented left dashboard

```text
BridgeCaptainDashboardView
└─ BridgePlayerShipDashboardView
   ├─ BridgePlayerShipStatusStripView
   └─ BridgePlayerShipSystemsView
      └─ BridgePlayerShipSystemRowView
```

Status:

```text
HULL
DEF
ENGINE
```

Rows:

```text
MISSILE → WPN
LASER   → WPN
MINES   → WPN
SPAM    → SCI
```

Button/system states:

```text
ACTIVE
DISABLED_SYSTEM
DISABLED_OFFICER_BUSY
ENGAGED_CURRENT_WORK
```

System availability and officer availability remain separate.

## DEF

Old `[PD] [SHD]` split is obsolete.

Current resource:

```text
DEF
DefenseCapacitorState
4 charges
24s sequential recharge
```

Point defense spends DEF. Future Engineer defense should compete for DEF if designed.

## Current tool semantics

MISSILE:
- ammo + WPN action;
- targeting/launch/cooldown;
- enemy PD may intercept.

LASER:
- WPN;
- targeting/charging/cooldown;
- deterministic hull hit;
- no spatial target zone.

MINES:
- ammo current/max;
- one command launches a salvo of individual mines;
- targeting/dispensing is engaged work.

SPAM:
- SCI;
- targeting/channeling is engaged work;
- 20s channel;
- slows enemy crew task progress.

## Right combat context direction

Not implemented.

Preferred structure:

```text
enemy root/context
+
repeated wide horizontal threat rows
```

Threat row:

```text
[TIMER] [ICON] [THREAT NAME] [ACTION+ROLE]...
```

Avoid tall tiles, button walls, spreadsheet columns and unique card geometry per threat.

Incoming truth:

- missiles: timer + Science spectral-band identification + PD response;
- lasers: timer, no targetZone, no current useful Science-identify property;
- sticky mines: individual domain objects, may be visually grouped;
- hostile spam: needs clean purge representation.

## Future semantic laser targeting

After audit:

```text
HULL
ENGINE
WEAPONS
BRIDGE
VULNERABLE NODE
```

Dashboard implication:

- normal LASER stays one WPN action if only HULL exists;
- target picker appears only for real subchoice;
- opening picker costs nothing;
- task begins after target choice;
- no permanent subsystem grid required.

## Navigation context

Old top-center Local Space icon/popup is being removed.

Current `FLY_TO` remains through officer context menu.

Future navigation context should present real current-node/anchor actions and Helm
task state from domain source of truth.

## Temporary legacy still present

`BridgeOfficerContextMenuView` stays for now.

It still matters for:

- navigation/noncombat commands;
- manual cancellation;
- remaining station command interaction.

Retire only after dashboard/context replacements preserve required functionality.
