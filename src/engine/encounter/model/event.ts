// src/engine/encounter/model/event.ts

import type { OfficerRole } from '../../defs/officer';
import type { AvailableOfficerCommand } from './command';
import type { EncounterState } from './state';
import type { CharacterPortraitId } from '../../defs/character';

export const ENCOUNTER_EVENT = {
    ENCOUNTER_LOADED: 'encounter_loaded',
    OFFICER_COMMANDS_READY: 'officer_commands_ready',

    CONTACT_STARTED: 'contact_started',
    CONTACT_MESSAGE_ADDED: 'contact_message_added',
    CONTACT_ENDED: 'contact_ended',

    DOCKING_STARTED: 'docking_started',
} as const;

export type EncounterLoadedEvent = {
    type: typeof ENCOUNTER_EVENT.ENCOUNTER_LOADED;
    state: EncounterState;
};

export type OfficerCommandsReadyEvent = {
    type: typeof ENCOUNTER_EVENT.OFFICER_COMMANDS_READY;
    role: OfficerRole;
    commands: AvailableOfficerCommand[];
};

export type ContactStartedEvent = {
    type: typeof ENCOUNTER_EVENT.CONTACT_STARTED;
    contactName: string;
    contactPortraitId: CharacterPortraitId;
};

export type ContactMessageAddedEvent = {
    type: typeof ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED;
    speakerName: string;
    text: string;
};

export type ContactEndedEvent = {
    type: typeof ENCOUNTER_EVENT.CONTACT_ENDED;
};

export type DockingStartedEvent = {
    type: typeof ENCOUNTER_EVENT.DOCKING_STARTED;
    targetId: string;
};

export type EncounterEvent =
    | EncounterLoadedEvent
    | OfficerCommandsReadyEvent
    | ContactStartedEvent
    | ContactMessageAddedEvent
    | ContactEndedEvent
    | DockingStartedEvent;
