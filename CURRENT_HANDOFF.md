# Space Captain — Handoff after Captain Dashboard / Threat UI pass

Updated: 2026-08-21

Fresh `master` at handoff time:

`c76446476e794a2f1a65c19c3521f917d4f15f6c`

Treat this SHA only as a historical marker. Re-fetch fresh `master` before any patch.

## Where we are

The current bridge/captain-dashboard visual pass reached a good stopping point.

The immediate next large slice should be the **player `OUR SHIP` dashboard functional redesign**:
real ship/module/weapon slot presentation, Power Core/system state, and readable broken/damaged state.

Do not start the next chat by re-implementing targeted Shields from the old handoff.
The old root `CURRENT_HANDOFF.md` and several durable docs are now partially stale.

## What actually landed since the old handoff

### Targeted player Shield — engine/domain DONE

Player temporary Shield placement is now node-targeted.

Current protected-node domain:

- `HULL`
- `DRIVE`

The selected node travels through the real engine flow:

```text
available Engineer command
    -> PLAYER_SHIP_NODE command target
    -> Engineer deploy-shield officer task
    -> deployment completion
    -> active player Shield targetNode
```

Beam defensive resolution is now:

```text
1. EVADING -> MISS, Shield untouched
2. else matching targeted Shield -> ABSORBED, Shield consumed
3. else -> normal target consequence, wrong-node Shield survives
```

Power/cooldown commitment and cancellation semantics were preserved.

Relevant engine tests landed, including targeted Shield resolution.

### Targeted player Shield — captain inline picker DONE

Beam `SHIELD` no longer immediately starts deployment.

It opens a full inline combat-context targeting state owned by the captain combat context.

Current picker:

- fixed provisional HULL / DRIVE rows;
- exact real Engineer commands supplied by app mapping;
- selecting HULL/DRIVE emits the exact engine command and closes;
- `CANCEL` returns to threat grid;
- current active deploy can still be cancelled from an active SHIELD tile;
- picker auto-closes if Beam threats or Shield targeting availability disappear.

Beam intel updates live while the picker is open.

Presentation rule currently implemented:

- UNKNOWN Beam intel -> show no node/time marker;
- uncertain hypothesis -> amber `? ETA` on hypothesized node;
- confirmed hypothesis -> red `! ETA` on confirmed node;
- multiple known Beam threats on one node may render multiple markers, nearest first;
- intel updates never auto-retarget an already selected/deployed Shield.

Relevant app/controller path:

- `BridgeCaptainCombatContextMapper`
- `BridgeCaptainCombatContextView`
- `BridgeCaptainShieldTargetingView`
- `BridgeCaptainThreatsView`
- `BridgeCaptainBeamCannonThreatRowView`

### Targeted Shield work still OPEN

`docs/TARGETED_SHIELDS_TASK.md` is NOT fully complete.

Still open:

1. player visual state outside the picker:
   - deployment in progress + selected node;
   - active Shield + protected node;
2. player Beam semantic enemy-node target;
3. enemy targeted Shield choice based on perceived target intel;
4. enemy targeted Shield physical resolution;
5. enemy targeted Shield visual.

Do not archive the targeted-Shield task yet.

The player Shield visual state should probably be integrated into the upcoming `OUR SHIP`
dashboard redesign instead of polishing the outgoing provisional player dashboard.

## Captain dashboard structural visual pass DONE

A new physical captain dashboard screen asset exists:

`assets/raw/images/bridge/ui/captain_dashboard/screen.png`

Runtime uses two copies:

- left = OUR SHIP
- right = CURRENT CONTEXT

Current structural decisions:

- screens are centered as a pair;
- roughly 10 px gap between them;
- lower edges are pushed to the bottom of the 1280x720 canvas;
- the authored screen sprite supplies the physical frame/hardware;
- old dashboard panel backgrounds/borders were removed so Phaser draws content on the physical display;
- both screens currently share the same physical screen art.

Manifest:

`src/app/manifests/bridge/captain_dashboard.ts`

The left screen still contains the old functional ship rows. That content is explicitly provisional.

## Threat tiles — current visual grammar

All four threat types now share the same flatter monitor-native grammar.

Important distinction:

- grid cell remains `163x66`;
- actual drawn tile is now approximately `153x58`;
- remaining cell space acts as grid padding/gap.

Common tile language:

- dark navy header/background;
- readable thin blue-gray outer border;
- compact 28 px header;
- icon / optional status / timer aligned in the header;
- darker action-row background;
- standard half-width action buttons when a threat has one action;
- 6 px segmented timing strips where the mechanic has useful decision timing;
- active action uses a dark clean orange background;
- expired state still uses the small blinking red terminal marker.

Do not restore the old beveled sprite-card/button look.

### Missile

Header:

- monochrome red missile glyph;
- current placeholder intel text: `NO ID / GUESS / LOCK...`;
- exact timer.

Actions:

- `[S] TRACK`
- `[W] HIT`

Both keep segmented cyan useful-time bars visible, including while task state is active.

