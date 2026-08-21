# Space Captain — Handoff after Science TRACK removal + threat dashboard redesign

Updated: 2026-08-21

Fresh `master` at handoff time:

`a4ab2777634d1ddba594d3bc3196e8eb74a5fdf6`

Treat this SHA only as a historical marker. Re-fetch fresh `master` before any patch.

## Where we are

The player-facing Science TRACK / threat-identification layer has been removed cleanly and the replacement
threat-dashboard design has now been worked through visually.

The **next active coding slice is the new threat dashboard implementation**.

Do not start the next chat with the previously planned `OUR SHIP` module-dashboard redesign. That slice is still
important, but the threat dashboard now has a concrete visual/interaction contract and should be implemented first
while the design is fresh.

## Science TRACK removal — DONE / green / pushed

Player Science no longer gates basic incoming-threat understanding.

Current player-facing threat facts are free:

- Missile is immediately known as a Missile threat;
- Beam target node is immediately known (`HULL | DRIVE`);
- Sticky Mine is immediately known;
- SPAM is immediately known.

Removed from the player pipeline:

- `SCIENCE_IDENTIFY_THREAT` command;
- player Science identify/track task/draft/handler;
- player threat-identification presentation fields;
- Missile `NO ID / GUESS / LOCK` UI;
- Beam target-intel TRACK UI;
- player Science TRACK buttons and timing strips.

Do not reintroduce TRACK merely to give Science a combat button.

Science should create **advantage**, not permission to understand the basic interface. Future useful Science space can
include special enemy properties, weakness/state discovery, prediction, disruption, tactical scanning, EW and other
information that changes decisions.

### Important boundary: enemy Science is still separate

Do not delete/flatten enemy observer mechanics merely because player TRACK is gone.

Objective Missile signature truth still exists in engine state and enemy-side observation/Science/interception logic may
use it. Enemy Defense Turret behavior remains separate from the player turret.

## Player Defense Turret — current BASIC contract

Player Missile interception is now deliberately simple:

- if the player Weapons Defense Turret task completes while the target Missile still exists, interception is guaranteed;
- no player Science hypothesis/tier/percentage is required;
- no Missile tiers are being added in this slice.

Enemy Defense Turret logic remains probabilistic / enemy-observer-driven and must not be rewritten to match the player
shortcut.

## Targeted player Shield status

Player targeted Shield engine/domain and captain picker are already DONE.

Current player protected nodes:

- `HULL`
- `DRIVE`

Current physical resolution:

```text
1. EVADING -> MISS, Shield survives
2. matching activeShield.targetNode -> ABSORBED, Shield consumed
3. otherwise -> Beam consequence, wrong-node Shield survives
```

Still open:

- selected/deploying/active Shield state on the `OUR SHIP` dashboard;
- semantic player Beam enemy-node targeting;
- enemy targeted Shield choice/resolution/visual.

`docs/TARGETED_SHIELDS_TASK.md` remains active.

## New threat dashboard — design locked enough to implement

Reference image:

`docs/images/threat_dashboard_reference.png`

**Important:** the action labels in that image are deliberately mixed mock states used to test role colors, disabled
state and CANCEL. They are **not** the canonical threat/action mapping.

Canonical current threat actions:

```text
Missile      -> [W] HIT
Beam Cannon  -> [E] SHIELD
Sticky Mine  -> [E] CLEAR
SPAM         -> [S] PURGE
```

Helm `EVADE` is a ship/global combat action, not a per-threat action just because the mock image shows it under one
sample glyph.

### Layout

Current target layout is a **4 x 2 threat grid** on the right captain display.

Do not preserve the current runtime `3 x 2` / `163x66` card layout merely because it exists in source.

The new visual object is intentionally much cheaper:

```text
[ LARGE THREAT GLYPH ]
[role] ACTION
```

No physical tile/card background is required.

### Whole tile = action

The entire threat cell is the click target.

There is no separate drawn button.

State language:

- action available -> colored role key + white action text;
- action task active -> action label becomes `CANCEL`, whole cell cancels that task;
- action unavailable -> action label is gray/non-interactive;
- threat glyph itself keeps presenting threat urgency even if the action is unavailable.

Do not gray the whole threat merely because Weapons/Engineer/Science is busy or a resource is missing. Threat urgency
and action availability are separate channels.

### No numeric timer

The new threat object does **not** show seconds.

