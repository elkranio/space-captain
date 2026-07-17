// src/app/scenes/game/bridge/events/bridge_event.ts

import type { CharacterPortraitId } from '../../../../../engine/defs/character';
import type { OfficerDefinition, OfficerRole } from '../../../../../engine/defs/officer';
import type { EncounterOfficerCommandId } from '../../../../../engine/encounter/model/command';
import type { SpriteEntry } from '../../../../manifests/types';
import { SCENE_KEY, SceneKey } from '../../../scene_key';

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
// - *_LOADED / *_UPDATED / *_STARTED / *_ENDED = факт, на который view реагирует.
// - *_CLICKED / *_SELECTED / *_REQUESTED = input/intent от view к controller-у.
export const BRIDGE_EVENT = {
    // Initial snapshot экипажа для bridge UI.
    // Эмитит BridgeController после чтения GAME_RUNTIME.
    // Слушает crew view.
    CREW_LOADED: 'crew_loaded',

    // Игрок кликнул по officer seat.
    // Это input event: view не решает, какие команды доступны, а просит controller разобраться.
    OFFICER_SEAT_CLICKED: 'officer_seat_clicked',

    // Игрок выбрал команду в officer context menu.
    // Это input event: controller передаст команду в encounter engine.
    OFFICER_COMMAND_SELECTED: 'officer_command_selected',

    // Controller просит показать короткий officer bark bubble.
    // Это не contact dialogue, а маленькая реплика офицера поверх bridge UI.
    OFFICER_BARK_REQUESTED: 'officer_bark_requested',

    // Controller отдаёт view актуальные состояния ламп officer stations.
    // Это bridge-level view state, уже после маппинга из engine officer availability.
    OFFICER_STATION_INDICATORS_UPDATED: 'officer_station_indicators_updated',

    // Первый snapshot encounter objects после загрузки encounter.
    // View может создать/пересоздать Phaser sprites для объектов на viewscreen.
    ENCOUNTER_OBJECTS_LOADED: 'encounter_objects_loaded',

    // Обновление уже известных encounter objects.
    // View синхронизирует позиции/спрайты/видимость без пересоздания всей сцены.
    ENCOUNTER_OBJECTS_UPDATED: 'encounter_objects_updated',

    // Начало arrival animation на bridge viewscreen.
    // Это app-level visual flow, не engine domain event.
    ENCOUNTER_ARRIVAL_STARTED: 'encounter_arrival_started',

    // Arrival animation завершилась.
    // Controller может после этого открыть доступ к interaction/UI.
    ENCOUNTER_ARRIVAL_COMPLETED: 'encounter_arrival_completed',

    // Controller отдаёт view актуальное меню команд выбранного офицера.
    // Это результат запроса к encounter engine, уже готовый для UI.
    OFFICER_COMMAND_MENU_UPDATED: 'officer_command_menu_updated',

    // Начался structured contact/dialogue flow с внешним собеседником.
    // View показывает contact panel и портрет собеседника.
    CONTACT_STARTED: 'contact_started',

    // В active contact flow добавилась новая реплика.
    // View добавляет строку/сообщение в contact panel.
    CONTACT_MESSAGE_ADDED: 'contact_message_added',

    // Structured contact/dialogue flow завершился.
    // View скрывает или закрывает contact panel.
    CONTACT_ENDED: 'contact_ended',

    // Encounter engine разрешил начать docking flow.
    // App-слой запускает визуальную docking animation.
    DOCKING_STARTED: 'docking_started',

    // Визуальная docking animation завершилась.
    // Это app-level событие от view/vfx обратно controller-у.
    DOCKING_ANIMATION_COMPLETED: 'docking_animation_completed',

    // Controller/request handler просит root bridge controller перейти в другую Phaser scene.
    // Это bridge-level navigation intent, а не domain event encounter engine.
    SCENE_TRANSITION_REQUESTED: 'scene_transition_requested',
} as const;

// Payload события CREW_LOADED.
// Это bridge-level snapshot экипажа: роль -> офицер.
// View использует его, чтобы заполнить officer seats.
export type BridgeCrewLoadedPayload = Record<OfficerRole, OfficerDefinition>;

// Payload input-события OFFICER_SEAT_CLICKED.
// role говорит controller-у, у какого офицера игрок запросил меню.
export type BridgeOfficerSeatClickedPayload = {
    role: OfficerRole;
};

