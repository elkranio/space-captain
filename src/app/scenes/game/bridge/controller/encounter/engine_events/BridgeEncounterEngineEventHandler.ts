// src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler.ts

import { SHIPS } from '../../../../../../../engine/content/ships';
import { OFFICER_ROLE } from '../../../../../../../engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../../../../../engine/defs/player_location';
import {
    ENCOUNTER_ACTOR_KIND,
    type EncounterActorState,
} from '../../../../../../../engine/encounter/actors/encounter_actor';
import {
    ENCOUNTER_ANCHOR_KIND,
    type EncounterAnchorState,
} from '../../../../../../../engine/encounter/anchors/encounter_anchor';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_RESULT_KIND,
    type EncounterEvent,
    type EncounterLoadedEvent,
} from '../../../../../../../engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../../../../../engine/encounter/model/officer_task';
import type { EncounterState } from '../../../../../../../engine/encounter/model/state';
import { DEBUG_SETTINGS } from '../../../../../../debug/debug_settings';
import { ASTEROID_OBJECT_SPRITES } from '../../../../../../manifests/asteroids/asteroid_srpite';
import { BEACON_OBJECT_SPRITES } from '../../../../../../manifests/beacons/beacon_sprite';
import { JUMP_POINT_OBJECT_SPRITES } from '../../../../../../manifests/jump_points/jump_point_sprite';
import { SHIP_SPRITES } from '../../../../../../manifests/ships/ship_sprite';
import { STATION_OBJECT_SPRITES } from '../../../../../../manifests/stations/station_sprite';
import { BRIDGE_EVENT, type BridgeEncounterObjectPayload } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import type { GameRuntime } from '../../../../../../runtime/GameRuntime';
import { SCENE_KEY } from '../../../../../scene_key';

type SetEncounterInteractive = (value: boolean) => void;

const SHIP_ACTOR_POSITION_OFFSET = {
    x: 0.65,
    y: -0.2,
} as const;

