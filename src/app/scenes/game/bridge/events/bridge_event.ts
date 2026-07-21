// src/app/scenes/game/bridge/events/bridge_event.ts

import type { CharacterPortraitId } from '../../../../../engine/defs/character';
import type { OfficerDefinition, OfficerRole } from '../../../../../engine/defs/officer';
import type { EncounterOfficerCommandId } from '../../../../../engine/encounter/model/command';
import type { SpriteEntry } from '../../../../manifests/types';
import { SCENE_KEY, type SceneKey } from '../../../scene_key';

// Scene-local события bridge scene.
//
// Это не глобальная шина игры.
// События живут только внутри BridgeScene и связывают:
// - root/controller слой;
// - encounter controller;
// - bridge view;
// - вложенные UI/view модули.
//
// Naming rule:
// - *_LOADED / *_UPDATED / *_STARTED / *_ENDED =
//   факт, на который view реагирует.
// - *_CLICKED / *_SELECTED / *_REQUESTED =
//   input/intent от view к controller-у.
export const BRIDGE_EVENT = {
    // Initial snapshot экипажа для bridge UI.
    // Эмитит BridgeController после чтения GAME_RUNTIME.
    // Слушает crew view.
    CREW_LOADED: 'crew_loaded',

    // Игрок кликнул по officer seat.
    // Это input event: view не решает,
    // какие команды доступны,
    // а просит controller разобраться.
    OFFICER_SEAT_CLICKED: 'officer_seat_clicked',

    // Игрок выбрал команду
    // в officer context menu.
    // Controller передаст команду
    // в encounter engine.
    OFFICER_COMMAND_SELECTED: 'officer_command_selected',

    // Controller просит показать
    // короткий officer bark bubble.
    OFFICER_BARK_REQUESTED: 'officer_bark_requested',

    // Controller отдаёт view
    // актуальные состояния ламп.
    OFFICER_STATION_INDICATORS_UPDATED: 'officer_station_indicators_updated',

    // Первый snapshot encounter objects.
    ENCOUNTER_OBJECTS_LOADED: 'encounter_objects_loaded',

    // Обновление presentation
    // уже известных encounter objects.
    ENCOUNTER_OBJECTS_UPDATED: 'encounter_objects_updated',

    // Начало arrival animation
    // на bridge viewscreen.
    ENCOUNTER_ARRIVAL_STARTED: 'encounter_arrival_started',

    // Arrival animation завершилась.
    ENCOUNTER_ARRIVAL_COMPLETED: 'encounter_arrival_completed',

    // Начало визуального перелёта
    // между encounter objects.
    ENCOUNTER_TRAVEL_STARTED: 'encounter_travel_started',

    // Визуальный перелёт завершился.
    // View сообщает об этом controller-у.
    ENCOUNTER_TRAVEL_COMPLETED: 'encounter_travel_completed',

    // Controller отдаёт view
    // актуальное меню команд офицера.
    OFFICER_COMMAND_MENU_UPDATED: 'officer_command_menu_updated',

    // Начался structured contact/dialogue flow.
    CONTACT_STARTED: 'contact_started',

    // В contact flow добавилась новая реплика.
    CONTACT_MESSAGE_ADDED: 'contact_message_added',

    // Contact flow завершился.
    CONTACT_ENDED: 'contact_ended',

    // Encounter engine разрешил
    // начать docking flow.
    DOCKING_STARTED: 'docking_started',

    // Визуальная docking animation завершилась.
    DOCKING_ANIMATION_COMPLETED: 'docking_animation_completed',

    // Запрос перехода
    // в другую Phaser scene.
    SCENE_TRANSITION_REQUESTED: 'scene_transition_requested',

    OFFICER_ACTIVITY_STARTED: 'officer_activity_started',

    OFFICER_ACTIVITY_CLEARED: 'officer_activity_cleared',
} as const;

// Payload события CREW_LOADED.
export type BridgeCrewLoadedPayload = Record<OfficerRole, OfficerDefinition>;

// Payload input-события OFFICER_SEAT_CLICKED.
export type BridgeOfficerSeatClickedPayload = {
    role: OfficerRole;
};

// Payload input-события OFFICER_COMMAND_SELECTED.
export type BridgeOfficerCommandSelectedPayload = {
    role: OfficerRole;
    commandId: EncounterOfficerCommandId;
    targetId?: string;
};

