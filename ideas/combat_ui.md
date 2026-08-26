# Combat UI / Controls Idea Bank

These are deferred UI/control ideas. They are not runtime commitments merely because they are recorded here.

## Equipment detail tooltips

Status: **CONFIRMED DIRECTION, LATER**.

Keep combat equipment tiles focused on immediate operational truth. Do not permanently add damage/effect/spec text to the
small tile just because the data exists.

A later hover/focus tooltip can carry inspection-only information such as:

- damage / module damage;
- special effects and probabilities;
- ammo capacity;
- timing/cooldown details;
- item traits/upgrades;
- current hotkey assignment.

FTL-style large tooltips are an acceptable precedent: dense details can appear on demand while the permanent combat board
stays readable.

## Runtime equipment hotkey assignment

Status: **IDEA BANK / strong direction**.

Desired desktop interaction:

```text
hover/focus equipment tile
+ Ctrl+1..9
-> bind that equipment to the number key
-> save immediately with the run/loadout preferences
```

Likely behavior:

- assigning an occupied key moves/replaces the old binding rather than rejecting the input;
- the tile gets a small unobtrusive hotkey marker;
- pressing the number invokes the same semantic action path as clicking the tile;
- do not bind to visual grid coordinates if the player can rearrange equipment;
- prefer stable installed-equipment/mount identity so moving a module does not silently change what a learned key does;
- a later unbind gesture can be added if needed (`Ctrl+Backspace/Delete` while focused is one candidate).

Open question: if the same hotkey is pressed while that equipment owns cancellable work, should it become the same
contextual `CANCEL` action shown on hover? Decide from real task-cancellation UX rather than inventing a universal toggle.

## Gamepad support

Status: **DEFERRED**.

Gamepad support is desired, but it must not constrain the current mouse/keyboard combat design before the game and its
actual interaction patterns are stable.

Do not reject a good desktop interaction now merely because it has no obvious one-to-one controller gesture.

Architecture rule worth preserving now:

```text
pointer / keyboard / future gamepad
-> input adapter
-> same semantic UI action / engine-resolved command
```

Do not put gameplay legality directly in pointer handlers or keyboard listeners. If that boundary stays clean, a future
gamepad layer can use focus-grid navigation, face buttons, radial shortcuts or another controller-native mapping without
rewriting combat rules or tile state.
