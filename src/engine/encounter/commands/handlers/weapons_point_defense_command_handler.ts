// src/engine/encounter/commands/handlers/weapons_point_defense_command_handler.ts

import { ENCOUNTER_TEAM } from '../../../defs/encounter_team';
import { OFFICER_ROLE } from '../../../defs/officer';
import { POINT_DEFENSE_BEAM_BAND, type PointDefenseBeamBand } from '../../../defs/point_defense';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from '../../model/combat';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type WeaponsPointDefenseCommandId,
    type OfficerCommandDef,
} from '../../model/command';
import { ENCOUNTER_EVENT } from '../../model/event';
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
    commandId: WeaponsPointDefenseCommandId,
    label: string,

    pointDefenseBeamBand: PointDefenseBeamBand,
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
            const defenseCapacitor =
                state.combat
                    .defenseCapacitor;

            if (
                !defenseCapacitor ||
                defenseCapacitor.charges <= 0
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

            const defenseCapacitor =
                context.stateStore
                    .spendDefenseCapacitorCharge();

            context.emit({
                type:
                    ENCOUNTER_EVENT
                        .PLAYER_POINT_DEFENSE_CHARGE_SPENT,

                remainingCharges:
                    defenseCapacitor
                        .charges,
            });

            context.startOfficerTask(createWeaponsPointDefenseTask(commandId, threatId, pointDefenseBeamBand));
        },
    };
}
