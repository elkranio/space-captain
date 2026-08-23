# Space Captain — Current Handoff

## Current checkpoint

The current combat foundation includes:

- basic incoming-threat identity is free to the player; mandatory player Science TRACK/IDENTIFY is gone;
- incoming Beam target truth uses `HULL | DRIVE`;
- player Drive integrity and Beam module damage are engine-owned;
- player targeted-Shield semantics and the `HULL | DRIVE` Shield picker are implemented;
- the captain combat context uses the new clean header and 4x2 glyph threat grid;
- the header presents player HULL and the shared Power Core state;
- Missile, Beam, Mine and SPAM threat glyphs use the current timing/progress presentation described in
  `docs/THREAT_PANEL.md`.

## Next step

Before changing more combat semantics, reconcile the intended game design with the current implementation.

The next design pass should create one canonical intended-mechanics document. It must clearly separate:

- what the game **should** do;
- what the current runtime **already** does.

`docs/GAMEPLAY_CONTRACTS.md` remains current runtime truth until code is deliberately changed.

## Near-term combat sequence

After the design reconciliation, the current likely implementation order is:

```text
player OUR SHIP functional/module dashboard + targeted-Shield visual
-> enemy inspectability / enemy dashboard
-> Science tactical-information pass
-> player Beam semantic target
-> enemy targeted Shield
```

The broader playtest sequence lives in `docs/COMBAT_PLAYTEST_ROADMAP.md`.
