// src/engine/encounter/commands/handlers/clear_sticky_mine_command_handler.ts

import { OFFICER_ROLE } from "../../../defs/officer";
import { COMBAT_TARGET_KIND } from "../../model/combat";
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND, type OfficerCommandDef } from "../../model/command";
import type { OfficerCommandHandler } from "../../model/officer_command_handler";
import { createClearStickyMineTask } from "../../officer_tasks/create_officer_task_draft";
import { requireThreatTargetId } from "./command_handler_helpers";

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.CLEAR_STICKY_MINE;

const COMMAND_DEF = {
    role: OFFICER_ROLE.ENGINEER,

    label: "CLEAR MINE",

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
    },

    requiresOnlineDrive: false,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const clearStickyMineCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        return state.combat.stickyMines
            .filter((mine) => {
                return mine.target.kind === COMBAT_TARGET_KIND.PLAYER_SHIP;
            })
            .map((mine) => {
                return {
                    commandId: COMMAND_ID,
                    label: COMMAND_DEF.label,

                    target: {
                        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
                        threatId: mine.id,
                    },

                    targetLabel: "STICKY MINES",
                };
            });
    },

    execute(context, input) {
        context.startOfficerTask(createClearStickyMineTask(input.role, requireThreatTargetId(input)));
    },
} satisfies OfficerCommandHandler;
