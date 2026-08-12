# Space Captain — Backlog

Living backlog only. Completed historical phases belong in git history, not here.

## Current selected work

### Enemy sticky mines → captain combat context

Goal:
- use sticky mines as the next isolated enemy attack slice;
- expose every attached hostile mine independently on the captain dashboard;
- reuse existing clear-mine command truth.

Do not solve final threat layout yet.

## Near combat follow-ups

- Captain-context presentation for enemy SPAM.
- Finish player Point Defense as an installed/breakable system using shared DEF.
- Defense Capacitor BROKEN state:
  - charges reset to 0;
  - recharge progress resets;
  - no defensive consumer while broken.
- Shield Emitter break mutation.
- Active Shield disappears immediately if emitter breaks.
- Engineer repair commands for defensive installations.
- Balance pass for shield task duration / shield TTL / emitter cooldown / DEF recharge.
- Revisit enemy defensive shield behavior only after player-side contracts are stable.
- Decide whether Science gets meaningful laser/node targeting; keep current SCI laser slot disabled until then.

## Captain dashboard / UX

- Final threat presentation after real art exists:
  - rows may become compact tiles;
  - optimize for heavy combat without “Boeing” density.
- Replace placeholder threat/system icons with final art.
- Retire officer context menu only after dashboard command coverage is complete.
- Keep direct `[X]` task cancellation near officer activity for cancellable tasks.
- Add a clear “leave/escape/navigation” bridge flow when combat/navigation tabs are designed.
- Consider bridge tabs such as combat / engineering / navigation; do not implement until actual navigation UX is specified.

## Bridge / art

- Final bridge asset production using `BRIDGE_ART_DIRECTION.md`.
- Preserve 1280×720 composition and four visible officers.
- VIP seat remains future scene/content hook.
- Continue reducing arcade color noise in final dashboard art.

## Combat / content

- More enemy loadouts after isolated weapon slices are proven.
- Combat pacing pass when crew mistakes/traits are active; current timings are placeholders.
- Crew negative traits and hidden-risk pools.
- Officer relationships / arguments / R&R recovery.
- Contracts/routes/cargo/VIP run structure.

## Audio

- Short offline-generated officer acknowledgement/result/failure lines.
- Keep voice as UI feedback, not constant chatter.
- Batch-generate and post-process consistently; runtime TTS is not required.

## Refactor policy

Do not schedule broad refactors by file length.

Refactor only when one of these is concrete:
- context travels too far;
- ownership is unclear;
- the same gameplay rule is duplicated;
- signatures become cognitively hostile;
- callbacks form real spaghetti;
- state is reconstructed in multiple places.

Known settled non-problems:
- `EncounterEngine` as facade/composition root
- `BridgeController` as composition root
- long declarative `bridge_event.ts`
- separate captain/player-weapon mappers
