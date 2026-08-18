// src/engine/encounter/commands/handlers/science_purge_spam_command_handler.ts

import { OFFICER_ROLE } from "../../../defs/officer";
import { getActiveCrewProgressEffects } from "../../crew_performance/get_active_crew_progress_effects";
import { COMBAT_TARGET_KIND } from "../../model/combat";
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND, type OfficerCommandDef } from "../../model/command";
import type { OfficerCommandHandler } from "../../model/officer_command_handler";
import { createSciencePurgeSpamTask } from "../../officer_tasks/create_officer_task_draft";
import { requireThreatTargetId } from "./command_handler_helpers";

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM;

const COMMAND_DEF = {
    role: OFFICER_ROLE.SCIENCE,
    label: "PURGE SPAM",

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
    },

    requiresOnlineDrive: false,

    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const sciencePurgeSpamCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        return getActiveCrewProgressEffects(state)
            .filter((effect) => effect.target.kind === COMBAT_TARGET_KIND.PLAYER_SHIP)
            .map((effect) => {
            return {
                commandId: COMMAND_ID,
                label: COMMAND_DEF.label,

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
                    threatId: effect.id,
                },

                targetLabel: "SPAM CHANNEL",
                };
            });
    },

    execute(context, input) {
        context.startOfficerTask(createSciencePurgeSpamTask(requireThreatTargetId(input)));
    },
} satisfies OfficerCommandHandler;
