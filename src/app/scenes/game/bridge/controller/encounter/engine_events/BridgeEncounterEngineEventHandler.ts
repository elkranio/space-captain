// src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler.ts

import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from "../../../../../../../engine/encounter/model/combat";
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
    type EncounterEvent,
} from "../../../../../../../engine/encounter/model/event";
import { OFFICER_TASK_KIND } from "../../../../../../../engine/encounter/model/officer_task";
import type { EncounterPresentationSnapshot } from "../../../../../../../engine/encounter/snapshots/encounter_presentation_snapshot";
import { BRIDGE_EVENT, BRIDGE_STICKY_MINE_REMOVAL_OUTCOME } from "../../../events/bridge_event";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import { mapEncounterAnchorToBridgeObjectPayload } from "../encounter_objects/BridgeEncounterObjectMapper";
import BridgeEncounterLoadPresenter from "./BridgeEncounterLoadPresenter";

export default class BridgeEncounterEngineEventHandler {
    private readonly loadPresenter: BridgeEncounterLoadPresenter;

    constructor(private readonly eventBus: BridgeEventBus) {
        this.loadPresenter = new BridgeEncounterLoadPresenter(this.eventBus);
    }

    // #region Public API

    public handle(
        event: EncounterEvent,

        presentationSnapshot?: EncounterPresentationSnapshot,
    ): void {
        this.handleEvent(event, presentationSnapshot);
    }

    public clearCombatPresentation(): void {
        this.eventBus.emit(BRIDGE_EVENT.ENEMY_ATTACK_WARNING_CLEARED);

        this.eventBus.emit(BRIDGE_EVENT.INCOMING_MISSILES_UPDATED, []);

        this.eventBus.emit(BRIDGE_EVENT.OUTGOING_MISSILES_UPDATED, []);

        this.eventBus.emit(BRIDGE_EVENT.OUTGOING_STICKY_MINES_UPDATED, []);

        this.eventBus.emit(BRIDGE_EVENT.STICKY_MINES_UPDATED, []);

        this.eventBus.emit(BRIDGE_EVENT.BEAM_CANNON_THREATS_UPDATED, []);

        this.eventBus.emit(BRIDGE_EVENT.PLAYER_SHIELD_UPDATED, null);

        this.eventBus.emit(BRIDGE_EVENT.ENEMY_SHIELDS_UPDATED, []);

        this.eventBus.emit(BRIDGE_EVENT.DEFENSE_TURRET_THREATS_UPDATED, []);
    }

    // #endregion

    // #region Event dispatch

    private handleEvent(
        event: EncounterEvent,

        presentationSnapshot?: EncounterPresentationSnapshot,
    ): void {
        switch (event.type) {
            // Loading state will be exposed by the enemy debug panel.
            // The combat view only needs the resolved physical shot.
            case ENCOUNTER_EVENT.ENEMY_DEFENSE_TURRET_LOADING_STARTED:
                return;

            case ENCOUNTER_EVENT.ENEMY_DEFENSE_TURRET_FIRED:
                this.eventBus.emit(BRIDGE_EVENT.ENEMY_DEFENSE_TURRET_FIRED, {
                    sourceActorId: event.sourceActorId,

                    projectileId: event.projectile.id,

                    outcome: event.outcome,
                });

                return;

            case ENCOUNTER_EVENT.ENCOUNTER_LOADED:
                if (!presentationSnapshot) {
                    throw new Error("ENCOUNTER_LOADED requires presentation snapshot");
                }

                this.loadPresenter.present(presentationSnapshot);
                return;

            case ENCOUNTER_EVENT.TRAVEL_STARTED:
                this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_TRAVEL_STARTED, {
                    taskId: event.taskId,

                    // Engine navigation хранит anchors,
                    // bridge view двигает presentation objects.
                    fromObjectId: event.fromAnchorId,
                    targetObjectId: event.target.id,
                });
                return;

            case ENCOUNTER_EVENT.JUMP_STARTED:
                this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_JUMP_STARTED, {
                    taskId: event.taskId,

                    targetNodeId: event.targetNodeId,
                });
                return;

