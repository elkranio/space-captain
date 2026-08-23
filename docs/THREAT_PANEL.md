# Space Captain — Threat Panel

Current implemented captain-dashboard threat presentation.

Gameplay legality remains engine-owned. This document describes how safe snapshot/read-model truth is presented.

## Layout

The combat-context header shows:

```text
THREATS                              HULL x/x  CORE [][][][]
```

Below it is a 4x2 threat grid.

One concrete runtime threat is one UI object. Do not aggregate multiple Missiles or Mines into counters.

Each cell is visually minimal:

```text
[ LARGE THREAT GLYPH ]
[role] ACTION
```

There is no card background/frame, numeric countdown, Science TRACK row, separate button frame or per-cell divider.

The whole cell is the action/cancel hit area.

## Actions

Current labels:

- Missile: `[W] HIT`
- Beam: `[E] SHIELD`
- Mine: `[E] CLEAR`
- SPAM: `[S] PURGE`

If the relevant officer task is active for that threat, the action becomes `CANCEL`.

For an active player Missile-intercept task, the `[W]` role glyph pulses. It derives from the same active-task truth as
`CANCEL`; presentation does not own a second state.

When an action is unavailable, its text is gray and the cell is noninteractive. The threat glyph keeps
its family color so
unavailability does not hide threat identity/urgency.

Engine `canAssign`/task state is authoritative. Timing graphics never create gameplay legality.

## Glyph assets and colors

Source assets are white/tintable transparent images designed for the same compact monitor-symbol family:

- `missile.png`
- `beam_cannon.png`
- `mine.png`
- `spam.png`

Target source footprint is 107x33.

Current family colors:

```ts
MISSILE:      0xf2a33a
BEAM:         0x4bc7e8
BEAM_EARLY:   0x7f878f
MINE:         0xb13aa5
SPAM:         0x5bd14a
SPAM_EXPIRED: 0x66717a
```

Shared danger red is used for terminal urgency/timing overlays.

## Missile timing

Missile starts in its family orange.

During the useful response-start window, a red overlay fills the glyph from left to right. The fill represents consumed
useful response time.

Once the latest useful response start has passed, the whole glyph blinks red.

This timing is advisory. The engine still decides whether `HIT` can actually be assigned.

## Sticky Mine timing

Mine uses the same useful-window language:

- purple base;
- red left-to-right timing overlay;
- full-red terminal blink after the useful response-start window is gone.

Engine command availability remains authoritative.

## Beam timing

Beam has an explicit timing state:

- `TOO_EARLY` — gray glyph;
- `VALID` — cyan glyph with red timing overlay;
- `TOO_LATE` / `EXPIRED` — full-red terminal blink.

The target label (`HULL` or `DRIVE`) remains visible below the action row.

Timing phase does not disable `SHIELD`. If the engine says the command can be assigned, the cell remains actionable; the
graphic communicates timing quality/urgency only.

## SPAM progress

SPAM is deliberately different from terminal incoming-hit threats.

It has no decision-timing window and no terminal red blink. The base glyph is green and an elapsed-duration gray overlay
fills from left to right using real effect duration:

```text
remainingDurationMs / initialDurationMs
```

The remaining green part therefore communicates how much of the effect is still left.

## Header HULL / CORE

The combat-context header presents current player HULL and four discrete Power Core slots.

Charged slots are filled. When a missing charge is actively recharging, that slot fills bottom-to-top from the engine's
recharge progress.

The header is presentation of engine state; it does not own Core spending/recharge rules.
