// src/engine/encounter/commands/handlers/clear_sticky_mine_command_handler.ts

import {
    OFFICER_ROLE,
} from '../../../defs/officer';
import {
    getNextClearableStickyMine,
} from '../../combat/queries/get_next_clearable_sticky_mine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type OfficerCommandDef,
} from '../../model/command';
import type {
    OfficerCommandHandler,
} from '../../model/officer_command_handler';
import {
    createClearStickyMineTask,
} from '../../officer_tasks/create_officer_task_draft';

const COMMAND_ID =
    ENCOUNTER_OFFICER_COMMAND_ID
        .CLEAR_STICKY_MINE;

const COMMAND_DEF = {
    availableToRoles: [
        OFFICER_ROLE.SCIENCE,
        OFFICER_ROLE.HELM,
        OFFICER_ROLE.WEAPONS,
        OFFICER_ROLE.ENGINEER,
    ],

    label: 'CLEAR MINE',

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.NONE,
    },

    requiresOnlineDrive: false,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const clearStickyMineCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        if (
            !getNextClearableStickyMine(state)
        ) {
            return [];
        }

        return [
            {
                commandId: COMMAND_ID,
                label: COMMAND_DEF.label,

                target: {
                    kind:
                        OFFICER_COMMAND_TARGET_KIND
                            .NONE,
                },

                targetLabel: 'STICKY MINES',
            },
        ];
    },

    execute(context, input) {
        // Availability проверяется executor прямо
        // перед execute, но mine выбираем заново:
        // active tasks уже являются reservation state.
        const mine =
            getNextClearableStickyMine(
                context.stateStore.getState(),
            );

        if (!mine) {
            throw new Error(
                'CLEAR MINE executed without a clearable sticky mine',
            );
        }

        context.startOfficerTask(
            createClearStickyMineTask(
                input.role,
                mine.id,
            ),
        );
    },
} satisfies OfficerCommandHandler;
