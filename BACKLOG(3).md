# Space Captain — Backlog

Updated: `2026-08-11`
Checkpoint: `5a37de2d24c8212c8ff1251ab097f75b293e5f9b`

## Selected work

Do not start semantic laser targeting yet.

```text
A. remove Local Space / GameOverlay legacy presentation
B. god objects + unnecessary segmentation
C. naming/model truth
D. transport/spaghetti/callback graph
E. final consistency/tests/runtime
F. semantic laser targeting
```

See `REFACTOR_AUDIT_HANDOFF.md`.

## Immediate atom — Local Space removal

Remove old:

- centered Local Space icon;
- popup current-node map/list;
- GameOverlay scene/controller/events/layers/views if Local Space-only;
- Local Space-only manifests/theme/tests/assets references.

Keep:

- navigation domain;
- current node/anchors/beacons used by gameplay;
- `HELM_FLY_TO`;
- officer-context-menu fly path;
- fly/dock/jump handlers.

No replacement navigation UI in this atom.

## God-object audit

First inspect:

```text
BridgeEncounterEngineEventHandler
BridgeEncounterController
```

Look for mixed event translation/persistence/navigation/combat presentation,
duplicated reconstruction and context passed far then rebuilt.

Refactor only if concepts/hops decrease.

## Unnecessary segmentation

Do not merge by file count alone.

Merge when a change routinely touches several tiny files with no independent
lifecycle/state and their APIs add ceremony.

Keep focused family runners when they isolate real mechanics.

## Naming/model truth

Known debt:

```text
PLAYER_POINT_DEFENSE_CHARGE_SPENT
remainingCharges
```

Player resource is shared DEF.

Legacy audit found 19 naming matches. Inventory exact uses before renaming because
enemy PD may still correctly use `remainingCharges`.

Likely player event direction:

```text
PLAYER_DEFENSE_CAPACITOR_CHARGE_SPENT
```

## Callback/transport pass

Audit:

- damage interruption callbacks;
- spam purge/mine clear edges;
- PlayerWeaponRunner ↔ CombatRunner queued objects;
- enemy destruction callbacks;
- runtime persistence synchronization;
- engine-event → bridge-event translation.

Goal: fewer reconstructed contexts and clearer owner, not a generic event bus.

## Semantic laser targeting

After audit, implement:

```text
HULL
ENGINE
WEAPONS
BRIDGE
VULNERABLE NODE
```

Rules:

- no old spatial zones/shield interaction;
- deterministic v0.1 hits;
- opening picker costs nothing;
- task begins after target choice;
- direct HULL fire if no real choice;
- one WEAPONS semantic target;
- vulnerable node is Science-discovered and one-hit/x2 hull.

## Science Analyze Enemy

Future scan should reveal one meaningful result, not tiny telemetry.

Potential families:

- schematic/system target knowledge;
- vulnerable node;
- temporary broad threat ID;
- authored capability intel.

Do not expose debug snapshots as player truth.

## Right combat dashboard

Pending after semantic/read-model decisions.

Preferred:

```text
enemy root
+
[TIMER] [ICON] [THREAT] [ACTION+ROLE]...
```

Cover missiles, lasers, mines, hostile spam and enemy-root actions.

Avoid Boeing/spreadsheet UI.

## Navigation dashboard

Old Local Space is being deleted.

Future navigation context should cover actual gameplay only:

- current node/anchors;
- fly/dock/jump;
- eventual escape;
- Helm task;
- Science discovery only when it exists.

## Officer context menu retirement

Keep temporarily for navigation/noncombat/cancellation.

Remove only after replacements exist, then remove menu polling/events/controller/view.

## Defense follow-ups

- focused regression: rejected/stale PD command cannot spend an extra DEF charge;
- future Engineer defense should use shared DEF;
- do not resurrect shield generator.

## Combat pacing

After right dashboard is playable, retest:

- 3–4 simultaneous threats;
- timers with slow/traited crew;
- tactical pause need;
- multiple valid responses;
- whack-a-mole risk.

Do not balance against old role-menu friction.

## Process discipline

Apply scripts:

- fresh remote HEAD;
- exact anchors;
- preflight all assumptions;
- validate virtual transforms before write;
- narrow correction on failure;
- no destructive rollback by default.

Recent lesson: `removeBetween()` caused duplicated end markers when replacement
also reinserted the marker. Prefer exact block transforms for fragile structural edits.

## Larger future systems

Deferred:

- enemy personality/presets;
- retreat/surrender;
- resupply/economy;
- broader subsystem repair;
- crew stress/R&R;
- factions;
- mission consequences/salvage.
