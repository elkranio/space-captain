// src/engine/encounter/commands/handlers/weapons_fire_missile_command_handler.ts

import {
    ENCOUNTER_TEAM,
} from '../../../defs/encounter_team';
import {
    OFFICER_ROLE,
} from '../../../defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../defs/player_location';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type MissileLauncherState,
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
    createWeaponsFireMissileTask,
} from '../../officer_tasks/create_officer_task_draft';

const def = {
    availableToRoles: [
        OFFICER_ROLE.WEAPONS,
    ],

    label: 'FIRE MISSILE',

    targeting: {
        kind:
            OFFICER_COMMAND_TARGET_KIND
                .ACTOR,
    },

    requiresOnlineDrive: false,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const weaponsFireMissileCommandHandler:
    OfficerCommandHandler = {
        commandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_MISSILE,

        def,

        getAvailableCommands(state) {
            const targetActor =
                findCurrentEnemyShip(state);

            const launcher =
                findReadyMissileLauncher(
                    state,
                );

            if (
                !targetActor ||
                !launcher
            ) {
                return [];
            }

            return [
                {
                    commandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_MISSILE,

                    label: def.label,

                    target: {
                        kind:
                            OFFICER_COMMAND_TARGET_KIND
                                .ACTOR,

                        actorId:
                            targetActor.id,
                    },

                    targetLabel:
                        targetActor
                            .displayName,
                },
            ];
        },

        execute(context, input) {
            if (
                input.target.kind !==
                OFFICER_COMMAND_TARGET_KIND
                    .ACTOR
            ) {
                throw new Error(
                    'FIRE MISSILE requires ' +
                        'an actor target',
                );
            }

            const launcher =
                findReadyMissileLauncher(
                    context.stateStore
                        .getState(),
                );

            if (!launcher) {
                throw new Error(
                    'FIRE MISSILE executed ' +
                        'without a ready launcher',
                );
            }

            context.stateStore
                .startPlayerMissileTargeting(
                    launcher.id,
                );

            context.startOfficerTask(
                createWeaponsFireMissileTask(
                    launcher.id,
                    input.target.actorId,
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
            actor.hull > 0 &&
            actor.anchorId ===
                navigation.anchorId
        );
    });
}

function findReadyMissileLauncher(
    state: EncounterState,
): MissileLauncherState | undefined {
    return state.combat
        .playerWeapons
        .find(
            isReadyMissileLauncher,
        );
}

function isReadyMissileLauncher(
    weapon: ShipWeaponState,
): weapon is MissileLauncherState {
    return (
        weapon.kind ===
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER &&
        weapon.phase ===
            SHIP_WEAPON_PHASE.READY &&
        weapon.loadedMissileId !== null &&
        weapon.ammoCount > 0
    );
}
