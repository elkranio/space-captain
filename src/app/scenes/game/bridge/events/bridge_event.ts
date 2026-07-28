// src/app/scenes/game/bridge/events/bridge_event.ts

import type { CharacterPortraitId } from '../../../../../engine/defs/character';
import type { OfficerDefinition, OfficerRole } from '../../../../../engine/defs/officer';
import type { Vec3 } from '../../../../../engine/defs/vector';
import type { EncounterOfficerCommandId } from '../../../../../engine/encounter/model/command';
import type { SpriteEntry } from '../../../../manifests/types';
import type { SceneKey } from '../../../scene_key';
import type { MissileGuidanceKind } from '../../../../../engine/defs/missile';

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
// - *_LOADED / *_UPDATED / *_STARTED / *_ENDED / *_CLEARED =
//   факт или snapshot, на который реагирует view/controller;
// - *_CLICKED / *_SELECTED / *_REQUESTED =
//   input или intent от view к controller.
export const BRIDGE_EVENT = {
    // #region Crew and officer commands

    // Initial snapshot экипажа для bridge UI.
    // Эмитит BridgeController после чтения GAME_RUNTIME.
    // Слушает crew view.
    CREW_LOADED: 'crew_loaded',

    // Игрок кликнул по officer seat.
    // View не определяет доступные команды,
    // а просит encounter controller открыть меню.
    OFFICER_SEAT_CLICKED: 'officer_seat_clicked',

    // Открытое officer menu просит encounter controller
    // заново получить доступные команды текущей роли.
    OFFICER_COMMAND_MENU_REFRESH_REQUESTED: 'officer_command_menu_refresh_requested',

    // Игрок выбрал команду в officer context menu.
    // Encounter controller передаст её в engine.
    OFFICER_COMMAND_SELECTED: 'officer_command_selected',

    // Encounter controller отдаёт view
    // актуальный snapshot меню команд офицера.
    OFFICER_COMMAND_MENU_UPDATED: 'officer_command_menu_updated',

    // Controller просит показать
    // короткий officer bark bubble.
    OFFICER_BARK_REQUESTED: 'officer_bark_requested',

    // Controller отдаёт crew view
    // актуальные состояния station lights.
    OFFICER_STATION_INDICATORS_UPDATED: 'officer_station_indicators_updated',

    // Офицер начал runtime task.
    // Crew view показывает activity label.
    OFFICER_ACTIVITY_STARTED: 'officer_activity_started',

    // Runtime task офицера завершён или очищен.
    // Crew view убирает activity label.
    OFFICER_ACTIVITY_CLEARED: 'officer_activity_cleared',

    // #endregion

    // #region Encounter objects and navigation

    // Первый snapshot encounter objects.
    ENCOUNTER_OBJECTS_LOADED: 'encounter_objects_loaded',

    // Новый encounter object подготовлен во view,
    // но не становится текущей presentation-группой.
    ENCOUNTER_OBJECT_ADDED: 'encounter_object_added',

    // Обновление presentation
    // уже известных encounter objects.
    ENCOUNTER_OBJECTS_UPDATED: 'encounter_objects_updated',

    // Начало arrival animation
    // на bridge viewscreen.
    ENCOUNTER_ARRIVAL_STARTED: 'encounter_arrival_started',

    // Arrival animation завершилась.
    // View сообщает об этом controller-у.
    ENCOUNTER_ARRIVAL_COMPLETED: 'encounter_arrival_completed',

    // Начало визуального перелёта
    // между encounter objects.
    ENCOUNTER_TRAVEL_STARTED: 'encounter_travel_started',

    // Началась поступательная фаза визуального перелёта.
    // При yaw-перелёте эмитится после завершения поворота.
    // При forward travel — сразу.
    ENCOUNTER_TRAVEL_FLIGHT_STARTED: 'encounter_travel_flight_started',

    // Визуальный перелёт завершился.
    // View сообщает об этом controller-у.
    ENCOUNTER_TRAVEL_COMPLETED: 'encounter_travel_completed',

    // Начался visual flow межнодового прыжка.
    ENCOUNTER_JUMP_STARTED: 'encounter_jump_started',

    // Visual flow межнодового прыжка завершён.
    // View возвращает controller-у исходный jump payload.
    ENCOUNTER_JUMP_COMPLETED: 'encounter_jump_completed',

    // #endregion

    // #region Contact and docking

    // Начался structured contact/dialogue flow.
    CONTACT_STARTED: 'contact_started',

    // В contact flow добавилась новая реплика.
    CONTACT_MESSAGE_ADDED: 'contact_message_added',

    // Structured contact/dialogue flow завершён.
    CONTACT_ENDED: 'contact_ended',

    // Encounter engine разрешил
    // начать визуальный docking flow.
    DOCKING_STARTED: 'docking_started',

    // Визуальная docking animation завершилась.
    // View сообщает об этом controller-у.
    DOCKING_ANIMATION_COMPLETED: 'docking_animation_completed',

    // #endregion

    // #region Scene lifecycle

    // Запрос перехода
    // в другую Phaser scene.
    SCENE_TRANSITION_REQUESTED: 'scene_transition_requested',

    // #endregion

    // #region Combat presentation

    // Вражеская missile launcher
    // начала фазу подготовки/наведения.
    MISSILE_TARGETING_WARNING_STARTED: 'missile_targeting_warning_started',

    // Фаза подготовки/наведения завершилась
    // или была отменена.
    MISSILE_TARGETING_WARNING_CLEARED: 'missile_targeting_warning_cleared',

    // В encounter появилась новая
    // входящая вражеская ракета.
    INCOMING_MISSILE_ADDED: 'incoming_missile_added',

    // Входящая ракета удалена
    // после impact или другого завершения.
    INCOMING_MISSILE_REMOVED: 'incoming_missile_removed',

    // Актуальный временной snapshot
    // всех входящих ракет.
    INCOMING_MISSILES_UPDATED: 'incoming_missiles_updated',

    // #endregion
} as const;

