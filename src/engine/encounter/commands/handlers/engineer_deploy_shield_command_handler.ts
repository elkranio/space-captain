// src/engine/encounter/commands/handlers/engineer_deploy_shield_command_handler.ts

import { OFFICER_ROLE } from "../../../defs/officer";
import { SHIELD_GENERATOR_PHASE, SHIELD_GENERATOR_STATUS } from "../../../defs/shield_generator";
import { BEAM_CANNON_TARGET_NODE } from "../../model/combat";
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND, type OfficerCommandDef } from "../../model/command";
import type { OfficerCommandHandler } from "../../model/officer_command_handler";
import { createEngineerDeployShieldTask } from "../../officer_tasks/create_officer_task_draft";

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD;

const COMMAND_DEF = {
    role: OFFICER_ROLE.ENGINEER,

    label: "DEPLOY SHIELD",

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.PLAYER_SHIP_NODE,
    },

    requiresOnlineDrive: false,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const engineerDeployShieldCommandHandler = {
    commandId: COMMAND_ID,

    def: COMMAND_DEF,

    getAvailableCommands(state) {
        const emitter = state.combat.shieldGenerator;

        const powerCore = state.combat.powerCore;

        if (
            !emitter ||
            emitter.status !== SHIELD_GENERATOR_STATUS.ONLINE ||
            emitter.phase !== SHIELD_GENERATOR_PHASE.READY ||
            state.combat.activeShield !== null ||
            !powerCore ||
            powerCore.charges <= 0
        ) {
            return [];
        }

        return [
            {
                commandId: COMMAND_ID,

                label: COMMAND_DEF.label,
                targetLabel: "HULL",

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.PLAYER_SHIP_NODE,
                    targetNode: BEAM_CANNON_TARGET_NODE.HULL,
                },
            },
            {
                commandId: COMMAND_ID,

                label: COMMAND_DEF.label,
                targetLabel: "DRIVE",

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.PLAYER_SHIP_NODE,
                    targetNode: BEAM_CANNON_TARGET_NODE.DRIVE,
                },
            },
        ];
    },

    execute(context, input) {
        if (input.target.kind !== OFFICER_COMMAND_TARGET_KIND.PLAYER_SHIP_NODE) {
            throw new Error("Deploy shield requires a player-ship node target");
        }

        // Resource is committed at task start.
        // Cancel/interruption does not refund it.
        context.stateStore.spendPowerCoreCharge();

        context.stateStore.startPlayerShieldGeneratorCooldown();

        context.startOfficerTask(createEngineerDeployShieldTask(input.target.targetNode));
    },
} satisfies OfficerCommandHandler;
