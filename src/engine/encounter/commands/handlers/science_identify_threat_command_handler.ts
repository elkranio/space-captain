// src/engine/encounter/commands/handlers/science_identify_threat_command_handler.ts

import { OFFICER_ROLE } from '../../../defs/officer';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_TARGET_KIND,
    THREAT_IDENTIFICATION_STATUS,
    type CombatProjectileState,
} from '../../model/combat';
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND, type OfficerCommandDef } from '../../model/command';
import type { OfficerCommandHandler } from '../../model/officer_command_handler';
import { createScienceIdentifyThreatTask } from '../../officer_tasks/create_officer_task_draft';
import { requireThreatTargetId } from './command_handler_helpers';

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT;

const COMMAND_DEF = {
    role: OFFICER_ROLE.SCIENCE,
    label: 'IDENTIFY THREAT',

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
    },

    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const scienceIdentifyThreatCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        return state.combat.projectiles
            .filter((projectile) => {
                return (
                    projectile.target.kind === COMBAT_TARGET_KIND.PLAYER_SHIP &&
                    projectile.identification.status === THREAT_IDENTIFICATION_STATUS.UNKNOWN
                );
            })
            .sort((left, right) => {
                return left.timeToImpactMs - right.timeToImpactMs;
            })
            .map((projectile) => {
                return {
                    commandId: COMMAND_ID,

                    // Bridge menu группирует эти пункты
                    // под общей секцией IDENTIFY THREAT.
                    label: getThreatLabel(projectile),

                    target: {
                        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
                        threatId: projectile.id,
                    },

                    targetLabel: COMMAND_DEF.label,
                };
            });
    },

    execute(context, input) {
        const threatId = requireThreatTargetId(input);

        context.startOfficerTask(createScienceIdentifyThreatTask(threatId));
    },
} satisfies OfficerCommandHandler;

function getThreatLabel(threat: CombatProjectileState): string {
    switch (threat.kind) {
        case COMBAT_PROJECTILE_KIND.MISSILE:
            return `MISSILE ${threat.designation}`;

        default:
            throw new Error(`Unhandled combat threat: ${String(threat.kind)}`);
    }
}