            case ENCOUNTER_EVENT.DOCKING_STARTED:
                this.eventBus.emit(BRIDGE_EVENT.DOCKING_STARTED, {
                    taskId: event.taskId,
                    targetId: event.targetId,
                });
                return;

            case ENCOUNTER_EVENT.PLAYER_SHIELD_DEPLOYED:
                this.eventBus.emit(BRIDGE_EVENT.PLAYER_SHIELD_DEPLOYED, {
                    remainingDurationMs: event.shield.remainingDurationMs,

                    initialDurationMs: event.shield.initialDurationMs,
                });

                return;

            case ENCOUNTER_EVENT.PLAYER_SHIELD_ENDED:
                this.eventBus.emit(BRIDGE_EVENT.PLAYER_SHIELD_ENDED, {
                    outcome: event.outcome,
                });

                return;

            case ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED:
                this.eventBus.emit(BRIDGE_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED);

                return;

            case ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_STATE_CHANGED:
                return;

            case ENCOUNTER_EVENT.OFFICER_TASK_STARTED:
                return;

            case ENCOUNTER_EVENT.OFFICER_TASK_ENDED:
                if (event.result?.kind === OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED) {
                    const anchor = event.result.anchor;

                    this.eventBus.emit(
                        BRIDGE_EVENT.ENCOUNTER_OBJECT_ADDED,
                        mapEncounterAnchorToBridgeObjectPayload(anchor),
                    );
                }

                if (event.result?.kind === OFFICER_TASK_RESULT_KIND.DEFENSE_TURRET_FIRED) {
                    this.eventBus.emit(BRIDGE_EVENT.DEFENSE_TURRET_FIRED, {
                        projectileId: event.result.threatId,

                        outcome: event.result.outcome,
                    });
                }

                if (event.result?.kind === OFFICER_TASK_RESULT_KIND.STICKY_MINE_CLEARED) {
                    this.eventBus.emit(BRIDGE_EVENT.STICKY_MINE_REMOVED, {
                        mineId: event.result.mineId,

                        outcome: BRIDGE_STICKY_MINE_REMOVAL_OUTCOME.CLEARED,
                    });
                }

                if (
                    event.task.kind === OFFICER_TASK_KIND.WEAPONS_FIRE_BEAM_CANNON &&
                    event.outcome === OFFICER_TASK_OUTCOME.CANCELLED
                ) {
                    this.eventBus.emit(BRIDGE_EVENT.PLAYER_BEAM_CANNON_CHARGING_CLEARED, {
                        weaponId: event.task.weaponId,
                    });
                }

                return;

            case ENCOUNTER_EVENT.ENEMY_ATTACK_STARTED:
                this.eventBus.emit(BRIDGE_EVENT.ENEMY_ATTACK_WARNING_TRIGGERED);
                return;

            case ENCOUNTER_EVENT.STICKY_MINE_ATTACHED:
                if (
                    event.mine.source.kind !== COMBAT_SOURCE_KIND.ACTOR ||
                    event.mine.target.kind !== COMBAT_TARGET_KIND.PLAYER_SHIP
                ) {
                    throw new Error(
                        "Incoming sticky mine has invalid " +
                            "source or target: " +
                            event.mine.id +
                            "/" +
                            event.mine.source.kind +
                            "/" +
                            event.mine.target.kind,
                    );
                }

                this.eventBus.emit(BRIDGE_EVENT.STICKY_MINE_ADDED, {
                    mineId: event.mine.id,

                    sourceActorId: event.mine.source.actorId,

                    initialTimeToDetonationMs: event.mine.initialTimeToDetonationMs,
                });
                return;

            case ENCOUNTER_EVENT.STICKY_MINE_MISSED_PLAYER_SHIP:
                this.eventBus.emit(
                    BRIDGE_EVENT.STICKY_MINE_MISSED_PLAYER_SHIP,

                    {
                        sourceActorId: event.sourceActorId,
                    },
                );
                return;

