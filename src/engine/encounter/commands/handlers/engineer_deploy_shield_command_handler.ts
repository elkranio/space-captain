// src/engine/encounter/commands/handlers/engineer_deploy_shield_command_handler.ts

import {
    OFFICER_ROLE,
} from '../../../defs/officer';
import {
    SHIELD_EMITTER_PHASE,
    SHIELD_EMITTER_STATUS,
} from '../../../defs/shield_emitter';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type OfficerCommandDef,
} from '../../model/command';
import {
    ENCOUNTER_EVENT,
} from '../../model/event';
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
    availableToRoles: [
        OFFICER_ROLE.ENGINEER,
    ],

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
                .shieldEmitter;

        const capacitor =
            state.combat
                .defenseCapacitor;

        if (
            !emitter ||
            emitter.status !==
                SHIELD_EMITTER_STATUS
                    .ONLINE ||
            emitter.phase !==
                SHIELD_EMITTER_PHASE
                    .READY ||
            state.combat
                .activeShield !==
                null ||
            !capacitor ||
            capacitor.charges <= 0
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
        const defenseCapacitor =
            context.stateStore
                .spendDefenseCapacitorCharge();

        context.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_DEFENSE_CAPACITOR_CHARGE_SPENT,

            defenseCapacitor: {
                ...defenseCapacitor,
            },
        });

        context.startOfficerTask(
            createEngineerDeployShieldTask(),
        );
    },
} satisfies OfficerCommandHandler;
