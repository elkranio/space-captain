// src/engine/encounter/commands/handlers/pilot_jump_command_handler.ts

import { OFFICER_ROLE } from "../../../defs/officer";
import {
    ENCOUNTER_ANCHOR_TARGET_SCOPE,
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type OfficerCommandDef,
} from "../../model/command";
import { ENCOUNTER_EVENT } from "../../model/event";
import type { OfficerCommandHandler } from "../../model/officer_command_handler";
import { ENCOUNTER_ANCHOR_KIND } from "../../anchors/encounter_anchor";
import { createPilotJumpTask } from "../../officer_tasks/create_officer_task_draft";
import { getJumpPointTarget, isCurrentAnchor } from "./command_handler_helpers";

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.PILOT_JUMP;

const COMMAND_DEF = {
    role: OFFICER_ROLE.PILOT,
    label: "JUMP",

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,
        scope: ENCOUNTER_ANCHOR_TARGET_SCOPE.CURRENT_ANCHOR,
    },

    requiresOnlineDrive: true,

    requiresIdleBridge: true,
} satisfies OfficerCommandDef;

export const pilotJumpCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        return state.anchors
            .filter((object) => {
                return object.kind === ENCOUNTER_ANCHOR_KIND.JUMP_POINT && isCurrentAnchor(state, object);
            })
            .map((object) => {
                return {
                    commandId: COMMAND_ID,
                    target: {
                        kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,
                        anchorId: object.id,
                    },
                };
            });
    },

    execute(context, input) {
        const target = getJumpPointTarget(context, input);

        const taskId = context.startOfficerTask(createPilotJumpTask(target.id, target.jumpPoint.targetNodeId));

        context.emit({
            type: ENCOUNTER_EVENT.JUMP_STARTED,
            taskId,
            targetNodeId: target.jumpPoint.targetNodeId,
        });
    },
} satisfies OfficerCommandHandler;
