# Space Captain — Threat Panel

Durable contract for the implemented compact combat-threat UI.

Reference composition image:

![Threat tile concept](images/threat_tile_reference.png)

The image is historical composition reference only. Current runtime behavior is
defined here and by fresh source.

## Goal

Persistent combat information belongs on the captain dashboard rather than as
labels, timers or targeting frames floating over the viewscreen.

One concrete runtime threat maps to one compact fixed-footprint tile.

Current production footprint:

- `163x66`;
- up to six cells in the shared 3x2 threat grid.

Do not aggregate away concrete threat identity.

## Tile anatomy

Current hierarchy:

- top-left: threat icon;
- top-middle: identity / Science knowledge when it has decision value;
- top-right: exact countdown;
- bottom: one or two contextual action buttons;
- thin decision-timing strip belongs directly to the action it explains.

Mine and Spam intentionally have no redundant upper-middle status label.

## Action truth

The view must not recreate command legality.

Buttons come from engine-resolved commands mapped through the app/controller
layer.

An expired timing strip does NOT hard-disable a command if the engine still
considers it legal. Desperate late actions remain possible gameplay.

When a button represents a currently active cancellable task, active/cancel
state takes precedence over its advisory timing strip.

## Timing-strip visual language

Ordinary deadline strips use the same compact geometry under the button label.

Current visual language:

- fixed equal strip width regardless of label length;
- 3 px high in the current implementation;
- cream useful-time fill;
- time advances left -> right;
- the cream fill is anchored on the right, so its left edge moves right as the
  useful window closes;
- once useful time is gone, only a tiny blinking red terminal marker remains.

The strip answers **how long this action remains useful**, not generic threat
lifetime.

## Dynamic timing source

Decision thresholds come from the engine presentation timing read model.

Task-based thresholds use the current crew-progress multiplier, so active SPAM
slowdown changes real wall-clock decision windows.

The view does not import task tuning or rebuild slowdown formulas.

## Missile

Actions:

- `[S] TRACK`;
- `[W] HIT`.

### TRACK strip

Latest useful start includes both:

```text
Science TRACK wall time
+ subsequent Weapons HIT wall time
```

The strip reaches terminal red when the full TRACK -> HIT sequence no longer
nominally fits.

### HIT strip

Latest useful start includes the interception/Defense Turret work only.

It therefore normally remains useful after TRACK has already expired.

## Beam Cannon

Target display uses observer knowledge only:

- `UNKNOWN`;
- `HULL? / DRIVE?`;
- `HULL / DRIVE`.

Hidden actual target stays engine-only.

Actions:

- `[S] TRACK`;
- `[E] SHIELD`.

### TRACK strip

The Beam TRACK deadline reserves:

```text
Science TRACK wall time
+ subsequent Engineer Shield deployment wall time
```

This prevents TRACK from appearing useful when completing it would leave no
time to deploy the actual defense.

### SHIELD strip

Shield timing is a window, not a single deadline.

Current left-to-right language:

```text
red TOO EARLY
-> cream VALID
-> blinking red terminal marker
```

The initial red segment means deploying now would cause the finite Shield to
expire before Beam fire.

When the red segment is consumed, the cream valid window is active.

There is no trailing full red segment. Once deployment is nominally too late,
the same tiny blinking terminal marker used by other deadline strips is enough.

## Sticky Mine

Action:

- `[E] CLEAR`.

One ordinary cream deadline strip answers:

> if Engineer starts CLEAR now, can the task still finish before detonation?

After the latest useful start it becomes the blinking red terminal marker.

## Spam

Action:

- `[S] PURGE`.

Spam intentionally has **no timing strip**.

Its own precision-timing visualization adds little decision value. Its important
combat effect is slowing other officer work, which is already reflected in their
real decision strips.

## Viewscreen rule

The viewscreen shows physical combat: ships, missiles, Beam/SPAM effects,
shields, impacts and short-lived VFX.

Persistent tactical explanation belongs in the dashboard.

Do not reintroduce:

- projectile countdown text on the viewscreen;
- persistent targeting frames around threats;
- floating threat IDs;
- giant HP/telemetry overlays over space.

## Runtime readability rule

Treat actual-size runtime perception as part of balance.

Decision strips make subjective response pressure visible. Use that feedback
when tuning threat/task durations rather than judging timings from raw seconds
alone.
