// src/engine/encounter/commands/handlers/helm_jump_command_handler.ts

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
import { createHelmJumpTask } from "../../officer_tasks/create_officer_task_draft";
import { createAnchorTargetedCommand, getJumpPointTarget, isCurrentAnchor } from "./command_handler_helpers";

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.HELM_JUMP;

const COMMAND_DEF = {
    role: OFFICER_ROLE.HELM,
    label: "JUMP",

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,
        scope: ENCOUNTER_ANCHOR_TARGET_SCOPE.CURRENT_ANCHOR,
    },

    requiresOnlineDrive: true,

    requiresIdleBridge: true,
} satisfies OfficerCommandDef;

export const helmJumpCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        return state.anchors
            .filter((object) => {
                return object.kind === ENCOUNTER_ANCHOR_KIND.JUMP_POINT && isCurrentAnchor(state, object);
            })
            .map((object) => {
                return createAnchorTargetedCommand(COMMAND_ID, object);
            });
    },

    execute(context, input) {
        const target = getJumpPointTarget(context, input);

        const taskId = context.startOfficerTask(createHelmJumpTask(target.id, target.jumpPoint.targetNodeId));

        context.emit({
            type: ENCOUNTER_EVENT.JUMP_STARTED,
            taskId,
            targetNodeId: target.jumpPoint.targetNodeId,
        });
    },
} satisfies OfficerCommandHandler;
