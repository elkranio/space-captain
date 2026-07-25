// src/engine/encounter/commands/handlers/science_plot_course_command_handler.ts

import { OFFICER_ROLE } from '../../../defs/officer';
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND, type OfficerCommandDef } from '../../model/command';
import type { OfficerCommandHandler } from '../../model/officer_command_handler';
import { ENCOUNTER_ANCHOR_KIND } from '../../anchors/encounter_anchor';
import { createSciencePlotCourseTask } from '../../officer_tasks/create_officer_task_draft';
import { requireTargetNodeId } from './command_handler_helpers';

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE;

const COMMAND_DEF = {
    role: OFFICER_ROLE.SCIENCE,
    label: 'PLOT COURSE',

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.NONE,
    },

    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const sciencePlotCourseCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        const jumpPointExists = state.anchors.some((object) => {
            return object.kind === ENCOUNTER_ANCHOR_KIND.JUMP_POINT;
        });

        if (jumpPointExists) {
            return [];
        }

        return [
            {
                commandId: COMMAND_ID,
                label: COMMAND_DEF.label,
            },
        ];
    },

    isInputValid(input) {
        return Boolean(input.targetNodeId);
    },

    execute(context, input) {
        const targetNodeId = requireTargetNodeId(input);

        context.startOfficerTask(createSciencePlotCourseTask(targetNodeId));
    },
} satisfies OfficerCommandHandler;