            case ENCOUNTER_EVENT.PLAYER_BEAM_CANNON_CHARGING_STARTED:
                this.eventBus.emit(BRIDGE_EVENT.PLAYER_BEAM_CANNON_CHARGING_STARTED, {
                    weaponId: event.weaponId,

                    targetActorId: event.targetActorId,
                });
                return;

            case ENCOUNTER_EVENT.PLAYER_BEAM_CANNON_FIRED:
                this.eventBus.emit(BRIDGE_EVENT.PLAYER_BEAM_CANNON_CHARGING_CLEARED, {
                    weaponId: event.weaponId,
                });

                this.eventBus.emit(BRIDGE_EVENT.PLAYER_BEAM_CANNON_FIRED, {
                    weaponId: event.weaponId,

                    targetActorId: event.targetActorId,

                    outcome: event.outcome,
                });
                return;

            case ENCOUNTER_EVENT.PLAYER_MISSILE_LAUNCHED:
                if (
                    event.projectile.source.kind !== COMBAT_SOURCE_KIND.PLAYER_SHIP ||
                    event.projectile.target.kind !== COMBAT_TARGET_KIND.ACTOR
                ) {
                    throw new Error(
                        "Outgoing missile has invalid " +
                            "source or target: " +
                            event.projectile.id +
                            "/" +
                            event.projectile.source.kind +
                            "/" +
                            event.projectile.target.kind,
                    );
                }

                this.eventBus.emit(BRIDGE_EVENT.OUTGOING_MISSILE_ADDED, {
                    projectileId: event.projectile.id,

                    targetActorId: event.projectile.target.actorId,

                    initialTimeToImpactMs: event.projectile.initialTimeToImpactMs,
                });
                return;

            case ENCOUNTER_EVENT.PLAYER_MISSILE_RESOLVED:
                if (
                    event.projectile.source.kind !== COMBAT_SOURCE_KIND.PLAYER_SHIP ||
                    event.projectile.target.kind !== COMBAT_TARGET_KIND.ACTOR
                ) {
                    throw new Error(
                        "Resolved outgoing missile has " +
                            "invalid source or target: " +
                            event.projectile.id +
                            "/" +
                            event.projectile.source.kind +
                            "/" +
                            event.projectile.target.kind,
                    );
                }

                this.eventBus.emit(BRIDGE_EVENT.OUTGOING_MISSILE_REMOVED, {
                    projectileId: event.projectile.id,

                    targetActorId: event.projectile.target.actorId,

                    outcome: event.outcome,
                });
                return;

            case ENCOUNTER_EVENT.PLAYER_STICKY_MINE_MISSED:
                this.eventBus.emit(BRIDGE_EVENT.OUTGOING_STICKY_MINE_MISSED, {
                    mineId: event.mineId,

                    targetActorId: event.targetActorId,
                });
                return;

            case ENCOUNTER_EVENT.PLAYER_STICKY_MINE_ATTACHED:
                if (
                    event.mine.source.kind !== COMBAT_SOURCE_KIND.PLAYER_SHIP ||
                    event.mine.target.kind !== COMBAT_TARGET_KIND.ACTOR
                ) {
                    throw new Error(
                        "Outgoing sticky mine has invalid " +
                            "source or target: " +
                            event.mine.id +
                            "/" +
                            event.mine.source.kind +
                            "/" +
                            event.mine.target.kind,
                    );
                }

                this.eventBus.emit(BRIDGE_EVENT.OUTGOING_STICKY_MINE_ADDED, {
                    mineId: event.mine.id,

                    targetActorId: event.mine.target.actorId,

                    initialTimeToDetonationMs: event.mine.initialTimeToDetonationMs,
                });
                return;

            case ENCOUNTER_EVENT.PLAYER_STICKY_MINE_RESOLVED:
                if (
                    event.mine.source.kind !== COMBAT_SOURCE_KIND.PLAYER_SHIP ||
                    event.mine.target.kind !== COMBAT_TARGET_KIND.ACTOR
                ) {
                    throw new Error(
                        "Resolved outgoing sticky mine has " +
                            "invalid source or target: " +
                            event.mine.id +
                            "/" +
                            event.mine.source.kind +
                            "/" +
                            event.mine.target.kind,
                    );
                }

