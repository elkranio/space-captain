# Space Captain — Bridge Art Direction

Visual reference only. Gameplay truth lives in `GAMEPLAY_CONTRACTS.md`; implementation state lives in `PROJECT_CONTEXT.md`.

Updated: 2026-08-15
Reference HEAD: `e7fb792e430d6745ae50c7d7ddb84513fe5bc918`

## Core fantasy

The player sits in the captain’s chair of a small, slightly worn, low-status working starship.

The bridge should feel:
- physical and lived-in;
- clearly inside a ship, not a giant hangar;
- functional but somewhat cheap;
- Space Quest / Sierra-era in spirit;
- comedic through details, not through visual chaos;
- readable as a game screen first.

## Camera / composition

- fixed first-person captain viewpoint;
- captain body/back not shown;
- captain table occupies lower foreground;
- large viewscreen remains upper visual focus;
- four officers remain visible:
  - Science;
  - Weapons;
  - Helm;
  - Engineer;
- current left-to-right officer order may remain Science -> Weapons -> Helm -> Engineer;
- VIP seat remains a future hook if it does not interfere with composition.

The next art pass should make the room feel more enclosed/ship-like:
- stronger ceiling/wall/console framing;
- clearer sense that stations belong to one compact bridge;
- less open empty “hangar” space.

## Viewscreen

Keep it visually clean.

May show:
- one enemy ship;
- missiles/mines/Beam Cannon/SPAM VFX;
- shields/impacts;
- small short-lived targeting/attack indicators.

Avoid:
- permanent giant health bars;
- modern HUD overlays;
- tiny telemetry labels floating in space;
- duplicating captain-table information.

Persistent combat information belongs on the captain dashboard.

## Captain table

Structural direction remains:
- left = **OUR SHIP**
- right = **CURRENT CONTEXT**

The dashboard should read as physical retro ship hardware, but clarity beats fake realism.

Avoid:
- Boeing/NASA density;
- glossy glass;
- flat web panels;
- spreadsheet rows;
- giant cards;
- excessive saturated role colors.

## Compact threat objects — selected direction

Long horizontal threat rows are implementation scaffolding and should be replaced in the upcoming gameplay-fidelity pass.

Selected visual shape:
- compact fixed-footprint tile;
- square icon + countdown at top;
- dedicated readable intel/signature strip;
- one/two compact action buttons;
- roughly four comfortably across the combat panel;
- five still viable under high threat pressure.

This is important because compact threats free dashboard space and make “how many problems exist right now” readable instantly.

### Intel grammar

Missile example:
- `?????` red = unknown;
- `ABC??` yellow = partial/uncertain;
- `ABCDE` green = confirmed.

Beam example:
- `????`;
- `PW??`;
- `PWR` / `HULL` / `WPNS`.

Keep the intel strip visually strong. Do not shrink it into a thin decorative separator.

### Buttons

Keep stable action names/locations where possible.

Examples:
- Science: `TRACK [S]`;
- missile Weapons response: `HIT [W]`;
- Beam Engineer response: `SHLD [E]`.

Do not rename `TRACK` to `CONFIRM` just because intel advanced; the code/color communicates state.

### Signature personality

Short generated 4–5 character player-facing codes are visually desirable:
- compact;
- memorable;
- can create funny screenshot/stream moments naturally.

They must remain readable and consistent with the actual intel contract.

## Our Ship panel

Upcoming pass should also simplify/readability-test the left panel.

Prefer:
- compact system rows/objects;
- stable action locations;
- weapon/system icon;
- short name/status/ammo;
- compact role/action button.

Avoid expanding each system into a decorative card.

## Combat juice — upcoming gameplay-fidelity pass

Add enough feedback to judge feel:
- short screen shake when player takes a meaningful hit;
- short restrained screen/console flash;
- more convincing missile sprite;
- readable outgoing/incoming projectile motion;
- Beam hit feedback;
- enemy hit/death feedback.

Do not turn the screen into constant shaking/flashing. Juice should mark meaningful impact, not obscure decision-making.

## Officers

Officers are real characters in the room, not portrait cards.

Desired life:
- stable silhouettes;
- subtle console/hand activity;
- occasional head turns;
- short barks;
- stronger reaction only for important events.

Avoid constant animation that competes with threat reading.

## Interaction direction

Captain dashboard is becoming the main command surface.

Officer stations still need:
- available/busy/block state;
- activity indicator;
- cancellation affordance for cancellable current work.

Old officer context menu is legacy coverage, not final visual direction.

## Weapon visual terminology

Current heavy precision energy weapon is **Beam Cannon**.

Do not label it Laser.

Future fast/weak Pulse Laser, if selected, is a separate archetype.

## Style

Target:
- authentic early-1990s VGA adventure-game spirit;
- Sierra / Space Quest mood without copying;
- 256-color feel;
- chunky readable pixel clusters;
- dark navy / blue-black base;
- steel-blue framing;
- muted accents;
- selective dithering;
- slightly worn service-ship materials;
- a little character/cheapness rather than sterile military prestige.

Tone:
- practical;
- readable;
- lightly comedic;
- not slick;
- not toy-like.

## Production rule

The next visual pass is **gameplay fidelity**, not final production art.

Temporary/generative art is allowed to become much closer to the intended game so combat can be evaluated honestly.

Do not let temporary geometry harden into domain architecture:
- presentation may change;
- runtime threat identity/gameplay contracts should not be distorted to fit old mockups.

Final pixel-artist production comes after combat/layout direction survives playtesting.
