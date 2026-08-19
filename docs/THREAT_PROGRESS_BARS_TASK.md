# TASK — THREAT DECISION-WINDOW PROGRESS BARS

## Goal

Add gameplay-useful timing visualization to threat tiles.

The bar must NOT be a generic "time remaining" decoration.

The exact countdown already answers "how many seconds remain".

The bar's purpose is different:

> visually answer which responses are still realistically possible.

This means each threat type can have a different bar model.

Do not force one universal semantic onto Missile, Beam, Mine, and Spam.

---

# General rules

## Exact time remains authoritative presentation

Every timed threat keeps its numeric countdown.

The bar is advisory decision support, not a replacement for seconds.

---

## Do not use UI timing to redefine command legality

The current design deliberately allows some desperate/late attempts.

Example:

If Weapons can still technically issue HIT on a missile, the UI should not necessarily hard-disable it because the player probably cannot complete the response in time.

A failed late action can be gameplay.

Use engine command availability for hard impossibility such as:

- officer unavailable
- required system unavailable
- no ammo/charges
- command itself invalid

Use the progress bar for timing/risk communication.

---

## Timing windows should derive from real gameplay durations

Do not hardcode arbitrary percentages such as:

- first 50% green
- next 30% yellow
- last 20% red

Windows must come from actual relevant task/action durations.

If the information does not currently exist in a safe/readable form, add the smallest engine/read-model projection needed.

Avoid UI reaching deep into content definitions or rebuilding engine timing formulas independently.

---

# Missile bar

## Desired player question

At this exact moment:

1. Can I still TRACK and then HIT?
2. If not, can I still HIT immediately?
3. Is the missile effectively beyond a useful response window?

---

## Desired zones

Conceptually from earlier to later:

### TRACK + HIT window

There is enough remaining time to:

- start Science TRACK
- finish TRACK
- then start/complete the relevant interception response

This is the comfortable/full-response window.

Suggested visual family:

- light cream / neutral safe segment

Do not rely on color alone; segmentation/boundaries should be legible.

---

### HIT ONLY window

There is no longer enough time for the full TRACK → HIT sequence.

There is still enough time for immediate interception.

Suggested visual family:

- warning yellow/amber

This zone communicates:

> stop gathering intel; act now.

---

### TOO LATE / desperation window

There is no longer enough nominal time to complete the interception response before impact.

Suggested visual family:

- danger red

Important:

This does NOT automatically mean the HIT button becomes unavailable.

The player may still press it if the engine permits the command.

This is an advisory "you are probably cooked" region.

---

## Missile timing inputs to inspect

The implementation needs real current durations for:

- Science identify/track task
- Weapons interception / Defense Turret response path
- any relevant system targeting duration if that is part of actual interception completion
- Spam modifiers or officer speed modifiers if task duration is already resolved by the engine

Prefer using resolved/derived durations rather than duplicating raw content values in UI.

Need inspect current command/task architecture before deciding where thresholds belong.

---

# Beam Cannon bar

Beam cannot simply copy Missile's three zones.

Its defensive action has a valid timing WINDOW, not just a deadline.

---

## Desired player questions

At this exact moment:

1. Can Science still TRACK the target before the Beam fires?
2. Is it too early to deploy SHIELD because the shield would expire before impact?
3. Is SHIELD currently in its valid deployment window?
4. Is it already too late to deploy SHIELD and have the task/system become active before the Beam fires?

---

# Shield timing model

A temporary shield has a finite active duration.

Therefore:

- deploy too early → shield may disappear before Beam impact
- deploy inside the correct window → Beam arrives while shield is active
- deploy too late → Engineer/task/system cannot get shield active before Beam impact

The progress visualization should clearly make the valid defensive timing window visible.

This is the central Beam bar concept.

---

## Conceptual timeline

Moving toward fire time:

### TOO EARLY FOR SHIELD

Beam is still too far away.

If the player deploys now and shield duration is shorter than the remaining Beam time, the shield expires before the shot.

Science TRACK may still be valuable here.

---

### VALID SHIELD WINDOW

There is enough time to activate shield, and the resulting shield will still exist when Beam fires.

This is the main "deploy now" band.

---

### TOO LATE FOR SHIELD

There is less time remaining than the deployment/activation path requires.

The shield cannot become effective before Beam fire.

Again, the UI bar communicates this even if the command remains technically exposed for some reason.

---

# Science TRACK overlay/problem

Beam also has Science target analysis.

TRACK has a different deadline:

> Science must finish before Beam fires.