                this.eventBus.emit(BRIDGE_EVENT.OUTGOING_STICKY_MINE_REMOVED, {
                    mineId: event.mine.id,

                    targetActorId: event.mine.target.actorId,

                    outcome: event.outcome,
                });
                return;

            case ENCOUNTER_EVENT.PLAYER_SPAM_CHANNEL_STARTED:
                this.eventBus.emit(BRIDGE_EVENT.OUTGOING_SPAM_CHANNEL_STARTED, {
                    channelId: event.channelId,

                    targetActorId: event.targetActorId,
                });

                return;

            case ENCOUNTER_EVENT.PLAYER_SPAM_CHANNEL_ENDED:
                this.eventBus.emit(BRIDGE_EVENT.OUTGOING_SPAM_CHANNEL_ENDED, {
                    channelId: event.channelId,

                    targetActorId: event.targetActorId,

                    outcome: event.outcome,
                });

                return;

            case ENCOUNTER_EVENT.ENEMY_SHIP_DESTROYED:
                this.eventBus.emit(BRIDGE_EVENT.ENEMY_ATTACK_WARNING_CLEARED);

                // View фиксирует position
                // до удаления object sprite.
                this.eventBus.emit(BRIDGE_EVENT.ENEMY_SHIP_DESTRUCTION_STARTED, {
                    actorId: event.actorId,
                });

                this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECT_REMOVED, {
                    objectId: event.actorId,
                });
                return;

            case ENCOUNTER_EVENT.MISSILE_LAUNCHED:
                if (event.projectile.source.kind !== COMBAT_SOURCE_KIND.ACTOR) {
                    throw new Error(
                        "Incoming missile source must be an actor: " +
                            event.projectile.id +
                            "/" +
                            event.projectile.source.kind,
                    );
                }

                this.eventBus.emit(BRIDGE_EVENT.INCOMING_MISSILE_ADDED, {
                    projectileId: event.projectile.id,

                    designation: event.projectile.designation,

                    sourceActorId: event.projectile.source.actorId,

                    initialTimeToImpactMs: event.projectile.initialTimeToImpactMs,
                });
                return;

            case ENCOUNTER_EVENT.BEAM_CANNON_ATTACK_STARTED:
                this.eventBus.emit(BRIDGE_EVENT.BEAM_CANNON_THREAT_ADDED, {
                    attackId: event.attack.id,

                    designation: event.attack.designation,

                    sourceActorId: event.attack.sourceActorId,
                });
                return;

            case ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED:
                this.eventBus.emit(BRIDGE_EVENT.SPAM_CHANNEL_STARTED, {
                    channelId: event.channel.id,
                });
                return;

            case ENCOUNTER_EVENT.SPAM_CHANNEL_ENDED:
                this.eventBus.emit(BRIDGE_EVENT.SPAM_CHANNEL_ENDED, {
                    channelId: event.channel.id,

                    outcome: event.outcome,
                });
                return;

            case ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP:
                this.eventBus.emit(BRIDGE_EVENT.INCOMING_MISSILE_REMOVED, {
                    projectileId: event.projectile.id,
                });

                return;

            case ENCOUNTER_EVENT.STICKY_MINE_DETONATED:
                this.eventBus.emit(BRIDGE_EVENT.STICKY_MINE_REMOVED, {
                    mineId: event.mine.id,

                    outcome: BRIDGE_STICKY_MINE_REMOVAL_OUTCOME.DETONATED,
                });

                return;

            case ENCOUNTER_EVENT.BEAM_CANNON_FIRED:
                this.eventBus.emit(BRIDGE_EVENT.BEAM_CANNON_THREAT_REMOVED, {
                    attackId: event.attack.id,
                });

                this.eventBus.emit(BRIDGE_EVENT.BEAM_CANNON_BEAM_FIRED, {
                    sourceActorId: event.attack.sourceActorId,

                    outcome: event.outcome,
                });

                return;
        }

        throw new Error(`Unhandled encounter event: ${String(event)}`);
    }

    // #endregion
}
