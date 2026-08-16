# Space Captain — Backlog

Last refreshed: 2026-08-16.

This is an active backlog, not a history log.
Completed implementation notes belong in the root
`../CURRENT_HANDOFF.md` only when they are needed to continue current work.

## P0 — next gameplay atom

### Engineer-only sticky mine clearing

- Make `CLEAR STICKY MINE` Engineer-only in engine command
  availability/validation.
- Preserve current clear duration, mine timing, damage, and outcome.
- Tests:
  - ENG allowed;
  - SCI rejected;
  - HELM rejected;
  - WPN rejected.
- Remove the obsolete `Shared` role/tab/surface from the content editor.
- Do not combine with Evade, escape, or shield changes.

## P1 — combat roles / escape

### Helm Evade

Give Helm a real combat responsibility through an Evade mechanic.
Define mechanics in a separate design/implementation atom after mine ownership
is fixed.

### Escape flow

Target dependency:

1. drive/engine operational;
2. Engineer repairs it first when damaged;
3. Helm initiates escape;
4. all other officers must be free for escape to complete/start as ultimately
   decided during implementation.

Keep the exact command/task contract explicit and tested.

### Outgoing missile polish

Current pass is usable. Revisit only after higher-value gameplay work:

- trajectory extremes / clipping;
- launch feel;
- scale falloff;
- trail density/decay.

## P2 — combat presentation polish

- Consider short trail decay when a missile is intercepted instead of
  disappearing instantly.
- If combat readability needs it, test a very short final missile
  point-of-no-return / commit presentation rather than making the whole terminal
  phase un-interceptable.
- Continue using shared screen-shake presets instead of ad-hoc values.

## P2 — cleanup

### Disposable bridge debug layer

After the current combat-debug workflow is no longer needed:

- remove `src/app/scenes/game/bridge/debug_view/**`;
- remove the BridgeScene debug hook;
- remove `phaser3-rex-plugins` if no real runtime use remains;
- validate package-lock after uninstall.

Do this as a dedicated cleanup atom.

### Legacy missile assets

After both incoming/outgoing Graphics-based missile presentations are proven:

- search all manifest/runtime references;
- remove only confirmed-unused old missile sprite/raw assets;
- repack textures;
- validate runtime.

Do not delete assets from memory/assumption alone.

## Ongoing code-health rule

Every few feature atoms, do a focused cognitive-load pass:

- identify god objects / callback mazes;
- flatten needless context hopping;
- centralize genuinely shared startup/config data;
- simplify signatures that became difficult to read;
- prefer boring explicit code over clever abstractions.

Do not refactor stable code merely to make architecture look more sophisticated.
