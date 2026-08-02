// src/engine/encounter/commands/handlers/weapons_fire_sticky_mines_command_handler.ts

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
    type ShipWeaponState,
    type StickyMineDispenserState,
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
    createWeaponsFireStickyMinesTask,
} from '../../officer_tasks/create_officer_task_draft';

const def = {
    availableToRoles: [
        OFFICER_ROLE.WEAPONS,
    ],

    label: 'FIRE MINES',

    targeting: {
        kind:
            OFFICER_COMMAND_TARGET_KIND
                .ACTOR,
    },

    requiresOnlineDrive: false,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const weaponsFireStickyMinesCommandHandler:
    OfficerCommandHandler = {
        commandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_STICKY_MINES,

        def,

        getAvailableCommands(state) {
            const targetActor =
                findCurrentEnemyShip(state);

            const dispenser =
                findReadyStickyMineDispenser(
                    state,
                );

            if (
                !targetActor ||
                !dispenser
            ) {
                return [];
            }

            return [
                {
                    commandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_STICKY_MINES,

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
                    'FIRE MINES requires ' +
                        'an actor target',
                );
            }

            const dispenser =
                findReadyStickyMineDispenser(
                    context.stateStore
                        .getState(),
                );

            if (!dispenser) {
                throw new Error(
                    'FIRE MINES executed ' +
                        'without a ready dispenser',
                );
            }

            context.stateStore
                .startPlayerStickyMineDispensing(
                    dispenser.id,
                );

            context.startOfficerTask(
                createWeaponsFireStickyMinesTask(
                    dispenser.id,
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

function findReadyStickyMineDispenser(
    state: EncounterState,
): StickyMineDispenserState | undefined {
    return state.combat
        .playerWeapons
        .find(
            isReadyStickyMineDispenser,
        );
}

function isReadyStickyMineDispenser(
    weapon: ShipWeaponState,
): weapon is StickyMineDispenserState {
    return (
        weapon.kind ===
            SHIP_WEAPON_KIND
                .STICKY_MINE_DISPENSER &&
        weapon.phase ===
            SHIP_WEAPON_PHASE.READY &&
        weapon.loadedMineId !== null &&
        weapon.ammoCount > 0
    );
}
