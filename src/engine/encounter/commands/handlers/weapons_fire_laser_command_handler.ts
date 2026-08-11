// src/engine/encounter/commands/handlers/weapons_fire_laser_command_handler.ts

import {
    OFFICER_ROLE,
} from '../../../defs/officer';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type LaserWeaponState,
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
    createWeaponsFireLaserTask,
} from '../../officer_tasks/create_officer_task_draft';

const def = {
    availableToRoles: [
        OFFICER_ROLE.WEAPONS,
    ],

    label: 'FIRE LASER',

    targeting: {
        kind:
            OFFICER_COMMAND_TARGET_KIND
                .ACTOR_WEAPON,
    },

    requiresOnlineDrive: false,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const weaponsFireLaserCommandHandler:
    OfficerCommandHandler = {
        commandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_LASER,

        def,

        getAvailableCommands(state) {
            const targetActor =
                findCurrentEnemyShip(state);

            if (!targetActor) {
                return [];
            }

            return state.combat
                .playerWeapons
                .filter(isReadyLaser)
                .map((weapon) => {
                    return {
                        commandId:
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .WEAPONS_FIRE_LASER,

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
                    'FIRE LASER requires ' +
                        'an actor weapon target',
                );
            }

            context.stateStore
                .startPlayerLaserTargeting(
                    input.target.weaponId,
                );

            context.startOfficerTask(
                createWeaponsFireLaserTask(
                    input.target.weaponId,
                    input.target.actorId,
                ),
            );
        },
    };

function isReadyLaser(
    weapon: ShipWeaponState,
): weapon is LaserWeaponState {
    return (
        weapon.kind ===
            SHIP_WEAPON_KIND.LASER &&
        weapon.phase ===
            SHIP_WEAPON_PHASE.READY
    );
}
