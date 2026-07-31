// src/engine/encounter/commands/handlers/engineer_deploy_shield_command_handler.ts

import { ENCOUNTER_TEAM } from '../../../defs/encounter_team';
import {
    LASER_TARGET_ZONE,
    type LaserTargetZone,
} from '../../../defs/laser';
import { OFFICER_ROLE } from '../../../defs/officer';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type EngineerDeployShieldCommandId,
    type OfficerCommandDef,
} from '../../model/command';
import { ENCOUNTER_EVENT } from '../../model/event';
import type { OfficerCommandHandler } from '../../model/officer_command_handler';
import type { EncounterState } from '../../model/state';
import { createEngineerDeployShieldTask } from '../../officer_tasks/create_officer_task_draft';

export const engineerDeployShieldLeftCommandHandler = createEngineerDeployShieldCommandHandler(
    ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_LEFT,
    'SHIELD LEFT',
    LASER_TARGET_ZONE.LEFT,
);

export const engineerDeployShieldCenterCommandHandler = createEngineerDeployShieldCommandHandler(
    ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_CENTER,
    'SHIELD CENTER',
    LASER_TARGET_ZONE.CENTER,
);

export const engineerDeployShieldRightCommandHandler = createEngineerDeployShieldCommandHandler(
    ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_RIGHT,
    'SHIELD RIGHT',
    LASER_TARGET_ZONE.RIGHT,
);

function createEngineerDeployShieldCommandHandler(
    commandId: EngineerDeployShieldCommandId,
    label: string,
    shieldZone: LaserTargetZone,
): OfficerCommandHandler {
    const def = {
        availableToRoles: [OFFICER_ROLE.ENGINEER],
        label,

        targeting: {
            kind: OFFICER_COMMAND_TARGET_KIND.NONE,
        },

        requiresOnlineDrive: false,


        requiresIdleBridge: false,
    } satisfies OfficerCommandDef;

    return {
        commandId,
        def,

        getAvailableCommands(state) {
            const shieldGenerator = state.combat.shieldGenerator;

            if (!shieldGenerator || shieldGenerator.charges <= 0) {
                return [];
            }

            if (!hasActiveEnemyLaserAttack(state)) {
                return [];
            }

            return [
                {
                    commandId,

                    label: def.label,

                    target: {
                        kind: OFFICER_COMMAND_TARGET_KIND.NONE,
                    },
                },
            ];
        },

        execute(context) {
            const shieldGenerator = context.stateStore.spendShieldGeneratorCharge();

            context.emit({
                type: ENCOUNTER_EVENT.PLAYER_SHIELD_GENERATOR_STATE_CHANGED,

                shieldGenerator,
            });

            context.startOfficerTask(
                createEngineerDeployShieldTask(
                    commandId,
                    shieldZone,
                ),
            );
        },
    };
}

function hasActiveEnemyLaserAttack(state: EncounterState): boolean {
    return state.combat.laserAttacks.some((attack) => {
        const sourceActor = state.actors.find((actor) => {
            return actor.id === attack.sourceActorId;
        });

        return sourceActor?.team === ENCOUNTER_TEAM.ENEMY;
    });
}
