# Space Captain — Threat Panel

Updated: 2026-08-16.

This document captures the current compact combat-threat UI direction.
It is a design contract/reference, not a statement that the UI is already
implemented.

Reference composition image:

![Threat tile concept](images/threat_tile_reference.png)

The image is a composition reference, not final art. In particular, the large
text labels inside the urgency bar are expected to be removed or heavily
reduced in the production version.

## Goal

Persistent combat information should live on the captain dashboard rather than
as labels, timers, brackets, or targeting frames floating over the viewscreen.

One concrete runtime threat should map to one compact fixed-footprint tile.

Target density:
- roughly 4 tiles comfortable at once;
- 5 should remain viable under pressure;
- tiles should be compact enough to arrange several together without recreating
  the previous spreadsheet-like dashboard;
- target tile aspect is roughly 4:3 and should not become a panoramic strip.

Do not aggregate away concrete threat identity merely to save space.

## Base tile anatomy

Current preferred hierarchy:

1. threat-type icon;
2. identity / Science knowledge;
3. urgency timeline;
4. available contextual commands;
5. raw seconds as secondary precision.

A useful composition is:

- top: icon + signature/target label + small numeric time;
- middle: urgency timeline;
- bottom: compact contextual action buttons.

The exact art/layout can change as long as this information hierarchy survives.

## Missile identity / signature

Every missile/projectile gets a display signature generated once for that
concrete projectile.

The signature is a UI label, not a gameplay stat.

Examples:

- `?????` — UNKNOWN, red;
- `ABC??` — UNCERTAIN, yellow;
- `ABCDE` — CONFIRMED, green.

Future option:
the count/placement of `?` may communicate different confidence levels if
that proves useful. Do not require this until the game actually needs more
confidence granularity.

Signature letters are generated once and stay stable for the projectile.
They may occasionally create silly memorable labels such as `BOOBS`; that is
acceptable and fits the game's tone.

Objective hidden missile truth remains engine-owned. Presentation receives only
safe observer/Science knowledge.

## Missile commands

Current conceptual action slots:

- `TRACK [S]` — Science;
- `HIT [W]` — Weapons.

TRACK behavior:
- shown while signature knowledge is UNKNOWN;
- still shown while knowledge is UNCERTAIN, allowing Science to track again;
- hidden once knowledge is CONFIRMED.

HIT remains the Weapons response while the missile is still interceptable.

Do not recreate command legality in the view. Final button availability must
come from engine/app command truth.

## Beam Cannon identity

The same tile grammar should work for Beam Cannon threats.

Instead of a missile signature, the identity slot can show the predicted target
code, for example:

- `HULL`;
- `BRDG`;
- `DRIVE`;
- other real semantic targets only when the domain supports them.

Science confidence can use the same red / yellow / green knowledge language.

Do not derive semantic target names from VFX coordinates.

## Urgency timeline

Raw seconds are useful for precision but weak as the primary decision signal:
the player should not need to memorize how long Science tracking or Weapons
interception takes and mentally subtract those durations from every threat.

The timeline therefore visualizes **decision windows**.

Threat progress moves left -> right.
The far-right edge is impact/resolution.

There are three semantic windows:

### 1. Safe — TRACK + HIT

There is still enough time to perform the relevant Science tracking work and
then complete the Weapons interception response before impact.

### 2. Caution — HIT ONLY

There is no longer enough time for TRACK + HIT, but there is still enough time
to perform the direct Weapons interception response.

This is the useful "stop researching and shoot" state.

### 3. Too late

There is no longer enough time to complete the interception response before
impact.

The threat continues toward the impact edge, but the normal response window has
closed.

## Timeline presentation

Preferred production direction:

- one thin/compact horizontal bar;
- three visually distinct zones;
- one bright moving current-threat marker;
- clear far-right impact endpoint;
- raw seconds shown nearby as secondary information.

The generated reference image includes large labels
`TRACK+HIT / HIT ONLY / TOO LATE` inside the bar only to explain the concept.

For the actual compact tile, first try removing those labels entirely and let
zone color + marker position carry the meaning. If onboarding later proves that
labels are needed, use much smaller/shorter treatment rather than filling the
bar with text.

The current marker must remain obvious when several tiles are visible at once,
but avoid excessive glow/noise.

## Dynamic thresholds — important

The two timeline boundaries must come from real gameplay timings, not arbitrary
fixed values such as "8 seconds" and "4 seconds".

Conceptually:

```text
TRACK+HIT boundary
    = remaining time required for the relevant tracking response
      + remaining time required for the interception response

HIT-only boundary
    = remaining time required for the interception response
```

The authoritative implementation must use the real command/task timing model
and any real modifiers that affect those actions.

The UI must not claim an action still fits when engine timing says it does not.

Exactly how officer busy state, queued work, impairment, SPAM modifiers, or
future bonuses alter the displayed windows should be decided when implementing
the timeline against the actual command timing APIs rather than guessed in the
view.

## Numeric timer

Keep a small raw countdown such as `12.6s`.

It is secondary information:
- timeline = fast decision;
- number = precision/debug/comparison.

Do not let the numeric timer become the primary threat-reading mechanic again.

## Multi-threat readability test

Do not judge this system from one isolated pretty tile.

Before locking the presentation, test:
- 4 simultaneous threats;
- 5 simultaneous threats;
- mixed missile + Beam Cannon threats;
- UNKNOWN / UNCERTAIN / CONFIRMED identities;
- different timeline windows at once;
- TRACK hidden on confirmed missile;
- multiple actionable buttons without visual noise.

The system succeeds only if the captain can scan several threats and quickly
answer:

- what is it?
- how well do we understand it?
- how urgent is it?
- what can I still do about it?

## Viewscreeen rule

The viewscreen should show the physical combat:
ships, missiles, Beam/SPAM effects, shields, impacts, and short-lived VFX.

Persistent tactical explanation belongs in threat tiles/dashboard UI.

Do not reintroduce:
- projectile countdown text on the viewscreen;
- targeting frames around threats;
- persistent floating threat IDs;
- giant HP/telemetry overlays over space.
