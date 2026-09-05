# Space Captain — Bridge Art Direction

Durable visual rules for the first-person bridge and captain UI.

## Target

- 1280x720 composition.
- Early-1990s Sierra / Space Quest VGA feeling.
- Flat, authored shapes and deliberate pixel treatment over glossy modern sci-fi UI.
- Captain point of view: the captain is not another portrait in the bridge composition.
- Four officer video/intercom monitors: Scientist + Pilot on the left, Gunner + Engineer on the right.
- Lower-center combat space belongs to the captain dashboards rather than four seated officer backs/stations.

Avoid family-friendly mobile-game polish, generic AI-rendered 3D surfaces, dense airplane-cockpit chrome and noisy
micro-greeble textures. Prefer fewer, larger, intentional mechanical shapes.

## Captain dashboard

Information density should follow decisions rather than available data.

Prefer:

- strong hierarchy;
- compact labels;
- large readable pictograms;
- spacing instead of nested frames;
- whole logical cells as interaction surfaces;
- restrained animation used for state/urgency.

Do not add decoration merely to make a control look more like a physical button.

## Equipment tiles

Permanent information should stay limited to what changes an immediate decision: identity, operational state,
ammo/resource where relevant and integrity.

Current tile grammar:

- title at top;
- one large central equipment pictogram;
- compact current-resource readout at bottom-left when relevant;
- integrity pips at bottom-right;
- whole cell is the interaction surface;
- hover may replace title with contextual role/action text while the pictogram stays visible.

State should read as one object:

```text
NORMAL
    off-white / normal chrome

COOLDOWN / unavailable
    whole tile muted

BROKEN
    whole tile red

active targeting/work
    normal chrome + activity progress on the pictogram
```

Integrity pips use the same state language. A BROKEN tile should not leave unrelated bright white fragments behind.

The pictogram remains the preferred progress surface. Use ordinary Phaser tint so source shading/details survive;
avoid `setTintFill()` when it collapses useful internal readability.

Contextual role palette:

```text
S = Scientist = blue
P = Pilot     = green
G = Gunner    = red
E = Engineer  = yellow
```

Keep role colors centralized rather than redefining them per widget.

Reusable equipment source art lives under:

```text
assets/raw/images/equipment/icons/<equipment_name>.png
```

Do not pre-nest icons into speculative hierarchy levels before real variants require them.

## Color and small symbols

The bridge/UI base remains blue/cool with yellow/off-white accents.

Red is reserved for real danger, damage/critical state or another exceptional condition; it should not become
generic decoration.

Small command/danger symbols must survive at actual runtime size. Prefer clear silhouettes, few major masses and low
detail.

Threat-presentation specifics live in `THREAT_PANEL.md`.

## Combat-board composition

Macro bridge reference:

`reference/combat_bridge_layout_2026-08-25.png`

Use it for broad bridge/screen proportions, not as authority for old dashboard internals.

Current composition direction:

```text
TOP / SMALL AUXILIARY AREA
    category danger indicators

SIDES
    four officer video/intercom monitors

CENTER
    first-person viewscreen with concrete combat telegraphy

BOTTOM
    MY SHIP dashboard | ENEMY SHIP dashboard
```

The top area is **not** specified as one icon/card per concrete threat. Its job is to flag broad danger categories
and pull attention toward the viewscreen/equipment response.

Both ship dashboards preserve the current chassis-driven equipment grid. HULL lives in the shared header. Power Core
stays outside the spatial slot grid.

MY SHIP emphasizes controls: readiness, activity/cooldown, ammo/resources, integrity and available actions.

ENEMY SHIP emphasizes persistent readable state: Hull, installed equipment and integrity/BROKEN state. Do not leak
hidden ammo, cooldown or crew-decision truth merely to mirror MY SHIP density.

Basic enemy anatomy stays visible without a generic inspection modal. Deeper tactical information may remain future
Scientist content.

## Threat readability

Permanent captain UI should not become a matrix of individual threat cards, seconds-to-impact values and mitigation
frames.

Preferred hierarchy:

```text
category indicator says what kind of problem exists
-> viewscreen shows the concrete telegraph
-> player opens/uses the relevant system when exact detail or target choice is needed
```

Examples:

- approaching interceptable threat -> warning indicator + visible projectile -> Defense Turret inline target list;
- Beam targeting -> direct viewscreen/ship telegraph -> Shield/Evade response;
- attached hull problem -> attached-object indication -> Engineer response.

Do not invent a separate progress language when the viewscreen/inline equipment interaction already communicates the
useful state.

## Inline equipment interactions

Equipment interactions should feel like using a ship console, not opening an unrelated mobile-style modal.

The interaction replaces/uses the equipment dashboard content area when appropriate and returns cleanly to the
normal ship board.

Current Defense Turret inline Missile selection is the model for concrete incoming-target choice. Future Drive
Escape and other equipment-specific interactions can use the same broad pattern without being forced into identical
layouts.

## Beam targeting presentation

Current player Beam dashboard flow exposes occupied enemy equipment slots:

```text
select own Beam
-> other own equipment input dims/disables
-> valid enemy equipment targets highlight
-> choose target
-> Gunner begins charging
```

Selecting alone spends no CORE and occupies no officer. Accepting a target starts the real engine command.

After commitment, target-lock state derives from the active Gunner task and clears on
completion/cancellation/cleanup.

The engine also has `HULL` and `BRIDGE` Beam targets. Do not create a fake BRIDGE equipment slot or resurrect a
special BRIDGE/HULL dashboard column. When Hull/Bridge input is exposed, give each a deliberate semantic ship target
surface.

`BRIDGE` is a real gameplay target with an unfinished consequence; it is not an obsolete mockup artifact.

## Interaction guardrails

Prefer visible/spatial target surfaces when they are already clear, and inline equipment detail when a system needs
a concrete list or dedicated controls.

Do not force one universal targeting UI across Beam, Turret, Shield, Escape and future equipment.

Do not add a permanent combat log or target-detail panel unless actual play proves the existing surfaces
insufficient.

## Idea bank — ship announcer pseudo-role

Status: **IDEA BANK**. This is presentation/comedy, not a fifth gameplay officer.

A transient system-announcement monitor may occasionally appear for ship-level messages that none of the four
officers would naturally say, such as an incoming hail, critical Hull damage or major system failure.

The announcer does not:

- take officer tasks;
- become busy;
- own command legality;
- replace Scientist / Gunner / Pilot / Engineer;
- need a permanent fifth combat monitor.

The current joke is that her apparent "progression" could be purely cosmetic wardrobe changes while normal officers
gain real gameplay improvements. Keep the gag playful and secondary to the bridge's functional readability.

Name/personality, unlock method, trigger list and exact placement remain OPEN.
