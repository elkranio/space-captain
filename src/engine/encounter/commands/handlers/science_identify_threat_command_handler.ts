// src/engine/encounter/commands/handlers/science_identify_threat_command_handler.ts

import { ENCOUNTER_TEAM } from '../../../defs/encounter_team';
import { OFFICER_ROLE } from '../../../defs/officer';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    COMBAT_THREAT_KIND,
    THREAT_IDENTIFICATION_STATUS,
} from '../../model/combat';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type OfficerCommandDef,
} from '../../model/command';
import type { EncounterState } from '../../model/state';
import type { OfficerCommandHandler } from '../../model/officer_command_handler';
import { createScienceIdentifyThreatTask } from '../../officer_tasks/create_officer_task_draft';
import { requireThreatTargetId } from './command_handler_helpers';

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT;

const COMMAND_DEF = {
    availableToRoles: [OFFICER_ROLE.SCIENCE],
    label: 'IDENTIFY THREAT',

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
    },

    requiresOnlineDrive: false,


    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

type AvailableThreat = {
    kind:
        typeof COMBAT_THREAT_KIND
            .MISSILE;

    id: string;
    designation: string;

    timeRemainingMs: number;
};

export const scienceIdentifyThreatCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        return getUnknownEnemyThreats(state)
            .sort((left, right) => {
                return left.timeRemainingMs - right.timeRemainingMs;
            })
            .map((threat) => {
                return {
                    commandId: COMMAND_ID,

                    label: getThreatLabel(threat),

                    target: {
                        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
                        threatId: threat.id,
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

function getUnknownEnemyThreats(state: EncounterState): AvailableThreat[] {
    const threats: AvailableThreat[] = [];

    for (const projectile of state.combat.projectiles) {
        if (projectile.target.kind !== COMBAT_TARGET_KIND.PLAYER_SHIP) {
            continue;
        }

        if (projectile.identification.status !== THREAT_IDENTIFICATION_STATUS.UNKNOWN) {
            continue;
        }

        if (
            projectile.source.kind !==
                COMBAT_SOURCE_KIND.ACTOR ||
            !isEnemyThreatSource(
                state,
                projectile.source.actorId,
            )
        ) {
            continue;
        }

        threats.push({
            kind: COMBAT_THREAT_KIND.MISSILE,

            id: projectile.id,
            designation: projectile.designation,

            timeRemainingMs: projectile.timeToImpactMs,
        });
    }

    return threats;
}

function isEnemyThreatSource(state: EncounterState, sourceActorId: string): boolean {
    const sourceActor = state.actors.find((actor) => {
        return actor.id === sourceActorId;
    });

    return sourceActor?.team === ENCOUNTER_TEAM.ENEMY;
}

function getThreatLabel(
    threat: AvailableThreat,
): string {
    return (
        'MISSILE ' +
        threat.designation
    );
}