Remove from the new visual grammar:

- exact countdown text;
- `NO ID / GUESS / LOCK`;
- segmented timing strips;
- button frames/backgrounds/dividers;
- redundant status labels.

### Progress is inside the glyph

The whole threat glyph is the timing visualization.

Normal phase:

- glyph has its normal threat color;
- a red overlay progressively fills the glyph **left -> right**;
- the fill represents the action's useful-start window, not generic time-to-impact.

Terminal phase:

- once the latest useful start has passed, the **entire glyph is red**;
- the entire red glyph blinks;
- this happens even if the player started the counter-task before the terminal edge and the task is still running.

That last rule is intentional. It creates the desired tension: the player may have committed in time but still watches a
full-red threat while waiting to see whether the countermeasure resolves before impact.

Terminal presentation is advisory timing, not a second source of command legality. Engine command availability remains
authoritative unless a later gameplay change explicitly says otherwise.

### Universal timing language

Do not invent special icon-specific progress metaphors such as:

- Missile body fills but Beam uses a separate strip;
- Mine lamps are the dashboard timer;
- SPAM uses a different gauge.

The dashboard language is universal: **normal-color glyph + red left-to-right useful-window fill -> full-red blink**.

Physical threats may still have world-space telegraphs for readability and future EW mechanics.

### Beam early-window nuance

The current engine/presentation timing model has Shield window semantics, including the possibility of deploying too
early for the finite Shield lifetime.

The new UI deliberately drops the old bespoke red/cyan timing strip. During implementation, keep the universal glyph
progress as the default. If the early-deploy edge still needs an affordance, solve it with the smallest real gameplay/UI
need exposed by runtime testing; do not automatically restore a custom Beam chart.

## Threat icon assets — DONE / pushed / packed

Current source icons:

```text
assets/raw/images/ui/threat_icons/missile.png
assets/raw/images/ui/threat_icons/beam_cannon.png
assets/raw/images/ui/threat_icons/mine.png
assets/raw/images/ui/threat_icons/spam.png
```

All four now have a `107 x 33` source canvas in the atlas.

Asset contract going forward:

- transparent PNG;
- white source art / tintable shape;
- runtime owns normal threat color and red danger overlay;
- internal cuts are transparent;
- do not author duplicate red terminal assets.

Current color identities:

- Missile -> orange;
- Beam -> cyan;
- Mine -> violet;
- SPAM -> green;
- terminal/progress overlay -> red.

Exact tint constants can be centralized in the threat presentation code when the implementation lands.

### Intended render strategy

Prefer one source texture per threat and render it twice:

```text
base copy     -> threat-color tint
red copy      -> danger tint + left-to-right clip/mask
```

At terminal state the red copy covers the whole glyph and blinks.

Use the simplest Phaser mechanism that behaves correctly with packed/trimmed atlas frames. A geometry mask is acceptable
if `setCrop` becomes awkward with TexturePacker trimming. Do not add duplicate gameplay state for the mask.

## Current runtime is intentionally obsolete visually

At this HEAD the threat row classes still implement the old card UI.

Relevant current files:

```text
src/app/scenes/game/bridge/view/captain_dashboard/combat_context/threats/
    BridgeCaptainThreatsView.ts
    BridgeCaptainMissileThreatRowView.ts
    BridgeCaptainBeamCannonThreatRowView.ts
    BridgeCaptainStickyMineThreatRowView.ts
    BridgeCaptainSpamThreatRowView.ts
    get_beam_shield_timing_strip_state.ts
```

`BridgeCaptainThreatsView` still declares a 3-column `163x66` grid. The row views still own borders, timer text, button
backgrounds and old timing-strip machinery. These are replacement targets, not design constraints.

The Shield targeting picker itself remains real and must survive the visual rewrite.

## Timing read-model audit required before drawing

The new universal progress language needs a latest-useful-start deadline for every threat/action:

- Missile -> Weapons HIT;
- Beam -> Engineer SHIELD;
- Mine -> Engineer CLEAR;
- SPAM -> Science PURGE.

Audit the current `PlayerThreatDecisionTimingSnapshot` before coding the view. The old UI intentionally had no SPAM
precision strip, so the required SPAM deadline may not exist yet.

If a timing fact is missing:

- extend the engine presentation/read model where timing truth already belongs;
- derive it from real remaining threat lifetime + real task duration/current crew-progress multiplier;
- do **not** reimplement tuning or slowdown math in Phaser/view code.

This should remain a presentation-read-model extension, not a new gameplay mechanic.

## Recommended next atom order

### Atom 1 — read-model + layout audit

Inspect fresh source for:

- all four bridge threat payloads;
- `PlayerThreatDecisionTimingSnapshot`;
- current command/active-task mapping;
- Shield targeting open/cancel flow;
- current right-screen dimensions/layout offsets.

Produce the minimal data contract needed by the new glyph UI.

### Atom 2 — replace threat visual shell

Implement:

- 4x2 layout;
- large `107x33` glyph placement;
- role/action label below;
- whole-cell pointer target;
- no card/timer/button chrome.

Keep existing real command callbacks.

### Atom 3 — progress overlay + terminal blink

Implement the shared glyph timing presentation:

- base tint;
- red clipped overlay;
- latest-useful-start progression;
- full-red terminal blink even while a counter-task is active.

### Atom 4 — action state + CANCEL

Implement:

- available;
- unavailable/gray;
- active task -> `CANCEL`;
- Beam `SHIELD` opens the existing node picker when available;
- active Shield deploy cancellation still cancels the real task.

### Atom 5 — runtime density/readability pass

Smoke with multiple mixed threats, including a full 4x2 board.

Check:

- icon visual mass;
- label readability;
- hover/click target clarity;
- red fill readability;
- terminal blink noise when several threats are terminal;
- reorder/reflow comprehension.

Do not add reflow tween until runtime proves it is useful.

## Deferred EW experiment worth preserving

A future enemy weapon/equipment effect may temporarily remove **timing precision** rather than player control.

Promising version:

- lasts roughly 4–5 seconds;
- threat glyphs remain visible;
- action labels/clicks remain available;
- red progress masks disappear, forcing the player to estimate timing from physical telegraphs;
- actual threat timers are unchanged;
- terminal full-red blink may remain as the coarse emergency signal.

Possible diegetic telegraphs:

- Missile position/approach on the viewscreen;
- Sticky Mine lamps/pulse progression on the hull/viewscreen;
- Beam enemy charge-up;
- SPAM/world-space effect.

This is a future playtest experiment, not part of the immediate dashboard implementation.

## Deferred lore/meta ideas from this session

### Personnel implants explain predictive timing

The military can plausibly implant personnel chips that let ship systems estimate how long a specific officer will take
to finish a task. Official documentation should of course insist this program has absolutely nothing to do with crew
stealing food, cutlery or other supplies and that task-duration prediction is merely an innocent side effect.

This provides a diegetic explanation for why the dashboard can show an officer-adjusted latest useful response window.

### Lore collectibles + final exam

Preferred lore delivery direction:

- optional collectibles/documents discovered through anomaly scans, empty node-space, wrecks/terminals/etc.;
- discoveries enter a journal and can be reread;
- do not dump one lore entry for every gameplay mechanic encountered in a run;
- collecting the full lore set can unlock a final special encounter with a mandatory absurd bureaucratic exam;
- successful completion awards an intentionally over-serious certificate/commendation/trophy rather than a mandatory
  power reward.

Tracked as deferred design, not immediate implementation.

## Docs refreshed in this handoff bundle

The following were stale and are refreshed together with this handoff:

- `docs/THREAT_PANEL.md`;
- `docs/GAMEPLAY_CONTRACTS.md`;
- `docs/SYSTEM_MAP.md`;
- `docs/TARGETED_SHIELDS_TASK.md`;
- `docs/COMBAT_PLAYTEST_ROADMAP.md`;
- `docs/BRIDGE_ART_DIRECTION.md`;
- `docs/BACKLOG.md`;
- `docs/PROJECT_CONTEXT.md`.

`docs/WORKING_RULES.md` remains valid and was not changed merely to bump a date.

## Validation / delivery workflow

Follow `docs/WORKING_RULES.md`.

For ordinary code changes:

```bash
git apply --check <patch>.patch
git apply <patch>.patch

npm run typecheck
npm test -- <focused tests>
npm test

git -c core.safecrlf=false diff --check
```

For raw texture changes:

```bash
npm run pack:tex
```

Runtime smoke is required for the threat-dashboard visual rewrite.

Do not patch from this handoff's source assumptions without re-fetching fresh `master`.
