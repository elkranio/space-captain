# Space Captain — Current Handoff

Date: 2026-08-16  
Baseline master at handoff creation:
`928235b2993b6cf8d322a3543cac14047f6bd925`

Always re-fetch `master` before creating the next patch; this SHA is a
historical checkpoint, not a permanent guard.

## Where we are

The current bridge rebuild and the main combat presentation pass are working
and pushed. The next atom is gameplay, not another bridge redesign.

### Bridge baseline

- First-person captain view; no captain avatar.
- Compact 1990s Sierra / Space Quest VGA bridge.
- Officer order: SCI -> HELM -> WPN -> ENG.
- Large polygonal forward viewscreen.
- Lower captain dashboard.
- Bridge background owns the stations and blank monitors.
- Officer sprites are authored separately; WPN/ENG are flipped as needed.
- Engineer recolor is complete.
- Do not move the manually tuned officer roots unless explicitly requested:
  - SCI: (285, 480)
  - HELM: (508, 480)
  - WPN: (778, 480)
  - ENG: (992, 480)
  - hitboxes: 115x153
- Viewscreen opening: x=182, y=59, w=919, h=308.
- Safe viewscreen content area: x=254, y=82, w=772, h=270.
- Layering:
  space/combat -> transparent bridge background -> officers ->
  dashboard/barks/menus.
- The open context menu still intentionally polls command availability at
  roughly 200 ms. Do not refactor this merely because it is polling.

## Combat presentation already green

### Enemy idle drift

Enemy ship presentation has a child visual root and a subtle no-rotation drift.
Only ship chassis visuals drift. Position getters include the visual offset.

Current feel:
- X: -2 -> 2 over 13.6 s, Sine.InOut, yoyo/repeat.
- Y: 1.5 -> -1.5 over 10.4 s, Sine.InOut, yoyo/repeat.

### Incoming missiles

Incoming missiles are Phaser Graphics presentation, not literal rocket sprites.

They support:
- multiple simultaneous missiles;
- engine-time synchronization;
- guided Catmull-Rom paths;
- immutable trajectory/jitter choice at creation;
- distance communicated by glyph/trail size;
- smooth cruise acceleration;
- hard terminal rush;
- point-defense integration.

Current motion constants:

```ts
motion: {
    terminalStartTimeProgress: 0.90,
    terminalStartPathProgress: 0.62,
    cruiseLinearWeight: 0.42,
    terminalLinearWeight: 0.392,
}
```

A possible odd first segment from the absolute incoming waypoint presets is
known, but runtime currently looks acceptable. Do not proactively rewrite it.

### Screen shake / point defense

Shared screen-shake presets live in `src/app/theme/screen_shake.ts`.

```ts
LIGHT:  { durationMs: 80,  intensity: 0.002 }
MEDIUM: { durationMs: 120, intensity: 0.004 }
HEAVY:  { durationMs: 220, intensity: 0.008 }
```

- Incoming missile hull impact: MEDIUM shake.
- Point-defense interception: no shake.
- PD is hitscan.
- PD beam thickness: outer 3 px / inner 1 px.
- PD HIT: brief pixel-particle burst.
- PD MISS: three near-miss beams, no particles.

### Outgoing missiles

The current outgoing missile visual pass is accepted for now, with minor polish
deferred.

- Phaser Graphics missile + exhaust trail.
- Five relative trajectory personalities:
  wide-left, shallow-left, direct S, low-right, high-right hook.
- Waypoints are relative to the start->target line.
- Endpoint is exact.
- Immutable waypoint jitter: about +/-6 px.
- Near player: large, bright, dense.
- Near enemy: small, sparse.
- Current depth mapping:
  `1 - sqrt(pathProgress)`.
- Engine time currently maps directly to path progress.
- Enemy point defense still uses the missile's current rendered position.

