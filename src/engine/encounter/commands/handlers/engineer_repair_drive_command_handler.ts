// src/engine/encounter/commands/handlers/engineer_repair_drive_command_handler.ts

import { OFFICER_ROLE } from '../../../defs/officer';
import { SHIP_DRIVE_STATUS } from '../../../defs/ship_drive';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type OfficerCommandDef,
} from '../../model/command';
import type { OfficerCommandHandler } from '../../model/officer_command_handler';
import { createEngineerRepairDriveTask } from '../../officer_tasks/create_officer_task_draft';

const COMMAND_ID =
    ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE;

const COMMAND_DEF = {
    role: OFFICER_ROLE.ENGINEER,
    label: 'REPAIR ENGINE',

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.NONE,
    },

    requiresOnlineDrive: false,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const engineerRepairDriveCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        if (
            state.drive.status !==
            SHIP_DRIVE_STATUS.DISABLED
        ) {
            return [];
        }

        return [
            {
                commandId: COMMAND_ID,
                label: COMMAND_DEF.label,

                target: {
                    kind:
                        OFFICER_COMMAND_TARGET_KIND.NONE,
                },
            },
        ];
    },

    execute(context) {
        context.startOfficerTask(
            createEngineerRepairDriveTask(),
        );
    },
} satisfies OfficerCommandHandler;
