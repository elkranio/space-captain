// src/engine/encounter/commands/handlers/helm_fly_to_command_handler.ts

import { OFFICER_ROLE } from "../../../defs/officer";
import { PLAYER_SPACE_NAVIGATION_KIND } from "../../../defs/player_location";
import { createHelmFlyToTask } from "../../officer_tasks/create_officer_task_draft";
import {
    ENCOUNTER_ANCHOR_TARGET_SCOPE,
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type OfficerCommandDef,
} from "../../model/command";
import { ENCOUNTER_EVENT } from "../../model/event";
import type { OfficerCommandHandler } from "../../model/officer_command_handler";
import { createAnchorTargetedCommand, requireAnchorTargetId } from "./command_handler_helpers";

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO;

const COMMAND_DEF = {
    role: OFFICER_ROLE.HELM,
    label: "FLY TO",

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,
        scope: ENCOUNTER_ANCHOR_TARGET_SCOPE.ENCOUNTER_NODE,
    },

    requiresOnlineDrive: true,

    requiresIdleBridge: true,
} satisfies OfficerCommandDef;

export const helmFlyToCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        const navigation = state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ANCHORED) {
            return [];
        }

        return state.anchors
            .filter((anchor) => {
                return anchor.id !== navigation.anchorId;
            })
            .map((anchor) => {
                return createAnchorTargetedCommand(COMMAND_ID, COMMAND_DEF.label, anchor);
            });
    },

    execute(context, input) {
        const targetId = requireAnchorTargetId(input);

        const { fromAnchorId, target } = context.stateStore.startTravel(targetId);

        const taskId = context.startOfficerTask(createHelmFlyToTask(target.id));

        context.emit({
            type: ENCOUNTER_EVENT.TRAVEL_STARTED,
            taskId,
            fromAnchorId,
            target,
        });
    },
} satisfies OfficerCommandHandler;
