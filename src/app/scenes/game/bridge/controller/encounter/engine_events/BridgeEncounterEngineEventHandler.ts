// src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler.ts

import { OFFICER_ROLE } from '../../../../../../../engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../../../../../engine/defs/player_location';
import { SPACE_ANCHOR_KIND } from '../../../../../../../engine/defs/universe';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    LASER_SHOT_OUTCOME,
} from '../../../../../../../engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
    type EncounterEvent,
    type EncounterLoadedEvent,
} from '../../../../../../../engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../../../../../engine/encounter/model/officer_task';
import { DEBUG_SETTINGS } from '../../../../../../debug/debug_settings';
import type { GameRuntime } from '../../../../../../runtime/GameRuntime';
import { SCENE_KEY } from '../../../../../scene_key';
import {
    BRIDGE_EVENT,
    BRIDGE_STICKY_MINE_REMOVAL_OUTCOME,
    type BridgeEncounterObjectPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import { mapPlayerShipToBridgeStatusPayload } from '../../player_ship_status/BridgePlayerShipStatusMapper';
import {
    mapEncounterAnchorToBridgeObjectPayload,
    mapEncounterStateToBridgeObjectPayloads,
} from '../encounter_objects/BridgeEncounterObjectMapper';

type SetEncounterInteractive = (value: boolean) => void;

export default class BridgeEncounterEngineEventHandler {
    constructor(
        private readonly eventBus: BridgeEventBus,
        private readonly setEncounterInteractive: SetEncounterInteractive,
        private readonly gameRuntime: GameRuntime,
    ) {}

    // #region Public API

    public handle(events: EncounterEvent[]): void {
        for (const event of events) {
            this.handleEvent(event);
        }
    }

    // #endregion

    // #region Event dispatch

    private handleEvent(event: EncounterEvent): void {
        switch (event.type) {
            case ENCOUNTER_EVENT.ENCOUNTER_LOADED:
                this.handleEncounterLoaded(event);
                return;

            case ENCOUNTER_EVENT.CONTACT_STARTED:
                this.eventBus.emit(BRIDGE_EVENT.CONTACT_STARTED, {
                    contactName: event.contactName,

                    contactPortraitId: event.contactPortraitId,
                });
                return;

            case ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED:
                this.eventBus.emit(BRIDGE_EVENT.CONTACT_MESSAGE_ADDED, {
                    speakerName: event.speakerName,

                    text: event.text,
                });
                return;

            case ENCOUNTER_EVENT.CONTACT_ENDED:
                this.eventBus.emit(BRIDGE_EVENT.CONTACT_ENDED);
                return;

            case ENCOUNTER_EVENT.TRAVEL_STARTED:
                this.setEncounterInteractive(false);

                this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_TRAVEL_STARTED, {
                    taskId: event.taskId,

                    // Engine navigation хранит anchors,
                    // bridge view двигает presentation objects.
                    fromObjectId: event.fromAnchorId,
                    targetObjectId: event.target.id,
                });
                return;

            case ENCOUNTER_EVENT.JUMP_STARTED:
                this.setEncounterInteractive(false);

                this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_JUMP_STARTED, {
                    taskId: event.taskId,

                    targetNodeId: event.targetNodeId,
                });
                return;

            case ENCOUNTER_EVENT.DOCKING_STARTED:
                this.setEncounterInteractive(false);

                this.eventBus.emit(BRIDGE_EVENT.DOCKING_STARTED, {
                    taskId: event.taskId,
                    targetId: event.targetId,
                });
                return;

            case ENCOUNTER_EVENT.PLAYER_POINT_DEFENSE_CHARGE_SPENT:
                this.gameRuntime.setPlayerShipPointDefenseCharges(event.remainingCharges);

                this.emitPlayerShipStatusUpdated();

                return;

            case ENCOUNTER_EVENT.PLAYER_SHIELD_GENERATOR_STATE_CHANGED: {
                const previousCharges =
                    this.gameRuntime.getCurrentRun().player.ship.shieldGenerator.charges;

                this.gameRuntime.setPlayerShipShieldGeneratorState(event.shieldGenerator);

                if (event.shieldGenerator.charges !== previousCharges) {
                    this.emitPlayerShipStatusUpdated();
                }

                return;
            }

            case ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED:
                this.gameRuntime.setPlayerShipDriveState(
                    event.drive,
                );

                this.gameRuntime.setPlayerSpaceNavigation(
                    event.navigation,
                );

                this.emitPlayerShipStatusUpdated();

                this.eventBus.emit(
                    BRIDGE_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED,
                );

                return;

            case ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_STATE_CHANGED:
                this.gameRuntime.setPlayerShipDriveState(
                    event.drive,
                );

                this.emitPlayerShipStatusUpdated();

                return;

            case ENCOUNTER_EVENT.OFFICER_TASK_STARTED:
                this.eventBus.emit(BRIDGE_EVENT.OFFICER_ACTIVITY_STARTED, {
                    role: event.task.role,
                    label: event.task.label,
                });
                return;

            case ENCOUNTER_EVENT.OFFICER_TASK_ENDED:
                if (event.result?.kind === OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED) {
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

                    this.eventBus.emit(
                        BRIDGE_EVENT.ENCOUNTER_OBJECT_ADDED,
                        mapEncounterAnchorToBridgeObjectPayload(anchor),
                    );
                }

                if (event.result?.kind === OFFICER_TASK_RESULT_KIND.POINT_DEFENSE_FIRED) {
                    this.eventBus.emit(
                        BRIDGE_EVENT.POINT_DEFENSE_FIRED,
                        {
                            projectileId: event.result.threatId,

                            beamBand: event.result.beamBand,
                            outcome: event.result.outcome,
                        },
                    );
                }

                if (event.result?.kind === OFFICER_TASK_RESULT_KIND.SHIELD_DEPLOYED) {
                    this.eventBus.emit(
                        BRIDGE_EVENT.PLAYER_SHIELD_UPDATED,
                        {
                            zone: event.result.shield.zone,

                            remainingDurationMs: Math.max(
                                0,
                                event.result.shield.durationMs -
                                    event.result.shield.elapsedMs,
                            ),

                            initialDurationMs: event.result.shield.durationMs,
                        },
                    );
                }

                if (
                    event.result?.kind ===
                    OFFICER_TASK_RESULT_KIND.STICKY_MINE_CLEARED
                ) {
                    this.eventBus.emit(
                        BRIDGE_EVENT.STICKY_MINE_REMOVED,
                        {
                            mineId:
                                event.result.mineId,

                            outcome:
                                BRIDGE_STICKY_MINE_REMOVAL_OUTCOME.CLEARED,
                        },
                    );
                }

                if (
                    event.task.kind ===
                        OFFICER_TASK_KIND.WEAPONS_FIRE_LASER &&
                    event.outcome ===
                        OFFICER_TASK_OUTCOME.CANCELLED
                ) {
                    this.eventBus.emit(
                        BRIDGE_EVENT
                            .PLAYER_LASER_CHARGING_CLEARED,
                        {
                            weaponId:
                                event.task.weaponId,
                        },
                    );
                }

                this.eventBus.emit(BRIDGE_EVENT.OFFICER_ACTIVITY_CLEARED, {
                    role: event.task.role,
                });

                return;

            case ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED:
                this.eventBus.emit(BRIDGE_EVENT.MISSILE_TARGETING_WARNING_STARTED);
                return;

            case ENCOUNTER_EVENT.STICKY_MINE_ATTACHED:
                if (
                    event.mine.source.kind !==
                        COMBAT_SOURCE_KIND.ACTOR ||
                    event.mine.target.kind !==
                        COMBAT_TARGET_KIND
                            .PLAYER_SHIP
                ) {
                    throw new Error(
                        'Incoming sticky mine has invalid ' +
                            'source or target: ' +
                            event.mine.id +
                            '/' +
                            event.mine.source.kind +
                            '/' +
                            event.mine.target.kind,
                    );
                }

                this.eventBus.emit(
                    BRIDGE_EVENT
                        .MISSILE_TARGETING_WARNING_CLEARED,
                );

                this.eventBus.emit(
                    BRIDGE_EVENT.STICKY_MINE_ADDED,
                    {
                        mineId: event.mine.id,

                        sourceActorId:
                            event.mine.source
                                .actorId,

                        initialTimeToDetonationMs:
                            event.mine.initialTimeToDetonationMs,
                    },
                );
                return;

            case ENCOUNTER_EVENT.PLAYER_LASER_CHARGING_STARTED:
                this.eventBus.emit(
                    BRIDGE_EVENT
                        .PLAYER_LASER_CHARGING_STARTED,
                    {
                        weaponId:
                            event.weaponId,

                        targetActorId:
                            event.targetActorId,

                        targetZone:
                            event.targetZone,
                    },
                );
                return;

            case ENCOUNTER_EVENT.PLAYER_LASER_FIRED:
                this.eventBus.emit(
                    BRIDGE_EVENT
                        .PLAYER_LASER_CHARGING_CLEARED,
                    {
                        weaponId:
                            event.weaponId,
                    },
                );

                this.eventBus.emit(
                    BRIDGE_EVENT
                        .PLAYER_LASER_FIRED,
                    {
                        weaponId:
                            event.weaponId,

                        targetActorId:
                            event.targetActorId,

                        targetZone:
                            event.targetZone,

                        outcome:
                            event.outcome,
                    },
                );
                return;

            case ENCOUNTER_EVENT.PLAYER_MISSILE_LAUNCHED:
                if (
                    event.projectile.source.kind !==
                        COMBAT_SOURCE_KIND
                            .PLAYER_SHIP ||
                    event.projectile.target.kind !==
                        COMBAT_TARGET_KIND.ACTOR
                ) {
                    throw new Error(
                        'Outgoing missile has invalid ' +
                            'source or target: ' +
                            event.projectile.id +
                            '/' +
                            event.projectile.source.kind +
                            '/' +
                            event.projectile.target.kind,
                    );
                }

                this.eventBus.emit(
                    BRIDGE_EVENT
                        .OUTGOING_MISSILE_ADDED,
                    {
                        projectileId:
                            event.projectile.id,

                        missileId:
                            event.projectile.missileId,

                        targetActorId:
                            event.projectile
                                .target.actorId,

                        initialTimeToImpactMs:
                            event.projectile
                                .initialTimeToImpactMs,
                    },
                );
                return;

            case ENCOUNTER_EVENT.PLAYER_MISSILE_RESOLVED:
                if (
                    event.projectile.source.kind !==
                        COMBAT_SOURCE_KIND
                            .PLAYER_SHIP ||
                    event.projectile.target.kind !==
                        COMBAT_TARGET_KIND.ACTOR
                ) {
                    throw new Error(
                        'Resolved outgoing missile has ' +
                            'invalid source or target: ' +
                            event.projectile.id +
                            '/' +
                            event.projectile.source.kind +
                            '/' +
                            event.projectile.target.kind,
                    );
                }

                this.eventBus.emit(
                    BRIDGE_EVENT
                        .OUTGOING_MISSILE_REMOVED,
                    {
                        projectileId:
                            event.projectile.id,

                        targetActorId:
                            event.projectile
                                .target.actorId,

                        outcome:
                            event.outcome,
                    },
                );
                return;

            case ENCOUNTER_EVENT.ENEMY_SHIP_DESTROYED:
                this.setEncounterInteractive(false);

                this.gameRuntime
                    .removeCurrentNodeActor(
                        event.actorId,
                    );

                this.eventBus.emit(
                    BRIDGE_EVENT
                        .MISSILE_TARGETING_WARNING_CLEARED,
                );

                this.eventBus.emit(
                    BRIDGE_EVENT
                        .ENEMY_SHIP_TELEMETRY_UPDATED,
                    undefined,
                );

                // View фиксирует position
                // до удаления object sprite.
                this.eventBus.emit(
                    BRIDGE_EVENT
                        .ENEMY_SHIP_DESTRUCTION_STARTED,
                    {
                        actorId:
                            event.actorId,
                    },
                );

                this.eventBus.emit(
                    BRIDGE_EVENT
                        .ENCOUNTER_OBJECT_REMOVED,
                    {
                        objectId:
                            event.actorId,
                    },
                );
                return;

            case ENCOUNTER_EVENT.MISSILE_LAUNCHED:
                if (
                    event.projectile.source.kind !==
                    COMBAT_SOURCE_KIND.ACTOR
                ) {
                    throw new Error(
                        'Incoming missile source must be an actor: ' +
                            event.projectile.id +
                            '/' +
                            event.projectile.source.kind,
                    );
                }

                this.eventBus.emit(BRIDGE_EVENT.MISSILE_TARGETING_WARNING_CLEARED);

                this.eventBus.emit(BRIDGE_EVENT.INCOMING_MISSILE_ADDED, {
                    projectileId: event.projectile.id,

                    designation: event.projectile.designation,

                    sourceActorId:
                        event.projectile.source.actorId,

                    initialTimeToImpactMs: event.projectile.initialTimeToImpactMs,
                });
                return;

            case ENCOUNTER_EVENT.LASER_ATTACK_STARTED:
                this.eventBus.emit(BRIDGE_EVENT.MISSILE_TARGETING_WARNING_CLEARED);

                this.eventBus.emit(BRIDGE_EVENT.LASER_THREAT_ADDED, {
                    attackId: event.attack.id,

                    designation: event.attack.designation,

                    sourceActorId: event.attack.sourceActorId,
                });
                return;


            case ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED:
                this.eventBus.emit(
                    BRIDGE_EVENT.MISSILE_TARGETING_WARNING_CLEARED,
                );

                this.eventBus.emit(
                    BRIDGE_EVENT.SPAM_CHANNEL_STARTED,
                    {
                        channelId: event.channel.id,
                    },
                );
                return;

            case ENCOUNTER_EVENT.SPAM_CHANNEL_ENDED:
                this.eventBus.emit(
                    BRIDGE_EVENT.SPAM_CHANNEL_ENDED,
                    {
                        channelId: event.channel.id,

                        outcome: event.outcome,
                    },
                );
                return;

            case ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP:
                this.eventBus.emit(BRIDGE_EVENT.INCOMING_MISSILE_REMOVED, {
                    projectileId: event.projectile.id,
                });

                this.handlePlayerShipDamaged(event.damage);
                return;

            case ENCOUNTER_EVENT.STICKY_MINE_DETONATED:
                if (
                    event.mine.source.kind !==
                        COMBAT_SOURCE_KIND.ACTOR ||
                    event.mine.target.kind !==
                        COMBAT_TARGET_KIND
                            .PLAYER_SHIP
                ) {
                    throw new Error(
                        'Detonated incoming sticky mine has ' +
                            'invalid source or target: ' +
                            event.mine.id +
                            '/' +
                            event.mine.source.kind +
                            '/' +
                            event.mine.target.kind,
                    );
                }

                this.eventBus.emit(
                    BRIDGE_EVENT.STICKY_MINE_REMOVED,
                    {
                        mineId: event.mine.id,

                        outcome:
                            BRIDGE_STICKY_MINE_REMOVAL_OUTCOME.DETONATED,
                    },
                );

                this.handlePlayerShipDamaged(
                    event.damage,
                );
                return;

            case ENCOUNTER_EVENT.LASER_FIRED:
                this.eventBus.emit(BRIDGE_EVENT.LASER_THREAT_REMOVED, {
                    attackId: event.attack.id,
                });

                this.eventBus.emit(BRIDGE_EVENT.LASER_BEAM_FIRED, {
                    sourceActorId: event.attack.sourceActorId,

                    targetZone: event.attack.targetZone,
                    outcome: event.outcome,
                });

                if (event.outcome === LASER_SHOT_OUTCOME.BLOCKED) {
                    return;
                }

                this.handlePlayerShipDamaged(event.damage);
                return;
        }

        throw new Error(`Unhandled encounter event: ${String(event)}`);
    }

    // #endregion

    // #region Combat

    private handlePlayerShipDamaged(damage: number): void {
        const result = this.gameRuntime.damagePlayerShipHull(damage);

        if (result.currentHull !== result.previousHull) {
            this.emitPlayerShipStatusUpdated();
        }

        // destroyed === true также вернётся
        // при повторном damage,
        // когда hull уже был равен нулю.
        if (!result.destroyed || result.previousHull === 0) {
            return;
        }

        this.setEncounterInteractive(false);

        this.eventBus.emit(
            BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED,
            {
                sceneKey: SCENE_KEY.END,
            },
        );
    }

    private emitPlayerShipStatusUpdated(): void {
        const ship = this.gameRuntime.getCurrentRun().player.ship;

        this.eventBus.emit(
            BRIDGE_EVENT.PLAYER_SHIP_STATUS_UPDATED,
            mapPlayerShipToBridgeStatusPayload(ship),
        );
    }

    // #endregion

    // #region Encounter loaded

    private handleEncounterLoaded(event: EncounterLoadedEvent): void {
        const objects = mapEncounterStateToBridgeObjectPayloads(event.state);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED, objects);

        const navigation = event.state.navigation;
        switch (navigation.kind) {
            case PLAYER_SPACE_NAVIGATION_KIND.ARRIVING:
                this.handleArrivingNavigation(navigation.targetAnchorId, objects);
                return;

            case PLAYER_SPACE_NAVIGATION_KIND.ANCHORED:
                this.handleAnchoredNavigation(navigation.anchorId, objects);
                return;

            case PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING:
                this.handleTravellingNavigation(
                    this.findLoadedTravelTaskIdOrThrow(event, navigation.targetAnchorId),

                    navigation.fromAnchorId,
                    navigation.targetAnchorId,

                    objects,
                );
                return;

            default:
                return this.assertNeverNavigation(navigation);
        }
    }

    private handleArrivingNavigation(
        targetAnchorId: string,
        objects: BridgeEncounterObjectPayload[],
    ): void {
        const targetAnchorObjects = this.findAnchorObjectsOrThrow(
            objects,
            targetAnchorId,
        );

        if (DEBUG_SETTINGS.bridge.encounter.skipArrival) {
            this.eventBus.emit(
                BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED,
                targetAnchorObjects,
            );

            this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED);
            return;
        }

        this.setEncounterInteractive(false);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, {
            targetId: targetAnchorId,
        });
    }

    private handleAnchoredNavigation(
        anchorId: string,
        objects: BridgeEncounterObjectPayload[],
    ): void {
        const anchorObjects = this.findAnchorObjectsOrThrow(
            objects,
            anchorId,
        );

        this.eventBus.emit(
            BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED,
            anchorObjects,
        );

        this.setEncounterInteractive(true);
    }

    private handleTravellingNavigation(
        taskId: string,

        fromAnchorId: string,
        targetAnchorId: string,

        objects: BridgeEncounterObjectPayload[],
    ): void {
        this.findAnchorObjectsOrThrow(
            objects,
            fromAnchorId,
        );

        const targetAnchorObjects = this.findAnchorObjectsOrThrow(
            objects,
            targetAnchorId,
        );

        this.setEncounterInteractive(false);

        this.eventBus.emit(
            BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED,
            targetAnchorObjects,
        );

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED, {
            taskId,
        });
    }

    // #endregion

    // #region Loaded task lookup

    private findLoadedTravelTaskIdOrThrow(
        event: EncounterLoadedEvent,
        targetAnchorId: string,
    ): string {
        const task = event.state.officerTasks[OFFICER_ROLE.HELM];
        if (!task) {
            throw new Error('TRAVELLING encounter requires active Helm task');
        }

        if (task.kind !== OFFICER_TASK_KIND.HELM_FLY_TO) {
            throw new Error(
                `TRAVELLING encounter requires HELM_FLY_TO task, ` +
                    `received: ${task.kind}`,
            );
        }

        if (task.targetAnchorId !== targetAnchorId) {
            throw new Error(
                `Loaded HELM_FLY_TO task target does not match ` +
                    `navigation target: ` +
                    `${task.targetAnchorId} !== ${targetAnchorId}`,
            );
        }

        return task.id;
    }

    // #endregion

    // #region Bridge object lookup

    private findAnchorObjectsOrThrow(
        objects: BridgeEncounterObjectPayload[],
        anchorObjectId: string,
    ): BridgeEncounterObjectPayload[] {
        this.findObjectOrThrow(
            objects,
            anchorObjectId,
        );

        const anchorObjects = objects.filter((object) => {
            return object.anchorObjectId === anchorObjectId;
        });

        if (anchorObjects.length === 0) {
            throw new Error(
                `Encounter anchor objects not found: ${anchorObjectId}`,
            );
        }

        return anchorObjects;
    }

    private findObjectOrThrow(
        objects: BridgeEncounterObjectPayload[],
        objectId: string,
    ): BridgeEncounterObjectPayload {
        const object = objects.find((candidate) => {
            return candidate.id === objectId;
        });

        if (!object) {
            throw new Error(
                `Navigation bridge object not found: ${objectId}`,
            );
        }

        return object;
    }

    // #endregion

    private assertNeverNavigation(value: never): never {
        throw new Error(
            `Unhandled player space navigation state: ${String(value)}`,
        );
    }
}
