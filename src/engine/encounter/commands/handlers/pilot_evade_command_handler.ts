// src/engine/encounter/commands/handlers/pilot_evade_command_handler.ts

import { SHIP_DRIVES } from "../../../content/catalogs/ship_drives";
import { OFFICER_ROLE } from "../../../defs/officer";
import { SHIP_EVADE_PHASE } from "../../../defs/ship_evade";
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND, type OfficerCommandDef } from "../../model/command";
import type { OfficerCommandHandler } from "../../model/officer_command_handler";
import { createPilotEvadeTask } from "../../officer_tasks/create_officer_task_draft";

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.PILOT_EVADE;

const COMMAND_DEF = {
    role: OFFICER_ROLE.PILOT,
    label: "EVADE",

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.NONE,
    },

    requiresOnlineDrive: true,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const pilotEvadeCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        const powerCore = state.combat.powerCore;

        const driveDefinition = SHIP_DRIVES[state.drive.driveId];

        if (
            state.evade.phase !== SHIP_EVADE_PHASE.READY ||
            !powerCore ||
            powerCore.charges < driveDefinition.evadePowerCost
        ) {
            return [];
        }

        return [
            {
                commandId: COMMAND_ID,

                label: COMMAND_DEF.label,

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.NONE,
                },
            },
        ];
    },

    execute(context) {
        const state = context.stateStore.getState();

        const driveDefinition = SHIP_DRIVES[state.drive.driveId];

        // Full resource commitment happens before the Pilot task starts.
        // Cancellation/interruption never refunds Power or cooldown.
        context.stateStore.spendPowerCoreCharges(driveDefinition.evadePowerCost);

        context.stateStore.startPlayerEvade();

        context.startOfficerTask(createPilotEvadeTask());
    },
} satisfies OfficerCommandHandler;
