# Space Captain — Project Context

Short durable context. Current implementation status and the next active slice
live in the root `../CURRENT_HANDOFF.md`.

## Product

Space Captain is a Phaser 3 + TypeScript combat/adventure roguelite with a
first-person captain view and a 1990s Sierra / Space Quest VGA visual target.

The player commands an unreliable delivery ship through officers rather than
directly piloting every system. Combat is built around readable telegraphed
threats, officer availability, counterplay and limited ship resources rather
than bullet-hell reflex play.

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

Treat p34t/framework configuration as infrastructure. Do not clean or rewrite it
opportunistically; touch it only when actual development requires the change.

## Coding principles

Optimize for low cognitive load and easy re-entry after a break.

- thin Phaser scenes;
- explicit engine APIs;
- one authoritative gameplay fact / one mutation path;
- discriminated unions for real state distinctions;
- plain `string` IDs unless a type adds real protection;
- early returns and explicit branching over clever dispatch;
- no callback mazes or broad context bags when direct dependencies are clearer;
- no architecture solely for architecture's sake;
- delete dead/obsolete layers before inventing replacements;
- keep presentation effects in presentation code, not domain truth;
- centralize shared constants/data only when it removes real duplication;
- format for roughly 120 columns and do not vertically explode readable code.

File length alone is not a refactor reason.

## Documentation map

- `WORKING_RULES.md` — collaboration, patch delivery, validation and handoff workflow.
- `GAMEPLAY_CONTRACTS.md` — gameplay/domain invariants.
- `SYSTEM_MAP.md` — current ownership/architecture map.
- `COMBAT_PLAYTEST_ROADMAP.md` — canonical near-term combat sequence and playtest gates.
- `BACKLOG.md` — active deferred work.
- `BRIDGE_ART_DIRECTION.md` — durable bridge visual direction.
- `THREAT_PANEL.md` — compact threat-tile interaction/timing contract.
- `../CURRENT_HANDOFF.md` — transient current state and next active slice.

Session startup/read order is defined only in `WORKING_RULES.md`.
