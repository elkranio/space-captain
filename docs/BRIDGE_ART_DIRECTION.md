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

Prefer spatial selection on already-visible ship slots, the explicit HULL block, BRIDGE block and concrete threats over
modal UI when it remains clear.

Use visual grouping and semantic state before adding more labels/frames. Do not add permanent combat-log or target-detail
panels unless actual play proves the existing surfaces insufficient.
