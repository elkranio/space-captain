# Space Captain — Threat Presentation

Gameplay legality remains engine-owned. This document describes the confirmed compact threat-strip target and the live
presentation pieces that must survive until it is implemented.

The old large 4x2 captain combat-context/threat-action view has been removed. Do not describe or rebuild it as current
runtime UI.

## Current runtime state

There is currently no general persistent threat panel in the captain dashboard.

Live pieces that remain relevant:

- concrete combat threats and their engine/read-model lifecycles remain real;
- `BridgeCombatView` still owns combat VFX;
- Defense Turret has its own inline Missile selector backed by the narrow
  `DEFENSE_TURRET_THREATS_UPDATED` read path;
- tintable Missile / Beam / Mine / SPAM glyph assets remain available;
- the physical top-center compact threat monitor is not implemented yet.

Build the persistent ENEMY SHIP dashboard first. The compact threat monitor is a later presentation slice; do not
opportunistically recreate the removed 4x2 grid while building the enemy board.

## Confirmed target layout

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

## Target threat-strip contract

One concrete runtime threat remains one presentation object.

Do not aggregate independent Missiles or attached Mines merely to save space.

Each compact threat cell should communicate at a glance:

- family glyph;
- designation where useful;
- remaining progress / urgency;
- terminal danger state;
- whether that concrete threat is already being handled/targeted.

Compact threat cells should not carry permanent mitigation buttons.

A threat cell becomes an interaction target when a selected own system requires that threat. Example:

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

The compact strip should preserve the useful timing semantics from the removed grid and current engine timing truth.

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

The removed threat-grid header carried player HULL / Power Core presentation.

Persistent own-ship state now belongs to MY SHIP. Do not reintroduce HULL/CORE into the compact threat strip merely
because the removed header once owned them.

The strip's job is immediate threat identity and urgency.
