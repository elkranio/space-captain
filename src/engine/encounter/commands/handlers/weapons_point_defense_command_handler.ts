// src/engine/encounter/commands/handlers/weapons_point_defense_command_handler.ts

import { ENCOUNTER_TEAM } from '../../../defs/encounter_team';
import { OFFICER_ROLE } from '../../../defs/officer';
import { POINT_DEFENSE_BEAM_BAND, type PointDefenseBeamBand } from '../../../defs/point_defense';
import { COMBAT_PROJECTILE_KIND, COMBAT_TARGET_KIND } from '../../model/combat';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type EncounterOfficerCommandId,
    type OfficerCommandDef,
} from '../../model/command';
import type { OfficerCommandHandler } from '../../model/officer_command_handler';
import { createWeaponsPointDefenseTask } from '../../officer_tasks/create_officer_task_draft';
import { requireThreatTargetId } from './command_handler_helpers';

export const weaponsFireRedBeamCommandHandler = createWeaponsPointDefenseCommandHandler(
    ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,

    'RED BEAM',

    POINT_DEFENSE_BEAM_BAND.RED,
);

export const weaponsFireBlueBeamCommandHandler = createWeaponsPointDefenseCommandHandler(
    ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_BLUE_BEAM,

    'BLUE BEAM',

    POINT_DEFENSE_BEAM_BAND.BLUE,
);

function createWeaponsPointDefenseCommandHandler(
    commandId: EncounterOfficerCommandId,
    label: string,

    pointDefenseBeamBand: PointDefenseBeamBand,
): OfficerCommandHandler {
    const def = {
        role: OFFICER_ROLE.WEAPONS,
        label,

        targeting: {
            kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
        },

        requiresIdleBridge: false,
    } satisfies OfficerCommandDef;

    return {
        commandId,
        def,

        getAvailableCommands(state) {
            if (state.combat.pointDefense.charges <= 0) {
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

                    const sourceActor = state.actors.find((actor) => {
                        return actor.id === projectile.sourceActorId;
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

            context.startOfficerTask(createWeaponsPointDefenseTask(commandId, threatId, pointDefenseBeamBand));
        },
    };
}
