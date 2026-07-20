// src/engine/encounter/model/event.ts

import type { CharacterPortraitId } from '../../defs/character';
import type { OfficerRole } from '../../defs/officer';
import type { AvailableOfficerCommand } from './command';
import type { EncounterState } from './state';
import type { OfficerTaskId } from './officer_task';

// События, которые EncounterEngine отдаёт наружу через outbox.
// Engine сообщает только о доменных изменениях, app-слой сам решает, как это показать.
export const ENCOUNTER_EVENT = {
    ENCOUNTER_LOADED: 'encounter_loaded',
    AVAILABLE_OFFICER_COMMANDS_UPDATED: 'available_officer_commands_updated',

    CONTACT_STARTED: 'contact_started',
    CONTACT_MESSAGE_ADDED: 'contact_message_added',
    CONTACT_ENDED: 'contact_ended',

    DOCKING_STARTED: 'docking_started',

    OFFICER_TASK_STARTED: 'officer_task_started',
    OFFICER_TASK_ENDED: 'officer_task_ended',
} as const;

// Полный snapshot encounter после создания или пересборки состояния.
export type EncounterLoadedEvent = {
    type: typeof ENCOUNTER_EVENT.ENCOUNTER_LOADED;
    state: EncounterState;
};

// Список команд, которые сейчас доступны выбранному офицеру.
// Это результат resolve-логики, а не выполнение команды.
export type AvailableOfficerCommandsUpdatedEvent = {
    type: typeof ENCOUNTER_EVENT.AVAILABLE_OFFICER_COMMANDS_UPDATED;
    role: OfficerRole;
    commands: AvailableOfficerCommand[];
};

// Начало структурного contact/dialogue flow с внешним собеседником.
export type ContactStartedEvent = {
    type: typeof ENCOUNTER_EVENT.CONTACT_STARTED;
    contactName: string;
    contactPortraitId: CharacterPortraitId;
};

// Новая реплика внутри активного contact flow.
export type ContactMessageAddedEvent = {
    type: typeof ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED;
    speakerName: string;
    text: string;
};

// Завершение активного contact flow.
export type ContactEndedEvent = {
    type: typeof ENCOUNTER_EVENT.CONTACT_ENDED;
};

// Начало docking flow с конкретной encounter-целью.
// Визуальную анимацию docking выполняет app-слой.
export type DockingStartedEvent = {
    type: typeof ENCOUNTER_EVENT.DOCKING_STARTED;
    targetId: string;
};

export type OfficerTaskStartedEvent = {
    type: typeof ENCOUNTER_EVENT.OFFICER_TASK_STARTED;
    role: OfficerRole;
    taskId: OfficerTaskId;
    label: string;
};

export type OfficerTaskEndedEvent = {
    type: typeof ENCOUNTER_EVENT.OFFICER_TASK_ENDED;
    role: OfficerRole;
    taskId: OfficerTaskId;
};

export type EncounterEvent =
    | EncounterLoadedEvent
    | AvailableOfficerCommandsUpdatedEvent
    | ContactStartedEvent
    | ContactMessageAddedEvent
    | ContactEndedEvent
    | OfficerTaskStartedEvent
    | OfficerTaskEndedEvent
    | DockingStartedEvent;
