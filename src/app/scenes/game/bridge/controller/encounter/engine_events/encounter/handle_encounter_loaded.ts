// src/app/scenes/game/bridge/controller/encounter/engine_events/encounter/handle_encounter_loaded.ts

import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../../../../../../engine/defs/player_location';
import { OFFICER_ROLE } from '../../../../../../../../engine/defs/officer';
import type { EncounterLoadedEvent } from '../../../../../../../../engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../../../../../../engine/encounter/model/officer_task';
import { DEBUG_SETTINGS } from '../../../../../../../debug/debug_settings';
import { BRIDGE_EVENT, type BridgeEncounterObjectPayload } from '../../../../events/bridge_event';
import { mapEncounterObjectsToBridgeObjectPayloads } from '../../objects/map_encounter_objects_to_bridge_object_payloads';
import type { BridgeEncounterEventHandlerContext } from '../bridge_encounter_event_handler_context';

// Переводит engine ENCOUNTER_LOADED
// в initial bridge objects flow.
//
// Все encounter objects создаются заранее
// и остаются во view скрытыми.
//
// Navigation state определяет,
// какой объект показать или анимировать.
export function handleEncounterLoaded(event: EncounterLoadedEvent, context: BridgeEncounterEventHandlerContext): void {
    const objects = mapEncounterObjectsToBridgeObjectPayloads(event.state);

    // Всегда подготавливаем все объекты ноды.
    // Это необходимо для локальных
    // перелётов между ними.
    context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED, objects);

    const navigation = event.state.navigation;

    switch (navigation.kind) {
        case PLAYER_SPACE_NAVIGATION_KIND.ARRIVING:
            handleArrivingNavigation(navigation.targetObjectId, objects, context);

            return;

        case PLAYER_SPACE_NAVIGATION_KIND.ANCHORED:
            handleAnchoredNavigation(navigation.anchorObjectId, objects, context);

            return;

        case PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING: {
            const travelTaskId = findLoadedTravelTaskIdOrThrow(event, navigation.targetObjectId);

            handleTravellingNavigation(
                travelTaskId,
                navigation.fromObjectId,
                navigation.targetObjectId,
                objects,
                context,
            );

            return;
        }

        default:
            return assertNever(navigation);
    }
}

// #region Navigation flows

function handleArrivingNavigation(
    targetObjectId: string,
    objects: BridgeEncounterObjectPayload[],
    context: BridgeEncounterEventHandlerContext,
): void {
    const targetObject = findObjectOrThrow(objects, targetObjectId);

    if (DEBUG_SETTINGS.bridge.encounter.skipArrival) {
        context.eventBus.emit(
            BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED,

            [targetObject],
        );

        context.completeEncounterArrival();

        context.setEncounterInteractive(true);

        return;
    }

    context.setEncounterInteractive(false);

    context.eventBus.emit(
        BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED,

        {
            targetId: targetObjectId,
        },
    );
}

function handleAnchoredNavigation(
    anchorObjectId: string,
    objects: BridgeEncounterObjectPayload[],
    context: BridgeEncounterEventHandlerContext,
): void {
    const anchorObject = findObjectOrThrow(objects, anchorObjectId);

    // Encounter уже находится возле объекта:
    // показываем anchor сразу,
    // без arrival animation.
    context.eventBus.emit(
        BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED,

        [anchorObject],
    );

    context.setEncounterInteractive(true);
}

function handleTravellingNavigation(
    taskId: string,
    fromObjectId: string,
    targetObjectId: string,
    objects: BridgeEncounterObjectPayload[],
    context: BridgeEncounterEventHandlerContext,
): void {
    // Проверяем обе стороны
    // сохранённого перелёта.
    //
    // Отсутствующий объект означает
    // битое navigation state.
    findObjectOrThrow(objects, fromObjectId);

    const targetObject = findObjectOrThrow(objects, targetObjectId);

    context.setEncounterInteractive(false);

    // Пока восстановление
    // незавершённого перелёта
    // выполняется мгновенно.
    context.eventBus.emit(
        BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED,

        [targetObject],
    );

    // Мгновенное восстановление
    // использует тот же completion event,
    // что и обычная travel animation.
    //
    // Controller завершит именно
    // сохранённую HELM_FLY_TO task.
    context.eventBus.emit(
        BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED,

        {
            taskId,
        },
    );
}

// #endregion

// #region Loaded task lookup

function findLoadedTravelTaskIdOrThrow(event: EncounterLoadedEvent, targetObjectId: string): string {
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

function findObjectOrThrow(
    objects: BridgeEncounterObjectPayload[],

    objectId: string,
): BridgeEncounterObjectPayload {
    const object = objects.find((candidate) => candidate.id === objectId);

    if (!object) {
        throw new Error(`Navigation encounter object not found: ${objectId}`);
    }

    return object;
}

// #endregion

function assertNever(value: never): never {
    throw new Error(`Unhandled player space navigation state: ${String(value)}`);
}