// Payload input-события OFFICER_COMMAND_SELECTED.
// targetId опционален: не все будущие команды обязаны быть привязаны к encounter object.
export type BridgeOfficerCommandSelectedPayload = {
    role: OfficerRole;
    commandId: EncounterOfficerCommandId;
    targetId?: string;
};

// Payload события OFFICER_BARK_REQUESTED.
// Это готовый короткий текст для bubble view, без dialogue state.
export type BridgeOfficerBarkRequestedPayload = {
    role: OfficerRole;
    text: string;
};

// View-ready описание одного encounter object для viewscreen.
// Engine отдаёт domain state, controller мапит его в sprite/position для Phaser view.
export type BridgeEncounterObjectPayload = {
    id: string;
    sprite: SpriteEntry;
    position: Phaser.Math.Vector2;
};

// Один пункт меню команды офицера.
// Это UI-ready item: label уже готов для отображения, commandId остаётся для execute input.
export type BridgeOfficerCommandMenuItemPayload = {
    commandId: EncounterOfficerCommandId;
    label: string;
    targetId?: string;
};

// Группа пунктов меню.
// Сейчас group label обычно может быть target label или категория команд.
export type BridgeOfficerCommandMenuGroupPayload = {
    label: string;
    items: BridgeOfficerCommandMenuItemPayload[];
};

// Payload события OFFICER_COMMAND_MENU_UPDATED.
// Controller отдаёт view полное меню для выбранного officer role.
export type BridgeOfficerCommandMenuUpdatedPayload = {
    role: OfficerRole;
    groups: BridgeOfficerCommandMenuGroupPayload[];
};

// Payload события CONTACT_STARTED.
// contactName и portraitId описывают внешнего собеседника, не офицера экипажа.
export type BridgeContactStartedPayload = {
    contactName: string;
    contactPortraitId: CharacterPortraitId;
};

// Payload события CONTACT_MESSAGE_ADDED.
// Это одна новая реплика в active contact panel.
export type BridgeContactMessageAddedPayload = {
    speakerName: string;
    text: string;
};

// Payload события DOCKING_STARTED.
// targetId нужен app-слою, чтобы знать, к какому encounter object запускать docking animation.
export type BridgeDockingStartedPayload = {
    targetId: string;
};

// Payload события SCENE_TRANSITION_REQUESTED.
// sceneKey — целевая Phaser scene, например station/shop/brothel/end flow.
export type BridgeSceneTransitionRequestedPayload = {
    sceneKey: SceneKey;
};

// View-state лампы officer station.
// off = потухшая лампа в базовом frame; ready/busy = overlay sprite поверх панели.
export type BridgeOfficerStationIndicatorState = 'off' | 'ready' | 'busy';

// Payload события OFFICER_STATION_INDICATORS_UPDATED.
// Controller отдаёт полный snapshot role -> lamp state.
export type BridgeOfficerStationIndicatorsUpdatedPayload = Record<OfficerRole, BridgeOfficerStationIndicatorState>;

// Typed mapping: каждое bridge event name связано со своим payload.
// undefined означает, что событие несёт только сам факт и не требует данных.
export type BridgeEventPayloadMap = {
    [BRIDGE_EVENT.CREW_LOADED]: BridgeCrewLoadedPayload;

    [BRIDGE_EVENT.OFFICER_SEAT_CLICKED]: BridgeOfficerSeatClickedPayload;
    [BRIDGE_EVENT.OFFICER_COMMAND_SELECTED]: BridgeOfficerCommandSelectedPayload;
    [BRIDGE_EVENT.OFFICER_BARK_REQUESTED]: BridgeOfficerBarkRequestedPayload;

    [BRIDGE_EVENT.OFFICER_STATION_INDICATORS_UPDATED]: BridgeOfficerStationIndicatorsUpdatedPayload;

    [BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED]: BridgeEncounterObjectPayload[];
    [BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED]: BridgeEncounterObjectPayload[];

    [BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED]: undefined;
    [BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED]: undefined;

    [BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED]: BridgeOfficerCommandMenuUpdatedPayload;

    [BRIDGE_EVENT.CONTACT_STARTED]: BridgeContactStartedPayload;
    [BRIDGE_EVENT.CONTACT_MESSAGE_ADDED]: BridgeContactMessageAddedPayload;
    [BRIDGE_EVENT.CONTACT_ENDED]: undefined;

    [BRIDGE_EVENT.DOCKING_STARTED]: BridgeDockingStartedPayload;
    [BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED]: undefined;

    [BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED]: BridgeSceneTransitionRequestedPayload;
};
