// src/engine/encounter/encounter_command.ts
import type { OfficerRole } from '../defs/officer';

export const ENCOUNTER_OFFICER_COMMAND_ID = {
    HAIL: 'hail',
    REQUEST_DOCKING: 'request_docking',
    DOCK: 'dock',
} as const;

export type EncounterOfficerCommandId =
    (typeof ENCOUNTER_OFFICER_COMMAND_ID)[keyof typeof ENCOUNTER_OFFICER_COMMAND_ID];

export type EncounterOfficerCommand = {
    commandId: EncounterOfficerCommandId;
    label: string;
    targetId?: string;
    targetLabel?: string;
};

export type ExecuteOfficerCommandInput = {
    role: OfficerRole;
    commandId: EncounterOfficerCommandId;
    targetId?: string;
};