On a real player-missile HIT, a separate impact view emits a short warm radial
Phaser-circle flash at the last missile position:
radius 10, scale 4.5, alpha 0.85 -> 0, 160 ms, Quad.Out.
INTERCEPTED and TARGET_LOST do not get that impact flash.

The enemy-defense interception tests were made self-contained and no longer
depend on the debug-start enemy having a defense turret equipped.

### Enemy beam cannon

The viewscreen presentation was cleaned up.

- The threat view now shows only the physical charge effect at the enemy weapon.
- Removed designation text, countdown/timer, targeting frame, and BitmapText
  from the viewscreen.
- Threat snapshots still maintain lifecycle, but no longer drive a visual
  countdown.
- Beam HIT on the player hull: MEDIUM screen shake.
- ABSORBED keeps the existing shield impact behavior.
- Do not change shield behavior in the next atom.

## NEXT ATOM — Engineer-only sticky mine clearing

Design decision:

`CLEAR STICKY MINE` should be an Engineer responsibility, not a Shared
officer action.

Why:
- universal clearing made mines too disposable and reduced them to noise;
- the old Shared design partly existed to occupy Comms and Helm;
- Comms is gone;
- Helm will receive its own combat responsibility through Evade;
- trying to rescue universal mine clearing through timing/balance would preserve
  the wrong gameplay structure.

Keep the atom narrow:

1. Enforce Engineer-only mine clearing in engine command
   availability/validation, not only in presentation.
2. Engineer can start the existing clear-mine task.
3. SCI / HELM / WPN cannot start it.
4. Do not change clear duration, detonation timing, mine outcome, or damage.
5. Update/add focused tests for allowed Engineer and rejected other roles.
6. Remove the `Shared` role/tab/surface from the content editor if it only
   exists for the old shared command model.
7. Do not add Evade in this atom.
8. Do not implement escape flow in this atom.
9. Do not touch shields.

Known starting points to re-fetch on the new HEAD:

- `src/engine/encounter/commands/handlers/clear_sticky_mine_command_handler.ts`
- `tests/engine/encounter/clear_sticky_mine_command.test.ts`

Do not assume these are the only affected files; search current master before
patching.

## Gameplay direction immediately after that

### Helm: Evade

Helm currently needs a proper combat responsibility. Add an Evade mechanic
after Engineer-only mines are stable rather than keeping Shared mine clearing
as filler.

Exact Evade behavior is not locked yet; design it as its own atom.

### Escape chain

Current intended dependency:

1. The engine/drive must be operational; Engineer repairs it when necessary.
2. Helm performs the escape action.
3. Escape should require all other officers to be free.

Do not fold this into the mine atom.

## Deferred polish / cleanup

Not blocking current gameplay work:

- minor outgoing-missile trajectory/scale/trail tuning;
- possible trail decay after interception;
- final missile commit/point-of-no-return presentation if needed;
- remove disposable bridge debug renderer and its scene hook;
- remove temporary `phaser3-rex-plugins` dependency with debug cleanup;
- search and remove old missile sprite/raw/manifest assets only after proving
  they are no longer referenced.

Prefer Phaser pixel/shape VFX over generating more bespoke missile artwork when
simple geometry communicates the mechanic better.

## Working rule for every new chat

This rule is permanent for handoff maintenance:

1. Read this root `CURRENT_HANDOFF.md`.
2. **Read every Markdown document in `docs/` before coding or making new
   design decisions.**
3. Treat `docs/` as durable project/design truth and this handoff as the
   transient current-state pointer.
4. Re-fetch current `master` after reading the docs; never use the historical
   baseline SHA above as a new patch guard.

The current threat-tile / urgency-timeline design is documented in
`docs/THREAT_PANEL.md`, with the latest composition reference stored in
`docs/images/threat_tile_reference.png`.

After the docs are read and current `master` is fetched, search the actual
mine/editor implementation and make the Engineer-only mine atom from current
code rather than from this handoff's remembered paths.
