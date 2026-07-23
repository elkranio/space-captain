// src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler.ts

import { OFFICER_ROLE } from '../../../../../../../engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../../../../../engine/defs/player_location';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
    type EncounterLoadedEvent,
} from '../../../../../../../engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../../../../../engine/encounter/model/officer_task';
import type { EncounterState } from '../../../../../../../engine/encounter/model/state';
import {
    ENCOUNTER_OBJECT_KIND,
    type EncounterObjectState,
} from '../../../../../../../engine/encounter/objects/encounter_object';
import { DEBUG_SETTINGS } from '../../../../../../debug/debug_settings';
import { ASTEROID_OBJECT_SPRITES } from '../../../../../../manifests/asteroids/asteroid_srpite';
import { BEACON_OBJECT_SPRITES } from '../../../../../../manifests/beacons/beacon_sprite';
import { STATION_OBJECT_SPRITES } from '../../../../../../manifests/stations/station_sprite';
import { BRIDGE_EVENT, type BridgeEncounterObjectPayload } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';

type SetEncounterInteractive = (value: boolean) => void;

export default class BridgeEncounterEngineEventHandler {
    constructor(
        private readonly eventBus: BridgeEventBus,
        private readonly setEncounterInteractive: SetEncounterInteractive,
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
                    fromObjectId: event.fromObjectId,
                    targetObjectId: event.target.id,
                });
                return;

            case ENCOUNTER_EVENT.DOCKING_STARTED:
                this.setEncounterInteractive(false);

                this.eventBus.emit(BRIDGE_EVENT.DOCKING_STARTED, {
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
                this.eventBus.emit(BRIDGE_EVENT.OFFICER_ACTIVITY_CLEARED, {
                    role: event.task.role,
                });
                return;
        }

        throw new Error(`Unhandled encounter event: ${String(event)}`);
    }

    // #endregion

    // #region Encounter loaded

    private handleEncounterLoaded(event: EncounterLoadedEvent): void {
        const objects = this.mapEncounterObjectsToBridgeObjectPayloads(event.state);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED, objects);

        const navigation = event.state.navigation;

        switch (navigation.kind) {
            case PLAYER_SPACE_NAVIGATION_KIND.ARRIVING:
                this.handleArrivingNavigation(navigation.targetObjectId, objects);
                return;

            case PLAYER_SPACE_NAVIGATION_KIND.ANCHORED:
                this.handleAnchoredNavigation(navigation.anchorObjectId, objects);
                return;

            case PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING:
                this.handleTravellingNavigation(
                    this.findLoadedTravelTaskIdOrThrow(event, navigation.targetObjectId),
                    navigation.fromObjectId,
                    navigation.targetObjectId,
                    objects,
                );
                return;

            default:
                return this.assertNeverNavigation(navigation);
        }
    }

    private handleArrivingNavigation(targetObjectId: string, objects: BridgeEncounterObjectPayload[]): void {
        const targetAnchorObjects = this.findAnchorObjectsOrThrow(objects, targetObjectId);

        if (DEBUG_SETTINGS.bridge.encounter.skipArrival) {
            this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, targetAnchorObjects);

            this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED);
            return;
        }

        this.setEncounterInteractive(false);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, {
            targetId: targetObjectId,
        });
    }

    private handleAnchoredNavigation(anchorObjectId: string, objects: BridgeEncounterObjectPayload[]): void {
        const anchorObjects = this.findAnchorObjectsOrThrow(objects, anchorObjectId);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, anchorObjects);

        this.setEncounterInteractive(true);
    }

    private handleTravellingNavigation(
        taskId: string,
        fromObjectId: string,
        targetObjectId: string,
        objects: BridgeEncounterObjectPayload[],
    ): void {
        this.findAnchorObjectsOrThrow(objects, fromObjectId);

        const targetAnchorObjects = this.findAnchorObjectsOrThrow(objects, targetObjectId);

        this.setEncounterInteractive(false);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, targetAnchorObjects);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED, {
            taskId,
        });
    }

    // #endregion

    // #region Encounter object mapping

    private mapEncounterObjectsToBridgeObjectPayloads(state: EncounterState): BridgeEncounterObjectPayload[] {
        return state.objects.map((object) => {
            return this.mapEncounterObjectToBridgeObjectPayload(object);
        });
    }

    private mapEncounterObjectToBridgeObjectPayload(object: EncounterObjectState): BridgeEncounterObjectPayload {
        switch (object.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                return {
                    id: object.id,
                    anchorObjectId: object.anchorObjectId,

                    localPosition: {
                        ...object.localPosition,
                    },

                    perspectiveDepth: object.perspectiveDepth,
                    sprite: STATION_OBJECT_SPRITES[object.station.objectSpriteId],
                    position: new Phaser.Math.Vector2(object.position.x, object.position.y),
                };

            case ENCOUNTER_OBJECT_KIND.NAVIGATION_BEACON:
                return {
                    id: object.id,
                    anchorObjectId: object.anchorObjectId,

                    localPosition: {
                        ...object.localPosition,
                    },

                    perspectiveDepth: object.perspectiveDepth,
                    sprite: BEACON_OBJECT_SPRITES[object.beacon.objectSpriteId],
                    position: new Phaser.Math.Vector2(object.position.x, object.position.y),
                };

            case ENCOUNTER_OBJECT_KIND.ASTEROID:
                return {
                    id: object.id,
                    anchorObjectId: object.anchorObjectId,

                    localPosition: {
                        ...object.localPosition,
                    },

                    perspectiveDepth: object.perspectiveDepth,
                    sprite: ASTEROID_OBJECT_SPRITES[object.asteroid.objectSpriteId],
                    position: new Phaser.Math.Vector2(object.position.x, object.position.y),
                };

            default:
                return this.assertNeverEncounterObject(object);
        }
    }

    // #endregion

    // #region Loaded task lookup

    private findLoadedTravelTaskIdOrThrow(event: EncounterLoadedEvent, targetObjectId: string): string {
        const task = event.state.officerTasks[OFFICER_ROLE.HELM];

        if (!task) {
            throw new Error('TRAVELLING encounter requires active Helm task');
        }

        if (task.kind !== OFFICER_TASK_KIND.HELM_FLY_TO) {
            throw new Error(`TRAVELLING encounter requires HELM_FLY_TO task, received: ${task.kind}`);
        }

        if (task.targetId !== targetObjectId) {
            throw new Error(
                `Loaded HELM_FLY_TO task target does not match navigation target: ` +
                    `${String(task.targetId)} !== ${targetObjectId}`,
            );
        }

        return task.id;
    }

    // #endregion

    // #region Object lookup

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
        const object = objects.find((candidate) => candidate.id === objectId);

        if (!object) {
            throw new Error(`Navigation encounter object not found: ${objectId}`);
        }

        return object;
    }

    // #endregion

    private assertNeverNavigation(value: never): never {
        throw new Error(`Unhandled player space navigation state: ${String(value)}`);
    }

    private assertNeverEncounterObject(value: never): never {
        throw new Error(`Unhandled encounter object: ${String(value)}`);
    }
}
