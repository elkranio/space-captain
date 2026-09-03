# Space Captain — Bridge Art Direction

Durable visual rules for the first-person bridge and captain UI.

## Target

- 1280x720 composition.
- Early-1990s Sierra / Space Quest VGA feeling.
- Flat, authored shapes and deliberate pixel treatment over glossy modern sci-fi UI.
- Captain point of view: the captain is not another portrait in the bridge composition.
- Officers are presented through four physical video/intercom monitors: Science + Helm on the left, Weapons + Engineer
  on the right.
- Do not spend the valuable lower-center space on four seated officer backs/stations during combat.

Avoid family-friendly mobile-game polish, generic AI-rendered 3D surfaces, dense airplane-cockpit chrome and AI-sci-fi
surface noise such as fish-scale armor, endless tiny panels, meaningless vents/rivets or repeated greeble texture.
Prefer fewer, larger, intentional mechanical shapes.

## Captain dashboard

The dashboard should be information-dense only where the information changes a decision.

Prefer:

- strong hierarchy;
- compact labels;
- large readable glyphs;
- whitespace/spacing instead of nested frames;
- whole logical cells as interaction surfaces;
- restrained animation used for state/urgency.

Do not add decoration merely to make a control look more like a physical button.


## Equipment tiles

Equipment tiles should remain sparse enough to scan under combat pressure. Permanent information is the small set that
changes immediate decisions: identity, current operational state, current ammo/resource where relevant and integrity.
Detailed statistics belong in a later tooltip/inspection layer rather than becoming permanent tile chrome.

Current visual grammar established by the Missile Launcher prototype:

- title at the top;
- one large central equipment pictogram;
- compact current-resource readout at bottom-left where relevant;
- integrity pips at bottom-right;
- whole tile cell is the interaction surface;
- hover may replace the central pictogram with a contextual role/action label without adding a nested button.

State should read as one visual object, not several unrelated colors:

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

Integrity pips follow the same state language. In the normal palette, filled means intact and outline means missing
integrity. A fully BROKEN tile uses the broken/red palette rather than leaving bright white status fragments behind.

The pictogram itself is the preferred progress surface. Use two copies of the same detailed icon and crop the overlay
left-to-right:

```text
cooldown
    muted base -> normal overlay

repair
    broken/red base -> normal overlay

targeting/work
    normal base -> activity overlay
```

Use ordinary Phaser tint so source shading/details survive. Avoid `setTintFill()` when it turns the icon into a flat
silhouette and destroys useful internal readability.

Contextual action labels use officer-role initials/colors. Current shared palette:

```text
S = Science  = blue
H = Helm     = green
W = Weapons  = red
E = Engineer = yellow
```

The same palette is used for the first letter of officer station labels. Keep role colors centralized rather than
redefining them per widget.

Equipment source art is universal, not bridge-owned:

```text
assets/raw/images/equipment/<family>/<visual_archetype>/icon.png
```

Different progression items within one family may use different visual archetypes. Do not force all launchers/cannons/etc.
to share one icon merely because they share a mechanic kind.

## Color

The bridge/UI base remains blue/cool with yellow/off-white highlights where useful.

Combat threat families keep stable semantic colors. Red is reserved for danger, terminal urgency,
damage/critical state or
another clearly exceptional condition; it should not become generic decoration.

White source icons should remain tintable at runtime when one asset needs several semantic states.

## Small monitor symbols

Threat/command icons must survive at actual runtime size before they are judged at zoomed art size.

Prefer:

- simple silhouette;
- few major masses;
- low detail;
- consistent horizontal footprint where the UI family expects it;
- transparent background;
- no glow/gradients/soft anti-aliased illustration look.

Threat-dashboard specifics live only in `THREAT_PANEL.md`.

## Combat-board composition

Strict current layout reference:

`reference/combat_bridge_layout_2026-08-25.png`

The confirmed combat composition is:

```text
TOP CENTER
    compact threat monitor

SIDES
    four officer video/intercom monitors

CENTER
    first-person viewscreen

BOTTOM
    MY SHIP dashboard | ENEMY SHIP dashboard
```

Both ship dashboards use almost the full screen width and preserve an exact 4x3 equipment grid with large tiles.

Header grammar:

```text
ship name | compact ESC / escape-progress button | ... | CORE charge cells
```

Hull does not live in the header. Escape does not use a tall side column.

Each dashboard has one narrow special column beside the 4x3 grid:

```text
BRIDGE
    compact officer-role state markers

HULL
    one clickable Hull target
    one vertical segmented HP meter
```

Player uses `GRID | SPECIAL COLUMN`; enemy mirrors it as `SPECIAL COLUMN | GRID`.

The BRIDGE region is confirmed layout geometry and may show compact officer-role state markers. Its gameplay
targetability, damage model and interaction semantics are **OPEN**; do not infer them from the presence of the visual
block. HULL is the confirmed explicit ship target surface.

MY SHIP emphasizes controls: slot readiness, cooldown/activity, ammo/resources, integrity and action availability.

ENEMY SHIP emphasizes persistent readable state: Hull, installed slots, integrity/BROKEN state, obvious activity and
target highlights.

Basic enemy anatomy should stay visible without opening a separate inspection screen. Deeper tactical information may
remain a Science/gameplay layer.

The top-center threat monitor is compact in area but high in attention priority. Threat progress fills the icon silhouette;
mitigation progress fills the rounded-square frame perimeter. Do not add a normal progress bar under each threat glyph.

Direct targeting should read visually as:

```text
own system selected
-> valid target surfaces highlight
-> target selected
```

Prefer spatial selection on already-visible ship slots, the explicit HULL block and concrete threats over modal UI
when it remains clear. Do not make BRIDGE selectable until its gameplay contract defines what targeting it means.

Use visual grouping and semantic state before adding more labels/frames. Do not add permanent combat-log or target-detail
panels unless actual play proves the existing surfaces insufficient.

## Idea bank — ship announcer pseudo-role

Status: **IDEA BANK**. This is presentation/comedy, not a fifth gameplay officer.

A transient system-announcement monitor may occasionally appear for ship-level messages that none of the four officers
would naturally say.

Examples:

- enemy ship is hailing us;
- critical Hull damage;
- major system failure;
- other ship-computer/system announcements that need a voiced character moment.

The announcer is a recurring woman presented as the face/voice of the ship's automated announcement system.
She does not:

- take officer tasks;
- become busy;
- own command legality;
- replace Science / Weapons / Helm / Engineer;
- need a permanent fifth monitor in the combat layout.

Prefer a temporary popup/monitor treatment that reuses available bridge presentation space without stealing permanent
dashboard area.

Comedy/progression hook:

Normal officers gain useful traits/upgrades. The announcer's equivalent "progression" is purely cosmetic: new outfits,
especially increasingly elaborate/fitted retro-sci-fi uniforms, while her gameplay function remains exactly the same.

The joke is that she is visually treated like a character with an upgrade track even though her only job is to repeat
system information the ship already knows.

Keep the gag playful rather than making her a pin-up system. The humor should come from the absurd mismatch between
serious progression language and completely cosmetic wardrobe changes.

OPEN:

- exact name/personality;
- whether outfits are random rewards, milestone unlocks or tied to nominal "traits";
- exact trigger list;
- where the transient monitor appears in combat/non-combat scenes;
- whether some announcements are spoken by officers instead when that is more natural.
