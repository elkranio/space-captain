# Space Captain — Threat Presentation

Gameplay legality remains engine-owned. This document describes the landed threat presentation and the confirmed combat
UI direction that will replace its large action-grid role after chassis/slot state is implemented.

## Current landed implementation

The current captain combat context still uses:

```text
THREATS                              HULL x/x  CORE [][][][]
```

with a 4x2 threat grid.

Each concrete runtime threat is one UI cell. The current cells also expose direct mitigation actions such as `[W] HIT`,
`[E] SHIELD`, `[E] CLEAR` and `[S] PURGE`.

This implementation remains valid runtime code until the slot/dashboard slice replaces it. Do not treat its layout as
the target combat UX.

## Confirmed next layout

The combat board should use three persistent information zones:

```text
TOP / COMPACT THREAT STRIP
    immediate incoming threats + urgency/progress

LEFT DASHBOARD
    MY SHIP / controls

RIGHT DASHBOARD
    ENEMY SHIP / state + targets
```

The right dashboard is no longer reserved for large threat cards. Basic enemy Hull/slot state stays visible continuously.

Physical placement is now fixed for the current combat layout: use one small, long, narrow physical monitor centered
above the viewscreen. Preserve the first-person viewscreen rather than turning the bridge into a flat tactical
spreadsheet.

Current strict layout reference:

`reference/combat_bridge_layout_2026-08-25.png`

## Threat strip contract

One concrete runtime threat remains one presentation object.

Do not aggregate independent Missiles or attached Mines merely to save space.

Each compact threat cell should communicate at a glance:

- family glyph;
- designation where useful;
- remaining progress / urgency;
- terminal danger state;
- whether that concrete threat is already being handled/targeted.

Threats no longer need permanent mitigation buttons inside the cell.

Instead, a threat cell becomes an interaction target when a selected own system requires that threat. Example:

```text
select Defense Turret on MY SHIP
-> valid Missile cells highlight
-> select one Missile
```

The strip is small in area but must remain high in visual priority. An imminent hit must be able to pull attention away
from the more visually rich ship dashboards.

## Shared direct-targeting grammar

Prefer:

```text
select own system
-> engine-resolved valid targets highlight
-> select target
```

Examples:

```text
Defense Turret -> threat strip Missile
Beam Cannon    -> ENEMY SHIP Hull / slot
Shield         -> MY SHIP slot
Missile        -> ENEMY SHIP / Hull
```

Avoid a popup/menu as the default targeting step when the target is already visible on the combat board.

The engine remains authoritative for availability and exact command payloads. Presentation highlights/selects existing
engine-resolved commands; it does not recreate legality.

## Glyph assets and colors

Keep the existing tintable transparent threat-symbol family:

- `missile.png`
- `beam_cannon.png`
- `mine.png`
- `spam.png`

Current source footprint is 107x33. The future compact cells may render these assets smaller or crop/layout them
differently; do not redraw merely because the container changes unless actual-size readability fails.

Current family colors:

```ts
MISSILE:      0xf2a33a
BEAM:         0x4bc7e8
BEAM_EARLY:   0x7f878f
MINE:         0xb13aa5
SPAM:         0x5bd14a
SPAM_EXPIRED: 0x66717a
```

Shared danger red remains reserved for terminal urgency/timing.

## Timing language to preserve

The compact strip should preserve the useful semantics already proven by the current grid.

### Missile

- orange family identity;
- useful response timing/progress;
- strong terminal red/blink once immediate danger becomes critical.

### Sticky Mine

- purple family identity;
- fuse/response timing;
- strong terminal red/blink near detonation.

### Beam

- gray when meaningfully too early;
- cyan through the useful reaction window;
- terminal red/blink when effectively too late/expiring;
- semantic Beam target remains visible somewhere in the combined threat/ship presentation.

Timing graphics remain advisory. Engine command availability remains authoritative.

### SPAM

SPAM uses effect-duration progress rather than a terminal incoming-hit countdown.

Its elapsed-duration language may remain green -> gray and should not imitate terminal red danger unless gameplay changes.

## Progress encoding + active mitigation

Two independent progress channels are fixed for the compact threat cell:

```text
icon silhouette fill from bottom to top
    = threat lifecycle / urgency progress

rounded-square frame perimeter fill
    = mitigation/work progress
```

Do **not** add a normal horizontal progress bar under the icon.

The mitigation frame must derive from authoritative command/task/runtime state rather than a second presentation-owned
"selected/handled" gameplay fact. A restrained role marker may still be added later if playtesting shows that the frame
alone does not communicate who is handling the threat.

## HULL / CORE ownership

The previous threat-grid header currently carries player HULL / Power Core presentation.

In the confirmed dual-dashboard direction, persistent own-ship state belongs naturally to MY SHIP. Do not keep HULL/CORE
inside the threat strip merely because the old threat header owned them.

The strip's job is immediate threat identity and urgency.
