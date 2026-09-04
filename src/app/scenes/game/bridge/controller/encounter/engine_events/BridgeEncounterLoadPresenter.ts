// src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterLoadPresenter.ts

import { OFFICER_ROLE } from "../../../../../../../engine/defs/officer";
import { PLAYER_SPACE_NAVIGATION_KIND } from "../../../../../../../engine/defs/player_location";
import type { EncounterPresentationSnapshot } from "../../../../../../../engine/encounter/snapshots/encounter_presentation_snapshot";
import { OFFICER_TASK_KIND } from "../../../../../../../engine/encounter/model/officer_task";
import { DEBUG_SETTINGS } from "../../../../../../debug/debug_settings";
import { BRIDGE_EVENT, type BridgeEncounterObjectPayload } from "../../../events/bridge_event";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import { mapEncounterSpaceToBridgeObjectPayloads } from "../encounter_objects/BridgeEncounterObjectMapper";

// Восстанавливает bridge presentation из уже загруженного EncounterEngine state.
//
// Не загружает domain encounter и не меняет GameRuntime.
// Отвечает только за initial objects/navigation presentation.
export default class BridgeEncounterLoadPresenter {
    constructor(private readonly eventBus: BridgeEventBus) {}

    public present(snapshot: EncounterPresentationSnapshot): void {
        const objects = mapEncounterSpaceToBridgeObjectPayloads(snapshot.space);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED, objects);

        const navigation = snapshot.navigation;
        switch (navigation.kind) {
            case PLAYER_SPACE_NAVIGATION_KIND.ARRIVING:
                this.presentArrivingNavigation(navigation.targetAnchorId, objects);
                return;

            case PLAYER_SPACE_NAVIGATION_KIND.ANCHORED:
                this.presentAnchoredNavigation(navigation.anchorId, objects);
                return;

            case PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING:
                this.presentTravellingNavigation(
                    this.findLoadedTravelTaskIdOrThrow(snapshot, navigation.targetAnchorId),

                    navigation.fromAnchorId,
                    navigation.targetAnchorId,

                    objects,
                );
                return;

            default:
                return this.assertNeverNavigation(navigation);
        }
    }

    private presentArrivingNavigation(targetAnchorId: string, objects: BridgeEncounterObjectPayload[]): void {
        const targetAnchorObjects = this.findAnchorObjectsOrThrow(objects, targetAnchorId);

        if (DEBUG_SETTINGS.bridge.encounter.skipArrival) {
            this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, targetAnchorObjects);

            this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED);
            return;
        }

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, {
            targetId: targetAnchorId,
        });
    }

    private presentAnchoredNavigation(anchorId: string, objects: BridgeEncounterObjectPayload[]): void {
        const anchorObjects = this.findAnchorObjectsOrThrow(objects, anchorId);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, anchorObjects);
    }

    private presentTravellingNavigation(
        taskId: string,

        fromAnchorId: string,
        targetAnchorId: string,

        objects: BridgeEncounterObjectPayload[],
    ): void {
        this.findAnchorObjectsOrThrow(objects, fromAnchorId);

        const targetAnchorObjects = this.findAnchorObjectsOrThrow(objects, targetAnchorId);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, targetAnchorObjects);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED, {
            taskId,
        });
    }

    private findLoadedTravelTaskIdOrThrow(
        snapshot: EncounterPresentationSnapshot,

        targetAnchorId: string,
    ): string {
        const task = snapshot.player.officerTasks.find((candidate) => {
            return candidate.role === OFFICER_ROLE.PILOT;
        });
        if (!task) {
            throw new Error("TRAVELLING encounter requires active Pilot task");
        }

        if (task.kind !== OFFICER_TASK_KIND.PILOT_FLY_TO) {
            throw new Error(`TRAVELLING encounter requires PILOT_FLY_TO task, ` + `received: ${task.kind}`);
        }

        if (task.targetAnchorId !== targetAnchorId) {
            throw new Error(
                `Loaded PILOT_FLY_TO task target does not match ` +
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

    private assertNeverNavigation(value: never): never {
        throw new Error(`Unhandled player space navigation state: ${String(value)}`);
    }
}
