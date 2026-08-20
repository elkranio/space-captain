# Space Captain — Bridge Art Direction

Durable visual contract for the bridge.

Gameplay truth lives in `GAMEPLAY_CONTRACTS.md`.
Threat-tile behavior lives in `THREAT_PANEL.md`.

## Core fantasy

The player sits in the captain's chair of a small, slightly worn, low-status
working starship.

The bridge should feel:
- physical and lived-in;
- clearly inside a ship, not a hangar;
- functional but somewhat cheap;
- Space Quest / Sierra-era in spirit;
- lightly comedic through details, not visual noise;
- readable as a game screen first.

## Composition

Use the current rebuilt bridge as the baseline.

- fixed first-person captain viewpoint;
- captain avatar/back not shown;
- large forward viewscreen dominates the upper scene;
- four officer stations in one row;
- left-to-right: Science -> Helm -> Weapons -> Engineer;
- broad lower foreground reserved for the captain dashboard;
- compact wall/ceiling framing;
- stations integrated into the room rather than floating desks.

Do not restart the room-composition search without concrete runtime readability
evidence.

## Asset and officer treatment

- the bridge background owns the station consoles;
- the viewscreen opening is transparent;
- station monitors are blank/dark by default;
- officers are whole transparent seated sprites layered above the background;
- runtime should not split chair/body/head unless a real feature needs it;
- do not add the old separate station-base sprite over the current background.

Additional officer animation states may be authored when a real presentation
need exists. Do not pre-build state sets for symmetry.

## Viewscreen

The viewscreen shows physical combat:
- one enemy ship;
- missiles/mines;
- Beam/SPAM VFX;
- shields/impacts;
- short-lived attack indicators.

Persistent tactical explanation belongs on the captain dashboard.

Avoid:
- permanent giant bars;
- projectile countdown labels;
- persistent projectile IDs;
- floating telemetry duplicated over space.

Enemy ships should be staged strongly enough to read character and orientation
without feeling one meter from the player. Projectile perspective/scale should
sell depth and speed rather than slow side-view motion.

## Station monitors

Station monitors are presentation surfaces, not gameplay state.

They may later receive decorative role animation such as targeting, tracking,
repair diagnostics or navigation, but they must not become a second source of
command/task truth.

If station availability needs a visual treatment later, redesign it against the
current art rather than restoring old ready/busy/blocked rectangles.

## Captain dashboard

Structural direction:
- left = OUR SHIP;
- right = CURRENT CONTEXT.

The dashboard should feel like physical retro ship hardware while remaining
fast to scan.

Avoid:
- Boeing/NASA density;
- glossy glass;
- flat web panels;
- spreadsheet rows;
- giant cards;
- carnival role colors.

## Threat UI

One concrete threat maps to one compact fixed-footprint object.

Current direction:
- icon + identity/intel when useful;
- exact countdown;
- one or two contextual action slots;
- thin button-local decision strips based on real response windows;
- compact fixed tile footprint in the shared threat grid.

Keep timing information attached to the action it explains rather than turning
the tile into a miniature chart.

Do not aggregate away runtime threat identity.

See `THREAT_PANEL.md` for the interaction contract.

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
