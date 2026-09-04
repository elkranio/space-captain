// src/engine/encounter/commands/handlers/pilot_dock_command_handler.ts

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
import { createPilotDockTask } from "../../officer_tasks/create_officer_task_draft";
import { getStationTarget, isCurrentAnchor } from "./command_handler_helpers";

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.PILOT_DOCK;

const COMMAND_DEF = {
    role: OFFICER_ROLE.PILOT,
    label: "DOCK",

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,
        scope: ENCOUNTER_ANCHOR_TARGET_SCOPE.CURRENT_ANCHOR,
    },

    requiresOnlineDrive: true,

    requiresIdleBridge: true,
} satisfies OfficerCommandDef;

export const pilotDockCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        return state.anchors
            .filter((object) => {
                return object.kind === ENCOUNTER_ANCHOR_KIND.STATION && isCurrentAnchor(state, object);
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
        const target = getStationTarget(context, input);

        const taskId = context.startOfficerTask(createPilotDockTask(target.id));

        context.emit({
            type: ENCOUNTER_EVENT.DOCKING_STARTED,
            taskId,
            targetId: target.id,
        });
    },
} satisfies OfficerCommandHandler;
