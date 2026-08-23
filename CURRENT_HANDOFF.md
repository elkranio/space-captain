# Space Captain — Current Handoff

## Current checkpoint

The current combat foundation includes:

- basic incoming-threat identity is free to the player; mandatory player Science TRACK/IDENTIFY is gone;
- incoming Beam target truth uses `HULL | DRIVE`;
- player Drive integrity and Beam module damage are engine-owned;
- player targeted-Shield semantics and the `HULL | DRIVE` Shield picker are implemented;
- the captain combat context uses the clean header and 4x2 glyph threat grid;
- the header presents player HULL and the shared Power Core state;
- Missile, Beam, Mine and SPAM threat presentation is described in `docs/THREAT_PANEL.md`.

The intended game/combat design reconciliation is complete and lives in `docs/GAME_DESIGN.md`.

Important boundary:

- `docs/GAME_DESIGN.md` = intended design;
- `docs/GAMEPLAY_CONTRACTS.md` = current implemented runtime truth.

Do not edit runtime contracts to pretend an intended mechanic is already implemented.

## Next step

Resume Gate A with the player's **OUR SHIP functional/module dashboard + targeted-Shield visual**.

Before that atom, re-fetch current `master` and inspect the exact captain-dashboard/module/shield presentation path.

## Near-term combat sequence

```text
player OUR SHIP functional/module dashboard + targeted-Shield visual
-> enemy inspectability / enemy dashboard
-> Science tactical-information pass
-> player Beam semantic target
-> enemy targeted Shield
```

Design/runtime mismatches that matter for later implementation are tracked in `docs/BACKLOG.md`.
The broader playtest sequence lives in `docs/COMBAT_PLAYTEST_ROADMAP.md`.
