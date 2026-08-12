# Space Captain — Bridge Art Direction

Visual reference only. Gameplay truth lives in `GAMEPLAY_CONTRACTS.md`; implementation state lives in `PROJECT_CONTEXT.md`.

## Core fantasy

The player sits in the captain’s chair of a small, slightly worn working starship.

The bridge should feel:
- physical and lived-in;
- functional but low-budget;
- comedic in small details without becoming parody;
- readable as a game screen first.

## Camera / composition

- fixed first-person captain viewpoint;
- captain body/back is not shown;
- captain table occupies the lower foreground;
- large viewscreen remains the upper visual focus;
- four officers are visible at stable stations:
  - Science
  - Weapons
  - Helm
  - Engineer
- current left-to-right visual order: Science → Weapons → Helm → Engineer
- VIP seat may exist near the captain area without blocking crew or viewscreen

## Viewscreen

Keep it visually clean.

May show:
- one enemy ship;
- space;
- missiles/mines/laser/spam VFX;
- shield/impact VFX;
- small temporary targeting indicators.

Avoid:
- permanent giant health bars;
- dense modern HUD overlays;
- lots of tiny labels;
- competing telemetry panels over the ship.

Persistent combat information belongs on the captain table.

## Captain table

Current structural direction:
- left = **OUR SHIP**
- right = **CURRENT CONTEXT**

Left side stays stable.
Right side changes with the encounter.

The table should read as physical ship hardware, not a floating web UI, but production clarity beats fake realism.

Avoid:
- Boeing/NASA cockpit density;
- hundreds of controls;
- bright carnival colors;
- glossy contemporary sci-fi glass;
- spreadsheet layouts;
- oversized cards.

### Status / systems

Prefer:
- chunky icons;
- discrete pips;
- short labels;
- restrained state changes;
- clear damaged/busy/ready differences.

Do not encode gameplay contracts such as separate “shield charges” vs “PD charges” in art docs. Current gameplay uses shared DEF; visual treatment can evolve independently.

### Threats

Current code uses horizontal rows as implementation scaffolding.

This is **not** final art direction.

Final threats may be:
- much more compact;
- small tiles;
- icon + timer + one/two compact action affordances;
- grouped visually without aggregating their gameplay identity.

The key requirement is rapid scanability under pressure, not preserving current row geometry.

## Officers

Officers are real characters in the room, not portrait cards.

Desired life:
- stable readable silhouettes;
- subtle hand/console activity;
- occasional head turns;
- text barks;
- stronger reaction only for important events.

Avoid constant animation that competes with combat.

## Interaction direction

The captain dashboard is becoming the primary command surface.

Officer stations still need:
- readable availability/busy state;
- activity indicator;
- direct cancellation affordance for cancellable current work.

The old officer context menu is legacy coverage, not a final visual requirement.

## Style

Target:
- authentic early-1990s VGA adventure-game spirit;
- Sierra / Space Quest-era mood without copying;
- restrained 256-color feel;
- chunky readable pixel clusters;
- dark navy / blue-black base;
- steel-blue framing;
- muted accents;
- selective dithering;
- nearest-neighbor edges;
- slightly worn service-ship materials.

Tone:
- practical;
- readable;
- lightly comedic;
- not sleek military prestige;
- not toy-like.

## Production rule

Final art should preserve stable interaction geometry and readability, but temporary programmer art must not harden into architecture.

When real art changes the best threat/system composition, prefer changing presentation over distorting gameplay/domain models to fit old mockup geometry.