const SHIP_ACTOR_PERSPECTIVE_DEPTH = 0.75;

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

            case ENCOUNTER_EVENT.OFFICER_TASK_STARTED:
                this.eventBus.emit(BRIDGE_EVENT.OFFICER_ACTIVITY_STARTED, {
                    role: event.task.role,
                    label: event.task.label,
                });
                return;

            case ENCOUNTER_EVENT.OFFICER_TASK_ENDED:
                if (event.result?.kind === OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED) {
                    this.eventBus.emit(
                        BRIDGE_EVENT.ENCOUNTER_OBJECT_ADDED,

                        this.mapEncounterAnchorToBridgeObjectPayload(event.result.anchor),
                    );
                }

                this.eventBus.emit(BRIDGE_EVENT.OFFICER_ACTIVITY_CLEARED, {
                    role: event.task.role,
                });
                return;

            case ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED:
                this.eventBus.emit(BRIDGE_EVENT.MISSILE_TARGETING_WARNING_STARTED);
                return;

            case ENCOUNTER_EVENT.MISSILE_LAUNCHED:
                this.eventBus.emit(BRIDGE_EVENT.MISSILE_TARGETING_WARNING_CLEARED);
                return;

            case ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP:
                this.handleMissileImpactedPlayerShip(event.damage);
                return;
        }

        throw new Error(`Unhandled encounter event: ${String(event)}`);
    }

    // #endregion

    // #region Combat

    private handleMissileImpactedPlayerShip(damage: number): void {
        const result = this.gameRuntime.damagePlayerShipHull(damage);

        // destroyed === true также вернётся при повторном damage,
        // когда hull уже был равен нулю.
        if (!result.destroyed || result.previousHull === 0) {
            return;
        }

        this.setEncounterInteractive(false);

        this.eventBus.emit(BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED, {
            sceneKey: SCENE_KEY.END,
        });
    }

    // #endregion

    // #region Encounter loaded

    private handleEncounterLoaded(event: EncounterLoadedEvent): void {
        const objects = this.mapEncounterStateToBridgeObjectPayloads(event.state);

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

    private handleArrivingNavigation(targetAnchorId: string, objects: BridgeEncounterObjectPayload[]): void {
        const targetAnchorObjects = this.findAnchorObjectsOrThrow(objects, targetAnchorId);

        if (DEBUG_SETTINGS.bridge.encounter.skipArrival) {
            this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, targetAnchorObjects);

            this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED);
            return;
        }

        this.setEncounterInteractive(false);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, {
            targetId: targetAnchorId,
        });
    }

    private handleAnchoredNavigation(anchorId: string, objects: BridgeEncounterObjectPayload[]): void {
        const anchorObjects = this.findAnchorObjectsOrThrow(objects, anchorId);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, anchorObjects);

        this.setEncounterInteractive(true);
    }

    private handleTravellingNavigation(
        taskId: string,
        fromAnchorId: string,
        targetAnchorId: string,
        objects: BridgeEncounterObjectPayload[],
    ): void {
        this.findAnchorObjectsOrThrow(objects, fromAnchorId);

        const targetAnchorObjects = this.findAnchorObjectsOrThrow(objects, targetAnchorId);

        this.setEncounterInteractive(false);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, targetAnchorObjects);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED, {
            taskId,
        });
    }

    // #endregion

    // #region Encounter object mapping

    private mapEncounterStateToBridgeObjectPayloads(state: EncounterState): BridgeEncounterObjectPayload[] {
        return [
            ...this.mapEncounterAnchorsToBridgeObjectPayloads(state),

            ...state.actors.map((actor) => {
                return this.mapEncounterActorToBridgeObjectPayload(actor, state);
            }),
        ];
    }

    private mapEncounterAnchorsToBridgeObjectPayloads(state: EncounterState): BridgeEncounterObjectPayload[] {
        return state.anchors.map((anchor) => {
            return this.mapEncounterAnchorToBridgeObjectPayload(anchor);
        });
    }

    private mapEncounterAnchorToBridgeObjectPayload(anchor: EncounterAnchorState): BridgeEncounterObjectPayload {
        switch (anchor.kind) {
            case ENCOUNTER_ANCHOR_KIND.STATION:
                return {
                    id: anchor.id,
                    anchorObjectId: anchor.id,

                    localPosition: {
                        ...anchor.localPosition,
                    },

                    perspectiveDepth: anchor.perspectiveDepth,

                    sprite: STATION_OBJECT_SPRITES[anchor.station.objectSpriteId],

                    position: new Phaser.Math.Vector2(anchor.position.x, anchor.position.y),
                };

            case ENCOUNTER_ANCHOR_KIND.NAVIGATION_BEACON:
                return {
                    id: anchor.id,
                    anchorObjectId: anchor.id,

                    localPosition: {
                        ...anchor.localPosition,
                    },

                    perspectiveDepth: anchor.perspectiveDepth,

                    sprite: BEACON_OBJECT_SPRITES[anchor.beacon.objectSpriteId],

                    position: new Phaser.Math.Vector2(anchor.position.x, anchor.position.y),
                };

            case ENCOUNTER_ANCHOR_KIND.ASTEROID:
                return {
                    id: anchor.id,
                    anchorObjectId: anchor.id,

                    localPosition: {
                        ...anchor.localPosition,
                    },

                    perspectiveDepth: anchor.perspectiveDepth,

                    sprite: ASTEROID_OBJECT_SPRITES[anchor.asteroid.objectSpriteId],

                    position: new Phaser.Math.Vector2(anchor.position.x, anchor.position.y),
                };

            case ENCOUNTER_ANCHOR_KIND.JUMP_POINT:
                return {
                    id: anchor.id,
                    anchorObjectId: anchor.id,

                    localPosition: {
                        ...anchor.localPosition,
                    },

                    perspectiveDepth: anchor.perspectiveDepth,

                    sprite: JUMP_POINT_OBJECT_SPRITES[anchor.jumpPoint.objectSpriteId],

                    position: new Phaser.Math.Vector2(anchor.position.x, anchor.position.y),
                };

            default:
                return this.assertNeverEncounterAnchor(anchor);
        }
    }

    private mapEncounterActorToBridgeObjectPayload(
        actor: EncounterActorState,
        state: EncounterState,
    ): BridgeEncounterObjectPayload {
        const anchor = state.anchors.find((candidate) => {
            return candidate.id === actor.anchorId;
        });

        if (!anchor) {
            throw new Error(`Encounter actor anchor not found: ` + `${actor.id} -> ${actor.anchorId}`);
        }

        switch (actor.kind) {
            case ENCOUNTER_ACTOR_KIND.SHIP: {
                const ship = SHIPS[actor.shipId];

                return {
                    id: actor.id,

                    // Actor входит в presentation group
                    // anchor, возле которого находится.
                    anchorObjectId: actor.anchorId,

                    // Travel yaw определяется пространственным
                    // положением navigation anchor.
                    localPosition: {
                        ...anchor.localPosition,
                    },

                    perspectiveDepth: SHIP_ACTOR_PERSPECTIVE_DEPTH,

                    sprite: SHIP_SPRITES[ship.spriteId],

                    position: new Phaser.Math.Vector2(
                        anchor.position.x + SHIP_ACTOR_POSITION_OFFSET.x,

                        anchor.position.y + SHIP_ACTOR_POSITION_OFFSET.y,
                    ),
                };
            }

            default:
                // return this.assertNeverEncounterActor(actor);
                throw new Error(`Unhandled encounter actor: ${String(actor)}`);
        }
    }

    // #endregion

    // #region Loaded task lookup

    private findLoadedTravelTaskIdOrThrow(event: EncounterLoadedEvent, targetAnchorId: string): string {
        const task = event.state.officerTasks[OFFICER_ROLE.HELM];

        if (!task) {
            throw new Error('TRAVELLING encounter requires active Helm task');
        }

        if (task.kind !== OFFICER_TASK_KIND.HELM_FLY_TO) {
            throw new Error(`TRAVELLING encounter requires HELM_FLY_TO task, ` + `received: ${task.kind}`);
        }

        if (task.targetId !== targetAnchorId) {
            throw new Error(
                `Loaded HELM_FLY_TO task target does not match ` +
                    `navigation target: ` +
                    `${String(task.targetId)} !== ${targetAnchorId}`,
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
        this.findObjectOrThrow(objects, anchorObjectId);

        const anchorObjects = objects.filter((object) => {
            return object.anchorObjectId === anchorObjectId;
        });

        if (anchorObjects.length === 0) {
            throw new Error(`Encounter anchor objects not found: ${anchorObjectId}`);
        }

        return anchorObjects;
    }

    private findObjectOrThrow(objects: BridgeEncounterObjectPayload[], objectId: string): BridgeEncounterObjectPayload {
        const object = objects.find((candidate) => {
            return candidate.id === objectId;
        });

        if (!object) {
            throw new Error(`Navigation bridge object not found: ${objectId}`);
        }

        return object;
    }

    // #endregion

    private assertNeverNavigation(value: never): never {
        throw new Error(`Unhandled player space navigation state: ${String(value)}`);
    }

    private assertNeverEncounterAnchor(value: never): never {
        throw new Error(`Unhandled encounter anchor: ${String(value)}`);
    }
}
