// src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler.ts

import { OFFICER_ROLE } from '../../../../../../../engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../../../../../engine/defs/player_location';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
    type EncounterLoadedEvent,
} from '../../../../../../../engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../../../../../engine/encounter/model/officer_task';
import { DEBUG_SETTINGS } from '../../../../../../debug/debug_settings';
import { BRIDGE_EVENT, type BridgeEncounterObjectPayload } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import { mapEncounterObjectsToBridgeObjectPayloads } from '../objects/map_encounter_objects_to_bridge_object_payloads';

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
        const objects = mapEncounterObjectsToBridgeObjectPayloads(event.state);

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
                return this.assertNever(navigation);
        }
    }

    private handleArrivingNavigation(targetObjectId: string, objects: BridgeEncounterObjectPayload[]): void {
        const targetObject = this.findObjectOrThrow(objects, targetObjectId);

        if (DEBUG_SETTINGS.bridge.encounter.skipArrival) {
            this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, [targetObject]);

            this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED);
            return;
        }

        this.setEncounterInteractive(false);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, {
            targetId: targetObjectId,
        });
    }

    private handleAnchoredNavigation(anchorObjectId: string, objects: BridgeEncounterObjectPayload[]): void {
        const anchorObject = this.findObjectOrThrow(objects, anchorObjectId);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, [anchorObject]);

        this.setEncounterInteractive(true);
    }

    private handleTravellingNavigation(
        taskId: string,
        fromObjectId: string,
        targetObjectId: string,
        objects: BridgeEncounterObjectPayload[],
    ): void {
        this.findObjectOrThrow(objects, fromObjectId);

        const targetObject = this.findObjectOrThrow(objects, targetObjectId);

        this.setEncounterInteractive(false);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, [targetObject]);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED, {
            taskId,
        });
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
                `Loaded HELM_FLY_TO task target does not match navigation target: ${String(task.targetId)} !== ${targetObjectId}`,
            );
        }

        return task.id;
    }

    // #endregion

    // #region Object lookup

    private findObjectOrThrow(objects: BridgeEncounterObjectPayload[], objectId: string): BridgeEncounterObjectPayload {
        const object = objects.find((candidate) => candidate.id === objectId);

        if (!object) {
            throw new Error(`Navigation encounter object not found: ${objectId}`);
        }

        return object;
    }

    // #endregion

    private assertNever(value: never): never {
        throw new Error(`Unhandled player space navigation state: ${String(value)}`);
    }
}
