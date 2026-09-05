# Space Captain — Threat Presentation

This document owns the current **presentation direction for incoming combat danger**. Gameplay legality and exact
threat state remain engine-owned.

The goal is to keep the first-person bridge readable and cinematic without rebuilding combat as a spreadsheet of
threat cards and countdowns.

## Current runtime

There is no general persistent threat panel in the captain dashboard.

Current useful pieces include:

- authoritative concrete threat/effect state in the engine;
- combat VFX on the viewscreen;
- the Defense Turret's inline Missile-selection interaction;
- persistent MY SHIP and ENEMY SHIP dashboards.

## Confirmed presentation direction

Incoming danger has two presentation levels.

### 1. Category danger indicators

Use a small set of lamps/indicators to tell the captain **what kind of problem exists**, not to represent every
concrete runtime object one-for-one.

Current conceptual families are:

- **approaching / interceptable physical threat** — e.g. Missile, future Torpedo or Drone;
- **targeted direct-fire threat** — e.g. Beam charging toward a ship semantic target;
- **attached ship problem** — e.g. Sticky Mine or future attached Drone/other hull object.

The exact number, names, colors and physical shapes of these indicators are presentation tuning. The important rule
is that they summarize response categories rather than becoming individual threat cards.

SPAM is already visually intrusive on the viewscreen and may use its own status treatment rather than forcing every
combat effect into one lamp taxonomy.

### 2. Concrete viewscreen telegraphy

Concrete threats should read organically on the external viewscreen whenever possible:

- an incoming projectile is physically visible;
- Beam targeting/charging communicates its target through the ship presentation;
- attached objects visibly belong to the ship;
- urgency comes from motion, telegraph/VFX and state changes rather than a permanent second-by-second HUD countdown.

Do not require a persistent `time to impact` number, progress frame or per-threat card on the main captain board
merely because the engine knows exact timing.

## Detailed response and target selection

When a response requires choosing a concrete threat, the relevant equipment interaction may expose the detailed
list/state needed to make that choice.

Current example:

```text
MY SHIP -> Defense Turret
-> inline interception interaction
-> choose one concrete incoming Missile
```

This keeps the permanent captain UI light while preserving exact tactical choice when the player deliberately opens
the system that can act on the threat.

Not every targeting action must use an inline list. Beam can use visible ENEMY SHIP target surfaces; Shield can use
own ship semantic targets. Use the interaction surface that best matches the system instead of forcing one universal
target picker.

## Information hierarchy

The player should be able to answer these questions quickly:

```text
Is something dangerous happening?
What broad response family can deal with it?
Where is the concrete threat / target?
Which system do I use if I want to react?
```

Basic threat identity is free information. Scientist does not gate this hierarchy.

Detailed statistics may live inside the relevant equipment interaction or future inspection layer when they
materially change a decision.

## Captain board ownership

Persistent ship state stays on the ship dashboards:

```text
MY SHIP
    Hull / CORE / installed equipment / readiness / integrity

ENEMY SHIP
    presentation-safe Hull / installed equipment / integrity / target surfaces
```

Do not move Hull/CORE into the danger indicators.

The top-center bridge area may host the compact category indicators, but it is no longer specified as an individual
threat strip.

## Visual guidance

Danger indicators must survive at real runtime size. Prefer:

- few clear states;
- strong silhouette/readability;
- restrained animation;
- semantic color only where it helps attention;
- red reserved for genuinely critical danger rather than generic decoration.

Do not prescribe one icon per concrete Missile/Mine, perimeter progress fills or a horizontal countdown bar as a
durable combat-board contract.

Reusable threat symbols may still live under `assets/raw/images/icons/threats/` when a concrete inline interaction
or other UI actually needs them. Asset existence does not imply a global threat-strip design.
