# Space Captain — Captain Dashboard Handoff

Updated: 2026-08-15
Reference HEAD: `449524c811cd14b8ec933f74565cb6c8241bfdd0`

This is the focused handoff for captain dashboard / combat-context work.

## Status

**Not the immediate next task.**

First rebuild the bridge shell using `BRIDGE_REBUILD_HANDOFF.md`.

Return here after the new background/officers are running cleanly.

## Goal

Make combat presentation representative enough to judge gameplay while reducing programmer-dashboard cognitive load.

The captain console remains conceptually:
- **OUR SHIP** — stable player systems/actions;
- **CURRENT CONTEXT** — enemy + active threats/actions.

## Command truth

All actions must bind real engine-approved `AvailableOfficerCommand` values.

Views must not recreate availability or target legality.

Duplicate same-kind player weapons are separate by concrete installed runtime weapon ID.

## Compact threat object — SELECTED

Old long horizontal threat rows are scaffolding.

Preferred grammar:

Top:
- threat icon;
- countdown/time-to-resolution.

Intel:
- strong dedicated code/signature strip.

Actions:
- one/two compact stable buttons.

Target density:
- ~4 threats comfortably across;
- 5 still viable in high-pressure state.

Do not aggregate concrete threat identity just to pack the UI.

### Missile intel

Example visual grammar:
- unknown: `?????` red;
- uncertain/partial: `ABC??` yellow;
- confirmed: `ABCDE` green.

Science action stays stable as `TRACK [S]` while more analysis is actually available.

Missile response remains a stable Weapons action slot such as `HIT [W]`.

### Beam

Use the same compact grammar when real semantic target/intel domain state exists.

Potential confirmed codes:
- `HULL`;
- `WPNS`;
- `PWR`;
- `SHLD`.

Do not fake semantic target codes from VFX impact anchors.

## Weapon-start telegraphs — CURRENT

The universal pre-targeting layer is gone.

Current real phase starts:
- Missile -> TARGETING;
- Beam -> CHARGING;
- SPAM -> CHANNELING;
- Mine -> DISPENSING.

Accepted enemy offensive work emits generic `ENEMY_ATTACK_STARTED`.

Bridge maps this to a bounded generic warning pulse.

Concrete threat objects still come from their concrete lifecycle events/snapshots.

The dashboard should display real threats, not clairvoyant future state.

## New bridge interaction with dashboard

The new bridge station monitors are blank/decorative for now.

Do not move authoritative combat UI back onto officer station monitors.

Captain dashboard remains the main combat command/status surface.

Old officer context menu remains legacy coverage until dashboard + future Navigation/Engineering surfaces cover all required flows.

## Visual style

Strong early-1990s Sierra / Space Quest spirit:
- chunky readable pixels;
- physical ship hardware;
- dark/cool base with restrained accents;
- not modern glossy HUD;
- not Excel;
- not military-simulator density.

## Upcoming dashboard pass

After bridge rebuild:
1. recomposite full captain dashboard against new background;
2. simplify OUR SHIP;
3. replace CURRENT CONTEXT long rows with compact threats;
4. preserve real command binding;
5. test with multiple simultaneous threats;
6. then move to projectile/VFX fidelity.

## Orphan missiles

Incoming missile UI must continue to work after source enemy destruction.

The projectile is the physical threat.

Do not disable TRACK/HIT because the launching actor no longer exists.

## Enemy destruction

Presentation animation must not freeze threat countdowns or encounter simulation.

## Architecture boundary

`EncounterPresentationSnapshot` remains the coherent app-facing frame root.

Dashboard mappers may bind real commands to visual affordances but must not invent:
- role availability;
- target legality;
- hidden signature truth;
- fake Beam semantic nodes.

## Patch/test discipline

When changing dashboard presentation:
- fresh-read callers/tests;
- update typed and cast fixtures;
- prove real command binding;
- do not hardcode mutable Debug Start tuning unless it is the contract under test;
- preserve source-independent threat behavior;
- preserve simulation/presentation separation.