The textual intel vocabulary is visually provisional.
We explicitly want to replace it with a more elegant non-text solution later if a good idea appears.
Do not force a bad icon solution merely to remove the text.

### Beam

Header:

- short monochrome cyan beam-impact glyph;
- current observer target intel text;
- exact timer.

Actions:

- `[S] TRACK`
- `[E] SHIELD`

Shield timing semantics:

```text
muted red = too early
cyan = valid
blinking bright red terminal marker = nominally expired
```

Current early-window red is intentionally muted; it is not the same semantic weight as hard danger red.

### Sticky Mine

Header:

- monochrome violet spider/crab-like sticky-mine glyph;
- no redundant middle status;
- exact timer.

Action layout:

- left action half intentionally empty;
- standard right-side `[E] CLEAR`;
- vertical divider at the left edge of the right action;
- 7-segment cyan timing bar only under CLEAR.

We tried full-width CLEAR and rejected it as visually too heavy.
Keep the familiar right-half button shape.

### Spam

Header:

- monochrome green `AD` plaque glyph;
- no redundant middle status;
- exact timer.

Action layout:

- left half intentionally empty;
- standard right-side `[S] PURGE`;
- no decision timing bar by design.

SPAM has no useful precision timing strip; its main gameplay effect is slowing other officer work.

## Threat-grid future direction — NOT IMPLEMENTED

Do not hard-code a gameplay cap of six threats yet.

Current design direction:

- up to ~6 threats: normal tile size;
- above that, consider switching to a compact tile size;
- candidate dense layouts: `4x2` or `3x3`, depending on real readability;
- only add the dense mode after actual runtime layout tests.

Threat reorder should eventually get a very short presentation-only tween.
When a threat disappears and remaining tiles reflow, the player should visually see which tile moved.

The tween must:

- not affect engine simulation;
- not depend on gameplay pause;
- still be allowed to finish if the user pauses exactly as reflow starts.

Not implemented yet.

## Right CURRENT CONTEXT dashboard — design direction

The right screen is contextual, not permanently “the combat panel”.

Current concept for a small top navigation/status line:

```text
THREATS | COMMS | <other context>
```

The active context changes with situation:

- combat -> THREATS;
- incoming communication -> COMMS;
- anomaly / other encounter -> its own context.

The exact third/future contexts are not locked yet.

The right side of the same top line may carry compact persistent ship/officer facts such as:

- HULL;
- CORE;
- officer presence/state.

Provisional officer-state color language discussed:

- white = normal/present;
- red = stunned;
- gray = absent from ship.

Do not show verbose “officer is doing X” text unless later layout proves there is space and value.

This context header is design direction only; not implemented as final UI yet.

## Enemy information / inspection — important new design direction

We no longer want basic enemy combat knowledge to require a mandatory Science scan before the player can make strategic decisions.

Current direction:

- basic enemy ship telemetry should be broadly inspectable;
- player should be able to inspect the enemy ship at any time during combat;
- inspection is a dedicated full overlay/modal, NOT another right-dashboard context;
- it should eventually expose enough information to plan deliberately:
  - enemy captain;
  - crew/officer traits;
  - ship nodes/modules;
  - weapons;
  - relevant ammo/resources/telemetry where useful.

This does NOT mean Science becomes useless.
Science should still create tactical knowledge where uncertainty actually creates interesting decisions
(e.g. concrete incoming threat target/signature/intention), rather than gate all basic enemy anatomy.

Enemy-inspection pause behavior should be a player setting:

- auto-pause while inspection is open;
- or keep simulation running.

This setting is not implemented.

Future analytics should record which option players use and how they inspect enemies.
Do not build the analytics now merely because the design mentions it.

## Dashboard / UI ideas explicitly deferred

### Captain hands / pointer embodiment

Optional future presentation toy:

- two captain hands at bottom;
- left hand follows pointer over left dashboard;
- right hand follows pointer over right dashboard;
- finger taps the physical display on click;
- must never obscure important UI;
- must be disableable.

Possible meta/cosmetic extension:

- collectible/achievement rings visible on captain fingers;
- maybe small starting bonuses later.

This is fun but absolutely not near-term required work.

## What docs are now stale

### Root `CURRENT_HANDOFF.md`

Very stale.

It still says:

- targeted Shields are the next slice;
- start with targeted Shield engine Atom 1;
- player Shields are whole-ship.

Do not follow that startup instruction.

### `docs/TARGETED_SHIELDS_TASK.md`

The task definition is still useful, but its “Current baseline” is stale.

Status now:

- A. Engine/domain -> DONE
- B. Captain dashboard picker -> DONE
- C. Player visual state -> OPEN
- Player Beam prerequisite -> OPEN
- Enemy targeted Shield -> OPEN
- Enemy visual -> OPEN

Keep the doc active until the remaining items are done.

### `docs/GAMEPLAY_CONTRACTS.md`

Stale targeted-Shield statements remain, including text saying targeted Shield is only planned / active Shield is whole-ship.

Fresh engine source is authoritative.

Needs a documentation refresh.

### `docs/SYSTEM_MAP.md`

