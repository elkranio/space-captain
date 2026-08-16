// src/engine/encounter/commands/handlers/engineer_deploy_shield_command_handler.ts

import {
    OFFICER_ROLE,
} from '../../../defs/officer';
import {
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
} from '../../../defs/shield_generator';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type OfficerCommandDef,
} from '../../model/command';
import type {
    OfficerCommandHandler,
} from '../../model/officer_command_handler';
import {
    createEngineerDeployShieldTask,
} from '../../officer_tasks/create_officer_task_draft';

const COMMAND_ID =
    ENCOUNTER_OFFICER_COMMAND_ID
        .ENGINEER_DEPLOY_SHIELD;

const COMMAND_DEF = {
    role: OFFICER_ROLE.ENGINEER,

    label:
        'DEPLOY SHIELD',

    targeting: {
        kind:
            OFFICER_COMMAND_TARGET_KIND
                .NONE,
    },

    requiresOnlineDrive: false,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const engineerDeployShieldCommandHandler = {
    commandId:
        COMMAND_ID,

    def:
        COMMAND_DEF,

    getAvailableCommands(state) {
        const emitter =
            state.combat
                .shieldGenerator;

        const powerCore =
            state.combat
                .powerCore;

        if (
            !emitter ||
            emitter.status !==
                SHIELD_GENERATOR_STATUS
                    .ONLINE ||
            emitter.phase !==
                SHIELD_GENERATOR_PHASE
                    .READY ||
            state.combat
                .activeShield !==
                null ||
            !powerCore ||
            powerCore.charges <= 0
        ) {
            return [];
        }

        return [
            {
                commandId:
                    COMMAND_ID,

                label:
                    COMMAND_DEF.label,

                target: {
                    kind:
                        OFFICER_COMMAND_TARGET_KIND
                            .NONE,
                },
            },
        ];
    },

    execute(context) {
        // Resource is committed at task start.
        // Cancel/interruption does not refund it.
        context.stateStore
            .spendPowerCoreCharge();

        context.startOfficerTask(
            createEngineerDeployShieldTask(),
        );
    },
} satisfies OfficerCommandHandler;
