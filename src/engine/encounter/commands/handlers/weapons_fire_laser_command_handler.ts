// src/engine/encounter/commands/handlers/weapons_fire_laser_command_handler.ts

import {
    ENCOUNTER_TEAM,
} from '../../../defs/encounter_team';
import {
    LASER_TARGET_ZONES,
    type LaserTargetZone,
} from '../../../defs/laser';
import {
    OFFICER_ROLE,
} from '../../../defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../defs/player_location';
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
import type {
    EncounterState,
} from '../../model/state';
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
                .ACTOR_LASER_ZONE,
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

            const readyLasers =
                state.combat.playerWeapons
                    .filter(isReadyLaser);

            return readyLasers.flatMap(
                (weapon) => {
                    return LASER_TARGET_ZONES.map(
                        (targetZone) => {
                            return {
                                commandId:
                                    ENCOUNTER_OFFICER_COMMAND_ID
                                        .WEAPONS_FIRE_LASER,

                                label:
                                    getCommandLabel(
                                        targetZone,
                                    ),

                                target: {
                                    kind:
                                        OFFICER_COMMAND_TARGET_KIND
                                            .ACTOR_LASER_ZONE,

                                    weaponId:
                                        weapon.id,

                                    actorId:
                                        targetActor.id,

                                    targetZone,
                                },

                                targetLabel:
                                    targetActor
                                        .displayName,
                            };
                        },
                    );
                },
            );
        },

        execute(context, input) {
            if (
                input.target.kind !==
                OFFICER_COMMAND_TARGET_KIND
                    .ACTOR_LASER_ZONE
            ) {
                throw new Error(
                    'FIRE LASER requires ' +
                        'an actor laser-zone target',
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
                    input.target.targetZone,
                ),
            );
        },
    };

function findCurrentEnemyShip(
    state: EncounterState,
) {
    const navigation = state.navigation;

    if (
        navigation.kind !==
        PLAYER_SPACE_NAVIGATION_KIND
            .ANCHORED
    ) {
        return undefined;
    }

    return state.actors.find((actor) => {
        return (
            actor.team ===
                ENCOUNTER_TEAM.ENEMY &&
            actor.anchorId ===
                navigation.anchorId
        );
    });
}

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

function getCommandLabel(
    targetZone: LaserTargetZone,
): string {
    return (
        'FIRE LASER: ' +
        targetZone.toUpperCase()
    );
}
