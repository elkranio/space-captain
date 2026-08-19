# TASK — FINISH MINE + SPAM THREAT TILES

## Goal

Replace the remaining legacy Sticky Mine and Spam rows with the same production-like `163x66` threat tile language already used by Missile and Beam Cannon.

This task is intentionally small.

Do NOT implement the progress-bar system in this task.

---

# Shared visual contract

Use the established threat tile shell:

- `163x66`
- `UI_COMBAT_SPRITE_ID.THREAT_TILE_BG`
- `UI_COMBAT_SPRITE_ID.ACTION_BUTTON_BG`
- role glyph assets
- threat-specific icon asset
- exact timer in the same upper-right position as Missile/Beam
- icon in the same upper-left position as Missile/Beam
- action buttons in the bottom row

Reference implementations:

- `BridgeCaptainMissileThreatRowView.ts`
- `BridgeCaptainBeamCannonThreatRowView.ts`

Shared layout owner:

- `BridgeCaptainThreatsView.ts`

Mine and Spam should join the same production tile grid rather than remaining full-width legacy rows.

---

# Critical information-density rule

Mine and Spam do NOT need an upper-middle status label.

Do not display:

- `MINE`
- `ATTACHED`
- `ARMED`
- `SPAM`
- `ACTIVE`
- `CHANNEL`
- `JAMMED`

unless gameplay later gives one of those labels actual decision value.

For the current game, they do not.

Upper row for these threats is intentionally:

- icon
- empty breathing room
- exact timer

This is not a missing feature.

---

# Atom A — Sticky Mine tile

## Current gameplay information already available

Existing bridge payload currently exposes roughly:

- `mineId`
- `timeToDetonationMs`
- `initialTimeToDetonationMs`
- `isBeingCleared`
- `isNextClearTarget`
- `actions.engineerClear?`

Inspect fresh code before changing anything.

Primary existing files are likely:

- `BridgeCaptainStickyMineThreatRowView.ts`
- `BridgeCaptainThreatsView.ts`
- `bridge_event.ts`
- captain combat-context mapper

Do not invent new state if the current payload is sufficient.

---

## Mine visual layout

Upper row:

- Mine icon using `UI_COMBAT_SPRITE_ID.THREAT_MINE`
- no status/knowledge label
- exact detonation countdown on the right

Bottom row:

Use current real command availability.

At the time of this handoff, the captain-dashboard mapper exposes an Engineer clear action for the next clearable mine.

So the first production tile should likely use:

`[E] CLEAR`

Do not pretend multiple officer clear routes exist in this view unless the current engine actually exposes them here.

If the broader game design later allows multiple officers to clear a mine, solve that as a separate interaction/layout question rather than stuffing speculative controls into this atom.

---

## Existing clear-state information

`isBeingCleared` and `isNextClearTarget` already exist.

Use them only if they help communicate something real.

Avoid adding a redundant text status in the upper row.

Potential handling if needed:

- active clear action may be disabled/engaged using the existing action-state visual language
- non-next mine may naturally have no command available and therefore show disabled action
- do not invent a new textual status just because those booleans exist

Keep it simple.

---

## Mine progress bar

NOT part of this atom.

The future Mine bar will represent whether there is still enough time to BEGIN the clear work and finish before detonation.

See `THREAT_PROGRESS_BARS_TASK.md`.

Leave room conceptually, but do not add fake placeholder graphics.

---

## Mine acceptance checklist

- Uses threat tile background asset
- Uses mine icon asset
- Uses normal timer position
- Has no redundant state label
- Uses normal role glyph/action-button language
- Real engine-resolved clear command works through existing event flow
- Disabled action follows current availability
- Fits the shared grid
- No new gameplay rules
- Typecheck green
- Tests green
- Runtime click works

---

# Atom B — Spam tile

## Current gameplay information already available

Existing bridge payload currently exposes roughly:

- `channelId`
- `remainingDurationMs`
- `initialDurationMs`
- `actions.purgeSpam?`

Inspect fresh code before changing anything.

Primary existing files are likely:

- `BridgeCaptainSpamThreatRowView.ts`
- `BridgeCaptainThreatsView.ts`
- `bridge_event.ts`
- captain combat-context mapper

---

## Spam visual layout

Upper row:

- Spam icon using `UI_COMBAT_SPRITE_ID.THREAT_SPAM`
- no status label
- exact remaining time on the right

Bottom row:

`[S] PURGE`

Use the real existing Science command.

If only one action exists, keep only one real action. Do not create a fake second button to preserve symmetry.

Whether the single button should occupy the left standard slot or use a wider/special alignment is a small runtime-visual decision. Prefer preserving the shared tile grammar before inventing a new layout.

---

## Spam progress bar

None.

This is a deliberate design decision.

Although it is theoretically possible to calculate whether Science can complete PURGE before natural expiration, especially under Spam work-speed slowdown, exposing that as another timing bar is considered unnecessary complexity.

Spam's gameplay job is simple:

- threat exists
- it is slowing/disrupting work
- Science can purge it
- otherwise it eventually expires

Do not turn it into another precision-timing mini-game unless playtesting later demonstrates a need.

---

## Spam acceptance checklist

- Uses threat tile background asset
- Uses spam icon asset
- Uses normal timer position
- Has no redundant state label
- `[S] PURGE` uses existing resolved command path
- Disabled state follows engine command availability
- Fits the shared grid
- No progress bar
- No new gameplay rules
- Typecheck green
- Tests green
- Runtime click works

---

# Shared-grid completion

After both atoms, `BridgeCaptainThreatsView` should treat all production tile threats consistently:

- Missile
- Beam Cannon
- Sticky Mine
- Spam

All should use `163x66` cells.

The desired final threat dashboard remains up to six visible threats in a 3x2 arrangement.

Do not over-generalize the four tile classes merely because they now share dimensions. Some duplication is acceptable if it keeps each threat's behavior obvious.

Only extract a shared helper if the result is materially simpler to read than four explicit classes.

---

# Runtime visual pass after both tiles

Look at all four types together.

Check only practical issues:

- icons feel similarly weighted
- timers align
- buttons align
- role glyphs are readable
- no tile looks needlessly busier than another
- Mine/Spam empty upper-middle space feels intentional rather than broken
- tile spacing remains readable

Do not enter a broad pixel-perfect polish pass before the progress-bar work, because those bars will alter the composition.
