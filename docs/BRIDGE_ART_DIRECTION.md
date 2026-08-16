# Space Captain — Bridge Art Direction

Living visual direction for the bridge.

Updated: 2026-08-16
Reference HEAD: `928235b2993b6cf8d322a3543cac14047f6bd925`

Gameplay truth lives in `GAMEPLAY_CONTRACTS.md`.
Immediate implementation work lives in the root `../CURRENT_HANDOFF.md`.

## Status

A new bridge visual baseline was selected during the 2026-08-15 art pass.

Stop searching for a new room composition before implementing this one.

It is not final pixel-artist production, but it is representative enough to code against and judge combat honestly.

## Core fantasy

The player sits in the captain's chair of a small, slightly worn, low-status working starship.

The bridge should feel:
- physical and lived-in;
- clearly inside a ship, not a hangar;
- functional but somewhat cheap;
- Space Quest / Sierra-era in spirit;
- lightly comedic through details, not chaos;
- readable as a game screen first.

## Current accepted composition

- fixed first-person captain viewpoint;
- captain avatar/back not shown;
- large forward viewscreen dominates the upper scene;
- four officer stations in one row;
- left-to-right: Science -> Helm -> Weapons -> Engineer;
- broad lower foreground reserved for captain dashboard;
- compact wall/ceiling framing;
- stations integrated into the room rather than floating desks.

## Current background asset treatment

The selected production candidate was cleaned manually in Photoshop.

Expected asset properties:
- viewscreen opening is transparent;
- station monitors are blank/dark;
- station role labels are removed;
- consoles/stations are painted into the background itself.

Do not add a separate old station-base sprite on top of this background.

## Viewscreen

Keep the space area visually clean.

May show:
- one enemy ship;
- missiles/mines;
- Beam/SPAM VFX;
- shields/impacts;
- short-lived attack indicators.

Avoid:
- permanent giant bars;
- persistent projectile labels like M1/L2;
- floating countdown labels;
- modern HUD telemetry duplicated over space.

Persistent combat information belongs on the captain dashboard/threat UI.

### Enemy ship staging

Current preferred combat composition:
- enemy higher in the viewscreen and offset to one side;
- show nose/front plus underside rather than flat head-on symmetry;
- large enough to carry visual character, not so large that it feels one meter from the player.

### Projectile staging

Future missile pass:
- outgoing projectiles travel away from player on an upward/diagonal depth vector toward enemy;
- incoming enemy projectiles mirror that vector toward player;
- strong perspective/scale change should sell speed;
- avoid slow floating side-view missile motion.

## Officer sprite contract

Officers are real characters in the bridge scene, not portrait cards.

Current production approach:
- whole precomposed transparent sprite;
- includes chair + body + head;
- runtime does not need separate chair/head layers;
- art production may swap heads on the common body/chair template.

Per visible officer:
- `idle`;
- `look_left`;
- `look_right`.

Four roles:
- Science;
- Weapons;
- Helm;
- Engineer.

Goal set = 12 seated sprites.

Some minor style mismatch/recoloring is acceptable until later polish if the states read correctly at game scale.

### Role color

Color coding is useful but should remain restrained.

Science currently uses blue/cyan direction.

Other role recolors can be finalized in the authored full sprites.

No role insignia is required on the body; labels/identity can live elsewhere if needed.

## Station monitors

For the new bridge rebuild monitors are deliberately blank dark surfaces.

Remove old runtime:
- command/combat hint text;
- task labels/progress on the station monitor;
- fake keyboard/touch-deck typing pulses.

Later, monitors may receive decorative readable role animations:
- targeting;
- tracking;
- Beam charging;
- repair diagnostics;
- navigation;
- other non-authoritative flavor.

Monitor animation must not become a second gameplay truth source.

## Station availability lamps

Old mirrored ready/busy/blocked side lamps are removed for now.

If availability needs a future bridge-local visual, redesign it against the new art rather than preserving the old rectangles.

## Captain dashboard

Structural direction remains:
- left = OUR SHIP;
- right = CURRENT CONTEXT.

Dashboard should read as physical retro ship hardware while remaining clear.

Avoid:
- Boeing/NASA density;
- glossy glass;
- flat web panels;
- spreadsheet rows;
- giant cards;
- carnival role colors.

## Compact threat objects

Selected direction remains:
- one concrete threat = one compact fixed-footprint object;
- icon + identity/intel + secondary numeric countdown;
- urgency timeline based on real response windows;
- one/two stable contextual action slots;
- roughly 4 comfortable across, 5 viable under pressure;
- target footprint roughly 4:3 rather than a wide spreadsheet row.

Detailed current interaction/layout direction lives in
`THREAT_PANEL.md`.

Do not aggregate away runtime threat identity.

## Pixel/style target

Target:
- early-1990s VGA adventure-game spirit;
- Sierra / Space Quest mood without literal copying;
- chunky readable pixel clusters;
- low/medium detail density;
- broad lighting planes;
- blue-gray/lavender-gray structural masses;
- selective saturated accents;
- hand-authored retro-tech shapes;
- practical and slightly weird rather than sterile hard-surface perfection.

Avoid:
- modern hyper-detailed indie pixel art;
- tiny greeble noise;
- grimdark realism;
- glossy military simulator;
- giant empty hangar composition.

## Production rule

The current bridge asset is good enough to implement.

Do not restart the art search because of:
- tiny style mismatches;
- imperfect frame depth;
- small palette inconsistencies;
- two unfinished recolors.

Fix those only when runtime evidence says they matter.