// #region Crew and officer commands

// Payload initial crew snapshot.
export type BridgeCrewLoadedPayload = Record<OfficerRole, OfficerDefinition>;

// Payload input-события OFFICER_SEAT_CLICKED.
export type BridgeOfficerSeatClickedPayload = {
    role: OfficerRole;
};

// Payload polling-запроса открытого officer menu.
export type BridgeOfficerCommandMenuRefreshRequestedPayload = {
    role: OfficerRole;
};

// Payload input-события OFFICER_COMMAND_SELECTED.
export type BridgeOfficerCommandSelectedPayload = {
    role: OfficerRole;

    commandId: EncounterOfficerCommandId;

    targetId?: string;
};

// Один пункт меню команды офицера.
export type BridgeOfficerCommandMenuItemPayload = {
    commandId: EncounterOfficerCommandId;

    label: string;

    targetId?: string;
};

// Группа пунктов меню.
// Сейчас группа соответствует target label
// или GENERAL для untargeted commands.
export type BridgeOfficerCommandMenuGroupPayload = {
    label: string;

    items: BridgeOfficerCommandMenuItemPayload[];
};

// Актуальный view-ready snapshot officer menu.
export type BridgeOfficerCommandMenuUpdatedPayload = {
    role: OfficerRole;

    groups: BridgeOfficerCommandMenuGroupPayload[];
};

// Payload запроса officer bark.
export type BridgeOfficerBarkRequestedPayload = {
    role: OfficerRole;

    text: string;
};

// View-state лампы officer station.
export type BridgeOfficerStationIndicatorState = 'off' | 'ready' | 'busy' | 'blocked';

// Snapshot ламп всех officer stations.
export type BridgeOfficerStationIndicatorsUpdatedPayload = Record<OfficerRole, BridgeOfficerStationIndicatorState>;

// Офицер начал activity/task.
export type BridgeOfficerActivityStartedPayload = {
    role: OfficerRole;

    label: string;
};

// Activity/task офицера очищен.
export type BridgeOfficerActivityClearedPayload = {
    role: OfficerRole;
};

// #endregion

// #region Encounter objects and navigation

// View-ready описание одного encounter object.
export type BridgeEncounterObjectPayload = {
    id: string;

    // Navigation object, вокруг которого
    // собирается визуальная anchor group.
    anchorObjectId: string;

    // Позиция внутри space node.
    localPosition: Vec3;

    // Коэффициент псевдоперспективы.
    perspectiveDepth: number;

    sprite: SpriteEntry;

    // Финальная композиционная позиция
    // внутри bridge viewscreen.
    position: Phaser.Math.Vector2;
};

// Payload начала arrival flow.
export type BridgeEncounterArrivalStartedPayload = {
    targetId: string;
};

// Payload начала визуального travel flow.
//
// taskId связывает animation
// с конкретной HELM_FLY_TO task instance.
export type BridgeEncounterTravelStartedPayload = {
    taskId: string;

    fromObjectId: string;

    targetObjectId: string;
};

// Payload завершения визуального travel flow.
//
// View возвращает тот же taskId,
// который получил при старте animation.
export type BridgeEncounterTravelCompletedPayload = {
    taskId: string;
};

// Общий payload начала и завершения
// визуального межнодового jump flow.
export type BridgeEncounterJumpPayload = {
    taskId: string;

    targetNodeId: string;
};

// #endregion

// #region Contact and docking

// Payload начала structured contact flow.
export type BridgeContactStartedPayload = {
    contactName: string;

    contactPortraitId: CharacterPortraitId;
};

// Новая реплика structured contact flow.
export type BridgeContactMessageAddedPayload = {
    speakerName: string;

    text: string;
};

