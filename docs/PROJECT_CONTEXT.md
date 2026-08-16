# Space Captain — Project Context

Last refreshed: 2026-08-16.

This file is intentionally short and durable.
Current implementation status and the next working atom live in the
root `../CURRENT_HANDOFF.md`.

## Product

Space Captain is a Phaser 3 + TypeScript combat/adventure roguelite with a
first-person captain view and a 1990s Sierra / Space Quest VGA visual target.

The player commands an unreliable delivery ship through officers rather than
directly piloting every system. Combat is built around readable telegraphed
threats, officer availability, counterplay, and intentionally limited ship
resources rather than bullet-hell reflex play.

## Repository

- GitHub: `elkranio/space-captain`
- Branch: `master`
- Engine/domain: `src/engine/**`
- App/Phaser presentation: `src/app/**`
- Bridge presentation: `src/app/scenes/game/bridge/**`
- Raw art: `assets/raw/images/**`
- Packed art: `assets/live/images/**`
- Canvas: 1280x720
- Atlas key: `atlas`
- Bitmap font: `pixel_operator`

Keep Phaser/app types out of the engine.

## Working principles

Prefer code that is easy to re-enter after a break:

- thin Phaser scenes;
- explicit engine APIs;
- discriminated unions instead of ambiguous optional fields;
- no architecture solely for architecture's sake;
- no callback mazes or context rebuilt across distant layers;
- centralize shared constants and starting data when it reduces cognitive load;
- use plain `string` IDs unless a wrapper adds real domain value;
- keep presentation effects in small presentation views rather than domain logic.

The refactor target is lower cognitive load, not maximum abstraction.

## Validation

For TypeScript/gameplay changes:

```bash
npm run typecheck
npm test
```

After raw texture changes:

```bash
npm run pack:tex
npm run typecheck
npm test
```

Runtime smoke is still required after visual/gameplay work.

Do not run `npm audit fix` as part of unrelated work.

## Working rules

Permanent collaboration, patch-delivery, cleanup, validation, and handoff rules
live in [`WORKING_RULES.md`](./WORKING_RULES.md).

Keep process rules there instead of duplicating them in this file or
`../CURRENT_HANDOFF.md`.

## Documentation map

- `WORKING_RULES.md` — canonical collaboration/patch workflow.
- `GAMEPLAY_CONTRACTS.md` — gameplay/domain invariants.
- `SYSTEM_MAP.md` — ownership/architecture map.
- `BACKLOG.md` — active deferred work.
- `BRIDGE_ART_DIRECTION.md` — bridge visual direction.
- `THREAT_PANEL.md` — compact threat-tile and urgency-timeline design.
- `../CURRENT_HANDOFF.md` — transient implementation state and next atom.

Session startup/read order and handoff workflow are defined only in
`WORKING_RULES.md`.