Its Beam/Shield boundary still describes pre-targeted-Shield state.

Needs a documentation refresh.

### `docs/THREAT_PANEL.md`

Behavioral concepts remain useful, but current geometry/colors are stale.

It still describes older values such as:

- current production footprint `163x66` as the drawn tile;
- 3 px strips;
- cream timing fills.

Current runtime is instead:

- grid cell `163x66`;
- drawn threat tile about `153x58`;
- 6 px segmented strips;
- cyan normal useful-time fill;
- Beam early phase muted red.

Needs a documentation refresh.

### `docs/BRIDGE_ART_DIRECTION.md`

Durable composition remains broadly correct.

Needs a later small refresh for:

- authored dual physical captain-display screen asset;
- flat monitor-native UI content inside the screen;
- current dashboard placement.

### `docs/COMBAT_PLAYTEST_ROADMAP.md`

Gate structure remains useful, but checkpoint/immediate order is stale.

Important status:

- threat readability work has advanced substantially;
- targeted player Shield A/B are done;
- `Player dashboard functional redesign` is PARTIAL, not complete;
- enemy dashboard redesign remains open;
- player Beam semantic targeting remains open.

### `docs/BACKLOG.md`

No major newly completed backlog item identified.
Most entries remain genuinely deferred.

## Roadmap task status after this session

### Clearly completed / advanced

- compact threat presentation: DONE and visually redesigned again;
- player targeted Shield engine/domain: DONE;
- player targeted Shield inline selection: DONE;
- player dashboard physical display shell: DONE;
- right combat threat context presentation: substantially advanced.

### Not complete

- full player dashboard functional redesign;
- real module/weapon-slot presentation;
- player targeted Shield active/deploy visual;
- enemy dashboard redesign;
- full enemy inspection overlay;
- player Beam semantic node targeting;
- enemy targeted Shield;
- shared combat-effect model;
- starter gun experiment;
- weapon hit-effects pass;
- EMP experiment;
- second Helm command;
- combat-lab tooling;
- deeper crew/run systems.

## Recommended next active slice

### PLAYER `OUR SHIP` DASHBOARD — module / equipment slot redesign

This is the next large UI/data slice.

The left display should stop being the current provisional list of rows and become a readable ship model.

The exact visual layout is NOT fully designed yet.
Do not start coding from an invented final slot architecture.

First inspect current real domain/read models for:

- installed weapon instances;
- duplicate same-kind weapon identity;
- weapon family/type;
- current weapon phase/cooldown/ammo;
- Shield Generator;
- Defense Turret;
- Drive integrity/broken state;
- Power Core current/max/recharge;
- hull current/max;
- any other real installed module state already supported.

Then design the minimum slot grammar around the state that actually exists.

Likely presentation questions to answer before code:

- how many weapon slots are visible simultaneously?
- are defense/drive/core represented as fixed system slots separate from weapons?
- what is the compact visual state for READY / active phase / COOLDOWN / BROKEN?
- how do duplicate weapons remain individually identifiable?
- where does targeted Shield deployment/active target appear?
- how much detail belongs directly on the left display versus hover/inspection?

Do not invent generic module systems merely to draw empty future slots.

### Suggested atom order

Atom 1 — inspect current player ship/equipment read model and produce a concrete wireframe/data contract.

Atom 2 — implement static slot layout using current real installed modules/weapons.

Atom 3 — map live weapon/system states into slots.

Atom 4 — integrate targeted Shield deploy/active protected-node visual into the new dashboard.

Atom 5 — runtime density/readability pass.

Only after the player ship display is readable should we decide whether the next major slice is:

- enemy dashboard / full inspection;
- player Beam semantic targeting;
- or another Gate A dependency exposed by runtime.

## Files to read first in the next chat

Per `docs/WORKING_RULES.md`, still read every Markdown file in `docs/`, but treat the stale statements called out above as historical until docs are refreshed.

Pay special attention to:

- this handoff;
- `docs/COMBAT_PLAYTEST_ROADMAP.md`;
- `docs/GAMEPLAY_CONTRACTS.md`;
- `docs/SYSTEM_MAP.md`;
- `docs/BRIDGE_ART_DIRECTION.md`;
- `docs/THREAT_PANEL.md`;
- `docs/TARGETED_SHIELDS_TASK.md`;
- `docs/WORKING_RULES.md`.

Then re-fetch fresh `master`.

For the next slot/dashboard slice inspect at minimum:

- `BridgeCaptainDashboardView`
- `BridgePlayerShipDashboardView`
- its mapper/read-model inputs
- player ship/weapon snapshot types
- `src/engine/content/data/debug_start.json`
- ship weapon catalogs/definitions
- Power Core / Drive / Shield / Defense Turret presentation state

Do not patch from this handoff's source assumptions.

## Validation / patch workflow

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

For raw texture changes also run:

```bash
npm run pack:tex
```

Runtime smoke remains required for visual work.

Important lesson from this session:
generate patches from the exact full current source/blob.
Do not reconstruct “exact” files by stitching truncated snippets.
