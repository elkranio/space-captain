// src/engine/encounter/commands/handlers/weapons_fire_beam_cannon_command_handler.ts

import {
    OFFICER_ROLE,
} from '../../../defs/officer';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type BeamCannonState,
    type ShipWeaponState,
} from '../../../defs/ship_weapon';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type OfficerCommandDef,
} from '../../model/command';
import type {
    OfficerCommandHandler,
} from '../../model/officer_command_handler';
import {
    findCurrentEnemyShip,
} from '../queries/find_current_enemy_ship';
import {
    createWeaponsFireBeamCannonTask,
} from '../../officer_tasks/create_officer_task_draft';

const def = {
    availableToRoles: [
        OFFICER_ROLE.WEAPONS,
    ],

    label: 'FIRE BEAM CANNON',

    targeting: {
        kind:
            OFFICER_COMMAND_TARGET_KIND
                .ACTOR_WEAPON,
    },

    requiresOnlineDrive: false,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const weaponsFireBeamCannonCommandHandler:
    OfficerCommandHandler = {
        commandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_BEAM_CANNON,

        def,

        getAvailableCommands(state) {
            const targetActor =
                findCurrentEnemyShip(state);

            if (!targetActor) {
                return [];
            }

            return state.combat
                .playerWeapons
                .filter(isReadyBeamCannon)
                .map((weapon) => {
                    return {
                        commandId:
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .WEAPONS_FIRE_BEAM_CANNON,

                        label:
                            def.label,

                        target: {
                            kind:
                                OFFICER_COMMAND_TARGET_KIND
                                    .ACTOR_WEAPON,

                            weaponId:
                                weapon.id,

                            actorId:
                                targetActor.id,
                        },

                        targetLabel:
                            targetActor
                                .displayName,
                    };
                });
        },

        execute(context, input) {
            if (
                input.target.kind !==
                OFFICER_COMMAND_TARGET_KIND
                    .ACTOR_WEAPON
            ) {
                throw new Error(
                    'FIRE BEAM CANNON requires ' +
                        'an actor weapon target',
                );
            }

            context.stateStore
                .startPlayerBeamCannonTargeting(
                    input.target.weaponId,
                );

            context.startOfficerTask(
                createWeaponsFireBeamCannonTask(
                    input.target.weaponId,
                    input.target.actorId,
                ),
            );
        },
    };

function isReadyBeamCannon(
    weapon: ShipWeaponState,
): weapon is BeamCannonState {
    return (
        weapon.kind ===
            SHIP_WEAPON_KIND.BEAM_CANNON &&
        weapon.phase ===
            SHIP_WEAPON_PHASE.READY
    );
}
