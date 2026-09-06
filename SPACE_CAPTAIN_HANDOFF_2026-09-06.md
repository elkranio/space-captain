# Space Captain — handoff — 2026-09-06

## Current repo state

Repo: `elkranio/space-captain`
Branch: `master`
Fresh HEAD at handoff: `a9216c09e6a5d376972c73a836fe2c22edcc88c2` (`grind`)

The late-night pixel-art pass is finished for now. Next chat should start with a short implementation/layout pass, not another redesign spiral.

The latest bridge screenshot from the previous chat is the visual reference. Reattach it in the new chat if the image does not carry over.

## Immediate next goal

Morning task:

1. Finish integrating / laying out the new bridge visuals.
2. Fix the central viewscreen geometry so the existing space background fills the new opening correctly.
3. Do a runtime visual smoke check.
4. Stop pixel polishing and return to gameplay/code work.

Do not reopen broad art-direction discussions unless something is concretely broken.

## Current space background implementation

Relevant files:

- `src/app/scenes/game/bridge/view/space/BridgeSpaceBackgroundView.ts`
- `src/app/scenes/game/bridge/view/bridge_viewscreen_layout.ts`
- `src/app/scenes/game/bridge/view/interior/BridgeInteriorView.ts`
- `src/app/manifests/bridge/space_background.ts`

Current behavior:

- Background is a Phaser `TileSprite`.
- TileSprite bounds come from `BRIDGE_VIEWSCREEN_RECT`.
- Current rect is:
  - `x: 232`
  - `y: 74`
  - `width: 817`
  - `height: 287`
- `PANORAMA_DISPLAY_SCALE = 2`.
- Both `tileScaleX` and `tileScaleY` are `2`.
- `centerPanorama()` centers the visible texture region.
- Camera yaw moves `tilePositionX` through the panorama.
- There is no Phaser mask for the bevelled viewscreen shape.
- The space layer deliberately overflows the opening; the bridge interior drawn above it hides the corners.
- `BRIDGE_VIEWSCREEN_CONTENT_RECT` is a separate safe rect for mapping encounter/object positions so edge objects stay visible.
- Nebula manifest points to `world/backgrounds/nebula`.

When adapting the new bridge art:

- change the viewscreen rect(s) to match the new opening;
- do not resize/redraw the nebula asset just because the mockup currently looks cropped;
- start by keeping `PANORAMA_DISPLAY_SCALE = 2`;
- only tune the scale after seeing the runtime result;
- preserve the distinction between full background rect and safe content rect.

## Visual direction: considered settled enough

Keep the current direction:

- classic early-1990s Sierra / Space Quest VGA feel;
- functional in-game UI, not glossy modern sci-fi;
- blue cockpit frame;
- central viewscreen;
- officer labels:
  - `SCIENTIST`
  - `PILOT`
  - `GUNNER`
  - `ENGINEER`
- lower combat dashboards stay readable and practical;
- do not return to another spreadsheet-heavy redesign discussion;
- no more decorative pixel nudging unless there is a concrete readability/layout problem.

Recent combat-view art decisions to preserve when relevant:

- enemy ship sits farther away so projectiles have visual travel space;
- enemy ship may be angled somewhat toward the player;
- avoid obviously forward-only nose guns that could not plausibly fire toward the player from that perspective;
- interface can be slightly lighter than the darkest previous pass;
- dashboard framing should not become chunky again.

## Repo / coding workflow

User preferences:

- inspect fresh `master` before touching code;
- GitHub is authoritative;
- simple, obvious code;
- no overengineering;
- Russian comments/JSDoc for now;
- roughly 120-char line limit;
- do not touch `src/config/gameConfig.ts` unless genuinely required;
- user runs typecheck/tests/runtime smoke and pushes;
- for code changes, produce a real `.patch` from fresh preimages and give exactly:

```bash
git apply --check <patch>
git apply <patch>
```

Do not route the normal repo patch workflow into Work mode; user previously rejected that.

## Pending code cleanup after the UI pass

The large cleanup sprint is green and pushed.

One known cleanup item remains: Drive legacy status.

Target contract:

- persistent Drive: only identity/type (`id`, `driveId`);
- encounter Drive: identity/type + `integrity`, `maxIntegrity`;
- `integrity > 0` = operational;
- `integrity === 0` = broken;
- Engineer repair only when broken, restoring `maxIntegrity`;
- Drive damage/break state does not persist between encounters.

Remove legacy concepts if still present on fresh master:

- `SHIP_DRIVE_STATUS`
- `ShipDriveStatus`
- Drive `status`
- `ONLINE` / `DISABLED`
- stale persistence/sync paths that only exist for Drive status
- stale terminology:
  - `requiresOnlineDrive` -> `requiresOperationalDrive`
  - `cancelTasksRequiringOnlineDrive()` -> `cancelTasksRequiringOperationalDrive()`

Gameplay nuance to preserve:

- ordinary damage must not randomly interrupt tasks;
- if Drive integrity reaches `0`, a task requiring an operational Drive may be cancelled because the required equipment became broken;
- damage leaving Drive above `0` does not cancel that task.

Do not mix unrelated gameplay TODOs into this cleanup:

- universal cooldown commitment semantics;
- SPAM commitment;
- Evade wear/cooldown redesign;
- generic encounter-end reset.

## Docs

Do not do another docs pass now.

The project docs were just cleaned/refreshed. The current overnight work is visual/layout work and does not justify churn in `.md` files.

Only update docs later if implementation introduces a real architecture/gameplay contract change that makes them stale.

## Start of next chat

1. Reattach the latest bridge screenshot if needed.
2. Inspect fresh `master`.
3. Inspect current bridge/interior asset manifests and viewscreen layout.
4. Wire the new art / adjust coordinates.
5. Make the space background fill the new opening using the existing TileSprite/panorama system.
6. Runtime smoke.
7. Stop polishing and move on.
