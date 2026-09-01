import type { PlayerHullDamageResult } from "../../../../../../engine/defs/player";
import { SPACE_ANCHOR_KIND } from "../../../../../../engine/defs/universe";
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    BEAM_CANNON_SHOT_OUTCOME,
} from "../../../../../../engine/encounter/model/combat";
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_RESULT_KIND,
    type EncounterEvent,
} from "../../../../../../engine/encounter/model/event";
import type { EncounterPresentationSnapshot } from "../../../../../../engine/encounter/snapshots/encounter_presentation_snapshot";
import type { GameRuntime } from "../../../../../runtime/GameRuntime";

// Single owner of encounter -> persistent run write-back.
//
// Snapshot-backed persistence covers continuously changing installed player
// state and navigation. Event-backed persistence covers discrete outcomes
// whose structural meaning should not be reconstructed from presentation.
//
// This class emits no bridge presentation events and owns no gameplay rules.
export default class BridgeEncounterPersistenceSynchronizer {
    constructor(private readonly gameRuntime: GameRuntime) {}

    public syncSnapshot(snapshot: EncounterPresentationSnapshot): void {
        const powerCore = snapshot.player.powerCore;

        if (!powerCore) {
            throw new Error("Bridge player ship requires a power core");
        }

        const shieldGenerator = snapshot.player.shieldGenerator;

        if (!shieldGenerator) {
            throw new Error("Bridge player ship requires a shield generator");
        }

        this.gameRuntime.setPlayerShipPowerCoreState(powerCore.state);

        this.gameRuntime.setPlayerShipShieldGeneratorState(shieldGenerator.state);

        this.gameRuntime.setPlayerShipWeaponStates(snapshot.player.weapons.map(({ state }) => state));

        this.gameRuntime.setPlayerSpaceNavigation(snapshot.navigation);

        // Defense Turret is intentionally not copied from presentation here.
        // Its presentation state is encounter-operational (phase/load/cooldown/target),
        // while RunState currently owns installed equipment only. If persistent
        // damage/repair state is added, give it an explicit persistence projection
        // instead of leaking targetProjectileId into RunState.
    }

    public syncEvent(event: EncounterEvent): void {
        switch (event.type) {
            case ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED:
                this.gameRuntime.setPlayerShipDriveState(event.drive);

                this.gameRuntime.setPlayerSpaceNavigation(event.navigation);

                return;

            case ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_STATE_CHANGED:
                this.gameRuntime.setPlayerShipDriveState(event.drive);

                return;

            case ENCOUNTER_EVENT.OFFICER_TASK_ENDED:
                this.syncOfficerTaskResult(event);

                return;

            case ENCOUNTER_EVENT.ENEMY_SHIP_DESTROYED:
                this.gameRuntime.removeCurrentNodeActor(event.actorId);

                return;

            case ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP:
                this.syncPlayerHull(event);

                return;

            case ENCOUNTER_EVENT.STICKY_MINE_DETONATED:
                this.assertIncomingStickyMine(event);

                this.syncPlayerHull(event);

                return;

            case ENCOUNTER_EVENT.BEAM_CANNON_FIRED:
                if (event.outcome === BEAM_CANNON_SHOT_OUTCOME.HIT) {
                    this.syncPlayerHull(event);
                }

                return;

            default:
                return;
        }
    }

    private syncOfficerTaskResult(
        event: Extract<
            EncounterEvent,
            {
                type: typeof ENCOUNTER_EVENT.OFFICER_TASK_ENDED;
            }
        >,
    ): void {
        if (event.result?.kind !== OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED) {
            return;
        }

        const anchor = event.result.anchor;

        this.gameRuntime.addCurrentNodeAnchor({
            kind: SPACE_ANCHOR_KIND.JUMP_POINT,

            jumpPoint: {
                ...anchor.jumpPoint,
            },

            localPosition: {
                ...anchor.localPosition,
            },
        });
    }

    private syncPlayerHull(result: PlayerHullDamageResult): void {
        this.gameRuntime.setPlayerShipHull(result.remainingHull);
    }

    private assertIncomingStickyMine(
        event: Extract<
            EncounterEvent,
            {
                type: typeof ENCOUNTER_EVENT.STICKY_MINE_DETONATED;
            }
        >,
    ): void {
        if (
            event.mine.source.kind === COMBAT_SOURCE_KIND.ACTOR &&
            event.mine.target.kind === COMBAT_TARGET_KIND.PLAYER_SHIP
        ) {
            return;
        }

        throw new Error(
            "Detonated incoming sticky mine has " +
                "invalid source or target: " +
                event.mine.id +
                "/" +
                event.mine.source.kind +
                "/" +
                event.mine.target.kind,
        );
    }
}
