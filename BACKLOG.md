# Space Captain — Backlog

Living backlog only. Completed historical phases belong in git history, not in the active task list.

Updated: 2026-08-15
Reference HEAD: `449524c811cd14b8ec933f74565cb6c8241bfdd0`

## Current selected work

### 1. Bridge rebuild — NEXT

Goal:
- replace the old hangar-like runtime bridge composition with the new accepted background;
- place the new whole seated officer sprites correctly;
- remove old station presentation that no longer belongs to the art;
- get one clean runtime screenshot and stop.

Focused handoff:
`BRIDGE_REBUILD_HANDOFF.md`

Remove for now:
- separate old station sprite layer;
- monitor combat/command hints;
- station task label/progress/cancel monitor overlay;
- fake typing/touch-deck pulses;
- ready/busy/blocked side lamps.

Keep:
- real engine officer tasks/availability;
- officer hit areas / legacy context menu coverage unless proven unnecessary;
- barks;
- captain dashboard;
- space/combat/viewscreen pipeline;
- generic enemy attack warning.

Do not wire head-turn behavior in the same first atom.

### 2. Officer look-state wiring

After static bridge assembly:
- support `idle`, `look_left`, `look_right` authored seated sprites;
- use head turns for barks/conversation readability;
- keep body movement minimal;
- presentation state only; do not leak into engine combat truth.

### 3. Captain dashboard gameplay-fidelity pass

Then continue:
- OUR SHIP cleanup;
- CURRENT CONTEXT cleanup;
- compact threat objects instead of long rows;
- stable real command binding;
- reduce Boeing/Excel feeling.

### 4. Viewscreen projectile / combat-juice pass

- remove persistent labels/timers from projectiles in the viewscreen;
- improve enemy ship staging if needed after new bridge is live;
- redesign outgoing/incoming missile sprites;
- use strong depth vectors/perspective so missiles feel fast;
- restrained hit flash/shake;
- readable Beam/SPAM/mine impacts.

### 5. Mine pressure experiment

Current manual impression:
- firing a single mine is mechanically satisfying;
- clearing mines is probably too permissive/easy.

Next experiment:
- allow mine clearing only through Engineer;
- replay both single-mine and salvo pressure;
- decide from feel, not theory.

Do not create a new mine weapon kind just for `salvoSize = 1`.

### 6. Enemy captain behavior

After representative combat presentation exists, return to the captain decision layer.

Desired baseline:
- configurable captain tick;
- attack vs defense decision;
- aggression 0–100;
- imperfect timing/perception;
- anti-streak/fairness if random choice produces nonsense;
- cross-blocking of crew roles matters;
- enemy mistakes may be surfaced through short barks so the player understands what happened.

Fun beats optimal tactical chess.

## Combat fun pass

Play one small encounter repeatedly and look for:
- obvious procedural response chains;
- dead time;
- excessive simultaneous demands;
- Weapons commitment being strategic vs merely annoying;
- Science always being automatic first click;
- no reason to accept damage;
- player staring at one panel only;
- insufficient offense/defense conflict.

Success criterion:

> One battle is good enough that the player wants to restart it immediately.

## Near combat systems

After the immediate visual/fun sequence:
- player Defense Turret break/repair;
- Power Core BROKEN behavior;
- Shield Generator break mutation;
- Active Shield removal on generator break;
- Engineer repair commands for defensive installations;
- Beam Cannon semantic target nodes only after real domain target state exists;
- enemy repair behavior.

## Dashboard / navigation later

Potential surfaces:
- Combat;
- Engineering;
- Navigation.

Possible auto-switch:
- Combat on engagement;
- Navigation after combat.

Do not build tabs merely to compensate for bad current layout.

## Bridge / art later

Current bridge background + officer sprite set is a strong production baseline, not final sacred art.

Later polish only after runtime/playtest evidence:
- role color consistency;
- small sprite cleanup;
- richer monitor decorative animations;
- officer head turns/barks;
- VIP seat if composition permits;
- captain dashboard physical art.

Do not spend another day polishing pixels that do not change gameplay readability.

## Content/editor state

Content tooling is complete enough for current gameplay iteration.

Return only when a concrete tuning/content workflow needs it.

## Audio

Later:
- short weapon/impact/alert sounds;
- officer acknowledgement/result/failure barks;
- voice as UI feedback, not constant chatter.

## Refactor policy

Only refactor when a demonstrated problem exists:
- context travels too far;
- ownership unclear;
- duplicated gameplay rule;
- repeated state reconstruction;
- real callback spaghetti;
- cognitively hostile signatures;
- stale semantic layer obscuring current behavior.
