// src\engine\encounter\encounter_event.ts

import type { OfficerRole } from '../defs/officer';
import type { EncounterOfficerCommand } from './encounter_command';
import type { EncounterState } from './encounter_state';

export const ENCOUNTER_EVENT = {
    ENCOUNTER_LOADED: 'encounter_loaded',
    OFFICER_COMMANDS_READY: 'officer_commands_ready',
} as const;

export type EncounterLoadedEvent = {
    type: typeof ENCOUNTER_EVENT.ENCOUNTER_LOADED;
    state: EncounterState;
};

export type OfficerCommandsReadyEvent = {
    type: typeof ENCOUNTER_EVENT.OFFICER_COMMANDS_READY;
    role: OfficerRole;
    commands: EncounterOfficerCommand[];
};

export type EncounterEvent = EncounterLoadedEvent | OfficerCommandsReadyEvent;