// Payload события OFFICER_BARK_REQUESTED.
export type BridgeOfficerBarkRequestedPayload = {
    role: OfficerRole;
    text: string;
};

// View-ready описание одного encounter object.
export type BridgeEncounterObjectPayload = {
    id: string;
    sprite: SpriteEntry;
    position: Phaser.Math.Vector2;
};

// Один пункт меню команды офицера.
export type BridgeOfficerCommandMenuItemPayload = {
    commandId: EncounterOfficerCommandId;
    label: string;
    targetId?: string;
};

// Группа пунктов меню.
export type BridgeOfficerCommandMenuGroupPayload = {
    label: string;
    items: BridgeOfficerCommandMenuItemPayload[];
};

// Payload события OFFICER_COMMAND_MENU_UPDATED.
export type BridgeOfficerCommandMenuUpdatedPayload = {
    role: OfficerRole;
    groups: BridgeOfficerCommandMenuGroupPayload[];
};

// Payload события CONTACT_STARTED.
export type BridgeContactStartedPayload = {
    contactName: string;
    contactPortraitId: CharacterPortraitId;
};

// Payload события CONTACT_MESSAGE_ADDED.
export type BridgeContactMessageAddedPayload = {
    speakerName: string;
    text: string;
};

// Payload события DOCKING_STARTED.
export type BridgeDockingStartedPayload = {
    targetId: string;
};

// Payload начала визуального travel flow.
export type BridgeEncounterTravelStartedPayload = {
    fromObjectId: string;
    targetObjectId: string;
};

// Payload события SCENE_TRANSITION_REQUESTED.
export type BridgeSceneTransitionRequestedPayload = {
    sceneKey: SceneKey;
};

// View-state лампы officer station.
export type BridgeOfficerStationIndicatorState = 'off' | 'ready' | 'busy';

// Payload события OFFICER_STATION_INDICATORS_UPDATED.
export type BridgeOfficerStationIndicatorsUpdatedPayload = Record<OfficerRole, BridgeOfficerStationIndicatorState>;

export type BridgeOfficerActivityStartedPayload = {
    role: OfficerRole;
    label: string;
};

export type BridgeOfficerActivityClearedPayload = {
    role: OfficerRole;
};

export type BridgeEncounterArrivalStartedPayload = {
    targetId: string;
};

// Typed mapping:
// каждое bridge event name связано со своим payload.
//
// undefined означает,
// что событие несёт только сам факт.
export type BridgeEventPayloadMap = {
    [BRIDGE_EVENT.CREW_LOADED]: BridgeCrewLoadedPayload;

    [BRIDGE_EVENT.OFFICER_SEAT_CLICKED]: BridgeOfficerSeatClickedPayload;

    [BRIDGE_EVENT.OFFICER_COMMAND_SELECTED]: BridgeOfficerCommandSelectedPayload;

    [BRIDGE_EVENT.OFFICER_BARK_REQUESTED]: BridgeOfficerBarkRequestedPayload;

    [BRIDGE_EVENT.OFFICER_STATION_INDICATORS_UPDATED]: BridgeOfficerStationIndicatorsUpdatedPayload;

    [BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED]: BridgeEncounterObjectPayload[];

    [BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED]: BridgeEncounterObjectPayload[];

    [BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED]: BridgeEncounterArrivalStartedPayload;

    [BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED]: undefined;

    [BRIDGE_EVENT.ENCOUNTER_TRAVEL_STARTED]: BridgeEncounterTravelStartedPayload;

    [BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED]: undefined;

    [BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED]: BridgeOfficerCommandMenuUpdatedPayload;

    [BRIDGE_EVENT.CONTACT_STARTED]: BridgeContactStartedPayload;

    [BRIDGE_EVENT.CONTACT_MESSAGE_ADDED]: BridgeContactMessageAddedPayload;

    [BRIDGE_EVENT.CONTACT_ENDED]: undefined;

    [BRIDGE_EVENT.DOCKING_STARTED]: BridgeDockingStartedPayload;

    [BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED]: undefined;

    [BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED]: BridgeSceneTransitionRequestedPayload;

    [BRIDGE_EVENT.OFFICER_ACTIVITY_STARTED]: BridgeOfficerActivityStartedPayload;

    [BRIDGE_EVENT.OFFICER_ACTIVITY_CLEARED]: BridgeOfficerActivityClearedPayload;
};
