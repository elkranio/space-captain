// src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterLoadPresenter.ts

import { OFFICER_ROLE } from '../../../../../../../engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../../../../../engine/defs/player_location';
import type { EncounterLoadedEvent } from '../../../../../../../engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../../../../../engine/encounter/model/officer_task';
import { DEBUG_SETTINGS } from '../../../../../../debug/debug_settings';
import {
    BRIDGE_EVENT,
    type BridgeEncounterObjectPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import { mapEncounterStateToBridgeObjectPayloads } from '../encounter_objects/BridgeEncounterObjectMapper';

type SetEncounterInteractive = (value: boolean) => void;

// Восстанавливает bridge presentation из уже загруженного EncounterEngine state.
//
// Не загружает domain encounter и не меняет GameRuntime.
// Отвечает только за initial objects/navigation presentation и interactive state.
export default class BridgeEncounterLoadPresenter {
    constructor(
        private readonly eventBus: BridgeEventBus,
        private readonly setEncounterInteractive: SetEncounterInteractive,
    ) {}

    public present(event: EncounterLoadedEvent): void {
        const objects = mapEncounterStateToBridgeObjectPayloads(event.state);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED, objects);

        const navigation = event.state.navigation;
        switch (navigation.kind) {
            case PLAYER_SPACE_NAVIGATION_KIND.ARRIVING:
                this.presentArrivingNavigation(navigation.targetAnchorId, objects);
                return;

            case PLAYER_SPACE_NAVIGATION_KIND.ANCHORED:
                this.presentAnchoredNavigation(navigation.anchorId, objects);
                return;

            case PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING:
                this.presentTravellingNavigation(
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

    private presentArrivingNavigation(
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

    private presentAnchoredNavigation(
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

    private presentTravellingNavigation(
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

    private assertNeverNavigation(value: never): never {
        throw new Error(
            `Unhandled player space navigation state: ${String(value)}`,
        );
    }
}
