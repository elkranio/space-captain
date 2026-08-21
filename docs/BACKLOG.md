# Space Captain — Backlog

Active deferred work only.

Completed work does not stay here.
The canonical near-term combat sequence lives in `COMBAT_PLAYTEST_ROADMAP.md`.

If a correctness blocker appears, put it at the top of this file while it is active and remove it after the fix is
regression-covered.

## Test hygiene

### Sticky-mine timing suites

Sticky-mine tests still mix:

- content tuning;
- salvo sequencing;
- fuse timing;
- large-step/catch-up semantics.

When this becomes expensive to maintain, do one dedicated cleanup:

- derive balance values from definitions where they are not the contract;
- preserve strict sequencing/fuse/catch-up assertions;
- keep command-role coverage strict.

Do not weaken tests merely to make them shorter.

## Gameplay follow-up

### Beam/module follow-up after targeted Shields

Keep these out of the targeted-Shield slice:

- Beam interruption probability / weapon-specific disruption tuning;
- future weapon traits that may spill module damage into hull;
- alternative already-broken-module damage modifiers;
- future concrete WEAPON / SHIELD module targets;
- Evade cancellation from the final dashboard control.

### Threat telemetry denial / EW experiment

After the new normal threat dashboard is implemented and readable, experiment with an enemy weapon/equipment effect that
removes **precision timing** for only a few seconds instead of disabling the dashboard or player controls.

Promising contract:

- roughly 4–5 seconds;
- threat glyphs stay visible;
- threat actions remain usable;
- glyph progress masks disappear;
- actual threat timers do not change;
- physical telegraphs become the rough timing source;
- terminal full-red blink may remain as the coarse emergency cue.

Useful physical telegraph candidates:

- Missile approach/position;
- Sticky Mine lamps/pulse progression before detonation;
- Beam enemy charge-up;
- SPAM/world-space interference.

Keep only if playtesting finds it tense rather than merely annoying.

### Encounter-end module reset

Intended lifecycle:

- system/module integrity is encounter-local;
- surviving modules return to max integrity after the encounter;
- hull damage does NOT auto-reset;
- hull repair remains station-only.

Implement the reset as one explicit lifecycle atom when the encounter-end write-back path is being touched.

### Escape flow

Current intended dependency:

1. drive/engine must be operational;
2. Engineer repairs it first when damaged;
3. Helm initiates escape;
4. whether other officers must be idle remains a design decision for the implementation pass.

Escape is not Evade.

## Narrative / meta follow-up

### Personnel productivity implants

Potential diegetic explanation for the captain dashboard's officer-adjusted response windows:

- military personnel receive mandatory service implants/chips;
- ship systems can estimate how long a concrete officer will take to complete a task;
- official documentation emphatically denies that the implant program has anything to do with widespread theft of food,
  cutlery or office supplies;
- task-duration prediction is presented as a harmless unrelated side effect and definitely not surveillance.

Use as optional lore/comedy, not a mandatory tutorial wall.

### Lore collectibles + completion exam

Preferred lore-delivery direction:

- lore is found as optional collectible documents/data from anomaly scans, wrecks, terminals, otherwise-empty node areas,
  etc.;
- found entries are stored in a rereadable journal;
- do not automatically dump one lore entry for every mechanic/situation encountered in a run;
- collecting the full lore set may unlock a final special encounter;
- that encounter contains a mandatory absurd bureaucratic exam based on the collected lore;
- passing awards an intentionally over-serious certificate/commendation/trophy rather than requiring a major power
  reward.

The old Space Quest-like exam idea therefore survives as a completion payoff rather than onboarding friction.

## Presentation polish

### Missile presentation

Current incoming/outgoing presentation is usable.

Revisit only when runtime evidence justifies it:

- trajectory extremes/clipping;
- launch feel;
- scale falloff;
- trail density/decay;
- short trail decay after interception;
- a very short terminal commit cue if readability needs it.

Continue using shared screen-shake presets rather than ad-hoc values.

## Cleanup

### Disposable bridge debug layer

When the current combat-debug workflow is no longer needed:

- remove `src/app/scenes/game/bridge/debug_view/**`;
- remove the BridgeScene debug hook;
- remove `phaser3-rex-plugins` if no real runtime use remains;
- validate the package lock after uninstall.

Do this as one dedicated cleanup atom.

### Legacy missile assets

After the Graphics-based incoming/outgoing missile presentations are confirmed as the only runtime path:

- search manifest/runtime references;
- remove only confirmed-unused old missile sprite/raw assets;
- repack textures;
- validate runtime.

Do not delete assets from memory or assumption.
