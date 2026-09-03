// src/engine/encounter/commands/handlers/science_plot_course_command_handler.ts

import { OFFICER_ROLE } from "../../../defs/officer";
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND, type OfficerCommandDef } from "../../model/command";
import type { OfficerCommandHandler } from "../../model/officer_command_handler";
import { ENCOUNTER_ANCHOR_KIND } from "../../anchors/encounter_anchor";
import { createSciencePlotCourseTask } from "../../officer_tasks/create_officer_task_draft";
import { requireSpaceNodeTargetId } from "./command_handler_helpers";

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE;

const COMMAND_DEF = {
    role: OFFICER_ROLE.SCIENCE,
    label: "PLOT COURSE",

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.SPACE_NODE,
    },

    requiresOnlineDrive: false,

    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const sciencePlotCourseCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        const jumpPointExists = state.anchors.some((anchor) => {
            return anchor.kind === ENCOUNTER_ANCHOR_KIND.JUMP_POINT;
        });

        if (jumpPointExists) {
            return [];
        }

        // Destination выбирается app-слоем
        // после выбора общей команды PLOT COURSE.
        return [
            {
                commandId: COMMAND_ID,
                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.NONE,
                },
            },
        ];
    },

    execute(context, input) {
        const targetNodeId = requireSpaceNodeTargetId(input);

        context.startOfficerTask(createSciencePlotCourseTask(targetNodeId));
    },
} satisfies OfficerCommandHandler;