This threshold does not necessarily align with the shield window.

The UI therefore needs to communicate both:

- TRACK viability
- SHIELD viability

Do not cram two unrelated full bars into 163x66 without testing readability.

Possible directions to prototype:

### Option A — one segmented main bar + small TRACK marker

Main bar communicates shield window.

A single marker/tick indicates the latest nominal Science TRACK start point.

This is currently the cleanest conceptual option.

### Option B — thin stacked micro-bars

One thin line for Science.
One thin line for Shield.

Potentially clearer logically, but likely too dense at current tile size.

### Option C — shared timeline with distinct boundary markers

One timeline with:

- TRACK deadline tick
- shield-open boundary
- shield-close boundary

This may communicate everything without turning into a chart.

Choose after a focused visual mock/runtime test.

Do not assume Missile's colors/segments can simply be reused.

---

## Beam timing inputs to inspect

Need real durations for:

- Science Beam TRACK task
- Engineer shield deployment task
- shield active duration
- any charge/resource conditions that affect actual command availability

Potentially distinguish:

- command availability
- task completion duration
- resulting shield lifetime

The bar should be derived from these real mechanics.

---

# Sticky Mine bar

Mine gets the simplest useful bar.

---

## Desired player question

> If I START clearing this mine now, will the clear complete before detonation?

There is no need for multiple tactical zones.

---

## Desired model

One clear threshold:

### SAFE TO START CLEAR

Enough time remains for the clear task to finish before detonation.

### TOO LATE TO START

Not enough nominal time remains.

The exact timer still shows how long until explosion.

The bar shows the latest safe-start boundary.

Potentially render as:

- normal remaining segment until threshold
- danger segment after threshold

Keep it simpler than Missile/Beam.

---

## Mine timing inputs to inspect

Use the actual clear-task duration after relevant modifiers if possible.

Spam slowdown matters if it already changes task execution duration at engine/task level.

Do not recalculate officer work-speed rules independently inside the view.

---

# Spam

No progress bar.

This is deliberate.

Reasons:

- natural expiration already has an exact timer
- Science PURGE is a simple action decision
- calculating and visualizing "will Science finish purge before spam expires?" adds little tactical value
- Spam already complicates other work through slowdown; its own tile should remain cognitively simple

Do not add a progress bar merely for visual consistency.

---

# Visual requirements

The bars need to fit inside the existing `163x66` tile grammar.

Current upper content:

- icon
- optional knowledge/target text for Missile/Beam only
- timer

Current lower content:

- action buttons

Find the smallest readable location between these layers.

Do not make tiles taller without an explicit design decision.

Pixel-art language:

- chunky
- clear boundaries
- no gradients
- no glossy modern meter
- no microscopic text inside the bar
- limited colors
- visible at actual game resolution

Progress itself should normally darken/consume from one direction consistently across threats.

---

# Suggested implementation slicing

## Atom 1 — timing/read-model audit

Before drawing bars:

- map exact durations used by Missile TRACK/HIT
- map Beam TRACK/deploy/lifetime
- map Mine clear duration
- identify where resolved thresholds should be computed
- write tests for timing boundaries if engine/read-model additions are needed

No visual changes required in this atom.

---

## Atom 2 — shared tiny bar primitive only if useful

If Missile/Beam/Mine can genuinely reuse the same drawing primitive:

- create one small presentation helper for segmented timeline geometry

Do NOT create a giant generic `ThreatTimelineSystem`.

It should be a dumb visual primitive receiving already-derived segments/markers.

Skip extraction entirely if three explicit bars are simpler.

---

## Atom 3 — Missile

Implement and runtime-test Missile first.

It has the clearest three-zone design and will establish the visual language.

---

## Atom 4 — Mine

Implement the one-threshold version.

This validates that the visual primitive can remain simple.

---

## Atom 5 — Beam

Handle Beam last because its timeline is the most semantically complex.

Prototype/readability matters more than forcing structural reuse.

---

# Acceptance criteria for the whole progress-bar slice

- Missile bar visibly distinguishes full response / immediate interception / desperation
- thresholds come from real gameplay timings, not arbitrary percentages
- Beam clearly communicates the shield deployment window
- Beam also communicates Science TRACK viability without becoming unreadable
- Mine clearly communicates latest useful clear-start timing
- Spam has no bar
- numeric timers remain
- UI does not independently redefine engine command legality
- no hidden Beam target truth leaks through presentation
- typecheck green
- tests green
- actual-size runtime readability is acceptable
