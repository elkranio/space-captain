// src/engine/encounter/commands/handlers/weapons_defense_turret_command_handler.ts

import { ENCOUNTER_TEAM } from '../../../defs/encounter_team';
import { OFFICER_ROLE } from '../../../defs/officer';
import { DEFENSE_TURRET_BEAM_BAND, type DefenseTurretBeamBand } from '../../../defs/defense_turret';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from '../../model/combat';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type WeaponsDefenseTurretCommandId,
    type OfficerCommandDef,
} from '../../model/command';
import type { OfficerCommandHandler } from '../../model/officer_command_handler';
import { createWeaponsDefenseTurretTask } from '../../officer_tasks/create_officer_task_draft';
import { requireThreatTargetId } from './command_handler_helpers';

export const weaponsFireRedBeamCommandHandler = createWeaponsDefenseTurretCommandHandler(
    ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,

    'RED BEAM',

    DEFENSE_TURRET_BEAM_BAND.RED,
);

export const weaponsFireBlueBeamCommandHandler = createWeaponsDefenseTurretCommandHandler(
    ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_BLUE_BEAM,

    'BLUE BEAM',

    DEFENSE_TURRET_BEAM_BAND.BLUE,
);

function createWeaponsDefenseTurretCommandHandler(
    commandId: WeaponsDefenseTurretCommandId,
    label: string,

    defenseTurretBeamBand: DefenseTurretBeamBand,
): OfficerCommandHandler {
    const def = {
        availableToRoles: [OFFICER_ROLE.WEAPONS],
        label,

        targeting: {
            kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
        },

        requiresOnlineDrive: false,


        requiresIdleBridge: false,
    } satisfies OfficerCommandDef;

    return {
        commandId,
        def,

        getAvailableCommands(state) {
            const powerCore =
                state.combat
                    .powerCore;

            if (
                !powerCore ||
                powerCore.charges <= 0
            ) {
                return [];
            }

            return state.combat.projectiles
                .filter((projectile) => {
                    if (projectile.kind !== COMBAT_PROJECTILE_KIND.MISSILE) {
                        return false;
                    }

                    if (projectile.target.kind !== COMBAT_TARGET_KIND.PLAYER_SHIP) {
                        return false;
                    }

                    if (
                        projectile.source.kind !==
                        COMBAT_SOURCE_KIND.ACTOR
                    ) {
                        return false;
                    }

                    const sourceActorId =
                        projectile.source.actorId;

                    const sourceActor = state.actors.find((actor) => {
                        return (
                            actor.id ===
                            sourceActorId
                        );
                    });

                    return sourceActor?.team === ENCOUNTER_TEAM.ENEMY;
                })
                .sort((left, right) => {
                    return left.timeToImpactMs - right.timeToImpactMs;
                })
                .map((projectile) => {
                    return {
                        commandId,

                        label: def.label,

                        target: {
                            kind: OFFICER_COMMAND_TARGET_KIND.THREAT,

                            threatId: projectile.id,
                        },

                        targetLabel: `MISSILE ` + projectile.designation,
                    };
                });
        },

        execute(context, input) {
            const threatId = requireThreatTargetId(input);

            context.stateStore
                .spendPowerCoreCharge();

            context.startOfficerTask(createWeaponsDefenseTurretTask(commandId, threatId, defenseTurretBeamBand));
        },
    };
}
