# Space Captain — Bridge Art Direction

Durable visual rules for the first-person bridge and captain UI.

## Target

- 1280x720 composition.
- Early-1990s Sierra / Space Quest VGA feeling.
- Flat, authored shapes and deliberate pixel treatment over glossy modern sci-fi UI.
- Captain point of view: the captain is not another portrait in the bridge composition.
- Officer stations and officers read as separate visual objects.

Avoid family-friendly mobile-game polish, generic AI-rendered 3D surfaces and dense airplane-cockpit chrome.

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

The confirmed combat composition is:

```text
compact threat strip
MY SHIP dashboard | ENEMY SHIP dashboard
```

MY SHIP and ENEMY SHIP should feel like one visual family, but they do not need mirrored information density.

MY SHIP emphasizes controls: slot readiness, cooldown/activity, ammo/resources, integrity and action availability.

ENEMY SHIP emphasizes persistent readable state: Hull, installed slots, integrity/BROKEN state, obvious activity and
target highlights.

Basic enemy anatomy should stay visible without opening a separate inspection screen. Deeper tactical information may
remain a Science/gameplay layer.

The threat strip should be compact in area but high in attention priority. Use clear family glyphs, progress/urgency and
restrained terminal danger animation rather than large permanent action cards.

Direct targeting should read visually as:

```text
own system selected
-> valid target surfaces highlight
-> target selected
```

Prefer spatial selection on already-visible ship slots/threats over modal UI when it remains clear.

Use visual grouping and semantic state before adding more labels/frames. The two dashboards should feel like tactical
equipment boards, not mirrored spreadsheets.
