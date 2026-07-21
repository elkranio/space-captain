// src/app/scenes/game/bridge/controller/encounter/engine_events/encounter/handle_encounter_loaded.ts

import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../../../../../../engine/defs/player_location';
import type { EncounterLoadedEvent } from '../../../../../../../../engine/encounter/model/event';
import { DEBUG_SETTINGS } from '../../../../../../../debug/debug_settings';
import { BRIDGE_EVENT, type BridgeEncounterObjectPayload } from '../../../../events/bridge_event';
import { mapEncounterObjectsToBridgeObjectPayloads } from '../../objects/map_encounter_objects_to_bridge_object_payloads';
import type { BridgeEncounterEventHandlerContext } from '../bridge_encounter_event_handler_context';

// Переводит engine ENCOUNTER_LOADED в initial bridge objects flow.
//
// Все encounter objects создаются заранее и остаются во view скрытыми.
// Navigation state определяет, какой объект показать или анимировать.
export function handleEncounterLoaded(event: EncounterLoadedEvent, context: BridgeEncounterEventHandlerContext): void {
    const objects = mapEncounterObjectsToBridgeObjectPayloads(event.state);

    // Всегда подготавливаем все объекты ноды.
    // Это необходимо для будущих локальных перелётов между ними.
    context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED, objects);

    const navigation = event.state.navigation;

    switch (navigation.kind) {
        case PLAYER_SPACE_NAVIGATION_KIND.ARRIVING:
            handleArrivingNavigation(navigation.targetObjectId, objects, context);
            return;

        case PLAYER_SPACE_NAVIGATION_KIND.ANCHORED:
            handleAnchoredNavigation(navigation.anchorObjectId, objects, context);
            return;

        default:
            return assertNever(navigation);
    }
}

function handleArrivingNavigation(
    targetObjectId: string,
    objects: BridgeEncounterObjectPayload[],
    context: BridgeEncounterEventHandlerContext,
): void {
    const targetObject = findObjectOrThrow(objects, targetObjectId);

    if (DEBUG_SETTINGS.bridge.encounter.skipArrival) {
        context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, [targetObject]);

        context.completeEncounterArrival();
        context.setEncounterInteractive(true);
        return;
    }

    context.setEncounterInteractive(false);

    context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, {
        targetId: targetObjectId,
    });
}

function handleAnchoredNavigation(
    anchorObjectId: string,
    objects: BridgeEncounterObjectPayload[],
    context: BridgeEncounterEventHandlerContext,
): void {
    const anchorObject = findObjectOrThrow(objects, anchorObjectId);

    // Encounter уже находится возле объекта:
    // показываем anchor сразу, без arrival animation.
    context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, [anchorObject]);

    context.setEncounterInteractive(true);
}

function findObjectOrThrow(objects: BridgeEncounterObjectPayload[], objectId: string): BridgeEncounterObjectPayload {
    const object = objects.find((candidate) => candidate.id === objectId);

    if (!object) {
        throw new Error(`Navigation encounter object not found: ${objectId}`);
    }

    return object;
}

function assertNever(value: never): never {
    throw new Error(`Unhandled player space navigation state: ${String(value)}`);
}