// Payload начала визуального docking flow.
export type BridgeDockingStartedPayload = {
    taskId: string;

    targetId: string;
};

// Payload завершения визуального docking flow.
export type BridgeDockingCompletedPayload = {
    taskId: string;
};

// #endregion

// #region Scene lifecycle

// Payload запроса перехода
// в другую Phaser scene.
export type BridgeSceneTransitionRequestedPayload = {
    sceneKey: SceneKey;
};

// #endregion

// #region Combat presentation

// Новая входящая ракета.
export type BridgeIncomingMissileAddedPayload = {
    projectileId: string;

    designation: string;

    sourceActorId: string;

    initialTimeToImpactMs: number;
};

// Входящая ракета завершила runtime lifecycle.
export type BridgeIncomingMissileRemovedPayload = {
    projectileId: string;
};

// Актуальное runtime-состояние одной входящей ракеты.
export type BridgeIncomingMissileUpdatePayload = {
    projectileId: string;

    timeToImpactMs: number;

    guidanceKind?: MissileGuidanceKind;
};

// Актуальный snapshot всех входящих ракет.
export type BridgeIncomingMissilesUpdatedPayload = BridgeIncomingMissileUpdatePayload[];

// #endregion

// Typed mapping:
// каждое bridge event name связано
// со своим payload.
//
// undefined означает,
// что событие несёт только сам факт.
export type BridgeEventPayloadMap = {
    // Crew and officer commands

    [BRIDGE_EVENT.CREW_LOADED]: BridgeCrewLoadedPayload;

    [BRIDGE_EVENT.OFFICER_SEAT_CLICKED]: BridgeOfficerSeatClickedPayload;

    [BRIDGE_EVENT.OFFICER_COMMAND_MENU_REFRESH_REQUESTED]: BridgeOfficerCommandMenuRefreshRequestedPayload;

    [BRIDGE_EVENT.OFFICER_COMMAND_SELECTED]: BridgeOfficerCommandSelectedPayload;

    [BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED]: BridgeOfficerCommandMenuUpdatedPayload;

    [BRIDGE_EVENT.OFFICER_BARK_REQUESTED]: BridgeOfficerBarkRequestedPayload;

    [BRIDGE_EVENT.OFFICER_STATION_INDICATORS_UPDATED]: BridgeOfficerStationIndicatorsUpdatedPayload;

    [BRIDGE_EVENT.OFFICER_ACTIVITY_STARTED]: BridgeOfficerActivityStartedPayload;

    [BRIDGE_EVENT.OFFICER_ACTIVITY_CLEARED]: BridgeOfficerActivityClearedPayload;

    // Encounter objects and navigation

    [BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED]: BridgeEncounterObjectPayload[];

    [BRIDGE_EVENT.ENCOUNTER_OBJECT_ADDED]: BridgeEncounterObjectPayload;

    [BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED]: BridgeEncounterObjectPayload[];

    [BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED]: BridgeEncounterArrivalStartedPayload;

    [BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED]: undefined;

    [BRIDGE_EVENT.ENCOUNTER_TRAVEL_STARTED]: BridgeEncounterTravelStartedPayload;

    [BRIDGE_EVENT.ENCOUNTER_TRAVEL_FLIGHT_STARTED]: undefined;

    [BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED]: BridgeEncounterTravelCompletedPayload;

    [BRIDGE_EVENT.ENCOUNTER_JUMP_STARTED]: BridgeEncounterJumpPayload;

    [BRIDGE_EVENT.ENCOUNTER_JUMP_COMPLETED]: BridgeEncounterJumpPayload;

    // Contact and docking

    [BRIDGE_EVENT.CONTACT_STARTED]: BridgeContactStartedPayload;

    [BRIDGE_EVENT.CONTACT_MESSAGE_ADDED]: BridgeContactMessageAddedPayload;

    [BRIDGE_EVENT.CONTACT_ENDED]: undefined;

    [BRIDGE_EVENT.DOCKING_STARTED]: BridgeDockingStartedPayload;

    [BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED]: BridgeDockingCompletedPayload;

    // Scene lifecycle

    [BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED]: BridgeSceneTransitionRequestedPayload;

    // Combat presentation

    [BRIDGE_EVENT.MISSILE_TARGETING_WARNING_STARTED]: undefined;

    [BRIDGE_EVENT.MISSILE_TARGETING_WARNING_CLEARED]: undefined;

    [BRIDGE_EVENT.INCOMING_MISSILE_ADDED]: BridgeIncomingMissileAddedPayload;

    [BRIDGE_EVENT.INCOMING_MISSILE_REMOVED]: BridgeIncomingMissileRemovedPayload;

    [BRIDGE_EVENT.INCOMING_MISSILES_UPDATED]: BridgeIncomingMissilesUpdatedPayload;
};
