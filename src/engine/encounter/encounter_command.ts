// src/engine/encounter/encounter_command.ts

export const ENCOUNTER_OFFICER_COMMAND_ID = {
    HAIL: 'hail',
    REQUEST_DOCKING: 'request_docking',
} as const;

export type EncounterOfficerCommandId =
    (typeof ENCOUNTER_OFFICER_COMMAND_ID)[keyof typeof ENCOUNTER_OFFICER_COMMAND_ID];

export type EncounterOfficerCommand = {
    commandId: EncounterOfficerCommandId;
    label: string;
    targetId?: string;
    targetLabel?: string;
};
